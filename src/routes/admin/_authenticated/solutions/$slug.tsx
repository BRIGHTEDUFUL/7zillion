import { Link, createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { listSolutionsFn } from "@/api/solutions";
import { PageHeader } from "@/components/admin/page-header";
import { SolutionForm } from "@/components/admin/solution-form";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/_authenticated/solutions/$slug")({
  loader: async ({ params }) => {
    const solution = (await listSolutionsFn()).find((item) => item.slug === params.slug);
    if (!solution) throw notFound();
    return solution;
  },
  component: EditSolutionPage,
});

function EditSolutionPage() {
  const solution = Route.useLoaderData();
  const router = useRouter();
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Solutions"
        title="Edit solution"
        description={solution.name}
        actions={
          <Button asChild variant="outline">
            <Link to="/admin/solutions">
              <ArrowLeft aria-hidden="true" />
              Back to solutions
            </Link>
          </Button>
        }
      />
      <SolutionForm
        solution={solution}
        onCancel={() => router.navigate({ to: "/admin/solutions" })}
        onSaved={() => router.navigate({ to: "/admin/solutions" })}
        onDeleted={() => router.navigate({ to: "/admin/solutions" })}
      />
    </div>
  );
}
