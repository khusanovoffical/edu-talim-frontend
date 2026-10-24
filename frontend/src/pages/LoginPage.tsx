import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles, Lock, Mail, ArrowRight, AlertCircle, X, Send,
  User, MapPin, Briefcase, AtSign, CheckCircle, Eye, EyeOff, Phone
} from 'lucide-react';

// AccountRequestModal komponenti
const AccountRequestModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [form, setForm] = useState({
    full_name: '',
    district_school: '',
    role_description: '',
    desired_login: '',
    desired_password: '',
    phone_number: '',
    telegram: '',
    instagram: '',
    email_contact: ''
  });
  const [showDesiredPassword, setShowDesiredPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.phone_number && !form.telegram && !form.instagram && !form.email_contact) {
      setError("Kamida bitta aloqa manzili kiriting (Telefon raqam, Telegram, Instagram yoki Email)");
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/contacts/account-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) {
        let msg = "Xatolik yuz berdi";
        try {
          const data = await res.json();
          msg = data.detail || msg;
        } catch {}
        throw new Error(msg);
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Modal overlay
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Hisob ochish uchun so'rov</h3>
            <p className="text-xs text-slate-500 mt-0.5">Ma'lumotlaringizni to'ldiring, tez orada xabardor qilinasiz</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition"
            aria-label="Yopish"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">So'rovingiz yuborildi!</h4>
            <p className="text-sm text-slate-600">Siz kiritgan kontakt orqali tez orada javob beramiz.</p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-semibold text-sm transition"
            >
              Yopish
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="font-semibold text-slate-700 block mb-1">To'liq ism-familiyangiz *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  required
                  value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  placeholder="Masalan: Xusanov Xumoyun"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Tuman va maktabingiz *</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  required
                  value={form.district_school}
                  onChange={e => setForm({ ...form, district_school: e.target.value })}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  placeholder="Samarqand viloyati, Paxtachi tumani, 217-maktab"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Lavozimingiz yoki rolingiz *</label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  required
                  value={form.role_description}
                  onChange={e => setForm({ ...form, role_description: e.target.value })}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  placeholder="Men 9-sinf o'quvchisiman"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Xohlagan login *</label>
                <input
                  required
                  value={form.desired_login}
                  onChange={e => setForm({ ...form, desired_login: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  placeholder="khusanov yoki xumoyun"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Xohlagan parol *</label>
                <div className="relative">
                  <input
                    type={showDesiredPassword ? "text" : "password"}
                    required
                    value={form.desired_password}
                    onChange={e => setForm({ ...form, desired_password: e.target.value })}
                    className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDesiredPassword(!showDesiredPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                    title={showDesiredPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                  >
                    {showDesiredPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-xs font-semibold text-amber-800 mb-3">Aloqa uchun (kamida bittasini to'ldiring) *</p>
              <div className="space-y-2">
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={form.phone_number}
                    onChange={e => setForm({ ...form, phone_number: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none text-xs"
                    placeholder="Telefon raqam: +998 90 123 45 67"
                  />
                </div>
                <div className="relative">
                  <AtSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    value={form.telegram}
                    onChange={e => setForm({ ...form, telegram: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none text-xs"
                    placeholder="Telegram: @username"
                  />
                </div>
                <div className="relative">
                  <AtSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    value={form.instagram}
                    onChange={e => setForm({ ...form, instagram: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none text-xs"
                    placeholder="Instagram: @username"
                  />
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={form.email_contact}
                    onChange={e => setForm({ ...form, email_contact: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none text-xs"
                    placeholder="Email manzil"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white rounded-xl font-bold shadow-md transition flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Yuborilmoqda...' : 'So\'rovni yuborish'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedUser = await login(email.trim(), password.trim());
      if (loggedUser.role === 'admin') {
        navigate('/admin');
      } else if (loggedUser.role === 'school_admin' || (loggedUser.role as string) === 'school_coordinator' || (loggedUser.role as string) === 'district_coordinator') {
        navigate('/school-admin');
      } else if (loggedUser.role === 'teacher') {
        navigate('/teacher');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Kirishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50">
        
        {/* Logo va sarlavha */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-md shadow-blue-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold text-slate-900 tracking-tight">
            EduAI tizimiga kirish
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Shaxsiy ta'lim assistentingiz va sinfingizga ulaning
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Elektron pochta yoki login</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="khusanov, admin yoki uroqova"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Maxfiy parol</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                title={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white rounded-xl font-bold shadow-md shadow-blue-700/20 transition flex items-center justify-center gap-2 text-sm"
          >
            <span>{loading ? 'Kirilmoqda...' : 'Tizimga kirish'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5">
          <span>Hisobingiz yo'qmi?</span>
          <Link
            to="/request-account"
            className="text-blue-700 font-bold hover:underline transition"
          >
            Ariza yuborish (Hisob ochish)
          </Link>
        </div>

      </div>

      {/* Hisob ochish uchun so'rov modali */}
      {showRequestModal && (
        <AccountRequestModal onClose={() => setShowRequestModal(false)} />
      )}
    </div>
  );
};
