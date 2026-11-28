import type { ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { cx } from "@/lib/cx";
import styles from "./RegisterSources.module.css";

type Status = "active" | "planned" | "roadmap";
type Source = { id: string; name: string; status: Status; description: string };

const STATUS_LABEL: Record<Status, string> = { active: "Active", planned: "Planned", roadmap: "Roadmap" };

/** Where the register can come from. Only the file upload exists today; the others say honestly what they need. */
const SOURCES: readonly Source[] = [
  {
    id: "csv",
    name: "CSV file from the grid operator",
    status: "active",
    description: "The operator's export of its vulnerable-customer register. A new file replaces the whole list.",
  },
  {
    id: "operator-feed",
    name: "Live feed from the grid operator",
    status: "planned",
    description:
      "Keeps the list current as people join or leave the register. Needs a data-sharing agreement with ČEZ Distribuce, EG.D or PREdistribuce.",
  },
  {
    id: "insurers",
    name: "Health insurers (VZP, ČPZP and others)",
    status: "roadmap",
    description:
      "Finds people from the equipment their insurer pays for, as the US emPOWER programme does with Medicare claims. Would include people who never registered. Needs a legal basis.",
  },
];

/** The active source holds the upload controls (children); the others are shown disabled. */
export const RegisterSources = ({ children }: { children: ReactNode }) => (
  <section className={styles.sources} aria-labelledby="register-sources">
    <h3 id="register-sources" className={styles.heading}>Data sources</h3>
    <ul className={styles.list}>
      {SOURCES.map((source) => {
        const active = source.status === "active";
        return (
          <li key={source.id} className={cx(styles.source, !active && styles.unavailable)} aria-disabled={!active || undefined}>
            <div className={styles.head}>
              <span className={styles.name}>{source.name}</span>
              <Badge tone={active ? "success" : "neutral"}>{STATUS_LABEL[source.status]}</Badge>
            </div>
            <p className={styles.description}>{source.description}</p>
            {active && <div className={styles.controls}>{children}</div>}
          </li>
        );
      })}
    </ul>
  </section>
);
