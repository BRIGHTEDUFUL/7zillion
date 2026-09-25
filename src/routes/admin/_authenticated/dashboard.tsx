import { createFileRoute } from "@tanstack/react-router";

import { queryActivityFn } from "@/api/activity";
import { ActivityWidget } from "@/components/admin/activity-widget";
import { PageHeader } from "@/components/admin/page-header";

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
      <ActivityWidget
        recentActivity={data.recentActivity}
        lastThirtyDays={data.lastThirtyDays}
        since={data.since}
      />
    </div>
  );
}
