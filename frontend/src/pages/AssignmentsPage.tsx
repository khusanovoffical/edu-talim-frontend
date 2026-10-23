import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Assignment, Exercise, Submission } from '../types';
import { MathRenderer } from '../components/MathRenderer';
import { BackButton } from '../components/BackButton';
import {
  FileText, Clock, CheckCircle2, Calendar, AlertCircle,
  ChevronRight, ArrowLeft, Send, Award, CheckCircle, Star, Image as ImageIcon
} from 'lucide-react';

export const AssignmentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  const [assignmentQuestions, setAssignmentQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const token = localStorage.getItem('eduai_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch available assignments
      const assigns = await api.getAssignments();
      setAssignments(assigns);

      // 2. Fetch student's submitted assignments
      const subRes = await fetch('/api/v1/assignments/my-submissions', { headers });
      if (subRes.ok) {
        const subsData = await subRes.json();
        setSubmissions(subsData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAssignment = async (assign: Assignment) => {
    setActiveAssignment(assign);
    setSubmissionResult(null);
    setAnswers({});
    setErrorMessage('');

    try {
      // Fetch full assignment details with questions
      const res = await fetch(`/api/v1/assignments/${assign.id}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.questions && data.questions.length > 0) {
          setAssignmentQuestions(data.questions);
        } else {
          // Fallback to sample exercises if no questions attached
          const exList = await api.getExercises();
          setAssignmentQuestions(exList.slice(0, 3).map(e => ({
            id: e.id,
            question_text: e.question_text,
            question_type: e.question_type,
            options: e.options,
            points: e.points || 10
          })));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async () => {
    if (!activeAssignment) return;
    setSubmitting(true);
    setErrorMessage('');
    try {
      const res = await api.submitAssignment(activeAssignment.id, answers);
      setSubmissionResult(res);
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message || "Topshirishda xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter pending vs completed
  const submittedAssignmentIds = new Set(submissions.map(s => s.assignment_id));
  const pendingAssignments = assignments.filter(a => !submittedAssignmentIds.has(a.id));

  return (
    <div className="space-y-6">
      <BackButton to="/dashboard" label="Asosiy boshqaruvga qaytish" />

      {/* Sarlavha */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative shadow-lg overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold mb-2 backdrop-blur-md">
              <FileText className="w-3.5 h-3.5 text-blue-300" />
              <span>EduAI O'quvchi Vazifalari</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Topshiriqlar va Vazifalarim
            </h1>
            <p className="text-sm text-blue-100 mt-1 max-w-xl">
              Ustozlaringiz biriktirgan topshiriqlarni yeching, o'zlashtirish foizingizni kuzating va o'qituvchi taqrizlarini oling.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white rounded-2xl p-1.5 border border-slate-200/80 shadow-sm max-w-md">
        <button
          onClick={() => { setActiveTab('pending'); setActiveAssignment(null); }}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'pending'
              ? 'bg-blue-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Hali qilinmagan ({pendingAssignments.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('completed'); setActiveAssignment(null); }}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'completed'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Bajarilgan ({submissions.length})</span>
        </button>
      </div>

      {!activeAssignment ? (
        activeTab === 'pending' ? (
          /* Hali qilinmagan topshiriqlar */
          <div className="space-y-4">
            {pendingAssignments.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center shadow-sm">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-3 opacity-90" />
                <h3 className="text-lg font-bold text-slate-800">Barcha topshiriqlar topshirilgan!</h3>
                <p className="text-xs text-slate-500 mt-1">Yangi topshiriqlar biriktirilganda darhol shu yerda ko'rinadi.</p>
              </div>
            ) : (
              pendingAssignments.map(a => (
                <div
                  key={a.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase tracking-wider">
                        Faol topshiriq
                      </span>
                      {a.due_date && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Muddat: {new Date(a.due_date).toLocaleDateString('uz-UZ')}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{a.title}</h3>
                    {a.description && <p className="text-xs text-slate-600 leading-relaxed">{a.description}</p>}
                  </div>

                  <button
                    onClick={() => handleOpenAssignment(a)}
                    className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 self-start sm:self-auto shadow-md"
                  >
                    <span>Topshiriqni yechish</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Bajarilgan topshiriqlar va baholar */
          <div className="space-y-4">
            {submissions.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center shadow-sm">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-800">Bajarilgan vazifalar yo'q</h3>
                <p className="text-xs text-slate-500 mt-1">Siz hali birorta ham topshiriq yubormadingiz.</p>
              </div>
            ) : (
              submissions.map(sub => {
                const pct = sub.percentage !== undefined ? sub.percentage : (sub.max_score ? Math.round((sub.score / sub.max_score) * 100) : 100);
                return (
                  <div
                    key={sub.id}
                    className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Topshirilgan
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(sub.submitted_at).toLocaleDateString('uz-UZ')}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900">
                        {sub.assignment_title || `Topshiriq #${sub.assignment_id}`}
                      </h3>
                      {sub.teacher_feedback && (
                        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900">
                          <span className="font-bold">Ustoz taqrizi:</span> {sub.teacher_feedback}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 self-start md:self-auto">
                      <div className="text-right">
                        <span className="text-xs text-slate-500 block">Natija</span>
                        <span className="text-2xl font-black text-emerald-700">{pct}%</span>
                        <span className="text-[10px] text-slate-400 block font-mono">{sub.score} / {sub.max_score} ball</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )
      ) : (
        /* Topshiriqni yechish interfeysi */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <button
              onClick={() => setActiveAssignment(null)}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Topshiriqlar ro'yxatiga qaytish</span>
            </button>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Topshiriq #{activeAssignment.id}
            </span>
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-slate-900">{activeAssignment.title}</h2>
            {activeAssignment.description && (
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">{activeAssignment.description}</p>
            )}
          </div>

          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {submissionResult ? (
            /* Yuborilgandan keyingi natija kartochkasi */
            <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-3xl text-center space-y-4">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">Topshiriq muvaffaqiyatli topshirildi!</h3>
              <p className="text-sm text-slate-700">
                Sizning to'plagan balingiz: <strong>{submissionResult.score} / {submissionResult.max_score}</strong>
              </p>
              <div className="text-3xl font-black text-emerald-700">
                {submissionResult.percentage !== undefined ? submissionResult.percentage : Math.round((submissionResult.score / submissionResult.max_score) * 100)}%
              </div>
              <div className="pt-2">
                <button
                  onClick={() => { setActiveAssignment(null); setActiveTab('completed'); }}
                  className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition shadow-md"
                >
                  Bajarilgan topshiriqlarni ko'rish
                </button>
              </div>
            </div>
          ) : (
            /* Savollar formasi */
            <div className="space-y-6">
              {assignmentQuestions.map((q, idx) => (
                <div key={q.id || idx} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="font-extrabold text-sm text-slate-900">
                      {idx + 1}-savol:
                    </span>
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">
                      {q.points || 10} ball
                    </span>
                  </div>

                  <MathRenderer content={q.question_text || ''} />

                  {/* Agar savolga rasm biriktirilgan bo'lsa */}
                  {q.image_url && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 max-w-md">
                      <img src={q.image_url} alt="Savol rasmi" className="w-full object-cover" />
                    </div>
                  )}

                  {/* Variantlar yoki ochiq javob */}
                  {q.options && q.options.length > 0 ? (
                    <div className="space-y-2 pt-2">
                      {q.options.map((opt: string, optIdx: number) => (
                        <label
                          key={optIdx}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition text-xs font-semibold ${
                            answers[`q_${q.id}`] === opt
                              ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-xs'
                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q_${q.id}`}
                            value={opt}
                            checked={answers[`q_${q.id}`] === opt}
                            onChange={() => setAnswers({ ...answers, [`q_${q.id}`]: opt })}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="pt-2">
                      <input
                        type="text"
                        placeholder="Javobingizni shu yerga yozing..."
                        value={answers[`q_${q.id}`] || ''}
                        onChange={e => setAnswers({ ...answers, [`q_${q.id}`]: e.target.value })}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              ))}

              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Yuborilmoqda...' : 'Javoblarni topshirish'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AssignmentsPage;
