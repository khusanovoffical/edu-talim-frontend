# EduAI va IT Yoshlar — Intellektual Ta'lim va Texnologik Loyihalar Platformasi

**EduAI** — maktab o'quvchilari uchun o'zbek tilidagi (lotin yozuvida, `uz-UZ`) shaxsiy sun'iy intellekt repetitori, Matematika va Ingliz tili o'quv modullari hamda **IT Yoshlar** o'quvchilar texnologik loyihalari hamjamiyatini birlashtirgan to'liq funksional (full-stack) ta'lim platformasi.

---

## 1. Platforma nima qiladi va foydalanuvchi rollari (RBAC)

Platformada **5 ta foydalanuvchi roli** va maktablararo qat'iy ma'lumotlar izolyatsiyasi (`school_id` va `district_id` chegaralari) joriy etilgan:

1. **O'quvchi (`student`)**:
   - O'qituvchi tasdiqlagan Matematika (kasrlar, foizlar, chiziqli tenglamalar, geometriya, nisbat va proporsiya) hamda Ingliz tili (CEFR A1–B2) darslarini o'rganadi.
   - **EduAI Repetitor**dan o'ziga qulay uslubda (*Juda sodda*, *Qadam-baqadam*, *Batafsil*) tushuntirish, *Ishora (Hint — tayyor javobni ochmasdan)*, *Ishlangan misollar* va *Mustaqil mashqlar* oladi.
   - Test va topshiriqlarni bajaradi, o'z natijalari hamda ustoz izohlarini ko'radi.
   - **IT Yoshlar** bo'limida loyihalarga qo'shiladi va o'z texnologik loyihasini mentor ko'rigiga yuboradi.
   - *Maxfiylik kafolati:* Hech qachon boshqa o'quvchining shaxsiy natijalarini yoki yozishmalarini ko'ra olmaydi.

2. **O'qituvchi (`teacher`)**:
   - Faqat o'ziga biriktirilgan sinflarni va o'quvchilarni boshqaradi.
   - Yangi test va uy vazifalarini tuzadi (`Quiz Builder`).
   - AI tomonidan yaratilgan o'quv materiallarini tahrirlaydi va tasdiqlaydi (`Draft → Pending Review → Approved / Rejected / Archived`).
   - O'quvchilar topshirgan ishlarni ko'rib chiqadi, izoh yozadi va natijalarni **CSV** formatida yuklab oladi.

3. **Maktab IT/AI Koordinatori (`school_coordinator`)**:
   - Maktab miqyosidagi IT Yoshlar loyihalarini moderatsiya qiladi va ko'rgazmaga (`showcase`) chiqaradi.
   - Maktab IT tadbirlarini tashkil etadi va o'quvchilarning shaxsiy yozishmalariga kirmasdan umumlashtirilgan maktab statistikasini ko'radi.

4. **Tuman Koordinatori (`district_coordinator`)**:
   - Tumandagi ishtirokchi pilot maktablarni (masalan, 145-sonli va 210-sonli maktablarni) umumlashtirilgan ko'rsatkichlar asosida tahlil qiladi va maktablararo tanlovlarni muvofiqlashtiradi.

5. **Platforma Administratori (`admin`)**:
   - Foydalanuvchilar, rollar va maktablarni boshqaradi.
   - AI provayder holatini (*Gemini 3.8 Flash* yoki *Lokal Mock AI*) va moderatsiya murojaatlarini nazorat qiladi.
   - Audit jurnali (`audit_events`) hamda ma'lumotlarni saqlash muddatini (`Data Retention`) boshqaradi.

---

## 2. Dasturiy talablar (Prerequisites)

