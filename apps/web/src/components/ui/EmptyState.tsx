import type { ReactNode } from "react";
import styles from "./EmptyState.module.css";

type EmptyStateProps = { title: string; children: ReactNode; action?: ReactNode };

export const EmptyState = ({ title, children, action }: EmptyStateProps) => (
  <section className={styles.empty}>
    <h2 className={styles.title}>{title}</h2>
    <p className={styles.body}>{children}</p>
    {action}
  </section>
);
