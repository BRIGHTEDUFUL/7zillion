import {
  Activity,
  Building2,
  Factory,
  Gauge,
  LayoutDashboard,
  Lightbulb,
  PackageOpen,
  PanelsTopLeft,
  Wrench,
} from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

const navigation = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/company", label: "Company", icon: Building2, exact: false },
  { to: "/admin/products", label: "Products", icon: Factory, exact: false },
  { to: "/admin/solutions", label: "Solutions", icon: PanelsTopLeft, exact: false },
  { to: "/admin/packages", label: "Packages", icon: PackageOpen, exact: false },
  { to: "/admin/projects", label: "Projects", icon: Gauge, exact: false },
  { to: "/admin/insights", label: "Insights", icon: Lightbulb, exact: false },
  { to: "/admin/services", label: "Services", icon: Wrench, exact: false },
] as const;

interface AdminSidebarProps {
  onNavigate?: () => void;
  className?: string;
}

export function AdminSidebar({ onNavigate, className }: AdminSidebarProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <div className={cn("flex h-full flex-col bg-primary text-primary-foreground", className)}>
      <div className="flex h-20 items-center border-b border-white/15 px-6">
        <Link
          to="/admin/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <span className="grid size-9 place-items-center rounded-lg bg-white/12">
            <Activity className="size-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-sm font-bold tracking-wide">SEVEN ZILLIONS</span>
            <span className="block text-[11px] font-medium text-white/65">Content management</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Admin navigation">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
          Workspace
        </p>
        <ul className="space-y-1">
          {navigation.map((item) => {
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
                    "flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/72 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                    isActive && "bg-white text-primary shadow-sm hover:bg-white hover:text-primary",
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/15 px-6 py-4 text-xs leading-5 text-white/55">
        <p className="font-semibold text-white/75">Protected workspace</p>
        <p>Changes appear on the public site after save.</p>
      </div>
    </div>
  );
}
