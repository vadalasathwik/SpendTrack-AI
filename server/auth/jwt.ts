import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { ApiErrorCodes, sendApiError } from '../middleware/apiError.js';

export interface JWTUserPayload {
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
}

export interface JWTPayload {
  user: JWTUserPayload;
  iat: number;
  exp: number;
}

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
}

/**
 * Resolves JWT_SECRET. In production (NODE_ENV=production or VERCEL set),
 * a missing secret fails loudly so the server cannot start with a hardcoded key.
 * Local/dev may use an obvious non-production fallback if unset.
 */
export function getJwtSecret(): string {
  const secret = (process.env.JWT_SECRET || '').trim();
  if (secret) {
    return secret;
  }
  if (isProductionRuntime()) {
    throw new Error(
      'JWT_SECRET environment variable is required in production. Set JWT_SECRET before starting the server.'
    );
  }
  return 'spendtrack_dev_only_jwt_secret';
}

/** Call during app startup so missing production secrets fail immediately. */
export function assertJwtSecretConfigured(): void {
  getJwtSecret();
}

/**
 * Base64URL encoding helper
 */
function base64UrlEncode(str: string | Buffer): string {
  const base64 = typeof str === 'string' ? Buffer.from(str).toString('base64') : str.toString('base64');
  return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

/**
 * Base64URL decoding helper
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Signs a JWT using HMAC-SHA256
 */
export function signJWT(payloadData: Record<string, unknown>, expiresInSeconds: number = 7 * 24 * 3600): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    ...payloadData,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;
  const jwtSecret = getJwtSecret();

  const signature = crypto
    .createHmac('sha256', jwtSecret)
    .update(dataToSign)
    .digest();

  const encodedSignature = base64UrlEncode(signature);
  return `${dataToSign}.${encodedSignature}`;
}

/**
 * Verifies a JWT token signature and expiration
 */
export function verifyJWT(token: string): JWTPayload {
  if (!token || typeof token !== 'string') {
    throw new Error('JWT token is required.');
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format.');
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const dataToSign = `${encodedHeader}.${encodedPayload}`;
  const jwtSecret = getJwtSecret();

  const expectedSignature = base64UrlEncode(
    crypto.createHmac('sha256', jwtSecret).update(dataToSign).digest()
  );

  // Timing safe equal comparison for signatures
  const sigBuffer = Buffer.from(encodedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    throw new Error('Invalid JWT signature.');
  }

  const payload: JWTPayload = JSON.parse(base64UrlDecode(encodedPayload));
  const now = Math.floor(Date.now() / 1000);

  if (payload.exp && payload.exp < now) {
    throw new Error('JWT token has expired.');
  }

  return payload;
}

/**
 * Middleware to protect API routes with JWT verification
 */
export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  // Public non-API routes (e.g. /, static assets) or public auth/health endpoints bypass JWT check
  const reqPath = req.path || req.originalUrl || '';
  if (
    !reqPath.startsWith('/api/') ||
    reqPath.startsWith('/api/auth/') ||
    reqPath === '/api/health'
  ) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendApiError(
      res,
      req,
      401,
      ApiErrorCodes.UNAUTHORIZED,
      'Unauthorized: Missing or invalid Bearer JWT.'
    );
  }

  const token = authHeader.substring(7);

  try {
    const decoded = verifyJWT(token);
    (req as any).user = decoded.user;
    next();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid authentication token.';
    return sendApiError(
      res,
      req,
      401,
      ApiErrorCodes.UNAUTHORIZED,
      `Unauthorized: ${message}`
    );
  }
}
