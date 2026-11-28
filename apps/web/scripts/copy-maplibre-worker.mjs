// MapLibre 6 loads its web worker from a file next to its own module. Turbopack chunks don't keep
// that file, so we serve it from public/ and point MapLibre at it (setWorkerUrl in crew-map.tsx).
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const source = join(dirname(require.resolve("maplibre-gl/package.json")), "dist", "maplibre-gl-worker.mjs");
const target = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "maplibre-gl-worker.mjs");
mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);
