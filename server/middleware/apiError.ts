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
  GOOGLE_AUTH_REQUIRED: "GOOGLE_AUTH_REQUIRED",
  GOOGLE_AUTH_INVALID: "GOOGLE_AUTH_INVALID",
  GOOGLE_ID_TOKEN_INVALID: "GOOGLE_ID_TOKEN_INVALID",
  SERVER_MISCONFIGURED: "SERVER_MISCONFIGURED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  UPSTREAM_ERROR: "UPSTREAM_ERROR",
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

export function requireGoogleAccessToken(req: Request): string {
  const user = (req as Request & { user?: unknown }).user;
  const googleToken = (req as Request & { googleToken?: string }).googleToken;
  if (!user || !googleToken) {
    throw new ApiError(
      401,
      ApiErrorCodes.GOOGLE_AUTH_REQUIRED,
      "Unauthorized: Google authentication required"
    );
  }
  return googleToken;
}

export function mapGoogleUpstreamError(err: unknown, fallbackMessage: string): ApiError {
  const anyErr = err as { status?: number; message?: string };
  const message = anyErr?.message || fallbackMessage;
  if (
    anyErr?.status === 401 ||
    (typeof message === "string" && message.toLowerCase().includes("authentication credentials"))
  ) {
    return new ApiError(
      401,
      ApiErrorCodes.GOOGLE_AUTH_INVALID,
      "Unauthorized: Invalid Google authentication token"
    );
  }
  const status = typeof anyErr?.status === "number" && anyErr.status >= 400 && anyErr.status < 600
    ? anyErr.status
    : 500;
  return new ApiError(
    status >= 500 ? 500 : status,
    status >= 500 ? ApiErrorCodes.UPSTREAM_ERROR : ApiErrorCodes.BAD_REQUEST,
    message || fallbackMessage
  );
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
  const mapped = mapGoogleUpstreamError(err, fallbackMessage);
  if (mapped.code === ApiErrorCodes.GOOGLE_AUTH_INVALID) {
    return sendApiError(res, req, mapped.status, mapped.code, mapped.message);
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

  // express body-parser payload too large
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
