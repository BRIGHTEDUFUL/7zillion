/**
 * Feature: admin-panel
 * Task 2.2 — Auth_Service unit tests
 *
 * Tests cover the in-process rate limit, validateSession, the login /
 * Settings results, and the shared error contract the frontend renders.
 *
 * auth.ts talks to Convex over HTTP (CONVEX_URL + CONVEX_DEPLOY_KEY), so these
 * tests stub global `fetch` with an in-memory implementation that mirrors the
 * mutations/queries in convex/auth.ts. That keeps the real auth logic under
 * test instead of mocking it away.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { hash, hashSync } from "bcryptjs";

// Mock the server-only guard before importing auth.ts
vi.mock("@tanstack/react-start/server-only", () => ({}));

import {
  checkRateLimit,
  recordFailedAttempt,
  validateSession,
  login,
  changePassword,
  changeUsername,
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW_MS,
  SESSION_TTL_MS,
} from "@/lib/auth";
import { AUTH_MESSAGES } from "@/lib/auth-contract";
import type { Env } from "@/lib/content-store";

const CONVEX_URL = "https://test-convex.example.com";
const CONVEX_DEPLOY_KEY = "test-deploy-key";

// ──────────────────────────────────────────────────────────────────────────────
// Convex HTTP mock — in-memory sessions + credentials, same semantics as
// convex/auth.ts (auth:createSession / getSession / deleteSession /
// get/set/clearAdminCredentials). Rate limiting runs in-process now, so it
// needs no mock.
// ──────────────────────────────────────────────────────────────────────────────

type Session = { token: string; username: string; createdAt: string; expiresAt: string };
type Credentials = { username: string; passwordHash: string } | null;

interface ConvexMock {
  sessions: Map<string, Session>;
  state: { credentials: Credentials };
}

function installConvexMock(): ConvexMock {
  const sessions = new Map<string, Session>();
  const state: { credentials: Credentials } = { credentials: null };

  function handle(path: string, args: Record<string, unknown>): unknown {
    switch (path) {
      case "auth:createSession": {
        const token = String(args["token"]);
        const username = String(args["username"]);
        const createdAt = new Date().toISOString();
        const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
        sessions.set(token, { token, username, createdAt, expiresAt });
        return null;
      }
      case "auth:getSession":
        return sessions.get(String(args["token"])) ?? null;
      case "auth:deleteSession":
        sessions.delete(String(args["token"]));
        return null;
      case "auth:getAdminCredentials":
        return state.credentials;
      case "auth:setAdminCredentials":
        state.credentials = {
          username: String(args["username"]),
          passwordHash: String(args["passwordHash"]),
        };
        return null;
      case "auth:clearAdminCredentials":
        state.credentials = null;
        return null;
      default:
        throw new Error(`Unexpected Convex function "${path}"`);
    }
  }

  const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body ?? "{}")) as {
      path?: string;
      args?: Record<string, unknown>;
    };
    const value = handle(body.path ?? "", body.args ?? {});
    return new Response(JSON.stringify({ value }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });

  vi.stubGlobal("fetch", fetchMock);

  return { sessions, state };
}

let convex: ConvexMock;

beforeEach(() => {
  process.env["CONVEX_URL"] = CONVEX_URL;
  process.env["CONVEX_DEPLOY_KEY"] = CONVEX_DEPLOY_KEY;
  convex = installConvexMock();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  delete process.env["CONVEX_URL"];
  delete process.env["CONVEX_DEPLOY_KEY"];
});

// bcrypt hash of "correct-password" (cost 10), computed once for all tests
const ENV_TEST_PASSWORD_HASH = hashSync("correct-password", 10);

function makeEnv(overrides: Partial<Env> = {}): Env {
  return {
    ADMIN_USERNAME: "admin",
    ADMIN_PASSWORD_HASH: ENV_TEST_PASSWORD_HASH,
    ...overrides,
  };
}

function seedSession(token: string, username: string, expiresAt: Date): void {
  convex.sessions.set(token, {
    token,
    username,
    createdAt: new Date(expiresAt.getTime() - SESSION_TTL_MS).toISOString(),
    expiresAt: expiresAt.toISOString(),
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// checkRateLimit
// ──────────────────────────────────────────────────────────────────────────────

describe("checkRateLimit", () => {
  it("does not spend the budget just by asking", async () => {
    const env = makeEnv();
    const ip = "1.2.3.4";

    // Peeking is read-only: any number of checks must leave the counter alone.
    for (let i = 1; i <= RATE_LIMIT_MAX_REQUESTS * 3; i++) {
      const allowed = checkRateLimit(ip);
      expect(allowed, `peek ${i} should still be allowed`).toBe(true);
    }
  });

  it("allows exactly the first 10 failed attempts", async () => {
    const env = makeEnv();
    const ip = "5.6.7.8";

    for (let i = 1; i <= RATE_LIMIT_MAX_REQUESTS; i++) {
      expect(recordFailedAttempt(ip), `attempt ${i} should be allowed`).toBe(true);
    }
    expect(checkRateLimit(ip)).toBe(false);
  });

  it("blocks the 11th attempt from the same IP", async () => {
    const env = makeEnv();
    const ip = "5.6.7.9";

    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS; i++) {
      recordFailedAttempt(ip);
    }

    expect(checkRateLimit(ip)).toBe(false);
    expect(recordFailedAttempt(ip)).toBe(false);
  });

  it("treats different IPs as independent buckets", async () => {
    const env = makeEnv();

    // Exhaust IP A
    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS; i++) {
      recordFailedAttempt("ip-A");
    }
    expect(checkRateLimit("ip-A")).toBe(false);

    // IP B should still be allowed on its first request
    expect(checkRateLimit("ip-B")).toBe(true);
  });

  it("resets when the time window changes", async () => {
    const env = makeEnv();
    const ip = "10.0.0.1";

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:05:00.000Z"));

    // Exhaust the current window
    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS; i++) {
      recordFailedAttempt(ip);
    }
    expect(checkRateLimit(ip)).toBe(false);

    // Step past the 15-minute window boundary — the counter must reset
    vi.setSystemTime(new Date(Date.now() + RATE_LIMIT_WINDOW_MS));
    expect(checkRateLimit(ip)).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// validateSession
// ──────────────────────────────────────────────────────────────────────────────

describe("validateSession", () => {
  it("returns valid:true for a known, fresh session token", async () => {
    const env = makeEnv();
    const token = "test-token-valid";
    seedSession(token, "admin", new Date(Date.now() + SESSION_TTL_MS));

    const result = await validateSession(token, env);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.username).toBe("admin");
    }
  });

  it("returns valid:false for an unknown token", async () => {
    const env = makeEnv();
    const result = await validateSession("no-such-token", env);
    expect(result.valid).toBe(false);
  });

  it("returns valid:false when token is undefined", async () => {
    const env = makeEnv();
    const result = await validateSession(undefined, env);
    expect(result.valid).toBe(false);
  });

  it("returns valid:false for an expired session", async () => {
    const env = makeEnv();
    const token = "expired-token";
    // expiresAt 9 hours ago — past the 8-hour TTL
    seedSession(token, "admin", new Date(Date.now() - 9 * 60 * 60 * 1000));

    const result = await validateSession(token, env);
    expect(result.valid).toBe(false);
  });

  it("removes an expired session", async () => {
    const env = makeEnv();
    const token = "stale-token";
    seedSession(token, "admin", new Date(Date.now() - 9 * 60 * 60 * 1000));

    const result = await validateSession(token, env);
    expect(result.valid).toBe(false);

    // Cleanup is fire-and-forget, so wait for the delete mutation to land.
    await vi.waitFor(() => {
      expect(convex.sessions.has(token)).toBe(false);
    });
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// login — error messages must never reveal which field is wrong
// ──────────────────────────────────────────────────────────────────────────────

describe("login error messages", () => {
  it("returns invalid_credentials for a wrong password", async () => {
    const env = makeEnv();
    const result = await login("admin", "wrong-password", "1.1.1.1", env);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("invalid_credentials");
    }
  });

  it("returns invalid_credentials for a wrong username", async () => {
    const env = makeEnv();
    const result = await login("wrong-user", "correct-password", "1.1.1.2", env);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("invalid_credentials");
    }
  });

  it("returns invalid_credentials when both username and password are wrong", async () => {
    const env = makeEnv();
    const result = await login("hacker", "hunter2", "1.1.1.3", env);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("invalid_credentials");
    }
  });

  it("returns invalid_credentials for an empty password", async () => {
    const env = makeEnv();
    const result = await login("admin", "", "1.1.1.4", env);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("invalid_credentials");
    }
  });

  it("returns rate_limited after exceeding the request limit", async () => {
    const env = makeEnv();
    const ip = "99.0.0.1";

    // Exhaust the limit
    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS; i++) {
      await login("admin", "wrong", ip, env);
    }

    const result = await login("admin", "wrong", ip, env);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("rate_limited");
    }
  });

  it("never spends the budget on successful sign-ins", async () => {
    const env = makeEnv();
    const ip = "99.0.0.2";

    // Many more than the limit, all correct — none of them may count
    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS * 3; i++) {
      const result = await login("admin", "correct-password", ip, env);
      expect(result.ok).toBe(true);
    }

    expect(checkRateLimit(ip)).toBe(true);
  }, 30_000);

  it("never returns a field-specific error reason for any credential combination", async () => {
    const env = makeEnv();
    const badCombos = [
      ["admin", "bad"],
      ["bad", "correct-password"],
      ["", ""],
      ["admin", " "],
    ] as const;

    for (const [user, pass] of badCombos) {
      const result = await login(user, pass, `${user}-${pass}`, env);
      if (!result.ok) {
        // Must always be one of these two — never "wrong_username" or "wrong_password"
        expect(["invalid_credentials", "rate_limited"]).toContain(result.code);
      }
    }
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// changePassword — panel-driven password rotation
// ──────────────────────────────────────────────────────────────────────────────

describe("changePassword", () => {
  it("updates the password so the new one logs in and the old one does not", async () => {
    const env = makeEnv();
    const ip = "2.2.2.1";

    const result = await changePassword("correct-password", "brand-new-password", ip, env);
    expect(result.ok).toBe(true);
    expect(convex.state.credentials).not.toBeNull();

    const withNew = await login("admin", "brand-new-password", ip, env);
    expect(withNew.ok).toBe(true);

    const withOld = await login("admin", "correct-password", ip, env);
    expect(withOld.ok).toBe(false);
  });

  it("rejects an incorrect current password and leaves credentials untouched", async () => {
    const env = makeEnv();

    const result = await changePassword("wrong-password", "brand-new-password", "2.2.2.2", env);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("wrong_password");
    }
    expect(convex.state.credentials).toBeNull();
  });

  it("rejects a new password below the minimum length", async () => {
    const env = makeEnv();

    const result = await changePassword("correct-password", "short", "2.2.2.3", env);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("weak_password");
    }
    expect(convex.state.credentials).toBeNull();
  });

  it("shares the per-IP rate limit with login attempts", async () => {
    const env = makeEnv();
    const ip = "2.2.2.4";

    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS; i++) {
      recordFailedAttempt(ip);
    }

    const result = await changePassword("correct-password", "brand-new-password", ip, env);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("rate_limited");
    }
  });

  it("never spends the budget on a successful password change", async () => {
    const env = makeEnv();
    const ip = "2.2.2.7";

    // Each rotation becomes the current password for the next one
    let current = "correct-password";
    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS * 2; i++) {
      const next = `rotated-password-${i}`;
      const result = await changePassword(current, next, ip, env);
      expect(result.ok, `rotation ${i} should succeed`).toBe(true);
      current = next;
    }

    // Still allowed: nothing above was a failed credential check
    expect(checkRateLimit(ip)).toBe(true);
  }, 30_000);

  it("makes the panel-set password override the env bootstrap credentials", async () => {
    const env = makeEnv();
    convex.state.credentials = {
      username: "admin",
      passwordHash: await hash("panel-password", 10),
    };

    const withEnvPassword = await login("admin", "correct-password", "2.2.2.5", env);
    expect(withEnvPassword.ok).toBe(false);

    const withPanelPassword = await login("admin", "panel-password", "2.2.2.6", env);
    expect(withPanelPassword.ok).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// changeUsername — panel-driven username rotation
// ──────────────────────────────────────────────────────────────────────────────

describe("changeUsername", () => {
  it("updates the username so the new one logs in and the old one does not", async () => {
    const env = makeEnv();
    const ip = "3.3.3.1";

    const result = await changeUsername("operations", "correct-password", ip, env);
    expect(result.ok).toBe(true);
    expect(convex.state.credentials?.username).toBe("operations");

    const withNew = await login("operations", "correct-password", ip, env);
    expect(withNew.ok).toBe(true);

    const withOld = await login("admin", "correct-password", ip, env);
    expect(withOld.ok).toBe(false);
  });

  it("leaves the password hash untouched when only the username changes", async () => {
    const env = makeEnv();

    const result = await changeUsername("operations", "correct-password", "3.3.3.2", env);
    expect(result.ok).toBe(true);
    expect(convex.state.credentials?.passwordHash).toBe(ENV_TEST_PASSWORD_HASH);
  });

  it("trims surrounding whitespace from the username", async () => {
    const env = makeEnv();

    const result = await changeUsername("  operations  ", "correct-password", "3.3.3.3", env);
    expect(result.ok).toBe(true);
    expect(convex.state.credentials?.username).toBe("operations");
  });

  it("rejects an incorrect current password and leaves credentials untouched", async () => {
    const env = makeEnv();

    const result = await changeUsername("operations", "wrong-password", "3.3.3.4", env);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("wrong_password");
    }
    expect(convex.state.credentials).toBeNull();
  });

  it("rejects a username shorter than the minimum length", async () => {
    const env = makeEnv();

    const result = await changeUsername("  a  ", "correct-password", "3.3.3.5", env);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("invalid_username");
    }
    expect(convex.state.credentials).toBeNull();
  });

  it("shares the per-IP rate limit with login attempts", async () => {
    const env = makeEnv();
    const ip = "3.3.3.6";

    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS; i++) {
      recordFailedAttempt(ip);
    }

    const result = await changeUsername("operations", "correct-password", ip, env);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("rate_limited");
    }
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Shared error contract — every failure must arrive with the exact message the
// frontend renders (one table in src/lib/auth-contract.ts, no client-side
// guessing).
// ──────────────────────────────────────────────────────────────────────────────

describe("auth contract", () => {
  it("returns the shared message for every failure the service can produce", async () => {
    const env = makeEnv();

    const cases = [
      [await login("admin", "wrong", "7.7.7.1", env), "invalid_credentials"],
      [
        await changePassword("wrong-password", "long-enough-password", "7.7.7.2", env),
        "wrong_password",
      ],
      [await changePassword("correct-password", "short", "7.7.7.3", env), "weak_password"],
      [await changeUsername("ab", "correct-password", "7.7.7.4", env), "invalid_username"],
    ] as const;

    for (const [result, code] of cases) {
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe(code);
        expect(result.message).toBe(AUTH_MESSAGES[code]);
      }
    }
  });

  it("blocks with the shared rate-limit message once the cap is reached", async () => {
    const env = makeEnv();
    const ip = "7.7.7.5";

    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS; i++) {
      recordFailedAttempt(ip);
    }

    const result = await login("admin", "correct-password", ip, env);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("rate_limited");
      expect(result.message).toBe(AUTH_MESSAGES.rate_limited);
    }
  });
});
