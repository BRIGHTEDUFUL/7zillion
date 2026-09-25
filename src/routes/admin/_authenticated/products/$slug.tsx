import { Link, createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { listProductsFn } from "@/api/products";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/_authenticated/products/$slug")({
  loader: async ({ params }) => {
    const product = (await listProductsFn()).find((item) => item.slug === params.slug);
    if (!product) {
      throw notFound();
    }
    return product;
  },
  component: EditProductPage,
});

function EditProductPage() {
  const product = Route.useLoaderData();
  const router = useRouter();

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Products"
        title="Edit product"
        description={product.name}
        actions={
          <Button asChild variant="outline">
            <Link to="/admin/products">
              <ArrowLeft aria-hidden="true" />
              Back to products
            </Link>
          </Button>
        }
      />
      <ProductForm
        product={product}
        onCancel={() => router.navigate({ to: "/admin/products" })}
        onSaved={() => router.navigate({ to: "/admin/products" })}
        onDeleted={() => router.navigate({ to: "/admin/products" })}
      />
    </div>
  );
}
