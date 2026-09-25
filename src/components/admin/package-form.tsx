import { useFormContext } from "react-hook-form";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deletePackageFn, upsertPackageFn } from "@/api/packages";
import { PackageSchema } from "@/lib/schemas";
import type { Package as PackageContent } from "@/types/content";
import { assertMutationSucceeded, AdminFieldError } from "@/components/admin/api-results";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { ContentForm } from "@/components/admin/content-form";
import { DynamicList } from "@/components/admin/dynamic-list";
import { TextField, TextareaField } from "@/components/admin/form-fields";
import { SpecEntryList } from "@/components/admin/spec-entry-list";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form";

const emptyPackage: PackageContent = {
  slug: "",
  name: "",
  summary: "",
  includes: [],
  specs: [],
};

interface PackageFormProps {
  packageItem?: PackageContent;
  onCancel: () => void;
  onSaved?: () => void | Promise<void>;
  onDeleted?: () => void | Promise<void>;
}

function PackageFields() {
  const form = useFormContext<PackageContent>();

  return (
    <div className="space-y-8">
      <section className="space-y-5" aria-labelledby="package-basics-heading">
        <div>
          <h2 id="package-basics-heading" className="text-base font-semibold">
            Package details
          </h2>
          <p className="text-sm text-muted-foreground">
            Core information shown on the package card.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <TextField control={form.control} name="name" label="Package name" required />
          <TextField
            control={form.control}
            name="slug"
            label="Slug"
            required
            placeholder="turnkey-water-line"
          />
        </div>
        <TextareaField control={form.control} name="summary" label="Summary" rows={5} />
      </section>

      <section className="space-y-5 border-t pt-8" aria-labelledby="package-includes-heading">
        <div>
          <h2 id="package-includes-heading" className="text-base font-semibold">
            Included scope
          </h2>
          <p className="text-sm text-muted-foreground">Items are displayed in this order.</p>
        </div>
        <FormField
          control={form.control}
          name="includes"
          render={({ field }) => (
            <DynamicList
              label="Included items"
              items={field.value}
              onChange={field.onChange}
              itemLabel="Included item"
              addLabel="Add included item"
              placeholder="Describe an included item or service"
            />
          )}
        />
      </section>

      <section className="space-y-5 border-t pt-8" aria-labelledby="package-specs-heading">
        <div>
          <h2 id="package-specs-heading" className="text-base font-semibold">
            Specifications
          </h2>
          <p className="text-sm text-muted-foreground">Label and value pairs for this package.</p>
        </div>
        <FormField
          control={form.control}
          name="specs"
          render={({ field }) => (
            <SpecEntryList label="Specifications" items={field.value} onChange={field.onChange} />
          )}
        />
      </section>
    </div>
  );
}

export function PackageForm({ packageItem, onCancel, onSaved, onDeleted }: PackageFormProps) {
  async function handleSubmit(values: PackageContent) {
    try {
      const result = await upsertPackageFn({ data: values });
      assertMutationSucceeded(result, { duplicateField: "slug" });
      toast.success(packageItem ? "Package updated." : "Package created.");
      await onSaved?.();
    } catch (error) {
      if (error instanceof AdminFieldError) {
        throw error;
      }
      toast.error("The package could not be saved.");
      throw new Error("The package could not be saved. Please try again.");
    }
  }

  async function handleDelete() {
    if (!packageItem) {
      return;
    }
    try {
      const result = await deletePackageFn({ data: { slug: packageItem.slug } });
      assertMutationSucceeded(result);
      toast.success("Package deleted.");
      await onDeleted?.();
    } catch {
      toast.error("The package could not be deleted.");
      throw new Error("The package could not be deleted. Please try again.");
    }
  }

  return (
    <ContentForm
      schema={PackageSchema}
      defaultValues={packageItem ?? emptyPackage}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      title={packageItem ? "Edit package" : "Add package"}
      description="Manage package details, included scope, and specifications."
      submitLabel={packageItem ? "Save package" : "Create package"}
      deleteAction={
        packageItem ? (
          <ConfirmDialog
            title="Delete this package?"
            description={`“${packageItem.name}” will be removed from the site.`}
            confirmLabel="Delete package"
            destructive
            onConfirm={handleDelete}
          >
            <Button type="button" variant="destructive">
              <Trash2 aria-hidden="true" />
              Delete package
            </Button>
          </ConfirmDialog>
        ) : undefined
      }
    >
      <PackageFields />
    </ContentForm>
  );
}
