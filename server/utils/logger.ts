import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  requestId: string;
  uid: string;
  method: string;
  route: string;
  statusCode?: number;
  durationMs?: number;
  message: string;
  error?: any;
  meta?: Record<string, any>;
}

// Sensitive key patterns to sanitize
const SENSITIVE_KEYS = [
  'authorization',
  'token',
  'jwt',
  'googletoken',
  'accesstoken',
  'refreshtoken',
  'gemini_api_key',
  'apikey',
  'key',
  'secret',
  'password',
];

/**
 * Sanitize object properties to prevent logging sensitive data
 */
export function sanitizeLogData(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    // Mask potential JWT tokens or Bearer tokens
    if (obj.toLowerCase().startsWith('bearer ') || obj.split('.').length === 3) {
      return '[REDACTED_TOKEN]';
    }
    return obj;
  }
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeLogData(item));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some((pattern) => lowerKey.includes(pattern))) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = sanitizeLogData(value);
    }
  }
  return sanitized;
}

export class ProductionLogger {
  private formatLog(entry: LogEntry): string {
    const sanitizedEntry = sanitizeLogData(entry);
    return JSON.stringify(sanitizedEntry);
  }

  public info(message: string, req?: Request, meta?: Record<string, any>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      requestId: (req as any)?.requestId || 'N/A',
      uid: (req as any)?.user?.uid || 'anonymous',
      method: req?.method || 'SYSTEM',
      route: req?.originalUrl || req?.path || 'N/A',
      message,
      meta,
    };
    console.log(this.formatLog(entry));
  }

  public warn(message: string, req?: Request, meta?: Record<string, any>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'WARN',
      requestId: (req as any)?.requestId || 'N/A',
      uid: (req as any)?.user?.uid || 'anonymous',
      method: req?.method || 'SYSTEM',
      route: req?.originalUrl || req?.path || 'N/A',
      message,
      meta,
    };
    console.warn(this.formatLog(entry));
  }

  public error(message: string, error?: any, req?: Request, meta?: Record<string, any>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      requestId: (req as any)?.requestId || 'N/A',
      uid: (req as any)?.user?.uid || 'anonymous',
      method: req?.method || 'SYSTEM',
      route: req?.originalUrl || req?.path || 'N/A',
      message,
      error: error?.message || error,
      meta,
    };
    console.error(this.formatLog(entry));
  }
}

export const logger = new ProductionLogger();

/**
 * Express Middleware attaching Request ID, calculating execution duration, and logging requests
 */
export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestId = (req.headers['x-request-id'] as string) || `req_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  (req as any).requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  const startTime = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const statusCode = res.statusCode;

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO',
      requestId,
      uid: (req as any)?.user?.uid || 'anonymous',
      method: req.method,
      route: req.originalUrl || req.path,
      statusCode,
      durationMs,
      message: `HTTP ${req.method} ${req.originalUrl || req.path} ${statusCode} - ${durationMs}ms`,
    };

    const formatted = JSON.stringify(sanitizeLogData(logEntry));

    if (statusCode >= 500) {
      console.error(formatted);
    } else if (statusCode >= 400) {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  });

  next();
}
