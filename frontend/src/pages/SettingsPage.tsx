import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ExplanationStyle } from '../types';
import { Settings, User, Sparkles, Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { BackButton } from '../components/BackButton';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [grade, setGrade] = useState<number>(user?.grade || 9);
  const [style, setStyle] = useState<ExplanationStyle>(user?.explanation_style || 'step_by_step');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await api.updateProfile({
        full_name: fullName,
        grade: user?.role === 'student' ? grade : undefined,
        explanation_style: style,
        password: newPassword.length >= 6 ? newPassword : undefined
      });
      await refreshUser();
      setMessage("Sozlamalar muvaffaqiyatli saqlandi!");
      setNewPassword('');
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <BackButton to="/dashboard" label="Asosiy boshqaruvga qaytish" />
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-700" />
          Hisob Sozlamalari
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Shaxsiy ma'lumotlaringiz va EduAI repetitori afzalliklarini sozlang
        </p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-center gap-2 font-medium">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5 text-xs">
        
        <div>
          <label className="font-bold text-slate-700 block mb-1">To'liq ism-familiya</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Elektron pochta (O'zgartirib bo'lmaydi)</label>
          <input
            type="email"
            disabled
            value={user?.email || ''}
            className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
          />
        </div>

        {user?.role === 'student' && (
          <div>
            <label className="font-bold text-slate-700 block mb-1">O'quv sinfi</label>
            <select
              value={grade}
              onChange={e => setGrade(Number(e.target.value))}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium"
            >
              {[5, 6, 7, 8, 9, 10, 11].map(g => (
                <option key={g} value={g}>{g}-sinf</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            <span>EduAI repetitori tushuntirish uslubi</span>
          </label>
          <select
            value={style}
            onChange={e => setStyle(e.target.value as ExplanationStyle)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-600 focus:outline-none font-medium"
          >
            <option value="very_simple">Juda oddiy (boshlang'ich tushunchalar bilan)</option>
            <option value="step_by_step">Bosqichma-bosqich (har bir qadam alohida tahlil qilinadi)</option>
            <option value="detailed">Batafsil tahlil (chuqurlashtirilgan formulalar va qoidalar bilan)</option>
          </select>
        </div>

        <div className="pt-3 border-t border-slate-100">
          <label className="font-bold text-slate-700 block mb-1">Yangi maxfiy parol (o'zgartirishni xohlasangiz)</label>
          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Kamida 6 belgi yoki bo'sh qoldiring"
              className="w-full p-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
              title={showNewPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
            >
              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white rounded-xl font-bold shadow-md shadow-blue-700/20 transition"
          >
            {saving ? 'Saqlanmoqda...' : 'O\'zgarishlarni saqlash'}
          </button>
        </div>

      </form>

    </div>
  );
};
