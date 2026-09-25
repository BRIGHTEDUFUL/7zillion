import { Link, createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { listPackagesFn } from "@/api/packages";
import { PackageForm } from "@/components/admin/package-form";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/_authenticated/packages/$slug")({
  loader: async ({ params }) => {
    const item = (await listPackagesFn()).find((candidate) => candidate.slug === params.slug);
    if (!item) throw notFound();
    return item;
  },
  component: EditPackagePage,
});

function EditPackagePage() {
  const item = Route.useLoaderData();
  const router = useRouter();
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Packages"
        title="Edit package"
        description={item.name}
        actions={
          <Button asChild variant="outline">
            <Link to="/admin/packages">
              <ArrowLeft aria-hidden="true" />
              Back to packages
            </Link>
          </Button>
        }
      />
      <PackageForm
        packageItem={item}
        onCancel={() => router.navigate({ to: "/admin/packages" })}
        onSaved={() => router.navigate({ to: "/admin/packages" })}
        onDeleted={() => router.navigate({ to: "/admin/packages" })}
      />
    </div>
  );
}
