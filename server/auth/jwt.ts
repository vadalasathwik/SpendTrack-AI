import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'spendtrack_prod_jwt_secret_key_2026';

export interface JWTUserPayload {
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
}

export interface JWTWorkspacePayload {
  spreadsheetId: string;
  driveFolderId: string;
  calendarId: string;
}

export interface JWTPayload {
  user: JWTUserPayload;
  workspace: JWTWorkspacePayload;
  googleToken?: string;
  iat: number;
  exp: number;
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
export function signJWT(payloadData: Record<string, any>, expiresInSeconds: number = 7 * 24 * 3600): string {
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

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
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

  const expectedSignature = base64UrlEncode(
    crypto.createHmac('sha256', JWT_SECRET).update(dataToSign).digest()
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
    const requestId = (req as any)?.requestId || (res.getHeader('X-Request-Id') as string) || 'N/A';
    return res.status(401).json({
      error: 'Unauthorized: Missing or invalid Bearer JWT.',
      requestId,
      timestamp: new Date().toISOString(),
    });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = verifyJWT(token);
    (req as any).user = decoded.user;
    (req as any).workspace = decoded.workspace;
    if (decoded.googleToken) {
      (req as any).googleToken = decoded.googleToken;
    }
    next();
  } catch (err: any) {
    const requestId = (req as any)?.requestId || (res.getHeader('X-Request-Id') as string) || 'N/A';
    return res.status(401).json({
      error: `Unauthorized: ${err.message || 'Invalid authentication token.'}`,
      requestId,
      timestamp: new Date().toISOString(),
    });
  }
}
