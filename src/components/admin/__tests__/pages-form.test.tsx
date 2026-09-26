import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { defaultPages } from "@/data/site";

import { PagesForm } from "../pages-form";

const html = renderToStaticMarkup(<PagesForm pages={defaultPages} onCancel={() => {}} />);

/**
 * The admin panel sits behind a login, so the form is asserted here instead:
 * it must mount with the built-in copy and expose every block it edits.
 */
describe("PagesForm", () => {
  it("renders each editable section", () => {
    expect(html).toContain("About page — hero");
    expect(html).toContain("About page — who we are");
    expect(html).toContain("Equipment &amp; product range");
    expect(html).toContain("Complete production line solutions");
    expect(html).toContain("Support &amp; service");
    expect(html).toContain("Contact page — what to send us");
    expect(html).toContain("Add equipment group");
    expect(html).toContain("Add production line solution");
  });

  it("seeds the fields with the built-in copy", () => {
    const [firstPoint] = defaultPages.about.points;
    const [firstGroup] = defaultPages.about.equipmentRange;
    const [firstChecklistLine] = defaultPages.contactChecklist;

    expect(html).toContain(`value="${defaultPages.about.heroTitle}"`);
    expect(html).toContain(`value="${firstGroup?.title ?? ""}"`);
    expect(html).toContain(`value="${firstPoint ?? ""}"`);
    expect(html).toContain('aria-label="Key points"');
    expect(html).toContain(`>${firstChecklistLine ?? ""}</textarea>`);
  });

  it("lets the admin replace the page photo without touching a bundled asset", () => {
    expect(html).toContain("Leave empty to keep the built-in factory photo.");
  });
});
