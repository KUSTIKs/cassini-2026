"use server";

import { redirect } from "next/navigation";
import { api } from "@/lib/api-client";

export type CreateMunicipalityState = {
  message: string | null;
  fields: Record<string, string>;
  /** Echoed back so the form keeps what the user typed (React resets forms after an action). */
  values: Record<string, string>;
};

export const createMunicipalityAction = async (
  _previous: CreateMunicipalityState,
  form: FormData,
): Promise<CreateMunicipalityState> => {
  const values = {
    name: String(form.get("name") ?? ""),
    region: String(form.get("region") ?? ""),
    "contact.name": String(form.get("contact.name") ?? ""),
    "contact.phone": String(form.get("contact.phone") ?? ""),
    "contact.email": String(form.get("contact.email") ?? ""),
  };

  const result = await api.createMunicipality({
    name: values.name,
    region: values.region,
    contact: {
      name: values["contact.name"],
      phone: values["contact.phone"],
      ...(values["contact.email"] ? { email: values["contact.email"] } : {}),
    },
  });

  if (!result.ok) return { message: result.error.message, fields: result.error.fields ?? {}, values };
  // Next step of the flow: define the area.
  redirect(`/municipalities/${result.data.id}?step=area`);
};
