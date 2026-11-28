import type { AlertDetail, AlertSummaryList, MunicipalitySetup, MunicipalitySummary, SignalRunReport, SignalSummary, UserSummary } from "@firstreach/contracts";
import type { AlertView, SignalRunReport as RunReport } from "../../../application/ports/in/alerts.js";
import type { Alert } from "../../../domain/alert.js";
import type { HazardSignal } from "../../../domain/hazard-signal.js";
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

const iso = (d: Date | null) => (d ? d.toISOString() : null);

export const toSignalSummary = (s: HazardSignal): SignalSummary => ({
  id: s.id,
  sourceId: s.sourceId,
  label: s.provenance.label,
  kind: s.kind,
  stage: s.stage,
  issuedAt: s.issuedAt.toISOString(),
  expectedAt: iso(s.expectedAt),
  confidence: s.confidence,
  euSpace: s.provenance.euSpace,
  url: s.provenance.url ?? null,
  area: s.area as SignalSummary["area"],
});

export const toAlertDetail = (v: AlertView): AlertDetail => ({
  id: v.alert.id,
  municipalityId: v.alert.municipalityId,
  municipalityName: v.municipalityName,
  status: v.alert.status,
  openedAt: v.alert.openedAt.toISOString(),
  updatedAt: v.alert.updatedAt.toISOString(),
  sealed: v.sealed,
  signals: v.signals.map(toSignalSummary),
  substations: v.alert.substations.map((s) => ({ osmRef: s.osmRef, hoursUntilOutage: s.hoursUntilOutage })),
  people: v.people.map((p) => ({
    personId: p.personId, rank: p.rank, substationRef: p.substationRef, device: p.device, backupHours: p.backupHours,
    hoursUntilOutage: p.hoursUntilOutage, hoursLeft: p.hoursLeft, livesAlone: p.livesAlone, mobility: p.mobility,
    floor: p.floor, homeInZone: p.homeInZone, reason: p.reason, details: p.details,
  })),
});

export const toAlertSummaryList = (alerts: Alert[]): AlertSummaryList => ({
  items: alerts.map((a) => ({
    id: a.id, status: a.status, openedAt: a.openedAt.toISOString(), updatedAt: a.updatedAt.toISOString(),
    people: a.people.length, substations: a.substations.length,
  })),
});

export const toSignalRunReport = (r: RunReport): SignalRunReport => ({ ...r, at: r.at.toISOString() });

