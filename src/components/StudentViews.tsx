import React, { useState, useEffect } from 'react';
import {
  Send,
  Copy,
  Check,
  Flag,
  Trash2,
  Lightbulb,
  BookOpen,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Plus,
} from 'lucide-react';
import { apiFetch } from '../services/api';
import { MathText } from './MathText';
import type {
  UserProfile,
  LessonItem,
  AssignmentItem,
  QuestionItem,
  ProjectItem,
  NotificationItem,
  ExplanationStyle,
} from '../types';

export type StudentSection =
  | 'dashboard'
  | 'tutor'
  | 'math'
  | 'english'
  | 'quizzes'
  | 'results'
  | 'projects'
  | 'notifications'
  | 'settings';

interface StudentViewsProps {
  user: UserProfile;
  activeSection: StudentSection;
  onNavigate: (sec: StudentSection) => void;
  onUserUpdated: (updated: Partial<UserProfile>) => void;
}

export const StudentViews: React.FC<StudentViewsProps> = ({
  user,
  activeSection,
  onNavigate,
  onUserUpdated,
}) => {
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // AI Tutor state
  const [tutorSubject, setTutorSubject] = useState<'math' | 'english'>('math');
  const [tutorGrade, setTutorGrade] = useState<number>(user.grade || 7);
  const [tutorTopic, setTutorTopic] = useState<string>('Chiziqli tenglamalar');
  const [tutorStyle, setTutorStyle] = useState<ExplanationStyle>(
    user.preferredStyle || 'step_by_step'
  );
  const [tutorMode, setTutorMode] = useState<
    'explain' | 'hint' | 'example' | 'practice' | 'check_answer'
  >('explain');
  const [tutorQuestion, setTutorQuestion] = useState('');
  const [tutorStudentAnswer, setTutorStudentAnswer] = useState('');
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [reportingMsgId, setReportingMsgId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [lastAiDisclaimer, setLastAiDisclaimer] = useState<string | null>(null);

  // Interactive Math Sandbox state (2-Zone Sandbox Layout)
  const [fractionNum1, setFractionNum1] = useState(2);
  const [fractionNum2, setFractionNum2] = useState(3);
  const [fractionDenom, setFractionDenom] = useState(8);
  const [selectedMathLesson, setSelectedMathLesson] = useState<LessonItem | null>(null);

  // Interactive English Trainer state
  const [engLevelFilter, setEngLevelFilter] = useState<'ALL' | 'A1' | 'A2' | 'B1' | 'B2'>('ALL');
  const [selectedEngLesson, setSelectedEngLesson] = useState<LessonItem | null>(null);
  const [writingInput, setWritingInput] = useState('');
  const [writingFeedback, setWritingFeedback] = useState<string | null>(null);

  // Active Quiz Runner state
  const [activeAssignment, setActiveAssignment] = useState<AssignmentItem | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuestionItem[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});
  const [quizResult, setQuizResult] = useState<any | null>(null);
  const [quizSubmitting, setQuizSubmitting] = useState(false);

  // New IT Yoshlar Project state
  const [projTitle, setProjTitle] = useState('');
  const [projCategory, setProjCategory] = useState('Veb dasturlash');
  const [projDesc, setProjDesc] = useState('');
  const [projTeam, setProjTeam] = useState(`${user.fullName} (${user.grade || 7}-sinf)`);
  const [projDemo, setProjDemo] = useState('');
  const [projRepo, setProjRepo] = useState('');

  // Settings form state
  const [prefName, setPrefName] = useState(user.fullName);
  const [prefGrade, setPrefGrade] = useState(user.grade || 7);
  const [prefStyle, setPrefStyle] = useState<ExplanationStyle>(user.preferredStyle);
  const [prefEngLevel, setPrefEngLevel] = useState<'A1' | 'A2' | 'B1' | 'B2'>(user.englishLevel);

  const loadAllStudentData = async () => {
    setLoading(true);
    try {
      const [lesRes, assRes, subRes, projRes, notifRes, convRes] = await Promise.all([
        apiFetch<{ items: LessonItem[] }>('/api/v1/lessons'),
        apiFetch<{ items: AssignmentItem[] }>('/api/v1/assignments'),
        apiFetch<{ items: any[] }>('/api/v1/submissions'),
        apiFetch<{ items: ProjectItem[] }>('/api/v1/projects'),
        apiFetch<{ items: NotificationItem[] }>('/api/v1/notifications'),
        apiFetch<{ items: any[] }>('/api/v1/ai/conversations'),
      ]);
      setLessons(lesRes.items || []);
      setAssignments(assRes.items || []);
      setSubmissions(subRes.items || []);
      setProjects(projRes.items || []);
      setNotifications(notifRes.items || []);
      setConversations(convRes.items || []);

      const mathL = (lesRes.items || []).filter((l) => l.subject_code === 'math');
      if (mathL.length > 0 && !selectedMathLesson) setSelectedMathLesson(mathL[0]);

      const engL = (lesRes.items || []).filter((l) => l.subject_code === 'english');
      if (engL.length > 0 && !selectedEngLesson) setSelectedEngLesson(engL[0]);

      if (convRes.items && convRes.items.length > 0 && !activeConvId) {
        const firstConv = convRes.items[0];
        setActiveConvId(firstConv.id);
        const msgRes = await apiFetch<{ messages: any[] }>(
          `/api/v1/ai/conversations/${firstConv.id}/messages`
        );
        setMessages(msgRes.messages || []);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllStudentData();
  }, []);

  const handleStyleQuickChange = async (newStyle: ExplanationStyle) => {
    setTutorStyle(newStyle);
    setPrefStyle(newStyle);
    try {
      await apiFetch('/api/v1/users/me/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ preferredStyle: newStyle }),
      });
      onUserUpdated({ preferredStyle: newStyle });
      setStatusMessage("Tushuntirish uslubi yangilandi.");
      setTimeout(() => setStatusMessage(null), 2500);
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleSelectConversation = async (convId: string) => {
    setActiveConvId(convId);
    try {
      const msgRes = await apiFetch<{ messages: any[] }>(
        `/api/v1/ai/conversations/${convId}/messages`
      );
      setMessages(msgRes.messages || []);
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleDeleteConversation = async (convId: string) => {
    try {
      await apiFetch(`/api/v1/ai/conversations/${convId}`, { method: 'DELETE' });
      const remaining = conversations.filter((c) => c.id !== convId);
      setConversations(remaining);
      if (activeConvId === convId) {
        setActiveConvId(null);
        setMessages([]);
      }
      setStatusMessage("Suhbat tarixi o'chirildi.");
      setTimeout(() => setStatusMessage(null), 2500);
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleSendTutorQuestion = async (customPrompt?: string) => {
    const qText = (customPrompt ?? tutorQuestion).trim();
    if (!qText) return;
    setErrorMessage(null);
    setAiLoading(true);
    try {
      const res = await apiFetch<any>('/api/v1/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: activeConvId,
          subjectCode: tutorSubject,
          grade: tutorGrade,
          topic: tutorTopic,
          explanationStyle: tutorStyle,
          requestType: tutorMode,
          question: qText,
          studentAnswer: tutorMode === 'check_answer' ? tutorStudentAnswer : undefined,
        }),
      });
      setTutorQuestion('');
      setLastAiDisclaimer(res.disclaimerUz);
      setActiveConvId(res.conversationId);
      const msgRes = await apiFetch<{ messages: any[] }>(
        `/api/v1/ai/conversations/${res.conversationId}/messages`
      );
      setMessages(msgRes.messages || []);
      const convRes = await apiFetch<{ items: any[] }>('/api/v1/ai/conversations');
      setConversations(convRes.items || []);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim()) return;
    try {
      const res = await apiFetch<{ message: string }>('/api/v1/ai/report', {
        method: 'POST',
        body: JSON.stringify({
          messageId: reportingMsgId,
          reasonUz: reportReason,
        }),
      });
      setStatusMessage(res.message);
      setReportingMsgId(null);
      setReportReason('');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const startQuiz = async (assignment: AssignmentItem) => {
    setErrorMessage(null);
    setQuizResult(null);
    setQuizAnswers({});
    setRevealedHints({});
    try {
      const res = await apiFetch<{ assignment: AssignmentItem; questions: QuestionItem[] }>(
        `/api/v1/assignments/${assignment.id}`
      );
      setActiveAssignment(res.assignment);
      setQuizQuestions(res.questions || []);
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const submitQuizAnswers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssignment) return;
    setQuizSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await apiFetch<any>('/api/v1/submissions', {
        method: 'POST',
        body: JSON.stringify({
          assignmentId: activeAssignment.id,
          answers: quizAnswers,
        }),
      });
      setQuizResult(res);
      await loadAllStudentData();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setQuizSubmitting(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      const res = await apiFetch<{ message: string }>('/api/v1/projects', {
        method: 'POST',
        body: JSON.stringify({
          titleUz: projTitle,
          category: projCategory,
          descriptionUz: projDesc,
          teamNames: projTeam,
          demoUrl: projDemo,
          repoUrl: projRepo,
        }),
      });
      setProjTitle('');
      setProjDesc('');
      setProjDemo('');
      setProjRepo('');
      setStatusMessage(res.message);
      await loadAllStudentData();
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleJoinProject = async (projectId: string) => {
    try {
      const res = await apiFetch<{ message: string }>(`/api/v1/projects/${projectId}/join`, {
        method: 'POST',
      });
      setStatusMessage(res.message);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleCheckEnglishSentence = () => {
    const clean = writingInput.trim();
    if (!clean) return;
    const hasCapital = /^[A-Z]/.test(clean);
    const hasPunct = /[.!?]$/.test(clean);
    const wordCount = clean.split(/\s+/).length;

    const feedbackParts: string[] = [];
    if (wordCount >= 4) {
      feedbackParts.push("✓ Gap tuzilmasi to'liq (kamida 4 ta so'z qatnashgan).");
    } else {
      feedbackParts.push("△ Gapni kengaytirish uchun Ega + Fe'l + To'ldiruvchi qo'shing.");
    }
    if (!hasCapital) {
      feedbackParts.push("△ Ingliz tilida gap doimo bosh harf bilan boshlanadi.");
    }
    if (!hasPunct) {
      feedbackParts.push("△ Gap oxiriga nuqta yoki tinish belgisini qo'yishni unutmang.");
    }
    if (hasCapital && hasPunct && wordCount >= 4) {
      feedbackParts.push("✓ Grammatik imlo va tinish belgilari joyida!");
    }
    setWritingFeedback(feedbackParts.join(' '));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch<any>('/api/v1/users/me/preferences', {
        method: 'PATCH',
        body: JSON.stringify({
          fullName: prefName,
          grade: prefGrade,
          preferredStyle: prefStyle,
          englishLevel: prefEngLevel,
        }),
      });
      onUserUpdated({
        fullName: res.fullName,
        grade: res.grade,
        preferredStyle: res.preferredStyle,
        englishLevel: res.englishLevel,
      });
      setStatusMessage(res.message);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const mathLessons = lessons.filter((l) => l.subject_code === 'math');
  const englishLessons = lessons.filter(
    (l) =>
      l.subject_code === 'english' &&
      (engLevelFilter === 'ALL' || l.level_tag.includes(engLevelFilter))
  );

  const avgScore =
    submissions.length > 0
      ? Math.round(
          submissions.reduce((acc, s) => acc + Number(s.percentage || 0), 0) / submissions.length
        )
      : 0;

  return (
    <div className="space-y-6">
      {statusMessage && (
        <div
          role="status"
          className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center justify-between"
        >
          <span>{statusMessage}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-emerald-700 underline ml-4"
          >
            Yopish
          </button>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700 flex items-center justify-between"
        >
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-700 underline ml-4"
          >
            Yopish
          </button>
        </div>
      )}

      {/* 1. STUDENT DASHBOARD */}
      {activeSection === 'dashboard' && (
        <div className="space-y-8">
          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>{user.schoolName || '145-sonli pilot maktab'}</span>
                <span aria-hidden="true">·</span>
                <span>{user.grade || 7}-sinf</span>
                <span aria-hidden="true">·</span>
                <span>Ingliz tili darajasi: {user.englishLevel}</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">
                Xush kelibsiz, {user.fullName}!
              </h1>
              <p className="text-sm text-slate-600">
                Bugun qaysi fanni o'rganamiz? O'zingizga qulay tushuntirish uslubini tanlang:
              </p>
            </div>

            {/* Preferred Explanation Style Segmented Selector */}
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-slate-600">
                AI tushuntirish uslubi:
              </div>
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                {(
                  [
                    { id: 'very_simple', label: 'Juda sodda' },
                    { id: 'step_by_step', label: 'Qadam-baqadam' },
                    { id: 'detailed', label: 'Batafsil' },
                  ] as const
                ).map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleStyleQuickChange(st.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      tutorStyle === st.id
                        ? 'bg-white text-[#1E3A8A] shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Real Stored Statistics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs text-slate-500">Tasdiqlangan darslar</div>
              <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                {lessons.length} ta mavzu
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Matematika ({mathLessons.length}) · Ingliz tili ({lessons.length - mathLessons.length})
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs text-slate-500">Bajarilgan mashqlar</div>
              <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                {submissions.length} ta topshiriq
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Faol topshiriqlar: {assignments.length} ta
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs text-slate-500">O'rtacha mashq ko'rsatkichi</div>
              <div className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">
                {submissions.length > 0 ? `${avgScore}%` : '—'}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Shaxsiy o'sish ko'rsatkichi (rasmiy baho emas)
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs text-slate-500">IT Yoshlar loyihalari</div>
              <div className="text-2xl font-bold text-violet-700 mt-1 tabular-nums">
                {projects.length} ta loyiha
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Maktab texnologik hamjamiyati
              </div>
            </div>
          </div>

          {/* Continue Learning & Assigned Work */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">
                  O'qishni davom ettirish va tavsiya etilgan mavzular
                </h2>
                <button
                  type="button"
                  onClick={() => onNavigate('math')}
                  className="text-xs font-semibold text-[#1E3A8A] hover:underline"
                >
                  Barcha darslar
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {lessons.slice(0, 4).map((les) => (
                  <div
                    key={les.id}
                    className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="text-xs text-slate-500">
                        {les.subject_code === 'math' ? 'Matematika' : 'Ingliz tili'} · {les.level_tag}
                      </div>
                      <div className="text-sm font-semibold text-slate-900 truncate">
                        {les.title_uz}
                      </div>
                      <div className="text-xs text-slate-500 truncate">{les.summary_uz}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (les.subject_code === 'math') {
                          setSelectedMathLesson(les);
                          onNavigate('math');
                        } else {
                          setSelectedEngLesson(les);
                          onNavigate('english');
                        }
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-[#1E3A8A] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap shrink-0"
                    >
                      O'rganish
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">Biriktirilgan topshiriqlar</h2>
                <button
                  type="button"
                  onClick={() => onNavigate('quizzes')}
                  className="text-xs font-semibold text-[#1E3A8A] hover:underline"
                >
                  Barchasi
                </button>
              </div>

              {assignments.length === 0 ? (
                <p className="text-xs text-slate-500">Hozircha yangi topshiriqlar yo'q.</p>
              ) : (
                <div className="space-y-3">
                  {assignments.map((ass) => (
                    <div
                      key={ass.id}
                      className="p-3.5 rounded-lg border border-slate-200 space-y-2"
                    >
                      <div className="text-xs text-slate-500">
                        {ass.subject_code === 'math' ? 'Matematika' : 'Ingliz tili'} · Muddati:{' '}
                        <span className="tabular-nums">{ass.due_date || 'Cheklanmagan'}</span>
                      </div>
                      <div className="text-sm font-semibold text-slate-900">{ass.title_uz}</div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-slate-600 tabular-nums">
                          {ass.mySubmission
                            ? `Oxirgi natija: ${ass.mySubmission.percentage}%`
                            : 'Hali bajarilmagan'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            onNavigate('quizzes');
                            startQuiz(ass);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-[#1E3A8A] rounded-md hover:bg-[#1E40AF] transition-colors whitespace-nowrap shrink-0"
                        >
                          Boshlash
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. EDUAI AI TUTOR */}
      {activeSection === 'tutor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Panel: Context & History */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-5">
            <div className="space-y-1">
              <div className="text-xs font-medium text-violet-700">EduAI Intellektual Repetitor</div>
              <h2 className="text-lg font-bold text-slate-900">Mavzu va daraja sozlamalari</h2>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fan</label>
                <select
                  value={tutorSubject}
                  onChange={(e) => {
                    const next = e.target.value as 'math' | 'english';
                    setTutorSubject(next);
                    setTutorTopic(
                      next === 'math' ? 'Chiziqli tenglamalar' : 'Present Simple va Present Continuous'
                    );
                  }}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg"
                >
                  <option value="math">Matematika</option>
                  <option value="english">Ingliz tili (CEFR A1–B2)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sinf</label>
                  <select
                    value={tutorGrade}
                    onChange={(e) => setTutorGrade(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg"
                  >
                    {[5, 6, 7, 8, 9, 10, 11].map((g) => (
                      <option key={g} value={g}>
                        {g}-sinf
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Uslub</label>
                  <select
                    value={tutorStyle}
                    onChange={(e) => setTutorStyle(e.target.value as ExplanationStyle)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg"
                  >
                    <option value="very_simple">Juda sodda</option>
                    <option value="step_by_step">Qadam-baqadam</option>
                    <option value="detailed">Batafsil</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mavzu</label>
                <input
                  type="text"
                  value={tutorTopic}
                  onChange={(e) => setTutorTopic(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Yordam rejimi
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      { id: 'explain', label: 'Tushuntirish' },
                      { id: 'hint', label: 'Ishora (Javobsiz)' },
                      { id: 'example', label: '2 ta misol' },
                      { id: 'practice', label: 'Mustaqil mashq' },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setTutorMode(m.id)}
                      className={`px-2.5 py-2 text-xs font-medium rounded-lg border transition-colors ${
                        tutorMode === m.id
                          ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Conversation History */}
            <div className="pt-4 border-t border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Mening suhbatlarim</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveConvId(null);
                    setMessages([]);
                  }}
                  className="text-xs text-[#1E3A8A] font-medium hover:underline"
                >
                  + Yangi suhbat
                </button>
              </div>
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {conversations.map((c) => (
                  <div
                    key={c.id}
                    className={`flex items-center justify-between gap-2 p-2.5 rounded-lg border text-xs ${
                      activeConvId === c.id
                        ? 'border-[#1E3A8A] bg-blue-50/40'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectConversation(c.id)}
                      className="text-left truncate flex-1 font-medium text-slate-800"
                    >
                      {c.title_uz}
                    </button>
                    <button
                      type="button"
                      title="Suhbatni o'chirish"
                      onClick={() => handleDeleteConversation(c.id)}
                      className="text-slate-400 hover:text-red-600 p-1 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Chat & Pedagogical Interaction */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl flex flex-col min-h-[580px]">
            <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {tutorSubject === 'math' ? 'Matematika Repetitori' : 'Ingliz tili Repetitori'} ·{' '}
                  {tutorGrade}-sinf
                </h2>
                <div className="text-xs text-slate-500">
                  Mavzu: {tutorTopic} · Sun'iy intellekt xato qilishi mumkin, muhim qoidalarni
                  o'qituvchingiz bilan tekshiring.
                </div>
              </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 p-6 space-y-5 overflow-y-auto max-h-[420px]">
              {messages.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center mx-auto">
                    <Lightbulb className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 max-w-md mx-auto">
                    <h3 className="text-base font-bold text-slate-900">
                      Savolingizni yozing yoki tezkor mashq tanlang
                    </h3>
                    <p className="text-xs text-slate-500">
                      "Ishora (Javobsiz)" rejimida EduAI tayyor javobni aytib qo'ymaydi, balki
                      sizga keyingi qadamni topishga ko'maklashadi.
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    {[
                      '2x + 5 = 17 tenglamani qadam-baqadam tushuntiring',
                      'Kasrlarni qo\'shish bo\'yicha 2 ta misol ko\'rsating',
                      'Present Simple zamonida 3 ta mashq bering',
                    ].map((sample) => (
                      <button
                        key={sample}
                        type="button"
                        onClick={() => handleSendTutorQuestion(sample)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        {sample}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${
                      m.sender_role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-2xl rounded-xl p-4 ${
                        m.sender_role === 'user'
                          ? 'bg-[#1E3A8A] text-white'
                          : 'bg-slate-50 border border-slate-200 text-slate-900'
                      }`}
                    >
                      {m.sender_role === 'user' ? (
                        <p className="text-sm">{m.content_text}</p>
                      ) : (
                        <div className="space-y-3">
                          <MathText text={m.content_text} />
                          <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                            <span>
                              AI javobi (O'qituvchi tasdig'isiz) · Manba: {m.provider_used || 'mock'}
                            </span>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => handleCopyText(m.id, m.content_text)}
                                className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900"
                              >
                                {copiedId === m.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Nusxalandi</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Nusxa olish</span>
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => setReportingMsgId(m.id)}
                                className="inline-flex items-center gap-1 text-slate-600 hover:text-red-600"
                              >
                                <Flag className="w-3.5 h-3.5" />
                                <span>Xato haqida xabar berish</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {aiLoading && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 animate-pulse">
                  EduAI javob tayyorlamoqda...
                </div>
              )}
            </div>

            {lastAiDisclaimer && (
              <div className="px-6 py-2 bg-amber-50/70 border-t border-amber-200/60 text-[11px] text-amber-900">
                {lastAiDisclaimer}
              </div>
            )}

            {/* Report Modal Inline */}
            {reportingMsgId && (
              <form
                onSubmit={handleSubmitReport}
                className="px-6 py-3 bg-red-50 border-t border-red-200 flex flex-col sm:flex-row items-center gap-3"
              >
                <input
                  type="text"
                  required
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Nima uchun ushbu AI javobi noto'g'ri yoki noo'rin?"
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-red-300 rounded-lg w-full"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-lg"
                  >
                    Yuborish
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportingMsgId(null)}
                    className="px-3 py-1.5 text-xs text-slate-600"
                  >
                    Bekor qilish
                  </button>
                </div>
              </form>
            )}

            {/* Question Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendTutorQuestion();
              }}
              className="p-4 border-t border-slate-200 space-y-2"
            >
              {tutorMode === 'check_answer' && (
                <input
                  type="text"
                  value={tutorStudentAnswer}
                  onChange={(e) => setTutorStudentAnswer(e.target.value)}
                  placeholder="Sizning yechimingiz (Masalan: x = 6 yoki 3/4)..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                />
              )}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tutorQuestion}
                  onChange={(e) => setTutorQuestion(e.target.value)}
                  placeholder="Savolingizni yoki masalani o'zbek tilida yozing..."
                  className="flex-1 px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#1E3A8A]"
                />
                <button
                  type="submit"
                  disabled={aiLoading}
                  className="px-4 py-2.5 text-sm font-semibold text-white bg-[#1E3A8A] rounded-lg hover:bg-[#1E40AF] transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>Yuborish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. MATHEMATICS MODULE (With 2-Zone Interactive Sandbox) */}
      {activeSection === 'math' && (
        <div className="space-y-8">
          <div>
            <div className="text-xs font-medium text-[#1E3A8A]">
              Matematika o'quv moduli · O'qituvchi tasdiqlagan darslar va interaktiv laboratoriya
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">
              Matematika: Tushunchalar, namunaviy misollar va vizual simulyatsiya
            </h1>
          </div>

          {/* Two-Zone Sandbox Layout for Fraction & Ratio Visualization */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white border border-slate-200 rounded-xl p-6">
            {/* Left Zone (Interactive Visual Stage) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="text-xs font-semibold text-[#1E3A8A]">
                Interaktiv Vizual Model: Kasrlar va Foizlar Nisbati
              </div>
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                  <span>
                    Birinchi kasr: {fractionNum1}/{fractionDenom} + Ikkinchi kasr: {fractionNum2}/
                    {fractionDenom}
                  </span>
                  <span className="text-emerald-700 font-mono tabular-nums">
                    Jami: {fractionNum1 + fractionNum2}/{fractionDenom} (
                    {Math.round(((fractionNum1 + fractionNum2) / fractionDenom) * 100)}%)
                  </span>
                </div>

                {/* Visual Segmented Fraction Bar */}
                <div className="grid grid-cols-12 gap-1.5 pt-2">
                  {Array.from({ length: fractionDenom }).map((_, idx) => {
                    const isFirst = idx < fractionNum1;
                    const isSecond =
                      idx >= fractionNum1 && idx < fractionNum1 + fractionNum2;
                    return (
                      <div
                        key={idx}
                        className={`h-12 rounded-md border flex items-center justify-center text-xs font-mono tabular-nums transition-colors ${
                          isFirst
                            ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                            : isSecond
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-slate-400 border-slate-200'
                        }`}
                      >
                        1/{fractionDenom}
                      </div>
                    );
                  })}
                </div>

                <div className="text-xs text-slate-600 pt-2">
                  <MathText
                    text={`Formula tekshiruvi: $$\\frac{${fractionNum1}}{${fractionDenom}} + \\frac{${fractionNum2}}{${fractionDenom}} = \\frac{${fractionNum1} + ${fractionNum2}}{${fractionDenom}} = \\frac{${
                      fractionNum1 + fractionNum2
                    }}{${fractionDenom}}$$`}
                  />
                </div>
              </div>
            </div>

            {/* Right Zone (Control & Concept Deck) */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4 border-t lg:border-t-0 lg:border-l border-slate-200 pt-4 lg:pt-0 lg:pl-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Parametrlarni boshqarish</h3>

                <div>
                  <label className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>Birinchi kasr surati (a):</span>
                    <span className="font-mono tabular-nums">{fractionNum1} ulush</span>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={Math.max(1, fractionDenom - fractionNum2)}
                    value={fractionNum1}
                    onChange={(e) => setFractionNum1(Number(e.target.value))}
                    className="w-full accent-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>Ikkinchi kasr surati (b):</span>
                    <span className="font-mono tabular-nums">{fractionNum2} ulush</span>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={Math.max(1, fractionDenom - fractionNum1)}
                    value={fractionNum2}
                    onChange={(e) => setFractionNum2(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                </div>

                <div>
                  <label className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                    <span>Umumiy maxraj (c):</span>
                    <span className="font-mono tabular-nums">{fractionDenom} bo'lak</span>
                  </label>
                  <input
                    type="range"
                    min={4}
                    max={12}
                    value={fractionDenom}
                    onChange={(e) => {
                      const nextD = Number(e.target.value);
                      setFractionDenom(nextD);
                      if (fractionNum1 + fractionNum2 > nextD) {
                        setFractionNum1(1);
                        setFractionNum2(2);
                      }
                    }}
                    className="w-full accent-slate-700"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFractionNum1(2);
                  setFractionNum2(3);
                  setFractionDenom(8);
                }}
                className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 inline-flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Dastlabki holatga qaytarish</span>
              </button>
            </div>
          </div>

          {/* Topic Selection & Detailed Lesson View */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-2">
              <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Tasdiqlangan mavzular ({mathLessons.length})
              </div>
              {mathLessons.map((les) => (
                <button
                  key={les.id}
                  type="button"
                  onClick={() => setSelectedMathLesson(les)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors ${
                    selectedMathLesson?.id === les.id
                      ? 'bg-white border-[#1E3A8A] shadow-xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs text-slate-500">
                    {les.level_tag} · O'qituvchi tasdiqlagan
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{les.title_uz}</div>
                </button>
              ))}
            </div>

            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
              {selectedMathLesson ? (
                <>
                  <div className="space-y-1 border-b border-slate-100 pb-4">
                    <div className="text-xs text-emerald-700 font-medium">
                      ✓ O'qituvchi tomonidan tasdiqlangan rasmiy maktab materiali ·{' '}
                      {selectedMathLesson.level_tag}
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {selectedMathLesson.title_uz}
                    </h2>
                    <p className="text-xs text-slate-500">{selectedMathLesson.summary_uz}</p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-900">Nazariy tushuntirish va qoida</h3>
                    <MathText text={selectedMathLesson.content_uz} />
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <h3 className="text-sm font-bold text-slate-900">Ishlangan namuna</h3>
                    <MathText text={selectedMathLesson.worked_example_uz} />
                  </div>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setTutorSubject('math');
                        setTutorTopic(selectedMathLesson.title_uz);
                        onNavigate('tutor');
                      }}
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#1E3A8A] rounded-lg hover:bg-[#1E40AF]"
                    >
                      AI Repetitordan shu mavzuda so'rash
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('quizzes')}
                      className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                    >
                      Mavzu bo'yicha test ishlash
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500">Mavzuni tanlang.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. ENGLISH LEARNING MODULE (CEFR A1-B2) */}
      {activeSection === 'english' && (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-medium text-[#1E3A8A]">
                Ingliz tili o'quv moduli (CEFR darajalariga moslashtirilgan mashqlar)
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mt-1">
                Ingliz tili: Lug'at, Grammatika, Tarjima va Gap tuzish
              </h1>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
              {(['ALL', 'A1', 'A2', 'B1', 'B2'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setEngLevelFilter(lvl)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    engLevelFilter === lvl
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lvl === 'ALL' ? 'Barcha darajalar' : lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-2">
              {englishLessons.map((les) => (
                <button
                  key={les.id}
                  type="button"
                  onClick={() => setSelectedEngLesson(les)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors ${
                    selectedEngLesson?.id === les.id
                      ? 'bg-white border-[#1E3A8A]'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs text-slate-500">
                    Daraja: {les.level_tag} · O'qituvchi tasdiqlagan
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{les.title_uz}</div>
                </button>
              ))}
            </div>

            <div className="lg:col-span-8 space-y-6">
              {selectedEngLesson && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <div className="text-xs text-emerald-700 font-medium">
                    ✓ Tasdiqlangan ingliz tili darsi · Daraja: {selectedEngLesson.level_tag} (Rasmiy
                    CEFR imtihon sertifikati emas, o'quv mo'ljali)
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {selectedEngLesson.title_uz}
                  </h2>
                  <MathText text={selectedEngLesson.content_uz} />
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-xs font-bold text-slate-800 mb-1">Namuna va tarjima:</div>
                    <MathText text={selectedEngLesson.worked_example_uz} />
                  </div>
                </div>
              )}

              {/* Short Writing & Sentence Construction Practice */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900">
                  Qisqa yozma mashq va gap tuzish trenajyori (Sentence Construction)
                </h3>
                <p className="text-xs text-slate-600">
                  Mavzu bo'yicha ingliz tilida 1–2 ta gap yozing. Tizim so'z tartibi va imlo
                  qoidalarini tekshiradi yoki AI repetitor orqali tahlil qilib beradi:
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={writingInput}
                    onChange={(e) => setWritingInput(e.target.value)}
                    placeholder="Masalan: Our team builds a smart robotics project at school."
                    className="flex-1 px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleCheckEnglishSentence}
                    className="px-4 py-2.5 text-xs font-semibold text-white bg-[#1E3A8A] rounded-lg hover:bg-[#1E40AF] whitespace-nowrap shrink-0"
                  >
                    Gapni tekshirish
                  </button>
                </div>
                {writingFeedback && (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800">
                    {writingFeedback}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. QUIZZES & ASSIGNMENTS */}
      {activeSection === 'quizzes' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-medium text-[#1E3A8A]">
                Testlar, amaliy mashqlar va uy vazifalari
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mt-1">
                Biriktirilgan topshiriqlar
              </h1>
              <p className="text-xs text-slate-500">
                To'g'ri javoblar topshiriq yuborilmaguncha brauzerga uzatilmaydi va serverda
                deterministik tekshiriladi.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignments.map((ass) => (
              <div
                key={ass.id}
                className={`bg-white border rounded-xl p-5 space-y-3 ${
                  activeAssignment?.id === ass.id ? 'border-[#1E3A8A]' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {ass.subject_code === 'math' ? 'Matematika' : 'Ingliz tili'} · {ass.grade}-sinf
                  </span>
                  <span className="tabular-nums">Muddati: {ass.due_date || '—'}</span>
                </div>
                <h2 className="text-base font-bold text-slate-900">{ass.title_uz}</h2>
                <p className="text-xs text-slate-600">{ass.description_uz}</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-600 tabular-nums">
                    {ass.mySubmission
                      ? `Bajarilgan: ${ass.mySubmission.score}/${ass.mySubmission.max_score} (${ass.mySubmission.percentage}%)`
                      : `${ass.question_count || 4} ta savol`}
                  </span>
                  <button
                    type="button"
                    onClick={() => startQuiz(ass)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#1E3A8A] rounded-lg hover:bg-[#1E40AF]"
                  >
                    {ass.mySubmission ? 'Qayta ishlash' : 'Testni boshlash'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {activeAssignment && (
            <form
              onSubmit={submitQuizAnswers}
              className="bg-white border border-slate-200 rounded-xl p-6 space-y-6"
            >
              <div className="border-b border-slate-200 pb-4">
                <div className="text-xs text-[#1E3A8A] font-medium">
                  Faol mashq · Rasmiy maktab chorak bahosi emas, o'quv mashqi natijasi
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-1">
                  {activeAssignment.title_uz}
                </h2>
              </div>

              <div className="space-y-6">
                {quizQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="text-sm font-semibold text-slate-900">
                        {idx + 1}. {q.promptUz}
                      </div>
                      <span className="text-xs text-slate-500 font-mono tabular-nums shrink-0">
                        {q.points} ball
                      </span>
                    </div>

                    {q.questionType === 'multiple_choice' && Array.isArray(q.options) ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt) => (
                          <label
                            key={opt}
                            className={`flex items-center gap-2.5 p-3 rounded-lg border text-xs sm:text-sm cursor-pointer transition-colors ${
                              quizAnswers[q.id] === opt
                                ? 'bg-blue-50 border-[#1E3A8A] text-[#1E3A8A] font-semibold'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`q-${q.id}`}
                              value={opt}
                              checked={quizAnswers[q.id] === opt}
                              onChange={() =>
                                setQuizAnswers((prev) => ({ ...prev, [q.id]: opt }))
                              }
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={quizAnswers[q.id] || ''}
                        onChange={(e) =>
                          setQuizAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                        }
                        placeholder="Javobingizni kiriting..."
                        className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                      />
                    )}

                    {/* Step-by-step Hint Toggle */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          setRevealedHints((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
                        }
                        className="text-xs font-medium text-violet-700 hover:underline inline-flex items-center gap-1"
                      >
                        <Lightbulb className="w-3.5 h-3.5" />
                        <span>
                          {revealedHints[q.id] ? 'Ishorani yashirish' : 'Qadam-baqadam ishora olish'}
                        </span>
                      </button>
                      {revealedHints[q.id] && (
                        <div className="mt-2 p-2.5 rounded-lg bg-violet-50 text-xs text-violet-900">
                          <strong>Ishora:</strong> {q.hintUz}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={quizSubmitting}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-[#1E3A8A] rounded-lg hover:bg-[#1E40AF]"
                >
                  {quizSubmitting ? 'Tekshirilmoqda...' : 'Javoblarni yuborish va tekshirish'}
                </button>
              </div>

              {quizResult && (
                <div className="p-5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900">
                      Natija: {quizResult.score} / {quizResult.maxScore} ball (
                      {quizResult.percentage}%)
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {(quizResult.results || []).map((r: any, i: number) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-white border border-slate-200 text-xs space-y-1"
                      >
                        <div className="flex items-center gap-2 font-semibold">
                          {r.isCorrect ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                          )}
                          <span>
                            {i + 1}-savol: Sizning javobingiz "{r.studentAnswer || '—'}" —{' '}
                            {r.isCorrect ? "To'g'ri" : 'Xato'}
                          </span>
                        </div>
                        <div className="text-slate-600">{r.feedbackUz}</div>
                        <div className="text-slate-500">
                          <strong>Yechim izohi:</strong> {r.explanationUz}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      )}

      {/* 6. STUDENT RESULTS & PROGRESS */}
      {activeSection === 'results' && (
        <div className="space-y-6">
          <div>
            <div className="text-xs font-medium text-[#1E3A8A]">Shaxsiy o'quv tarixi</div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">
              Mening natijalarim va ustoz fikr-mulohazalari
            </h1>
          </div>

          {submissions.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
              Siz hali birorta topshiriq yubormagansiz.
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="bg-white border border-slate-200 rounded-xl p-6 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-xs text-slate-500">
                        {sub.subject_code === 'math' ? 'Matematika' : 'Ingliz tili'} · Topshirilgan
                        vaqt: {new Date(sub.submitted_at).toLocaleDateString('uz-UZ')}
                      </div>
                      <h2 className="text-base font-bold text-slate-900">
                        {sub.assignment_title}
                      </h2>
                    </div>
                    <div className="text-lg font-bold text-emerald-700 font-mono tabular-nums">
                      {sub.score} / {sub.max_score} ball ({sub.percentage}%)
                    </div>
                  </div>

                  {sub.teacher_feedback_uz && (
                    <div className="p-3.5 rounded-lg bg-blue-50/60 border border-blue-200 text-xs text-slate-800">
                      <strong>Ustoz izohi:</strong> {sub.teacher_feedback_uz}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. MY IT YOSHLAR PROJECTS */}
      {activeSection === 'projects' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-4">
            <div>
              <div className="text-xs font-medium text-violet-700">IT Yoshlar hamjamiyati</div>
              <h1 className="text-2xl font-bold text-slate-900 mt-1">
                Maktab texnologik loyihalari
              </h1>
            </div>

            {projects.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-slate-200 rounded-xl p-5 space-y-3"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-[#1E3A8A]">{p.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>Holati: {p.status}</span>
                  <span aria-hidden="true">·</span>
                  <span>Jamoa: {p.team_names}</span>
                </div>
                <h2 className="text-base font-bold text-slate-900">{p.title_uz}</h2>
                <p className="text-xs text-slate-600 leading-relaxed">{p.description_uz}</p>
                {p.review_feedback_uz && (
                  <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    {p.review_feedback_uz}
                  </div>
                )}
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Mentor: {p.mentor_name || 'Dilshod Toshmatov'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleJoinProject(p.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-[#1E3A8A] bg-blue-50 rounded-lg hover:bg-blue-100"
                  >
                    Jamoaga qo'shilish
                  </button>
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleCreateProject}
            className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4"
          >
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Plus className="w-4 h-4 text-[#1E3A8A]" />
              <span>Yangi IT Yoshlar loyihasini taqdim etish</span>
            </div>
            <p className="text-xs text-slate-500">
              Loyihangiz ustoz-mentor va maktab koordinatori tasdig'idan so'ng ko'rgazmaga
              chiqariladi. Maxfiy kalitlarni kiritmang.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Loyiha nomi
              </label>
              <input
                type="text"
                required
                value={projTitle}
                onChange={(e) => setProjTitle(e.target.value)}
                placeholder="Masalan: Maktab Oshxonasi Menyu Boti"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Yo'nalish</label>
              <select
                value={projCategory}
                onChange={(e) => setProjCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
              >
                <option value="Veb dasturlash">Veb dasturlash</option>
                <option value="Telegram botlar">Telegram botlar</option>
                <option value="Sun'iy intellekt">Sun'iy intellekt</option>
                <option value="Robototexnika">Robototexnika</option>
                <option value="Kiberxavfsizlik ta'limi">Kiberxavfsizlik ta'limi</option>
                <option value="Ta'limiy vositalar">Ta'limiy vositalar</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Loyiha haqida qisqacha
              </label>
              <textarea
                rows={3}
                required
                value={projDesc}
                onChange={(e) => setProjDesc(e.target.value)}
                placeholder="Loyiha qanday muammoni hal qiladi va qanday texnologiyalar ishlatildi?"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jamoa a'zolari (Telefon raqamsiz)
              </label>
              <input
                type="text"
                value={projTeam}
                onChange={(e) => setProjTeam(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Demo havola (ixtiyoriy)
                </label>
                <input
                  type="url"
                  value={projDemo}
                  onChange={(e) => setProjDemo(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Repozitoriy (ixtiyoriy)
                </label>
                <input
                  type="url"
                  value={projRepo}
                  onChange={(e) => setProjRepo(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-[#1E3A8A] rounded-lg hover:bg-[#1E40AF]"
            >
              Mentor ko'rigiga yuborish
            </button>
          </form>
        </div>
      )}

      {/* 8. NOTIFICATIONS */}
      {activeSection === 'notifications' && (
        <div className="max-w-3xl space-y-4">
          <h1 className="text-2xl font-bold text-slate-900">Bildirishnomalar</h1>
          {notifications.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-xs text-slate-500">
              Bildirishnomalar yo'q.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`bg-white border rounded-xl p-4 flex items-start justify-between gap-4 ${
                  n.is_read ? 'border-slate-200 opacity-75' : 'border-[#1E3A8A]'
                }`}
              >
                <div className="space-y-1">
                  <div className="text-sm font-bold text-slate-900">{n.title_uz}</div>
                  <div className="text-xs text-slate-600">{n.body_uz}</div>
                </div>
                {!n.is_read && (
                  <button
                    type="button"
                    onClick={async () => {
                      await apiFetch(`/api/v1/notifications/${n.id}/read`, { method: 'PATCH' });
                      setNotifications((prev) =>
                        prev.map((item) => (item.id === n.id ? { ...item, is_read: 1 } : item))
                      );
                    }}
                    className="text-xs font-semibold text-[#1E3A8A] hover:underline shrink-0"
                  >
                    O'qildi deb belgilash
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* 9. SETTINGS */}
      {activeSection === 'settings' && (
        <form
          onSubmit={handleSaveSettings}
          className="max-w-xl bg-white border border-slate-200 rounded-xl p-6 space-y-4"
        >
          <h1 className="text-xl font-bold text-slate-900">Shaxsiy o'quv sozlamalari</h1>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ism va familiya
            </label>
            <input
              type="text"
              value={prefName}
              onChange={(e) => setPrefName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sinf</label>
              <select
                value={prefGrade}
                onChange={(e) => setPrefGrade(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg"
              >
                {[5, 6, 7, 8, 9, 10, 11].map((g) => (
                  <option key={g} value={g}>
                    {g}-sinf
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ingliz tili darajasi
              </label>
              <select
                value={prefEngLevel}
                onChange={(e) => setPrefEngLevel(e.target.value as any)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg"
              >
                <option value="A1">A1 (Boshlang'ich)</option>
                <option value="A2">A2 (Tayanch)</option>
                <option value="B1">B1 (O'rta)</option>
                <option value="B2">B2 (Yuqori o'rta)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Standart AI tushuntirish uslubi
            </label>
            <select
              value={prefStyle}
              onChange={(e) => setPrefStyle(e.target.value as ExplanationStyle)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg"
            >
              <option value="very_simple">Juda sodda (kundalik misollar bilan)</option>
              <option value="step_by_step">Qadam-baqadam (tartibli bosqichlar bilan)</option>
              <option value="detailed">Batafsil (qoida va bir nechta misollar bilan)</option>
            </select>
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 text-xs font-semibold text-white bg-[#1E3A8A] rounded-lg hover:bg-[#1E40AF]"
          >
            Sozlamalarni saqlash
          </button>
        </form>
      )}
    </div>
  );
};
