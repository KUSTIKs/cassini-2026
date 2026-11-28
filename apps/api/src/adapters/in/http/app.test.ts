import { ApiError, Me, MunicipalityList, MunicipalitySetup, Session, UserList } from "@firstreach/contracts";
import { describe, expect, it } from "vitest";
import { CreateMunicipalityUseCase } from "../../../application/use-cases/create-municipality.js";
import { GetAlertPersonUseCase, SetContactStatusUseCase } from "../../../application/use-cases/alert-person.js";
import { GetAlertUseCase } from "../../../application/use-cases/get-alert.js";
import { GetCurrentUserUseCase } from "../../../application/use-cases/get-current-user.js";
import { GetMunicipalitySetupUseCase } from "../../../application/use-cases/get-municipality-setup.js";
import { ImportRegisterUseCase } from "../../../application/use-cases/import-register.js";
import { ImportSubstationsUseCase } from "../../../application/use-cases/import-substations.js";
import { ListAlertsUseCase } from "../../../application/use-cases/list-alerts.js";
import { ListMunicipalitiesUseCase } from "../../../application/use-cases/list-municipalities.js";
import { ListUsersUseCase } from "../../../application/use-cases/list-users.js";
import { SearchAreasUseCase } from "../../../application/use-cases/search-areas.js";
import { RunSignalsUseCase } from "../../../application/use-cases/run-signals.js";
import { SetMunicipalityAreaUseCase } from "../../../application/use-cases/set-municipality-area.js";
import {
  InMemoryAlertRepository, InMemoryAuditRepository, InMemoryContactRepository, InMemoryMunicipalityRepository, InMemoryTaskRepository, InMemoryRegisterRepository, InMemorySignalRepository,
  InMemorySubstationRepository, InMemoryUserRepository,
} from "../../out/memory/repositories.js";
import { createHttpApp } from "./app.js";
import { createSessionCodec } from "./session.js";

const ADMIN_ID = "00000000-0000-4000-8000-000000000001";
const GRID_ID = "00000000-0000-4000-8000-000000000002";

const build = ({ demoSignIn = true } = {}) => {
  const repos = {
    municipalities: new InMemoryMunicipalityRepository(),
    substations: new InMemorySubstationRepository(),
    register: new InMemoryRegisterRepository(),
    users: new InMemoryUserRepository(),
  };
  repos.users.items.set(ADMIN_ID, { id: ADMIN_ID, name: "Admin", email: null, organisation: "Region", grants: [{ role: "regional_admin", municipalityId: null }] });
  repos.users.items.set(GRID_ID, { id: GRID_ID, name: "Grid", email: null, organisation: "ČEZ", grants: [{ role: "grid_operator", municipalityId: null }] });
  const clock = () => new Date("2024-09-11T08:00:00Z");
  const newId = () => crypto.randomUUID();
  const areas = { search: async () => [], getByRef: async () => null };
  const signals = new InMemorySignalRepository();
  const alerts = new InMemoryAlertRepository();
  const flow3 = { contacts: new InMemoryContactRepository(), tasks: new InMemoryTaskRepository(), audit: new InMemoryAuditRepository() };
  return createHttpApp({
    webOrigin: "http://localhost:3000",
    clock,
    sessions: createSessionCodec({ secret: "test-secret-at-least-16", ttlHours: 1 }),
    demoSignIn,
    getCurrentUser: new GetCurrentUserUseCase(repos),
    listUsers: new ListUsersUseCase(repos),
    createMunicipality: new CreateMunicipalityUseCase({ ...repos, clock, newId }),
    listMunicipalities: new ListMunicipalitiesUseCase(repos),
    getMunicipalitySetup: new GetMunicipalitySetupUseCase(repos),
    searchAreas: new SearchAreasUseCase(areas),
    setMunicipalityArea: new SetMunicipalityAreaUseCase({ ...repos, areas }),
    importSubstations: new ImportSubstationsUseCase({ ...repos, substationSource: { findInBBox: async () => [] } }),
    importRegister: new ImportRegisterUseCase({ ...repos, clock, newId }),
    runSignals: new RunSignalsUseCase({ ...repos, sources: [], signals, alerts, newId }),
    listAlerts: new ListAlertsUseCase({ alerts }),
    getAlert: new GetAlertUseCase({ ...repos, ...flow3, alerts, signals, clock, newId }),
    getAlertPerson: new GetAlertPersonUseCase({ ...repos, ...flow3, alerts, clock, newId }),
    setContactStatus: new SetContactStatusUseCase({ ...repos, ...flow3, alerts, clock, newId }),
  });
};
type App = ReturnType<typeof build>;

