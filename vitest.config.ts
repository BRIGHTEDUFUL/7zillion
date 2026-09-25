import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths({ projects: ["./tsconfig.json"] })],
  test: {
    environment: "node",
    globals: true,
    // Mock the server-only guard so tests can import auth.ts directly
    server: {
      deps: {
        inline: ["@tanstack/react-start"],
      },
    },
  },
});
