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
| `application/` | `domain/` | adapters, hono, drizzle, `@firstreach/contracts` |
| `adapters/in/*` | `application/ports/in`, `domain` types, `@firstreach/contracts`, framework (Hono) | `adapters/out/*`, concrete use-case classes |
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
  adapters/out/signals/<source-id>/           one folder per signal plugin (section 6)
  composition/signals.ts                      signal plugin registry (the only list of plugins)
  composition/config.ts                       reads env, the only place that touches process.env
  composition/container.ts                    builds the object graph
  main.ts                                     starts the HTTP server
```
- One use case = one inbound port = one class with `execute(input)`.
- Use the `.js` extension in relative imports (NodeNext ESM).
- Files are kebab-case and classes are PascalCase. Name an adapter class `<Tech><Port>`, e.g. `PostgresGreetingRepository`.

### Access is a domain rule
- Who may do what is one pure function, `can(user, permission, municipalityId?)` in `domain/access.ts`. A user holds
  several role grants and `can` allows an action if any grant does; never branch on "the" role of a user.
- Every use case takes the signed-in `User` as its first argument and calls `authorize(...)` before doing anything.
- Sessions are the HTTP adapter's business (`adapters/in/http/session.ts`, `auth.ts`); use cases never see tokens.
- Read models carry `permissions` so the web can hide what won't work, but the API is what enforces it.

### Data crosses boundaries by mapping, never by leaking
- **Drizzle rows stay in `adapters/out/postgres`.** Repositories map rows to domain objects.
- **Wire DTOs (`@firstreach/contracts`) stay in `adapters/in/http`** and in the web app. The HTTP adapter maps domain to DTO and validates with zod (`GreetingResponse.parse(...)`).
- The domain never sees HTTP, SQL, or JSON shapes.

## 3. `apps/web` (Next.js)
The web app is a **driving client of the API**, not part of the hexagon. Its rules:
- **No business rules in the UI.** Ranking, "who is in the zone" and similar live in the API domain.
- **All API calls go through `src/lib/api-client.ts`** (server-only), which validates every response with `@firstreach/contracts`. Components never call `fetch` directly.
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

## 6. Signals are plugins (hard rule)

A **signal** is any source that says *where a hazard is or will be*. Every signal is a plugin behind **one contract**.
**Adding or removing a signal = one folder + one line in the registry. Nothing else changes:** no domain, use case, HTTP route or web component is touched.

| Plugin id | What it says | Stage | EU space |
|---|---|---|---|
| `efas` | Copernicus flood forecast for a river reach | forecast | Copernicus |
| `gfm` | Sentinel-1 observed flood extent (Copernicus GFM) | observed | Copernicus |
| `manual` | Zone drawn by the mayor or duty officer | observed | — |
| later: `chmu`, `grid-outage`, `effis` | National warning, the grid operator's outage map, fires | either | depends |

### The contract
```ts
// domain/hazard-signal.ts: what every plugin must produce
export type HazardKind = "flood" | "power_outage" | "storm" | "fire";
export type SignalStage = "forecast" | "observed";

export type HazardSignal = {
  id: string;                 // `${sourceId}:${externalId}`, stable across polls
  sourceId: string;           // "efas", "gfm", ...
  kind: HazardKind;
  stage: SignalStage;
  area: MultiPolygon;         // GeoJSON, WGS84. ALWAYS an area (see rule 2)
  issuedAt: Date;
  expectedAt: Date | null;    // when it hits (forecast); null = already happening
  expiresAt: Date | null;
  confidence: "low" | "medium" | "high";
  provenance: { label: string; url?: string; euSpace: "copernicus" | "galileo" | null };
};

