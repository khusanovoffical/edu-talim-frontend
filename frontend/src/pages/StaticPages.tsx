import React from 'react';
import { BookOpen, Shield, FileText } from 'lucide-react';

export const AboutPage: React.FC = () => (
  <div className="max-w-3xl mx-auto py-8 space-y-6">
    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-4">
      <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center">
        <BookOpen className="w-6 h-6" />
      </div>
      <h1 className="text-2xl font-extrabold text-slate-900">EduAI va IT Yoshlar haqida</h1>
      <p className="text-sm text-slate-600 leading-relaxed">
        <strong>EduAI</strong> — O'zbekiston maktab ta'limi tizimi uchun mo'ljallangan, to'liq o'zbek tilida (lotin yozuvida, `uz-UZ`) faoliyat ko'rsatuvchi sun'iy intellekt ta'lim assistentidir.
      </p>
      <h3 className="text-base font-bold text-slate-900">Asosiy Tamoyillarimiz:</h3>
      <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside leading-relaxed">
        <li><strong>Pedagogik mas'uliyat:</strong> SI assistenti o'quvchi o'rniga topshiriqlarni shunchaki ko'chirib bermaydi, balki mustaqil tushunishga yo'naltiruvchi maslahatlar (hints) beradi.</li>
        <li><strong>O'zbek tiliga ehtirom:</strong> Ilmiy va ta'limiy atamalar to'g'ri o'zbek tilida yoritiladi.</li>
        <li><strong>Xavfsiz ekotizim:</strong> O'quvchilar ma'lumotlari maxfiy saqlanadi, har bir maktab o'z chegarasida izolyatsiya qilingan.</li>
      </ul>
    </div>
  </div>
);

export const PrivacyPage: React.FC = () => (
  <div className="max-w-3xl mx-auto py-8 space-y-6">
    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-4">
      <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center">
        <Shield className="w-6 h-6" />
      </div>
      <h1 className="text-2xl font-extrabold text-slate-900">Maxfiylik Siyosati (Privacy Policy)</h1>
      <p className="text-xs text-slate-600 leading-relaxed">
        EduAI platformasi maktab o'quvchilarining shaxsiy daxlsizligini oliy darajada himoya qiladi (Privacy by Design).
      </p>
      <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
        <p><strong>1. To'planadigan ma'lumotlar:</strong> Faqat ta'lim jarayoni uchun zarur bo'lgan minimal ma'lumotlar — ism-familiya, o'quv sinfi va maktab birikmasi saqlanadi. Yashash manzili yoki pasport ma'lumotlari talab etilmaydi.</p>
        <p><strong>2. SI xizmati va yozishmalar:</strong> O'quvchilarning AI bilan suhbatlari faqat shaxsiy ta'lim tajribasini yaxshilash uchun xizmat qiladi va tashqi tijoriy maqsadlarda ishlatilmaydi.</p>
        <p><strong>3. Maktablararo xavfsizlik:</strong> Hech bir o'quvchi yoki o'qituvchi o'ziga tegishli bo'lmagan boshqa maktab yozuvlarini ko'ra olmaydi.</p>
      </div>
    </div>
  </div>
);

export const TermsPage: React.FC = () => (
  <div className="max-w-3xl mx-auto py-8 space-y-6">
    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-4">
      <div className="w-12 h-12 bg-purple-50 text-purple-700 rounded-2xl flex items-center justify-center">
        <FileText className="w-6 h-6" />
      </div>
      <h1 className="text-2xl font-extrabold text-slate-900">Foydalanish Shartlari (Terms of Use)</h1>
      <p className="text-xs text-slate-600 leading-relaxed">
        Ushbu platformadan foydalanishda o'quvchilar va o'qituvchilar o'zaro hurmat, ta'limiy etika va halollik qoidalariga rioya qilishlari shart.
      </p>
      <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
        <p><strong>1. Ta'limiy maqsad:</strong> EduAI repetitori o'quv dasturlarini o'zlashtirish uchun mo'ljallangan.</p>
        <p><strong>2. IT Yoshlar qoidalari:</strong> O'quvchilar tomonidan yuklanadigan dasturiy loyihalar xavfsiz bo'lishi, begona zararli kodlar yoki qoidabuzarliklarni o'z ichiga olmasligi lozim.</p>
      </div>
    </div>
  </div>
);
