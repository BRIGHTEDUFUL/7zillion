import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Check, Mail, MapPin, MessageSquareText, Phone } from "lucide-react";

import { InnerPage } from "@/components/inner-page";
import { SectionHeading } from "@/components/section-heading";
import { useComposeMail } from "@/hooks/use-compose-mail";
import { checklist, company } from "@/data/site";

export const Route = createFileRoute("/contact/")({
  head: () => ({
    meta: [
      { title: "Contact Us | Seven Zillions — Kumasi, Ghana" },
      {
        name: "description",
        content:
          "Talk with a Seven Zillions beverage packaging specialist. Esereso Divine Junction, Kaka Yan Opoku Street, Kumasi — +233 554 602 103.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const composeMail = useComposeMail();

  return (
    <InnerPage
      eyebrow="Start your project"
      title="Talk with a beverage packaging specialist"
      intro="Tell us your beverage, bottle format and target capacity. Our engineering team will review it and respond with a practical equipment configuration rather than a generic machine list."
      crumbs={[{ label: "Contact us" }]}
      cta={false}
    >
      <section className="section shell contact-layout">
        <div className="contact-panel">
          <p className="eyebrow">Reach us directly</p>
          <ul className="contact-list">
            <li>
              <MapPin size={18} />
              <div>
                <strong>{company.address}</strong>
                <span>{company.city}</span>
              </div>
            </li>
            <li>
              <Mail size={18} />
              <div>
                <strong>
                  <a href={`mailto:${company.email}`}>{company.email}</a>
                </strong>
                <span>Email</span>
              </div>
            </li>
            {company.phones.map((phone) => (
              <li key={phone}>
                <Phone size={18} />
                <div>
                  <strong>
                    <a href={`tel:${phone.replace(/\s+/g, "")}`}>{phone}</a>
                  </strong>
                  <span>{company.promise}</span>
                </div>
              </li>
            ))}
            <li>
              <MessageSquareText size={18} />
              <div>
                <strong>
                  <a href={company.whatsappHref} target="_blank" rel="noreferrer">
                    {company.whatsapp}
                  </a>
                </strong>
                <span>WhatsApp</span>
              </div>
            </li>
          </ul>

          <div className="note-panel note-panel--violet">
            <h3>What to send us</h3>
            <p>
              Send the following so the proposed line can be sized and priced around your real
              production plan.
            </p>
            <ul className="check-list">
              {checklist.map((line) => (
                <li key={line}>
                  <span>
                    <Check size={14} />
                  </span>
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <form className="quote-form quote-form--page" onSubmit={composeMail}>
          <div>
            <p className="eyebrow">Request a quotation</p>
            <h2>Get pricing & solutions</h2>
          </div>
          <div className="form-row">
            <label>
              Name
              <input type="text" name="name" placeholder="Your name" required />
            </label>
            <label>
              Email
              <input type="email" name="email" placeholder="Work email" required />
            </label>
          </div>
          <label>
            Phone or WhatsApp
            <input type="tel" name="phone" placeholder="Country code + number" />
          </label>
          <label>
            Your requirements
            <textarea
              rows={6}
              name="requirements"
              placeholder="Beverage, bottle size, required output, destination country and packaging"
              required
            />
          </label>
          <button type="submit" className="primary-button">
            Send requirements <ArrowRight size={17} />
          </button>
          <p className="form-note">
            Your message opens in your email app addressed to {company.email} — no data is stored on
            this site.
          </p>
        </form>
      </section>

      <section className="section shell">
        <SectionHeading eyebrow="After you send" title="What comes back to you" />
        <ol className="timeline timeline--wide">
          {[
            "Recommended process flow",
            "Equipment list",
            "Layout concept",
            "Utility requirements",
            "Commercial quotation",
            "Delivery plan",
          ].map((step, index) => (
            <li key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{step}</strong>
            </li>
          ))}
        </ol>
      </section>
    </InnerPage>
  );
}
