import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { allowLeadWrite, recordLeadWrite } from "@/lib/lead-throttle";
import { deleteLead, listLeads, persistLead, setLeadStatus } from "@/lib/leads-store";
import { requireAuth } from "@/lib/require-auth";
import { LeadInputSchema, LeadStatusSchema } from "@/lib/schemas";
import type { Lead } from "@/types/content";

import { getClientIp } from "./_internal";

/**
 * Enquiry storage.
 *
 * `saveLeadFn` is the only public function here: the quote forms call it from
 * the browser alongside their Web3Forms POST, so an enquiry exists twice — in
 * the team inbox and in Admin → Leads. It never throws and never reports a
 * visitor-facing failure, because a storage hiccup must not fail a submission
 * that the email already carries.
 *
 * Everything else requires an admin session. The rows are personal data: a
 * list or status change without one must not be reachable from a browser.
 */

const leadIdSchema = z.object({ id: z.string().min(1) }).strict();

const leadStatusSchema = z.object({ id: z.string().min(1), status: LeadStatusSchema }).strict();

export const saveLeadFn = createServerFn({ method: "POST" })
  .validator(LeadInputSchema)
  .handler(async ({ data }): Promise<{ stored: boolean }> => {
    // Honeypot filled: drop the submission and report success, so a bot
    // learns nothing about which part of the form gave it away.
    if (data.botcheck) return { stored: false };

    const ip = getClientIp();
    if (!allowLeadWrite(ip)) {
      console.warn("Lead write skipped: this IP has spent its window budget.");
      return { stored: false };
    }

    try {
      await persistLead(data);
    } catch (error) {
      console.error("Unable to store lead:", error);
      return { stored: false };
    }

    recordLeadWrite(ip);
    return { stored: true };
  });

/** Sensitive read, so POST + session — the pattern queryActivityFn uses. */
export const listLeadsFn = createServerFn({ method: "POST" }).handler(
  async ({ context }): Promise<Lead[]> => {
    await requireAuth(context);
    return listLeads();
  },
);

export const setLeadStatusFn = createServerFn({ method: "POST" })
  .validator(leadStatusSchema)
  .handler(async ({ data, context }) => {
    await requireAuth(context);

    try {
      await setLeadStatus(data.id, data.status);
      return { success: true as const };
    } catch (error) {
      console.error(error);
      throw new Error("Unable to update the enquiry");
    }
  });

export const deleteLeadFn = createServerFn({ method: "POST" })
  .validator(leadIdSchema)
  .handler(async ({ data, context }) => {
    await requireAuth(context);

    try {
      await deleteLead(data.id);
      return { success: true as const };
    } catch (error) {
      console.error(error);
      throw new Error("Unable to delete the enquiry");
    }
  });
