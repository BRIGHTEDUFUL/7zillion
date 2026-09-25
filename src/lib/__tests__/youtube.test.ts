import { describe, expect, it } from "vitest";

import { extractVideoId, toEmbedUrl, toThumbnailUrl } from "../youtube";

describe("YouTube URL helpers", () => {
  it("accepts a standard watch URL", () => {
    expect(toEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    );
  });

  it("accepts a short youtu.be URL", () => {
    expect(toEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    );
  });

  it("accepts an URL that is already an embed link", () => {
    expect(toEmbedUrl("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    );
  });

  it("accepts mobile and music hosts with a watch path", () => {
    expect(extractVideoId("https://m.youtube.com/watch?v=abc123XYZ_-")).toBe("abc123XYZ_-");
    expect(extractVideoId("https://music.youtube.com/watch?v=abc123XYZ_&list=PL1")).toBe(
      "abc123XYZ_",
    );
  });

  it("rejects a missing or malformed URL instead of throwing", () => {
    expect(toEmbedUrl("")).toBeNull();
    expect(toEmbedUrl("not a url")).toBeNull();
    expect(toEmbedUrl("https://example.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(toEmbedUrl("https://www.youtube.com/playlist?list=PL123")).toBeNull();
    expect(toEmbedUrl("https://www.youtube.com/embed/")).toBeNull();
  });

  it("builds the thumbnail URL from the video id", () => {
    expect(toThumbnailUrl("dQw4w9WgXcQ")).toBe("https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
  });
});
