import type { AlertPerson } from "@firstreach/contracts";
import Link from "next/link";
import { cx } from "@/lib/cx";
import { BRING_LABEL, hours, sealedName, STATE_LABEL, urgencyOf } from "./labels";
import styles from "./AlertList.module.css";

type Props = {
  people: AlertPerson[];
  selectedId: string | null;
  /** Link that opens a person; null when the viewer's role can't open anyone. */
  hrefFor: ((personId: string) => string) | null;
};

const Row = ({ person, selected, href }: { person: AlertPerson; selected: boolean; href: string | null }) => {
  const content = (
    <>
      <span className={styles.rank}>{person.rank}</span>
      <span className={styles.who}>
        <span className={styles.name}>{person.details?.fullName ?? sealedName(person.rank)}</span>
        <span className={styles.reason}>{person.reason}</span>
      </span>
      <span className={styles.phone}>{person.details?.phone}</span>
      <span className={styles.left} data-urgency={urgencyOf(person.hoursLeft)} title="Time until the device stops: outage + battery">
        {hours(person.hoursLeft)}
      </span>
      <span className={styles.status} data-state={person.contact.state}>
        {STATE_LABEL[person.contact.state]}
        {person.task && <span className={styles.task}>{person.task.bring.map((b) => BRING_LABEL[b]).join(", ")}</span>}
      </span>
    </>
  );
  return (
    <li>
      {href ? (
        <Link href={href} scroll={false} className={cx(styles.row, styles.link, selected && styles.selected)} aria-current={selected ? "true" : undefined}>
          {content}
        </Link>
      ) : (
        <div className={styles.row}>{content}</div>
      )}
    </li>
  );
};

/** The ranked list, most urgent first. Phones are shown for printing; on screen the panel holds them. */
export const AlertList = ({ people, selectedId, hrefFor }: Props) =>
  people.length === 0 ? (
    <p className={styles.empty}>No one with this outcome.</p>
  ) : (
    <ol className={styles.list}>
      {people.map((p) => (
        <Row key={p.personId} person={p} selected={p.personId === selectedId} href={hrefFor ? hrefFor(p.personId) : null} />
      ))}
    </ol>
  );
