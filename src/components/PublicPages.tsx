import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  BookOpen,
  ShieldCheck,
  Code2,
  CheckCircle2,
  ExternalLink,
  Lock,
  UserPlus,
  LogIn,
  Eye,
  EyeOff,
} from 'lucide-react';
import { apiFetch, setStoredAuth } from '../services/api';
import type { ProjectItem, SchoolItem, UserProfile } from '../types';

export type PublicTab =
  | 'home'
  | 'about'
  | 'features'
  | 'projects'
  | 'login'
  | 'register'
  | 'privacy'
  | 'terms';

interface PublicPagesProps {
  activeTab: PublicTab;
  onSelectTab: (tab: PublicTab) => void;
  onAuthenticated: (user: UserProfile) => void;
}

const DEMO_ACCOUNTS = [
  {
    label: "O'quvchi (145-maktab, 7-A sinf)",
    email: 'jasur.student@eduai.uz',
    roleText: 'Jasur Karimov · Matematika va Ingliz tili · IT Yoshlar',
  },
  {
    label: "O'qituvchi (145-maktab)",
    email: 'dilshod.teacher@eduai.uz',
    roleText: 'Dilshod Toshmatov · Sinflar, Test tuzish va AI Kontent tasdiqlash',
  },
  {
    label: 'Maktab IT/AI Koordinatori (145-maktab)',
    email: 'sardor.coordinator@eduai.uz',
    roleText: 'Sardor Nurmatov · IT Yoshlar loyihalari va maktab hisobotlari',
  },
  {
    label: 'Tuman Koordinatori (Chilonzor tumani)',
    email: 'gulnora.district@eduai.uz',
    roleText: 'Gulnora Abdullayeva · Maktablararo statistika va tanlovlar',
  },
  {
    label: 'Platforma Administratori',
    email: 'admin@eduai.uz',
    roleText: 'Otabek Xusanov · Foydalanuvchilar, maktablar, audit va AI sozlamalari',
  },
];

