import { join } from "node:path";
import { createEfasSource } from "../adapters/out/signals/efas/index.js";
import efasFixture from "../adapters/out/signals/efas/fixtures/notifications-2024-09.json" with { type: "json" };
import { createGfmSource } from "../adapters/out/signals/gfm/index.js";
import type { SignalSource } from "../application/ports/out/signal-source.js";
import type { Config } from "./config.js";

/**
 * The ONLY place that lists signal plugins (ARCHITECTURE.md §6).
 * Adding a signal: one folder in adapters/out/signals/ and one line here. Turn one on or off with SIGNALS.
 */
export const signalPlugins = {
  efas: (c) => createEfasSource({
    zoneFiles: [join(c.dataDir, "flood", "krnov-q100.geojson")],
    notifications: { url: efasFixture.url, items: efasFixture.notifications as never },
  }),
  gfm: (c) => createGfmSource({ files: [join(c.dataDir, "flood", "opava-gfm-2024-09-15.geojson")] }),
} satisfies Record<string, (config: Config) => SignalSource>;

export const enabledSignalSources = (config: Config): SignalSource[] =>
  config.signals.map((id) => {
    const create = signalPlugins[id as keyof typeof signalPlugins];
    if (!create) throw new Error(`Unknown signal plugin "${id}" in SIGNALS (known: ${Object.keys(signalPlugins).join(", ")})`);
    return create(config);
  });
