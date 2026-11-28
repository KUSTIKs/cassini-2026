import { RunSignalsRequest, SetContactStatusRequest } from "@firstreach/contracts";
import { Hono } from "hono";
import type { GetAlert, GetAlertPerson, ListAlerts, RunSignals, SetContactStatus } from "../../../../application/ports/in/alerts.js";
import type { AppEnv } from "../auth.js";
import { toAlertDetail, toAlertPersonDetail, toAlertSummaryList, toContactUpdate, toSignalRunReport } from "../mappers.js";
import { Id, parseWith } from "../validate.js";

export type AlertRouteDeps = {
  runSignals: RunSignals;
  listAlerts: ListAlerts;
  getAlert: GetAlert;
  getAlertPerson: GetAlertPerson;
  setContactStatus: SetContactStatus;
};

/** Mounted at the root; every path here needs a session (see app.ts). */
export const alertRoutes = (deps: AlertRouteDeps) =>
  new Hono<AppEnv>()
    .post("/signals/run", async (c) => {
      const { at } = parseWith(RunSignalsRequest, await c.req.json().catch(() => null));
      return c.json(toSignalRunReport(await deps.runSignals.execute(c.get("actor"), { at: new Date(at) })));
    })
    .get("/municipalities/:id/alerts", async (c) => {
      const id = parseWith(Id, c.req.param("id"));
      return c.json(toAlertSummaryList(await deps.listAlerts.execute(c.get("actor"), id)));
    })
    .get("/alerts/:id", async (c) => {
      const id = parseWith(Id, c.req.param("id"));
      return c.json(toAlertDetail(await deps.getAlert.execute(c.get("actor"), id)));
    })
    .get("/alerts/:id/people/:personId", async (c) => {
      const alertId = parseWith(Id, c.req.param("id"));
      const personId = parseWith(Id, c.req.param("personId"));
      const actor = c.get("actor");
      return c.json(toAlertPersonDetail(await deps.getAlertPerson.execute(actor, { alertId, personId }), actor.id));
    })
    .post("/alerts/:id/people/:personId/status", async (c) => {
      const alertId = parseWith(Id, c.req.param("id"));
      const personId = parseWith(Id, c.req.param("personId"));
      const body = parseWith(SetContactStatusRequest, await c.req.json().catch(() => null));
      return c.json(toContactUpdate(await deps.setContactStatus.execute(c.get("actor"), { alertId, personId, ...body })));
    });
