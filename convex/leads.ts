/**
 * Quote-form enquiries ("leads").
 *
 * Everything here is personally identifiable — name, email, phone — which is
 * why none of it follows the pattern of the content tables:
 *
 *   - `create`, `setStatus` and `remove` are internalMutation, so the public
 *     Convex HTTP API cannot be used to write rows.
 *   - `list` is an internalQuery rather than a public query: a public query
 *     would answer anyone who POSTs `{"path":"leads:list"}` with the whole
 *     table, deploy key or not.
 *
 * Only the server functions in src/api/leads.ts call these, authenticated
 * with the deployment key.
 */

import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

const LeadStatus = v.union(v.literal("new"), v.literal("contacted"), v.literal("closed"));

export const create = internalMutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    requirements: v.string(),
    source: v.string(),
    status: LeadStatus,
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("leads", { ...args, receivedAt: new Date().toISOString() });
  },
});

export const list = internalQuery({
  args: {},
  handler: async (ctx) => await ctx.db.query("leads").order("desc").collect(),
});

export const setStatus = internalMutation({
  args: { leadId: v.id("leads"), status: LeadStatus },
  handler: async (ctx, { leadId, status }) => {
    // Deleted in another tab while this one was open: no-op instead of throw.
    if (!(await ctx.db.get(leadId))) return;
    await ctx.db.patch(leadId, { status });
  },
});

export const remove = internalMutation({
  args: { leadId: v.id("leads") },
  handler: async (ctx, { leadId }) => {
    if (!(await ctx.db.get(leadId))) return;
    await ctx.db.delete(leadId);
  },
});
