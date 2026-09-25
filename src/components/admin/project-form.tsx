import { useFormContext } from "react-hook-form";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";

import { deleteProjectFn, upsertProjectFn } from "@/api/projects";
import { ProjectSchema } from "@/lib/schemas";
import type { Project } from "@/types/content";
import { assertMutationSucceeded, AdminFieldError } from "@/components/admin/api-results";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { ContentForm } from "@/components/admin/content-form";
import { TextField, TextareaField } from "@/components/admin/form-fields";
import { ImageUpload } from "@/components/admin/image-upload";
import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

type ProjectFormValues = z.input<typeof ProjectSchema>;

const today = new Date().toISOString().slice(0, 10);

const emptyProject: ProjectFormValues = {
  date: today,
  title: "",
  copy: "",
  image: "",
  videoUrl: "",
};

interface ProjectFormProps {
  project?: Project;
  onCancel: () => void;
  onSaved?: () => void | Promise<void>;
  onDeleted?: () => void | Promise<void>;
}

function ProjectFields() {
  const form = useFormContext<ProjectFormValues>();

  return (
    <div className="space-y-8">
      <section className="space-y-5" aria-labelledby="project-basics-heading">
        <div>
          <h2 id="project-basics-heading" className="text-base font-semibold">
            Project details
          </h2>
          <p className="text-sm text-muted-foreground">
            Portfolio identity and delivery information.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <TextField control={form.control} name="title" label="Project title" required />
          <TextField
            control={form.control}
            name="date"
            label="Project date"
            type="date"
            required
            description="YYYY-MM-DD"
          />
        </div>
        <TextareaField
          control={form.control}
          name="copy"
          label="Project summary"
          required
          rows={7}
        />
      </section>

      <section className="space-y-5 border-t pt-8" aria-labelledby="project-image-heading">
        <div>
          <h2 id="project-image-heading" className="text-base font-semibold">
            Project image
          </h2>
          <p className="text-sm text-muted-foreground">JPEG, PNG, or WebP up to 5 MB.</p>
        </div>
        <FormField
          control={form.control}
          name="image"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="sr-only">Image</FormLabel>
              <ImageUpload
                label="Image"
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </section>

      <section className="space-y-5 border-t pt-8" aria-labelledby="project-video-heading">
        <div>
          <h2 id="project-video-heading" className="text-base font-semibold">
            Project video
          </h2>
          <p className="text-sm text-muted-foreground">
            Optional YouTube link shown on the project card.
          </p>
        </div>
        <TextField
          control={form.control}
          name="videoUrl"
          label="YouTube URL"
          type="url"
          placeholder="https://www.youtube.com/watch?v=…"
          description="Paste a YouTube watch URL or short link (youtu.be/…)."
        />
      </section>
    </div>
  );
}

export function ProjectForm({ project, onCancel, onSaved, onDeleted }: ProjectFormProps) {
  async function handleSubmit(values: ProjectFormValues) {
    try {
      const result = await upsertProjectFn({ data: values });
      assertMutationSucceeded(result);
      toast.success(project ? "Project updated." : "Project created.");
      await onSaved?.();
    } catch (error) {
      if (error instanceof AdminFieldError) {
        throw error;
      }
      toast.error("The project could not be saved.");
      throw new Error("The project could not be saved. Please try again.");
    }
  }

  async function handleDelete() {
    if (!project) {
      return;
    }
    try {
      const result = await deleteProjectFn({ data: { id: project.id } });
      assertMutationSucceeded(result);
      toast.success("Project deleted.");
      await onDeleted?.();
    } catch {
      toast.error("The project could not be deleted.");
      throw new Error("The project could not be deleted. Please try again.");
    }
  }

  return (
    <ContentForm
      schema={ProjectSchema}
      defaultValues={project ?? emptyProject}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      title={project ? "Edit project" : "Add project"}
      description="Manage a completed production-line or packaging project."
      submitLabel={project ? "Save project" : "Create project"}
      deleteAction={
        project ? (
          <ConfirmDialog
            title="Delete this project?"
            description={`“${project.title}” will be removed from the public portfolio.`}
            confirmLabel="Delete project"
            destructive
            onConfirm={handleDelete}
          >
            <Button type="button" variant="destructive">
              <Trash2 aria-hidden="true" />
              Delete project
            </Button>
          </ConfirmDialog>
        ) : undefined
      }
    >
      <ProjectFields />
    </ContentForm>
  );
}
