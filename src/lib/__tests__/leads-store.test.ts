/**
 * The enquiry store talks to the Convex internal API over HTTP. These tests
 * pin the request shape — which function is called, under which auth header,
 * with which arguments — without touching a network.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  deleteLead,
  listLeads,
  persistLead,
  setLeadStatus,
  type ConvexFetch,
} from "@/lib/leads-store";
import type { LeadInput } from "@/lib/schemas";
import type { Lead } from "@/types/content";

const CONVEX_URL = "https://example.convex.cloud";
const DEPLOY_KEY = "test-deploy-key";

const leadInput: LeadInput = {
  name: "Kwame Mensah",
  email: "kwame@example.com",
  phone: "+233 554 602 103",
  requirements: "500ml bottle line, 60 bpm.",
  source: "/contact",
  botcheck: "",
};

type Recorded = { url: string; init: RequestInit };

/** A fetch stub answering with a fixed body, recording every call. */
function stubFetch(
  body: unknown,
  { ok = true, status = 200, text = "" }: { ok?: boolean; status?: number; text?: string } = {},
): { fetchImpl: ConvexFetch; calls: Recorded[] } {
  const calls: Recorded[] = [];
  const fetchImpl: ConvexFetch = async (url, init) => {
    calls.push({ url, init });
    return { ok, status, json: async () => body, text: async () => text } as unknown as Response;
  };
  return { fetchImpl, calls };
}

function bodyOf(call: Recorded): { path: string; args: Record<string, unknown> } {
  return JSON.parse(String(call.init.body)) as { path: string; args: Record<string, unknown> };
}

/** noUncheckedIndexedAccess: assert the request happened instead of `!`-ing it. */
function firstCall(calls: Recorded[]): Recorded {
  const call = calls[0];
  if (!call) throw new Error("Expected the store to have made a request.");
  return call;
}

function firstLead(leads: Lead[]): Lead {
  const lead = leads[0];
  if (!lead) throw new Error("Expected at least one lead.");
  return lead;
}

