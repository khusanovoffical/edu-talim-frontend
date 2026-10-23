import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Project } from '../types';
import {
  Code, ExternalLink, Github, Sparkles, Filter,
  Bot, Globe, Cpu, Wrench
} from 'lucide-react';

export const ProjectsShowcasePage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, [selectedCategory]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const cat = selectedCategory === 'all' ? undefined : selectedCategory;
      const data = await api.getProjects({ category: cat });
      setProjects(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', label: 'Barchasi', icon: Code },
    { id: 'web', label: 'Veb-saytlar', icon: Globe },
    { id: 'bot', label: 'Telegram Botlar', icon: Bot },
    { id: 'ai', label: 'Sun\'iy Intellekt', icon: Sparkles },
    { id: 'robotics', label: 'Robototexnika', icon: Cpu },
    { id: 'tools', label: 'Utilitalar', icon: Wrench },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-6">
      
      {/* Sarlavha */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-100 text-violet-800 text-xs font-extrabold uppercase tracking-wider">
          <Code className="w-4 h-4" />
          <span>IT Yoshlar Loyihalar Ko'rgazmasi</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Maktab O'quvchilarining Ilg'or Texnologik Ishlanmalari
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          O'quvchilar tomonidan yaratilgan haqiqiy dasturiy loyihalar, sun'iy intellekt yechimlari va robototexnika ixtirolari.
        </p>
      </div>

      {/* Kategoriya filtri */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
        {categories.map(c => {
          const Icon = c.icon;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                selectedCategory === c.id
                  ? 'bg-violet-700 text-white border-violet-700 shadow-md shadow-violet-600/20'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{c.label}</span>
            </button>
          );
        })}
      </div>

      {/* Loyihalar ko'rgazmasi kartochkalari */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200">
            <Code className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-800">Ushbu yo'nalishda loyihalar mavjud emas</h3>
            <p className="text-xs text-slate-500 mt-1">Boshqa toifani tanlang yoki yangi loyiha topshiring.</p>
          </div>
        ) : (
          projects.map(p => (
            <div
              key={p.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 border border-violet-100 uppercase tracking-wider">
                    {p.category}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    Maktab #{p.school_id}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{p.title}</h3>
                <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                  {p.description}
                </p>

                {p.team_members && (
                  <p className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-100">
                    <strong>Jamoa:</strong> {p.team_members}
                  </p>
                )}
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-slate-100 text-xs">
                <div className="flex items-center gap-3">
                  {p.demo_url && (
                    <a
                      href={p.demo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-violet-700 font-bold hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Demo ko'rish</span>
                    </a>
                  )}
                  {p.repo_url && (
                    <a
                      href={p.repo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-700 font-semibold hover:underline flex items-center gap-1"
                    >
                      <Github className="w-3.5 h-3.5" />
                      <span>GitHub</span>
                    </a>
                  )}
                </div>

                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Tasdiqlangan
                </span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
