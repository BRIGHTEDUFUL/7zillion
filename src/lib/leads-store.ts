import "@tanstack/react-start/server-only";

import { getConvexDeployKey, getConvexUrl } from "@/lib/convex-internal";
import { LeadRecordSchema, type LeadInput } from "@/lib/schemas";
import type { Lead, LeadStatus } from "@/types/content";

/**
 * The enquiry half of the data layer: everything the application server needs
 * to write and read quote-form submissions.
 *
 * All four calls go through the Convex internal API (`Authorization: Convex
 * <deploy key>`) because `convex/leads.ts` marks every function internal. In
 * particular the read cannot use the public `/api/query` path: a public query
 * would hand the whole table — names, emails, phone numbers — to anyone who
 * asked for it.
 *
 * Nothing here swallows errors: callers decide what a failure means. The
 * visitor-facing path (`saveLeadFn` in src/api/leads.ts) logs and reports
 * `stored: false`, because the Web3Forms email already carries the enquiry.
 */

/** The subset of fetch this module needs, so tests can pass a stub. */
export type ConvexFetch = (url: string, init: RequestInit) => Promise<Response>;

type RequestOptions = { fetchImpl?: ConvexFetch };

async function callConvex(
  kind: "query" | "mutation",
  path: string,
  args: Record<string, unknown>,
  { fetchImpl = fetch }: RequestOptions = {},
): Promise<unknown> {
  const res = await fetchImpl(`${getConvexUrl()}/api/${kind}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Convex ${getConvexDeployKey()}`,
    },
    body: JSON.stringify({ path, args }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Convex ${kind} "${path}" failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as { value?: unknown; errorMessage?: string };
  if (json.errorMessage) throw new Error(`Convex ${kind} "${path}": ${json.errorMessage}`);
  return json.value;
}

/**
 * Files one enquiry, always as `status: "new"`. receivedAt is stamped inside
 * the mutation (convex/leads.ts), so a skewed client clock cannot fake it.
 * Returns the new document id.
 */
export async function persistLead(input: LeadInput, options?: RequestOptions): Promise<string> {
  const status: LeadStatus = "new";
  const id = await callConvex(
    "mutation",
    "leads:create",
    {
      name: input.name,
      email: input.email,
      // A blank phone is stored as absent rather than "" so the admin table
      // can render a placeholder without checking for empty strings.
      ...(input.phone ? { phone: input.phone } : {}),
      requirements: input.requirements,
      source: input.source,
      status,
    },
    options,
  );

  if (typeof id !== "string" || id === "") {
    throw new Error('Convex mutation "leads:create" returned no id.');
  }
  return id;
}

/** Newest first. Rows that do not parse are skipped rather than surfaced. */
export async function listLeads(options?: RequestOptions): Promise<Lead[]> {
  const rows = await callConvex("query", "leads:list", {}, options);
  if (!Array.isArray(rows)) throw new Error('Convex query "leads:list" did not return a list.');

  const leads: Lead[] = [];
  for (const row of rows) {
    const parsed = LeadRecordSchema.safeParse(toRecordShape(row));
    if (parsed.success) {
      leads.push(parsed.data);
    } else {
      console.warn("Ignoring an unreadable lead row:", parsed.error.issues[0]?.message);
    }
  }
  return leads;
}

export async function setLeadStatus(
  id: string,
  status: LeadStatus,
  options?: RequestOptions,
): Promise<void> {
  await callConvex("mutation", "leads:setStatus", { leadId: id, status }, options);
}

export async function deleteLead(id: string, options?: RequestOptions): Promise<void> {
  await callConvex("mutation", "leads:remove", { leadId: id }, options);
}

/** Convex rows arrive as `{_id, _creationTime, ...}`; the admin type wants `id`. */
function toRecordShape(row: unknown): Record<string, unknown> {
  if (typeof row !== "object" || row === null) return {};
  const raw = row as Record<string, unknown>;
  return {
    id: raw["_id"],
    name: raw["name"],
    email: raw["email"],
    phone: raw["phone"],
    requirements: raw["requirements"],
    source: raw["source"],
    status: raw["status"],
    receivedAt: raw["receivedAt"],
  };
}
