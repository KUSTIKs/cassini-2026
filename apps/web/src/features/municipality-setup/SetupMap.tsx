"use client";

import type { Area, Substation } from "@firstreach/contracts";
import type { LayerSpecification } from "maplibre-gl";
import { useMemo } from "react";
import { MapView } from "@/components/map/MapView";
import { boundsOf } from "@/lib/geo";
import { useMapPreview } from "./MapPreviewContext";
import styles from "./SetupMap.module.css";

// Colours mirror the CSS tokens; MapLibre paint needs literal values.
const TEAL = "#0e7c74"; // --accent: the boundary being previewed
const POWER = "#d97706"; // --power: substations
const INK = "#1a1c21"; // --text
const WHITE = "#ffffff"; // --surface

const LAYERS: readonly LayerSpecification[] = [
  { id: "area-fill", type: "fill", source: "area", paint: { "fill-color": INK, "fill-opacity": 0.04 } },
  { id: "area-line", type: "line", source: "area", paint: { "line-color": INK, "line-width": 1.5 } },
  { id: "preview-fill", type: "fill", source: "preview", paint: { "fill-color": TEAL, "fill-opacity": 0.08 } },
  { id: "preview-line", type: "line", source: "preview", paint: { "line-color": TEAL, "line-width": 2, "line-dasharray": [2, 1.5] } },
  {
    id: "substations",
    type: "circle",
    source: "substations",
    paint: {
      // Size by how many registered people depend on the substation.
      "circle-radius": ["interpolate", ["linear"], ["get", "people"], 0, 5, 10, 9, 30, 14],
      "circle-color": POWER,
      "circle-stroke-color": WHITE,
      "circle-stroke-width": 2,
    },
  },
  {
    id: "substation-labels",
    type: "symbol",
    source: "substations",
    layout: {
      "text-field": ["get", "label"],
      "text-size": 11,
      "text-font": ["Noto Sans Regular"],
      // Substations often sit side by side (110 kV next to 22 kV): try other sides before hiding a count.
      "text-variable-anchor": ["top", "bottom", "left", "right"],
      "text-radial-offset": 1.1,
    },
    paint: { "text-color": INK, "text-halo-color": WHITE, "text-halo-width": 1.5 },
  },
];

const EMPTY = { type: "FeatureCollection", features: [] } as const;

type SetupMapProps = { area: Area | null; substations: Substation[] };

export const SetupMap = ({ area, substations }: SetupMapProps) => {
  const { preview } = useMapPreview();

  const sources = useMemo(
    () => ({
      area: area ?? EMPTY,
      preview: preview ?? EMPTY,
      substations: {
        type: "FeatureCollection" as const,
        features: substations.map((s) => ({
          type: "Feature" as const,
          geometry: { type: "Point" as const, coordinates: [s.location.lng, s.location.lat] },
          properties: { people: s.dependentPeople, label: s.dependentPeople > 0 ? String(s.dependentPeople) : "" },
        })),
      },
    }),
    [area, preview, substations],
  );

  const focus = preview ?? area;
  const fitTo = useMemo(() => (focus ? boundsOf(focus) : null), [focus]);

  return (
    <div className={styles.frame}>
      <MapView sources={sources} layers={LAYERS} fitTo={fitTo} label="Map of the municipality's area and substations" />
      <Legend hasArea={area !== null} hasPreview={preview !== null} hasSubstations={substations.length > 0} />
    </div>
  );
};

const Legend = ({ hasArea, hasPreview, hasSubstations }: { hasArea: boolean; hasPreview: boolean; hasSubstations: boolean }) => {
  if (!hasArea && !hasPreview) return <p className={styles.hint}>The municipality&apos;s area appears here once you choose it.</p>;
  return (
    <ul className={styles.legend}>
      {hasArea && <li><span className={styles.keyArea} />Municipality area</li>}
      {hasPreview && <li><span className={styles.keyPreview} />Previewing</li>}
      {hasSubstations && <li><span className={styles.keySubstation} />Substation · number of people who depend on it</li>}
    </ul>
  );
};
