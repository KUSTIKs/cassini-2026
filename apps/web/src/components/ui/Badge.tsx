import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./Badge.module.css";

type BadgeProps = { tone?: "neutral" | "success"; icon?: ReactNode; children: ReactNode };

/** A small status pill: "Active", "Planned", "Names sealed". */
export const Badge = ({ tone = "neutral", icon, children }: BadgeProps) => (
  <span className={cx(styles.badge, styles[tone])}>
    {icon}
    {children}
  </span>
);
