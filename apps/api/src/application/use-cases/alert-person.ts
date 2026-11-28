import { canViewPersonDetails, type User } from "../../domain/access.js";
import type { Alert } from "../../domain/alert.js";
import { decideContact } from "../../domain/contact.js";
import { openOrUpdateTask } from "../../domain/task.js";
import { summarizeContact } from "../alert-people.js";
import { ForbiddenError, NotFoundError } from "../errors.js";
import type { AlertPersonDetail, GetAlertPerson, SetContactStatus } from "../ports/in/alerts.js";
import type { AlertRepository } from "../ports/out/alert-repository.js";
import type { AuditRepository } from "../ports/out/audit-repository.js";
import type { ContactRepository } from "../ports/out/contact-repository.js";
import type { RegisterRepository } from "../ports/out/register-repository.js";
import type { Clock, IdGenerator } from "../ports/out/runtime.js";
import type { TaskRepository } from "../ports/out/task-repository.js";
import { toPersonDetails } from "./get-alert.js";

type Deps = {
  alerts: AlertRepository;
  register: RegisterRepository;
  contacts: ContactRepository;
  tasks: TaskRepository;
  audit: AuditRepository;
  clock: Clock;
  newId: IdGenerator;
};

/** Loads the alert and checks the unsealing policy for this one person. */
const unsealed = async (deps: Deps, actor: User, alertId: string, personId: string): Promise<Alert> => {
  const alert = await deps.alerts.get(alertId);
  if (!alert) throw new NotFoundError("Alert", alertId);
  if (!canViewPersonDetails(actor, { alert, personId }))
    throw new ForbiddenError("Only the municipality's officers can open people on an active alert.");
  return alert;
};

/** Opening a person is the moment their details are read, so it is always logged. */
export class GetAlertPersonUseCase implements GetAlertPerson {
  constructor(private readonly deps: Deps) {}

  async execute(actor: User, { alertId, personId }: { alertId: string; personId: string }): Promise<AlertPersonDetail> {
    const alert = await unsealed(this.deps, actor, alertId, personId);
    const entry = alert.people.find((p) => p.personId === personId)!;
    const [[record], contacts, task] = await Promise.all([
      this.deps.register.getPeople(alert.municipalityId, [personId]),
      this.deps.contacts.listByAlert(alertId),
      this.deps.tasks.findOpen(alertId, personId),
    ]);
    if (!record) throw new NotFoundError("Person", personId);
    await this.deps.audit.append({ id: this.deps.newId(), at: this.deps.clock(), userId: actor.id, action: "view_person", alertId, personId });

    const history = contacts.filter((c) => c.personId === personId).sort((a, b) => b.at.getTime() - a.at.getTime());
    return { ...entry, details: toPersonDetails(record), contact: summarizeContact(history), task, history };
  }
}

/** Records a call outcome; "needs help" and repeated "not reached" open a task for the fire service. */
export class SetContactStatusUseCase implements SetContactStatus {
  constructor(private readonly deps: Deps) {}

  async execute(actor: User, input: Parameters<SetContactStatus["execute"]>[1]) {
    const alert = await unsealed(this.deps, actor, input.alertId, input.personId);
    const now = this.deps.clock();
    const history = (await this.deps.contacts.listByAlert(alert.id)).filter((c) => c.personId === input.personId);
    const decision = decideContact(history, input, { alertId: alert.id, personId: input.personId, by: actor.id, at: now });

    await this.deps.contacts.append(decision.record);
    let task = await this.deps.tasks.findOpen(alert.id, input.personId);
    if (decision.task) {
      task = openOrUpdateTask(task, decision.task, {
        id: this.deps.newId(), alertId: alert.id, municipalityId: alert.municipalityId, personId: input.personId, now,
      });
      await this.deps.tasks.save(task);
    }
    await this.deps.audit.append({ id: this.deps.newId(), at: now, userId: actor.id, action: "status_change", alertId: alert.id, personId: input.personId });
    return { contact: summarizeContact([...history, decision.record]), task };
  }
}
