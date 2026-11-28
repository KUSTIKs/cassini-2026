import { officerFor, officerGrant, type User } from "../../domain/access.js";
import { createMunicipality, type NewMunicipalityInput } from "../../domain/municipality.js";
import { authorize } from "../authorize.js";
import type { CreateMunicipality } from "../ports/in/municipality-setup.js";
import type { MunicipalityRepository } from "../ports/out/municipality-repository.js";
import type { Clock, IdGenerator } from "../ports/out/runtime.js";
import type { UserRepository } from "../ports/out/user-repository.js";

type Deps = { municipalities: MunicipalityRepository; users: UserRepository; clock: Clock; newId: IdGenerator };

export class CreateMunicipalityUseCase implements CreateMunicipality {
  constructor(private readonly deps: Deps) {}

  async execute(actor: User, input: NewMunicipalityInput) {
    authorize(actor, "municipality.create");
    const municipality = createMunicipality(input, { id: this.deps.newId(), now: this.deps.clock() });
    await this.deps.municipalities.create(municipality);
    // The alert contact becomes the municipality's officer (in production: an emailed invitation).
    // Someone who already has an account (same email) gets one more grant instead of a second account.
    const existing = municipality.contact.email ? await this.deps.users.findByEmail(municipality.contact.email) : null;
    if (existing) await this.deps.users.addGrant(existing.id, officerGrant(municipality.id));
    else await this.deps.users.create(officerFor(municipality, this.deps.newId()));
    return { id: municipality.id };
  }
}
