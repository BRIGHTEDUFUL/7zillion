import { createFileRoute, useRouter } from "@tanstack/react-router";

import { getCompanyFn } from "@/api/company";
import { CompanyForm } from "@/components/admin/company-form";
import { PageHeader } from "@/components/admin/page-header";

export const Route = createFileRoute("/admin/_authenticated/company")({
  loader: () => getCompanyFn(),
  component: CompanyPage,
});

function CompanyPage() {
  const company = Route.useLoaderData();
  const router = useRouter();

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Settings"
        title="Company information"
        description="Keep the business identity and contact details used across the public site current."
      />
      <CompanyForm
        company={company}
        onCancel={() => router.invalidate()}
        onSaved={() => router.invalidate()}
      />
    </div>
  );
}
