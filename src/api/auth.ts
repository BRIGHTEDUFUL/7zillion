import { createServerFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";
import { deleteCookie, getCookie, getRequestIP, setCookie } from "@tanstack/react-start/server";
import { z } from "zod";

import * as auth from "@/lib/auth";

import { getApiEnv } from "./_internal";

export const ADMIN_SESSION_COOKIE = "admin_session";
const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;
const DASHBOARD_REDIRECT = "/admin/dashboard";
const LOGOUT_REDIRECT = "/admin/login";
const GENERIC_LOGIN_ERROR = "Incorrect username or password";

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

function getClientIp(): string {
  try {
    return getRequestIP({ xForwardedFor: true }) ?? "unknown";
  } catch {
    // Unit callers and non-request invocations do not always have a request
    // event.  The auth service can still use a stable bucket for those calls.
    return "unknown";
  }
}

function rateLimitedResponse(): Response {
  return new Response("Too many login attempts", {
    status: 429,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "retry-after": String(15 * 60),
    },
  });
}

export const loginFn = createServerFn({ method: "POST" })
  .validator(loginSchema)
  .handler(async ({ data, context }) => {
    const result = await auth.login(
      data.username,
      data.password,
      getClientIp(),
      getApiEnv(context),
    );

    if (!result.success) {
      if (result.reason === "rate_limited") {
        throw rateLimitedResponse();
      }

      // Keep the response identical for an unknown username, a bad password,
      // and both fields being wrong.
      return {
        success: false as const,
        error: GENERIC_LOGIN_ERROR,
      };
    }

    setCookie(ADMIN_SESSION_COOKIE, result.sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: "/",
    });

    throw redirect({ to: DASHBOARD_REDIRECT });
  });

export const logoutFn = createServerFn({ method: "POST" }).handler(async ({ context }) => {
  const sessionToken = getCookie(ADMIN_SESSION_COOKIE);

  if (sessionToken) {
    await auth.logout(sessionToken, getApiEnv(context));
  }

  deleteCookie(ADMIN_SESSION_COOKIE, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
  });

  throw redirect({ to: LOGOUT_REDIRECT });
});

/** Read the current admin session for route guards (beforeLoad). */
export const getSessionFn = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const sessionToken = getCookie(ADMIN_SESSION_COOKIE);
  if (!sessionToken) return null;

  const session = await auth.validateSession(sessionToken, getApiEnv(context));
  if (!session.valid) return null;

  return { username: session.username };
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password."),
  newPassword: z.string().min(8, "Use at least 8 characters."),
  confirmPassword: z.string().min(1, "Confirm your new password."),
});

/**
 * Change the admin password from the Settings page. Requires a valid session;
 * the caller's current password is re-verified server-side before the new
 * hash is persisted to Convex.
 */
export const changePasswordFn = createServerFn({ method: "POST" })
  .validator(
    changePasswordSchema.refine((values) => values.newPassword === values.confirmPassword, {
      message: "Passwords do not match.",
      path: ["confirmPassword"],
    }),
  )
  .handler(async ({ data, context }) => {
    const sessionToken = getCookie(ADMIN_SESSION_COOKIE);
    if (!sessionToken) throw redirect({ to: LOGOUT_REDIRECT });

    const session = await auth.validateSession(sessionToken, getApiEnv(context));
    if (!session.valid) throw redirect({ to: LOGOUT_REDIRECT });

    const result = await auth.changePassword(
      data.currentPassword,
      data.newPassword,
      getClientIp(),
      getApiEnv(context),
    );

    if (!result.success) {
      switch (result.reason) {
        case "rate_limited":
          return {
            success: false as const,
            error: "Too many attempts. Please wait 15 minutes and try again.",
          };
        case "weak_password":
          return {
            success: false as const,
            error: `Use a password of at least ${auth.MIN_PASSWORD_LENGTH} characters.`,
          };
        case "server_error":
          return { success: false as const, error: "Could not save the new password. Try again." };
        case "invalid_credentials":
          return { success: false as const, error: "Current password is incorrect." };
      }
    }

    return { success: true as const };
  });

const changeUsernameSchema = z.object({
  username: z.string().trim().min(1, "Enter a username."),
  currentPassword: z.string().min(1, "Enter your current password."),
});

/**
 * Change the admin username from the Settings page. Same bar as a password
 * change: a valid session plus re-verification of the current password. The
 * password hash is carried over untouched.
 */
export const changeUsernameFn = createServerFn({ method: "POST" })
  .validator(changeUsernameSchema)
  .handler(async ({ data, context }) => {
    const sessionToken = getCookie(ADMIN_SESSION_COOKIE);
    if (!sessionToken) throw redirect({ to: LOGOUT_REDIRECT });

    const session = await auth.validateSession(sessionToken, getApiEnv(context));
    if (!session.valid) throw redirect({ to: LOGOUT_REDIRECT });

    const result = await auth.changeUsername(
      data.username,
      data.currentPassword,
      getClientIp(),
      getApiEnv(context),
    );

    if (!result.success) {
      switch (result.reason) {
        case "rate_limited":
          return {
            success: false as const,
            error: "Too many attempts. Please wait 15 minutes and try again.",
          };
        case "invalid_username":
          return {
            success: false as const,
            error: `Use a username of ${auth.MIN_USERNAME_LENGTH}–${auth.MAX_USERNAME_LENGTH} characters.`,
          };
        case "server_error":
          return { success: false as const, error: "Could not save the username. Try again." };
        case "invalid_credentials":
          return { success: false as const, error: "Current password is incorrect." };
      }
    }

    return { success: true as const };
  });
