/**
 * Convex mutations and queries for admin auth.
 *
 * All write operations and sensitive reads are internalMutation / internalQuery
 * so they are NOT callable from the public Convex HTTP API — only from Convex
 * actions running inside this deployment.
 *
 * The application server (src/lib/auth.ts) calls these through the Convex HTTP
 * action API using a deployment key (Authorization: Convex <key>), not the
 * open /api/mutation endpoint.
 */

import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 10;

// ── Sessions ──────────────────────────────────────────────────────────────────

export const createSession = internalMutation({
  args: { token: v.string(), username: v.string() },
  handler: async (ctx, { token, username }) => {
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
    await ctx.db.insert("sessions", { token, username, createdAt, expiresAt });
  },
});

export const getSession = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    return ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();
  },
});

export const deleteSession = internalMutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const row = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();
    if (row) await ctx.db.delete(row._id);
  },
});

// ── Credentials (password changes made from the admin panel) ─────────────────

export const getAdminCredentials = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("adminCredentials").first();
  },
});

export const setAdminCredentials = internalMutation({
  args: { username: v.string(), passwordHash: v.string() },
  handler: async (ctx, { username, passwordHash }) => {
    const existing = await ctx.db.query("adminCredentials").first();
    if (existing) {
      await ctx.db.patch(existing._id, { username, passwordHash, updatedAt: Date.now() });
      return;
    }
    await ctx.db.insert("adminCredentials", { username, passwordHash, updatedAt: Date.now() });
  },
});

/** Remove the override so the env bootstrap credentials apply again. */
export const clearAdminCredentials = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("adminCredentials").first();
    if (existing) await ctx.db.delete(existing._id);
  },
});

// ── Rate limits ───────────────────────────────────────────────────────────────

export const checkAndIncrementRateLimit = internalMutation({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const now = Date.now();
    const windowExpiresAt = new Date(
      Math.ceil(now / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS,
    ).toISOString();

    const existing = await ctx.db
      .query("rateLimits")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();

    if (!existing) {
      await ctx.db.insert("rateLimits", { key, count: 1, windowExpiresAt });
      return { allowed: true, count: 1 };
    }

    // If the stored window has expired, reset it
    if (existing.windowExpiresAt < new Date(now).toISOString()) {
      await ctx.db.patch(existing._id, { count: 1, windowExpiresAt });
      return { allowed: true, count: 1 };
    }

    const next = existing.count + 1;
    await ctx.db.patch(existing._id, { count: next });
    return { allowed: next <= RATE_LIMIT_MAX, count: next };
  },
});
