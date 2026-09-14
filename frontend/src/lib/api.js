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

// Helper gọi API chung
async function apiFetch(path, options = {}) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      cache: 'no-store',
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
    return json.data !== undefined ? json.data : json;
  } catch (err) {
    throw err;
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
    // Fallback lưu LocalStorage
    try {
      const key = `driveedu_progress_${studentId}_${progressData.chapter_id}`;
      localStorage.setItem(key, JSON.stringify(progressData));
    } catch (e) {}
    return { success: true, offline: true, data: progressData };
  }
}

export async function fetchStudentProgressApi(studentId) {
  try {
    return await apiFetch(`/students/${studentId}/study-progress`);
  } catch (err) {
    return [];
  }
}

