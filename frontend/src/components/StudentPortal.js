'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/AuthContext';
import { fetchCourses, saveStudentProgressApi } from '../lib/api';
import { initialCoursesData, initialStudentsData } from '../lib/mockData';
import {
  BookOpen,
  User,
  CheckCircle2,
  Clock,
  Play,
  Pause,
  ChevronDown,
  ChevronRight,
  Video,
  FileText,
  HelpCircle,
  Award,
  ArrowLeft,
  Sparkles,
  Layers,
  GraduationCap,
  Calendar,
  Check,
  FastForward,
  LogOut,
  ShieldCheck,
  Zap,
  Phone,
  Mail,
  CreditCard,
  Lock,
  Save,
  AlertCircle,
  X
} from 'lucide-react';

const BASE_URL = 'https://web-online-wbn5.onrender.com/api';

// Chuyển đổi mọi định dạng link video sang embed hợp lệ
function getVideoEmbed(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const url = rawUrl.trim();

  // 1. Direct video file (.mp4, .webm, .ogg, .mov)
  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url)) {
    return { type: 'video', src: url };
  }

  // 2. YouTube
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'iframe',
      src: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`,
      originalUrl: url
    };
  }

  // 3. Google Drive
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (driveMatch && driveMatch[1]) {
    return {
      type: 'iframe',
      src: `https://drive.google.com/file/d/${driveMatch[1]}/preview`,
      originalUrl: url
    };
  }

  return { type: 'iframe', src: url, originalUrl: url };
}

