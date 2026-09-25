import { useState } from "react";
import { Outlet } from "@tanstack/react-router";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopBar } from "@/components/admin/admin-topbar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";

interface AdminShellProps {
  username: string;
}

export function AdminShell({ username }: AdminShellProps) {
  const [navigationOpen, setNavigationOpen] = useState(false);

  return (
    <div className="admin-workspace min-h-svh">
      <a
        href="#admin-content"
        className="fixed left-3 top-3 z-[100] -translate-y-20 rounded-md bg-background px-4 py-2 text-sm font-medium shadow-lg transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 md:block">
        <AdminSidebar />
      </aside>

      <Sheet open={navigationOpen} onOpenChange={setNavigationOpen}>
        <SheetContent side="left" className="w-[18rem] max-w-[85vw] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Admin navigation</SheetTitle>
            <SheetDescription>Navigate between content management sections.</SheetDescription>
          </SheetHeader>
          <AdminSidebar onNavigate={() => setNavigationOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="min-h-svh md:pl-72">
        <AdminTopBar username={username} onOpenNavigation={() => setNavigationOpen(true)} />
        <main
          id="admin-content"
          className="mx-auto w-full max-w-[100rem] px-4 py-7 sm:px-6 lg:px-8 lg:py-9"
        >
          <Outlet />
        </main>
      </div>

      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
