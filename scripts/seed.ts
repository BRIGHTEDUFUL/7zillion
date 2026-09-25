/**
 * Seed script — migrates all content from src/data/site.ts into a local D1
 * database running under `wrangler dev`.
 *
 * Usage (after `wrangler dev` is running):
 *   npx tsx scripts/seed.ts
 *
 * Or against the remote database:
 *   wrangler d1 execute seven-zillions-content --file scripts/seed.sql
 *
 * The script is idempotent: it uses UPSERT (INSERT ... ON CONFLICT DO UPDATE)
 * so it is safe to run multiple times.
 */

import {
  company,
  products,
  solutions,
  packages,
  projects,
  insights,
  services,
} from "../src/data/site";

// ──────────────────────────────────────────────────────────────────────────────
// Types (minimal subset to avoid importing the Worker-only content-store module)
// ──────────────────────────────────────────────────────────────────────────────

interface Row {
  sql: string;
  params: (string | number | null)[];
}

// ──────────────────────────────────────────────────────────────────────────────
// Build SQL statements
// ──────────────────────────────────────────────────────────────────────────────

const rows: Row[] = [];

// Company (single row, id = 1)
rows.push({
  sql: "INSERT INTO company (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data",
  params: [1, JSON.stringify(company)],
});

// Products
for (const product of products) {
  rows.push({
    sql: "INSERT INTO products (slug, data) VALUES (?, ?) ON CONFLICT(slug) DO UPDATE SET data = excluded.data, updated_at = datetime('now')",
    params: [product.slug, JSON.stringify(product)],
  });
}

// Solutions
for (const solution of solutions) {
  rows.push({
    sql: "INSERT INTO solutions (slug, data) VALUES (?, ?) ON CONFLICT(slug) DO UPDATE SET data = excluded.data, updated_at = datetime('now')",
    params: [solution.slug, JSON.stringify(solution)],
  });
}

// Packages
for (const pkg of packages) {
  rows.push({
    sql: "INSERT INTO packages (slug, data) VALUES (?, ?) ON CONFLICT(slug) DO UPDATE SET data = excluded.data, updated_at = datetime('now')",
    params: [pkg.slug, JSON.stringify(pkg)],
  });
}

// Projects — assign UUID if missing
for (const project of projects) {
  const id = crypto.randomUUID();
  const projectWithId = { ...project, id };
  rows.push({
    sql: "INSERT INTO projects (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data",
    params: [id, JSON.stringify(projectWithId)],
  });
}

// Insights
for (const insight of insights) {
  rows.push({
    sql: "INSERT INTO insights (slug, data) VALUES (?, ?) ON CONFLICT(slug) DO UPDATE SET data = excluded.data, updated_at = datetime('now')",
    params: [insight.slug, JSON.stringify(insight)],
  });
}

// Services (single row, id = 1)
rows.push({
  sql: "INSERT INTO services (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data",
  params: [1, JSON.stringify(services)],
});

// ──────────────────────────────────────────────────────────────────────────────
// Execute via Wrangler D1 REST API (wrangler dev must be running on port 8787)
// ──────────────────────────────────────────────────────────────────────────────

const WRANGLER_DEV_URL = process.env["WRANGLER_DEV_URL"] ?? "http://localhost:8787";

async function executeRow(row: Row): Promise<void> {
  // Wrangler dev exposes a D1 execute endpoint at /__db/execute
  const response = await fetch(`${WRANGLER_DEV_URL}/__db/execute`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sql: row.sql, params: row.params }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`D1 execute failed (${response.status}): ${text}`);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Alternative: generate SQL file for wrangler d1 execute --file
// ──────────────────────────────────────────────────────────────────────────────

function escape(value: string | number | null): string {
  if (value === null) return "NULL";
  if (typeof value === "number") return String(value);
  // Escape single quotes by doubling them
  return `'${String(value).replace(/'/g, "''")}'`;
}

function toSqlFile(statements: Row[]): string {
  return statements
    .map((row) => {
      let sql = row.sql;
      let paramIndex = 0;
      sql = sql.replace(/\?/g, () => escape(row.params[paramIndex++] ?? null));
      return sql + ";";
    })
    .join("\n");
}

// ──────────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────────

async function main() {
  const mode = process.argv[2] ?? "sql";

  if (mode === "sql") {
    // Write a .sql file that can be executed with: wrangler d1 execute ... --file scripts/seed.sql
    const { writeFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const sqlPath = resolve(import.meta.dirname ?? ".", "seed.sql");
    writeFileSync(sqlPath, toSqlFile(rows), "utf8");
    console.log(`✓ Wrote ${rows.length} statements to ${sqlPath}`);
    console.log("Run: wrangler d1 execute seven-zillions-content --local --file scripts/seed.sql");
    console.log("Or:  wrangler d1 execute seven-zillions-content --remote --file scripts/seed.sql");
    return;
  }

  if (mode === "dev") {
    // Execute live against wrangler dev
    console.log(`Seeding ${rows.length} rows via ${WRANGLER_DEV_URL}…`);
    let success = 0;
    for (const row of rows) {
      try {
        await executeRow(row);
        success++;
      } catch (error) {
        console.error("✗", row.sql.slice(0, 60), error);
      }
    }
    console.log(`✓ ${success}/${rows.length} rows seeded`);
    return;
  }

  console.error(`Unknown mode "${mode}". Use: npx tsx scripts/seed.ts [sql|dev]`);
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
