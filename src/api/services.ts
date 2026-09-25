import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getContentStore } from "@/lib/content-store";
import { requireAuth } from "@/lib/require-auth";
import { ServiceSchema } from "@/lib/schemas";
import type { Service } from "@/types/content";

import { getApiEnv } from "./_internal";

const servicesSchema = z.array(ServiceSchema);

export const getServicesFn = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const store = getContentStore(getApiEnv(context));
  return store.getServices();
});

export const updateServicesFn = createServerFn({ method: "POST" })
  .validator(servicesSchema)
  .handler(async ({ data, context }) => {
    await requireAuth(context as Parameters<typeof requireAuth>[0]);

    try {
      const store = getContentStore(getApiEnv(context));
      await store.setServices(data as Service[]);
      return { success: true as const };
    } catch (error) {
      console.error(error);
      throw new Error("Unable to save services");
    }
  });
