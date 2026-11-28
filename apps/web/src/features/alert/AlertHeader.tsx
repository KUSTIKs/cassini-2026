import type { AlertDetail } from "@firstreach/contracts";
import { Badge } from "@/components/ui/Badge";
import { LockIcon } from "@/components/ui/icons";
import { hours, when } from "./labels";
import styles from "./AlertHeader.module.css";

/** What triggered the alert, from which EU space source, and how long until the power goes. */
export const AlertHeader = ({ alert }: { alert: AlertDetail }) => {
  const soonest = Math.min(...alert.substations.map((s) => s.hoursUntilOutage));
  return (
    <header className={styles.header}>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>Flood warning: {alert.municipalityName}</h1>
        <Badge tone={alert.status === "active" ? "success" : "neutral"}>{alert.status === "active" ? "Active" : "Closed"}</Badge>
        {alert.sealed && <Badge icon={<LockIcon />}>Names sealed for your role</Badge>}
      </div>
      <p className={styles.lead}>
        {alert.people.length} {alert.people.length === 1 ? "person" : "people"} who depend on electricity at home are behind{" "}
        {alert.substations.length} {alert.substations.length === 1 ? "substation" : "substations"} in the flood zone.{" "}
        {Number.isFinite(soonest) && (soonest > 0 ? `Power is expected to go in about ${hours(soonest)}.` : "The water is there now.")}{" "}
        <span className={styles.asOf}>As of {when(alert.updatedAt)}.</span>
      </p>
      <ul className={styles.signals} aria-label="Sources">
        {alert.signals.map((s) => (
          <li key={s.id} className={styles.signal}>
            <span className={styles.stage} data-stage={s.stage}>{s.stage === "forecast" ? "Forecast" : "Observed"}</span>
            <span className={styles.signalLabel}>{s.label}</span>
            <span className={styles.signalMeta}>
              {s.stage === "forecast" ? `issued ${when(s.issuedAt)}` : `seen ${when(s.issuedAt)}`}
              {s.expectedAt && ` · water expected ${when(s.expectedAt)}`}
            </span>
            {s.euSpace && <Badge tone="success">{s.euSpace === "copernicus" ? "Copernicus" : "Galileo"}</Badge>}
          </li>
        ))}
      </ul>
    </header>
  );
};
