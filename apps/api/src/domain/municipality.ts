import { DomainValidationError } from "./errors.js";
import type { Area } from "./geo.js";

export type AlertContact = {
  readonly name: string;
  readonly phone: string;
  readonly email: string | null;
};

export type MunicipalityArea = { readonly label: string; readonly osmRef: string; readonly geometry: Area };

export type Municipality = {
  readonly id: string;
  readonly name: string;
  readonly region: string;
  readonly contact: AlertContact;
  readonly area: MunicipalityArea | null;
  readonly createdAt: Date;
};

export type NewMunicipalityInput = {
  name: string;
  region: string;
  contact: { name: string; phone: string; email?: string | undefined };
};

const PHONE = /^\+?[0-9 ]{9,16}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const createMunicipality = (
  input: NewMunicipalityInput,
  { id, now }: { id: string; now: Date },
): Municipality => {
  const name = input.name.trim();
  const region = input.region.trim();
  const contactName = input.contact.name.trim();
  const phone = input.contact.phone.trim();
  const email = input.contact.email?.trim() || null;

  const fields: Record<string, string> = {};
  if (!name) fields.name = "Enter the municipality's name.";
  if (!region) fields.region = "Enter the region.";
  if (!contactName) fields["contact.name"] = "Enter who receives flood alerts.";
  if (!PHONE.test(phone)) fields["contact.phone"] = "Enter a phone number, for example +420 777 123 456.";
  if (email && !EMAIL.test(email)) fields["contact.email"] = "Enter a valid email address or leave it empty.";
  if (Object.keys(fields).length > 0) throw new DomainValidationError("Some details are missing or invalid.", fields);

  return { id, name, region, contact: { name: contactName, phone, email }, area: null, createdAt: now };
};
