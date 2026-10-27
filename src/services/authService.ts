import crypto from 'crypto';
import { User } from '../types';

// Production must provide a unique secret; the fallback is only for local development.
const SECRET_KEY = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'local-development-only-change-this-secret');

/**
 * Hash password using PBKDF2 with 100,000 iterations of SHA-512 and random salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify plaintext password against stored salt:hash string
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;
    const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Create a signed session token containing user payload and expiration (7 days)
 */
export function createSessionToken(user: User): string {
  if (!SECRET_KEY) throw new Error('JWT_SECRET must be configured before issuing sessions in production.');
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.full_name,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
}

/**
 * Verify and decode session token
 */
export function verifySessionToken(token: string): { userId: string; email: string; role: 'user' | 'admin'; name: string } | null {
  if (!SECRET_KEY) return null;
  try {
    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) return null;

    const expectedSig = crypto.createHmac('sha256', SECRET_KEY).update(encodedPayload).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}
