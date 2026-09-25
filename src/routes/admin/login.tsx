import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import { z } from "zod";

import { loginFn } from "@/api/auth";
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
    <main className="grid min-h-svh place-items-center bg-primary px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-7 text-center text-primary-foreground">
          <div className="mx-auto mb-4 grid size-12 place-items-center rounded-xl bg-white/12 ring-1 ring-white/20">
            <ShieldCheck className="size-6" aria-hidden="true" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/65">
            Seven Zillions
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Content management</h1>
          <p className="mt-2 text-sm text-white/70">Sign in to manage the live website.</p>
        </div>

        <Card className="shadow-2xl shadow-black/15">
          <CardHeader>
            <CardTitle>Admin sign in</CardTitle>
            <CardDescription>Use the credentials configured for this workspace.</CardDescription>
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

        <p className="mt-5 text-center text-xs leading-5 text-white/55">
          Sessions expire automatically after eight hours.
        </p>
      </div>
    </main>
  );
}
