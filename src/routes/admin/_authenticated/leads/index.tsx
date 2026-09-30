import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { toast } from "sonner";

import { deleteLeadFn, listLeadsFn, setLeadStatusFn } from "@/api/leads";
import { assertMutationSucceeded } from "@/components/admin/api-results";
import { ContentList, type ContentListColumn } from "@/components/admin/content-list";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buildMailtoHref } from "@/lib/quote-submit";
import type { Lead, LeadStatus } from "@/types/content";

export const Route = createFileRoute("/admin/_authenticated/leads/")({
  loader: () => listLeadsFn(),
  component: LeadsIndexPage,
});

const STATUS_OPTIONS: Array<{ value: LeadStatus; label: string }> = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "closed", label: "Closed" },
];

const SOURCE_LABEL: Record<string, string> = {
  "/": "Home page",
  "/contact": "Contact page",
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** The enquiry text, addressed back to whoever sent it. */
function replyHref(lead: Lead): string {
  return buildMailtoHref(
    {
      name: lead.name,
      email: lead.email,
      phone: lead.phone ?? "",
      requirements: lead.requirements,
      botcheck: "",
    },
    lead.email,
  );
}

function StatusSelect({ lead, onChange }: { lead: Lead; onChange: (status: LeadStatus) => void }) {
  return (
    <Select value={lead.status} onValueChange={(value) => onChange(value as LeadStatus)}>
      <SelectTrigger className="h-9 w-[9rem] text-xs" aria-label={`Status for ${lead.name}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function LeadsIndexPage() {
  const leads = Route.useLoaderData();
  const router = useRouter();

  const columns: Array<ContentListColumn<Lead>> = [
    {
      key: "received",
      header: "Received",
      accessor: (lead) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {formatDate(lead.receivedAt)}
        </span>
      ),
      sortValue: (lead) => lead.receivedAt,
    },
    {
      key: "contact",
      header: "Contact",
      accessor: (lead) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-semibold text-foreground">{lead.name}</span>
          <a
            href={`mailto:${lead.email}`}
            className="truncate text-sm text-muted-foreground hover:text-primary"
          >
            {lead.email}
          </a>
        </span>
      ),
      sortValue: (lead) => lead.name,
    },
    {
      key: "source",
      header: "From",
      accessor: (lead) => (
        <span className="inline-flex items-center rounded-md bg-muted/80 px-2.5 py-1 text-[11px] font-medium text-foreground/75 ring-1 ring-inset ring-border/60">
          {SOURCE_LABEL[lead.source] ?? lead.source}
        </span>
      ),
      sortValue: (lead) => lead.source,
    },
    {
      key: "requirements",
      header: "Message",
      accessor: (lead) => (
        <p
          className="line-clamp-2 max-w-[28rem] whitespace-pre-wrap text-muted-foreground"
          title={lead.requirements}
        >
          {lead.requirements}
        </p>
      ),
      sortValue: (lead) => lead.requirements,
    },
    {
      key: "status",
      header: "Status",
      accessor: (lead) => (
        <StatusSelect lead={lead} onChange={(status) => handleStatus(lead, status)} />
      ),
    },
  ];

  async function handleStatus(lead: Lead, status: LeadStatus) {
    if (status === lead.status) return;

    try {
      const result = await setLeadStatusFn({ data: { id: lead.id, status } });
      assertMutationSucceeded(result);
      toast.success(`Marked as ${status}.`);
      await router.invalidate();
    } catch {
      toast.error("The enquiry could not be updated.");
    }
  }

  async function handleDelete(lead: Lead) {
    try {
      const result = await deleteLeadFn({ data: { id: lead.id } });
      assertMutationSucceeded(result);
      toast.success("Enquiry deleted.");
      await router.invalidate();
    } catch {
      toast.error("The enquiry could not be deleted.");
    }
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Quote enquiries"
        title="Leads"
        description={
          leads.length === 0
            ? "Nothing captured yet."
            : `${leads.length} ${leads.length === 1 ? "enquiry" : "enquiries"} from the quote forms.`
        }
      />
      <ContentList
        items={leads}
        columns={columns}
        getItemId={(lead) => lead.id}
        caption="Quote enquiries"
        emptyMessage="No enquiries yet."
        emptyHint="Enquiries appear here as soon as a visitor sends a quote form."
        renderEditLink={(lead) =>
          lead.email ? (
            <Button asChild variant="ghost" size="sm" className="gap-1.5">
              <a href={replyHref(lead)} aria-label={`Reply to ${lead.name}`}>
                <Mail className="size-4" aria-hidden="true" />
                Reply
              </a>
            </Button>
          ) : null
        }
        onDelete={handleDelete}
        deleteDescription={(lead) => `The enquiry from ${lead.name} will be removed permanently.`}
      />
    </div>
  );
}
