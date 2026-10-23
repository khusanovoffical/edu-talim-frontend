import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Project } from '../types';
import {
  Code, Plus, CheckCircle, Clock, XCircle, ExternalLink,
  Github, Layers, Users, Sparkles, FolderGit2, Trash2
} from 'lucide-react';
import { BackButton } from '../components/BackButton';

const CATEGORIES = [
  { value: 'web', label: 'Web Ilova' },
  { value: 'bot', label: 'Telegram/Bot' },
  { value: 'ai', label: "Sun'iy Intellekt" },
  { value: 'robotics', label: 'Robototexnika' },
  { value: 'tools', label: 'Dasturiy vosita' },
  { value: 'mobile', label: 'Mobil ilova' },
  { value: 'game', label: "O'yin" },
  { value: 'other', label: 'Boshqa' }
];

export const MyProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('web');
  const [description, setDescription] = useState('');
  const [teamMembers, setTeamMembers] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await api.getProjects({ my_projects: true });
      setProjects(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !repoUrl) return;

    setSubmitting(true);
    setMessage('');
    setErrorMessage('');
    try {
      await api.createProject({
        title,
        description,
        category,
        team_members: teamMembers,
        repo_url: repoUrl
      });
      setShowModal(false);
      setTitle('');
      setDescription('');
      setTeamMembers('');
      setRepoUrl('');
      setMessage("Loyihangiz muvaffaqiyatli topshirildi va koordinator ko'rigiga yuborildi!");
      loadProjects();
    } catch (err: any) {
      setErrorMessage(`Xatolik: ${err.message || 'Loyihani saqlashda xatolik yuz berdi'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Tasdiqlandi (Ko'rgazmada)
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Qayta ko'rish kerak
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Ko'rib chiqilmoqda
          </span>
        );
    }
  };

  const getCategoryLabel = (cat: string) => {
    const found = CATEGORIES.find(c => c.value === cat);
    return found ? found.label : cat;
  };

  const handleDeleteProject = async (projectId: number) => {
    if (!window.confirm("Haqiqatan ham bu loyihani o'chirmoqchimisiz?")) return;
    try {
      const token = localStorage.getItem('eduai_token');
      const res = await fetch(`/api/v1/projects/${projectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage("Loyiha muvaffaqiyatli o'chirildi");
        loadProjects();
      }
    } catch (e: any) {
      setErrorMessage(e.message || "O'chirishda xatolik");
    }
  };

  return (
    <div className="space-y-6">
      <BackButton to="/dashboard" label="Asosiy boshqaruvga qaytish" />

      {/* Sarlavha paneli */}
      <div className="bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative shadow-lg overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-violet-200 text-xs font-bold mb-3 border border-white/10">
              <Code className="w-3.5 h-3.5" />
              <span>IT Yoshlar Hamjamiyati</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Mening IT Loyihalarim</h1>
            <p className="text-xs sm:text-sm text-violet-200/90 mt-1.5 max-w-2xl leading-relaxed">
              O'zingiz yaratgan dasturlar va innovatsion texnologik ishlanmalaringizni topshiring, ustozlar taqrizini oling va loyihalar ko'rgazmasida ishtirok eting.
            </p>
          </div>

          <button
            onClick={() => {
              setMessage('');
              setErrorMessage('');
              setShowModal(true);
            }}
            className="px-5 py-3 bg-violet-600 hover:bg-violet-500 active:scale-95 text-white rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 self-start sm:self-auto shadow-md shadow-violet-700/30 border border-violet-400/30"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi loyiha qo'shish</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs sm:text-sm text-emerald-900 flex items-center gap-3 shadow-sm animate-fadeIn">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{message}</span>
        </div>
      )}

      {/* Loyihalar ro'yxati */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {projects.length === 0 ? (
          <div className="col-span-full bg-white rounded-3xl p-12 border border-slate-200/80 text-center shadow-sm">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <FolderGit2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Hozircha loyihalar mavjud emas</h3>
            <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto">
              "Yangi loyiha qo'shish" tugmasi orqali ilk dasturiy ishingizni yuklang va IT hamjamiyatimiz a'zosiga aylaning!
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-5 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Ilk loyihani topshirish</span>
            </button>
          </div>
        ) : (
          projects.map(p => (
            <div
              key={p.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 relative group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-xl bg-violet-50 text-violet-700 border border-violet-100">
                    <Layers className="w-3.5 h-3.5" />
                    {getCategoryLabel(p.category)}
                  </span>
                  {getStatusBadge(p.status)}
                </div>

                <h3 className="text-base font-extrabold text-slate-900 group-hover:text-violet-700 transition">
                  {p.title}
                </h3>
                <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                  {p.description}
                </p>

                {p.team_members && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-100">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span><strong>Jamoa a'zolari:</strong> {p.team_members}</span>
                  </div>
                )}
              </div>

              {p.review_notes && (
                <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 text-xs text-slate-700">
                  <span className="font-bold text-slate-900 flex items-center gap-1 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Ustoz taqrizi:
                  </span>
                  <p className="text-slate-600 leading-relaxed">{p.review_notes}</p>
                </div>
              )}

              {/* Havola tugmalari */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
                {p.repo_url ? (
                  <a
                    href={p.repo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-sm hover:shadow transition transform active:scale-95"
                  >
                    <Github className="w-4 h-4" />
                    <span>GitHub kod ombori</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                ) : (
                  <span className="text-xs text-slate-400 italic">GitHub havolasi yo'q</span>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {new Date(p.created_at).toLocaleDateString('uz-UZ')}
                  </span>
                  <button
                    onClick={() => handleDeleteProject(p.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Loyihani o'chirish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Yangi loyiha qo'shish modali */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto animate-scaleUp">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-violet-100 text-violet-700 rounded-xl">
                  <FolderGit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Yangi IT Loyihasini Topshirish</h3>
                  <p className="text-[11px] text-slate-400">Ustozlar ko'rigi uchun ma'lumotlarni to'ldiring</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-lg font-bold transition"
              >
                ×
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Loyiha nomi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Masalan: EduBot — Maktab uchun Telegram Bot"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-600 focus:bg-white focus:outline-none font-medium transition"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Yo'nalish (Kategoriya) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-600 focus:bg-white focus:outline-none font-semibold text-slate-800 transition"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Loyiha haqida batafsil ma'lumot <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Loyiha qanday muammoni hal qiladi, qaysi dasturlash tilida yozilgan va qanday ishlaydi?"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-600 focus:bg-white focus:outline-none font-medium transition resize-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Jamoa a'zolari (Ixtiyoriy)
                </label>
                <input
                  type="text"
                  value={teamMembers}
                  onChange={e => setTeamMembers(e.target.value)}
                  placeholder="Xusanov Xumoyun, Hasan Umarov"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-600 focus:bg-white focus:outline-none font-medium transition"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  GitHub kod ombori havolasi (majburiy) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Github className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    required
                    value={repoUrl}
                    onChange={e => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/khusanov/project-name"
                    className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-600 focus:bg-white focus:outline-none font-medium transition"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Loyiha kodi ochiq (public) bo'lishi yoki koordinatorlar ko'rishi mumkin bo'lgan GitHub repozitoriyasi bo'lishi kerak.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting || !title || !description || !repoUrl}
                  className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 text-white rounded-xl font-bold transition shadow-md shadow-violet-600/20 active:scale-95"
                >
                  {submitting ? 'Yuborilmoqda...' : 'Loyihani topshirish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
