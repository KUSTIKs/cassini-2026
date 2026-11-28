import { readFile } from "node:fs/promises";
import { UpstreamError } from "../../../application/errors.js";
import type { SubstationGateway } from "../../../application/ports/out/substation-gateway.js";
import type { BBox } from "../../../domain/geo.js";
import { parseOverpassSubstations } from "./overpass-substation-gateway.js";

export type Snapshot = { file: string; /** the bbox the saved query covered */ coverage: BBox };

const covers = (outer: BBox, inner: BBox) =>
  inner.west >= outer.west && inner.east <= outer.east && inner.south >= outer.south && inner.north <= outer.north;

/**
 * DRIVEN ADAPTER: substations from saved Overpass responses (data/osm/*.overpass.json).
 * Answers only for areas a snapshot fully covers; anywhere else it fails instead of
 * pretending there are no substations.
 */
export class SnapshotSubstationGateway implements SubstationGateway {
  constructor(private readonly snapshots: readonly Snapshot[]) {}

  async findInBBox(bbox: BBox) {
    const snapshot = this.snapshots.find((s) => covers(s.coverage, bbox));
    if (!snapshot) throw new UpstreamError("OpenStreetMap substations");
    const all = parseOverpassSubstations(JSON.parse(await readFile(snapshot.file, "utf8")));
    return all.filter(
      ({ location: { lng, lat } }) => lat >= bbox.south && lat <= bbox.north && lng >= bbox.west && lng <= bbox.east,
    );
  }
}
