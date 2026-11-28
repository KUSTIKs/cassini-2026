"use client";

import {
  GeoJSONSource,
  Map as MapLibreMap,
  NavigationControl,
  type GeoJSONSourceSpecification,
  type LayerSpecification,
  type LngLatLike,
  setWorkerUrl,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import styles from "./MapView.module.css";

type GeoJSONData = GeoJSONSourceSpecification["data"];
export type MapBounds = [west: number, south: number, east: number, north: number];

type MapViewProps = {
  /** GeoJSON per source id. Pass a memoised object: identity changes trigger a data sync. */
  sources: Record<string, GeoJSONData>;
  /** Static layer list (define at module level). Layers reference the sources above. */
  layers: readonly LayerSpecification[];
  /** Fits the camera when the bounds change (compared by value). */
  fitTo: MapBounds | null;
  label: string;
};

const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";
/** Copied from the package by scripts/copy-maplibre-worker.mjs (bundlers can't resolve it). */
const WORKER_URL = "/vendor/maplibre-gl-worker.mjs";
const CZECHIA: LngLatLike = [15.47, 49.82];

/**
 * Thin declarative wrapper over MapLibre.
 * - The map is created once per mount and removed on unmount (safe under StrictMode's double mount).
 * - Sources and layers are applied only after the style has loaded; until then, props simply wait.
 */
export const MapView = ({ sources, layers, fitTo, label }: MapViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    setWorkerUrl(new URL(WORKER_URL, window.location.origin).href);
    const map = new MapLibreMap({
      container: containerRef.current,
      style: STYLE_URL,
      center: CZECHIA,
      zoom: 6,
      attributionControl: { compact: true },
      cooperativeGestures: false,
    });
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    map.once("load", () => setLoaded(true));
    mapRef.current = map;
    return () => {
      mapRef.current = null;
      setLoaded(false);
      map.remove();
    };
  }, []);

  // Sync data and layers. Idempotent: add what's missing, update what exists.
  useEffect(() => {
    const map = mapRef.current;
    if (!loaded || !map) return;
    for (const [id, data] of Object.entries(sources)) {
      const source = map.getSource(id);
      if (source instanceof GeoJSONSource) source.setData(data);
      else map.addSource(id, { type: "geojson", data });
    }
    for (const layer of layers) if (!map.getLayer(layer.id)) map.addLayer(layer);
  }, [loaded, sources, layers]);

  // Camera: refit only when the bounds actually change.
  const fitKey = fitTo?.join(",") ?? "";
  useEffect(() => {
    const map = mapRef.current;
    if (!loaded || !map || !fitTo) return;
    map.fitBounds(fitTo, { padding: 48, duration: 700, maxZoom: 14 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fitKey is the value identity of fitTo
  }, [loaded, fitKey]);

  return <div ref={containerRef} className={styles.map} role="region" aria-label={label} />;
};
