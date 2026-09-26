import { createFileRoute, useRouter } from "@tanstack/react-router";

import { listVideosFn } from "@/api/videos";
import { PageHeader } from "@/components/admin/page-header";
import { VideosForm } from "@/components/admin/videos-form";

export const Route = createFileRoute("/admin/_authenticated/videos/")({
  loader: () => listVideosFn(),
  component: VideosPage,
});

function VideosPage() {
  const videos = Route.useLoaderData();
  const router = useRouter();

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Gallery"
        title="Videos"
        description="The project and setup footage shown to visitors on the homepage and at /videos."
      />
      <VideosForm
        videos={videos}
        onCancel={() => router.invalidate()}
        onSaved={() => router.invalidate()}
      />
    </div>
  );
}
