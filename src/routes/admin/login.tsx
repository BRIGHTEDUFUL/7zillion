import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Factory, Globe, LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";

import { loginFn } from "@/api/auth";
import { BrandLogo } from "@/components/logo";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { REQUEST_FAILED_MESSAGE, loginSchema, type LoginValues } from "@/lib/auth-contract";

const brandPoints = [
  { icon: Factory, text: "Manage products, projects, insights and services from one place." },
  { icon: Globe, text: "Edits go straight to the live site the moment you save." },
  { icon: ShieldCheck, text: "Password protected — sessions expire after eight hours." },
];

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Admin sign in | Seven Zillions" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });
  const formError = form.formState.errors.root?.["server"];

  async function handleSubmit(values: LoginValues) {
    setIsSubmitting(true);
    form.clearErrors("root.server");

    try {
      const result = await loginFn({ data: values });

      if (!result.ok) {
        form.setError("root.server", { type: "server", message: result.message });
        return;
      }

      await router.invalidate();
      await router.navigate({ to: "/admin/dashboard" });
    } catch {
      form.setError("root.server", { type: "server", message: REQUEST_FAILED_MESSAGE });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="admin-login grid min-h-svh lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#2D0440] via-[#3C0654] to-[#1E022B] text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div aria-hidden="true" className="admin-login-pattern absolute inset-0 opacity-80" />
        <div
          aria-hidden="true"
          className="absolute -left-24 -top-24 size-72 rounded-full bg-violet-400/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-32 -right-16 size-96 rounded-full bg-fuchsia-500/10 blur-3xl"
        />

        <div className="relative">
          <div className="inline-flex items-center gap-3 rounded-2xl bg-white/10 p-3 pr-5 ring-1 ring-white/20 backdrop-blur-md">
            <div className="rounded-xl bg-white p-2 shadow-sm">
              <BrandLogo variant="color" className="h-7 w-auto" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white">
                Seven Zillions
              </p>
              <p className="text-[11px] text-white/70">Admin Workspace</p>
            </div>
          </div>
        </div>

        <div className="relative max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-200 ring-1 ring-white/15 backdrop-blur-xs">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Secure Management Portal
          </div>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
            Content management,
            <br />
            in one secure workspace.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-white/80">
            Manage the public Seven Zillions website — catalogue, projects, insights and company
            details — and publish updates the moment you save.
          </p>

          <ul className="mt-9 space-y-4">
            {brandPoints.map((point) => {
              const Icon = point.icon;
              return (
                <li key={point.text} className="flex items-start gap-3.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 ring-1 ring-white/20 backdrop-blur-xs text-violet-200">
                    <Icon className="size-4.5" aria-hidden="true" />
                  </span>
                  <span className="pt-1.5 text-sm leading-6 text-white/90">{point.text}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="relative text-xs leading-5 text-white/60">
          © Seven Zillions · Cooperation and Interdependence
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex min-h-svh flex-col bg-background">
        <div className="flex items-center justify-between border-b bg-card px-4 py-3 sm:px-6 lg:hidden">
          <BrandLogo variant="color" className="h-8 w-auto" />
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
            Admin
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-7">
              <div className="mb-5 hidden lg:block">
                <BrandLogo variant="color" className="h-10 w-auto" />
              </div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
                Administrative Access
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Welcome back
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                Sign in to manage the live Seven Zillions website.
              </p>
            </div>

            <Card className="rounded-2xl border-border/80 shadow-lg shadow-violet-950/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LockKeyhole className="size-4.5 text-primary" aria-hidden="true" />
                  Admin sign in
                </CardTitle>
                <CardDescription>
                  Use the credentials configured for this workspace.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5" noValidate>
                    {formError?.message ? (
                      <Alert variant="destructive" role="alert">
                        <LockKeyhole aria-hidden="true" />
                        <AlertTitle>Sign in failed</AlertTitle>
                        <AlertDescription>{String(formError.message)}</AlertDescription>
                      </Alert>
                    ) : null}

                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              autoComplete="username"
                              autoCapitalize="none"
                              spellCheck={false}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              autoComplete="current-password"
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <LoaderCircle className="animate-spin" aria-hidden="true" />
                      ) : null}
                      {isSubmitting ? "Signing in…" : "Sign in"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">
              Sessions expire automatically after eight hours.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
