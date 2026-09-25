import { createFileRoute, useRouter } from "@tanstack/react-router";

import { getServicesFn } from "@/api/services";
import { PageHeader } from "@/components/admin/page-header";
import { ServicesForm } from "@/components/admin/services-form";

export const Route = createFileRoute("/admin/_authenticated/services/")({
  loader: () => getServicesFn(),
  component: ServicesPage,
});

function ServicesPage() {
  const services = Route.useLoaderData();
  const router = useRouter();

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Capabilities"
        title="Services"
        description="Add, remove, reorder, and edit the complete list shown on the public services page."
      />
      <ServicesForm
        services={services}
        onCancel={() => router.invalidate()}
        onSaved={() => router.invalidate()}
      />
    </div>
  );
}
