import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { BackButton } from '../components/BackButton';
import {
  Building2, Users, GraduationCap, School, Code, Plus,
  CheckCircle, XCircle, Search, Eye, AlertCircle, Phone,
  CreditCard, FileText, Briefcase, Award, Sparkles, RefreshCw
} from 'lucide-react';

export const SchoolAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'teachers' | 'classes' | 'projects'>('overview');
  
  // Data states
  const [schoolData, setSchoolData] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Modals
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Student Form
  const [studentForm, setStudentForm] = useState({
    full_name: '',
    father_name: '',
    login: '',
    password: '',
    class_id: '',
    document_number: '',
    pinfl: '',
    student_id_code: ''
  });

  // Teacher Form
  const [teacherForm, setTeacherForm] = useState({
    full_name: '',
    login: '',
    password: '',
    pinfl: '',
    education_level: 'Oliy',
    position: 'Matematika fani o\'qituvchisi',
    salary: '',
    phone: '',
    assigned_class_ids: [] as number[]
  });

  // Class Form
  const [classForm, setClassForm] = useState({
    name: '',
    grade: 9
  });

  // Filter
  const [searchQuery, setSearchQuery] = useState('');

  const token = localStorage.getItem('eduai_token');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  useEffect(() => {
    loadAllData();
  }, [user]);

  const loadAllData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // 1. Fetch Classes
      const clsRes = await fetch('/api/v1/classes/', { headers });
      const clsData = clsRes.ok ? await clsRes.json() : [];
      setClasses(clsData);

      // 2. Fetch Users (students and teachers)
      const usersRes = await fetch('/api/v1/admin/users', { headers });
      if (usersRes.ok) {
        const allUsers = await usersRes.json();
        const mySchoolId = user?.school_id;
        const schoolStudents = allUsers.filter((u: any) => 
          u.role === 'student' && (!mySchoolId || u.school_id === mySchoolId)
        );
        const schoolTeachers = allUsers.filter((u: any) => 
          u.role === 'teacher' && (!mySchoolId || u.school_id === mySchoolId)
        );
        setStudents(schoolStudents);
        setTeachers(schoolTeachers);
      }

      // 3. Fetch Projects
      const projRes = await fetch('/api/v1/projects', { headers });
      if (projRes.ok) {
        const projData = await projRes.json();
        setProjects(projData);
      }

      // 4. Fetch Schools list to find current school info
      const schRes = await fetch('/api/v1/schools', { headers });
      if (schRes.ok) {
        const schList = await schRes.json();
        const found = schList.find((s: any) => s.id === user?.school_id) || schList[0];
        setSchoolData(found);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!user || (user.role !== 'school_admin' && user.role !== 'admin')) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.class_id) {
      setFeedback({ type: 'error', msg: 'Iltimos, o\'quvchi biriktiriladigan sinfni tanlang' });
      return;
    }
    setSubmitting(true);
    try {
      const params = new URLSearchParams({
        full_name: studentForm.full_name,
        login: studentForm.login,
        password: studentForm.password,
        class_id: studentForm.class_id,
        father_name: studentForm.father_name,
        document_number: studentForm.document_number,
        pinfl: studentForm.pinfl,
        student_id_code: studentForm.student_id_code
      });

      const res = await fetch(`/api/v1/auth/school-admin/create-student?${params.toString()}`, {
        method: 'POST',
        headers
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'O\'quvchi qo\'shishda xatolik yuz berdi');
      }

      setFeedback({ type: 'success', msg: 'Yangi o\'quvchi muvaffaqiyatli ro\'yxatga olindi!' });
      setShowStudentModal(false);
      setStudentForm({
        full_name: '', father_name: '', login: '', password: '',
        class_id: '', document_number: '', pinfl: '', student_id_code: ''
      });
      loadAllData();
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const params = new URLSearchParams({
        full_name: teacherForm.full_name,
        login: teacherForm.login,
        password: teacherForm.password,
        pinfl: teacherForm.pinfl,
        education_level: teacherForm.education_level,
        position: teacherForm.position,
        phone: teacherForm.phone,
        ...(teacherForm.salary ? { salary: teacherForm.salary } : {})
      });

      const res = await fetch(`/api/v1/auth/school-admin/create-teacher?${params.toString()}`, {
        method: 'POST',
        headers
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'O\'qituvchi qo\'shishda xatolik yuz berdi');
      }

      setFeedback({ type: 'success', msg: 'Yangi o\'qituvchi muvaffaqiyatli saqlandi!' });
      setShowTeacherModal(false);
      setTeacherForm({
        full_name: '', login: '', password: '', pinfl: '',
        education_level: 'Oliy', position: 'Matematika fani o\'qituvchisi',
        salary: '', phone: '', assigned_class_ids: []
      });
      loadAllData();
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/classes/', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: classForm.name,
          grade: Number(classForm.grade),
          academic_year: '2026-2027'
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Sinf yaratishda xatolik');
      }

      setFeedback({ type: 'success', msg: `${classForm.name} sinfi muvaffaqiyatli qo'shildi!` });
      setShowClassModal(false);
      setClassForm({ name: '', grade: 9 });
      loadAllData();
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleProjectReview = async (id: number, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/v1/projects/${id}/review`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          status,
          review_notes: status === 'approved' 
            ? 'Maktab admini tomonidan IT Yoshlar ko\'rgazmasiga tasdiqlandi.' 
            : 'Qayta ishlash tavsiya etildi.'
        })
      });
      if (!res.ok) throw new Error('Statusni yangilashda xatolik');
      setFeedback({ type: 'success', msg: `Loyiha ${status === 'approved' ? 'tasdiqlandi' : 'rad etildi'}` });
      loadAllData();
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Orqaga qaytish tugmasi */}
      <BackButton to="/dashboard" label="Asosiy boshqaruvga qaytish" />

      {/* Sarlavha kartochkasi */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold mb-2 backdrop-blur-md">
              <Building2 className="w-3.5 h-3.5" />
              <span>{schoolData?.name || 'Maktab Ma\'muriyati'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Maktab Admini (Zam Direktor) Boshqaruv Markazi
            </h1>
            <p className="text-sm text-blue-100 mt-1 max-w-xl">
              Maktab o'quvchilari va o'qituvchilari hisoblarini yuritish, yangi sinflar ochish hamda IT Yoshlar tashabbusi loyihalarini nazorat qilish paneli.
            </p>
          </div>
          <button
            onClick={loadAllData}
            className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition backdrop-blur-md"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Yangilash</span>
          </button>
        </div>
      </div>

      {/* Xabarnoma / Feedback */}
      {feedback && (
        <div className={`p-4 rounded-2xl flex items-center justify-between text-sm ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
            <span>{feedback.msg}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs font-bold hover:underline">Yopish</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 bg-white/80 backdrop-blur-md rounded-2xl p-1.5 border border-slate-200/80 shadow-sm">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
            activeTab === 'overview' ? 'bg-blue-700 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Maktab Ko'rsatkichlari</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
            activeTab === 'students' ? 'bg-blue-700 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>O'quvchilar ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('teachers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
            activeTab === 'teachers' ? 'bg-blue-700 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>O'qituvchilar ({teachers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('classes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
            activeTab === 'classes' ? 'bg-blue-700 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <School className="w-4 h-4" />
          <span>Sinflar ({classes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
            activeTab === 'projects' ? 'bg-blue-700 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>IT Yoshlar Loyihalari</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">O'quvchilar</span>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">{students.length}</p>
              <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">Faol o'quvchilar</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">O'qituvchilar</span>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">{teachers.length}</p>
              <span className="text-xs text-indigo-600 font-semibold mt-1 inline-block">Ustozlar jamoasi</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sinflar</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <School className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">{classes.length}</p>
              <span className="text-xs text-slate-500 mt-1 inline-block">O'quv xonalari</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">IT Loyihalar</span>
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center">
                  <Code className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-violet-700 mt-2">{projects.length}</p>
              <span className="text-xs text-violet-600 font-semibold mt-1 inline-block">IT Yoshlar tashabbusi</span>
            </div>
          </div>

          {/* Maktab haqida ma'lumot */}
          {schoolData && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-700" />
                <span>Maktab Profil Ma'lumotlari</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <span className="text-xs text-slate-500 block">Hudud & Tuman</span>
                  <p className="font-bold text-slate-800 mt-0.5">{schoolData.region || 'Toshkent shahar'}, {schoolData.district_name || 'Chilonzor tumani'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <span className="text-xs text-slate-500 block">Manzil</span>
                  <p className="font-bold text-slate-800 mt-0.5">{schoolData.address || 'Ko\'rsatilmagan'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <span className="text-xs text-slate-500 block">Direktor / Aloqa</span>
                  <p className="font-bold text-slate-800 mt-0.5">{schoolData.director_name || 'Direktor'} ({schoolData.director_phone || schoolData.phone || '+998 71 200-00-00'})</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STUDENTS */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Maktab O'quvchilari</h2>
              <p className="text-xs text-slate-500 mt-0.5">Sinflarga biriktirilgan o'quvchilar va ularning davlat standart kodi</p>
            </div>
            <button
              onClick={() => setShowStudentModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Yangi O'quvchi Qo'shish</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Ism yoki login bo'yicha qidirish..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">ID</th>
                  <th className="py-3 px-3">F.I.SH.</th>
                  <th className="py-3 px-3">Login / Email</th>
                  <th className="py-3 px-3">Sinf</th>
                  <th className="py-3 px-3">JSHSHIR (PINFL)</th>
                  <th className="py-3 px-3">ERP Kodi</th>
                  <th className="py-3 px-3">Guvohnoma</th>
                  <th className="py-3 px-3">Holat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students
                  .filter(s => s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || s.email?.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(st => (
                    <tr key={st.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-mono text-slate-500">#{st.id}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{st.full_name}</td>
                      <td className="py-3 px-3 text-slate-600">{st.username || st.email}</td>
                      <td className="py-3 px-3">
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md font-semibold">
                          {st.grade}-sinf
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">{st.pinfl || '-'}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">{st.student_id_code || '-'}</td>
                      <td className="py-3 px-3 text-slate-600">{st.document_number || '-'}</td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                          <CheckCircle className="w-3.5 h-3.5" /> Faol
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TEACHERS */}
      {activeTab === 'teachers' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Maktab O'qituvchilari (Ustozlar)</h2>
              <p className="text-xs text-slate-500 mt-0.5">O'qituvchilar tarkibi, lavozimi va biriktirilgan sinflar</p>
            </div>
            <button
              onClick={() => setShowTeacherModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Yangi O'qituvchi Qo'shish</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">ID</th>
                  <th className="py-3 px-3">F.I.SH.</th>
                  <th className="py-3 px-3">Login</th>
                  <th className="py-3 px-3">Lavozimi & Fan</th>
                  <th className="py-3 px-3">Ma'lumoti</th>
                  <th className="py-3 px-3">PINFL</th>
                  <th className="py-3 px-3">Telefon</th>
                  <th className="py-3 px-3">Oylik maoshi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teachers.map(tc => (
                  <tr key={tc.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-mono text-slate-500">#{tc.id}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{tc.full_name}</td>
                    <td className="py-3 px-3 text-slate-600">{tc.username || tc.email}</td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{tc.position || 'O\'qituvchi'}</td>
                    <td className="py-3 px-3">{tc.education_level || 'Oliy'}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">{tc.pinfl || '-'}</td>
                    <td className="py-3 px-3 text-slate-600">{tc.phone || '-'}</td>
                    <td className="py-3 px-3 font-bold text-emerald-700">
                      {tc.salary ? `${tc.salary.toLocaleString()} so'm` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CLASSES */}
      {activeTab === 'classes' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Maktab Sinflari</h2>
              <p className="text-xs text-slate-500 mt-0.5">Joriy o'quv yilida ro'yxatga olingan sinflar</p>
            </div>
            <button
              onClick={() => setShowClassModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Yangi Sinf Ochish</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map(cls => (
              <div key={cls.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-black text-slate-900">{cls.name}</span>
                  <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                    {cls.grade}-sinf
                  </span>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center text-xs text-slate-600">
                  <span>O'quv yili: {cls.academic_year || '2026-2027'}</span>
                  <span className="font-semibold text-blue-700">{cls.student_count || 0} o'quvchi</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: PROJECTS */}
      {activeTab === 'projects' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">IT Yoshlar Loyihalari Moderatsiyasi</h2>
            <p className="text-xs text-slate-500 mt-0.5">O'quvchilar tomonidan yuklangan IT loyihalarni ko'rikdan o'tkazish va tasdiqlash</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map(p => (
              <div key={p.id} className="p-5 rounded-2xl border border-slate-200 hover:shadow-md transition space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-base text-slate-900">{p.title}</h4>
                    <span className="text-xs text-violet-700 font-semibold uppercase">{p.category}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    p.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                    p.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {p.status === 'approved' ? 'Tasdiqlangan' : p.status === 'rejected' ? 'Rad etilgan' : 'Kutilmoqda'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2">{p.description}</p>

                <div className="text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">Muallif:</span> {p.owner_name || 'O\'quvchi'} | {p.team_members || 'Yakka muallif'}
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  {p.status !== 'approved' && (
                    <button
                      onClick={() => handleProjectReview(p.id, 'approved')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Tasdiqlash</span>
                    </button>
                  )}
                  {p.status !== 'rejected' && (
                    <button
                      onClick={() => handleProjectReview(p.id, 'rejected')}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Rad etish</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: CREATE STUDENT */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">Yangi O'quvchi Qo'shish</h3>
              <button onClick={() => setShowStudentModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">To'liq F.I.SH. *</label>
                <input
                  required
                  value={studentForm.full_name}
                  onChange={e => setStudentForm({ ...studentForm, full_name: e.target.value })}
                  placeholder="Masalan: Xusanov Xumoyun"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Otasining ismi</label>
                <input
                  value={studentForm.father_name}
                  onChange={e => setStudentForm({ ...studentForm, father_name: e.target.value })}
                  placeholder="G'anisher o'g'li"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Login (Erkin username) *</label>
                  <input
                    required
                    value={studentForm.login}
                    onChange={e => setStudentForm({ ...studentForm, login: e.target.value })}
                    placeholder="khusanov yoki xumoyun"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Parol *</label>
                  <input
                    required
                    type="password"
                    value={studentForm.password}
                    onChange={e => setStudentForm({ ...studentForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Biriktiriladigan Sinf *</label>
                <select
                  required
                  value={studentForm.class_id}
                  onChange={e => setStudentForm({ ...studentForm, class_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="">-- Sinfni tanlang --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.grade}-sinf)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">JSHSHIR (PINFL)</label>
                  <input
                    value={studentForm.pinfl}
                    onChange={e => setStudentForm({ ...studentForm, pinfl: e.target.value })}
                    placeholder="14 xonali raqam"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">ERP / ID Kodi</label>
                  <input
                    value={studentForm.student_id_code}
                    onChange={e => setStudentForm({ ...studentForm, student_id_code: e.target.value })}
                    placeholder="ERP-10293"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Guvohnoma / Pasport</label>
                  <input
                    value={studentForm.document_number}
                    onChange={e => setStudentForm({ ...studentForm, document_number: e.target.value })}
                    placeholder="AA 1234567"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowStudentModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold transition shadow-md disabled:bg-slate-300"
                >
                  {submitting ? 'Saqlanmoqda...' : 'O\'quvchini saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE TEACHER */}
      {showTeacherModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">Yangi O'qituvchi Qo'shish</h3>
              <button onClick={() => setShowTeacherModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateTeacher} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">To'liq F.I.SH. *</label>
                <input
                  required
                  value={teacherForm.full_name}
                  onChange={e => setTeacherForm({ ...teacherForm, full_name: e.target.value })}
                  placeholder="Masalan: O'roqova Saodat"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Login *</label>
                  <input
                    required
                    value={teacherForm.login}
                    onChange={e => setTeacherForm({ ...teacherForm, login: e.target.value })}
                    placeholder="uroqova"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Parol *</label>
                  <input
                    required
                    type="password"
                    value={teacherForm.password}
                    onChange={e => setTeacherForm({ ...teacherForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Lavozimi & Fan *</label>
                  <input
                    required
                    value={teacherForm.position}
                    onChange={e => setTeacherForm({ ...teacherForm, position: e.target.value })}
                    placeholder="Matematika fani o'qituvchisi"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Ma'lumot darajasi</label>
                  <select
                    value={teacherForm.education_level}
                    onChange={e => setTeacherForm({ ...teacherForm, education_level: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  >
                    <option value="Oliy">Oliy</option>
                    <option value="Magistr">Magistr</option>
                    <option value="O'rta maxsus">O'rta maxsus</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">JSHSHIR (PINFL)</label>
                  <input
                    value={teacherForm.pinfl}
                    onChange={e => setTeacherForm({ ...teacherForm, pinfl: e.target.value })}
                    placeholder="14 xonali"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Telefon</label>
                  <input
                    value={teacherForm.phone}
                    onChange={e => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                    placeholder="+998 90 123-45-67"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Oylik maoshi</label>
                  <input
                    type="number"
                    value={teacherForm.salary}
                    onChange={e => setTeacherForm({ ...teacherForm, salary: e.target.value })}
                    placeholder="4500000"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowTeacherModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold transition shadow-md disabled:bg-slate-300"
                >
                  {submitting ? 'Saqlanmoqda...' : 'O\'qituvchini saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE CLASS */}
      {showClassModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">Yangi Sinf Ochish</h3>
              <button onClick={() => setShowClassModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Sinf Nomi *</label>
                <input
                  required
                  value={classForm.name}
                  onChange={e => setClassForm({ ...classForm, name: e.target.value })}
                  placeholder="masalan: 9-A yoki 10-B"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Sinf Raqami (1-11) *</label>
                <input
                  required
                  type="number"
                  min="1"
                  max="11"
                  value={classForm.grade}
                  onChange={e => setClassForm({ ...classForm, grade: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowClassModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition shadow-md disabled:bg-slate-300"
                >
                  {submitting ? 'Saqlanmoqda...' : 'Sinfni ochish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolAdminDashboard;
