import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { AlertIcon, CheckIcon } from "./icons";
import styles from "./Notice.module.css";

type NoticeProps = { tone: "error" | "success" | "info"; children: ReactNode };

/** Inline outcome of an action. Errors are announced immediately; others politely. */
export const Notice = ({ tone, children }: NoticeProps) => (
  <div className={cx(styles.notice, styles[tone])} role={tone === "error" ? "alert" : "status"}>
    {tone === "success" ? <CheckIcon /> : <AlertIcon />}
    <div className={styles.body}>{children}</div>
  </div>
);
