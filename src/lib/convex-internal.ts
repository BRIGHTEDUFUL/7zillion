import "@tanstack/react-start/server-only";

/**
 * Convex connection helpers shared by every server-side caller.
 *
 * Both values are read from process.env at call time rather than bundled:
 * CONVEX_URL points at the deployed backend, CONVEX_DEPLOY_KEY signs the
 * internal API (functions marked internalMutation / internalQuery). Treat the
 * key like a database password — docs/DEPLOY_HOSTINGER.md §3.
 */
export function getConvexUrl(): string {
  const url = (typeof process !== "undefined" && process.env["CONVEX_URL"]) || "";
  if (!url) throw new Error("CONVEX_URL environment variable is not set.");
  return url;
}

export function getConvexDeployKey(): string {
  const key = (typeof process !== "undefined" && process.env["CONVEX_DEPLOY_KEY"]) || "";
  if (!key) throw new Error("CONVEX_DEPLOY_KEY environment variable is not set.");
  return key;
}
