/**
 * Creates the first users. Run once per deployment; running it again only adds what's missing.
 *
 *   pnpm --filter @firstreach/api users:bootstrap
 *
 * Nobody can sign up in the portal: the first regional admin comes from this command, and every
 * municipality officer is invited when an admin creates their municipality. This also backfills
 * officers for municipalities created before users existed. Names are fictional.
 */
import { randomUUID } from "node:crypto";
import { PostgresMunicipalityRepository } from "../src/adapters/out/postgres/municipality-repository.js";
import { createDb } from "../src/adapters/out/postgres/client.js";
import { PostgresUserRepository } from "../src/adapters/out/postgres/user-repository.js";
import { loadConfig } from "../src/composition/config.js";
import { officerFor, type User } from "../src/domain/access.js";

const { db, close } = createDb(loadConfig().databaseUrl);
const users = new PostgresUserRepository(db);
const municipalities = new PostgresMunicipalityRepository(db);

const staff: Array<Omit<User, "id">> = [
  { name: "Petra Svobodová", email: null, organisation: "Moravian-Silesian Region, crisis management", grants: [{ role: "regional_admin", municipalityId: null }] },
  { name: "Tomáš Horák", email: null, organisation: "ČEZ Distribuce, vulnerable-customer register", grants: [{ role: "grid_operator", municipalityId: null }] },
];

const existing = await users.list();
const created: User[] = [];

for (const person of staff) {
  const role = person.grants[0]?.role;
  if (existing.some((u) => u.grants.some((g) => g.role === role))) continue;
  const user = { ...person, id: randomUUID() };
  await users.create(user);
  created.push(user);
}
for (const municipality of await municipalities.list()) {
  if (existing.some((u) => u.grants.some((g) => g.municipalityId === municipality.id))) continue;
  const officer = officerFor(municipality, randomUUID());
  await users.create(officer);
  created.push(officer);
}

console.log(
  created.length === 0
    ? "Users already set up."
    : created.map((u) => `+ ${u.grants.map((g) => g.role).join(", ")}: ${u.name} (${u.organisation})`).join("\n"),
);
await close();
