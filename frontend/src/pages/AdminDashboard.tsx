import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import {
  Users, Building2, Shield, Bot, MessageSquare, Plus, Trash2,
  CheckCircle, XCircle, Eye, RefreshCw, BarChart3, School, FileText,
  Search, Filter, CheckCircle2, AlertTriangle, ArrowRight, Clock,
  Key, Zap, Cpu, Sparkles, BookOpen, Layers, Phone, MapPin, Mail,
  Send, ExternalLink, X, ShieldAlert, UserCheck, AlertCircle, ChevronRight
} from 'lucide-react';

import { BackButton } from '../components/BackButton';

// API so'rovlar uchun header olish
const getAuthHeaders = () => {
  const token = localStorage.getItem('eduai_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

// O'zbekcha rol nomlari va ranglari (aniq 4 ta rol)
const ROLE_CONFIG: Record<string, { label: string; badge: string }> = {
  student: { label: "O'quvchi", badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  teacher: { label: "O'qituvchi", badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  school_admin: { label: "Maktab Admini", badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  admin: { label: "Bosh Admin", badge: 'bg-rose-50 text-rose-700 border-rose-200' },
};

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
};

const TABS = [
  { id: 'overview', label: 'Umumiy', icon: BarChart3 },
  { id: 'users', label: 'Foydalanuvchilar', icon: Users },
  { id: 'schools', label: 'Maktablar', icon: School },
  { id: 'audit', label: 'Jurnallar', icon: Shield },
  { id: 'ai', label: 'AI Holati', icon: Bot },
  { id: 'requests', label: "So'rovlar", icon: MessageSquare },
];

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const getInitialTab = () => {
    const hash = window.location.hash;
    if (hash.includes('tab=requests')) return 'requests';
    if (hash.includes('tab=users')) return 'users';
    if (hash.includes('tab=schools')) return 'schools';
    if (hash.includes('tab=audit')) return 'audit';
    if (hash.includes('tab=ai')) return 'ai';
    return 'overview';
  };
  const [activeTab, setActiveTab] = useState(getInitialTab);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.includes('tab=requests')) setActiveTab('requests');
      else if (hash.includes('tab=users')) setActiveTab('users');
      else if (hash.includes('tab=schools')) setActiveTab('schools');
      else if (hash.includes('tab=audit')) setActiveTab('audit');
      else if (hash.includes('tab=ai')) setActiveTab('ai');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Faqat admin ruxsatiga ega bo'lishi kerak
  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <BackButton to="/dashboard" label="Asosiy boshqaruvga qaytish" />
      {/* Sarlavha paneli */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative shadow-xl overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold mb-3 border border-white/10 backdrop-blur-sm">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span>EduAI Platformasi — Boshqaruv Markazi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Bosh Admin Paneli
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Tizim monitoringi, foydalanuvchilar va maktablar boshqaruvi, xavfsizlik auditi va sun'iy intellekt xizmati holati.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
              <span className="text-slate-400 block">Joriy Admin:</span>
              <span className="font-bold text-slate-200">{user.full_name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigatsiyasi */}
      <div className="flex overflow-x-auto gap-2 bg-white rounded-2xl p-1.5 border border-slate-200 shadow-sm scrollbar-thin">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? 'bg-blue-700 text-white shadow-md shadow-blue-700/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Kontenti */}
      <div>
        {activeTab === 'overview' && <OverviewTab onNavigate={setActiveTab} />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'schools' && <SchoolsTab />}
        {activeTab === 'audit' && <AuditTab />}
        {activeTab === 'ai' && <AITab />}
        {activeTab === 'requests' && <RequestsTab />}
      </div>
    </div>
  );
};

/* =========================================================================================
   TAB 1: UMUMIY (OVERVIEW)
   ========================================================================================= */
interface OverviewTabProps {
  onNavigate: (tabId: string) => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/reports/dashboard-stats', {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error("Statistikani yuklashda xatolik yuz berdi");
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Yuqori bildirishnoma yoki xatolik */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-red-800 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchStats}
            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-semibold transition"
          >
            Qayta urinish
          </button>
        </div>
      )}

      {/* Statistika kartochkalari */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Faol O'quvchilar</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900">
              {loading ? <span className="inline-block w-16 h-8 bg-slate-100 animate-pulse rounded" /> : stats?.active_students ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Platformada ro'yxatdan o'tgan o'quvchilar</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Faol O'qituvchilar</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900">
              {loading ? <span className="inline-block w-16 h-8 bg-slate-100 animate-pulse rounded" /> : stats?.active_teachers ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Dars o'tayotgan va sinf boshqaruvchilar</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Uланган Maktablar</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <School className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900">
              {loading ? <span className="inline-block w-16 h-8 bg-slate-100 animate-pulse rounded" /> : stats?.schools_count ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Tizimga kiritilgan ta'lim muassasalari</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Bajarilgan Mashqlar</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900">
              {loading ? <span className="inline-block w-16 h-8 bg-slate-100 animate-pulse rounded" /> : stats?.completed_exercises ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">O'quvchilar tomonidan yechilgan topshiriqlar</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Yoshlar IT Loyihalari</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900">
              {loading ? <span className="inline-block w-16 h-8 bg-slate-100 animate-pulse rounded" /> : stats?.projects_count ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Startup, bot va veb dasturlar</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">AI Savol-Javoblari</span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <Bot className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900">
              {loading ? <span className="inline-block w-16 h-8 bg-slate-100 animate-pulse rounded" /> : stats?.ai_queries_count ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">EduAI repetitoriga berilgan savollar</p>
          </div>
        </div>
      </div>

      {/* Tezkor boshqaruv va Tizim arxitekturasi bloklari */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Tezkor Boshqaruv Harakatlari</h2>
              <p className="text-xs text-slate-500 mt-0.5">Admin sifatida eng ko'p bajariladigan amallar</p>
            </div>
            <button
              onClick={fetchStats}
              className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
              title="Yangilash"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => onNavigate('users')}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100/80 text-left transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900">Foydalanuvchilar Ro'yxati</div>
                  <div className="text-xs text-slate-500">Rollar berish va hisoblarni boshqarish</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition" />
            </button>

            <button
              onClick={() => onNavigate('schools')}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100/80 text-left transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <School className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900">Maktablar va Tumanlar</div>
                  <div className="text-xs text-slate-500">Yangi maktab va kvotalar biriktirish</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition" />
            </button>

            <button
              onClick={() => onNavigate('requests')}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100/80 text-left transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900">Hisob So'rovlari</div>
                  <div className="text-xs text-slate-500">Kutilayotgan arizalarni tasdiqlash</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition" />
            </button>

            <button
              onClick={() => onNavigate('ai')}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100/80 text-left transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900">Sun'iy Intellekt Holati</div>
                  <div className="text-xs text-slate-500">Model, kalitlar va cheklovlar</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-violet-600 transition" />
            </button>
          </div>
        </div>

        {/* Tizim xavfsizlik va server statusi */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-bold mb-4">
              <Shield className="w-5 h-5 text-indigo-600" />
              <span>Tizim Himoyasi & Barqarorligi</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">Autentifikatsiya:</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> JWT Secure
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">Audit Nazorati:</span>
                <span className="font-bold text-blue-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> To'liq faol
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">Ma'lumotlar Bazasi:</span>
                <span className="font-bold text-slate-800">SQLite / PostgreSQL</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">API Versiyasi:</span>
                <span className="font-bold text-indigo-600">v1.0 (FastAPI Core)</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigate('audit')}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition"
            >
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
              <span>Xavfsizlik Jurnallarini Ko'rish</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================================
   TAB 2: FOYDALANUVCHILAR (USERS)
   ========================================================================================= */
const UsersTab: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal holati
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'student',
    school_id: '',
    grade: ''
  });

  const loadUsersAndSchools = async () => {
    setLoading(true);
    try {
      const [usersRes, schoolsRes] = await Promise.all([
        fetch('/api/v1/admin/users', { headers: getAuthHeaders() }),
        fetch('/api/v1/admin/schools', { headers: getAuthHeaders() })
      ]);

      if (!usersRes.ok) throw new Error("Foydalanuvchilarni yuklab bo'lmadi");
      const usersData = await usersRes.json();
      setUsers(usersData);

      if (schoolsRes.ok) {
        const schoolsData = await schoolsRes.json();
        setSchools(schoolsData);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || "Yuklashda xatolik yuz berdi" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsersAndSchools();
  }, []);

  // Rolni o'zgartirish
  const handleRoleChange = async (userId: number, newRole: string) => {
    if (!window.confirm(`Haqiqatan ham foydalanuvchi rolini "${ROLE_CONFIG[newRole]?.label || newRole}" ga o'zgartirmoqchimisiz?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/admin/users/${userId}/role?new_role=${newRole}`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Rolni o'zgartirishda xatolik yuz berdi");
      }
      setFeedback({ type: 'success', text: "Foydalanuvchi roli muvaffaqiyatli yangilandi!" });
      loadUsersAndSchools();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  // Foydalanuvchini o'chirish
  const handleDeleteUser = async (userId: number, name: string) => {
    if (!window.confirm(`Diqqat! "${name}" foydalanuvchisini butunlay o'chirmoqchimisiz? Ushbu amalni bekor qilib bo'lmaydi.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/admin/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Foydalanuvchini o'chirishda xatolik yuz berdi");
      }
      setFeedback({ type: 'success', text: `"${name}" foydalanuvchisi tizimdan muvaffaqiyatli o'chirildi.` });
      setUsers(users.filter(u => u.id !== userId));
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  // Yangi foydalanuvchi qo'shish
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const params = new URLSearchParams({
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });

      if (formData.school_id) params.append('school_id', formData.school_id);
      if (formData.grade) params.append('grade', formData.grade);

      const res = await fetch(`/api/v1/admin/users?${params.toString()}`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Foydalanuvchi yaratishda xatolik yuz berdi");
      }

      setFeedback({ type: 'success', text: "Yangi foydalanuvchi muvaffaqiyatli yaratildi!" });
      setIsModalOpen(false);
      setFormData({
        full_name: '',
        email: '',
        password: '',
        role: 'student',
        school_id: '',
        grade: ''
      });
      loadUsersAndSchools();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Qidiruv va filtrlash
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch =
        u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const schoolNameMap = useMemo(() => {
    const map = new Map<number, string>();
    schools.forEach(s => map.set(s.id, s.name));
    return map;
  }, [schools]);

  return (
    <div className="space-y-6">
      {/* Feedback Alert */}
      {feedback && (
        <div className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold border ${
          feedback.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Amallar paneli: Qidiruv, Filter va Yangi foydalanuvchi tugmasi */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Qidiruv */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Ism yoki email bo'yicha qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          {/* Rol filtri */}
          <div className="relative w-full sm:w-56">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">Barcha Rollar</option>
              <option value="student">O'quvchilar</option>
              <option value="teacher">O'qituvchilar</option>
              <option value="school_admin">Maktab Adminlari</option>
              <option value="admin">Bosh Adminlar</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={loadUsersAndSchools}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
            title="Yangilash"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-700/20 transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi Foydalanuvchi</span>
          </button>
        </div>
      </div>

      {/* Foydalanuvchilar jadvali */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            Barcha Foydalanuvchilar ({filteredUsers.length} ta)
          </span>
          <span className="text-xs text-slate-400">Jami ro'yxat: {users.length} nafar</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">F.I.SH / Ism</th>
                <th className="py-3 px-4">Elektron Pochta</th>
                <th className="py-3 px-4">Joriy Rol</th>
                <th className="py-3 px-4">Maktab</th>
                <th className="py-3 px-4">Holat</th>
                <th className="py-3 px-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Foydalanuvchilar yuklanmoqda...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                    Hech qanday foydalanuvchi topilmadi
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const roleInfo = ROLE_CONFIG[u.role] || { label: u.role, badge: 'bg-slate-100 text-slate-700 border-slate-200' };
                  const schoolName = u.school_id ? (schoolNameMap.get(u.school_id) || `Maktab #${u.school_id}`) : 'Belgilanmagan';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-mono text-slate-400">#{u.id}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {u.full_name}
                        {u.grade && <span className="ml-2 text-[10px] text-slate-400 font-normal">({u.grade}-sinf)</span>}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{u.email}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold border ${roleInfo.badge}`}>
                          {roleInfo.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="line-clamp-1">{schoolName}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Faol
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Nofaol
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Rolni o'zgartirish tezkor selektori */}
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="py-1 px-2 bg-slate-50 hover:bg-white border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                            title="Rolni o'zgartirish"
                          >
                            <option value="student">O'quvchi</option>
                            <option value="teacher">O'qituvchi</option>
                            <option value="school_admin">Maktab Admini</option>
                            <option value="admin">Bosh Admin</option>
                          </select>

                          {/* O'chirish tugmasi */}
                          <button
                            onClick={() => handleDeleteUser(u.id, u.full_name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Foydalanuvchini o'chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* YANGI FOYDALANUVCHI QO'SHISH MODALI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-5 top-5 p-1 text-slate-400 hover:text-slate-600 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Yangi Foydalanuvchi Qo'shish</h3>
                <p className="text-xs text-slate-500">Tizimga yangi xodim yoki o'quvchi biriktirish</p>
              </div>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">To'liq F.I.SH *</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Xusanov Xumoyun"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Elektron Pochta (Login) *</label>
                <input
                  type="email"
                  required
                  placeholder="khusanov@eduai.uz yoki xxusanov228@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Dastlabki Parol *</label>
                <input
                  type="password"
                  required
                  placeholder="Kamida 6 ta belgi"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rolni Tanlang *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="student">O'quvchi</option>
                    <option value="teacher">O'qituvchi</option>
                    <option value="school_admin">Maktab Admini (Zam Direktor)</option>
                    <option value="admin">Bosh Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Maktab (ixtiyoriy)</label>
                  <select
                    value={formData.school_id}
                    onChange={(e) => setFormData({ ...formData, school_id: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">Maktab belgilanmagan</option>
                    {schools.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.role === 'student' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sinf (1-11)</label>
                  <input
                    type="number"
                    min={1}
                    max={11}
                    placeholder="Masalan: 9"
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold shadow-md shadow-blue-700/20 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Saqlash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================================================================================
   TAB 3: MAKTABLAR (SCHOOLS & DISTRICTS)
   ========================================================================================= */
const SchoolsTab: React.FC = () => {
  const [schools, setSchools] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modallar
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [isDistrictModalOpen, setIsDistrictModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Maktab form
  const [schoolForm, setSchoolForm] = useState({
    name: '',
    code: '',
    region: 'Toshkent shahri',
    district_id: '',
    address: '',
    student_quota: '',
    teacher_quota: '',
    phone: ''
  });

  // Tuman form
  const [districtForm, setDistrictForm] = useState({
    name: '',
    code: ''
  });

  const loadSchoolsAndDistricts = async () => {
    setLoading(true);
    try {
      const [schoolsRes, distRes] = await Promise.all([
        fetch('/api/v1/admin/schools', { headers: getAuthHeaders() }),
        fetch('/api/v1/admin/districts', { headers: getAuthHeaders() })
      ]);

      if (!schoolsRes.ok) throw new Error("Maktablarni yuklab bo'lmadi");
      const sData = await schoolsRes.json();
      setSchools(sData);

      if (distRes.ok) {
        const dData = await distRes.json();
        setDistricts(dData);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || "Yuklashda xatolik yuz berdi" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchoolsAndDistricts();
  }, []);

  // Maktab yaratish
  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const params = new URLSearchParams({
        name: schoolForm.name,
        code: schoolForm.code
      });

      if (schoolForm.district_id) params.append('district_id', schoolForm.district_id);
      if (schoolForm.region) params.append('region', schoolForm.region);
      if (schoolForm.address) params.append('address', schoolForm.address);
      if (schoolForm.student_quota) params.append('student_quota', schoolForm.student_quota);
      if (schoolForm.teacher_quota) params.append('teacher_quota', schoolForm.teacher_quota);
      if (schoolForm.phone) params.append('phone', schoolForm.phone);

      const res = await fetch(`/api/v1/admin/schools?${params.toString()}`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Maktab qo'shishda xatolik yuz berdi");
      }

      setFeedback({ type: 'success', text: "Yangi maktab muvaffaqiyatli qo'shildi!" });
      setIsSchoolModalOpen(false);
      setSchoolForm({
        name: '',
        code: '',
        region: 'Toshkent shahri',
        district_id: '',
        address: '',
        student_quota: '',
        teacher_quota: '',
        phone: ''
      });
      loadSchoolsAndDistricts();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Tuman yaratish
  const handleCreateDistrict = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const params = new URLSearchParams({
        name: districtForm.name,
        code: districtForm.code
      });

      const res = await fetch(`/api/v1/admin/districts?${params.toString()}`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Tuman qo'shishda xatolik yuz berdi");
      }

      setFeedback({ type: 'success', text: "Yangi tuman muvaffaqiyatli qo'shildi!" });
      setIsDistrictModalOpen(false);
      setDistrictForm({ name: '', code: '' });
      loadSchoolsAndDistricts();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const districtNameMap = useMemo(() => {
    const map = new Map<number, string>();
    districts.forEach(d => map.set(d.id, d.name));
    return map;
  }, [districts]);

  const filteredSchools = useMemo(() => {
    return schools.filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.address && s.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [schools, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Feedback Alert */}
      {feedback && (
        <div className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold border ${
          feedback.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Amallar paneli */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Maktab nomi yoki kodi bo'yicha qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={loadSchoolsAndDistricts}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
            title="Yangilash"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsDistrictModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition whitespace-nowrap"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>+ Yangi Tuman</span>
          </button>

          <button
            onClick={() => setIsSchoolModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>+ Yangi Maktab</span>
          </button>
        </div>
      </div>

      {/* Maktablar jadvali */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <School className="w-4 h-4 text-indigo-600" />
            Maktablar Ro'yxati ({filteredSchools.length} ta)
          </span>
          <span className="text-xs text-slate-400">Jami tumanlar: {districts.length} ta</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Maktab Nomi</th>
                <th className="py-3 px-4">Kodi</th>
                <th className="py-3 px-4">Viloyat / Hudud</th>
                <th className="py-3 px-4">Tuman</th>
                <th className="py-3 px-4 text-center">O'quvchilar</th>
                <th className="py-3 px-4 text-center">O'qituvchilar</th>
                <th className="py-3 px-4 text-center">Kvota (O'quvchi / Ustoz)</th>
                <th className="py-3 px-4 text-right">Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && schools.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    Maktablar yuklanmoqda...
                  </td>
                </tr>
              ) : filteredSchools.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400 font-medium">
                    Hech qanday maktab topilmadi
                  </td>
                </tr>
              ) : (
                filteredSchools.map((s) => {
                  const districtName = s.district_id ? (districtNameMap.get(s.district_id) || `Tuman #${s.district_id}`) : 'Belgilanmagan';

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-mono text-slate-400">#{s.id}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {s.name}
                        {s.phone && <div className="text-[10px] text-slate-400 font-normal">{s.phone}</div>}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-indigo-600 font-bold">{s.code}</td>
                      <td className="py-3.5 px-4 text-slate-600">{s.region || '-'}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{districtName}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-900">{s.student_count ?? 0}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-900">{s.teacher_count ?? 0}</td>
                      <td className="py-3.5 px-4 text-center text-slate-600">
                        <span className="font-semibold text-slate-800">{s.student_quota || '—'}</span> / <span className="font-semibold text-slate-800">{s.teacher_quota || '—'}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {s.is_active ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            Faol
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                            Nofaol
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* YANGI MAKTAB QO'SHISH MODALI */}
      {isSchoolModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsSchoolModalOpen(false)}
              className="absolute right-5 top-5 p-1 text-slate-400 hover:text-slate-600 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <School className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Yangi Maktab Qo'shish</h3>
                <p className="text-xs text-slate-500">Tizimga maktab va uning kvotalarini kiritish</p>
              </div>
            </div>

            <form onSubmit={handleCreateSchool} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Maktab Nomi *</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: 187-sonli umumiy o'rta ta'lim maktabi"
                  value={schoolForm.name}
                  onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unikal Kod *</label>
                  <input
                    type="text"
                    required
                    placeholder="SCH-187"
                    value={schoolForm.code}
                    onChange={(e) => setSchoolForm({ ...schoolForm, code: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tuman</label>
                  <select
                    value={schoolForm.district_id}
                    onChange={(e) => setSchoolForm({ ...schoolForm, district_id: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  >
                    <option value="">Tumanni tanlang</option>
                    {districts.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Viloyat</label>
                  <input
                    type="text"
                    placeholder="Masalan: Toshkent shahar"
                    value={schoolForm.region}
                    onChange={(e) => setSchoolForm({ ...schoolForm, region: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telefon raqam</label>
                  <input
                    type="text"
                    placeholder="+998 71 123-45-67"
                    value={schoolForm.phone}
                    onChange={(e) => setSchoolForm({ ...schoolForm, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Manzil</label>
                <input
                  type="text"
                  placeholder="Ko'cha, mahalla, bino raqami"
                  value={schoolForm.address}
                  onChange={(e) => setSchoolForm({ ...schoolForm, address: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">O'quvchilar Kvotasi</label>
                  <input
                    type="number"
                    placeholder="Masalan: 500"
                    value={schoolForm.student_quota}
                    onChange={(e) => setSchoolForm({ ...schoolForm, student_quota: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">O'qituvchilar Kvotasi</label>
                  <input
                    type="number"
                    placeholder="Masalan: 50"
                    value={schoolForm.teacher_quota}
                    onChange={(e) => setSchoolForm({ ...schoolForm, teacher_quota: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSchoolModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Maktabni Saqlash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* YANGI TUMAN QO'SHISH MODALI */}
      {isDistrictModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setIsDistrictModalOpen(false)}
              className="absolute right-5 top-5 p-1 text-slate-400 hover:text-slate-600 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Yangi Tuman Qo'shish</h3>
                <p className="text-xs text-slate-500">Viloyat yoki hudud tumanini ro'yxatdan o'tkazish</p>
              </div>
            </div>

            <form onSubmit={handleCreateDistrict} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tuman Nomi *</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Yunusobod tumani"
                  value={districtForm.name}
                  onChange={(e) => setDistrictForm({ ...districtForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tuman Kodi *</label>
                <input
                  type="text"
                  required
                  placeholder="DIST-YUNUSOBOD"
                  value={districtForm.code}
                  onChange={(e) => setDistrictForm({ ...districtForm, code: e.target.value.toUpperCase() })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDistrictModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-md transition disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Tumanni Saqlash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================================================================================
   TAB 4: XAVFSIZLIK JURNALLARI (AUDIT LOGS)
   ========================================================================================= */
const AuditTab: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/audit-logs?limit=150', {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error("Jurnallarni yuklab bo'lmadi");
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log =>
      (log.action && log.action.toLowerCase().includes(search.toLowerCase())) ||
      (log.details && log.details.toLowerCase().includes(search.toLowerCase())) ||
      (log.entity_type && log.entity_type.toLowerCase().includes(search.toLowerCase()))
    );
  }, [logs, search]);

  const getActionBadge = (action: string) => {
    if (action.includes('CREATED')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (action.includes('DELETED')) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (action.includes('CHANGED') || action.includes('UPDATED')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (action.includes('APPROVED')) return 'bg-purple-50 text-purple-700 border-purple-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6">
      {/* Sarlavha va qidiruv */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Harakat yoki tafsilot bo'yicha qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          />
        </div>

        <button
          onClick={loadAuditLogs}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Jurnalni Yangilash</span>
        </button>
      </div>

      {/* Jurnallar Ro'yxati / Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Xavfsizlik va Harakatlar Tarixi</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">Jami yozuvlar: {filteredLogs.length} ta</span>
        </div>

        {loading && logs.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
            Xavfsizlik jurnallari yuklanmoqda...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-medium">
            Jurnalda hech qanday ma'lumot topilmadi
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${getActionBadge(log.action)}`}>
                      {log.action}
                    </span>
                    {log.entity_type && (
                      <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}
                      </span>
                    )}
                    <span className="text-xs font-medium text-slate-400">
                      (Admin ID: #{log.user_id})
                    </span>
                  </div>
                  <div className="text-xs text-slate-800 font-medium">
                    {log.details || 'Tafsilot ko\'rsatilmagan'}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono whitespace-nowrap">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatDate(log.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* =========================================================================================
   TAB 5: AI HOLATI (AI MONITORING)
   ========================================================================================= */
const AITab: React.FC = () => {
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadAiStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/ai-status', {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error("AI holatini yuklab bo'lmadi");
      const data = await res.json();
      setAiStatus(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAiStatus();
  }, []);

  return (
    <div className="space-y-6">
      {/* Provayder monitoring kartasi */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">EduAI Asosiy Sun'iy Intellekt Dvigateli</h2>
              <p className="text-xs text-slate-500">Global AI provayderi, ulanish kaliti va xizmat parametrlari</p>
            </div>
          </div>

          <button
            onClick={loadAiStatus}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Holatni Yangilash</span>
          </button>
        </div>

        {aiStatus ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 block">Joriy Provayder:</span>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-base font-extrabold text-slate-900 uppercase">
                  {aiStatus.provider}
                </span>
                {aiStatus.is_mock ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    Lokal Mock
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Jonli API
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 block">Ishlatilayotgan Model:</span>
              <div className="mt-1 font-mono font-bold text-sm text-slate-900">
                {aiStatus.model || 'Standart'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 block">API Kaliti Holati:</span>
              <div className="mt-1 flex items-center gap-1.5">
                {aiStatus.has_api_key ? (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5" /> {aiStatus.masked_key || 'Ulangan'}
                  </span>
                ) : (
                  <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Kalit mavjud emas
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold text-slate-500 block">So'rovlar Limiti (Rate Limit):</span>
              <div className="mt-1 font-bold text-sm text-slate-900">
                {aiStatus.rate_limit_per_minute} ta / daqiqa
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 text-xs">
            AI holati yuklanmoqda...
          </div>
        )}
      </div>

      {/* Matematika AI va Ingliz tili AI uchun alohida modullar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Matematika AI Repetitori Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Matematika AI Repetitori</h3>
                  <span className="text-[11px] text-slate-500">Algebra, Geometriya, Formulalar tahlili</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Faol
              </span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 mt-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <span>LaTeX Formulalar Generatsiyasi:</span>
                <span className="font-bold text-slate-800">Qo'llab-quvvatlanadi</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <span>Bosqichma-bosqich yechim (Hints):</span>
                <span className="font-bold text-slate-800">2 bosqichli maslahat</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <span>Tushuntirish uslublari:</span>
                <span className="font-bold text-slate-800">Oddiy / Qadamma-qadam / To'liq</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <span>Sinflar qamrovi:</span>
                <span className="font-bold text-indigo-600">5 - 11 sinflar</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">O'rtacha javob vaqti: ~1.2s</span>
            <div className="text-xs font-bold text-indigo-600 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Optimal
            </div>
          </div>
        </div>

        {/* Ingliz tili AI Yordamchisi Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Ingliz tili AI Yordamchisi</h3>
                  <span className="text-[11px] text-slate-500">Grammatika, CEFR baholash, Insho tahlili</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Faol
              </span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 mt-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <span>CEFR Darajalari:</span>
                <span className="font-bold text-slate-800">A1, A2, B1, B2, C1</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <span>Lug'at va Xatoliklar tahlili:</span>
                <span className="font-bold text-slate-800">Avtomatik tuzatish</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <span>Muloqot simulyatsiyasi:</span>
                <span className="font-bold text-slate-800">Interaktiv suhbatdosh</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <span>Talaffuz & Audio maslahatlar:</span>
                <span className="font-bold text-rose-600">Integratsiyalangan</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">O'rtacha javob vaqti: ~1.4s</span>
            <div className="text-xs font-bold text-rose-600 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Optimal
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================================
   TAB 6: SO'ROVLAR VA MUROJAATLAR (REQUESTS & MESSAGES)
   ========================================================================================= */
const RequestsTab: React.FC = () => {
  const [subTab, setSubTab] = useState<'account_requests' | 'messages'>('account_requests');
  const [accountRequests, setAccountRequests] = useState<any[]>([]);
  const [contactMessages, setContactMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Rad etish modali
  const [rejectModalId, setRejectModalId] = useState<number | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqRes, msgRes] = await Promise.all([
        fetch('/api/v1/admin/account-requests', { headers: getAuthHeaders() }),
        fetch('/api/v1/admin/contact-messages', { headers: getAuthHeaders() })
      ]);

      if (reqRes.ok) {
        const reqData = await reqRes.json();
        setAccountRequests(reqData);
      }
      if (msgRes.ok) {
        const msgData = await msgRes.json();
        setContactMessages(msgData);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || "Ma'lumotlarni yuklab bo'lmadi" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // So'rovni tasdiqlash
  const handleApprove = async (id: number) => {
    setProcessingId(id);
    setFeedback(null);
    try {
      const res = await fetch(`/api/v1/admin/account-requests/${id}/approve`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Tasdiqlashda xatolik yuz berdi");
      }
      const data = await res.json();
      setFeedback({ type: 'success', text: `So'rov tasdiqlandi! Foydalanuvchi yaratildi: ${data.created_email}` });
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  // So'rovni rad etish
  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalId) return;

    setProcessingId(rejectModalId);
    setFeedback(null);
    try {
      const res = await fetch(`/api/v1/admin/account-requests/${rejectModalId}/reject?notes=${encodeURIComponent(rejectNotes)}`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Rad etishda xatolik yuz berdi");
      }
      setFeedback({ type: 'success', text: "So'rov muvaffaqiyatli rad etildi." });
      setRejectModalId(null);
      setRejectNotes('');
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Alert */}
      {feedback && (
        <div className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold border ${
          feedback.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2 ta kichik tab almashtirish tugmalari */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-2 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('account_requests')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              subTab === 'account_requests'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Hisob So'rovlari ({accountRequests.filter(r => r.status === 'pending').length} yangi)
          </button>
          <button
            onClick={() => setSubTab('messages')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              subTab === 'messages'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Murojaatlar ({contactMessages.length})
          </button>
        </div>

        <button
          onClick={loadData}
          className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition"
          title="Yangilash"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* SUB-TAB 1: HISOB SO'ROVLARI */}
      {subTab === 'account_requests' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              Kelib tushgan akkaunt so'rovlari ({accountRequests.length} ta)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Ism / F.I.SH</th>
                  <th className="py-3 px-4">Maktab / Hudud</th>
                  <th className="py-3 px-4">Rol Tavsifi</th>
                  <th className="py-3 px-4">So'ralgan Login</th>
                  <th className="py-3 px-4">Parol</th>
                  <th className="py-3 px-4">Kontakt</th>
                  <th className="py-3 px-4">Holat</th>
                  <th className="py-3 px-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && accountRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                      So'rovlar yuklanmoqda...
                    </td>
                  </tr>
                ) : accountRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400 font-medium">
                      Hozircha hech qanday akkaunt so'rovi yo'q
                    </td>
                  </tr>
                ) : (
                  accountRequests.map((r) => {
                    const isPending = r.status === 'pending';
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {r.full_name}
                          <div className="text-[10px] text-slate-400 font-normal">{formatDate(r.created_at)}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">{r.district_school || '-'}</td>
                        <td className="py-3.5 px-4 text-slate-700">{r.role_description || "O'quvchi"}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-700">{r.desired_login}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-500">••••••••</td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {r.telegram && <div className="text-[11px] text-blue-600">TG: @{r.telegram.replace('@', '')}</div>}
                          {r.email_contact && <div className="text-[11px] text-slate-500">{r.email_contact}</div>}
                        </td>
                        <td className="py-3.5 px-4">
                          {r.status === 'pending' && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              Kutilmoqda
                            </span>
                          )}
                          {r.status === 'approved' && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Tasdiqlangan
                            </span>
                          )}
                          {r.status === 'rejected' && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              Rad etilgan
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {isPending ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleApprove(r.id)}
                                disabled={processingId === r.id}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center gap-1"
                              >
                                {processingId === r.id && <RefreshCw className="w-3 h-3 animate-spin" />}
                                <span>Tasdiqlash</span>
                              </button>
                              <button
                                onClick={() => {
                                  setRejectModalId(r.id);
                                  setRejectNotes('');
                                }}
                                disabled={processingId === r.id}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition disabled:opacity-50"
                              >
                                Rad etish
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Ko'rib chiqilgan</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: MUROJAATLAR */}
      {subTab === 'messages' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-600" />
              Sayt orqali yuborilgan murojaatlar ({contactMessages.length} ta)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Yuboruvchi Ismi</th>
                  <th className="py-3 px-4">Aloqa (Telefon / Email)</th>
                  <th className="py-3 px-4">Mavzu</th>
                  <th className="py-3 px-4">Xabar Matni</th>
                  <th className="py-3 px-4">Yuborilgan Vaqt</th>
                  <th className="py-3 px-4 text-right">Holat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && contactMessages.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                      Murojaatlar yuklanmoqda...
                    </td>
                  </tr>
                ) : contactMessages.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                      Hozircha hech qanday murojaat kelib tushmagan
                    </td>
                  </tr>
                ) : (
                  contactMessages.map((msg) => (
                    <tr key={msg.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{msg.full_name}</td>
                      <td className="py-3.5 px-4 font-semibold text-blue-600">{msg.contact_info}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">{msg.subject}</td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-md">
                        <p className="line-clamp-2">{msg.message}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {formatDate(msg.created_at)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {msg.is_read ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                            O'qilgan
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Yangi
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RAD ETISH SABABI MODALI */}
      {rejectModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setRejectModalId(null)}
              className="absolute right-5 top-5 p-1 text-slate-400 hover:text-slate-600 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">So'rovni Rad Etish</h3>
                <p className="text-xs text-slate-500">Rad etish sababini kiriting (ixtiyoriy)</p>
              </div>
            </div>

            <form onSubmit={handleReject} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Izoh / Sabab</label>
                <textarea
                  rows={3}
                  placeholder="Masalan: Ma'lumotlar to'liq emas yoki bunday o'quvchi maktab ro'yxatida yo'q"
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-600 focus:bg-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectModalId(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={processingId !== null}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-600/20 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {processingId !== null && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Rad etish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
