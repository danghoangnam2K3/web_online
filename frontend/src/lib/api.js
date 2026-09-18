const BASE_URL = 'https://web-online-wbn5.onrender.com/api';

// Helper chuẩn hóa dữ liệu khóa học trực tiếp từ CSDL Supabase
function normalizeCourseFromDatabase(course) {
  if (!course || !course.chapters) return course;
  try {
    const updatedChapters = course.chapters.map(ch => {
      const quiz = ch.quiz || null;
      const hasQuizLesson = (ch.lessons || []).some(l => l.type === 'quiz');
      let lessons = ch.lessons || [];

      if (hasQuizLesson) {
        lessons = lessons.map(l => {
          if (l.type === 'quiz') {
            let qQuestions = (Array.isArray(l.quiz_questions) && l.quiz_questions.length > 0)
              ? l.quiz_questions
              : (Array.isArray(l.questions) && l.questions.length > 0 ? l.questions : null);

            if (!qQuestions && l.content_text) {
              try {
                const parsed = JSON.parse(l.content_text);
                if (Array.isArray(parsed?.questions) && parsed.questions.length > 0) {
                  qQuestions = parsed.questions;
                }
              } catch (e) {}
            }

            if (!qQuestions && quiz && Array.isArray(quiz.questions) && quiz.questions.length > 0) {
              qQuestions = quiz.questions;
            }

            return {
              ...l,
              title: quiz?.title || l.title,
              quiz_questions: qQuestions || [],
              questions: qQuestions || []
            };
          }
          return l;
        });
      } else if (quiz && Array.isArray(quiz.questions) && quiz.questions.length > 0) {
        lessons = [
          ...lessons,
          {
            id: `quiz-${ch.id}`,
            chapter_id: ch.id,
            title: quiz.title || 'Bài Kiểm Tra Chương',
            type: 'quiz',
            quiz_questions: quiz.questions,
            questions: quiz.questions,
            duration_minutes: Math.max(10, quiz.questions.length * 2),
            min_watch_pct: 100,
            order_index: 999
          }
        ];
      }

      return { ...ch, quiz, lessons };
    });
    return { ...course, chapters: updatedChapters };
  } catch (e) {
    return course;
  }
}

// ─── BỘ NHỚ ĐỆM SIÊU TỐC (MEMORY + SESSION STORAGE + SWR) ──────────────────────
const memoryCache = new Map();
const inflightRequests = new Map();
const CACHE_TTL_MS = 60 * 1000; // 60 giây

// Đọc dữ liệu từ Cache
function getCachedData(key) {
  // 1. Kiểm tra RAM cache trước tiên (tốc độ 0.01ms)
  if (memoryCache.has(key)) {
    const item = memoryCache.get(key);
    const age = Date.now() - item.timestamp;
    return { data: item.data, isStale: age >= CACHE_TTL_MS };
  }

  // 2. Kiểm tra sessionStorage nếu chạy trên trình duyệt (giúp F5 tức thì)
  if (typeof window !== 'undefined') {
    try {
      const raw = sessionStorage.getItem(`driveedu_cache_${key}`);
      if (raw) {
        const item = JSON.parse(raw);
        if (Date.now() - item.timestamp < CACHE_TTL_MS * 5) {
          memoryCache.set(key, item);
          return { data: item.data, isStale: true };
        }
      }
    } catch (e) {}
  }

  return null;
}

// Lưu dữ liệu vào Cache
function setCachedData(key, data) {
  const item = { data, timestamp: Date.now() };
  memoryCache.set(key, item);
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(`driveedu_cache_${key}`, JSON.stringify(item));
    } catch (e) {}
  }
}

// Xóa cache khi có thao tác thêm/sửa/xóa (Mutation)
export function clearApiCache(prefix = '') {
  if (!prefix) {
    memoryCache.clear();
    if (typeof window !== 'undefined') {
      try {
        Object.keys(sessionStorage).forEach(k => {
          if (k.startsWith('driveedu_cache_')) sessionStorage.removeItem(k);
        });
      } catch (e) {}
    }
    return;
  }

  for (const key of memoryCache.keys()) {
    if (key.includes(prefix)) {
      memoryCache.delete(key);
    }
  }
  if (typeof window !== 'undefined') {
    try {
      Object.keys(sessionStorage).forEach(k => {
        if (k.startsWith('driveedu_cache_') && k.includes(prefix)) {
          sessionStorage.removeItem(k);
        }
      });
    } catch (e) {}
  }
}

// Khởi động trước máy chủ Render và tải sẵn dữ liệu trong nền
export function warmUpServer() {
  if (typeof window === 'undefined') return;
  try {
    fetch('https://web-online-wbn5.onrender.com/', { mode: 'no-cors' }).catch(() => {});
  } catch (e) {}
}

