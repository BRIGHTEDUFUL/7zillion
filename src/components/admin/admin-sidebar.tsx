import {
  Building2,
  ExternalLink,
  Factory,
  Gauge,
  KeyRound,
  LayoutDashboard,
  Lightbulb,
  PackageOpen,
  PanelsTopLeft,
  Wrench,
} from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";

import { BrandLogo } from "@/components/logo";
import { cn } from "@/lib/utils";

const workspaceNavigation = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/company", label: "Company", icon: Building2, exact: false },
  { to: "/admin/products", label: "Products", icon: Factory, exact: false },
  { to: "/admin/solutions", label: "Solutions", icon: PanelsTopLeft, exact: false },
  { to: "/admin/packages", label: "Packages", icon: PackageOpen, exact: false },
  { to: "/admin/projects", label: "Projects", icon: Gauge, exact: false },
  { to: "/admin/insights", label: "Insights", icon: Lightbulb, exact: false },
  { to: "/admin/services", label: "Services", icon: Wrench, exact: false },
] as const;

const accountNavigation = [
  { to: "/admin/settings", label: "Settings", icon: KeyRound, exact: true },
] as const;

interface AdminSidebarProps {
  onNavigate?: () => void;
  className?: string;
}

export function AdminSidebar({ onNavigate, className }: AdminSidebarProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  function renderItems(
    items: ReadonlyArray<{
      to: string;
      label: string;
      icon: typeof LayoutDashboard;
      exact: boolean;
    }>,
  ) {
    return (
      <ul className="space-y-1">
        {items.map((item) => {
          const isActive = item.exact
            ? pathname === item.to
            : pathname === item.to || pathname.startsWith(`${item.to}/`);
          const Icon = item.icon;

          return (
            <li key={item.to}>
              <Link
                to={item.to}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/72 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                  isActive && "bg-white text-primary shadow-sm hover:bg-white hover:text-primary",
                )}
              >
                {isActive ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary"
                  />
                ) : null}
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div
      className={cn(
        "admin-sidebar flex h-full flex-col bg-primary text-primary-foreground",
        className,
      )}
    >
      <div className="flex h-20 shrink-0 items-center border-b border-white/15 px-6">
        <Link
          to="/admin/dashboard"
          onClick={onNavigate}
          className="flex flex-col gap-1.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <BrandLogo />
          <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/60">
            Admin workspace
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Admin navigation">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
          Workspace
        </p>
        {renderItems(workspaceNavigation)}

        <p className="px-3 pb-2 pt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
          Account
        </p>
        {renderItems(accountNavigation)}
      </nav>

      <div className="shrink-0 border-t border-white/15 p-3">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex min-h-10 items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          View live site
          <ExternalLink className="size-4" aria-hidden="true" />
        </a>
        <p className="px-3 pt-2 pb-1 text-xs leading-5 text-white/55">
          Changes appear on the public site after save.
        </p>
      </div>
    </div>
  );
}
