import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { DuplicateSlugError, getContentStore } from "@/lib/content-store";
import { requireAuth } from "@/lib/require-auth";
import { SolutionSchema } from "@/lib/schemas";
import type { Solution } from "@/types/content";

import { getApiEnv, isDuplicateSlugError } from "./_internal";

const solutionKeySchema = z.object({
  slug: z.string().min(1),
});

export const listSolutionsFn = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const store = getContentStore(getApiEnv(context));
  return store.listItems<Solution>("solutions");
});

/** Public single-item read used by the solution detail route. */
export const getSolutionFn = createServerFn({ method: "GET" })
  .validator(solutionKeySchema)
  .handler(async ({ data, context }) => {
    const store = getContentStore(getApiEnv(context));
    return store.getItem<Solution>("solutions", data.slug);
  });

export const upsertSolutionFn = createServerFn({ method: "POST" })
  .validator(SolutionSchema)
  .handler(async ({ data, context }) => {
    await requireAuth(context as Parameters<typeof requireAuth>[0]);

    try {
      const store = getContentStore(getApiEnv(context));
      await store.putItem("solutions", data);
      return { success: true as const };
    } catch (error) {
      if (isDuplicateSlugError(error, DuplicateSlugError)) {
        return {
          success: false as const,
          errors: { slug: "already in use" as const },
        };
      }

      console.error(error);
      throw new Error("Unable to save solution");
    }
  });

export const deleteSolutionFn = createServerFn({ method: "POST" })
  .validator(solutionKeySchema)
  .handler(async ({ data, context }) => {
    await requireAuth(context as Parameters<typeof requireAuth>[0]);

    try {
      const store = getContentStore(getApiEnv(context));
      await store.deleteItem("solutions", data.slug);
      return { success: true as const };
    } catch (error) {
      console.error(error);
      throw new Error("Unable to delete solution");
    }
  });
