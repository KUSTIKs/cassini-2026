import type { SetupStep as Step } from "@firstreach/contracts";
import Link from "next/link";
import type { ReactNode } from "react";
import { CheckIcon } from "@/components/ui/icons";
import { cx } from "@/lib/cx";
import styles from "./SetupStep.module.css";

type SetupStepProps = {
  step: Step;
  index: number;
  title: string;
  /** One line shown when the step is done and closed. */
  summary?: string | undefined;
  /** Why the step can't start yet. */
  blockedReason: string;
  /** Set when the signed-in role can't act on this step: who does it instead. The step is then read-only. */
  lockedReason: string | null;
  open: boolean;
  /** Link that opens or closes this step (the open step lives in the URL). */
  href: string;
  children: ReactNode;
};

/** One row of the setup sequence. Header is a link; the body renders only when open. */
export const SetupStep = ({ step, index, title, summary, blockedReason, lockedReason, open, href, children }: SetupStepProps) => {
  const blocked = step.status === "blocked";
  const locked = !blocked && lockedReason !== null;
  const bodyId = `step-${step.id}`;

  const header = (
    <>
      <span className={cx(styles.marker, styles[step.status])} aria-hidden>
        {step.status === "done" ? <CheckIcon width={12} height={12} strokeWidth={2} /> : index}
      </span>
      <span className={styles.title}>{title}</span>
      <span className={styles.meta}>
        {blocked ? blockedReason : !open && step.status === "done" ? summary : locked ? lockedReason : null}
      </span>
    </>
  );

  return (
    <li className={cx(styles.step, open && styles.open)}>
      {blocked ? (
        <div className={styles.header} aria-disabled>{header}</div>
      ) : locked ? (
        <div className={styles.header}>{header}</div>
      ) : (
        <Link href={href} scroll={false} className={styles.header} aria-expanded={open} aria-controls={bodyId}>
          {header}
        </Link>
      )}
      {open && !blocked && !locked && <div id={bodyId} className={styles.body}>{children}</div>}
    </li>
  );
};