// application/ports/out/signal-source.ts: what every plugin must implement
export interface SignalSource {
  readonly descriptor: {
    id: string;               // must equal HazardSignal.sourceId
    label: string;            // shown in the UI, e.g. "Copernicus EFAS flood forecast"
    kinds: HazardKind[];
    stages: SignalStage[];
    euSpace: "copernicus" | "galileo" | null;
  };
  poll(query: { bbox: BBox; since: Date; now: Date }): Promise<HazardSignal[]>;
}
```

### Rules
1. **The core never branches on `sourceId`.** The exposure engine (signal area ∩ substations → people → ranking) uses only `kind`, `stage`, `area`, `expectedAt` and `confidence`. If you're tempted to write `if (signal.sourceId === "efas")`, the contract is missing a field: extend the contract, not the core.
2. **The plugin owns translation to an area.** EFAS says "river Opava"; the `efas` plugin turns that into the official Q100 zone (VÚV TGM). GFM gives a raster; the `gfm` plugin vectorises it. The core only ever sees polygons.
3. **Time is injected.** Plugins use the `now` they're given, never `Date.now()`. That makes **replay free**: the demo runs the same plugins against recorded data with a simulated clock.
4. **Idempotent.** Returning the same `id` again means *update*, not *duplicate*; the core upserts by `id`.
5. **Failure is isolated.** If one plugin throws or times out, it's logged and skipped, and the other signals still work.
6. **Push sources use the same shape.** A webhook, or the mayor drawing a zone in the UI, comes in through a driving adapter (`adapters/in/http`) and calls the same `IngestSignals` use case with `HazardSignal`s.
7. **The UI is generic.** The web app renders any signal from its `descriptor` (label, EU-space badge) and `kind`/`stage` (colour, solid vs dashed). There's no per-source UI code.

### Plugin folder
```
adapters/out/signals/
  contract.test-kit.ts        testSignalSourceContract(factory): shared conformance suite
  efas/
    index.ts                  export const createEfasSource = (cfg) => ({ descriptor, poll })
    fixtures/                 recorded data for replay and tests (e.g. Opava, 12 Sept 2024)
    efas.test.ts              runs testSignalSourceContract(createEfasSource) + its own cases
  gfm/ …   manual/ …
```
The conformance suite checks:
- areas are valid WGS84 polygons
- every `id` is prefixed with the source id
- `issuedAt <= now`, and `since`/`now` are respected
- the descriptor matches the signals it produces

### Registry and wiring
```ts
// composition/signals.ts: the ONLY place that lists plugins
export const signalPlugins = {
  efas: createEfasSource,
  gfm: createGfmSource,
  manual: createManualSource,
} satisfies Record<string, (cfg: Config) => SignalSource>;
```
Enabled plugins come from env: `SIGNALS=efas,gfm,manual`. To turn one off, change env, not code.

```
scheduler / replay clock ──▶ IngestSignals ──▶ each enabled SignalSource.poll()
   (driving adapter)          (use case)        └▶ upsert HazardSignal
                                     └──▶ EvaluateExposure (signals ∩ substations → people → rank) ──▶ Alert
```

### Adding a signal (checklist)
1. Create `adapters/out/signals/<id>/index.ts` implementing `SignalSource`.
2. Add fixtures and `<id>.test.ts` that runs `testSignalSourceContract`.
3. Add one line to `composition/signals.ts`, plus any config keys it needs in `composition/config.ts`.
4. Add `<id>` to `SIGNALS` in `.env`.

If step 1 forces a change anywhere else, stop: the contract needs extending. Change it deliberately, in `domain/hazard-signal.ts`, and update every plugin plus the test kit.

## 7. Recipe: adding a feature
Example: "list the people affected by an alert" (Flow 2 in `TECH.md`).
1. **Domain:** `domain/person.ts`, `domain/priority.ts` (pure `rank(people, outageEtaH)`, unit-tested).
2. **Outbound port:** `application/ports/out/person-repository.ts` (`findBySubstations(ids)`).
3. **Inbound port and use case:** `ports/in/list-affected-people.ts` + `use-cases/list-affected-people.ts`, tested with an in-memory repository.
4. **Adapters:**
   - Drizzle table + `PostgresPersonRepository`; run `pnpm --filter @firstreach/api db:generate`, then `pnpm db:migrate`.
   - HTTP route in `adapters/in/http`.
5. **Contract:** add `AffectedPeopleResponse` to `packages/contracts`.
6. **Wire it** in `composition/container.ts`.
7. **Web:** add `getAffectedPeople()` to `api-client.ts`, then the page or component.

## 8. Commands
```
pnpm install
pnpm db:up                                    # Postgres + PostGIS in Docker (localhost:5433)
pnpm db:migrate && pnpm db:seed               # apply migrations, insert demo data
pnpm dev                                      # api :4000 + web :3000
pnpm typecheck | pnpm test | pnpm build
pnpm --filter @firstreach/api db:generate       # new migration after changing schema.ts
```
Env files: `apps/api/.env` and `apps/web/.env`; copy them from the `.env.example` next to each.
