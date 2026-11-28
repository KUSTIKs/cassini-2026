import { can } from "../../domain/access.js";
import type { GetCurrentUser } from "../ports/in/access.js";
import type { UserRepository } from "../ports/out/user-repository.js";

export class GetCurrentUserUseCase implements GetCurrentUser {
  constructor(private readonly deps: { users: UserRepository }) {}

  async execute(userId: string) {
    const user = await this.deps.users.get(userId);
    return user ? { user, canCreateMunicipality: can(user, "municipality.create") } : null;
  }
}
