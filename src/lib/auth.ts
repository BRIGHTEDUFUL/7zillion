import "@tanstack/react-start/server-only";

import { compare, hash } from "bcryptjs";

import type { Env } from "@/lib/content-store";

export type { Env, EnvBindings } from "@/lib/content-store";

export const SESSION_COOKIE_NAME = "admin_session";
export const SESSION_TTL_SECONDS = 8 * 60 * 60;
export const SESSION_TTL_MS = SESSION_TTL_SECONDS * 1000;
export const RATE_LIMIT_MAX_REQUESTS = 10;
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const RATE_LIMIT_WINDOW_SECONDS = RATE_LIMIT_WINDOW_MS / 1000;

export type LoginResult =
  | { success: true; sessionToken: string }
  | { success: false; reason: "invalid_credentials" | "rate_limited" | "server_error" };

export type ChangePasswordResult =
  | { success: true }
  | {
      success: false;
      reason: "invalid_credentials" | "rate_limited" | "weak_password" | "server_error";
    };

export const MIN_PASSWORD_LENGTH = 8;

export type SessionValidation = { valid: true; username: string } | { valid: false };

// ──────────────────────────────────────────────────────────────────────────────
// Convex HTTP helpers
//
// Public queries → /api/query  (no auth header required)
// Internal mutations/queries → /api/mutation or /api/query
//   with Authorization: Convex <CONVEX_DEPLOY_KEY>
// ──────────────────────────────────────────────────────────────────────────────

function getConvexUrl(): string {
  const url = (typeof process !== "undefined" && process.env["CONVEX_URL"]) || "";
  if (!url) throw new Error("CONVEX_URL environment variable is not set.");
  return url;
}

function getConvexDeployKey(): string {
  const key = (typeof process !== "undefined" && process.env["CONVEX_DEPLOY_KEY"]) || "";
  if (!key) throw new Error("CONVEX_DEPLOY_KEY environment variable is not set.");
  return key;
}

/** Call a public Convex query (no auth required). */
async function convexQuery(fn: string, args: Record<string, unknown> = {}): Promise<unknown> {
  const res = await fetch(`${getConvexUrl()}/api/query`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ path: fn, args }),
  });
  if (!res.ok) throw new Error(`Convex query "${fn}" failed (${res.status})`);
  const json = (await res.json()) as { value?: unknown; errorMessage?: string };
  if (json.errorMessage) throw new Error(`Convex query "${fn}": ${json.errorMessage}`);
  return json.value;
}

/** Call an internal Convex query (requires deploy key). */
async function convexInternalQuery(
  fn: string,
  args: Record<string, unknown> = {},
): Promise<unknown> {
  const res = await fetch(`${getConvexUrl()}/api/query`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Convex ${getConvexDeployKey()}`,
    },
    body: JSON.stringify({ path: fn, args }),
  });
  if (!res.ok) throw new Error(`Convex internal query "${fn}" failed (${res.status})`);
  const json = (await res.json()) as { value?: unknown; errorMessage?: string };
  if (json.errorMessage) throw new Error(`Convex internal query "${fn}": ${json.errorMessage}`);
  return json.value;
}

/** Call an internal Convex mutation (requires deploy key). */
async function convexInternalMutation(
  fn: string,
  args: Record<string, unknown> = {},
): Promise<unknown> {
  const res = await fetch(`${getConvexUrl()}/api/mutation`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Convex ${getConvexDeployKey()}`,
    },
    body: JSON.stringify({ path: fn, args }),
  });
  if (!res.ok) throw new Error(`Convex internal mutation "${fn}" failed (${res.status})`);
  const json = (await res.json()) as { value?: unknown; errorMessage?: string };
  if (json.errorMessage) throw new Error(`Convex internal mutation "${fn}": ${json.errorMessage}`);
  return json.value;
}

// ──────────────────────────────────────────────────────────────────────────────
// Session helpers — key/value helpers kept for test compatibility
// ──────────────────────────────────────────────────────────────────────────────

export function sessionKey(token: string): string {
  return `session:${token}`;
}

export function rateLimitKey(ip: string, window: number): string {
  return `rl:${ip}:${window}`;
}

// ──────────────────────────────────────────────────────────────────────────────
// login
// ──────────────────────────────────────────────────────────────────────────────

type EffectiveCredentials = { username: string; passwordHash: string };

/**
 * Resolve the admin credentials that are currently in effect.
 *
 * A password changed from the admin panel (Admin → Settings) is stored in the
 * Convex `adminCredentials` singleton and overrides the env values; the env
 * pair (ADMIN_USERNAME / ADMIN_PASSWORD_HASH) remains the bootstrap fallback
 * when no override exists — or when Convex is unreachable, so an outage never
 * locks the admin out of their own panel.
 */
async function effectiveCredentials(env: Env): Promise<EffectiveCredentials> {
  try {
    const row = await convexInternalQuery("auth:getAdminCredentials");
    if (
      isRecord(row) &&
      typeof row["passwordHash"] === "string" &&
      row["passwordHash"].length > 0
    ) {
      return {
        username:
          typeof row["username"] === "string" && row["username"].length > 0
            ? row["username"]
            : env.ADMIN_USERNAME,
        passwordHash: row["passwordHash"],
      };
    }
  } catch {
    // Fall through to the env bootstrap credentials.
  }
  return { username: env.ADMIN_USERNAME, passwordHash: env.ADMIN_PASSWORD_HASH };
}

