import type { AlertPerson, Bring, ContactState } from "@firstreach/contracts";

/** Words and formats for the alert screens. One place, so the list, panel and print agree. */

export const STATE_LABEL: Record<ContactState, string> = {
  not_contacted: "Not contacted",
  reached_ok: "Reached, OK",
  away: "Away",
  needs_help: "Needs help",
  not_reached: "Not reached",
};

export const BRING_LABEL: Record<Bring, string> = {
  generator: "Generator",
  oxygen: "Oxygen",
  transport: "Transport",
  door_check: "Door check",
};

export const DEVICE_LABEL: Record<AlertPerson["device"], string> = {
  ventilator: "Ventilator",
  oxygen_concentrator: "Oxygen concentrator",
  other: "Powered medical device",
};

export const MOBILITY_LABEL: Record<AlertPerson["mobility"], string> = {
  independent: "Moves independently",
  limited: "Limited mobility",
  bedridden: "Bedridden",
};

/** How urgent, from hours until the device stops. Drives colour in the list and on the map. */
export type Urgency = "critical" | "soon" | "later";
export const urgencyOf = (hoursLeft: number): Urgency => (hoursLeft <= 12 ? "critical" : hoursLeft <= 36 ? "soon" : "later");

export const hours = (h: number) => (h < 1 ? `${Math.round(h * 60)} min` : `${Math.round(h * 10) / 10} h`);

/** Times are shown in Czech local time, where the people and the mayor are. */
const dateTime = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Prague" });
export const when = (iso: string) => dateTime.format(new Date(iso));

/** Shown instead of a name when the viewer's role keeps names sealed. */
export const sealedName = (rank: number) => `Person #${rank}`;
