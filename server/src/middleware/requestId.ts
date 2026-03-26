import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { requestContext } from "../requestContext.js";

const HEADER = 'x-request-id';
const MAX_LEN = 128;

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const raw = req.headers[HEADER];
  const headerId = Array.isArray(raw) ? raw[0] : raw;
  const requestId =
    typeof headerId === 'string' && headerId.trim() !== ''
      ? headerId.trim().slice(0, MAX_LEN)
      : randomUUID();

  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  requestContext.run({ requestId }, () => {
    next();
  });
}
