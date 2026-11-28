# TECH.md: how Lifeline works technically

What we have, what we build, and how each user interacts with it, **one flow per section**.
The why (facts, personas, KPIs) is in `PROJECT.md`. Labels used below:
- **[real]**: real public data, downloaded or confirmed.
- **[synthetic]**: made up for the demo (rules §8.8).
- **[verify]**: not checked yet.

---

## 1. What we have (inputs)

| # | Input | What it gives us | Source / format | Status |
|---|---|---|---|---|
| 1 | **EFAS flood notification** (Copernicus) | "River X, flood expected in N hours" | For the demo: hand-entered from the [EFAS Bulletin, Table 1](https://european-flood.emergency.copernicus.eu/sites/default/files/bulletins-documents/2024/EFAS_Bimonthly_Bulletin_Aug_Sep2024.pdf) (Opava, issued 12 Sept 2024, 60 h lead). Live: EFAS partner feed or the CEMS Early Warning Data Store (EWDS), mentioned in the same bulletin | [real] for demo; live access [verify] |
| 2 | **Flood hazard zones** (Q5/Q20/Q100/Q500) | *Where* the water goes when that river floods | DIBAVOD / VÚV TGM, shapefile, probably in the Czech S-JTSK projection (EPSG:5514), so it needs reprojecting to WGS84 ([dibavod.cz](https://dibavod.cz:443/data/poster_mapy_nebezpeci.pdf), [INSPIRE record](https://inspire-geoportal.ec.europa.eu/srv/api/records/CZ-VUV-MD-FD-APSFR)) | [verify]: download for Krnov |
| 3 | **Observed flood extent** (Sentinel-1 via Copernicus GFM) | Where the water actually is, for routing and confirmation | GFM portal or Copernicus Data Space Ecosystem (CDSE); JRC published a map near Opava for 15 Sept 2024 ([JRC](https://joint-research-centre.ec.europa.eu/jrc-news-and-updates/europe-floods-new-tool-estimate-water-depth-and-extent-2024-09-20_en)) | Exists; Krnov polygon [verify] |
| 4 | **Substations** | Which substation feeds which area | OpenStreetMap via the Overpass API. Krnov 110/22 kV substation, ČEZ Distribuce, [way 55375417](https://www.openstreetmap.org/way/55375417), plus 22 kV and minor ones nearby | [real], confirmed |
| 5 | **Road network** | Routing | OSM, through the OpenRouteService routing API, which can avoid polygons (`avoid_polygons`, general knowledge) | [verify]: API key and limits |
| 6 | **Vulnerable-customer register** | Who: name, address, device, backup, contacts | In reality the grid operator holds it. For the demo: ~30 people in Krnov in a CSV/JSON file | [synthetic] |
| 7 | **Supply point → substation link** | Which person loses power when a substation floods | In reality the grid operator knows it exactly. For the demo: each person is assigned to the nearest substation (a stated simplification) | [synthetic] |
| 8 | **Galileo** | The position of rescue crews: their phones' satellite positioning, which includes Galileo | Browser Geolocation API on the crew's phone | [real], general knowledge |

**What we don't have, and say so in the pitch:** live register access (it needs a legal agreement), the real supply-point → substation map, and live EFAS partner access.

---

## 2. Architecture (hackathon-sized)

```
                 ┌──────────── data prep (one-off scripts, Node) ─────────────┐
 EFAS (JSON)     │ reproject flood zones → GeoJSON; clip to Krnov             │
 DIBAVOD (SHP) ──┤ fetch OSM substations; generate synthetic people          │
 GFM (GeoTIFF/   │ vectorise GFM extent → GeoJSON polygon                     │
 vector)         └──────────────────────┬────────────────────────────────────┘
                                        ▼  static GeoJSON / JSON in /data
 ┌──────────────────────── Node API (Express or Fastify) ────────────────────┐
 │ alert engine: EFAS event → flood zone → substations hit → people → rank   │
 │ routing proxy: OpenRouteService with avoid_polygons = flood extent         │
 │ state: alerts, tasks, contact statuses, audit log  (SQLite)               │
 │ auth: role per user (mayor, crew, grid, admin) — simple, demo-grade       │
 │ replay clock: simulated time, so events fire as on 12–16 Sept 2024        │
 └───────────────▲──────────────────────────────────────▲─────────────────────┘
                 │ REST + Server-Sent Events (live updates)
   ┌─────────────┴──────────────┐            ┌───────────┴───────────┐
   │ React web app (desktop)    │            │ React mobile view     │
   │ Mayor / grid / admin       │            │ Fire crew             │
   │ MapLibre GL map            │            │ (same app, /crew)     │
   └────────────────────────────┘            └───────────────────────┘
```

**Spatial maths runs in Node with turf.js** (point-in-polygon, intersects, buffers) on GeoJSON. We need no PostGIS at this data size: tens of people and a handful of substations.

### Data model (minimum)
| Entity | Fields |
|---|---|
| `Person` [synthetic] | id, name, address, lat/lon, device (`ventilator` / `oxygen_concentrator` / other), backupHours, livesAlone, floor, mobility, phone, carerName, carerPhone, substationId |
| `Substation` [real] | id (OSM), name, voltage, lat/lon, operator |
| `FloodEvent` | id, source (`EFAS` / `GFM`), river, issuedAt, leadTimeH, geometry (zone or extent) |
| `Alert` | id, floodEventId, municipality, createdAt, status (`active` / `closed`), substationIds[], personIds[] |
| `ContactStatus` | alertId, personId, state (`not_contacted` / `reached_ok` / `away` / `needs_help` / `not_reached`), note, by, at |
| `Task` | id, alertId, personId, crewId, bring[] (generator / oxygen / transport), state (`assigned` / `en_route` / `done`), route geometry |
| `AuditLog` | who, role, action (`view_person` / `export` / `status_change`), personId, at |

### Priority rule (explainable, in one function)
```
hoursUntilOutage  = EFAS lead time until the flood reaches that substation's zone
hoursLeft         = hoursUntilOutage + backupHours(person)   // backup = battery / spare bottle
rank by: hoursLeft ↑, then livesAlone (yes first), then mobility (immobile first), then floor (ground first)
reason string     = "ventilator · ~3 h battery · lives alone · ground floor"
```
*Backup hours per device are general knowledge; we need a medical source [verify]. They're shown as an editable value, not a hidden constant.*

---

## 3. Flows (one per section)

Each flow lists: **actor → trigger → steps → what they see → what's stored → demo vs real.**

### Flow 1: Setup (before any flood)
- **Actor:** admin (in reality, the grid operator and the town).
- **Trigger:** the town signs up.
- **Steps:**
  1. Admin creates the municipality: name, boundary, mayor's contact for alerts.
  2. Grid operator links the register. In reality: a secure feed, with names held **sealed** until an alert. For the demo: import the synthetic CSV.
  3. System links each person to their substation and precomputes, **per river, which substations lie in its Q100 zone**.
- **Mayor sees (no alert active):** a map with substations and **counts only**, e.g. "Krnov: 23 electricity-dependent people, 4 behind substation X". **No names before an alert** (privacy by design).
- **Stored:** Person, Substation, precomputed river → substation mapping.
- **Demo:** pre-seeded; shown in the pitch only as one slide or 10 seconds of the demo.

### Flow 2: Early warning (automatic, the system is the actor)
- **Trigger:** an EFAS flood notification for a river. Demo: the replay clock reaches 12 Sept 2024 (Opava, 60 h).
- **Steps:**
  1. Match the river to its precomputed flood zone (Q100, or Q500 for a wider margin).
  2. Find the substations inside the zone, then the people fed by them.
  3. Compute `hoursLeft` and rank.
  4. Create an `Alert` and **unseal** names for those people only.
  5. Notify the mayor: SMS or email with a link (demo: a toast or banner).
- **Output:** *"Flood warning, Opava river, ~60 h. 14 people on ventilators or oxygen will likely lose power. Open list."*
- **Stored:** Alert, AuditLog (`unseal`).
- **Demo vs real:** demo uses the EFAS event hand-entered from the bulletin. Real use needs an EFAS feed or a ČHMÚ warning; live access is [verify].

### Flow 3: Mayor works the list (the core screen)
- **Actor:** mayor or a flood commission member, on a laptop.
- **Trigger:** opens the alert.
- **Screen:**
  - **Left:** a map with the flood zone, red substations, and person pins coloured by urgency.
  - **Right:** the ranked list (name, reason string, hours left, phone).
  - **Top:** summary counters (`total / reached / needs help / not reached`).
- **Steps:**
  1. Click a person to open a detail drawer: address, device, backup, carer, and a call script. **Every open is logged.**
  2. Call, then set a status:
     - `reached_ok`: has backup, staying
     - `away`: with family elsewhere; drops off the active list
     - `needs_help`: then pick what to bring (generator / oxygen / transport), which creates a **Task** for fire and rescue
     - `not_reached`: retry later; after N tries it's escalated as a Task for a door check
  3. **Export / print** the list as a PDF, for when the network fails.
- **Stored:** ContactStatus, Task, AuditLog.
- **This is the mayor's evidence for the Water Act §78 duty** (see `PROJECT.md` §3.1).

### Flow 4: Fire crew gets a task and drives there
- **Actor:** an HZS crew (or volunteer firefighters) with a phone.
- **Trigger:** a Task is assigned (from Flow 3). Demo: the crew view open on a phone, or in a second browser window.
- **Steps:**
  1. Crew sees the task card: address, what to bring, contact, and the reason (*"ventilator, ~3 h battery"*).
  2. Tap **Route**: crew position (phone GNSS, including Galileo) → address, **avoiding the flood polygon** (OpenRouteService `avoid_polygons`).
  3. Status: `en_route`, then `done` (with a note: delivered generator / transferred to hospital / other).
- **Mayor's screen updates live** (Server-Sent Events).
- **Stored:** Task state, route, AuditLog.
- **Demo vs real:** before 15 Sept the route avoids the *predicted* zone (Q100). After Flow 5 it avoids the *observed* GFM extent.

### Flow 5: Satellite update (automatic)
- **Trigger:** a new observed flood extent. Demo: the replay clock reaches 15 Sept and the GFM/Sentinel-1 polygon loads.
- **Steps:**
  1. Replace the predicted zone with the observed extent on the map.
  2. **Re-check the substations:** confirmed flooded or not, and add any newly hit ones (and their people) to the alert.
  3. **Re-route open tasks** around the observed water. Changed routes are flagged to the crew.
  4. Banner: *"Satellite map 15 Sept: 2 more people now in zone; 1 route changed."*
- **Stored:** FloodEvent (GFM), Alert update, Task routes.

### Flow 6: Grid operator view (aggregate, no names)
- **Actor:** grid operator dispatcher.
- **Trigger:** an active alert in their area.
- **Screen:** a list of substations in the zone with **counts of dependent people and the shortest hours-left behind each one**, e.g. *"Krnov 110/22 kV: 9 people, shortest 3 h"*.
- **Use:** input to restoration order and where to send mobile generators. Precedent: emPOWER in Broome County, NY (`PROJECT.md` §3.4).
- **Stored:** nothing new; it's a read-only view.

### Flow 7: Close and report
- **Actor:** mayor.
- **Trigger:** the alert ends.
- **Steps:**
  1. Close the alert.
  2. Generate the report: for each person, final state, time of first contact, and who acted. Totals: % contacted before the outage, tasks completed, time from EFAS notification to list.
  3. **Names are sealed again**; event data is scheduled for deletion (e.g. 30 days, the emPOWER Missouri rule).
- **Output:** a PDF report, which is the KPI evidence for the mayor, the region, and the ministry or EU (`PROJECT.md` §3.5).

### Flow 8: Person and family (optional, nice-to-have)
- **Actor:** the vulnerable person or their carer.
- **Trigger:** an SMS when the alert starts: *"Flood warning in Krnov. Reply 1 = I have backup and I'm fine, 2 = I'm away, 3 = I need help."*
- **Steps:** the reply sets ContactStatus automatically, so the mayor only calls those who didn't answer or who said 3.
- **Demo:** a mocked SMS panel. Real use needs an SMS gateway; Galileo EWSS is roadmap until we confirm it's operational [verify].

---

## 4. Replay mode (how the demo runs)

A timeline slider at the top of the app drives the **simulated clock**, and each stop fires a real flow:

| Simulated time | What fires | Flow |
|---|---|---|
| 11 Sept | Normal day: counts only, no names | 1 |
| **12 Sept 00:00** | EFAS formal notification, Opava, 60 h | 2 |
| 12 Sept | Mayor works the list; 3 people set to `needs_help` | 3 |
| 13–14 Sept | Crews dispatched, routes avoid the predicted zone | 4 |
| **15 Sept** | GFM/Sentinel-1 extent arrives; reroute; substation confirmed flooded | 5 |
| 16 Sept | Grid view: Krnov substation, N people behind it | 6 |
| After | Report: "100 % contacted before the outage, list ready in X min" | 7 |

The demo is **2–3 minutes**: slide → alert → click 2 people → one task with a route → satellite update → report.

---

## 5. Build order (fits the Sunday 13:00 freeze)
1. **Data prep:** Krnov flood zone (DIBAVOD), OSM substations, ~30 synthetic people, GFM polygon. *If DIBAVOD fails, the fallback is a hand-drawn zone along the Opava, labelled as such.*
2. **Alert engine and ranking** (Flow 2), as a pure function with a unit test.
3. **Mayor screen** (Flow 3): map, list, statuses.
4. **Replay slider** (section 4).
5. **Crew view and one route** (Flow 4).
6. **GFM update** (Flow 5).
7. Report (Flow 7), grid view (Flow 6), SMS mock (Flow 8): only if time allows.

## 6. Open technical decisions
- [ ] Map library: **MapLibre GL** (free, no key) or Leaflet (simpler)?
- [ ] Routing: OpenRouteService API (key, rate limits) or a self-hosted router?
- [ ] Storage: SQLite, or in-memory JSON for the demo?
- [ ] One app with role switch (`/mayor`, `/crew`, `/grid`) or separate apps? Proposal: one app.
- [ ] Where the GFM polygon comes from: GFM portal export vs CDSE Sentinel-1 processing (GFM is easier).
- [ ] Hosting for the judges (a live URL is needed on TAIKAI).
