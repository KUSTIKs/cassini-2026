import type { User } from "../../domain/access.js";
import { DomainValidationError } from "../../domain/errors.js";
import { authorize } from "../authorize.js";
import type { SearchAreas } from "../ports/in/municipality-setup.js";
import type { AreaGateway } from "../ports/out/area-gateway.js";

export class SearchAreasUseCase implements SearchAreas {
  constructor(private readonly areas: AreaGateway) {}

  async execute(actor: User, query: string) {
    authorize(actor, "municipality.setup");
    const q = query.trim();
    if (q.length < 2) throw new DomainValidationError("Type at least 2 letters.", { query: "Type at least 2 letters." });
    return this.areas.search(q);
  }
}
