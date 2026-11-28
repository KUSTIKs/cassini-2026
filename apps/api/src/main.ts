import { serve } from "@hono/node-server";
import { loadConfig } from "./composition/config.js";
import { buildContainer } from "./composition/container.js";

const config = loadConfig();
const { http, close } = buildContainer(config);

const server = serve({ fetch: http.fetch, port: config.port }, (info) => {
  console.log(`api listening on http://localhost:${info.port}`);
});

const shutdown = async () => {
  server.close();
  await close();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
