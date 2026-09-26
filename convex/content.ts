/**
 * Convex queries and mutations for all content collections.
 *
 * Read-only queries (list*, get*, getCompany, getServices, queryActivity) are
 * public — they power SSR loaders on the public-facing site.
 *
 * All write mutations are internalMutation — NOT callable from the public
 * Convex HTTP API. Only the authenticated server functions in src/api/ may
 * call them (via the Convex internal API with a deployment key).
 */

import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

const now = () => new Date().toISOString();

// ──────────────────────────────────────────────────────────────────────────────
// Company (singleton)
// ──────────────────────────────────────────────────────────────────────────────

export const getCompany = query({
  args: {},
  handler: async (ctx) => {
    // Use .first() — not .collect() — to avoid loading all rows and to be safe
    // if duplicate rows were ever created by a race condition.
    const row = await ctx.db.query("company").first();
    return row?.data ?? null;
  },
});

export const setCompany = internalMutation({
  args: { data: v.string() },
  handler: async (ctx, { data }) => {
    const existing = await ctx.db.query("company").first();
    if (existing) {
      await ctx.db.patch(existing._id, { data });
    } else {
      await ctx.db.insert("company", { data });
    }
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// Generic slug-keyed collections: products, solutions, packages, insights
// ──────────────────────────────────────────────────────────────────────────────

// list
export const listProducts = query({
  args: {},
  handler: async (ctx) => ctx.db.query("products").collect(),
});
export const listSolutions = query({
  args: {},
  handler: async (ctx) => ctx.db.query("solutions").collect(),
});
export const listPackages = query({
  args: {},
  handler: async (ctx) => ctx.db.query("packages").collect(),
});
export const listInsights = query({
  args: {},
  handler: async (ctx) => ctx.db.query("insights").collect(),
});

// getBySlug
export const getProduct = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) =>
    ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first(),
});
export const getSolution = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) =>
    ctx.db
      .query("solutions")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first(),
});
export const getPackage = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) =>
    ctx.db
      .query("packages")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first(),
});
export const getInsight = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) =>
    ctx.db
      .query("insights")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first(),
});

// upsert (insert or replace on slug) — internal only
export const upsertProduct = internalMutation({
  args: { slug: v.string(), data: v.string() },
  handler: async (ctx, { slug, data }) => {
    const existing = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { data, updatedAt: now() });
    } else {
      await ctx.db.insert("products", { slug, data, updatedAt: now() });
    }
  },
});

export const upsertSolution = internalMutation({
  args: { slug: v.string(), data: v.string() },
  handler: async (ctx, { slug, data }) => {
    const existing = await ctx.db
      .query("solutions")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { data, updatedAt: now() });
    } else {
      await ctx.db.insert("solutions", { slug, data, updatedAt: now() });
    }
  },
});

export const upsertPackage = internalMutation({
  args: { slug: v.string(), data: v.string() },
  handler: async (ctx, { slug, data }) => {
    const existing = await ctx.db
      .query("packages")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { data, updatedAt: now() });
    } else {
      await ctx.db.insert("packages", { slug, data, updatedAt: now() });
    }
  },
});

export const upsertInsight = internalMutation({
  args: { slug: v.string(), data: v.string() },
  handler: async (ctx, { slug, data }) => {
    const existing = await ctx.db
      .query("insights")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { data, updatedAt: now() });
    } else {
      await ctx.db.insert("insights", { slug, data, updatedAt: now() });
    }
  },
});

// createItem — insert only, throws DUPLICATE_SLUG if slug already exists
export const createProduct = internalMutation({
  args: { slug: v.string(), data: v.string() },
  handler: async (ctx, { slug, data }) => {
    const existing = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (existing) throw new Error(`DUPLICATE_SLUG:products:${slug}`);
    await ctx.db.insert("products", { slug, data, updatedAt: now() });
  },
});

export const createSolution = internalMutation({
  args: { slug: v.string(), data: v.string() },
  handler: async (ctx, { slug, data }) => {
    const existing = await ctx.db
      .query("solutions")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (existing) throw new Error(`DUPLICATE_SLUG:solutions:${slug}`);
    await ctx.db.insert("solutions", { slug, data, updatedAt: now() });
  },
});

