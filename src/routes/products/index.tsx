import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";

import { listProductsFn } from "@/api/products";
import { recordActivityFn } from "@/api/activity";
import { InnerPage } from "@/components/inner-page";

export const Route = createFileRoute("/products/")({
  loader: async () => {
    const products = await listProductsFn();
    void recordActivityFn({
      data: { eventType: "page_view", path: "/products", timestamp: new Date().toISOString() },
    });
    return products;
  },
  head: () => ({
    meta: [
      { title: "Products | Seven Zillions — Filling, Treatment & Packaging Equipment" },
      {
        name: "description",
        content:
          "Filling machines, water treatment, processing, blow molding, labeling, packaging and conveyor equipment for complete beverage production lines.",
      },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const products = Route.useLoaderData();
  const [filter, setFilter] = useState("All");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((product) => product.category)))],
    [products],
  );
  const visible =
    filter === "All" ? products : products.filter((product) => product.category === filter);

  return (
    <InnerPage
      eyebrow="Product families"
      title="Equipment for the complete production line"
      intro="Seven families of machines, from water treatment through filling to palletising. Each page sets out what the equipment does, what it is measured on and how it ties into the rest of the line."
      crumbs={[{ label: "Products" }]}
    >
      <section className="section shell">
        <div className="filter-row" role="group" aria-label="Filter equipment by category">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className="filter-chip"
              aria-pressed={filter === category}
              onClick={() => setFilter(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="card-grid">
          {visible.map((product) => (
            <Link
              className="page-card"
              to="/products/$slug"
              params={{ slug: product.slug }}
              key={product.slug}
            >
              <div className="page-card-media">
                <img loading="lazy" decoding="async" src={product.image} alt={product.name} />
                <span className="page-card-media-index">{product.category}</span>
              </div>
              <div className="page-card-body">
                <span className="page-card-category">{product.category}</span>
                <h2>{product.name}</h2>
                <p>{product.summary}</p>
                <span className="card-action">
                  View equipment <ArrowRight size={16} />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {visible.length === 0 && (
          <p className="wide-copy">No equipment in this category yet — tell us what you need.</p>
        )}
      </section>
    </InnerPage>
  );
}
