import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Exercise, ExerciseCheckResult } from '../types';
import { MathRenderer } from '../components/MathRenderer';
import { BackButton } from '../components/BackButton';
import {
  Calculator, BookOpen, Lightbulb, CheckCircle2,
  XCircle, ArrowRight, Bot, Sparkles, RefreshCw
} from 'lucide-react';

const TOPICS = [
  { id: 'Chiziqli tenglamalar', title: 'Chiziqli tenglamalar', desc: 'Bir noma\'lumli chiziqli tenglamalar va soddalashtirish' },
  { id: 'Oddiy kasrlar', title: 'Oddiy va o\'nli kasrlar', desc: 'Kasrlarni qo\'shish, ayirish, ko\'paytirish va bo\'lish' },
  { id: 'Foizlar', title: 'Foizlar va ulushlar', desc: 'Sonning foizini topish, foizga ko\'ra sonni topish' },
  { id: 'Geometriya', title: 'Geometriya asoslari', desc: 'Uchburchak, to\'g\'ri to\'rtburchak perimetri va yuzi' },
  { id: 'Nisbat va proporsiya', title: 'Nisbat va proporsiya', desc: 'To\'g\'ri va teskari proporsional bog\'lanishlar' }
];

export const MathPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTopic, setSelectedTopic] = useState('Chiziqli tenglamalar');
  const [selectedGrade, setSelectedGrade] = useState(9);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Record<number, ExerciseCheckResult>>({});
  const [showHint, setShowHint] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadExercises();
  }, [selectedTopic, selectedGrade]);

  const loadExercises = async () => {
    setLoading(true);
    try {
      const data = await api.getExercises({ grade: selectedGrade, topic: selectedTopic });
      setExercises(data);
      setResults({});
      setAnswers({});
      setShowHint({});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAnswer = async (exerciseId: number) => {
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
    setShowHint(prev => {
      const current = prev[exerciseId] || 0;
      return { ...prev, [exerciseId]: current + 1 };
    });
  };

  const askAiAboutTopic = () => {
    navigate('/ai-tutor');
  };

  return (
    <div className="space-y-6">
      <BackButton to="/dashboard" label="Asosiy boshqaruvga qaytish" />
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white relative shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold mb-2">
              <Calculator className="w-3.5 h-3.5 text-blue-300" />
              <span>EduAI Matematika moduli</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Matematika va Algebra
            </h1>
            <p className="text-sm text-blue-100 mt-1 max-w-xl">
              Aniq tushuntirishlar, interaktiv formulalar, amaliy mashqlar va deterministik natija tekshiruvi.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/10 p-2 rounded-2xl backdrop-blur-md self-start sm:self-auto">
            <span className="text-xs font-semibold text-blue-200">Sinf:</span>
            <select
              value={selectedGrade}
              onChange={e => setSelectedGrade(Number(e.target.value))}
              className="bg-blue-950/60 text-white font-bold text-xs p-2 rounded-xl border border-white/20 focus:outline-none"
            >
              {[5, 6, 7, 8, 9, 10, 11].map(g => (
                <option key={g} value={g}>{g}-sinf</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Mavzular navigatsiyasi */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {TOPICS.map(t => (
          <button
            key={t.id}
            onClick={() => setSelectedTopic(t.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
              selectedTopic === t.id
                ? 'bg-blue-700 text-white border-blue-700 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t.title}
          </button>
        ))}
      </div>

      {/* Mavzu nazariyasi va namunasi */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{selectedTopic} nazariyasi</h3>
              <p className="text-xs text-slate-500">O'zbekiston umumiy o'rta ta'lim standarti bo'yicha asosiy formulalar</p>
            </div>
          </div>

          <button
            onClick={askAiAboutTopic}
            className="px-3.5 py-2 bg-violet-50 text-violet-700 hover:bg-violet-100 rounded-xl text-xs font-bold transition flex items-center gap-2 border border-violet-200"
          >
            <Bot className="w-4 h-4 text-violet-600" />
            <span>EduAI dan so'rash</span>
          </button>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm leading-relaxed">
          {selectedTopic === 'Chiziqli tenglamalar' && (
            <MathRenderer content={`### Chiziqli tenglamalar qoidasi:
$ax + b = 0$ ($a \\neq 0$) tenglama bir noma'lumli chiziqli tenglamadir.

**Yechish qadamlari:**
1. Erkin had $b$ ni o'ng tomonga qarama-qarshi ishora bilan o'tkazing: $ax = -b$
2. Tenglikning har ikkala tomonini $a$ ga bo'ling: $x = -\\frac{b}{a}$

**Misol:** $3x - 12 = 0 \\implies 3x = 12 \\implies x = 4$`} />
          )}

          {selectedTopic === 'Oddiy kasrlar' && (
            <MathRenderer content={`### Oddiy kasrlar ustida amallar:
Bir xil maxrajli kasrlarni qo'shishda faqat suratlar qo'shiladi:
$\\frac{a}{c} + \\frac{b}{c} = \\frac{a + b}{c}$

**Misol:** $\\frac{2}{7} + \\frac{3}{7} = \\frac{2+3}{7} = \\frac{5}{7}$`} />
          )}

          {selectedTopic === 'Foizlar' && (
            <MathRenderer content={`### Foizlar va hisoblash qoidalari:
Foiz deb sonning $\\frac{1}{100}$ qismiga aytiladi ($1\\% = 0.01$).
$A$ sonining $P\\%$ ini topish: $\\frac{A \\times P}{100}$

**Misol:** 400 ning 25% ini toping: $\\frac{400 \\times 25}{100} = 100$`} />
          )}

          {selectedTopic === 'Geometriya' && (
            <MathRenderer content={`### Asosiy geometrik formulalar:
- To'g'ri to'rtburchak perimetri: $P = 2(a + b)$
- To'g'ri to'rtburchak yuzi: $S = a \\cdot b$
- Uchburchak yuzi: $S = \\frac{1}{2} a \\cdot h$`} />
          )}

          {selectedTopic === 'Nisbat va proporsiya' && (
            <MathRenderer content={`### Proporsiyaning asosiy xossasi:
$\\frac{a}{b} = \\frac{c}{d}$ tenglikda chetki hadlar ko'paytmasi o'rta hadlar ko'paytmasiga teng:
$a \\cdot d = b \\cdot c$`} />
          )}
        </div>
      </div>

      {/* Amaliy mashqlar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Interaktiv Mashqlar va Misollar</h3>
            <p className="text-xs text-slate-500">Javobingizni kiriting va darhol tekshirib ball to'plang</p>
          </div>
          <button
            onClick={loadExercises}
            className="p-2 text-slate-500 hover:text-blue-700 hover:bg-slate-100 rounded-lg transition"
            title="Qayta yuklash"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {exercises.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Calculator className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Ushbu mavzuda yangi mashqlar yuklanmoqda</p>
            <p className="text-xs text-slate-400 mt-1">Boshqa mavzuni tanlab mashq bajarishingiz mumkin.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {exercises.map((ex, idx) => {
              const res = results[ex.id];
              const hintLevel = showHint[ex.id] || 0;

              return (
                <div key={ex.id} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                      {idx + 1}-savol ({ex.points} ball)
                    </span>
                    <button
                      onClick={() => toggleHint(ex.id)}
                      className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 transition"
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>Maslahat (Hint {hintLevel > 0 ? `${hintLevel}/2` : ''})</span>
                    </button>
                  </div>

                  <div className="text-sm font-medium text-slate-900">
                    <MathRenderer content={ex.question_text} />
                  </div>

                  {/* Ko'rsatilgan maslahatlar */}
                  {hintLevel >= 1 && ex.hint_1 && (
                    <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-xs text-amber-900">
                      <strong>1-Maslahat:</strong> {ex.hint_1}
                    </div>
                  )}
                  {hintLevel >= 2 && ex.hint_2 && (
                    <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-xs text-amber-900">
                      <strong>2-Maslahat:</strong> {ex.hint_2}
                    </div>
                  )}

                  {/* Variantlar yoki Raqamli kiritish */}
                  {ex.question_type === 'multiple_choice' && ex.options ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ex.options.map((opt, optIdx) => (
                        <button
                          key={optIdx}
                          disabled={!!res}
                          onClick={() => setAnswers(prev => ({ ...prev, [ex.id]: opt }))}
                          className={`p-3 rounded-xl text-xs font-semibold text-left transition border ${
                            answers[ex.id] === opt
                              ? 'bg-blue-50 border-blue-600 text-blue-900'
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
                        placeholder="Javobni kiriting (masalan: 4)..."
                        className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Tekshirish tugmasi */}
                  {!res && (
                    <button
                      disabled={!answers[ex.id]}
                      onClick={() => handleCheckAnswer(ex.id)}
                      className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-200 text-white disabled:text-slate-400 text-xs font-bold rounded-xl transition shadow-sm"
                    >
                      Javobni tekshirish
                    </button>
                  )}

                  {/* Natija bloki */}
                  {res && (
                    <div className={`p-4 rounded-xl border text-xs ${
                      res.is_correct ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'
                    }`}>
                      <div className="flex items-center gap-2 font-bold text-sm">
                        {res.is_correct ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                        <span>{res.message}</span>
                      </div>
                      {res.explanation && (
                        <p className="mt-2 text-slate-700 font-normal">
                          <strong>Yechim tahlili:</strong> {res.explanation}
                        </p>
                      )}
                      <div className="mt-2 font-semibold">
                        To'plangan ball: <strong>{res.points_earned} / {ex.points}</strong>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
