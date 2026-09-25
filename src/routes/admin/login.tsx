import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Factory, Globe, LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import { z } from "zod";

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

const LoginSchema = z.object({
  username: z.string().trim().min(1, "Enter your username."),
  password: z.string().min(1, "Enter your password."),
});

type LoginValues = z.infer<typeof LoginSchema>;

const genericLoginError = "Incorrect username or password.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

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
    resolver: zodResolver(LoginSchema),
    defaultValues: { username: "", password: "" },
  });
  const formError = form.formState.errors.root?.["server"];

  async function handleSubmit(values: LoginValues) {
    setIsSubmitting(true);
    form.clearErrors("root.server");

    try {
      const result: unknown = await loginFn({ data: values });
      if (isRecord(result) && (result["success"] === false || result["ok"] === false)) {
        const rateLimited = /rate|429|too many/i.test(
          String(result["reason"] ?? result["error"] ?? result["message"] ?? ""),
        );
        form.setError("root.server", {
          type: "server",
          message: rateLimited
            ? "Too many sign-in attempts. Please wait 15 minutes and try again."
            : genericLoginError,
        });
        return;
      }

      await router.invalidate();
      await router.navigate({ to: "/admin/dashboard" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      form.setError("root.server", {
        type: "server",
        message: /redirect/i.test(message)
          ? "Redirecting…"
          : /rate|429|too many/i.test(message)
            ? "Too many sign-in attempts. Please wait 15 minutes and try again."
            : genericLoginError,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="admin-login grid min-h-svh lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div aria-hidden="true" className="admin-login-pattern absolute inset-0" />
        <div
          aria-hidden="true"
          className="absolute -left-24 -top-24 size-72 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-32 -right-16 size-96 rounded-full bg-white/8 blur-3xl"
        />

        <div className="relative">
          <BrandLogo className="brand-logo--light" />
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.24em] text-white/60">
            Admin workspace
          </p>
        </div>

        <div className="relative max-w-xl">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
            Content management,
            <br />
            in one secure workspace.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-white/75">
            Manage the public Seven Zillions website — catalogue, projects, insights and company
            details — and publish updates the moment you save.
          </p>

          <ul className="mt-9 space-y-4">
            {brandPoints.map((point) => {
              const Icon = point.icon;
              return (
                <li key={point.text} className="flex items-start gap-3.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/12 ring-1 ring-white/20">
                    <Icon className="size-4.5" aria-hidden="true" />
                  </span>
                  <span className="pt-1.5 text-sm leading-6 text-white/85">{point.text}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="relative text-xs leading-5 text-white/55">
          © Seven Zillions · Cooperation and Interdependence
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex min-h-svh flex-col bg-background">
        <div className="flex items-center justify-between border-b bg-primary px-4 py-3.5 text-primary-foreground sm:px-6 lg:hidden">
          <BrandLogo className="brand-logo--light admin-login-logo-mobile" />
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/65">
            Admin workspace
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-7">
              <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                <span className="inline-block size-2 rounded-[2px] bg-primary" aria-hidden="true" />
                Seven Zillions
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                Welcome back
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Sign in to manage the live website.
              </p>
            </div>

            <Card className="shadow-xl shadow-black/5">
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