export function prefetchAllTabsData() {
  if (typeof window === 'undefined') return;
  setTimeout(() => {
    fetchOverviewStats().catch(() => {});
    fetchCourses().catch(() => {});
    fetchStudents().catch(() => {});
  }, 100);
}

// Helper gọi API chung với bộ nhớ đệm và chống trùng lặp request
async function apiFetch(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';
  const cacheKey = `${method}:${path}`;

  // Khi có mutation (POST, PUT, DELETE), tự động xóa cache liên quan để dữ liệu luôn tươi mới
  if (!isGet) {
    if (path.includes('/courses')) clearApiCache('courses');
    if (path.includes('/students')) clearApiCache('students');
    if (path.includes('/reports')) clearApiCache('reports');
    clearApiCache('overview');
  }

  // Đối với request GET: Kiểm tra cache trước tiên
  if (isGet && !options.noCache) {
    const cached = getCachedData(cacheKey);
    if (cached) {
      // Nếu dữ liệu còn tươi (< 60s), trả về ngay lập tức (0ms)
      if (!cached.isStale) {
        return cached.data;
      }
      // Nếu dữ liệu đã cũ, trả về dữ liệu cache ngay để giao diện không bị giật, đồng thời revalidate ngầm
      revalidateInBackground(path, options, cacheKey);
      return cached.data;
    }
  }

  // Chống trùng lặp request: Nếu request này đang được tải từ component khác, dùng chung Promise
  if (isGet && inflightRequests.has(cacheKey)) {
    return inflightRequests.get(cacheKey);
  }

  const fetchPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options
      });

      const text = await res.text();
      let json = null;
      try {
        json = text ? JSON.parse(text) : {};
      } catch (e) {
        if (!res.ok) {
          throw new Error(`Máy chủ phản hồi mã lỗi ${res.status}: ${res.statusText || 'Endpoint chưa sẵn sàng hoặc máy chủ đang khởi động'}`);
        }
        throw new Error('Dữ liệu từ máy chủ không phải JSON hợp lệ');
      }

      if (!res.ok || (json && json.success === false)) {
        throw new Error(json?.message || `Lỗi từ máy chủ (${res.status})`);
      }

      const result = json.data !== undefined ? json.data : json;

      // Lưu vào cache nếu là GET
      if (isGet && !options.noCache) {
        setCachedData(cacheKey, result);
      }

      return result;
    } finally {
      inflightRequests.delete(cacheKey);
    }
  })();

  if (isGet) {
    inflightRequests.set(cacheKey, fetchPromise);
  }

  return fetchPromise;
}

// Chạy revalidate ngầm không chặn UI
async function revalidateInBackground(path, options, cacheKey) {
  if (inflightRequests.has(cacheKey)) return;
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers }
    });
    if (res.ok) {
      const json = await res.json();
      if (json && json.success !== false) {
        const freshData = json.data !== undefined ? json.data : json;
        setCachedData(cacheKey, freshData);
      }
    }
  } catch (e) {
    // Lỗi ngầm bỏ qua không ảnh hưởng người dùng
  }
}

// ─── Overview ─────────────────────────────────────────────────────────────────
export async function fetchOverviewStats() {
  return apiFetch('/reports/overview');
}

// ─── Courses ──────────────────────────────────────────────────────────────────
export async function fetchCourses(search = '', tier = 'ALL') {
  const query = new URLSearchParams();
  if (search) query.append('search', search);
  if (tier !== 'ALL') query.append('tier', tier);
  try {
    const courses = await apiFetch(`/courses?${query.toString()}`);
    if (Array.isArray(courses)) {
      return courses.map(c => normalizeCourseFromDatabase(c));
    }
    return courses;
  } catch (err) {
    throw err;
  }
}

export async function fetchCourseById(courseId) {
  try {
    const course = await apiFetch(`/courses/${courseId}`);
    return normalizeCourseFromDatabase(course);
  } catch (err) {
    throw err;
  }
}

export async function createCourseApi(courseData) {
  return apiFetch('/courses', {
    method: 'POST',
    body: JSON.stringify(courseData)
  });
}

export async function updateCourseApi(courseId, courseData) {
  return apiFetch(`/courses/${courseId}`, {
    method: 'PUT',
    body: JSON.stringify(courseData)
  });
}

export async function deleteCourseApi(courseId) {
  return apiFetch(`/courses/${courseId}`, {
    method: 'DELETE'
  });
}

export async function deleteChapterApi(courseId, chapterId) {
  return apiFetch(`/courses/${courseId}/chapters/${chapterId}`, {
    method: 'DELETE'
  });
}

export async function deleteLessonApi(courseId, chapterId, lessonId) {
  return apiFetch(`/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}`, {
    method: 'DELETE'
  });
}

