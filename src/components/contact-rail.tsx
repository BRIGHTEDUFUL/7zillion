import { Mail, Phone } from "lucide-react";

import { WhatsAppIcon } from "@/components/icons";
import { telHref, waHref } from "@/data/site";
import { useSiteCompany } from "@/hooks/use-site-company";

/** Fixed quick-contact rail. Every target is a real destination. */
export function ContactRail() {
  const company = useSiteCompany();
  const primaryPhone = company.phones[0];

  return (
    <div className="contact-rail">
      <a
        href={waHref(company.whatsappMessage, company.whatsappHref)}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat with us on WhatsApp"
      >
        <WhatsAppIcon size={18} />
      </a>
      <a href={`mailto:${company.email}`} aria-label={`Email ${company.email}`}>
        <Mail />
      </a>
      {primaryPhone ? (
        <a href={telHref(primaryPhone)} aria-label={`Call ${primaryPhone}`}>
          <Phone />
        </a>
      ) : null}
    </div>
  );
}
