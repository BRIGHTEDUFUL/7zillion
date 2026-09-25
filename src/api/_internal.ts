import type { Env } from "@/lib/content-store";
import { getContentStore } from "@/lib/content-store";
import { DuplicateSlugError } from "@/lib/content-store";

/**
 * With Convex + Node, there are no Cloudflare bindings.  The "env" is simply
 * the Node process environment, so ADMIN_USERNAME and ADMIN_PASSWORD_HASH are
 * read from process.env.
 *
 * The context parameter is kept for API compatibility with server function
 * handlers that pass `context` — we just ignore it now.
 */
export function getApiEnv(_context?: unknown): Env {
  return {
    ADMIN_USERNAME: process.env["ADMIN_USERNAME"] ?? "",
    ADMIN_PASSWORD_HASH: process.env["ADMIN_PASSWORD_HASH"] ?? "",
  };
}

export function getApiStore(_context?: unknown) {
  return getContentStore();
}

export type { Env as ContentEnv };

/**
 * Content-store implementations use a typed duplicate-slug exception.
 * The name/code checks keep the API resilient to exceptions crossing module
 * boundaries.
 */
export function isDuplicateSlugError(
  error: unknown,
  ErrorType?: abstract new (...args: never[]) => Error,
): boolean {
  if (ErrorType && error instanceof ErrorType) return true;
  if (error instanceof DuplicateSlugError) return true;
  if (!isRecord(error)) return false;
  return (
    error["name"] === "DuplicateSlugError" ||
    error["code"] === "DUPLICATE_SLUG" ||
    error["code"] === "duplicate_slug"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
