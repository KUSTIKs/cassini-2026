import type { RegisterSummary as Summary } from "@firstreach/contracts";
import { Badge } from "@/components/ui/Badge";
import { LockIcon } from "@/components/ui/icons";
import styles from "./RegisterSummary.module.css";

const DEVICE_LABEL = { ventilator: "Ventilator", oxygen_concentrator: "Oxygen concentrator", other: "Other equipment" } as const;

const dateTime = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** Counts only. Names stay sealed until a flood alert opens them for the affected area. */
export const RegisterSummary = ({ register }: { register: Summary }) => (
  <section className={styles.summary} aria-label="Register summary">
    <div className={styles.head}>
      <span className={styles.total}>{register.total}</span>
      <span className={styles.caption}>people depend on electricity at home</span>
      <span className={styles.sealed}><Badge icon={<LockIcon />}>Names sealed</Badge></span>
    </div>
    <ul className={styles.breakdown}>
      {(Object.keys(DEVICE_LABEL) as Array<keyof typeof DEVICE_LABEL>).map((device) => (
        <li key={device}>
          <span className={styles.count}>{register.byDevice[device]}</span>
          {DEVICE_LABEL[device]}
        </li>
      ))}
    </ul>
    <p className={styles.foot}>
      {register.unlinked > 0 ? `${register.unlinked} not linked to a substation yet. ` : "Everyone is linked to a substation. "}
      {register.importedAt && `Imported ${dateTime.format(new Date(register.importedAt))}.`} Names open only for people inside a
      flood alert&apos;s area.
    </p>
  </section>
);
