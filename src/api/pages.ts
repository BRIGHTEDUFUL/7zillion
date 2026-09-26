import { createServerFn } from "@tanstack/react-start";

import { getContentStore } from "@/lib/content-store";
import { requireAuth } from "@/lib/require-auth";
import { PagesSchema } from "@/lib/schemas";
import { mergePages, sanitizePages } from "@/lib/site-content";
import { defaultPages } from "@/data/site";

import { getApiEnv } from "./_internal";

/**
 * Page copy is optional by design: a deployment that has never saved it (or
 * predates the `pages` table) must still render the built-in copy rather than
 * fail the route, so every read error resolves to the defaults.
 */
export const getPagesFn = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const store = getContentStore(getApiEnv(context));

  try {
    const stored = await store.getPages();
    return mergePages(stored, defaultPages);
  } catch (error) {
    console.error("Page content unavailable — rendering the built-in copy.", error);
    return defaultPages;
  }
});

export const updatePagesFn = createServerFn({ method: "POST" })
  .validator(PagesSchema)
  .handler(async ({ data, context }) => {
    await requireAuth(context as Parameters<typeof requireAuth>[0]);

    try {
      const store = getContentStore(getApiEnv(context));
      await store.setPages(sanitizePages(data));
      return { success: true as const };
    } catch (error) {
      console.error(error);
      throw new Error("Unable to save page content");
    }
  });
