import { type FormEvent, useCallback, useRef, useState } from "react";

import { saveLeadFn } from "@/api/leads";
import { useSiteCompany } from "@/hooks/use-site-company";
import type { LeadSource } from "@/lib/schemas";
import {
  buildMailtoHref,
  buildQuotePayload,
  submitQuote,
  type QuoteFailureReason,
  type QuoteFields,
} from "@/lib/quote-submit";

/**
 * Statuses:
 *
 * `sent` — the enquiry reached the team. Two independent channels do that:
 *          Web3Forms emails the inbox, `saveLeadFn` files a copy that Admin →
 *          Leads can search. Either one succeeding is enough to confirm.
 * `composed` — no access key in this build *and* storage failed, so the
 *          visitor's mail client takes over (the behaviour this form shipped
 *          with before it had a backend). A misconfigured deploy degrades
 *          instead of breaking.
 * `error` — both channels failed; `mailtoHref` still holds the text the
 *          visitor typed so the form can offer their mail client as a way out.
 */
export type QuoteStatus = "idle" | "sending" | "sent" | "composed" | "error";

function readForm(form: HTMLFormElement): QuoteFields {
  const data = new FormData(form);
  const get = (key: string) => String(data.get(key) ?? "").trim();
  return {
    name: get("name"),
    email: get("email"),
    phone: get("phone"),
    requirements: get("requirements"),
    // Not trimmed: anything at all in the honeypot marks the submitter a bot.
    botcheck: String(data.get("botcheck") ?? ""),
  };
}

function accessKey(): string {
  const value = import.meta.env["VITE_WEB3FORMS_ACCESS_KEY"];
  return typeof value === "string" ? value.trim() : "";
}

type EmailOutcome = { ok: true } | { ok: false; reason: QuoteFailureReason | null };

/** `reason: null` means this build has no key, so nothing was attempted. */
async function deliverEmail(fields: QuoteFields, key: string): Promise<EmailOutcome> {
  if (!key) return { ok: false, reason: null };

  const result = await submitQuote(buildQuotePayload(fields, key));
  return result.ok ? { ok: true } : { ok: false, reason: result.reason };
}

/**
 * The second copy of the enquiry, for Admin → Leads. Best-effort by design:
 * a visitor must never see a failure because storage is down, and the email
 * has already carried the message by the time this resolves.
 */
async function storeLead(fields: QuoteFields, source: LeadSource): Promise<boolean> {
  try {
    const result = await saveLeadFn({
      data: {
        name: fields.name,
        email: fields.email,
        phone: fields.phone,
        requirements: fields.requirements,
        source,
        botcheck: fields.botcheck,
      },
    });
    return result.stored === true;
  } catch (error) {
    console.error("Unable to store the enquiry:", error);
    return false;
  }
}

/**
 * `source` says which form sent the enquiry: "/" for the homepage quote form,
 * "/contact" for the contact page.
 */
export function useQuoteSubmit(source: LeadSource = "/") {
  const { email } = useSiteCompany();
  const [status, setStatus] = useState<QuoteStatus>("idle");
  const [reason, setReason] = useState<QuoteFailureReason | null>(null);
  const [mailtoHref, setMailtoHref] = useState<string | null>(null);
  const busyRef = useRef(false);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      // React can fire submit again before the first POST settles.
      if (busyRef.current) return;

      const form = event.currentTarget;
      const fields = readForm(form);
      const href = buildMailtoHref(fields, email);

      if (fields.botcheck) {
        // Honeypot filled: drop the submission and look like it worked, so a
        // bot learns nothing about which part of the form gave it away. No
        // email, and nothing written to the leads table either.
        setStatus("sent");
        return;
      }

      busyRef.current = true;
      setStatus("sending");

      const key = accessKey();
      const [emailed, stored] = await Promise.all([
        deliverEmail(fields, key),
        storeLead(fields, source),
      ]);
      busyRef.current = false;

      if (emailed.ok || stored) {
        form.reset();
        setStatus("sent");
        return;
      }

      // Nothing reached us. Offer the visitor's own mail client with the text
      // they typed still in it, so the enquiry is not lost on the last hop.
      setMailtoHref(href);
      if (!emailed.ok && emailed.reason) {
        setReason(emailed.reason);
        setStatus("error");
        return;
      }

      setStatus("composed");
      window.location.href = href;
    },
    [email, source],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setReason(null);
    setMailtoHref(null);
  }, []);

  return { handleSubmit, status, reason, mailtoHref, reset };
}
