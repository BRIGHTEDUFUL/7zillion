/**
 * Feature: admin-panel
 * Task 1.3 — Zod schema property tests
 *
 * Property 5: Required-field validation rejects any form with a blank required field
 * Property 6: Email field rejects all non-RFC-5322 strings
 * Property 11: ISO 8601 date validation rejects all non-YYYY-MM-DD strings
 *
 * Uses fast-check for property-based generation (min 100 runs each).
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

import {
  CompanySchema,
  ProductSchema,
  SolutionSchema,
  PackageSchema,
  ProjectSchema,
  InsightSchema,
  ServiceSchema,
  DateStringSchema,
} from "@/lib/schemas";

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

/** A valid base Company object — all required fields filled. */
const validCompany = {
  name: "Seven Zillions",
  tagline: "Cooperation",
  slogan: "Build",
  site: "www.sevenzillions.com",
  email: "info@sevenzillions.com",
  address: "123 Main St",
  city: "Kumasi",
  phones: ["+233 554 602 103"],
  whatsapp: "+233 20 509 9553",
  whatsappHref: "https://wa.me/233205099553",
  whatsappMessage: "Hello Seven Zillions, please send me more information.",
  promise: "On-Time",
  founded: "20+ years",
} as const;

const validProduct = {
  slug: "filling-machines",
  name: "Filling machines",
  category: "Filling",
  image: "https://example.com/img.jpg",
  summary: "A summary",
  detail: "Detail text",
  detail2: "Detail 2",
  highlights: ["Highlight 1"],
  specs: [{ label: "Output", value: "3600 BPH" }],
  whatsappMessage: "Hello",
} as const;

const validSolution = {
  slug: "water-filling-line",
  name: "Water Filling Line",
  image: "https://example.com/img.jpg",
  eyebrow: "Mineral water",
  summary: "A summary",
  detail: "Detail",
  capacity: "3600 BPH",
  process: [{ title: "Step 1", copy: "Description" }],
  equipment: ["Machine A"],
  specs: [{ label: "Output", value: "3600 BPH" }],
} as const;

const validPackage = {
  slug: "turnkey-3600",
  name: "Turnkey 3600",
  summary: "A summary",
  includes: ["Item A"],
  specs: [{ label: "Capacity", value: "3600 BPH" }],
} as const;

const validProject = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  date: "2025-06-15",
  title: "Water Bottling Line",
  copy: "Delivered in Africa",
  image: "https://example.com/img.jpg",
} as const;

const validInsight = {
  num: "01",
  slug: "drinking-water-production",
  title: "Drinking Water Production",
  copy: "A guide",
  body: ["Paragraph one"],
} as const;

const validService = {
  title: "Installation",
  copy: "We install your line",
} as const;

// Arbitrary: non-empty strings (for valid required fields)
const nonEmpty = fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0);

// Arbitrary: blank strings — empty, whitespace only
const blank = fc.oneof(
  fc.constant(""),
  fc.string({ unit: fc.constantFrom(" ", "\t", "\n"), minLength: 1, maxLength: 10 }),
);

// ──────────────────────────────────────────────────────────────────────────────
// Property 5: Required fields — blank values must always fail validation
// ──────────────────────────────────────────────────────────────────────────────

