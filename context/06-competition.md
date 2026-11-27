# Competition

## A. Other teams in this hackathon
Snapshot of **127 registered projects** on TAIKAI, taken Fri 27 Nov 2026, evening. Full list: `sources/registered-projects.csv`.
Many entries are early placeholders, so re-check on Saturday and Sunday. Each location picks its own winner, so **the projects at your own location matter most**.

**By challenge tag:** C2: 37 · C1: 22 · C3: 9 · several tags: 10 · untagged: 49 (about 25 are placeholders or off-topic).

| Cluster | ≈ Count | Examples | How crowded |
|---|---|---|---|
| GNSS spoofing and jamming detection | 15 | Aegis-GNSS, TrueSignal, GNSS Integrity Watch, NAVIGUARD AI, NavVigil, SIGNALSTATE, ChronoShield, TrustTick, Baltic Shield, DriftHawk, EuroShield-Space | **Very** |
| Crisis dashboards and damage maps | 15 | CIVIS-72, EarthGuard, Elpida Guard, Korax, Aufwin Space COP, RESQNET, CrisisBrief, SatMed, SPECTRA, PAX-GEO, Global Space4Resilience, The Aftermath | **Very** |
| Safe routing and offline navigation | 12 | ARIADNE, BlackoutNav, Aventyr, SafeRoamers, SafeRoute Grid, SafeWay.NET, TheWayOut, RescueGrid, RIVISION, SalvaraNet, InfiniteReach | High |
| Power grid and corridor monitoring (mostly Finland) | 9 | CorridorWatch, GridGuard, GridScout, LS Resilient Fingrid, Paper Trail with Radar, Guardians of the Grid, Revisit, CableWatch | High |
| Galileo EWSS alerts | 5 | AFTERSTRIKE, Astra Alert, AquaAlert, Astro Shield | Medium |
| Verified evidence / authenticity (OSNMA) | 5 | Galileo-Verified Photo Evidence, VeriSpace, LevelProof, GroundProof, GroundCheck | Low |
| Maritime (Baltic / Black Sea) | 5 | KAIKU, Maris, MARINER, SeaCure | Medium-low |
| Environmental crime | 5 | TimberWatch, ForestGuard, GoldTrace, SpaceFlow | Low |
| Borders and smuggling | 3 | DanubeGuard, L-CORRIDOR, GeoDataPolicing | **Very low** |
| Health and medical | 2 | SatMed (AI emergency hotspots), Terrashield (asbestos after strikes) | **Very low** |
| Unique niches | — | SafeHarvest (farming on mined land), GeoTime (land boundaries in Ukraine), AtomWatch (nuclear sites), Flood Claims Triage (insurers) | — |

**Takeaways:** avoid generic spoofing detectors and generic crisis dashboards. The gaps are Challenge 3 (smuggling, shadow fleet, cables), health and vulnerable people, and specific user-and-harm pairings.

## B. Market landscape (disasters, alerts, health)
Researched 27 Nov 2026. The market falls into three layers:

```
1. DETECTION   satellites, cameras, sensors   → capital-heavy, crowded
2. ALERTING    alerts and maps for the public → big tech gives it away free
3. ACTION FOR VULNERABLE PEOPLE               → one-off government programmes; almost nothing in the EU
```

### 1. Detection
| Who | Where | What | Signal |
|---|---|---|---|
| ICEYE | FI | SAR satellites, floods, insurance | Series F €450M in 2026, valuation > €10B |
| OroraTech | DE | Thermal satellites, wildfires; polished map UI | 20 satellites, 35+ sources, users in 25 countries |
| Pano AI | US | Wildfire cameras | $44M Series B ($89M total) |
| PIESAT (Nuwa SAR), Minospace (Dongpo), Chang Guang | CN | State-linked commercial constellations used in 2026 disasters | — |
| Copernicus | EU | All of the above, **free to us** | — |

