import { useState } from "react";
import { ExternalLink, LoaderCircle, LogOut, Menu, ShieldCheck } from "lucide-react";
import { useRouter, useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";

import { logoutFn } from "@/api/auth";
import { Button } from "@/components/ui/button";

interface AdminTopBarProps {
  username: string;
  onOpenNavigation: () => void;
}

const sectionLabels: Record<string, string> = {
  dashboard: "Dashboard",
  company: "Company",
  products: "Products",
  solutions: "Solutions",
  packages: "Packages",
  projects: "Projects",
  insights: "Insights",
  services: "Services",
  settings: "Settings",
};

function titleForPath(pathname: string): string {
  const segment = pathname.replace(/^\/admin\/?/, "").split("/")[0] ?? "";
  return sectionLabels[segment] ?? "Dashboard";
}

export function AdminTopBar({ username, onOpenNavigation }: AdminTopBarProps) {
  const router = useRouter();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pageTitle = titleForPath(pathname);

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
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b bg-background/85 px-4 backdrop-blur sm:px-6 lg:px-8">
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
          <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span>Workspace</span>
            <span aria-hidden="true">/</span>
            <span className="truncate font-semibold text-foreground">{pageTitle}</span>
          </p>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Changes appear on the live site after save.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Button type="button" variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
          <a href="/" target="_blank" rel="noreferrer">
            <ExternalLink aria-hidden="true" />
            View site
          </a>
        </Button>
        <div className="hidden text-right md:block">
          <p className="text-sm font-medium leading-4 text-foreground">{username}</p>
          <p className="mt-1 flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
            <ShieldCheck className="size-3" aria-hidden="true" />
            Authenticated admin
          </p>
        </div>
        <div
          className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-violet-500 text-xs font-bold text-primary-foreground ring-2 ring-background"
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
