import type { LngLat } from "./geo.js";

export type Substation = {
  readonly osmRef: string;
  readonly name: string | null;
  readonly voltagesKv: readonly number[];
  readonly operator: string | null;
  readonly location: LngLat;
};
