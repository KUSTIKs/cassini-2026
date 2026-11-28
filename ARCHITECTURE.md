# ARCHITECTURE.md

How the code is organised. **Read this before adding code.** Product and flows: `PROJECT.md`, `TECH.md`.

## 1. Monorepo layout

```
apps/
  api/          Hono API: all business logic, hexagonal (section 2)
  web/          Next.js app: UI only, talks to the API over HTTP
packages/
  contracts/    zod schemas for the HTTP wire format, shared by api and web
  tsconfig/     shared TypeScript config
docker-compose.yml   Postgres 17 + PostGIS (host port 5433)
turbo.json           task pipeline: dev, build, typecheck, test, db:*
```

Tooling: pnpm workspaces, Turborepo, TypeScript 6 (pinned; TS 7 is native-only and not yet safe for Next.js/Drizzle tooling), Drizzle ORM + drizzle-kit, Vitest, tsx (dev) and tsup (build).

## 2. Hexagonal architecture (ports and adapters) in `apps/api`

```
              DRIVING side                                   DRIVEN side
   ┌───────────────────────┐                        ┌──────────────────────────┐
   │ adapters/in/http      │                        │ adapters/out/postgres    │
   │ (Hono routes)         │                        │ (Drizzle repositories)   │
   │ later: jobs, CLI,     │                        │ adapters/out/memory      │
   │ EFAS poller           │                        │ later: routing API, SMS  │
   └──────────┬────────────┘                        └────────────▲─────────────┘
              │ calls                                implements  │
              ▼                                                  │
   ┌──────────────────────────────────────────────────────────────┴───────────┐
   │ application/                                                              │
   │   ports/in/   ← interfaces the outside world can call (use-case API)      │
   │   ports/out/  ← interfaces the app needs (repositories, gateways)         │
   │   use-cases/  ← implement ports/in, orchestrate domain + ports/out        │
   │ ┌───────────────────────────────────────────────────────────────────────┐ │
   │ │ domain/  ← entities, value objects, pure rules (e.g. priority ranking)│ │
   │ └───────────────────────────────────────────────────────────────────────┘ │
   └───────────────────────────────────────────────────────────────────────────┘
                        composition/  wires concrete adapters into use cases
```

### Dependency rule (the one rule that matters)
Imports may only point **inwards**:

| Layer | May import | Must NOT import |
|---|---|---|
| `domain/` | nothing (only other domain files) | application, adapters, hono, drizzle, zod, `process.env`, I/O |
| `application/` | `domain/` | adapters, hono, drizzle, `@lifeline/contracts` |
| `adapters/in/*` | `application/ports/in`, `domain` types, `@lifeline/contracts`, framework (Hono) | `adapters/out/*`, concrete use-case classes |
| `adapters/out/*` | `application/ports/out`, `domain`, infra libs (Drizzle, fetch) | `adapters/in/*`, use cases |
| `composition/` | everything | — (it is the only place that knows concrete classes) |

Tests may import anything they need.

### Folder layout and naming
```
apps/api/src/
  domain/<concept>.ts                         types + pure functions, e.g. greeting.ts
  application/ports/in/<verb-noun>.ts         interface GetGreeting { execute() }
  application/ports/out/<noun>-repository.ts  interface GreetingRepository
  application/ports/out/<noun>-gateway.ts     for external services (routing, SMS)
  application/use-cases/<verb-noun>.ts        class GetGreetingUseCase implements GetGreeting
  adapters/in/http/app.ts                     Hono app; one file per resource as it grows
  adapters/out/postgres/schema.ts             Drizzle tables (persistence model)
  adapters/out/postgres/<noun>-repository.ts  PostgresGreetingRepository
  adapters/out/memory/…                       in-memory versions for tests and demo
  composition/config.ts                       reads env, the only place that touches process.env
  composition/container.ts                    builds the object graph
  main.ts                                     starts the HTTP server
```
- One use case = one inbound port = one class with `execute(input)`.
- Use the `.js` extension in relative imports (NodeNext ESM).
- Files are kebab-case and classes are PascalCase. Name an adapter class `<Tech><Port>`, e.g. `PostgresGreetingRepository`.

### Data crosses boundaries by mapping, never by leaking
- **Drizzle rows stay in `adapters/out/postgres`.** Repositories map rows to domain objects.
- **Wire DTOs (`@lifeline/contracts`) stay in `adapters/in/http`** and in the web app. The HTTP adapter maps domain to DTO and validates with zod (`GreetingResponse.parse(...)`).
- The domain never sees HTTP, SQL, or JSON shapes.

## 3. `apps/web` (Next.js)
The web app is a **driving client of the API**, not part of the hexagon. Its rules:
- **No business rules in the UI.** Ranking, "who is in the zone" and similar live in the API domain.
- **All API calls go through `src/lib/api-client.ts`** (server-only), which validates every response with `@lifeline/contracts`. Components never call `fetch` directly.
- Server Components fetch data; Client Components (`"use client"`) are only for interactivity (map, buttons).
- `API_URL` is server-side env. If the browser ever needs to call the API directly, add `NEXT_PUBLIC_API_URL` and keep `WEB_ORIGIN` in the API's CORS config in sync.
- As screens grow: `src/app/<route>/` for pages, `src/components/` for shared UI, and `src/features/<flow>/` for flow-specific UI (e.g. `features/mayor-list/`, `features/crew-task/`, matching the flows in `TECH.md`).

## 4. `packages/contracts`
- Only zod schemas plus inferred types for request and response bodies. **No logic.**
- The API's HTTP adapter produces them; the web's api-client consumes them.
- Ships TypeScript source. Next.js transpiles it (`transpilePackages`), and tsup bundles it into the API build.

## 5. Testing strategy
| What | How | Example |
|---|---|---|
| Domain rules | Plain unit tests, no mocks | priority ranking (Flow 2) |
| Use cases | Real use case plus **in-memory adapters** | `get-greeting.test.ts` |
| HTTP adapter | `app.request(...)` on the Hono app with in-memory wiring; assert against the contract | `app.test.ts` |
| Postgres adapters | Integration test against the docker DB (add when the first real query lands) | — |
| End to end | `pnpm dev`, then open http://localhost:3000 | hello-world page |

## 6. Recipe: adding a feature
Example: "list the people affected by an alert" (Flow 2 in `TECH.md`).
1. **Domain:** `domain/person.ts`, `domain/priority.ts` (pure `rank(people, outageEtaH)`, unit-tested).
2. **Outbound port:** `application/ports/out/person-repository.ts` (`findBySubstations(ids)`).
3. **Inbound port and use case:** `ports/in/list-affected-people.ts` + `use-cases/list-affected-people.ts`, tested with an in-memory repository.
4. **Adapters:**
   - Drizzle table + `PostgresPersonRepository`; run `pnpm --filter @lifeline/api db:generate`, then `pnpm db:migrate`.
   - HTTP route in `adapters/in/http`.
5. **Contract:** add `AffectedPeopleResponse` to `packages/contracts`.
6. **Wire it** in `composition/container.ts`.
7. **Web:** add `getAffectedPeople()` to `api-client.ts`, then the page or component.

## 7. Commands
```
pnpm install
pnpm db:up                                    # Postgres + PostGIS in Docker (localhost:5433)
pnpm db:migrate && pnpm db:seed               # apply migrations, insert demo data
pnpm dev                                      # api :4000 + web :3000
pnpm typecheck | pnpm test | pnpm build
pnpm --filter @lifeline/api db:generate       # new migration after changing schema.ts
```
Env files: `apps/api/.env` and `apps/web/.env`; copy them from the `.env.example` next to each.
