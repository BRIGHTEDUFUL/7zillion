import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

import { Breadcrumbs, type Crumb } from "@/components/breadcrumbs";
import { ContactRail } from "@/components/contact-rail";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useSectionReveal } from "@/hooks/use-site-effects";
import { company } from "@/data/site";

/**
 * Shared shell for every internal page: the same header, footer, motion and
 * breadcrumb hierarchy as the home page.
 *
 * `hero-theme-dark` gives the header its light-ink state over the dark hero
 * banner and switches to the solid state as soon as the page is scrolled.
 */
export function InnerPage({
  eyebrow,
  title,
  intro,
  crumbs = [],
  cta = true,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  crumbs?: readonly Crumb[];
  cta?: boolean;
  children?: ReactNode;
}) {
  useSectionReveal();

  return (
    <main id="top" className="inner-page hero-theme-dark">
      <SiteHeader />

      <section className="inner-hero" id="main-content" tabIndex={-1}>
        <div className="shell">
          <Breadcrumbs items={crumbs} />
          <p className="eyebrow light">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="inner-intro">{intro}</p>
          {/* Slogan — right-aligned stamp on every internal-page hero */}
          <div className="inner-hero-slogan" aria-hidden="true">
            <p className="slogan">{company.slogan}</p>
          </div>
        </div>
      </section>

      {children}

      {cta && (
        <section className="inner-cta">
          <div className="shell inner-cta-row">
            <div>
              <p className="eyebrow light">Ready to begin?</p>
              <h2>Plan your beverage production line with Seven Zillions</h2>
            </div>
            <Link to="/contact" className="primary-button">
              Get pricing & solutions <ArrowRight size={17} />
            </Link>
          </div>
        </section>
      )}

      <SiteFooter />
      <ContactRail />
    </main>
  );
}
