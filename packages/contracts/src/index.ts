import { z } from "zod";

/**
 * Wire contracts shared by the API (producer) and the web app (consumer).
 * Only data shapes live here — no business rules.
 */

// ---------- geometry (GeoJSON, WGS84) ----------
const Position = z.tuple([z.number(), z.number()]);
const Ring = z.array(Position).min(4);

export const Area = z.discriminatedUnion("type", [
  z.object({ type: z.literal("Polygon"), coordinates: z.array(Ring).min(1) }),
  z.object({ type: z.literal("MultiPolygon"), coordinates: z.array(z.array(Ring).min(1)).min(1) }),
]);
export type Area = z.infer<typeof Area>;

export const LngLat = z.object({ lng: z.number(), lat: z.number() });
export type LngLat = z.infer<typeof LngLat>;

// ---------- errors ----------
export const ApiError = z.object({
  error: z.object({
    code: z.enum(["validation_failed", "unauthenticated", "forbidden", "not_found", "upstream_failed", "internal"]),
    message: z.string(),
    fields: z.record(z.string(), z.string()).optional(),
  }),
});
export type ApiError = z.infer<typeof ApiError>;

// ---------- access ----------
export const Role = z.enum(["regional_admin", "grid_operator", "municipality_officer"]);
export type Role = z.infer<typeof Role>;

/** A role the user holds; officers' grants name their municipality. One user can hold several. */
export const RoleGrant = z.object({ role: Role, municipalityId: z.string().nullable() });
export type RoleGrant = z.infer<typeof RoleGrant>;

export const UserSummary = z.object({
  id: z.string(),
  name: z.string(),
  organisation: z.string(),
  roles: z.array(RoleGrant),
});
export type UserSummary = z.infer<typeof UserSummary>;

export const UserList = z.object({ items: z.array(UserSummary) });
export type UserList = z.infer<typeof UserList>;

export const DemoSignInRequest = z.object({ userId: z.string() });
export type DemoSignInRequest = z.infer<typeof DemoSignInRequest>;

/** Bearer token for the API. The web app keeps it in an httpOnly cookie. */
export const Session = z.object({ token: z.string(), expiresAt: z.iso.datetime() });
export type Session = z.infer<typeof Session>;

export const Me = z.object({
  user: UserSummary,
  permissions: z.object({ createMunicipality: z.boolean() }),
});
export type Me = z.infer<typeof Me>;

// ---------- municipalities ----------
export const AlertContact = z.object({
  name: z.string(),
  phone: z.string(),
  email: z.string().nullable(),
});
export type AlertContact = z.infer<typeof AlertContact>;

export const CreateMunicipalityRequest = z.object({
  name: z.string(),
  region: z.string(),
  contact: z.object({
    name: z.string(),
    phone: z.string(),
    email: z.string().optional(),
  }),
});
export type CreateMunicipalityRequest = z.infer<typeof CreateMunicipalityRequest>;

export const SetupStepId = z.enum(["details", "area", "substations", "register"]);
export type SetupStepId = z.infer<typeof SetupStepId>;

export const SetupStep = z.object({
  id: SetupStepId,
  status: z.enum(["done", "ready", "blocked"]),
});
export type SetupStep = z.infer<typeof SetupStep>;

export const MunicipalitySummary = z.object({
  id: z.string(),
  name: z.string(),
  region: z.string(),
  createdAt: z.iso.datetime(),
  stepsDone: z.number().int(),
  stepsTotal: z.number().int(),
  registeredPeople: z.number().int(),
});
export type MunicipalitySummary = z.infer<typeof MunicipalitySummary>;

export const MunicipalityList = z.object({ items: z.array(MunicipalitySummary) });
export type MunicipalityList = z.infer<typeof MunicipalityList>;

export const Substation = z.object({
  id: z.string(),
  osmRef: z.string(),
  name: z.string().nullable(),
  voltagesKv: z.array(z.number()),
  operator: z.string().nullable(),
  location: LngLat,
  dependentPeople: z.number().int(),
});
export type Substation = z.infer<typeof Substation>;

/** Counts only: names stay sealed until an alert opens them. */
export const RegisterSummary = z.object({
  total: z.number().int(),
  byDevice: z.object({
    ventilator: z.number().int(),
    oxygen_concentrator: z.number().int(),
    other: z.number().int(),
  }),
  unlinked: z.number().int(),
  importedAt: z.iso.datetime().nullable(),
});
export type RegisterSummary = z.infer<typeof RegisterSummary>;

export const MunicipalitySetup = z.object({
  id: z.string(),
  name: z.string(),
  region: z.string(),
  contact: AlertContact,
  area: z.object({ label: z.string(), geometry: Area }).nullable(),
  steps: z.array(SetupStep),
  substations: z.array(Substation),
  register: RegisterSummary,
  /** What the signed-in user may change here. The API enforces it; the UI uses it to hide what won't work. */
  permissions: z.object({ setup: z.boolean(), uploadRegister: z.boolean() }),
});
export type MunicipalitySetup = z.infer<typeof MunicipalitySetup>;

export const CreatedMunicipality = z.object({ id: z.string() });
export type CreatedMunicipality = z.infer<typeof CreatedMunicipality>;

// ---------- area (boundary) lookup ----------
export const AreaCandidate = z.object({
  ref: z.string(), // OSM reference, e.g. "R438466"
  label: z.string(),
  kind: z.string(),
  geometry: Area,
});
export type AreaCandidate = z.infer<typeof AreaCandidate>;

export const AreaCandidateList = z.object({ items: z.array(AreaCandidate) });
export type AreaCandidateList = z.infer<typeof AreaCandidateList>;

export const SetAreaRequest = z.object({ ref: z.string() });
export type SetAreaRequest = z.infer<typeof SetAreaRequest>;

