import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Inbox, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { cn } from "@/lib/utils";

type SortValue = string | number | boolean | Date | null | undefined;

export interface ContentListColumn<TItem> {
  key: string;
  header: string;
  accessor: (item: TItem) => ReactNode;
  sortValue?: (item: TItem) => SortValue;
  className?: string;
}

interface ContentListProps<TItem> {
  items: TItem[];
  columns: Array<ContentListColumn<TItem>>;
  getItemId: (item: TItem) => string;
  renderEditLink: (item: TItem) => ReactNode;
  onDelete?: (item: TItem) => void | Promise<void>;
  deleteDescription?: (item: TItem) => string;
  emptyMessage?: string;
  caption?: string;
}

type SortState = { key: string; direction: "asc" | "desc" } | null;

function compareValues(left: SortValue, right: SortValue): number {
  if (left === right) {
    return 0;
  }
  if (left === null || left === undefined) {
    return 1;
  }
  if (right === null || right === undefined) {
    return -1;
  }

  const normalizedLeft = left instanceof Date ? left.getTime() : left;
  const normalizedRight = right instanceof Date ? right.getTime() : right;

  if (typeof normalizedLeft === "string" && typeof normalizedRight === "string") {
    return normalizedLeft.localeCompare(normalizedRight, undefined, { sensitivity: "base" });
  }
  if (typeof normalizedLeft === "number" && typeof normalizedRight === "number") {
    return normalizedLeft - normalizedRight;
  }
  if (typeof normalizedLeft === "boolean" && typeof normalizedRight === "boolean") {
    return Number(normalizedLeft) - Number(normalizedRight);
  }
  return String(normalizedLeft).localeCompare(String(normalizedRight));
}

export function ContentList<TItem>({
  items,
  columns,
  getItemId,
  renderEditLink,
  onDelete,
  deleteDescription,
  emptyMessage = "No items have been added yet.",
  caption,
}: ContentListProps<TItem>) {
  const [sort, setSort] = useState<SortState>(null);

  const sortedItems = useMemo(() => {
    if (!sort) {
      return items;
    }

    const column = columns.find((candidate) => candidate.key === sort.key);
    if (!column?.sortValue) {
      return items;
    }

    return [...items].sort((left, right) => {
      const comparison = compareValues(column.sortValue?.(left), column.sortValue?.(right));
      return sort.direction === "asc" ? comparison : -comparison;
    });
  }, [columns, items, sort]);

  function toggleSort(key: string) {
    setSort((current) => {
      if (current?.key !== key) {
        return { key, direction: "asc" };
      }
      return { key, direction: current.direction === "asc" ? "desc" : "asc" };
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-card/60 px-6 py-16 text-center backdrop-blur-xs">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Inbox className="size-6" aria-hidden="true" />
        </span>
        <p className="mt-4 font-semibold text-foreground">{emptyMessage}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Use the add action to create the first item.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
      <Table>
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <TableHeader className="[&_tr]:bg-muted/40 border-b border-border/80">
          <TableRow className="hover:bg-transparent">
            {columns.map((column) => {
              const isSorted = sort?.key === column.key;
              const ariaSort = isSorted
                ? sort.direction === "asc"
                  ? "ascending"
                  : "descending"
                : "none";

              return (
                <TableHead
                  key={column.key}
                  aria-sort={ariaSort}
                  className={cn(
                    "h-11 text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                    column.className,
                  )}
                >
                  {column.sortValue ? (
                    <button
                      type="button"
                      className="inline-flex min-h-8 items-center gap-1.5 rounded-md px-1.5 py-1 text-left font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => toggleSort(column.key)}
                    >
                      {column.header}
                      {isSorted && sort.direction === "asc" ? (
                        <ArrowUp className="size-3.5 text-primary" aria-hidden="true" />
                      ) : null}
                      {isSorted && sort.direction === "desc" ? (
                        <ArrowDown className="size-3.5 text-primary" aria-hidden="true" />
                      ) : null}
                      {!isSorted ? (
                        <ArrowUpDown className="size-3.5 opacity-40" aria-hidden="true" />
                      ) : null}
                    </button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              );
            })}
            <TableHead className="h-11 w-[9rem] text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedItems.map((item) => (
            <TableRow key={getItemId(item)} className="transition-colors hover:bg-muted/30">
              {columns.map((column) => (
                <TableCell key={column.key} className={cn("py-3.5 text-sm", column.className)}>
                  {column.accessor(item)}
                </TableCell>
              ))}
              <TableCell className="py-3.5 text-right">
                <div className="flex justify-end gap-1.5">
                  {renderEditLink(item)}
                  {onDelete ? (
                    <ConfirmDialog
                      title="Delete this item?"
                      description={deleteDescription?.(item) ?? "This action cannot be undone."}
                      confirmLabel="Delete"
                      destructive
                      onConfirm={() => onDelete(item)}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Delete item"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    </ConfirmDialog>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
