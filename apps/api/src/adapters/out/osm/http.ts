import { UpstreamError } from "../../../application/errors.js";

/** Identifies the app to OSM services, as their usage policies require. No personal data. */
export const USER_AGENT = "FirstReach/0.1 (CASSINI Hackathon 2026 demo)";

export const fetchJson = async (
  service: string,
  url: string,
  init: RequestInit = {},
  timeoutMs = 25_000,
): Promise<unknown> => {
  try {
    const res = await fetch(url, {
      ...init,
      headers: { "User-Agent": USER_AGENT, Accept: "application/json", ...init.headers },
      signal: init.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    throw new UpstreamError(service, error);
  }
};

/**
 * Serialises calls and keeps at least `intervalMs` between their starts.
 * Nominatim allows at most 1 request per second; concurrent callers queue up instead of racing.
 */
export const createThrottle = (intervalMs: number) => {
  let tail: Promise<unknown> = Promise.resolve();
  let lastStart = 0;
  return <T>(task: () => Promise<T>): Promise<T> => {
    const run = async () => {
      const wait = lastStart + intervalMs - Date.now();
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
      lastStart = Date.now();
      return task();
    };
    const result = tail.then(run, run);
    tail = result.catch(() => undefined); // one failure must not block the queue
    return result;
  };
};
