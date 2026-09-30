import { Check } from "lucide-react";

import type { QuoteStatus } from "@/hooks/use-quote-submit";
import type { QuoteFailureReason } from "@/lib/quote-submit";

type Props = {
  status: QuoteStatus;
  reason: QuoteFailureReason | null;
  mailtoHref: string | null;
};

/**
 * The quote form always says what happened instead of leaving a dead button:
 * Web3Forms took the message, the visitor's mail client took it over, or
 * delivery failed and the text they typed is still recoverable from
 * `mailtoHref`.
 */
export function QuoteStatus({ status, reason, mailtoHref }: Props) {
  if (status === "sent") {
    return (
      <p className="form-sent" role="status">
        <Check size={16} />
        Your requirements are with our engineering team — we reply by email within one business day.
      </p>
    );
  }

  if (status === "composed") {
    return (
      <p className="form-sent" role="status">
        <Check size={16} />
        Your email app is opening with your message ready to send.
      </p>
    );
  }

  if (status === "error") {
    return (
      <p className="form-error" role="alert">
        {reason === "rate-limited"
          ? "That was sent too quickly — please try again in a minute."
          : "We could not send your requirements just now."}
        {mailtoHref ? (
          <>
            {" "}
            <a href={mailtoHref}>Send it from your email app instead</a>
          </>
        ) : null}
      </p>
    );
  }

  return null;
}
