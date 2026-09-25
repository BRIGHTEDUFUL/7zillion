import { createServerFn } from "@tanstack/react-start";

import { getContentStore } from "@/lib/content-store";
import { requireAuth } from "@/lib/require-auth";
import { CompanySchema } from "@/lib/schemas";
import type { Company } from "@/types/content";

import { getApiEnv } from "./_internal";

export const getCompanyFn = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const store = getContentStore(getApiEnv(context));
  return store.getCompany() as Promise<Company>;
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