describe("Property 5: Required-field validation rejects any blank required field", () => {
  it("CompanySchema: blank name fails", () => {
    fc.assert(
      fc.property(blank, (blankName) => {
        const result = CompanySchema.safeParse({ ...validCompany, name: blankName });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it("CompanySchema: blank email fails", () => {
    fc.assert(
      fc.property(blank, (blankEmail) => {
        const result = CompanySchema.safeParse({ ...validCompany, email: blankEmail });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it("ProductSchema: blank name fails", () => {
    fc.assert(
      fc.property(blank, (blankName) => {
        const result = ProductSchema.safeParse({ ...validProduct, name: blankName });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it("ProductSchema: blank category fails", () => {
    fc.assert(
      fc.property(blank, (blankCategory) => {
        const result = ProductSchema.safeParse({ ...validProduct, category: blankCategory });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it("ProductSchema: blank summary fails", () => {
    fc.assert(
      fc.property(blank, (blankSummary) => {
        const result = ProductSchema.safeParse({ ...validProduct, summary: blankSummary });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it("SolutionSchema: blank name fails", () => {
    fc.assert(
      fc.property(blank, (v) => {
        const result = SolutionSchema.safeParse({ ...validSolution, name: v });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it("SolutionSchema: blank summary fails", () => {
    fc.assert(
      fc.property(blank, (v) => {
        const result = SolutionSchema.safeParse({ ...validSolution, summary: v });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it("PackageSchema: blank name fails", () => {
    fc.assert(
      fc.property(blank, (v) => {
        const result = PackageSchema.safeParse({ ...validPackage, name: v });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it("PackageSchema: a price key is rejected", () => {
    const result = PackageSchema.safeParse({
      ...validPackage,
      price: "9,830,230 GHS",
      priceNote: "full automatic",
    });
    expect(result.success).toBe(false);
  });

  it("InsightSchema: blank title fails", () => {
    fc.assert(
      fc.property(blank, (v) => {
        const result = InsightSchema.safeParse({ ...validInsight, title: v });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it("InsightSchema: blank copy fails", () => {
    fc.assert(
      fc.property(blank, (v) => {
        const result = InsightSchema.safeParse({ ...validInsight, copy: v });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it("ServiceSchema: blank title fails", () => {
    fc.assert(
      fc.property(blank, (v) => {
        const result = ServiceSchema.safeParse({ ...validService, title: v });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it("ServiceSchema: blank copy fails", () => {
    fc.assert(
      fc.property(blank, (v) => {
        const result = ServiceSchema.safeParse({ ...validService, copy: v });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it("ProjectSchema: blank title fails", () => {
    fc.assert(
      fc.property(blank, (v) => {
        const result = ProjectSchema.safeParse({ ...validProject, title: v });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 },
    );
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Property 6: Email field rejects all non-RFC-5322 strings
// ──────────────────────────────────────────────────────────────────────────────

describe("Property 6: Email field rejects all non-RFC-5322 strings", () => {
  // Strings that are definitely not valid emails
  const notAnEmail = fc.oneof(
    // No @ symbol
    fc.string().filter((s) => !s.includes("@")),
    // Starts with @
    fc.string({ minLength: 1 }).map((s) => `@${s}`),
    // Missing domain
    fc.string({ minLength: 1 }).map((s) => `${s}@`),
    // Spaces around @
    fc.string({ minLength: 1 }).map((s) => `${s} @ domain.com`),
    // Pure whitespace / blank
    fc.constant(""),
    fc.constant("   "),
    // Not a string shape at all — coerced to string
    fc.constant("notanemail"),
    fc.constant("missing-at-sign.com"),
    fc.constant("double@@domain.com"),
  );

  it("CompanySchema email: rejects non-email strings", () => {
    fc.assert(
      fc.property(notAnEmail, (bad) => {
        const result = CompanySchema.safeParse({ ...validCompany, email: bad });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 },
    );
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Property 11: ISO 8601 date validation rejects all non-YYYY-MM-DD strings
// ──────────────────────────────────────────────────────────────────────────────

describe("Property 11: ISO 8601 date validation rejects all non-YYYY-MM-DD strings", () => {
  // Strings that are definitely not YYYY-MM-DD
  const notADate = fc.oneof(
    // Random strings with no date shape
    fc.string().filter((s) => !/^\d{4}-\d{2}-\d{2}$/.test(s)),
    // Wrong separators
    fc.constant("2025/06/15"),
    fc.constant("2025.06.15"),
    fc.constant("20250615"),
    fc.constant("15-06-2025"),
    fc.constant("Jun 15 2025"),
    // Impossible dates
    fc.constant("2025-13-01"),
    fc.constant("2025-00-01"),
    fc.constant("2025-02-30"),
    fc.constant("2025-04-31"),
    // Blank
    fc.constant(""),
    // Partial
    fc.constant("2025-06"),
    fc.constant("06-15"),
  );

  it("DateStringSchema rejects non-YYYY-MM-DD strings", () => {
    fc.assert(
      fc.property(notADate, (bad) => {
        const result = DateStringSchema.safeParse(bad);
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it("ProjectSchema: bad date string fails", () => {
    fc.assert(
      fc.property(notADate, (bad) => {
        const result = ProjectSchema.safeParse({ ...validProject, date: bad });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it("DateStringSchema accepts valid YYYY-MM-DD dates", () => {
    // Spot-check known good dates — ensures the schema doesn't over-reject
    const goodDates = [
      "2025-01-01",
      "2024-02-29", // leap year
      "2000-12-31",
      "1999-06-15",
      "2026-09-24",
    ];
    for (const d of goodDates) {
      const result = DateStringSchema.safeParse(d);
      expect(result.success, `Expected ${d} to be valid`).toBe(true);
    }
  });

  it("DateStringSchema rejects impossible calendar dates", () => {
    const impossible = [
      "2025-02-29", // not a leap year
      "2025-04-31", // April has 30 days
      "2025-13-01", // month 13
      "2025-00-15", // month 0
      "2025-06-00", // day 0
    ];
    for (const d of impossible) {
      const result = DateStringSchema.safeParse(d);
      expect(result.success, `Expected ${d} to be invalid`).toBe(false);
    }
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Sanity: valid objects pass all schemas
// ──────────────────────────────────────────────────────────────────────────────

describe("Valid objects pass their schemas", () => {
  it("CompanySchema accepts a valid company", () => {
    expect(CompanySchema.safeParse(validCompany).success).toBe(true);
  });
  it("ProductSchema accepts a valid product", () => {
    expect(ProductSchema.safeParse(validProduct).success).toBe(true);
  });
  it("SolutionSchema accepts a valid solution", () => {
    expect(SolutionSchema.safeParse(validSolution).success).toBe(true);
  });
  it("PackageSchema accepts a valid package", () => {
    expect(PackageSchema.safeParse(validPackage).success).toBe(true);
  });
  it("ProjectSchema accepts a valid project", () => {
    expect(ProjectSchema.safeParse(validProject).success).toBe(true);
  });
  it("InsightSchema accepts a valid insight", () => {
    expect(InsightSchema.safeParse(validInsight).success).toBe(true);
  });
  it("ServiceSchema accepts a valid service", () => {
    expect(ServiceSchema.safeParse(validService).success).toBe(true);
  });
});
