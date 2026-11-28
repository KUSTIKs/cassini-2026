import { afterEach, describe, expect, it, vi } from "vitest";
import { UpstreamError } from "../../../application/errors.js";
import { OverpassSubstationGateway } from "./overpass-substation-gateway.js";

const bbox = { south: 50.05, west: 17.59, north: 50.14, east: 17.77 };
const answer = {
  elements: [{ type: "way", id: 55375417, center: { lat: 50.0821, lon: 17.6811 }, tags: { name: "Krnov", voltage: "110000;22000" } }],
};

/** Waits until the request is aborted, like an Overpass mirror that never answers. */
const stall = (init?: RequestInit) =>
  new Promise<Response>((_, reject) => init?.signal?.addEventListener("abort", () => reject(new Error("aborted"))));

afterEach(() => vi.unstubAllGlobals());

describe("OverpassSubstationGateway", () => {
  it("returns the first good answer even when other mirrors fail or stall, and cancels the stalled one", async () => {
    let stalledAborted = false;
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
      if (url === "https://down") return new Response("", { status: 504 });
      if (url === "https://stuck") {
        init?.signal?.addEventListener("abort", () => { stalledAborted = true; });
        return stall(init);
      }
      return Response.json(answer);
    }));

    const gateway = new OverpassSubstationGateway({ urls: ["https://down", "https://stuck", "https://ok"], timeoutMs: 5_000 });
    const found = await gateway.findInBBox(bbox);

    expect(found).toEqual([
      { osmRef: "w55375417", name: "Krnov", voltagesKv: [110, 22], operator: null, location: { lng: 17.6811, lat: 50.0821 } },
    ]);
    expect(stalledAborted).toBe(true);
  });

  it("fails with an upstream error when every mirror fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init?: RequestInit) => stall(init)));
    const gateway = new OverpassSubstationGateway({ urls: ["https://a", "https://b"], timeoutMs: 50 });
    await expect(gateway.findInBBox(bbox)).rejects.toBeInstanceOf(UpstreamError);
  });
});
