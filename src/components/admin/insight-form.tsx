import { useFormContext } from "react-hook-form";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteInsightFn, upsertInsightFn } from "@/api/insights";
import { InsightSchema } from "@/lib/schemas";
import type { Insight } from "@/types/content";
import { assertMutationSucceeded, AdminFieldError } from "@/components/admin/api-results";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { ContentForm } from "@/components/admin/content-form";
import { DynamicList } from "@/components/admin/dynamic-list";
import { TextField, TextareaField } from "@/components/admin/form-fields";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form";

const emptyInsight: Insight = {
  num: "",
  slug: "",
  title: "",
  copy: "",
  body: [],
};

interface InsightFormProps {
  insight?: Insight;
  onCancel: () => void;
  onSaved?: () => void | Promise<void>;
  onDeleted?: () => void | Promise<void>;
}

function InsightFields() {
  const form = useFormContext<Insight>();

  return (
    <div className="space-y-8">
      <section className="space-y-5" aria-labelledby="insight-basics-heading">
        <div>
          <h2 id="insight-basics-heading" className="text-base font-semibold">
            Article details
          </h2>
          <p className="text-sm text-muted-foreground">Knowledge-centre identity and summary.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <TextField control={form.control} name="num" label="Article number" placeholder="01" />
          <TextField
            control={form.control}
            name="slug"
            label="Slug"
            required
            placeholder="planning-a-production-line"
          />
        </div>
        <TextField control={form.control} name="title" label="Title" required />
        <TextareaField control={form.control} name="copy" label="Summary" required rows={4} />
      </section>

      <section className="space-y-5 border-t pt-8" aria-labelledby="insight-body-heading">
        <div>
          <h2 id="insight-body-heading" className="text-base font-semibold">
            Article body
          </h2>
          <p className="text-sm text-muted-foreground">
            Each paragraph is rendered as a separate block in order.
          </p>
        </div>
        <FormField
          control={form.control}
          name="body"
          render={({ field }) => (
            <DynamicList
              label="Paragraphs"
              items={field.value}
              onChange={field.onChange}
              itemLabel="Paragraph"
              addLabel="Add paragraph"
              placeholder="Write a paragraph"
              multiline
            />
          )}
        />
      </section>
    </div>
  );
}

export function InsightForm({ insight, onCancel, onSaved, onDeleted }: InsightFormProps) {
  async function handleSubmit(values: Insight) {
    try {
      const result = await upsertInsightFn({ data: values });
      assertMutationSucceeded(result, { duplicateField: "slug" });
      toast.success(insight ? "Insight updated." : "Insight created.");
      await onSaved?.();
    } catch (error) {
      if (error instanceof AdminFieldError) {
        throw error;
      }
      toast.error("The insight could not be saved.");
      throw new Error("The insight could not be saved. Please try again.");
    }
  }

  async function handleDelete() {
    if (!insight) {
      return;
    }
    try {
      const result = await deleteInsightFn({ data: { slug: insight.slug } });
      assertMutationSucceeded(result);
      toast.success("Insight deleted.");
      await onDeleted?.();
    } catch {
      toast.error("The insight could not be deleted.");
      throw new Error("The insight could not be deleted. Please try again.");
    }
  }

  return (
    <ContentForm
      schema={InsightSchema}
      defaultValues={insight ?? emptyInsight}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      title={insight ? "Edit insight" : "Add insight"}
      description="Publish and maintain an article in the public knowledge centre."
      submitLabel={insight ? "Save insight" : "Create insight"}
      deleteAction={
        insight ? (
          <ConfirmDialog
            title="Delete this insight?"
            description={`“${insight.title}” will be removed from the knowledge centre.`}
            confirmLabel="Delete insight"
            destructive
            onConfirm={handleDelete}
          >
            <Button type="button" variant="destructive">
              <Trash2 aria-hidden="true" />
              Delete insight
            </Button>
          </ConfirmDialog>
        ) : undefined
      }
    >
      <InsightFields />
    </ContentForm>
  );
}