### 2. Public alerting
| Who | Where | What |
|---|---|---|
| Google | US | Android earthquake alerts in 200+ regions (1B+ sent), wildfire boundaries in 34 countries incl. GR/IT/ES/PT/FR, Flood Hub in ~80 countries, air quality in Maps |
| ICL + Xiaomi | CN | Earthquake early warning with a seconds countdown, built into phones. Claims 660M people covered. **Won through distribution.** |
| Everbridge, Genasys, RapidSOS ($75M) | US | Enterprise and government mass alerting, emergency data |
| CA Smoke Spotter, EPA Smoke Sense | US gov | Free smoke-alert apps |

### 3. Action for vulnerable people (health and disasters)
| Who | Where | What |
|---|---|---|
| **HHS emPOWER Map** | US gov | 3M+ Medicare patients who depend on powered medical equipment, combined with near-real-time hazards; monthly; aggregate public, individual data for responders |
| KCER / HPP kidney app | US (13 states) | Dialysis patients find open centres during disasters |
| UW Medicine, Fred Hutch | US hospitals | Used patient records to find 64,000+ asthma/COPD patients in smoke zones and alert them |
| Direct Relief kidney initiative | Global (2025) | Dialysis patients in crises |
| DailyBreath, Urbanova | US startups | Personal smoke and symptom tracking (small) |
| **EU equivalent** | — | **None found** |

**Evidence of need in Europe:**
- Valencia floods 2024: about half of the ~224 dead were 70+, many with reduced mobility who drowned at home, including care-home residents.
- Ukraine: home ventilator and oxygen patients during blackouts, with no registry found.
- (ℹ️ Ahr floods 2021: 12 residents of a disability care home in Sinzig died.)

## C. Strategic lessons
1. **Don't build detection.** Copernicus gives it to us free. Build the decision layer on top.
2. **Don't build a consumer alert app.** Google, Apple and governments do it free.
3. **Go where big tech won't:** sensitive data (health, the vulnerable), B2G and B2B workflows, specific users.
4. **Distribution beats technology** (the ICL/Xiaomi lesson): plug into existing channels such as EU-Alert cell broadcast, Galileo EWSS, care workers' tools and authority systems.
5. **A good interface sells** (the OroraTech lesson): dark, map-first, live-feeling, time slider, clear alerts. Precompute and replay real events.

## Sources
- HHS emPOWER: https://empowerprogram.hhs.gov/about-empowermap.html · https://empowerprogram.hhs.gov/Map-Job-Aid.pdf
- ASPR kidney app: https://www.aspr.gov/readiness-response/healthcare-readiness/healthcare-readiness-action/stories-field/hpp-supported-app-now-provides-lifesaving
- UW Medicine smoke outreach: https://members.wsha.org/weekly-newsletter/weekly-report-friday-july-10-thursday-july-16-2026/uw-medicine-data-and-outreach-connects-patient-to-critical-wildfire-smoke-guidance/
- Valencia victims: https://www.euronews.com/my-europe/2024/11/15/almost-half-of-spains-flood-victims-were-aged-70-or-over-data-shows · https://www.preventionweb.net/news/valencia-floods-one-year-what-have-we-learned-and-how-can-we-prevent-similar-tragedies-future
- Ukraine blackouts and health: https://www.kyivpost.com/post/11474 · https://phr.org/wp-content/uploads/2024/12/REPORT-PHR-TRUTHHOUNDS-UKRAINE-Health-Care-in-the-Dark-2024_Updated-12-20-24.pdf
- Google crisis tools: https://blog.google/products-and-platforms/platforms/android/android-earthquake-alerts-expansion-2026/ · https://blog.google/company-news/outreach-and-initiatives/sustainability/google-wildfire-boundary-maps-europe-africa/
- ICL: https://en.wikipedia.org/wiki/ICL_Earthquake_Early_Warning_System
- ICEYE: https://www.reinsurancene.ws/iceye-targets-global-expansion-as-latest-funding-round-surpasses-e1bn/ · Pano AI: https://www.latitudemedia.com/industry-news/pano-ai-raises-44m-series-b-led-by-giant-ventures-to-scale-early-detection-infrastructure/
- China 2026: https://english.aircas.ac.cn/newsroom/re/202607/t20260713_1177242.html · https://en.wuxi.gov.cn/2026-08/31/c_1209596.htm
