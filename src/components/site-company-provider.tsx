import type { ReactNode } from "react";

import { CompanyContext } from "@/hooks/use-site-company";
import type { Company } from "@/types/content";

/** Publishes the root route's company record to the shared layout blocks. */
export function SiteCompanyProvider({
  company,
  children,
}: {
  company: Company;
  children: ReactNode;
}) {
  return <CompanyContext.Provider value={company}>{children}</CompanyContext.Provider>;
}
