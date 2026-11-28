"use client";

import type { LonLat, RouteHazardsResponse, TaskResponse } from "@lifeline/contracts";
import type { Feature, FeatureCollection } from "geojson";
import type { FitBoundsOptions, GeoJSONSource, LngLatBoundsLike, Map as MapLibreMap, MapLayerMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import styles from "./crew.module.css";

export type MapTask = { task: TaskResponse; destination: LonLat | null };

type Props = {
  hazards: RouteHazardsResponse;
  tasks: MapTask[];
  selectedId: string | null;
  onSelect: (taskId: string) => void;
};

const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
/** Copied into public/ by scripts/copy-maplibre-worker.mjs (predev/prebuild). */
const WORKER_URL = "/maplibre-gl-worker.mjs";
const KRNOV_CENTER: LonLat = [17.695, 50.09];
// Bottom padding clears the attribution box; top clears the legend.
const FIT: FitBoundsOptions = { padding: { top: 80, bottom: 90, left: 40, right: 50 }, maxZoom: 16 };
/** Last area each map was fitted to, so it can re-fit when the panel below grows or shrinks. */
const lastFit = new WeakMap<MapLibreMap, LngLatBoundsLike>();

/** MapLibre map for the crew: flood areas, the selected route, the last dry point and person pins. */
export function CrewMap({ hazards, tasks, selectedId, onSelect }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const ready = useRef(false);
  const latest = useRef({ hazards, tasks, selectedId });
  latest.current = { hazards, tasks, selectedId };
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    let cancelled = false;
    void import("maplibre-gl").then((maplibregl) => {
      if (cancelled || !container.current) return;
      maplibregl.setWorkerUrl(new URL(WORKER_URL, window.location.origin).href);
      const map = new maplibregl.Map({ container: container.current, style: STYLE_URL, center: KRNOV_CENTER, zoom: 13.2 });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      mapRef.current = map;
      map.on("load", () => {
        addLayers(map);
        ready.current = true;
        render(map, latest.current, true);
      });
      map.on("click", "people", (e: MapLayerMouseEvent) => {
        const id = e.features?.[0]?.properties?.taskId;
        if (typeof id === "string") onSelectRef.current(id);
      });
      map.on("resize", () => {
        const bounds = lastFit.get(map);
        if (bounds) map.fitBounds(bounds, { ...FIT, duration: 0 });
      });
      map.on("mouseenter", "people", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "people", () => (map.getCanvas().style.cursor = ""));
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      ready.current = false;
    };
  }, []);

  useEffect(() => {
    if (mapRef.current && ready.current) render(mapRef.current, { hazards, tasks, selectedId }, false);
  }, [hazards, tasks, selectedId]);

  return <div ref={container} className={styles.map} aria-label="Crew map" />;
}

