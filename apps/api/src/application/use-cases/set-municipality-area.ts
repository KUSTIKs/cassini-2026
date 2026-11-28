import { DomainValidationError } from "../../domain/errors.js";
import type { User } from "../../domain/access.js";
import { authorize } from "../authorize.js";
import { NotFoundError } from "../errors.js";
import type { SetMunicipalityArea } from "../ports/in/municipality-setup.js";
import type { AreaGateway } from "../ports/out/area-gateway.js";
import type { MunicipalityRepository } from "../ports/out/municipality-repository.js";
import type { RegisterRepository } from "../ports/out/register-repository.js";
import type { SubstationRepository } from "../ports/out/substation-repository.js";

type Deps = {
  municipalities: MunicipalityRepository;
  substations: SubstationRepository;
  register: RegisterRepository;
  areas: AreaGateway;
};

export class SetMunicipalityAreaUseCase implements SetMunicipalityArea {
  constructor(private readonly deps: Deps) {}

  async execute(actor: User, { municipalityId, ref }: { municipalityId: string; ref: string }) {
    const municipality = await this.deps.municipalities.get(municipalityId);
    if (!municipality) throw new NotFoundError("Municipality", municipalityId);
    authorize(actor, "municipality.setup", municipalityId);

    // Never trust geometry from the client: fetch it again by reference.
    const candidate = await this.deps.areas.getByRef(ref);
    if (!candidate) throw new DomainValidationError("That area no longer exists. Search again.", { ref: "Unknown area." });

    await this.deps.municipalities.setArea(municipalityId, {
      label: candidate.label,
      osmRef: candidate.ref,
      geometry: candidate.geometry,
    });

    // A new area invalidates the old substation import and every link to it.
    await this.deps.substations.replaceForMunicipality(municipalityId, []);
    const people = await this.deps.register.listLocations(municipalityId);
    await this.deps.register.setSubstationLinks(
      municipalityId,
      people.map((p) => ({ personId: p.id, substationRef: null })),
    );
  }
}
