import type { ListUsers } from "../ports/in/access.js";
import type { UserRepository } from "../ports/out/user-repository.js";

export class ListUsersUseCase implements ListUsers {
  constructor(private readonly deps: { users: UserRepository }) {}
  execute() { return this.deps.users.list(); }
}
