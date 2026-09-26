import { createFileRoute, useRouter } from "@tanstack/react-router";

import { getPagesFn } from "@/api/pages";
import { PagesForm } from "@/components/admin/pages-form";
import { PageHeader } from "@/components/admin/page-header";

export const Route = createFileRoute("/admin/_authenticated/pages")({
  loader: () => getPagesFn(),
  component: PagesPage,
});

function PagesPage() {
  const pages = Route.useLoaderData();
  const router = useRouter();

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Settings"
        title="Page content"
        description="Edit the About page copy, the equipment and production line lists, and the contact checklist."
      />
      <PagesForm
        pages={pages}
        onCancel={() => router.invalidate()}
        onSaved={() => router.invalidate()}
      />
    </div>
  );
}
