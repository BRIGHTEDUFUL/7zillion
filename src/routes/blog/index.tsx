import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { InnerPage } from "@/components/inner-page";
import { SectionHeading } from "@/components/section-heading";
import { faqs, insights } from "@/data/site";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Knowledge Center | Seven Zillions — Filling & Packaging Insights" },
      {
        name: "description",
        content:
          "Practical guides to drinking water and mineral water production, and how to plan a beverage filling line — plus answers to the questions we are asked most.",
      },
    ],
  }),
  component: BlogPage,
});

function BlogPage() {
  return (
    <InnerPage
      eyebrow="Knowledge center"
      title="Filling and packaging insights"
      intro="Practical guidance drawn from projects we have designed, built and commissioned — and straight answers to the questions producers ask us most often."
      crumbs={[{ label: "Knowledge center" }]}
    >
      <section className="section shell">
        <div className="article-list">
          {insights.map((insight) => (
            <article className="article" id={insight.slug} key={insight.slug}>
              <span className="article-index">{insight.num}</span>
              <div>
                <h2>{insight.title}</h2>
                <p className="article-dek">{insight.copy}</p>
                {insight.body.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section shell">
        <SectionHeading
          eyebrow="Frequently asked"
          title="Questions producers ask us"
          action="Ask an engineer"
          to="/contact"
        />
        <div className="faq-list">
          {faqs.map((item) => (
            <details key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="section shell">
        <SectionHeading
          eyebrow="Request a proposal"
          title="Tell us what you plan to fill"
          action="Contact us"
          to="/contact"
        />
        <p className="wide-copy">
          Send the beverage, the bottle or can format, required output, destination country and
          desired packaging. Seven Zillions will review the project and respond with a practical
          equipment configuration instead of a generic machine list.{" "}
          <Link className="inline-link" to="/contact">
            Start here <ArrowRight size={15} />
          </Link>
        </p>
      </section>
    </InnerPage>
  );
}
