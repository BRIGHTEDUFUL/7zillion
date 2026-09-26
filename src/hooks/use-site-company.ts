import { createContext, useContext } from "react";

import { fallbackCompany } from "@/data/site";
import type { Company } from "@/types/content";

/**
 * The admin-managed company record, published to the parts of the layout that
 * render outside any page loader — footer, contact rail, internal-page CTA and
 * the quote form. Without it those blocks would keep reading the built-in copy
 * and a saved phone number or WhatsApp link would only appear on the two pages
 * that load the record themselves.
 *
 * `SiteCompanyProvider` (see components/site-company-provider.tsx) supplies the
 * record from the root route; the default keeps a failed read rendering.
 */
export const CompanyContext = createContext<Company>(fallbackCompany);

export function useSiteCompany(): Company {
  return useContext(CompanyContext);
}
