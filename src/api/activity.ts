import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getContentStore } from "@/lib/content-store";
import type { ActivityQueryOptions, ContentStore } from "@/lib/content-store";
import { requireAuth } from "@/lib/require-auth";
import { ActivityEntrySchema } from "@/lib/schemas";
import type { EventType } from "@/types/content";

import { getApiEnv } from "./_internal";

const eventTypeSchema = z.enum([
  "page_view",
  "whatsapp_click",
  "contact_submission",
  "enquiry_submission",
]);

/**
 * Dates are accepted from both an SSR caller (Date) and a serialized browser
 * caller (ISO string).  z.coerce.date() normalizes both forms for the store.
 */
const activityQuerySchema = z.object({
  limit: z.number().int().min(1).max(1000).optional(),
  since: z.coerce.date().optional(),
  eventTypes: z.array(eventTypeSchema).optional(),
});

type ActivityAppendInput = Parameters<ContentStore["appendActivity"]>[0];

export const recordActivityFn = createServerFn({ method: "POST" })
  .validator(ActivityEntrySchema)
  .handler(async ({ data, context }) => {
    try {
      const store = getContentStore(getApiEnv(context));
      await store.appendActivity(data as ActivityAppendInput);
    } catch (error) {
      // Activity is best-effort: a visitor-facing page must never fail just
      // because the analytics store is unavailable.
      console.error(error);
    }

    return { ok: true as const };
  });

export const queryActivityFn = createServerFn({ method: "POST" })
  .validator(activityQuerySchema)
  .handler(async ({ data, context }) => {
    await requireAuth(context as Parameters<typeof requireAuth>[0]);

    try {
      const store = getContentStore(getApiEnv(context));
      return await store.queryActivity(data as ActivityQueryOptions);
    } catch (error) {
      console.error(error);
      throw new Error("Unable to query activity");
    }
  });

/** Keep the event union visible to callers without duplicating the schema. */
export type ActivityEventType = EventType;
