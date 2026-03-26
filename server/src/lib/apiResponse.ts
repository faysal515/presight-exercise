import type { Response } from "express";

export type ApiSuccessBody<T> = {
  success: true;
  data: T;
  meta: Record<string, unknown>;
};

export type ApiErrorBody = {
  success: false;
  error: {
    message: string;
    issues?: unknown;
  };
};

/**
 * Standard JSON success: `{ success, data, meta }`.
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  meta?: Record<string, unknown>
): Response {
  const body: ApiSuccessBody<T> = {
    success: true,
    data,
    meta: meta ?? {},
  };
  return res.status(200).json(body);
}

/**
 * Standard JSON error: `{ success: false, error: { message, issues? } }`.
 */
export function sendError(
  res: Response,
  status: number,
  message: string,
  issues?: unknown
): Response {
  const body: ApiErrorBody = {
    success: false,
    error:
      issues === undefined
        ? { message }
        : { message, issues },
  };
  return res.status(status).json(body);
}
