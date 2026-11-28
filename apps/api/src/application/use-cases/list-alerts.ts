import type { User } from "../../domain/access.js";
import { authorize } from "../authorize.js";
import type { ListAlerts } from "../ports/in/alerts.js";
import type { AlertRepository } from "../ports/out/alert-repository.js";

export class ListAlertsUseCase implements ListAlerts {
  constructor(private readonly deps: { alerts: AlertRepository }) {}

  async execute(actor: User, municipalityId: string) {
    authorize(actor, "municipality.view", municipalityId);
    return this.deps.alerts.listByMunicipality(municipalityId);
  }
}
