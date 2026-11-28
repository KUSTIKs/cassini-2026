import type { AlertPersonDetail } from "@firstreach/contracts";
import Link from "next/link";
import { BRING_LABEL, DEVICE_LABEL, hours, MOBILITY_LABEL, STATE_LABEL, urgencyOf, when } from "./labels";
import styles from "./PersonPanel.module.css";
import { StatusForm } from "./StatusForm";

type Props = { alertId: string; person: AlertPersonDetail; municipalityName: string; closeHref: string };

/** A short, plain script, so whoever calls says the same important things. */
const callScript = (p: AlertPersonDetail, town: string) =>
  `Hello, this is the flood commission of ${town}. A flood warning means the power at your home may go out in about ` +
  `${hours(p.hoursUntilOutage)}. Is your ${DEVICE_LABEL[p.device].toLowerCase()} charged, and how long does your backup last? ` +
  `Is someone with you, and can you stay with family elsewhere? Do you need us to bring anything?`;

export const PersonPanel = ({ alertId, person, municipalityName, closeHref }: Props) => {
  const d = person.details;
  return (
    <aside className={styles.panel} aria-labelledby="person-name">
      <header className={styles.head}>
        <div>
          <p className={styles.rank}>#{person.rank} on the list</p>
          <h2 id="person-name" className={styles.name}>{d.fullName}</h2>
        </div>
        <Link href={closeHref} scroll={false} className={styles.close} aria-label="Close">✕</Link>
      </header>

      <a className={styles.phone} href={`tel:${d.phone.replace(/\s/g, "")}`}>{d.phone}</a>
      <p className={styles.address}>{d.address}</p>

      <dl className={styles.facts}>
        <dt>Time left</dt>
        <dd><span className={styles.left} data-urgency={urgencyOf(person.hoursLeft)}>{hours(person.hoursLeft)}</span> <span className={styles.muted}>outage in {hours(person.hoursUntilOutage)} + {hours(person.backupHours)} battery</span></dd>
        <dt>Device</dt><dd>{DEVICE_LABEL[person.device]}</dd>
        <dt>Home</dt><dd>{person.livesAlone ? "Lives alone" : "Not alone"} · {MOBILITY_LABEL[person.mobility]} · {person.floor === 0 ? "ground floor" : `floor ${person.floor}`}{person.homeInZone && " · home in the flood zone"}</dd>
        <dt>Carer</dt><dd>{d.carerName ? <>{d.carerName}{d.carerPhone && <>, <a href={`tel:${d.carerPhone.replace(/\s/g, "")}`}>{d.carerPhone}</a></>}</> : <span className={styles.muted}>None listed</span>}</dd>
        <dt>Register ref.</dt><dd className={styles.muted}>{d.externalRef}</dd>
      </dl>

      <details className={styles.script}>
        <summary>Call script</summary>
        <p>{callScript(person, municipalityName)}</p>
      </details>

      <StatusForm alertId={alertId} personId={person.personId} current={person.contact.state} attempts={person.contact.attempts} />

      {person.task && (
        <p className={styles.task}>
          Fire service task {person.task.state === "open" ? "open" : person.task.state === "en_route" ? "en route" : "done"}:{" "}
          {person.task.bring.map((b) => BRING_LABEL[b]).join(", ")}
        </p>
      )}

      {person.history.length > 0 && (
        <section className={styles.history} aria-label="Call history">
          <h3>History</h3>
          <ol>
            {person.history.map((h) => (
              <li key={h.at}>
                <span>{STATE_LABEL[h.state]}{h.bring.length > 0 && `: ${h.bring.map((b) => BRING_LABEL[b]).join(", ")}`}</span>
                <span className={styles.muted}>{when(h.at)}{h.byMe ? " · you" : ""}</span>
                {h.note && <span className={styles.note}>{h.note}</span>}
              </li>
            ))}
          </ol>
        </section>
      )}
      <p className={styles.logged}>Opening this person was logged.</p>
    </aside>
  );
};
