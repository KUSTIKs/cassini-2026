import type { AlertContact } from "@firstreach/contracts";
import styles from "./steps.module.css";

export const DetailsStep = ({ region, contact }: { region: string; contact: AlertContact }) => (
  <div className={styles.content}>
    <dl className={styles.facts}>
      <dt>Region</dt><dd>{region}</dd>
      <dt>Flood alerts go to</dt><dd>{contact.name}</dd>
      <dt>Phone</dt><dd>{contact.phone}</dd>
      <dt>Email</dt><dd>{contact.email ?? <span className={styles.muted}>Not set</span>}</dd>
    </dl>
  </div>
);
