import { CreateMunicipalityRequest, SetAreaRequest } from "@firstreach/contracts";
import { parse } from "csv-parse/sync";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type {
  CreateMunicipality, GetMunicipalitySetup, ImportRegister, ImportSubstations,
  ListMunicipalities, SetMunicipalityArea,
} from "../../../../application/ports/in/municipality-setup.js";
import type { RawRegisterRow } from "../../../../domain/register-row.js";
import type { AppEnv } from "../auth.js";
import { BadRequestError } from "../errors.js";
import { toMunicipalitySetup, toMunicipalitySummary } from "../mappers.js";
import { Id, parseWith } from "../validate.js";

export type MunicipalityRouteDeps = {
  createMunicipality: CreateMunicipality;
  listMunicipalities: ListMunicipalities;
  getMunicipalitySetup: GetMunicipalitySetup;
  setMunicipalityArea: SetMunicipalityArea;
  importSubstations: ImportSubstations;
  importRegister: ImportRegister;
};

const parseCsv = (text: string): RawRegisterRow[] => {
  try {
    return parse(text, { columns: true, skip_empty_lines: true, trim: true, bom: true });
  } catch {
    throw new BadRequestError("The file is not a valid CSV.", { file: "The file is not a valid CSV." });
  }
};

export const municipalityRoutes = (deps: MunicipalityRouteDeps) =>
  new Hono<AppEnv>()
    .get("/", async (c) => {
      const overviews = await deps.listMunicipalities.execute(c.get("actor"));
      return c.json({ items: overviews.map(toMunicipalitySummary) });
    })
    .post("/", async (c) => {
      const body = parseWith(CreateMunicipalityRequest, await c.req.json().catch(() => null));
      return c.json(await deps.createMunicipality.execute(c.get("actor"), body), 201);
    })
    .get("/:id/setup", async (c) => {
      const id = parseWith(Id, c.req.param("id"));
      return c.json(toMunicipalitySetup(await deps.getMunicipalitySetup.execute(c.get("actor"), id)));
    })
    .put("/:id/area", async (c) => {
      const municipalityId = parseWith(Id, c.req.param("id"));
      const { ref } = parseWith(SetAreaRequest, await c.req.json().catch(() => null));
      await deps.setMunicipalityArea.execute(c.get("actor"), { municipalityId, ref });
      return c.body(null, 204);
    })
    .post("/:id/substations/import", async (c) => {
      const id = parseWith(Id, c.req.param("id"));
      return c.json(await deps.importSubstations.execute(c.get("actor"), id));
    })
    .put("/:id/register", bodyLimit({ maxSize: 2 * 1024 * 1024 }), async (c) => {
      const municipalityId = parseWith(Id, c.req.param("id"));
      const rows = parseCsv(await c.req.text());
      return c.json(await deps.importRegister.execute(c.get("actor"), { municipalityId, rows }));
    });