const post = (body: unknown, token?: string) => ({
  method: "POST",
  body: JSON.stringify(body),
  headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
});
const auth = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

const signIn = async (app: App, userId: string) =>
  Session.parse(await (await app.request("/auth/demo-sign-in", post({ userId }))).json()).token;

const krnov = { name: "Krnov", region: "Moravian-Silesian", contact: { name: "Mayor", phone: "+420 777 000 000" } };

describe("HTTP: municipalities", () => {
  it("creates a municipality and serves its setup in the contract shape", async () => {
    const app = build();
    const token = await signIn(app, ADMIN_ID);
    const created = await app.request("/municipalities", post(krnov, token));
    expect(created.status).toBe(201);
    const { id } = (await created.json()) as { id: string };

    const setup = MunicipalitySetup.parse(await (await app.request(`/municipalities/${id}/setup`, auth(token))).json());
    expect(setup.steps.map((s) => s.status)).toEqual(["done", "ready", "blocked", "blocked"]);
    expect(setup.permissions).toEqual({ setup: true, uploadRegister: true });

    const list = MunicipalityList.parse(await (await app.request("/municipalities", auth(token))).json());
    expect(list.items).toHaveLength(1);
  });

  it("returns field errors for invalid input", async () => {
    const app = build();
    const res = await app.request("/municipalities", post({ name: "", region: "", contact: { name: "", phone: "" } }, await signIn(app, ADMIN_ID)));
    expect(res.status).toBe(400);
    expect(ApiError.parse(await res.json()).error.fields).toHaveProperty("name");
  });

  it("returns 404 for an unknown municipality", async () => {
    const app = build();
    const res = await app.request(`/municipalities/${crypto.randomUUID()}/setup`, auth(await signIn(app, ADMIN_ID)));
    expect(res.status).toBe(404);
  });
});

describe("HTTP: access", () => {
  it("answers 401 without a session, or with a tampered one", async () => {
    const app = build();
    expect((await app.request("/municipalities")).status).toBe(401);
    const token = await signIn(app, ADMIN_ID);
    const tampered = `${token.slice(0, -2)}xx`;
    const res = await app.request("/municipalities", auth(tampered));
    expect(res.status).toBe(401);
    expect(ApiError.parse(await res.json()).error.code).toBe("unauthenticated");
  });

  it("answers 403 when the role doesn't allow the action", async () => {
    const app = build();
    const res = await app.request("/municipalities", post(krnov, await signIn(app, GRID_ID)));
    expect(res.status).toBe(403);
    expect(ApiError.parse(await res.json()).error.code).toBe("forbidden");
  });

  it("lists demo users, including the officer invited with a new municipality, and reports who is signed in", async () => {
    const app = build();
    const admin = await signIn(app, ADMIN_ID);
    await app.request("/municipalities", post(krnov, admin));

    const users = UserList.parse(await (await app.request("/auth/demo-users")).json());
    const officer = users.items.find((u) => u.roles.some((r) => r.role === "municipality_officer"));
    expect(officer).toMatchObject({ name: "Mayor", organisation: "Municipality of Krnov" });

    const me = Me.parse(await (await app.request("/me", auth(await signIn(app, officer!.id)))).json());
    expect(me.user.roles).toEqual([{ role: "municipality_officer", municipalityId: expect.any(String) }]);
    expect(me.permissions.createMunicipality).toBe(false);
  });

  it("has no demo sign-in when it is turned off", async () => {
    const app = build({ demoSignIn: false });
    expect((await app.request("/auth/demo-users")).status).toBe(404);
    expect((await app.request("/auth/demo-sign-in", post({ userId: ADMIN_ID }))).status).toBe(404);
  });
});

describe("HTTP: signals and alerts", () => {
  it("lets only the regional admin run the signal sources", async () => {
    const app = build();
    const body = { at: "2024-09-12T12:00:00.000Z" };
    expect((await app.request("/signals/run", post(body, await signIn(app, GRID_ID)))).status).toBe(403);
    const ok = await app.request("/signals/run", post(body, await signIn(app, ADMIN_ID)));
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({ at: body.at, sources: [], alerts: [] });
  });

  it("answers 404 for an unknown alert", async () => {
    const app = build();
    expect((await app.request(`/alerts/${crypto.randomUUID()}`, auth(await signIn(app, ADMIN_ID)))).status).toBe(404);
  });
});

