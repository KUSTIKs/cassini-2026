"use server";

import type { Bring, ContactState } from "@firstreach/contracts";
import { revalidatePath } from "next/cache";
import { api } from "@/lib/api-client";

export type StatusFormState = { error: string | null; fields: Record<string, string>; savedAt: string | null };

const STATES = ["reached_ok", "away", "needs_help", "not_reached"] as const;
const BRINGABLE = ["generator", "oxygen", "transport"] as const;

/** Records a call outcome. The API checks the unsealing policy and logs the change. */
export const setContactStatusAction = async (
  alertId: string,
  personId: string,
  _previous: StatusFormState,
  form: FormData,
): Promise<StatusFormState> => {
  const state = String(form.get("state") ?? "") as Exclude<ContactState, "not_contacted">;
  if (!STATES.includes(state)) return { error: "Choose how the call went.", fields: { state: "Choose one." }, savedAt: null };
  const bring = form.getAll("bring").map(String).filter((b): b is Exclude<Bring, "door_check"> => (BRINGABLE as readonly string[]).includes(b));
  const note = String(form.get("note") ?? "").trim() || null;

  const result = await api.setContactStatus(alertId, personId, { state, ...(state === "needs_help" ? { bring } : {}), note });
  if (!result.ok) return { error: result.error.message, fields: result.error.fields ?? {}, savedAt: null };
  revalidatePath(`/alerts/${alertId}`);
  return { error: null, fields: {}, savedAt: new Date().toISOString() };
};