// Định dạng giây thành mm:ss hoặc hh:mm:ss
function formatTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function StudentPortal({ onSwitchToAdmin }) {
  const router = useRouter();
  const { user, logout, updateProfile, changePassword } = useAuth();

  // ── 2 MỤC CHÍNH TRÊN THANH HEAD: 'courses' | 'account' ──────────────────────
  const [headTab, setHeadTab] = useState('courses');

  // Danh sách khóa học từ server hoặc mock
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Hồ sơ học viên đầy đủ (lấy từ backend hoặc mock)
  const [studentProfile, setStudentProfile] = useState(null);

  // Khóa học đang chọn để vào học
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Accordion: Lưu trạng thái mở/đóng của từng chương (chId: boolean)
  const [expandedChapters, setExpandedChapters] = useState({});

  // Bài giảng đang học: { chapterId, chapterTitle, lesson }
  const [currentLesson, setCurrentLesson] = useState(null);

  // Tiến độ học tập theo chương: { [chapterId]: { studiedSeconds: number, isCompleted: boolean } }
  const [chapterProgress, setChapterProgress] = useState({});

  // Đồng hồ tính giờ: đang chạy hay tạm dừng
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Modal chúc mừng hoàn thành chương
  const [completedChapterModal, setCompletedChapterModal] = useState(null);

  // Hiệu ứng pháo hoa Confetti Canvas
  const confettiCanvasRef = useRef(null);

  // State bài tập trắc nghiệm (quiz)
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(null);

  // State cập nhật tài khoản
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
    dob: '',
    cccd: '',
    email: '',
    change_pw: false,
    new_password: '',
    confirm_password: ''
  });
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [profileSaving, setProfileSaving] = useState(false);

  // 1. Tải danh sách khóa học và hồ sơ học viên
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const coursesData = await fetchCourses();
        if (coursesData && coursesData.length > 0) {
          setAllCourses(coursesData);
        } else {
          setAllCourses(initialCoursesData);
        }
      } catch (err) {
        console.warn('Dùng initialCoursesData offline:', err.message);
        setAllCourses(initialCoursesData);
      }

      // Lấy thông tin học viên chi tiết
      if (user?.email) {
        try {
          const res = await fetch(`${BASE_URL}/auth/me?email=${encodeURIComponent(user.email)}`);
          const json = await res.json();
          if (json.success && json.data) {
            setStudentProfile(json.data);
          } else {
            // Tìm trong initialStudentsData
            const found = initialStudentsData.find(s => s.email === user.email || s.username === user.username);
            setStudentProfile(found || user);
          }
        } catch (e) {
          const found = initialStudentsData.find(s => s.email === user.email || s.username === user.username);
          setStudentProfile(found || user);
        }
      } else if (user) {
        const found = initialStudentsData.find(s => s.username === user.username || s.id === user.id);
        setStudentProfile(found || user);
      }

      setLoading(false);
    }

    loadData();
  }, [user]);

  // Đồng bộ form profile
  useEffect(() => {
    const p = studentProfile || user;
    if (p) {
      setProfileForm({
        full_name: p.full_name || '',
        phone: p.phone || '',
        dob: p.dob || '',
        cccd: p.cccd || '',
        email: p.email || '',
        change_pw: false,
        new_password: '',
        confirm_password: ''
      });
    }
  }, [studentProfile, user]);

  // 2. LỌC KHÓA HỌC: CHỈ CHỨA KHÓA HỌC MÀ HỌC VIÊN ĐƯỢC ADMIN ÉP VÀO KHÓA
  const studentCourses = allCourses.filter(course => {
    if (!user) return false;

    const studentId = user.id || studentProfile?.id;
    const studentUsername = user.username || studentProfile?.username;
    const studentEmail = user.email || studentProfile?.email;
    const assignedCourseName = user.course_name || studentProfile?.course_name;

    // 1. Kiểm tra trong mảng enrolled_student_ids của khóa học
    const inEnrolledIds = (course.enrolled_student_ids || []).some(id =>
      id === studentId || id === studentUsername || id === studentEmail
    );

    // 2. Kiểm tra trong LocalStorage nếu admin vừa ép vào khóa
    let inLocalEnroll = false;
    try {
      const localKey = `driveedu_enrolled_${course.id}`;
      const localList = JSON.parse(localStorage.getItem(localKey) || '[]');
      inLocalEnroll = localList.some(id => id === studentId || id === studentUsername);
    } catch (e) {}

    // 3. Kiểm tra course_name được admin gán cho học viên
    const matchCourseName = assignedCourseName &&
      assignedCourseName !== 'Chưa xếp khóa' && (
        course.name.toLowerCase().includes(assignedCourseName.toLowerCase()) ||
        assignedCourseName.toLowerCase().includes(course.name.toLowerCase()) ||
        (course.code && assignedCourseName.toLowerCase().includes(course.code.toLowerCase()))
      );

    return inEnrolledIds || inLocalEnroll || matchCourseName;
  });

  // 3. Khôi phục tiến độ học tập từ LocalStorage khi vào khóa học
  useEffect(() => {
    if (!selectedCourse || !user) return;
    try {
      const storageKey = `driveedu_progress_${user.id || user.username || 'student'}_${selectedCourse.id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setChapterProgress(JSON.parse(saved));
      } else {
        const initial = {};
        (selectedCourse.chapters || []).forEach(ch => {
          initial[ch.id] = { studiedSeconds: 0, isCompleted: false };
        });
        setChapterProgress(initial);
      }
    } catch (e) {
      console.error('Lỗi đọc tiến độ:', e);
    }
  }, [selectedCourse, user]);

  const persistProgress = (newProgress) => {
    if (!selectedCourse || !user) return;
    try {
      const storageKey = `driveedu_progress_${user.id || user.username || 'student'}_${selectedCourse.id}`;
      localStorage.setItem(storageKey, JSON.stringify(newProgress));
    } catch (e) {}
  };

  // 4. LIVE REALTIME TIMER: TÍNH THỜI GIAN HỌC THỰC TẾ CHO CHƯƠNG KHI XEM BÀI GIẢNG
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && currentLesson && selectedCourse) {
      interval = setInterval(() => {
        setChapterProgress(prev => {
          const chId = currentLesson.chapterId;
          const curData = prev[chId] || { studiedSeconds: 0, isCompleted: false };
          const newSeconds = curData.studiedSeconds + 1;

          // Tính toán thời lượng quy định của chương
          const chapter = (selectedCourse.chapters || []).find(c => c.id === chId);
          const totalDurationSec = (chapter?.duration_minutes || 30) * 60;
          const minPct = chapter?.min_completion_pct || 80;
          const requiredSec = Math.round(totalDurationSec * (minPct / 100));

          // Đủ điều kiện hoàn thành chương
          const newlyCompleted = !curData.isCompleted && newSeconds >= requiredSec;

          const updated = {
            ...prev,
            [chId]: {
              studiedSeconds: newSeconds,
              isCompleted: curData.isCompleted || newlyCompleted
            }
          };

          persistProgress(updated);

          // KHI ĐỦ ĐIỀU KIỆN CỦA CHƯƠNG THÌ XUẤT HIỆN THÔNG BÁO HOÀN THÀNH CHƯƠNG
          if (newlyCompleted) {
            triggerChapterCompletion(chapter, newSeconds, totalDurationSec);
          }

          // Lưu ngầm lên backend mỗi 15 giây
          if (newSeconds % 15 === 0 && user?.id) {
            saveStudentProgressApi(user.id, {
              course_id: selectedCourse.id,
              chapter_id: chId,
              lesson_id: currentLesson.lesson.id,
              seconds_added: 15,
              total_studied_seconds: newSeconds,
              is_completed: curData.isCompleted || newlyCompleted
            });
          }

          return updated;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, currentLesson, selectedCourse, user]);

  // 5. KÍCH HOẠT THÔNG BÁO HOÀN THÀNH CHƯƠNG & PHÁO HOA
  const triggerChapterCompletion = (chapter, studiedSec, totalSec) => {
    setCompletedChapterModal({
      chapter,
      studiedSec,
      totalSec
    });
    launchConfetti();
  };

  const launchConfetti = () => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces = [];
    const colors = ['#2563eb', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

    for (let i = 0; i < 150; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        w: Math.random() * 10 + 5,
        h: Math.random() * 14 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: Math.random() * 4 - 2,
        vy: Math.random() * 4 + 4,
        rot: Math.random() * 360,
        vRot: Math.random() * 10 - 5
      });
    }

    let animationId;
    let frames = 0;
    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vRot;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      frames++;
      if (frames < 200) {
        animationId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    render();
  };

  // 6. ACCORDION: KHI HỌC VIÊN ẤN VÀO CHƯƠNG MỚI XỔ RA CÁC BÀI GIẢNG
  const handleToggleChapter = (chapterId) => {
    setExpandedChapters(prev => ({
      ...prev,
      [chapterId]: !prev[chapterId]
    }));
  };

  // 7. KHI HỌC VIÊN ẤN VÀO BÀI GIẢNG CỦA CHƯƠNG HỌC
  const handleSelectLesson = (chapter, lesson) => {
    setCurrentLesson({
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      chapterMinPct: chapter.min_completion_pct || 80,
      chapterDurationMin: chapter.duration_minutes || 30,
      lesson
    });
    // Bắt đầu tính thời gian học cho chương
    setIsTimerRunning(true);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
  };

  // 8. Tua nhanh thời gian học (Kiểm thử nhanh)
  const handleFastForwardTime = (secondsToAdd) => {
    if (!currentLesson || !selectedCourse) return;
    const chId = currentLesson.chapterId;
    setChapterProgress(prev => {
      const curData = prev[chId] || { studiedSeconds: 0, isCompleted: false };
      const newSeconds = curData.studiedSeconds + secondsToAdd;

      const chapter = (selectedCourse.chapters || []).find(c => c.id === chId);
      const totalDurationSec = (chapter?.duration_minutes || 30) * 60;
      const minPct = chapter?.min_completion_pct || 80;
      const requiredSec = Math.round(totalDurationSec * (minPct / 100));

      const newlyCompleted = !curData.isCompleted && newSeconds >= requiredSec;

      const updated = {
        ...prev,
        [chId]: {
          studiedSeconds: newSeconds,
          isCompleted: curData.isCompleted || newlyCompleted
        }
      };

      persistProgress(updated);

      if (newlyCompleted) {
        triggerChapterCompletion(chapter, newSeconds, totalDurationSec);
      }

      if (user?.id) {
        saveStudentProgressApi(user.id, {
          course_id: selectedCourse.id,
          chapter_id: chId,
          lesson_id: currentLesson.lesson.id,
          seconds_added: secondsToAdd,
          total_studied_seconds: newSeconds,
          is_completed: curData.isCompleted || newlyCompleted
        });
      }

      return updated;
    });
  };

  // 9. Nộp bài trắc nghiệm
  const handleSubmitQuiz = (questions) => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correct_index || quizAnswers[idx] === q.answer) {
        correct++;
      }
    });
    setQuizScore({
      correct,
      total: questions.length,
      passed: correct / questions.length >= 0.8
    });
    setQuizSubmitted(true);
    handleFastForwardTime(180);
  };

  // 10. Xử lý lưu thông tin tài khoản
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg({ type: '', text: '' });
    try {
      if (updateProfile) {
        await updateProfile({
          full_name: profileForm.full_name,
          phone: profileForm.phone,
          dob: profileForm.dob,
          cccd: profileForm.cccd
        });
      }
      if (profileForm.change_pw && profileForm.new_password) {
        if (profileForm.new_password !== profileForm.confirm_password) {
          throw new Error('Mật khẩu xác nhận không khớp!');
        }
        if (changePassword && user?.id) {
          await changePassword(user.id, profileForm.new_password);
        }
      }
      setProfileMsg({ type: 'success', text: 'Cập nhật thông tin tài khoản thành công!' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message || 'Cập nhật thất bại!' });
    } finally {
      setProfileSaving(false);
    }
  };

  // Helper icons
  const getLessonIcon = (type) => {
    if (type === 'video') return <Video className="w-4 h-4 text-blue-500" />;
    if (type === 'reading') return <FileText className="w-4 h-4 text-amber-500" />;
    if (type === 'quiz') return <HelpCircle className="w-4 h-4 text-purple-500" />;
    return <BookOpen className="w-4 h-4 text-slate-500" />;
  };

  const getLessonTypeBadge = (type) => {
    if (type === 'video') return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700">VIDEO</span>;
    if (type === 'reading') return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700">ĐỌC</span>;
    if (type === 'quiz') return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 text-purple-700">TRẮC NGHIỆM</span>;
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans relative">
      {/* Canvas pháo hoa Confetti */}
      <canvas ref={confettiCanvasRef} className="fixed inset-0 pointer-events-none z-[100]" />

      {/* ══════════════════════════════════════════════════════════════════════
          1. THANH HEAD: CHỈ CÓ ĐÚNG 2 MỤC "KHÓA HỌC" & "THÔNG TIN TÀI KHOẢN"
      ══════════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => {
              setHeadTab('courses');
              setSelectedCourse(null);
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">
                  DRIVE<span className="text-blue-600">EDU</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 rounded-md uppercase tracking-wider">
                  Học Viên
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Hệ Thống Đào Tạo GPLX Trực Tuyến</p>
            </div>
          </div>

          {/* ── 2 MỤC TRÊN THANH HEAD THEO YÊU CẦU: KHÓA HỌC & THÔNG TIN TÀI KHOẢN ── */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            
            {/* Mục 1: Khóa học */}
            <button
              id="head-tab-courses"
              onClick={() => {
                setHeadTab('courses');
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                headTab === 'courses'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Khóa học</span>
              {studentCourses.length > 0 && (
                <span className={`px-1.5 py-0.2 text-[11px] font-extrabold rounded-full ${
                  headTab === 'courses' ? 'bg-white/25 text-white' : 'bg-blue-100 text-blue-700'
                }`}>
                  {studentCourses.length}
                </span>
              )}
            </button>

            {/* Mục 2: Thông tin tài khoản */}
            <button
              id="head-tab-account"
              onClick={() => {
                setHeadTab('account');
                setSelectedCourse(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                headTab === 'account'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Thông tin tài khoản</span>
            </button>

          </nav>

          {/* Profile & Logout */}
          <div className="flex items-center gap-3">
            {/* Nút Admin nếu admin đang kiểm thử */}
            {(user?.role === 'admin' || onSwitchToAdmin) && (
              <button
                onClick={onSwitchToAdmin}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                title="Quay lại giao diện Admin"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Quản Trị Admin</span>
              </button>
            )}

            {/* Avatar info */}
            <div
              onClick={() => {
                setHeadTab('account');
                setSelectedCourse(null);
              }}
              className="flex items-center gap-2 cursor-pointer p-1 rounded-xl hover:bg-slate-100 transition-colors"
              title="Xem thông tin tài khoản"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow ring-2 ring-blue-500/20">
                {(user?.full_name || 'H')[0].toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-tight">
                  {user?.full_name || 'Học Viên'}
                </p>
                <p className="text-[10px] text-blue-600 font-medium">Học viên chính thức</p>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={() => {
                logout();
                router.push('/login');
              }}
              title="Đăng xuất"
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          2. NỘI DUNG TƯƠNG ỨNG VỚI MỤC TRÊN THANH HEAD
      ══════════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ──────────────────────────────────────────────────────────────────
            MỤC 1: KHÓA HỌC (CHỈ CHỨA KHÓA HỌC MÀ ADMIN ĐÃ ÉP VÀO)
        ────────────────────────────────────────────────────────────────── */}
        {headTab === 'courses' && !selectedCourse && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Banner Khóa Học của Học Viên */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white p-6 sm:p-8 shadow-xl shadow-blue-900/15">
              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-blue-100 text-xs font-bold mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Khóa Học Được Admin Phân Công
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Xin chào, {user?.full_name || 'Học viên'}!
                </h1>
                <p className="text-sm text-blue-100/90 mt-2 font-normal leading-relaxed">
                  Dưới đây là danh sách khóa học mà bạn đã được Quản trị viên (Admin) xếp lớp đào tạo. Nhấn <strong>"Vào học ngay"</strong> để mở chương bài giảng và bắt đầu tính thời gian học.
                </p>
              </div>
            </div>

            {/* Tiêu đề danh sách */}
            <div className="flex items-center justify-between pt-2">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-600" />
                  Khóa Học Của Bạn ({studentCourses.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chỉ hiển thị các khóa học mà tài khoản của bạn được quản trị viên thêm vào danh sách đào tạo
                </p>
              </div>
            </div>

            {/* DANH SÁCH KHÓA HỌC ĐƯỢC ADMIN ÉP VÀO */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                <p className="text-sm text-slate-500 font-medium">Đang kiểm tra danh sách khóa học được phân công...</p>
              </div>
            ) : studentCourses.length === 0 ? (
              /* Trường hợp học viên chưa được admin ép vào khóa nào */
              <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 sm:p-16 text-center shadow-sm max-w-2xl mx-auto space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-800">
                  Bạn chưa được xếp vào khóa học nào
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Hiện tại tài khoản của bạn chưa được Quản trị viên (Admin) xếp vào bất kỳ khóa học nào. Vui lòng liên hệ với nhà trường hoặc ban quản lý để được bổ sung vào lớp đào tạo GPLX phù hợp.
                </p>
                <div className="pt-2">
                  <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold">
                    Trạng thái hồ sơ: Chờ xếp lớp đào tạo
                  </span>
                </div>
              </div>
            ) : (
              /* Hiển thị các khóa học đã được Admin ép vào */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {studentCourses.map((course) => {
                  const chapters = course.chapters || [];
                  const totalLessons = chapters.reduce((sum, ch) => sum + (ch.lessons?.length || 0), 0);

                  return (
                    <div
                      key={course.id}
                      className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-400 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group"
                    >
                      {/* Thumbnail */}
                      <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                        <img
                          src={course.thumbnail_url || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600'}
                          alt={course.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/20 to-transparent" />
                        
                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          <span className="px-2.5 py-1 text-xs font-black bg-blue-600 text-white rounded-lg shadow-md">
                            Hạng {course.license_tier || 'B2'}
                          </span>
                          <span className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 text-white rounded-lg shadow-md flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Được Xếp Lớp
                          </span>
                        </div>

                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white/90">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Layers className="w-3.5 h-3.5 text-blue-400" />
                            <span>{chapters.length} chương • {totalLessons} bài</span>
                          </div>
                          <span className="text-slate-300 font-mono text-[11px]">{course.code}</span>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-base font-bold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
                            {course.name}
                          </h3>
                          <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                            {course.description || 'Chương trình đào tạo lái xe quy chuẩn với đầy đủ bài giảng lý thuyết, mô phỏng và sa hình.'}
                          </p>
                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                            <span className="text-slate-400">Giảng viên phụ trách:</span>
                            <span className="font-semibold text-slate-800">{course.teacher_name || 'Thầy Nguyễn Văn Hùng'}</span>
                          </div>
                        </div>

                        {/* Button Vào học ngay */}
                        <div className="mt-5">
                          <button
                            id={`btn-enter-course-${course.id}`}
                            onClick={() => setSelectedCourse(course)}
                            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
                          >
                            <Play className="w-4 h-4 fill-white" />
                            <span>Vào Học Ngay</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* ──────────────────────────────────────────────────────────────────
            PHÒNG HỌC: HIỆN CHƯƠNG, THỜI GIAN, XỔ BÀI GIẢNG VÀ TÍNH GIỜ
        ────────────────────────────────────────────────────────────────── */}
        {headTab === 'courses' && selectedCourse && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Top Bar: Nút quay lại & Tiêu đề khóa học */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  id="btn-back-to-my-courses"
                  onClick={() => {
                    setSelectedCourse(null);
                    setCurrentLesson(null);
                    setIsTimerRunning(false);
                  }}
                  className="p-2.5 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition-colors flex items-center gap-1.5 font-bold text-xs"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Quay lại</span>
                </button>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-extrabold bg-blue-100 text-blue-800 rounded">
                      Hạng {selectedCourse.license_tier}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{selectedCourse.code}</span>
                  </div>
                  <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5 line-clamp-1">
                    {selectedCourse.name}
                  </h1>
                </div>
              </div>

              {/* Tiến độ khóa */}
              <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-5">
                <div className="text-left sm:text-right">
                  <p className="text-[11px] text-slate-400 font-medium">Tiến độ khóa học</p>
                  <p className="text-sm font-black text-slate-800">
                    {Object.values(chapterProgress).filter(p => p.isCompleted).length} / {(selectedCourse.chapters || []).length} Chương đạt chuẩn
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center text-emerald-600 font-black text-xs">
                  {Math.round(
                    (Object.values(chapterProgress).filter(p => p.isCompleted).length /
                      Math.max(1, (selectedCourse.chapters || []).length)) *
                      100
                  )}%
                </div>
              </div>
            </div>

            {/* BỐ CỤC: DANH SÁCH CHƯƠNG (XỔ BÀI GIẢNG) VÀ KHUNG HỌC TÍNH GIỜ */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* ── CỘT TRÁI: HIỆN CHƯƠNG, THỜI GIAN CHƯƠNG, ẤN MỚI XỔ BÀI GIẢNG ── */}
              <div className="lg:col-span-4 space-y-3">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-600" />
                      Chương Bài Học
                    </h2>
                    <span className="text-xs text-slate-400 font-medium">
                      {(selectedCourse.chapters || []).length} Chương
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">
                    💡 Nhấn vào từng chương để <strong>xổ ra các bài giảng</strong>. Chọn bài giảng để bắt đầu <strong>tính thời gian cho chương đó</strong>.
                  </p>

                  <div className="space-y-3">
                    {(selectedCourse.chapters || []).map((ch, chIdx) => {
                      const isExpanded = !!expandedChapters[ch.id];
                      const lessons = ch.lessons || [];
                      const progress = chapterProgress[ch.id] || { studiedSeconds: 0, isCompleted: false };
                      const totalDurationSec = (ch.duration_minutes || 30) * 60;
                      const minPct = ch.min_completion_pct || 80;
                      const pctDone = Math.min(100, Math.round((progress.studiedSeconds / totalDurationSec) * 100));

                      return (
                        <div
                          key={ch.id || chIdx}
                          className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
                            progress.isCompleted
                              ? 'border-emerald-200 bg-emerald-50/20'
                              : currentLesson?.chapterId === ch.id
                              ? 'border-blue-400 shadow-sm bg-white'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          {/* TIÊU ĐỀ CHƯƠNG & THỜI GIAN CỦA CHƯƠNG */}
                          <button
                            id={`btn-chapter-${ch.id || chIdx}`}
                            onClick={() => handleToggleChapter(ch.id)}
                            className="w-full p-4 text-left flex items-start justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="mt-0.5 flex-shrink-0">
                                {progress.isCompleted ? (
                                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                                    <Check className="w-4 h-4 stroke-[3]" />
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 rounded-full border-2 border-blue-500 text-blue-700 bg-blue-50 flex items-center justify-center text-xs font-black">
                                    {chIdx + 1}
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Chương {chIdx + 1}
                                  </span>
                                  {progress.isCompleted ? (
                                    <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1">
                                      <Award className="w-3 h-3 text-emerald-600" />
                                      ĐÃ HOÀN THÀNH
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-full">
                                      Yêu cầu {minPct}%
                                    </span>
                                  )}
                                </div>

                                <h3 className="text-xs sm:text-sm font-bold text-slate-900 mt-1 leading-snug">
                                  {ch.title}
                                </h3>

                                {/* THỜI GIAN CỦA CHƯƠNG ĐÓ */}
                                <div className="mt-2.5 space-y-1.5">
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-slate-500 flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-blue-500" />
                                      Thời lượng: <strong>{ch.duration_minutes || 30} phút</strong>
                                    </span>
                                    <span className={`font-bold ${progress.isCompleted ? 'text-emerald-600' : 'text-blue-600'}`}>
                                      Đã học: {formatTime(progress.studiedSeconds)} ({pctDone}%)
                                    </span>
                                  </div>

                                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-500 ${
                                        progress.isCompleted
                                          ? 'bg-emerald-500'
                                          : pctDone >= minPct
                                          ? 'bg-emerald-400'
                                          : 'bg-blue-600'
                                      }`}
                                      style={{ width: `${pctDone}%` }}
                                    />
                                  </div>
                                </div>

                              </div>
                            </div>

                            <div className="mt-1 text-slate-400 hover:text-slate-600">
                              {isExpanded ? (
                                <ChevronDown className="w-5 h-5 text-blue-600 transition-transform duration-200" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-slate-400 transition-transform duration-200" />
                              )}
                            </div>
                          </button>

                          {/* KHI HỌC VIÊN ẤN VÀO CHƯƠNG THÌ MỚI XỔ RA CÁC BÀI GIẢNG */}
                          {isExpanded && (
                            <div className="border-t border-slate-100 bg-slate-50/70 p-2 divide-y divide-slate-100">
                              {lessons.length === 0 ? (
                                <p className="p-3 text-center text-xs text-slate-400 italic">
                                  Chương này chưa có bài giảng.
                                </p>
                              ) : (
                                lessons.map((lesson, lIdx) => {
                                  const isCurrent = currentLesson?.lesson?.id === lesson.id;

                                  return (
                                    <button
                                      key={lesson.id || lIdx}
                                      id={`btn-lesson-${lesson.id || lIdx}`}
                                      onClick={() => handleSelectLesson(ch, lesson)}
                                      className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-all ${
                                        isCurrent
                                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold'
                                          : 'hover:bg-white text-slate-700'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <div className={`p-1.5 rounded-lg ${isCurrent ? 'bg-white/20 text-white' : 'bg-slate-100'}`}>
                                          {getLessonIcon(lesson.type)}
                                        </div>
                                        <div className="min-w-0">
                                          <p className={`text-xs truncate ${isCurrent ? 'text-white' : 'text-slate-800 font-medium'}`}>
                                            {lesson.title}
                                          </p>
                                          <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`text-[10px] ${isCurrent ? 'text-blue-100' : 'text-slate-400'}`}>
                                              {lesson.duration_minutes || 15} phút
                                            </span>
                                            {!isCurrent && getLessonTypeBadge(lesson.type)}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex-shrink-0 ml-2">
                                        {isCurrent ? (
                                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                        ) : (
                                          <Play className="w-3.5 h-3.5 text-slate-400 hover:text-blue-600" />
                                        )}
                                      </div>
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>

              {/* ── CỘT PHẢI: TRÌNH PHÁT BÀI GIẢNG & TÍNH THỜI GIAN CHO CHƯƠNG ĐÓ ── */}
              <div className="lg:col-span-8 space-y-4">
                {!currentLesson ? (
                  <div className="bg-white border border-slate-200 rounded-3xl p-10 sm:p-14 text-center shadow-sm flex flex-col items-center justify-center min-h-[420px]">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-inner">
                      <Play className="w-8 h-8 fill-blue-600 ml-1" />
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-900">
                      Chọn một bài giảng để bắt đầu học
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-md mt-2 leading-relaxed">
                      Nhấn vào từng chương ở danh sách bên trái để <strong>xổ ra các bài giảng</strong>. Khi bạn chọn một bài giảng, hệ thống sẽ tự động <strong>tính thời gian cho chương đó</strong>.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    
                    {/* THANH TÍNH GIỜ HỌC CHO CHƯƠNG (LIVE TIMER) */}
                    <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white rounded-2xl p-4 sm:p-5 shadow-lg shadow-blue-600/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-amber-300 relative">
                          <Clock className="w-6 h-6 animate-pulse" />
                          {isTimerRunning && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-indigo-800" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-200">
                              Đang tính giờ cho: {currentLesson.chapterTitle}
                            </span>
                            {isTimerRunning ? (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 rounded-full flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
                                ĐANG TÍNH THỜI GIAN
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/30 text-amber-200 rounded-full">
                                ĐÃ TẠM DỪNG
                              </span>
                            )}
                          </div>

                          <div className="flex items-baseline gap-2 mt-0.5">
                            <span className="text-2xl font-black text-white font-mono tracking-tight">
                              ⏱️ {formatTime(chapterProgress[currentLesson.chapterId]?.studiedSeconds || 0)}
                            </span>
                            <span className="text-xs text-blue-200">
                              / {currentLesson.chapterDurationMin} phút yêu cầu ({currentLesson.chapterMinPct}%)
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => setIsTimerRunning(!isTimerRunning)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                            isTimerRunning
                              ? 'bg-white/20 hover:bg-white/30 text-white'
                              : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow'
                          }`}
                        >
                          {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                          <span>{isTimerRunning ? 'Tạm dừng' : 'Tiếp tục đếm'}</span>
                        </button>

                        <button
                          onClick={() => handleFastForwardTime(300)}
                          title="Tua nhanh thêm 5 phút học để nghiệm thu"
                          className="px-2.5 py-2 rounded-xl bg-white/10 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1 transition-all"
                        >
                          <FastForward className="w-3.5 h-3.5 text-amber-300" />
                          <span>+5 Phút</span>
                        </button>

                        <button
                          onClick={() => {
                            const totalSec = (currentLesson.chapterDurationMin || 30) * 60;
                            const reqSec = Math.round(totalSec * ((currentLesson.chapterMinPct || 80) / 100));
                            handleFastForwardTime(reqSec);
                          }}
                          className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-extrabold flex items-center gap-1 transition-all shadow-md"
                        >
                          <Award className="w-3.5 h-3.5 text-slate-900" />
                          <span>Đạt Mốc Ngay</span>
                        </button>
                      </div>
                    </div>

                    {/* NỘI DUNG BÀI GIẢNG */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            {getLessonTypeBadge(currentLesson.lesson.type)}
                            <span className="text-xs text-slate-400">Thời lượng bài: {currentLesson.lesson.duration_minutes || 15} phút</span>
                          </div>
                          <h2 className="text-lg font-bold text-slate-900 mt-1">
                            {currentLesson.lesson.title}
                          </h2>
                        </div>
                      </div>

                      {/* Video */}
                      {currentLesson.lesson.type === 'video' && (
                        <div className="space-y-4">
                          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 shadow-inner">
                            {(() => {
                              const embed = getVideoEmbed(currentLesson.lesson.content_url || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
                              if (!embed) {
                                return (
                                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                                    Không thể tải nội dung video
                                  </div>
                                );
                              }
                              if (embed.type === 'video') {
                                return (
                                  <video
                                    src={embed.src}
                                    controls
                                    autoPlay
                                    className="w-full h-full object-contain"
                                    onPlay={() => setIsTimerRunning(true)}
                                    onPause={() => setIsTimerRunning(false)}
                                  />
                                );
                              }
                              return (
                                <iframe
                                  src={embed.src}
                                  title={currentLesson.lesson.title}
                                  className="w-full h-full border-0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              );
                            })()}
                          </div>
                          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 flex items-center gap-2.5">
                            <Zap className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <span>
                              Đang tính thời gian học bài giảng cho <strong>{currentLesson.chapterTitle}</strong>. Khi tích lũy đủ điều kiện, chương sẽ được chứng nhận hoàn thành.
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Reading */}
                      {currentLesson.lesson.type === 'reading' && (
                        <div className="space-y-5">
                          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-800 leading-relaxed max-h-[450px] overflow-y-auto space-y-4 font-serif">
                            <h3 className="text-base font-bold text-slate-900 font-sans border-b border-slate-200 pb-2">
                              {currentLesson.lesson.title}
                            </h3>
                            <p>
                              {currentLesson.lesson.content_text ||
                                'Quy tắc giao thông đường bộ: Người tham gia giao thông phải đi bên phải theo chiều đi của mình, đi đúng làn đường, phần đường quy định và phải chấp hành hệ thống báo hiệu đường bộ. Xe cơ giới, xe máy chuyên dùng tham gia giao thông đường bộ phải có đủ các điều kiện an toàn kỹ thuật và bảo vệ môi trường theo quy định.'}
                            </p>
                            <p>
                              Hệ thống báo hiệu đường bộ gồm hiệu lệnh của người điều khiển giao thông, tín hiệu đèn giao thông, biển báo hiệu, vạch kẻ đường, cọc tiêu hoặc tường bảo vệ, rào chắn. Biển báo hiệu đường bộ gồm 5 nhóm chính: biển báo cấm, biển báo nguy hiểm, biển hiệu lệnh, biển chỉ dẫn và biển phụ.
                            </p>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500 italic">
                              ⏱️ Thời gian đọc tài liệu đang được tích lũy vào chương...
                            </span>
                            <button
                              onClick={() => handleFastForwardTime(120)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                            >
                              <Check className="w-4 h-4" />
                              <span>Đã đọc xong (+2 phút)</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Quiz */}
                      {currentLesson.lesson.type === 'quiz' && (
                        <div className="space-y-6">
                          {(() => {
                            const sampleQuestions = [
                              {
                                question: 'Người tham gia giao thông đường bộ phải đi như thế nào là đúng quy tắc giao thông?',
                                options: [
                                  'Đi bên phải theo chiều đi của mình, đi đúng làn đường, phần đường quy định.',
                                  'Đi bên trái theo chiều đi của mình.',
                                  'Đi ở giữa đường nếu đường vắng.',
                                  'Tùy ý lựa chọn làn đường thuận tiện.'
                                ],
                                correct_index: 0
                              },
                              {
                                question: 'Biển nào báo hiệu cấm xe ô tô đi vào?',
                                options: [
                                  'Biển báo đường cấm',
                                  'Biển cấm xe ô tô (P.103a)',
                                  'Biển cấm xe tải',
                                  'Biển cấm dừng và đỗ'
                                ],
                                correct_index: 1
                              }
                            ];

                            const questions = (currentLesson.lesson.quiz_questions && currentLesson.lesson.quiz_questions.length > 0)
                              ? currentLesson.lesson.quiz_questions
                              : sampleQuestions;

                            return (
                              <div className="space-y-5">
                                <div className="space-y-4">
                                  {questions.map((q, qIdx) => (
                                    <div key={qIdx} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                                      <p className="text-xs sm:text-sm font-bold text-slate-900 mb-3">
                                        Câu {qIdx + 1}: {q.question}
                                      </p>
                                      <div className="space-y-2">
                                        {q.options.map((opt, optIdx) => {
                                          const isSelected = quizAnswers[qIdx] === optIdx;
                                          return (
                                            <button
                                              key={optIdx}
                                              onClick={() => setQuizAnswers(prev => ({ ...prev, [qIdx]: optIdx }))}
                                              className={`w-full p-3 rounded-xl text-left text-xs font-medium transition-all flex items-center gap-3 ${
                                                isSelected
                                                  ? 'bg-purple-600 text-white shadow-md'
                                                  : 'bg-white hover:bg-purple-50 text-slate-700 border border-slate-200'
                                              }`}
                                            >
                                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                                isSelected ? 'bg-white text-purple-700' : 'bg-slate-100 text-slate-600'
                                              }`}>
                                                {String.fromCharCode(65 + optIdx)}
                                              </span>
                                              <span>{opt}</span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <div className="pt-2 flex items-center justify-between">
                                  {quizSubmitted ? (
                                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                                      <CheckCircle2 className="w-5 h-5" />
                                      <span>
                                        Kết quả: {quizScore?.correct}/{quizScore?.total} câu đúng! (+3 phút tích lũy)
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-slate-400">Chọn đầy đủ đáp án rồi nộp bài</span>
                                  )}

                                  <button
                                    onClick={() => handleSubmitQuiz(questions)}
                                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all"
                                  >
                                    Nộp Bài Trắc Nghiệm
                                  </button>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                    </div>

                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* ──────────────────────────────────────────────────────────────────
            MỤC 2: THÔNG TIN TÀI KHOẢN (TRÊN THANH HEAD)
        ────────────────────────────────────────────────────────────────── */}
        {headTab === 'account' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
            
            {/* Header thông tin học viên */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-blue-500/20 ring-4 ring-white flex-shrink-0">
                {(studentProfile?.full_name || user?.full_name || 'H')[0].toUpperCase()}
              </div>

              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
                  <h1 className="text-2xl font-black text-slate-900">
                    {studentProfile?.full_name || user?.full_name || 'Học Viên'}
                  </h1>
                  <span className="px-2.5 py-1 text-xs font-extrabold bg-blue-100 text-blue-800 rounded-full">
                    Học Viên Chính Thức
                  </span>
                </div>

                <p className="text-xs text-slate-500 font-mono">
                  Tên đăng nhập: @{studentProfile?.username || user?.username || 'hocvien'}
                </p>

                {/* Thông tin khóa học được Admin ép vào */}
                <div className="pt-2 flex items-center justify-center sm:justify-start gap-2 flex-wrap text-xs">
                  <span className="text-slate-500 font-medium">Khóa học được xếp:</span>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-bold">
                    {studentCourses.length > 0
                      ? studentCourses.map(c => c.name).join(', ')
                      : studentProfile?.course_name && studentProfile.course_name !== 'Chưa xếp khóa'
                      ? studentProfile.course_name
                      : 'Chưa được xếp khóa học'}
                  </span>
                </div>
              </div>
            </div>

            {/* Thông báo cập nhật */}
            {profileMsg.text && (
              <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-medium ${
                profileMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {profileMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
                <span>{profileMsg.text}</span>
              </div>
            )}

            {/* Form xem & cập nhật thông tin tài khoản */}
            <form onSubmit={handleSaveProfile} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Hồ Sơ Cá Nhân & Đào Tạo
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Họ và tên</label>
                  <input
                    type="text"
                    value={profileForm.full_name}
                    onChange={e => setProfileForm(p => ({ ...p, full_name: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Số CCCD / CMND</label>
                  <input
                    type="text"
                    value={profileForm.cccd}
                    onChange={e => setProfileForm(p => ({ ...p, cccd: e.target.value }))}
                    placeholder="001099xxxxxx"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    disabled
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Số điện thoại</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="0912345678"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Ngày sinh</label>
                  <input
                    type="date"
                    value={profileForm.dob ? profileForm.dob.split('T')[0] : ''}
                    onChange={e => setProfileForm(p => ({ ...p, dob: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Khóa học được phân bổ</label>
                  <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-blue-700">
                    {studentCourses.length > 0
                      ? studentCourses[0].name
                      : studentProfile?.course_name || 'Chưa xếp khóa'}
                  </div>
                </div>
              </div>

              {/* Đổi mật khẩu inline */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <label className="flex items-center gap-2.5 cursor-pointer text-sm font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={profileForm.change_pw}
                    onChange={e => setProfileForm(p => ({ ...p, change_pw: e.target.checked }))}
                    className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                  />
                  <span>Đổi mật khẩu tài khoản</span>
                </label>

                {profileForm.change_pw && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Mật khẩu mới</label>
                      <input
                        type="password"
                        value={profileForm.new_password}
                        onChange={e => setProfileForm(p => ({ ...p, new_password: e.target.value }))}
                        placeholder="Tối thiểu 6 ký tự"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Xác nhận mật khẩu</label>
                      <input
                        type="password"
                        value={profileForm.confirm_password}
                        onChange={e => setProfileForm(p => ({ ...p, confirm_password: e.target.value }))}
                        placeholder="Nhập lại mật khẩu"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Nút lưu */}
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>{profileSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
                </button>
              </div>
            </form>

          </div>
        )}

      </main>

      {/* ══════════════════════════════════════════════════════════════════════
          3. MODAL PHÁO HOA THÔNG BÁO HOÀN THÀNH CHƯƠNG KHI ĐỦ ĐIỀU KIỆN
      ══════════════════════════════════════════════════════════════════════ */}
      {completedChapterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 text-center relative overflow-hidden animate-modal">
            
            <button
              onClick={() => setCompletedChapterModal(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cúp Vàng */}
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 to-amber-200 mx-auto flex items-center justify-center text-amber-800 shadow-xl shadow-amber-400/30 mb-4 animate-bounce">
              <Award className="w-12 h-12" />
            </div>

            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black rounded-full uppercase tracking-wider">
              Đạt Chuẩn Hoàn Thành Chương
            </span>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 tracking-tight">
              🎉 XUẤT SẮC HOÀN THÀNH!
            </h2>

            <p className="text-sm font-bold text-blue-700 mt-1">
              {completedChapterModal.chapter?.title}
            </p>

            <p className="text-xs text-slate-600 mt-3 leading-relaxed">
              Chúc mừng bạn đã tích lũy đủ <strong>{formatTime(completedChapterModal.studiedSec)}</strong> thời gian học tập theo quy định của chương (Yêu cầu tối thiểu {completedChapterModal.chapter?.min_completion_pct || 80}%).
            </p>

            <div className="grid grid-cols-2 gap-3 mt-5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-left">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Thời gian hoàn thành:</span>
                <span className="text-xs font-black text-slate-800 font-mono">
                  {formatTime(completedChapterModal.studiedSec)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Trạng thái hồ sơ:</span>
                <span className="text-xs font-black text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Đã Chứng Nhận
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                id="btn-close-completion-modal"
                onClick={() => setCompletedChapterModal(null)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all"
              >
                Tiếp Tục Học Tập
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 mt-auto">
        <p>© 2026 DriveEdu LMS. Cổng đào tạo học viên GPLX trực tuyến quy chuẩn Bộ GTVT.</p>
      </footer>
    </div>
  );
}
