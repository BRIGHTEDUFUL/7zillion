import { useFieldArray, useFormContext } from "react-hook-form";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteSolutionFn, upsertSolutionFn } from "@/api/solutions";
import { SolutionSchema } from "@/lib/schemas";
import type { Solution } from "@/types/content";
import { assertMutationSucceeded, AdminFieldError } from "@/components/admin/api-results";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { ContentForm } from "@/components/admin/content-form";
import { DynamicList } from "@/components/admin/dynamic-list";
import { TextField, TextareaField } from "@/components/admin/form-fields";
import { ImageUpload } from "@/components/admin/image-upload";
import { SpecEntryList } from "@/components/admin/spec-entry-list";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const emptySolution: Solution = {
  slug: "",
  name: "",
  image: "",
  eyebrow: "",
  summary: "",
  detail: "",
  capacity: "",
  process: [],
  equipment: [],
  specs: [],
};

interface SolutionFormProps {
  solution?: Solution;
  onCancel: () => void;
  onSaved?: () => void | Promise<void>;
  onDeleted?: () => void | Promise<void>;
}

function ProcessList() {
  const form = useFormContext<Solution>();
  const process = useFieldArray({ control: form.control, name: "process" });

  return (
    <fieldset className="space-y-4">
      <div>
        <legend className="text-sm font-medium">Process steps</legend>
        <p className="mt-1 text-xs text-muted-foreground">
          Add the stages shown in the production process.
        </p>
      </div>
      {process.fields.map((field, index) => (
        <div key={field.id} className="space-y-4 rounded-lg border bg-muted/15 p-4">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)_auto] sm:items-start">
            <FormField
              control={form.control}
              name={`process.${index}.title`}
              render={({ field: input }) => (
                <FormItem>
                  <FormLabel>Step {index + 1} title</FormLabel>
                  <FormControl>
                    <Input {...input} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`process.${index}.copy`}
              render={({ field: input }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...input} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-1 sm:pt-7">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={index === 0}
                onClick={() => process.move(index, index - 1)}
              >
                <ArrowUp aria-hidden="true" />
                <span className="sr-only">Move step {index + 1} up</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={index === process.fields.length - 1}
                onClick={() => process.move(index, index + 1)}
              >
                <ArrowDown aria-hidden="true" />
                <span className="sr-only">Move step {index + 1} down</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => process.remove(index)}
              >
                <Trash2 className="text-destructive" aria-hidden="true" />
                <span className="sr-only">Remove step {index + 1}</span>
              </Button>
            </div>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => process.append({ title: "", copy: "" })}
      >
        <Plus aria-hidden="true" />
        Add process step
      </Button>
    </fieldset>
  );
}

function SolutionFields() {
  const form = useFormContext<Solution>();

  return (
    <div className="space-y-8">
      <section className="space-y-5" aria-labelledby="solution-basics-heading">
        <div>
          <h2 id="solution-basics-heading" className="text-base font-semibold">
            Solution details
          </h2>
          <p className="text-sm text-muted-foreground">
            Catalogue identity and headline information.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <TextField control={form.control} name="name" label="Name" required />
          <TextField control={form.control} name="eyebrow" label="Eyebrow" />
          <TextField
            control={form.control}
            name="slug"
            label="Slug"
            required
            placeholder="water-filling-line"
          />
          <TextField
            control={form.control}
            name="capacity"
            label="Capacity"
            placeholder="1,200–24,000 BPH"
          />
        </div>
        <TextareaField control={form.control} name="summary" label="Summary" required rows={4} />
        <TextareaField control={form.control} name="detail" label="Detailed description" rows={9} />
      </section>

      <section className="space-y-5 border-t pt-8" aria-labelledby="solution-process-heading">
        <div>
          <h2 id="solution-process-heading" className="text-base font-semibold">
            Process and equipment
          </h2>
          <p className="text-sm text-muted-foreground">Ordered content is preserved when saved.</p>
        </div>
        <ProcessList />
        <FormField
          control={form.control}
          name="equipment"
          render={({ field }) => (
            <DynamicList
              label="Equipment"
              items={field.value}
              onChange={field.onChange}
              itemLabel="Equipment item"
              addLabel="Add equipment item"
              placeholder="Name an item in the production line"
            />
          )}
        />
      </section>

      <section className="space-y-5 border-t pt-8" aria-labelledby="solution-specs-heading">
        <div>
          <h2 id="solution-specs-heading" className="text-base font-semibold">
            Specifications
          </h2>
          <p className="text-sm text-muted-foreground">
            Label and value pairs shown on the public page.
          </p>
        </div>
        <FormField
          control={form.control}
          name="specs"
          render={({ field }) => (
            <SpecEntryList label="Specifications" items={field.value} onChange={field.onChange} />
          )}
        />
      </section>

      <section className="space-y-5 border-t pt-8" aria-labelledby="solution-image-heading">
        <div>
          <h2 id="solution-image-heading" className="text-base font-semibold">
            Solution image
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
    </div>
  );
}

export function SolutionForm({ solution, onCancel, onSaved, onDeleted }: SolutionFormProps) {
  async function handleSubmit(values: Solution) {
    try {
      const result = await upsertSolutionFn({ data: values });
      assertMutationSucceeded(result, { duplicateField: "slug" });
      toast.success(solution ? "Solution updated." : "Solution created.");
      await onSaved?.();
    } catch (error) {
      if (error instanceof AdminFieldError) {
        throw error;
      }
      toast.error("The solution could not be saved.");
      throw new Error("The solution could not be saved. Please try again.");
    }
  }

  async function handleDelete() {
    if (!solution) {
      return;
    }
    try {
      const result = await deleteSolutionFn({ data: { slug: solution.slug } });
      assertMutationSucceeded(result);
      toast.success("Solution deleted.");
      await onDeleted?.();
    } catch {
      toast.error("The solution could not be deleted.");
      throw new Error("The solution could not be deleted. Please try again.");
    }
  }

  return (
    <ContentForm
      schema={SolutionSchema}
      defaultValues={solution ?? emptySolution}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      title={solution ? "Edit solution" : "Add solution"}
      description="Manage the complete production-line content shown publicly."
      submitLabel={solution ? "Save solution" : "Create solution"}
      deleteAction={
        solution ? (
          <ConfirmDialog
            title="Delete this solution?"
            description={`“${solution.name}” will be removed from the public catalogue.`}
            confirmLabel="Delete solution"
            destructive
            onConfirm={handleDelete}
          >
            <Button type="button" variant="destructive">
              <Trash2 aria-hidden="true" />
              Delete solution
            </Button>
          </ConfirmDialog>
        ) : undefined
      }
    >
      <SolutionFields />
    </ContentForm>
  );
}
