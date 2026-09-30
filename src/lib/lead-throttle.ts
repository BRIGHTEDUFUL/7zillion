/**
 * A per-IP brake on how often one client may create a lead.
 *
 * The quote forms are a public write endpoint. The honeypot stops the lazy
 * bots, but one that deliberately leaves `botcheck` empty could fill the leads
 * table with junk, so the write path also has a budget: five accepted writes
 * per IP per ten minutes.
 *
 * Going over it only skips the database copy — the Web3Forms email still goes
 * out, so a real visitor who submits a sixth refinement in the same window
 * still reaches the team. In-process and single-instance on purpose, the same
 * trade-off as the rate limiter in src/lib/auth.ts.
 */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_WRITES_PER_WINDOW = 5;

/** Pressure valve: beyond this many tracked IPs the counters are dropped. */
const MAX_TRACKED_IPS = 5_000;

type RateEntry = { count: number; expiresAt: number };

const writes = new Map<string, RateEntry>();

function sweep(now: number): void {
  if (writes.size === 0) return;
  for (const [ip, entry] of writes) {
    if (entry.expiresAt <= now) writes.delete(ip);
  }
  if (writes.size > MAX_TRACKED_IPS) writes.clear();
}

function windowExpiry(now: number): number {
  // End of the current clock-aligned window, always strictly in the future,
  // so a write landing exactly on a boundary still counts for a full window.
  return Math.floor(now / WINDOW_MS) * WINDOW_MS + WINDOW_MS;
}

/**
 * Read-only: asking never spends the budget, so a caller can check before it
 * does any work. `now` is injectable so the window can be tested without
 * sleeping.
 */
export function allowLeadWrite(ip: string, now: number = Date.now()): boolean {
  sweep(now);
  return (writes.get(ip)?.count ?? 0) < MAX_WRITES_PER_WINDOW;
}

/** Charge one accepted write to this IP. */
export function recordLeadWrite(ip: string, now: number = Date.now()): void {
  sweep(now);

  const entry = writes.get(ip);
  if (!entry) {
    writes.set(ip, { count: 1, expiresAt: windowExpiry(now) });
    return;
  }
  entry.count += 1;
}
