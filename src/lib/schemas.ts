import { z } from "zod";

import { extractVideoId } from "@/lib/youtube";

/**
 * Content is edited in a number of different forms, so the schemas below are
 * deliberately strict about object keys.  A typo in a form field should be a
 * validation error rather than a silently discarded value.
 */

const requiredText = z
  .string()
  .min(1, "Required")
  .refine((value) => value.trim().length > 0, "Required");

const slug = z
  .string()
  .min(1, "Required")
  .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only");

const email = z.string().min(1, "Required").email("Enter a valid email address");

const url = z.string().min(1, "Required").url("Enter a valid URL");

const timestamp = z.string().datetime({ offset: true });

export const EventTypeSchema = z.enum([
  "page_view",
  "whatsapp_click",
  "contact_submission",
  "enquiry_submission",
]);

export const SpecEntrySchema = z
  .object({
    label: z.string(),
    value: z.string(),
  })
  .strict();

export const ProcessEntrySchema = z
  .object({
    title: z.string(),
    copy: z.string(),
  })
  .strict();

export const CompanySchema = z
  .object({
    name: requiredText,
    tagline: z.string(),
    slogan: z.string(),
    site: requiredText,
    email,
    address: z.string(),
    city: z.string(),
    phones: z.array(z.string()),
    whatsapp: z.string(),
    whatsappHref: url,
    whatsappMessage: z.string(),
    promise: z.string(),
    founded: z.string(),
  })
  .strict();

/**
 * Page copy. Headings are required so a save can never blank a section; list
 * items stay free-form strings because they are trimmed and stripped of blanks
 * on the server (see sanitizePages) — DynamicList has no field-level error slot.
 */
export const ContentGroupSchema = z
  .object({
    title: requiredText,
    items: z.array(z.string()),
  })
  .strict();

export const ProductionLineGroupSchema = z
  .object({
    title: requiredText,
    copy: z.string(),
    items: z.array(z.string()),
  })
  .strict();

export const PagesSchema = z
  .object({
    about: z
      .object({
        heroTitle: requiredText,
        heroIntro: requiredText,
        heading: requiredText,
        lead: requiredText,
        paragraphs: z.array(z.string()),
        points: z.array(z.string()),
        image: z.string(),
        equipmentRange: z.array(ContentGroupSchema),
        productionLineGroups: z.array(ProductionLineGroupSchema),
        supportLines: z.array(z.string()),
        closingBrief: requiredText,
      })
      .strict(),
    contactChecklist: z.array(z.string()),
  })
  .strict();

export const ProductSchema = z
  .object({
    slug,
    name: requiredText,
    category: requiredText,
    image: z.string(),
    summary: requiredText,
    detail: z.string(),
    detail2: z.string(),
    highlights: z.array(z.string()),
    specs: z.array(SpecEntrySchema),
    whatsappMessage: z.string(),
    videoUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  })
  .strict();

export const SolutionSchema = z
  .object({
    slug,
    name: requiredText,
    image: z.string(),
    eyebrow: z.string(),
    summary: requiredText,
    detail: z.string(),
    capacity: z.string(),
    process: z.array(ProcessEntrySchema),
    equipment: z.array(z.string()),
    specs: z.array(SpecEntrySchema),
  })
  .strict();

export const PackageSchema = z
  .object({
    slug,
    name: requiredText,
    summary: z.string(),
    includes: z.array(z.string()),
    specs: z.array(SpecEntrySchema),
  })
  .strict();

/**
 * A calendar date without a time or timezone component.  The shape check is
 * kept separate from the calendar check so the error remains useful to form
 * consumers (and so impossible dates such as 2025-02-31 are rejected).
 */
export const DateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .refine(isCalendarDate, "Enter a valid calendar date");

