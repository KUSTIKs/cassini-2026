import * as turf from "@turf/turf";
import type { RouteRequest, RouteResult, RoutingGateway } from "../../../application/ports/out/routing-gateway.js";
import type { LineString, LonLat, MultiPolygon } from "../../../domain/geo.js";
import { RouteNotFoundError, StartInHazardError } from "../../../domain/task.js";
import { findLastDryPoint } from "./last-dry-point.js";

export type FixtureRoutingOptions = { cellM: number; padM: number; speedKmh: number };

/**
 * DRIVEN ADAPTER (ROUTING=fixture): offline, deterministic router for tests and the replay demo.
 * It routes over open ground on a grid, not on roads, so lines look schematic. Same semantics as the
 * real router: never enters `avoid`, refuses a start inside it, and stops at the last dry point
 * when the destination is under water.
 */
export class FixtureRoutingGateway implements RoutingGateway {
  private readonly opts: FixtureRoutingOptions;

  constructor(opts: Partial<FixtureRoutingOptions> = {}) {
    this.opts = { cellM: 40, padM: 1500, speedKmh: 30, ...opts };
  }

  async route({ from, to, avoid }: RouteRequest): Promise<RouteResult> {
    if (!avoid) return this.result([from, to], to, false, null);

    const wet = (p: LonLat) => turf.booleanPointInPolygon(p, avoid);
    if (wet(from)) throw new StartInHazardError("Crew start is inside the flood area");

    let endPoint = to;
    let walkRemainingM: number | null = null;
    if (wet(to)) {
      const dry = findLastDryPoint(turf.lineString([from, to]).geometry, avoid, to);
      if (!dry) throw new RouteNotFoundError("No dry approach to the destination");
      endPoint = dry.point;
      walkRemainingM = dry.walkRemainingM;
    }

    const path = clear([from, endPoint], avoid) ? [from, endPoint] : this.findPath(from, endPoint, avoid);
    if (!path) throw new RouteNotFoundError("Every way to the destination is blocked by the flood area");
    return this.result(path, endPoint, walkRemainingM !== null, walkRemainingM);
  }

  /** Grid search; if the first/last hop still clips water inside a coarse cell, retry finer, else give up. */
  private findPath(from: LonLat, to: LonLat, avoid: MultiPolygon): LonLat[] | null {
    for (const cellM of [this.opts.cellM, this.opts.cellM / 2]) {
      const path = gridPath(from, to, avoid, { ...this.opts, cellM });
      if (!path) return null;
      if (path.every((p, i) => i === 0 || clear([path[i - 1]!, p], avoid))) return path;
    }
    return null;
  }

  private result(path: LonLat[], endPoint: LonLat, destinationInHazard: boolean, walkRemainingM: number | null): RouteResult {
    const line: LineString = { type: "LineString", coordinates: path };
    const distanceM = turf.length(turf.feature(line), { units: "meters" });
    return {
      line,
      distanceM,
      durationS: distanceM / (this.opts.speedKmh / 3.6),
      endPoint,
      destinationInHazard,
      walkRemainingM,
      provider: "fixture",
    };
  }
}

function clear(segment: [LonLat, LonLat], avoid: MultiPolygon): boolean {
  return !turf.booleanIntersects(turf.lineString(segment), avoid);
}

/** A* on a local metric grid, then string-pulled so every kept segment is verified dry. */
function gridPath(from: LonLat, to: LonLat, avoid: MultiPolygon, o: FixtureRoutingOptions): LonLat[] | null {
  const lat0 = (from[1] + to[1]) / 2;
  const mPerLon = 111_320 * Math.cos((lat0 * Math.PI) / 180);
  const mPerLat = 110_540;
  const minLon = Math.min(from[0], to[0]) - o.padM / mPerLon;
  const minLat = Math.min(from[1], to[1]) - o.padM / mPerLat;
  const nx = Math.ceil(((Math.max(from[0], to[0]) - minLon) * mPerLon + o.padM) / o.cellM);
  const ny = Math.ceil(((Math.max(from[1], to[1]) - minLat) * mPerLat + o.padM) / o.cellM);
  const dLon = o.cellM / mPerLon;
  const dLat = o.cellM / mPerLat;

  // A cell is blocked if any polygon edge passes through it (exact, so thin strips can't slip
  // between samples) or its centre is inside the area. Moves between free cells then never cross water.
  const centre = (x: number, y: number): LonLat => [minLon + (x + 0.5) * dLon, minLat + (y + 0.5) * dLat];
  const blocked = new Uint8Array(nx * ny);
  const toGrid = (p: number[]) => [(p[0]! - minLon) / dLon, (p[1]! - minLat) / dLat] as const;
  for (const polygon of avoid.coordinates)
    for (const ring of polygon)
      for (let i = 0; i + 1 < ring.length; i++) markSegment(toGrid(ring[i]!), toGrid(ring[i + 1]!), nx, ny, blocked);
  for (let y = 0; y < ny; y++)
    for (let x = 0; x < nx; x++)
      if (!blocked[y * nx + x] && turf.booleanPointInPolygon(centre(x, y), avoid)) blocked[y * nx + x] = 1;

  const cellOf = (p: LonLat) => [
    Math.min(nx - 1, Math.max(0, Math.floor((p[0] - minLon) / dLon))),
    Math.min(ny - 1, Math.max(0, Math.floor((p[1] - minLat) / dLat))),
  ] as const;
  const [sx, sy] = cellOf(from);
  const [gx, gy] = cellOf(to);
  const start = sy * nx + sx;
  const goal = gy * nx + gx;
  blocked[start] = 0;
  blocked[goal] = 0;

  const cells = aStar(nx, ny, blocked, start, goal);
  if (!cells) return null;

  const raw: LonLat[] = [from, ...cells.slice(1, -1).map((i) => centre(i % nx, Math.floor(i / nx))), to];
  return stringPull(raw, avoid);
}

