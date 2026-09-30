import { type FormEvent, useCallback, useRef, useState } from "react";

import { useSiteCompany } from "@/hooks/use-site-company";
import {
  buildMailtoHref,
  buildQuotePayload,
  submitQuote,
  type QuoteFailureReason,
  type QuoteFields,
} from "@/lib/quote-submit";

/**
 * `sent` — Web3Forms accepted the message and it is in the team inbox.
 * `composed` — no access key in this build, so the visitor's mail client took
 *              over (the behaviour this form shipped with before it had a
 *              backend). A misconfigured deploy degrades instead of breaking.
 * `error` — the POST failed; `mailtoHref` still holds the text the visitor
 *           typed so the form can offer their mail client as a way out.
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

export function useQuoteSubmit() {
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
        // bot learns nothing about which part of the form gave it away.
        setStatus("sent");
        return;
      }

      const key = accessKey();
      if (!key) {
        setMailtoHref(href);
        setStatus("composed");
        window.location.href = href;
        return;
      }

      busyRef.current = true;
      setStatus("sending");
      const result = await submitQuote(buildQuotePayload(fields, key));
      busyRef.current = false;

      if (result.ok) {
        form.reset();
        setStatus("sent");
        return;
      }

      setReason(result.reason);
      setMailtoHref(href);
      setStatus("error");
    },
    [email],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setReason(null);
    setMailtoHref(null);
  }, []);

  return { handleSubmit, status, reason, mailtoHref, reset };
}
