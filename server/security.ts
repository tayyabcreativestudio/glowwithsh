import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';

const SESSION_COOKIE = 'gwsh_admin_session';
const SESSION_TTL_SECONDS = 3600; // 1 hour session
const MAX_LOGIN_FAILURES = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minute lockout

type AdminLike = {
  id: string;
  email: string;
  name: string;
  role: string;
  username?: string;
};

type AttemptState = { failures: number; lockedUntil: number };
const loginAttempts = new Map<string, AttemptState>();

export function getAuthSecret(): string {
  const secret = process.env.ADMIN_AUTH_SECRET?.trim();
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret.length < 32) {
      throw new Error('FATAL: ADMIN_AUTH_SECRET must be set to at least 32 random characters in production.');
    }
    return secret;
  }
  // In development/test, provide an explicit fallback if unset
  return secret && secret.length >= 16 ? secret : 'dev_insecure_auth_secret_glowwithsh_minimum_32_chars_long';
}

export function requireConfiguredAuthSecret(): void {
  const secret = process.env.ADMIN_AUTH_SECRET?.trim();
  if (process.env.NODE_ENV === 'production' && (!secret || secret.length < 32)) {
    throw new Error('FATAL: ADMIN_AUTH_SECRET is required and must be at least 32 characters in production.');
  }

  const password = process.env.ADMIN_PASSWORD?.trim();
  if (process.env.NODE_ENV === 'production' && (!password || password.length < 12)) {
    throw new Error('FATAL: ADMIN_PASSWORD is required and must be at least 12 characters in production.');
  }

  const username = process.env.ADMIN_USERNAME?.trim();
  if (process.env.NODE_ENV === 'production' && (!username || !/^[A-Za-z0-9_.-]{3,100}$/.test(username))) {
    throw new Error('FATAL: ADMIN_USERNAME is required and must contain only letters, numbers, dots, hyphens, or underscores.');
  }

  const gstin = process.env.SITE_GSTIN?.trim().toUpperCase();
  if (process.env.NODE_ENV === 'production' && (!gstin || !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin))) {
    throw new Error('FATAL: SITE_GSTIN must be a valid registered GSTIN in production.');
  }
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url');
}

/**
 * Strong password hashing using Node crypto.scryptSync with high cost parameters.
 * Format: scrypt$N$r$p$salt$hashHex
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt}$${key.toString('hex')}`;
}

export function verifyPassword(password: string, encoded: string): boolean {
  try {
    if (!encoded || !password) return false;
    const parts = encoded.split('$');
    if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
    const [, nStr, rStr, pStr, salt, hashHex] = parts;
    const expected = Buffer.from(hashHex, 'hex');
    const actual = crypto.scryptSync(password, salt, expected.length, {
      N: Number(nStr),
      r: Number(rStr),
      p: Number(pStr),
    });
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/**
 * Creates a cryptographically unforgeable, signed session token.
 */
export function createSessionToken(user: AdminLike, tokenVersion: number): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = base64url(
    JSON.stringify({
      sub: user.id,
      role: user.role,
      iat: now,
      exp: now + SESSION_TTL_SECONDS,
      ver: tokenVersion,
    })
  );
  const signature = base64url(crypto.createHmac('sha256', getAuthSecret()).update(payload).digest());
  return `${payload}.${signature}`;
}

/**
 * Verifies the token signature, expiration, and checks against the current tokenVersion.
 */
export function verifySessionToken(
  token: string,
  currentTokenVersion: number
): { sub: string; role: string } | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return null;

    const expected = crypto.createHmac('sha256', getAuthSecret()).update(payload).digest();
    const actual = Buffer.from(signature, 'base64url');
    if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
      return null;
    }

    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      sub?: string;
      role?: string;
      exp?: number;
      ver?: number;
    };

    if (!parsed.sub || !parsed.role || !parsed.exp) return null;
    const now = Math.floor(Date.now() / 1000);
    if (parsed.exp < now) return null; // Expired
    if (parsed.ver !== currentTokenVersion) return null; // Invalidated by password change or logout

    return { sub: parsed.sub, role: parsed.role };
  } catch {
    return null;
  }
}

function parseCookies(header?: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!header) return result;
  for (const chunk of header.split(';')) {
    const index = chunk.indexOf('=');
    if (index <= 0) continue;
    const key = chunk.slice(0, index).trim();
    const value = chunk.slice(index + 1).trim();
    if (key) {
      try {
        result[key] = decodeURIComponent(value);
      } catch {
        result[key] = value;
      }
    }
  }
  return result;
}

export function getSessionToken(req: Request): string | null {
  const cookieToken = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (cookieToken) return cookieToken;
  const auth = req.headers.authorization || '';
  if (/^Bearer\s+/i.test(auth)) {
    return auth.slice(7).trim() || null;
  }
  return null;
}

export function setSessionCookie(res: Response, token: string): void {
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${SESSION_TTL_SECONDS}`,
  ];
  if (process.env.NODE_ENV === 'production') {
    parts.push('Secure');
  }
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearSessionCookie(res: Response): void {
  const parts = [
    `${SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    'Max-Age=0',
  ];
  if (process.env.NODE_ENV === 'production') {
    parts.push('Secure');
  }
  res.setHeader('Set-Cookie', parts.join('; '));
}

function attemptKey(req: Request, username: string): string {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  return `${ip}:${username.toLowerCase()}`;
}

export function checkLoginRateLimit(
  req: Request,
  username: string
): { allowed: boolean; retryAfterSeconds?: number } {
  const key = attemptKey(req, username);
  const state = loginAttempts.get(key);
  if (!state) return { allowed: true };

  const now = Date.now();
  if (state.lockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((state.lockedUntil - now) / 1000),
    };
  }

  // Clear expired lockout
  if (state.lockedUntil && state.lockedUntil <= now) {
    loginAttempts.delete(key);
  }
  return { allowed: true };
}

export function recordLoginFailure(req: Request, username: string): void {
  const key = attemptKey(req, username);
  const state = loginAttempts.get(key) || { failures: 0, lockedUntil: 0 };
  state.failures += 1;
  if (state.failures >= MAX_LOGIN_FAILURES) {
    state.lockedUntil = Date.now() + LOCKOUT_MS;
  }
  loginAttempts.set(key, state);
}

export function clearLoginFailures(req: Request, username: string): void {
  loginAttempts.delete(attemptKey(req, username));
}

/**
 * Cross-origin validation for sensitive admin mutation requests.
 */
export function csrfOriginCheck(req: Request, res: Response, next: NextFunction): void {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }
  const origin = req.headers.origin;
  if (!origin) return next();

  try {
    const requestOrigin = new URL(origin).origin;
    const hostHeader = req.get('host');
    if (!hostHeader) return next();
    
    const appOrigin = `${req.protocol}://${hostHeader}`;
    if (requestOrigin !== appOrigin && !requestOrigin.includes('localhost') && !requestOrigin.includes('127.0.0.1')) {
      res.status(403).json({ success: false, error: 'Cross-origin request blocked.' });
      return;
    }
  } catch {
    res.status(403).json({ success: false, error: 'Invalid origin header.' });
    return;
  }
  next();
}

/**
 * XSS sanitizer for user-submitted text inputs.
 */
export function sanitizeString(input: string): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\bon\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:[^\s"'>]*/gi, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}
