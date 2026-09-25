import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { getCompanyFn } from "@/api/company";
import { listProductsFn } from "@/api/products";
import { listSolutionsFn } from "@/api/solutions";
import { listPackagesFn } from "@/api/packages";
import { listProjectsFn } from "@/api/projects";
import { listInsightsFn } from "@/api/insights";
import { recordActivityFn } from "@/api/activity";
import { ContactRail } from "@/components/contact-rail";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useSectionReveal } from "@/hooks/use-site-effects";
import { useComposeMail } from "@/hooks/use-compose-mail";
import { company as staticCompany, customers } from "@/data/site";

import aboutImage from "@/assets/brand/about.jpg";
import heroConvertingImage from "@/assets/brand/hero-converting.webp";
import heroFillerImage from "@/assets/brand/hero-filler.jpg";
import heroLineImage from "@/assets/brand/hero-line.webp";
import heroMachinesImage from "@/assets/brand/hero-machines.webp";
import heroWaterTreatmentImage from "@/assets/brand/hero-water-treatment.webp";
import supportImage from "@/assets/brand/support.jpg";
import supportTwoImage from "@/assets/brand/support2.jpg";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [company, products, solutions, packages, projects, insights] = await Promise.all([
      getCompanyFn(),
      listProductsFn(),
      listSolutionsFn(),
      listPackagesFn(),
      listProjectsFn(),
      listInsightsFn(),
    ]);
    void recordActivityFn({
      data: { eventType: "page_view", path: "/", timestamp: new Date().toISOString() },
    });
    return { company, products, solutions, packages, projects, insights };
  },
  head: () => ({
    meta: [
      { title: "Seven Zillions | Beverage Filling & Packaging Solutions" },
      {
        name: "description",
        content:
          "Water, juice, carbonated and can lines — treatment, filling, labeling, packing and palletizing.",
      },
      { property: "og:title", content: "Seven Zillions | Beverage Filling & Packaging Solutions" },
      {
        property: "og:description",
        content:
          "Integrated beverage filling and packaging systems engineered for stable production.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: HomePage,
});

const HERO_INTERVAL = 6500;

/*
 * Hero rotation. Order matters twice over:
 *   1. The first entry is the LCP image — __root.tsx preloads it and the <img>
 *      below marks it eager/high priority. Never move a new slide to index 0.
 *   2. Themes alternate light/dark so the shade over the left third (where the
 *      headline sits) changes from slide to slide instead of white-washing every
 *      bright factory photo the same way.
 */
const HERO_SLIDES = [
  { src: heroLineImage, theme: "light" },
  { src: heroFillerImage, theme: "dark" },
  { src: heroMachinesImage, theme: "light" },
  { src: heroWaterTreatmentImage, theme: "dark" },
  { src: heroConvertingImage, theme: "light" },
] as const;

const SUPPORT_CARDS = [
  {
    eyebrow: "Quotation",
    title: "Get a quotation plan",
    image: supportImage,
    to: "/contact",
    icon: "quote" as const,
  },
  {
    eyebrow: "Installation",
    title: "Installation & commissioning",
    image: supportTwoImage,
    to: "/services",
    icon: "install" as const,
  },
  {
    eyebrow: "After-sales",
    title: "Spare parts & maintenance",
    image: supportImage,
    to: "/services",
    icon: "parts" as const,
  },
];

function HomePage() {
  const { company, products, solutions, packages, projects, insights } = Route.useLoaderData();

  const [slide, setSlide] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const pausedRef = useRef(false);
  const swipeRef = useRef<{ x: number; y: number } | null>(null);
  const heroRef = useRef<HTMLElement>(null);
  const [sent, setSent] = useState(false);
  const composeMail = useComposeMail(() => setSent(true));
  const theme = HERO_SLIDES[slide]?.theme ?? "light";

  useSectionReveal();

  // The confirmation disappears on its own once the mail client has focus.
  useEffect(() => {
    if (!sent) return;
    const timer = window.setTimeout(() => setSent(false), 7000);
    return () => window.clearTimeout(timer);
  }, [sent]);

  const goTo = useCallback((next: number) => {
    setSlide((next + HERO_SLIDES.length) % HERO_SLIDES.length);
    setCycle((value) => value + 1);
  }, []);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      setScrolled(y > 24);
      const hero = heroRef.current;
      if (hero) {
        hero.style.setProperty(
          "--hero-shift",
          `${Math.round(Math.min(y, hero.offsetHeight) * 0.2)}px`,
        );
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    pausedRef.current = false;
    const timer = window.setInterval(() => {
      if (pausedRef.current || document.hidden) return;
      setSlide((value) => (value + 1) % HERO_SLIDES.length);
    }, HERO_INTERVAL);
    return () => window.clearInterval(timer);
  }, [cycle]);

  function handleQuoteSubmit(event: React.FormEvent<HTMLFormElement>) {
    void recordActivityFn({
      data: {
        eventType: "contact_submission",
        path: "/",
        timestamp: new Date().toISOString(),
      },
    });
    composeMail(event);
  }

  return (
    <main id="top" className={`hero-theme-${theme}`}>
      <SiteHeader />

      <section
        ref={heroRef}
        id="main-content"
        tabIndex={-1}
        className="hero"
        data-hero=""
        aria-roledescription="carousel"
        aria-label="Seven Zillions production lines"
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            goTo(slide - 1);
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            goTo(slide + 1);
          }
        }}
        onMouseEnter={() => (pausedRef.current = true)}
        onMouseLeave={() => (pausedRef.current = false)}
        onFocusCapture={() => (pausedRef.current = true)}
        onBlurCapture={() => (pausedRef.current = false)}
        onPointerDown={(event) => {
          if (event.pointerType === "mouse" && event.button !== 0) return;
          swipeRef.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerUp={(event) => {
          const start = swipeRef.current;
          swipeRef.current = null;
          if (!start) return;
          const dx = event.clientX - start.x;
          const dy = event.clientY - start.y;
          if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
            goTo(slide + (dx < 0 ? 1 : -1));
          }
        }}
        onPointerCancel={() => (swipeRef.current = null)}
        style={{ touchAction: "pan-y" }}
      >
        <div className="hero-media" aria-hidden="true">
          {HERO_SLIDES.map((item, index) => (
            <figure
              key={item.src}
              className={`hero-slide${index === slide ? " is-active" : ""}`}
              data-hero-slide={index}
            >
              <img
                src={item.src}
                alt=""
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "low"}
                decoding="async"
                data-hero-image=""
              />
              <span className={`hero-shade hero-shade-${item.theme}`} />
            </figure>
          ))}
        </div>

        <div className="shell hero-content">
          <h1>
            Complete Beverage Filling <br />
            Line Solutions
          </h1>
          <p className="hero-copy">
            Water, juice, carbonated and can lines — treatment, filling, labeling, packing and
            palletizing.
          </p>
          <div className="hero-actions">
            <Link to="/products" className="primary-button">
              Explore complete line
            </Link>
            <Link to="/contact" className="outline-button">
              <MessageSquareText size={17} /> Plan your project
            </Link>
          </div>
          <p className="hero-slogan slogan" aria-hidden="true">
            {company.slogan}
          </p>
        </div>

        <div className="shell hero-footer">
          <button
            className="hero-arrow"
            data-hero-previous=""
            aria-label="Previous slide"
            onClick={() => goTo(slide - 1)}
          >
            <ChevronLeft size={18} />
          </button>
          <div className="hero-dots" role="tablist" aria-label="Choose a slide">
            {HERO_SLIDES.map((item, index) => (
              <button
                key={item.src}
                data-hero-dot={index}
                role="tab"
                aria-label={`Show slide ${index + 1}`}
                aria-selected={index === slide}
                className={`hero-dot${index === slide ? " is-active" : ""}`}
                onClick={() => goTo(index)}
              >
                <span />
              </button>
            ))}
          </div>
          <button
            className="hero-arrow"
            data-hero-next=""
            aria-label="Next slide"
            onClick={() => goTo(slide + 1)}
          >
            <ChevronRight size={18} />
          </button>
          <strong className="hero-count" data-hero-current="" key={slide}>
            {String(slide + 1).padStart(2, "0")} / {String(HERO_SLIDES.length).padStart(2, "0")}
          </strong>
        </div>

        <a
          href="#products"
          className={`scroll-cue${scrolled ? " is-hidden" : ""}`}
          aria-label="Scroll to products"
        >
          <ArrowDown />
        </a>
      </section>

      <section id="products" className="section shell">
        <SectionHeading
          eyebrow="Product families"
          title="Equipment for the complete production line"
          action="View all products"
          to="/products"
        />
        <div className="product-grid">
          {products.map((product, index) => (
            <Link
              className={`image-card product-card ${index === 0 ? "featured-product" : ""}`}
              to="/products/$slug"
              params={{ slug: product.slug }}
              key={product.slug}
            >
              <img loading="lazy" decoding="async" src={product.image} alt={product.name} />
              <span className="image-shade" />
              <div>
                <span className="card-index">0{index + 1}</span>
                <h3>{product.name}</h3>
                <ArrowRight />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="about" className="about-section">
        <div className="shell about-grid">
          <div className="about-media">
            <img
              loading="lazy"
              decoding="async"
              src={aboutImage}
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
            <p className="eyebrow">About Seven Zillions</p>
            <h2>One partner from process planning to stable production</h2>
            <p>
              Seven Zillions designs and builds industrial facilities, cleanrooms and high-tech
              manufacturing sites — and delivers the engineering, technical services and equipment
              that make them run.
            </p>
            <ul>
              {[
                "A–Z line layout and utility planning",
                "Factory testing and documented commissioning",
                "Installation, training and spare-parts support",
              ].map((item) => (
                <li key={item}>
                  <span>
                    <Check size={15} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <Link to="/about" className="primary-button">
              Meet Seven Zillions <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      <section id="solutions" className="section shell">
        <SectionHeading
          eyebrow="Production line solutions"
          title="Production lines matched to your beverage"
          action="All solutions"
          to="/solutions"
        />
        <div className="solutions-grid">
          {solutions.map((solution) => (
            <Link
              className="solution-card"
              to="/solutions/$slug"
              params={{ slug: solution.slug }}
              key={solution.slug}
            >
              <div className="solution-image">
                <img loading="lazy" decoding="async" src={solution.image} alt={solution.name} />
              </div>
              <div className="solution-copy">
                <h3>{solution.name}</h3>
                <span>
                  Explore solution <ArrowRight size={16} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="packages" className="section shell packages-section">
        <SectionHeading
          eyebrow="Complete packages"
          title="What each package includes"
          action="All solutions"
          to="/solutions"
        />
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
                {item.includes.slice(0, 4).map((line) => (
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

      <section id="services" className="support-section">
        <div className="shell">
          <SectionHeading
            eyebrow="Service resources"
            title="Technical support"
            action="All services"
            to="/services"
          />
          <div className="support-grid">
            {SUPPORT_CARDS.map((card, index) => (
              <Link
                className={`support-card${index === 0 ? " support-main" : ""}`}
                to={card.to}
                key={card.title}
                style={{ backgroundImage: `url(${card.image})` }}
              >
                <span>{card.eyebrow}</span>
                <h3>{card.title}</h3>
                <ArrowRight />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="projects" className="section shell">
        <SectionHeading
          eyebrow="Global delivery"
          title="Recent customer projects"
          action="All projects"
          to="/projects"
        />
        <div className="projects-grid">
          {projects.map((project) => (
            <article className="project-card" key={project.id ?? project.title}>
              <Link to="/projects" className="project-image">
                <img loading="lazy" decoding="async" src={project.image} alt={project.title} />
              </Link>
              <time dateTime={project.date}>{project.date}</time>
              <h3>{project.title}</h3>
              <p>{project.copy}</p>
              <Link className="text-link" to="/projects">
                Learn more <ArrowRight size={16} />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section id="blog" className="insights-section">
        <div className="shell">
          <SectionHeading
            eyebrow="Knowledge center"
            title="Filling and packaging insights"
            action="Read the knowledge center"
            to="/blog"
          />
          <div className="insight-list">
            {insights.map((insight) => (
              <Link to="/blog" key={insight.num}>
                <span>{insight.num}</span>
                <div>
                  <h3>{insight.title}</h3>
                  <p>{insight.copy}</p>
                </div>
                <ArrowRight />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="contact-section">
        <div className="shell contact-grid">
          <div className="contact-intro">
            <p className="eyebrow light">Start your project</p>
            <h2>Talk with a Seven Zillions beverage packaging specialist</h2>
            <p>
              Tell us your beverage, bottle format and target capacity. Our engineering team will
              help you shape the right production line.
            </p>
            <div className="contact-facts">
              <span>
                <MapPin /> {company.address}
              </span>
              <span>
                <Mail /> <a href={`mailto:${company.email}`}>{company.email}</a>
              </span>
              {company.phones.map((phone) => (
                <span key={phone}>
                  <Phone /> <a href={`tel:${phone.replace(/\s+/g, "")}`}>{phone}</a>
                </span>
              ))}
              <span>
                <MessageSquareText />{" "}
                <a
                  href={company.whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() =>
                    void recordActivityFn({
                      data: {
                        eventType: "whatsapp_click",
                        path: "/",
                        timestamp: new Date().toISOString(),
                      },
                    })
                  }
                >
                  WhatsApp {company.whatsapp}
                </a>
              </span>
            </div>
          </div>
          <form className="quote-form" onSubmit={handleQuoteSubmit}>
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
                rows={4}
                name="requirements"
                placeholder="Product, bottle size, capacity and destination"
                required
              />
            </label>
            <button type="submit" className="primary-button">
              Get pricing & solutions <ArrowRight size={17} />
            </button>
            {sent && (
              <p className="form-sent" role="status">
                <Check size={16} />
                Your email app is opening with your message ready to send.
              </p>
            )}
          </form>
        </div>
      </section>

      <SiteFooter />
      <ContactRail />
    </main>
  );
}
