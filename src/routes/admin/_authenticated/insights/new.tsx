import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { InsightForm } from "@/components/admin/insight-form";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/_authenticated/insights/new")({
  component: NewInsightPage,
});

function NewInsightPage() {
  const router = useRouter();
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Insights"
        title="Add insight"
        description="Create an article for the public knowledge centre."
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
        onCancel={() => router.navigate({ to: "/admin/insights" })}
        onSaved={() => router.navigate({ to: "/admin/insights" })}
      />
    </div>
  );
}
