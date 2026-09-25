import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireAuth } from "@/lib/require-auth";

const uploadInputSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
});

function getConvexUrl(): string {
  const url = (typeof process !== "undefined" && process.env["CONVEX_URL"]) || "";
  if (!url) throw new Error("CONVEX_URL environment variable is not set.");
  return url;
}

function getConvexDeployKey(): string {
  const key = (typeof process !== "undefined" && process.env["CONVEX_DEPLOY_KEY"]) || "";
  if (!key) throw new Error("CONVEX_DEPLOY_KEY environment variable is not set.");
  return key;
}

/**
 * Generates a Convex upload URL for direct client-to-Convex file upload.
 *
 * Flow:
 *   1. Server calls Convex generateUploadUrl internalMutation (with deploy key)
 *      → gets a short-lived PUT URL and the canonical public URL
 *   2. Client PUTs the file bytes directly to that URL
 *   3. Client stores the publicUrl returned here in the content record
 *
 * Returns:
 *   uploadUrl — the presigned PUT URL the client should upload to
 *   publicUrl — the permanent public URL to store in the content record
 */
export const getUploadUrlFn = createServerFn({ method: "POST" })
  .validator(uploadInputSchema)
  .handler(async ({ data, context }) => {
    await requireAuth(context as Parameters<typeof requireAuth>[0]);

    try {
      const convexUrl = getConvexUrl();
      const deployKey = getConvexDeployKey();

      // `/api/mutation` serves public and internal functions alike — the deploy
      // key in the Authorization header is what unlocks this internal mutation.
      const res = await fetch(`${convexUrl}/api/mutation`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Convex ${deployKey}`,
        },
        body: JSON.stringify({
          path: "files:generateUploadUrl",
          args: { contentType: data.contentType },
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Convex generateUploadUrl failed (${res.status}): ${text}`);
      }

      const json = (await res.json()) as {
        value?: { uploadUrl: string; storageId: string; publicUrl: string | null };
        errorMessage?: string;
      };

      if (json.errorMessage) throw new Error(json.errorMessage);

      const { uploadUrl, publicUrl } = json.value ?? {};
      if (!uploadUrl) throw new Error("Convex did not return an upload URL");
      if (!publicUrl) throw new Error("Convex did not return a public URL for the uploaded file");

      return { uploadUrl, publicUrl };
    } catch (error) {
      console.error("getUploadUrlFn:", error);
      throw new Error("Image upload unavailable. Please try again.");
    }
  });
