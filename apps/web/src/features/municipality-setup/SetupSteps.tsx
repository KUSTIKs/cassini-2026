import type { MunicipalitySetup, SetupStepId } from "@firstreach/contracts";
import type { ReactNode } from "react";
import { AreaStep } from "./AreaStep";
import { DetailsStep } from "./DetailsStep";
import { RegisterStep } from "./RegisterStep";
import { SetupStep } from "./SetupStep";
import { SubstationsStep } from "./SubstationsStep";
import styles from "./SetupSteps.module.css";

type StepCopy = {
  title: string;
  blockedReason: string;
  summary: (s: MunicipalitySetup) => string | undefined;
  /** Whether the signed-in role may work on this step (the API decides; see setup.permissions). */
  allowed: (s: MunicipalitySetup) => boolean;
  /** Shown instead, on a step that isn't done yet, when the role may not work on it. */
  lockedReason: string;
};

const COPY: Record<SetupStepId, StepCopy> = {
  details: { title: "Details", blockedReason: "", summary: (s) => `Alerts to ${s.contact.name}`, allowed: () => true, lockedReason: "" },
  area: {
    title: "Area",
    blockedReason: "Add details first",
    summary: (s) => s.area?.label,
    allowed: (s) => s.permissions.setup,
    lockedReason: "The regional admin sets this",
  },
  substations: {
    title: "Substations",
    blockedReason: "Choose the area first",
    summary: (s) => `${s.substations.length} ${s.substations.length === 1 ? "substation" : "substations"}`,
    allowed: (s) => s.permissions.setup,
    lockedReason: "The regional admin finds these",
  },
  register: {
    title: "Register",
    blockedReason: "Find substations first",
    summary: (s) => `${s.register.total} ${s.register.total === 1 ? "person" : "people"}, names sealed`,
    allowed: (s) => s.permissions.uploadRegister,
    lockedReason: "Waiting for the grid operator",
  },
};

const content = (id: SetupStepId, s: MunicipalitySetup): ReactNode => {
  switch (id) {
    case "details": return <DetailsStep region={s.region} contact={s.contact} />;
    case "area": return <AreaStep municipalityId={s.id} municipalityName={s.name} currentLabel={s.area?.label ?? null} />;
    case "substations": return <SubstationsStep municipalityId={s.id} substations={s.substations} />;
    case "register": return <RegisterStep municipalityId={s.id} register={s.register} />;
  }
};

/** Steps the signed-in role may open. */
export const openableSteps = (setup: MunicipalitySetup): SetupStepId[] =>
  setup.steps.filter((s) => s.status !== "blocked" && COPY[s.id].allowed(setup)).map((s) => s.id);

/** The setup sequence. Exactly one step is open at a time; which one is in the URL (?step=). */
export const SetupSteps = ({ setup, openStep }: { setup: MunicipalitySetup; openStep: SetupStepId | null }) => (
  <ol className={styles.steps}>
    {setup.steps.map((step, i) => {
      const open = step.id === openStep;
      const copy = COPY[step.id];
      return (
        <SetupStep
          key={step.id}
          step={step}
          index={i + 1}
          title={copy.title}
          summary={copy.summary(setup)}
          blockedReason={copy.blockedReason}
          lockedReason={copy.allowed(setup) ? null : copy.lockedReason}
          open={open}
          href={open ? `/municipalities/${setup.id}?step=none` : `/municipalities/${setup.id}?step=${step.id}`}
        >
          {content(step.id, setup)}
        </SetupStep>
      );
    })}
  </ol>
);
