import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, LoaderCircle, ShieldCheck, UserRound } from "lucide-react";
import { z } from "zod";

import { changePasswordFn, changeUsernameFn } from "@/api/auth";
import { PageHeader } from "@/components/admin/page-header";
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

const SettingsSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z.string().min(8, "Use at least 8 characters."),
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type SettingsValues = z.infer<typeof SettingsSchema>;

// Mirrors MIN_USERNAME_LENGTH / MAX_USERNAME_LENGTH in src/lib/auth.ts — that
// module is server-only, so the client schema restates the bounds.
const UsernameSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Use at least 3 characters.")
    .max(64, "Use at most 64 characters."),
  currentPassword: z.string().min(1, "Enter your current password."),
});

type UsernameValues = z.infer<typeof UsernameSchema>;

export const Route = createFileRoute("/admin/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings | Seven Zillions" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { username: currentUsername } = Route.useRouteContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [usernameSaved, setUsernameSaved] = useState(false);
  const form = useForm<SettingsValues>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });
  const formError = form.formState.errors.root?.["server"];
  const usernameForm = useForm<UsernameValues>({
    resolver: zodResolver(UsernameSchema),
    defaultValues: { username: "", currentPassword: "" },
  });
  const usernameError = usernameForm.formState.errors.root?.["server"];

  async function handleSubmit(values: SettingsValues) {
    setIsSubmitting(true);
    setSaved(false);
    form.clearErrors("root.server");

    try {
      const result: unknown = await changePasswordFn({ data: values });
      if (isRecord(result) && result["success"] === false) {
        form.setError("root.server", {
          type: "server",
          message: String(result["error"] ?? "Could not update the password."),
        });
        return;
      }

      setSaved(true);
      form.reset({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      form.setError("root.server", {
        type: "server",
        message: /redirect/i.test(message)
          ? "Your session has expired. Please sign in again."
          : "Could not update the password. Try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUsernameSubmit(values: UsernameValues) {
    setIsSavingUsername(true);
    setUsernameSaved(false);
    usernameForm.clearErrors("root.server");

    try {
      const result: unknown = await changeUsernameFn({ data: values });
      if (isRecord(result) && result["success"] === false) {
        usernameForm.setError("root.server", {
          type: "server",
          message: String(result["error"] ?? "Could not update the username."),
        });
        return;
      }

      setUsernameSaved(true);
      usernameForm.reset({ username: "", currentPassword: "" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      usernameForm.setError("root.server", {
        type: "server",
        message: /redirect/i.test(message)
          ? "Your session has expired. Please sign in again."
          : "Could not update the username. Try again.",
      });
    } finally {
      setIsSavingUsername(false);
    }
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Update the sign-in credentials for this workspace. Changes take effect immediately and are kept across restarts."
      />

      <div className="grid max-w-5xl gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
              Change password
            </CardTitle>
            <CardDescription>
              Your current password is required. Sessions stay signed in after the change.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5" noValidate>
                {saved ? (
                  <Alert role="status">
                    <ShieldCheck aria-hidden="true" />
                    <AlertTitle>Password updated</AlertTitle>
                    <AlertDescription>
                      Use the new password the next time you sign in.
                    </AlertDescription>
                  </Alert>
                ) : null}

                {formError?.message ? (
                  <Alert variant="destructive" role="alert">
                    <KeyRound aria-hidden="true" />
                    <AlertTitle>Change failed</AlertTitle>
                    <AlertDescription>{String(formError.message)}</AlertDescription>
                  </Alert>
                ) : null}

                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current password</FormLabel>
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

                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          autoComplete="new-password"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm new password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          autoComplete="new-password"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <LoaderCircle className="animate-spin" aria-hidden="true" />
                  ) : null}
                  {isSubmitting ? "Updating…" : "Update password"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="size-5 text-primary" aria-hidden="true" />
              Username
            </CardTitle>
            <CardDescription>
              {currentUsername
                ? `You currently sign in as “${currentUsername}”. The new name applies from your next sign-in.`
                : "The new name applies from your next sign-in."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...usernameForm}>
              <form
                onSubmit={usernameForm.handleSubmit(handleUsernameSubmit)}
                className="space-y-5"
                noValidate
              >
                {usernameSaved ? (
                  <Alert role="status">
                    <ShieldCheck aria-hidden="true" />
                    <AlertTitle>Username updated</AlertTitle>
                    <AlertDescription>
                      Use the new username the next time you sign in. Your password is unchanged.
                    </AlertDescription>
                  </Alert>
                ) : null}

                {usernameError?.message ? (
                  <Alert variant="destructive" role="alert">
                    <UserRound aria-hidden="true" />
                    <AlertTitle>Change failed</AlertTitle>
                    <AlertDescription>{String(usernameError.message)}</AlertDescription>
                  </Alert>
                ) : null}

                <FormField
                  control={usernameForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New username</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          autoComplete="username"
                          autoCapitalize="none"
                          spellCheck={false}
                          disabled={isSavingUsername}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={usernameForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          autoComplete="current-password"
                          disabled={isSavingUsername}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isSavingUsername}>
                  {isSavingUsername ? (
                    <LoaderCircle className="animate-spin" aria-hidden="true" />
                  ) : null}
                  {isSavingUsername ? "Updating…" : "Update username"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
