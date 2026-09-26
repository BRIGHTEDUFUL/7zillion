import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { VideoGallery } from "../video-gallery";
import { defaultVideos } from "@/data/site";

/**
 * Server markup is HTML-escaped (a caption's apostrophe lands as &#x27;), so
 * expectations have to be escaped the same way before they can be matched.
 */
function esc(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#x27;");
}

function render(videos = defaultVideos, limit?: number) {
  return renderToStaticMarkup(<VideoGallery videos={videos} limit={limit} />);
}

describe("VideoGallery facade", () => {
  it("renders one tile per video, titled and labelled for screen readers", () => {
    const html = render();

    expect(html).toContain("video-grid");
    expect(html.match(/class="video-tile"/g)).toHaveLength(defaultVideos.length);

    for (const video of defaultVideos) {
      expect(html).toContain(esc(`Play video: ${video.title}`));
      expect(html).toContain(esc(video.title));
      if (video.tag) expect(html).toContain(esc(video.tag));
      if (video.caption) expect(html).toContain(esc(video.caption));
    }
  });

  it("loads no YouTube player until a visitor presses play", () => {
    const html = render();

    expect(html).not.toContain("<iframe");
    expect(html).not.toContain("youtube.com/embed");
    // Only the thumbnails cross the wire on first paint.
    expect(html).toContain("https://i.ytimg.com/vi/");
  });

  it("gives a portrait video its own thumbnail instead of the pillarboxed one", () => {
    const html = render();

    expect(html).toContain("https://i.ytimg.com/vi/5-IZKg-pwhI/oardefault.jpg");
    expect(html).toContain("https://i.ytimg.com/vi/yn7jPRJYsDc/oardefault.jpg");
    expect(html).toContain("https://i.ytimg.com/vi/Xk9wj7b8wLo/hqdefault.jpg");
    expect(html).toContain("https://i.ytimg.com/vi/ROPTFb7w51M/hqdefault.jpg");
  });

  it("honours the homepage limit", () => {
    const html = render(defaultVideos, 2);

    expect(html.match(/class="video-tile"/g)).toHaveLength(2);
    expect(html).toContain(esc(`Play video: ${defaultVideos[0]!.title}`));
    expect(html).not.toContain(esc(`Play video: ${defaultVideos[3]!.title}`));
  });

  it("renders nothing when the gallery has been emptied", () => {
    expect(render([])).toBe("");
    expect(render([], 4)).toBe("");
  });
});
