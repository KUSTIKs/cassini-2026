import { DomainValidationError } from "../../domain/errors.js";
import { areaContains, bboxOf } from "../../domain/geo.js";
import { assignSubstations } from "../../domain/substation-assignment.js";
import type { User } from "../../domain/access.js";
import { authorize } from "../authorize.js";
import { NotFoundError } from "../errors.js";
import type { ImportSubstations } from "../ports/in/municipality-setup.js";
import type { MunicipalityRepository } from "../ports/out/municipality-repository.js";
import type { RegisterRepository } from "../ports/out/register-repository.js";
import type { SubstationGateway } from "../ports/out/substation-gateway.js";
import type { SubstationRepository } from "../ports/out/substation-repository.js";

type Deps = {
  municipalities: MunicipalityRepository;
  substations: SubstationRepository;
  register: RegisterRepository;
  substationSource: SubstationGateway;
};

export class ImportSubstationsUseCase implements ImportSubstations {
  constructor(private readonly deps: Deps) {}

  async execute(actor: User, municipalityId: string) {
    const municipality = await this.deps.municipalities.get(municipalityId);
    if (!municipality) throw new NotFoundError("Municipality", municipalityId);
    authorize(actor, "municipality.setup", municipalityId);
    if (!municipality.area) throw new DomainValidationError("Set the municipality's area first.");
    const area = municipality.area.geometry;

    const candidates = await this.deps.substationSource.findInBBox(bboxOf(area));
    const inside = candidates.filter((s) => areaContains(area, s.location));
    await this.deps.substations.replaceForMunicipality(municipalityId, inside);

    const links = assignSubstations(await this.deps.register.listLocations(municipalityId), inside);
    await this.deps.register.setSubstationLinks(municipalityId, links);

    return { found: inside.length, linkedPeople: links.filter((l) => l.substationRef !== null).length };
  }
}
