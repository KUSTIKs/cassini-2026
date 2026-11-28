import type { UserSummary } from "@firstreach/contracts";
import { primaryRole, ROLE_LABEL, ROLE_ORDER, ROLE_PURPOSE } from "@/lib/roles";
import { DemoUserButton } from "./DemoUserButton";
import styles from "./DemoSignIn.module.css";

/** Users grouped by their main role (someone with several appears once), so the demo shows how each role sees the same data. */
export const DemoSignIn = ({ users }: { users: UserSummary[] }) => (
  <div className={styles.groups}>
    {ROLE_ORDER.map((role) => {
      const members = users.filter((u) => primaryRole(u) === role);
      if (members.length === 0) return null;
      return (
        <section key={role} className={styles.group} aria-labelledby={`role-${role}`}>
          <div className={styles.groupHead}>
            <h2 id={`role-${role}`} className={styles.role}>{ROLE_LABEL[role]}</h2>
            <p className={styles.purpose}>{ROLE_PURPOSE[role]}</p>
          </div>
          <ul className={styles.list}>
            {members.map((user) => <li key={user.id}><DemoUserButton user={user} /></li>)}
          </ul>
        </section>
      );
    })}
  </div>
);
