import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Notice } from "@/components/ui/Notice";
import { DemoSignIn } from "@/features/sign-in/DemoSignIn";
import { api } from "@/lib/api-client";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

const SignInPage = async () => {
  if ((await api.me()).ok) redirect("/");
  const users = await api.demoUsers();

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <header className={styles.header}>
          <span className={styles.mark} aria-hidden>F</span>
          <h1 className={styles.title}>Sign in to FirstReach</h1>
        </header>

        <section className={styles.production} aria-labelledby="production-sign-in">
          <h2 id="production-sign-in" className={styles.sectionTitle}>Officials</h2>
          <button type="button" className={styles.nia} disabled aria-describedby="nia-note">
            Continue with Identita občana
          </button>
          <p id="nia-note" className={styles.note}>
            In production, officials sign in through the state identity service (NIA) with an eID card or bank
            identity. Not connected in this demo.
          </p>
        </section>

        <div className={styles.divider}><span>Demo: choose a role</span></div>

        {users.ok ? (
          <DemoSignIn users={users.data.items} />
        ) : (
          <Notice tone="error">
            {users.error.code === "not_found" ? "Demo sign-in is turned off on this server." : users.error.message}
          </Notice>
        )}

        <p className={styles.footnote}>
          No password in the demo. All people, names and phone numbers are fictional.
        </p>
      </div>
    </main>
  );
};

export default SignInPage;
