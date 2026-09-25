import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, LoaderCircle, ShieldCheck, UserRound } from "lucide-react";

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
import {
  REQUEST_FAILED_MESSAGE,
  changePasswordSchema,
  changeUsernameSchema,
  type ChangePasswordValues,
  type ChangeUsernameValues,
} from "@/lib/auth-contract";

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
  const router = useRouter();
  const { username: currentUsername } = Route.useRouteContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [usernameSaved, setUsernameSaved] = useState(false);
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });
  const formError = form.formState.errors.root?.["server"];
  const usernameForm = useForm<ChangeUsernameValues>({
    resolver: zodResolver(changeUsernameSchema),
    defaultValues: { username: "", currentPassword: "" },
  });
  const usernameError = usernameForm.formState.errors.root?.["server"];

  async function handleSubmit(values: ChangePasswordValues) {
    setIsSubmitting(true);
    setSaved(false);
    form.clearErrors("root.server");

    try {
      const result = await changePasswordFn({ data: values });

      if (!result.ok) {
        if (result.code === "session_expired") {
          await router.navigate({ to: "/admin/login" });
          return;
        }
        form.setError("root.server", { type: "server", message: result.message });
        return;
      }

      setSaved(true);
      form.reset({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch {
      form.setError("root.server", { type: "server", message: REQUEST_FAILED_MESSAGE });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUsernameSubmit(values: ChangeUsernameValues) {
    setIsSavingUsername(true);
    setUsernameSaved(false);
    usernameForm.clearErrors("root.server");

    try {
      const result = await changeUsernameFn({ data: values });

      if (!result.ok) {
        if (result.code === "session_expired") {
          await router.navigate({ to: "/admin/login" });
          return;
        }
        usernameForm.setError("root.server", { type: "server", message: result.message });
        return;
      }

      setUsernameSaved(true);
      usernameForm.reset({ username: "", currentPassword: "" });
      // Refresh the route context so the header and card show the new name.
      await router.invalidate();
    } catch {
      usernameForm.setError("root.server", { type: "server", message: REQUEST_FAILED_MESSAGE });
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
