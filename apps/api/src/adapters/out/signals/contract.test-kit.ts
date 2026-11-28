import { describe, expect, it } from "vitest";
import type { SignalSource } from "../../../application/ports/out/signal-source.js";
import type { BBox, Position } from "../../../domain/geo.js";

/** Conformance suite every signal plugin runs (ARCHITECTURE.md §6). */
export const testSignalSourceContract = (name: string, create: () => SignalSource, query: { bbox: BBox; now: Date; before: Date }) =>
  describe(`${name}: signal contract`, () => {
    it("produces signals that match its descriptor", async () => {
      const source = create();
      const signals = await source.poll({ bbox: query.bbox, since: new Date(0), now: query.now });
      expect(signals.length).toBeGreaterThan(0);
      for (const s of signals) {
        expect(s.id.startsWith(`${source.descriptor.id}:`)).toBe(true);
        expect(s.sourceId).toBe(source.descriptor.id);
        expect(source.descriptor.kinds).toContain(s.kind);
        expect(source.descriptor.stages).toContain(s.stage);
        expect(s.issuedAt.getTime()).toBeLessThanOrEqual(query.now.getTime());
        expect(s.provenance.euSpace).toBe(source.descriptor.euSpace);
      }
    });

    it("returns areas as valid WGS84 polygons", async () => {
      const signals = await create().poll({ bbox: query.bbox, since: new Date(0), now: query.now });
      for (const { area } of signals) {
        expect(["Polygon", "MultiPolygon"]).toContain(area.type);
        const polygons = area.type === "Polygon" ? [area.coordinates] : area.coordinates;
        expect(polygons.length).toBeGreaterThan(0);
        for (const ring of polygons.flat()) {
          expect(ring.length).toBeGreaterThanOrEqual(4);
          expect(ring[0]).toEqual(ring[ring.length - 1]);
          for (const [lng, lat] of ring as Position[]) {
            expect(Math.abs(lng)).toBeLessThanOrEqual(180);
            expect(Math.abs(lat)).toBeLessThanOrEqual(90);
          }
        }
      }
    });

    it("respects the injected clock: nothing before it was issued", async () => {
      expect(await create().poll({ bbox: query.bbox, since: new Date(0), now: query.before })).toEqual([]);
    });

    it("keeps ids stable across polls", async () => {
      const source = create();
      const a = await source.poll({ bbox: query.bbox, since: new Date(0), now: query.now });
      const b = await source.poll({ bbox: query.bbox, since: new Date(0), now: query.now });
      expect(b.map((s) => s.id)).toEqual(a.map((s) => s.id));
    });
  });