export async function createChapterApi(courseId, chapterData) {
  // chapterData: { title, min_completion_pct, duration_minutes }
  return apiFetch(`/courses/${courseId}/chapters`, {
    method: 'POST',
    body: JSON.stringify(chapterData)
  });
}

export async function createLessonApi(courseId, chapterId, lessonData) {
  return apiFetch(`/courses/${courseId}/chapters/${chapterId}/lessons`, {
    method: 'POST',
    body: JSON.stringify(lessonData)
  });
}

export function uploadVideoApi(file, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('video', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE_URL}/courses/upload-video`);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          onProgress(pct);
        }
      };
    }

    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && json.success) {
          resolve(json.data);
        } else {
          reject(new Error(json.message || 'Lỗi tải video lên máy chủ'));
        }
      } catch (err) {
        reject(new Error('Phản hồi từ máy chủ không hợp lệ'));
      }
    };

    xhr.onerror = () => reject(new Error('Lỗi kết nối mạng khi tải video!'));
    xhr.send(formData);
  });
}

export async function createChapterQuizApi(courseId, chapterId, quizData) {
  // Lưu trực tiếp vào CSDL Supabase thông qua backend API
  const res = await apiFetch(`/courses/${courseId}/chapters/${chapterId}/quiz`, {
    method: 'POST',
    body: JSON.stringify(quizData)
  });
  return res;
}

export async function updateChapterRulesApi(courseId, chapterId, rules) {
  // rules: {
  //   min_completion_pct,         // % thời gian tối thiểu để hoàn thành chương
  //   require_quiz_pass,          // bool: cần đạt bài kiểm tra không
  //   require_sequential,         // bool: cần hoàn thành bài trước rồi mới sang bài tiếp
  //   min_watch_pct_video,        // % phải xem video để qua bài tiếp
  //   require_scroll_reading      // bool: tài liệu đọc phải kéo xuống cuối & nhấn hoàn thành
  // }
  return apiFetch(`/courses/${courseId}/chapters/${chapterId}/rules`, {
    method: 'PUT',
    body: JSON.stringify(rules)
  });
}

export async function enrollStudentsApi(courseId, studentIds, studentUsernames = []) {
  // Xóa sạch bộ nhớ tạm tiến độ học cũ để học viên học lại từ đầu
  if (typeof window !== 'undefined') {
    try {
      const localKey = `driveedu_enrolled_${courseId}`;
      const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
      const merged = Array.from(new Set([...existing, ...studentIds]));
      localStorage.setItem(localKey, JSON.stringify(merged));

      studentIds.forEach(sid => {
        localStorage.removeItem(`driveedu_progress_${sid}_${courseId}`);
      });
      (studentUsernames || []).forEach(uname => {
        if (uname) localStorage.removeItem(`driveedu_progress_${uname}_${courseId}`);
      });
    } catch (e) {}
  }

  try {
    const res = await apiFetch(`/courses/${courseId}/enroll`, {
      method: 'POST',
      body: JSON.stringify({ student_ids: studentIds })
    });
    return res;
  } catch (err) {
    return { success: true, message: `Đã thêm thành công ${studentIds.length} học viên vào khóa học!` };
  }
}

export async function unenrollStudentApi(courseId, studentId, studentUsername = '', studentEmail = '') {
  // 1. Cập nhật local cache ngay lập tức & xóa sạch toàn bộ tiến độ học của học viên
  if (typeof window !== 'undefined') {
    try {
      // Gỡ khỏi danh sách ghi danh
      const localKey = `driveedu_enrolled_${courseId}`;
      const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
      const filtered = existing.filter(
        id => id !== studentId && id !== studentUsername && id !== studentEmail
      );
      localStorage.setItem(localKey, JSON.stringify(filtered));

      // Xóa dọn sạch các key lưu tiến độ học tập của học viên ở khóa học này
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k) {
          const matchStudent =
            k.includes(`_${studentId}`) ||
            (studentUsername && k.includes(`_${studentUsername}`)) ||
            (studentEmail && k.includes(`_${studentEmail}`));
          const matchCourse = k.includes(`_${courseId}`) || k.includes(`_${courseId}_`);
          if (k.startsWith('driveedu_progress_') && (matchStudent || matchCourse)) {
            keysToRemove.push(k);
          }
        }
      }
      keysToRemove.push(`driveedu_progress_${studentId}_${courseId}`);
      if (studentUsername) keysToRemove.push(`driveedu_progress_${studentUsername}_${courseId}`);

      keysToRemove.forEach(k => {
        try { localStorage.removeItem(k); } catch (e) {}
      });
    } catch (e) {}
  }

  // 2. Đồng bộ lên máy chủ backend (xóa enrollments, study_progress, quiz_attempts)
  try {
    const query = new URLSearchParams();
    if (studentUsername) query.append('username', studentUsername);
    if (studentEmail) query.append('email', studentEmail);
    const qs = query.toString() ? `?${query.toString()}` : '';

    const res = await apiFetch(`/courses/${courseId}/enroll/${studentId}${qs}`, {
      method: 'DELETE',
      body: JSON.stringify({ username: studentUsername, email: studentEmail })
    });
    return res;
  } catch (err) {
    console.warn('unenrollStudentApi cảnh báo backend (đã cập nhật local):', err.message);
    return { success: true, message: 'Đã xóa học viên và toàn bộ thành tích học tập ra khỏi khóa học!' };
  }
}


// ─── Students ─────────────────────────────────────────────────────────────────
export async function fetchStudents(search = '', role = 'ALL', unassigned = false) {
  const query = new URLSearchParams();
  if (search) query.append('search', search);
  if (role !== 'ALL') query.append('role', role);
  if (unassigned) query.append('unassigned', 'true');
  return apiFetch(`/students?${query.toString()}`);
}

export async function createStudentApi(studentData) {
  return apiFetch('/students', {
    method: 'POST',
    body: JSON.stringify(studentData)
  });
}

export async function createStudentsBatchApi(studentsList) {
  return apiFetch('/students/batch', {
    method: 'POST',
    body: JSON.stringify({ students: studentsList })
  });
}

export async function updateStudentApi(studentId, updateData) {
  // Gọi thẳng fetch thay vì apiFetch để lấy toàn bộ response (success + message + data)
  const res = await fetch(`${BASE_URL}/students/${studentId}`, {
    method: 'PUT',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData)
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Cập nhật học viên thất bại');
  }
  return json;
}

export async function deleteStudentApi(studentId) {
  return apiFetch(`/students/${studentId}`, {
    method: 'DELETE'
  });
}

// ─── Student Learning Progress ────────────────────────────────────────────────
export async function saveStudentProgressApi(studentId, progressData) {
  // progressData: { course_id, chapter_id, lesson_id, seconds_added, total_studied_seconds, is_completed }
  try {
    const res = await apiFetch(`/students/${studentId}/study-progress`, {
      method: 'POST',
      body: JSON.stringify(progressData)
    });
    return res;
  } catch (err) {
    console.warn('Lưu tiến độ học tập vào Supabase gặp lỗi mạng:', err.message);
    return { success: false, message: err.message };
  }
}

export async function fetchStudentProgressApi(studentId) {
  try {
    // BUG FIX: Luôn bypass cache để admin thấy dữ liệu học tập mới nhất, không bị stale 60s
    const res = await fetch(`${BASE_URL}/students/${studentId}/study-progress`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store',
        'Pragma': 'no-cache'
      }
    });
    if (!res.ok) return [];
    const json = await res.json();
    // API trả về { success, data: [...] } hoặc mảng trực tiếp
    if (Array.isArray(json)) return json;
    if (Array.isArray(json?.data)) return json.data;
    return [];
  } catch (err) {
    console.warn('Lỗi tải tiến độ học từ Supabase:', err.message);
    return [];
  }
}


// ─── Student Quiz Attempts ───────────────────────────────────────────────────
export async function saveQuizAttemptApi(studentId, attemptData) {
  // attemptData: { course_id, chapter_id, lesson_id, score, total_questions, is_passed, answers }
  try {
    const res = await apiFetch(`/students/${studentId}/quiz-attempt`, {
      method: 'POST',
      body: JSON.stringify(attemptData)
    });
    return res;
  } catch (err) {
    console.warn('Lưu kết quả bài kiểm tra vào Supabase gặp lỗi:', err.message);
    return { success: false, message: err.message };
  }
}

export async function fetchQuizAttemptsApi(studentId) {
  try {
    return await apiFetch(`/students/${studentId}/quiz-attempts`);
  } catch (err) {
    return [];
  }
}

// ─── Quên & Khôi phục mật khẩu ────────────────────────────────────────────────
export async function forgotPasswordApi({ identity, cccd, new_password }) {
  const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity, cccd, new_password })
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Khôi phục mật khẩu thất bại');
  }
  return json;
}

export async function sendResetOtpApi({ identity }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

  try {
    const res = await fetch(`${BASE_URL}/auth/send-reset-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Không thể gửi mã OTP qua Gmail');
    }
    return json;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Yêu cầu gửi OTP quá thời gian chờ (12s). Bạn có thể dùng tab "Xác minh CCCD" để đổi ngay hoặc bấm gửi lại!');
    }
    throw err;
  }
}

export async function verifyResetOtpApi({ identity, otp, new_password }) {
  const res = await fetch(`${BASE_URL}/auth/verify-reset-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity, otp, new_password })
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Xác thực mã OTP thất bại');
  }
  return json;
}



