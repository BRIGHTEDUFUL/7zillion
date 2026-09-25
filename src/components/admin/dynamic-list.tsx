import { useId } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface DynamicListProps {
  label: string;
  description?: string;
  items: string[];
  onChange: (items: string[]) => void;
  itemLabel?: string;
  addLabel?: string;
  placeholder?: string;
  multiline?: boolean;
  disabled?: boolean;
  className?: string;
}

export function DynamicList({
  label,
  description,
  items,
  onChange,
  itemLabel = "Item",
  addLabel = "Add item",
  placeholder,
  multiline = false,
  disabled = false,
  className,
}: DynamicListProps) {
  const baseId = useId().replace(/:/g, "");

  function updateItem(index: number, value: string) {
    onChange(items.map((item, itemIndex) => (itemIndex === index ? value : item)));
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
    if (current === undefined || target === undefined) {
      return;
    }
    next[index] = target;
    next[nextIndex] = current;
    onChange(next);
  }

  function addItem() {
    onChange([...items, ""]);
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
          No {label.toLowerCase()} yet.
        </div>
      ) : (
        <ol className="space-y-3" aria-label={label}>
          {items.map((item, index) => {
            const inputId = `${baseId}-${index}`;
            const descriptionId = `${inputId}-description`;

            return (
              <li key={inputId} className="rounded-lg border bg-muted/15 p-3">
                <div className="flex items-end gap-2">
                  <div className="min-w-0 flex-1 space-y-2">
                    <Label htmlFor={inputId} className="sr-only">
                      {itemLabel} {index + 1}
                    </Label>
                    {multiline ? (
                      <Textarea
                        id={inputId}
                        aria-describedby={description ? descriptionId : undefined}
                        value={item}
                        placeholder={placeholder}
                        rows={4}
                        onChange={(event) => updateItem(index, event.target.value)}
                      />
                    ) : (
                      <Input
                        id={inputId}
                        aria-describedby={description ? descriptionId : undefined}
                        value={item}
                        placeholder={placeholder}
                        onChange={(event) => updateItem(index, event.target.value)}
                      />
                    )}
                    {description ? (
                      <p id={descriptionId} className="text-xs text-muted-foreground">
                        {description}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => moveItem(index, -1)}
                      disabled={index === 0}
                    >
                      <ArrowUp aria-hidden="true" />
                      <span className="sr-only">
                        Move {itemLabel.toLowerCase()} {index + 1} up
                      </span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => moveItem(index, 1)}
                      disabled={index === items.length - 1}
                    >
                      <ArrowDown aria-hidden="true" />
                      <span className="sr-only">
                        Move {itemLabel.toLowerCase()} {index + 1} down
                      </span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="text-destructive" aria-hidden="true" />
                      <span className="sr-only">
                        Remove {itemLabel.toLowerCase()} {index + 1}
                      </span>
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        <Plus aria-hidden="true" />
        {addLabel}
      </Button>
    </fieldset>
  );
}
