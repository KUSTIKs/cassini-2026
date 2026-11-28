import type { AlertSummaryList } from "@firstreach/contracts";
import Link from "next/link";
import { AlertIcon, ChevronRightIcon } from "@/components/ui/icons";
import { when } from "./labels";
import styles from "./AlertCallout.module.css";

type Alert = AlertSummaryList["items"][number];

/** Shown on the municipality page while a flood alert is active: the way into the list. */
export const AlertCallout = ({ alert }: { alert: Alert }) => (
  <Link href={`/alerts/${alert.id}`} className={styles.callout}>
    <AlertIcon className={styles.icon} />
    <span className={styles.text}>
      <span className={styles.title}>Flood warning active</span>
      <span className={styles.meta}>
        {alert.people} {alert.people === 1 ? "person" : "people"} behind {alert.substations} {alert.substations === 1 ? "substation" : "substations"} in the zone · since {when(alert.openedAt)}
      </span>
    </span>
    <span className={styles.open}>Open list <ChevronRightIcon /></span>
  </Link>
);
