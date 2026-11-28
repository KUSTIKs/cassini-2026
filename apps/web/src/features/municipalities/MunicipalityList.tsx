import type { MunicipalitySummary } from "@firstreach/contracts";
import Link from "next/link";
import { SetupMeter } from "./SetupMeter";
import styles from "./MunicipalityList.module.css";

const people = (n: number) => (n === 0 ? "No register yet" : `${n} ${n === 1 ? "person" : "people"} registered`);

export const MunicipalityList = ({ items }: { items: MunicipalitySummary[] }) => (
  <ul className={styles.list}>
    {items.map((m) => (
      <li key={m.id}>
        <Link href={`/municipalities/${m.id}`} className={styles.row}>
          <span className={styles.name}>{m.name}</span>
          <span className={styles.region}>{m.region}</span>
          <SetupMeter done={m.stepsDone} total={m.stepsTotal} />
          <span className={styles.people}>{people(m.registeredPeople)}</span>
        </Link>
      </li>
    ))}
  </ul>
);
