import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";

import { getServicesFn } from "@/api/services";
import { getPagesFn } from "@/api/pages";
import { recordActivityFn } from "@/api/activity";
import { InnerPage } from "@/components/inner-page";
import { SectionHeading } from "@/components/section-heading";
import { about as defaultAbout, customers, services as defaultServices } from "@/data/site";

export const Route = createFileRoute("/about/")({
  loader: async () => {
    const [services, pages] = await Promise.all([getServicesFn(), getPagesFn()]);
    void recordActivityFn({
      data: { eventType: "page_view", path: "/about", timestamp: new Date().toISOString() },
    });
    // An unseeded deployment has no services yet — show the built-in list
    // instead of an empty section.
    return { services: services.length ? services : defaultServices, pages };
  },
  head: () => ({
    meta: [
      { title: "About Us | Seven Zillions — Cooperation and Interdependence" },
      {
        name: "description",
        content:
          "Seven Zillions designs and builds industrial facilities, cleanrooms and high-tech manufacturing production sites, and supplies the production lines, engineering and equipment that run them.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { services, pages } = Route.useLoaderData();
  const about = pages.about;
  // An empty image field means "use the built-in factory photo" — a bundled
  // asset URL must never be stored, its hash changes on every build.
  const photo = about.image || defaultAbout.image;

  return (
    <InnerPage
      eyebrow="About Seven Zillions"
      title={about.heroTitle}
      intro={about.heroIntro}
      crumbs={[{ label: "About us" }]}
    >
      {/* ── Who we are ── */}
      <section className="about-section about-section--inner">
        <div className="shell about-grid">
          <div className="about-media">
            <img
              loading="lazy"
              decoding="async"
              src={photo}
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
            <h2>{about.heading}</h2>
            <p>{about.lead}</p>
            {about.paragraphs.map((paragraph, index) => (
              <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
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

      {/* ── Our service ── */}
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

      {/* ── Equipment & product range ── */}
      <section className="section shell">
        <SectionHeading
          eyebrow="Equipment & product range"
          title="Machines and systems we supply"
          action="View all products"
          to="/products"
        />
        <p className="wide-copy">
          Individual machines and systems chosen to bring stable, reliable capacity to your facility
          — specified against your product, package and required output rather than a standard
          catalogue.
        </p>
        <div className="range-grid">
          {about.equipmentRange.map((group) => (
            <article className="range-card" key={group.title}>
              <h3>{group.title}</h3>
              <ul>
                {group.items.map((item) => (
                  <li key={item}>
                    <Check size={14} />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* ── Complete production line solutions ── */}
      <section className="section shell">
        <SectionHeading
          eyebrow="Complete production line solutions"
          title="Lines we design, build and commission"
          action="All solutions"
          to="/solutions"
        />
        <div className="line-groups">
          {about.productionLineGroups.map((group) => (
            <article className="line-group" key={group.title}>
              <h3>{group.title}</h3>
              <p>{group.copy}</p>
              <ul className="check-list">
                {group.items.map((item) => (
                  <li key={item}>
                    <span>
                      <Check size={14} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* ── Comprehensive support & service ── */}
      <section className="section shell">
        <SectionHeading
          eyebrow="Comprehensive support & service"
          title="We stay with the equipment after handover"
        />
        <div className="two-col">
          <ul className="check-list">
            {about.supportLines.map((line) => (
              <li key={line}>
                <span>
                  <Check size={14} />
                </span>
                {line}
              </li>
            ))}
          </ul>
          <div className="note-panel">
            <h3>From one spare part to a whole line</h3>
            <p>
              Whether you are upgrading a single component, arranging ongoing maintenance, or
              building a complete line, the same engineering team scopes it — and the same team is
              still there when the line needs attention later.
            </p>
            <Link to="/contact" className="primary-button">
              Talk to an engineer <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Markets ── */}
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

      {/* ── Closing brief ── */}
      <section className="section shell">
        <SectionHeading
          eyebrow="Let's build your next production line"
          title="Talk with a Seven Zillions specialist"
          action="Contact us"
          to="/contact"
        />
        <p className="wide-copy">{about.closingBrief}</p>
      </section>
    </InnerPage>
  );
}
