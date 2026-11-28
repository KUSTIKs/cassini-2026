import { describe, expect, it } from "vitest";
import { UpstreamError } from "../../../application/errors.js";
import { SnapshotSubstationGateway } from "./snapshot-substation-gateway.js";

const krnov = {
  file: new URL("../../../../../../data/osm/krnov-substations.overpass.json", import.meta.url).pathname,
  coverage: { south: 50.04, west: 17.58, north: 50.15, east: 17.78 },
};

describe("SnapshotSubstationGateway", () => {
  it("answers inside its coverage", async () => {
    const found = await new SnapshotSubstationGateway([krnov]).findInBBox({ south: 50.05, west: 17.59, north: 50.14, east: 17.77 });
    expect(found.some((s) => s.osmRef === "w55375417" && s.name === "Krnov")).toBe(true);
  });

  it("refuses areas it does not cover instead of returning nothing", async () => {
    const jesenik = { south: 50.2, west: 17.1, north: 50.3, east: 17.3 };
    await expect(new SnapshotSubstationGateway([krnov]).findInBBox(jesenik)).rejects.toBeInstanceOf(UpstreamError);
  });
});
