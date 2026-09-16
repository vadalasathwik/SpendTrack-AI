import crypto from "crypto";
import type { ErrorRequestHandler, NextFunction, Request, Response } from "express";

export type ApiErrorBody = {
  error: string;
  code: string;
  requestId: string;
};

export const ApiErrorCodes = {
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  RATE_LIMITED: "RATE_LIMITED",
  PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",
  GOOGLE_ID_TOKEN_INVALID: "GOOGLE_ID_TOKEN_INVALID",
  SERVER_MISCONFIGURED: "SERVER_MISCONFIGURED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ApiErrorCode = (typeof ApiErrorCodes)[keyof typeof ApiErrorCodes];

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode | string;

  constructor(status: number, code: ApiErrorCode | string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export type RequestWithId = Request & { requestId?: string };

export function getRequestId(req: Request): string {
  const existing = (req as RequestWithId).requestId;
  if (existing) return existing;
  const headerId = req.header("x-request-id");
  if (headerId && headerId.trim()) return headerId.trim();
  return crypto.randomUUID();
}

export function sendApiError(
  res: Response,
  req: Request,
  status: number,
  code: ApiErrorCode | string,
  message: string
): Response {
  const requestId = getRequestId(req);
  res.setHeader("X-Request-Id", requestId);
  const body: ApiErrorBody = {
    error: message,
    code,
    requestId,
  };
  return res.status(status).json(body);
}

/** Attach a stable request id early in the pipeline. */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = getRequestId(req);
  (req as RequestWithId).requestId = requestId;
  res.setHeader("X-Request-Id", requestId);
  next();
}

export function handleRouteError(
  res: Response,
  req: Request,
  err: unknown,
  fallbackMessage: string,
  fallbackStatus = 500
): Response {
  if (err instanceof ApiError) {
    return sendApiError(res, req, err.status, err.code, err.message);
  }
  const anyErr = err as { message?: string };
  return sendApiError(
    res,
    req,
    fallbackStatus,
    fallbackStatus >= 500 ? ApiErrorCodes.INTERNAL_ERROR : ApiErrorCodes.BAD_REQUEST,
    anyErr?.message || fallbackMessage
  );
}

export const apiErrorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (res.headersSent) {
    return;
  }

  if (err && typeof err === "object" && (err as { type?: string }).type === "entity.too.large") {
    sendApiError(
      res,
      req,
      413,
      ApiErrorCodes.PAYLOAD_TOO_LARGE,
      "Request body too large"
    );
    return;
  }

  if (err instanceof ApiError) {
    sendApiError(res, req, err.status, err.code, err.message);
    return;
  }

  const message = err instanceof Error ? err.message : "Internal server error";
  console.error("Unhandled API error:", message);
  sendApiError(res, req, 500, ApiErrorCodes.INTERNAL_ERROR, "Internal server error");
};
