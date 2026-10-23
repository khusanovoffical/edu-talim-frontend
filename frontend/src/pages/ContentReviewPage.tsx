import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Lesson, Subject } from '../types';
import { MathRenderer } from '../components/MathRenderer';
import {
  CheckSquare, Check, X, Edit3, BookOpen, Clock,
  CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';

export const ContentReviewPage: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [feedback, setFeedback] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [les, subs] = await Promise.all([
        api.getLessons(),
        api.getSubjects()
      ]);
      setLessons(les);
      setSubjects(subs);
      if (les.length > 0 && !activeLesson) {
        setActiveLesson(les[0]);
        setEditingContent(les[0].content_markdown);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLesson = (l: Lesson) => {
    setActiveLesson(l);
    setEditingContent(l.content_markdown);
    setFeedback(l.status === 'rejected' ? 'Qayta ko\'rib chiqildi' : '');
    setStatusMessage('');
  };

  const handleReviewAction = async (newStatus: 'approved' | 'rejected') => {
    if (!activeLesson) return;
    try {
      await api.reviewLesson(activeLesson.id, {
        status: newStatus,
        review_feedback: feedback || (newStatus === 'approved' ? "O'qituvchi tomonidan tasdiqlandi" : "Rad etildi")
      });
      setStatusMessage(`Dars muvaffaqiyatli ${newStatus === 'approved' ? 'tasdiqlandi' : 'rad etildi'}!`);
      loadData();
    } catch (err: any) {
      setStatusMessage(`Xatolik: ${err.message}`);
    }
  };

  const getSubjectName = (subId: number) => {
    return subjects.find(s => s.id === subId)?.name || 'Fan';
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-emerald-700" />
            AI Ta'limiy Kontentini Ko'rib Chiqish va Tasdiqlash
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Faqat tasdiqlangan (Approved) dars materiallari maktab o'quvchilari uchun ochiq bo'ladi
          </p>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chap panel: Darslar ro'yxati */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block px-2 mb-2">
            Dars materiallari ({lessons.length} ta)
          </span>

          <div className="space-y-1.5 max-h-[70vh] overflow-y-auto">
            {lessons.map(l => (
              <button
                key={l.id}
                onClick={() => handleSelectLesson(l)}
                className={`w-full text-left p-3 rounded-xl text-xs transition border ${
                  activeLesson?.id === l.id
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold'
                    : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-500 text-[11px]">{getSubjectName(l.subject_id)}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    l.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                    l.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {l.status}
                  </span>
                </div>
                <div className="truncate font-bold">{l.title}</div>
                <div className="text-[11px] text-slate-400 mt-1">{l.grade}-sinf</div>
              </button>
            ))}
          </div>
        </div>

        {/* O'ng panel: Kontentni tahlil qilish va tasdiqlash */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          {activeLesson ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                    {getSubjectName(activeLesson.subject_id)} • {activeLesson.grade}-sinf
                  </span>
                  <h2 className="text-lg font-extrabold text-slate-900 mt-1">{activeLesson.title}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReviewAction('approved')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition"
                  >
                    <Check className="w-4 h-4" />
                    <span>Tasdiqlash (Approve)</span>
                  </button>
                  <button
                    onClick={() => handleReviewAction('rejected')}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition"
                  >
                    <X className="w-4 h-4" />
                    <span>Rad etish</span>
                  </button>
                </div>
              </div>

              {/* Tahrirlash yoki ko'rish */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Dars matni (Markdown va Matematik formulalar):
                </label>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl max-h-96 overflow-y-auto">
                  <MathRenderer content={activeLesson.content_markdown} />
                </div>
              </div>

              {/* Taqriz izohi */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Ustoz izohi / Taqriz (O'quvchi yoki muallifga yo'llanma):
                </label>
                <input
                  type="text"
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder="Masalan: Darslik talablariga mos keladi, tasdiqlandi."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-400">
              Darsni tanlang
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
