export type SetupStepId = "details" | "area" | "substations" | "register";
export type SetupStepStatus = "done" | "ready" | "blocked";
export type SetupStep = { id: SetupStepId; status: SetupStepStatus };

export type SetupFacts = { hasArea: boolean; substations: number; registeredPeople: number };

const ORDER: SetupStepId[] = ["details", "area", "substations", "register"];

/**
 * The setup is a sequence: details → area → substations → register.
 * A step is ready once the step before it is done.
 */
export const setupProgress = ({ hasArea, substations, registeredPeople }: SetupFacts): SetupStep[] => {
  const done: Record<SetupStepId, boolean> = {
    details: true,
    area: hasArea,
    substations: substations > 0,
    register: registeredPeople > 0,
  };
  return ORDER.map((id, i) => {
    const previous = ORDER[i - 1];
    const previousDone = previous === undefined || done[previous];
    return { id, status: done[id] ? "done" : previousDone ? "ready" : "blocked" };
  });
};
