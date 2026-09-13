const BASE_URL = 'https://web-online-wbn5.onrender.com/api';

// Helper gọi API chung
async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Lỗi không xác định từ server');
  }
  return json.data !== undefined ? json.data : json;
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
  return apiFetch(`/courses?${query.toString()}`);
}

export async function fetchCourseById(courseId) {
  return apiFetch(`/courses/${courseId}`);
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
  // quizData: { title, questions: [{question, options, answer}] }
  return apiFetch(`/courses/${courseId}/chapters/${chapterId}/quiz`, {
    method: 'POST',
    body: JSON.stringify(quizData)
  });
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
  return apiFetch(`/courses/${courseId}/enroll`, {
    method: 'POST',
    body: JSON.stringify({ student_ids: studentIds })
  });
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
