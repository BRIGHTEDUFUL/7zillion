import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";

import { getServicesFn } from "@/api/services";
import { recordActivityFn } from "@/api/activity";
import { InnerPage } from "@/components/inner-page";
import { SectionHeading } from "@/components/section-heading";
import { acceptance, deliverySteps, services as defaultServices } from "@/data/site";

export const Route = createFileRoute("/services/")({
  loader: async () => {
    const services = await getServicesFn();
    void recordActivityFn({
      data: { eventType: "page_view", path: "/services", timestamp: new Date().toISOString() },
    });
    // An unseeded deployment has no services yet — show the built-in list
    // instead of an empty section.
    return services.length ? services : defaultServices;
  },
  head: () => ({
    meta: [
      { title: "Services | Seven Zillions — Installation, Commissioning & Support" },
      {
        name: "description",
        content:
          "Factory design, installation, electrical works, operator training, spare parts and maintenance for beverage production lines.",
      },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const services = Route.useLoaderData();

  return (
    <InnerPage
      eyebrow="Service resources"
      title="Support across the equipment lifecycle"
      intro="Beyond manufacturing, we look after the lifecycle of your equipment — from the first layout drawing through commissioning to spare parts years later."
      crumbs={[{ label: "Services" }]}
    >
      <section className="section shell">
        <div className="service-grid">
          {services.map((service, index) => (
            <article className="service-card" key={service.title}>
              <span className="card-index">0{index + 1}</span>
              <h2>{service.title}</h2>
              <p>{service.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section shell">
        <SectionHeading
          eyebrow="Project delivery"
          title="How a project runs"
          action="Start a project"
          to="/contact"
        />
        <ol className="timeline">
          {deliverySteps.map((step, index) => (
            <li key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{step}</strong>
            </li>
          ))}
        </ol>
      </section>

      <section className="section shell">
        <SectionHeading eyebrow="Acceptance" title="What we measure at handover" />
        <div className="two-col">
          <ul className="check-list">
            {acceptance.map((line) => (
              <li key={line}>
                <span>
                  <Check size={14} />
                </span>
                {line}
              </li>
            ))}
          </ul>
          <div className="note-panel">
            <h3>Talk to an engineer</h3>
            <p>
              Get the right machine configuration and price. Send your capacity, bottle
              specification and beverage type for a complete proposal.
            </p>
            <Link to="/contact" className="primary-button">
              Request a proposal <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </InnerPage>
  );
}
