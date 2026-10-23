import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Assignment, Submission } from '../types';
import {
  BarChart3, Download, Users, CheckCircle2, Clock,
  Calendar, FileText, ChevronDown
} from 'lucide-react';

export const TeacherSubmissionsPage: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAssignments().then(assigns => {
      setAssignments(assigns);
      if (assigns.length > 0) {
        setSelectedAssignmentId(assigns[0].id);
      }
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedAssignmentId) {
      api.getAssignmentSubmissions(selectedAssignmentId)
        .then(setSubmissions)
        .catch(console.error);
    }
  }, [selectedAssignmentId]);

  const handleDownloadCsv = () => {
    if (!selectedAssignmentId) return;
    const token = localStorage.getItem('eduai_token');
    window.open(`/api/v1/reports/export-submissions-csv?assignment_id=${selectedAssignmentId}`, '_blank');
  };

  const selectedAssign = assignments.find(a => a.id === selectedAssignmentId);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-700" />
            O'quvchilar Javoblari va Baholash Jurnali
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Topshiriqlar bo'yicha to'plangan ballar va tahliliy hisobotlarni CSV formatida yuklab oling
          </p>
        </div>

        {selectedAssignmentId && (
          <button
            onClick={handleDownloadCsv}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm self-start sm:self-auto"
          >
            <Download className="w-4 h-4" />
            <span>CSV formatda yuklab olish</span>
          </button>
        )}
      </div>

      {/* Topshiriq tanlash */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-4">
        <label className="text-xs font-bold text-slate-700 shrink-0">Topshiriqni tanlang:</label>
        <select
          value={selectedAssignmentId || ''}
          onChange={e => setSelectedAssignmentId(Number(e.target.value))}
          className="w-full sm:w-96 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
        >
          {assignments.map(a => (
            <option key={a.id} value={a.id}>{a.title} (#{a.id})</option>
          ))}
        </select>
      </div>

      {/* Javoblar jadvali */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {selectedAssign?.title || 'Topshiriq natijalari'}
          </span>
          <span className="text-xs font-semibold text-slate-500">
            Jami topshirganlar: <strong>{submissions.length} nafar</strong>
          </span>
        </div>

        {submissions.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Hozircha ushbu topshiriq bo'yicha o'quvchilar javob yuklamagan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">O'quvchi ID</th>
                  <th className="py-3 px-4">To'plangan Ball</th>
                  <th className="py-3 px-4">Maksimal Ball</th>
                  <th className="py-3 px-4">Ustoz Izohi</th>
                  <th className="py-3 px-4">Topshirilgan Vaqt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">O'quvchi #{s.student_id}</td>
                    <td className="py-3.5 px-4 font-extrabold text-blue-700">{s.score} ball</td>
                    <td className="py-3.5 px-4 text-slate-500">{s.max_score} ball</td>
                    <td className="py-3.5 px-4 text-slate-600">{s.teacher_feedback || 'Baho qayd etildi'}</td>
                    <td className="py-3.5 px-4 text-slate-400">{new Date(s.submitted_at).toLocaleString('uz-UZ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