export const PublicPages: React.FC<PublicPagesProps> = ({
  activeTab,
  onSelectTab,
  onAuthenticated,
}) => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Auth form states
  const [loginEmail, setLoginEmail] = useState('jasur.student@eduai.uz');
  const [loginPassword, setLoginPassword] = useState('EduAI2026!');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Register form states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regRole, setRegRole] = useState<'student' | 'teacher'>('student');
  const [regSchoolId, setRegSchoolId] = useState('school-145');
  const [regGrade, setRegGrade] = useState(7);

  useEffect(() => {
    setLoadingProjects(true);
    Promise.all([
      apiFetch<{ items: ProjectItem[] }>('/api/v1/projects').catch(() => ({ items: [] })),
      apiFetch<{ items: SchoolItem[] }>('/api/v1/schools').catch(() => ({ items: [] })),
    ])
      .then(([projRes, schRes]) => {
        setProjects(projRes.items || []);
        setSchools(schRes.items || []);
      })
      .finally(() => setLoadingProjects(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setSubmitting(true);
    try {
      const res = await apiFetch<{ token: string; csrfToken: string; user: UserProfile }>(
        '/api/v1/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ email: loginEmail, password: loginPassword }),
        }
      );
      setStoredAuth(res.token, res.csrfToken);
      onAuthenticated(res.user);
    } catch (err: any) {
      setAuthError(err.message || "Tizimga kirishda xatolik yuz berdi.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemoLogin = async (email: string) => {
    setLoginEmail(email);
    setLoginPassword('EduAI2026!');
    setAuthError(null);
    setSubmitting(true);
    try {
      const res = await apiFetch<{ token: string; csrfToken: string; user: UserProfile }>(
        '/api/v1/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password: 'EduAI2026!' }),
        }
      );
      setStoredAuth(res.token, res.csrfToken);
      onAuthenticated(res.user);
    } catch (err: any) {
      setAuthError(err.message || "Demo hisobga kirishda xatolik.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setSubmitting(true);
    try {
      const res = await apiFetch<{ token: string; csrfToken: string; user: UserProfile }>(
        '/api/v1/auth/register',
        {
          method: 'POST',
          body: JSON.stringify({
            fullName: regName,
            email: regEmail,
            password: regPassword,
            role: regRole,
            schoolId: regSchoolId,
            grade: regGrade,
          }),
        }
      );
      setStoredAuth(res.token, res.csrfToken);
      onAuthenticated(res.user);
    } catch (err: any) {
      setAuthError(err.message || "Ro'yxatdan o'tishda xatolik.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    setAuthError(null);
    setAuthSuccess(null);
    try {
      const res = await apiFetch<{ message: string }>('/api/v1/auth/password-reset-request', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail }),
      });
      setAuthSuccess(res.message);
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const visibleProjects = projects.filter(
    (p) =>
      (p.status === 'showcase' || p.status === 'approved') &&
      (categoryFilter === 'all' || p.category === categoryFilter)
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <button
            type="button"
            onClick={() => onSelectTab('home')}
            className="text-lg font-bold tracking-tight text-[#1E3A8A] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#1E40AF]"
          >
            EduAI · IT Yoshlar
          </button>

          {/* Zone 2: 4 concise single-line navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              type="button"
              onClick={() => onSelectTab('home')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                activeTab === 'home' ? 'text-[#1E3A8A] border-b-2 border-[#1E3A8A]' : ''
              }`}
            >
              Bosh sahifa
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('about')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                activeTab === 'about' ? 'text-[#1E3A8A] border-b-2 border-[#1E3A8A]' : ''
              }`}
            >
              EduAI haqida
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('features')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                activeTab === 'features' ? 'text-[#1E3A8A] border-b-2 border-[#1E3A8A]' : ''
              }`}
            >
              Imkoniyatlar
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('projects')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                activeTab === 'projects' ? 'text-[#1E3A8A] border-b-2 border-[#1E3A8A]' : ''
              }`}
            >
              IT Yoshlar
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onSelectTab('login')}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#1E3A8A] rounded-lg hover:bg-[#1E40AF] transition-colors whitespace-nowrap shrink-0"
            >
              Tizimga kirish
            </button>
          </div>
        </div>

        {/* Mobile navigation row */}
        <div className="flex md:hidden items-center gap-4 overflow-x-auto pt-2.5 mt-2.5 border-t border-slate-100 text-xs font-medium text-slate-600">
          <button
            type="button"
            onClick={() => onSelectTab('home')}
            className={`whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'home' ? 'text-[#1E3A8A] font-semibold' : ''
            }`}
          >
            Bosh sahifa
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('about')}
            className={`whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'about' ? 'text-[#1E3A8A] font-semibold' : ''
            }`}
          >
            EduAI haqida
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('features')}
            className={`whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'features' ? 'text-[#1E3A8A] font-semibold' : ''
            }`}
          >
            Imkoniyatlar
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('projects')}
            className={`whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'projects' ? 'text-[#1E3A8A] font-semibold' : ''
            }`}
          >
            IT Yoshlar
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('register')}
            className={`whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'register' ? 'text-[#1E3A8A] font-semibold' : ''
            }`}
          >
            Ro'yxatdan o'tish
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {activeTab === 'home' && (
          <div className="space-y-16">
            {/* Hero Section */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
                <div className="text-xs font-medium text-[#1E3A8A] tracking-wide">
                  O'zbekiston maktablari uchun intellektual ta'lim va IT hamjamiyat
                </div>
                <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.15]">
                  Maktab fanlarini shaxsiy AI repetitor bilan tushunib o'rganing
                </h1>
                <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
                  EduAI o'quvchilarga Matematika va Ingliz tilini sodda yoki qadam-baqadam uslubda
                  tushuntiradi, tayyor javobni bermasdan mustaqil fikrlashga o'rgatadi. IT Yoshlar
                  esa maktab o'quvchilarining texnologik loyihalarini birlashtiradi.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => onSelectTab('login')}
                    className="px-5 py-3 text-sm font-semibold text-white bg-[#1E3A8A] rounded-lg hover:bg-[#1E40AF] transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                  >
                    <span>Platformani sinab ko'rish</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectTab('register')}
                    className="px-5 py-3 text-sm font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                  >
                    Yangi hisob ochish
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-2">
                  <span>145-sonli va 210-sonli pilot maktablar</span>
                  <span aria-hidden="true">·</span>
                  <span>Matematika va Ingliz tili (A1–B2)</span>
                  <span aria-hidden="true">·</span>
                  <span>O'qituvchi tasdig'idan o'tgan materiallar</span>
                </div>
              </div>

              {/* Right Column: Live Quick Role Access Card */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-5">
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-violet-700">
                    Tezkor ko'rib chiqish (Pilot ma'lumotlar bazasi)
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">
                    5 xil foydalanuvchi rolida bir tugma orqali sinab ko'ring
                  </h2>
                  <p className="text-xs text-slate-600">
                    Barcha ko'rsatkichlar SQLite ma'lumotlar bazasidagi haqiqiy yozuvlardan olinadi:
                  </p>
                </div>

                <div className="space-y-2">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      disabled={submitting}
                      onClick={() => handleQuickDemoLogin(acc.email)}
                      className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-[#1E3A8A] hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 group-hover:text-[#1E3A8A] truncate">
                          {acc.label}
                        </div>
                        <div className="text-xs text-slate-500 truncate">{acc.roleText}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#1E3A8A] shrink-0" />
                    </button>
                  ))}
                </div>

                <div className="text-xs text-slate-500 border-t border-slate-100 pt-3">
                  Demo parol: <code className="font-mono text-slate-700">EduAI2026!</code> · Maktablararo ma'lumotlar izolyatsiyasi yoqilgan
                </div>
              </div>
            </section>

            {/* Full-width KPI Strip from Real Stored Data */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="text-xs text-slate-500">Pilot maktablar (Chilonzor tumani)</div>
                <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                  {schools.length || 2} ta maktab
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  145-sonli va 210-sonli maktablar
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="text-xs text-slate-500">Dastlabki o'quv fanlari</div>
                <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                  2 ta asosiy modul
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Matematika (6–8-sinf) · Ingliz tili (A1–B2)
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="text-xs text-slate-500">IT Yoshlar loyihalari</div>
                <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                  {projects.length || 3} ta loyiha
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Mentor nazorati va maktab ko'rgazmasi
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="text-xs text-slate-500">Xavfsizlik va maxfiylik</div>
                <div className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">
                  5 bosqichli RBAC
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Maktab chegaralari serverda tekshiriladi
                </div>
              </div>
            </section>

            {/* Core Pillars */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  01. Pedagogik AI Repetitor
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  O'quvchi tanlagan uslubda (juda sodda, qadam-baqadam, batafsil) tushuntiradi.
                  "Ishora (Hint)" rejimida tayyor javobni aytib qo'ymasdan, o'quvchini mustaqil
                  yechimga yo'naltiradi.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-700 flex items-center justify-center">
                  <Code2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  02. IT Yoshlar Hamjamiyati
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Veb dasturlash, Telegram botlar, sun'iy intellekt, robototexnika va kiberxavfsizlik
                  yo'nalishlarida maktab o'quvchilari jamoaviy loyihalarni ustoz-mentor ko'rigidan
                  o'tkazib namoyish etadilar.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  03. O'qituvchi Tasdig'i va Maxfiylik
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Har bir rasmiy dars materiali o'qituvchi tomonidan ko'rib chiqiladi va
                  tasdiqlanadi. O'quvchilarning shaxsiy ma'lumotlari hamda suhbatlari boshqa
                  o'quvchilar yoki begona maktablarga aslo ko'rinmaydi.
                </p>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-xl p-6 sm:p-10 space-y-6">
            <div className="text-xs font-medium text-[#1E3A8A]">Loyiha missiyasi va arxitekturasi</div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              EduAI va IT Yoshlar nima uchun yaratildi?
            </h1>
            <p className="text-slate-700 leading-relaxed">
              <strong>EduAI</strong> — maktab o'quvchilariga fanlarni o'zlashtirishda yordam beruvchi
              o'zbek tilidagi intellektual ta'lim yordamchisi. U tayyor uy vazifasini ko'chirib
              beradigan oddiy chat emas, balki har bir o'quvchining sinfi va tushunish darajasiga
              moslashadigan pedagogik tizimdir.
            </p>
            <p className="text-slate-700 leading-relaxed">
              <strong>IT Yoshlar</strong> — o'quvchilarning dasturlash, robototexnika va
              kiberxavfsizlikka oid amaliy loyihalarini rivojlantirish maydoni. Platforma bitta
              maktabda pilot sifatida ishga tushirilib, tuman miqyosidagi barcha maktablarga
              kengaytirish uchun ko'p maktabli (multi-tenant) arxitekturada qurilgan.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
              <div>
                <h3 className="font-semibold text-slate-900">Pedagogik tamoyillar</h3>
                <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
                  <li>· Qoidani misoldan aniq ajratib ko'rsatish</li>
                  <li>· Ishora (Hint) orqali mustaqil yechimga undash</li>
                  <li>· O'quvchilarni ommaviy reyting bilan uyaltirmaslik</li>
                  <li>· O'qituvchi tasdiqlagan materiallarni AI javobidan farqlash</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Texnik va xavfsizlik asoslari</h3>
                <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
                  <li>· 5 ta rol: O'quvchi, O'qituvchi, Maktab va Tuman koordinatorlari, Admin</li>
                  <li>· Maktablararo qat'iy ma'lumotlar izolyatsiyasi</li>
                  <li>· Deterministik matematik tekshiruv dvigateli</li>
                  <li>· API kalitlari faqat serverda saqlanadi + Mock AI rejimi</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'features' && (
          <div className="space-y-8">
            <div>
              <div className="text-xs font-medium text-[#1E3A8A]">Platforma modullari</div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                Foydalanuvchi rollari bo'yicha imkoniyatlar
              </h1>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
                <h2 className="text-lg font-bold text-slate-900">1. O'quvchi moduli</h2>
                <p className="text-sm text-slate-600">
                  Shaxsiy o'quv paneli, Matematika (kasrlar, foizlar, chiziqli tenglamalar, geometriya,
                  nisbat va proporsiya) va Ingliz tili (CEFR A1–B2 lug'at, tarjima, grammatika, o'qib
                  tushunish), AI repetitor va IT Yoshlar loyihalari.
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
                <h2 className="text-lg font-bold text-slate-900">2. O'qituvchi moduli</h2>
                <p className="text-sm text-slate-600">
                  Biriktirilgan sinflarni boshqarish, yangi test va topshiriqlar tuzish, AI yaratgan
                  o'quv materiallarini tahrirlash va tasdiqlash, o'quvchilar ishini tekshirish hamda
                  CSV formatida hisobot yuklab olish.
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
                <h2 className="text-lg font-bold text-slate-900">
                  3. Maktab va Tuman Koordinatorlari
                </h2>
                <p className="text-sm text-slate-600">
                  IT Yoshlar loyihalarini moderatsiya qilish va ko'rgazmaga chiqarish, maktab va tuman
                  miqyosidagi IT tanlovlarni tashkil etish hamda shaxsiy yozishmalarni ochmasdan
                  umumlashtirilgan statistikani tahlil qilish.
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
                <h2 className="text-lg font-bold text-slate-900">4. Tizim Administratori</h2>
                <p className="text-sm text-slate-600">
                  Foydalanuvchilar va rollarni boshqarish, yangi maktablar qo'shish, audit jurnali,
                  AI provayder holati (Gemini / Mock rejimi), moderatsiya shikoyatlari va
                  ma'lumotlarni saqlash muddati (Data Retention) boshqaruvi.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="text-xs font-medium text-violet-700">
                  O'quvchilar texnologik hamjamiyati
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                  IT Yoshlar — Tasdiqlangan loyihalar ko'rgazmasi
                </h1>
              </div>

              {/* Interactive Filter Controls (Buttons allowed per Zero-Pill rules) */}
              <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
                {['all', 'Telegram botlar', 'Robototexnika', 'Veb dasturlash', 'Kiberxavfsizlik ta\'limi'].map(
                  (cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        categoryFilter === cat
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {cat === 'all' ? 'Barcha loyihalar' : cat}
                    </button>
                  )
                )}
              </div>
            </div>

            {loadingProjects ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map((n) => (
                  <div
                    key={n}
                    className="h-52 bg-white border border-slate-200 rounded-xl p-6 animate-pulse"
                  />
                ))}
              </div>
            ) : visibleProjects.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
                <p className="text-slate-600 text-sm">
                  Tanlangan yo'nalish bo'yicha hozircha tasdiqlangan loyihalar mavjud emas.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {visibleProjects.map((proj) => (
                  <div
                    key={proj.id}
                    className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      {/* Zero-Pill static metadata with typographic separators */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-medium text-[#1E3A8A]">{proj.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{proj.school_name}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-emerald-700 font-medium">
                          {proj.status === 'showcase' ? "Ko'rgazmada" : 'Tasdiqlangan'}
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-slate-900">{proj.title_uz}</h2>
                      <p className="text-sm text-slate-600 leading-relaxed">{proj.description_uz}</p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      <div className="text-xs text-slate-600">
                        <span className="font-medium text-slate-800">Jamoa:</span> {proj.team_names}{' '}
                        <span aria-hidden="true">·</span>{' '}
                        <span className="font-medium text-slate-800">Mentor:</span>{' '}
                        {proj.mentor_name || "Maktab ustozi"}
                      </div>
                      <div className="space-y-1">
                        {proj.milestones.map((m, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                            <CheckCircle2
                              className={`w-3.5 h-3.5 shrink-0 ${
                                m.done ? 'text-emerald-600' : 'text-slate-300'
                              }`}
                            />
                            <span>{m.title}</span>
                          </div>
                        ))}
                      </div>
                      {proj.demo_url && (
                        <div className="pt-1 flex items-center gap-4 text-xs font-medium text-[#1E3A8A]">
                          <a
                            href={proj.demo_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 hover:underline"
                          >
                            <span>Loyiha demosi</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          {proj.repo_url && (
                            <a
                              href={proj.repo_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 hover:underline"
                            >
                              <span>Kod manbasi</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'login' && (
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-6 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5">
              <div className="space-y-1">
                <div className="text-xs font-medium text-[#1E3A8A]">Xavfsiz autentifikatsiya</div>
                <h1 className="text-2xl font-bold text-slate-900">Tizimga kirish</h1>
                <p className="text-xs text-slate-500">
                  Maktab hisobingiz orqali kiring yoki o'ng tomondagi tayyor pilot rollardan birini
                  tanlang.
                </p>
              </div>

              {authError && (
                <div
                  role="alert"
                  className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium"
                >
                  {authError}
                </div>
              )}
              {authSuccess && (
                <div
                  role="status"
                  className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium"
                >
                  {authSuccess}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Elektron pochta
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#1E3A8A]"
                    placeholder="ism@eduai.uz"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Parol</label>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full px-3.5 pr-10 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#1E3A8A]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                      title={showLoginPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#1E3A8A] rounded-lg hover:bg-[#1E40AF] transition-colors inline-flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{submitting ? 'Tekshirilmoqda...' : 'Kirish'}</span>
                </button>
              </form>

              <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  className="hover:text-[#1E3A8A] underline"
                >
                  Parolni unutdingizmi?
                </button>
                <button
                  type="button"
                  onClick={() => onSelectTab('register')}
                  className="font-semibold text-[#1E3A8A] hover:underline"
                >
                  Ro'yxatdan o'tish
                </button>
              </div>
            </div>

            <div className="md:col-span-6 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-4">
              <div className="text-xs font-medium text-violet-700">Pilot sinov hisoblari</div>
              <h2 className="text-lg font-bold text-slate-900">
                Barcha 5 ta rolni darhol tekshirib ko'ring
              </h2>
              <p className="text-xs text-slate-600">
                Quyidagi tugmalardan birini bossangiz, mos foydalanuvchi sessiyasi ochiladi:
              </p>
              <div className="space-y-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    disabled={submitting}
                    onClick={() => handleQuickDemoLogin(acc.email)}
                    className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-[#1E3A8A] hover:bg-slate-50 transition-colors"
                  >
                    <div className="text-xs font-bold text-slate-900">{acc.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{acc.roleText}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'register' && (
          <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5">
            <div className="space-y-1">
              <div className="text-xs font-medium text-[#1E3A8A]">
                Maxfiylikka asoslangan ro'yxatdan o'tish
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Yangi hisob yaratish</h1>
              <p className="text-xs text-slate-500">
                O'quvchilar xavfsizligi uchun uy manzili yoki shaxsiy hujjat raqami talab qilinmaydi.
                Administrator hisobini ochiq ro'yxatdan o'tkazish taqiqlangan.
              </p>
            </div>

            {authError && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium"
              >
                {authError}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ism va familiya
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg"
                  placeholder="Masalan: Azizbek Mahmudov"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Elektron pochta
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg"
                  placeholder="azizbek@eduai.uz"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Foydalanuvchi toifasi
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as 'student' | 'teacher')}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg"
                  >
                    <option value="student">O'quvchi (Maktab o'quvchisi)</option>
                    <option value="teacher">O'qituvchi (Fan ustozi)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Maktab</label>
                  <select
                    value={regSchoolId}
                    onChange={(e) => setRegSchoolId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg"
                  >
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {regRole === 'student' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sinfingizni tanlang
                  </label>
                  <select
                    value={regGrade}
                    onChange={(e) => setRegGrade(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg"
                  >
                    {[5, 6, 7, 8, 9, 10, 11].map((g) => (
                      <option key={g} value={g}>
                        {g}-sinf
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Parol (kamida 8 ta belgi)
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-3.5 pr-10 py-2.5 text-sm bg-white border border-slate-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                    title={showRegPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#1E3A8A] rounded-lg hover:bg-[#1E40AF] transition-colors inline-flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>{submitting ? 'Yaratilmoqda...' : "Ro'yxatdan o'tish"}</span>
              </button>
            </form>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 text-[#1E3A8A] text-xs font-semibold">
              <Lock className="w-4 h-4" />
              <span>O'quvchilar maxfiyligi siyosati (Privacy by Design)</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Maxfiylik siyosati</h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              1. <strong>Minimal ma'lumot yig'ish:</strong> EduAI maktab o'quvchilaridan uy manzili,
              pasport/ID karta raqami yoki telefon raqamini talab qilmaydi.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              2. <strong>Shaxsiy yozishmalar daxlsizligi:</strong> O'quvchining AI repetitor bilan
              suhbatlari boshqa o'quvchilarga ko'rinmaydi. Maktab va tuman koordinatorlari faqat
              umumlashtirilgan statistikani ko'radilar.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              3. <strong>Ma'lumotlarni saqlash va o'chirish:</strong> O'quvchi o'z AI suhbat tarixini
              istalgan vaqtda o'chirishi mumkin. Tizim ma'muriyati ma'lumotlarni saqlash muddatini
              (standart 90 kun) boshqaradi.
            </p>
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-4">
            <h1 className="text-2xl font-bold text-slate-900">Foydalanish shartlari</h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              1. EduAI va IT Yoshlar platformasi faqat ta'lim va ilmiy-texnologik ijodkorlik
              maqsadlarida qo'llaniladi.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              2. Sun'iy intellekt javoblari yordamchi o'quv vositasi hisoblanadi. Faqat o'qituvchi
              tomonidan tekshirilib "Tasdiqlangan" holatiga o'tkazilgan darslargina rasmiy maktab
              materiali sanaladi.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              3. IT Yoshlar loyihalarini joylashtirishda maxfiy tokenlar, parollar yoki shaxsiy
              aloqa ma'lumotlarini ochiq qoldirish man etiladi.
            </p>
          </div>
        )}
      </main>

      {/* Clean Quiet Footer */}
      <footer className="bg-white border-t border-slate-200 px-4 sm:px-8 py-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>© 2026 EduAI va IT Yoshlar — Maktab ta'limi pilot platformasi (uz-UZ)</div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => onSelectTab('privacy')}
              className="hover:text-slate-900 transition-colors"
            >
              Maxfiylik siyosati
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('terms')}
              className="hover:text-slate-900 transition-colors"
            >
              Foydalanish shartlari
            </button>
            <a
              href="/api/v1/openapi.json"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-900 transition-colors"
            >
              OpenAPI v1
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
