import type { Role, UserSummary } from "@firstreach/contracts";

export const ROLE_LABEL: Record<Role, string> = {
  regional_admin: "Regional admin",
  grid_operator: "Grid operator",
  municipality_officer: "Municipality officer",
};

/** One line on what each role is for, shown where people pick a role. */
export const ROLE_PURPOSE: Record<Role, string> = {
  regional_admin: "Sets up municipalities for the region.",
  grid_operator: "Uploads the vulnerable-customer register.",
  municipality_officer: "Mayor or flood duty officer. Sees their own municipality.",
};

export const ROLE_ORDER: readonly Role[] = ["regional_admin", "grid_operator", "municipality_officer"];

/** The municipalities a user's officer grants name, in grant order. */
export const officerMunicipalities = (user: UserSummary): string[] =>
  user.roles.flatMap((r) => (r.role === "municipality_officer" && r.municipalityId ? [r.municipalityId] : []));

/** True when the user only holds officer grants, so their world is just their municipalities. */
export const isOfficerOnly = (user: UserSummary) =>
  user.roles.length > 0 && user.roles.every((r) => r.role === "municipality_officer");

/** The most powerful role, used to group people on the sign-in screen. */
export const primaryRole = (user: UserSummary): Role | null => ROLE_ORDER.find((role) => user.roles.some((r) => r.role === role)) ?? null;

/** "Regional admin", "Municipality officer · 3 municipalities", "Grid operator · Municipality officer". */
export const describeRoles = (user: UserSummary): string => {
  const officerCount = officerMunicipalities(user).length;
  return ROLE_ORDER.filter((role) => user.roles.some((r) => r.role === role))
    .map((role) => (role === "municipality_officer" && officerCount > 1 ? `${ROLE_LABEL[role]} · ${officerCount} municipalities` : ROLE_LABEL[role]))
    .join(" · ");
};
