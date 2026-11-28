"use client";

import type { UserSummary } from "@firstreach/contracts";
import { useActionState } from "react";
import { ChevronRightIcon } from "@/components/ui/icons";
import { Spinner } from "@/components/ui/Spinner";
import { describeRoles } from "@/lib/roles";
import { demoSignInAction, type SignInState } from "./actions";
import styles from "./DemoSignIn.module.css";

/** One row per user. The whole row is the button; the session cookie is set on the server. */
export const DemoUserButton = ({ user }: { user: UserSummary }) => {
  const [state, action, pending] = useActionState<SignInState>(demoSignInAction.bind(null, user.id), { error: null });
  return (
    <form action={action}>
      <button type="submit" className={styles.user} disabled={pending} aria-busy={pending || undefined}>
        <span className={styles.avatar} aria-hidden>{user.name.charAt(0)}</span>
        <span className={styles.who}>
          <span className={styles.name}>{user.name}</span>
          <span className={styles.org}>{user.organisation}</span>
          {user.roles.length > 1 && <span className={styles.roles}>{describeRoles(user)}</span>}
        </span>
        {pending ? <Spinner /> : <ChevronRightIcon className={styles.chevron} />}
      </button>
      {state.error && <p role="alert" className={styles.error}>{state.error}</p>}
    </form>
  );
};
