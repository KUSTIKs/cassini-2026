import { can, type User } from "../../domain/access.js";
import { setupProgress } from "../../domain/setup-progress.js";
import { authorize } from "../authorize.js";
import { NotFoundError } from "../errors.js";
import type { GetMunicipalitySetup } from "../ports/in/municipality-setup.js";
import type { MunicipalityRepository } from "../ports/out/municipality-repository.js";
import type { RegisterRepository } from "../ports/out/register-repository.js";
import type { SubstationRepository } from "../ports/out/substation-repository.js";

type Deps = {
  municipalities: MunicipalityRepository;
  substations: SubstationRepository;
  register: RegisterRepository;
};

export class GetMunicipalitySetupUseCase implements GetMunicipalitySetup {
  constructor(private readonly deps: Deps) {}

  async execute(actor: User, id: string) {
    const municipality = await this.deps.municipalities.get(id);
    if (!municipality) throw new NotFoundError("Municipality", id);
    authorize(actor, "municipality.view", id);

    const [substations, { bySubstation, ...register }] = await Promise.all([
      this.deps.substations.listByMunicipality(id),
      this.deps.register.stats(id),
    ]);

    return {
      municipality,
      register,
      steps: setupProgress({
        hasArea: municipality.area !== null,
        substations: substations.length,
        registeredPeople: register.total,
      }),
      substations: substations.map((s) => ({ ...s, dependentPeople: bySubstation[s.osmRef] ?? 0 })),
      permissions: { setup: can(actor, "municipality.setup", id), uploadRegister: can(actor, "register.upload", id) },
    };
  }
}