/** Marks every grid cell the segment a→b passes through (Amanatides–Woo traversal), clipped to the grid. */
function markSegment(a: readonly [number, number], b: readonly [number, number], nx: number, ny: number, out: Uint8Array) {
  let x = Math.floor(a[0]);
  let y = Math.floor(a[1]);
  const endX = Math.floor(b[0]);
  const endY = Math.floor(b[1]);
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const stepX = Math.sign(dx);
  const stepY = Math.sign(dy);
  const tDeltaX = stepX ? Math.abs(1 / dx) : Infinity;
  const tDeltaY = stepY ? Math.abs(1 / dy) : Infinity;
  let tMaxX = stepX ? (stepX > 0 ? x + 1 - a[0] : a[0] - x) * tDeltaX : Infinity;
  let tMaxY = stepY ? (stepY > 0 ? y + 1 - a[1] : a[1] - y) * tDeltaY : Infinity;
  for (let guard = 0; guard < 100_000; guard++) {
    if (x >= 0 && y >= 0 && x < nx && y < ny) out[y * nx + x] = 1;
    if (x === endX && y === endY) return;
    if (tMaxX < tMaxY) {
      tMaxX += tDeltaX;
      x += stepX;
    } else {
      tMaxY += tDeltaY;
      y += stepY;
    }
    if (tMaxX > 1 && tMaxY > 1 && (x !== endX || y !== endY)) {
      // Floating-point guard: we've passed b without landing exactly in its cell.
      if (x >= 0 && y >= 0 && x < nx && y < ny) out[y * nx + x] = 1;
      return;
    }
  }
}

function aStar(nx: number, ny: number, blocked: Uint8Array, start: number, goal: number): number[] | null {
  const g = new Float64Array(nx * ny).fill(Infinity);
  const came = new Int32Array(nx * ny).fill(-1);
  const closed = new Uint8Array(nx * ny);
  const gxy = [goal % nx, Math.floor(goal / nx)] as const;
  const h = (i: number) => {
    const dx = Math.abs((i % nx) - gxy[0]);
    const dy = Math.abs(Math.floor(i / nx) - gxy[1]);
    return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy);
  };
  const heap = new MinHeap();
  g[start] = 0;
  heap.push(start, h(start));
  while (heap.size > 0) {
    const cur = heap.pop();
    if (cur === goal) {
      const out = [cur];
      for (let c = came[cur]!; c !== -1; c = came[c]!) out.push(c);
      return out.reverse();
    }
    if (closed[cur]) continue;
    closed[cur] = 1;
    const cx = cur % nx;
    const cy = Math.floor(cur / nx);
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const x = cx + dx;
        const y = cy + dy;
        if (x < 0 || y < 0 || x >= nx || y >= ny) continue;
        const n = y * nx + x;
        if (blocked[n] || closed[n]) continue;
        if (dx && dy && (blocked[cy * nx + x] || blocked[y * nx + cx])) continue; // no corner cutting
        const cost = g[cur]! + (dx && dy ? Math.SQRT2 : 1);
        if (cost < g[n]!) {
          g[n] = cost;
          came[n] = cur;
          heap.push(n, cost + h(n));
        }
      }
  }
  return null;
}

function stringPull(raw: LonLat[], avoid: MultiPolygon): LonLat[] {
  const out: LonLat[] = [raw[0]!];
  let i = 0;
  while (i < raw.length - 1) {
    let j = i + 1;
    while (j + 1 < raw.length && clear([raw[i]!, raw[j + 1]!], avoid)) j++;
    out.push(raw[j]!);
    i = j;
  }
  return out;
}

class MinHeap {
  private readonly ids: number[] = [];
  private readonly keys: number[] = [];
  get size() {
    return this.ids.length;
  }
  push(id: number, key: number) {
    this.ids.push(id);
    this.keys.push(key);
    let i = this.ids.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.keys[p]! <= this.keys[i]!) break;
      this.swap(i, p);
      i = p;
    }
  }
  pop(): number {
    const top = this.ids[0]!;
    const lastId = this.ids.pop()!;
    const lastKey = this.keys.pop()!;
    if (this.ids.length > 0) {
      this.ids[0] = lastId;
      this.keys[0] = lastKey;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < this.keys.length && this.keys[l]! < this.keys[m]!) m = l;
        if (r < this.keys.length && this.keys[r]! < this.keys[m]!) m = r;
        if (m === i) break;
        this.swap(i, m);
        i = m;
      }
    }
    return top;
  }
  private swap(a: number, b: number) {
    [this.ids[a], this.ids[b]] = [this.ids[b]!, this.ids[a]!];
    [this.keys[a], this.keys[b]] = [this.keys[b]!, this.keys[a]!];
  }
}
