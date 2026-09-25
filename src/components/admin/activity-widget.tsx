import { Eye, MessageCircleMore, MousePointerClick, Send } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ActivityLogEntry, EventType } from "@/types/content";

interface ActivityWidgetProps {
  recentActivity: ActivityLogEntry[];
  lastThirtyDays: ActivityLogEntry[];
  since: string;
}

const eventLabels: Record<EventType, string> = {
  page_view: "Page view",
  whatsapp_click: "WhatsApp click",
  contact_submission: "Contact submission",
  enquiry_submission: "Enquiry submission",
};

const timestampFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? timestamp : `${timestampFormatter.format(date)} UTC`;
}

export function ActivityWidget({ recentActivity, lastThirtyDays, since }: ActivityWidgetProps) {
  const sinceTime = new Date(since).getTime();
  const filtered = lastThirtyDays.filter((entry) => {
    const timestamp = new Date(entry.timestamp).getTime();
    return !Number.isFinite(sinceTime) || timestamp >= sinceTime;
  });
  const newestTen = [...recentActivity]
    .sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp))
    .slice(0, 10);

  const metrics = [
    {
      label: "Page views",
      value: filtered.filter((entry) => entry.eventType === "page_view").length,
      icon: Eye,
    },
    {
      label: "Enquiries",
      value: filtered.filter((entry) => entry.eventType === "enquiry_submission").length,
      icon: Send,
    },
    {
      label: "WhatsApp clicks",
      value: filtered.filter((entry) => entry.eventType === "whatsapp_click").length,
      icon: MousePointerClick,
    },
    {
      label: "Contact submissions",
      value: filtered.filter((entry) => entry.eventType === "contact_submission").length,
      icon: MessageCircleMore,
    },
  ];

  return (
    <div className="space-y-7">
      <section aria-labelledby="activity-metrics-heading">
        <div className="mb-4">
          <h2 id="activity-metrics-heading" className="text-lg font-semibold">
            Last 30 days
          </h2>
          <p className="text-sm text-muted-foreground">
            Visitor activity from {formatTimestamp(since)} to now.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.label}>
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                    <p className="mt-1 text-3xl font-semibold tracking-tight">{metric.value}</p>
                  </div>
                  <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>The ten newest recorded events, newest first.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {newestTen.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-muted-foreground">
              No activity has been recorded yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Page or product</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {newestTen.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <Badge variant="secondary">{eventLabels[entry.eventType]}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {entry.path ?? entry.slug ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      <time dateTime={entry.timestamp}>{formatTimestamp(entry.timestamp)}</time>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
