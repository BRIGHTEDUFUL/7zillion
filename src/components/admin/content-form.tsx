import type { ReactNode } from "react";
import {
  useForm,
  type DefaultValues,
  type FieldPath,
  type FieldValues,
  type Resolver,
  type SubmitHandler,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { AdminFieldError } from "@/components/admin/api-results";

interface ContentFormProps<TValues extends FieldValues> {
  schema: z.ZodType<TValues, z.ZodTypeDef, TValues>;
  defaultValues: DefaultValues<TValues>;
  onSubmit: (values: TValues) => void | Promise<void>;
  title: string;
  description?: string;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  deleteAction?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ContentForm<TValues extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  title,
  description,
  submitLabel = "Save changes",
  cancelLabel = "Cancel",
  onCancel,
  deleteAction,
  children,
  className,
}: ContentFormProps<TValues>) {
  const form = useForm<TValues>({
    defaultValues,
    resolver: zodResolver(schema) as Resolver<TValues>,
    mode: "onSubmit",
  });
  const isSubmitting = form.formState.isSubmitting;
  const formError = form.formState.errors.root?.["server"];

  const submitContent: SubmitHandler<TValues> = async (values) => {
    form.clearErrors("root.server");

    try {
      await onSubmit(values);
    } catch (error) {
      if (error instanceof AdminFieldError) {
        form.setError(error.field as FieldPath<TValues>, {
          type: "server",
          message: error.message,
        });
        return;
      }

      form.setError("root.server", {
        type: "server",
        message:
          error instanceof Error && error.message.trim()
            ? error.message
            : "The item could not be saved. Please try again.",
      });
    }
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="border-b bg-muted/25">
        <CardTitle className="text-xl">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submitContent)} noValidate className="space-y-8">
            {children}

            {formError?.message ? (
              <FormMessage role="alert">{String(formError.message)}</FormMessage>
            ) : null}

            <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div>{deleteAction}</div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                {onCancel ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                  >
                    {cancelLabel}
                  </Button>
                ) : null}
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <LoaderCircle className="animate-spin" aria-hidden="true" />
                  ) : null}
                  {isSubmitting ? "Saving…" : submitLabel}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
