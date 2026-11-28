import type { MunicipalitySetup, MunicipalitySummary, UserSummary } from "@firstreach/contracts";
import type { MunicipalityOverview, MunicipalitySetupView } from "../../../application/ports/in/municipality-setup.js";
import type { User } from "../../../domain/access.js";

/** Domain → wire. The only place that knows both shapes. */

export const toMunicipalitySummary = (o: MunicipalityOverview): MunicipalitySummary => ({
  id: o.municipality.id,
  name: o.municipality.name,
  region: o.municipality.region,
  createdAt: o.municipality.createdAt.toISOString(),
  stepsDone: o.stepsDone,
  stepsTotal: o.stepsTotal,
  registeredPeople: o.registeredPeople,
});

export const toMunicipalitySetup = (v: MunicipalitySetupView): MunicipalitySetup => ({
  id: v.municipality.id,
  name: v.municipality.name,
  region: v.municipality.region,
  contact: v.municipality.contact,
  area: v.municipality.area ? { label: v.municipality.area.label, geometry: v.municipality.area.geometry } : null,
  steps: v.steps,
  substations: v.substations.map((s) => ({
    id: s.osmRef,
    osmRef: s.osmRef,
    name: s.name,
    voltagesKv: [...s.voltagesKv],
    operator: s.operator,
    location: s.location,
    dependentPeople: s.dependentPeople,
  })),
  register: {
    total: v.register.total,
    byDevice: v.register.byDevice,
    unlinked: v.register.unlinked,
    importedAt: v.register.importedAt?.toISOString() ?? null,
  },
  permissions: v.permissions,
});

export const toUserSummary = (u: User): UserSummary => ({
  id: u.id,
  name: u.name,
  organisation: u.organisation,
  roles: u.grants.map((g) => ({ role: g.role, municipalityId: g.municipalityId })),
});
