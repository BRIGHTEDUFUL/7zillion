// package.json declares `"sideEffects": false`, so a bare side-effect import of
// load-local-env would be tree-shaken away. Import the function and call it in
// this entry's top level instead: ESM evaluates imports in order, and this
// module's body runs when Nitro boots — before any request reads process.env.
import { loadLocalEnv } from "./lib/load-local-env";
import "./lib/error-capture";

loadLocalEnv();

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  // Node preset: Nitro handles the HTTP server itself, but the SSR handler
  // still exposes a fetch-compatible interface that TanStack Start calls.
  fetch: (request: Request) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a 500 JSON response — normalise those
// into a proper HTML error page so the browser doesn't show raw JSON.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

// Lightweight liveness probe for Hostinger/uptime checks: answered before the
// SSR pipeline so it stays fast and cannot be broken by route changes.
function handleHealth(request: Request): Response | undefined {
  const { pathname } = new URL(request.url);
  if (pathname !== "/api/health" || request.method !== "GET") return undefined;
  return new Response(
    JSON.stringify({ ok: true, service: "seven-zillions", time: new Date().toISOString() }),
    {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      },
    },
  );
}

// Node preset: export a standard fetch handler (used by Nitro's node adapter).
export default {
  async fetch(request: Request) {
    try {
      const health = handleHealth(request);
      if (health) return health;
      const handler = await getServerEntry();
      const response = await handler.fetch(request);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
