import { can, type User } from "../../domain/access.js";
import { setupProgress } from "../../domain/setup-progress.js";
import type { ListMunicipalities } from "../ports/in/municipality-setup.js";
import type { MunicipalityRepository } from "../ports/out/municipality-repository.js";
import type { RegisterRepository } from "../ports/out/register-repository.js";
import type { SubstationRepository } from "../ports/out/substation-repository.js";

type Deps = {
  municipalities: MunicipalityRepository;
  substations: SubstationRepository;
  register: RegisterRepository;
};

export class ListMunicipalitiesUseCase implements ListMunicipalities {
  constructor(private readonly deps: Deps) {}

  async execute(actor: User) {
    const [municipalities, substationCounts, peopleCounts] = await Promise.all([
      this.deps.municipalities.list(),
      this.deps.substations.countByMunicipality(),
      this.deps.register.countByMunicipality(),
    ]);
    return municipalities.filter((m) => can(actor, "municipality.view", m.id)).map((municipality) => {
      const registeredPeople = peopleCounts[municipality.id] ?? 0;
      const steps = setupProgress({
        hasArea: municipality.area !== null,
        substations: substationCounts[municipality.id] ?? 0,
        registeredPeople,
      });
      return {
        municipality,
        registeredPeople,
        stepsDone: steps.filter((s) => s.status === "done").length,
        stepsTotal: steps.length,
      };
    });
  }
}
