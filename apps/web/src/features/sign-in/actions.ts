"use server";

import { redirect } from "next/navigation";
import { api } from "@/lib/api-client";
import { clearSessionToken, writeSessionToken } from "@/lib/session";

export type SignInState = { error: string | null };

export const demoSignInAction = async (userId: string): Promise<SignInState> => {
  const result = await api.demoSignIn(userId);
  if (!result.ok) return { error: result.error.message };
  await writeSessionToken(result.data.token, new Date(result.data.expiresAt));
  redirect("/");
};

export const signOutAction = async () => {
  await clearSessionToken();
  redirect("/sign-in");
};
