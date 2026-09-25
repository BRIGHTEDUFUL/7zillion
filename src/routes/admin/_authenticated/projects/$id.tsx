import { Link, createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { listProjectsFn } from "@/api/projects";
import { PageHeader } from "@/components/admin/page-header";
import { ProjectForm } from "@/components/admin/project-form";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/_authenticated/projects/$id")({
  loader: async ({ params }) => {
    const project = (await listProjectsFn()).find((item) => item.id === params.id);
    if (!project) throw notFound();
    return project;
  },
  component: EditProjectPage,
});

function EditProjectPage() {
  const project = Route.useLoaderData();
  const router = useRouter();
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Projects"
        title="Edit project"
        description={project.title}
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
        project={project}
        onCancel={() => router.navigate({ to: "/admin/projects" })}
        onSaved={() => router.navigate({ to: "/admin/projects" })}
        onDeleted={() => router.navigate({ to: "/admin/projects" })}
      />
    </div>
  );
}
