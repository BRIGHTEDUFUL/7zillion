import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";

import { BrandLogo } from "@/components/logo";
import { WhatsAppIcon } from "@/components/icons";
import { footerColumns, telHref, waHref } from "@/data/site";
import { useSiteCompany } from "@/hooks/use-site-company";

export function SiteFooter() {
  const company = useSiteCompany();
  return (
    <footer className="footer">
      <div className="shell footer-grid">
        <div className="footer-brand">
          <Link to="/" className="brand brand-dark" aria-label="Seven Zillions home">
            <BrandLogo />
          </Link>
          <p>{company.tagline}</p>
          <p>
            Engineering reliable beverage filling and packaging systems for producers in Ghana and
            worldwide.
          </p>
        </div>

        {footerColumns.map((column) => (
          <div key={column.title}>
            <h3>{column.title}</h3>
            {column.links.map((link) =>
              link.params ? (
                <Link key={link.label} to={link.to} params={link.params}>
                  {link.label}
                </Link>
              ) : (
                <Link key={link.label} to={link.to}>
                  {link.label}
                </Link>
              ),
            )}
          </div>
        ))}

        <div className="footer-contact">
          <h3>Contact</h3>
          <p>
            <MapPin size={16} /> {company.address}
          </p>
          <p>
            <Mail size={16} /> <a href={`mailto:${company.email}`}>{company.email}</a>
          </p>
          {company.phones.map((phone) => (
            <p key={phone}>
              <Phone size={16} />{" "}
              <a href={telHref(phone)} aria-label={`Call ${phone}`}>
                {phone}
              </a>
            </p>
          ))}
          <p>
            <WhatsAppIcon size={16} />{" "}
            <a
              href={waHref(company.whatsappMessage, company.whatsappHref)}
              target="_blank"
              rel="noreferrer"
              aria-label={`Chat with us on WhatsApp — ${company.whatsapp}`}
            >
              WhatsApp {company.whatsapp}
            </a>
          </p>
        </div>
      </div>

      {/* Slogan bar — sits above the copyright line */}
      <div className="shell footer-slogan-bar">
        <p className="slogan">{company.slogan}</p>
        <span>{company.city}</span>
      </div>

      <div className="shell footer-bottom">
        <span>© 2026 Seven Zillions · {company.site}</span>
        <a href="#top" aria-label="Back to top">
          Back to top
        </a>
      </div>
    </footer>
  );
}
