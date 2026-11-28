# PROJECT.md: Lifeline

Source of truth for **what we're building**. Background (rules, judging, tools, competition) is in `context/`; the full idea write-up is `ideas/05-lifeline.md`.

## Decision
- **Chosen idea:** Lifeline (decided night of Fri 27 Nov 2026).
- **Challenge:** #2, Space-enabled crisis response and civil resilience.
- **Why:** strongest mix of relevance, originality (no EU equivalent, no hackathon competitor focusing on vulnerable people) and team fit (web app on top of ready-made Copernicus outputs, no raw image processing).
- **Runner-up (not pursued):** Baltic combo (01 + 02 → 04). Dropped because it means switching challenge, and historical AIS data and Sentinel-1 coverage for the replay were unconfirmed.

## Product in one line
When a Copernicus flood, fire or blackout zone appears, show which vulnerable people (home oxygen, dialysis, limited mobility, bedridden, care homes) are inside it, and give rescuers a prioritised list with passable routes.

## Scope for the demo
**Must have (core)**
1. Map with a Copernicus flood extent for a real past event (replay).
2. Registered vulnerable people (synthetic) + real care homes, hospitals and dialysis centres (OpenStreetMap).
3. Instant summary of who and what is inside the zone.
4. Prioritised rescue list (simple, explainable rule: need type, battery/oxygen time, floor, lives alone).
5. Route to each person that avoids flooded roads.

**Nice to have (only if core is done Saturday)**
- Care Access Map module: which hospitals/dialysis centres are cut off, ambulance reach shrinking as roads flood.
- Assign people to rescue teams and track status.
- Alerts to people and carers (SMS mock; Galileo EWSS as roadmap unless confirmed operational).

**Out of scope**
- Real personal or health data (demo uses made-up people only; rules §8.8).
- Our own flood detection from raw imagery. We consume Copernicus outputs.

## Stack
Team background: React + Node.js. Exact libraries not decided yet.

## Demo event (OPEN: decide first thing Saturday)
| Option | For | Against |
|---|---|---|
| **Valencia, 29 Oct 2024** | Strongest evidence (about half the dead were 70+, many drowned at home) | Not local to the Prague jury |
| **Jeseník / Krnov, Czech Republic, Sept 2024** | Local hook for Prague judges; care home with almost 100 seniors cut off before evacuation; delayed evacuation in Krnov | Need to confirm Copernicus flood maps exist for it |

Either way: check the Copernicus Emergency Management Service (CEMS) activation and download the flood extent. *Unverified until done.*

## What exists in Europe today (pitch framing)
Researched 27 Nov. Don't pitch "Europe has nothing"; pitch "the lists exist but are scattered and not connected to the disaster".
- **UK:** each energy supplier keeps its own Priority Services Register (priority phone line, alerts, home visits in power cuts). Ireland has a similar register.
- **France:** (1) patients on home life support register with their regional health agency, which passes the list to the grid operator; only ~4,000 people, and it misses some (a ventilator patient went 5 days without power after Storm Ciarán). (2) Mayors must keep an opt-in register of elderly and disabled residents (since the 2003 heatwave); staff phone them in alerts.
- **Germany:** a CORRECTIV survey found no area-wide register of where electricity-dependent or vulnerable people live.
- **Spain (Valencia):** no comparable register found; help for dependent people came after the flood.
- **Czech Republic:** "vulnerable customer" status with electricity suppliers since a 2024 energy-law change (home ventilation/oxygen, anti-bedsore mattresses, sleep apnoea, home dialysis, tracheostomy); mainly gives free notice of outages. Fire service flood checklist only says to "pay increased attention to people with specific needs". No municipal register found.
- **The gaps Lifeline fills:** lists are split across power companies, health agencies and town halls; they're phone lists, not maps; none is linked to live hazard maps; built for power cuts/heatwaves, not fast floods.

**Pitch line:** "Europe already has lists of vulnerable people, but they're scattered across power companies and town halls, and none of them is connected to where the disaster actually is. Lifeline combines them with live Copernicus flood and fire maps, so in minutes rescuers know who is inside the zone and who to reach first."

**US precedent:** HHS emPOWER (since 2013) maps 3M+ Medicare patients who depend on electricity-powered medical equipment, for emergency planners.

## Security (counts in judging)
Outputs are sensitive even with synthetic data: login with roles, HTTPS, encrypted storage, audit log of who viewed which person, data kept in the EU, minimal sharing only during an emergency. Mention all of it in the pitch.

## Open questions / to verify
- [ ] Demo event (Valencia vs Jeseník/Krnov) and its CEMS flood extent
- [ ] Is Galileo EWSS operational? If not, present as roadmap
- [ ] Routing: how to avoid flooded roads (OSM road network + flood polygon)
- [ ] Who owns business model and pitch (team criterion)

## Deadline
Submission on TAIKAI **Sun 29 Nov 2026, 15:00 CET**, marked "completed". Aim to freeze the build by Sunday 13:00.
