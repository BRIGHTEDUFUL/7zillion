import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import { ProjectForm } from "@/components/admin/project-form";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/_authenticated/projects/new")({
  component: NewProjectPage,
});

function NewProjectPage() {
  const router = useRouter();
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Projects"
        title="Add project"
        description="Add a completed project to the public portfolio."
        actions={
          <Button asChild variant="outline">
            <Link to="/admin/projects">
              <ArrowLeft aria-hidden="true" />
              Back to projects
            </Link>
          </Button>
        }
      />
      <ProjectForm
        onCancel={() => router.navigate({ to: "/admin/projects" })}
        onSaved={() => router.navigate({ to: "/admin/projects" })}
      />
    </div>
  );
}