// ---------- imports ----------
export const SubstationImportResult = z.object({
  found: z.number().int(),
  linkedPeople: z.number().int(),
});
export type SubstationImportResult = z.infer<typeof SubstationImportResult>;

export const RejectedRow = z.object({
  row: z.number().int(), // 1-based data row (header excluded)
  field: z.string(),
  message: z.string(),
});
export type RejectedRow = z.infer<typeof RejectedRow>;

export const RegisterImportResult = z.object({
  imported: z.number().int(),
  rejected: z.array(RejectedRow),
});
export type RegisterImportResult = z.infer<typeof RegisterImportResult>;

// ---------- register file format ----------
/**
 * The CSV the grid operator uploads (PUT /municipalities/:id/register): one person per row, a header row first.
 * The API's parser (domain/register-row.ts) must accept exactly these columns; a test keeps the two in sync.
 */
export type RegisterColumn = { name: string; required: boolean; rule: string; example: string };

export const REGISTER_DEVICES = ["ventilator", "oxygen_concentrator", "other"] as const;
export const REGISTER_MOBILITY = ["independent", "limited", "bedridden"] as const;

export const REGISTER_FORMAT: readonly RegisterColumn[] = [
  { name: "external_ref", required: true, rule: "The grid operator's ID for the person. Unique in the file.", example: "CEZ-VZ-001" },
  { name: "full_name", required: true, rule: "Full name.", example: "Jan Dvořák" },
  { name: "address", required: true, rule: "Supply address.", example: "Dlouhá 21, 794 01 Krnov" },
  { name: "lat", required: true, rule: "Latitude of the address, decimal degrees. Must be inside the municipality.", example: "50.081031" },
  { name: "lon", required: true, rule: "Longitude of the address, decimal degrees.", example: "17.666429" },
  { name: "device", required: true, rule: `One of: ${REGISTER_DEVICES.join(", ")}.`, example: "ventilator" },
  { name: "backup_hours", required: true, rule: "Hours the device runs on its battery. 0 or more.", example: "3.5" },
  { name: "lives_alone", required: true, rule: "yes or no.", example: "yes" },
  { name: "floor", required: true, rule: "Whole number. 0 is the ground floor.", example: "2" },
  { name: "mobility", required: true, rule: `One of: ${REGISTER_MOBILITY.join(", ")}.`, example: "limited" },
  { name: "phone", required: true, rule: "Phone number with country code.", example: "+420 000 000 001" },
  { name: "carer_name", required: false, rule: "Who to call if the person can't answer.", example: "Věra Nováková" },
  { name: "carer_phone", required: false, rule: "The carer's phone number.", example: "+420 000 100 002" },
];

// ---------- signals and alerts (Flow 2, read side of Flow 3) ----------
export const SignalSummary = z.object({
  id: z.string(),
  sourceId: z.string(),
  label: z.string(),
  kind: z.enum(["flood", "power_outage", "storm", "fire"]),
  stage: z.enum(["forecast", "observed"]),
  issuedAt: z.iso.datetime(),
  expectedAt: z.iso.datetime().nullable(),
  confidence: z.enum(["low", "medium", "high"]),
  euSpace: z.enum(["copernicus", "galileo"]).nullable(),
  url: z.string().nullable(),
  area: Area,
});
export type SignalSummary = z.infer<typeof SignalSummary>;

/** Present only when the unsealing policy allows this viewer to see the person. */
export const PersonDetails = z.object({
  fullName: z.string(),
  address: z.string(),
  phone: z.string(),
  carerName: z.string().nullable(),
  carerPhone: z.string().nullable(),
  location: LngLat,
  externalRef: z.string(),
});
export type PersonDetails = z.infer<typeof PersonDetails>;

export const AlertPerson = z.object({
  personId: z.string(),
  rank: z.number().int(),
  substationRef: z.string(),
  device: z.enum(["ventilator", "oxygen_concentrator", "other"]),
  backupHours: z.number(),
  hoursUntilOutage: z.number(),
  hoursLeft: z.number(),
  livesAlone: z.boolean(),
  mobility: z.enum(["independent", "limited", "bedridden"]),
  floor: z.number().int(),
  homeInZone: z.boolean(),
  reason: z.string(),
  details: PersonDetails.nullable(),
});
export type AlertPerson = z.infer<typeof AlertPerson>;

export const AlertDetail = z.object({
  id: z.string(),
  municipalityId: z.string(),
  municipalityName: z.string(),
  status: z.enum(["active", "closed"]),
  openedAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  /** True when this viewer sees no names (counts and ranks only). */
  sealed: z.boolean(),
  signals: z.array(SignalSummary),
  substations: z.array(z.object({ osmRef: z.string(), hoursUntilOutage: z.number() })),
  people: z.array(AlertPerson),
});
export type AlertDetail = z.infer<typeof AlertDetail>;

export const AlertSummary = z.object({
  id: z.string(),
  status: z.enum(["active", "closed"]),
  openedAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  people: z.number().int(),
  substations: z.number().int(),
});
export const AlertSummaryList = z.object({ items: z.array(AlertSummary) });
export type AlertSummaryList = z.infer<typeof AlertSummaryList>;

export const RunSignalsRequest = z.object({ at: z.iso.datetime() });
export type RunSignalsRequest = z.infer<typeof RunSignalsRequest>;

export const SignalRunReport = z.object({
  at: z.iso.datetime(),
  sources: z.array(z.object({ sourceId: z.string(), signals: z.number().int(), error: z.string().nullable() })),
  alerts: z.array(z.object({
    municipalityId: z.string(), alertId: z.string(), people: z.number().int(), substations: z.number().int(), opened: z.boolean(),
  })),
});
export type SignalRunReport = z.infer<typeof SignalRunReport>;

