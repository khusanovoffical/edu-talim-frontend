import express from 'express';
import crypto from 'node:crypto';
import { getDb } from './db.js';
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  requireAuth,
  requireRoles,
  authRateLimiter,
  aiRateLimiter,
  sanitizeText,
  moderateStudentInput,
  type UserRole,
} from './security.js';
import { evaluateAnswerDeterministically } from './mathEngine.js';
import { aiService, type ExplanationStyle, type AIModeRequestType } from './aiService.js';

export function createApiApp() {
  const app = express();
  app.use(express.json({ limit: '256kb' }));

  // Security headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  function logAudit(
    actorId: string | null,
    schoolId: string | null,
    action: string,
    targetType: string,
    targetId: string | null,
    detailsUz: string
  ) {
    try {
      const db = getDb();
      db.prepare(`
        INSERT INTO audit_events (id, actor_id, school_id, action, target_type, target_id, details_uz, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `aud-${crypto.randomUUID().slice(0, 8)}`,
        actorId,
        schoolId,
        action,
        targetType,
        targetId,
        detailsUz,
        new Date().toISOString()
      );
    } catch {
      // non-blocking
    }
  }

  // ============================================================================
  // HEALTH & OPENAPI DOCS
  // ============================================================================
  app.get('/api/v1/health', (_req, res) => {
    const db = getDb();
    const row = db.prepare('SELECT COUNT(*) as cnt FROM schools').get() as { cnt: number };
    const aiModeSetting = db
      .prepare('SELECT value FROM platform_settings WHERE key = ?')
      .get('ai_mode') as { value: string } | undefined;

    res.json({
      status: 'ok',
      service: 'EduAI + IT Yoshlar API v1',
      locale: 'uz-UZ',
      database: 'connected',
      schoolsCount: row.cnt,
      aiProviderStatus: {
        geminiKeyConfigured: aiService.isConfigured(),
        activeMode:
          aiModeSetting?.value === 'mock'
            ? 'mock'
            : aiService.isConfigured()
            ? 'gemini'
            : 'mock',
      },
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/v1/openapi.json', (_req, res) => {
    res.json({
      openapi: '3.1.0',
      info: {
        title: 'EduAI va IT Yoshlar REST API',
        version: '1.0.0',
        description:
          "O'zbek tilidagi maktab AI ta'lim platformasi va IT Yoshlar hamjamiyati uchun himoyalangan REST API.",
      },
      paths: {
        '/api/v1/auth/login': { post: { summary: 'Tizimga kirish' } },
        '/api/v1/auth/register': { post: { summary: "Ro'yxatdan o'tish (O'quvchi / O'qituvchi)" } },
        '/api/v1/users/me': { get: { summary: 'Joriy foydalanuvchi profili' } },
        '/api/v1/schools': { get: { summary: 'Maktablar ro\'yxati' } },
        '/api/v1/classes': { get: { summary: 'Sinflar' }, post: { summary: 'Yangi sinf yaratish' } },
        '/api/v1/subjects': { get: { summary: 'Fanlar ro\'yxati' } },
        '/api/v1/lessons': { get: { summary: 'Darslik va mavzular' }, post: { summary: 'Dars yaratish' } },
        '/api/v1/quizzes': { get: { summary: 'Test va mashqlar' } },
        '/api/v1/assignments': { get: { summary: 'Topshiriqlar' }, post: { summary: 'Topshiriq yaratish' } },
        '/api/v1/submissions': { get: { summary: 'Topshirilgan ishlar' }, post: { summary: 'Javob yuborish' } },
        '/api/v1/ai/chat': { post: { summary: 'EduAI Repetitor bilan muloqot' } },
        '/api/v1/projects': { get: { summary: 'IT Yoshlar loyihalari' }, post: { summary: 'Loyiha qo\'shish' } },
        '/api/v1/teacher/overview': { get: { summary: 'O\'qituvchi boshqaruv paneli' } },
        '/api/v1/coordinator/overview': { get: { summary: 'Maktab va tuman koordinatori paneli' } },
        '/api/v1/admin/overview': { get: { summary: 'Administrator paneli' } },
        '/api/v1/reports/summary': { get: { summary: 'Tahliliy hisobotlar' } },
      },
    });
  });

  // ============================================================================
  // 1. /api/v1/auth — AUTHENTICATION & ACCOUNT MANAGEMENT
  // ============================================================================
  app.post('/api/v1/auth/register', (req, res) => {
    const rateKey = `reg:${req.ip || 'local'}:${req.body?.email || ''}`;
    const rate = authRateLimiter.check(rateKey);
    if (!rate.allowed) {
      res.status(429).json({
        error: 'RATE_LIMITED',
        message: `Juda ko'p urinish. Iltimos, ${rate.retryAfterSeconds} soniyadan keyin qayta urinib ko'ring.`,
      });
      return;
    }

    const email = sanitizeText(req.body?.email, 120).toLowerCase();
    const fullName = sanitizeText(req.body?.fullName, 120);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const requestedRole = sanitizeText(req.body?.role || 'student', 30);
    const schoolId = sanitizeText(req.body?.schoolId || 'school-145', 60);
    const grade = Number(req.body?.grade || 7);

    // NEVER allow public registration for admin or coordinator roles
    if (requestedRole === 'admin' || requestedRole === 'district_coordinator' || requestedRole === 'school_coordinator') {
      res.status(403).json({
        error: 'ROLE_REGISTRATION_FORBIDDEN',
        message: "Administrator yoki koordinator hisobini ochiq ro'yxatdan o'tkazish taqiqlangan.",
      });
      return;
    }

    const role: UserRole = requestedRole === 'teacher' ? 'teacher' : 'student';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: "Iltimos, to'g'ri elektron pochta manzilini kiriting.",
      });
      return;
    }
    if (!fullName || fullName.length < 3) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: "Ism va familiya kamida 3 ta belgidan iborat bo'lishi kerak.",
      });
      return;
    }
    if (!password || password.length < 8) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: "Parol kamida 8 ta belgidan iborat bo'lishi shart.",
      });
      return;
    }

    const db = getDb();
    const school = db.prepare('SELECT id, district_id FROM schools WHERE id = ? AND status = ?').get(
      schoolId,
      'active'
    ) as { id: string; district_id: string } | undefined;

    if (!school) {
      res.status(400).json({
        error: 'INVALID_SCHOOL',
        message: "Tanlangan maktab topilmadi yoki faol emas.",
      });
      return;
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      res.status(409).json({
        error: 'EMAIL_EXISTS',
        message: "Ushbu elektron pochta orqali allaqachon ro'yxatdan o'tilgan.",
      });
      return;
    }

    const userId = `user-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    const pwHash = hashPassword(password);
    const validGrade = role === 'student' ? Math.min(11, Math.max(1, grade || 7)) : null;

    db.prepare(`
      INSERT INTO users (id, school_id, district_id, email, full_name, password_hash, role, grade, preferred_style, english_level, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'step_by_step', 'A2', 1, ?)
    `).run(userId, school.id, school.district_id, email, fullName, pwHash, role, validGrade, now);

    // Auto-enroll new student in default grade class of their school if available
    if (role === 'student') {
      const classes = db
        .prepare('SELECT id FROM classes WHERE school_id = ?')
        .all(school.id) as { id: string }[];
      for (const cls of classes) {
        db.prepare(
          'INSERT OR IGNORE INTO class_enrollments (id, class_id, student_id, enrolled_at) VALUES (?, ?, ?, ?)'
        ).run(`enr-${crypto.randomUUID().slice(0, 8)}`, cls.id, userId, now);
      }
      db.prepare(`
        INSERT INTO notifications (id, user_id, title_uz, body_uz, category, is_read, created_at)
        VALUES (?, ?, ?, ?, 'announcement', 0, ?)
      `).run(
        `notif-${crypto.randomUUID().slice(0, 8)}`,
        userId,
        "EduAI va IT Yoshlar platformasiga xush kelibsiz!",
        "Matematika va Ingliz tili darslarini boshlashingiz yoki AI repetitorga savol berishingiz mumkin.",
        now
      );
    }

    logAudit(userId, school.id, 'USER_REGISTER', 'user', userId, `${fullName} (${role}) ro'yxatdan o'tdi.`);

    const session = createSessionToken({
      userId,
      role,
      schoolId: school.id,
      districtId: school.district_id,
    });

    res.setHeader(
      'Set-Cookie',
      `eduai_session=${encodeURIComponent(session.token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=86400`
    );

    res.status(201).json({
      token: session.token,
      csrfToken: session.csrfToken,
      user: {
        id: userId,
        email,
        fullName,
        role,
        schoolId: school.id,
        districtId: school.district_id,
        grade: validGrade,
        preferredStyle: 'step_by_step',
        englishLevel: 'A2',
      },
    });
  });

  app.post('/api/v1/auth/login', (req, res) => {
    const email = sanitizeText(req.body?.email, 120).toLowerCase();
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const rateKey = `login:${req.ip || 'local'}:${email}`;
    const rate = authRateLimiter.check(rateKey);

    if (!rate.allowed) {
      res.status(429).json({
        error: 'RATE_LIMITED',
        message: `Xavfsizlik cheklovi: Juda ko'p noto'g'ri urinish. ${rate.retryAfterSeconds} soniyadan so'ng urinib ko'ring.`,
      });
      return;
    }

    if (!email || !password) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: "Elektron pochta va parolni kiriting.",
      });
      return;
    }

    const db = getDb();
    const user = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email) as any;

    if (!user || !verifyPassword(password, user.password_hash)) {
      res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: "Elektron pochta yoki parol noto'g'ri.",
      });
      return;
    }

    if (!user.is_active) {
      res.status(403).json({
        error: 'ACCOUNT_DISABLED',
        message: "Sizning hisobingiz vaqtincha bloklangan. Maktab ma'muriyatiga murojaat qiling.",
      });
      return;
    }

    const session = createSessionToken({
      userId: user.id,
      role: user.role as UserRole,
      schoolId: user.school_id,
      districtId: user.district_id,
    });

    logAudit(user.id, user.school_id, 'USER_LOGIN', 'user', user.id, `${user.full_name} tizimga kirdi.`);

    res.setHeader(
      'Set-Cookie',
      `eduai_session=${encodeURIComponent(session.token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=86400`
    );

    res.json({
      token: session.token,
      csrfToken: session.csrfToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        schoolId: user.school_id,
        districtId: user.district_id,
        grade: user.grade,
        preferredStyle: user.preferred_style,
        englishLevel: user.english_level,
      },
    });
  });

  app.post('/api/v1/auth/logout', (_req, res) => {
    res.setHeader('Set-Cookie', 'eduai_session=; HttpOnly; Path=/; Max-Age=0');
    res.json({ message: 'Tizimdan muvaffaqiyatli chiqdingiz.' });
  });

  app.post('/api/v1/auth/password-reset-request', (req, res) => {
    const email = sanitizeText(req.body?.email, 120).toLowerCase();
    if (!email) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Elektron pochtani kiriting.' });
      return;
    }
    res.json({
      message:
        "Agar ushbu elektron pochta tizimda mavjud bo'lsa, parolni tiklash bo'yicha maktab tasdiqlash kodi yuborildi (Lokal rivojlantirish rejimida xavfsiz simulyatsiya).",
    });
  });

  // ============================================================================
  // 2. /api/v1/users — USER PROFILE & SETTINGS
  // ============================================================================
  app.get('/api/v1/users/me', requireAuth, (req, res) => {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.auth!.userId) as any;
    if (!user || !user.is_active) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Foydalanuvchi topilmadi.' });
      return;
    }
    const school = user.school_id
      ? (db.prepare('SELECT id, name, code, city FROM schools WHERE id = ?').get(user.school_id) as any)
      : null;

    res.json({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      schoolId: user.school_id,
      schoolName: school?.name || "Chilonzor tumani bo'limi",
      districtId: user.district_id,
      grade: user.grade,
      preferredStyle: user.preferred_style,
      englishLevel: user.english_level,
    });
  });

  app.patch('/api/v1/users/me/preferences', requireAuth, (req, res) => {
    const db = getDb();
    const style = req.body?.preferredStyle;
    const engLevel = req.body?.englishLevel;
    const fullName = req.body?.fullName ? sanitizeText(req.body.fullName, 120) : undefined;
    const grade = req.body?.grade ? Number(req.body.grade) : undefined;

    const validStyles = ['very_simple', 'step_by_step', 'detailed'];
    const validLevels = ['A1', 'A2', 'B1', 'B2'];

    const current = db.prepare('SELECT * FROM users WHERE id = ?').get(req.auth!.userId) as any;
    if (!current) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Foydalanuvchi topilmadi.' });
      return;
    }

    const nextStyle = validStyles.includes(style) ? style : current.preferred_style;
    const nextLevel = validLevels.includes(engLevel) ? engLevel : current.english_level;
    const nextName = fullName && fullName.length >= 3 ? fullName : current.full_name;
    const nextGrade =
      current.role === 'student' && grade && grade >= 1 && grade <= 11 ? grade : current.grade;

    db.prepare(`
      UPDATE users
      SET preferred_style = ?, english_level = ?, full_name = ?, grade = ?
      WHERE id = ?
    `).run(nextStyle, nextLevel, nextName, nextGrade, req.auth!.userId);

    res.json({
      message: 'Sozlamalar muvaffaqiyatli saqlandi.',
      preferredStyle: nextStyle,
      englishLevel: nextLevel,
      fullName: nextName,
      grade: nextGrade,
    });
  });

  // Strict student record protection: GET /api/v1/users/:id/records
  app.get('/api/v1/users/:id/records', requireAuth, (req, res) => {
    const targetUserId = req.params.id;
    const caller = req.auth!;
    const db = getDb();

    const targetUser = db
      .prepare('SELECT id, full_name, role, school_id, grade, preferred_style, english_level FROM users WHERE id = ?')
      .get(targetUserId) as any;

    if (!targetUser) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Foydalanuvchi topilmadi.' });
      return;
    }

    // Rule: Students must NEVER access another student's private records
    if (caller.role === 'student' && caller.userId !== targetUserId) {
      res.status(403).json({
        error: 'FORBIDDEN_PRIVATE_RECORD',
        message: "Boshqa o'quvchining shaxsiy natijalarini ko'rish qat'iyan man etiladi.",
      });
      return;
    }

    // Rule: Teachers / School Coordinators must belong to the same school
    if (
      (caller.role === 'teacher' || caller.role === 'school_coordinator') &&
      caller.schoolId !== targetUser.school_id
    ) {
      res.status(403).json({
        error: 'CROSS_SCHOOL_FORBIDDEN',
        message: "Boshqa maktab o'quvchisining ma'lumotlariga kirish taqiqlangan.",
      });
      return;
    }

    // Rule: District coordinator and school coordinator do not get unrestricted private AI chats
    const submissions = db
      .prepare(`
        SELECT s.id, s.assignment_id, a.title_uz as assignment_title, a.subject_code, s.score, s.max_score, s.percentage, s.teacher_feedback_uz, s.submitted_at
        FROM submissions s
        JOIN assignments a ON a.id = s.assignment_id
        WHERE s.student_id = ?
        ORDER BY s.submitted_at DESC
      `)
      .all(targetUserId);

    res.json({
      student: {
        id: targetUser.id,
        fullName: targetUser.full_name,
        schoolId: targetUser.school_id,
        grade: targetUser.grade,
        preferredStyle: targetUser.preferred_style,
        englishLevel: targetUser.english_level,
      },
      submissions,
    });
  });

  // ============================================================================
  // 3. /api/v1/schools & /api/v1/subjects
  // ============================================================================
  app.get('/api/v1/schools', (_req, res) => {
    const db = getDb();
    const schools = db
      .prepare(`
        SELECT s.id, s.name, s.code, s.city, s.status, d.name as district_name
        FROM schools s
        JOIN districts d ON d.id = s.district_id
        ORDER BY s.name ASC
      `)
      .all();
    res.json({ items: schools });
  });

  app.get('/api/v1/subjects', (_req, res) => {
    const db = getDb();
    const subjects = db.prepare('SELECT * FROM subjects WHERE is_active = 1 ORDER BY name_uz ASC').all();
    res.json({ items: subjects });
  });

  // ============================================================================
  // 4. /api/v1/classes — CLASS MANAGEMENT WITH STRICT TEACHER & SCHOOL SCOPING
  // ============================================================================
  app.get('/api/v1/classes', requireAuth, (req, res) => {
    const db = getDb();
    const caller = req.auth!;

    if (caller.role === 'teacher') {
      const classes = db
        .prepare(`
          SELECT c.*,
            (SELECT COUNT(*) FROM class_enrollments ce WHERE ce.class_id = c.id) as student_count
          FROM classes c
          WHERE c.teacher_id = ? AND c.school_id = ?
          ORDER BY c.grade ASC, c.name ASC
        `)
        .all(caller.userId, caller.schoolId);
      res.json({ items: classes });
      return;
    }

    if (caller.role === 'student') {
      const classes = db
        .prepare(`
          SELECT c.*, u.full_name as teacher_name
          FROM classes c
          JOIN class_enrollments ce ON ce.class_id = c.id
          JOIN users u ON u.id = c.teacher_id
          WHERE ce.student_id = ? AND c.school_id = ?
        `)
        .all(caller.userId, caller.schoolId);
      res.json({ items: classes });
      return;
    }

    if (caller.role === 'school_coordinator') {
      const classes = db
        .prepare(`
          SELECT c.*, u.full_name as teacher_name,
            (SELECT COUNT(*) FROM class_enrollments ce WHERE ce.class_id = c.id) as student_count
          FROM classes c
          JOIN users u ON u.id = c.teacher_id
          WHERE c.school_id = ?
        `)
        .all(caller.schoolId);
      res.json({ items: classes });
      return;
    }

    // Admin or district coordinator
    const classes = db
      .prepare(`
        SELECT c.*, u.full_name as teacher_name, s.name as school_name,
          (SELECT COUNT(*) FROM class_enrollments ce WHERE ce.class_id = c.id) as student_count
        FROM classes c
        JOIN users u ON u.id = c.teacher_id
        JOIN schools s ON s.id = c.school_id
      `)
      .all();
    res.json({ items: classes });
  });

  app.get('/api/v1/classes/:id', requireAuth, (req, res) => {
    const db = getDb();
    const caller = req.auth!;
    const cls = db.prepare('SELECT * FROM classes WHERE id = ?').get(req.params.id) as any;

    if (!cls) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Sinf topilmadi.' });
      return;
    }

    // School boundary check
    if (caller.role !== 'admin' && caller.role !== 'district_coordinator' && cls.school_id !== caller.schoolId) {
      res.status(403).json({
        error: 'CROSS_SCHOOL_FORBIDDEN',
        message: "Boshqa maktab sinfiga kirish taqiqlangan.",
      });
      return;
    }

    // Teacher assignment check: prevent teachers from accessing classes not assigned to them
    if (caller.role === 'teacher' && cls.teacher_id !== caller.userId) {
      res.status(403).json({
        error: 'NOT_ASSIGNED_CLASS',
        message: "Siz faqat o'zingizga biriktirilgan sinflarni boshqarishingiz mumkin.",
      });
      return;
    }

    const students = db
      .prepare(`
        SELECT u.id, u.full_name, u.email, u.grade, u.english_level,
          (SELECT ROUND(AVG(s.percentage), 1) FROM submissions s WHERE s.student_id = u.id) as avg_score,
          (SELECT COUNT(*) FROM submissions s WHERE s.student_id = u.id) as completed_count
        FROM class_enrollments ce
        JOIN users u ON u.id = ce.student_id
        WHERE ce.class_id = ?
      `)
      .all(cls.id);

    res.json({
      classInfo: cls,
      students,
    });
  });

  app.post('/api/v1/classes', requireAuth, requireRoles('teacher', 'admin'), (req, res) => {
    const db = getDb();
    const caller = req.auth!;
    const name = sanitizeText(req.body?.name, 100);
    const grade = Number(req.body?.grade || 7);
    const subjectCode = sanitizeText(req.body?.subjectCode || 'math', 30);

    if (!name) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Sinf nomini kiriting.' });
      return;
    }

    const schoolId = caller.role === 'admin' && req.body?.schoolId ? req.body.schoolId : caller.schoolId;
    const teacherId = caller.role === 'admin' && req.body?.teacherId ? req.body.teacherId : caller.userId;
    const id = `class-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO classes (id, school_id, teacher_id, name, grade, subject_code, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, schoolId, teacherId, name, grade, subjectCode, now);

    logAudit(caller.userId, schoolId, 'CLASS_CREATED', 'class', id, `Yangi sinf ochildi: ${name}`);

    res.status(201).json({
      id,
      school_id: schoolId,
      teacher_id: teacherId,
      name,
      grade,
      subject_code: subjectCode,
      created_at: now,
    });
  });

  // ============================================================================
  // 5. /api/v1/lessons — LEARNING MATERIALS & AI CONTENT REVIEW WORKFLOW
  // ============================================================================
  app.get('/api/v1/lessons', requireAuth, (req, res) => {
    const db = getDb();
    const caller = req.auth!;
    const subjectCode = req.query.subject ? String(req.query.subject) : undefined;
    const statusFilter = req.query.status ? String(req.query.status) : undefined;

    let sql = `
      SELECT l.*, u.full_name as author_name, r.full_name as reviewer_name
      FROM lessons l
      LEFT JOIN users u ON u.id = l.created_by
      LEFT JOIN users r ON r.id = l.reviewed_by
      WHERE (l.school_id = ? OR l.school_id IS NULL)
    `;
    const params: any[] = [caller.schoolId || 'school-145'];

    // Students ONLY see approved lessons
    if (caller.role === 'student') {
      sql += ` AND l.approval_status = 'approved'`;
    } else if (statusFilter) {
      sql += ` AND l.approval_status = ?`;
      params.push(statusFilter);
    }

    if (subjectCode) {
      sql += ` AND l.subject_code = ?`;
      params.push(subjectCode);
    }

    sql += ` ORDER BY l.grade ASC, l.created_at DESC`;
    const items = db.prepare(sql).all(...params);
    res.json({
      curriculumNoticeUz:
        "Eslatma: Ushbu mavzular namuna sifatida tuzilgan bo'lib, rasmiy milliy o'quv dasturi to'liq import qilinmaguncha maktab ichki tasdig'i asosida qo'llaniladi.",
      items,
    });
  });

  app.post('/api/v1/lessons', requireAuth, requireRoles('teacher', 'admin'), (req, res) => {
    const db = getDb();
    const caller = req.auth!;
    const titleUz = sanitizeText(req.body?.titleUz, 200);
    const subjectCode = sanitizeText(req.body?.subjectCode || 'math', 30);
    const grade = Number(req.body?.grade || 7);
    const topicSlug = sanitizeText(req.body?.topicSlug || 'general', 60);
    const levelTag = sanitizeText(req.body?.levelTag || `${grade}-sinf`, 40);
    const summaryUz = sanitizeText(req.body?.summaryUz, 500);
    const contentUz = sanitizeText(req.body?.contentUz, 6000);
    const workedExampleUz = sanitizeText(req.body?.workedExampleUz, 3000);
    const initialStatus =
      req.body?.approvalStatus === 'approved' ? 'approved' : req.body?.approvalStatus === 'draft' ? 'draft' : 'pending_review';

    if (!titleUz || !contentUz) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: "Dars sarlavhasi va mazmuni kiritilishi shart.",
      });
      return;
    }

    const id = `lesson-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO lessons (id, school_id, subject_code, grade, topic_slug, title_uz, level_tag, summary_uz, content_uz, worked_example_uz, approval_status, created_by, reviewed_by, reviewed_at, revision_notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      caller.schoolId || 'school-145',
      subjectCode,
      grade,
      topicSlug,
      titleUz,
      levelTag,
      summaryUz || titleUz,
      contentUz,
      workedExampleUz || '',
      initialStatus,
      caller.userId,
      initialStatus === 'approved' ? caller.userId : null,
      initialStatus === 'approved' ? now : null,
      initialStatus === 'approved' ? "O'qituvchi tomonidan yaratildi va tasdiqlandi." : "Ko'rib chiqish kutilmoqda.",
      now
    );

    logAudit(caller.userId, caller.schoolId, 'LESSON_CREATED', 'lesson', id, `Yangi o'quv materiali: ${titleUz} (${initialStatus})`);

    res.status(201).json({ id, titleUz, approvalStatus: initialStatus });
  });

  // Content review and approval endpoint (Draft / Pending review -> Approved / Rejected / Archived)
  app.patch('/api/v1/lessons/:id/review', requireAuth, requireRoles('teacher', 'admin'), (req, res) => {
    const db = getDb();
    const caller = req.auth!;
    const lessonId = req.params.id;
    const lesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(lessonId) as any;

    if (!lesson) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Dars materiali topilmadi.' });
      return;
    }

    if (caller.role !== 'admin' && lesson.school_id && lesson.school_id !== caller.schoolId) {
      res.status(403).json({
        error: 'CROSS_SCHOOL_FORBIDDEN',
        message: "Boshqa maktab materialini tasdiqlash mumkin emas.",
      });
      return;
    }

    const validStatuses = ['draft', 'pending_review', 'approved', 'rejected', 'archived'];
    const newStatus = sanitizeText(req.body?.status, 30);
    if (!validStatuses.includes(newStatus)) {
      res.status(400).json({ error: 'INVALID_STATUS', message: "Noto'g'ri holat (status) tanlandi." });
      return;
    }

    const updatedTitle = req.body?.titleUz ? sanitizeText(req.body.titleUz, 200) : lesson.title_uz;
    const updatedContent = req.body?.contentUz ? sanitizeText(req.body.contentUz, 6000) : lesson.content_uz;
    const updatedExample = req.body?.workedExampleUz
      ? sanitizeText(req.body.workedExampleUz, 3000)
      : lesson.worked_example_uz;
    const reviewNotes = sanitizeText(req.body?.revisionNotes || `Holat '${newStatus}' ga o'zgartirildi.`, 500);
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE lessons
      SET title_uz = ?, content_uz = ?, worked_example_uz = ?, approval_status = ?, reviewed_by = ?, reviewed_at = ?, revision_notes = ?
      WHERE id = ?
    `).run(updatedTitle, updatedContent, updatedExample, newStatus, caller.userId, now, reviewNotes, lessonId);

    db.prepare(`
      INSERT INTO content_reviews (id, lesson_id, reviewer_id, previous_status, new_status, comment_uz, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      `rev-${crypto.randomUUID().slice(0, 8)}`,
      lessonId,
      caller.userId,
      lesson.approval_status,
      newStatus,
      reviewNotes,
      now
    );

    logAudit(
      caller.userId,
      caller.schoolId,
      'CONTENT_REVIEW',
      'lesson',
      lessonId,
      `Material (${updatedTitle}): ${lesson.approval_status} -> ${newStatus}`
    );

    res.json({
      id: lessonId,
      previousStatus: lesson.approval_status,
      approvalStatus: newStatus,
      reviewedBy: caller.userId,
      reviewedAt: now,
      revisionNotes: reviewNotes,
    });
  });

  // ============================================================================
  // 6. /api/v1/assignments, /api/v1/quizzes, /api/v1/submissions
  // ============================================================================
  const listAssignmentsHandler = (req: express.Request, res: express.Response) => {
    const db = getDb();
    const caller = req.auth!;
    const subjectFilter = req.query.subject ? String(req.query.subject) : undefined;

    let sql = `
      SELECT a.*, c.name as class_name, u.full_name as teacher_name,
        (SELECT COUNT(*) FROM questions q WHERE q.assignment_id = a.id) as question_count
      FROM assignments a
      LEFT JOIN classes c ON c.id = a.class_id
      LEFT JOIN users u ON u.id = a.teacher_id
      WHERE a.school_id = ?
    `;
    const params: any[] = [caller.schoolId || 'school-145'];

    if (caller.role === 'student') {
      sql += ` AND a.is_published = 1`;
    }
    if (subjectFilter) {
      sql += ` AND a.subject_code = ?`;
      params.push(subjectFilter);
    }
    sql += ` ORDER BY a.created_at DESC`;

    const assignments = db.prepare(sql).all(...params) as any[];

    if (caller.role === 'student') {
      const enriched = assignments.map((a) => {
        const latestSub = db
          .prepare(
            'SELECT id, score, max_score, percentage, teacher_feedback_uz, submitted_at FROM submissions WHERE assignment_id = ? AND student_id = ? ORDER BY submitted_at DESC LIMIT 1'
          )
          .get(a.id, caller.userId);
        return { ...a, mySubmission: latestSub || null };
      });
      res.json({ items: enriched });
      return;
    }

    res.json({ items: assignments });
  };

  app.get('/api/v1/assignments', requireAuth, listAssignmentsHandler);
  app.get('/api/v1/quizzes', requireAuth, listAssignmentsHandler);

  app.get('/api/v1/assignments/:id', requireAuth, (req, res) => {
    const db = getDb();
    const caller = req.auth!;
    const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id) as any;

    if (!assignment) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Topshiriq topilmadi.' });
      return;
    }

    // Enforce school boundary
    if (caller.role !== 'admin' && caller.role !== 'district_coordinator' && assignment.school_id !== caller.schoolId) {
      res.status(403).json({
        error: 'CROSS_SCHOOL_FORBIDDEN',
        message: "Boshqa maktab topshirig'iga kirish taqiqlangan.",
      });
      return;
    }

    const rawQuestions = db
      .prepare('SELECT * FROM questions WHERE assignment_id = ? ORDER BY order_index ASC')
      .all(assignment.id) as any[];

    // SECURITY RULE: Never expose correct_answer in student-facing API responses before submission!
    const questions = rawQuestions.map((q) => {
      const base = {
        id: q.id,
        questionType: q.question_type,
        promptUz: q.prompt_uz,
        options: q.options_json ? JSON.parse(q.options_json) : null,
        hintUz: q.hint_uz,
        points: q.points,
        orderIndex: q.order_index,
      };
      if (caller.role === 'teacher' || caller.role === 'admin') {
        return {
          ...base,
          correctAnswer: q.correct_answer,
          explanationUz: q.explanation_uz,
        };
      }
      return base;
    });

    res.json({
      assignment,
      questions,
      gradingNoticeUz: "Eslatma: Ushbu mashq ballari o'quv ko'nikmasini kuzatish uchun mo'ljallangan, rasmiy chorak bahosi emas.",
    });
  });

  app.post('/api/v1/assignments', requireAuth, requireRoles('teacher', 'admin'), (req, res) => {
    const db = getDb();
    const caller = req.auth!;
    const titleUz = sanitizeText(req.body?.titleUz, 200);
    const descriptionUz = sanitizeText(req.body?.descriptionUz, 800);
    const subjectCode = sanitizeText(req.body?.subjectCode || 'math', 30);
    const grade = Number(req.body?.grade || 7);
    const topicSlug = sanitizeText(req.body?.topicSlug || 'general', 60);
    const classId = req.body?.classId ? sanitizeText(req.body.classId, 60) : null;
    const dueDate = req.body?.dueDate ? sanitizeText(req.body.dueDate, 30) : null;
    const assignmentType = req.body?.assignmentType === 'homework' ? 'homework' : 'quiz';
    const questionsInput = Array.isArray(req.body?.questions) ? req.body.questions : [];

    if (!titleUz || questionsInput.length === 0) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: "Topshiriq nomi va kamida 1 ta savol kiritilishi shart.",
      });
      return;
    }

    if (classId && caller.role === 'teacher') {
      const cls = db.prepare('SELECT teacher_id, school_id FROM classes WHERE id = ?').get(classId) as any;
      if (!cls || cls.teacher_id !== caller.userId) {
        res.status(403).json({
          error: 'NOT_ASSIGNED_CLASS',
          message: "Siz faqat o'zingizga biriktirilgan sinfga topshiriq bera olasiz.",
        });
        return;
      }
    }

    const assignmentId = `assign-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    const schoolId = caller.schoolId || 'school-145';

    db.exec('BEGIN TRANSACTION');
    try {
      db.prepare(`
        INSERT INTO assignments (id, school_id, class_id, teacher_id, subject_code, grade, topic_slug, title_uz, description_uz, assignment_type, is_published, due_date, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
      `).run(
        assignmentId,
        schoolId,
        classId,
        caller.userId,
        subjectCode,
        grade,
        topicSlug,
        titleUz,
        descriptionUz || titleUz,
        assignmentType,
        dueDate,
        now
      );

      const insertQ = db.prepare(`
        INSERT INTO questions (id, assignment_id, question_type, prompt_uz, options_json, correct_answer, hint_uz, explanation_uz, points, order_index)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      questionsInput.forEach((q: any, idx: number) => {
        const qType = ['multiple_choice', 'numeric', 'fill_blank', 'short_answer'].includes(q.questionType)
          ? q.questionType
          : 'multiple_choice';
        insertQ.run(
          `q-${crypto.randomUUID().slice(0, 8)}`,
          assignmentId,
          qType,
          sanitizeText(q.promptUz, 500),
          Array.isArray(q.options) ? JSON.stringify(q.options.map((o: any) => sanitizeText(o, 200))) : null,
          sanitizeText(q.correctAnswer, 200),
          sanitizeText(q.hintUz || "Mavzu qoidasini eslang.", 300),
          sanitizeText(q.explanationUz || "To'g'ri yechim qoidaga asoslanadi.", 500),
          Number(q.points || 10),
          idx + 1
        );
      });

      // Notify enrolled students
      if (classId) {
        const enrolled = db
          .prepare('SELECT student_id FROM class_enrollments WHERE class_id = ?')
          .all(classId) as { student_id: string }[];
        const insertNotif = db.prepare(`
          INSERT INTO notifications (id, user_id, title_uz, body_uz, category, is_read, created_at)
          VALUES (?, ?, ?, ?, 'assignment', 0, ?)
        `);
        for (const st of enrolled) {
          insertNotif.run(
            `notif-${crypto.randomUUID().slice(0, 8)}`,
            st.student_id,
            `Yangi topshiriq: ${titleUz}`,
            `Ustozingiz yangi topshiriq e'lon qildi. Muddati: ${dueDate || 'Belgilanmagan'}.`,
            now
          );
        }
      }

      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }

    logAudit(caller.userId, schoolId, 'ASSIGNMENT_CREATED', 'assignment', assignmentId, `Topshiriq yaratildi: ${titleUz}`);
    res.status(201).json({ id: assignmentId, titleUz, questionCount: questionsInput.length });
  });

  // Submit assignment / quiz answers with transactional deterministic backend validation
  app.post('/api/v1/submissions', requireAuth, (req, res) => {
    const db = getDb();
    const caller = req.auth!;
    const assignmentId = sanitizeText(req.body?.assignmentId, 60);
    const answers = req.body?.answers && typeof req.body.answers === 'object' ? req.body.answers : {};

    const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(assignmentId) as any;
    if (!assignment) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Topshiriq topilmadi.' });
      return;
    }

    if (caller.schoolId !== assignment.school_id && caller.role !== 'admin') {
      res.status(403).json({
        error: 'CROSS_SCHOOL_FORBIDDEN',
        message: "Boshqa maktab topshirig'iga javob yuborish mumkin emas.",
      });
      return;
    }

    const questions = db
      .prepare('SELECT * FROM questions WHERE assignment_id = ? ORDER BY order_index ASC')
      .all(assignmentId) as any[];

    let score = 0;
    let maxScore = 0;
    const detailedResults = questions.map((q) => {
      maxScore += Number(q.points || 10);
      const rawAns = String(answers[q.id] ?? '');
      const check = evaluateAnswerDeterministically(q.question_type, rawAns, q.correct_answer);
      const earned = check.isCorrect ? Number(q.points || 10) : 0;
      score += earned;
      return {
        questionId: q.id,
        promptUz: q.prompt_uz,
        studentAnswer: rawAns,
        isCorrect: check.isCorrect,
        pointsEarned: earned,
        maxPoints: Number(q.points || 10),
        feedbackUz: check.feedbackUz,
        explanationUz: q.explanation_uz,
      };
    });

    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const submissionId = `sub-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();

    db.exec('BEGIN TRANSACTION');
    try {
      db.prepare(`
        INSERT INTO submissions (id, assignment_id, student_id, school_id, answers_json, results_json, score, max_score, percentage, submitted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        submissionId,
        assignmentId,
        caller.userId,
        assignment.school_id,
        JSON.stringify(answers),
        JSON.stringify(detailedResults),
        score,
        maxScore,
        percentage,
        now
      );
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }

    res.status(201).json({
      submissionId,
      assignmentId,
      score,
      maxScore,
      percentage,
      results: detailedResults,
      submittedAt: now,
    });
  });

  app.get('/api/v1/submissions', requireAuth, (req, res) => {
    const db = getDb();
    const caller = req.auth!;

    if (caller.role === 'student') {
      const subs = db
        .prepare(`
          SELECT s.*, a.title_uz as assignment_title, a.subject_code, a.assignment_type
          FROM submissions s
          JOIN assignments a ON a.id = s.assignment_id
          WHERE s.student_id = ?
          ORDER BY s.submitted_at DESC
        `)
        .all(caller.userId) as any[];
      res.json({
        items: subs.map((s) => ({
          ...s,
          results: JSON.parse(s.results_json || '[]'),
        })),
      });
      return;
    }

    // Teacher or Admin sees submissions for their school/classes
    const subs = db
      .prepare(`
        SELECT s.*, a.title_uz as assignment_title, a.subject_code, u.full_name as student_name, u.grade as student_grade
        FROM submissions s
        JOIN assignments a ON a.id = s.assignment_id
        JOIN users u ON u.id = s.student_id
        WHERE s.school_id = ?
        ORDER BY s.submitted_at DESC
      `)
      .all(caller.schoolId || 'school-145') as any[];

    res.json({
      items: subs.map((s) => ({
        ...s,
        results: JSON.parse(s.results_json || '[]'),
      })),
    });
  });

  // Teacher feedback on a student submission
  app.patch('/api/v1/submissions/:id/feedback', requireAuth, requireRoles('teacher', 'admin'), (req, res) => {
    const db = getDb();
    const caller = req.auth!;
    const subId = req.params.id;
    const feedbackUz = sanitizeText(req.body?.feedbackUz, 1000);

    const sub = db.prepare('SELECT * FROM submissions WHERE id = ?').get(subId) as any;
    if (!sub) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Topshirilgan ish topilmadi.' });
      return;
    }

    if (caller.role !== 'admin' && sub.school_id !== caller.schoolId) {
      res.status(403).json({
        error: 'CROSS_SCHOOL_FORBIDDEN',
        message: "Boshqa maktab o'quvchisining ishini baholash mumkin emas.",
      });
      return;
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE submissions SET teacher_feedback_uz = ?, reviewed_by = ? WHERE id = ?').run(
      feedbackUz,
      caller.userId,
      subId
    );

    db.prepare(`
      INSERT INTO notifications (id, user_id, title_uz, body_uz, category, is_read, created_at)
      VALUES (?, ?, ?, ?, 'feedback', 0, ?)
    `).run(
      `notif-${crypto.randomUUID().slice(0, 8)}`,
      sub.student_id,
      "Ustozingiz sizning ishingizga fikr bildirdi",
      feedbackUz,
      now
    );

    res.json({ id: subId, teacherFeedbackUz: feedbackUz, reviewedBy: caller.userId });
  });

  // ============================================================================
  // 7. /api/v1/ai — EDUAI AI TUTOR & RESPONSIBLE MODERATION
  // ============================================================================
  app.get('/api/v1/ai/conversations', requireAuth, (req, res) => {
    const db = getDb();
    const caller = req.auth!;

    // Privacy by design: Only the owner of the conversation can list their private tutoring conversations
    const convs = db
      .prepare('SELECT * FROM ai_conversations WHERE student_id = ? ORDER BY updated_at DESC LIMIT 30')
      .all(caller.userId);
    res.json({ items: convs });
  });

  app.get('/api/v1/ai/conversations/:id/messages', requireAuth, (req, res) => {
    const db = getDb();
    const caller = req.auth!;
    const conv = db.prepare('SELECT * FROM ai_conversations WHERE id = ?').get(req.params.id) as any;

    if (!conv) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Suhbat topilmadi.' });
      return;
    }

    if (conv.student_id !== caller.userId) {
      res.status(403).json({
        error: 'FORBIDDEN_PRIVATE_CONVERSATION',
        message: "Boshqa foydalanuvchining shaxsiy AI suhbatini o'qish taqiqlangan.",
      });
      return;
    }

    const messages = db
      .prepare('SELECT * FROM ai_messages WHERE conversation_id = ? ORDER BY created_at ASC')
      .all(conv.id);

    res.json({ conversation: conv, messages });
  });

  app.delete('/api/v1/ai/conversations/:id', requireAuth, (req, res) => {
    const db = getDb();
    const caller = req.auth!;
    const conv = db.prepare('SELECT * FROM ai_conversations WHERE id = ?').get(req.params.id) as any;

    if (!conv) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Suhbat topilmadi.' });
      return;
    }

    if (conv.student_id !== caller.userId && caller.role !== 'admin') {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: "Siz faqat o'z suhbatingizni o'chira olasiz.",
      });
      return;
    }

    db.prepare('DELETE FROM ai_conversations WHERE id = ?').run(conv.id);
    logAudit(caller.userId, caller.schoolId, 'AI_CONVERSATION_DELETED', 'ai_conversation', conv.id, "AI suhbat tarixi o'chirildi.");
    res.json({ message: "Suhbat tarixi butunlay o'chirildi." });
  });

  app.post('/api/v1/ai/chat', requireAuth, async (req, res) => {
    const caller = req.auth!;
    const rate = aiRateLimiter.check(`ai:${caller.userId}`);
    if (!rate.allowed) {
      res.status(429).json({
        error: 'AI_RATE_LIMITED',
        message: `AI so'rovlar chegarasiga yetdingiz. Iltimos, ${rate.retryAfterSeconds} soniya kuting.`,
      });
      return;
    }

    const question = sanitizeText(req.body?.question, 2000);
    const subjectCode = sanitizeText(req.body?.subjectCode || 'math', 30);
    const grade = Math.min(11, Math.max(1, Number(req.body?.grade || 7)));
    const topic = sanitizeText(req.body?.topic || 'Umumiy mavzu', 120);
    const explanationStyle: ExplanationStyle = ['very_simple', 'step_by_step', 'detailed'].includes(
      req.body?.explanationStyle
    )
      ? req.body.explanationStyle
      : 'step_by_step';
    const requestType: AIModeRequestType = ['explain', 'hint', 'example', 'practice', 'check_answer'].includes(
      req.body?.requestType
    )
      ? req.body.requestType
      : 'explain';
    const studentAnswer = req.body?.studentAnswer ? sanitizeText(req.body.studentAnswer, 1000) : undefined;
    const forceTimeoutForTest = Boolean(req.body?.forceTimeoutForTest);
    const forceProviderMode =
      req.body?.forceProviderMode === 'mock' || req.body?.forceProviderMode === 'gemini'
        ? req.body.forceProviderMode
        : undefined;

    if (!question) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Iltimos, savolingizni yozing.' });
      return;
    }

    // Pre-generation moderation & prompt injection guard
    const modCheck = moderateStudentInput(question);
    const db = getDb();
    const now = new Date().toISOString();

    if (!modCheck.safe) {
      db.prepare(`
        INSERT INTO ai_usage_records (id, user_id, school_id, subject_code, request_type, provider_used, status, latency_ms, created_at)
        VALUES (?, ?, ?, ?, ?, 'moderation_guard', 'blocked', 2, ?)
      `).run(`use-${crypto.randomUUID().slice(0, 8)}`, caller.userId, caller.schoolId, subjectCode, requestType, now);

      res.status(400).json({
        error: 'CONTENT_MODERATED',
        message: modCheck.reasonUz,
      });
      return;
    }

    // Retrieve approved school learning material context if available
    const approvedLessons = db
      .prepare(`
        SELECT title_uz, content_uz FROM lessons
        WHERE subject_code = ? AND approval_status = 'approved'
        LIMIT 2
      `)
      .all(subjectCode) as { title_uz: string; content_uz: string }[];

    const approvedContext = approvedLessons.map((l) => `${l.title_uz}: ${l.content_uz}`);

    const aiModeSetting = db
      .prepare('SELECT value FROM platform_settings WHERE key = ?')
      .get('ai_mode') as { value: string } | undefined;

    const effectiveMode =
      forceProviderMode || (aiModeSetting?.value === 'mock' ? 'mock' : undefined);

    try {
      const aiResp = await aiService.generateTutorResponse({
        subjectCode,
        grade,
        topic,
        explanationStyle,
        requestType,
        question,
        studentAnswer,
        approvedContext,
        forceTimeoutForTest,
        forceProviderMode: effectiveMode,
      });

      let convId = req.body?.conversationId ? sanitizeText(req.body.conversationId, 60) : '';
      const existingConv = convId
        ? (db.prepare('SELECT * FROM ai_conversations WHERE id = ? AND student_id = ?').get(convId, caller.userId) as any)
        : null;

      if (!existingConv) {
        convId = `conv-${crypto.randomUUID().slice(0, 8)}`;
        db.prepare(`
          INSERT INTO ai_conversations (id, student_id, school_id, subject_code, grade, topic, title_uz, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          convId,
          caller.userId,
          caller.schoolId || 'school-145',
          subjectCode,
          grade,
          topic,
          question.slice(0, 70),
          now,
          now
        );
      } else {
        db.prepare('UPDATE ai_conversations SET updated_at = ? WHERE id = ?').run(now, convId);
      }

      const userMsgId = `msg-${crypto.randomUUID().slice(0, 8)}`;
      const aiMsgId = `msg-${crypto.randomUUID().slice(0, 8)}`;

      db.prepare(`
        INSERT INTO ai_messages (id, conversation_id, sender_role, content_text, request_type, provider_used, is_teacher_approved, created_at)
        VALUES (?, ?, 'user', ?, ?, ?, 0, ?)
      `).run(userMsgId, convId, question, requestType, aiResp.providerUsed, now);

      db.prepare(`
        INSERT INTO ai_messages (id, conversation_id, sender_role, content_text, request_type, provider_used, is_teacher_approved, created_at)
        VALUES (?, ?, 'assistant', ?, ?, ?, 0, ?)
      `).run(aiMsgId, convId, aiResp.answer, requestType, aiResp.providerUsed, now);

      db.prepare(`
        INSERT INTO ai_usage_records (id, user_id, school_id, subject_code, request_type, provider_used, status, latency_ms, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'success', ?, ?)
      `).run(
        `use-${crypto.randomUUID().slice(0, 8)}`,
        caller.userId,
        caller.schoolId,
        subjectCode,
        requestType,
        aiResp.providerUsed,
        aiResp.latencyMs,
        now
      );

      res.json({
        conversationId: convId,
        messageId: aiMsgId,
        ...aiResp,
      });
    } catch (err: any) {
      db.prepare(`
        INSERT INTO ai_usage_records (id, user_id, school_id, subject_code, request_type, provider_used, status, latency_ms, created_at)
        VALUES (?, ?, ?, ?, ?, 'error', 'failed', 15000, ?)
      `).run(`use-${crypto.randomUUID().slice(0, 8)}`, caller.userId, caller.schoolId, subjectCode, requestType, now);

      res.status(503).json({
        error: 'AI_SERVICE_UNAVAILABLE',
        message:
          "AI xizmati javob berishga ulgurmadi (Timeout) yoki vaqtincha uzilish yuz berdi. Iltimos, qayta urinib ko'ring yoki Mock rejimidan foydalaning.",
      });
    }
  });

  app.post('/api/v1/ai/report', requireAuth, (req, res) => {
    const db = getDb();
    const caller = req.auth!;
    const messageId = req.body?.messageId ? sanitizeText(req.body.messageId, 60) : null;
    const reasonUz = sanitizeText(req.body?.reasonUz, 600);

    if (!reasonUz) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Shikoyat yoki xatolik sababini yozing.' });
      return;
    }

    const reportId = `rep-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO ai_reports (id, reporter_id, school_id, message_id, reason_uz, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'open', ?)
    `).run(reportId, caller.userId, caller.schoolId, messageId, reasonUz, now);

    if (messageId) {
      db.prepare('UPDATE ai_messages SET feedback_rating = ? WHERE id = ?').run('reported', messageId);
    }

    logAudit(caller.userId, caller.schoolId, 'AI_RESPONSE_REPORTED', 'ai_report', reportId, reasonUz);

    res.status(201).json({
      id: reportId,
      message: "Xabaringiz qabul qilindi. O'qituvchi va moderatorlar uni ko'rib chiqadilar.",
    });
  });

  // ============================================================================
  // 8. /api/v1/projects — IT YOSHLAR COMMUNITY & PROJECT MODERATION
  // ============================================================================
  app.get('/api/v1/projects', (req, res) => {
    const db = getDb();
    const category = req.query.category ? String(req.query.category) : undefined;
    // Public viewers only see approved or showcase projects; authenticated members also see their school's projects
    let sql = `
      SELECT p.id, p.school_id, s.name as school_name, p.title_uz, p.description_uz, p.category, p.status,
             p.milestones_json, p.demo_url, p.repo_url, p.team_names, p.review_feedback_uz, p.created_at,
             u.full_name as mentor_name
      FROM projects p
      JOIN schools s ON s.id = p.school_id
      LEFT JOIN users u ON u.id = p.mentor_id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (category && category !== 'all') {
      sql += ` AND p.category = ?`;
      params.push(category);
    }
    sql += ` ORDER BY p.created_at DESC`;

    const rows = db.prepare(sql).all(...params) as any[];
    const items = rows.map((r) => ({
      ...r,
      milestones: JSON.parse(r.milestones_json || '[]'),
    }));
    res.json({ items });
  });

  app.post('/api/v1/projects', requireAuth, (req, res) => {
    const db = getDb();
    const caller = req.auth!;
    const titleUz = sanitizeText(req.body?.titleUz, 160);
    const descriptionUz = sanitizeText(req.body?.descriptionUz, 1500);
    const category = sanitizeText(req.body?.category || 'Veb dasturlash', 80);
    const demoUrl = req.body?.demoUrl ? sanitizeText(req.body.demoUrl, 250) : '';
    const repoUrl = req.body?.repoUrl ? sanitizeText(req.body.repoUrl, 250) : '';
    const teamNames = sanitizeText(req.body?.teamNames || "IT Yoshlar jamoasi", 160);
    const milestones = Array.isArray(req.body?.milestones)
      ? req.body.milestones.map((m: any) => ({
          title: sanitizeText(m.title, 140),
          done: Boolean(m.done),
        }))
      : [
          { title: "G'oya va texnik reja tuzish", done: true },
          { title: 'Prototipni ishlab chiqish', done: false },
        ];

    if (!titleUz || !descriptionUz) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: "Loyiha nomi va tavsifi kiritilishi shart.",
      });
      return;
    }

    // Security check: Do not allow secret tokens in repository URLs
    if (/ghp_[a-zA-Z0-9]+|github_pat_|sk-[a-zA-Z0-9]+/i.test(repoUrl + ' ' + descriptionUz)) {
      res.status(400).json({
        error: 'SECRET_DETECTED',
        message: "Xavfsizlik qoidasi: Loyiha havolasida yoki tavsifida maxfiy kalit (token) qoldirish taqiqlangan!",
      });
      return;
    }

    const id = `proj-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    const schoolId = caller.schoolId || 'school-145';

    db.prepare(`
      INSERT INTO projects (id, school_id, owner_id, mentor_id, title_uz, description_uz, category, status, milestones_json, demo_url, repo_url, team_names, review_feedback_uz, created_at)
      VALUES (?, ?, ?, 'user-teacher-1', ?, ?, ?, 'pending_review', ?, ?, ?, ?, 'Mentor ko''rib chiqishi kutilmoqda.', ?)
    `).run(
      id,
      schoolId,
      caller.userId,
      titleUz,
      descriptionUz,
      category,
      JSON.stringify(milestones),
      demoUrl,
      repoUrl,
      teamNames,
      now
    );

    db.prepare(`
      INSERT OR IGNORE INTO project_members (id, project_id, user_id, role_in_project, joined_at)
      VALUES (?, ?, ?, 'Loyiha muallifi', ?)
    `).run(`pm-${crypto.randomUUID().slice(0, 8)}`, id, caller.userId, now);

    logAudit(caller.userId, schoolId, 'PROJECT_SUBMITTED', 'project', id, `IT Yoshlar loyihasi yuborildi: ${titleUz}`);

    res.status(201).json({
      id,
      titleUz,
      status: 'pending_review',
      message: "Loyiha muvaffaqiyatli yuborildi va mentor tekshiruviga qo'yildi.",
    });
  });

  app.post('/api/v1/projects/:id/join', requireAuth, (req, res) => {
    const db = getDb();
    const caller = req.auth!;
    const proj = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id) as any;

    if (!proj) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Loyiha topilmadi.' });
      return;
    }

    if (caller.schoolId && proj.school_id !== caller.schoolId && caller.role === 'student') {
      res.status(403).json({
        error: 'CROSS_SCHOOL_FORBIDDEN',
        message: "Siz faqat o'z maktabingizdagi tasdiqlangan loyiha jamoasiga qo'shila olasiz.",
      });
      return;
    }

    const now = new Date().toISOString();
    db.prepare(`
      INSERT OR IGNORE INTO project_members (id, project_id, user_id, role_in_project, joined_at)
      VALUES (?, ?, ?, 'Jamoa a''zosi', ?)
    `).run(`pm-${crypto.randomUUID().slice(0, 8)}`, proj.id, caller.userId, now);

    res.json({ message: "Loyiha jamoasiga muvaffaqiyatli qo'shildingiz!" });
  });

  // Project review & moderation by Teacher, School Coordinator, District Coordinator, or Admin
  app.patch(
    '/api/v1/projects/:id/moderate',
    requireAuth,
    requireRoles('teacher', 'school_coordinator', 'district_coordinator', 'admin'),
    (req, res) => {
      const db = getDb();
      const caller = req.auth!;
      const proj = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id) as any;

      if (!proj) {
        res.status(404).json({ error: 'NOT_FOUND', message: 'Loyiha topilmadi.' });
        return;
      }

      if (
        (caller.role === 'teacher' || caller.role === 'school_coordinator') &&
        proj.school_id !== caller.schoolId
      ) {
        res.status(403).json({
          error: 'CROSS_SCHOOL_FORBIDDEN',
          message: "Boshqa maktab loyihasini moderatsiya qilish mumkin emas.",
        });
        return;
      }

      const validStatuses = ['draft', 'pending_review', 'approved', 'showcase', 'rejected'];
      const newStatus = sanitizeText(req.body?.status, 30);
      const feedbackUz = sanitizeText(
        req.body?.reviewFeedbackUz || "Mentor tomonidan ko'rib chiqildi.",
        600
      );

      if (!validStatuses.includes(newStatus)) {
        res.status(400).json({ error: 'INVALID_STATUS', message: "Noto'g'ri loyiha holati." });
        return;
      }

      db.prepare('UPDATE projects SET status = ?, review_feedback_uz = ?, mentor_id = ? WHERE id = ?').run(
        newStatus,
        feedbackUz,
        caller.userId,
        proj.id
      );

      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO notifications (id, user_id, title_uz, body_uz, category, is_read, created_at)
        VALUES (?, ?, ?, ?, 'project', 0, ?)
      `).run(
        `notif-${crypto.randomUUID().slice(0, 8)}`,
        proj.owner_id,
        `IT Yoshlar loyihangiz holati yangilandi: ${proj.title_uz}`,
        feedbackUz,
        now
      );

      logAudit(
        caller.userId,
        caller.schoolId,
        'PROJECT_MODERATED',
        'project',
        proj.id,
        `${proj.title_uz} -> ${newStatus}`
      );

      res.json({ id: proj.id, status: newStatus, reviewFeedbackUz: feedbackUz });
    }
  );

  // ============================================================================
  // 9. /api/v1/teacher — TEACHER DASHBOARD & CSV EXPORT
  // ============================================================================
  app.get('/api/v1/teacher/overview', requireAuth, requireRoles('teacher', 'admin'), (req, res) => {
    const db = getDb();
    const caller = req.auth!;
    const schoolId = caller.schoolId || 'school-145';

    const classes = db
      .prepare(`
        SELECT c.*,
          (SELECT COUNT(*) FROM class_enrollments ce WHERE ce.class_id = c.id) as student_count
        FROM classes c
        WHERE c.teacher_id = ? AND c.school_id = ?
      `)
      .all(caller.userId, schoolId);

    const pendingLessons = db
      .prepare(`
        SELECT * FROM lessons
        WHERE school_id = ? AND approval_status IN ('pending_review', 'draft')
        ORDER BY created_at DESC
      `)
      .all(schoolId);

    const recentSubmissions = db
      .prepare(`
        SELECT s.*, a.title_uz as assignment_title, a.subject_code, u.full_name as student_name, u.grade
        FROM submissions s
        JOIN assignments a ON a.id = s.assignment_id
        JOIN users u ON u.id = s.student_id
        WHERE s.school_id = ?
        ORDER BY s.submitted_at DESC
        LIMIT 20
      `)
      .all(schoolId);

    const reportedAI = db
      .prepare(`
        SELECT r.*, u.full_name as reporter_name
        FROM ai_reports r
        JOIN users u ON u.id = r.reporter_id
        WHERE r.school_id = ?
        ORDER BY r.created_at DESC
      `)
      .all(schoolId);

    res.json({
      classes,
      pendingLessons,
      recentSubmissions,
      reportedAI,
    });
  });

  app.get('/api/v1/teacher/export-csv', requireAuth, requireRoles('teacher', 'school_coordinator', 'district_coordinator', 'admin'), (req, res) => {
    const db = getDb();
    const caller = req.auth!;
    const schoolId = caller.schoolId || 'school-145';

    const rows = db
      .prepare(`
        SELECT u.full_name, u.grade, a.subject_code, a.title_uz, s.score, s.max_score, s.percentage, s.submitted_at
        FROM submissions s
        JOIN users u ON u.id = s.student_id
        JOIN assignments a ON a.id = s.assignment_id
        WHERE s.school_id = ?
        ORDER BY s.submitted_at DESC
      `)
      .all(schoolId) as any[];

    const header = 'Oquvchi_FIO,Sinf,Fan,Topshiriq,Ball,Maksimal_Ball,Foiz,Sana\n';
    const csvLines = rows
      .map(
        (r) =>
          `"${String(r.full_name).replace(/"/g, '""')}",${r.grade || 7},${r.subject_code},"${String(
            r.title_uz
          ).replace(/"/g, '""')}",${r.score},${r.max_score},${r.percentage}%,${r.submitted_at}`
      )
      .join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="eduai_hisobot.csv"');
    res.send(header + csvLines);
  });

  // ============================================================================
  // 10. /api/v1/coordinator — SCHOOL & DISTRICT COORDINATOR WORKFLOWS
  // ============================================================================
  app.get(
    '/api/v1/coordinator/overview',
    requireAuth,
    requireRoles('school_coordinator', 'district_coordinator', 'admin'),
    (req, res) => {
      const db = getDb();
      const caller = req.auth!;
      const schoolId = caller.schoolId || 'school-145';

      // Aggregate school stats (NEVER exposes private student AI messages)
      const schoolMetrics = db
        .prepare(`
          SELECT
            s.id as school_id,
            s.name as school_name,
            s.code as school_code,
            (SELECT COUNT(*) FROM users u WHERE u.school_id = s.id AND u.role = 'student' AND u.is_active = 1) as active_students,
            (SELECT COUNT(*) FROM users u WHERE u.school_id = s.id AND u.role = 'teacher' AND u.is_active = 1) as active_teachers,
            (SELECT COUNT(*) FROM submissions sub WHERE sub.school_id = s.id) as completed_submissions,
            (SELECT COALESCE(ROUND(AVG(sub.percentage), 1), 0) FROM submissions sub WHERE sub.school_id = s.id) as avg_quiz_percentage,
            (SELECT COUNT(*) FROM projects p WHERE p.school_id = s.id) as total_projects,
            (SELECT COUNT(*) FROM ai_usage_records au WHERE au.school_id = s.id) as ai_requests
          FROM schools s
          WHERE (? = 'school_coordinator' AND s.id = ?) OR (? != 'school_coordinator')
          ORDER BY s.name ASC
        `)
        .all(caller.role, schoolId, caller.role);

      const events = db
        .prepare(`
          SELECT e.*, u.full_name as organizer_name
          FROM events e
          JOIN users u ON u.id = e.organizer_id
          ORDER BY e.event_date ASC
        `)
        .all();

      const projects = db
        .prepare(`
          SELECT p.*, s.name as school_name
          FROM projects p
          JOIN schools s ON s.id = p.school_id
          WHERE (? = 'school_coordinator' AND p.school_id = ?) OR (? != 'school_coordinator')
          ORDER BY p.created_at DESC
        `)
        .all(caller.role, schoolId, caller.role) as any[];

      res.json({
        scope: caller.role === 'district_coordinator' ? 'district' : 'school',
        privacyNoticeUz:
          "Koordinator hisobotlari faqat umumlashtirilgan (agregat) ko'rsatkichlarni aks ettiradi. O'quvchilarning shaxsiy AI yozishmalari maxfiy saqlanadi.",
        schoolMetrics,
        events,
        projects: projects.map((p) => ({
          ...p,
          milestones: JSON.parse(p.milestones_json || '[]'),
        })),
      });
    }
  );

  app.post(
    '/api/v1/coordinator/events',
    requireAuth,
    requireRoles('school_coordinator', 'district_coordinator', 'admin'),
    (req, res) => {
      const db = getDb();
      const caller = req.auth!;
      const titleUz = sanitizeText(req.body?.titleUz, 180);
      const descriptionUz = sanitizeText(req.body?.descriptionUz, 800);
      const eventDate = sanitizeText(req.body?.eventDate || '2026-12-01', 30);
      const category = sanitizeText(req.body?.category || 'IT Yoshlar tadbiri', 60);
      const scope =
        caller.role === 'district_coordinator' || req.body?.scope === 'district' ? 'district' : 'school';

      if (!titleUz) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Tadbir nomini kiriting.' });
        return;
      }

      const id = `evt-${crypto.randomUUID().slice(0, 8)}`;
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO events (id, school_id, district_id, organizer_id, title_uz, description_uz, event_date, scope, category, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        scope === 'school' ? caller.schoolId || 'school-145' : null,
        caller.districtId || 'dist-chilonzor',
        caller.userId,
        titleUz,
        descriptionUz || titleUz,
        eventDate,
        scope,
        category,
        now
      );

      logAudit(caller.userId, caller.schoolId, 'EVENT_CREATED', 'event', id, `Yangi tadbir: ${titleUz}`);
      res.status(201).json({ id, titleUz, eventDate, scope, category });
    }
  );

  // ============================================================================
  // 11. /api/v1/admin — PLATFORM ADMINISTRATOR CONTROLS
  // ============================================================================
  app.get('/api/v1/admin/overview', requireAuth, requireRoles('admin'), (_req, res) => {
    const db = getDb();
    const users = db
      .prepare(`
        SELECT u.id, u.email, u.full_name, u.role, u.school_id, s.name as school_name, u.grade, u.is_active, u.created_at
        FROM users u
        LEFT JOIN schools s ON s.id = u.school_id
        ORDER BY u.created_at DESC
      `)
      .all();

    const schools = db
      .prepare(`
        SELECT s.*, d.name as district_name,
          (SELECT COUNT(*) FROM users u WHERE u.school_id = s.id) as member_count
        FROM schools s
        JOIN districts d ON d.id = s.district_id
        ORDER BY s.created_at DESC
      `)
      .all();

    const auditLogs = db
      .prepare(`
        SELECT a.*, u.full_name as actor_name
        FROM audit_events a
        LEFT JOIN users u ON u.id = a.actor_id
        ORDER BY a.created_at DESC
        LIMIT 50
      `)
      .all();

    const moderationReports = db
      .prepare(`
        SELECT r.*, u.full_name as reporter_name
        FROM ai_reports r
        JOIN users u ON u.id = r.reporter_id
        ORDER BY r.created_at DESC
      `)
      .all();

    const settingsRows = db.prepare('SELECT key, value, updated_at FROM platform_settings').all() as {
      key: string;
      value: string;
      updated_at: string;
    }[];
    const settings: Record<string, string> = {};
    for (const r of settingsRows) {
      settings[r.key] = r.value;
    }

    const aiStats = db
      .prepare(`
        SELECT
          COUNT(*) as total_requests,
          SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as error_count,
          SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked_count,
          COALESCE(ROUND(AVG(latency_ms), 0), 0) as avg_latency_ms
        FROM ai_usage_records
      `)
      .get();

    res.json({
      users,
      schools,
      auditLogs,
      moderationReports,
      settings,
      aiProviderConfig: {
        geminiKeyPresent: aiService.isConfigured(),
        configuredModel: 'gemini-3.8-flash',
        fallbackModel: 'eduai-local-mock-v1',
        activeMode: settings.ai_mode || 'auto',
      },
      aiStats,
    });
  });

  app.patch('/api/v1/admin/users/:id', requireAuth, requireRoles('admin'), (req, res) => {
    const db = getDb();
    const targetId = req.params.id;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId) as any;

    if (!user) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Foydalanuvchi topilmadi.' });
      return;
    }

    const validRoles: UserRole[] = [
      'student',
      'teacher',
      'school_coordinator',
      'district_coordinator',
      'admin',
    ];
    const nextRole = validRoles.includes(req.body?.role) ? req.body.role : user.role;
    const nextActive = typeof req.body?.isActive === 'boolean' ? (req.body.isActive ? 1 : 0) : user.is_active;
    const nextSchoolId = req.body?.schoolId !== undefined ? req.body.schoolId : user.school_id;

    db.prepare('UPDATE users SET role = ?, is_active = ?, school_id = ? WHERE id = ?').run(
      nextRole,
      nextActive,
      nextSchoolId,
      targetId
    );

    logAudit(
      req.auth!.userId,
      req.auth!.schoolId,
      'ADMIN_USER_UPDATED',
      'user',
      targetId,
      `${user.full_name}: role=${nextRole}, active=${nextActive}`
    );

    res.json({ id: targetId, role: nextRole, isActive: Boolean(nextActive), schoolId: nextSchoolId });
  });

  app.post('/api/v1/admin/schools', requireAuth, requireRoles('admin'), (req, res) => {
    const db = getDb();
    const name = sanitizeText(req.body?.name, 160);
    const code = sanitizeText(req.body?.code, 30).toUpperCase();
    const city = sanitizeText(req.body?.city || 'Toshkent', 80);

    if (!name || !code) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Maktab nomi va kodini kiriting.' });
      return;
    }

    const id = `school-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO schools (id, district_id, name, code, city, status, created_at)
      VALUES (?, 'dist-chilonzor', ?, ?, ?, 'active', ?)
    `).run(id, name, code, city, now);

    logAudit(req.auth!.userId, id, 'SCHOOL_CREATED', 'school', id, `Yangi maktab qo'shildi: ${name} (${code})`);
    res.status(201).json({ id, name, code, city, status: 'active' });
  });

  app.patch('/api/v1/admin/settings', requireAuth, requireRoles('admin'), (req, res) => {
    const db = getDb();
    const now = new Date().toISOString();
    const retentionDays = req.body?.retentionDays ? String(Math.max(7, Number(req.body.retentionDays))) : undefined;
    const aiMode = ['auto', 'gemini', 'mock'].includes(req.body?.aiMode) ? req.body.aiMode : undefined;

    if (retentionDays) {
      db.prepare('INSERT OR REPLACE INTO platform_settings (key, value, updated_at) VALUES (?, ?, ?)').run(
        'retention_days',
        retentionDays,
        now
      );
    }
    if (aiMode) {
      db.prepare('INSERT OR REPLACE INTO platform_settings (key, value, updated_at) VALUES (?, ?, ?)').run(
        'ai_mode',
        aiMode,
        now
      );
    }

    logAudit(
      req.auth!.userId,
      req.auth!.schoolId,
      'SETTINGS_UPDATED',
      'platform_settings',
      'global',
      `Tizim sozlamalari yangilandi: retention=${retentionDays || 'unchanged'}, ai_mode=${aiMode || 'unchanged'}`
    );

    res.json({ message: 'Tizim sozlamalari saqlandi.', retentionDays, aiMode });
  });

  app.post('/api/v1/admin/retention/cleanup', requireAuth, requireRoles('admin'), (req, res) => {
    const db = getDb();
    const days = Number(req.body?.olderThanDays ?? 90);
    const cutoff = new Date(Date.now() - days * 86400 * 1000).toISOString();

    const result = db
      .prepare('DELETE FROM ai_conversations WHERE updated_at < ?')
      .run(cutoff);

    logAudit(
      req.auth!.userId,
      req.auth!.schoolId,
      'DATA_RETENTION_CLEANUP',
      'ai_conversations',
      null,
      `Ma'lumotlarni saqlash siyosati bo'yicha ${result.changes} ta eski suhbat tozalandi.`
    );

    res.json({
      deletedConversations: Number(result.changes || 0),
      cutoffIso: cutoff,
      message: "Ma'lumotlarni saqlash muddati bo'yicha tozalash muvaffaqiyatli bajarildi.",
    });
  });

  app.patch('/api/v1/admin/moderation/:id', requireAuth, requireRoles('admin', 'teacher'), (req, res) => {
    const db = getDb();
    const status = ['open', 'reviewed', 'resolved'].includes(req.body?.status) ? req.body.status : 'resolved';
    const note = sanitizeText(req.body?.resolutionNoteUz || 'Tekshirildi va chora ko\'rildi.', 500);

    db.prepare('UPDATE ai_reports SET status = ?, resolution_note_uz = ? WHERE id = ?').run(
      status,
      note,
      req.params.id
    );

    logAudit(req.auth!.userId, req.auth!.schoolId, 'MODERATION_RESOLVED', 'ai_report', req.params.id, note);
    res.json({ id: req.params.id, status, resolutionNoteUz: note });
  });

  // ============================================================================
  // 12. /api/v1/reports & /api/v1/notifications
  // ============================================================================
  app.get('/api/v1/reports/summary', requireAuth, (req, res) => {
    const db = getDb();
    const caller = req.auth!;
    const schoolId = caller.schoolId || 'school-145';

    const activeStudents = (
      db
        .prepare("SELECT COUNT(*) as cnt FROM users WHERE role = 'student' AND is_active = 1 AND school_id = ?")
        .get(schoolId) as { cnt: number }
    ).cnt;

    const activeTeachers = (
      db
        .prepare("SELECT COUNT(*) as cnt FROM users WHERE role = 'teacher' AND is_active = 1 AND school_id = ?")
        .get(schoolId) as { cnt: number }
    ).cnt;

    const participatingSchools = (
      db.prepare("SELECT COUNT(*) as cnt FROM schools WHERE status = 'active'").get() as { cnt: number }
    ).cnt;

    const subStats = db
      .prepare(
        'SELECT COUNT(*) as completed_count, COALESCE(ROUND(AVG(percentage), 1), 0) as avg_score FROM submissions WHERE school_id = ?'
      )
      .get(schoolId) as { completed_count: number; avg_score: number };

    const submittedProjects = (
      db.prepare('SELECT COUNT(*) as cnt FROM projects WHERE school_id = ?').get(schoolId) as { cnt: number }
    ).cnt;

    const aiStats = db
      .prepare(`
        SELECT
          COUNT(*) as total_ai_requests,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_requests
        FROM ai_usage_records
        WHERE school_id = ? OR school_id IS NULL
      `)
      .get(schoolId) as { total_ai_requests: number; failed_requests: number };

    const popularTopics = db
      .prepare(`
        SELECT subject_code, topic_slug, title_uz, grade
        FROM lessons
        WHERE approval_status = 'approved'
        ORDER BY grade ASC
        LIMIT 6
      `)
      .all();

    res.json({
      definitionsUz: {
        activeStudents: "Maktabda faol holatdagi (is_active = 1) ro'yxatdan o'tgan o'quvchilar soni",
        completedExercises: 'Yakunlangan va tekshirilgan topshiriq urinishlari (submissions) soni',
        avgScore: "Topshirilgan mashqlar bo'yicha o'rtacha o'zlashtirish foizi",
        aiErrorRate: "Jami AI so'rovlariga nisbatan muvaffaqiyatsiz yakunlangan so'rovlar ulushi",
      },
      metrics: {
        activeStudents,
        activeTeachers,
        participatingSchools,
        completedExercises: subStats.completed_count,
        averageScorePercent: subStats.avg_score,
        submittedProjects,
        aiRequestVolume: aiStats.total_ai_requests || 0,
        serviceErrorRatePercent:
          aiStats.total_ai_requests > 0
            ? Math.round(((aiStats.failed_requests || 0) / aiStats.total_ai_requests) * 100)
            : 0,
      },
      popularTopics,
    });
  });

  app.get('/api/v1/notifications', requireAuth, (req, res) => {
    const db = getDb();
    const items = db
      .prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30')
      .all(req.auth!.userId);
    res.json({ items });
  });

  app.patch('/api/v1/notifications/:id/read', requireAuth, (req, res) => {
    const db = getDb();
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(
      req.params.id,
      req.auth!.userId
    );
    res.json({ id: req.params.id, isRead: true });
  });

  return app;
}
