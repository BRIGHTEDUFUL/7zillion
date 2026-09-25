/**
 * Convex file storage helpers.
 *
 * generateUploadUrl is internalMutation — NOT callable from the public HTTP API.
 * Only the authenticated server-side upload handler in src/api/upload.ts calls
 * this (after verifying the admin session).
 *
 * Returns both the short-lived PUT URL and the permanent public URL so the
 * caller never needs to construct the storage URL manually.
 */

import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const generateUploadUrl = internalMutation({
  args: {
    contentType: v.string(),
  },
  handler: async (ctx, { contentType: _contentType }) => {
    // Generate a short-lived presigned PUT URL for direct browser upload.
    const uploadUrl = await ctx.storage.generateUploadUrl();

    // Extract the storageId from the upload URL so we can build the public URL.
    // Convex upload URLs have the form:
    //   https://<deployment>.convex.cloud/api/storage/<storageId>?...
    const storageId = uploadUrl.split("/storage/")[1]?.split("?")[0] ?? "";

    // Get the canonical public URL from Convex storage (not constructed manually).
    // getUrl returns null only when the storageId doesn't exist yet; since we
    // just generated the upload URL the storageId is always valid here.
    const publicUrl = storageId ? await ctx.storage.getUrl(storageId) : null;

    return { uploadUrl, storageId, publicUrl };
  },
});
