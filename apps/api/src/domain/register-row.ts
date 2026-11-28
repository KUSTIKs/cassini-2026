import type { LngLat } from "./geo.js";
import { DEVICES, MOBILITY, type Device, type Mobility, type RegisteredPerson } from "./registered-person.js";

/** The register's column names, as the grid operator exports them. */
export const REGISTER_COLUMNS = [
  "external_ref", "full_name", "address", "lat", "lon", "device", "backup_hours",
  "lives_alone", "floor", "mobility", "phone", "carer_name", "carer_phone",
] as const;

export type RawRegisterRow = Partial<Record<(typeof REGISTER_COLUMNS)[number], string>>;
export type RowProblem = { row: number; field: string; message: string };
export type ParsedPerson = Omit<RegisteredPerson, "id" | "substationRef">;

const text = (v: string | undefined) => v?.trim() ?? "";
const oneOf = <T extends string>(values: readonly T[], v: string): T | null =>
  (values as readonly string[]).includes(v) ? (v as T) : null;
const BOOL: Record<string, boolean> = { yes: true, true: true, "1": true, no: false, false: false, "0": false };

/** Parses one CSV row. Returns the person, or every problem found in the row. */
export const parseRegisterRow = (
  raw: RawRegisterRow,
  row: number,
): { ok: true; person: ParsedPerson } | { ok: false; problems: RowProblem[] } => {
  const problems: RowProblem[] = [];
  const fail = (field: string, message: string) => problems.push({ row, field, message });

  const externalRef = text(raw.external_ref);
  const fullName = text(raw.full_name);
  const address = text(raw.address);
  const phone = text(raw.phone);
  const lat = Number(text(raw.lat));
  const lng = Number(text(raw.lon));
  const device = oneOf<Device>(DEVICES, text(raw.device));
  const mobility = oneOf<Mobility>(MOBILITY, text(raw.mobility));
  const backupHours = Number(text(raw.backup_hours));
  const floor = Number(text(raw.floor));
  const livesAlone = BOOL[text(raw.lives_alone).toLowerCase()];

  if (!externalRef) fail("external_ref", "Missing reference.");
  if (!fullName) fail("full_name", "Missing name.");
  if (!address) fail("address", "Missing address.");
  if (!phone) fail("phone", "Missing phone.");
  if (!text(raw.lat) || !Number.isFinite(lat) || lat < -90 || lat > 90) fail("lat", "Latitude must be a number between -90 and 90.");
  if (!text(raw.lon) || !Number.isFinite(lng) || lng < -180 || lng > 180) fail("lon", "Longitude must be a number between -180 and 180.");
  if (!device) fail("device", `Use one of: ${DEVICES.join(", ")}.`);
  if (!mobility) fail("mobility", `Use one of: ${MOBILITY.join(", ")}.`);
  if (!text(raw.backup_hours) || !Number.isFinite(backupHours) || backupHours < 0) fail("backup_hours", "Backup hours must be 0 or more.");
  if (!text(raw.floor) || !Number.isInteger(floor)) fail("floor", "Floor must be a whole number (0 = ground floor).");
  if (livesAlone === undefined) fail("lives_alone", "Use yes or no.");

  if (problems.length > 0 || !device || !mobility || livesAlone === undefined) return { ok: false, problems };

  const location: LngLat = { lng, lat };
  return {
    ok: true,
    person: {
      externalRef, fullName, address, location, phone, backupHours, floor, device, mobility, livesAlone,
      carerName: text(raw.carer_name) || null,
      carerPhone: text(raw.carer_phone) || null,
    },
  };
};
