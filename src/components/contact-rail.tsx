import { Mail, MessageSquareText, Phone } from "lucide-react";

import { company } from "@/data/site";

/** Fixed quick-contact rail. Every target is a real destination. */
export function ContactRail() {
  return (
    <div className="contact-rail">
      <a
        href={company.whatsappHref}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat with us on WhatsApp"
      >
        <MessageSquareText />
      </a>
      <a href={`mailto:${company.email}`} aria-label="Email us">
        <Mail />
      </a>
      <a href={`tel:${company.phones[0].replace(/\s+/g, "")}`} aria-label="Call us">
        <Phone />
      </a>
    </div>
  );
}
