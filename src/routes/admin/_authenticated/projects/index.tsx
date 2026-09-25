import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import { deleteProjectFn, listProjectsFn } from "@/api/projects";
import { assertMutationSucceeded } from "@/components/admin/api-results";
import { ContentList, type ContentListColumn } from "@/components/admin/content-list";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import type { Project } from "@/types/content";

export const Route = createFileRoute("/admin/_authenticated/projects/")({
  loader: () => listProjectsFn(),
  component: ProjectsIndexPage,
});

function ProjectsIndexPage() {
  const projects = Route.useLoaderData();
  const router = useRouter();

  const columns: Array<ContentListColumn<Project>> = [
    {
      key: "title",
      header: "Title",
      accessor: (project) => <span className="font-medium">{project.title}</span>,
      sortValue: (project) => project.title,
    },
    {
      key: "date",
      header: "Date",
      accessor: (project) => <time dateTime={project.date}>{project.date}</time>,
      sortValue: (project) => project.date,
    },
  ];

  async function handleDelete(project: Project) {
    try {
      const result = await deleteProjectFn({ data: { id: project.id } });
      assertMutationSucceeded(result);
      toast.success("Project deleted.");
      await router.invalidate();
    } catch {
      toast.error("The project could not be deleted.");
    }
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Portfolio"
        title="Projects"
        description={`${projects.length} ${projects.length === 1 ? "project" : "projects"} in the public portfolio.`}
        actions={
          <Button asChild>
            <Link to="/admin/projects/new">
              <Plus aria-hidden="true" />
              Add project
            </Link>
          </Button>
        }
      />
      <ContentList
        items={projects}
        columns={columns}
        getItemId={(project) => project.id}
        caption="Projects"
        emptyMessage="No projects have been added yet."
        renderEditLink={(project) => (
          <Button asChild variant="ghost" size="sm">
            <Link
              to="/admin/projects/$id"
              params={{ id: project.id }}
              aria-label={`Edit ${project.title}`}
            >
              <Pencil aria-hidden="true" />
              Edit
            </Link>
          </Button>
        )}
        onDelete={handleDelete}
        deleteDescription={(project) =>
          `“${project.title}” will be removed from the public portfolio.`
        }
      />
    </div>
  );
}
