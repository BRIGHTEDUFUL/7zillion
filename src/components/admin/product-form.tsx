import { useFormContext } from "react-hook-form";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteProductFn, upsertProductFn } from "@/api/products";
import { ProductSchema } from "@/lib/schemas";
import type { Product } from "@/types/content";
import { assertMutationSucceeded, AdminFieldError } from "@/components/admin/api-results";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { ContentForm } from "@/components/admin/content-form";
import { DynamicList } from "@/components/admin/dynamic-list";
import { TextField, TextareaField } from "@/components/admin/form-fields";
import { ImageUpload } from "@/components/admin/image-upload";
import { SpecEntryList } from "@/components/admin/spec-entry-list";
import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const emptyProduct: Product = {
  slug: "",
  name: "",
  category: "",
  image: "",
  summary: "",
  detail: "",
  detail2: "",
  highlights: [],
  specs: [],
  whatsappMessage: "",
  videoUrl: "",
};

interface ProductFormProps {
  product?: Product;
  onCancel: () => void;
  onSaved?: () => void | Promise<void>;
  onDeleted?: () => void | Promise<void>;
}

function ProductFields() {
  const form = useFormContext<Product>();

  return (
    <div className="space-y-8">
      <section className="space-y-5" aria-labelledby="product-basics-heading">
        <div>
          <h2 id="product-basics-heading" className="text-base font-semibold">
            Product details
          </h2>
          <p className="text-sm text-muted-foreground">Identity and catalogue information.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <TextField control={form.control} name="name" label="Name" required />
          <TextField control={form.control} name="category" label="Category" required />
          <TextField
            control={form.control}
            name="slug"
            label="Slug"
            required
            description="Lowercase letters, numbers, and hyphens only."
            placeholder="filling-machines"
          />
          <TextField
            control={form.control}
            name="whatsappMessage"
            label="WhatsApp enquiry message"
            description="Optional pre-filled message for this product."
          />
        </div>
        <TextareaField control={form.control} name="summary" label="Summary" required rows={4} />
      </section>

      <section className="space-y-5 border-t pt-8" aria-labelledby="product-copy-heading">
        <div>
          <h2 id="product-copy-heading" className="text-base font-semibold">
            Long-form copy
          </h2>
          <p className="text-sm text-muted-foreground">Displayed on the public product page.</p>
        </div>
        <TextareaField control={form.control} name="detail" label="Primary description" rows={9} />
        <TextareaField
          control={form.control}
          name="detail2"
          label="Secondary description"
          rows={9}
        />
      </section>

      <section className="space-y-5 border-t pt-8" aria-labelledby="product-lists-heading">
        <div>
          <h2 id="product-lists-heading" className="text-base font-semibold">
            Highlights and specifications
          </h2>
          <p className="text-sm text-muted-foreground">Items are saved in the order shown.</p>
        </div>
        <FormField
          control={form.control}
          name="highlights"
          render={({ field }) => (
            <DynamicList
              label="Highlights"
              items={field.value}
              onChange={field.onChange}
              itemLabel="Highlight"
              addLabel="Add highlight"
              placeholder="Describe a key product benefit"
            />
          )}
        />
        <FormField
          control={form.control}
          name="specs"
          render={({ field }) => (
            <SpecEntryList label="Specifications" items={field.value} onChange={field.onChange} />
          )}
        />
      </section>

      <section className="space-y-5 border-t pt-8" aria-labelledby="product-image-heading">
        <div>
          <h2 id="product-image-heading" className="text-base font-semibold">
            Product image
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

      <section className="space-y-5 border-t pt-8" aria-labelledby="product-video-heading">
        <div>
          <h2 id="product-video-heading" className="text-base font-semibold">
            Product video
          </h2>
          <p className="text-sm text-muted-foreground">
            Optional YouTube link shown below the highlights on the public page.
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

export function ProductForm({ product, onCancel, onSaved, onDeleted }: ProductFormProps) {
  async function handleSubmit(values: Product) {
    try {
      const result = await upsertProductFn({ data: values });
      assertMutationSucceeded(result, { duplicateField: "slug" });
      toast.success(product ? "Product updated." : "Product created.");
      await onSaved?.();
    } catch (error) {
      if (error instanceof AdminFieldError) {
        throw error;
      }
      toast.error("The product could not be saved.");
      throw new Error("The product could not be saved. Please try again.");
    }
  }

  async function handleDelete() {
    if (!product) {
      return;
    }

    try {
      const result = await deleteProductFn({ data: { slug: product.slug } });
      assertMutationSucceeded(result);
      toast.success("Product deleted.");
      await onDeleted?.();
    } catch (error) {
      toast.error("The product could not be deleted.");
      throw new Error("The product could not be deleted. Please try again.");
    }
  }

  return (
    <ContentForm
      schema={ProductSchema}
      defaultValues={product ?? emptyProduct}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      title={product ? "Edit product" : "Add product"}
      description="All fields are saved to the live content store when you submit."
      submitLabel={product ? "Save product" : "Create product"}
      deleteAction={
        product ? (
          <ConfirmDialog
            title="Delete this product?"
            description={`“${product.name}” will be removed from the public catalogue.`}
            confirmLabel="Delete product"
            destructive
            onConfirm={handleDelete}
          >
            <Button type="button" variant="destructive">
              <Trash2 aria-hidden="true" />
              Delete product
            </Button>
          </ConfirmDialog>
        ) : undefined
      }
    >
      <ProductFields />
    </ContentForm>
  );
}
