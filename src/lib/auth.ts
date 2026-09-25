import "@tanstack/react-start/server-only";

import { compare, hash } from "bcryptjs";

import type { Env } from "@/lib/content-store";
import {
  MAX_USERNAME_LENGTH,
  MIN_PASSWORD_LENGTH,
  MIN_USERNAME_LENGTH,
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW_MS,
  fail,
  type AuthFailure,
  type AuthResult,
} from "@/lib/auth-contract";

export type { Env, EnvBindings } from "@/lib/content-store";

// Shared rules live once in the auth contract; re-exported here so server
// code and tests can keep importing them from the auth service.
export {
  MAX_USERNAME_LENGTH,
  MIN_PASSWORD_LENGTH,
  MIN_USERNAME_LENGTH,
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW_MS,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
  SESSION_TTL_SECONDS,
} from "@/lib/auth-contract";

export type SessionValidation = { valid: true; username: string } | { valid: false };

/** Sign-in outcome. The raw session token never leaves the server layer. */
export type LoginResult = { ok: true; sessionToken: string } | AuthFailure;

// ──────────────────────────────────────────────────────────────────────────────
// Convex HTTP helpers — internal queries/mutations require the deploy key, so
// they are not reachable through Convex's public HTTP API.
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
// Effective credentials
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

// ──────────────────────────────────────────────────────────────────────────────
// login
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Authenticate one administrator login attempt.
 *
 * The per-IP limit is checked before any bcrypt work, so a blocked IP never
 * gets to spend expensive comparisons — but only a *failed* attempt is counted
 * (`recordFailedAttempt`), which keeps a run of successful sign-ins from ever
 * locking the real admin out of the panel.
 */
export async function login(
  username: string,
  password: string,
  ip: string,
  env: Env,
): Promise<LoginResult> {
  if (!checkRateLimit(ip)) {
    return fail("rate_limited");
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
    recordFailedAttempt(ip);
    return fail("invalid_credentials");
  }

  const sessionToken = crypto.randomUUID();

  try {
    await convexInternalMutation("auth:createSession", {
      token: sessionToken,
      username: creds.username,
    });
  } catch (error) {
    console.error("Failed to persist session:", error);
    return fail("server_error");
  }

  return { ok: true, sessionToken };
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
): Promise<AuthResult> {
  if (!checkRateLimit(ip)) {
    return fail("rate_limited");
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
    recordFailedAttempt(ip);
    return fail("wrong_password");
  }

  if (typeof newPassword !== "string" || newPassword.length < MIN_PASSWORD_LENGTH) {
    return fail("weak_password");
  }

  try {
    const passwordHash = await hash(newPassword, 10);
    await convexInternalMutation("auth:setAdminCredentials", {
      username: creds.username,
      passwordHash,
    });
  } catch (error) {
    console.error("Failed to persist new password:", error);
    return fail("server_error");
  }

  return { ok: true };
}

// ──────────────────────────────────────────────────────────────────────────────
// changeUsername
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Change the admin username from an authenticated session.
 *
 * The current password must be re-verified first (same bar as a password
 * change), then the new username is persisted to the Convex
 * `adminCredentials` singleton alongside the *existing* password hash — a
 * username change never touches the password itself. Existing sessions keep
 * working; the new name is used from the next sign-in.
 */
export async function changeUsername(
  newUsername: string,
  currentPassword: string,
  ip: string,
  env: Env,
): Promise<AuthResult> {
  if (!checkRateLimit(ip)) {
    return fail("rate_limited");
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
    recordFailedAttempt(ip);
    return fail("wrong_password");
  }

  const username = typeof newUsername === "string" ? newUsername.trim() : "";
  if (username.length < MIN_USERNAME_LENGTH || username.length > MAX_USERNAME_LENGTH) {
    return fail("invalid_username");
  }

  try {
    await convexInternalMutation("auth:setAdminCredentials", {
      username,
      passwordHash: creds.passwordHash,
    });
  } catch (error) {
    console.error("Failed to persist new username:", error);
    return fail("server_error");
  }

  return { ok: true };
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
// Rate limiting
//
// Failed credential attempts only, held in this process. The server runs as a
// single Node instance, so one Map is the whole store: no network round-trips,
// nothing to deploy, nothing that can fail open. The map is swept on every
// call (entries die with their window) and hard-capped so a flood of spoofed
// client IPs cannot grow it without bound.
// ──────────────────────────────────────────────────────────────────────────────

type RateEntry = { count: number; expiresAt: number };

const failedAttempts = new Map<string, RateEntry>();

/** Pressure valve: beyond this many tracked IPs the counters are dropped. */
const MAX_TRACKED_IPS = 5_000;

function sweep(now: number): void {
  if (failedAttempts.size === 0) return;
  for (const [ip, entry] of failedAttempts) {
    if (entry.expiresAt <= now) failedAttempts.delete(ip);
  }
  if (failedAttempts.size > MAX_TRACKED_IPS) failedAttempts.clear();
}

function windowExpiry(now: number): number {
  return Math.ceil(now / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS;
}

/**
 * Is this IP currently allowed to attempt a sign-in?
 *
 * Read-only: asking never spends the budget, so legitimate use (successful
 * logins, Settings updates) cannot lock the admin out. Failures are counted
 * separately by `recordFailedAttempt`.
 */
export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  sweep(now);
  return (failedAttempts.get(ip)?.count ?? 0) < RATE_LIMIT_MAX_REQUESTS;
}

/**
 * Count one failed credential attempt for this IP. Returns false once the IP
 * is over the cap. Called only after credentials were rejected, which is what
 * makes the limit a brake on brute force instead of a brake on the real admin.
 */
export function recordFailedAttempt(ip: string): boolean {
  const now = Date.now();
  sweep(now);

  const entry = failedAttempts.get(ip);
  if (!entry) {
    failedAttempts.set(ip, { count: 1, expiresAt: windowExpiry(now) });
    return true;
  }

  entry.count += 1;
  return entry.count <= RATE_LIMIT_MAX_REQUESTS;
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
