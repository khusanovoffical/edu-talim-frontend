import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { hashPassword } from './security.js';

let dbInstance: DatabaseSync | null = null;

export function getDb(customPath?: string): DatabaseSync {
  if (dbInstance && !customPath) return dbInstance;

  const targetPath = customPath || process.env.EDUAI_DB_PATH || './data/eduai.sqlite';
  if (targetPath !== ':memory:') {
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new DatabaseSync(targetPath);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = WAL;');

  runMigrations(db);
  seedDatabaseIfNeeded(db);

  if (!customPath) {
    dbInstance = db;
  }
  return db;
}

export function resetDbForTest(db: DatabaseSync): void {
  dbInstance = db;
}

export function runMigrations(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS districts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      region TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS schools (
      id TEXT PRIMARY KEY,
      district_id TEXT NOT NULL REFERENCES districts(id) ON DELETE RESTRICT,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      city TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      school_id TEXT REFERENCES schools(id) ON DELETE SET NULL,
      district_id TEXT REFERENCES districts(id) ON DELETE SET NULL,
      email TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student','teacher','school_coordinator','district_coordinator','admin')),
      grade INTEGER,
      preferred_style TEXT NOT NULL DEFAULT 'step_by_step' CHECK(preferred_style IN ('very_simple','step_by_step','detailed')),
      english_level TEXT NOT NULL DEFAULT 'A2' CHECK(english_level IN ('A1','A2','B1','B2')),
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_users_school ON users(school_id);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name_uz TEXT NOT NULL,
      description_uz TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
      teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      name TEXT NOT NULL,
      grade INTEGER NOT NULL,
      subject_code TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_classes_school ON classes(school_id);
    CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);

    CREATE TABLE IF NOT EXISTS class_enrollments (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
      student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      enrolled_at TEXT NOT NULL,
      UNIQUE(class_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
      subject_code TEXT NOT NULL,
      grade INTEGER NOT NULL,
      topic_slug TEXT NOT NULL,
      title_uz TEXT NOT NULL,
      level_tag TEXT NOT NULL DEFAULT 'General',
      summary_uz TEXT NOT NULL,
      content_uz TEXT NOT NULL,
      worked_example_uz TEXT NOT NULL,
      approval_status TEXT NOT NULL DEFAULT 'approved' CHECK(approval_status IN ('draft','pending_review','approved','rejected','archived')),
      created_by TEXT NOT NULL REFERENCES users(id),
      reviewed_by TEXT REFERENCES users(id),
      reviewed_at TEXT,
      revision_notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_lessons_subject_grade ON lessons(subject_code, grade);
    CREATE INDEX IF NOT EXISTS idx_lessons_status ON lessons(approval_status);

    CREATE TABLE IF NOT EXISTS content_reviews (
      id TEXT PRIMARY KEY,
      lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      reviewer_id TEXT NOT NULL REFERENCES users(id),
      previous_status TEXT NOT NULL,
      new_status TEXT NOT NULL,
      comment_uz TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
      class_id TEXT REFERENCES classes(id) ON DELETE CASCADE,
      teacher_id TEXT NOT NULL REFERENCES users(id),
      subject_code TEXT NOT NULL,
      grade INTEGER NOT NULL,
      topic_slug TEXT NOT NULL,
      title_uz TEXT NOT NULL,
      description_uz TEXT NOT NULL,
      assignment_type TEXT NOT NULL DEFAULT 'quiz' CHECK(assignment_type IN ('practice','quiz','homework')),
      is_published INTEGER NOT NULL DEFAULT 1,
      due_date TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_assignments_school ON assignments(school_id);
    CREATE INDEX IF NOT EXISTS idx_assignments_class ON assignments(class_id);

    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
      question_type TEXT NOT NULL CHECK(question_type IN ('multiple_choice','numeric','fill_blank','short_answer')),
      prompt_uz TEXT NOT NULL,
      options_json TEXT,
      correct_answer TEXT NOT NULL,
      hint_uz TEXT NOT NULL,
      explanation_uz TEXT NOT NULL,
      points INTEGER NOT NULL DEFAULT 10,
      order_index INTEGER NOT NULL DEFAULT 1
    );

    CREATE INDEX IF NOT EXISTS idx_questions_assignment ON questions(assignment_id);

    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
      student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
      answers_json TEXT NOT NULL,
      results_json TEXT NOT NULL,
      score INTEGER NOT NULL,
      max_score INTEGER NOT NULL,
      percentage INTEGER NOT NULL,
      teacher_feedback_uz TEXT,
      reviewed_by TEXT REFERENCES users(id),
      submitted_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignment_id);

    CREATE TABLE IF NOT EXISTS ai_conversations (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
      subject_code TEXT NOT NULL,
      grade INTEGER NOT NULL,
      topic TEXT NOT NULL,
      title_uz TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_ai_conv_student ON ai_conversations(student_id);

    CREATE TABLE IF NOT EXISTS ai_messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
      sender_role TEXT NOT NULL CHECK(sender_role IN ('user','assistant')),
      content_text TEXT NOT NULL,
      request_type TEXT NOT NULL DEFAULT 'explain',
      provider_used TEXT,
      is_teacher_approved INTEGER NOT NULL DEFAULT 0,
      feedback_rating TEXT CHECK(feedback_rating IN ('helpful','unhelpful','reported')),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ai_usage_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      school_id TEXT REFERENCES schools(id) ON DELETE SET NULL,
      subject_code TEXT NOT NULL,
      request_type TEXT NOT NULL,
      provider_used TEXT NOT NULL,
      status TEXT NOT NULL,
      latency_ms INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ai_reports (
      id TEXT PRIMARY KEY,
      reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      school_id TEXT REFERENCES schools(id) ON DELETE SET NULL,
      message_id TEXT,
      reason_uz TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','reviewed','resolved')),
      resolution_note_uz TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
      owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      mentor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      title_uz TEXT NOT NULL,
      description_uz TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending_review' CHECK(status IN ('draft','pending_review','approved','showcase','rejected')),
      milestones_json TEXT NOT NULL DEFAULT '[]',
      demo_url TEXT,
      repo_url TEXT,
      team_names TEXT NOT NULL,
      review_feedback_uz TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_projects_school ON projects(school_id);
    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

    CREATE TABLE IF NOT EXISTS project_members (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role_in_project TEXT NOT NULL DEFAULT 'Ishtirokchi',
      joined_at TEXT NOT NULL,
      UNIQUE(project_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
      district_id TEXT REFERENCES districts(id) ON DELETE CASCADE,
      organizer_id TEXT NOT NULL REFERENCES users(id),
      title_uz TEXT NOT NULL,
      description_uz TEXT NOT NULL,
      event_date TEXT NOT NULL,
      scope TEXT NOT NULL DEFAULT 'school' CHECK(scope IN ('school','district')),
      category TEXT NOT NULL DEFAULT 'Tanlov',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title_uz TEXT NOT NULL,
      body_uz TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'assignment',
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      actor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      school_id TEXT REFERENCES schools(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT,
      details_uz TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS platform_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  const migExists = db
    .prepare('SELECT version FROM schema_migrations WHERE version = ?')
    .get('001_initial_eduai_schema');
  if (!migExists) {
    db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(
      '001_initial_eduai_schema',
      new Date().toISOString()
    );
  }
}

export function seedDatabaseIfNeeded(db: DatabaseSync): void {
  const existingUsers = db.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number };
  if (existingUsers.cnt > 0) return;

  const now = new Date().toISOString();
  const pwHash = hashPassword('EduAI2026!');

  // 1. District
  db.prepare('INSERT INTO districts (id, name, region, created_at) VALUES (?, ?, ?, ?)').run(
    'dist-chilonzor',
    'Chilonzor tumani maktabgacha va maktab ta\'limi bo\'limi',
    'Toshkent shahri',
    now
  );

  // 2. Two Schools (for multi-school isolation verification)
  db.prepare(
    'INSERT INTO schools (id, district_id, name, code, city, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(
    'school-145',
    'dist-chilonzor',
    '145-sonli umumiy o\'rta ta\'lim maktabi (Pilot maktab)',
    'TAS-145',
    'Toshkent',
    'active',
    now
  );

  db.prepare(
    'INSERT INTO schools (id, district_id, name, code, city, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(
    'school-210',
    'dist-chilonzor',
    '210-sonli ixtisoslashtirilgan maktab',
    'TAS-210',
    'Toshkent',
    'active',
    now
  );

  // 3. Subjects
  db.prepare(
    'INSERT INTO subjects (id, code, name_uz, description_uz, is_active, created_at) VALUES (?, ?, ?, ?, 1, ?)'
  ).run(
    'subj-math',
    'math',
    'Matematika',
    'Kasrlar, foizlar, chiziqli tenglamalar, nisbat va proporsiya hamda boshlang\'ich geometriya.',
    now
  );

  db.prepare(
    'INSERT INTO subjects (id, code, name_uz, description_uz, is_active, created_at) VALUES (?, ?, ?, ?, 1, ?)'
  ).run(
    'subj-english',
    'english',
    'Ingliz tili',
    'Lug\'at boyligi, grammatika, o\'zbekcha-inglizcha tarjima, gap tuzish va o\'qib tushunish (A1–B2).',
    now
  );

  // 4. Users across all 5 roles + School 210 users for isolation tests
  const insertUser = db.prepare(`
    INSERT INTO users (id, school_id, district_id, email, full_name, password_hash, role, grade, preferred_style, english_level, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `);

  // Students in School 145
  insertUser.run(
    'user-student-1',
    'school-145',
    'dist-chilonzor',
    'jasur.student@eduai.uz',
    'Jasur Karimov',
    pwHash,
    'student',
    7,
    'step_by_step',
    'A2',
    now
  );
  insertUser.run(
    'user-student-2',
    'school-145',
    'dist-chilonzor',
    'madina.student@eduai.uz',
    'Madina Rustamova',
    pwHash,
    'student',
    7,
    'very_simple',
    'B1',
    now
  );

  // Student in School 210 (Other school)
  insertUser.run(
    'user-student-210',
    'school-210',
    'dist-chilonzor',
    'bekzod.210@eduai.uz',
    'Bekzod Aliyev',
    pwHash,
    'student',
    8,
    'detailed',
    'B1',
    now
  );

  // Teachers in School 145 & School 210
  insertUser.run(
    'user-teacher-1',
    'school-145',
    'dist-chilonzor',
    'dilshod.teacher@eduai.uz',
    'Dilshod Toshmatov',
    pwHash,
    'teacher',
    null,
    'step_by_step',
    'B2',
    now
  );
  insertUser.run(
    'user-teacher-210',
    'school-210',
    'dist-chilonzor',
    'nodira.210@eduai.uz',
    'NodiraErgasheva',
    pwHash,
    'teacher',
    null,
    'step_by_step',
    'B2',
    now
  );

  // School IT/AI Coordinator (School 145)
  insertUser.run(
    'user-coord-1',
    'school-145',
    'dist-chilonzor',
    'sardor.coordinator@eduai.uz',
    'Sardor Nurmatov',
    pwHash,
    'school_coordinator',
    null,
    'detailed',
    'B2',
    now
  );

  // District Coordinator (Chilonzor District)
  insertUser.run(
    'user-district-1',
    null,
    'dist-chilonzor',
    'gulnora.district@eduai.uz',
    'Gulnora Abdullayeva',
    pwHash,
    'district_coordinator',
    null,
    'detailed',
    'B2',
    now
  );

  // Platform Administrator
  insertUser.run(
    'user-admin-1',
    'school-145',
    'dist-chilonzor',
    'admin@eduai.uz',
    'Otabek Xusanov (Tizim Administratori)',
    pwHash,
    'admin',
    null,
    'detailed',
    'B2',
    now
  );

  // 5. Classes & Enrollments
  db.prepare(
    'INSERT INTO classes (id, school_id, teacher_id, name, grade, subject_code, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run('class-7a-math', 'school-145', 'user-teacher-1', '7-A sinf (Matematika)', 7, 'math', now);

  db.prepare(
    'INSERT INTO classes (id, school_id, teacher_id, name, grade, subject_code, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run('class-7a-eng', 'school-145', 'user-teacher-1', '7-A sinf (Ingliz tili)', 7, 'english', now);

  db.prepare(
    'INSERT INTO classes (id, school_id, teacher_id, name, grade, subject_code, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run('class-8b-210', 'school-210', 'user-teacher-210', '8-B sinf (210-maktab)', 8, 'math', now);

  const enroll = db.prepare(
    'INSERT INTO class_enrollments (id, class_id, student_id, enrolled_at) VALUES (?, ?, ?, ?)'
  );
  enroll.run('enr-1', 'class-7a-math', 'user-student-1', now);
  enroll.run('enr-2', 'class-7a-math', 'user-student-2', now);
  enroll.run('enr-3', 'class-7a-eng', 'user-student-1', now);
  enroll.run('enr-4', 'class-8b-210', 'user-student-210', now);

  // 6. Lessons (Mathematics & English + Pending AI Content Review items)
  const insertLesson = db.prepare(`
    INSERT INTO lessons (id, school_id, subject_code, grade, topic_slug, title_uz, level_tag, summary_uz, content_uz, worked_example_uz, approval_status, created_by, reviewed_by, reviewed_at, revision_notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertLesson.run(
    'lesson-math-fractions',
    'school-145',
    'math',
    6,
    'fractions',
    'Oddiy kasrlarni qo\'shish va ayirish',
    '6–7-sinf tayanch',
    'Bir xil va har xil maxrajli kasrlar ustida amallar bajarish hamda kasrlarni qisqartirish qoidalari.',
    'Kasr $\\frac{a}{b}$ ko\'rinishida yoziladi, bunda $a$ — kasrning surati, $b$ — kasrning maxraji ($b \\neq 0$). Maxrajlari bir xil bo\'lgan kasrlarni qo\'shishda ularning suratlari qo\'shiladi, maxraji esa o\'zgarishsiz qoldiriladi: $\\frac{a}{c} + \\frac{b}{c} = \\frac{a+b}{c}$. Maxrajlari har xil bo\'lsa, avval eng kichik umumiy maxrajga keltiriladi.',
    'Misol: $\\frac{1}{4} + \\frac{2}{4} = \\frac{1+2}{4} = \\frac{3}{4}$. Har xil maxrajli misol: $\\frac{1}{2} + \\frac{1}{3} = \\frac{3}{6} + \\frac{2}{6} = \\frac{5}{6}$.',
    'approved',
    'user-teacher-1',
    'user-teacher-1',
    now,
    'O\'qituvchi tomonidan tekshirildi va 7-A sinf uchun tasdiqlandi.',
    now
  );

  insertLesson.run(
    'lesson-math-percentages',
    'school-145',
    'math',
    7,
    'percentages',
    'Foizlar va ularni amaliy masalalarda qo\'llash',
    '7-sinf',
    'Sonning foizini topish va foiziga ko\'ra sonning o\'zini topish usullari.',
    'Foiz (lotincha "pro centum" — yuzdan bir) deb har qanday miqdorning yuzdan bir ulushiga aytiladi va $\\%$ belgisi bilan ifodalanadi: $1\\% = \\frac{1}{100} = 0.01$. Berilgan $A$ sonining $p\\%$ qismini topish uchun $A \\times \\frac{p}{100}$ amalini bajaramiz.',
    'Misol: 120 sonining $25\\%$ qismini toping. Yechim: $120 \\times \\frac{25}{100} = 120 \\times 0.25 = 30$.',
    'approved',
    'user-teacher-1',
    'user-teacher-1',
    now,
    'Tasdiqlangan o\'quv materiali.',
    now
  );

  insertLesson.run(
    'lesson-math-linear',
    'school-145',
    'math',
    7,
    'linear_equations',
    'Bir noma\'lumli chiziqli tenglamalar',
    '7-sinf',
    'ax + b = c ko\'rinishidagi chiziqli tenglamalarni yechish algoritmi.',
    '$ax + b = c$ ($a \\neq 0$) ko\'rinishidagi tenglama bir noma\'lumli chiziqli tenglama deyiladi. Tenglamani yechish uchun ma\'lum hadlarni tenglikning bir tomoniga ishorasini o\'zgartirib o\'tkazamiz ($ax = c - b$) va ikkala tomonni $a$ ga bo\'lamiz: $x = \\frac{c - b}{a}$.',
    'Misol: $3x - 5 = 16$ tenglamani yeching. 1-qadam: $3x = 16 + 5 \\Rightarrow 3x = 21$. 2-qadam: $x = 21 \\div 3 = 7$. Tekshirish: $3(7) - 5 = 21 - 5 = 16$.',
    'approved',
    'user-teacher-1',
    'user-teacher-1',
    now,
    'Tasdiqlangan.',
    now
  );

  insertLesson.run(
    'lesson-math-geometry',
    'school-145',
    'math',
    7,
    'basic_geometry',
    'Boshlang\'ich geometriya: To\'g\'ri to\'rtburchak va uchburchak',
    '7-sinf',
    'Perimetr, yuza va uchburchakning ichki burchaklari yig\'indisi.',
    'To\'g\'ri to\'rtburchakning perimetri $P = 2(a + b)$ va yuzasi $S = a \\times b$ formula bilan topiladi. Har qanday uchburchakning ichki burchaklari yig\'indisi $180^\\circ$ ga teng: $\\alpha + \\beta + \\gamma = 180^\\circ$.',
    'Misol: Uchburchakning ikkita burchagi $50^\\circ$ va $60^\\circ$ bo\'lsa, uchinchi burchagi $180^\\circ - (50^\\circ + 60^\\circ) = 70^\\circ$ ga teng.',
    'approved',
    'user-teacher-1',
    'user-teacher-1',
    now,
    'Tasdiqlangan.',
    now
  );

  insertLesson.run(
    'lesson-math-ratios',
    'school-145',
    'math',
    6,
    'ratios_proportions',
    'Nisbat va proporsiya xossalari',
    '6–7-sinf',
    'Ikki nisbatning tengligi va proporsiyaning asosiy xossasi (a:b = c:d).',
    'Ikki nisbatning tengligi proporsiya deyiladi: $\\frac{a}{b} = \\frac{c}{d}$. Proporsiyaning asosiy xossasi: chetki hadlar ko\'paytmasi o\'rta hadlar ko\'paytmasiga teng, ya\'ni $a \\times d = b \\times c$.',
    'Misol: $\\frac{x}{6} = \\frac{4}{3}$ proporsiyadan $x$ ni toping. $3x = 24 \\Rightarrow x = 8$.',
    'approved',
    'user-teacher-1',
    'user-teacher-1',
    now,
    'Tasdiqlangan.',
    now
  );

  // English lessons (CEFR A1-B2)
  insertLesson.run(
    'lesson-eng-a1-vocab',
    'school-145',
    'english',
    6,
    'school_technology_vocab',
    'Maktab va texnologiya lug\'ati (School & Technology Vocabulary)',
    'A1',
    'Kundalik maktab hayoti va kompyuter texnologiyalariga oid eng muhim inglizcha so\'zlar.',
    'Asosiy so\'zlar:\n1. **knowledge** — bilim\n2. **assignment** — topshiriq / vazifa\n3. **develop** — rivojlantirmoq / ishlab chiqmoq\n4. **library** — kutubxona\n5. **keyboard** — klaviatura\n6. **solution** — yechim\nGap tuzishda otlar oldidan artikl (`a / an / the`) qo\'llanilishiga e\'tibor bering.',
    'Misol: "Our team found a creative **solution** for the school project." — "Jamoamiz maktab loyihasi uchun ijodiy yechim topdi."',
    'approved',
    'user-teacher-1',
    'user-teacher-1',
    now,
    'A1 bosqichi uchun tasdiqlandi.',
    now
  );

  insertLesson.run(
    'lesson-eng-a2-grammar',
    'school-145',
    'english',
    7,
    'present_simple_continuous',
    'Present Simple va Present Continuous zamonlari farqi',
    'A2',
    'Doimiy takrorlanuvchi harakatlar va ayni damda sodir bo\'layotgan jarayonlarni ifodalash.',
    '**Present Simple** (doimiy harakatlar): `Subject + V1 (he/she/it + V-s/es)`. Kalit so\'zlar: *always, usually, every day*.\n**Present Continuous** (hozirgi davomiy zamon): `Subject + am/is/are + V-ing`. Kalit so\'zlar: *now, right now, at the moment*.',
    'Misol:\n1) "Jasur **writes** Python code every Tuesday." (Doimiy odat)\n2) "Jasur **is writing** Python code right now." (Ayni paytda)',
    'approved',
    'user-teacher-1',
    'user-teacher-1',
    now,
    'A2 grammatika darsi sifatida tasdiqlandi.',
    now
  );

  insertLesson.run(
    'lesson-eng-b1-reading',
    'school-145',
    'english',
    8,
    'reading_future_tech',
    'O\'qib tushunish: Young Innovators in Uzbekistan (B1 Reading)',
    'B1',
    'O\'zbekistonlik yosh dasturchilar haqida matn tahlili va gap tuzish mashqlari.',
    '**Reading Passage:**\n"Across Uzbekistan, school students are joining technology clubs like *IT Yoshlar* to solve real community problems. Last month, seventh-grade students in Tashkent built a smart irrigation sensor that helps school gardens save 35% of water. By combining mathematics and English documentation, students learn to collaborate effectively."\n\n**Muhim iboralar:** *solve real problems* (haqiqiy muammolarni yechmoq), *save water* (suvni tejamoq), *collaborate effectively* (samarali hamkorlik qilmoq).',
    'Savol: Matnga ko\'ra, o\'quvchilar yaratgan qurilma suvni necha foizga tejaydi? Javob: 35% (thirty-five percent).',
    'approved',
    'user-teacher-1',
    'user-teacher-1',
    now,
    'B1 o\'qib tushunish materiali.',
    now
  );

  // Pending Review AI-generated Lesson (for Teacher Content Approval Workflow)
  insertLesson.run(
    'lesson-ai-pending-1',
    'school-145',
    'math',
    7,
    'percentages',
    'AI tomonidan tayyorlangan: Chegirma va bank foizlariga doir hayotiy masalalar',
    '7-sinf (AI Qoralama)',
    'Do\'kondagi chegirmalar va ketma-ket foiz o\'zgarishini hisoblash bo\'yicha AI yaratgan dars.',
    'Ketma-ket foiz o\'zgarishida foizlar shunchaki qo\'shilmaydi. Masalan, narx avval $10\\%$ oshib, keyin yangi narxdan $10\\%$ kamaysa: $100 \\times 1.10 \\times 0.90 = 99$ bo\'ladi, ya\'ni dastlabki qiymatdan $1\\%$ kamayadi.',
    'Misol: 200 000 so\'mlik kitob to\'plamiga $15\\%$ chegirma berildi. Chegirma miqdori: $200000 \\times 0.15 = 30000$ so\'m. Yangi narx: $170000$ so\'m.',
    'pending_review',
    'user-teacher-1',
    null,
    null,
    'O\'qituvchi ko\'rib chiqishi va tahrirlashi kutilmoqda.',
    now
  );

  insertLesson.run(
    'lesson-ai-pending-2',
    'school-145',
    'english',
    7,
    'conditionals_b2',
    'AI tomonidan tayyorlangan: First & Second Conditionals (Shart ergash gaplar)',
    'B1–B2 (AI Qoralama)',
    'Real va faraziy shart gaplarni tuzish qoidalari hamda IT loyiha taqdimotida qo\'llash.',
    '**First Conditional (Real ehtimol):** `If + Present Simple, will + V1`.\n**Second Conditional (Xayoliy/faraziy holat):** `If + Past Simple, would + V1`.',
    'Misol: "If we test our code carefully, the application will work without errors."',
    'pending_review',
    'user-teacher-1',
    null,
    null,
    'O\'qituvchi tekshiruvi kutilmoqda.',
    now
  );

  // 7. Assignments & Questions
  const insertAssignment = db.prepare(`
    INSERT INTO assignments (id, school_id, class_id, teacher_id, subject_code, grade, topic_slug, title_uz, description_uz, assignment_type, is_published, due_date, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `);

  insertAssignment.run(
    'assign-math-1',
    'school-145',
    'class-7a-math',
    'user-teacher-1',
    'math',
    7,
    'fractions',
    '1-topshiriq: Kasrlar, foizlar va chiziqli tenglamalar bo\'yicha nazorat mashqi',
    'Har bir savolni diqqat bilan o\'qing. Qiynalsangiz, ishora (hint) tugmasidan foydalaning. Ushbu natija mashq bali hisoblanadi.',
    'quiz',
    '2026-11-15',
    now
  );

  insertAssignment.run(
    'assign-eng-1',
    'school-145',
    'class-7a-eng',
    'user-teacher-1',
    'english',
    7,
    'present_simple_continuous',
    '2-topshiriq: Ingliz tili grammatikasi va texnologik lug\'at (A2–B1)',
    'Bo\'sh joylarni to\'ldiring, to\'g\'ri zamon shaklini tanlang va tarjima mashqlarini bajaring.',
    'quiz',
    '2026-11-20',
    now
  );

  insertAssignment.run(
    'assign-math-210',
    'school-210',
    'class-8b-210',
    'user-teacher-210',
    'math',
    8,
    'linear_equations',
    '210-maktab ichki matematika topshirig\'i',
    'Faqat 210-sonli maktab o\'quvchilari va o\'qituvchisi uchun mo\'ljallangan topshiriq.',
    'homework',
    '2026-11-25',
    now
  );

  const insertQuestion = db.prepare(`
    INSERT INTO questions (id, assignment_id, question_type, prompt_uz, options_json, correct_answer, hint_uz, explanation_uz, points, order_index)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Math questions
  insertQuestion.run(
    'q-math-1',
    'assign-math-1',
    'multiple_choice',
    'Maxrajlari bir xil bo\'lgan kasrlarni qo\'shing: 3/8 + 2/8 nechaga teng?',
    JSON.stringify(['5/16', '5/8', '6/8', '1/8']),
    '5/8',
    'Maxrajlar bir xil (8) bo\'lganda faqat suratlar (3 va 2) qo\'shiladi, maxraj o\'zgarmaydi.',
    '3/8 + 2/8 = (3 + 2)/8 = 5/8.',
    10,
    1
  );

  insertQuestion.run(
    'q-math-2',
    'assign-math-1',
    'numeric',
    '150 sonining 20% qismini toping (faqat son kiriting):',
    null,
    '30',
    '150 sonini 20 ga ko\'paytirib, 100 ga bo\'ling (yoki 150 ni 0.2 ga ko\'paytiring).',
    '150 × (20 / 100) = 150 × 0.2 = 30.',
    10,
    2
  );

  insertQuestion.run(
    'q-math-3',
    'assign-math-1',
    'numeric',
    'Chiziqli tenglamani yeching: 3x - 4 = 11. x ning qiymati nechaga teng?',
    null,
    '5',
    'Avval -4 ni tenglikning o\'ng tomoniga +4 qilib o\'tkazing: 3x = 11 + 4.',
    '3x = 15 bo\'ladi, ikkala tomonni 3 ga bo\'lsak, x = 5 chiqadi.',
    10,
    3
  );

  insertQuestion.run(
    'q-math-4',
    'assign-math-1',
    'multiple_choice',
    'Uchburchakning ikkita ichki burchagi 45° va 75° ga teng. Uchinchi burchak necha gradus?',
    JSON.stringify(['50°', '60°', '70°', '80°']),
    '60°',
    'Uchburchakning ichki burchaklari yig\'indisi 180° ga teng ekanligini eslang.',
    '180° - (45° + 75°) = 180° - 120° = 60°.',
    10,
    4
  );

  insertQuestion.run(
    'q-math-5',
    'assign-math-1',
    'numeric',
    'Proporsiyadan noma\'lum hadni toping: x / 9 = 4 / 3',
    null,
    '12',
    'Proporsiyaning asosiy xossasiga ko\'ra: 3 × x = 9 × 4.',
    '3x = 36 ⇒ x = 36 / 3 = 12.',
    10,
    5
  );

  // English questions
  insertQuestion.run(
    'q-eng-1',
    'assign-eng-1',
    'multiple_choice',
    'To\'g\'ri fe\'l shaklini tanlang: "Madina ___ English and Mathematics every day."',
    JSON.stringify(['study', 'studies', 'studying', 'is study']),
    'studies',
    '"Every day" doimiy takrorlanuvchi harakatni (Present Simple) bildiradi va "Madina" (She) 3-shaxs birlikda.',
    'Present Simple zamonida 3-shaxs birlikda "study" fe\'li "studies" shakliga o\'tadi.',
    10,
    1
  );

  insertQuestion.run(
    'q-eng-2',
    'assign-eng-1',
    'fill_blank',
    'Bo\'sh joyni to\'ldiring (Present Continuous): "Look! The students ___ (build) a robotics project right now."',
    null,
    'are building',
    '"Look!" va "right now" ayni paytda davom etayotgan ish-harakatni (am/is/are + V-ing) bildiradi. "The students" ko\'plikda.',
    '"The students" ko\'plikda bo\'lgani uchun "are building" ishlatiladi.',
    10,
    2
  );

  insertQuestion.run(
    'q-eng-3',
    'assign-eng-1',
    'multiple_choice',
    '"Yechim" so\'zining to\'g\'ri inglizcha tarjimasini toping:',
    JSON.stringify(['assignment', 'knowledge', 'solution', 'keyboard']),
    'solution',
    'Maktab va texnologiya lug\'atidagi "solve" (yechmoq) fe\'liga o\'zakdosh ot.',
    '"Solution" — yechim degan ma\'noni anglatadi.',
    10,
    3
  );

  insertQuestion.run(
    'q-eng-4',
    'assign-eng-1',
    'short_answer',
    'O\'zbek tilidan ingliz tiliga tarjima qiling: "Men har kuni kitob o\'qiyman" (I read a book every day / I read books every day)',
    null,
    'I read a book every day|I read books every day|Every day I read a book',
    'Gap tartibi: Ega (I) + Fe\'l (read) + To\'ldiruvchi (a book) + Payt holi (every day).',
    'To\'g\'ri tuzilma: "I read a book every day."',
    10,
    4
  );

  // School 210 question
  insertQuestion.run(
    'q-210-1',
    'assign-math-210',
    'numeric',
    '2x + 10 = 30 tenglamadan x ni toping:',
    null,
    '10',
    '2x = 20',
    'x = 10',
    10,
    1
  );

  // 8. Sample Submission for Student 1 (so real analytics & results work immediately)
  db.prepare(`
    INSERT INTO submissions (id, assignment_id, student_id, school_id, answers_json, results_json, score, max_score, percentage, teacher_feedback_uz, reviewed_by, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'sub-initial-1',
    'assign-math-1',
    'user-student-1',
    'school-145',
    JSON.stringify({
      'q-math-1': '5/8',
      'q-math-2': '30',
      'q-math-3': '5',
      'q-math-4': '60°',
      'q-math-5': '9',
    }),
    JSON.stringify([
      { questionId: 'q-math-1', isCorrect: true, studentAnswer: '5/8', pointsEarned: 10 },
      { questionId: 'q-math-2', isCorrect: true, studentAnswer: '30', pointsEarned: 10 },
      { questionId: 'q-math-3', isCorrect: true, studentAnswer: '5', pointsEarned: 10 },
      { questionId: 'q-math-4', isCorrect: true, studentAnswer: '60°', pointsEarned: 10 },
      { questionId: 'q-math-5', isCorrect: false, studentAnswer: '9', pointsEarned: 0 },
    ]),
    40,
    50,
    80,
    'Jasur, kasrlar, foizlar va chiziqli tenglamalarni a\'lo darajada yechgansiz! Proporsiya xossasini (5-savol) yana bir bor takrorlab oling.',
    'user-teacher-1',
    now
  );

  // 9. IT Yoshlar Projects
  const insertProject = db.prepare(`
    INSERT INTO projects (id, school_id, owner_id, mentor_id, title_uz, description_uz, category, status, milestones_json, demo_url, repo_url, team_names, review_feedback_uz, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertProject.run(
    'proj-1',
    'school-145',
    'user-student-1',
    'user-teacher-1',
    'Aqlli Maktab Kutubxonasi (Smart Library Bot)',
    'Maktab kutubxonasidagi badiiy va darslik kitoblarni tez qidirish, band qilish va o\'qish muddatini eslatib turuvchi o\'zbek tilidagi Telegram bot hamda veb-katalog.',
    'Telegram botlar',
    'showcase',
    JSON.stringify([
      { title: 'Kitoblar bazasini SQLite jadvalida loyihalash', done: true },
      { title: 'Qidiruv va band qilish tugmalarini yaratish', done: true },
      { title: '145-maktab kutubxonasida sinovdan o\'tkazish', done: false },
    ]),
    'https://eduai.uz/demo/smart-library',
    'https://github.com/it-yoshlar/smart-school-library',
    'Jasur K., Madina R. (7-A sinf)',
    'Ustoz xulosasi: Loyiha maktab kutubxonasi uchun juda foydali. Shaxsiy ma\'lumotlar xavfsizligi qoidalariga to\'liq rioya qilingan.',
    now
  );

  insertProject.run(
    'proj-2',
    'school-145',
    'user-student-2',
    'user-teacher-1',
    'EcoMaktab — Maktab bog\'i uchun aqlli sug\'orish datchigi',
    'Tuproq namligini o\'lchab, suvni 35% gacha tejashga yordam beradigan Arduino va sensorli monitoring paneli.',
    'Robototexnika',
    'approved',
    JSON.stringify([
      { title: 'Namlik datchigini ulash va kalibrlash', done: true },
      { title: 'Grafik monitoring oynasini yozish', done: true },
    ]),
    'https://eduai.uz/demo/ecomaktab',
    'https://github.com/it-yoshlar/ecomaktab-sensor',
    'Madina R., Sardor T. (7-A sinf)',
    'Tasdiqlandi. Tuman "IT Yoshlar" ko\'rgazmasiga tavsiya etildi.',
    now
  );

  insertProject.run(
    'proj-3',
    'school-145',
    'user-student-1',
    'user-teacher-1',
    'KiberQalqon Yoshlar — O\'quvchilar uchun kiberxavfsizlik trenajyori',
    'Fishing xabarlarini aniqlash, kuchli parol tanlash va internetda shaxsiy ma\'lumotlarni himoya qilishni o\'rgatuvchi interaktiv o\'quv o\'yini.',
    'Kiberxavfsizlik ta\'limi',
    'pending_review',
    JSON.stringify([
      { title: '10 ta fishing ssenariysini tuzish', done: true },
      { title: 'Ustoz va koordinator tekshiruvidan o\'tkazish', done: false },
    ]),
    'https://eduai.uz/demo/kiberqalqon',
    'https://github.com/it-yoshlar/kiberqalqon-edu',
    'Jasur K. (7-A sinf)',
    'Mentor ko\'rib chiqishi kutilmoqda.',
    now
  );

  // Project Members
  const insertProjMember = db.prepare(
    'INSERT INTO project_members (id, project_id, user_id, role_in_project, joined_at) VALUES (?, ?, ?, ?, ?)'
  );
  insertProjMember.run('pm-1', 'proj-1', 'user-student-1', 'Loyiha muallifi', now);
  insertProjMember.run('pm-2', 'proj-1', 'user-student-2', 'Dasturchi', now);
  insertProjMember.run('pm-3', 'proj-2', 'user-student-2', 'Loyiha muallifi', now);
  insertProjMember.run('pm-4', 'proj-3', 'user-student-1', 'Loyiha muallifi', now);

  // 10. School & District Events
  const insertEvent = db.prepare(`
    INSERT INTO events (id, school_id, district_id, organizer_id, title_uz, description_uz, event_date, scope, category, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertEvent.run(
    'evt-1',
    'school-145',
    'dist-chilonzor',
    'user-coord-1',
    '145-maktab "IT Yoshlar" Demo Kuni va Algoritmlash seminari',
    '7–9-sinf o\'quvchilari o\'zlarining veb, Telegram bot va robototexnika loyihalarini maktab jamoasiga namoyish etadilar.',
    '2026-11-18',
    'school',
    'Maktab tadbiri',
    now
  );
  insertEvent.run(
    'evt-2',
    null,
    'dist-chilonzor',
    'user-district-1',
    'Chilonzor tumani maktablari o\'rtasida "EduAI Matematika va Dasturlash" olimpiadasi',
    'Tumandagi pilot maktablar jamoalari o\'rtasida amaliy masalalar va ta\'limiy dasturlar bo\'yicha tuman bosqichi.',
    '2026-12-05',
    'district',
    'Tuman musobaqasi',
    now
  );

  // 11. Initial AI Conversation & Usage record for Student 1
  db.prepare(`
    INSERT INTO ai_conversations (id, student_id, school_id, subject_code, grade, topic, title_uz, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'conv-initial-1',
    'user-student-1',
    'school-145',
    'math',
    7,
    'Chiziqli tenglamalar',
    'Chiziqli tenglamalarni qadam-baqadam yechish',
    now,
    now
  );

  db.prepare(`
    INSERT INTO ai_messages (id, conversation_id, sender_role, content_text, request_type, provider_used, is_teacher_approved, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?)
  `).run(
    'msg-init-1',
    'conv-initial-1',
    'user',
    'Ustoz AI, 3x - 5 = 16 tenglamani qanday yechamiz?',
    'explain',
    'mock',
    now
  );

  db.prepare(`
    INSERT INTO ai_messages (id, conversation_id, sender_role, content_text, request_type, provider_used, is_teacher_approved, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?)
  `).run(
    'msg-init-2',
    'conv-initial-1',
    'assistant',
    '**Chiziqli tenglamani qadam-baqadam yechamiz:**\n\n1. **1-qadam:** Ozod had $(-5)$ ni tenglikning o\'ng tomoniga $+5$ qilib o\'tkazamiz:\n$$3x = 16 + 5 \\Rightarrow 3x = 21$$\n2. **2-qadam:** Tenglikning ikkala tomonini $3$ ga bo\'lamiz:\n$$x = 21 \\div 3 = 7$$\n3. **Tekshirish:** $3 \\times 7 - 5 = 21 - 5 = 16$. Javob to\'g\'ri!',
    'explain',
    'mock',
    now
  );

  db.prepare(`
    INSERT INTO ai_usage_records (id, user_id, school_id, subject_code, request_type, provider_used, status, latency_ms, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('usage-init-1', 'user-student-1', 'school-145', 'math', 'explain', 'mock', 'success', 42, now);

  // 12. Initial AI Moderation Report
  db.prepare(`
    INSERT INTO ai_reports (id, reporter_id, school_id, message_id, reason_uz, status, resolution_note_uz, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'rep-1',
    'user-teacher-1',
    'school-145',
    'msg-init-2',
    '7-sinf kasrlar mavzusidagi murakkab misolda qisqartirish qadami yanada soddaroq tushuntirilishi kerak.',
    'open',
    null,
    now
  );

  // 13. Notifications
  const insertNotif = db.prepare(`
    INSERT INTO notifications (id, user_id, title_uz, body_uz, category, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertNotif.run(
    'notif-1',
    'user-student-1',
    'Ustoz fikr-mulohazasi: 1-topshiriq (Matematika)',
    'Dilshod Toshmatov sizning Matematika nazorat mashqingizni tekshirdi va 80% natija bilan izoh qoldirdi.',
    'feedback',
    0,
    now
  );
  insertNotif.run(
    'notif-2',
    'user-student-1',
    'Yangi topshiriq: Ingliz tili grammatikasi (A2–B1)',
    '7-A sinf uchun yangi Ingliz tili topshirig\'i e\'lon qilindi. Topshirish muddati: 2026-11-20.',
    'assignment',
    0,
    now
  );
  insertNotif.run(
    'notif-3',
    'user-teacher-1',
    'Ko\'rib chiqish kutilmoqda: 2 ta AI o\'quv materiali',
    'Rasmiy maktab darslariga qo\'shishdan oldin 2 ta AI qoralama materialni tahrirlang va tasdiqlang.',
    'review',
    0,
    now
  );

  // 14. Platform Settings & Audit Log
  db.prepare('INSERT INTO platform_settings (key, value, updated_at) VALUES (?, ?, ?)').run(
    'retention_days',
    process.env.EDUAI_RETENTION_DAYS || '90',
    now
  );
  db.prepare('INSERT INTO platform_settings (key, value, updated_at) VALUES (?, ?, ?)').run(
    'ai_mode',
    process.env.EDUAI_AI_MODE || 'auto',
    now
  );
  db.prepare('INSERT INTO platform_settings (key, value, updated_at) VALUES (?, ?, ?)').run(
    'student_privacy_strict',
    'true',
    now
  );

  db.prepare(`
    INSERT INTO audit_events (id, actor_id, school_id, action, target_type, target_id, details_uz, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'audit-init-1',
    'user-admin-1',
    'school-145',
    'SYSTEM_BOOTSTRAP',
    'platform',
    'eduai-v1',
    'EduAI va IT Yoshlar pilot tizimi 145-sonli va 210-sonli maktablar uchun ishga tushirildi.',
    now
  );
}
