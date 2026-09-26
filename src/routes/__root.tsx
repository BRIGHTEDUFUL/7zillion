import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  ScrollRestoration,
} from "@tanstack/react-router";
import { type ReactNode } from "react";

import appCss from "../styles.css?url";
import heroLineImage from "@/assets/brand/hero-line.webp";
import { getCompanyFn } from "@/api/company";
import { fallbackCompany } from "@/data/site";
import { SiteCompanyProvider } from "@/components/site-company-provider";
import { useEntranceGate } from "@/hooks/use-site-effects";
import type { Company } from "@/types/content";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
          <Link
            to="/products"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Browse products
          </Link>
          <Link
            to="/contact"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Contact us
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  /**
   * One fetch of the admin-managed company record for the whole app. The
   * footer, the contact rail and the CTA bars sit outside every page loader,
   * so they read this through SiteCompanyProvider instead of the built-in
   * copy — a saved phone number or WhatsApp link then shows up everywhere.
   * A failed read still renders the built-in copy rather than the error page.
   */
  loader: async (): Promise<{ company: Company }> => {
    try {
      return { company: await getCompanyFn() };
    } catch (error) {
      console.error("Company record unavailable at the root route.", error);
      return { company: fallbackCompany };
    }
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Seven Zillions" },
      { name: "description", content: "Beverage filling and packaging machinery." },
      { name: "author", content: "Seven Zillions" },
      { property: "og:title", content: "Seven Zillions" },
      { property: "og:description", content: "Beverage filling and packaging machinery." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:wght@400;500;600&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      {
        rel: "preload",
        as: "image",
        href: heroLineImage,
        type: "image/webp",
        fetchPriority: "high",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="js">
      <head>
        <HeadContent />
        {/* Without scripting the entrance gate never opens, so show everything. */}
        <noscript>
          <style>{`.brand,.desktop-nav a,.quote-button,.mobile-menu-button,.hero-eyebrow,.hero h1,.hero-copy,.hero-actions,.hero-footer,.scroll-cue,.inner-hero .eyebrow,.inner-hero h1,.inner-intro,.breadcrumbs,[data-reveal-item]{opacity:1!important;transform:none!important;filter:none!important}`}</style>
        </noscript>
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { company } = Route.useLoaderData();

  // One entrance gate for the whole site: internal pages animate in the same
  // way as the home hero, and it never unmounts between routes.
  useEntranceGate();

  return (
    <SiteCompanyProvider company={company}>
      <QueryClientProvider client={queryClient}>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
      </QueryClientProvider>
    </SiteCompanyProvider>
  );
}