/**
 * Authenticate one administrator login attempt.
 * Rate-limit check happens before bcrypt so an attacker cannot use expensive
 * comparisons to bypass the per-IP limit.
 */
export async function login(
  username: string,
  password: string,
  ip: string,
  env: Env,
): Promise<LoginResult> {
  const allowed = await checkRateLimit(ip, env);
  if (!allowed) {
    return { success: false, reason: "rate_limited" };
  }

  const creds = await effectiveCredentials(env);
  let passwordMatches = false;

  if (
    typeof password === "string" &&
    typeof creds.passwordHash === "string" &&
    creds.passwordHash.length > 0
  ) {
    try {
      passwordMatches = await compare(password, creds.passwordHash);
    } catch {
      passwordMatches = false;
    }
  }

  const usernameMatches = typeof username === "string" && username === creds.username;

  if (!usernameMatches || !passwordMatches) {
    return { success: false, reason: "invalid_credentials" };
  }

  const sessionToken = crypto.randomUUID();

  try {
    await convexInternalMutation("auth:createSession", {
      token: sessionToken,
      username: creds.username,
    });
  } catch (error) {
    console.error("Failed to persist session:", error);
    // Return a distinct reason so the caller can show an appropriate message
    // (not "wrong password" when the real problem is a server-side error).
    return { success: false, reason: "server_error" };
  }

  return { success: true, sessionToken };
}

// ──────────────────────────────────────────────────────────────────────────────
// changePassword
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Change the admin password from an authenticated session.
 *
 * Verifies the current password against the effective credentials, enforces a
 * minimum length, then persists the new bcrypt hash to the Convex
 * `adminCredentials` singleton so it survives restarts and redeploys (the env
 * hash stays untouched as the bootstrap value).
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
  ip: string,
  env: Env,
): Promise<ChangePasswordResult> {
  const allowed = await checkRateLimit(ip, env);
  if (!allowed) {
    return { success: false, reason: "rate_limited" };
  }

  const creds = await effectiveCredentials(env);

  let currentMatches = false;
  if (typeof currentPassword === "string" && creds.passwordHash.length > 0) {
    try {
      currentMatches = await compare(currentPassword, creds.passwordHash);
    } catch {
      currentMatches = false;
    }
  }
  if (!currentMatches) {
    return { success: false, reason: "invalid_credentials" };
  }

  if (typeof newPassword !== "string" || newPassword.length < MIN_PASSWORD_LENGTH) {
    return { success: false, reason: "weak_password" };
  }

  try {
    const passwordHash = await hash(newPassword, 10);
    await convexInternalMutation("auth:setAdminCredentials", {
      username: creds.username,
      passwordHash,
    });
  } catch (error) {
    console.error("Failed to persist new password:", error);
    return { success: false, reason: "server_error" };
  }

  return { success: true };
}

// ──────────────────────────────────────────────────────────────────────────────
// logout
// ──────────────────────────────────────────────────────────────────────────────

export async function logout(sessionToken: string, _env: Env): Promise<void> {
  if (!sessionToken) return;
  try {
    await convexInternalMutation("auth:deleteSession", { token: sessionToken });
  } catch (error) {
    // Logout is idempotent — ignore errors
    console.error("logout:", error);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// validateSession
// ──────────────────────────────────────────────────────────────────────────────

export async function validateSession(
  sessionToken: string | undefined,
  _env: Env,
): Promise<SessionValidation> {
  if (!sessionToken) return { valid: false };

  let row: unknown;
  try {
    row = await convexInternalQuery("auth:getSession", { token: sessionToken });
  } catch {
    return { valid: false };
  }

  if (!row || !isRecord(row)) return { valid: false };

  // Check expiry
  const expiresAt = row["expiresAt"];
  if (typeof expiresAt === "string" && new Date(expiresAt).getTime() < Date.now()) {
    // Clean up stale session fire-and-forget
    void convexInternalMutation("auth:deleteSession", { token: sessionToken }).catch(
      () => undefined,
    );
    return { valid: false };
  }

  const username = row["username"];
  if (typeof username !== "string") return { valid: false };

  return { valid: true, username };
}

// ──────────────────────────────────────────────────────────────────────────────
// checkRateLimit
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Count one attempt for an IP in the current 15-minute window.
 * Returns true when the attempt is allowed, false when blocked.
 */
export async function checkRateLimit(ip: string, _env: Env): Promise<boolean> {
  const window = Math.floor(Date.now() / RATE_LIMIT_WINDOW_MS);
  const key = rateLimitKey(ip, window);

  try {
    const result = (await convexInternalMutation("auth:checkAndIncrementRateLimit", { key })) as {
      allowed: boolean;
      count: number;
    };
    return result.allowed;
  } catch (error) {
    // On error, fail open (allow) so a Convex outage doesn't lock out the admin.
    // Note: this is a known trade-off — a Convex outage bypasses rate limiting.
    console.error("checkRateLimit:", error);
    return true;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
