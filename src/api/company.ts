import { createServerFn } from "@tanstack/react-start";

import { getContentStore } from "@/lib/content-store";
import { requireAuth } from "@/lib/require-auth";
import { CompanySchema } from "@/lib/schemas";
import { mergeCompany } from "@/lib/site-content";
import { fallbackCompany } from "@/data/site";
import type { Company } from "@/types/content";

import { getApiEnv } from "./_internal";

/**
 * One read path for every company field: the stored record wins field by
 * field, and anything it does not have (a new field, an unseeded deployment,
 * a Convex outage) falls back to the built-in copy so no contact block ever
 * renders empty.
 */
export const getCompanyFn = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const store = getContentStore(getApiEnv(context));

  try {
    const stored = await store.getCompany();
    return mergeCompany(stored, fallbackCompany);
  } catch (error) {
    console.error("Company record unavailable — using the built-in copy.", error);
    return fallbackCompany;
  }
});

export const updateCompanyFn = createServerFn({ method: "POST" })
  .validator(CompanySchema)
  .handler(async ({ data, context }) => {
    await requireAuth(context as Parameters<typeof requireAuth>[0]);

    try {
      const store = getContentStore(getApiEnv(context));
      await store.setCompany(data);
      return { success: true as const };
    } catch (error) {
      console.error(error);
      throw new Error("Unable to update company information");
    }
  });
