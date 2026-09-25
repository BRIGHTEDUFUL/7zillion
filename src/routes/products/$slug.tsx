import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowRight, Check, MessageCircle, Mail, Phone } from "lucide-react";

import { getProductFn, listProductsFn } from "@/api/products";
import { recordActivityFn } from "@/api/activity";
import { InnerPage } from "@/components/inner-page";
import { SectionHeading } from "@/components/section-heading";
import { YouTubeEmbed } from "@/components/youtube-embed";
import { company } from "@/data/site";

export const Route = createFileRoute("/products/$slug")({
  loader: async ({ params }) => {
    const product = await getProductFn({ data: { slug: params.slug } });
    if (!product) throw notFound();
    void recordActivityFn({
      data: {
        eventType: "page_view",
        path: `/products/${params.slug}`,
        slug: params.slug,
        timestamp: new Date().toISOString(),
      },
    });
    // Load all products for the related section
    const all = await listProductsFn();
    return { product, all };
  },
  head: ({ loaderData }) => {
    const product = loaderData?.product;
    return {
      meta: [
        { title: `${product?.name ?? "Product"} | Seven Zillions` },
        {
          name: "description",
          content: product?.summary ?? "Seven Zillions beverage production equipment.",
        },
      ],
    };
  },
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { product, all } = Route.useLoaderData();

  // Build pre-filled WhatsApp URL
  const waHref = `${company.whatsappHref}?text=${encodeURIComponent(product.whatsappMessage ?? "")}`;

  // Related: same category first, then fill with others, exclude self
  const related = all
    .filter((item) => item.slug !== product.slug)
    .sort((a) => (a.category === product.category ? -1 : 1))
    .slice(0, 3);

  return (
    <InnerPage
      eyebrow={product.category}
      title={product.name}
      intro={product.summary}
      crumbs={[{ label: "Products", to: "/products" }, { label: product.name }]}
    >
      {/* ── Main detail layout ── */}
      <section className="section shell product-detail-layout">
        {/* LEFT: content */}
        <div className="product-detail-main">
          <div className="product-detail-image">
            <img loading="lazy" decoding="async" src={product.image} alt={product.name} />
            <span className="product-detail-category">{product.category}</span>
          </div>

          <div className="product-detail-body">
            <p className="detail-lead">{product.detail}</p>
            <p className="detail-lead detail-lead--secondary">{product.detail2}</p>

            <div className="product-highlights">
              <h2 className="product-highlights-title">What this equipment delivers</h2>
              <ul className="check-list">
                {product.highlights.map((line) => (
                  <li key={line}>
                    <span>
                      <Check size={14} />
                    </span>
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            {product.videoUrl && (
              <div className="product-video" style={{ marginTop: "2rem" }}>
                <h2 className="product-highlights-title">See it in action</h2>
                <YouTubeEmbed videoUrl={product.videoUrl} title={`${product.name} video`} />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: sticky enquiry panel */}
        <aside className="product-detail-aside">
          {/* Spec card */}
          <div className="spec-panel">
            <p className="eyebrow">Technical specification</p>
            <h2>{product.name}</h2>
            <dl className="spec-list">
              {product.specs.map((spec) => (
                <div key={spec.label}>
                  <dt>{spec.label}</dt>
                  <dd>{spec.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Enquiry card */}
          <div className="enquiry-panel">
            <p className="eyebrow">Get pricing</p>
            <h3 className="enquiry-panel-title">Interested in this equipment?</h3>
            <p className="enquiry-panel-copy">
              Tell us your container format, required output and beverage type — we'll prepare a
              technical and commercial proposal within 48 hours.
            </p>

            {/* WhatsApp — primary CTA, records whatsapp_click */}
            <a
              href={waHref}
              target="_blank"
              rel="noreferrer"
              className="whatsapp-button"
              aria-label={`Enquire about ${product.name} on WhatsApp`}
              onClick={() =>
                void recordActivityFn({
                  data: {
                    eventType: "whatsapp_click",
                    slug: product.slug,
                    path: `/products/${product.slug}`,
                    timestamp: new Date().toISOString(),
                  },
                })
              }
            >
              <MessageCircle size={18} />
              WhatsApp us now
            </a>

            {/* Email CTA */}
            <Link to="/contact" className="primary-button enquiry-email-btn">
              <Mail size={16} />
              Send an enquiry
            </Link>

            {/* Direct phone */}
            <div className="enquiry-phone">
              <Phone size={14} />
              <div>
                {company.phones.slice(0, 2).map((phone) => (
                  <a key={phone} href={`tel:${phone.replace(/\s+/g, "")}`}>
                    {phone}
                  </a>
                ))}
              </div>
            </div>

            <p className="spec-note">
              Pricing depends on output, automation level, container range, utilities and service
              scope. All proposals are prepared from your actual requirements.
            </p>
          </div>
        </aside>
      </section>

      {/* ── Related equipment ── */}
      <section className="section shell related-section">
        <SectionHeading
          eyebrow="Also on the line"
          title="Related equipment"
          action="All products"
          to="/products"
        />
        <div className="card-grid">
          {related.map((item) => (
            <Link
              className="page-card"
              to="/products/$slug"
              params={{ slug: item.slug }}
              key={item.slug}
            >
              <div className="page-card-media">
                <img loading="lazy" decoding="async" src={item.image} alt={item.name} />
                <span className="card-index page-card-media-index">{item.category}</span>
              </div>
              <div className="page-card-body">
                <span className="page-card-category">{item.category}</span>
                <h3>{item.name}</h3>
                <p>{item.summary}</p>
                <span className="card-action">
                  View equipment <ArrowRight size={16} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </InnerPage>
  );
}
