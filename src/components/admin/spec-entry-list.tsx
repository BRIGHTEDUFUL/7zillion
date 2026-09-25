import { useId } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { SpecEntry } from "@/types/content";

interface SpecEntryListProps {
  label: string;
  description?: string;
  items: SpecEntry[];
  onChange: (items: SpecEntry[]) => void;
  disabled?: boolean;
  className?: string;
}

export function SpecEntryList({
  label,
  description,
  items,
  onChange,
  disabled = false,
  className,
}: SpecEntryListProps) {
  const baseId = useId().replace(/:/g, "");

  function updateItem(index: number, field: keyof SpecEntry, value: string) {
    onChange(
      items.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    );
  }

  function removeItem(index: number) {
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  }

  function moveItem(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) {
      return;
    }

    const next = [...items];
    const current = next[index];
    const target = next[nextIndex];
    if (!current || !target) {
      return;
    }
    next[index] = target;
    next[nextIndex] = current;
    onChange(next);
  }

  return (
    <fieldset className={cn("space-y-4", className)} disabled={disabled}>
      <div>
        <legend className="text-sm font-medium">{label}</legend>
        {description ? (
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
          No specifications yet.
        </div>
      ) : (
        <ol className="space-y-3" aria-label={label}>
          {items.map((item, index) => {
            const labelId = `${baseId}-label-${index}`;
            const valueId = `${baseId}-value-${index}`;

            return (
              <li key={labelId} className="rounded-lg border bg-muted/15 p-3">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_auto] sm:items-end">
                  <div className="space-y-2">
                    <Label htmlFor={labelId}>Label {index + 1}</Label>
                    <Input
                      id={labelId}
                      value={item.label}
                      onChange={(event) => updateItem(index, "label", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={valueId}>Value {index + 1}</Label>
                    <Input
                      id={valueId}
                      value={item.value}
                      onChange={(event) => updateItem(index, "value", event.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-1 sm:pb-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => moveItem(index, -1)}
                      disabled={index === 0}
                    >
                      <ArrowUp aria-hidden="true" />
                      <span className="sr-only">Move specification {index + 1} up</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => moveItem(index, 1)}
                      disabled={index === items.length - 1}
                    >
                      <ArrowDown aria-hidden="true" />
                      <span className="sr-only">Move specification {index + 1} down</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="text-destructive" aria-hidden="true" />
                      <span className="sr-only">Remove specification {index + 1}</span>
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...items, { label: "", value: "" }])}
      >
        <Plus aria-hidden="true" />
        Add specification
      </Button>
    </fieldset>
  );
}
