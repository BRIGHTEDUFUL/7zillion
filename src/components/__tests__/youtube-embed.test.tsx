import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { YouTubeEmbed } from "../youtube-embed";

function render(videoUrl?: string, title = "Line tour") {
  return renderToStaticMarkup(<YouTubeEmbed videoUrl={videoUrl} title={title} />);
}

describe("YouTubeEmbed facade", () => {
  it("shows a play facade with the video thumbnail", () => {
    const html = render("https://youtu.be/dQw4w9WgXcQ");
    expect(html).toContain("video-facade");
    expect(html).toContain("https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
    expect(html).toContain("Play video: Line tour");
  });

  it("does not load the YouTube player until the visitor asks for it", () => {
    expect(render("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).not.toContain("<iframe");
  });

  it("renders a Shorts link like any other video", () => {
    const html = render("https://youtube.com/shorts/7-6u5twSCsE", "Shorts tour");
    expect(html).toContain("video-facade");
    expect(html).toContain("https://i.ytimg.com/vi/7-6u5twSCsE/hqdefault.jpg");
    expect(html).toContain("Play video: Shorts tour");
  });

  it("renders nothing for a missing or non-YouTube link", () => {
    expect(render(undefined)).toBe("");
    expect(render("")).toBe("");
    expect(render("   ")).toBe("");
    expect(render("https://example.com/watch?v=1")).toBe("");
    expect(render("https://example.com/embed/1")).toBe("");
  });
});
