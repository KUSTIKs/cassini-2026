# FirstReach

CASSINI Hackathon 2026 entry (Challenge #2). It tells a Czech mayor, before the power goes, which people on home ventilators and oxygen will lose it in a flood, ranks them by hours of battery left, and routes firefighters around the water.

- Product, facts, personas: [`PROJECT.md`](PROJECT.md)
- Technical flows: [`TECH.md`](TECH.md)
- Code structure (hexagonal): [`ARCHITECTURE.md`](ARCHITECTURE.md)

## Quick start
Requirements: Node 22+, pnpm 11, Docker.

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
pnpm db:up
pnpm db:migrate
pnpm --filter @firstreach/api users:bootstrap   # first regional admin + grid operator (fictional)
pnpm dev
```

Open http://localhost:3000 and pick a role on the demo sign-in screen. As the regional admin, create a municipality and
follow its setup steps. For the Krnov demo data, upload `data/demo/krnov-register.csv` (fictional people) in the
Register step, or sign in as the grid operator to do it.
