"use client";

import type { Area } from "@firstreach/contracts";
import { createContext, use, useMemo, useState, type ReactNode } from "react";

/**
 * One piece of shared UI state: the area being previewed while choosing a boundary.
 * The area step writes it; the map reads it. Nothing else is shared.
 */
type MapPreview = { preview: Area | null; setPreview: (area: Area | null) => void };

const MapPreviewContext = createContext<MapPreview | null>(null);

export const MapPreviewProvider = ({ children }: { children: ReactNode }) => {
  const [preview, setPreview] = useState<Area | null>(null);
  const value = useMemo(() => ({ preview, setPreview }), [preview]);
  return <MapPreviewContext value={value}>{children}</MapPreviewContext>;
};

export const useMapPreview = () => {
  const context = use(MapPreviewContext);
  if (!context) throw new Error("useMapPreview must be used inside <MapPreviewProvider>");
  return context;
};
