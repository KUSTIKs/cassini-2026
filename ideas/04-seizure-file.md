# Seizure File: court-ready evidence on suspect ships

**One-liner:** for any suspect ship, automatically build a tamper-proof evidence timeline (radar images, AIS gaps, track, GPS interference, exact positions) that police and prosecutors can use in court.
**Challenge:** #3, wording "countering transnational crime… detect smuggling routes and patterns"
**Status:** shortlisted (most original)

## Why now (signals)
- **Eagle S:** the case against the crew was **dismissed by the Helsinki District Court in Oct 2025 on jurisdiction**: Finnish law applied only if the damage happened inside Finland's territorial waters. An appeals court later revived it ([The Record](https://therecord.media/finland-appeals-court-revives-case-against-eagle-s), [Submarine Networks](https://www.submarinenetworks.com/en/nv/insights/finnish-court-dismisses-case-against-eagle-s), [Lloyd's List](https://www.lloydslist.com/LL1155011/Finnish-court-throws-out-Eagle-S-cable-cutting-case)). **The exact location of each event decided the case.** The ship's voyage data recorder (black box) "was not functioning" at the key moment ([The Record](https://therecord.media/finnish-police-wiretap-eagles-sabotage)).
- **Fitburg:** seized, then released after ~2 weeks; intent still under investigation ([Euronews](https://www.euronews.com/2026/01/12/cargo-vessel-suspected-of-damaging-undersea-cable-allowed-to-leave-finland)).
- **OSINT vs proof:** @auonsson calls the Stockholm jammer case closed "without visual identification" ([post](https://x.com/auonsson/status/2126349133091049967)). Windward "all but claims" a tanker was suspect in the SwePol case but **doesn't name the ship** ([@auonsson on Windward, Feb 2026](https://x.com/search?q=from%3Aauonsson%20SwePol)).
- Research on AIS-based spoofing detection notes that **"AIS data alone cannot establish who is responsible"** ([SeaSpoofFinder](https://arxiv.org/html/2602.16257v1)).

→ The gap: plenty of suspicion, but too little **structured, verifiable, location-precise evidence**.

## Who uses it
| User | Who exactly | What they need |
|---|---|---|
| **Primary: investigator** | Police / national bureau of investigation (e.g. Finland's NBI), coast guard investigation units, customs (for sanctions breaches) | "Give me everything about ship X from date A to B, in order, provably unaltered, with exact positions relative to territorial waters and the EEZ." |
| Prosecutor / court | Public prosecutor | A readable timeline and a report that holds up to scrutiny |
| Cable owner / insurer | Legal team of e.g. Elering, Fingrid, insurers | Evidence for civil claims (Estlink 2: ~€105M claim) |

**Buyer:** police, coast guards, customs (government). Second market: insurers and law firms for civil claims.

## User flow (simplified)
```
1. Investigator types a ship name or IMO number and a time window
   (or clicks "Export evidence" from a JammerHunt or CableGuard alert).
2. App gathers automatically:
   • AIS track, with GAPS highlighted (when tracking was off)
   • every Sentinel-1 / Sentinel-2 image that saw the area → ship crops
   • GPS interference at the time (aircraft and ship reports)
   • boundaries: territorial waters / EEZ / cable routes on the same map
3. Timeline view: scroll through time; the map and images follow.
   Key moments auto-flagged: "AIS off 02:14", "speed 2 kn over cable 02:40",
   "crossed from Estonian EEZ into Finnish EEZ 04:10".
4. Each item is time-stamped and hashed (fingerprinted) into a chain.
   Any later change is detectable.
5. "Export case file" → PDF report + data package + verification code.
```

## Demo "wow moment"
Rebuild the **Eagle S night** in 60 seconds: the track, the slow anchor-drag line over 5 cables, the boundary crossings that the court argued about, radar images, and the exported PDF.

## Space data (essential)
| Source | Used for |
|---|---|
| **Sentinel-1 / Sentinel-2** (Copernicus) | Independent proof the ship was there, even with AIS off |
| **Galileo** (timing and positioning; OSNMA as roadmap) | Trusted time stamps and positions for evidence; authenticated positions can't be spoofed |
| APEx Ship Detection | Automatic ship crops from radar images |

## Other data
AIS ([Digitraffic](https://digitraffic.fi/en/marine-traffic)), maritime boundaries (Marine Regions / national sources ℹ️), cable routes (EMODnet ℹ️), sanctions lists.

## Competition
| Who | What | Gap |
|---|---|---|
| Windward, Kpler, Spire, MarineTraffic | Intelligence and analytics | Built for **intelligence**, not **legal evidence**; no tamper-proof chain or legal-boundary analysis |
| EMSA CMS | Vessel detection reports for authorities ([EMSA](https://www.emsa.europa.eu/copernicus.html)) | Detections, not a case file |
| OSINT community | Manual threads on X | Not admissible as is |
| Hackathon | VeriSpace, GroundProof, Galileo-Verified Photo Evidence (evidence, but **not ships**) | Nobody does maritime evidence |

## Why it suits us
Mostly web work: timeline UI, map syncing, PDF generation, a hash chain. The satellite data comes ready from CDSE and APEx.

## Risks
- Don't claim "court-admissible". Say "designed to support legal processes"; admissibility is decided by courts.
- Security clause §8.8: demo only on public, historical cases.

## Scoring self-check
| Relevance | Innovativeness and business | Team fit |
|---|---|---|
| 5 | 5 | 5 |
