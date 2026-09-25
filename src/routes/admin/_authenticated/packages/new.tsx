import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { PackageForm } from "@/components/admin/package-form";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/_authenticated/packages/new")({
  component: NewPackagePage,
});

function NewPackagePage() {
  const router = useRouter();
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Packages"
        title="Add package"
        description="Create a package with its scope and specifications."
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
        onCancel={() => router.navigate({ to: "/admin/packages" })}
        onSaved={() => router.navigate({ to: "/admin/packages" })}
      />
    </div>
  );
}
