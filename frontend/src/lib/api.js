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
  return json.data;
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

export async function createCourseApi(courseData) {
  return apiFetch('/courses', {
    method: 'POST',
    body: JSON.stringify(courseData)
  });
}

export async function createChapterApi(courseId, chapterTitle, minPct = 80) {
  return apiFetch(`/courses/${courseId}/chapters`, {
    method: 'POST',
    body: JSON.stringify({ title: chapterTitle, min_completion_pct: minPct })
  });
}

export async function createLessonApi(courseId, chapterId, lessonData) {
  return apiFetch(`/courses/${courseId}/chapters/${chapterId}/lessons`, {
    method: 'POST',
    body: JSON.stringify(lessonData)
  });
}

export async function updateChapterRulesApi(courseId, chapterId, min_completion_pct, min_watch_pct_default) {
  return apiFetch(`/courses/${courseId}/chapters/${chapterId}/rules`, {
    method: 'PUT',
    body: JSON.stringify({ min_completion_pct, min_watch_pct_default })
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
  return apiFetch(`/students/${studentId}`, {
    method: 'PUT',
    body: JSON.stringify(updateData)
  });
}

export async function deleteStudentApi(studentId) {
  return apiFetch(`/students/${studentId}`, {
    method: 'DELETE'
  });
}
