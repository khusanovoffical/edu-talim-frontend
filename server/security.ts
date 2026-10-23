import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

const SESSION_SECRET = process.env.EDUAI_SESSION_SECRET || 'eduai-dev-hmac-secret-key-2026-uzbekistan-pilot';

export type UserRole =
  | 'student'
  | 'teacher'
  | 'school_coordinator'
  | 'district_coordinator'
  | 'admin';

export interface SessionPayload {
  userId: string;
  role: UserRole;
  schoolId: string | null;
  districtId: string | null;
  csrfToken: string;
  exp: number;
}

/**
 * Hashes a plain-text password using scrypt with a 16-byte random salt.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

/**
 * Verifies a plain-text password against a stored scrypt hash using timingSafeEqual.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split('$');
    if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
    const [, salt, originalHash] = parts;
    const derived = crypto.scryptSync(password, salt, 64);
    const originalBuf = Buffer.from(originalHash, 'hex');
    if (derived.length !== originalBuf.length) return false;
    return crypto.timingSafeEqual(derived, originalBuf);
  } catch {
    return false;
  }
}

/**
 * Creates an HMAC-SHA256 signed session token with expiration and CSRF token.
 */
export function createSessionToken(payload: Omit<SessionPayload, 'exp' | 'csrfToken'>, ttlSeconds = 86400): {
  token: string;
  csrfToken: string;
  exp: number;
} {
  const csrfToken = crypto.randomBytes(16).toString('hex');
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const fullPayload: SessionPayload = { ...payload, csrfToken, exp };
  const data = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(data)
    .digest('base64url');
  return {
    token: `${data}.${signature}`,
    csrfToken,
    exp,
  };
}

/**
 * Verifies and decodes a signed session token.
 */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [data, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(data)
      .digest('base64url');
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as SessionPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Parses cookies from Cookie header.
 */
export function parseCookies(cookieHeader?: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const pair of cookieHeader.split(';')) {
    const idx = pair.indexOf('=');
    if (idx > 0) {
      const k = pair.slice(0, idx).trim();
      const v = pair.slice(idx + 1).trim();
      result[k] = decodeURIComponent(v);
    }
  }
  return result;
}

/**
 * In-memory sliding window rate limiter per key (e.g. IP or userId).
 */
export class RateLimiter {
  private hits = new Map<string, number[]>();

  constructor(private windowMs: number, private maxRequests: number) {}

  public check(key: string): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const timestamps = (this.hits.get(key) || []).filter((t) => t > windowStart);
    if (timestamps.length >= this.maxRequests) {
      const oldest = timestamps[0];
      const retryAfterSeconds = Math.max(1, Math.ceil((oldest + this.windowMs - now) / 1000));
      this.hits.set(key, timestamps);
      return { allowed: false, remaining: 0, retryAfterSeconds };
    }
    timestamps.push(now);
    this.hits.set(key, timestamps);
    return {
      allowed: true,
      remaining: Math.max(0, this.maxRequests - timestamps.length),
      retryAfterSeconds: 0,
    };
  }

  public reset(): void {
    this.hits.clear();
  }
}

export const authRateLimiter = new RateLimiter(60_000, 12); // Max 12 auth attempts per minute per IP/key
export const aiRateLimiter = new RateLimiter(60_000, 20);   // Max 20 AI requests per minute per user

/**
 * Sanitizes plain text input to prevent stored XSS payloads.
 */
export function sanitizeText(input: unknown, maxLength = 4000): string {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

/**
 * Checks if user prompt attempts prompt injection or unsafe topics for school-age students.
 */
export function moderateStudentInput(text: string): { safe: boolean; reasonUz?: string } {
  const lowered = text.toLowerCase();

  // Prompt injection / system override detection
  const injectionPatterns = [
    'ignore previous instructions',
    'ignore all instructions',
    'system prompt',
    'reveal hidden prompt',
    'tizim ko\'rsatmalarini unut',
    'yashirin promptni ko\'rsat',
    'act as an unrestricted',
    'jailbreak',
  ];
  for (const pat of injectionPatterns) {
    if (lowered.includes(pat)) {
      return {
        safe: false,
        reasonUz:
          "Kechirasiz, tizim xavfsizlik qoidalarini o'zgartirish yoki ichki ko'rsatmalarni so'rash mumkin emas. Keling, dars mavzusiga qaytamiz!",
      };
    }
  }

  // Harmful / violent / inappropriate content filter for school students
  const unsafePatterns = [
    'portlovchi modda',
    'qurol yasash',
    'bomb making',
    'self-harm',
    'o\'z joniga qasd',
    'porn',
    'qimor',
    'parolni buzish',
    'hack bank',
  ];
  for (const pat of unsafePatterns) {
    if (lowered.includes(pat)) {
      return {
        safe: false,
        reasonUz:
          "EduAI faqat maktab fanlari va xavfsiz texnologik ta'lim bo'yicha yordam beradi. Ushbu mavzu xavfsizlik qoidalariga zid. Zarur hollarda o'qituvchingizga murojaat qiling.",
      };
    }
  }

  // Personal sensitive data warning (passport, card numbers)
  if (/\b\d{16}\b/.test(text) || /\b[A-Z]{2}\d{7}\b/.test(text)) {
    return {
      safe: false,
      reasonUz:
        "Maxfiylik qoidasi: Iltimos, shaxsiy hujjat raqami yoki bank kartasi kabi maxfiy ma'lumotlarni chatga yozmang.",
    };
  }

  return { safe: true };
}

declare global {
  namespace Express {
    interface Request {
      auth?: SessionPayload;
    }
  }
}

export function extractAuth(req: Request): SessionPayload | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const verified = verifySessionToken(token);
    if (verified) return verified;
  }
  const cookies = parseCookies(req.headers.cookie);
  if (cookies.eduai_session) {
    return verifySessionToken(cookies.eduai_session);
  }
  return null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const session = extractAuth(req);
  if (!session) {
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: "Tizimga kirish talab etiladi. Iltimos, hisobingizga kiring.",
    });
    return;
  }
  // If authenticating via cookie on state-changing method, verify CSRF header if cookie is used without Bearer
  const cookies = parseCookies(req.headers.cookie);
  const usesCookieOnly = Boolean(cookies.eduai_session) && !req.headers.authorization;
  if (usesCookieOnly && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const csrfHeader = req.headers['x-csrf-token'];
    if (!csrfHeader || csrfHeader !== session.csrfToken) {
      res.status(403).json({
        error: 'CSRF_INVALID',
        message: "Xavfsizlik tokeni (CSRF) tasdiqlanmadi. Sahifani yangilang.",
      });
      return;
    }
  }
  req.auth = session;
  next();
}

export function requireRoles(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({
        error: 'UNAUTHORIZED',
        message: "Tizimga kirish talab etiladi.",
      });
      return;
    }
    if (!allowedRoles.includes(req.auth.role)) {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: "Sizda ushbu amalni bajarish uchun ruxsat yo'q.",
      });
      return;
    }
    next();
  };
}
