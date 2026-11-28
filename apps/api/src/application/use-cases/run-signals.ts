import type { User } from "../../domain/access.js";
import { reconcileAlert } from "../../domain/alert.js";
import { evaluateExposure } from "../../domain/exposure.js";
import { bboxOf, type BBox } from "../../domain/geo.js";
import type { HazardSignal } from "../../domain/hazard-signal.js";
import { authorize } from "../authorize.js";
import type { RunSignals, SignalRunReport } from "../ports/in/alerts.js";
import type { AlertRepository } from "../ports/out/alert-repository.js";
import type { MunicipalityRepository } from "../ports/out/municipality-repository.js";
import type { RegisterRepository } from "../ports/out/register-repository.js";
import type { IdGenerator } from "../ports/out/runtime.js";
import type { SignalRepository } from "../ports/out/signal-repository.js";
import type { SignalSource } from "../ports/out/signal-source.js";
import type { SubstationRepository } from "../ports/out/substation-repository.js";

type Deps = {
  sources: readonly SignalSource[];
  signals: SignalRepository;
  alerts: AlertRepository;
  municipalities: MunicipalityRepository;
  substations: SubstationRepository;
  register: RegisterRepository;
  newId: IdGenerator;
  onSourceError?: (sourceId: string, error: unknown) => void;
};

const union = (boxes: BBox[]): BBox => ({
  west: Math.min(...boxes.map((b) => b.west)),
  south: Math.min(...boxes.map((b) => b.south)),
  east: Math.max(...boxes.map((b) => b.east)),
  north: Math.max(...boxes.map((b) => b.north)),
});

/** Flow 2: poll the signal plugins, then turn exposed substations into alerts. Never branches on a source. */
export class RunSignalsUseCase implements RunSignals {
  constructor(private readonly deps: Deps) {}

  async execute(actor: User, { at }: { at: Date }): Promise<SignalRunReport> {
    authorize(actor, "signals.run");
    const municipalities = (await this.deps.municipalities.list()).filter((m) => m.area !== null);
    const report: SignalRunReport = { at, sources: [], alerts: [] };
    if (municipalities.length === 0) return report;
    const bbox = union(municipalities.map((m) => bboxOf(m.area!.geometry)));

    // One failing source must not stop the others (ARCHITECTURE.md §6, rule 5).
    const polled: HazardSignal[] = [];
    for (const source of this.deps.sources) {
      try {
        const signals = await source.poll({ bbox, since: new Date(0), now: at });
        polled.push(...signals);
        report.sources.push({ sourceId: source.descriptor.id, signals: signals.length, error: null });
      } catch (error) {
        this.deps.onSourceError?.(source.descriptor.id, error);
        report.sources.push({ sourceId: source.descriptor.id, signals: 0, error: (error as Error).message });
      }
    }
    await this.deps.signals.upsert(polled);
    const signals = await this.deps.signals.list();

    for (const municipality of municipalities) {
      const [substations, people, current] = await Promise.all([
        this.deps.substations.listByMunicipality(municipality.id),
        this.deps.register.listForExposure(municipality.id),
        this.deps.alerts.findActive(municipality.id),
      ]);
      const exposure = evaluateExposure({ signals, substations, people, now: at });
      const alert = reconcileAlert(current, exposure, { municipalityId: municipality.id, newId: this.deps.newId, now: at });
      if (!alert) continue;
      await this.deps.alerts.save(alert);
      report.alerts.push({
        municipalityId: municipality.id,
        alertId: alert.id,
        people: alert.people.length,
        substations: alert.substations.length,
        opened: current === null,
      });
    }
    return report;
  }
}
