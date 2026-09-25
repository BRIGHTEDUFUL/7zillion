/**
 * Admin-auth contract — the single source of truth shared by the browser, the
 * server functions and the auth service.
 *
 * Everything that has to stay in sync between frontend and backend lives here:
 * the session cookie, the credential rules, the rate-limit window, the
 * user-facing messages, and the zod schemas both sides validate with.
 *
 * This module is imported by client components, so it must stay client-safe:
 * no `server-only` import, no Node APIs.
 */

import { z } from "zod";

// ──────────────────────────────────────────────────────────────────────────────
// Cookie & session
// ──────────────────────────────────────────────────────────────────────────────

export const SESSION_COOKIE_NAME = "admin_session";
export const SESSION_TTL_SECONDS = 8 * 60 * 60;
export const SESSION_TTL_MS = SESSION_TTL_SECONDS * 1000;

// ──────────────────────────────────────────────────────────────────────────────
// Credential rules
// ──────────────────────────────────────────────────────────────────────────────

export const MIN_PASSWORD_LENGTH = 8;
export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 64;

// ──────────────────────────────────────────────────────────────────────────────
// Rate limiting — failed credential attempts only (successful sign-ins and
// Settings changes never spend the budget)
// ──────────────────────────────────────────────────────────────────────────────

export const RATE_LIMIT_MAX_REQUESTS = 10;
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const RATE_LIMIT_WINDOW_MINUTES = RATE_LIMIT_WINDOW_MS / 60_000;

// ──────────────────────────────────────────────────────────────────────────────
// Result contract
//
// Every auth server function resolves to this shape, so the client only ever
// does two things: show `message`, or branch on `code`. No string sniffing.
// ──────────────────────────────────────────────────────────────────────────────

export type AuthErrorCode =
  /** Sign-in rejected. Never says which field was wrong. */
  | "invalid_credentials"
  /** Settings: the re-entered current password is wrong. */
  | "wrong_password"
  /** Settings: new username outside the allowed length. */
  | "invalid_username"
  /** Settings: new password below the minimum length. */
  | "weak_password"
  /** Too many failed attempts from this IP in the current window. */
  | "rate_limited"
  /** An authenticated call was made without a valid session. */
  | "session_expired"
  /** Server-side failure (Convex unreachable, session could not be saved). */
  | "server_error";

export type AuthSuccess = { ok: true };
export type AuthFailure = { ok: false; code: AuthErrorCode; message: string };
export type AuthResult = AuthSuccess | AuthFailure;

export const AUTH_MESSAGES: Record<AuthErrorCode, string> = {
  invalid_credentials: "Incorrect username or password.",
  wrong_password: "Current password is incorrect.",
  invalid_username: `Use a username of ${MIN_USERNAME_LENGTH}–${MAX_USERNAME_LENGTH} characters.`,
  weak_password: `Use a password of at least ${MIN_PASSWORD_LENGTH} characters.`,
  rate_limited: `Too many failed attempts. Please wait ${RATE_LIMIT_WINDOW_MINUTES} minutes and try again.`,
  session_expired: "Your session has expired. Please sign in again.",
  server_error: "The service is temporarily unavailable. Please try again in a moment.",
};

/** Build the standard failure for a code (attaches the shared message). */
export function fail(code: AuthErrorCode): AuthFailure {
  return { ok: false, code, message: AUTH_MESSAGES[code] };
}

/** Shown when a server function throws instead of returning (rare: network). */
export const REQUEST_FAILED_MESSAGE = "Could not complete the request. Please try again.";

// ──────────────────────────────────────────────────────────────────────────────
// Validation schemas — one definition, used by both the react-hook-form
// resolvers in the admin pages and the server-function validators.
// ──────────────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Enter your username."),
  password: z.string().min(1, "Enter your password."),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z
      .string()
      .min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters.`),
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export const changeUsernameSchema = z.object({
  username: z
    .string()
    .trim()
    .min(MIN_USERNAME_LENGTH, `Use at least ${MIN_USERNAME_LENGTH} characters.`)
    .max(MAX_USERNAME_LENGTH, `Use at most ${MAX_USERNAME_LENGTH} characters.`),
  currentPassword: z.string().min(1, "Enter your current password."),
});
export type ChangeUsernameValues = z.infer<typeof changeUsernameSchema>;
