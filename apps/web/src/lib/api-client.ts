import "server-only";
import { GreetingResponse } from "@lifeline/contracts";

/**
 * Web-side adapter for the API. Components never call fetch() directly;
 * they use these functions, which validate responses against the shared contract.
 */
const API_URL = process.env.API_URL ?? "http://localhost:4000";

export async function getGreeting(): Promise<GreetingResponse> {
  const res = await fetch(`${API_URL}/greeting`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API responded ${res.status}`);
  return GreetingResponse.parse(await res.json());
}
