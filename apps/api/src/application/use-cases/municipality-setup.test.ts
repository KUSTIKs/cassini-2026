import { beforeEach, describe, expect, it } from "vitest";
import {
  InMemoryMunicipalityRepository, InMemoryRegisterRepository, InMemorySubstationRepository, InMemoryUserRepository,
} from "../../adapters/out/memory/repositories.js";
import type { User } from "../../domain/access.js";
import { DomainValidationError } from "../../domain/errors.js";
import type { Area } from "../../domain/geo.js";
import type { RawRegisterRow } from "../../domain/register-row.js";
import type { Substation } from "../../domain/substation.js";
import type { AreaGateway } from "../ports/out/area-gateway.js";
import type { SubstationGateway } from "../ports/out/substation-gateway.js";
import { ForbiddenError } from "../errors.js";
import { CreateMunicipalityUseCase } from "./create-municipality.js";
import { GetMunicipalitySetupUseCase } from "./get-municipality-setup.js";
import { ImportRegisterUseCase } from "./import-register.js";
import { ImportSubstationsUseCase } from "./import-substations.js";
import { SetMunicipalityAreaUseCase } from "./set-municipality-area.js";

const town: Area = { type: "Polygon", coordinates: [[[17.6, 50.0], [17.8, 50.0], [17.8, 50.2], [17.6, 50.2], [17.6, 50.0]]] };
const north: Substation = { osmRef: "w1", name: "North", voltagesKv: [22], operator: null, location: { lng: 17.7, lat: 50.15 } };
const south: Substation = { osmRef: "w2", name: "South", voltagesKv: [22], operator: null, location: { lng: 17.7, lat: 50.05 } };
const outside: Substation = { osmRef: "w3", name: "Elsewhere", voltagesKv: [110], operator: null, location: { lng: 18.5, lat: 50.1 } };

const areas: AreaGateway = {
  search: async () => [],
  getByRef: async (ref) => (ref === "R1" ? { ref, label: "Krnov", kind: "town", geometry: town } : null),
};
const substationSource: SubstationGateway = { findInBBox: async () => [north, south, outside] };

const admin: User = { id: "admin", name: "Admin", email: null, organisation: "Region", grants: [{ role: "regional_admin", municipalityId: null }] };
const grid: User = { id: "grid", name: "Grid", email: null, organisation: "ČEZ Distribuce", grants: [{ role: "grid_operator", municipalityId: null }] };

const row = (ref: string, lat: number, overrides: RawRegisterRow = {}): RawRegisterRow => ({
  external_ref: ref, full_name: `Person ${ref}`, address: "Street 1", lat: String(lat), lon: "17.7",
  device: "oxygen_concentrator", backup_hours: "4", lives_alone: "no", floor: "1", mobility: "limited",
  phone: "+420 000 000 000", ...overrides,
});

