import type { UserSummary } from "@firstreach/contracts";
import { signOutAction } from "@/features/sign-in/actions";
import { describeRoles } from "@/lib/roles";
import styles from "./Sidebar.module.css";

/** Who is signed in, in which role, and the way out. In the demo, signing out is how you switch roles. */
export const UserMenu = ({ user }: { user: UserSummary }) => (
  <div className={styles.user}>
    <span className={styles.avatar} aria-hidden>{user.name.charAt(0)}</span>
    <span className={styles.who}>
      <span className={styles.userName}>{user.name}</span>
      <span className={styles.userRole}>{describeRoles(user)}</span>
    </span>
    <form action={signOutAction}>
      <button type="submit" className={styles.switch}>Switch role</button>
    </form>
  </div>
);
