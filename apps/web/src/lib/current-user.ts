import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { api } from "./api-client";

/**
 * The signed-in user, fetched once per request (layout and page share it).
 * No valid session: go to sign-in. Other failures are returned so the page can show them.
 */
export const getCurrentUser = cache(async () => {
  const result = await api.me();
  if (!result.ok && result.error.code === "unauthenticated") redirect("/sign-in");
  return result;
});