function addLayers(map: MapLibreMap) {
  const empty = { type: "FeatureCollection", features: [] } as FeatureCollection;
  for (const id of ["blind", "hazards", "routes", "walk", "people", "start"]) map.addSource(id, { type: "geojson", data: empty });

  // Where the satellite couldn't see (e.g. GFM exclusion mask over built-up areas): grey, dotted edge.
  map.addLayer({ id: "blind-fill", type: "fill", source: "blind", paint: { "fill-color": "#64748b", "fill-opacity": 0.16 } });
  map.addLayer({
    id: "blind-line",
    type: "line",
    source: "blind",
    paint: { "line-color": "#475569", "line-width": 1, "line-dasharray": [0.5, 2] },
  });

  map.addLayer({
    id: "hazards-fill",
    type: "fill",
    source: "hazards",
    paint: {
      "fill-color": ["match", ["get", "stage"], "observed", "#1d4ed8", "#60a5fa"],
      "fill-opacity": ["match", ["get", "stage"], "observed", 0.42, 0.22],
    },
  });
  map.addLayer({
    id: "hazards-line",
    type: "line",
    source: "hazards",
    paint: {
      "line-color": ["match", ["get", "stage"], "observed", "#1e3a8a", "#2563eb"],
      "line-width": 1.5,
      "line-dasharray": ["match", ["get", "stage"], "forecast", ["literal", [2, 2]], ["literal", [1, 0]]],
    },
  });
  map.addLayer({
    id: "routes-other",
    type: "line",
    source: "routes",
    filter: ["!", ["get", "selected"]],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#64748b", "line-width": 3, "line-opacity": 0.5 },
  });
  map.addLayer({
    id: "routes-casing",
    type: "line",
    source: "routes",
    filter: ["get", "selected"],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#ffffff", "line-width": 9 },
  });
  map.addLayer({
    id: "routes-selected",
    type: "line",
    source: "routes",
    filter: ["get", "selected"],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#16a34a", "line-width": 5 },
  });
  map.addLayer({
    id: "walk",
    type: "line",
    source: "walk",
    paint: { "line-color": "#b45309", "line-width": 3, "line-dasharray": [1, 1.5] },
  });
  map.addLayer({
    id: "start",
    type: "circle",
    source: "start",
    paint: { "circle-radius": 7, "circle-color": "#0f172a", "circle-stroke-color": "#fff", "circle-stroke-width": 2 },
  });
  map.addLayer({
    id: "people",
    type: "circle",
    source: "people",
    paint: {
      "circle-radius": ["case", ["get", "selected"], 10, 7],
      "circle-color": ["case", ["get", "inWater"], "#b45309", "#dc2626"],
      "circle-stroke-color": "#fff",
      "circle-stroke-width": 2,
    },
  });
  map.addLayer({
    id: "people-label",
    type: "symbol",
    source: "people",
    layout: { "text-field": ["get", "label"], "text-size": 11, "text-offset": [0, 1.4], "text-anchor": "top" },
    paint: { "text-color": "#0f172a", "text-halo-color": "#fff", "text-halo-width": 1.5 },
  });
}

function render(map: MapLibreMap, { hazards, tasks, selectedId }: Omit<Props, "onSelect">, initial: boolean) {
  const set = (id: string, features: Feature[]) =>
    (map.getSource(id) as GeoJSONSource | undefined)?.setData({ type: "FeatureCollection", features });

  set(
    "blind",
    hazards.signals.flatMap((s) => (s.unobserved ? [{ type: "Feature" as const, geometry: s.unobserved, properties: {} }] : [])),
  );
  set(
    "hazards",
    hazards.signals.map((s) => ({ type: "Feature", geometry: s.area, properties: { stage: s.stage, label: s.label } })),
  );
  set(
    "routes",
    tasks.flatMap(({ task }) =>
      task.route ? [{ type: "Feature" as const, geometry: task.route.line, properties: { selected: task.id === selectedId } }] : [],
    ),
  );
  const selected = tasks.find((t) => t.task.id === selectedId);
  const route = selected?.task.route;
  set(
    "walk",
    route?.destinationInHazard
      ? [{ type: "Feature", geometry: { type: "LineString", coordinates: [route.endPoint, route.to] }, properties: {} }]
      : [],
  );
  set("start", route ? [{ type: "Feature", geometry: { type: "Point", coordinates: route.from }, properties: {} }] : []);
  set(
    "people",
    tasks.flatMap(({ task, destination }) =>
      destination
        ? [
            {
              type: "Feature" as const,
              geometry: { type: "Point" as const, coordinates: destination },
              properties: { taskId: task.id, label: task.id, selected: task.id === selectedId, inWater: !!task.route?.destinationInHazard },
            },
          ]
        : [],
    ),
  );

  const points: LonLat[] = route
    ? [...(route.line.coordinates as LonLat[]), route.to]
    : initial
      ? tasks.flatMap((t) => (t.destination ? [t.destination] : []))
      : [];
  if (points.length >= 2) {
    const lons = points.map((p) => p[0]);
    const lats = points.map((p) => p[1]);
    const bounds: LngLatBoundsLike = [
      [Math.min(...lons), Math.min(...lats)],
      [Math.max(...lons), Math.max(...lats)],
    ];
    lastFit.set(map, bounds);
    map.fitBounds(bounds, { ...FIT, duration: initial ? 0 : 600 });
  }
}
