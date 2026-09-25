import { Link, createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { listInsightsFn } from "@/api/insights";
import { InsightForm } from "@/components/admin/insight-form";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/_authenticated/insights/$slug")({
  loader: async ({ params }) => {
    const insight = (await listInsightsFn()).find((item) => item.slug === params.slug);
    if (!insight) throw notFound();
    return insight;
  },
  component: EditInsightPage,
});

function EditInsightPage() {
  const insight = Route.useLoaderData();
  const router = useRouter();
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Insights"
        title="Edit insight"
        description={insight.title}
        actions={
          <Button asChild variant="outline">
            <Link to="/admin/insights">
              <ArrowLeft aria-hidden="true" />
              Back to insights
            </Link>
          </Button>
        }
      />
      <InsightForm
        insight={insight}
        onCancel={() => router.navigate({ to: "/admin/insights" })}
        onSaved={() => router.navigate({ to: "/admin/insights" })}
        onDeleted={() => router.navigate({ to: "/admin/insights" })}
      />
    </div>
  );
}
