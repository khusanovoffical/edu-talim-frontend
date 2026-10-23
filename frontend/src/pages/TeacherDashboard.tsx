import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ClassRoom, Assignment, Submission, Subject, User } from '../types';
import {
  LayoutDashboard, FileText, Video, BookOpen, Users,
  MessageSquare, Settings, Plus, Trash2, CheckCircle2,
  AlertCircle, Calendar, Clock, Sparkles, Upload, Image as ImageIcon,
  Play, Check, X, ChevronRight, Star, Award, Download,
  Search, Filter, Sliders, Eye, HelpCircle, Bot, ArrowRight,
  Shield, Key, Lock, UserCheck
} from 'lucide-react';
import { BackButton } from '../components/BackButton';


interface QuestionItem {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'numeric' | 'text';
  options: string[];
  correct_answer: string;
  points: number;
  imageFile: File | null;
  imagePreview: string;
}

interface VideoQuestionItem {
  question: string;
  timestamp: string;
  answer: string;
}

interface TeacherContentItem {
  id: number;
  title: string;
  content_type: 'theory' | 'video' | string;
  content_text?: string;
  video_url?: string;
  video_file_path?: string;
  grade?: number;
  subject_id?: number;
  status: string;
  view_count: number;
  teacher_id?: number;
  created_at?: string;
}

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'assignments' | 'content' | 'students' | 'submissions' | 'settings'>('home');

  // Umumiy ma'lumotlar
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [contents, setContents] = useState<TeacherContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Tab 2: Topshiriq konstruktori
  const [assignClassId, setAssignClassId] = useState<number | ''>('');
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDueDate, setAssignDueDate] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [questions, setQuestions] = useState<QuestionItem[]>([
    {
      id: 'q_1',
      question_text: '',
      question_type: 'multiple_choice',
      options: ['', '', '', ''],
      correct_answer: '',
      points: 10,
      imageFile: null,
      imagePreview: ''
    }
  ]);
  const [savingAssignment, setSavingAssignment] = useState(false);

  // Tab 3: Kontent (Teorema va Video)
  const [showTheoryModal, setShowTheoryModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [theoryTitle, setTheoryTitle] = useState('');
  const [theorySubjectId, setTheorySubjectId] = useState<number | ''>('');
  const [theoryGrade, setTheoryGrade] = useState<number>(7);
  const [theoryContent, setTheoryContent] = useState('');
  const [submittingTheory, setSubmittingTheory] = useState(false);

  const [videoTitle, setVideoTitle] = useState('');
  const [videoSubjectId, setVideoSubjectId] = useState<number | ''>('');
  const [videoGrade, setVideoGrade] = useState<number>(7);
  const [videoSourceType, setVideoSourceType] = useState<'url' | 'file'>('url');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoQuestions, setVideoQuestions] = useState<VideoQuestionItem[]>([]);
  const [submittingVideo, setSubmittingVideo] = useState(false);
  const [contentFilterType, setContentFilterType] = useState<'all' | 'theory' | 'video'>('all');

  // Tab 4: O'quvchilar
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentFullName, setStudentFullName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentGrade, setStudentGrade] = useState<number>(7);
  const [studentClassId, setStudentClassId] = useState<number | ''>('');
  const [studentSearch, setStudentSearch] = useState('');
  const [savingStudent, setSavingStudent] = useState(false);

  // Tab 5: Javoblar (Submissions)
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [viewSubmissionModal, setViewSubmissionModal] = useState<Submission | null>(null);
  const [teacherGradeInput, setTeacherGradeInput] = useState<string>('5');
  const [teacherFeedbackInput, setTeacherFeedbackInput] = useState<string>('');
  const [submittingGrade, setSubmittingGrade] = useState(false);

  // Tab 6: Sozlamalar
  const [profileFullName, setProfileFullName] = useState(user?.full_name || '');
  const [profilePassword, setProfilePassword] = useState('');
  const [profilePasswordConfirm, setProfilePasswordConfirm] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const token = localStorage.getItem('eduai_token');

  // Dastlabki ma'lumotlarni yuklash
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [cls, assigns, subs] = await Promise.all([
        api.getClasses().catch(() => []),
        api.getAssignments().catch(() => []),
        api.getSubjects().catch(() => [])
      ]);
      setClasses(cls);
      setAssignments(assigns);
      setSubjects(subs);

      if (cls.length > 0 && !assignClassId) {
        setAssignClassId(cls[0].id);
        setStudentClassId(cls[0].id);
      }
      if (subs.length > 0) {
        setTheorySubjectId(subs[0].id);
        setVideoSubjectId(subs[0].id);
      }
      if (assigns.length > 0 && !selectedAssignmentId) {
        setSelectedAssignmentId(assigns[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Kontentlar ro'yxatini yuklash
  const loadContents = async () => {
    try {
      const res = await fetch('/api/v1/teacher-content/', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setContents(data);
      }
    } catch (e) {
      console.error('Kontentlarni yuklashda xatolik:', e);
    }
  };

  // O'quvchilar ro'yxatini yuklash
  const loadStudents = async () => {
    try {
      const res = await fetch('/api/v1/admin/users?role=student', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (e) {
      console.error("O'quvchilarni yuklashda xatolik:", e);
    }
  };

  // Tab o'zgarganda tegishli ma'lumotlarni yuklash
  useEffect(() => {
    if (activeTab === 'content') {
      loadContents();
    } else if (activeTab === 'students') {
      loadStudents();
    } else if (activeTab === 'submissions' && selectedAssignmentId) {
      loadSubmissions(selectedAssignmentId);
    }
    setMessage(null);
  }, [activeTab]);

  // Tanlangan topshiriq o'zgarganda javoblarni yuklash
  useEffect(() => {
    if (selectedAssignmentId && activeTab === 'submissions') {
      loadSubmissions(selectedAssignmentId);
    }
  }, [selectedAssignmentId]);

  const loadSubmissions = async (assignmentId: number) => {
    setLoadingSubmissions(true);
    try {
      const data = await api.getAssignmentSubmissions(assignmentId);
      setSubmissions(data);
    } catch (e) {
      console.error('Javoblarni yuklashda xatolik:', e);
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // ================= TAB 2 FUNKSIYALARI: Topshiriq konstruktori =================
  const addQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        id: `q_${Date.now()}`,
        question_text: '',
        question_type: 'multiple_choice',
        options: ['', '', '', ''],
        correct_answer: '',
        points: 10,
        imageFile: null,
        imagePreview: ''
      }
    ]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length === 1) {
      setMessage({ type: 'error', text: "Kamida 1 ta savol bo'lishi shart!" });
      return;
    }
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, updates: Partial<QuestionItem>) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const handleImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      updateQuestion(id, {
        imageFile: file,
        imagePreview: reader.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  const removeQuestionImage = (id: string) => {
    updateQuestion(id, {
      imageFile: null,
      imagePreview: ''
    });
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignClassId || !assignTitle.trim()) {
      setMessage({ type: 'error', text: 'Iltimos, sinf va topshiriq nomini kiriting!' });
      return;
    }

    // Savollarni tekshirish
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        setMessage({ type: 'error', text: `${i + 1}-savol matni kiritilmagan!` });
        return;
      }
      if (!q.correct_answer.trim()) {
        setMessage({ type: 'error', text: `${i + 1}-savol uchun to'g'ri javob belgilanmagan!` });
        return;
      }
    }

    setSavingAssignment(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('class_id', assignClassId.toString());
      formData.append('title', assignTitle.trim());
      formData.append('description', assignDesc.trim());
      if (assignDueDate) {
        formData.append('due_date', new Date(assignDueDate).toISOString());
      }

      // Savollarni tayyorlash (rasmlar base64 yoki matnga biriktiriladi)
      const formattedQuestions = questions.map(q => ({
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.question_type === 'multiple_choice' ? q.options.filter(o => o.trim() !== '') : [],
        correct_answer: q.correct_answer.trim(),
        points: q.points || 10,
        image_url: q.imagePreview || ''
      }));

      formData.append('questions_json', JSON.stringify(formattedQuestions));

      const res = await fetch('/api/v1/assignments/', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
          // DIQQAT: Content-Type belgilanmaydi, browser avtomatik multipart boundary qo'yadi!
        },
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Topshiriqni saqlashda xatolik yuz berdi');
      }

      setMessage({ type: 'success', text: "Topshiriq muvaffaqiyatli yaratildi va o'quvchilarga e'lon qilindi!" });
      // Formani tozalash
      setAssignTitle('');
      setAssignDesc('');
      setAssignDueDate('');
      setQuestions([
        {
          id: `q_${Date.now()}`,
          question_text: '',
          question_type: 'multiple_choice',
          options: ['', '', '', ''],
          correct_answer: '',
          points: 10,
          imageFile: null,
          imagePreview: ''
        }
      ]);
      loadInitialData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSavingAssignment(false);
    }
  };

  // ================= TAB 3 FUNKSIYALARI: Kontent =================
  const handleCreateTheory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!theoryTitle.trim() || !theoryContent.trim()) {
      setMessage({ type: 'error', text: 'Sarlavha va kontent matni majburiy!' });
      return;
    }

    setSubmittingTheory(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('title', theoryTitle.trim());
      formData.append('content_text', theoryContent.trim());
      if (theorySubjectId) formData.append('subject_id', theorySubjectId.toString());
      if (theoryGrade) formData.append('grade', theoryGrade.toString());

      const res = await fetch('/api/v1/teacher-content/theory', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Teoremani qo'shishda xatolik yuz berdi");
      }

      setMessage({ type: 'success', text: "Teorema muvaffaqiyatli saqlandi va ko'rib chiqishga yuborildi!" });
      setShowTheoryModal(false);
      setTheoryTitle('');
      setTheoryContent('');
      loadContents();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmittingTheory(false);
    }
  };

  const handleCreateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoTitle.trim()) {
      setMessage({ type: 'error', text: 'Video sarlavhasi majburiy!' });
      return;
    }

    if (videoSourceType === 'url' && !videoUrl.trim()) {
      setMessage({ type: 'error', text: 'Video havolasini kiriting!' });
      return;
    }

    if (videoSourceType === 'file' && !videoFile) {
      setMessage({ type: 'error', text: 'Video faylini tanlang!' });
      return;
    }

    setSubmittingVideo(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('title', videoTitle.trim());
      if (videoSubjectId) formData.append('subject_id', videoSubjectId.toString());
      if (videoGrade) formData.append('grade', videoGrade.toString());
      
      if (videoSourceType === 'url') {
        formData.append('video_url', videoUrl.trim());
      } else if (videoFile) {
        formData.append('video_file', videoFile);
      }

      if (videoQuestions.length > 0) {
        formData.append('questions_json', JSON.stringify(videoQuestions));
      }

      const res = await fetch('/api/v1/teacher-content/video', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Video darslikni yuklashda xatolik yuz berdi");
      }

      setMessage({ type: 'success', text: "Video darslik muvaffaqiyatli yuklandi!" });
      setShowVideoModal(false);
      setVideoTitle('');
      setVideoUrl('');
      setVideoFile(null);
      setVideoQuestions([]);
      loadContents();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmittingVideo(false);
    }
  };

  // ================= TAB 4 FUNKSIYALARI: O'quvchilar =================
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentFullName.trim() || !studentEmail.trim() || !studentPassword.trim()) {
      setMessage({ type: 'error', text: "Barcha maydonlarni to'ldiring!" });
      return;
    }

    setSavingStudent(true);
    setMessage(null);

    try {
      const params = new URLSearchParams({
        full_name: studentFullName.trim(),
        email: studentEmail.trim(),
        password: studentPassword.trim(),
        grade: studentGrade.toString(),
        ...(studentClassId ? { class_id: studentClassId.toString() } : {})
      });

      const res = await fetch(`/api/v1/auth/teacher/create-student?${params.toString()}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "O'quvchini qo'shishda xatolik yuz berdi");
      }

      setMessage({ type: 'success', text: "Yangi o'quvchi muvaffaqiyatli ro'yxatdan o'tkazildi!" });
      setShowStudentModal(false);
      setStudentFullName('');
      setStudentEmail('');
      setStudentPassword('');
      loadStudents();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSavingStudent(false);
    }
  };

  // ================= TAB 5 FUNKSIYALARI: Javoblar va Baholash =================
  const handleGradeSubmission = async () => {
    if (!viewSubmissionModal) return;

    setSubmittingGrade(true);
    try {
      const gradeVal = parseFloat(teacherGradeInput) || 5;
      const res = await fetch(`/api/v1/assignments/submissions/${viewSubmissionModal.id}/grade?teacher_grade=${gradeVal}&feedback=${encodeURIComponent(teacherFeedbackInput)}`, {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Bahoni saqlashda xatolik");
      }

      setMessage({ type: 'success', text: `O'quvchi javobi ${gradeVal} ball bilan baholandi!` });
      setViewSubmissionModal(null);
      if (selectedAssignmentId) loadSubmissions(selectedAssignmentId);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmittingGrade(false);
    }
  };

  const handleDownloadCsv = () => {
    if (!selectedAssignmentId) return;
    window.open(`/api/v1/reports/export-submissions-csv?assignment_id=${selectedAssignmentId}`, '_blank');
  };

  // ================= TAB 6 FUNKSIYALARI: Sozlamalar =================
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileFullName.trim()) {
      setMessage({ type: 'error', text: 'Ism-familiya bo\'sh bo\'lishi mumkin emas' });
      return;
    }

    if (profilePassword && profilePassword.length < 6) {
      setMessage({ type: 'error', text: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak' });
      return;
    }

    if (profilePassword && profilePassword !== profilePasswordConfirm) {
      setMessage({ type: 'error', text: 'Parol tasdig\'i mos kelmadi' });
      return;
    }

    setUpdatingProfile(true);
    setMessage(null);

    try {
      const payload: any = { full_name: profileFullName.trim() };
      if (profilePassword) payload.password = profilePassword;

      const res = await fetch('/api/v1/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Profilni yangilashda xatolik yuz berdi");
      }

      const updatedUser = await res.json();
      localStorage.setItem('eduai_user', JSON.stringify(updatedUser));
      setMessage({ type: 'success', text: "Profil ma'lumotlari muvaffaqiyatli saqlandi!" });
      setProfilePassword('');
      setProfilePasswordConfirm('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Navigatsiya yorliqlari (6 ta tab)
  const tabs = [
    { id: 'home', label: 'Bosh sahifa', icon: LayoutDashboard },
    { id: 'assignments', label: 'Topshiriqlar', icon: FileText },
    { id: 'content', label: 'Kontent', icon: Video },
    { id: 'students', label: "O'quvchilar", icon: Users },
    { id: 'submissions', label: 'Javoblar', icon: MessageSquare },
    { id: 'settings', label: 'Sozlamalar', icon: Settings },
  ] as const;

  const filteredStudents = students.filter(st =>
    st.full_name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    st.email?.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const filteredContents = contents.filter(c => {
    if (contentFilterType === 'all') return true;
    return c.content_type === contentFilterType;
  });

  return (
    <div className="space-y-6">
      <BackButton to="/dashboard" label="Asosiy boshqaruvga qaytish" />
      {/* Yuqori Tab Paneli */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200/80 shadow-sm flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Global Xabar */}
      {message && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 shadow-sm transition animate-fadeIn ${
            message.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-700 text-base">×</button>
        </div>
      )}

      {/* =========================================================================
          TAB 1: BOSH SAHIFA
      ========================================================================== */}
      {activeTab === 'home' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative shadow-lg overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-200 text-xs font-semibold mb-2.5 border border-white/10">
                  <Award className="w-3.5 h-3.5 text-emerald-300" />
                  <span>O'qituvchi Boshqaruv Markazi</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Assalomu alaykum, {user?.full_name}!
                </h1>
                <p className="text-xs sm:text-sm text-emerald-100/90 mt-1.5 max-w-xl leading-relaxed">
                  Sinflaringizni boshqaring, interaktiv topshiriqlar va dars kontentlarini yarating hamda o'quvchilar javoblarini tekshiring.
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => setActiveTab('assignments')}
                  className="px-4 py-2.5 bg-white text-emerald-900 rounded-xl text-xs font-bold hover:bg-emerald-50 transition shadow-sm flex items-center gap-1.5 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Yangi topshiriq</span>
                </button>
                <button
                  onClick={() => setActiveTab('content')}
                  className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 active:scale-95"
                >
                  <Video className="w-4 h-4" />
                  <span>Kontent qo'shish</span>
                </button>
              </div>
            </div>
          </div>

          {/* Ko'rsatkichlar kartochkalari */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => setActiveTab('home')}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 cursor-pointer hover:border-emerald-300 transition"
            >
              <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Biriktirilgan Sinflar</span>
                <h3 className="text-xl font-extrabold text-slate-900">{classes.length} ta sinf</h3>
              </div>
            </div>

            <div
              onClick={() => setActiveTab('assignments')}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 cursor-pointer hover:border-emerald-300 transition"
            >
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mening Topshiriqlarim</span>
                <h3 className="text-xl font-extrabold text-slate-900">{assignments.length} ta faol</h3>
              </div>
            </div>

            <div
              onClick={() => setActiveTab('submissions')}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 cursor-pointer hover:border-emerald-300 transition"
            >
              <div className="p-3 bg-purple-50 text-purple-700 rounded-xl">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kelgan Javoblar</span>
                <h3 className="text-xl font-extrabold text-slate-900">Tekshirish jurnali</h3>
              </div>
            </div>

            <Link
              to="/ai-tutor"
              className="bg-gradient-to-br from-indigo-50 to-violet-50 p-5 rounded-2xl border border-indigo-200 shadow-sm flex items-center gap-4 hover:shadow-md transition group"
            >
              <div className="p-3 bg-indigo-600 text-white rounded-xl group-hover:scale-105 transition">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                  AI Yordamchi
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                </span>
                <h3 className="text-xs font-bold text-slate-800 mt-0.5 group-hover:text-indigo-900">
                  Dars rejasi tuzish uchun AI
                </h3>
              </div>
            </Link>
          </div>

          {/* Asosiy bloklar: Sinflar va Oxirgi topshiriqlar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Sinflarim */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-700" />
                  <span>Biriktirilgan Sinflarim</span>
                </h3>
                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-lg text-slate-600">
                  Jami: {classes.length}
                </span>
              </div>

              <div className="space-y-3">
                {classes.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Hozircha sizga biriktirilgan sinflar mavjud emas.
                  </div>
                ) : (
                  classes.map(c => (
                    <div
                      key={c.id}
                      className="p-4 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 hover:border-emerald-200 transition flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-sm">
                          {c.grade}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{c.name} sinfi</h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {c.grade}-sinf • O'quv yili: {c.academic_year}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold px-3 py-1 bg-white border border-slate-200 rounded-xl text-slate-700 shadow-2xs">
                          {c.student_count || 1} o'quvchi
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Oxirgi topshiriqlar statistikasi */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-700" />
                  <span>Oxirgi Topshiriqlar</span>
                </h3>
                <button
                  onClick={() => setActiveTab('assignments')}
                  className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  <span>Barchasi</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {assignments.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Hozircha topshiriqlar yaratilmagan.
                  </div>
                ) : (
                  assignments.slice(0, 4).map(a => (
                    <div
                      key={a.id}
                      className="p-4 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">{a.title}</h4>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <HelpCircle className="w-3 h-3 text-emerald-600" />
                            {a.questions_count || 1} ta savol
                          </span>
                          {a.due_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {new Date(a.due_date).toLocaleDateString('uz-UZ')}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedAssignmentId(a.id);
                          setActiveTab('submissions');
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                      >
                        <span>Javoblar</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* AI Yordamchi Banner */}
          <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
                <Bot className="w-6 h-6 text-indigo-300" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold flex items-center gap-2">
                  <span>Dars rejasi tuzish uchun AI Yordamchisi</span>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </h3>
                <p className="text-xs text-indigo-200/90 mt-1 max-w-xl leading-relaxed">
                  Sun'iy intellekt orqali 5–11 sinf matematika va ingliz tili darslari uchun metodik reja, topshiriq variantlari va qiziqarli mashqlar yarating.
                </p>
              </div>
            </div>

            <Link
              to="/ai-tutor"
              className="px-5 py-2.5 bg-white text-indigo-950 rounded-xl text-xs font-extrabold hover:bg-indigo-50 transition shadow-md inline-flex items-center gap-1.5 self-start sm:self-auto shrink-0"
            >
              <span>AI Repetitorga o'tish</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      )}

      {/* =========================================================================
          TAB 2: TOPSHIRIQLAR (Dinamik savol konstruktori)
      ========================================================================== */}
      {activeTab === 'assignments' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
                <FileText className="w-3.5 h-3.5" />
                <span>Interaktiv Topshiriq Konstruktori</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">Yangi Topshiriq Yaratish</h2>
              <p className="text-xs text-slate-500 mt-1">
                Sinf tanlang, topshiriq muddatini belgilang va istalgancha savollar (test, matnli, raqamli) qo'shing.
              </p>
            </div>

            <button
              onClick={addQuestion}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ Savol qo'shish</span>
            </button>
          </div>

          <form onSubmit={handleSaveAssignment} className="space-y-6">
            
            {/* Asosiy topshiriq parametrlari */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2">
                Topshiriq Tafsilotlari
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Biriktiriladigan sinf <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={assignClassId}
                    onChange={e => setAssignClassId(Number(e.target.value))}
                    required
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                  >
                    <option value="">Sinfni tanlang</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} sinfi ({c.grade}-sinf)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Topshirish muddati (Deadline)
                  </label>
                  <input
                    type="date"
                    value={assignDueDate}
                    onChange={e => setAssignDueDate(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="font-bold text-slate-700 block mb-1">
                  Topshiriq nomi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={assignTitle}
                  onChange={e => setAssignTitle(e.target.value)}
                  placeholder="Masalan: 1-amaliy ish: Chiziqli tenglamalar va funksiyalar"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                />
              </div>

              <div className="text-xs">
                <label className="font-bold text-slate-700 block mb-1">
                  Yo'riqnoma va ko'rsatmalar
                </label>
                <textarea
                  rows={2}
                  value={assignDesc}
                  onChange={e => setAssignDesc(e.target.value)}
                  placeholder="O'quvchilar ushbu topshiriqda qaysi qoidalarga e'tibor qaratishlari kerak?"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition resize-none"
                />
              </div>
            </div>

            {/* Dinamik savollar ro'yxati */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-extrabold text-slate-900">
                  Savollar ({questions.length} ta)
                </h3>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-bold transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Savol qo'shish</span>
                </button>
              </div>

              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4 relative group"
                >
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-emerald-700 text-white font-extrabold flex items-center justify-center text-xs">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Savol #{idx + 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-slate-500 font-medium">Ball:</span>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={q.points}
                          onChange={e => updateQuestion(q.id, { points: Number(e.target.value) || 10 })}
                          className="w-16 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        />
                      </div>

                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(q.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Savolni o'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Savol matni va turi */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="sm:col-span-2">
                      <label className="font-bold text-slate-700 block mb-1">
                        Savol matni <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={q.question_text}
                        onChange={e => updateQuestion(q.id, { question_text: e.target.value })}
                        placeholder="Savol shartini to'liq kiriting..."
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition resize-none"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Savol turi
                      </label>
                      <select
                        value={q.question_type}
                        onChange={e => updateQuestion(q.id, {
                          question_type: e.target.value as any,
                          correct_answer: ''
                        })}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
                      >
                        <option value="multiple_choice">Variantli test</option>
                        <option value="numeric">Raqamli javob</option>
                        <option value="text">Matnli ochiq javob</option>
                      </select>
                    </div>
                  </div>

                  {/* Rasm yuklash qismi */}
                  <div className="text-xs">
                    <label className="font-bold text-slate-700 block mb-1.5">
                      Savolga rasm biriktirish (Ixtiyoriy)
                    </label>
                    
                    {q.imagePreview ? (
                      <div className="relative inline-block border border-slate-200 rounded-2xl p-2 bg-slate-50">
                        <img
                          src={q.imagePreview}
                          alt={`Savol ${idx + 1}`}
                          className="max-h-48 max-w-xs rounded-xl object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => removeQuestionImage(q.id)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-rose-600 text-white rounded-full flex items-center justify-center text-xs shadow hover:bg-rose-700 transition"
                          title="Rasmni o'chirish"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-slate-600 cursor-pointer hover:bg-slate-100 hover:border-emerald-500 transition w-fit">
                        <ImageIcon className="w-4 h-4 text-emerald-600" />
                        <span>Rasm yuklash (png, jpg, webp)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => handleImageUpload(q.id, e)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Variantlar yoki javob maydoni */}
                  {q.question_type === 'multiple_choice' && (
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <label className="text-xs font-bold text-slate-700 block">
                        Test variantlari va to'g'ri javobni tanlang:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {['A', 'B', 'C', 'D'].map((letter, optIdx) => {
                          const isCorrect = q.correct_answer === letter || q.correct_answer === q.options[optIdx];
                          return (
                            <div
                              key={letter}
                              className={`flex items-center gap-2 p-2.5 rounded-xl border transition ${
                                isCorrect
                                  ? 'bg-emerald-50 border-emerald-400'
                                  : 'bg-slate-50 border-slate-200'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => updateQuestion(q.id, { correct_answer: letter })}
                                className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition shrink-0 ${
                                  isCorrect
                                    ? 'bg-emerald-700 text-white'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                {letter}
                              </button>
                              <input
                                type="text"
                                value={q.options[optIdx] || ''}
                                onChange={e => {
                                  const newOpts = [...q.options];
                                  newOpts[optIdx] = e.target.value;
                                  updateQuestion(q.id, { options: newOpts });
                                }}
                                placeholder={`${letter} varianti matni`}
                                className="w-full bg-transparent text-xs text-slate-800 focus:outline-none"
                              />
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        * To'g'ri javob deb belgilash uchun variant harfi (A, B, C, D) ustiga bosing.
                      </p>
                    </div>
                  )}

                  {q.question_type !== 'multiple_choice' && (
                    <div className="pt-2 border-t border-slate-100 text-xs">
                      <label className="font-bold text-slate-700 block mb-1">
                        To'g'ri javob <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type={q.question_type === 'numeric' ? 'number' : 'text'}
                        step="any"
                        required
                        value={q.correct_answer}
                        onChange={e => updateQuestion(q.id, { correct_answer: e.target.value })}
                        placeholder={q.question_type === 'numeric' ? 'Masalan: 42 yoki -3.5' : "To'g'ri javob matni..."}
                        className="w-full sm:w-96 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-semibold"
                      />
                    </div>
                  )}

                </div>
              ))}
            </div>

            {/* Saqlash tugmasi */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={savingAssignment}
                className="px-8 py-3 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-2xl font-bold shadow-md shadow-emerald-700/20 active:scale-95 transition flex items-center gap-2"
              >
                {savingAssignment ? (
                  <span>Saqlanmoqda...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Topshiriqni e'lon qilish</span>
                  </>
                )}
              </button>
            </div>

          </form>

        </div>
      )}

      {/* =========================================================================
          TAB 3: KONTENT (Teorema/Video)
      ========================================================================== */}
      {activeTab === 'content' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mb-2">
                <Video className="w-3.5 h-3.5" />
                <span>O'quv Resurslari va Darslar</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">Ta'limiy Kontentlar</h2>
              <p className="text-xs text-slate-500 mt-1">
                Maktab o'quvchilari uchun qoida/teoremalar va interaktiv video darsliklar qo'shing.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => setShowTheoryModal(true)}
                className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Teorema/Qoida qo'shish</span>
              </button>
              <button
                onClick={() => setShowVideoModal(true)}
                className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Video dars qo'shish</span>
              </button>
            </div>
          </div>

          {/* Filtr va Jadval */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Tur bo'yicha:</span>
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
                  <button
                    onClick={() => setContentFilterType('all')}
                    className={`px-3 py-1 rounded-lg font-bold transition ${
                      contentFilterType === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Barchasi
                  </button>
                  <button
                    onClick={() => setContentFilterType('theory')}
                    className={`px-3 py-1 rounded-lg font-bold transition ${
                      contentFilterType === 'theory' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Teoremalar
                  </button>
                  <button
                    onClick={() => setContentFilterType('video')}
                    className={`px-3 py-1 rounded-lg font-bold transition ${
                      contentFilterType === 'video' ? 'bg-blue-700 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Videolar
                  </button>
                </div>
              </div>

              <span className="text-xs font-semibold text-slate-500">
                Jami: <strong>{filteredContents.length} ta kontent</strong>
              </span>
            </div>

            {filteredContents.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Hozircha kontentlar mavjud emas. Yuqoridagi tugmalar orqali ilk materialni yuklang!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">Sarlavha</th>
                      <th className="py-3 px-4">Turi</th>
                      <th className="py-3 px-4">Sinf</th>
                      <th className="py-3 px-4">Ko'rishlar</th>
                      <th className="py-3 px-4">Holati</th>
                      <th className="py-3 px-4">Sana</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredContents.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-500">#{c.id}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{c.title}</td>
                        <td className="py-3.5 px-4">
                          {c.content_type === 'theory' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              <BookOpen className="w-3 h-3" />
                              Teorema / Qoida
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                              <Video className="w-3 h-3" />
                              Video darslik
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">{c.grade ? `${c.grade}-sinf` : 'Umumiy'}</td>
                        <td className="py-3.5 px-4 text-slate-600 font-bold">{c.view_count || 0} marta</td>
                        <td className="py-3.5 px-4">
                          {c.status === 'approved' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Check className="w-3 h-3" />
                              Tasdiqlangan
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3" />
                              Ko'rib chiqilmoqda
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {c.created_at ? new Date(c.created_at).toLocaleDateString('uz-UZ') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal a: Teorema qo'shish */}
          {showTheoryModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-scaleUp">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-emerald-700" />
                    <span>Yangi Teorema / Qoida Qo'shish</span>
                  </h3>
                  <button onClick={() => setShowTheoryModal(false)} className="text-slate-400 hover:text-slate-700 text-lg">×</button>
                </div>

                <form onSubmit={handleCreateTheory} className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Sarlavha <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={theoryTitle}
                      onChange={e => setTheoryTitle(e.target.value)}
                      placeholder="Masalan: Pifagor teoremasi va geometrik isboti"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Fan</label>
                      <select
                        value={theorySubjectId}
                        onChange={e => setTheorySubjectId(Number(e.target.value))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      >
                        {subjects.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Sinf</label>
                      <select
                        value={theoryGrade}
                        onChange={e => setTheoryGrade(Number(e.target.value))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      >
                        {[5, 6, 7, 8, 9, 10, 11].map(g => (
                          <option key={g} value={g}>{g}-sinf</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Kontent matni (Markdown) <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={6}
                      required
                      value={theoryContent}
                      onChange={e => setTheoryContent(e.target.value)}
                      placeholder="Qoida formulalari, ta'rifi va misollarni markdown ko'rinishida yozing..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono text-xs resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowTheoryModal(false)}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      disabled={submittingTheory}
                      className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-xl font-bold transition shadow-sm"
                    >
                      {submittingTheory ? "Saqlanmoqda..." : "Saqlash"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal b: Video dars qo'shish */}
          {showVideoModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-scaleUp">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Video className="w-5 h-5 text-blue-700" />
                    <span>Yangi Video Darslik Qo'shish</span>
                  </h3>
                  <button onClick={() => setShowVideoModal(false)} className="text-slate-400 hover:text-slate-700 text-lg">×</button>
                </div>

                <form onSubmit={handleCreateVideo} className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Video Sarlavhasi <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={videoTitle}
                      onChange={e => setVideoTitle(e.target.value)}
                      placeholder="Masalan: Tenglamalar sistemasini grafik usulda yechish"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Fan</label>
                      <select
                        value={videoSubjectId}
                        onChange={e => setVideoSubjectId(Number(e.target.value))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        {subjects.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Sinf</label>
                      <select
                        value={videoGrade}
                        onChange={e => setVideoGrade(Number(e.target.value))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        {[5, 6, 7, 8, 9, 10, 11].map(g => (
                          <option key={g} value={g}>{g}-sinf</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-2">Video manbai</label>
                    <div className="flex gap-4 mb-2">
                      <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                        <input
                          type="radio"
                          name="video_source"
                          checked={videoSourceType === 'url'}
                          onChange={() => setVideoSourceType('url')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span>YouTube / URL havola</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                        <input
                          type="radio"
                          name="video_source"
                          checked={videoSourceType === 'file'}
                          onChange={() => setVideoSourceType('file')}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span>Video fayl yuklash</span>
                      </label>
                    </div>

                    {videoSourceType === 'url' ? (
                      <input
                        type="url"
                        value={videoUrl}
                        onChange={e => setVideoUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                      />
                    ) : (
                      <input
                        type="file"
                        accept="video/*"
                        onChange={e => setVideoFile(e.target.files?.[0] || null)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      />
                    )}
                  </div>

                  {/* Dinamik videoga oid savollar */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex justify-between items-center">
                      <label className="font-bold text-slate-700">
                        Videoga oid savollar ({videoQuestions.length})
                      </label>
                      <button
                        type="button"
                        onClick={() => setVideoQuestions(prev => [...prev, { question: '', timestamp: '01:00', answer: '' }])}
                        className="text-xs text-blue-700 font-bold hover:underline"
                      >
                        + Savol qo'shish
                      </button>
                    </div>

                    {videoQuestions.map((vq, vIdx) => (
                      <div key={vIdx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800">#{vIdx + 1}-savol</span>
                          <button
                            type="button"
                            onClick={() => setVideoQuestions(prev => prev.filter((_, i) => i !== vIdx))}
                            className="text-rose-500 hover:text-rose-700 text-xs font-bold"
                          >
                            O'chirish
                          </button>
                        </div>
                        <input
                          type="text"
                          value={vq.question}
                          onChange={e => {
                            const updated = [...videoQuestions];
                            updated[vIdx].question = e.target.value;
                            setVideoQuestions(updated);
                          }}
                          placeholder="Savol matni"
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={vq.timestamp}
                            onChange={e => {
                              const updated = [...videoQuestions];
                              updated[vIdx].timestamp = e.target.value;
                              setVideoQuestions(updated);
                            }}
                            placeholder="Vaqti (02:15)"
                            className="p-2 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                          <input
                            type="text"
                            value={vq.answer}
                            onChange={e => {
                              const updated = [...videoQuestions];
                              updated[vIdx].answer = e.target.value;
                              setVideoQuestions(updated);
                            }}
                            placeholder="To'g'ri javob"
                            className="p-2 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowVideoModal(false)}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      disabled={submittingVideo}
                      className="px-5 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white rounded-xl font-bold transition shadow-sm"
                    >
                      {submittingVideo ? "Yuklanmoqda..." : "Videoni saqlash"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

      {/* =========================================================================
          TAB 4: O'QUVCHILAR
      ========================================================================== */}
      {activeTab === 'students' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 text-violet-800 text-xs font-bold mb-2">
                <Users className="w-3.5 h-3.5" />
                <span>Maktab O'quvchilari Kontingenti</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">O'quvchilar Ro'yxati</h2>
              <p className="text-xs text-slate-500 mt-1">
                Faqat sizning maktabingizga tegishli ro'yxatdan o'tgan o'quvchilar profillari
              </p>
            </div>

            <button
              onClick={() => setShowStudentModal(true)}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ Yangi o'quvchi qo'shish</span>
            </button>
          </div>

          {/* Qidiruv va O'quvchilar jadvali */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden space-y-3">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  placeholder="Ism yoki login bo'yicha qidiruv..."
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <span className="text-xs font-semibold text-slate-500">
                Topildi: <strong>{filteredStudents.length} nafar o'quvchi</strong>
              </span>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                O'quvchilar topilmadi yoki hali o'quvchilar qo'shilmagan.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">O'quvchi</th>
                      <th className="py-3 px-4">Login (Email)</th>
                      <th className="py-3 px-4">Sinfi</th>
                      <th className="py-3 px-4">Holati</th>
                      <th className="py-3 px-4">Ro'yxatdan o'tgan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map(st => (
                      <tr key={st.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
                            {st.full_name?.charAt(0) || 'O'}
                          </div>
                          <span>{st.full_name}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">{st.email}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {st.grade ? `${st.grade}-sinf` : '—'}
                        </td>
                        <td className="py-3.5 px-4">
                          {st.is_active ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              Faol
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                              Nofaol
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {new Date(st.created_at).toLocaleDateString('uz-UZ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* O'quvchi qo'shish modali */}
          {showStudentModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4 animate-scaleUp">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-emerald-700" />
                    <span>Yangi O'quvchi Qo'shish</span>
                  </h3>
                  <button onClick={() => setShowStudentModal(false)} className="text-slate-400 hover:text-slate-700 text-lg">×</button>
                </div>

                <form onSubmit={handleCreateStudent} className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      To'liq ism (F.I.SH) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={studentFullName}
                      onChange={e => setStudentFullName(e.target.value)}
                      placeholder="Masalan: Xusanov Xumoyun"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Login / Pochta <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={studentEmail}
                      onChange={e => setStudentEmail(e.target.value)}
                      placeholder="khusanov yoki xumoyun"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Boshlang'ich parol <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={studentPassword}
                      onChange={e => setStudentPassword(e.target.value)}
                      placeholder="Kamida 6 ta belgi"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Sinf darajasi</label>
                      <select
                        value={studentGrade}
                        onChange={e => setStudentGrade(Number(e.target.value))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      >
                        {[5, 6, 7, 8, 9, 10, 11].map(g => (
                          <option key={g} value={g}>{g}-sinf</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Sinf guruhi</label>
                      <select
                        value={studentClassId}
                        onChange={e => setStudentClassId(Number(e.target.value))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      >
                        <option value="">Biriktirmaslik</option>
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowStudentModal(false)}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      disabled={savingStudent}
                      className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-xl font-bold transition shadow-sm"
                    >
                      {savingStudent ? "Saqlanmoqda..." : "O'quvchini yaratish"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

      {/* =========================================================================
          TAB 5: JAVOBLAR (Submissions & Baholash)
      ========================================================================== */}
      {activeTab === 'submissions' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold mb-2">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Tekshirish va Baholash Jurnali</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">O'quvchilar Topshiriq Javoblari</h2>
              <p className="text-xs text-slate-500 mt-1">
                Topshiriqni tanlang, o'quvchilar javoblarini tahlil qiling va baho qo'ying.
              </p>
            </div>

            {selectedAssignmentId && (
              <button
                onClick={handleDownloadCsv}
                className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm self-start sm:self-auto"
              >
                <Download className="w-4 h-4" />
                <span>CSV eksport</span>
              </button>
            )}
          </div>

          {/* Topshiriq tanlash qutisi */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="text-xs font-bold text-slate-700 shrink-0">
              Qaysi topshiriq natijalari kerak?
            </label>
            <select
              value={selectedAssignmentId || ''}
              onChange={e => setSelectedAssignmentId(Number(e.target.value))}
              className="w-full sm:w-96 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              {assignments.map(a => (
                <option key={a.id} value={a.id}>
                  {a.title} (#{a.id})
                </option>
              ))}
            </select>
          </div>

          {/* Natijalar jadvali */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Topshirilgan ishlar
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Jami topshirganlar: <strong>{submissions.length} nafar</strong>
              </span>
            </div>

            {loadingSubmissions ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Javoblar yuklanmoqda...
              </div>
            ) : submissions.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Hozircha ushbu topshiriq bo'yicha javoblar kelib tushmagan.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">O'quvchi ID</th>
                      <th className="py-3 px-4">To'plangan Ball</th>
                      <th className="py-3 px-4">Ustoz Bahosi</th>
                      <th className="py-3 px-4">Izoh</th>
                      <th className="py-3 px-4">Topshirilgan sana</th>
                      <th className="py-3 px-4 text-right">Amal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {submissions.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          O'quvchi #{s.student_id}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-extrabold text-blue-700 text-sm">{s.score}</span>
                          <span className="text-slate-400 text-[11px]"> / {s.max_score} ball</span>
                        </td>
                        <td className="py-3.5 px-4">
                          {(s as any).teacher_grade !== undefined && (s as any).teacher_grade !== null ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
                              <Star className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                              {(s as any).teacher_grade}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Baholanmagan</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                          {s.teacher_feedback || 'Izoh yo\'q'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {new Date(s.submitted_at).toLocaleString('uz-UZ')}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setViewSubmissionModal(s);
                              setTeacherGradeInput((s as any).teacher_grade?.toString() || '5');
                              setTeacherFeedbackInput(s.teacher_feedback || '');
                            }}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold transition inline-flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Baho qo'yish</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Baholash va Javoblarni ko'rish modali */}
          {viewSubmissionModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-scaleUp">
                
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      O'quvchi #{viewSubmissionModal.student_id} Javobi
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Topshirilgan vaqt: {new Date(viewSubmissionModal.submitted_at).toLocaleString('uz-UZ')}
                    </p>
                  </div>
                  <button onClick={() => setViewSubmissionModal(null)} className="text-slate-400 hover:text-slate-700 text-lg">×</button>
                </div>

                {/* Test natijalari ko'rsatkichi */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 font-medium block">Avtomatik hisoblangan ball:</span>
                    <span className="text-lg font-extrabold text-blue-700">
                      {viewSubmissionModal.score} / {viewSubmissionModal.max_score} ball
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-full font-bold bg-blue-100 text-blue-800">
                    {Math.round((viewSubmissionModal.score / (viewSubmissionModal.max_score || 100)) * 100)}% to'g'ri
                  </span>
                </div>

                {/* Javoblar JSON (agar mavjud bo'lsa) */}
                {(viewSubmissionModal as any).answers_json && (
                  <div className="space-y-1.5 text-xs">
                    <span className="font-bold text-slate-700 block">O'quvchi kiritgan javoblar:</span>
                    <div className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-xs overflow-x-auto max-h-40">
                      {JSON.stringify(JSON.parse((viewSubmissionModal as any).answers_json || '{}'), null, 2)}
                    </div>
                  </div>
                )}

                {/* Baho qo'yish formasi */}
                <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-bold text-slate-700">
                        O'qituvchi Bahosi (0 - 5 ball yoki 0 - 100 ball)
                      </label>
                      <span className="text-sm font-extrabold text-emerald-700">
                        {teacherGradeInput} ball
                      </span>
                    </div>

                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="0.5"
                      value={teacherGradeInput}
                      onChange={e => setTeacherGradeInput(e.target.value)}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 mb-2"
                    />

                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Yoki aniq qiymat kiriting:</span>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={teacherGradeInput}
                        onChange={e => setTeacherGradeInput(e.target.value)}
                        className="w-20 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Ustoz izohi (Feedback)
                    </label>
                    <textarea
                      rows={3}
                      value={teacherFeedbackInput}
                      onChange={e => setTeacherFeedbackInput(e.target.value)}
                      placeholder="Barakalla, hisob-kitoblar to'g'ri. 3-savolda yana bir bor e'tibor bering."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none font-medium"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setViewSubmissionModal(null)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 text-xs"
                  >
                    Yopish
                  </button>
                  <button
                    type="button"
                    disabled={submittingGrade}
                    onClick={handleGradeSubmission}
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-xl font-bold transition shadow-sm text-xs flex items-center gap-1.5"
                  >
                    {submittingGrade ? "Saqlanmoqda..." : "Bahoni qayd etish"}
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

      {/* =========================================================================
          TAB 6: SOZLAMALAR (Profil tahrirlash)
      ========================================================================== */}
      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-2xl animate-fadeIn">
          
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold mb-2">
              <Settings className="w-3.5 h-3.5" />
              <span>Shaxsiy Kabinet Sozlamalari</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">Profil Ma'lumotlarini Yangilash</h2>
            <p className="text-xs text-slate-500 mt-1">
              Ism-familiyangiz va tizimga kirish parolingizni xavfsiz o'zgartiring.
            </p>
          </div>

          <form onSubmit={handleUpdateProfile} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5 text-xs">
            
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                To'liq Ism-Familiya <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={profileFullName}
                onChange={e => setProfileFullName(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Elektron pochta / Login
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-mono cursor-not-allowed"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Login pochtasini o'zgartirish faqat maktab koordinatori yoki admin tomonidan amalga oshiriladi.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-4">
              <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-700" />
                <span>Parolni yangilash (Ixtiyoriy)</span>
              </h3>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Yangi parol
                </label>
                <input
                  type="password"
                  value={profilePassword}
                  onChange={e => setProfilePassword(e.target.value)}
                  placeholder="Agar parolni o'zgartirmoqchi bo'lsangiz, kiriting"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Yangi parolni tasdiqlang
                </label>
                <input
                  type="password"
                  value={profilePasswordConfirm}
                  onChange={e => setProfilePasswordConfirm(e.target.value)}
                  placeholder="Yangi parolni qayta kiriting"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={updatingProfile}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-xl font-bold transition shadow-sm active:scale-95"
              >
                {updatingProfile ? "Saqlanmoqda..." : "O'zgarishlarni saqlash"}
              </button>
            </div>

          </form>

        </div>
      )}

    </div>
  );
};
