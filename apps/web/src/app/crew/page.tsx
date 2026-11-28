import type { Metadata, Viewport } from "next";
import { CrewView } from "@/features/crew-task/crew-view";
import { DEFAULT_CREW_ID, DEFAULT_REPLAY_NOW } from "@/features/crew-task/replay";
import { api } from "@/lib/api-client";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Crew" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0f172a" };

type Props = { searchParams: Promise<{ now?: string; crew?: string }> };

const CrewPage = async ({ searchParams }: Props) => {
  await getCurrentUser(); // no session: redirects to /sign-in
  const { now = DEFAULT_REPLAY_NOW, crew = DEFAULT_CREW_ID } = await searchParams;
  const [open, hazards] = await Promise.all([api.openTasks(crew), api.routeHazards(now)]);
  if (!open.ok || !hazards.ok) {
    const error = !open.ok ? open.error : !hazards.ok ? hazards.error : null;
    return (
      <main style={{ padding: 24 }}>
        <h1>Crew view unavailable</h1>
        <p>{error?.message}</p>
      </main>
    );
  }
  return <CrewView now={now} crewId={crew} initialTasks={open.data.tasks} hazards={hazards.data} />;
};

export default CrewPage;
