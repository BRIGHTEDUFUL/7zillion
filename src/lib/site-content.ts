import type { Company, PagesContent } from "@/types/content";

/**
 * Pure helpers that sit between the database record and the pages that render
 * it. Both directions matter:
 *
 *   mergeCompany / mergePages  a record saved before a field existed must
 *                              still fill every section, so an older save (or a
 *                              deployment that predates the table) falls back to
 *                              the built-in copy instead of rendering blanks.
 *   sanitizePages              a list editor lets people add an empty row by
 *                              accident; blanks are dropped before storage so
 *                              the public page never renders an empty bullet.
 */

type PageCopy = PagesContent["about"];

/** A record may be old enough to be missing whole sections or fields. */
type PartialPages = {
  about?: Partial<PageCopy>;
  contactChecklist?: string[];
};

/** Trim a list, dropping anything that is empty once trimmed. */
export function cleanList(items: readonly string[] | undefined): string[] {
  return (items ?? []).map((item) => item.trim()).filter((item) => item.length > 0);
}

export function mergeCompany(stored: Company | null | undefined, defaults: Company): Company {
  if (!stored) return defaults;
  return {
    ...defaults,
    ...stored,
    phones: stored.phones?.length ? stored.phones : defaults.phones,
  };
}

export function mergePages(
  stored: PartialPages | null | undefined,
  defaults: PagesContent,
): PagesContent {
  if (!stored) return defaults;
  // Spreading keeps a deliberately emptied list empty and only fills keys the
  // stored record does not have at all.
  return {
    ...defaults,
    ...stored,
    about: {
      ...defaults.about,
      ...stored.about,
    },
  };
}

export function sanitizePages(pages: PagesContent): PagesContent {
  const about: PageCopy = {
    ...pages.about,
    heroTitle: pages.about.heroTitle.trim(),
    heroIntro: pages.about.heroIntro.trim(),
    heading: pages.about.heading.trim(),
    lead: pages.about.lead.trim(),
    paragraphs: cleanList(pages.about.paragraphs),
    points: cleanList(pages.about.points),
    image: pages.about.image.trim(),
    equipmentRange: pages.about.equipmentRange
      .map((group) => ({ title: group.title.trim(), items: cleanList(group.items) }))
      .filter((group) => group.title.length > 0),
    productionLineGroups: pages.about.productionLineGroups
      .map((group) => ({
        title: group.title.trim(),
        copy: group.copy.trim(),
        items: cleanList(group.items),
      }))
      .filter((group) => group.title.length > 0),
    supportLines: cleanList(pages.about.supportLines),
    closingBrief: pages.about.closingBrief.trim(),
  };

  return {
    about,
    contactChecklist: cleanList(pages.contactChecklist),
  };
}
