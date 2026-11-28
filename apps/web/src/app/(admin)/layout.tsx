import type { ReactNode } from "react";
import { Sidebar } from "@/components/shell/Sidebar";
import { getCurrentUser } from "@/lib/current-user";
import styles from "./layout.module.css";

/** Every page in here needs a session; getCurrentUser sends anyone without one to /sign-in. */
const AdminLayout = async ({ children }: { children: ReactNode }) => {
  const me = await getCurrentUser();
  return (
    <div className={styles.shell}>
      <Sidebar user={me.ok ? me.data.user : null} />
      <main className={styles.main}>{children}</main>
    </div>
  );
};

export default AdminLayout;
