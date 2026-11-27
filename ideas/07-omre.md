# OMRE

**One-liner:** Historical satellite evidence that proves what a plot of land looked like on a given date, originally to defend small farmers against false EUDR deforestation claims, pivoted to war-damage compensation evidence.
**Challenge:** #2: Space-enabled crisis response and civil resilience. Wording it matches (pivot): "Map conflict damage using Earth observation data". The original EUDR framing would fit #3 only with a crime/fraud angle.
**Status:** exploring

## Problem
Original framing: under the EU Deforestation Regulation, land cleared after the cut-off date can't supply EU-bound products. The team's concern is that large companies could misuse this by falsely flagging small farmers' land as recently deforested and taking it over. Small farmers have no easy way to prove the land's real state before the cut-off.
*Unverified: no documented cases or numbers gathered yet. EUDR cut-off date and application date need checking against the regulation (README notes it applies from 30 Dec 2026).*

Pivot: civilians in conflict areas (e.g. Ukraine) need to prove their home, farm or property was destroyed, and roughly when, to support compensation claims.

## Users and buyer
- **User:** affected civilians and farmers, legal-aid and humanitarian organisations helping them file claims
- **Buyer:** legal-aid NGOs, claims bodies, donors. *Unverified.* Possible channel: Council of Europe's Register of Damage for Ukraine (set up 2023). *Unverified: how it accepts evidence.*

## Solution
Enter a location (or draw the plot). The tool pulls the archived satellite imagery for that spot, shows before/after, detects when the change happened, and produces an evidence report with dates, imagery and sources. Ground photos are location-stamped with Galileo so they can't easily be faked.

## User flow
1. Claimant or caseworker enters the address or draws the plot.
2. Tool shows the imagery timeline and the estimated date of change.
3. Optional: claimant adds ground photos with an authenticated Galileo position.
4. Export a PDF evidence pack for the claim.

## Demo "wow moment"
Type a real address from a documented past strike, and within seconds get a timeline showing the building intact, then damaged, with the change date pinned. *Event not chosen yet.*

## Space data (must be essential)
| Source | Used for |
|---|---|
| Copernicus Sentinel-1 (GRD) | Radar change detection, dating the change |
| Copernicus Sentinel-2 (L2A) | Optical before/after imagery |
| Galileo OSNMA | Authenticated location stamp on ground photos |

Access: Copernicus Data Space Ecosystem (free account). See `../context/05-tools-and-data.md`.

## Other tools and data
APEx algorithms, Copernicus Emergency Management Service damage maps where they exist, OpenStreetMap building footprints.

## Competition
- **In this hackathon:** **GroundProof** ("EU satellite data turned into verified damage evidence for crisis response and compensation claims"), which is almost the same pivot. Also GeoTime (land boundaries in Ukraine), Galileo-Verified Photo Evidence, VeriSpace, Flood Claims Triage. See `../context/06-competition.md`.
- **On the market:** *Not researched.*
- **Why we're different:** not clear yet, given GroundProof.

## Business model
Not worked out.

## Scoring self-check (0–5 each)
Claude's rough estimate, not team-agreed.
| Relevance | Innovativeness and business | Team fit |
|---|---|---|
| 3–4 (pivot) | 2 (GroundProof overlap) | 3 (mostly web app + report) |

## Build plan (weekend)
Not planned; only worth planning if shortlisted.

## Risks and open questions
- Direct overlap with GroundProof in this hackathon.
- Sentinel resolution (10 m) shows damage to large buildings and fields, not always single houses.
- Phone support for Galileo OSNMA is limited; the demo may need to mock it.
- Original EUDR version could be reframed for #3 as land-grab fraud, but overlaps with the "EUDR plot checker" idea in the README.
