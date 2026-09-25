import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";

import { listSolutionsFn } from "@/api/solutions";
import { listPackagesFn } from "@/api/packages";
import { recordActivityFn } from "@/api/activity";
import { InnerPage } from "@/components/inner-page";
import { SectionHeading } from "@/components/section-heading";
import { extraSolutionLines } from "@/data/site";

export const Route = createFileRoute("/solutions/")({
  loader: async () => {
    const [solutions, packages] = await Promise.all([listSolutionsFn(), listPackagesFn()]);
    void recordActivityFn({
      data: { eventType: "page_view", path: "/solutions", timestamp: new Date().toISOString() },
    });
    return { solutions, packages };
  },
  head: () => ({
    meta: [
      { title: "Solutions | Seven Zillions — Complete Beverage Production Lines" },
      {
        name: "description",
        content:
          "Water, juice, carbonated soft drink and cans filling production lines — process, equipment list, capacity and package scope.",
      },
    ],
  }),
  component: SolutionsPage,
});

function SolutionsPage() {
  const { solutions, packages } = Route.useLoaderData();

  return (
    <InnerPage
      eyebrow="Production line solutions"
      title="Production lines matched to your beverage"
      intro="A line is accepted on what it actually produces — correctly filled, closed, labeled and packed — not on the nameplate speed of one machine. These are the beverage lines we design, build and commission."
      crumbs={[{ label: "Solutions" }]}
    >
      <section className="section shell">
        <div className="card-grid">
          {solutions.map((solution, index) => (
            <Link
              className="page-card"
              to="/solutions/$slug"
              params={{ slug: solution.slug }}
              key={solution.slug}
            >
              <div className="page-card-media">
                <img loading="lazy" decoding="async" src={solution.image} alt={solution.name} />
                <span className="card-index">0{index + 1}</span>
              </div>
              <div className="page-card-body">
                <span className="page-card-category">{solution.eyebrow}</span>
                <h2>{solution.name}</h2>
                <p>{solution.summary}</p>
                <span className="card-action">
                  Explore solution <ArrowRight size={16} />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="extra-lines">
          <p className="eyebrow">Also available</p>
          <ul className="check-list">
            {extraSolutionLines.map((line) => (
              <li key={line}>
                <span>
                  <Check size={14} />
                </span>
                {line}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section shell packages-section">
        <SectionHeading eyebrow="Complete packages" title="What each package includes" />
        <div className="packages-grid">
          {packages.map((item) => (
            <article className="package-card" key={item.slug}>
              <div className="package-head">
                <h3>{item.name}</h3>
              </div>
              <p className="package-summary">{item.summary}</p>
              <dl className="spec-list">
                {item.specs.map((spec) => (
                  <div key={spec.label}>
                    <dt>{spec.label}</dt>
                    <dd>{spec.value}</dd>
                  </div>
                ))}
              </dl>
              <ul className="check-list">
                {item.includes.map((line) => (
                  <li key={line}>
                    <span>
                      <Check size={14} />
                    </span>
                    {line}
                  </li>
                ))}
              </ul>
              <Link to="/contact" className="primary-button">
                Request this package <ArrowRight size={16} />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </InnerPage>
  );
}
