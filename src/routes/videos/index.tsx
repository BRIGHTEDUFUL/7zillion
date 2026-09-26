import { createFileRoute } from "@tanstack/react-router";

import { listVideosFn } from "@/api/videos";
import { recordActivityFn } from "@/api/activity";
import { InnerPage } from "@/components/inner-page";
import { SectionHeading } from "@/components/section-heading";
import { VideoGallery } from "@/components/video-gallery";

export const Route = createFileRoute("/videos/")({
  loader: async () => {
    const videos = await listVideosFn();
    void recordActivityFn({
      data: { eventType: "page_view", path: "/videos", timestamp: new Date().toISOString() },
    });
    return videos;
  },
  head: () => ({
    meta: [
      { title: "Videos | Seven Zillions — Projects & Setups in Motion" },
      {
        name: "description",
        content:
          "Watch Seven Zillions production lines, installations and equipment running — project and setup footage from sites we have delivered.",
      },
      { property: "og:type", content: "video.other" },
    ],
    links: [{ rel: "canonical", href: "/videos" }],
  }),
  component: VideosPage,
});

function VideosPage() {
  const videos = Route.useLoaderData();

  return (
    <InnerPage
      eyebrow="Watch the work"
      title="Projects and setups in motion"
      intro="Drawings and spec sheets only go so far. These clips show the lines, the installations and the equipment doing what they were built to do."
      crumbs={[{ label: "Videos" }]}
    >
      <section className="section shell">
        {videos.length ? (
          <VideoGallery videos={videos} />
        ) : (
          <p className="wide-copy">
            No videos are published at the moment. Tell us what you are planning and we will send
            footage of the relevant line.
          </p>
        )}
      </section>

      <section className="section shell">
        <SectionHeading
          eyebrow="See the detail"
          title="Want the same line explained on a call?"
          action="Talk to an engineer"
          to="/contact"
        />
        <p className="wide-copy">
          Send your beverage, container format and target capacity. We will walk you through the
          process flow, point out which of these installations matches your requirement, and answer
          the questions the footage cannot — utilities, layout, changeover and acceptance.
        </p>
      </section>
    </InnerPage>
  );
}
