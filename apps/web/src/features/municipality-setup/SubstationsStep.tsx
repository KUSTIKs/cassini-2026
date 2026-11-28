"use client";

import type { Substation } from "@firstreach/contracts";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { BoltIcon } from "@/components/ui/icons";
import { Notice } from "@/components/ui/Notice";
import { importSubstationsAction, type SubstationImportState } from "./actions";
import { SubstationList } from "./SubstationList";
import styles from "./steps.module.css";

type Props = { municipalityId: string; substations: Substation[] };

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export const SubstationsStep = ({ municipalityId, substations }: Props) => {
  const [state, action, pending] = useActionState<SubstationImportState>(
    importSubstationsAction.bind(null, municipalityId), { result: null, error: null },
  );
  const hasAny = substations.length > 0;

  return (
    <div className={styles.content}>
      <p className={styles.lead}>
        FirstReach finds the power substations inside the area using OpenStreetMap. When a flood forecast covers a
        substation, everyone it feeds is likely to lose power.
      </p>

      <form action={action} className={styles.actions}>
        <Button type="submit" variant={hasAny ? "secondary" : "primary"} pending={pending} icon={<BoltIcon />}>
          {hasAny ? "Find substations again" : "Find substations"}
        </Button>
        {pending && <span className={`${styles.muted} ${styles.small}`}>Asking OpenStreetMap. This can take up to a minute when its servers are busy.</span>}
      </form>

      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.result && !pending && state.result.found === 0 && (
        <Notice tone="info">No substations are mapped inside this area in OpenStreetMap.</Notice>
      )}
      {state.result && !pending && state.result.found > 0 && (
        <Notice tone="success">
          Found {plural(state.result.found, "substation", "substations")}
          {state.result.linkedPeople > 0 && `; linked ${plural(state.result.linkedPeople, "person", "people")} to them`}.
        </Notice>
      )}

      {hasAny && <SubstationList substations={substations} />}

      <p className={`${styles.muted} ${styles.small}`}>
        Demo simplification: each person is linked to the nearest substation. In a real deployment, the grid operator
        provides the exact link.
      </p>
    </div>
  );
};
