import { useFieldArray, useFormContext } from "react-hook-form";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { updatePagesFn } from "@/api/pages";
import { PagesSchema, type PagesInput } from "@/lib/schemas";
import { assertMutationSucceeded, AdminFieldError } from "@/components/admin/api-results";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { ContentForm } from "@/components/admin/content-form";
import { DynamicList } from "@/components/admin/dynamic-list";
import { TextField, TextareaField } from "@/components/admin/form-fields";
import { ImageUpload } from "@/components/admin/image-upload";
import { Button } from "@/components/ui/button";

type PagesFormValues = PagesInput;

interface PagesFormProps {
  pages: PagesFormValues;
  onCancel: () => void;
  onSaved?: () => void | Promise<void>;
}

/** Move / remove controls shared by every editable list group. */
function GroupControls({
  index,
  total,
  label,
  onMove,
  onRemove,
}: {
  index: number;
  total: number;
  label: string;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={index === 0}
        onClick={() => onMove(-1)}
      >
        <ArrowUp aria-hidden="true" />
        <span className="sr-only">
          Move {label} {index + 1} up
        </span>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={index === total - 1}
        onClick={() => onMove(1)}
      >
        <ArrowDown aria-hidden="true" />
        <span className="sr-only">
          Move {label} {index + 1} down
        </span>
      </Button>
      <ConfirmDialog
        title={`Remove this ${label.toLowerCase()}?`}
        description="It will be removed from the page when you save."
        confirmLabel="Remove"
        destructive
        onConfirm={onRemove}
      >
        <Button type="button" variant="ghost" size="icon">
          <Trash2 className="text-destructive" aria-hidden="true" />
          <span className="sr-only">
            Remove {label} {index + 1}
          </span>
        </Button>
      </ConfirmDialog>
    </div>
  );
}

