import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles, User, MapPin, School as SchoolIcon, Briefcase, AtSign,
  Lock, Send, CheckCircle2, AlertCircle, ArrowLeft, GraduationCap,
  BookOpen, Phone, Mail, Instagram, ShieldCheck, HelpCircle, Eye, EyeOff
} from 'lucide-react';
import { BackButton } from '../components/BackButton';

// O'zbekiston hududlari va asosiy tumanlari (fallback)
const DEFAULT_REGIONS: Record<string, string[]> = {
  "Toshkent shahri": [
    "Chilonzor tumani", "Yunusobod tumani", "Mirzo Ulug'bek tumani", "Mirobod tumani",
    "Yakkasaroy tumani", "Shayxontohur tumani", "Uchtepa tumani", "Olmazor tumani",
    "Sergeli tumani", "Yangihaq tumani", "Bektemir tumani"
  ],
  "Toshkent viloyati": ["Zangiota tumani", "Qibray tumani", "Chirchiq shahri", "Olmaliq shahri", "Bo'stonliq tumani", "Parkent tumani", "Yangiyo'l tumani"],
  "Samarqand viloyati": ["Samarqand shahri", "Pastdarg'om tumani", "Urgut tumani", "Toyloq tumani", "Kattaqo'rg'on shahri"],
  "Farg'ona viloyati": ["Farg'ona shahri", "Marg'ilon shahri", "Qo'qon shahri", "Oltiariq tumani", "Quva tumani"],
  "Andijon viloyati": ["Andijon shahri", "Asaka tumani", "Shahrixon tumani", "Xo'jaobod tumani", "Baliqchi tumani"],
  "Namangan viloyati": ["Namangan shahri", "Chust tumani", "Kosonsoy tumani", "Uychi tumani", "Pop tumani"],
  "Buxoro viloyati": ["Buxoro shahri", "G'ijduvon tumani", "Kogon shahri", "Vobkent tumani", "Jondor tumani"],
  "Qashqadaryo viloyati": ["Qarshi shahri", "Shahrisabz shahri", "Kitob tumani", "Yakkabog' tumani", "Koson tumani"],
  "Surxondaryo viloyati": ["Termiz shahri", "Denov tumani", "Sherobod tumani", "Boysun tumani", "Jarqo'rg'on tumani"],
  "Xorazm viloyati": ["Urganch shahri", "Xiva shahri", "Xonqa tumani", "Shovot tumani", "Gurlan tumani"],
  "Navoiy viloyati": ["Navoiy shahri", "Zarafshon shahri", "Karmana tumani", "Qiziltepa tumani"],
  "Jizzax viloyati": ["Jizzax shahri", "Zomin tumani", "G'allaorol tumani", "Sharof Rashidov tumani"],
  "Sirdaryo viloyati": ["Guliston shahri", "Yangiyer shahri", "Boyovut tumani", "Sirdaryo tumani"],
  "Qoraqalpog'iston Respublikasi": ["Nukus shahri", "Xo'jayli tumani", "Qo'ng'irot tumani", "Beruniy tumani", "To'rtko'l tumani"]
};

