import { useFieldArray, useFormContext } from "react-hook-form";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { updateServicesFn } from "@/api/services";
import { ServiceSchema } from "@/lib/schemas";
import type { Service } from "@/types/content";
import { assertMutationSucceeded, AdminFieldError } from "@/components/admin/api-results";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { ContentForm } from "@/components/admin/content-form";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const ServicesFormSchema = z.object({ services: z.array(ServiceSchema) });
type ServicesFormValues = z.infer<typeof ServicesFormSchema>;

interface ServicesFormProps {
  services: Service[];
  onCancel: () => void;
  onSaved?: () => void | Promise<void>;
}

function ServiceFields() {
  const form = useFormContext<ServicesFormValues>();
  const services = useFieldArray({ control: form.control, name: "services" });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold">Service items</h2>
        <p className="text-sm text-muted-foreground">
          Changes are saved as one ordered list. Use the move buttons to reorder services.
        </p>
      </div>

      {services.fields.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
          No services yet. Add the first service below.
        </div>
      ) : (
        <div className="space-y-4">
          {services.fields.map((field, index) => (
            <section
              key={field.id}
              className="space-y-4 rounded-lg border bg-muted/15 p-5"
              aria-labelledby={`service-${field.id}-heading`}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 id={`service-${field.id}-heading`} className="text-sm font-semibold">
                  Service {index + 1}
                </h3>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={index === 0}
                    onClick={() => services.move(index, index - 1)}
                  >
                    <ArrowUp aria-hidden="true" />
                    <span className="sr-only">Move service {index + 1} up</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={index === services.fields.length - 1}
                    onClick={() => services.move(index, index + 1)}
                  >
                    <ArrowDown aria-hidden="true" />
                    <span className="sr-only">Move service {index + 1} down</span>
                  </Button>
                  <ConfirmDialog
                    title="Remove this service?"
                    description="It will be removed from the complete list when you save."
                    confirmLabel="Remove service"
                    destructive
                    onConfirm={() => services.remove(index)}
                  >
                    <Button type="button" variant="ghost" size="icon">
                      <Trash2 className="text-destructive" aria-hidden="true" />
                      <span className="sr-only">Remove service {index + 1}</span>
                    </Button>
                  </ConfirmDialog>
                </div>
              </div>

              <FormField
                control={form.control}
                name={`services.${index}.title`}
                render={({ field: input }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...input} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`services.${index}.copy`}
                render={({ field: input }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...input} rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => services.append({ title: "", copy: "" })}
      >
        <Plus aria-hidden="true" />
        Add service
      </Button>
    </div>
  );
}

export function ServicesForm({ services, onCancel, onSaved }: ServicesFormProps) {
  async function handleSubmit(values: ServicesFormValues) {
    try {
      const result = await updateServicesFn({ data: values.services });
      assertMutationSucceeded(result);
      toast.success("Services saved.");
      await onSaved?.();
    } catch (error) {
      if (error instanceof AdminFieldError) {
        throw error;
      }
      toast.error("Services could not be saved.");
      throw new Error("Services could not be saved. Please try again.");
    }
  }

  return (
    <ContentForm
      schema={ServicesFormSchema}
      defaultValues={{ services }}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      title="Services"
      description="Edit the complete ordered list of services shown on the public website."
      submitLabel="Save services"
    >
      <ServiceFields />
    </ContentForm>
  );
}
