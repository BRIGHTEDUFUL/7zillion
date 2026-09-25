import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import { deleteSolutionFn, listSolutionsFn } from "@/api/solutions";
import { assertMutationSucceeded } from "@/components/admin/api-results";
import { ContentList, type ContentListColumn } from "@/components/admin/content-list";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import type { Solution } from "@/types/content";

export const Route = createFileRoute("/admin/_authenticated/solutions/")({
  loader: () => listSolutionsFn(),
  component: SolutionsIndexPage,
});

function SolutionsIndexPage() {
  const solutions = Route.useLoaderData();
  const router = useRouter();

  const columns: Array<ContentListColumn<Solution>> = [
    {
      key: "name",
      header: "Name",
      accessor: (solution) => <span className="font-medium">{solution.name}</span>,
      sortValue: (solution) => solution.name,
    },
    {
      key: "eyebrow",
      header: "Eyebrow",
      accessor: (solution) => solution.eyebrow || "—",
      sortValue: (solution) => solution.eyebrow,
    },
    {
      key: "slug",
      header: "Slug",
      accessor: (solution) => (
        <code className="text-xs text-muted-foreground">{solution.slug}</code>
      ),
      sortValue: (solution) => solution.slug,
    },
  ];

  async function handleDelete(solution: Solution) {
    try {
      const result = await deleteSolutionFn({ data: { slug: solution.slug } });
      assertMutationSucceeded(result);
      toast.success("Solution deleted.");
      await router.invalidate();
    } catch {
      toast.error("The solution could not be deleted.");
    }
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Catalogue"
        title="Solutions"
        description={`${solutions.length} ${solutions.length === 1 ? "solution" : "solutions"} available.`}
        actions={
          <Button asChild>
            <Link to="/admin/solutions/new">
              <Plus aria-hidden="true" />
              Add solution
            </Link>
          </Button>
        }
      />
      <ContentList
        items={solutions}
        columns={columns}
        getItemId={(solution) => solution.slug}
        caption="Solutions"
        emptyMessage="No solutions have been added yet."
        renderEditLink={(solution) => (
          <Button asChild variant="ghost" size="sm">
            <Link
              to="/admin/solutions/$slug"
              params={{ slug: solution.slug }}
              aria-label={`Edit ${solution.name}`}
            >
              <Pencil aria-hidden="true" />
              Edit
            </Link>
          </Button>
        )}
        onDelete={handleDelete}
        deleteDescription={(solution) => `“${solution.name}” will be permanently removed.`}
      />
    </div>
  );
}
