/**
 * Canonical shared content types used by both the Content_API and the Admin_Panel UI.
 * Extracted from src/data/site.ts and extended with new admin-panel types.
 */

export type SpecEntry = { label: string; value: string };

export type Company = {
  name: string;
  tagline: string;
  slogan: string;
  /** Public website host shown on the contact page, e.g. "www.example.com". */
  site: string;
  email: string;
  address: string;
  city: string;
  phones: string[];
  whatsapp: string;
  whatsappHref: string;
  /** Pre-filled opener carried by every wa.me link on the site. */
  whatsappMessage: string;
  promise: string;
  founded: string;
};

/** A titled list — the equipment groups and production line groups below. */
export type ContentGroup = {
  title: string;
  items: string[];
};

export type ProductionLineGroup = {
  title: string;
  copy: string;
  items: string[];
};

/**
 * Copy for the pages that carry long-form text: /about and the "what to send
 * us" list on /contact. Edited from Admin → Page content, stored as one JSON
 * blob, and served with the built-in defaults whenever it has not been saved.
 */
export type PagesContent = {
  about: {
    /** H1 of the /about hero. */
    heroTitle: string;
    /** Intro paragraph under the H1. */
    heroIntro: string;
    /** "Who we are" section heading. */
    heading: string;
    /** Stand-first under the heading. */
    lead: string;
    paragraphs: string[];
    points: string[];
    /** Photo URL — empty string keeps the built-in factory photo. */
    image: string;
    equipmentRange: ContentGroup[];
    productionLineGroups: ProductionLineGroup[];
    supportLines: string[];
    closingBrief: string;
  };
  /** Checklist rendered by /contact under "What to send us". */
  contactChecklist: string[];
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

/**
 * One entry of the public video gallery, edited from Admin → Videos and shown
 * on the homepage section and /videos. `videoUrl` accepts any YouTube shape
 * (watch, youtu.be, /shorts/, embed) — src/lib/youtube.ts resolves it to an
 * embed URL, a thumbnail and a display aspect ratio.
 */
export type Video = {
  /** Heading shown under the thumbnail. */
  title: string;
  /** Optional one-line description; blank hides the line. */
  caption?: string | undefined;
  /** Optional grouping chip, e.g. "Project" or "Setup". */
  tag?: string | undefined;
  videoUrl: string;
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
