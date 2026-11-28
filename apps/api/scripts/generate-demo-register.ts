/**
 * Generates a SYNTHETIC vulnerable-customer register for Krnov (rules §8.8: no real people).
 * Addresses are placed on real Krnov streets (OSM) inside the real town boundary.
 * Deterministic: the same seed gives the same file.
 *
 *   pnpm --filter @firstreach/api demo:register
 */
import { readFileSync, writeFileSync } from "node:fs";
import { areaContains, type Area, type LngLat } from "../src/domain/geo.js";
import { REGISTER_COLUMNS } from "../src/domain/register-row.js";

const root = new URL("../../../", import.meta.url);
const boundary = JSON.parse(readFileSync(new URL("data/osm/krnov-boundary.geojson", root), "utf8")) as Area;
const streets = JSON.parse(readFileSync(new URL("data/osm/krnov-streets.overpass.json", root), "utf8")) as {
  elements: Array<{ tags: { name: string }; geometry: Array<{ lat: number; lon: number }> }>;
};

// mulberry32: tiny seeded PRNG
let seed = 20240912;
const random = () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)]!;
const between = (min: number, max: number) => min + random() * (max - min);
const chance = (p: number) => random() < p;

const FIRST = {
  f: ["Marie", "Jana", "Eva", "Hana", "Anna", "Věra", "Alena", "Libuše", "Jaroslava", "Zdeňka"],
  m: ["Jiří", "Josef", "Jan", "Petr", "Miroslav", "Zdeněk", "Karel", "Václav", "Stanislav", "Milan"],
};
const SURNAME = [
  ["Novák", "Nováková"], ["Svoboda", "Svobodová"], ["Dvořák", "Dvořáková"], ["Černý", "Černá"],
  ["Procházka", "Procházková"], ["Kučera", "Kučerová"], ["Veselý", "Veselá"], ["Horák", "Horáková"],
  ["Pokorný", "Pokorná"], ["Marek", "Marková"], ["Pospíšil", "Pospíšilová"], ["Kolář", "Kolářová"],
] as const;

const person = () => {
  const sex = chance(0.55) ? "f" : "m";
  const [male, female] = pick(SURNAME);
  return `${pick(FIRST[sex])} ${sex === "f" ? female : male}`;
};

/** A point on a real named street, inside the town boundary. */
const address = (): { street: string; location: LngLat } => {
  for (;;) {
    const way = pick(streets.elements);
    const node = pick(way.geometry);
    const location = { lng: node.lon + between(-0.0002, 0.0002), lat: node.lat + between(-0.0002, 0.0002) };
    if (areaContains(boundary, location)) return { street: way.tags.name, location };
  }
};

type Profile = { device: string; backup: [number, number] };
const PROFILES: Profile[] = [
  ...Array<Profile>(8).fill({ device: "ventilator", backup: [2, 8] }),
  ...Array<Profile>(16).fill({ device: "oxygen_concentrator", backup: [0, 10] }),
  ...Array<Profile>(6).fill({ device: "other", backup: [1, 12] }),
];

const csvCell = (v: string) => (/[",\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v);
const lines = [REGISTER_COLUMNS.join(",")];

PROFILES.forEach((profile, i) => {
  const n = String(i + 1).padStart(3, "0");
  const { street, location } = address();
  const hasCarer = chance(0.6);
  const row: Record<(typeof REGISTER_COLUMNS)[number], string> = {
    external_ref: `CEZ-VZ-${n}`,
    full_name: person(),
    address: `${street} ${Math.floor(between(1, 60))}, 794 01 Krnov`,
    lat: location.lat.toFixed(6),
    lon: location.lng.toFixed(6),
    device: profile.device,
    backup_hours: String(Math.round(between(...profile.backup) * 2) / 2),
    lives_alone: chance(0.4) ? "yes" : "no",
    floor: String(pick([0, 0, 0, 1, 1, 2, 3, 4])),
    mobility: pick(["independent", "limited", "limited", "bedridden"]),
    phone: `+420 000 000 ${n}`, // fictional: the 000 prefix is never assigned
    carer_name: hasCarer ? person() : "",
    carer_phone: hasCarer ? `+420 000 100 ${n}` : "",
  };
  lines.push(REGISTER_COLUMNS.map((c) => csvCell(row[c])).join(","));
});

// The canonical file, plus a copy the web app serves for download.
for (const path of ["data/demo/krnov-register.csv", "apps/web/public/demo/krnov-register.csv"]) {
  const out = new URL(path, root);
  writeFileSync(out, `${lines.join("\n")}\n`);
  console.log(`wrote ${PROFILES.length} synthetic people → ${out.pathname}`);
}
