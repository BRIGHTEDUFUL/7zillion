import { describe, expect, it } from "vitest";

import { extractVideoId, toAspect, toEmbedUrl, toThumbnailUrl } from "../youtube";

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

  it("accepts YouTube Shorts URLs, with or without share params", () => {
    expect(extractVideoId("https://youtube.com/shorts/7-6u5twSCsE")).toBe("7-6u5twSCsE");
    expect(extractVideoId("https://www.youtube.com/shorts/tLB3E8gM9UE?feature=share")).toBe(
      "tLB3E8gM9UE",
    );
    expect(toEmbedUrl("https://youtube.com/shorts/7-6u5twSCsE")).toBe(
      "https://www.youtube.com/embed/7-6u5twSCsE",
    );
  });

  it("accepts live URLs and the no-cookie embed host", () => {
    expect(extractVideoId("https://www.youtube.com/live/abc123XYZ_-")).toBe("abc123XYZ_-");
    expect(extractVideoId("https://www.youtube-nocookie.com/embed/abc123XYZ_-")).toBe(
      "abc123XYZ_-",
    );
  });

  it("tolerates a scheme-less paste", () => {
    expect(extractVideoId("youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("rejects a missing or malformed URL instead of throwing", () => {
    expect(toEmbedUrl("")).toBeNull();
    expect(toEmbedUrl("not a url")).toBeNull();
    expect(toEmbedUrl("https://example.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(toEmbedUrl("https://example.com/embed/dQw4w9WgXcQ")).toBeNull();
    expect(toEmbedUrl("https://www.youtube.com/playlist?list=PL123")).toBeNull();
    expect(toEmbedUrl("https://www.youtube.com/embed/")).toBeNull();
  });

  it("builds the thumbnail URL from the video id", () => {
    expect(toThumbnailUrl("dQw4w9WgXcQ")).toBe("https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
  });

  it("reads a Shorts link as portrait and everything else as landscape", () => {
    expect(toAspect("https://youtube.com/shorts/5-IZKg-pwhI")).toBe("9:16");
    expect(toAspect("https://www.youtube.com/shorts/tLB3E8gM9UE?feature=share")).toBe("9:16");
    expect(toAspect("youtube.com/shorts/yn7jPRJYsDc")).toBe("9:16");

    expect(toAspect("https://youtu.be/Xk9wj7b8wLo")).toBe("16:9");
    expect(toAspect("https://www.youtube.com/watch?v=ROPTFb7w51M")).toBe("16:9");
    expect(toAspect("https://www.youtube.com/embed/ROPTFb7w51M")).toBe("16:9");
    expect(toAspect("https://www.youtube.com/live/ROPTFb7w51M")).toBe("16:9");
  });

  it("never guesses portrait from a non-YouTube host or an unusable link", () => {
    expect(toAspect("https://example.com/shorts/abc")).toBe("16:9");
    expect(toAspect("youtu.be/shorts/abc")).toBe("16:9");
    expect(toAspect("")).toBe("16:9");
    expect(toAspect("not a url")).toBe("16:9");
  });

  it("asks for the video's own thumbnail shape only for a portrait video", () => {
    expect(toThumbnailUrl("5-IZKg-pwhI", "9:16")).toBe(
      "https://i.ytimg.com/vi/5-IZKg-pwhI/oardefault.jpg",
    );
    expect(toThumbnailUrl("Xk9wj7b8wLo", "16:9")).toBe(
      "https://i.ytimg.com/vi/Xk9wj7b8wLo/hqdefault.jpg",
    );
  });
});