export const RequestAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const [regionsData, setRegionsData] = useState<Record<string, string[]>>(DEFAULT_REGIONS);
  const [availableSchools, setAvailableSchools] = useState<Array<{ id: number; name: string; region?: string; district_name?: string }>>([]);

  // Forma holatlari
  const [fullName, setFullName] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('Toshkent shahri');
  const [selectedDistrict, setSelectedDistrict] = useState(DEFAULT_REGIONS['Toshkent shahri'][0] || '');
  const [customDistrict, setCustomDistrict] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [customSchool, setCustomSchool] = useState('');

  // Rol va tafsilot
  const [userRole, setUserRole] = useState<'student' | 'teacher'>('student');
  const [studentGrade, setStudentGrade] = useState('9');
  const [teacherSubject, setTeacherSubject] = useState('Matematika');

  // Login va parol
  const [desiredLogin, setDesiredLogin] = useState('');
  const [desiredPassword, setDesiredPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Aloqa manzillari
  const [phoneNumber, setPhoneNumber] = useState('');
  const [telegram, setTelegram] = useState('');
  const [instagram, setInstagram] = useState('');
  const [emailContact, setEmailContact] = useState('');

  // Holat
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Regionlarni backenddan olish
  useEffect(() => {
    fetch('/api/v1/schools/regions')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && Object.keys(data).length > 0) {
          setRegionsData(data);
          const firstReg = Object.keys(data)[0];
          setSelectedRegion(firstReg);
          if (data[firstReg] && data[firstReg].length > 0) {
            setSelectedDistrict(data[firstReg][0]);
          }
        }
      })
      .catch(() => {});

    // Maktablar ro'yxatini olish
    fetch('/api/v1/schools')
      .then(res => res.ok ? res.json() : null)
      .then(list => {
        if (Array.isArray(list) && list.length > 0) {
          setAvailableSchools(list);
        }
      })
      .catch(() => {});
  }, []);

  // Viloyat o'zgarganda tumanni yangilash
  const handleRegionChange = (newRegion: string) => {
    setSelectedRegion(newRegion);
    const districts = regionsData[newRegion] || [];
    if (districts.length > 0) {
      setSelectedDistrict(districts[0]);
    } else {
      setSelectedDistrict('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validatsiyalar
    if (!fullName.trim()) {
      setError("To'liq ism-familiyangizni kiriting");
      return;
    }

    const effectiveDistrict = selectedDistrict === '__other__' ? customDistrict.trim() : selectedDistrict;
    if (!effectiveDistrict) {
      setError("Tumaningizni tanlang yoki kiriting");
      return;
    }

    const effectiveSchool = selectedSchool === '__other__' || !selectedSchool ? customSchool.trim() : selectedSchool;
    if (!effectiveSchool) {
      setError("Maktabingiz raqami yoki nomini kiriting");
      return;
    }

    if (!desiredLogin.trim()) {
      setError("Istalgan login (username)ni kiriting");
      return;
    }

    if (desiredPassword.length < 6) {
      setError("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }

    const cleanPhone = phoneNumber.trim();
    const cleanTg = telegram.trim().replace(/^@/, '');
    const cleanInsta = instagram.trim().replace(/^@/, '');
    const cleanMail = emailContact.trim();

    if (!cleanPhone && !cleanTg && !cleanInsta && !cleanMail) {
      setError("Admin siz bilan bog'lanishi uchun kamida bitta aloqa manzilini (Telefon raqam, Telegram, Instagram yoki Email) kiriting");
      return;
    }

    const roleDesc = userRole === 'student'
      ? `${studentGrade}-sinf o'quvchisi`
      : `${teacherSubject} fani o'qituvchisi`;

    const payload = {
      full_name: fullName.trim(),
      region: selectedRegion,
      district: effectiveDistrict,
      district_school: `${selectedRegion}, ${effectiveDistrict} — ${effectiveSchool}`,
      school_name: effectiveSchool,
      role_description: roleDesc,
      desired_login: desiredLogin.trim().toLowerCase().replace(/\s+/g, '_'),
      desired_password: desiredPassword.trim(),
      phone_number: cleanPhone || null,
      telegram: cleanTg ? `@${cleanTg}` : null,
      instagram: cleanInsta ? `@${cleanInsta}` : null,
      email_contact: cleanMail || null
    };

    setLoading(true);

    try {
      const res = await fetch('/api/v1/contacts/account-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Ariza yuborishda xatolik yuz berdi");
      }

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || "Server bilan bog'lanishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  // Muassasaga mos maktablar
  const filteredSchools = availableSchools.filter(s => {
    if (s.region && s.region !== selectedRegion) return false;
    return true;
  });

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <BackButton to="/" label="Bosh sahifaga qaytish" />

      {/* Muvaffaqiyat kartasi */}
      {isSuccess ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-emerald-100 text-center space-y-6 animate-fadeIn mt-6">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner shadow-emerald-200">
            <CheckCircle2 className="w-10 h-10 animate-bounce" />
          </div>

          <div className="space-y-2">
            <div className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
              Ariza muvaffaqiyatli qabul qilindi
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Arizangiz muvaffaqiyatli yuborildi!
            </h2>
            <p className="text-base sm:text-lg text-slate-700 font-medium max-w-xl mx-auto pt-2">
              So'rovingiz qabul qilindi! Admin ko'rib chiqib, ko'rsatilgan Telegram/Instagram orqali hisobingizni tasdiqlaydi.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 text-left max-w-md mx-auto border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Ariza egasi:</span>
              <span className="font-bold text-slate-800">{fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">So'ralgan login:</span>
              <span className="font-mono font-bold text-blue-700">@{desiredLogin.toLowerCase().replace(/\s+/g, '_')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Maktab:</span>
              <span className="font-bold text-slate-800">{selectedSchool === '__other__' || !selectedSchool ? customSchool : selectedSchool}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Aloqa:</span>
              <span className="font-bold text-violet-700">{telegram ? `@${telegram.replace('@', '')}` : (instagram || emailContact)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-700 hover:bg-blue-800 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 transition text-sm flex items-center justify-center gap-2"
            >
              <span>Kirish sahifasiga o'tish</span>
            </Link>
            <Link
              to="/"
              className="w-full sm:w-auto px-8 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition text-sm flex items-center justify-center"
            >
              Bosh sahifaga qaytish
            </Link>
          </div>
        </div>
      ) : (
        /* Ariza formasi */
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200 mt-6 space-y-8">
          
          {/* Sarlavha bloki */}
          <div className="border-b border-slate-100 pb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>EduAI + IT Yoshlar Milliy Ta'lim Tizimi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Hisob ochish uchun ariza yuborish
            </h1>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Platforma sifatli ta'lim va xavfsizlikni ta'minlash maqsadida to'g'ridan-to'g'ri ochiq ro'yxatdan o'tishni qo'llamaydi. Maktab o'quvchilari va o'qituvchilari ariza yuborish orqali tekshirilib, tizimga kiritiladi.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs sm:text-sm text-red-800 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. Shaxsiy ma'lumotlar */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                1. Shaxsiy ma'lumotlar
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  To'liq ism-familiyangiz *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Masalan: Xusanov Xumoyun"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                  />
                </div>
              </div>
            </div>

            {/* 2. Hudud va Maktab */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                2. Hudud va Ta'lim Muassasasi
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Viloyat */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Viloyat / Shahar *
                  </label>
                  <select
                    value={selectedRegion}
                    onChange={(e) => handleRegionChange(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                  >
                    {Object.keys(regionsData).map((reg) => (
                      <option key={reg} value={reg}>{reg}</option>
                    ))}
                  </select>
                </div>

                {/* Tuman */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tuman yoki Shahar *
                  </label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                  >
                    {(regionsData[selectedRegion] || []).map((dist) => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                    <option value="__other__">+ Boshqa tuman (qo'lda kiritish)</option>
                  </select>
                </div>
              </div>

              {/* Boshqa tuman kiritish */}
              {selectedDistrict === '__other__' && (
                <div className="animate-fadeIn">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tuman nomini kiriting *
                  </label>
                  <input
                    type="text"
                    required
                    value={customDistrict}
                    onChange={(e) => setCustomDistrict(e.target.value)}
                    placeholder="Tumaningiz nomini yozing"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>
              )}

              {/* Maktab */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Maktab nomi yoki raqami *
                </label>
                {filteredSchools.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      value={selectedSchool}
                      onChange={(e) => setSelectedSchool(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                    >
                      <option value="">-- Maktabni tanlang --</option>
                      {filteredSchools.map((s) => (
                        <option key={s.id} value={s.name}>{s.name} ({s.district_name || selectedRegion})</option>
                      ))}
                      <option value="__other__">+ Ro'yxatda yo'q maktab (qo'lda kiritish)</option>
                    </select>

                    {(selectedSchool === '__other__' || selectedSchool === '') && (
                      <input
                        type="text"
                        required
                        value={customSchool}
                        onChange={(e) => setCustomSchool(e.target.value)}
                        placeholder="Masalan: 217-umumiy o'rta ta'lim maktabi"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                      />
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <SchoolIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={customSchool}
                      onChange={(e) => setCustomSchool(e.target.value)}
                      placeholder="Masalan: 217-umumta'lim maktabi"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 3. Lavozim va Rol */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-purple-600" />
                3. Platformadagi Lavozim (Rol)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* O'quvchi */}
                <div
                  onClick={() => setUserRole('student')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-center gap-3.5 ${
                    userRole === 'student'
                      ? 'border-blue-600 bg-blue-50/60 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg ${
                    userRole === 'student' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    🎓
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">O'quvchi</h4>
                    <p className="text-xs text-slate-500">Maktab o'quvchisi (5-11 sinflar)</p>
                  </div>
                </div>

                {/* O'qituvchi */}
                <div
                  onClick={() => setUserRole('teacher')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-center gap-3.5 ${
                    userRole === 'teacher'
                      ? 'border-emerald-600 bg-emerald-50/60 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg ${
                    userRole === 'teacher' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    👨‍🏫
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">O'qituvchi / Ustoz</h4>
                    <p className="text-xs text-slate-500">Fan o'qituvchisi yoki to'garak rahbari</p>
                  </div>
                </div>
              </div>

              {/* Qo'shimcha rol parametrlari */}
              {userRole === 'student' ? (
                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 animate-fadeIn">
                  <label className="block text-xs font-bold text-blue-950 mb-1.5">
                    Nechanchi sinfda o'qiysiz? *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['5', '6', '7', '8', '9', '10', '11'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setStudentGrade(g)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                          studentGrade === g
                            ? 'bg-blue-700 text-white shadow-sm'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {g}-sinf
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 animate-fadeIn">
                  <label className="block text-xs font-bold text-emerald-950 mb-1.5">
                    Qaysi fandan dars berasiz? *
                  </label>
                  <select
                    value={teacherSubject}
                    onChange={(e) => setTeacherSubject(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="Matematika">Matematika / Algebra</option>
                    <option value="Ingliz tili">Ingliz tili</option>
                    <option value="Informatika va IT">Informatika va IT texnologiyalar</option>
                    <option value="Fizika">Fizika</option>
                    <option value="Boshqa fan">Boshqa fan</option>
                  </select>
                </div>
              )}
            </div>

            {/* 4. Login va Parol */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <AtSign className="w-4 h-4 text-indigo-600" />
                4. Istalgan Login va Parol
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Istalgan Login (Username) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 text-slate-400 font-bold text-sm">@</span>
                    <input
                      type="text"
                      required
                      value={desiredLogin}
                      onChange={(e) => setDesiredLogin(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="khusanov yoki xumoyun"
                      className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Instagram kabi oddiy foydalanuvchi nomi. Faqat lotin harflari, raqamlar va _ belgisi.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Istalgan Parol *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={desiredPassword}
                      onChange={(e) => setDesiredPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                      title={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Kamida 6 ta belgi. Tasdiqlangach shu parol bilan kirasiz.
                  </p>
                </div>
              </div>
            </div>

            {/* 5. Aloqa kontaktlari */}
            <div className="space-y-4 pt-2">
              <div className="bg-amber-50/70 rounded-2xl p-4 sm:p-5 border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-5 h-5 text-amber-700" />
                  <h3 className="text-sm font-extrabold text-amber-950">
                    5. Admin bog'lanishi uchun aloqa manzili *
                  </h3>
                </div>
                <p className="text-xs text-amber-800 mb-4 leading-relaxed">
                  So'rovingiz tasdiqlanganda login va parolingiz shu kontaktga yuboriladi. <strong>Kamida bittasini to'ldiring:</strong>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  {/* Telefon raqam */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      Telefon raqam
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+998 90 123 45 67"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  {/* Telegram */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-blue-500" />
                      Telegram username
                    </label>
                    <input
                      type="text"
                      value={telegram}
                      onChange={(e) => setTelegram(e.target.value)}
                      placeholder="@khusanovv_blog"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  {/* Instagram */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Instagram className="w-3.5 h-3.5 text-pink-600" />
                      Instagram profil
                    </label>
                    <input
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="@username"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-600"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-emerald-600" />
                      Elektron pochta
                    </label>
                    <input
                      type="email"
                      value={emailContact}
                      onChange={(e) => setEmailContact(e.target.value)}
                      placeholder="nomingiz@mail.uz"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Yuborish tugmasi */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-700 hover:from-blue-800 hover:to-indigo-700 text-white rounded-2xl font-extrabold text-base shadow-xl shadow-blue-600/25 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Ariza yuborilmoqda...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Hisob ochish uchun ariza yuborish</span>
                  </>
                )}
              </button>
            </div>

            {/* Pastki eslatma */}
            <p className="text-center text-xs text-slate-500 pt-2">
              Allaqachon hisobingiz bormi?{' '}
              <Link to="/login" className="text-blue-700 font-bold hover:underline">
                Tizimga kirish
              </Link>
            </p>

          </form>

        </div>
      )}

    </div>
  );
};
