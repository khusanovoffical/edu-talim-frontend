import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Assignment, Project, ExplanationStyle } from '../types';
import {
  Sparkles, BookOpen, Calculator, Globe, CheckCircle2,
  Clock, ArrowRight, Code, Trophy, HelpCircle, Bot, AlertCircle
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStyle, setUpdatingStyle] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getAssignments(),
      api.getProjects({ my_projects: true })
    ])
      .then(([assigns, projs]) => {
        setAssignments(assigns);
        setProjects(projs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleStyleChange = async (style: ExplanationStyle) => {
    setUpdatingStyle(true);
    try {
      await api.updateProfile({ explanation_style: style });
      await refreshUser();
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingStyle(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Xush kelibsiz banneri */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl shadow-blue-950/10">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold mb-4 text-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-violet-300" />
            <span>EduAI Sun'iy Intellekt Ta'lim Yordamchisi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Xush kelibsiz, {user?.full_name}!
          </h1>
          <p className="mt-2 text-sm sm:text-base text-blue-100 font-normal leading-relaxed">
            Bugun qaysi fanni chuqurroq o'rganamiz? EduAI sizning {user?.grade || 9}-sinf darslaringiz bo'yicha savollaringizga bosqichma-bosqich javob berishga tayyor.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/ai-tutor"
              className="px-5 py-2.5 bg-white text-blue-900 font-bold text-sm rounded-xl hover:bg-blue-50 transition shadow-sm flex items-center gap-2"
            >
              <Bot className="w-4 h-4 text-violet-600" />
              EduAI Repetitoriga savol berish
            </Link>
            <Link
              to="/assignments"
              className="px-5 py-2.5 bg-blue-800/80 hover:bg-blue-800 text-white font-semibold text-sm rounded-xl border border-blue-700/60 transition flex items-center gap-2"
            >
              Vazifalarni ko'rish
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Tushuntirish uslubi sozlamasi */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-600" />
            Mening afzal ko'rgan tushuntirish uslubim:
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            EduAI repetitori javoblarini siz xohlagan qulay formatda shakllantiradi
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'very_simple', label: 'Juda oddiy' },
            { id: 'step_by_step', label: 'Bosqichma-bosqich' },
            { id: 'detailed', label: 'Batafsil tahlil' }
          ].map(s => (
            <button
              key={s.id}
              disabled={updatingStyle}
              onClick={() => handleStyleChange(s.id as ExplanationStyle)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border ${
                user?.explanation_style === s.id
                  ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Asosiy Fanlar */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">O'rganishni davom ettirish</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Matematika */}
          <Link
            to="/math"
            className="group bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl group-hover:scale-105 transition">
                <Calculator className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                {user?.grade || 9}-sinf
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-4 group-hover:text-blue-700 transition">
              {user?.grade || 9}-sinf Matematika va Algebra
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {user?.grade === 7 ? 'Kasrlar, nisbat va proporsiya, koordinatalar sistemasi.' :
               user?.grade === 8 ? 'Kvadrat tenglamalar, ko\'pburchaklar, aylana va doira.' :
               user?.grade === 10 ? 'Logarifm, trigonometriya, kombinatorika.' :
               user?.grade === 11 ? 'Integral, differensial, vektorlar.' :
               'Chiziqli tenglamalar, oddiy va o\'nli kasrlar, foizlar, asosiy geometriya masalalari.'}</p>
            <div className="mt-4 flex items-center justify-between text-xs font-semibold text-blue-700">
              <span>Mavzular va amaliy mashqlar</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </Link>

          {/* Ingliz tili */}
          <Link
            to="/english"
            className="group bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-violet-300 transition relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div className="p-3 bg-violet-50 text-violet-700 rounded-2xl group-hover:scale-105 transition">
                <Globe className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-violet-100 text-violet-800">
                A1 - B2 Darajalar
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-4 group-hover:text-violet-700 transition">
              Ingliz tili (English Language)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Lug'at boyligi, zamonlar va grammatika qoidalari, gap tuzish va o'qib tushunish.
            </p>
            <div className="mt-4 flex items-center justify-between text-xs font-semibold text-violet-700">
              <span>Lug'at va testlar</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </Link>

        </div>
      </div>

      {/* 4. Faol topshiriqlar va IT Yoshlar holati */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Topshiriqlar ro'yxati */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-700" />
              Biriktirilgan amaliy vazifalar
            </h3>
            <Link to="/assignments" className="text-xs font-semibold text-blue-700 hover:underline">
              Barchasi ({assignments.length})
            </Link>
          </div>

          {assignments.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold text-slate-800">Hozircha faol topshiriqlar yo'q</p>
              <p className="text-xs text-slate-500 mt-1">O'qituvchingiz yangi topshiriq yuklaganda shu yerda paydo bo'ladi.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.slice(0, 3).map(a => (
                <div key={a.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{a.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{a.description || 'Mashqlarni bajaring va bilimingizni sinang'}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                      <span>Savollar soni: <strong>{a.questions_count || 3} ta</strong></span>
                      {a.due_date && <span>Muddati: {new Date(a.due_date).toLocaleDateString('uz-UZ')}</span>}
                    </div>
                  </div>
                  <Link
                    to="/assignments"
                    className="px-4 py-2 bg-blue-700 text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition"
                  >
                    Bajarish
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* IT Yoshlar Bloki */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="p-2.5 bg-violet-100 text-violet-700 rounded-xl">
                <Code className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold text-violet-700 uppercase tracking-wider">IT Yoshlar</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">Mening IT Loyihalarim</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Dasturlash, botlar, veb-saytlar yoki robototexnika loyihangiz bormi? Uni maktab hamjamiyatiga taqdim eting!
            </p>

            <div className="mt-4 p-3 bg-violet-50/60 rounded-xl border border-violet-100">
              <div className="text-xs text-violet-900 font-semibold">Sizning loyihalaringiz: {projects.length} ta</div>
              {projects.length > 0 && (
                <div className="text-[11px] text-violet-700 mt-1 font-medium truncate">
                  Oxirgi: {projects[0].title} ({projects[0].status})
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <Link
              to="/my-projects"
              className="w-full text-center py-2.5 bg-violet-700 hover:bg-violet-800 text-white font-bold text-xs rounded-xl shadow-sm transition"
            >
              Yangi IT loyiha topshirish
            </Link>
            <Link
              to="/projects-showcase"
              className="w-full text-center py-2 text-slate-600 hover:text-slate-900 font-semibold text-xs transition"
            >
              Ko'rgazmadagi boshqa loyihalar
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
};
