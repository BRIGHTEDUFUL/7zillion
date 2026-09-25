import { Building2, Factory, Gauge, Lightbulb } from "lucide-react";
import { Link, createFileRoute } from "@tanstack/react-router";

import { queryActivityFn } from "@/api/activity";
import { ActivityWidget } from "@/components/admin/activity-widget";
import { PageHeader } from "@/components/admin/page-header";

const quickLinks = [
  {
    to: "/admin/products",
    label: "Products",
    icon: Factory,
    description: "Edit the public catalogue.",
  },
  {
    to: "/admin/projects",
    label: "Projects",
    icon: Gauge,
    description: "Showcase delivered installations.",
  },
  {
    to: "/admin/insights",
    label: "Insights",
    icon: Lightbulb,
    description: "Publish news and articles.",
  },
  {
    to: "/admin/company",
    label: "Company",
    icon: Building2,
    description: "Contact details and profile.",
  },
] as const;

export const Route = createFileRoute("/admin/_authenticated/dashboard")({
  loader: async () => {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [recentActivity, lastThirtyDays] = await Promise.all([
      queryActivityFn({ data: { limit: 10 } }),
      queryActivityFn({ data: { since } }),
    ]);

    return { recentActivity, lastThirtyDays, since: since.toISOString() };
  },
  component: DashboardPage,
});

function DashboardPage() {
  const data = Route.useLoaderData();

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Monitor visitor engagement and review the latest recorded site activity."
      />

      <section aria-label="Quick links" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.to}
              to={link.to}
              className="group rounded-xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <p className="mt-4 text-sm font-semibold text-foreground">{link.label}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{link.description}</p>
            </Link>
          );
        })}
      </section>

      <ActivityWidget
        recentActivity={data.recentActivity}
        lastThirtyDays={data.lastThirtyDays}
        since={data.since}
      />
    </div>
  );
}
