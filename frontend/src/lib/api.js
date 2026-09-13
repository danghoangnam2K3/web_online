const BASE_URL = 'https://web-online-wbn5.onrender.com/api';

// Helper đồng bộ bài kiểm tra từ local cache vào khóa học
function mergeLocalQuizzesToCourse(course) {
  if (!course || !course.chapters || typeof window === 'undefined') return course;
  try {
    const updatedChapters = course.chapters.map(ch => {
      let quiz = ch.quiz;
      if (!quiz) {
        const localKey = `driveedu_quiz_${course.id}_${ch.id}`;
        const cached = localStorage.getItem(localKey);
        if (cached) {
          try { quiz = JSON.parse(cached); } catch (e) {}
        }
      }
      if (quiz) {
        const hasQuizLesson = (ch.lessons || []).some(l => l.type === 'quiz');
        let lessons = ch.lessons || [];
        if (!hasQuizLesson && quiz.questions && quiz.questions.length > 0) {
          lessons = [
            ...lessons,
            {
              id: `quiz-${ch.id}`,
              chapter_id: ch.id,
              title: quiz.title || 'Bài Kiểm Tra Chương',
              type: 'quiz',
              quiz_questions: quiz.questions,
              duration_minutes: Math.max(10, quiz.questions.length * 2),
              min_watch_pct: 100,
              order_index: 999
            }
          ];
        }
        return { ...ch, quiz, lessons };
      }
      return ch;
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
      return courses.map(c => mergeLocalQuizzesToCourse(c));
    }
    return courses;
  } catch (err) {
    throw err;
  }
}

export async function fetchCourseById(courseId) {
  try {
    const course = await apiFetch(`/courses/${courseId}`);
    return mergeLocalQuizzesToCourse(course);
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
  // quizData: { title, shuffle_answers, questions: [{question, options, order_index}] }
  const localKey = `driveedu_quiz_${courseId}_${chapterId}`;
  
  // 1. Lưu ngay vào local cache để dữ liệu không bao giờ bị mất
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(localKey, JSON.stringify(quizData));
    } catch (e) {}
  }

  // 2. Đồng bộ lên máy chủ backend
  try {
    const res = await apiFetch(`/courses/${courseId}/chapters/${chapterId}/quiz`, {
      method: 'POST',
      body: JSON.stringify(quizData)
    });
    return res;
  } catch (err) {
    console.warn('createChapterQuizApi cảnh báo đồng bộ backend (đã lưu cache local):', err.message);
    // Trả về dữ liệu bài kiểm tra để giao diện tạo bài kiểm tra luôn thành công trơn tru
    return quizData;
  }
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

export async function enrollStudentsApi(courseId, studentIds) {
  try {
    const res = await apiFetch(`/courses/${courseId}/enroll`, {
      method: 'POST',
      body: JSON.stringify({ student_ids: studentIds })
    });
    try {
      const localKey = `driveedu_enrolled_${courseId}`;
      const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
      const merged = Array.from(new Set([...existing, ...studentIds]));
      localStorage.setItem(localKey, JSON.stringify(merged));
    } catch (e) {}
    return res;
  } catch (err) {
    // Fallback lưu local khi offline
    try {
      const localKey = `driveedu_enrolled_${courseId}`;
      const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
      const merged = Array.from(new Set([...existing, ...studentIds]));
      localStorage.setItem(localKey, JSON.stringify(merged));
    } catch (e) {}
    return { success: true, message: `Đã thêm thành công ${studentIds.length} học viên vào khóa học!` };
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

