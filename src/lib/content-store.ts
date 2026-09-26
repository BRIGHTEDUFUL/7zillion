import "@tanstack/react-start/server-only";

import type {
  ActivityLogEntry,
  Company,
  EventType,
  Insight,
  Package,
  PagesContent,
  Product,
  Project,
  Service,
  Solution,
} from "@/types/content";

// ──────────────────────────────────────────────────────────────────────────────
// Public types — kept stable so the rest of the codebase compiles unchanged
// ──────────────────────────────────────────────────────────────────────────────

export type CollectionName = "products" | "solutions" | "packages" | "insights";

export interface ActivityQueryOptions {
  limit?: number;
  since?: Date;
  eventTypes?: EventType[];
}

export interface ActivityEntryInput {
  eventType?: EventType;
  /** Legacy spelling accepted at the public recording boundary. */
  type?: EventType;
  path?: string;
  slug?: string;
  timestamp: string;
  id?: number;
}

/**
 * Minimal env shape used by server functions.
 * CONVEX_URL and CONVEX_DEPLOY_KEY are read from process.env at runtime.
 */
export interface EnvBindings {
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD_HASH: string;
}

export type Env = EnvBindings;

// ──────────────────────────────────────────────────────────────────────────────
// ContentStore interface
// ──────────────────────────────────────────────────────────────────────────────

export interface ContentStore {
  getCompany(): Promise<Company>;
  setCompany(data: Company): Promise<void>;

  listItems<T>(collection: CollectionName): Promise<T[]>;
  getItem<T>(collection: CollectionName, slug: string): Promise<T | null>;
  putItem<T extends { slug: string }>(collection: CollectionName, item: T): Promise<void>;
  updateItem<T extends { slug: string }>(collection: CollectionName, item: T): Promise<void>;
  deleteItem(collection: CollectionName, slug: string): Promise<void>;

  listProjects(): Promise<Project[]>;
  putProject(project: Project): Promise<void>;
  deleteProject(id: string): Promise<void>;

  getServices(): Promise<Service[]>;
  setServices(services: Service[]): Promise<void>;

  /** null when the deployment has never saved page copy. */
  getPages(): Promise<PagesContent | null>;
  setPages(pages: PagesContent): Promise<void>;

  appendActivity(entry: ActivityLogEntry | ActivityEntryInput): Promise<void>;
  queryActivity(opts?: ActivityQueryOptions): Promise<ActivityLogEntry[]>;
}

// ──────────────────────────────────────────────────────────────────────────────
// DuplicateSlugError
// ──────────────────────────────────────────────────────────────────────────────

export class DuplicateSlugError extends Error {
  readonly code = "DUPLICATE_SLUG" as const;
  readonly collection: CollectionName;
  readonly slug: string;

  constructor(collection: CollectionName, slug: string) {
    super(`The slug "${slug}" is already in use in ${collection}.`);
    this.name = "DuplicateSlugError";
    this.collection = collection;
    this.slug = slug;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Convex HTTP helpers
//
// Public queries  → GET /api/query    (no Authorization header needed)
// Internal writes → POST /api/mutation  (requires Authorization: Convex <key>)
// ──────────────────────────────────────────────────────────────────────────────

const VALID_EVENT_TYPES = new Set<string>([
  "page_view",
  "whatsapp_click",
  "contact_submission",
  "enquiry_submission",
]);

function getConvexUrl(): string {
  const url = (typeof process !== "undefined" && process.env["CONVEX_URL"]) || "";
  if (!url) throw new Error("CONVEX_URL environment variable is not set.");
  return url;
}

function getConvexDeployKey(): string {
  const key = (typeof process !== "undefined" && process.env["CONVEX_DEPLOY_KEY"]) || "";
  if (!key) throw new Error("CONVEX_DEPLOY_KEY environment variable is not set.");
  return key;
}

/** Call a public Convex query (SSR loaders, public pages — no auth required). */
async function convexQuery(
  convexUrl: string,
  fn: string,
  args: Record<string, unknown> = {},
): Promise<unknown> {
  const res = await fetch(`${convexUrl}/api/query`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ path: fn, args }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Convex query "${fn}" failed (${res.status}): ${text}`);
  }
  const json = (await res.json()) as { value?: unknown; errorMessage?: string };
  if (json.errorMessage) throw new Error(`Convex query "${fn}": ${json.errorMessage}`);
  return json.value;
}

/** Call an internal Convex mutation (admin writes — requires deploy key). */
async function convexInternalMutation(
  convexUrl: string,
  fn: string,
  args: Record<string, unknown> = {},
): Promise<unknown> {
  const res = await fetch(`${convexUrl}/api/mutation`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Convex ${getConvexDeployKey()}`,
    },
    body: JSON.stringify({ path: fn, args }),
  });
  if (!res.ok) {
    const text = await res.text();
    if (text.includes("DUPLICATE_SLUG")) {
      const match = /DUPLICATE_SLUG:(\w+):(.+)/.exec(text);
      if (match) throw new DuplicateSlugError(match[1] as CollectionName, match[2]!);
    }
    throw new Error(`Convex mutation "${fn}" failed (${res.status}): ${text}`);
  }
  const json = (await res.json()) as { value?: unknown; errorMessage?: string };
  if (json.errorMessage) {
    if (json.errorMessage.includes("DUPLICATE_SLUG")) {
      const match = /DUPLICATE_SLUG:(\w+):(.+)/.exec(json.errorMessage);
      if (match) throw new DuplicateSlugError(match[1] as CollectionName, match[2]!);
    }
    throw new Error(`Convex mutation "${fn}": ${json.errorMessage}`);
  }
  return json.value;
}

