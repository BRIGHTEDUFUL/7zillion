import { useFormContext } from "react-hook-form";
import { toast } from "sonner";

import { updateCompanyFn } from "@/api/company";
import { CompanySchema } from "@/lib/schemas";
import type { Company } from "@/types/content";
import { assertMutationSucceeded, AdminFieldError } from "@/components/admin/api-results";
import { ContentForm } from "@/components/admin/content-form";
import { DynamicList } from "@/components/admin/dynamic-list";
import { TextField, TextareaField } from "@/components/admin/form-fields";

interface CompanyFormProps {
  company: Company;
  onCancel: () => void;
  onSaved?: () => void | Promise<void>;
}

function CompanyFields() {
  const form = useFormContext<Company>();

  return (
    <div className="space-y-8">
      <section className="space-y-5" aria-labelledby="company-brand-heading">
        <div>
          <h2 id="company-brand-heading" className="text-base font-semibold">
            Brand and positioning
          </h2>
          <p className="text-sm text-muted-foreground">Core copy shown across the website.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <TextField control={form.control} name="name" label="Company name" required />
          <TextField control={form.control} name="founded" label="Founded / experience" />
          <TextField control={form.control} name="tagline" label="Tagline" />
          <TextField control={form.control} name="slogan" label="Slogan" />
        </div>
        <TextareaField control={form.control} name="promise" label="Customer promise" rows={3} />
      </section>

      <section className="space-y-5 border-t pt-8" aria-labelledby="company-contact-heading">
        <div>
          <h2 id="company-contact-heading" className="text-base font-semibold">
            Contact information
          </h2>
          <p className="text-sm text-muted-foreground">
            Used by contact details, enquiry actions, and metadata.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <TextField
            control={form.control}
            name="email"
            label="Email address"
            type="email"
            required
            autoComplete="email"
          />
          <TextField
            control={form.control}
            name="whatsappHref"
            label="WhatsApp link"
            type="url"
            required
            placeholder="https://wa.me/…"
          />
          <TextField
            control={form.control}
            name="whatsapp"
            label="WhatsApp number"
            placeholder="+233…"
          />
          <TextField
            control={form.control}
            name="site"
            label="Website"
            required
            placeholder="www.sevenzillions.com"
          />
          <TextField control={form.control} name="city" label="City" />
        </div>
        <TextareaField control={form.control} name="address" label="Address" rows={3} />
        <TextareaField
          control={form.control}
          name="whatsappMessage"
          label="WhatsApp opener"
          rows={2}
          description="Pre-filled into every WhatsApp link when the visitor opens the chat."
        />
        <DynamicList
          label="Phone numbers"
          description="Use the move buttons to set the display order."
          items={form.getValues("phones")}
          onChange={(phones) =>
            form.setValue("phones", phones, { shouldDirty: true, shouldValidate: true })
          }
          itemLabel="Phone number"
          addLabel="Add phone number"
          placeholder="+233…"
        />
      </section>
    </div>
  );
}

export function CompanyForm({ company, onCancel, onSaved }: CompanyFormProps) {
  async function handleSubmit(values: Company) {
    try {
      const result = await updateCompanyFn({ data: values });
      assertMutationSucceeded(result);
      toast.success("Company information saved.");
      await onSaved?.();
    } catch (error) {
      if (error instanceof AdminFieldError) {
        throw error;
      }
      toast.error("Company information could not be saved.");
      throw new Error("Company information could not be saved. Please try again.");
    }
  }

  return (
    <ContentForm
      schema={CompanySchema}
      defaultValues={company}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      title="Company information"
      description="Update the shared business details used throughout the public website."
      submitLabel="Save company information"
    >
      <CompanyFields />
    </ContentForm>
  );
}