export const createPackage = internalMutation({
  args: { slug: v.string(), data: v.string() },
  handler: async (ctx, { slug, data }) => {
    const existing = await ctx.db
      .query("packages")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (existing) throw new Error(`DUPLICATE_SLUG:packages:${slug}`);
    await ctx.db.insert("packages", { slug, data, updatedAt: now() });
  },
});

export const createInsight = internalMutation({
  args: { slug: v.string(), data: v.string() },
  handler: async (ctx, { slug, data }) => {
    const existing = await ctx.db
      .query("insights")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (existing) throw new Error(`DUPLICATE_SLUG:insights:${slug}`);
    await ctx.db.insert("insights", { slug, data, updatedAt: now() });
  },
});

// delete — internal only
export const deleteProduct = internalMutation({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const row = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (row) await ctx.db.delete(row._id);
  },
});

export const deleteSolution = internalMutation({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const row = await ctx.db
      .query("solutions")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (row) await ctx.db.delete(row._id);
  },
});

export const deletePackage = internalMutation({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const row = await ctx.db
      .query("packages")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (row) await ctx.db.delete(row._id);
  },
});

export const deleteInsight = internalMutation({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const row = await ctx.db
      .query("insights")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (row) await ctx.db.delete(row._id);
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// Projects (keyed by UUID)
// ──────────────────────────────────────────────────────────────────────────────

export const listProjects = query({
  args: {},
  handler: async (ctx) => ctx.db.query("projects").withIndex("by_date").order("desc").collect(),
});

export const upsertProject = internalMutation({
  args: { projectId: v.string(), date: v.string(), data: v.string() },
  handler: async (ctx, { projectId, date, data }) => {
    const existing = await ctx.db
      .query("projects")
      .withIndex("by_projectId", (q) => q.eq("projectId", projectId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { date, data });
    } else {
      await ctx.db.insert("projects", { projectId, date, data });
    }
  },
});

export const deleteProject = internalMutation({
  args: { projectId: v.string() },
  handler: async (ctx, { projectId }) => {
    const row = await ctx.db
      .query("projects")
      .withIndex("by_projectId", (q) => q.eq("projectId", projectId))
      .first();
    if (row) await ctx.db.delete(row._id);
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// Services (singleton list)
// ──────────────────────────────────────────────────────────────────────────────

export const getServices = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db.query("services").first();
    return row?.data ?? "[]";
  },
});

export const setServices = internalMutation({
  args: { data: v.string() },
  handler: async (ctx, { data }) => {
    const existing = await ctx.db.query("services").first();
    if (existing) {
      await ctx.db.patch(existing._id, { data });
    } else {
      await ctx.db.insert("services", { data });
    }
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// Pages (singleton — editable copy for /about and /contact)
// ──────────────────────────────────────────────────────────────────────────────

export const getPages = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db.query("pages").first();
    return row?.data ?? null;
  },
});

export const setPages = internalMutation({
  args: { data: v.string() },
  handler: async (ctx, { data }) => {
    const existing = await ctx.db.query("pages").first();
    if (existing) {
      await ctx.db.patch(existing._id, { data });
    } else {
      await ctx.db.insert("pages", { data });
    }
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// Activity log
// ──────────────────────────────────────────────────────────────────────────────

export const appendActivity = internalMutation({
  args: {
    // Validated union — only known event types are accepted
    eventType: v.union(
      v.literal("page_view"),
      v.literal("whatsapp_click"),
      v.literal("contact_submission"),
      v.literal("enquiry_submission"),
    ),
    path: v.optional(v.string()),
    slug: v.optional(v.string()),
    timestamp: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("activityLog", args);
  },
});

export const queryActivity = query({
  args: {
    limit: v.optional(v.number()),
    since: v.optional(v.string()),
    eventTypes: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { limit, since, eventTypes }) => {
    // Push the `since` filter into the index to avoid a full-table collect().
    const q = ctx.db
      .query("activityLog")
      .withIndex("by_timestamp", (qi) => (since ? qi.gte("timestamp", since) : qi))
      .order("desc");

    // Apply eventType filter and limit efficiently using .filter() + .take()
    // rather than collecting everything and slicing in JS.
    const effectiveLimit = limit && limit > 0 ? limit : 1000;

    if (eventTypes && eventTypes.length > 0) {
      const wanted = [...new Set(eventTypes)];
      return q
        .filter((r) => r.or(...wanted.map((type) => r.eq(r.field("eventType"), type))))
        .take(effectiveLimit);
    }

    return q.take(effectiveLimit);
  },
});
