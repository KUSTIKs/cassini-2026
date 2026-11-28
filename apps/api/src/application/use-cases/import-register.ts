import { DomainValidationError } from "../../domain/errors.js";
import { areaContains } from "../../domain/geo.js";
import { parseRegisterRow, type RawRegisterRow, type RowProblem } from "../../domain/register-row.js";
import type { RegisteredPerson } from "../../domain/registered-person.js";
import { nearestSubstation } from "../../domain/substation-assignment.js";
import type { User } from "../../domain/access.js";
import { authorize } from "../authorize.js";
import { NotFoundError } from "../errors.js";
import type { ImportRegister } from "../ports/in/municipality-setup.js";
import type { MunicipalityRepository } from "../ports/out/municipality-repository.js";
import type { RegisterRepository } from "../ports/out/register-repository.js";
import type { Clock, IdGenerator } from "../ports/out/runtime.js";
import type { SubstationRepository } from "../ports/out/substation-repository.js";

type Deps = {
  municipalities: MunicipalityRepository;
  substations: SubstationRepository;
  register: RegisterRepository;
  clock: Clock;
  newId: IdGenerator;
};

export class ImportRegisterUseCase implements ImportRegister {
  constructor(private readonly deps: Deps) {}

  async execute(actor: User, { municipalityId, rows }: { municipalityId: string; rows: RawRegisterRow[] }) {
    const municipality = await this.deps.municipalities.get(municipalityId);
    if (!municipality) throw new NotFoundError("Municipality", municipalityId);
    authorize(actor, "register.upload", municipalityId);
    if (rows.length === 0) throw new DomainValidationError("The file has no rows.", { file: "The file has no rows." });

    const substations = await this.deps.substations.listByMunicipality(municipalityId);
    const people: RegisteredPerson[] = [];
    const rejected: RowProblem[] = [];
    const seenRefs = new Set<string>();

    rows.forEach((raw, index) => {
      const row = index + 1;
      const parsed = parseRegisterRow(raw, row);
      if (!parsed.ok) return void rejected.push(...parsed.problems);

      const { person } = parsed;
      if (seenRefs.has(person.externalRef))
        return void rejected.push({ row, field: "external_ref", message: "Duplicate reference in this file." });
      if (municipality.area && !areaContains(municipality.area.geometry, person.location))
        return void rejected.push({ row, field: "lat", message: `Address is outside ${municipality.name}.` });

      seenRefs.add(person.externalRef);
      people.push({
        ...person,
        id: this.deps.newId(),
        substationRef: nearestSubstation(person.location, substations)?.osmRef ?? null,
      });
    });

    // Only replace the stored register when the file produced something usable.
    if (people.length > 0) await this.deps.register.replaceForMunicipality(municipalityId, people, this.deps.clock());
    return { imported: people.length, rejected };
  }
}
