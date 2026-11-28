"use server";

import type { AreaCandidate, RegisterImportResult, SubstationImportResult } from "@firstreach/contracts";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api } from "@/lib/api-client";

/**
 * Server Actions for Flow 1. Each one is bound to a municipality id by the caller
 * (`action.bind(null, id)`) and used with useActionState, which runs submissions in order.
 */

const pathOf = (id: string) => `/municipalities/${id}`;

// ---------- area ----------
export type AreaSearchState = { query: string; items: AreaCandidate[] | null; error: string | null };

export const searchAreasAction = async (_previous: AreaSearchState, form: FormData): Promise<AreaSearchState> => {
  const query = String(form.get("query") ?? "").trim();
  const result = await api.searchAreas(query);
  if (!result.ok) return { query, items: null, error: result.error.fields?.query ?? result.error.message };
  return { query, items: result.data.items, error: null };
};

export type SetAreaState = { error: string | null };

export const setAreaAction = async (municipalityId: string, _previous: SetAreaState, form: FormData): Promise<SetAreaState> => {
  const result = await api.setArea(municipalityId, String(form.get("ref") ?? ""));
  if (!result.ok) return { error: result.error.message };
  revalidatePath(pathOf(municipalityId));
  redirect(`${pathOf(municipalityId)}?step=substations`);
};

// ---------- substations ----------
export type SubstationImportState = { result: SubstationImportResult | null; error: string | null };

export const importSubstationsAction = async (municipalityId: string): Promise<SubstationImportState> => {
  const result = await api.importSubstations(municipalityId);
  if (!result.ok) return { result: null, error: result.error.message };
  revalidatePath(pathOf(municipalityId));
  return { result: result.data, error: null };
};

// ---------- register ----------
export type RegisterImportState = { result: RegisterImportResult | null; error: string | null; fileName: string | null };

const MAX_BYTES = 2 * 1024 * 1024;

export const importRegisterAction = async (
  municipalityId: string,
  _previous: RegisterImportState,
  form: FormData,
): Promise<RegisterImportState> => {
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { result: null, fileName: null, error: "Choose a CSV file first." };
  if (file.size > MAX_BYTES) return { result: null, fileName: file.name, error: "The file is larger than 2 MB." };

  const result = await api.importRegister(municipalityId, await file.text());
  if (!result.ok) return { result: null, fileName: file.name, error: result.error.fields?.file ?? result.error.message };
  revalidatePath(pathOf(municipalityId));
  return { result: result.data, fileName: file.name, error: null };
};
