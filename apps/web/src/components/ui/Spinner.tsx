import styles from "./Spinner.module.css";

export const Spinner = ({ label = "Working" }: { label?: string }) => (
  <span className={styles.spinner} role="status" aria-label={label} />
);
