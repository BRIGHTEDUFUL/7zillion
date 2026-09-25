/**
 * Canonical shared content types used by both the Content_API and the Admin_Panel UI.
 * Extracted from src/data/site.ts and extended with new admin-panel types.
 */

export type SpecEntry = { label: string; value: string };

export type Company = {
  name: string;
  tagline: string;
  slogan: string;
  email: string;
  address: string;
  city: string;
  phones: string[];
  whatsapp: string;
  whatsappHref: string;
  promise: string;
  founded: string;
};

export type Product = {
  slug: string;
  name: string;
  category: string;
  image: string;
  summary: string;
  detail: string;
  detail2: string;
  highlights: string[];
  specs: SpecEntry[];
  whatsappMessage: string;
  /** Optional YouTube watch or embed URL shown on the product detail page. */
  videoUrl?: string | undefined;
};

export type Solution = {
  slug: string;
  name: string;
  image: string;
  eyebrow: string;
  summary: string;
  detail: string;
  capacity: string;
  process: { title: string; copy: string }[];
  equipment: string[];
  specs: SpecEntry[];
};

export type Package = {
  slug: string;
  name: string;
  summary: string;
  includes: string[];
  specs: SpecEntry[];
};

export type Project = {
  id: string; // server-generated UUID
  date: string; // ISO 8601 YYYY-MM-DD
  title: string;
  copy: string;
  image: string;
  /** Optional YouTube watch or embed URL shown on the project card. */
  videoUrl?: string | undefined;
};

export type Insight = {
  num: string;
  slug: string;
  title: string;
  copy: string;
  body: string[];
};

export type Service = {
  title: string;
  copy: string;
};

export type EventType =
  "page_view" | "whatsapp_click" | "contact_submission" | "enquiry_submission";

export type ActivityLogEntry = {
  /** Stable identifier — Convex document _id (string). */
  id: string;
  eventType: EventType;
  path?: string | undefined;
  slug?: string | undefined;
  timestamp: string; // ISO 8601 UTC
};
