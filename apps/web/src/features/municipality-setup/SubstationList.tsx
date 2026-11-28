import type { Substation } from "@firstreach/contracts";
import styles from "./SubstationList.module.css";
import stepStyles from "./steps.module.css";

/** [110, 22] → "110 / 22 kV"; [22, 0.4] → "22 kV / 400 V" */
const voltage = (kv: number[]) => {
  if (kv.length === 0) return "Voltage unknown";
  const high = kv.filter((v) => v >= 1);
  const low = kv.filter((v) => v < 1).map((v) => Math.round(v * 1000));
  return [high.length > 0 && `${high.join(" / ")} kV`, low.length > 0 && `${low.join(" / ")} V`].filter(Boolean).join(" / ");
};

export const SubstationList = ({ substations }: { substations: Substation[] }) => (
  <ul className={stepStyles.list}>
    {substations.map((s) => (
      <li key={s.id} className={styles.row}>
        <span className={styles.dot} aria-hidden />
        <span className={styles.name}>{s.name ?? "Unnamed substation"}</span>
        <span className={styles.detail}>{[voltage(s.voltagesKv), s.operator].filter(Boolean).join(", ")}</span>
        <span className={styles.people}>
          {s.dependentPeople === 0 ? "No one registered" : `${s.dependentPeople} ${s.dependentPeople === 1 ? "person" : "people"}`}
        </span>
      </li>
    ))}
  </ul>
);
