import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { DuplicateSlugError, getContentStore } from "@/lib/content-store";
import { requireAuth } from "@/lib/require-auth";
import { PackageSchema } from "@/lib/schemas";
import type { Package } from "@/types/content";

import { getApiEnv, isDuplicateSlugError } from "./_internal";

const packageKeySchema = z.object({
  slug: z.string().min(1),
});

export const listPackagesFn = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const store = getContentStore(getApiEnv(context));
  return store.listItems<Package>("packages");
});

/** Public single-item read used by a package detail view. */
export const getPackageFn = createServerFn({ method: "GET" })
  .validator(packageKeySchema)
  .handler(async ({ data, context }) => {
    const store = getContentStore(getApiEnv(context));
    return store.getItem<Package>("packages", data.slug);
  });

export const upsertPackageFn = createServerFn({ method: "POST" })
  .validator(PackageSchema)
  .handler(async ({ data, context }) => {
    await requireAuth(context as Parameters<typeof requireAuth>[0]);

    try {
      const store = getContentStore(getApiEnv(context));
      await store.putItem("packages", data);
      return { success: true as const };
    } catch (error) {
      if (isDuplicateSlugError(error, DuplicateSlugError)) {
        return {
          success: false as const,
          errors: { slug: "already in use" as const },
        };
      }

      console.error(error);
      throw new Error("Unable to save package");
    }
  });

export const deletePackageFn = createServerFn({ method: "POST" })
  .validator(packageKeySchema)
  .handler(async ({ data, context }) => {
    await requireAuth(context as Parameters<typeof requireAuth>[0]);

    try {
      const store = getContentStore(getApiEnv(context));
      await store.deleteItem("packages", data.slug);
      return { success: true as const };
    } catch (error) {
      console.error(error);
      throw new Error("Unable to delete package");
    }
  });
