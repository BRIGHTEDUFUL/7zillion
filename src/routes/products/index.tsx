import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { InnerPage } from "@/components/inner-page";
import { products } from "@/data/site";

export const Route = createFileRoute("/products/")({
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
  return (
    <InnerPage
      eyebrow="Product families"
      title="Equipment for the complete production line"
      intro="Seven families of machines, from water treatment through filling to palletising. Each page sets out what the equipment does, what it is measured on and how it ties into the rest of the line."
      crumbs={[{ label: "Products" }]}
    >
      <section className="section shell">
        <div className="card-grid">
          {products.map((product, index) => (
            <Link
              className="page-card"
              to="/products/$slug"
              params={{ slug: product.slug }}
              key={product.slug}
            >
              <div className="page-card-media">
                <img src={product.image} alt={product.name} />
                <span className="card-index">0{index + 1}</span>
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
      </section>
    </InnerPage>
  );
}
