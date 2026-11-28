import "server-only";
import { cookies } from "next/headers";

/** The API session lives in an httpOnly cookie: page scripts can't read it, and it never reaches a URL. */
const COOKIE = "fr_session";

export const readSessionToken = async () => (await cookies()).get(COOKIE)?.value ?? null;

/** Call only from a Server Action or Route Handler (Next.js allows cookie writes there). */
export const writeSessionToken = async (token: string, expiresAt: Date) =>
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

export const clearSessionToken = async () => (await cookies()).delete(COOKIE);
