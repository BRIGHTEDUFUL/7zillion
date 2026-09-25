import { createServerFn } from "@tanstack/react-start";
import {
  deleteCookie,
  getCookie,
  getRequest,
  getRequestIP,
  setCookie,
} from "@tanstack/react-start/server";

import * as auth from "@/lib/auth";
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  changePasswordSchema,
  changeUsernameSchema,
  fail,
  loginSchema,
  type AuthResult,
} from "@/lib/auth-contract";

import { getApiEnv } from "./_internal";

/**
 * Every function here resolves to the shared `AuthResult` shape: `{ ok: true }`
 * or `{ ok: false, code, message }`. The client shows `message` and branches on
 * `code` — no redirects, thrown Responses or error-string matching.
 */

function getClientIp(): string {
  try {
    return getRequestIP({ xForwardedFor: true }) ?? "unknown";
  } catch {
    // Unit callers and non-request invocations do not always have a request
    // event.  The auth service can still use a stable bucket for those calls.
    return "unknown";
  }
}

/**
 * The session cookie is `Secure` whenever the request actually arrived over
 * HTTPS (directly or via a proxy reporting `x-forwarded-proto`). Plain-HTTP
 * origins (local or LAN previews) get a non-Secure cookie, which is what makes
 * those logins work at all instead of silently looping.
 */
function isSecureRequest(): boolean {
  try {
    const request = getRequest();
    if (request.url.startsWith("https:")) return true;
    const forwarded = request.headers.get("x-forwarded-proto");
    if (forwarded) return forwarded.split(",")[0]?.trim() === "https";
    return false;
  } catch {
    // No request context (unit/test calls) — keep the safe default.
    return true;
  }
}

function sessionCookieOptions(maxAgeSeconds?: number) {
  return {
    httpOnly: true,
    secure: isSecureRequest(),
    sameSite: "strict" as const,
    path: "/",
    ...(maxAgeSeconds !== undefined ? { maxAge: maxAgeSeconds } : {}),
  };
}

/** Read and validate the session cookie, or null when it is missing/expired. */
async function currentSession(context: unknown): Promise<{ username: string } | null> {
  const token = getCookie(SESSION_COOKIE_NAME);
  if (!token) return null;

  const session = await auth.validateSession(token, getApiEnv(context));
  return session.valid ? { username: session.username } : null;
}

export const loginFn = createServerFn({ method: "POST" })
  .validator(loginSchema)
  .handler(async ({ data, context }): Promise<AuthResult> => {
    const result = await auth.login(
      data.username,
      data.password,
      getClientIp(),
      getApiEnv(context),
    );

    if (!result.ok) return result;

    setCookie(SESSION_COOKIE_NAME, result.sessionToken, sessionCookieOptions(SESSION_TTL_SECONDS));
    return { ok: true };
  });

export const logoutFn = createServerFn({ method: "POST" }).handler(
  async ({ context }): Promise<AuthResult> => {
    const token = getCookie(SESSION_COOKIE_NAME);
    if (token) await auth.logout(token, getApiEnv(context));

    deleteCookie(SESSION_COOKIE_NAME, sessionCookieOptions());
    return { ok: true };
  },
);

/** Read the current admin session for route guards (beforeLoad). */
export const getSessionFn = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const session = await currentSession(context);
  if (!session) return null;
  return { username: session.username };
});

/**
 * Change the admin password from the Settings page. Requires a valid session;
 * the caller's current password is re-verified server-side before the new
 * hash is persisted to Convex.
 */
export const changePasswordFn = createServerFn({ method: "POST" })
  .validator(changePasswordSchema)
  .handler(async ({ data, context }): Promise<AuthResult> => {
    if (!(await currentSession(context))) return fail("session_expired");

    return auth.changePassword(
      data.currentPassword,
      data.newPassword,
      getClientIp(),
      getApiEnv(context),
    );
  });

/**
 * Change the admin username from the Settings page. Same bar as a password
 * change: a valid session plus re-verification of the current password. The
 * password hash is carried over untouched.
 */
export const changeUsernameFn = createServerFn({ method: "POST" })
  .validator(changeUsernameSchema)
  .handler(async ({ data, context }): Promise<AuthResult> => {
    if (!(await currentSession(context))) return fail("session_expired");

    return auth.changeUsername(
      data.username,
      data.currentPassword,
      getClientIp(),
      getApiEnv(context),
    );
  });
