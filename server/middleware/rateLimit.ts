import type { NextFunction, Request, Response } from "express";
import { ApiErrorCodes, sendApiError } from "./apiError.js";

type HitState = { count: number; windowStartMs: number };

/**
 * Simple fixed-window in-memory rate limiter.
 * Adequate for single-node / warm serverless isolates; not a distributed store.
 */
export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  name: string;
}) {
  const hits = new Map<string, HitState>();

  function clientKey(req: Request): string {
    const uid = (req as Request & { user?: { uid?: string } }).user?.uid;
    if (uid) return `${options.name}:uid:${uid}`;
    const forwarded = req.headers["x-forwarded-for"];
    const ip =
      (typeof forwarded === "string" && forwarded.split(",")[0]?.trim()) ||
      req.ip ||
      req.socket.remoteAddress ||
      "unknown";
    return `${options.name}:ip:${ip}`;
  }

  return function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
    const now = Date.now();
    const key = clientKey(req);
    const current = hits.get(key);

    if (!current || now - current.windowStartMs >= options.windowMs) {
      hits.set(key, { count: 1, windowStartMs: now });
      next();
      return;
    }

    if (current.count >= options.max) {
      const retryAfterSec = Math.ceil((options.windowMs - (now - current.windowStartMs)) / 1000);
      res.setHeader("Retry-After", String(Math.max(retryAfterSec, 1)));
      sendApiError(
        res,
        req,
        429,
        ApiErrorCodes.RATE_LIMITED,
        `Rate limit exceeded for ${options.name}. Try again shortly.`
      );
      return;
    }

    current.count += 1;
    hits.set(key, current);
    next();
  };
}

export const authGoogleRateLimit = createRateLimiter({
  name: "auth-google",
  windowMs: 15 * 60 * 1000,
  max: 20,
});

export const aiChatRateLimit = createRateLimiter({
  name: "ai-chat",
  windowMs: 60 * 1000,
  max: 20,
});

export const receiptScanRateLimit = createRateLimiter({
  name: "receipt-scan",
  windowMs: 60 * 1000,
  max: 10,
});

