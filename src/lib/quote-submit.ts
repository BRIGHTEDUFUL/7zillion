/**
 * Quote-form delivery.
 *
 * This project has no form backend of its own: the message is POSTed from the
 * visitor's browser straight to Web3Forms, which emails it to the team inbox
 * (https://docs.web3forms.com). Two provider rules shape this module —
 *
 *   - the call must originate in the browser. Proxying it through our own
 *     server returns 403, so there is deliberately no /api/quote route.
 *   - the access key is an alias for the receiving address, documented as safe
 *     to publish in client code. It is read from VITE_WEB3FORMS_ACCESS_KEY so
 *     that it stays out of git, not because it is a secret.
 *
 * Everything here is pure or takes its transport as an argument so it can be
 * exercised without a DOM (the test environment is node).
 */

export const QUOTE_ENDPOINT = "https://api.web3forms.com/submit";

export type QuoteFields = {
  name: string;
  email: string;
  phone: string;
  requirements: string;
  /** Value of the hidden `botcheck` honeypot. A person never fills it in. */
  botcheck: string;
};

export type QuotePayload = {
  access_key: string;
  subject: string;
  from_name: string;
  replyto: string;
  name: string;
  email: string;
  requirements: string;
  /** Honeypot value, always sent — empty when a person filled the form in. */
  botcheck: string;
  /** Omitted altogether when the visitor leaves the field blank. */
  phone?: string;
};

export type QuoteFailureReason =
  /** fetch never reached the endpoint (offline, blocked, DNS). */
  | "network"
  /** HTTP 429 — the provider throttled this IP; retry later. */
  | "rate-limited"
  /** HTTP 4xx — bad/expired key, or the domain is not approved yet. */
  | "rejected"
  /** HTTP 5xx, or a body that is not the JSON we expect. */
  | "unavailable";

export type QuoteSubmitResult = { ok: true } | { ok: false; reason: QuoteFailureReason };

/** The subset of fetch this module needs; lets tests pass a stub directly. */
export type QuoteFetch = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string },
) => Promise<Response>;

function buildSubject(fields: QuoteFields): string {
  return `Line proposal request${fields.name ? ` — ${fields.name}` : ""}`;
}

/**
 * The body sent to Web3Forms as application/json. Form contents arrive as a
 * table: every custom field the visitor filled in is rendered as a row of the
 * notification email.
 */
export function buildQuotePayload(fields: QuoteFields, accessKey: string): QuotePayload {
  const payload: QuotePayload = {
    access_key: accessKey,
    subject: buildSubject(fields),
    // Shown as the sender's display name, so the lead reads as "Jane Doe".
    from_name: fields.name || "Seven Zillions website",
    replyto: fields.email,
    name: fields.name,
    email: fields.email,
    requirements: fields.requirements,
    // Empty for a human; a bot that takes the bait is dropped before POSTing.
    botcheck: fields.botcheck,
  };
  // Leave the phone row out entirely rather than sending an empty line.
  if (fields.phone) payload.phone = fields.phone;
  return payload;
}

/**
 * The pre-Web3Forms handoff, kept as the escape hatch for an unconfigured or
 * failing delivery: the visitor's own mail client addresses the message to us
 * so their enquiry is never dropped on the floor.
 */
export function buildMailtoHref(fields: QuoteFields, to: string): string {
  const lines = [
    fields.name && `Name: ${fields.name}`,
    fields.email && `Email: ${fields.email}`,
    fields.phone && `Phone / WhatsApp: ${fields.phone}`,
    "",
    "Requirements:",
    fields.requirements,
  ].filter((line): line is string => line !== undefined);

  const subject = encodeURIComponent(buildSubject(fields));
  const body = encodeURIComponent(lines.join("\n"));
  return `mailto:${to}?subject=${subject}&body=${body}`;
}

function isAccepted(body: unknown): boolean {
  if (typeof body !== "object" || body === null) return false;
  const success = (body as { success?: unknown }).success;
  // JSON responses use a boolean; older form posts answered with "true".
  return success === true || success === "true";
}

function failureFor(status: number): QuoteFailureReason {
  if (status === 429) return "rate-limited";
  if (status >= 400 && status < 500) return "rejected";
  return "unavailable";
}

/**
 * Sends one payload. Always resolves — a failure comes back as a reason the
 * caller can turn into copy, never as a thrown error the form has to catch.
 */
export async function submitQuote(
  payload: QuotePayload,
  fetchImpl: QuoteFetch = fetch,
): Promise<QuoteSubmitResult> {
  let response: Response;
  try {
    // application/json is required: a form-urlencoded POST answers with a 301
    // redirect, which the browser turns into a CORS error.
    response = await fetchImpl(QUOTE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    return { ok: false, reason: "network" };
  }

  if (response.status === 429) return { ok: false, reason: "rate-limited" };

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return { ok: false, reason: "unavailable" };
  }

  if (response.ok && isAccepted(body)) return { ok: true };
  return { ok: false, reason: failureFor(response.status) };
}
