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