function restoreEnv(key: string, value: string | undefined): void {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

const originalUrl = process.env["CONVEX_URL"];
const originalKey = process.env["CONVEX_DEPLOY_KEY"];

beforeEach(() => {
  process.env["CONVEX_URL"] = CONVEX_URL;
  process.env["CONVEX_DEPLOY_KEY"] = DEPLOY_KEY;
});

afterEach(() => {
  restoreEnv("CONVEX_URL", originalUrl);
  restoreEnv("CONVEX_DEPLOY_KEY", originalKey);
});

describe("persistLead", () => {
  it("calls the internal create function with the deploy key", async () => {
    const { fetchImpl, calls } = stubFetch({ value: "lead-id-1" });

    const id = await persistLead(leadInput, { fetchImpl });

    expect(id).toBe("lead-id-1");
    expect(calls).toHaveLength(1);
    expect(firstCall(calls).url).toBe(`${CONVEX_URL}/api/mutation`);
    expect(firstCall(calls).init.headers).toMatchObject({
      "content-type": "application/json",
      Authorization: `Convex ${DEPLOY_KEY}`,
    });

    const body = bodyOf(firstCall(calls));
    expect(body.path).toBe("leads:create");
    expect(body.args).toMatchObject({
      name: "Kwame Mensah",
      email: "kwame@example.com",
      requirements: "500ml bottle line, 60 bpm.",
      source: "/contact",
      status: "new",
    });
    // The honeypot is a filter, not content: it never reaches the table.
    expect(body.args).not.toHaveProperty("botcheck");
  });

  it("keeps a phone number when there is one and omits it when there is not", async () => {
    const withPhone = stubFetch({ value: "id" });
    await persistLead(leadInput, { fetchImpl: withPhone.fetchImpl });
    expect(bodyOf(firstCall(withPhone.calls)).args).toHaveProperty("phone", "+233 554 602 103");

    const withoutPhone = stubFetch({ value: "id" });
    await persistLead({ ...leadInput, phone: "" }, { fetchImpl: withoutPhone.fetchImpl });
    expect(bodyOf(firstCall(withoutPhone.calls)).args).not.toHaveProperty("phone");
  });

  it("throws when Convex reports an error for the mutation", async () => {
    const { fetchImpl } = stubFetch({ errorMessage: "Unauthenticated" });

    await expect(persistLead(leadInput, { fetchImpl })).rejects.toThrow(
      'Convex mutation "leads:create": Unauthenticated',
    );
  });

  it("throws when the request itself fails", async () => {
    const { fetchImpl } = stubFetch({}, { ok: false, status: 503, text: "overloaded" });

    await expect(persistLead(leadInput, { fetchImpl })).rejects.toThrow("failed (503)");
  });

  it("throws when the mutation returns no id", async () => {
    const { fetchImpl } = stubFetch({ value: null });

    await expect(persistLead(leadInput, { fetchImpl })).rejects.toThrow("returned no id");
  });
});

describe("listLeads", () => {
  it("reads rows newest-first as admin records with `id`", async () => {
    const { fetchImpl, calls } = stubFetch({
      value: [
        {
          _id: "lead-2",
          _creationTime: 2,
          name: "Ama",
          email: "ama@example.com",
          requirements: "1L line",
          source: "/",
          status: "new",
          receivedAt: "2026-09-30T10:00:00.000Z",
        },
        {
          _id: "lead-1",
          _creationTime: 1,
          name: "Kojo",
          email: "kojo@example.com",
          phone: "+233 20 000 0000",
          requirements: "250ml line",
          source: "/contact",
          status: "closed",
          receivedAt: "2026-09-29T10:00:00.000Z",
        },
      ],
    });

    const leads = await listLeads({ fetchImpl });

    expect(firstCall(calls).url).toBe(`${CONVEX_URL}/api/query`);
    expect(bodyOf(firstCall(calls)).path).toBe("leads:list");
    expect(leads.map((lead) => lead.id)).toEqual(["lead-2", "lead-1"]);
    expect(leads[1]).toMatchObject({ status: "closed", phone: "+233 20 000 0000" });
    // Convex bookkeeping never leaks into the admin type.
    expect(leads[0]).not.toHaveProperty("_creationTime");
  });

  it("skips rows that do not parse instead of failing the whole list", async () => {
    const { fetchImpl } = stubFetch({
      value: [
        {
          _id: "lead-1",
          name: "Kojo",
          email: "kojo@example.com",
          requirements: "250ml line",
          source: "/contact",
          status: "new",
          receivedAt: "2026-09-29T10:00:00.000Z",
        },
        { _id: "lead-bad", name: "???", status: "not-a-status" },
        "not even an object",
      ],
    });

    const leads = await listLeads({ fetchImpl });

    expect(leads).toHaveLength(1);
    expect(firstLead(leads).id).toBe("lead-1");
  });

  it("throws when the response is not a list", async () => {
    const { fetchImpl } = stubFetch({ value: { rows: [] } });

    await expect(listLeads({ fetchImpl })).rejects.toThrow("did not return a list");
  });
});

describe("setLeadStatus / deleteLead", () => {
  it("targets the right internal functions with the lead id", async () => {
    const status = stubFetch({ value: null });
    await setLeadStatus("lead-9", "contacted", { fetchImpl: status.fetchImpl });
    expect(bodyOf(firstCall(status.calls))).toEqual({
      path: "leads:setStatus",
      args: { leadId: "lead-9", status: "contacted" },
    });

    const removal = stubFetch({ value: null });
    await deleteLead("lead-9", { fetchImpl: removal.fetchImpl });
    expect(bodyOf(firstCall(removal.calls))).toEqual({
      path: "leads:remove",
      args: { leadId: "lead-9" },
    });
  });
});

describe("configuration", () => {
  it("fails loudly when the deployment URL is missing", async () => {
    delete process.env["CONVEX_URL"];
    const { fetchImpl } = stubFetch({ value: "id" });

    await expect(persistLead(leadInput, { fetchImpl })).rejects.toThrow(
      "CONVEX_URL environment variable is not set.",
    );
  });

  it("fails loudly when the deploy key is missing", async () => {
    delete process.env["CONVEX_DEPLOY_KEY"];
    const { fetchImpl } = stubFetch({ value: "id" });

    await expect(persistLead(leadInput, { fetchImpl })).rejects.toThrow(
      "CONVEX_DEPLOY_KEY environment variable is not set.",
    );
  });
});
