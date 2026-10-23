import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Calculator,
  Languages,
  ClipboardCheck,
  Award,
  Code2,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Users,
  BookOpenCheck,
  FilePlus2,
  Calendar,
  Shield,
  School,
  Activity,
} from 'lucide-react';
import { apiFetch, clearStoredAuth, getStoredToken, setStoredAuth } from './services/api';
import { PublicPages, type PublicTab } from './components/PublicPages';
import { StudentViews, type StudentSection } from './components/StudentViews';
import { StaffViews, type StaffSection } from './components/StaffViews';
import type { UserProfile, UserRole } from './types';

const ROLE_LABELS_UZ: Record<UserRole, string> = {
  student: "O'quvchi",
  teacher: "O'qituvchi",
  school_coordinator: 'Maktab IT/AI Koordinatori',
  district_coordinator: 'Tuman Koordinatori',
  admin: 'Platforma Administratori',
};

export function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [publicTab, setPublicTab] = useState<PublicTab>('home');
  const [studentSection, setStudentSection] = useState<StudentSection>('dashboard');
  const [staffSection, setStaffSection] = useState<StaffSection>('teacher_dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const syncDefaultStaffSection = (role: UserRole) => {
    if (role === 'teacher') setStaffSection('teacher_dashboard');
    else if (role === 'school_coordinator' || role === 'district_coordinator')
      setStaffSection('coord_dashboard');
    else if (role === 'admin') setStaffSection('admin_users');
  };

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setInitializing(false);
      return;
    }
    apiFetch<UserProfile>('/api/v1/users/me')
      .then((u) => {
        setUser(u);
        syncDefaultStaffSection(u.role);
      })
      .catch(() => {
        clearStoredAuth();
      })
      .finally(() => setInitializing(false));
  }, []);

  const handleLogout = async () => {
    try {
      await apiFetch('/api/v1/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    clearStoredAuth();
    setUser(null);
    setPublicTab('home');
  };

  const handleQuickRoleSwitch = async (email: string) => {
    try {
      const res = await apiFetch<{ token: string; csrfToken: string; user: UserProfile }>(
        '/api/v1/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password: 'EduAI2026!' }),
        }
      );
      setStoredAuth(res.token, res.csrfToken);
      setUser(res.user);
      setStudentSection('dashboard');
      syncDefaultStaffSection(res.user.role);
      setMobileMenuOpen(false);
    } catch {
      // ignore
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] text-slate-600 text-sm">
        EduAI va IT Yoshlar yuklanmoqda...
      </div>
    );
  }

  if (!user) {
    return (
      <PublicPages
        activeTab={publicTab}
        onSelectTab={setPublicTab}
        onAuthenticated={(loggedInUser) => {
          setUser(loggedInUser);
          setStudentSection('dashboard');
          syncDefaultStaffSection(loggedInUser.role);
        }}
      />
    );
  }

  const studentNavItems: { id: StudentSection; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Boshqaruv paneli', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'tutor', label: 'EduAI Repetitor', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'math', label: 'Matematika moduli', icon: <Calculator className="w-4 h-4" /> },
    { id: 'english', label: 'Ingliz tili (A1–B2)', icon: <Languages className="w-4 h-4" /> },
    { id: 'quizzes', label: 'Test va topshiriqlar', icon: <ClipboardCheck className="w-4 h-4" /> },
    { id: 'results', label: 'Natijalarim', icon: <Award className="w-4 h-4" /> },
    { id: 'projects', label: 'IT Yoshlar loyihalari', icon: <Code2 className="w-4 h-4" /> },
    { id: 'notifications', label: 'Bildirishnomalar', icon: <Bell className="w-4 h-4" /> },
    { id: 'settings', label: 'Sozlamalar', icon: <Settings className="w-4 h-4" /> },
  ];

  const getStaffNavItems = (): { id: StaffSection; label: string; icon: React.ReactNode }[] => {
    if (user.role === 'teacher') {
      return [
        {
          id: 'teacher_dashboard',
          label: "O'qituvchi paneli",
          icon: <LayoutDashboard className="w-4 h-4" />,
        },
        {
          id: 'teacher_classes',
          label: "Sinflar va o'quvchilar",
          icon: <Users className="w-4 h-4" />,
        },
        {
          id: 'teacher_quiz_builder',
          label: 'Test va topshiriq tuzish',
          icon: <FilePlus2 className="w-4 h-4" />,
        },
        {
          id: 'teacher_content_review',
          label: 'AI kontent tasdiqlash',
          icon: <BookOpenCheck className="w-4 h-4" />,
        },
        {
          id: 'teacher_submissions',
          label: 'Topshirilgan ishlar',
          icon: <ClipboardCheck className="w-4 h-4" />,
        },
      ];
    }
    if (user.role === 'school_coordinator' || user.role === 'district_coordinator') {
      return [
        {
          id: 'coord_dashboard',
          label:
            user.role === 'district_coordinator'
              ? 'Tuman maktablari va hisobot'
              : 'Maktab hisoboti va IT faoliyat',
          icon: <LayoutDashboard className="w-4 h-4" />,
        },
        {
          id: 'coord_projects',
          label: 'IT Yoshlar loyiha boshqaruvi',
          icon: <Code2 className="w-4 h-4" />,
        },
        {
          id: 'coord_events',
          label: 'Tadbirlar va musobaqalar',
          icon: <Calendar className="w-4 h-4" />,
        },
      ];
    }
    // Administrator
    return [
      {
        id: 'admin_users',
        label: 'Foydalanuvchilar va rollar',
        icon: <Users className="w-4 h-4" />,
      },
      {
        id: 'admin_schools',
        label: 'Maktablar boshqaruvi',
        icon: <School className="w-4 h-4" />,
      },
      {
        id: 'admin_ai_moderation',
        label: 'AI holati va moderatsiya',
        icon: <Activity className="w-4 h-4" />,
      },
      {
        id: 'admin_audit_settings',
        label: 'Audit jurnali va saqlash muddati',
        icon: <Shield className="w-4 h-4" />,
      },
      {
        id: 'teacher_content_review',
        label: 'O\'quv kontent nazorati',
        icon: <BookOpenCheck className="w-4 h-4" />,
      },
      {
        id: 'coord_dashboard',
        label: 'Tuman agregat statistikasi',
        icon: <LayoutDashboard className="w-4 h-4" />,
      },
    ];
  };

  const staffNavItems = getStaffNavItems();

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-[#0F172A]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shrink-0">
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="text-lg font-bold tracking-tight text-[#1E3A8A]">EduAI · IT Yoshlar</div>
          <div className="text-xs text-slate-500 mt-0.5 truncate">
            {ROLE_LABELS_UZ[user.role]}
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {user.role === 'student'
            ? studentNavItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStudentSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    studentSection === item.id
                      ? 'bg-[#1E3A8A] text-white font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))
            : staffNavItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStaffSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    staffSection === item.id
                      ? 'bg-[#1E3A8A] text-white font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
        </nav>

        {/* Pilot Role Switcher in Sidebar Footer for Fast Testing */}
        <div className="p-4 border-t border-slate-200 space-y-2.5 bg-slate-50/60">
          <div className="text-[11px] font-semibold text-slate-500">
            Pilot rolni almashtirib sinash:
          </div>
          <select
            aria-label="Pilot rolni tanlash"
            value={
              user.role === 'student'
                ? 'jasur.student@eduai.uz'
                : user.role === 'teacher'
                ? 'dilshod.teacher@eduai.uz'
                : user.role === 'school_coordinator'
                ? 'sardor.coordinator@eduai.uz'
                : user.role === 'district_coordinator'
                ? 'gulnora.district@eduai.uz'
                : 'admin@eduai.uz'
            }
            onChange={(e) => handleQuickRoleSwitch(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
          >
            <option value="jasur.student@eduai.uz">O'quvchi (Jasur K.)</option>
            <option value="dilshod.teacher@eduai.uz">O'qituvchi (Dilshod T.)</option>
            <option value="sardor.coordinator@eduai.uz">Maktab Koordinatori</option>
            <option value="gulnora.district@eduai.uz">Tuman Koordinatori</option>
            <option value="admin@eduai.uz">Administrator</option>
          </select>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Tizimdan chiqish</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Workspace Header */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg border border-slate-200 text-slate-700"
              aria-label="Menyuni ochish"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <div className="text-xs sm:text-sm text-slate-600 truncate">
              <span className="font-semibold text-slate-900">{user.fullName}</span>
              <span className="mx-2 text-slate-300">·</span>
              <span>{ROLE_LABELS_UZ[user.role]}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {user.role === 'student' && (
              <button
                type="button"
                onClick={() => setStudentSection('tutor')}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#1E3A8A] rounded-lg hover:bg-[#1E40AF] whitespace-nowrap shrink-0"
              >
                EduAI Repetitor
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="md:hidden px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg"
            >
              Chiqish
            </button>
          </div>
        </header>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 p-4 space-y-2">
            {user.role === 'student'
              ? studentNavItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setStudentSection(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium ${
                      studentSection === item.id
                        ? 'bg-[#1E3A8A] text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))
              : staffNavItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setStaffSection(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium ${
                      staffSection === item.id
                        ? 'bg-[#1E3A8A] text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
          </div>
        )}

        {/* Main Content Container */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8">
          {user.role === 'student' ? (
            <StudentViews
              user={user}
              activeSection={studentSection}
              onNavigate={setStudentSection}
              onUserUpdated={(upd) => setUser((prev) => (prev ? { ...prev, ...upd } : prev))}
            />
          ) : (
            <StaffViews
              user={user}
              activeSection={staffSection}
              onNavigate={setStaffSection}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
