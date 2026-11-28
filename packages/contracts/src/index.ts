import { z } from "zod";

/**
 * Wire contracts shared by the API (producer) and the web app (consumer).
 * Only data shapes live here — no business rules.
 */
export const GreetingResponse = z.object({
  message: z.string(),
  source: z.enum(["postgres", "memory"]),
  servedAt: z.iso.datetime(),
});
export type GreetingResponse = z.infer<typeof GreetingResponse>;
