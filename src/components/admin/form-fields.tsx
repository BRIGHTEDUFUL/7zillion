import type { Control, FieldPath, FieldValues } from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface BaseFieldProps<TValues extends FieldValues> {
  control: Control<TValues>;
  name: FieldPath<TValues>;
  label: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
}

interface TextFieldProps<TValues extends FieldValues> extends BaseFieldProps<TValues> {
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
  autoComplete?: string;
  readOnly?: boolean;
  min?: number;
  max?: number;
  step?: number | "any";
  className?: string;
}

export function TextField<TValues extends FieldValues>({
  control,
  name,
  label,
  description,
  required = false,
  disabled = false,
  type = "text",
  placeholder,
  autoComplete,
  readOnly = false,
  min,
  max,
  step,
  className,
}: TextFieldProps<TValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required ? (
              <span className="ml-1 text-destructive" aria-hidden="true">
                *
              </span>
            ) : null}
          </FormLabel>
          <FormControl>
            <Input
              type={type}
              value={
                typeof field.value === "string" || typeof field.value === "number"
                  ? field.value
                  : ""
              }
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
              placeholder={placeholder}
              autoComplete={autoComplete}
              required={required}
              readOnly={readOnly}
              disabled={disabled}
              min={min}
              max={max}
              step={step}
              className={className}
            />
          </FormControl>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

interface TextareaFieldProps<TValues extends FieldValues> extends BaseFieldProps<TValues> {
  placeholder?: string;
  rows?: number;
  className?: string;
}

export function TextareaField<TValues extends FieldValues>({
  control,
  name,
  label,
  description,
  required = false,
  disabled = false,
  placeholder,
  rows = 5,
  className,
}: TextareaFieldProps<TValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required ? (
              <span className="ml-1 text-destructive" aria-hidden="true">
                *
              </span>
            ) : null}
          </FormLabel>
          <FormControl>
            <Textarea
              value={typeof field.value === "string" ? field.value : ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
              placeholder={placeholder}
              required={required}
              disabled={disabled}
              rows={rows}
              className={className}
            />
          </FormControl>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
