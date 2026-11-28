import { canViewPersonDetails, type User } from "../../domain/access.js";
import { authorize } from "../authorize.js";
import { NotFoundError } from "../errors.js";
import type { AlertView, GetAlert, PersonDetails } from "../ports/in/alerts.js";
import type { AlertRepository } from "../ports/out/alert-repository.js";
import type { MunicipalityRepository } from "../ports/out/municipality-repository.js";
import type { RegisterRepository } from "../ports/out/register-repository.js";
import type { SignalRepository } from "../ports/out/signal-repository.js";

type Deps = {
  alerts: AlertRepository;
  signals: SignalRepository;
  municipalities: MunicipalityRepository;
  register: RegisterRepository;
};

/** The ranked list. Names and phone numbers are loaded only for people the policy unseals for this actor. */
export class GetAlertUseCase implements GetAlert {
  constructor(private readonly deps: Deps) {}

  async execute(actor: User, alertId: string): Promise<AlertView> {
    const alert = await this.deps.alerts.get(alertId);
    if (!alert) throw new NotFoundError("Alert", alertId);
    authorize(actor, "municipality.view", alert.municipalityId);

    const unsealedIds = alert.people.filter((p) => canViewPersonDetails(actor, { alert, personId: p.personId })).map((p) => p.personId);
    const [municipality, allSignals, records] = await Promise.all([
      this.deps.municipalities.get(alert.municipalityId),
      this.deps.signals.list(),
      unsealedIds.length > 0 ? this.deps.register.getPeople(alert.municipalityId, unsealedIds) : Promise.resolve([]),
    ]);
    const details = new Map<string, PersonDetails>(
      records.map((r) => [r.id, {
        fullName: r.fullName, address: r.address, phone: r.phone, carerName: r.carerName,
        carerPhone: r.carerPhone, location: r.location, externalRef: r.externalRef,
      }]),
    );

    return {
      alert,
      municipalityName: municipality?.name ?? "",
      signals: allSignals.filter((s) => alert.signalIds.includes(s.id)),
      people: alert.people.map((p) => ({ ...p, details: details.get(p.personId) ?? null })),
      sealed: unsealedIds.length === 0,
    };
  }
}
