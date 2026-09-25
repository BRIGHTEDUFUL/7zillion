/**
 * Seeds a Convex deployment with the site content in src/data/site.ts.
 *
 * Usage:
 *   node scripts/seed-convex.ts             # write JSON + import into Convex
 *   node scripts/seed-convex.ts --dry-run   # only write scripts/.seed/*.json
 *
 * Row shapes must match convex/schema.ts exactly, because `npx convex import`
 * validates rows against the deployed schema. See src/lib/content-store.ts for
 * the read/write helpers these rows are consumed by.
 *
 * Images: site.ts imports JPGs, so the module is loaded through a Vite dev
 * server (it resolves `@/*` aliases and turns asset imports into URLs). Vite
 * serves them as `/src/assets/brand/x.jpg`, which only exists in dev — the
 * seeded value is rewritten to `/assets/brand/x.jpg`, a copy that lives in
 * public/ and is served identically by `vite dev` and the Nitro build.
 */
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { createServer } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const ROOT = process.cwd();
const SOURCE_MODULE = "/src/data/site.ts";
const OUTPUT_DIR = path.join(ROOT, "scripts", ".seed");
const DRY_RUN = process.argv.includes("--dry-run");

interface SeedItem {
  slug?: string;
  date?: string;
  [key: string]: unknown;
}

interface SiteModule {
  company: SeedItem;
  products: SeedItem[];
  solutions: SeedItem[];
  packages: SeedItem[];
  insights: SeedItem[];
  projects: SeedItem[];
  services: SeedItem[];
}

const ASSET_PATTERN = /^\/src\/assets\/brand\/(.+)$/;

function rewriteAssetString(value: string): string {
  const match = ASSET_PATTERN.exec(value);
  return match ? `/assets/brand/${match[1]}` : value;
}

function rewriteAssets(value: unknown): unknown {
  if (typeof value === "string") return rewriteAssetString(value);
  if (Array.isArray(value)) return value.map(rewriteAssets);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, rewriteAssets(entry)]),
    );
  }
  return value;
}

function collectionRows(items: SeedItem[], updatedAt: string): unknown[] {
  return items.map((item) => {
    if (typeof item.slug !== "string") {
      throw new Error("Collection item is missing a slug");
    }
    return {
      slug: item.slug,
      data: JSON.stringify(rewriteAssets(item)),
      updatedAt,
    };
  });
}

function projectRows(items: SeedItem[]): unknown[] {
  return items.map((item) => {
    const projectId = randomUUID();
    const project = { ...item, id: projectId };
    if (typeof item.date !== "string") {
      throw new Error("Project is missing a date");
    }
    return {
      projectId,
      date: item.date,
      data: JSON.stringify(rewriteAssets(project)),
    };
  });
}

async function loadSiteModule(): Promise<SiteModule> {
  const server = await createServer({
    configFile: false,
    root: ROOT,
    logLevel: "error",
    appType: "custom",
    server: { middlewareMode: true, hmr: false },
    plugins: [tsconfigPaths({ projects: ["./tsconfig.json"] })],
  });
  try {
    return (await server.ssrLoadModule(SOURCE_MODULE)) as SiteModule;
  } finally {
    await server.close();
  }
}

function importTable(table: string): boolean {
  const file = path.join(OUTPUT_DIR, `${table}.json`);
  const relative = path.relative(ROOT, file).split(path.sep).join("/");
  const command = `npx convex import --table ${table} --format jsonArray --replace -y "${relative}"`;
  console.log(`\n> ${command}`);
  const result = spawnSync(command, { cwd: ROOT, shell: true, stdio: "inherit" });
  return result.status === 0;
}

async function main(): Promise<void> {
  const site = await loadSiteModule();
  const updatedAt = new Date().toISOString();

  const rows: Record<string, unknown[]> = {
    company: [{ data: JSON.stringify(rewriteAssets(site.company)) }],
    products: collectionRows(site.products, updatedAt),
    solutions: collectionRows(site.solutions, updatedAt),
    packages: collectionRows(site.packages, updatedAt),
    insights: collectionRows(site.insights, updatedAt),
    projects: projectRows(site.projects),
    services: [{ data: JSON.stringify(rewriteAssets(site.services)) }],
  };

  mkdirSync(OUTPUT_DIR, { recursive: true });
  for (const [table, tableRows] of Object.entries(rows)) {
    const file = path.join(OUTPUT_DIR, `${table}.json`);
    writeFileSync(file, `${JSON.stringify(tableRows, null, 2)}\n`, "utf8");
    console.log(
      `${table.padEnd(10)} ${String(tableRows.length).padStart(3)} rows -> ${path.relative(ROOT, file)}`,
    );
  }

  if (DRY_RUN) {
    console.log("\nDry run: skipped `npx convex import`.");
    return;
  }

  const failed: string[] = [];
  for (const table of Object.keys(rows)) {
    if (!importTable(table)) failed.push(table);
  }

  if (failed.length > 0) {
    console.error(`\nImport failed for: ${failed.join(", ")}`);
    console.error(
      "Is a deployment configured? (.env.local CONVEX_DEPLOY_KEY, or CONVEX_DEPLOYMENT)",
    );
    process.exit(1);
  }
  console.log("\nSeed complete.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
