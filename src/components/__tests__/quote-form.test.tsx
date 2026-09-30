import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { FormHoneypot } from "../form-honeypot";
import { QuoteStatus } from "../quote-status";
import type { QuoteStatus as QuoteStatusPhase } from "@/hooks/use-quote-submit";
import type { QuoteFailureReason } from "@/lib/quote-submit";

/** Server markup escapes attributes, so expectations have to match it. */
function esc(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#x27;");
}

function render(
  status: QuoteStatusPhase,
  reason: QuoteFailureReason | null = null,
  mailtoHref: string | null = null,
) {
  return renderToStaticMarkup(
    <QuoteStatus status={status} reason={reason} mailtoHref={mailtoHref} />,
  );
}

describe("QuoteStatus", () => {
  it("says nothing while the form is idle or sending", () => {
    expect(render("idle")).toBe("");
    expect(render("sending")).toBe("");
  });

  it("confirms a delivered enquiry with a response time", () => {
    const html = render("sent");

    expect(html).toContain('role="status"');
    expect(html).toContain("engineering team");
    expect(html).toContain("within one business day");
  });

  it("explains the mail-client handoff used when no key is configured", () => {
    expect(render("composed")).toContain("email app is opening");
  });

  it("offers the visitor's own mail client, keeping their message", () => {
    const href = "mailto:sales@example.com?subject=Quote&body=Ama";
    const html = render("error", "unavailable", href);

    expect(html).toContain('role="alert"');
    expect(html).toContain("could not send your requirements");
    expect(html).toContain(`href="${esc(href)}"`);
    expect(html).toContain("Send it from your email app instead");
  });

  it("asks for a retry when the provider throttled the submission", () => {
    expect(render("error", "rate-limited", "mailto:a@b.c")).toContain("try again in a minute");
  });

  it("renders no dead link when there is nothing left to recover", () => {
    const html = render("error", "network", null);

    expect(html).not.toContain("<a ");
  });
});

describe("FormHoneypot", () => {
  const html = renderToStaticMarkup(<FormHoneypot />);

  it("exposes the field name Web3Forms filters on", () => {
    expect(html).toContain('name="botcheck"');
    expect(html).toContain('type="text"');
  });

  it("stays out of sight, the tab order and the accessibility tree", () => {
    expect(html).toContain('class="form-honeypot"');
    expect(html).toContain('tabindex="-1"');
    expect(html).toContain('aria-hidden="true"');
  });
});
