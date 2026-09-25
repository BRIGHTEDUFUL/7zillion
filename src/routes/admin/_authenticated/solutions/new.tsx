import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import { SolutionForm } from "@/components/admin/solution-form";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/_authenticated/solutions/new")({
  component: NewSolutionPage,
});

function NewSolutionPage() {
  const router = useRouter();
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Solutions"
        title="Add solution"
        description="Create a complete production-line solution for the public catalogue."
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
        onCancel={() => router.navigate({ to: "/admin/solutions" })}
        onSaved={() => router.navigate({ to: "/admin/solutions" })}
      />
    </div>
  );
}