describe("municipality setup (Flow 1)", () => {
  let ids = 0;
  const deps = () => ({
    municipalities: new InMemoryMunicipalityRepository(),
    substations: new InMemorySubstationRepository(),
    register: new InMemoryRegisterRepository(),
    users: new InMemoryUserRepository(),
  });
  let repos: ReturnType<typeof deps>;
  const clock = () => new Date("2024-09-11T08:00:00Z");
  const newId = () => `id-${++ids}`;

  beforeEach(() => { repos = deps(); });

  const setUpTown = async () => {
    const { id } = await new CreateMunicipalityUseCase({ ...repos, clock, newId }).execute(admin, {
      name: "Krnov", region: "Moravian-Silesian", contact: { name: "Mayor", phone: "+420 777 000 000" },
    });
    await new SetMunicipalityAreaUseCase({ ...repos, areas }).execute(admin, { municipalityId: id, ref: "R1" });
    return id;
  };

  it("rejects a municipality without required details, naming each field", async () => {
    const create = new CreateMunicipalityUseCase({ ...repos, clock, newId });
    const error = await create.execute(admin, { name: " ", region: "", contact: { name: "", phone: "abc" } }).catch((e) => e);
    expect(error).toBeInstanceOf(DomainValidationError);
    expect(Object.keys((error as DomainValidationError).fields).sort()).toEqual(["contact.name", "contact.phone", "name", "region"]);
  });

  it("keeps only substations inside the area and links people to the nearest one", async () => {
    const id = await setUpTown();
    await new ImportRegisterUseCase({ ...repos, clock, newId }).execute(admin, {
      municipalityId: id, rows: [row("A", 50.16), row("B", 50.04)],
    });
    const result = await new ImportSubstationsUseCase({ ...repos, substationSource }).execute(admin, id);
    expect(result).toEqual({ found: 2, linkedPeople: 2 });

    const setup = await new GetMunicipalitySetupUseCase(repos).execute(admin, id);
    expect(setup.substations.map((s) => [s.osmRef, s.dependentPeople])).toEqual([["w1", 1], ["w2", 1]]);
    expect(setup.steps.every((s) => s.status === "done")).toBe(true);
  });

  it("imports valid rows and reports rejected ones without storing them", async () => {
    const id = await setUpTown();
    const result = await new ImportRegisterUseCase({ ...repos, clock, newId }).execute(admin, {
      municipalityId: id,
      rows: [row("A", 50.1), row("A", 50.1), row("C", 49.0), row("D", 50.1, { device: "toaster" })],
    });
    expect(result.imported).toBe(1);
    expect(result.rejected.map((r) => [r.row, r.field])).toEqual([[2, "external_ref"], [3, "lat"], [4, "device"]]);
    expect((await repos.register.stats(id)).total).toBe(1);
  });

  it("clears substations when the area changes", async () => {
    const id = await setUpTown();
    await new ImportSubstationsUseCase({ ...repos, substationSource }).execute(admin, id);
    await new SetMunicipalityAreaUseCase({ ...repos, areas }).execute(admin, { municipalityId: id, ref: "R1" });
    expect(await repos.substations.listByMunicipality(id)).toEqual([]);
  });

  describe("access", () => {
    it("invites the alert contact as the municipality's officer", async () => {
      const id = await setUpTown();
      const [officer] = await repos.users.list();
      expect(officer).toMatchObject({ name: "Mayor", grants: [{ role: "municipality_officer", municipalityId: id }] });
    });

    it("lets an officer see their own municipality, read-only, and no other", async () => {
      const id = await setUpTown();
      const other = await new CreateMunicipalityUseCase({ ...repos, clock, newId }).execute(admin, {
        name: "Jeseník", region: "Olomouc", contact: { name: "Other mayor", phone: "+420 777 000 001" },
      });
      const officer = (await repos.users.list()).find((u) => u.grants.some((g) => g.municipalityId === id))!;

      const setup = await new GetMunicipalitySetupUseCase(repos).execute(officer, id);
      expect(setup.permissions).toEqual({ setup: false, uploadRegister: false });
      await expect(new GetMunicipalitySetupUseCase(repos).execute(officer, other.id)).rejects.toBeInstanceOf(ForbiddenError);

      const { ListMunicipalitiesUseCase } = await import("./list-municipalities.js");
      expect((await new ListMunicipalitiesUseCase(repos).execute(officer)).map((o) => o.municipality.id)).toEqual([id]);
    });

    it("gives an existing user (same email) one more grant instead of a second account", async () => {
      const create = new CreateMunicipalityUseCase({ ...repos, clock, newId });
      const contact = { name: "Krnov ORP crisis officer", phone: "+420 777 000 003", email: "krizove@krnov.example" };
      const a = await create.execute(admin, { name: "Krnov", region: "Moravian-Silesian", contact });
      const b = await create.execute(admin, { name: "Brantice", region: "Moravian-Silesian", contact: { ...contact, email: "KRIZOVE@krnov.example" } });

      const users = await repos.users.list();
      expect(users).toHaveLength(1);
      expect(users[0]!.grants.map((g) => g.municipalityId)).toEqual([a.id, b.id]);
      const { ListMunicipalitiesUseCase } = await import("./list-municipalities.js");
      expect(await new ListMunicipalitiesUseCase(repos).execute(users[0]!)).toHaveLength(2);
    });

    it("lets the grid operator upload the register but not change the area or create towns", async () => {
      const id = await setUpTown();
      const imported = await new ImportRegisterUseCase({ ...repos, clock, newId }).execute(grid, { municipalityId: id, rows: [row("A", 50.1)] });
      expect(imported.imported).toBe(1);
      await expect(new SetMunicipalityAreaUseCase({ ...repos, areas }).execute(grid, { municipalityId: id, ref: "R1" }))
        .rejects.toBeInstanceOf(ForbiddenError);
      await expect(new CreateMunicipalityUseCase({ ...repos, clock, newId }).execute(grid, {
        name: "X", region: "Y", contact: { name: "Z", phone: "+420 777 000 002" },
      })).rejects.toBeInstanceOf(ForbiddenError);
    });
  });
});
