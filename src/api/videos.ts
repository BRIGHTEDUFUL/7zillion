import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getContentStore } from "@/lib/content-store";
import { requireAuth } from "@/lib/require-auth";
import { VideoSchema } from "@/lib/schemas";
import { sanitizeVideos } from "@/lib/site-content";
import { defaultVideos } from "@/data/site";
import type { Video } from "@/types/content";

import { getApiEnv } from "./_internal";

const videosSchema = z.array(VideoSchema);

/**
 * The gallery is optional by design: a deployment that has never saved it (or
 * predates the `videos` table) must still render the built-in list rather than
 * fail the route, so every read error resolves to defaultVideos. A saved list
 * wins even when it is empty — that is the admin deliberately hiding the
 * gallery, which must not be overwritten by the defaults.
 */
export const listVideosFn = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const store = getContentStore(getApiEnv(context));

  try {
    const stored = await store.getVideos();
    return stored ?? defaultVideos;
  } catch (error) {
    console.error("Video gallery unavailable — rendering the built-in list.", error);
    return defaultVideos;
  }
});

export const updateVideosFn = createServerFn({ method: "POST" })
  .validator(videosSchema)
  .handler(async ({ data, context }) => {
    await requireAuth(context as Parameters<typeof requireAuth>[0]);

    try {
      const store = getContentStore(getApiEnv(context));
      await store.setVideos(sanitizeVideos(data as Video[]));
      return { success: true as const };
    } catch (error) {
      console.error(error);
      throw new Error("Unable to save videos");
    }
  });