function PagesFields() {
  const form = useFormContext<PagesFormValues>();

  const equipment = useFieldArray({ control: form.control, name: "about.equipmentRange" });
  const equipmentValues = form.watch("about.equipmentRange");

  const lineGroups = useFieldArray({ control: form.control, name: "about.productionLineGroups" });
  const lineGroupValues = form.watch("about.productionLineGroups");

  const about = form.watch("about");

  return (
    <div className="space-y-8">
      {/* ── Hero ── */}
      <section className="space-y-5" aria-labelledby="pages-hero-heading">
        <div>
          <h2 id="pages-hero-heading" className="text-base font-semibold">
            About page — hero
          </h2>
          <p className="text-sm text-muted-foreground">
            The banner a visitor sees first on <code>/about</code>.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <TextField
            control={form.control}
            name="about.heroTitle"
            label="Page title (H1)"
            required
          />
          <TextField
            control={form.control}
            name="about.heading"
            label='"Who we are" heading'
            required
          />
        </div>
        <TextareaField
          control={form.control}
          name="about.heroIntro"
          label="Hero introduction"
          rows={2}
          required
        />
        <ImageUpload
          label="Page photo"
          value={about.image ?? ""}
          onChange={(image) => form.setValue("about.image", image, { shouldDirty: true })}
          description="Leave empty to keep the built-in factory photo."
        />
      </section>

      {/* ── Who we are ── */}
      <section className="space-y-5 border-t pt-8" aria-labelledby="pages-about-heading">
        <div>
          <h2 id="pages-about-heading" className="text-base font-semibold">
            About page — who we are
          </h2>
          <p className="text-sm text-muted-foreground">
            The written introduction and the bullet points beside the photo.
          </p>
        </div>
        <TextareaField
          control={form.control}
          name="about.lead"
          label="Stand-first"
          rows={2}
          required
        />
        <DynamicList
          label="Paragraphs"
          description="One paragraph per row. Blank rows are dropped when you save."
          items={about.paragraphs ?? []}
          onChange={(paragraphs) =>
            form.setValue("about.paragraphs", paragraphs, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
          itemLabel="Paragraph"
          addLabel="Add paragraph"
          multiline
        />
        <DynamicList
          label="Key points"
          description="Short capability statements shown as a ticked list."
          items={about.points ?? []}
          onChange={(points) =>
            form.setValue("about.points", points, { shouldDirty: true, shouldValidate: true })
          }
          itemLabel="Point"
          addLabel="Add point"
        />
      </section>

      {/* ── Equipment range ── */}
      <section className="space-y-5 border-t pt-8" aria-labelledby="pages-equipment-heading">
        <div>
          <h2 id="pages-equipment-heading" className="text-base font-semibold">
            Equipment &amp; product range
          </h2>
          <p className="text-sm text-muted-foreground">
            The machine groups shown on <code>/about</code>. Blank rows are dropped when you save.
          </p>
        </div>

        {equipment.fields.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
            No equipment groups yet. Add the first group below.
          </div>
        ) : (
          equipment.fields.map((field, index) => (
            <section key={field.id} className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">Group {index + 1}</h3>
                <GroupControls
                  index={index}
                  total={equipment.fields.length}
                  label="Group"
                  onMove={(direction) => equipment.move(index, index + direction)}
                  onRemove={() => equipment.remove(index)}
                />
              </div>
              <TextField
                control={form.control}
                name={`about.equipmentRange.${index}.title`}
                label="Group title"
                required
              />
              <DynamicList
                label="Items"
                items={equipmentValues[index]?.items ?? []}
                onChange={(items) =>
                  form.setValue(`about.equipmentRange.${index}.items`, items, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                itemLabel="Item"
                addLabel="Add item"
              />
            </section>
          ))
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => equipment.append({ title: "", items: [] })}
        >
          <Plus aria-hidden="true" />
          Add equipment group
        </Button>
      </section>

      {/* ── Production lines ── */}
      <section className="space-y-5 border-t pt-8" aria-labelledby="pages-lines-heading">
        <div>
          <h2 id="pages-lines-heading" className="text-base font-semibold">
            Complete production line solutions
          </h2>
          <p className="text-sm text-muted-foreground">
            The line solutions listed on <code>/about</code>, each with its own description.
          </p>
        </div>

        {lineGroups.fields.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
            No production line solutions yet. Add the first one below.
          </div>
        ) : (
          lineGroups.fields.map((field, index) => (
            <section key={field.id} className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">Solution {index + 1}</h3>
                <GroupControls
                  index={index}
                  total={lineGroups.fields.length}
                  label="Solution"
                  onMove={(direction) => lineGroups.move(index, index + direction)}
                  onRemove={() => lineGroups.remove(index)}
                />
              </div>
              <TextField
                control={form.control}
                name={`about.productionLineGroups.${index}.title`}
                label="Solution title"
                required
              />
              <TextareaField
                control={form.control}
                name={`about.productionLineGroups.${index}.copy`}
                label="Description"
                rows={3}
              />
              <DynamicList
                label="Points"
                items={lineGroupValues[index]?.items ?? []}
                onChange={(items) =>
                  form.setValue(`about.productionLineGroups.${index}.items`, items, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                itemLabel="Point"
                addLabel="Add point"
              />
            </section>
          ))
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => lineGroups.append({ title: "", copy: "", items: [] })}
        >
          <Plus aria-hidden="true" />
          Add production line solution
        </Button>
      </section>

      {/* ── Support & closing ── */}
      <section className="space-y-5 border-t pt-8" aria-labelledby="pages-support-heading">
        <div>
          <h2 id="pages-support-heading" className="text-base font-semibold">
            Support &amp; service
          </h2>
          <p className="text-sm text-muted-foreground">
            After-handover support list and the closing invitation.
          </p>
        </div>
        <DynamicList
          label="Support lines"
          items={about.supportLines ?? []}
          onChange={(supportLines) =>
            form.setValue("about.supportLines", supportLines, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
          itemLabel="Support line"
          addLabel="Add support line"
        />
        <TextareaField
          control={form.control}
          name="about.closingBrief"
          label="Closing brief"
          rows={4}
          required
        />
      </section>

      {/* ── Contact checklist ── */}
      <section className="space-y-5 border-t pt-8" aria-labelledby="pages-checklist-heading">
        <div>
          <h2 id="pages-checklist-heading" className="text-base font-semibold">
            Contact page — what to send us
          </h2>
          <p className="text-sm text-muted-foreground">
            The checklist on <code>/contact</code> that tells visitors what to include in an
            enquiry.
          </p>
        </div>
        <DynamicList
          label="Checklist"
          description="One requirement per line. Blank rows are dropped when you save."
          items={form.watch("contactChecklist") ?? []}
          onChange={(contactChecklist) =>
            form.setValue("contactChecklist", contactChecklist, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
          itemLabel="Checklist line"
          addLabel="Add checklist line"
          multiline
        />
      </section>
    </div>
  );
}

export function PagesForm({ pages, onCancel, onSaved }: PagesFormProps) {
  async function handleSubmit(values: PagesFormValues) {
    try {
      const result = await updatePagesFn({ data: values });
      assertMutationSucceeded(result);
      toast.success("Page content saved.");
      await onSaved?.();
    } catch (error) {
      if (error instanceof AdminFieldError) {
        throw error;
      }
      toast.error("Page content could not be saved.");
      throw new Error("Page content could not be saved. Please try again.");
    }
  }

  return (
    <ContentForm
      schema={PagesSchema}
      defaultValues={pages}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      title="Page content"
      description="Every change below appears on the public site the next time it is loaded."
      submitLabel="Save page content"
    >
      <PagesFields />
    </ContentForm>
  );
}
