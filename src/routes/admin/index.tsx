import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * `/admin` is the path the public footer links to, so send it straight to the
 * sign-in route — no session probe here.
 *
 * The sign-in route's own `beforeLoad` decides where the visitor really
 * belongs: signed-out visitors see the form, signed-in admins are bounced to
 * the dashboard before the form can ever render. Probing the session here as
 * well would cost a second round-trip on every entry for no benefit.
 */
export const Route = createFileRoute("/admin/")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/login" });
  },
});
