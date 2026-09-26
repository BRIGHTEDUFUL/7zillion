import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Convex schema — canonical content model for the site.
 *
 * Complex content objects (Product, Solution, etc.) are stored as JSON strings
 * inside a `data` field; the ContentStore adapter parses them from that shape.
 */
export default defineSchema({
  // ── Singleton: company info ──────────────────────────────────────────────
  company: defineTable({
    data: v.string(), // JSON blob of Company
  }),

  // ── Content collections ──────────────────────────────────────────────────
  products: defineTable({
    slug: v.string(),
    data: v.string(), // JSON blob of Product
    updatedAt: v.string(), // ISO timestamp
  }).index("by_slug", ["slug"]),

  solutions: defineTable({
    slug: v.string(),
    data: v.string(), // JSON blob of Solution
    updatedAt: v.string(),
  }).index("by_slug", ["slug"]),

  packages: defineTable({
    slug: v.string(),
    data: v.string(), // JSON blob of Package
    updatedAt: v.string(),
  }).index("by_slug", ["slug"]),

  insights: defineTable({
    slug: v.string(),
    data: v.string(), // JSON blob of Insight
    updatedAt: v.string(),
  }).index("by_slug", ["slug"]),

  // ── Projects (keyed by UUID, not slug) ──────────────────────────────────
  projects: defineTable({
    projectId: v.string(), // crypto.randomUUID() assigned at create time
    date: v.string(), // YYYY-MM-DD for sorting
    data: v.string(), // JSON blob of Project
  })
    .index("by_projectId", ["projectId"])
    .index("by_date", ["date"]),

  // ── Singleton: services list ─────────────────────────────────────────────
  services: defineTable({
    data: v.string(), // JSON array of Service objects
  }),

  // ── Singleton: editable page copy (/about + /contact checklist) ─────────
  pages: defineTable({
    data: v.string(), // JSON blob of PagesContent
  }),

  // ── Activity log ─────────────────────────────────────────────────────────
  activityLog: defineTable({
    eventType: v.string(),
    path: v.optional(v.string()),
    slug: v.optional(v.string()),
    timestamp: v.string(), // ISO 8601 UTC
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_eventType", ["eventType"]),

  // ── Auth: sessions (replaces KV session:{token}) ─────────────────────────
  sessions: defineTable({
    token: v.string(),
    username: v.string(),
    createdAt: v.string(), // ISO timestamp
    expiresAt: v.string(), // ISO timestamp (createdAt + 8h)
  }).index("by_token", ["token"]),

  // ── Auth: rate limits (legacy) ─────────────────────────────────────────
  // Rate limiting now lives in-process in the Node server (src/lib/auth.ts).
  // The table is kept only so existing rows stay schema-valid; nothing
  // writes to it anymore.
  rateLimits: defineTable({
    key: v.string(), // "rl:{ip}:{window}"
    count: v.number(),
    windowExpiresAt: v.string(), // ISO timestamp
  }).index("by_key", ["key"]),

  // ── Auth: password override set from the admin panel (Settings) ─────────
  // Singleton (one row). When present it overrides ADMIN_USERNAME /
  // ADMIN_PASSWORD_HASH from the environment; env stays the bootstrap value.
  adminCredentials: defineTable({
    username: v.string(),
    passwordHash: v.string(), // bcrypt hash
    updatedAt: v.number(), // ms epoch
  }),
});
