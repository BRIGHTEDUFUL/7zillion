import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import { deletePackageFn, listPackagesFn } from "@/api/packages";
import { assertMutationSucceeded } from "@/components/admin/api-results";
import { ContentList, type ContentListColumn } from "@/components/admin/content-list";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import type { Package } from "@/types/content";

export const Route = createFileRoute("/admin/_authenticated/packages/")({
  loader: () => listPackagesFn(),
  component: PackagesIndexPage,
});

function PackagesIndexPage() {
  const packages = Route.useLoaderData();
  const router = useRouter();

  const columns: Array<ContentListColumn<Package>> = [
    {
      key: "name",
      header: "Name",
      accessor: (item) => <span className="font-medium">{item.name}</span>,
      sortValue: (item) => item.name,
    },
    {
      key: "slug",
      header: "Slug",
      accessor: (item) => <code className="text-xs text-muted-foreground">{item.slug}</code>,
      sortValue: (item) => item.slug,
    },
  ];

  async function handleDelete(item: Package) {
    try {
      const result = await deletePackageFn({ data: { slug: item.slug } });
      assertMutationSucceeded(result);
      toast.success("Package deleted.");
      await router.invalidate();
    } catch {
      toast.error("The package could not be deleted.");
    }
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Package scope"
        title="Packages"
        description={`${packages.length} ${packages.length === 1 ? "package" : "packages"} on the site.`}
        actions={
          <Button asChild>
            <Link to="/admin/packages/new">
              <Plus aria-hidden="true" />
              Add package
            </Link>
          </Button>
        }
      />
      <ContentList
        items={packages}
        columns={columns}
        getItemId={(item) => item.slug}
        caption="Packages"
        emptyMessage="No packages have been added yet."
        renderEditLink={(item) => (
          <Button asChild variant="ghost" size="sm">
            <Link
              to="/admin/packages/$slug"
              params={{ slug: item.slug }}
              aria-label={`Edit ${item.name}`}
            >
              <Pencil aria-hidden="true" />
              Edit
            </Link>
          </Button>
        )}
        onDelete={handleDelete}
        deleteDescription={(item) => `“${item.name}” will be removed from the site.`}
      />
    </div>
  );
}
