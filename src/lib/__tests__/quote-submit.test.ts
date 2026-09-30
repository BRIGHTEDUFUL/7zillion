import { describe, expect, it, vi } from "vitest";

import {
  QUOTE_ENDPOINT,
  buildMailtoHref,
  buildQuotePayload,
  submitQuote,
  type QuoteFetch,
  type QuoteFields,
} from "../quote-submit";

const fields: QuoteFields = {
  name: "Ama Owusu",
  email: "ama@example.com",
  phone: "+233 554 602 103",
  requirements: "500ml PET, 6,000 bph, Ghana",
  botcheck: "",
};

const payload = buildQuotePayload(fields, "test-key");

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** Parsed query of a `mailto:` link, decoded the way a mail client reads it. */
function mailtoParams(href: string): URLSearchParams {
  return new URLSearchParams(href.slice(href.indexOf("?") + 1));
}

describe("buildQuotePayload", () => {
  it("sends the access key, the visitor's fields and a replyable address", () => {
    expect(payload.access_key).toBe("test-key");
    expect(payload.name).toBe(fields.name);
    expect(payload.email).toBe(fields.email);
    expect(payload.phone).toBe(fields.phone);
    expect(payload.requirements).toBe(fields.requirements);
    expect(payload.replyto).toBe(fields.email);
    expect(payload.subject).toBe("Line proposal request — Ama Owusu");
    expect(payload.from_name).toBe("Ama Owusu");
  });

  it("carries the honeypot value so Web3Forms can filter the sender", () => {
    expect(payload.botcheck).toBe("");
    expect(buildQuotePayload({ ...fields, botcheck: "spam" }, "k").botcheck).toBe("spam");
  });

  it("omits the phone row entirely when the visitor leaves it blank", () => {
    const withoutPhone = buildQuotePayload({ ...fields, phone: "" }, "test-key");
    expect(withoutPhone).not.toHaveProperty("phone");
  });

  it("keeps the subject readable when there is no name to append", () => {
    const nameless = buildQuotePayload({ ...fields, name: "" }, "test-key");
    expect(nameless.subject).toBe("Line proposal request");
    expect(nameless.from_name).toBe("Seven Zillions website");
  });
});

describe("buildMailtoHref", () => {
  it("addresses the message to the team and quotes the visitor's text", () => {
    const href = buildMailtoHref(fields, "sales@example.com");

    expect(href.startsWith("mailto:sales@example.com?")).toBe(true);

    const params = mailtoParams(href);
    expect(params.get("subject")).toBe("Line proposal request — Ama Owusu");

    const body = params.get("body") ?? "";
    expect(body).toContain("Name: Ama Owusu");
    expect(body).toContain("Email: ama@example.com");
    expect(body).toContain("Phone / WhatsApp: +233 554 602 103");
    expect(body).toContain(fields.requirements);
  });

  it("drops the phone line rather than showing an empty label", () => {
    const params = mailtoParams(buildMailtoHref({ ...fields, phone: "" }, "a@b.c"));
    expect(params.get("body")).not.toContain("Phone / WhatsApp");
  });
});

describe("submitQuote", () => {
  it("POSTs application/json to the provider endpoint", async () => {
    const fetchMock = vi.fn<QuoteFetch>(() => Promise.resolve(jsonResponse({ success: true })));

    const result = await submitQuote(payload, fetchMock);

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      QUOTE_ENDPOINT,
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );

    const [, init] = fetchMock.mock.calls[0] as [string, { body: string }];
    expect(JSON.parse(init.body)).toMatchObject({
      access_key: "test-key",
      name: fields.name,
    });
  });

  it("accepts the provider's legacy string success flag", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse({ success: "true" })));

    await expect(submitQuote(payload, fetchMock)).resolves.toEqual({ ok: true });
  });

  it("reports a refusal as rejected so the form can offer the mail client", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(jsonResponse({ success: false, message: "Invalid access key" }, 400)),
    );

    await expect(submitQuote(payload, fetchMock)).resolves.toEqual({
      ok: false,
      reason: "rejected",
    });
  });

  it("tells rate limiting apart from a hard failure", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 429 })));

    await expect(submitQuote(payload, fetchMock)).resolves.toEqual({
      ok: false,
      reason: "rate-limited",
    });
  });

  it("treats a server error or an unexpected body as unavailable", async () => {
    const serverError = vi.fn(() => Promise.resolve(new Response(null, { status: 503 })));
    const html = vi.fn(() =>
      Promise.resolve(new Response("<html>maintenance</html>", { status: 200 })),
    );

    await expect(submitQuote(payload, serverError)).resolves.toEqual({
      ok: false,
      reason: "unavailable",
    });
    await expect(submitQuote(payload, html)).resolves.toEqual({
      ok: false,
      reason: "unavailable",
    });
  });

  it("never throws: a dead network resolves as a network failure", async () => {
    const fetchMock = vi.fn(() => Promise.reject(new Error("offline")));

    await expect(submitQuote(payload, fetchMock)).resolves.toEqual({
      ok: false,
      reason: "network",
    });
  });

  it("matches the QuoteFetch signature the hook passes in", async () => {
    // Guards the contract itself: submitQuote takes a bare (url, init) fetcher.
    const typed: QuoteFetch = async () => jsonResponse({ success: true });
    await expect(submitQuote(payload, typed)).resolves.toEqual({ ok: true });
  });
});
