import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { DuplicateSlugError, getContentStore } from "@/lib/content-store";
import { requireAuth } from "@/lib/require-auth";
import { ProductSchema } from "@/lib/schemas";
import type { Product } from "@/types/content";

import { getApiEnv, isDuplicateSlugError } from "./_internal";

const productKeySchema = z.object({
  slug: z.string().min(1),
});

export const listProductsFn = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const store = getContentStore(getApiEnv(context));
  return store.listItems<Product>("products");
});

/** Public single-item read used by the product detail route. */
export const getProductFn = createServerFn({ method: "GET" })
  .validator(productKeySchema)
  .handler(async ({ data, context }) => {
    const store = getContentStore(getApiEnv(context));
    return store.getItem<Product>("products", data.slug);
  });

export const upsertProductFn = createServerFn({ method: "POST" })
  .validator(ProductSchema)
  .handler(async ({ data, context }) => {
    await requireAuth(context as Parameters<typeof requireAuth>[0]);

    try {
      const store = getContentStore(getApiEnv(context));
      await store.putItem("products", data);
      return { success: true as const };
    } catch (error) {
      if (isDuplicateSlugError(error, DuplicateSlugError)) {
        return {
          success: false as const,
          errors: { slug: "already in use" as const },
        };
      }

      console.error(error);
      throw new Error("Unable to save product");
    }
  });

export const deleteProductFn = createServerFn({ method: "POST" })
  .validator(productKeySchema)
  .handler(async ({ data, context }) => {
    await requireAuth(context as Parameters<typeof requireAuth>[0]);

    try {
      const store = getContentStore(getApiEnv(context));
      await store.deleteItem("products", data.slug);
      return { success: true as const };
    } catch (error) {
      console.error(error);
      throw new Error("Unable to delete product");
    }
  });
