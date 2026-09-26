import { useFieldArray, useFormContext } from "react-hook-form";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { updateVideosFn } from "@/api/videos";
import { VideoSchema } from "@/lib/schemas";
import type { Video } from "@/types/content";
import { assertMutationSucceeded, AdminFieldError } from "@/components/admin/api-results";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { ContentForm } from "@/components/admin/content-form";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const VideosFormSchema = z.object({ videos: z.array(VideoSchema) });
type VideosFormValues = z.infer<typeof VideosFormSchema>;

interface VideosFormProps {
  videos: Video[];
  onCancel: () => void;
  onSaved?: () => void | Promise<void>;
}

function VideoFields() {
  const form = useFormContext<VideosFormValues>();
  const videos = useFieldArray({ control: form.control, name: "videos" });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold">Gallery items</h2>
        <p className="text-sm text-muted-foreground">
          The list is saved in this order and shown in this order on the homepage and on /videos.
          Watch links and short links (youtu.be/…, youtube.com/shorts/…) are both accepted — a
          shorts link opens in a vertical player.
        </p>
      </div>

      {videos.fields.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
          No videos yet. Add the first video below — until you save one, the site shows its built-in
          list.
        </div>
      ) : (
        <div className="space-y-4">
          {videos.fields.map((field, index) => (
            <section
              key={field.id}
              className="space-y-4 rounded-lg border bg-muted/15 p-5"
              aria-labelledby={`video-${field.id}-heading`}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 id={`video-${field.id}-heading`} className="text-sm font-semibold">
                  Video {index + 1}
                </h3>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={index === 0}
                    onClick={() => videos.move(index, index - 1)}
                  >
                    <ArrowUp aria-hidden="true" />
                    <span className="sr-only">Move video {index + 1} up</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={index === videos.fields.length - 1}
                    onClick={() => videos.move(index, index + 1)}
                  >
                    <ArrowDown aria-hidden="true" />
                    <span className="sr-only">Move video {index + 1} down</span>
                  </Button>
                  <ConfirmDialog
                    title="Remove this video?"
                    description="It will be removed from the gallery when you save."
                    confirmLabel="Remove video"
                    destructive
                    onConfirm={() => videos.remove(index)}
                  >
                    <Button type="button" variant="ghost" size="icon">
                      <Trash2 className="text-destructive" aria-hidden="true" />
                      <span className="sr-only">Remove video {index + 1}</span>
                    </Button>
                  </ConfirmDialog>
                </div>
              </div>

              <FormField
                control={form.control}
                name={`videos.${index}.title`}
                render={({ field: input }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Line setup — filling section running" {...input} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`videos.${index}.caption`}
                render={({ field: input }) => (
                  <FormItem>
                    <FormLabel>Caption</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        placeholder="One line describing what the visitor is about to see."
                        {...input}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`videos.${index}.tag`}
                  render={({ field: input }) => (
                    <FormItem>
                      <FormLabel>Tag</FormLabel>
                      <FormControl>
                        <Input placeholder="Project or Setup" {...input} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`videos.${index}.videoUrl`}
                  render={({ field: input }) => (
                    <FormItem>
                      <FormLabel>YouTube link</FormLabel>
                      <FormControl>
                        <Input placeholder="https://www.youtube.com/watch?v=…" {...input} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => videos.append({ title: "", caption: "", tag: "", videoUrl: "" })}
      >
        <Plus aria-hidden="true" />
        Add video
      </Button>
    </div>
  );
}

export function VideosForm({ videos, onCancel, onSaved }: VideosFormProps) {
  async function handleSubmit(values: VideosFormValues) {
    try {
      const result = await updateVideosFn({ data: values.videos });
      assertMutationSucceeded(result);
      toast.success("Videos saved.");
      await onSaved?.();
    } catch (error) {
      if (error instanceof AdminFieldError) {
        throw error;
      }
      toast.error("Videos could not be saved.");
      throw new Error("Videos could not be saved. Please try again.");
    }
  }

  return (
    <ContentForm
      schema={VideosFormSchema}
      defaultValues={{ videos }}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      title="Videos"
      description="Edit the gallery shown on the homepage and at /videos. Nothing is loaded from YouTube until a visitor presses play."
      submitLabel="Save videos"
    >
      <VideoFields />
    </ContentForm>
  );
}
