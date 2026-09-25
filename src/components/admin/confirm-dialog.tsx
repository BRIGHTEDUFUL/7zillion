import { useState, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogProps {
  title: string;
  description: ReactNode;
  onConfirm: () => void | Promise<void>;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ConfirmDialog({
  title,
  description,
  onConfirm,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  open: controlledOpen,
  onOpenChange,
}: ConfirmDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const isOpen = controlledOpen ?? internalOpen;

  function setOpen(open: boolean) {
    if (controlledOpen === undefined) {
      setInternalOpen(open);
    }
    onOpenChange?.(open);
  }

  async function handleConfirm(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsConfirming(true);

    try {
      await onConfirm();
      setOpen(false);
    } catch {
      // The caller owns user-facing error reporting. Keep the dialog open so a
      // failed destructive action is never mistaken for success.
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setOpen}>
      {children ? <AlertDialogTrigger asChild>{children}</AlertDialogTrigger> : null}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isConfirming}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            className={
              destructive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : undefined
            }
            disabled={isConfirming}
            onClick={(event) => void handleConfirm(event)}
          >
            {isConfirming ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
            {isConfirming ? "Working…" : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
