import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import { deleteInsightFn, listInsightsFn } from "@/api/insights";
import { assertMutationSucceeded } from "@/components/admin/api-results";
import { ContentList, type ContentListColumn } from "@/components/admin/content-list";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import type { Insight } from "@/types/content";

export const Route = createFileRoute("/admin/_authenticated/insights/")({
  loader: () => listInsightsFn(),
  component: InsightsIndexPage,
});

function InsightsIndexPage() {
  const insights = Route.useLoaderData();
  const router = useRouter();

  const columns: Array<ContentListColumn<Insight>> = [
    {
      key: "title",
      header: "Title",
      accessor: (insight) => <span className="font-medium">{insight.title}</span>,
      sortValue: (insight) => insight.title,
    },
    {
      key: "num",
      header: "Number",
      accessor: (insight) => insight.num || "—",
      sortValue: (insight) => insight.num,
    },
    {
      key: "slug",
      header: "Slug",
      accessor: (insight) => <code className="text-xs text-muted-foreground">{insight.slug}</code>,
      sortValue: (insight) => insight.slug,
    },
  ];

  async function handleDelete(insight: Insight) {
    try {
      const result = await deleteInsightFn({ data: { slug: insight.slug } });
      assertMutationSucceeded(result);
      toast.success("Insight deleted.");
      await router.invalidate();
    } catch {
      toast.error("The insight could not be deleted.");
    }
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Knowledge centre"
        title="Insights"
        description={`${insights.length} ${insights.length === 1 ? "article" : "articles"} published.`}
        actions={
          <Button asChild>
            <Link to="/admin/insights/new">
              <Plus aria-hidden="true" />
              Add insight
            </Link>
          </Button>
        }
      />
      <ContentList
        items={insights}
        columns={columns}
        getItemId={(insight) => insight.slug}
        caption="Insights"
        emptyMessage="No insights have been added yet."
        renderEditLink={(insight) => (
          <Button asChild variant="ghost" size="sm">
            <Link
              to="/admin/insights/$slug"
              params={{ slug: insight.slug }}
              aria-label={`Edit ${insight.title}`}
            >
              <Pencil aria-hidden="true" />
              Edit
            </Link>
          </Button>
        )}
        onDelete={handleDelete}
        deleteDescription={(insight) =>
          `“${insight.title}” will be removed from the knowledge centre.`
        }
      />
    </div>
  );
}
