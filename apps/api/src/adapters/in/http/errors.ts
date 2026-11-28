import type { ApiError } from "@firstreach/contracts";
import type { Context } from "hono";
import { ForbiddenError, NotFoundError, UpstreamError } from "../../../application/errors.js";
import { DomainValidationError } from "../../../domain/errors.js";

type Status = 400 | 401 | 403 | 404 | 502 | 500;

/** Thrown inside routes for malformed requests (wrong JSON shape, bad id, …). */
export class BadRequestError extends Error {
  constructor(message: string, readonly fields: Record<string, string> = {}) {
    super(message);
  }
}

/** No valid session. Sign-in is an HTTP concern, so this error lives in the adapter. */
export class UnauthenticatedError extends Error {
  constructor(message = "Sign in to continue.") {
    super(message);
  }
}

const toApiError = (error: unknown): [Status, ApiError] => {
  if (error instanceof DomainValidationError || error instanceof BadRequestError)
    return [400, { error: { code: "validation_failed", message: error.message, fields: error.fields } }];
  if (error instanceof UnauthenticatedError) return [401, { error: { code: "unauthenticated", message: error.message } }];
  if (error instanceof ForbiddenError) return [403, { error: { code: "forbidden", message: error.message } }];
  if (error instanceof NotFoundError) return [404, { error: { code: "not_found", message: error.message } }];
  if (error instanceof UpstreamError) return [502, { error: { code: "upstream_failed", message: error.message } }];
  return [500, { error: { code: "internal", message: "Something went wrong on our side." } }];
};

export const handleError = (error: unknown, c: Context) => {
  const [status, body] = toApiError(error);
  if (status === 500 || status === 502) console.error(error);
  return c.json(body, status);
};
