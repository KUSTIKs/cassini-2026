import type { AlertCounters as Counters, ContactState } from "@firstreach/contracts";
import Link from "next/link";
import { cx } from "@/lib/cx";
import { STATE_LABEL } from "./labels";
import styles from "./AlertCounters.module.css";

const ORDER: Array<ContactState | "all"> = ["all", "not_contacted", "needs_help", "not_reached", "reached_ok", "away"];

/** The summary counters double as the list filter (?filter=). */
export const AlertCounters = ({ counters, filter, hrefFor }: { counters: Counters; filter: ContactState | "all"; hrefFor: (f: ContactState | "all") => string }) => (
  <nav className={styles.counters} aria-label="Filter by call outcome">
    {ORDER.map((key) => {
      const n = key === "all" ? counters.total : counters[key];
      return (
        <Link key={key} href={hrefFor(key)} scroll={false} className={cx(styles.counter, filter === key && styles.active)} aria-current={filter === key ? "true" : undefined} data-state={key}>
          <span className={styles.count}>{n}</span>
          <span className={styles.label}>{key === "all" ? "All" : STATE_LABEL[key]}</span>
        </Link>
      );
    })}
  </nav>
);
