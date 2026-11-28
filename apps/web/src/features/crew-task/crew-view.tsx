"use client";

import type { OpenTasksResponse, RouteHazardsResponse, TaskResponse } from "@firstreach/contracts";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { routeTaskAction, satelliteUpdateAction } from "@/app/crew/actions";
import { CrewMap } from "./crew-map";
import styles from "./crew.module.css";
import { CREW_REPLAY_STOPS } from "./replay";

type Props = {
  now: string;
  crewId: string;
  initialTasks: OpenTasksResponse["tasks"];
  hazards: RouteHazardsResponse;
};

const BRING_LABEL: Record<string, string> = { generator: "Generator", oxygen: "Spare oxygen", transport: "Transport" };
const BASIS_LABEL: Record<NonNullable<TaskResponse["route"]>["basis"], string> = {
  observed: "Avoids satellite-observed water and the forecast zone (the satellite can't see everywhere)",
  forecast: "Avoids the forecast flood zone",
  none: "No flood area active",
};

/** Flow 4 crew screen (mobile first): task card, Route button, map; Flow 5 reroute banner. */
export function CrewView({ now, crewId, initialTasks, hazards }: Props) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedId, setSelectedId] = useState<string | null>(initialTasks[0]?.task.id ?? null);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => setTasks(initialTasks), [initialTasks]);

  const selected = tasks.find((t) => t.task.id === selectedId) ?? null;
  const route = selected?.task.route ?? null;

  const routeSelected = () => {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const res = await routeTaskAction(selected.task.id, now);
      if (!res.ok) return setError(res.error.message);
      setTasks((ts) => ts.map((t) => (t.task.id === res.data.id ? { ...t, task: res.data } : t)));
    });
  };

  const goTo = (stopNow: string) => {
    setError(null);
    startTransition(async () => {
      if (stopNow > now) {
        const res = await satelliteUpdateAction(stopNow);
        if (!res.ok) return setError(res.error.message);
        const n = res.data.rerouted.length;
        setBanner(
          res.data.basis === "observed"
            ? `Satellite flood map in: ${n} route${n === 1 ? "" : "s"} re-checked${res.data.failed.length ? `, ${res.data.failed.length} could not be re-routed` : ""}.`
            : null,
        );
      } else {
        setBanner(null);
      }
      router.push(`/crew?now=${encodeURIComponent(stopNow)}&crew=${encodeURIComponent(crewId)}`);
    });
  };

  return (
    <div className={styles.screen}>
      <header className={styles.top}>
        <span className={styles.brand}>Lifeline · Crew</span>
        <nav className={styles.stops} aria-label="Replay time">
          {CREW_REPLAY_STOPS.map((s) => (
            <button
              key={s.now}
              type="button"
              className={`${styles.stop} ${s.now === now ? styles.stopActive : ""}`}
              aria-pressed={s.now === now}
              disabled={pending}
              onClick={() => s.now !== now && goTo(s.now)}
            >
              {s.label}
              <small>{s.detail}</small>
            </button>
          ))}
        </nav>
      </header>
      {banner && (
        <p className={styles.banner} role="status">
          {banner}
        </p>
      )}

      <div className={styles.mapWrap}>
        <CrewMap hazards={hazards} tasks={tasks} selectedId={selectedId} onSelect={setSelectedId} />
        <div className={styles.legend}>
          {hazards.signals.length === 0 && <div>No flood area active</div>}
          {hazards.signals.map((s) => (
            <div key={s.id}>
              <span className={`${styles.swatch} ${s.stage === "observed" ? styles.swObserved : styles.swForecast}`} />
              {s.label}
              {s.euSpace === "copernicus" ? " · Copernicus" : ""}
            </div>
          ))}
          {hazards.signals.some((s) => s.unobserved) && (
            <div>
              <span className={`${styles.swatch} ${styles.swBlind}`} />
              Satellite couldn&apos;t see here (built-up area); forecast zone still avoided
            </div>
          )}
        </div>
      </div>

      <section className={styles.sheet} aria-label="Task">
        <div className={styles.tabs} role="tablist">
          {tasks.map(({ task }) => (
            <button
              key={task.id}
              type="button"
              role="tab"
              aria-selected={task.id === selectedId}
              className={`${styles.tab} ${task.id === selectedId ? styles.tabActive : ""}`}
              onClick={() => setSelectedId(task.id)}
            >
              {task.id}
              {task.route?.rerouteReason && <span className={styles.dot} aria-label="route changed" />}
            </button>
          ))}
        </div>

        {!selected && <p className={styles.note}>No open tasks for {crewId}.</p>}
        {selected && (
          <>
            <div className={styles.cardHead}>
              <h2>Person {selected.task.personId}</h2>
              <span className={styles.state}>{selected.task.state.replace("_", " ")}</span>
            </div>
            <div className={styles.chips}>
              {selected.task.bring.map((b) => (
                <span key={b} className={styles.chip}>
                  Bring: {BRING_LABEL[b] ?? b}
                </span>
              ))}
            </div>

            <button type="button" className={styles.routeBtn} onClick={routeSelected} disabled={pending}>
              {pending ? "Routing…" : route ? "Re-route from start" : "Route"}
            </button>
            {error && <p className={styles.error}>{error}</p>}

            {route && (
              <>
                <div className={styles.summary}>
                  <div className={styles.metric}>
                    {(route.distanceM / 1000).toFixed(1)} km<small>drive</small>
                  </div>
                  <div className={styles.metric}>
                    {Math.max(1, Math.round(route.durationS / 60))} min<small>estimate</small>
                  </div>
                </div>
                <p className={styles.note}>{BASIS_LABEL[route.basis]}</p>
                {route.destinationInHazard && (
                  <p className={styles.warn}>
                    The address is inside the water. The drive ends at the last dry point; about{" "}
                    {Math.round(route.walkRemainingM ?? 0)} m remain on foot or by boat.
                  </p>
                )}
                {route.rerouteReason && <p className={styles.warn}>Route changed: {route.rerouteReason}</p>}
                <p className={styles.note}>
                  Start: Krnov fire station (fixed for the replay). Live, this is the phone&apos;s GNSS position, which includes
                  Galileo.
                  {route.provider === "fixture" ? " Offline schematic route, not on roads." : ` Route: ${route.provider}.`}
                </p>
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}
