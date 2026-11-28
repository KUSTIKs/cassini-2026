import type { BBox } from "../../../domain/geo.js";
import type { EuSpace, HazardKind, HazardSignal, SignalStage } from "../../../domain/hazard-signal.js";

/** What every signal plugin implements (ARCHITECTURE.md §6). Plugins live in adapters/out/signals/<id>/. */
export interface SignalSource {
  readonly descriptor: {
    /** Must equal HazardSignal.sourceId. */
    readonly id: string;
    /** Shown in the UI, e.g. "Copernicus EFAS flood forecast". */
    readonly label: string;
    readonly kinds: readonly HazardKind[];
    readonly stages: readonly SignalStage[];
    readonly euSpace: EuSpace;
  };
  /** Signals in force for the area at `now`. Time is injected, which is what makes replay free. */
  poll(query: { bbox: BBox; since: Date; now: Date }): Promise<HazardSignal[]>;
}
