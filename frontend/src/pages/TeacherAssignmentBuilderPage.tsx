import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ClassRoom, Exercise } from '../types';
import {
  FileText, Plus, CheckCircle2, AlertCircle, ArrowLeft
} from 'lucide-react';

export const TeacherAssignmentBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([
      api.getClasses(),
      api.getExercises()
    ]).then(([cls, exs]) => {
      setClasses(cls);
      if (cls.length > 0) setSelectedClassId(cls[0].id);
      setExercises(exs);
      if (exs.length > 0) setSelectedExercises([exs[0].id]);
    });
  }, []);

  const toggleExercise = (id: number) => {
    setSelectedExercises(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !title || selectedExercises.length === 0) return;

    setSubmitting(true);
    setMessage('');
    try {
      await api.createAssignment({
        class_id: selectedClassId,
        title,
        description,
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
        exercise_ids: selectedExercises
      });
      setMessage("Topshiriq muvaffaqiyatli yaratildi va o'quvchilarga bildirishnoma yuborildi!");
      setTimeout(() => navigate('/teacher'), 1500);
    } catch (err: any) {
      setMessage(`Xatolik: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/teacher')}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ortga qaytish</span>
          </button>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-700" />
            Yangi Topshiriq Yaratish
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Sinfingiz uchun amaliy mashqlar va testlar to'plamini biriktiring
          </p>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleCreate} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5 text-xs">
        
        {/* Sinf tanlash */}
        <div>
          <label className="font-bold text-slate-800 block mb-1">Biriktiriladigan sinf *</label>
          <select
            value={selectedClassId || ''}
            onChange={e => setSelectedClassId(Number(e.target.value))}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name} sinfi ({c.grade}-sinf)</option>
            ))}
          </select>
        </div>

        {/* Topshiriq nomi */}
        <div>
          <label className="font-bold text-slate-800 block mb-1">Topshiriq nomi *</label>
          <input
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Masalan: 1-amaliy vazifa: Chiziqli tenglamalar"
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        {/* Tavsif */}
        <div>
          <label className="font-bold text-slate-800 block mb-1">Tavsif va ko'rsatmalar</label>
          <textarea
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="O'quvchilar ushbu topshiriqda qaysi qoidalarga e'tibor qaratishlari kerak?"
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        {/* Muddat */}
        <div>
          <label className="font-bold text-slate-800 block mb-1">Topshirish muddati (Deadline)</label>
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        {/* Mashqlar ro'yxati */}
        <div>
          <label className="font-bold text-slate-800 block mb-2">
            Topshiriqqa kiritiladigan savol va mashqlarni tanlang ({selectedExercises.length} ta tanlandi) *
          </label>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {exercises.map(ex => {
              const isChecked = selectedExercises.includes(ex.id);
              return (
                <div
                  key={ex.id}
                  onClick={() => toggleExercise(ex.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                    isChecked
                      ? 'bg-emerald-50/60 border-emerald-400 text-emerald-950'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold block text-slate-900">{ex.topic} ({ex.points} ball)</span>
                    <span className="text-[11px] text-slate-500">{ex.question_text}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/teacher')}
            className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            disabled={submitting || selectedExercises.length === 0}
            className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-xl font-bold shadow-md shadow-emerald-700/20"
          >
            {submitting ? "Saqlanmoqda..." : "Topshiriqni e'lon qilish"}
          </button>
        </div>

      </form>

    </div>
  );
};
