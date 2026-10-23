import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { DashboardStats } from '../types';
import {
  Sparkles, Bot, Code, Calculator, Globe, Shield,
  ArrowRight, Users, CheckCircle, BookOpen, GraduationCap,
  Star, ChevronDown, Mail, Phone, MapPin, Send, HelpCircle,
  Compass, Check
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Murojaat uchun kontakt formasi holati
  const [contactForm, setContactForm] = useState({
    full_name: '',
    contact_info: '',
    subject: '',
    message: ''
  });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState('');

  useEffect(() => {
    api.getDashboardStats().then(setStats).catch(() => {});
  }, []);

  // Stats bo'lmasa ham default raqamlar ko'rinadi
  const displayStats = stats || {
    active_students: 120,
    active_teachers: 15,
    schools_count: 2,
    projects_count: 8
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactLoading(true);
    setContactError('');
    try {
      const res = await fetch('/api/v1/contacts/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm)
      });
      if (!res.ok) {
        let msg = "Xatolik yuz berdi";
        try {
          const data = await res.json();
          msg = data.detail || msg;
        } catch {}
        throw new Error(msg);
      }
      setContactSuccess(true);
      setContactForm({ full_name: '', contact_info: '', subject: '', message: '' });
    } catch (err: any) {
      setContactError(err.message || 'Xabarni yuborishda xatolik yuz berdi');
    } finally {
      setContactLoading(false);
    }
  };

  const sampleProjects = [
    {
      title: "Matematika yordamchi bot",
      category: "Telegram Bot",
      team: "Nodir, Ali",
      stars: 45,
      desc: "Maktab o'quvchilari uchun misollarni yechish va formulalarni eslatuvchi interaktiv Telegram bot."
    },
    {
      title: "O'zbek tilini o'rganish AI",
      category: "Sun'iy intellekt",
      team: "Jasur, Kamola",
      stars: 38,
      desc: "O'zbek tili grammatikasi va imlo qoidalarini aniq tahlil qiluvchi o'quv neyrotarmoq modeli."
    },
    {
      title: "Maktab kutubxona tizimi",
      category: "Web Ilovasi",
      team: "Sardor",
      stars: 29,
      desc: "Kutubxona kitoblarini qidirish, zaxiralash va onlayn hisobini yurituvchi qulay veb-platforma."
    },
  ];

  const faqs = [
    {
      q: "EduAI nima?",
      a: "EduAI — maktab o'quvchilari va o'qituvchilari uchun sun'iy intellektga asoslangan milliy ta'lim platformasi. U matematika va ingliz tili fanlarini chuqur o'rganishda shaxsiy repetitor vazifasini bajaradi."
    },
    {
      q: "IT Yoshlar nima?",
      a: "IT Yoshlar — bu dasturlash, sun'iy intellekt va robototexnika sohasida o'z loyihalarini yaratayotgan iqtidorli maktab o'quvchilari hamjamiyati va loyihalar ko'rgazmasi."
    },
    {
      q: "Qanday hisob ochish mumkin?",
      a: "Tizimga kirish sahifasida 'Hisob ochish uchun so'rov' tugmasini bosing va o'z ma'lumotlaringizni yuboring. Moderatorlar tekshirib, sizga kirish ma'lumotlarini taqdim etishadi."
    },
    {
      q: "Qaysi fanlar mavjud?",
      a: "Hozirda platformada 5-11 sinflar uchun Matematika va barcha darajadagi (A1, A2, B1, B2) Ingliz tili fanlari to'liq interaktiv shaklda mavjud."
    },
    {
      q: "AI repetitor qanday ishlaydi?",
      a: "Pedagogik AI o'quvchiga to'g'ridan-to'g'ri tayyor javob bermaydi, balki Sokratik uslubda bosqichma-bosqich yo'naltiruvchi savollar berib, mustaqil yechishga o'rgatadi."
    },
    {
      q: "Platforma bepulmi?",
      a: "Ha! EduAI davlat maktablari o'quvchilari va o'qituvchilari uchun mutlaqo bepul taqdim etiladi."
    },
  ];

  return (
    <div className="space-y-24 py-8">
      
      {/* 1. Hero Section */}
      <section className="text-center max-w-4xl mx-auto space-y-6 pt-6 sm:pt-12 px-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold shadow-sm">
          <Sparkles className="w-4 h-4 text-violet-600 animate-pulse" />
          <span>O'zbek tilidagi birinchi maktab sun'iy intellekt ta'lim platformasi</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
          Har bir maktab o'quvchisi uchun <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-600">
            Shaxsiy AI Ta'lim Yordamchisi
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          <strong>EduAI</strong> o'quvchilarga Matematika va Ingliz tili fanlarini bosqichma-bosqich o'zlashtirishga ko'maklashadi. <strong>IT Yoshlar</strong> esa maktab o'quvchilarining dasturlash loyihalari va startaplarini namoyish etadi.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            to="/login"
            className="px-6 py-3.5 bg-blue-700 hover:bg-blue-800 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-600/25 transition flex items-center gap-2"
          >
            <span>Bepul boshlash</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/projects-showcase"
            className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl text-sm font-bold border border-slate-200 shadow-sm transition flex items-center gap-2"
          >
            <Code className="w-4 h-4 text-violet-600" />
            <span>IT Yoshlar ko'rgazmasi</span>
          </Link>
        </div>
      </section>

      {/* 2. Katta Statistika bloki */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="space-y-2">
            <p className="text-5xl sm:text-7xl font-black text-blue-700 tracking-tight">
              {displayStats.active_students}+
            </p>
            <p className="text-xs sm:text-sm font-bold text-slate-600 uppercase tracking-wider">
              Faol o'quvchilar
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-5xl sm:text-7xl font-black text-emerald-700 tracking-tight">
              {displayStats.active_teachers}+
            </p>
            <p className="text-xs sm:text-sm font-bold text-slate-600 uppercase tracking-wider">
              O'qituvchilar
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-5xl sm:text-7xl font-black text-violet-700 tracking-tight">
              {displayStats.schools_count}
            </p>
            <p className="text-xs sm:text-sm font-bold text-slate-600 uppercase tracking-wider">
              Pilot maktablar
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-5xl sm:text-7xl font-black text-amber-600 tracking-tight">
              {displayStats.projects_count}+
            </p>
            <p className="text-xs sm:text-sm font-bold text-slate-600 uppercase tracking-wider">
              IT Yoshlar loyihalari
            </p>
          </div>
        </div>
      </section>

      {/* 3. Platforma qanday ishlaydi? */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-4 space-y-12">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-3">
            <Compass className="w-4 h-4" />
            <span>Bosqichma-bosqich jarayon</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Platforma qanday ishlaydi?
          </h2>
          <p className="text-slate-600 mt-3 max-w-2xl mx-auto text-sm sm:text-base">
            3 oddiy qadamda bilim olishni boshlang va o'z yutuqlaringizni oshiring
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Qadam 1 */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition">
            <div className="absolute top-4 right-4 text-6xl font-black text-slate-100 select-none">
              01
            </div>
            <div className="space-y-4 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl shadow-inner">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">1. Tizimga kiring</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Maktabingiz tomonidan berilgan login orqali kiring yoki hisob ochish uchun so'rov qoldirib, shaxsiy ta'lim profilingizni faollashtiring.
              </p>
            </div>
            <div className="pt-6 relative z-10">
              <Link to="/login" className="text-sm font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1.5">
                <span>Kirish oynasiga o'tish</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Qadam 2 */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition">
            <div className="absolute top-4 right-4 text-6xl font-black text-slate-100 select-none">
              02
            </div>
            <div className="space-y-4 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xl shadow-inner">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">2. Mavzuni tanlang</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Matematika (5-11 sinf) yoki Ingliz tili (A1-B2 darajalar) bo'yicha qiziqtirgan bob va darsni tanlab, interaktiv mashg'ulotlarga kirishing.
              </p>
            </div>
            <div className="pt-6 relative z-10">
              <a href="#subjects" className="text-sm font-bold text-indigo-700 hover:text-indigo-800 flex items-center gap-1.5">
                <span>Fanlar ro'yxatini ko'rish</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Qadam 3 */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition">
            <div className="absolute top-4 right-4 text-6xl font-black text-slate-100 select-none">
              03
            </div>
            <div className="space-y-4 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xl shadow-inner">
                <Bot className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">3. AI Repetitor bilan o'rganing</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Sokratik metod yordamida savollarga javob oling, qadamma-qadam tahlillarni ko'ring va xatolaringiz ustida mustaqil ishlang.
              </p>
            </div>
            <div className="pt-6 relative z-10">
              <Link to="/login" className="text-sm font-bold text-violet-700 hover:text-violet-800 flex items-center gap-1.5">
                <span>Mashqlarni boshlash</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Fanlar bo'limi */}
      <section id="subjects" className="max-w-6xl mx-auto px-4 space-y-10">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Interaktiv Fanlar
          </h2>
          <p className="text-slate-600 mt-3 text-sm sm:text-base">
            O'zbekiston maktab ta'limi dasturiga moslashtirilgan chuqurlashtirilgan interaktiv kurslar
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Matematika kartochkasi */}
          <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white rounded-3xl p-8 sm:p-10 shadow-xl flex flex-col justify-between space-y-8 relative overflow-hidden">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                  <Calculator className="w-7 h-7" />
                </div>
                <span className="px-3 py-1 rounded-full bg-blue-500/30 border border-blue-400/40 text-blue-100 text-xs font-bold uppercase tracking-wider">
                  5-11 Sinflar
                </span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-black">Matematika & Geometriya</h3>
                <p className="text-blue-100/90 text-sm mt-2 leading-relaxed">
                  Kasrlar, chiziqli va kvadrat tenglamalar, logarifmlar, trigonometriya hamda geometrik isbotlar — KaTeX formulalar animatsiyasi bilan.
                </p>
              </div>

              {/* Xususiyatlar ro'yxati */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-2.5 text-xs text-blue-100">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Pedagogik AI bilan qadamma-qadam tushuntirish</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-blue-100">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Cheksiz avtomatik mashqlar va testlar generatori</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-blue-100">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Xatolarni deterministik aniqlash va qoidani eslatish</span>
                </div>
              </div>

              {/* Formula banner */}
              <div className="bg-white/10 rounded-2xl p-4 border border-white/15 backdrop-blur-sm text-center">
                <span className="text-xs text-blue-200 block mb-1">Kvadrat tenglama ildizlari:</span>
                <span className="font-mono text-base font-bold tracking-wider text-amber-300">
                  x = (-b ± √(b² - 4ac)) / 2a
                </span>
              </div>
            </div>

            <Link
              to="/login"
              className="w-full py-3.5 bg-white text-blue-900 hover:bg-blue-50 rounded-2xl font-bold text-center text-sm shadow-lg transition flex items-center justify-center gap-2"
            >
              <span>Matematika mashg'ulotlariga o'tish</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Ingliz tili kartochkasi */}
          <div className="bg-gradient-to-br from-violet-700 via-purple-800 to-fuchsia-900 text-white rounded-3xl p-8 sm:p-10 shadow-xl flex flex-col justify-between space-y-8 relative overflow-hidden">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                  <Globe className="w-7 h-7" />
                </div>
                {/* CEFR Level pill */}
                <div className="flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-lg bg-white/20 text-xs font-bold">A1</span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/20 text-xs font-bold">A2</span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/20 text-xs font-bold">B1</span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/20 text-xs font-bold">B2</span>
                </div>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-black">Ingliz tili (CEFR)</h3>
                <p className="text-purple-100/90 text-sm mt-2 leading-relaxed">
                  Boshlang'ichdan mustaqil so'zlashuvgacha: grammatika qoidalari, yangi so'zlar lug'ati va AI bilan interaktiv dialog mashqlari.
                </p>
              </div>

              {/* Xususiyatlar ro'yxati */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-2.5 text-xs text-purple-100">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Grammar Mastery: Tenses, Modals, Conditionals</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-purple-100">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>AI Repetitor bilan ingliz tilida erkin suhbat</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-purple-100">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Mavzuli so'z boyligi va real hayotiy mashqlar</span>
                </div>
              </div>

              {/* Level banner */}
              <div className="bg-white/10 rounded-2xl p-4 border border-white/15 backdrop-blur-sm flex items-center justify-around text-center">
                <div>
                  <span className="text-xs text-purple-200 block">Boshlang'ich</span>
                  <span className="font-bold text-sm text-white">A1 - Beginner</span>
                </div>
                <div className="h-6 w-px bg-white/20" />
                <div>
                  <span className="text-xs text-purple-200 block">Mustaqil daraja</span>
                  <span className="font-bold text-sm text-amber-300">B2 - Vantage</span>
                </div>
              </div>
            </div>

            <Link
              to="/login"
              className="w-full py-3.5 bg-white text-purple-900 hover:bg-purple-50 rounded-2xl font-bold text-center text-sm shadow-lg transition flex items-center justify-center gap-2"
            >
              <span>Ingliz tili mashg'ulotlariga o'tish</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. IT Yoshlar eng yaxshi loyihalari */}
      <section id="it-yoshlar" className="max-w-6xl mx-auto px-4 space-y-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-bold mb-2">
              <Code className="w-4 h-4" />
              <span>Iqtidorli o'quvchilar loyihalari</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              IT Yoshlar Eng Yaxshi Loyihalari
            </h2>
            <p className="text-slate-600 mt-1 text-sm">
              Maktab o'quvchilari tomonidan yaratilgan innovatsion dasturiy yechimlar
            </p>
          </div>

          <Link
            to="/projects-showcase"
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2 shrink-0"
          >
            <span>Barcha loyihalarni ko'rish</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sampleProjects.map((proj, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-violet-50 text-violet-700 rounded-full text-xs font-bold">
                    {proj.category}
                  </span>
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{proj.stars}</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition">
                  {proj.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {proj.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <Users className="w-4 h-4 text-violet-600" />
                  <span>{proj.team}</span>
                </div>
                <Link
                  to="/projects-showcase"
                  className="font-bold text-blue-700 hover:underline flex items-center gap-1"
                >
                  <span>Batafsil</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Asosiy Imkoniyatlar (Features) */}
      <section className="max-w-6xl mx-auto px-4 space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Nega EduAI + IT Yoshlar?
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Ta'lim va texnologiyani birlashtiruvchi zamonaviy o'quv ekotizimi
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Pedagogik AI Repetitor</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              O'quvchi o'rniga shunchaki ishlab bermaydi. Misol va mavzularni o'quvchining yoshiga mos ravishda tushuntiradi va mustaqil yechishga undaydi.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Calculator className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Matematika va Ingliz tili</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Formulalarni KaTeX yordamida chiroyli ko'rsatish, kasrlar, foizlar va CEFR bo'yicha grammatik mashqlarni deterministik tekshirish.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-700 flex items-center justify-center">
              <Code className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">IT Yoshlar Hamjamiyati</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Telegram botlar, sun'iy intellekt modellari va robototexnika loyihalarini yaratayotgan iqtidorli o'quvchilar uchun platforma.
            </p>
          </div>
        </div>
      </section>

      {/* 7. FAQ Akkordeon */}
      <section id="faq" className="max-w-4xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
            <HelpCircle className="w-4 h-4" />
            <span>Savollaringiz bormi?</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Ko'p Beriladigan Savollar
          </h2>
          <p className="text-slate-600 text-sm">
            EduAI platformasi va IT Yoshlar haqida eng muhim ma'lumotlar
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left font-bold text-slate-900 flex items-center justify-between gap-4 hover:bg-slate-50 transition text-sm sm:text-base"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-blue-700' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. Murojaat uchun (Contact Form) */}
      <section id="contact" className="max-w-4xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
            <Mail className="w-4 h-4" />
            <span>Bog'lanish</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Murojaat Uchun
          </h2>
          <p className="text-slate-600 text-sm max-w-xl mx-auto">
            Savol, taklif yoki hamkorlik bo'yicha bizga xabar qoldiring. Tez orada siz bilan bog'lanamiz!
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl shadow-slate-200/50">
          {contactSuccess ? (
            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Xabaringiz muvaffaqiyatli yuborildi!</h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Tez orada koordinatorlarimiz siz bilan bog'lanishadi. EduAI platformasini tanlaganingiz uchun tashakkur!
              </p>
              <button
                type="button"
                onClick={() => setContactSuccess(false)}
                className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-semibold text-sm transition"
              >
                Yana xabar yuborish
              </button>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-5 text-sm">
              {contactError && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700">
                  {contactError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1.5">
                    To'liq ism-familiyangiz *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactForm.full_name}
                    onChange={e => setContactForm({ ...contactForm, full_name: e.target.value })}
                    placeholder="Masalan: Xusanov Xumoyun"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none focus:bg-white transition text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1.5">
                    Aloqa uchun (Email yoki Telefon) *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactForm.contact_info}
                    onChange={e => setContactForm({ ...contactForm, contact_info: e.target.value })}
                    placeholder="+998 90 123 45 67 yoki nodir@gmail.com"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none focus:bg-white transition text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  Mavzu *
                </label>
                <input
                  type="text"
                  required
                  value={contactForm.subject}
                  onChange={e => setContactForm({ ...contactForm, subject: e.target.value })}
                  placeholder="Masalan: Maktabimizni EduAI tizimiga ulash bo'yicha"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none focus:bg-white transition text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  Xabar matni *
                </label>
                <textarea
                  required
                  rows={4}
                  value={contactForm.message}
                  onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                  placeholder="Savol yoki taklifingizni batafsil bayon qiling..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none focus:bg-white transition text-xs sm:text-sm resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={contactLoading}
                className="w-full py-3 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white rounded-xl font-bold shadow-md shadow-blue-700/20 transition flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{contactLoading ? 'Yuborilmoqda...' : 'Xabarni yuborish'}</span>
              </button>
            </form>
          )}
        </div>
      </section>

      {/* 9. Zamonaviy Ko'p Ustunli Footer */}
      <footer className="bg-slate-900 text-white -mx-4 sm:-mx-6 lg:-mx-8 -mb-8">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* 1-ustun: Logo + Tavsif */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight leading-none text-white">
                  Edu<span className="text-blue-400">AI</span>
                </span>
                <span className="text-[10px] text-violet-400 font-bold uppercase tracking-widest mt-0.5">
                  + IT Yoshlar
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              O'zbekiston maktablari uchun birinchi milliy sun'iy intellekt ta'lim platformasi va yosh dasturchilar hamjamiyati.
            </p>
            <div className="flex items-center gap-3 pt-2 text-slate-400">
              <span className="text-xs bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                🇺🇿 O'zbekistonda ishlab chiqilgan
              </span>
            </div>
          </div>

          {/* 2-ustun: Platforma bo'limlari */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Platforma
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <a href="#" className="hover:text-blue-400 transition">Bosh sahifa</a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-blue-400 transition">Imkoniyatlar</a>
              </li>
              <li>
                <Link to="/about" className="hover:text-blue-400 transition">Biz haqimizda</Link>
              </li>
              <li>
                <Link to="/projects-showcase" className="hover:text-blue-400 transition">IT Yoshlar ko'rgazmasi</Link>
              </li>
              <li>
                <a href="#contact" className="hover:text-blue-400 transition">Murojaat uchun</a>
              </li>
            </ul>
          </div>

          {/* 3-ustun: Fanlar */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Fanlar & Darslar
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <a href="#subjects" className="hover:text-blue-400 transition">Matematika (5-11 sinflar)</a>
              </li>
              <li>
                <a href="#subjects" className="hover:text-blue-400 transition">Ingliz tili (A1-B2 darajalar)</a>
              </li>
              <li>
                <Link to="/login" className="hover:text-blue-400 transition">Pedagogik AI Repetitor</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-blue-400 transition">Interaktiv mashqlar</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-blue-400 transition">Formulalar ma'lumotnomasi</Link>
              </li>
            </ul>
          </div>

          {/* 4-ustun: Aloqa */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Bog'lanish
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <a href="mailto:xxusanov228@gmail.com" className="hover:text-blue-400 transition">xxusanov228@gmail.com</a>
              </li>
              <li className="flex items-center gap-2">
                <Send className="w-4 h-4 text-violet-400 shrink-0" />
                <a href="https://t.me/khusanovv_blog" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition">@khusanovv_blog (Telegram)</a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Samarqand viloyati, Paxtachi tumani</span>
              </li>
              <li className="pt-2">
                <a
                  href="#contact"
                  className="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold text-xs border border-slate-700 transition"
                >
                  Xabar qoldirish
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Mualliflik huquqi */}
        <div className="border-t border-slate-800 py-6 text-center text-slate-400 text-xs">
          © 2026 EduAI + IT Yoshlar. Barcha huquqlar himoyalangan.
        </div>
      </footer>

    </div>
  );
};
