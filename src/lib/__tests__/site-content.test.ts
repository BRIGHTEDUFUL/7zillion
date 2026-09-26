/**
 * Guards for the pure helpers between the database record and the pages that
 * render it: an old or missing record must fall back instead of rendering
 * blanks, and blank rows from the list editors must never reach storage.
 */

import { describe, expect, it } from "vitest";

import { mergeCompany, mergePages, sanitizePages, sanitizeVideos } from "@/lib/site-content";
import { defaultPages, fallbackCompany } from "@/data/site";
import type { PagesContent } from "@/types/content";

function storedCompany() {
  return {
    ...fallbackCompany,
    phones: ["+233 500 000 000"],
    site: "example.test",
    address: "1 New Road",
  };
}

function storedPages(): PagesContent {
  return structuredClone(defaultPages);
}

describe("mergeCompany", () => {
  it("returns the built-in copy when nothing has been stored", () => {
    expect(mergeCompany(null, fallbackCompany)).toEqual(fallbackCompany);
    expect(mergeCompany(undefined, fallbackCompany)).toEqual(fallbackCompany);
  });

  it("keeps stored values and fills the rest from the defaults", () => {
    const merged = mergeCompany(
      { ...storedCompany(), email: "sales@example.test" },
      fallbackCompany,
    );

    expect(merged.email).toBe("sales@example.test");
    expect(merged.address).toBe("1 New Road");
    expect(merged.tagline).toBe(fallbackCompany.tagline);
    expect(merged.whatsappMessage).toBe(fallbackCompany.whatsappMessage);
  });

  it("falls back to the default phone list when the stored list is empty", () => {
    const merged = mergeCompany({ ...storedCompany(), phones: [] }, fallbackCompany);

    expect(merged.phones).toEqual(fallbackCompany.phones);
  });
});

describe("mergePages", () => {
  it("returns the built-in copy when nothing has been stored", () => {
    expect(mergePages(null, defaultPages)).toEqual(defaultPages);
    expect(mergePages(undefined, defaultPages)).toEqual(defaultPages);
  });

  it("fills a record saved before a field existed", () => {
    const partial = { about: { lead: "Only the stand-first was saved." } };
    const merged = mergePages(partial, defaultPages);

    expect(merged.about.lead).toBe("Only the stand-first was saved.");
    expect(merged.about.points).toEqual(defaultPages.about.points);
    expect(merged.contactChecklist).toEqual(defaultPages.contactChecklist);
  });

  it("keeps a deliberately emptied list empty", () => {
    const merged = mergePages({ about: { points: [] } }, defaultPages);

    expect(merged.about.points).toEqual([]);
    expect(merged.about.paragraphs).toEqual(defaultPages.about.paragraphs);
  });
});

describe("sanitizePages", () => {
  it("trims values and drops blank list rows", () => {
    const pages = storedPages();
    pages.about.paragraphs = ["  First paragraph.  ", "", "   ", "Second paragraph."];
    pages.contactChecklist = [" Requirement. ", ""];

    const cleaned = sanitizePages(pages);

    expect(cleaned.about.paragraphs).toEqual(["First paragraph.", "Second paragraph."]);
    expect(cleaned.contactChecklist).toEqual(["Requirement."]);
    expect(cleaned.about.lead).toBe(defaultPages.about.lead);
  });

  it("drops untitled groups and the blank rows inside them", () => {
    const pages = storedPages();
    pages.about.equipmentRange = [
      { title: "  Filling  ", items: [" Mixer ", ""] },
      { title: "   ", items: ["Should not survive"] },
    ];
    pages.about.productionLineGroups = [
      { title: "Water line", copy: "  Clean, ready-to-drink water.  ", items: [""] },
    ];

    const cleaned = sanitizePages(pages);

    expect(cleaned.about.equipmentRange).toEqual([{ title: "Filling", items: ["Mixer"] }]);
    expect(cleaned.about.productionLineGroups).toEqual([
      { title: "Water line", copy: "Clean, ready-to-drink water.", items: [] },
    ]);
  });

  it("round-trips the built-in copy unchanged", () => {
    expect(sanitizePages(structuredClone(defaultPages))).toEqual(defaultPages);
  });
});

describe("sanitizeVideos", () => {
  const valid = {
    title: "Commissioning walkthrough",
    caption: "Installation, testing and hand-over.",
    tag: "Project",
    videoUrl: "https://youtu.be/Xk9wj7b8wLo",
  };

  it("keeps a complete row and trims it", () => {
    expect(
      sanitizeVideos([
        {
          ...valid,
          title: "  Commissioning walkthrough  ",
          videoUrl: "  https://youtu.be/Xk9wj7b8wLo ",
        },
      ]),
    ).toEqual([valid]);
  });

  it("normalises a missing caption or tag to an empty string", () => {
    const [row] = sanitizeVideos([{ title: "A line", videoUrl: valid.videoUrl }]);

    expect(row).toEqual({ title: "A line", caption: "", tag: "", videoUrl: valid.videoUrl });
  });

  it("drops rows that would render nothing on the page", () => {
    const cleaned = sanitizeVideos([
      { ...valid, title: "   " },
      { ...valid, title: "" },
      { ...valid, videoUrl: "" },
      { ...valid, videoUrl: "https://example.com/watch?v=Xk9wj7b8wLo" },
      { ...valid, videoUrl: "https://www.youtube.com/playlist?list=PL123" },
      valid,
    ]);

    expect(cleaned).toEqual([valid]);
  });

  it("never strips a key the public page reads", () => {
    expect(Object.keys(sanitizeVideos([valid])[0]!).sort()).toEqual([
      "caption",
      "tag",
      "title",
      "videoUrl",
    ]);
  });
});
