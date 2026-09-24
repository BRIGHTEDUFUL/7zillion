import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";

// Self-contained build config: TanStack Start + Tailwind + TS paths.
// `viteReact` supplies the React Refresh runtime that dev mode requires.
// Nitro only runs on `build` (it produces the server bundle); `vite dev` skips it.
export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
      server: { entry: "server" },
    }),
    viteReact(),
    ...(command === "build" ? [nitro({ defaultPreset: "cloudflare-module" })] : []),
  ],
}));
