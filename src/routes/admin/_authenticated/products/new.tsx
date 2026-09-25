import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { ProductForm } from "@/components/admin/product-form";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/_authenticated/products/new")({
  component: NewProductPage,
});

function NewProductPage() {
  const router = useRouter();

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Products"
        title="Add product"
        description="Create a new item for the public product catalogue."
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
        onCancel={() => router.navigate({ to: "/admin/products" })}
        onSaved={() => router.navigate({ to: "/admin/products" })}
      />
    </div>
  );
}
