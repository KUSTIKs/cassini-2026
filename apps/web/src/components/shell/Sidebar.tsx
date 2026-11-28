import type { UserSummary } from "@firstreach/contracts";
import { TownIcon } from "@/components/ui/icons";
import { isOfficerOnly, officerMunicipalities } from "@/lib/roles";
import { NavLink } from "./NavLink";
import styles from "./Sidebar.module.css";
import { UserMenu } from "./UserMenu";

const navLabel = (user: UserSummary | null) => {
  if (!user || !isOfficerOnly(user)) return "Municipalities";
  return officerMunicipalities(user).length === 1 ? "My municipality" : "My municipalities";
};

export const Sidebar = ({ user }: { user: UserSummary | null }) => (
  <aside className={styles.sidebar} data-print="hide">
    <div className={styles.brand}>
      <span className={styles.mark} aria-hidden>F</span>
      FirstReach
    </div>
    <nav aria-label="Main" className={styles.nav}>
      <NavLink href="/municipalities" icon={<TownIcon />}>
        {navLabel(user)}
      </NavLink>
    </nav>
    <div className={styles.bottom}>
      {user && <UserMenu user={user} />}
      <p className={styles.footnote}>Demo · people in registers are fictional</p>
    </div>
  </aside>
);
