import { readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { beforeAll, describe, expect, it } from "vitest";
import {
  InMemoryAlertRepository, InMemoryMunicipalityRepository, InMemoryRegisterRepository, InMemorySignalRepository,
  InMemorySubstationRepository, InMemoryUserRepository,
} from "../../adapters/out/memory/repositories.js";
import { parseOverpassSubstations } from "../../adapters/out/osm/overpass-substation-gateway.js";
import fixture from "../../adapters/out/signals/efas/fixtures/notifications-2024-09.json" with { type: "json" };
import { createEfasSource } from "../../adapters/out/signals/efas/index.js";
import { createGfmSource } from "../../adapters/out/signals/gfm/index.js";
import { officerGrant, type User } from "../../domain/access.js";
import type { Area } from "../../domain/geo.js";
import type { RawRegisterRow } from "../../domain/register-row.js";
import { CreateMunicipalityUseCase } from "./create-municipality.js";
import { GetAlertUseCase } from "./get-alert.js";
import { ImportRegisterUseCase } from "./import-register.js";
import { ImportSubstationsUseCase } from "./import-substations.js";
import { RunSignalsUseCase } from "./run-signals.js";
import { SetMunicipalityAreaUseCase } from "./set-municipality-area.js";

/**
 * The Krnov replay on real data: OSM boundary and substations, the official Q100 zone, the EFAS
 * notification for the Opava and the Sentinel-1 extent of 15 Sept 2024, plus the fictional register.
 */
const data = (path: string) => new URL(`../../../../../data/${path}`, import.meta.url).pathname;
const read = (path: string) => readFileSync(data(path), "utf8");

const admin: User = { id: "admin", name: "Admin", email: null, organisation: "Region", grants: [{ role: "regional_admin", municipalityId: null }] };
const grid: User = { id: "grid", name: "Grid", email: null, organisation: "ČEZ", grants: [{ role: "grid_operator", municipalityId: null }] };

describe("Flow 2 on the Krnov 2024 data", () => {
  let ids = 0;
  const newId = () => `00000000-0000-4000-8000-${String(++ids).padStart(12, "0")}`;
  const repos = {
    municipalities: new InMemoryMunicipalityRepository(),
    substations: new InMemorySubstationRepository(),
    register: new InMemoryRegisterRepository(),
    users: new InMemoryUserRepository(),
  };
  const signals = new InMemorySignalRepository();
  const alerts = new InMemoryAlertRepository();
  const sources = [
    createEfasSource({ zoneFiles: [data("flood/krnov-q100.geojson")], notifications: { url: fixture.url, items: fixture.notifications as never } }),
    createGfmSource({ files: [data("flood/opava-gfm-2024-09-15.geojson")] }),
  ];
  const run = new RunSignalsUseCase({ ...repos, sources, signals, alerts, newId });
  const getAlert = new GetAlertUseCase({ ...repos, alerts, signals });
  let krnovId = "";
  let officer: User;

  beforeAll(async () => {
    const clock = () => new Date("2024-09-01T00:00:00Z");
    krnovId = (await new CreateMunicipalityUseCase({ ...repos, clock, newId }).execute(admin, {
      name: "Krnov", region: "Moravian-Silesian", contact: { name: "Duty officer", phone: "+420 777 000 000" },
    })).id;
    const boundary = JSON.parse(read("osm/krnov-boundary.geojson")) as Area;
    const areas = { search: async () => [], getByRef: async () => ({ ref: "R439377", label: "Krnov", kind: "town", geometry: boundary }) };
    await new SetMunicipalityAreaUseCase({ ...repos, areas }).execute(admin, { municipalityId: krnovId, ref: "R439377" });
    const substationSource = { findInBBox: async () => parseOverpassSubstations(JSON.parse(read("osm/krnov-substations.overpass.json"))) };
    await new ImportSubstationsUseCase({ ...repos, substationSource }).execute(admin, krnovId);
    const rows: RawRegisterRow[] = parse(read("demo/krnov-register.csv"), { columns: true, skip_empty_lines: true });
    await new ImportRegisterUseCase({ ...repos, clock, newId }).execute(admin, { municipalityId: krnovId, rows });
    officer = (await repos.users.list()).find((u) => u.grants.some((g) => g.municipalityId === krnovId))!;
  });

  it("does nothing before the EFAS notification", async () => {
    const report = await run.execute(admin, { at: new Date("2024-09-11T12:00:00Z") });
    expect(report.alerts).toEqual([]);
  });

  it("opens an alert when EFAS warns about the Opava: the Krnov substations are in the zone, everyone behind them is ranked", async () => {
    const report = await run.execute(admin, { at: new Date("2024-09-12T12:00:00Z") });
    expect(report.sources).toEqual([{ sourceId: "efas", signals: 1, error: null }, { sourceId: "gfm", signals: 0, error: null }]);
    expect(report.alerts).toHaveLength(1);
    const alert = (await alerts.findActive(krnovId))!;
    expect(alert.substations.map((s) => s.osmRef).sort()).toEqual(expect.arrayContaining(["w55375417"]));
    expect(alert.substations.every((s) => s.hoursUntilOutage === 36)).toBe(true); // forecast 11 Sept 12 UTC + 60 h, seen at 12 Sept 12 UTC
    expect(alert.people.length).toBeGreaterThan(0);
    expect(alert.people.map((p) => p.hoursLeft)).toEqual([...alert.people.map((p) => p.hoursLeft)].sort((a, b) => a - b));
  });

  it("unseals names for the Krnov officer only", async () => {
    const alert = (await alerts.findActive(krnovId))!;
    const forOfficer = await getAlert.execute(officer, alert.id);
    expect(forOfficer.sealed).toBe(false);
    expect(forOfficer.people.every((p) => p.details?.fullName)).toBe(true);

    for (const viewer of [admin, grid]) {
      const view = await getAlert.execute(viewer, alert.id);
      expect(view.sealed).toBe(true);
      expect(view.people.every((p) => p.details === null)).toBe(true);
    }
    const otherTown: User = { ...officer, id: "x", grants: [officerGrant("someone-else")] };
    await expect(getAlert.execute(otherTown, alert.id)).rejects.toThrow();
  });

  it("adds the Sentinel-1 observation on 15 Sept to the same alert", async () => {
    const before = (await alerts.findActive(krnovId))!;
    const report = await run.execute(admin, { at: new Date("2024-09-15T08:00:00Z") });
    expect(report.sources.find((s) => s.sourceId === "gfm")?.signals).toBe(1);
    const after = (await alerts.findActive(krnovId))!;
    expect(after.id).toBe(before.id);
    expect(after.people.length).toBeGreaterThanOrEqual(before.people.length);
  });
});