// ──────────────────────────────────────────────────────────────────────────────
// Collection function map
// ──────────────────────────────────────────────────────────────────────────────

const COLLECTION_FN: Record<
  CollectionName,
  { list: string; get: string; create: string; upsert: string; del: string }
> = {
  products: {
    list: "content:listProducts",
    get: "content:getProduct",
    create: "content:createProduct",
    upsert: "content:upsertProduct",
    del: "content:deleteProduct",
  },
  solutions: {
    list: "content:listSolutions",
    get: "content:getSolution",
    create: "content:createSolution",
    upsert: "content:upsertSolution",
    del: "content:deleteSolution",
  },
  packages: {
    list: "content:listPackages",
    get: "content:getPackage",
    create: "content:createPackage",
    upsert: "content:upsertPackage",
    del: "content:deletePackage",
  },
  insights: {
    list: "content:listInsights",
    get: "content:getInsight",
    create: "content:createInsight",
    upsert: "content:upsertInsight",
    del: "content:deleteInsight",
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// ConvexContentStore
// ──────────────────────────────────────────────────────────────────────────────

export class ConvexContentStore implements ContentStore {
  constructor(private readonly url: string) {}

  // ── Company ──────────────────────────────────────────────────────────────

  async getCompany(): Promise<Company> {
    const raw = await convexQuery(this.url, "content:getCompany");
    if (!raw) throw new Error("Company content has not been initialised");
    return parseJson<Company>(raw, "company");
  }

  async setCompany(data: Company): Promise<void> {
    await convexInternalMutation(this.url, "content:setCompany", { data: JSON.stringify(data) });
  }

  // ── Collections ──────────────────────────────────────────────────────────

  async listItems<T>(collection: CollectionName): Promise<T[]> {
    const fns = COLLECTION_FN[collection];
    const rows = (await convexQuery(this.url, fns.list)) as Array<{ data: string }>;
    return (rows ?? []).map((r) => parseJson<T>(r.data, collection));
  }

  async getItem<T>(collection: CollectionName, slug: string): Promise<T | null> {
    const fns = COLLECTION_FN[collection];
    const row = (await convexQuery(this.url, fns.get, { slug })) as { data: string } | null;
    if (!row) return null;
    return parseJson<T>(row.data, collection);
  }

  /**
   * Insert a new item. Throws DuplicateSlugError if the slug already exists.
   * Use updateItem() to overwrite an existing item.
   */
  async putItem<T extends { slug: string }>(collection: CollectionName, item: T): Promise<void> {
    const fns = COLLECTION_FN[collection];
    await convexInternalMutation(this.url, fns.create, {
      slug: item.slug,
      data: JSON.stringify(item),
    });
  }

  /**
   * Replace an existing item, or insert when it doesn't exist.
   * This is the correct method for edit flows.
   */
  async updateItem<T extends { slug: string }>(collection: CollectionName, item: T): Promise<void> {
    const fns = COLLECTION_FN[collection];
    await convexInternalMutation(this.url, fns.upsert, {
      slug: item.slug,
      data: JSON.stringify(item),
    });
  }

  async deleteItem(collection: CollectionName, slug: string): Promise<void> {
    const fns = COLLECTION_FN[collection];
    await convexInternalMutation(this.url, fns.del, { slug });
  }

  // ── Projects ─────────────────────────────────────────────────────────────

  async listProjects(): Promise<Project[]> {
    const rows = (await convexQuery(this.url, "content:listProjects")) as Array<{ data: string }>;
    return (rows ?? []).map((r) => parseJson<Project>(r.data, "projects"));
  }

  async putProject(project: Project): Promise<void> {
    await convexInternalMutation(this.url, "content:upsertProject", {
      projectId: project.id,
      date: project.date,
      data: JSON.stringify(project),
    });
  }

  async deleteProject(id: string): Promise<void> {
    await convexInternalMutation(this.url, "content:deleteProject", { projectId: id });
  }

  // ── Services ─────────────────────────────────────────────────────────────

  async getServices(): Promise<Service[]> {
    const raw = (await convexQuery(this.url, "content:getServices")) as string;
    if (!raw) return [];
    return parseJson<Service[]>(raw, "services");
  }

  async setServices(services: Service[]): Promise<void> {
    await convexInternalMutation(this.url, "content:setServices", {
      data: JSON.stringify(services),
    });
  }

  // ── Page copy ───────────────────────────────────────────────────────────

  async getPages(): Promise<PagesContent | null> {
    const raw = (await convexQuery(this.url, "content:getPages")) as string | null;
    if (!raw) return null;
    return parseJson<PagesContent>(raw, "pages");
  }

  async setPages(pages: PagesContent): Promise<void> {
    await convexInternalMutation(this.url, "content:setPages", { data: JSON.stringify(pages) });
  }

  // ── Activity log ─────────────────────────────────────────────────────────

  async appendActivity(entry: ActivityLogEntry | ActivityEntryInput): Promise<void> {
    const eventType = resolveEventType(entry);
    await convexInternalMutation(this.url, "content:appendActivity", {
      eventType,
      path: entry.path ?? undefined,
      slug: entry.slug ?? undefined,
      // Always use server time — never trust the client-supplied timestamp.
      timestamp: new Date().toISOString(),
    });
  }

  async queryActivity(opts: ActivityQueryOptions = {}): Promise<ActivityLogEntry[]> {
    const args: Record<string, unknown> = {};
    if (opts.limit !== undefined) args["limit"] = opts.limit;
    if (opts.since !== undefined)
      args["since"] = opts.since instanceof Date ? opts.since.toISOString() : String(opts.since);
    if (opts.eventTypes !== undefined) args["eventTypes"] = opts.eventTypes;

    const rows = (await convexQuery(this.url, "content:queryActivity", args)) as Array<{
      _id: string;
      eventType: string;
      path?: string;
      slug?: string;
      timestamp: string;
    }>;

    return (rows ?? []).map((r) => ({
      // Use the Convex document _id as the stable identifier instead of array index.
      id: r._id,
      eventType: r.eventType as EventType,
      path: r.path,
      slug: r.slug,
      timestamp: r.timestamp,
    }));
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Factory
// ──────────────────────────────────────────────────────────────────────────────

export function getContentStore(_env?: unknown): ContentStore {
  const convexUrl = getConvexUrl();
  return new ConvexContentStore(convexUrl);
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function parseJson<T>(value: unknown, context: string): T {
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      throw new Error(`Could not parse ${context} JSON`);
    }
  }
  if (value !== null && typeof value === "object") return value as T;
  throw new Error(`Invalid ${context} data`);
}

function resolveEventType(entry: ActivityLogEntry | ActivityEntryInput): EventType {
  const eventType = (entry as ActivityEntryInput).eventType ?? (entry as ActivityEntryInput).type;
  if (!eventType || !VALID_EVENT_TYPES.has(eventType)) {
    throw new TypeError("A valid activity event type is required");
  }
  return eventType as EventType;
}
