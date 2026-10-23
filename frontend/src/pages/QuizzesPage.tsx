import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Exercise, ExerciseCheckResult } from '../types';
import { MathRenderer } from '../components/MathRenderer';
import { BackButton } from '../components/BackButton';
import {
  HelpCircle, CheckCircle2, XCircle, Lightbulb,
  ArrowRight, RefreshCw, Award
} from 'lucide-react';

export const QuizzesPage: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Record<number, ExerciseCheckResult>>({});
  const [showHint, setShowHint] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    setLoading(true);
    try {
      const data = await api.getExercises();
      setExercises(data);
      setAnswers({});
      setResults({});
      setShowHint({});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = async (exerciseId: number) => {
    const ans = answers[exerciseId];
    if (!ans) return;
    try {
      const res = await api.checkAnswer(exerciseId, ans);
      setResults(prev => ({ ...prev, [exerciseId]: res }));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleHint = (exerciseId: number) => {
    setShowHint(prev => ({ ...prev, [exerciseId]: (prev[exerciseId] || 0) + 1 }));
  };

  return (
    <div className="space-y-6">
      <BackButton to="/dashboard" label="Asosiy boshqaruvga qaytish" />
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-blue-700" />
            Amaliy Mashqlar va Testlar
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Matematika va Ingliz tili fanlari bo'yicha interaktiv mustahkamlash mashqlari
          </p>
        </div>

        <button
          onClick={loadExercises}
          className="p-2 text-slate-600 hover:text-blue-700 rounded-xl hover:bg-slate-100 transition"
          title="Qayta yuklash"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Savollar ro'yxati */}
      <div className="space-y-4">
        {exercises.map((ex, idx) => {
          const res = results[ex.id];
          const hintCount = showHint[ex.id] || 0;

          return (
            <div key={ex.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-1 bg-blue-50 text-blue-800 rounded-lg">
                  {idx + 1}-mashq • {ex.topic}
                </span>
                <button
                  onClick={() => toggleHint(ex.id)}
                  className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 hover:bg-amber-100 flex items-center gap-1 transition"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Ko'rsatma ({hintCount}/2)</span>
                </button>
              </div>

              <div className="text-sm font-semibold text-slate-900">
                <MathRenderer content={ex.question_text} />
              </div>

              {hintCount >= 1 && ex.hint_1 && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900">
                  <strong>1-Ko'rsatma:</strong> {ex.hint_1}
                </div>
              )}
              {hintCount >= 2 && ex.hint_2 && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900">
                  <strong>2-Ko'rsatma:</strong> {ex.hint_2}
                </div>
              )}

              {/* Multiple Choice yoki Numeric */}
              {ex.question_type === 'multiple_choice' && ex.options ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ex.options.map((opt, i) => (
                    <button
                      key={i}
                      disabled={!!res}
                      onClick={() => setAnswers(prev => ({ ...prev, [ex.id]: opt }))}
                      className={`p-3 rounded-xl text-xs font-semibold text-left transition border ${
                        answers[ex.id] === opt
                          ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex gap-2 max-w-sm">
                  <input
                    type="text"
                    disabled={!!res}
                    value={answers[ex.id] || ''}
                    onChange={e => setAnswers(prev => ({ ...prev, [ex.id]: e.target.value }))}
                    placeholder="Javobingiz..."
                    className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              )}

              {!res ? (
                <button
                  disabled={!answers[ex.id]}
                  onClick={() => handleCheck(ex.id)}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl text-xs font-bold transition shadow-sm"
                >
                  Javobni tekshirish
                </button>
              ) : (
                <div className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                  res.is_correct ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'
                }`}>
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {res.is_correct ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                    <span>{res.message}</span>
                  </div>
                  {res.explanation && (
                    <p className="text-slate-700 font-normal">
                      <strong>Tushuntirish:</strong> {res.explanation}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
