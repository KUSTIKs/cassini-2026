import { canViewPersonDetails, type User } from "../../domain/access.js";
import { countStates, groupByPerson, openTaskByPerson, summarizeContact } from "../alert-people.js";
import { authorize } from "../authorize.js";
import { NotFoundError } from "../errors.js";
import type { AlertView, GetAlert, PersonDetails } from "../ports/in/alerts.js";
import type { AlertRepository } from "../ports/out/alert-repository.js";
import type { AuditRepository } from "../ports/out/audit-repository.js";
import type { ContactRepository } from "../ports/out/contact-repository.js";
import type { MunicipalityRepository } from "../ports/out/municipality-repository.js";
import type { RegisterRepository } from "../ports/out/register-repository.js";
import type { Clock, IdGenerator } from "../ports/out/runtime.js";
import type { SignalRepository } from "../ports/out/signal-repository.js";
import type { SubstationRepository } from "../ports/out/substation-repository.js";
import type { TaskRepository } from "../ports/out/task-repository.js";

type Deps = {
  alerts: AlertRepository;
  signals: SignalRepository;
  municipalities: MunicipalityRepository;
  register: RegisterRepository;
  substations: SubstationRepository;
  contacts: ContactRepository;
  tasks: TaskRepository;
  audit: AuditRepository;
  clock: Clock;
  newId: IdGenerator;
};

export const toPersonDetails = (r: { fullName: string; address: string; phone: string; carerName: string | null; carerPhone: string | null; location: PersonDetails["location"]; externalRef: string }): PersonDetails => ({
  fullName: r.fullName, address: r.address, phone: r.phone, carerName: r.carerName,
  carerPhone: r.carerPhone, location: r.location, externalRef: r.externalRef,
});

/** The ranked list. Names and phone numbers are loaded only for people the policy unseals; showing them is logged. */
export class GetAlertUseCase implements GetAlert {
  constructor(private readonly deps: Deps) {}

  async execute(actor: User, alertId: string): Promise<AlertView> {
    const alert = await this.deps.alerts.get(alertId);
    if (!alert) throw new NotFoundError("Alert", alertId);
    authorize(actor, "municipality.view", alert.municipalityId);

    const unsealedIds = alert.people.filter((p) => canViewPersonDetails(actor, { alert, personId: p.personId })).map((p) => p.personId);
    const [municipality, allSignals, records, contacts, tasks, substations] = await Promise.all([
      this.deps.municipalities.get(alert.municipalityId),
      this.deps.signals.list(),
      unsealedIds.length > 0 ? this.deps.register.getPeople(alert.municipalityId, unsealedIds) : Promise.resolve([]),
      this.deps.contacts.listByAlert(alert.id),
      this.deps.tasks.listByAlert(alert.id),
      this.deps.substations.listByMunicipality(alert.municipalityId),
    ]);
    if (unsealedIds.length > 0)
      await this.deps.audit.append({ id: this.deps.newId(), at: this.deps.clock(), userId: actor.id, action: "view_list", alertId: alert.id, personId: null });

    const details = new Map(records.map((r) => [r.id, toPersonDetails(r)]));
    const history = groupByPerson(contacts);
    const openTasks = openTaskByPerson(tasks);
    const people = alert.people.map((p) => ({
      ...p,
      details: details.get(p.personId) ?? null,
      contact: summarizeContact(history.get(p.personId) ?? []),
      task: openTasks.get(p.personId) ?? null,
    }));

    return {
      alert,
      municipalityName: municipality?.name ?? "",
      signals: allSignals.filter((s) => alert.signalIds.includes(s.id)),
      substations: alert.substations.flatMap((exposed) => {
        const s = substations.find((x) => x.osmRef === exposed.osmRef);
        return s ? [{ ...exposed, name: s.name, location: s.location }] : [];
      }),
      people,
      counters: countStates(people.map((p) => p.contact)),
      sealed: unsealedIds.length === 0,
    };
  }
}