- **Node.js** `v22+` (ichki `node:sqlite` relyatsion ma'lumotlar bazasi va TypeScript serveri uchun)
- **Python** `3.10+` va **PostgreSQL** `15+` (Docker yoki FastAPI orqali alohida serverga o'rnatish uchun)
- **Docker** va **Docker Compose** (Production konteynerda ishga tushirish uchun)

---

## 3. O'rnatish va ishga tushirish (Windows PowerShell va Linux/macOS)

### A. Windows PowerShell orqali ishga tushirish

```powershell
# 1. Paketlarni o'rnatish
npm install

# 2. Muhit o'zgaruvchilarini (.env) nusxalash
Copy-Item .env.example .env

# 3. Avtomatlashtirilgan xavfsizlik va funksional testlarni (18 ta mezon) ishga tushirish
npm test

# 4. Ilovani (Frontend + Backend API + SQLite migratsiyalari) 3000-portda ishga tushirish
npm run dev
```

### B. Linux / macOS terminal orqali ishga tushirish

```bash
# 1. Paketlarni o'rnatish
npm install

# 2. .env faylini yaratish
cp .env.example .env

# 3. Testlarni tekshirish
npm test

# 4. Serverni 3000-portda ishga tushirish
npm run dev
```

Brauzerda `http://localhost:3000` manzilini oching.

---

## 4. Muhit o'zgaruvchilari (`.env`)

| O'zgaruvchi | Tavsifi | Misol |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Server tomonidagi Gemini API kaliti (brauzerga uzatilmaydi) | `AIzaSy...` |
| `EDUAI_AI_MODE` | `auto` (kalit bo'lsa Gemini, bo'lmasa Mock), `mock` yoki `gemini` | `auto` |
| `EDUAI_DB_PATH` | SQLite ma'lumotlar bazasi fayli manzili | `./data/eduai.sqlite` |
| `DATABASE_URL` | Production PostgreSQL ulanish satri | `postgresql+psycopg2://...` |
| `EDUAI_SESSION_SECRET` | Sessiya va CSRF tokenlarini imzolash uchun maxfiy kalit | `64-belgili-tasodifiy-satr` |
| `EDUAI_RETENTION_DAYS` | AI suhbatlarini saqlash muddati (kunlarda) | `90` |

---

## 5. Birinchi Administratorni xavfsiz yaratish

Platformada ochiq administrator ro'yxatdan o'tish formasi mavjud emas (bu xavfsizlik qoidasi bilan bloklangan). Birinchi administratorni buyruq satri (CLI) orqali yarating:

```bash
python3 scripts/create_admin.py --email admin@maktab.uz --name "Maktab Administratori"
```

---

## 6. AI Provayderni sozlash va Mock AI rejimi

- **Real AI rejimi:** `.env` faylida `GEMINI_API_KEY` ko'rsatilganda server avtomatik ravishda `@google/genai` (`gemini-3.8-flash`) modelidan foydalanadi.
- **Mock AI rejimi (API xarajatisiz):** Agar API kaliti kiritilmagan bo'lsa yoki `EDUAI_AI_MODE="mock"` tanlansa, tizim to'liq o'zbek tilidagi deterministik **Mock AI** provayderi orqali tushuntirish, ishora (`hint`), misol va mashqlarni uzluksiz qaytaradi.

---

## 7. Production muhitiga joylashtirish (Docker, HTTPS va Zaxira nusxa)

### Docker Compose bilan ishga tushirish
```bash
docker compose up -d --build
```

### HTTPS (Nginx / Caddy Reverse Proxy)
Production serverda `Caddyfile` orqali avtomatik Let's Encrypt TLS sertifikatini yoqing:
```text
eduai.maktab.uz {
    reverse_proxy localhost:3000
}
```

### Ma'lumotlar bazasini zaxiralash (Backup) va tiklash (Recovery)

- **SQLite zaxira nusxasi:**
  ```bash
  sqlite3 ./data/eduai.sqlite ".backup './backups/eduai_backup_$(date +%F).sqlite'"
  ```
- **PostgreSQL zaxira nusxasi:**
  ```bash
  docker compose exec db pg_dump -U eduai_user eduai_db > eduai_pg_backup.sql
  ```
- **Tiklash (Restore):**
  ```bash
  docker compose exec -T db psql -U eduai_user eduai_db < eduai_pg_backup.sql
  ```

---

## 8. Tizimni kengaytirish bo'yicha yo'riqnoma

- **Yangi fan qo'shish:** `subjects` jadvaliga yangi fan kodi (masalan, `physics` — Fizika) qo'shiladi va `lessons` jadvaliga o'qituvchi paneli orqali darslar kiritiladi.
- **Yangi AI provayder qo'shish:** `server/aiService.ts` ichidagi `generateTutorResponse` interfeysiga yangi adapter qo'shiladi.
- **Yangi maktab va foydalanuvchi qo'shish:** Administrator panelidagi **Maktablar boshqaruvi** va **Foydalanuvchilar va rollar** bo'limlari orqali amalga oshiriladi.
