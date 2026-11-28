"use client";

import type { ContactState } from "@firstreach/contracts";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { setContactStatusAction, type StatusFormState } from "./actions";
import { BRING_LABEL, STATE_LABEL } from "./labels";
import styles from "./StatusForm.module.css";

const OUTCOMES = ["reached_ok", "needs_help", "not_reached", "away"] as const;
const BRINGABLE = ["generator", "oxygen", "transport"] as const;
const HINT: Record<(typeof OUTCOMES)[number], string> = {
  reached_ok: "Has backup and is staying",
  needs_help: "Opens a task for the fire service",
  not_reached: "Three unanswered calls send a crew to the door",
  away: "Staying elsewhere; drops off the active list",
};

type Props = { alertId: string; personId: string; current: ContactState; attempts: number };

/** One call outcome per submit. The server records it; the list and counters refresh. */
export const StatusForm = ({ alertId, personId, current, attempts }: Props) => {
  const [state, action, pending] = useActionState<StatusFormState, FormData>(
    setContactStatusAction.bind(null, alertId, personId), { error: null, fields: {}, savedAt: null },
  );
  const [choice, setChoice] = useState<(typeof OUTCOMES)[number] | null>(null);
  // After a save, start the next call from a clean form (adjusting state during render, not in an effect).
  const [seenSave, setSeenSave] = useState(state.savedAt);
  if (state.savedAt !== seenSave) {
    setSeenSave(state.savedAt);
    setChoice(null);
  }

  return (
    <form action={action} className={styles.form} key={state.savedAt ?? "new"}>
      <fieldset className={styles.outcomes}>
        <legend className={styles.legend}>
          Call outcome <span className={styles.current}>Now: {STATE_LABEL[current]}{attempts > 0 && ` · ${attempts} unanswered`}</span>
        </legend>
        {OUTCOMES.map((o) => (
          <label key={o} className={styles.outcome} data-state={o}>
            <input type="radio" name="state" value={o} checked={choice === o} onChange={() => setChoice(o)} required />
            <span className={styles.outcomeText}>
              <span className={styles.outcomeLabel}>{STATE_LABEL[o]}</span>
              <span className={styles.outcomeHint}>{HINT[o]}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {choice === "needs_help" && (
        <fieldset className={styles.bring}>
          <legend className={styles.legend}>What should the fire service bring?</legend>
          {BRINGABLE.map((b) => (
            <label key={b} className={styles.check}><input type="checkbox" name="bring" value={b} />{BRING_LABEL[b]}</label>
          ))}
          {state.fields.bring && <p className={styles.error}>{state.fields.bring}</p>}
        </fieldset>
      )}

      <label className={styles.noteField}>
        <span className={styles.legend}>Note <span className={styles.current}>optional</span></span>
        <textarea name="note" rows={2} maxLength={500} className={styles.note} placeholder="e.g. daughter is on her way" />
      </label>

      <Button type="submit" variant="primary" pending={pending} disabled={!choice}>Save outcome</Button>
      {state.error && !state.fields.bring && <Notice tone="error">{state.error}</Notice>}
      {state.savedAt && <Notice tone="success">Saved.</Notice>}
    </form>
  );
};
