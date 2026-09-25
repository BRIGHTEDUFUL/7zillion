import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";

import { getServicesFn } from "@/api/services";
import { recordActivityFn } from "@/api/activity";
import { InnerPage } from "@/components/inner-page";
import { SectionHeading } from "@/components/section-heading";
import { about, company, customers } from "@/data/site";

export const Route = createFileRoute("/about/")({
  loader: async () => {
    const services = await getServicesFn();
    void recordActivityFn({
      data: { eventType: "page_view", path: "/about", timestamp: new Date().toISOString() },
    });
    return services;
  },
  head: () => ({
    meta: [
      { title: "About Us | Seven Zillions — Cooperation and Interdependence" },
      {
        name: "description",
        content:
          "Seven Zillions designs and builds industrial facilities, cleanrooms and production sites, and supplies the engineering and equipment that run them.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const services = Route.useLoaderData();

  return (
    <InnerPage
      eyebrow="About Seven Zillions"
      title="Cooperation and Interdependence"
      intro="We design and build industrial facilities, cleanrooms and high-tech manufacturing sites — and supply the engineering, technical services and equipment that make them run."
      crumbs={[{ label: "About us" }]}
    >
      <section className="about-section about-section--inner">
        <div className="shell about-grid">
          <div className="about-media">
            <img
              loading="lazy"
              decoding="async"
              src={about.image}
              alt="Seven Zillions beverage packaging machinery factory"
            />
            <div className="experience">
              <strong>20+</strong>
              <span>
                years of
                <br />
                packaging engineering
              </span>
            </div>
          </div>
          <div className="about-copy">
            <p className="eyebrow">Who we are</p>
            <h2>From process planning to stable production</h2>
            <p>{about.lead}</p>
            {about.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 40)}>{paragraph}</p>
            ))}
            <ul>
              {about.points.map((point) => (
                <li key={point}>
                  <span>
                    <Check size={15} />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
            <Link to="/contact" className="primary-button">
              Work with us <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      <section className="section shell">
        <SectionHeading
          eyebrow="Our service"
          title="What we take responsibility for"
          action="All services"
          to="/services"
        />
        <div className="service-grid">
          {services.map((service, index) => (
            <article className="service-card" key={service.title}>
              <span className="card-index">0{index + 1}</span>
              <h3>{service.title}</h3>
              <p>{service.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="customers">
        <div className="shell customers-row">
          <div>
            <p className="eyebrow light">Markets we serve</p>
            <h2>
              Production lines delivered
              <br />
              across Africa and Asia
            </h2>
          </div>
          <div className="logo-grid">
            {customers.map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="section shell">
        <SectionHeading
          eyebrow="Let's build your next production line"
          title="Talk with a Seven Zillions specialist"
          action="Contact us"
          to="/contact"
        />
        <p className="wide-copy">
          Tell us about your current production line, or submit your project file, container type,
          capacity and target market. Our engineering team will review your requirements and prepare
          a practical, customised line proposal — {company.address}.
        </p>
      </section>
    </InnerPage>
  );
}
