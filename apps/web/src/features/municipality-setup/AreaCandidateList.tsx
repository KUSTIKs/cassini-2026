"use client";

import type { AreaCandidate } from "@firstreach/contracts";
import { cx } from "@/lib/cx";
import styles from "./AreaCandidateList.module.css";
import stepStyles from "./steps.module.css";

type Props = { items: AreaCandidate[]; selectedRef: string | null; onSelect: (candidate: AreaCandidate) => void };

/** A single-choice list of boundaries. Native radios: arrow keys and screen readers work for free. */
export const AreaCandidateList = ({ items, selectedRef, onSelect }: Props) => (
  <fieldset className={styles.fieldset}>
    <legend className={styles.legend}>{items.length === 1 ? "1 match" : `${items.length} matches`}</legend>
    <ul className={stepStyles.list}>
      {items.map((candidate) => (
        <li key={candidate.ref}>
          <label className={cx(styles.option, candidate.ref === selectedRef && styles.selected)}>
            <input
              type="radio"
              name="area-candidate"
              value={candidate.ref}
              checked={candidate.ref === selectedRef}
              onChange={() => onSelect(candidate)}
              className={styles.radio}
            />
            <span className={styles.label}>{candidate.label}</span>
            <span className={styles.kind}>{candidate.kind}</span>
          </label>
        </li>
      ))}
    </ul>
  </fieldset>
);
