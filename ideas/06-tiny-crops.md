# Tiny Crops

**One-liner:** Region-specific satellite monitoring of crops and weather, pivoted to mapping farmland lost to war or disaster for food-security and recovery planning.
**Challenge:** #2: Space-enabled crisis response and civil resilience. Wording it matches (pivot only): "Map conflict damage using Earth observation data"
**Status:** exploring

## Problem
Original framing: small farmers lack region-specific weather and crop information.
That is an agriculture problem, not a peace, crisis or security one, so as-is it scores low on relevance (see `../context/02-challenges.md`, "How to read them").

Pivot: after shelling, mining, floods or drought, nobody has a quick, field-level picture of how much farmland in a region is lost or unusable, which matters for food aid and recovery. *Unverified: no numbers or sources gathered yet.*

## Users and buyer
- **User:** humanitarian food-security teams, regional recovery planners
- **Buyer:** humanitarian organisations, national agriculture or recovery ministries, donors funding recovery. *Unverified.*

## Solution
Pick a region and a date range. The tool compares a reference period with the post-event period and flags fields with vegetation loss or surface change, then sums up lost cropland per area.

## User flow
1. Select a region and an event date (or a replayed past event).
2. See a map of fields coloured by change since the reference period.
3. Export a summary (hectares affected per district) for planning.

## Demo "wow moment"
Before/after slider over a real past event, with the hectare total updating live. *Event not chosen yet.*

## Space data (must be essential)
| Source | Used for |
|---|---|
| Copernicus Sentinel-2 (L2A) | NDVI time series, vegetation loss |
| Copernicus Sentinel-1 (GRD) | Radar change detection through cloud |
| Galileo | Not essential here. Weak spot. |

Access: Copernicus Data Space Ecosystem (free account). See `../context/05-tools-and-data.md`.

## Other tools and data
APEx algorithms (check `../context/05-tools-and-data.md`), OpenStreetMap or field boundaries if available.

## Competition
- **In this hackathon:** SafeHarvest (farming on mined land, Sentinel-1/2), SafeReach (war cost incl. harvests in Ukraine); also the crowded "crisis dashboards and damage maps" cluster (~15 projects). See `../context/06-competition.md`.
- **On the market:** existing EO crop-monitoring services. *Not researched.*
- **Why we're different:** not clear yet. Main weakness.

## Business model
Not worked out.

## Scoring self-check (0–5 each)
Claude's rough estimate, not team-agreed.
| Relevance | Innovativeness and business | Team fit |
|---|---|---|
| 2–3 (pivot only) | 1–2 | 2 (image processing heavy) |

## Build plan (weekend)
Not planned; only worth planning if shortlisted.

## Risks and open questions
- Crowded: damage maps are the most common C2 idea here.
- No Galileo role, so only half the EU space story.
- Validation and ground truth are hard in 48 h.
- Breaks the CLAUDE.md principle "don't build detection"; would need a sharp decision layer for one specific user.
