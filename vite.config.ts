import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";

// Self-contained build config: TanStack Start + Tailwind + TS paths.
// Plugin order matters:
//   1. tailwindcss  — processes CSS before anything else
//   2. tsConfigPaths — resolves @/* aliases for all subsequent plugins
//   3. tanstackStart — registers the TanStack Router plugin, which must run
//                      BEFORE JSX transformation plugins
//   4. viteReact     — JSX/Refresh transform, after the router plugin
//   5. nitro         — builds the server bundle into .output (build only).
//                      tanstackStart does not invoke nitro itself; without it
//                      there is no server artifact for `npm start`.
//                      Preset must be `node-server`: `npm start` runs
//                      `node .output/server/index.mjs`, so a
//                      cloudflare-module bundle (worker entry + wrangler.json)
//                      would not start under plain Node.
export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      // Server entry is resolved relative to `src/`, so this is src/server.ts
      // (our SSR error wrapper + .env loader). Note: `./src/server.ts` does NOT
      // work here — it resolves to src/src/server.ts, fails silently, and TanStack
      // falls back to its own default entry, skipping our wrapper entirely.
      server: { entry: "server" },
    }),
    viteReact(),
    ...(command === "build" ? [nitro({ defaultPreset: "node-server" })] : []),
  ],
}));
