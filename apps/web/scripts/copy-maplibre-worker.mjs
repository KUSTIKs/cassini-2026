// MapLibre 6 loads its web worker from a separate file resolved next to its own module,
// which breaks once the bundler moves the module. Serve the (self-contained) worker from /public instead.
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const dist = dirname(require.resolve("maplibre-gl/dist/maplibre-gl-worker.mjs"));
const target = new URL("../public/vendor/", import.meta.url).pathname;
mkdirSync(target, { recursive: true });
copyFileSync(join(dist, "maplibre-gl-worker.mjs"), join(target, "maplibre-gl-worker.mjs"));
console.log("copied maplibre-gl-worker.mjs → public/vendor/");
