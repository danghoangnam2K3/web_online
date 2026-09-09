import { initialCoursesData, initialStudentsData } from './mockData';

const BASE_URL = 'http://localhost:5000/api';

// Cache trong bộ nhớ frontend nếu backend không phản hồi
let localCourses = [...initialCoursesData];
let localStudents = [...initialStudentsData];

export async function fetchOverviewStats() {
  try {
    const res = await fetch(`${BASE_URL}/reports/overview`, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (err) {
    console.warn('Backend chưa bật, dùng mock data overview');
  }

  // Fallback
  return {
    totalCourses: localCourses.length,
    totalStudents: localStudents.length,
    activeStudents: localStudents.filter(s => s.status === 'active').length,
    passRatePct: 94.5,
    totalHoursLearned: 1420,
    topCourses: localCourses.map(c => ({
      id: c.id,
      name: c.name,
      tier: c.license_tier,
      studentsCount: c.enrolled_student_ids ? c.enrolled_student_ids.length + 15 : 20,
      completionPct: 88,
      rating: 4.9
    })),
    topStudents: localStudents.slice(0, 5).map((s, idx) => ({
      id: s.id,
      full_name: s.full_name,
      avatar_url: s.avatar_url,
      course_name: s.course_name,
      progress: s.progress || 80,
      quizScore: 35 - idx
    })),
    monthlyStats: [
      { month: 'Tháng 9/2025', count: 32 },
      { month: 'Tháng 10/2025', count: 45 },
      { month: 'Tháng 11/2025', count: 50 },
      { month: 'Tháng 12/2025', count: 68 },
      { month: 'Tháng 1/2026', count: 85 },
      { month: 'Tháng 2/2026', count: 110 }
    ]
  };
}

export async function fetchCourses(search = '', tier = 'ALL') {
  try {
    const query = new URLSearchParams();
    if (search) query.append('search', search);
    if (tier !== 'ALL') query.append('tier', tier);

    const res = await fetch(`${BASE_URL}/courses?${query.toString()}`, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (err) {
    console.warn('Backend offline, dùng local state course');
  }

  let list = [...localCourses];
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
  }
  if (tier && tier !== 'ALL') {
    list = list.filter(c => c.license_tier === tier);
  }
  return list;
}

export async function createCourseApi(courseData) {
  try {
    const res = await fetch(`${BASE_URL}/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(courseData)
    });
    if (res.ok) {
      const json = await res.json();
      return json;
    }
  } catch (err) {
    console.warn('Backend offline, lưu course vào local storage state');
  }

  const newCourse = {
    id: 'c_' + Date.now(),
    ...courseData,
    status: 'active',
    created_at: new Date().toISOString(),
    chapters: [],
    enrolled_student_ids: []
  };
  localCourses.unshift(newCourse);
  return { success: true, message: 'Tạo khóa học thành công!', data: newCourse };
}

export async function createChapterApi(courseId, chapterTitle, minPct = 80) {
  try {
    const res = await fetch(`${BASE_URL}/courses/${courseId}/chapters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: chapterTitle, min_completion_pct: minPct })
    });
    if (res.ok) return await res.json();
  } catch (err) {}

  const course = localCourses.find(c => c.id === courseId);
  if (course) {
    const newCh = {
      id: 'ch_' + Date.now(),
      title: chapterTitle,
      order_index: course.chapters.length + 1,
      min_completion_pct: Number(minPct),
      lessons: []
    };
    course.chapters.push(newCh);
    return { success: true, data: newCh };
  }
}

export async function createLessonApi(courseId, chapterId, lessonData) {
  try {
    const res = await fetch(`${BASE_URL}/courses/${courseId}/chapters/${chapterId}/lessons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lessonData)
    });
    if (res.ok) return await res.json();
  } catch (err) {}

  const course = localCourses.find(c => c.id === courseId);
  if (course) {
    const ch = course.chapters.find(c => c.id === chapterId);
    if (ch) {
      const newL = {
        id: 'l_' + Date.now(),
        ...lessonData
      };
      ch.lessons.push(newL);
      return { success: true, data: newL };
    }
  }
}

export async function updateChapterRulesApi(courseId, chapterId, min_completion_pct, min_watch_pct_default) {
  try {
    const res = await fetch(`${BASE_URL}/courses/${courseId}/chapters/${chapterId}/rules`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ min_completion_pct, min_watch_pct_default })
    });
    if (res.ok) return await res.json();
  } catch (err) {}

  const course = localCourses.find(c => c.id === courseId);
  if (course) {
    const ch = course.chapters.find(c => c.id === chapterId);
    if (ch) {
      ch.min_completion_pct = Number(min_completion_pct);
      ch.lessons.forEach(l => l.min_watch_pct = Number(min_watch_pct_default));
      return { success: true, data: ch };
    }
  }
}

export async function enrollStudentsApi(courseId, studentIds) {
  try {
    const res = await fetch(`${BASE_URL}/courses/${courseId}/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_ids: studentIds })
    });
    if (res.ok) return await res.json();
  } catch (err) {}

  const course = localCourses.find(c => c.id === courseId);
  if (course) {
    studentIds.forEach(sid => {
      if (!course.enrolled_student_ids.includes(sid)) {
        course.enrolled_student_ids.push(sid);
      }
      const st = localStudents.find(s => s.id === sid);
      if (st) st.course_name = course.name;
    });
    return { success: true, message: `Đã thêm ${studentIds.length} học viên!` };
  }
}

export async function fetchStudents(search = '', role = 'ALL', unassigned = false) {
  try {
    const query = new URLSearchParams();
    if (search) query.append('search', search);
    if (role !== 'ALL') query.append('role', role);
    if (unassigned) query.append('unassigned', 'true');

    const res = await fetch(`${BASE_URL}/students?${query.toString()}`, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (err) {}

  let list = [...localStudents];
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(s => s.full_name.toLowerCase().includes(q) || s.username.toLowerCase().includes(q) || s.cccd.includes(q));
  }
  if (role && role !== 'ALL') {
    list = list.filter(s => s.role === role);
  }
  if (unassigned) {
    list = list.filter(s => s.course_name === 'Chưa xếp khóa');
  }
  return list;
}

export async function createStudentApi(studentData) {
  try {
    const res = await fetch(`${BASE_URL}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentData)
    });
    if (res.ok) return await res.json();
  } catch (err) {}

  const newStudent = {
    id: 'hv_' + Date.now(),
    ...studentData,
    status: 'active',
    created_at: new Date().toISOString(),
    course_name: 'Chưa xếp khóa',
    progress: 0
  };
  localStudents.unshift(newStudent);
  return { success: true, message: 'Tạo tài khoản học viên thành công!', data: newStudent };
}

export async function updateStudentApi(studentId, updateData) {
  try {
    const res = await fetch(`${BASE_URL}/students/${studentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    if (res.ok) return await res.json();
  } catch (err) {}

  const idx = localStudents.findIndex(s => s.id === studentId);
  if (idx !== -1) {
    localStudents[idx] = { ...localStudents[idx], ...updateData };
    return { success: true, message: 'Cập nhật thành công!', data: localStudents[idx] };
  }
}
