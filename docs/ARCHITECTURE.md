# EduAI + IT Yoshlar — Tizim Arxitekturasi va Talablar Hujjati (Phase 1)

## 1. Loyiha Missiyasi va Maqsadi
**EduAI** — maktab o'quvchilari uchun o'zbek tilidagi (lotin yozuvida, `uz-UZ`) sun'iy intellekt ta'lim assistenti bo'lib, o'quv fanlarini (dastlab Matematika va Ingliz tili) shaxsiylashtirilgan tushuntirishlar, bosqichma-bosqich ko'rsatmalar (hints), interaktiv mashqlar va testlar orqali o'zlashtirishga yordam beradi.

**IT Yoshlar** — o'quvchilarning IT va dasturlash loyihalarini (veb-ishlanmalar, Telegram botlar, SI modellari, robototexnika) birlashtiruvchi, jamoaviy ishlash va loyihalarni ko'rgazmaga (showcase) chiqarish platformasi.

---

## 2. Foydalanuvchi Rollari va Ruxsatlar Tizimi (RBAC)

1. **O'quvchi (Student)**:
   - Tasdiqlangan dars materiallari va mashqlarni ko'rish.
   - EduAI repetitori bilan muloqot qilish (sinf, fan va mavzu bo'yicha).
   - Tushuntirish uslubini tanlash: *Juda oddiy*, *Bosqichma-bosqich*, *Batafsil*.
   - Mashq va testlarni topshirish, o'z natijalari va o'rganish tarixini ko'rish.
   - IT Yoshlar loyihalariga qo'shilish va loyiha topshirish.
   - *Xavfsizlik cheklovi*: Hech qachon boshqa o'quvchilarning shaxsiy ma'lumotlari yoki baholarini ko'ra olmaydi.

2. **O'qituvchi (Teacher)**:
   - Biriktirilgan sinflarni boshqarish.
   - Topshiriqlar (assignments) va testlar (quizzes) yaratish, muddat belgilash.
   - AI tomonidan yaratilgan ta'lim materiallarini ko'rib chiqish (review), tahrirlash va tasdiqlash (*Approved* status).
   - Faqat o'ziga biriktirilgan sinf o'quvchilarining topshiriqlarini tekshirish va baho/fikr (feedback) qoldirish.
   - Noto'g'ri yoki nomaqbul AI javoblarini hisobot qilish.
   - Natijalarni CSV formatida eksport qilish.

3. **Maktab IT/AI Koordinatori (School Coordinator)**:
   - Maktab darajasidagi IT Yoshlar faoliyatini va tadbirlarni boshqarish.
   - Maktab bo'yicha umumlashtirilgan (agregatsiyalangan) statistikalarni ko'rish.
   - O'qituvchilar faoliyatini muvofiqlashtirish va texnik masalalarni nazorat qilish.
   - *Xavfsizlik cheklovi*: O'quvchilarning shaxsiy yozishmalari va nozik ma'lumotlariga ruxsatsiz kira olmaydi.

4. **Tuman Koordinatori (District Coordinator)**:
   - Tumandagi barcha qatnashuvchi maktablarni monitoring qilish.
   - Maktablararo musobaqalar va loyihalarni muvofiqlashtirish.
   - Umumlashtirilgan taqqoslash hisobotlarini ko'rish va eksport qilish.
   - *Xavfsizlik cheklovi*: Alohida o'quvchilarning shaxsiy profil va chatlariga ruxsatsiz kira olmaydi.

5. **Platforma Administratori (Platform Administrator)**:
   - Foydalanuvchilar, rollar, maktablar va sinflarni to'liq boshqarish.
   - Tizim xavfsizligi va audit jurnallarini (audit logs) nazorat qilish.
   - AI provayder sozlamalari holatini kuzatish.
   - Nomaqbul kontent va xavfsizlik shikoyatlarini moderatsiya qilish.
   - Boshlang'ich admin maxfiy buyruq/skript orqali yaratiladi, ochiq ro'yxatdan o'tish formasi mavjud emas.

---

## 3. Texnologik Stek va Arxitektura

### Backend:
- **Python 3.14**: Asinxron arxitektura (`async`/`await`).
- **FastAPI**: Yuqori tezlikdagi REST API va avtomatik OpenAPI hujjatlashtirish.
- **SQLAlchemy 2.0 (Async)**: Ma'lumotlar bazasi ORM.
- **Alembic**: Migratsiyalar boshqaruvi.
- **SQLite (Asinxron `aiosqlite`)**: Mahalliy ishlab chiqish va sinovlar uchun.
- **PostgreSQL (`asyncpg`)**: Ishlab chiqarish (Production) uchun.
- **Pydantic v2**: Kuchli tiplash va kiruvchi/chiquvchi ma'lumotlar validatsiyasi.
- **Passlib & Bcrypt**: Parollarni xeshlash.
- **Python-Jose**: JWT autentifikatsiyasi (access token + xavfsiz muddat).

### Frontend:
- **React 18 + TypeScript + Vite**: Tezkor SPA arxitekturasi.
- **Tailwind CSS**: Moslashuvchan va zamonaviy ta'lim dizayni (Deep blue `#1E3A8A`, Violet `#7C3AED`, Emerald `#059669`).
- **Lucide React**: Universaldan foydalanish uchun qulay ikonalar.
- **React Router v6**: Himoyalangan yo'nalishlar (Protected Routes) va rolga asoslangan navigatsiya.

### AI Integratsiyasi (Provider-Independent Layer):
- `AITutorProvider` abstraksiyasi orqali har qanday modelni ulash imkoniyati:
  - `MockAIProvider`: Mahalliy testlar va bepul ishlash uchun soxta emas, balki qoidaga asoslangan aqlli o'zbekcha o'qituvchi javoblari.
  - `OpenAICompatibleProvider` / `GoogleGeminiProvider`: API kalit orqali server tomonda ishlaydigan haqiqiy SI modeli.
- **Xavfsizlik qoidalari**:
  - Tizim prompti o'zbek tilida qat'iy xavfsizlik va pedagogik qoidalarni o'z ichiga oladi.
  - So'rovlar chastotasi cheklovi (Rate Limiting).
  - Matematik hisoblarni dasturiy (deterministik) tekshirish.

---

## 4. Ma'lumotlar Bazasi Modeli (ERD va Aloqalar)

Asosiy jadvallar:
1. `districts` (Tumanlar: id, name, code)
2. `schools` (Maktablar: id, district_id, name, code, is_active)
3. `users` (Foydalanuvchilar: id, school_id, email, full_name, hashed_password, role, grade, is_active, created_at)
4. `classes` (Sinflar: id, school_id, name, grade, academic_year)
5. `class_enrollments` (Sinf o'quvchilari: class_id, student_id)
6. `subjects` (Fanlar: id, name, code, description, icon)
7. `lessons` (Darslar/Mavzular: id, subject_id, grade, title, content, status [draft, pending_review, approved, rejected, archived], created_by)
8. `exercises` (Mashqlar: id, lesson_id, question_text, question_type [numeric, multiple_choice, text], options_json, correct_answer, hint_text, explanation)
9. `assignments` (Topshiriqlar: id, class_id, teacher_id, title, description, due_date, status)
10. `assignment_questions` (Topshiriq savollari bog'liqligi)
11. `submissions` (O'quvchi javoblari: id, assignment_id, student_id, score, max_score, feedback, submitted_at)
12. `ai_conversations` (SI repetitor suhbatlari: id, user_id, subject_id, grade, topic, created_at)
13. `ai_messages` (SI xabarlari: id, conversation_id, sender [user, assistant], content, hints_used, created_at)
14. `ai_feedback` (SI javobi ustidan shikoyat/baho: id, message_id, user_id, is_helpful, comment, created_at)
15. `projects` (IT Yoshlar loyihalari: id, school_id, owner_id, title, description, category, team_members, demo_url, repo_url, status, review_feedback)
16. `audit_logs` (Audit jurnali: id, user_id, action, entity_type, entity_id, details, ip_address, created_at)
17. `notifications` (Xabarnomalar: id, user_id, title, message, link, is_read, created_at)

---

## 5. Xavfsizlik va Maxfiylik Qarorlari
1. **O'quvchilar maxfiyligi**: O'quvchilardan faqat ism-familiya, sinf va login/parol so'raladi. Shaxsiy manzil, pasport yoki ortiqcha ma'lumotlar saqlanmaydi.
2. **Maktablararo izolyatsiya (Multi-tenant School Scoping)**: Har bir o'qituvchi va koordinator so'rovi SQL darajasida `school_id` filtri orqali himoyalanadi.
3. **Rol tekshiruvi**: Har bir endpoint backendda `RoleChecker` dependency orqali mustaqil tekshiriladi.
4. **AI kalitlari xavfsizligi**: API kalitlari faqat backend `.env` da saqlanadi, mijoz brauzeriga hech qachon uzatilmaydi.
