import type { Metadata, Viewport } from "next";
import { CrewView } from "@/features/crew-task/crew-view";
import { DEFAULT_CREW_ID, DEFAULT_REPLAY_NOW } from "@/features/crew-task/replay";
import { getOpenTasks, getRouteHazards } from "@/lib/api-client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Lifeline · Crew" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0f172a" };

type Props = { searchParams: Promise<{ now?: string; crew?: string }> };

export default async function CrewPage({ searchParams }: Props) {
  const { now = DEFAULT_REPLAY_NOW, crew = DEFAULT_CREW_ID } = await searchParams;
  try {
    const [open, hazards] = await Promise.all([getOpenTasks(crew), getRouteHazards(now)]);
    return <CrewView now={now} crewId={crew} initialTasks={open.tasks} hazards={hazards} />;
  } catch (error) {
    return (
      <main style={{ padding: 24 }}>
        <h1>API unreachable</h1>
        <p>{error instanceof Error ? error.message : String(error)}</p>
        <p>
          Start it with <code>pnpm dev</code>.
        </p>
      </main>
    );
  }
}
