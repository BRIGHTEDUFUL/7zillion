import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import { deleteProductFn, listProductsFn } from "@/api/products";
import { assertMutationSucceeded } from "@/components/admin/api-results";
import { ContentList, type ContentListColumn } from "@/components/admin/content-list";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types/content";

export const Route = createFileRoute("/admin/_authenticated/products/")({
  loader: () => listProductsFn(),
  component: ProductsIndexPage,
});

function ProductsIndexPage() {
  const products = Route.useLoaderData();
  const router = useRouter();

  const columns: Array<ContentListColumn<Product>> = [
    {
      key: "name",
      header: "Name",
      accessor: (product) => <span className="font-medium">{product.name}</span>,
      sortValue: (product) => product.name,
    },
    {
      key: "category",
      header: "Category",
      accessor: (product) => product.category || "—",
      sortValue: (product) => product.category,
    },
    {
      key: "slug",
      header: "Slug",
      accessor: (product) => <code className="text-xs text-muted-foreground">{product.slug}</code>,
      sortValue: (product) => product.slug,
    },
  ];

  async function handleDelete(product: Product) {
    try {
      const result = await deleteProductFn({ data: { slug: product.slug } });
      assertMutationSucceeded(result);
      toast.success("Product deleted.");
      await router.invalidate();
    } catch {
      toast.error("The product could not be deleted.");
    }
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Catalogue"
        title="Products"
        description={`${products.length} ${products.length === 1 ? "product" : "products"} in the live catalogue.`}
        actions={
          <Button asChild>
            <Link to="/admin/products/new">
              <Plus aria-hidden="true" />
              Add product
            </Link>
          </Button>
        }
      />
      <ContentList
        items={products}
        columns={columns}
        getItemId={(product) => product.slug}
        caption="Products"
        emptyMessage="No products have been added yet."
        renderEditLink={(product) => (
          <Button asChild variant="ghost" size="sm">
            <Link
              to="/admin/products/$slug"
              params={{ slug: product.slug }}
              aria-label={`Edit ${product.name}`}
            >
              <Pencil aria-hidden="true" />
              Edit
            </Link>
          </Button>
        )}
        onDelete={handleDelete}
        deleteDescription={(product) => `“${product.name}” will be permanently removed.`}
      />
    </div>
  );
}
