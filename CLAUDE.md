# CASSINI Hackathon 2026: project workspace

Entry for the **12th CASSINI Hackathon "EU Space for Peace & Resilience"** (27–29 Nov 2026).
**Submission deadline: Sun 29 Nov 2026, 15:00 CET on TAIKAI, marked "completed".**

Team background: full-stack web (React, Node.js).

## Context (read before working on the idea or the build)
- `context/01-hackathon.md`: format, timeline, prizes, team and eligibility rules, EU space programmes
- `context/02-challenges.md`: the three challenges, full text and example directions
- `context/03-rules-and-submission.md`: Rules of Contest summary, required submission contents, Demo Day paperwork, IP, security clause, checklist
- `context/04-evaluation.md`: judging criteria (relevance / innovativeness+business / team, 1/3 each; ties go to relevance) and how to score well
- `context/05-tools-and-data.md`: hackathon-provided tools (CDSE, APEx, FlyPix, KINEIS…), Copernicus and Galileo services, open data, setup steps
- `context/06-competition.md`: the 127 registered hackathon projects by cluster, the market landscape (US, CN, EU), strategic lessons
- `context/07-news-signals.md`: live news leads from X (Baltic GPS jamming from a dark ship this week, cable incidents, competitors)
- `context/08-case-empower.md`: case study of HHS emPOWER (USA): parties, data tiers, disaster flow, limits
- `context/09-case-france.md`: case study of France's PHRV list and town-hall register: parties, flows, limits
- `context/sources/`: the original rules PDF and text, and a CSV of registered projects

## Chosen project
- `PROJECT.md`: **we're building Lifeline**. Decision, scope, demo event, research, open questions. Read it before any build work.
- `IDEA.md`: the full Lifeline idea write-up (problem, users, data, risks).
- `ARCHITECTURE.md`: code structure (Turborepo, Next.js web, Hono API in hexagonal ports and adapters, Postgres). **Follow it when writing code.**
- `README.md`: quick start (`pnpm db:up`, `pnpm db:migrate`, `pnpm dev`).
- `TECH.md`: technical definition: inputs (real vs synthetic), architecture, data model, priority rule, and each user flow separately, plus the replay demo.
- Other candidate ideas were dropped; they're only in git history.

## Working principles
- Every feature must map to a named challenge and use EU space data (Copernicus and/or Galileo) in an essential way.
- Don't build detection or a consumer alert app. Build the decision layer for a specific user on top of free Copernicus outputs.
- Mark claims as verified or unverified; label anything from general knowledge.
- Demo on real past events (replay) so it feels instant. Keep demo data non-sensitive (rules §8.8).
