import { describe, expect, it } from "vitest";

import { allowLeadWrite, recordLeadWrite } from "@/lib/lead-throttle";

/** Same arithmetic as the store: budgets refill on window boundaries. */
const WINDOW_MS = 10 * 60 * 1000;
/** Exactly on a boundary, so the window under test is NOW … NOW + WINDOW_MS. */
const NOW = 1_200_000;

/** Counters live in module scope, so each test gets its own IPs. */
describe("lead throttle", () => {
  it("lets an unknown IP through without spending its budget", () => {
    const ip = "allow-unknown";

    for (let i = 0; i < 25; i++) {
      expect(allowLeadWrite(ip, NOW)).toBe(true);
    }
  });

  it("blocks the sixth accepted write inside the same window", () => {
    const ip = "block-sixth";

    for (let i = 0; i < 5; i++) {
      expect(allowLeadWrite(ip, NOW)).toBe(true);
      recordLeadWrite(ip, NOW);
    }

    expect(allowLeadWrite(ip, NOW)).toBe(false);
    expect(allowLeadWrite(ip, NOW + WINDOW_MS - 1)).toBe(false);
  });

  it("refills the budget once the window has rolled over", () => {
    const ip = "refill";

    for (let i = 0; i < 5; i++) recordLeadWrite(ip, NOW);
    expect(allowLeadWrite(ip, NOW)).toBe(false);

    expect(allowLeadWrite(ip, NOW + WINDOW_MS)).toBe(true);
  });

  it("keeps one IP's budget independent of another's", () => {
    for (let i = 0; i < 5; i++) recordLeadWrite("busy-ip", NOW);

    expect(allowLeadWrite("busy-ip", NOW)).toBe(false);
    expect(allowLeadWrite("quiet-ip", NOW)).toBe(true);
  });
});
