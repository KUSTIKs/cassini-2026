# Lifeline

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
pnpm db:migrate && pnpm db:seed
pnpm dev
```

Open http://localhost:3000. You should see **"Hello from Postgres 👋"**, served web → API (http://localhost:4000/greeting) → Postgres.
