"use client";

import type { AlertDetail } from "@firstreach/contracts";
import type { LayerSpecification } from "maplibre-gl";
import { useMemo } from "react";
import { MapView } from "@/components/map/MapView";
import { boundsOf } from "@/lib/geo";
import { urgencyOf } from "./labels";
import styles from "./AlertMap.module.css";

// Colours mirror the CSS tokens; MapLibre paint needs literal values.
const WATER = "#3d6fb5"; // --water
const POWER = "#d97706"; // --power
const INK = "#1a1c21"; // --text
const WHITE = "#ffffff";
const URGENCY = ["match", ["get", "urgency"], "critical", "#c0352b", "soon", "#a8590b", "#686d78"];

const LAYERS: readonly LayerSpecification[] = [
  { id: "forecast-fill", type: "fill", source: "forecast", paint: { "fill-color": WATER, "fill-opacity": 0.12 } },
  { id: "forecast-line", type: "line", source: "forecast", paint: { "line-color": WATER, "line-width": 1.2, "line-dasharray": [2, 1.5] } },
  { id: "observed-fill", type: "fill", source: "observed", paint: { "fill-color": WATER, "fill-opacity": 0.55 } },
  {
    id: "people", type: "circle", source: "people",
    paint: {
      "circle-radius": ["case", ["get", "selected"], 8, 5],
      "circle-color": URGENCY as never,
      "circle-stroke-color": ["case", ["get", "selected"], INK, WHITE],
      "circle-stroke-width": ["case", ["get", "selected"], 2.5, 1.5],
    },
  },
  {
    id: "substations", type: "circle", source: "substations",
    paint: { "circle-radius": 7, "circle-color": POWER, "circle-stroke-color": INK, "circle-stroke-width": 2 },
  },
];

const collection = <T,>(features: T[]) => ({ type: "FeatureCollection" as const, features });
const areaFeature = (area: AlertDetail["signals"][number]["area"]) => ({ type: "Feature" as const, geometry: area, properties: {} });

/** The alert on a map. People appear only when the viewer may see where they live. */
export const AlertMap = ({ alert, selectedId }: { alert: AlertDetail; selectedId: string | null }) => {
  const sources = useMemo(
    () => ({
      forecast: collection(alert.signals.filter((s) => s.stage === "forecast").map((s) => areaFeature(s.area))),
      observed: collection(alert.signals.filter((s) => s.stage === "observed").map((s) => areaFeature(s.area))),
      substations: collection(alert.substations.map((s) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [s.location.lng, s.location.lat] },
        properties: {},
      }))),
      people: collection(alert.people.flatMap((p) => (p.details ? [{
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [p.details.location.lng, p.details.location.lat] },
        properties: { urgency: urgencyOf(p.hoursLeft), selected: p.personId === selectedId },
      }] : []))),
    }),
    [alert, selectedId],
  );

  const fitTo = useMemo(() => {
    const points = [...alert.substations.map((s) => s.location), ...alert.people.flatMap((p) => (p.details ? [p.details.location] : []))];
    if (points.length === 0) {
      const forecast = alert.signals.find((s) => s.stage === "forecast");
      return forecast ? boundsOf(forecast.area) : null;
    }
    const pad = 0.004;
    return [
      Math.min(...points.map((p) => p.lng)) - pad, Math.min(...points.map((p) => p.lat)) - pad,
      Math.max(...points.map((p) => p.lng)) + pad, Math.max(...points.map((p) => p.lat)) + pad,
    ] as [number, number, number, number];
  }, [alert]);

  return (
    <div className={styles.frame}>
      <MapView sources={sources} layers={LAYERS} fitTo={fitTo} label="Map of the flood zone, exposed substations and people on the alert" />
      <ul className={styles.legend}>
        <li><span className={styles.keyForecast} />Forecast flood zone</li>
        {alert.signals.some((s) => s.stage === "observed") && <li><span className={styles.keyObserved} />Water seen by Sentinel-1</li>}
        <li><span className={styles.keySubstation} />Substation in the zone</li>
        {!alert.sealed && <li><span className={styles.keyPerson} />Person, by hours left</li>}
      </ul>
    </div>
  );
};
