import React, { useState, useEffect } from 'react';
import {
  Download,
  Plus,
  CheckCircle2,
  XCircle,
  Edit3,
  ShieldAlert,
  Calendar,
  School,
  Users,
  FileText,
} from 'lucide-react';
import { apiFetch, getStoredToken } from '../services/api';
import { MathText } from './MathText';
import type { UserProfile, UserRole } from '../types';

export type StaffSection =
  | 'teacher_dashboard'
  | 'teacher_classes'
  | 'teacher_quiz_builder'
  | 'teacher_content_review'
  | 'teacher_submissions'
  | 'coord_dashboard'
  | 'coord_projects'
  | 'coord_events'
  | 'admin_users'
  | 'admin_schools'
  | 'admin_ai_moderation'
  | 'admin_audit_settings';

interface StaffViewsProps {
  user: UserProfile;
  activeSection: StaffSection;
  onNavigate: (sec: StaffSection) => void;
}

export const StaffViews: React.FC<StaffViewsProps> = ({
  user,
  activeSection,
  onNavigate,
}) => {
  const [teacherData, setTeacherData] = useState<any>(null);
  const [coordData, setCoordData] = useState<any>(null);
  const [adminData, setAdminData] = useState<any>(null);
  const [reportsSummary, setReportsSummary] = useState<any>(null);
  const [allLessons, setAllLessons] = useState<any[]>([]);
  const [selectedClassDetail, setSelectedClassDetail] = useState<any>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Teacher: Create Class state
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState(7);
  const [newClassSubject, setNewClassSubject] = useState('math');

  // Teacher: Quiz Builder state
  const [qbTitle, setQbTitle] = useState('');
  const [qbDesc, setQbDesc] = useState('');
  const [qbSubject, setQbSubject] = useState('math');
  const [qbGrade, setQbGrade] = useState(7);
  const [qbClassId, setQbClassId] = useState('class-7a-math');
  const [qbDueDate, setQbDueDate] = useState('2026-12-01');
  const [qbQuestions, setQbQuestions] = useState([
    {
      questionType: 'numeric',
      promptUz: '4x + 8 = 28 tenglamadan x ni toping:',
      options: ['', '', '', ''],
      correctAnswer: '5',
      hintUz: '4x = 28 - 8 amali orqali hisoblang.',
      explanationUz: '4x = 20, x = 20 / 4 = 5.',
      points: 10,
    },
  ]);

  // Teacher: Content Review / Edit Modal state
  const [editingLesson, setEditingLesson] = useState<any | null>(null);
  const [editLessonTitle, setEditLessonTitle] = useState('');
  const [editLessonContent, setEditLessonContent] = useState('');
  const [editLessonExample, setEditLessonExample] = useState('');
  const [editLessonNotes, setEditLessonNotes] = useState('');

  // Teacher: Submission Feedback state
  const [feedbackMap, setFeedbackMap] = useState<Record<string, string>>({});

  // Coordinator: New Event state
  const [evtTitle, setEvtTitle] = useState('');
  const [evtDesc, setEvtDesc] = useState('');
  const [evtDate, setEvtDate] = useState('2026-12-10');
  const [evtCategory, setEvtCategory] = useState('IT Yoshlar musobaqasi');

  // Admin: New School state & Destructive Confirmation state
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolCode, setNewSchoolCode] = useState('');
  const [newSchoolCity, setNewSchoolCity] = useState('Toshkent');
  const [confirmToggleUser, setConfirmToggleUser] = useState<any | null>(null);
  const [retentionDaysInput, setRetentionDaysInput] = useState('90');
  const [aiModeInput, setAiModeInput] = useState('auto');

  const loadRoleData = async () => {
    setErrorMsg(null);
    try {
      const rep = await apiFetch('/api/v1/reports/summary').catch(() => null);
      setReportsSummary(rep);

      if (user.role === 'teacher' || user.role === 'admin') {
        const [tRes, lRes] = await Promise.all([
          apiFetch('/api/v1/teacher/overview'),
          apiFetch<{ items: any[] }>('/api/v1/lessons'),
        ]);
        setTeacherData(tRes);
        setAllLessons(lRes.items || []);
        if (tRes.classes?.length > 0 && !selectedClassDetail) {
          const detail = await apiFetch(`/api/v1/classes/${tRes.classes[0].id}`);
          setSelectedClassDetail(detail);
        }
      }

      if (
        user.role === 'school_coordinator' ||
        user.role === 'district_coordinator' ||
        user.role === 'admin'
      ) {
        const cRes = await apiFetch('/api/v1/coordinator/overview');
        setCoordData(cRes);
      }

      if (user.role === 'admin') {
        const aRes = await apiFetch('/api/v1/admin/overview');
        setAdminData(aRes);
        if (aRes.settings?.retention_days) setRetentionDaysInput(aRes.settings.retention_days);
        if (aRes.settings?.ai_mode) setAiModeInput(aRes.settings.ai_mode);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  useEffect(() => {
    loadRoleData();
  }, [user.role]);

  const showToast = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const handleDownloadCsv = async () => {
    try {
      const token = getStoredToken();
      const res = await fetch('/api/v1/teacher/export-csv', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const csvText = await res.text();
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'eduai_maktab_hisoboti.csv';
      a.click();
      URL.revokeObjectURL(url);
      showToast('CSV hisobot yuklab olindi.');
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/classes', {
        method: 'POST',
        body: JSON.stringify({
          name: newClassName,
          grade: newClassGrade,
          subjectCode: newClassSubject,
        }),
      });
      setNewClassName('');
      showToast('Yangi sinf muvaffaqiyatli yaratildi.');
      await loadRoleData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/assignments', {
        method: 'POST',
        body: JSON.stringify({
          titleUz: qbTitle,
          descriptionUz: qbDesc,
          subjectCode: qbSubject,
          grade: qbGrade,
          classId: qbClassId,
          dueDate: qbDueDate,
          assignmentType: 'quiz',
          questions: qbQuestions.map((q) => ({
            ...q,
            options:
              q.questionType === 'multiple_choice'
                ? q.options.filter((o) => o.trim().length > 0)
                : null,
          })),
        }),
      });
      setQbTitle('');
      setQbDesc('');
      showToast("Yangi test va topshiriq sinfga e'lon qilindi!");
      await loadRoleData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleReviewLesson = async (
    lessonId: string,
    newStatus: 'approved' | 'rejected' | 'archived'
  ) => {
    try {
      await apiFetch(`/api/v1/lessons/${lessonId}/review`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: newStatus,
          titleUz: editingLesson?.id === lessonId ? editLessonTitle : undefined,
          contentUz: editingLesson?.id === lessonId ? editLessonContent : undefined,
          workedExampleUz: editingLesson?.id === lessonId ? editLessonExample : undefined,
          revisionNotes:
            editLessonNotes ||
            (newStatus === 'approved'
              ? "O'qituvchi tomonidan tahrirlandi va rasman tasdiqlandi."
              : `Holat ${newStatus} ga o'zgartirildi.`),
        }),
      });
      setEditingLesson(null);
      setEditLessonNotes('');
      showToast(`Material holati '${newStatus}' ga yangilandi.`);
      await loadRoleData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleSendSubmissionFeedback = async (subId: string) => {
    const text = feedbackMap[subId];
    if (!text || !text.trim()) return;
    try {
      await apiFetch(`/api/v1/submissions/${subId}/feedback`, {
        method: 'PATCH',
        body: JSON.stringify({ feedbackUz: text }),
      });
      showToast("O'quvchiga fikr-mulohaza yuborildi.");
      await loadRoleData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleModerateProject = async (
    projId: string,
    status: 'approved' | 'showcase' | 'rejected'
  ) => {
    try {
      await apiFetch(`/api/v1/projects/${projId}/moderate`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          reviewFeedbackUz:
            status === 'showcase'
              ? "IT Yoshlar ko'rgazmasiga tasdiqlandi!"
              : status === 'approved'
              ? 'Maktab loyihasi sifatida tasdiqlandi.'
              : 'Loyiha tavsifini boyitib qayta yuboring.',
        }),
      });
      showToast(`Loyiha holati '${status}' ga yangilandi.`);
      await loadRoleData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/coordinator/events', {
        method: 'POST',
        body: JSON.stringify({
          titleUz: evtTitle,
          descriptionUz: evtDesc,
          eventDate: evtDate,
          category: evtCategory,
          scope: user.role === 'district_coordinator' ? 'district' : 'school',
        }),
      });
      setEvtTitle('');
      setEvtDesc('');
      showToast('Yangi tadbir muvaffaqiyatli rejalashtirildi.');
      await loadRoleData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleAdminUpdateUser = async (
    targetId: string,
    updates: { role?: UserRole; isActive?: boolean }
  ) => {
    try {
      await apiFetch(`/api/v1/admin/users/${targetId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      setConfirmToggleUser(null);
      showToast("Foydalanuvchi huquqlari yangilandi va audit jurnaliga yozildi.");
      await loadRoleData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleAdminCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/admin/schools', {
        method: 'POST',
        body: JSON.stringify({
          name: newSchoolName,
          code: newSchoolCode,
          city: newSchoolCity,
        }),
      });
      setNewSchoolName('');
      setNewSchoolCode('');
      showToast("Yangi maktab tizimga qo'shildi.");
      await loadRoleData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleAdminSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          retentionDays: Number(retentionDaysInput),
          aiMode: aiModeInput,
        }),
      });
      showToast('Platforma va AI sozlamalari saqlandi.');
      await loadRoleData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {statusMsg && (
        <div
          role="status"
          className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center justify-between"
        >
          <span>{statusMsg}</span>
          <button
            type="button"
            onClick={() => setStatusMsg(null)}
            className="underline ml-4"
          >
            Yopish
          </button>
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700 flex items-center justify-between"
        >
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg(null)} className="underline ml-4">
            Yopish
          </button>
        </div>
      )}

      {/* =====================================================================
          TEACHER SECTIONS
      ===================================================================== */}
      {activeSection === 'teacher_dashboard' && teacherData && (
        <div className="space-y-8">
          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-slate-500">
                O'qituvchi boshqaruv paneli · {user.schoolName || '145-sonli maktab'}
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mt-0.5">{user.fullName}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadCsv}
                className="px-4 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Natijalarni CSV yuklab olish</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('teacher_quiz_builder')}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#1E3A8A] rounded-lg hover:bg-[#1E40AF] inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Yangi topshiriq tuzish</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs text-slate-500">Biriktirilgan sinflarim</div>
              <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                {teacherData.classes?.length || 0} ta sinf
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs text-slate-500">Tasdiqlash kutilayotgan AI kontent</div>
              <div className="text-2xl font-bold text-amber-700 mt-1 tabular-nums">
                {teacherData.pendingLessons?.length || 0} ta qoralama
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs text-slate-500">Topshirilgan mashqlar</div>
              <div className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">
                {teacherData.recentSubmissions?.length || 0} ta yechim
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-xs text-slate-500">AI javoblari bo'yicha murojaatlar</div>
              <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                {teacherData.reportedAI?.length || 0} ta
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">
                  Ko'rib chiqish kutilayotgan AI materiallari
                </h2>
                <button
                  type="button"
                  onClick={() => onNavigate('teacher_content_review')}
                  className="text-xs font-semibold text-[#1E3A8A] hover:underline"
                >
                  Barchasini ko'rish
                </button>
              </div>
              {teacherData.pendingLessons?.length === 0 ? (
                <p className="text-xs text-slate-500">Barcha materiallar ko'rib chiqilgan.</p>
              ) : (
                <div className="space-y-3">
                  {teacherData.pendingLessons.map((les: any) => (
                    <div
                      key={les.id}
                      className="p-3.5 rounded-lg border border-slate-200 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <div className="text-xs text-amber-700 font-medium">
                          Holati: {les.approval_status} · {les.level_tag}
                        </div>
                        <div className="text-sm font-semibold text-slate-900 truncate">
                          {les.title_uz}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingLesson(les);
                          setEditLessonTitle(les.title_uz);
                          setEditLessonContent(les.content_uz);
                          setEditLessonExample(les.worked_example_uz);
                          onNavigate('teacher_content_review');
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-[#1E3A8A] bg-blue-50 rounded-md shrink-0"
                      >
                        Tekshirish
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">
                  So'nggi topshirilgan o'quvchi ishlari
                </h2>
                <button
                  type="button"
                  onClick={() => onNavigate('teacher_submissions')}
                  className="text-xs font-semibold text-[#1E3A8A] hover:underline"
                >
                  Barchasi
                </button>
              </div>
              <div className="space-y-3">
                {(teacherData.recentSubmissions || []).slice(0, 4).map((sub: any) => (
                  <div
                    key={sub.id}
                    className="p-3.5 rounded-lg border border-slate-200 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {sub.student_name} ({sub.grade || 7}-sinf)
                      </div>
                      <div className="text-xs text-slate-500">{sub.assignment_title}</div>
                    </div>
                    <div className="text-sm font-bold text-emerald-700 font-mono tabular-nums">
                      {sub.score}/{sub.max_score} ({sub.percentage}%)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'teacher_classes' && teacherData && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 space-y-4">
            <h1 className="text-xl font-bold text-slate-900">Biriktirilgan sinflarim</h1>
            <div className="space-y-2.5">
              {(teacherData.classes || []).map((cls: any) => (
                <button
                  key={cls.id}
                  type="button"
                  onClick={async () => {
                    const detail = await apiFetch(`/api/v1/classes/${cls.id}`);
                    setSelectedClassDetail(detail);
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-colors ${
                    selectedClassDetail?.classInfo?.id === cls.id
                      ? 'bg-white border-[#1E3A8A]'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs text-slate-500">
                    {cls.grade}-sinf · {cls.subject_code === 'math' ? 'Matematika' : 'Ingliz tili'}
                  </div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">{cls.name}</div>
                  <div className="text-xs text-slate-600 mt-1 tabular-nums">
                    O'quvchilar soni: {cls.student_count || 0} nafar
                  </div>
                </button>
              ))}
            </div>

            <form
              onSubmit={handleCreateClass}
              className="bg-white border border-slate-200 rounded-xl p-5 space-y-3"
            >
              <h3 className="text-sm font-bold text-slate-900">Yangi sinf yaratish</h3>
              <input
                type="text"
                required
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder="Masalan: 8-A sinf (Matematika)"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newClassGrade}
                  onChange={(e) => setNewClassGrade(Number(e.target.value))}
                  className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                >
                  {[5, 6, 7, 8, 9, 10, 11].map((g) => (
                    <option key={g} value={g}>
                      {g}-sinf
                    </option>
                  ))}
                </select>
                <select
                  value={newClassSubject}
                  onChange={(e) => setNewClassSubject(e.target.value)}
                  className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                >
                  <option value="math">Matematika</option>
                  <option value="english">Ingliz tili</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-2 text-xs font-semibold text-white bg-[#1E3A8A] rounded-lg"
              >
                Sinf qo'shish
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            {selectedClassDetail ? (
              <>
                <div>
                  <div className="text-xs text-slate-500">Sinf o'quvchilari ko'rsatkichlari</div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {selectedClassDetail.classInfo?.name}
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="py-2.5 font-semibold">O'quvchi F.I.Sh.</th>
                        <th className="py-2.5 font-semibold">Ingliz tili</th>
                        <th className="py-2.5 font-semibold text-right">Bajarilgan</th>
                        <th className="py-2.5 font-semibold text-right">O'rtacha natija</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(selectedClassDetail.students || []).map((st: any) => (
                        <tr key={st.id} className="hover:bg-slate-50">
                          <td className="py-3 font-medium text-slate-900">{st.full_name}</td>
                          <td className="py-3 text-slate-600">{st.english_level}</td>
                          <td className="py-3 text-right font-mono tabular-nums">
                            {st.completed_count || 0} ta
                          </td>
                          <td className="py-3 text-right font-mono tabular-nums font-semibold text-emerald-700">
                            {st.avg_score !== null ? `${st.avg_score}%` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-500">Sinfni tanlang.</p>
            )}
          </div>
        </div>
      )}

      {activeSection === 'teacher_quiz_builder' && (
        <form
          onSubmit={handleCreateAssignment}
          className="bg-white border border-slate-200 rounded-xl p-6 space-y-6"
        >
          <div>
            <div className="text-xs font-medium text-[#1E3A8A]">
              O'qituvchi konstruktori (Quiz & Assignment Builder)
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              Yangi test yoki uy vazifasi yaratish
            </h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Topshiriq sarlavhasi
              </label>
              <input
                type="text"
                required
                value={qbTitle}
                onChange={(e) => setQbTitle(e.target.value)}
                placeholder="Masalan: 7-sinf Nisbat va proporsiya nazorat testi"
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Topshirish muddati
              </label>
              <input
                type="date"
                value={qbDueDate}
                onChange={(e) => setQbDueDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Fan</label>
              <select
                value={qbSubject}
                onChange={(e) => setQbSubject(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg"
              >
                <option value="math">Matematika</option>
                <option value="english">Ingliz tili</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sinf</label>
              <select
                value={qbClassId}
                onChange={(e) => setQbClassId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg"
              >
                {(teacherData?.classes || []).map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sinf darajasi
              </label>
              <input
                type="number"
                min={5}
                max={11}
                value={qbGrade}
                onChange={(e) => setQbGrade(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              O'quvchilar uchun ko'rsatma
            </label>
            <input
              type="text"
              value={qbDesc}
              onChange={(e) => setQbDesc(e.target.value)}
              placeholder="Masalalarni ishlab yakuniy javobni kiriting."
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                Savollar ro'yxati ({qbQuestions.length} ta)
              </h2>
              <button
                type="button"
                onClick={() =>
                  setQbQuestions((prev) => [
                    ...prev,
                    {
                      questionType: 'numeric',
                      promptUz: '',
                      options: ['', '', '', ''],
                      correctAnswer: '',
                      hintUz: '',
                      explanationUz: '',
                      points: 10,
                    },
                  ])
                }
                className="px-3 py-1.5 text-xs font-semibold text-[#1E3A8A] bg-blue-50 rounded-lg"
              >
                + Savol qo'shish
              </button>
            </div>

            {qbQuestions.map((q, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {idx + 1}-savol matni
                    </label>
                    <input
                      type="text"
                      required
                      value={q.promptUz}
                      onChange={(e) => {
                        const copy = [...qbQuestions];
                        copy[idx].promptUz = e.target.value;
                        setQbQuestions(copy);
                      }}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Savol turi
                    </label>
                    <select
                      value={q.questionType}
                      onChange={(e) => {
                        const copy = [...qbQuestions];
                        copy[idx].questionType = e.target.value;
                        setQbQuestions(copy);
                      }}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                    >
                      <option value="numeric">Sonli / Kasr javob</option>
                      <option value="multiple_choice">Variantli test (Multiple choice)</option>
                      <option value="fill_blank">Bo'sh joyni to'ldirish</option>
                    </select>
                  </div>
                </div>

                {q.questionType === 'multiple_choice' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {q.options.map((opt, oIdx) => (
                      <input
                        key={oIdx}
                        type="text"
                        placeholder={`${oIdx + 1}-variant`}
                        value={opt}
                        onChange={(e) => {
                          const copy = [...qbQuestions];
                          copy[idx].options[oIdx] = e.target.value;
                          setQbQuestions(copy);
                        }}
                        className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                      />
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      To'g'ri javob (Maxfiy saqlanadi)
                    </label>
                    <input
                      type="text"
                      required
                      value={q.correctAnswer}
                      onChange={(e) => {
                        const copy = [...qbQuestions];
                        copy[idx].correctAnswer = e.target.value;
                        setQbQuestions(copy);
                      }}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Ishora (Hint)
                    </label>
                    <input
                      type="text"
                      value={q.hintUz}
                      onChange={(e) => {
                        const copy = [...qbQuestions];
                        copy[idx].hintUz = e.target.value;
                        setQbQuestions(copy);
                      }}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      To'liq yechim izohi
                    </label>
                    <input
                      type="text"
                      value={q.explanationUz}
                      onChange={(e) => {
                        const copy = [...qbQuestions];
                        copy[idx].explanationUz = e.target.value;
                        setQbQuestions(copy);
                      }}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 text-sm font-semibold text-white bg-[#1E3A8A] rounded-lg hover:bg-[#1E40AF]"
          >
            Topshiriqni saqlash va sinfga e'lon qilish
          </button>
        </form>
      )}

      {activeSection === 'teacher_content_review' && (
        <div className="space-y-6">
          <div>
            <div className="text-xs font-medium text-[#1E3A8A]">
              AI Kontent Tasdiqlash va Tahrirlash (Draft → Pending Review → Approved)
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              O'quv materiallarini ko'rib chiqish va tasdiqlash
            </h1>
            <p className="text-xs text-slate-500">
              Faqat o'qituvchi tomonidan "approved" (Tasdiqlangan) holatiga o'tkazilgan materiallar
              o'quvchilarga rasmiy maktab darsi sifatida ko'rinadi.
            </p>
          </div>

          {editingLesson && (
            <div className="bg-white border-2 border-[#1E3A8A] rounded-xl p-6 space-y-4">
              <div className="text-xs font-bold text-[#1E3A8A]">
                Materialni tahrirlash va tasdiqlash: {editingLesson.id}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sarlavha
                </label>
                <input
                  type="text"
                  value={editLessonTitle}
                  onChange={(e) => setEditLessonTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dars matni (LaTeX matematik ifodalar qo'llab-quvvatlanadi)
                </label>
                <textarea
                  rows={4}
                  value={editLessonContent}
                  onChange={(e) => setEditLessonContent(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ishlangan misol
                </label>
                <textarea
                  rows={2}
                  value={editLessonExample}
                  onChange={(e) => setEditLessonExample(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Taqriz va tahrir izohi (Revision History uchun)
                </label>
                <input
                  type="text"
                  value={editLessonNotes}
                  onChange={(e) => setEditLessonNotes(e.target.value)}
                  placeholder="Masalan: Formulalar tekshirildi, 7-sinf o'quvchilari uchun tasdiqlandi."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleReviewLesson(editingLesson.id, 'approved')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
                >
                  Tahrirni saqlash va Tasdiqlash (Approve)
                </button>
                <button
                  type="button"
                  onClick={() => handleReviewLesson(editingLesson.id, 'rejected')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Rad etish (Reject)
                </button>
                <button
                  type="button"
                  onClick={() => setEditingLesson(null)}
                  className="px-4 py-2 text-xs text-slate-600"
                >
                  Bekor qilish
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {allLessons.map((les) => (
              <div
                key={les.id}
                className="bg-white border border-slate-200 rounded-xl p-5 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-slate-500">
                    {les.subject_code === 'math' ? 'Matematika' : 'Ingliz tili'} · {les.level_tag} ·
                    Holati:{' '}
                    <strong
                      className={
                        les.approval_status === 'approved'
                          ? 'text-emerald-700'
                          : les.approval_status === 'pending_review'
                          ? 'text-amber-700'
                          : 'text-red-700'
                      }
                    >
                      {les.approval_status}
                    </strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingLesson(les);
                        setEditLessonTitle(les.title_uz);
                        setEditLessonContent(les.content_uz);
                        setEditLessonExample(les.worked_example_uz);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-md inline-flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Tahrirlash</span>
                    </button>
                    {les.approval_status !== 'approved' && (
                      <button
                        type="button"
                        onClick={() => handleReviewLesson(les.id, 'approved')}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-md inline-flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Tasdiqlash</span>
                      </button>
                    )}
                    {les.approval_status !== 'archived' && (
                      <button
                        type="button"
                        onClick={() => handleReviewLesson(les.id, 'archived')}
                        className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-600"
                      >
                        Arxivlash
                      </button>
                    )}
                  </div>
                </div>
                <h3 className="text-base font-bold text-slate-900">{les.title_uz}</h3>
                <MathText text={les.content_uz} />
                {les.revision_notes && (
                  <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                    Taqriz tarixi: {les.revision_notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === 'teacher_submissions' && teacherData && (
        <div className="space-y-4">
          <h1 className="text-xl font-bold text-slate-900">
            Topshirilgan ishlar va o'quvchilarga fikr-mulohaza yozish
          </h1>
          {(teacherData.recentSubmissions || []).map((sub: any) => (
            <div
              key={sub.id}
              className="bg-white border border-slate-200 rounded-xl p-5 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {sub.student_name} ({sub.grade || 7}-sinf)
                  </div>
                  <div className="text-xs text-slate-500">{sub.assignment_title}</div>
                </div>
                <div className="text-base font-bold text-emerald-700 font-mono tabular-nums">
                  {sub.score} / {sub.max_score} ({sub.percentage}%)
                </div>
              </div>

              {sub.teacher_feedback_uz && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  <strong>Joriy izoh:</strong> {sub.teacher_feedback_uz}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <input
                  type="text"
                  value={feedbackMap[sub.id] || ''}
                  onChange={(e) =>
                    setFeedbackMap((prev) => ({ ...prev, [sub.id]: e.target.value }))
                  }
                  placeholder="O'quvchiga rag'batlantiruvchi izoh va tavsiya yozing..."
                  className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => handleSendSubmissionFeedback(sub.id)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#1E3A8A] rounded-lg shrink-0"
                >
                  Izohni saqlash
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =====================================================================
          SCHOOL & DISTRICT COORDINATOR SECTIONS
      ===================================================================== */}
      {(activeSection === 'coord_dashboard' ||
        activeSection === 'coord_projects' ||
        activeSection === 'coord_events') &&
        coordData && (
          <div className="space-y-8">
            <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-medium text-[#1E3A8A]">
                  {user.role === 'district_coordinator'
                    ? 'Tuman Koordinatori Boshqaruv Paneli (Chilonzor tumani)'
                    : 'Maktab IT va AI Koordinatori Paneli'}
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mt-1">{user.fullName}</h1>
                <p className="text-xs text-slate-500 mt-1">{coordData.privacyNoticeUz}</p>
              </div>
              <button
                type="button"
                onClick={handleDownloadCsv}
                className="px-4 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 inline-flex items-center gap-1.5 shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Agregat CSV hisobot</span>
              </button>
            </div>

            {/* School Comparison Table */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h2 className="text-base font-bold text-slate-900">
                Maktablar kesimida umumlashtirilgan ko'rsatkichlar
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2.5 font-semibold">Maktab nomi</th>
                      <th className="py-2.5 font-semibold text-right">Faol o'quvchilar</th>
                      <th className="py-2.5 font-semibold text-right">O'qituvchilar</th>
                      <th className="py-2.5 font-semibold text-right">Yakunlangan mashqlar</th>
                      <th className="py-2.5 font-semibold text-right">O'rtacha o'zlashtirish</th>
                      <th className="py-2.5 font-semibold text-right">IT Yoshlar loyihalari</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(coordData.schoolMetrics || []).map((sm: any) => (
                      <tr key={sm.school_id} className="hover:bg-slate-50">
                        <td className="py-3 font-medium text-slate-900">
                          {sm.school_name} ({sm.school_code})
                        </td>
                        <td className="py-3 text-right font-mono tabular-nums">
                          {sm.active_students}
                        </td>
                        <td className="py-3 text-right font-mono tabular-nums">
                          {sm.active_teachers}
                        </td>
                        <td className="py-3 text-right font-mono tabular-nums">
                          {sm.completed_submissions}
                        </td>
                        <td className="py-3 text-right font-mono tabular-nums font-semibold text-emerald-700">
                          {sm.avg_quiz_percentage}%
                        </td>
                        <td className="py-3 text-right font-mono tabular-nums">
                          {sm.total_projects}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {reportsSummary?.definitionsUz && (
                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  Hisoblash metodologiyasi: O'rtacha o'zlashtirish — topshirilgan mashqlarning
                  foiz ko'rsatkichlari arifmetik o'rtachasi.
                </div>
              )}
            </div>

            {/* IT Yoshlar Project Moderation */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h2 className="text-base font-bold text-slate-900">
                IT Yoshlar loyihalarini moderatsiya qilish va ko'rgazmaga chiqarish
              </h2>
              <div className="space-y-3">
                {(coordData.projects || []).map((proj: any) => (
                  <div
                    key={proj.id}
                    className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="text-xs text-slate-500">
                        {proj.category} · {proj.school_name} · Jamoa: {proj.team_names} · Holati:{' '}
                        <strong>{proj.status}</strong>
                      </div>
                      <div className="text-sm font-bold text-slate-900">{proj.title_uz}</div>
                      <div className="text-xs text-slate-600">{proj.description_uz}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleModerateProject(proj.id, 'approved')}
                        className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg"
                      >
                        Tasdiqlash
                      </button>
                      <button
                        type="button"
                        onClick={() => handleModerateProject(proj.id, 'showcase')}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-[#1E3A8A] rounded-lg"
                      >
                        Ko'rgazmaga chiqarish
                      </button>
                      <button
                        type="button"
                        onClick={() => handleModerateProject(proj.id, 'rejected')}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 hover:underline"
                      >
                        Qaytarish
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Events & Competitions Management */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <h2 className="text-base font-bold text-slate-900">
                  Maktab va tuman IT tadbirlari hamda musobaqalar
                </h2>
                <div className="space-y-3">
                  {(coordData.events || []).map((ev: any) => (
                    <div key={ev.id} className="p-4 rounded-lg border border-slate-200 space-y-1">
                      <div className="text-xs text-slate-500">
                        {ev.category} · Miqyos: {ev.scope === 'district' ? 'Tuman' : 'Maktab'} ·
                        Sana: <span className="tabular-nums">{ev.event_date}</span>
                      </div>
                      <div className="text-sm font-bold text-slate-900">{ev.title_uz}</div>
                      <div className="text-xs text-slate-600">{ev.description_uz}</div>
                    </div>
                  ))}
                </div>
              </div>

              <form
                onSubmit={handleCreateEvent}
                className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-3"
              >
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Calendar className="w-4 h-4 text-[#1E3A8A]" />
                  <span>Yangi IT tadbir yoki musobaqa e'lon qilish</span>
                </div>
                <input
                  type="text"
                  required
                  value={evtTitle}
                  onChange={(e) => setEvtTitle(e.target.value)}
                  placeholder="Tadbir nomi..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                />
                <textarea
                  rows={3}
                  required
                  value={evtDesc}
                  onChange={(e) => setEvtDesc(e.target.value)}
                  placeholder="Tadbir maqsadi va ishtirok etish tartibi..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={evtDate}
                    onChange={(e) => setEvtDate(e.target.value)}
                    className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={evtCategory}
                    onChange={(e) => setEvtCategory(e.target.value)}
                    className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 text-xs font-semibold text-white bg-[#1E3A8A] rounded-lg"
                >
                  Tadbirni saqlash
                </button>
              </form>
            </div>
          </div>
        )}

      {/* =====================================================================
          ADMINISTRATOR SECTIONS
      ===================================================================== */}
      {(activeSection === 'admin_users' ||
        activeSection === 'admin_schools' ||
        activeSection === 'admin_ai_moderation' ||
        activeSection === 'admin_audit_settings') &&
        adminData && (
          <div className="space-y-8">
            {/* Destructive Action Confirmation Modal */}
            {confirmToggleUser && (
              <div
                role="dialog"
                aria-modal="true"
                className="p-5 rounded-xl bg-amber-50 border-2 border-amber-400 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="text-sm font-bold text-amber-950">
                    Tasdiqlash talab etiladi: Foydalanuvchi holatini o'zgartirish
                  </div>
                  <div className="text-xs text-amber-900">
                    Siz haqiqatan ham <strong>{confirmToggleUser.full_name}</strong> hisobini{' '}
                    {confirmToggleUser.is_active ? 'bloklashni (o\'chirishni)' : 'faollashtirishni'}{' '}
                    xohlaysizmi?
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      handleAdminUpdateUser(confirmToggleUser.id, {
                        isActive: !confirmToggleUser.is_active,
                      })
                    }
                    className="px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-lg"
                  >
                    Ha, tasdiqlayman
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmToggleUser(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg"
                  >
                    Bekor qilish
                  </button>
                </div>
              </div>
            )}

            {/* User & Role Management */}
            {activeSection === 'admin_users' && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-[#1E3A8A] font-medium">
                      Platforma Administratori · Foydalanuvchilar va RBAC
                    </div>
                    <h1 className="text-xl font-bold text-slate-900">
                      Foydalanuvchilar va rollarni boshqarish
                    </h1>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="py-2.5 font-semibold">F.I.Sh. / Email</th>
                        <th className="py-2.5 font-semibold">Maktab</th>
                        <th className="py-2.5 font-semibold">Biriktirilgan rol</th>
                        <th className="py-2.5 font-semibold">Holati</th>
                        <th className="py-2.5 font-semibold text-right">Boshqaruv</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(adminData.users || []).map((u: any) => (
                        <tr key={u.id} className="hover:bg-slate-50">
                          <td className="py-3">
                            <div className="font-semibold text-slate-900">{u.full_name}</div>
                            <div className="text-xs text-slate-500">{u.email}</div>
                          </td>
                          <td className="py-3 text-xs text-slate-600">
                            {u.school_name || 'Tuman miqyosida'}
                          </td>
                          <td className="py-3">
                            <select
                              value={u.role}
                              onChange={(e) =>
                                handleAdminUpdateUser(u.id, {
                                  role: e.target.value as UserRole,
                                })
                              }
                              className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-md"
                            >
                              <option value="student">O'quvchi (student)</option>
                              <option value="teacher">O'qituvchi (teacher)</option>
                              <option value="school_coordinator">
                                Maktab koordinatori (school_coordinator)
                              </option>
                              <option value="district_coordinator">
                                Tuman koordinatori (district_coordinator)
                              </option>
                              <option value="admin">Administrator (admin)</option>
                            </select>
                          </td>
                          <td className="py-3 text-xs font-medium">
                            {u.is_active ? (
                              <span className="text-emerald-700">✓ Faol</span>
                            ) : (
                              <span className="text-red-700">✕ Bloklangan</span>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              type="button"
                              onClick={() => setConfirmToggleUser(u)}
                              className="px-3 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
                            >
                              {u.is_active ? 'Bloklash' : 'Faollashtirish'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Schools Management */}
            {activeSection === 'admin_schools' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <h2 className="text-lg font-bold text-slate-900">
                    Platformaga ulangan maktablar
                  </h2>
                  <div className="space-y-3">
                    {(adminData.schools || []).map((s: any) => (
                      <div
                        key={s.id}
                        className="p-4 rounded-xl border border-slate-200 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs text-slate-500">
                            Kod: <span className="font-mono">{s.code}</span> · {s.city} ·{' '}
                            {s.district_name}
                          </div>
                          <div className="text-sm font-bold text-slate-900 mt-0.5">{s.name}</div>
                        </div>
                        <div className="text-xs font-mono tabular-nums text-slate-600">
                          A'zolar: {s.member_count || 0}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <form
                  onSubmit={handleAdminCreateSchool}
                  className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4"
                >
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <School className="w-4 h-4 text-[#1E3A8A]" />
                    <span>Yangi maktab qo'shish</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Maktab rasmiy nomi
                    </label>
                    <input
                      type="text"
                      required
                      value={newSchoolName}
                      onChange={(e) => setNewSchoolName(e.target.value)}
                      placeholder="Masalan: 195-sonli umumiy o'rta ta'lim maktabi"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Maktab kodi
                      </label>
                      <input
                        type="text"
                        required
                        value={newSchoolCode}
                        onChange={(e) => setNewSchoolCode(e.target.value)}
                        placeholder="TAS-195"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Shahar / Tuman
                      </label>
                      <input
                        type="text"
                        value={newSchoolCity}
                        onChange={(e) => setNewSchoolCity(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 text-xs font-semibold text-white bg-[#1E3A8A] rounded-lg"
                  >
                    Maktabni ro'yxatga olish
                  </button>
                </form>
              </div>
            )}

            {/* AI Configuration Status & Moderation Reports */}
            {activeSection === 'admin_ai_moderation' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="text-xs text-slate-500">AI Provayder holati (Kalit yashirin)</div>
                    <div className="text-lg font-bold text-slate-900 mt-1">
                      {adminData.aiProviderConfig?.geminiKeyPresent
                        ? 'Server kaliti sozlangan (Gemini 3.8 Flash)'
                        : 'Lokal Mock AI rejimi faol'}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Maxfiy API kalitlari hech qachon ekranga chiqarilmaydi
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="text-xs text-slate-500">Jami AI so'rovlar / Xatolar</div>
                    <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                      {adminData.aiStats?.total_requests || 0} /{' '}
                      {adminData.aiStats?.error_count || 0}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Xavfsizlik filtri bloklagan: {adminData.aiStats?.blocked_count || 0} ta
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="text-xs text-slate-500">O'rtacha AI javob tezligi</div>
                    <div className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">
                      {adminData.aiStats?.avg_latency_ms || 35} ms
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Barqaror ishlash ko'rsatkichi</div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <h2 className="text-base font-bold text-slate-900">
                    AI javoblari ustidan tushgan moderatsiya murojaatlari
                  </h2>
                  <div className="space-y-3">
                    {(adminData.moderationReports || []).map((rep: any) => (
                      <div
                        key={rep.id}
                        className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div>
                          <div className="text-xs text-slate-500">
                            Yuboruvchi: {rep.reporter_name} · Holati: <strong>{rep.status}</strong>
                          </div>
                          <div className="text-sm font-semibold text-slate-900 mt-0.5">
                            {rep.reason_uz}
                          </div>
                        </div>
                        {rep.status !== 'resolved' && (
                          <button
                            type="button"
                            onClick={async () => {
                              await apiFetch(`/api/v1/admin/moderation/${rep.id}`, {
                                method: 'PATCH',
                                body: JSON.stringify({
                                  status: 'resolved',
                                  resolutionNoteUz:
                                    "Administrator va metodist tomonidan ko'rib chiqilib hal etildi.",
                                }),
                              });
                              showToast('Murojaat hal etildi.');
                              await loadRoleData();
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg shrink-0"
                          >
                            Hal etildi deb belgilash
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Audit Logs & Data Retention Settings */}
            {activeSection === 'admin_audit_settings' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <h2 className="text-base font-bold text-slate-900">
                    Ma'lumotlarni saqlash muddati (Data Retention) va AI rejimi
                  </h2>
                  <form onSubmit={handleAdminSaveSettings} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        AI suhbatlarini saqlash muddati (kun)
                      </label>
                      <input
                        type="number"
                        min={7}
                        max={365}
                        value={retentionDaysInput}
                        onChange={(e) => setRetentionDaysInput(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        AI xizmati ish rejimi
                      </label>
                      <select
                        value={aiModeInput}
                        onChange={(e) => setAiModeInput(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                      >
                        <option value="auto">
                          Avtomatik (Kalit mavjud bo'lsa Gemini, aks holda Mock AI)
                        </option>
                        <option value="mock">
                          Faqat Lokal Mock AI (API xarajatisiz sinov rejimi)
                        </option>
                        <option value="gemini">Gemini 3.8 Flash provayderi</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 text-xs font-semibold text-white bg-[#1E3A8A] rounded-lg"
                    >
                      Sozlamalarni saqlash
                    </button>
                  </form>

                  <div className="pt-4 border-t border-slate-200 space-y-2">
                    <div className="text-xs font-semibold text-slate-700">
                      Muddati o'tgan yozishmalarni tozalash
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await apiFetch<{ message: string }>(
                          '/api/v1/admin/retention/cleanup',
                          {
                            method: 'POST',
                            body: JSON.stringify({
                              olderThanDays: Number(retentionDaysInput),
                            }),
                          }
                        );
                        showToast(res.message);
                        await loadRoleData();
                      }}
                      className="w-full py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg"
                    >
                      Saqlash siyosati bo'yicha tozalashni bajarish
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <h2 className="text-base font-bold text-slate-900">
                    Xavfsizlik va tizim audit jurnali (Audit Logs)
                  </h2>
                  <div className="space-y-2.5 max-h-[420px] overflow-y-auto">
                    {(adminData.auditLogs || []).map((log: any) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-slate-500">
                          <span className="font-mono font-semibold text-[#1E3A8A]">
                            {log.action}
                          </span>
                          <span className="tabular-nums">
                            {new Date(log.created_at).toLocaleString('uz-UZ')}
                          </span>
                        </div>
                        <div className="text-slate-800">{log.details_uz}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
    </div>
  );
};
