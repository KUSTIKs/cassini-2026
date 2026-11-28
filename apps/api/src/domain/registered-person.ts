import type { LngLat } from "./geo.js";

export const DEVICES = ["ventilator", "oxygen_concentrator", "other"] as const;
export type Device = (typeof DEVICES)[number];

export const MOBILITY = ["independent", "limited", "bedridden"] as const;
export type Mobility = (typeof MOBILITY)[number];

/** One entry of the grid operator's vulnerable-customer register. */
export type RegisteredPerson = {
  readonly id: string;
  readonly externalRef: string;
  readonly fullName: string;
  readonly address: string;
  readonly location: LngLat;
  readonly device: Device;
  readonly backupHours: number;
  readonly livesAlone: boolean;
  readonly floor: number;
  readonly mobility: Mobility;
  readonly phone: string;
  readonly carerName: string | null;
  readonly carerPhone: string | null;
  readonly substationRef: string | null;
};
