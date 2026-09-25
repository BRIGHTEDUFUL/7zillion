import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { DuplicateSlugError, getContentStore } from "@/lib/content-store";
import { requireAuth } from "@/lib/require-auth";
import { InsightSchema } from "@/lib/schemas";
import type { Insight } from "@/types/content";

import { getApiEnv, isDuplicateSlugError } from "./_internal";

const insightKeySchema = z.object({
  slug: z.string().min(1),
});

export const listInsightsFn = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const store = getContentStore(getApiEnv(context));
  return store.listItems<Insight>("insights");
});

/** Public single-item read used by the blog detail route. */
export const getInsightFn = createServerFn({ method: "GET" })
  .validator(insightKeySchema)
  .handler(async ({ data, context }) => {
    const store = getContentStore(getApiEnv(context));
    return store.getItem<Insight>("insights", data.slug);
  });

export const upsertInsightFn = createServerFn({ method: "POST" })
  .validator(InsightSchema)
  .handler(async ({ data, context }) => {
    await requireAuth(context as Parameters<typeof requireAuth>[0]);

    try {
      const store = getContentStore(getApiEnv(context));
      await store.putItem("insights", data);
      return { success: true as const };
    } catch (error) {
      if (isDuplicateSlugError(error, DuplicateSlugError)) {
        return {
          success: false as const,
          errors: { slug: "already in use" as const },
        };
      }

      console.error(error);
      throw new Error("Unable to save insight");
    }
  });

export const deleteInsightFn = createServerFn({ method: "POST" })
  .validator(insightKeySchema)
  .handler(async ({ data, context }) => {
    await requireAuth(context as Parameters<typeof requireAuth>[0]);

    try {
      const store = getContentStore(getApiEnv(context));
      await store.deleteItem("insights", data.slug);
      return { success: true as const };
    } catch (error) {
      console.error(error);
      throw new Error("Unable to delete insight");
    }
  });
