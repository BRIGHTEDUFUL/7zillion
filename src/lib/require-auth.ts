import "@tanstack/react-start/server-only";

import { redirect } from "@tanstack/react-router";
import { getRequest } from "@tanstack/react-start/server";

import { SESSION_COOKIE_NAME, validateSession, type Env, type SessionValidation } from "@/lib/auth";

export type AuthRequestContext = unknown;

/**
 * Require an authenticated admin session.  Throws a redirect to /admin/login
 * when the session is missing or invalid.
 *
 * With Convex + Node, the env is just { ADMIN_USERNAME, ADMIN_PASSWORD_HASH }
 * read from process.env — no Cloudflare bindings required.
 */
export async function requireAuth(
  context?: AuthRequestContext,
  explicitEnv?: Env,
): Promise<SessionValidation> {
  const env = explicitEnv ?? buildNodeEnv();
  const token = getSessionToken(context);

  if (!token) {
    throw redirect({ to: "/admin/login" as never });
  }

  const session = await validateSession(token, env);
  if (!session.valid) {
    throw redirect({ to: "/admin/login" as never });
  }

  return session;
}

/** Build the minimal Env from Node process.env. */
function buildNodeEnv(): Env {
  return {
    ADMIN_USERNAME: (typeof process !== "undefined" && process.env["ADMIN_USERNAME"]) || "",
    ADMIN_PASSWORD_HASH:
      (typeof process !== "undefined" && process.env["ADMIN_PASSWORD_HASH"]) || "",
  };
}

/** Read the admin session cookie from TanStack Start's request context. */
export function getSessionToken(context?: AuthRequestContext): string | undefined {
  const request = resolveRequest(context);
  const cookieHeader = requestCookieHeader(request) ?? contextCookieHeader(context);
  if (!cookieHeader) return undefined;

  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;

    const name = part.slice(0, separator).trim();
    if (name !== SESSION_COOKIE_NAME) continue;

    let value = part.slice(separator + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }

    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  return undefined;
}

function resolveRequest(context: unknown): Request | undefined {
  if (isRequestLike(context)) return context as Request;
  if (!isRecord(context)) return undefined;

  const contextRequest = context["request"];
  if (isRequestLike(contextRequest)) return contextRequest as Request;

  const nestedContext = context["context"];
  if (isRecord(nestedContext) && isRequestLike(nestedContext["request"])) {
    return nestedContext["request"] as Request;
  }

  try {
    return getRequest();
  } catch {
    return undefined;
  }
}

function requestCookieHeader(request: Request | undefined): string | null {
  return request?.headers.get("cookie") ?? null;
}

function contextCookieHeader(context: unknown): string | null {
  if (!isRecord(context)) return null;

  const headers = context["headers"];
  if (headers instanceof Headers) return headers.get("cookie");
  if (isRecord(headers) && typeof headers["get"] === "function") {
    const value = (headers["get"] as (name: string) => unknown).call(headers, "cookie");
    return typeof value === "string" ? value : null;
  }

  const nestedContext = context["context"];
  if (isRecord(nestedContext)) return contextCookieHeader(nestedContext);

  return null;
}

function isRequestLike(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const headers = value["headers"];
  return isRecord(headers) && typeof headers["get"] === "function";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
