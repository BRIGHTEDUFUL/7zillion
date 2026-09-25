/**
 * Feature: admin-panel
 * Task 2.2 — Auth_Service unit tests
 *
 * Tests cover checkRateLimit, validateSession, and login error messages.
 *
 * auth.ts talks to Convex over HTTP (CONVEX_URL + CONVEX_DEPLOY_KEY), so these
 * tests stub global `fetch` with an in-memory implementation that mirrors the
 * mutations/queries in convex/auth.ts. That keeps the real auth logic under
 * test instead of mocking it away.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// Mock the server-only guard before importing auth.ts
vi.mock("@tanstack/react-start/server-only", () => ({}));

import {
  checkRateLimit,
  validateSession,
  login,
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW_MS,
  SESSION_TTL_MS,
} from "@/lib/auth";
import type { Env } from "@/lib/content-store";

const CONVEX_URL = "https://test-convex.example.com";
const CONVEX_DEPLOY_KEY = "test-deploy-key";

// ──────────────────────────────────────────────────────────────────────────────
// Convex HTTP mock — in-memory sessions + rate limits, same semantics as
// convex/auth.ts (auth:createSession / getSession / deleteSession /
// checkAndIncrementRateLimit)
// ──────────────────────────────────────────────────────────────────────────────

type Session = { token: string; username: string; createdAt: string; expiresAt: string };
type RateLimit = { count: number; windowExpiresAt: string };

interface ConvexMock {
  sessions: Map<string, Session>;
  rateLimits: Map<string, RateLimit>;
}

function installConvexMock(): ConvexMock {
  const sessions = new Map<string, Session>();
  const rateLimits = new Map<string, RateLimit>();

  function checkAndIncrementRateLimit(key: string) {
    const now = Date.now();
    const windowExpiresAt = new Date(
      Math.ceil(now / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS,
    ).toISOString();

    const existing = rateLimits.get(key);
    if (!existing) {
      rateLimits.set(key, { count: 1, windowExpiresAt });
      return { allowed: true, count: 1 };
    }

    if (existing.windowExpiresAt < new Date(now).toISOString()) {
      rateLimits.set(key, { count: 1, windowExpiresAt });
      return { allowed: true, count: 1 };
    }

    existing.count += 1;
    return { allowed: existing.count <= RATE_LIMIT_MAX_REQUESTS, count: existing.count };
  }

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
      case "auth:checkAndIncrementRateLimit":
        return checkAndIncrementRateLimit(String(args["key"]));
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

  return { sessions, rateLimits };
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

function makeEnv(overrides: Partial<Env> = {}): Env {
  return {
    ADMIN_USERNAME: "admin",
    // bcrypt hash for the string "correct-password"
    ADMIN_PASSWORD_HASH: "$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
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
  it("allows the first 10 requests from the same IP", async () => {
    const env = makeEnv();
    const ip = "1.2.3.4";

    for (let i = 1; i <= RATE_LIMIT_MAX_REQUESTS; i++) {
      const allowed = await checkRateLimit(ip, env);
      expect(allowed, `request ${i} should be allowed`).toBe(true);
    }
  });

  it("blocks the 11th request from the same IP", async () => {
    const env = makeEnv();
    const ip = "5.6.7.8";

    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS; i++) {
      await checkRateLimit(ip, env);
    }

    const allowed = await checkRateLimit(ip, env);
    expect(allowed).toBe(false);
  });

  it("treats different IPs as independent buckets", async () => {
    const env = makeEnv();

    // Exhaust IP A
    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS; i++) {
      await checkRateLimit("ip-A", env);
    }
    expect(await checkRateLimit("ip-A", env)).toBe(false);

    // IP B should still be allowed on its first request
    expect(await checkRateLimit("ip-B", env)).toBe(true);
  });

  it("resets when the time window changes", async () => {
    const env = makeEnv();
    const ip = "10.0.0.1";

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:05:00.000Z"));

    // Exhaust the current window
    for (let i = 0; i < RATE_LIMIT_MAX_REQUESTS; i++) {
      await checkRateLimit(ip, env);
    }
    expect(await checkRateLimit(ip, env)).toBe(false);

    // Step past the 15-minute window boundary — the counter must reset
    vi.setSystemTime(new Date(Date.now() + RATE_LIMIT_WINDOW_MS));
    expect(await checkRateLimit(ip, env)).toBe(true);
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
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe("invalid_credentials");
    }
  });

  it("returns invalid_credentials for a wrong username", async () => {
    const env = makeEnv();
    const result = await login("wrong-user", "correct-password", "1.1.1.2", env);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe("invalid_credentials");
    }
  });

  it("returns invalid_credentials when both username and password are wrong", async () => {
    const env = makeEnv();
    const result = await login("hacker", "hunter2", "1.1.1.3", env);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe("invalid_credentials");
    }
  });

  it("returns invalid_credentials for an empty password", async () => {
    const env = makeEnv();
    const result = await login("admin", "", "1.1.1.4", env);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe("invalid_credentials");
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
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe("rate_limited");
    }
  });

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
      if (!result.success) {
        // Must always be one of these two — never "wrong_username" or "wrong_password"
        expect(["invalid_credentials", "rate_limited"]).toContain(result.reason);
      }
    }
  });
});
