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

  // ── Auth: rate limits (replaces KV rl:{ip}:{window}) ─────────────────────
  rateLimits: defineTable({
    key: v.string(), // "rl:{ip}:{window}"
    count: v.number(),
    windowExpiresAt: v.string(), // ISO timestamp
  }).index("by_key", ["key"]),
});