export const ProjectSchema = z
  .object({
    // The API supplies the UUID when creating a project.  An existing id is
    // accepted when editing, but is not required for a create payload.
    id: z.string().min(1).optional(),
    date: DateStringSchema,
    title: requiredText,
    copy: requiredText,
    image: z.string(),
    videoUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  })
  .strict();

export const InsightSchema = z
  .object({
    num: z.string(),
    slug,
    title: requiredText,
    copy: requiredText,
    body: z.array(z.string()),
  })
  .strict();

export const ServiceSchema = z
  .object({
    title: requiredText,
    copy: requiredText,
  })
  .strict();

/**
 * A gallery row must resolve to a real YouTube video: a URL that passes zod's
 * .url() but points at Vimeo (or anywhere else) would silently render no tile,
 * so the URL is pushed through the same parser the embed component uses.
 */
export const VideoSchema = z
  .object({
    title: requiredText,
    caption: z.string().optional().or(z.literal("")),
    tag: z.string().optional().or(z.literal("")),
    videoUrl: z
      .string()
      .min(1, "Required")
      .refine((value) => extractVideoId(value.trim()) !== null, "Paste a YouTube link"),
  })
  .strict();

/**
 * The public activity-recording API historically used `type` in examples,
 * while the persisted model calls the field `eventType`.  Accept either name
 * at the boundary, require exactly one, and always emit the canonical shape.
 * This keeps old callers working without weakening strict key validation.
 */
const ActivityEntryInputSchema = z
  .object({
    eventType: EventTypeSchema.optional(),
    type: EventTypeSchema.optional(),
    path: z.string().optional(),
    slug: z.string().optional(),
    timestamp,
  })
  .strict()
  .superRefine((value, ctx) => {
    const hasEventType = value.eventType !== undefined;
    const hasType = value.type !== undefined;

    if (hasEventType === hasType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["eventType"],
        message: "Provide exactly one event type",
      });
    }
  });

export const ActivityEntrySchema = ActivityEntryInputSchema.transform(
  ({ eventType, type, path, slug: entrySlug, timestamp: entryTimestamp }) => {
    const entry: {
      eventType: z.infer<typeof EventTypeSchema>;
      timestamp: string;
      path?: string;
      slug?: string;
    } = {
      eventType: eventType ?? type!,
      timestamp: entryTimestamp,
    };

    if (path !== undefined) entry.path = path;
    if (entrySlug !== undefined) entry.slug = entrySlug;

    return entry;
  },
);

/** Schema for a row returned by the activity store. */
export const ActivityLogEntrySchema = z
  .object({
    id: z.number().int().positive(),
    eventType: EventTypeSchema,
    path: z.string().optional(),
    slug: z.string().optional(),
    timestamp,
  })
  .strict();

/** Validation for the optional filters accepted by ContentStore.queryActivity. */
export const ActivityQueryOptionsSchema = z
  .object({
    limit: z.number().int().positive().max(1000).optional(),
    since: z.union([z.date(), timestamp.transform((value) => new Date(value))]).optional(),
    eventTypes: z.array(EventTypeSchema).optional(),
  })
  .strict();

export type CompanyInput = z.infer<typeof CompanySchema>;
export type PagesInput = z.infer<typeof PagesSchema>;
export type ProductInput = z.infer<typeof ProductSchema>;
export type SolutionInput = z.infer<typeof SolutionSchema>;
export type PackageInput = z.infer<typeof PackageSchema>;
export type ProjectInput = z.infer<typeof ProjectSchema>;
export type InsightInput = z.infer<typeof InsightSchema>;
export type ServiceInput = z.infer<typeof ServiceSchema>;
export type ActivityEntryInput = z.infer<typeof ActivityEntrySchema>;
export type ActivityLogEntryInput = z.infer<typeof ActivityLogEntrySchema>;
export type ActivityQueryOptionsInput = z.infer<typeof ActivityQueryOptionsSchema>;

function isCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1) return false;

  const daysInMonth = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  return day <= (daysInMonth[month - 1] ?? 0);
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}
