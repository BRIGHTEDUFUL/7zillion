import { useEffect, useId, useState, type ChangeEvent } from "react";
import { ImageUp, LoaderCircle } from "lucide-react";

import { getUploadUrlFn } from "@/api/upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

type AllowedImageType = (typeof ALLOWED_TYPES)[number];

interface ImageUploadProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string | undefined;
  error?: string | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
}

function isAllowedImageType(value: string): value is AllowedImageType {
  return ALLOWED_TYPES.some((type) => type === value);
}

export function ImageUpload({
  label,
  value,
  onChange,
  description,
  error,
  disabled = false,
  className,
}: ImageUploadProps) {
  const id = useId();
  const [preview, setPreview] = useState(value);
  const [objectUrl, setObjectUrl] = useState<string>();
  const [uploadError, setUploadError] = useState<string>();
  const [isUploading, setIsUploading] = useState(false);
  const inputId = `${id}-file`;
  const urlId = `${id}-url`;
  const errorId = `${id}-error`;
  const message = error ?? uploadError;

  useEffect(() => {
    setPreview(value);
  }, [value]);

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  function replaceObjectUrl(nextUrl: string) {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
    setObjectUrl(nextUrl);
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    setUploadError(undefined);

    if (!file) {
      return;
    }

    if (!isAllowedImageType(file.type)) {
      setUploadError("Choose a JPEG, PNG, or WebP image.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setUploadError("The image must be 5 MB or smaller.");
      return;
    }

    const localPreview = URL.createObjectURL(file);
    replaceObjectUrl(localPreview);
    setPreview(localPreview);
    setIsUploading(true);

    try {
      const { uploadUrl, publicUrl } = await getUploadUrlFn({
        data: { filename: file.name, contentType: file.type },
      });
      const response = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      onChange(publicUrl);
      setPreview(publicUrl);
    } catch {
      setUploadError("Image upload unavailable. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  function handleUrlChange(nextValue: string) {
    onChange(nextValue);
    setPreview(nextValue);
  }

  return (
    <div className={cn("space-y-3", className)}>
      <Label htmlFor={inputId}>{label}</Label>
      {description ? (
        <p className="text-xs leading-5 text-muted-foreground">{description}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-start">
        <div className="space-y-2">
          <Input
            id={inputId}
            type="file"
            accept={ALLOWED_TYPES.join(",")}
            disabled={disabled || isUploading}
            aria-invalid={Boolean(message)}
            aria-describedby={message ? errorId : undefined}
            onChange={(event) => void handleFileChange(event)}
          />
          <div className="space-y-2">
            <Label htmlFor={urlId} className="text-xs text-muted-foreground">
              Or use an existing image URL
            </Label>
            <Input
              id={urlId}
              type="url"
              value={value}
              disabled={disabled}
              placeholder="https://…"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
              onChange={(event) => handleUrlChange(event.target.value)}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border bg-muted/30">
          {preview ? (
            <img
              src={preview}
              alt="Selected content image preview"
              className="aspect-[4/3] h-full w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center text-muted-foreground">
              <ImageUp className="size-8" aria-hidden="true" />
              <span className="sr-only">No image selected</span>
            </div>
          )}
        </div>
      </div>

      {isUploading ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
          <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
          Uploading image…
        </p>
      ) : null}

      {message ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-destructive">
          {message}
        </p>
      ) : null}
    </div>
  );
}
