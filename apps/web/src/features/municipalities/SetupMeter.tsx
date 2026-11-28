import { cx } from "@/lib/cx";
import styles from "./SetupMeter.module.css";

/** Compact "2 of 4" progress: one segment per setup step. */
export const SetupMeter = ({ done, total }: { done: number; total: number }) => (
  <span className={styles.meter}>
    <span className={styles.segments} aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={cx(styles.segment, i < done && styles.filled)} />
      ))}
    </span>
    <span className={cx(styles.label, done === total && styles.complete)}>
      {done === total ? "Ready" : `Setup ${done} of ${total}`}
    </span>
  </span>
);
