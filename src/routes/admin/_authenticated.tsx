import { createFileRoute, redirect } from "@tanstack/react-router";

import { getSessionFn } from "@/api/auth";
import { AdminShell } from "@/components/admin/admin-shell";

export const Route = createFileRoute("/admin/_authenticated")({
  beforeLoad: async () => {
    const session = await getSessionFn();
    if (!session?.username) {
      throw redirect({ to: "/admin/login" });
    }
    return { username: session.username };
  },
  component: ProtectedAdminLayout,
});

function ProtectedAdminLayout() {
  const { username } = Route.useRouteContext();
  return <AdminShell username={username} />;
}
