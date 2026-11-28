import type { Municipality } from "./municipality.js";

/**
 * Who can do what. The whole access policy lives here, as pure functions, so every use case
 * enforces the same rules and the web app only renders what the API says is allowed.
 *
 * A person holds one or more role grants. A grant is a role, plus the municipality it applies to
 * for officers. One duty officer can cover several municipalities (in Czechia, crisis staff of an
 * extended-powers municipality cover the villages around it), and one person can hold different roles.
 *
 * regional_admin        runs FirstReach for a region: creates municipalities and sets them up.
 * grid_operator         holds the vulnerable-customer register: uploads it for any municipality.
 * municipality_officer  mayor or flood duty officer: sees the municipality the grant names.
 */
export const ROLES = ["regional_admin", "grid_operator", "municipality_officer"] as const;
export type Role = (typeof ROLES)[number];

export type RoleGrant =
  | { readonly role: "regional_admin" | "grid_operator"; readonly municipalityId: null }
  | { readonly role: "municipality_officer"; readonly municipalityId: string };

export type User = {
  readonly id: string;
  readonly name: string;
  readonly email: string | null;
  readonly organisation: string;
  readonly grants: readonly RoleGrant[];
};

export type Permission =
  | "municipality.create"
  | "municipality.view"
  | "municipality.setup" // area, substations
  | "register.upload";

const grantAllows = (grant: RoleGrant, permission: Permission, municipalityId?: string): boolean => {
  switch (grant.role) {
    case "regional_admin":
      return true;
    case "grid_operator":
      return permission === "municipality.view" || permission === "register.upload";
    case "municipality_officer":
      return permission === "municipality.view" && municipalityId === grant.municipalityId;
  }
};

/** Allowed if any of the user's grants allows it. */
export const can = (user: User, permission: Permission, municipalityId?: string): boolean =>
  user.grants.some((grant) => grantAllows(grant, permission, municipalityId));

export const sameGrant = (a: RoleGrant, b: RoleGrant) => a.role === b.role && a.municipalityId === b.municipalityId;

export const officerGrant = (municipalityId: string): RoleGrant => ({ role: "municipality_officer", municipalityId });

/**
 * Creating a municipality invites its alert contact as an officer. In production they get an email
 * with a one-time link and sign in through NIA; in the demo they appear on the sign-in screen.
 */
export const officerFor = (municipality: Municipality, id: string): User => ({
  id,
  name: municipality.contact.name,
  email: municipality.contact.email,
  organisation: `Municipality of ${municipality.name}`,
  grants: [officerGrant(municipality.id)],
});
