import { getGreeting } from "@/lib/api-client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  try {
    const greeting = await getGreeting();
    return (
      <main>
        <h1>{greeting.message}</h1>
        <p>
          Web → API → <strong>{greeting.source}</strong> at{" "}
          <time dateTime={greeting.servedAt}>{greeting.servedAt}</time>
        </p>
      </main>
    );
  } catch (error) {
    return (
      <main>
        <h1>API unreachable</h1>
        <p>{error instanceof Error ? error.message : String(error)}</p>
        <p>Start it with <code>pnpm dev</code> and make sure Postgres is up (<code>pnpm db:up</code>).</p>
      </main>
    );
  }
}
