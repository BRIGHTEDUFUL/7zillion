import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * Vite loads `.env` for `vite dev` and `vite build`, but the built Nitro server
 * runs on plain Node, where `.env` files are not read at all. In production the
 * values come from the host's environment (Hostinger's environment panel);
 * locally `npm start` has no such thing, so fill in whatever is missing from
 * `./.env` and `./.env.local` (the Convex CLI writes CONVEX_DEPLOY_KEY there).
 *
 * Precedence matches Vite: real environment beats both files, and `.env.local`
 * overrides `.env`.
 *
 * Called from src/server.ts so the values are set before anything reads them.
 */
export function loadLocalEnv(files: string[] = [".env", ".env.local"]): void {
  const fromFiles = new Set<string>();

  for (const file of files) {
    const envPath = path.resolve(process.cwd(), file);
    if (!existsSync(envPath)) continue;

    const contents = readFileSync(envPath, "utf8");
    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed === "" || trimmed.startsWith("#")) continue;

      const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(trimmed);
      if (match === null) continue;

      const key = match[1] ?? "";
      if (key === "") continue;
      if (process.env[key] !== undefined && !fromFiles.has(key)) continue;

      let value = (match[2] ?? "").trim();
      const quoted =
        (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
        (value.startsWith("'") && value.endsWith("'") && value.length >= 2);
      if (quoted) value = value.slice(1, -1);

      process.env[key] = value;
      fromFiles.add(key);
    }
  }
}
