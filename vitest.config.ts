import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths({ projects: ["./tsconfig.json"] })],
  test: {
    environment: "node",
    globals: true,
    // bcrypt-loop tests (30+ logins / 20 password rotations) run in seconds on
    // a quiet machine but can exceed vitest's 5s default under load, which
    // turns them into zombies that pollute later tests' shared mock state.
    testTimeout: 15_000,
    // Mock the server-only guard so tests can import auth.ts directly
    server: {
      deps: {
        inline: ["@tanstack/react-start"],
      },
    },
  },
});
