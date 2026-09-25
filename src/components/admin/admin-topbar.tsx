import { useState } from "react";
import { LoaderCircle, LogOut, Menu, ShieldCheck } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";

import { logoutFn } from "@/api/auth";
import { Button } from "@/components/ui/button";

interface AdminTopBarProps {
  username: string;
  onOpenNavigation: () => void;
}

export function AdminTopBar({ username, onOpenNavigation }: AdminTopBarProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logoutFn();
      await router.invalidate();
      await router.navigate({ to: "/admin/login" });
    } catch (error) {
      if (error instanceof Error && /redirect/i.test(error.message)) {
        return;
      }
      toast.error("Sign out failed. Please try again.");
      setIsLoggingOut(false);
    }
  }

  const initials =
    username
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "A";

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b bg-background/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onOpenNavigation}
        >
          <Menu aria-hidden="true" />
          <span className="sr-only">Open admin navigation</span>
        </Button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">Admin workspace</p>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Manage live website content
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden text-right md:block">
          <p className="text-sm font-medium leading-4 text-foreground">{username}</p>
          <p className="mt-1 flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
            <ShieldCheck className="size-3" aria-hidden="true" />
            Authenticated admin
          </p>
        </div>
        <div
          className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
          aria-hidden="true"
        >
          {initials}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isLoggingOut}
          onClick={() => void handleLogout()}
        >
          {isLoggingOut ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : (
            <LogOut aria-hidden="true" />
          )}
          <span className="hidden sm:inline">Log out</span>
        </Button>
      </div>
    </header>
  );
}
