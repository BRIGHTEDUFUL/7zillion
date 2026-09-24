import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";

import { InnerPage } from "@/components/inner-page";
import { SectionHeading } from "@/components/section-heading";
import { solutionBySlug, solutions } from "@/data/site";

export const Route = createFileRoute("/solutions/$slug")({
  // Validated in the loader so an unknown slug produces a real server 404.
  loader: ({ params }) => {
    const solution = solutionBySlug(params.slug);
    if (!solution) throw notFound();
    return solution;
  },
  head: ({ params }) => {
    const solution = solutionBySlug(params.slug);
    return {
      meta: [
        { title: `${solution?.name ?? "Solution"} | Seven Zillions` },
        { name: "description", content: solution?.summary ?? "Seven Zillions production lines." },
      ],
    };
  },
  component: SolutionDetailPage,
});

function SolutionDetailPage() {
  const solution = Route.useLoaderData();

  const related = solutions.filter((item) => item.slug !== solution.slug);

  return (
    <InnerPage
      eyebrow={solution.eyebrow}
      title={solution.name}
      intro={solution.summary}
      crumbs={[{ label: "Solutions", to: "/solutions" }, { label: solution.name }]}
    >
      <section className="section shell detail-layout">
        <div className="detail-main">
          <div className="detail-media">
            <img src={solution.image} alt={solution.name} />
          </div>
          <p className="detail-lead">{solution.detail}</p>

          <h2 className="detail-subhead">Process flow</h2>
          <ol className="step-list">
            {solution.process.map((step, index) => (
              <li key={step.title}>
                <span className="step-index">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                </div>
              </li>
            ))}
          </ol>

          <h2 className="detail-subhead">Equipment included</h2>
          <ul className="check-list">
            {solution.equipment.map((line) => (
              <li key={line}>
                <span>
                  <Check size={14} />
                </span>
                {line}
              </li>
            ))}
          </ul>
        </div>

        <aside className="detail-aside">
          <div className="spec-panel">
            <p className="eyebrow">Rated capacity</p>
            <p className="capacity-figure">{solution.capacity}</p>
            <dl className="spec-list">
              {solution.specs.map((spec) => (
                <div key={spec.label}>
                  <dt>{spec.label}</dt>
                  <dd>{spec.value}</dd>
                </div>
              ))}
            </dl>
            <Link to="/contact" className="primary-button">
              Get a line proposal <ArrowRight size={16} />
            </Link>
            <p className="spec-note">
              Send your beverage, container format and required output for a project-specific
              quotation.
            </p>
          </div>
        </aside>
      </section>

      <section className="section shell related-section">
        <SectionHeading
          eyebrow="Other beverages"
          title="Related production lines"
          action="All solutions"
          to="/solutions"
        />
        <div className="card-grid card-grid--3">
          {related.map((item) => (
            <Link
              className="page-card"
              to="/solutions/$slug"
              params={{ slug: item.slug }}
              key={item.slug}
            >
              <div className="page-card-media">
                <img src={item.image} alt={item.name} />
              </div>
              <div className="page-card-body">
                <span className="page-card-category">{item.eyebrow}</span>
                <h3>{item.name}</h3>
                <p>{item.summary}</p>
                <span className="card-action">
                  Explore solution <ArrowRight size={16} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </InnerPage>
  );
}
