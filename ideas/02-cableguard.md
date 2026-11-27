# CableGuard: early warning for undersea cables

**One-liner:** watch every ship near a subsea cable and warn the cable owner **before** an anchor drag, especially when a ship switches off its tracking (satellite radar still sees it).
**Challenge:** #3, wording "monitor borders and critical infrastructure"
**Status:** shortlisted

## Why now (signals)
- **Fitburg (31 Dec 2025):** Finland seized a ship from St Petersburg after the Elisa Helsinki–Tallinn telecom cable was damaged; its anchor chain was reportedly down. It carried EU-sanctioned Russian steel ([Al Jazeera](https://www.aljazeera.com/news/2025/12/31/police-investigating-damage-to-undersea-telecom-cable-in-gulf-of-finland), [Euronews](https://www.euronews.com/2026/01/01/ship-seized-in-finland-suspected-of-cable-damage-was-carrying-sanctioned-russian-steel)). It was later released ([Euronews](https://www.euronews.com/2026/01/12/cargo-vessel-suspected-of-damaging-undersea-cable-allowed-to-leave-finland)).
- **Eagle S / Estlink 2 (Dec 2024):** a shadow-fleet tanker dragged its anchor ~100 km and damaged 5 cables, about $70M in damage ([Tom's Hardware](https://www.tomshardware.com/networking/crew-of-russian-shadow-fleet-tanker-charged-with-intentionally-sabotaging-undersea-cables-finnish-authorities-claim-ship-dragged-its-anchor-56-miles-along-the-sea-floor-causing-usd70-million-in-damage-to-five-cables)). Estlink 2 owners claim ~€105M.
- **Windward posts (X):**
  - a sister ship of the Fitburg operator loitering ([Oct 27](https://x.com/WindwardAI/status/2114990529398067202))
  - a Chinese survey vessel running survey lines over two cable routes for 53 hours ([Nov 16](https://x.com/WindwardAI/status/2122345203046535634))
  - the US-sanctioned Russian cargo ship Sparta II drifting into Finnish waters off Loviisa ([Nov 22](https://x.com/WindwardAI/status/2124513764548477381))
- **EU money:** €9.55M EU grant for Finland, Sweden and Estonia to buy modular cable-repair gear, because repair ships are scarce ([@TheTunaSpotter, 26 Nov](https://x.com/TheTunaSpotter/status/2125967059507101765)).
- Windward reports a dark fleet of **2,186 vessels (1,106 sanctioned)** and 34,081 vessel activities near cables in Q2 2026 (self-reported) ([Windward Baltic page](https://windward.ai/knowledge-base/baltic-subsea-infrastructure-fault-or-pattern/)).

## Who uses it
| User | Who exactly | What they need |
|---|---|---|
| **Primary: cable / grid operator security desk** | Security or operations manager at e.g. Elisa, Cinia, Fingrid, Elering, Svenska kraftnät, Energinet | "Is any ship behaving suspiciously over **our** cable right now?" They **can't use EMSA CMS** (authorities only) |
| Coast guard / navy | Maritime operations centre | Receives the operator's alert, decides whether to intercept |
| Insurer (secondary) | Marine and infrastructure underwriters | Risk scoring, evidence after an incident |

**Buyer:** cable and grid operators (private or state-owned companies). They have budget and a clear loss: €70–105M per incident.

## User flow (simplified)
```
1. Operator draws or uploads their cable routes once (or picks from EMODnet).
2. Dashboard: map of their cables, a 5 km "watch corridor", live ship dots.
3. Alert rules run automatically:
   • ship slower than 3 knots over the cable for more than 30 min
   • zig-zag or survey-line pattern over the cable
   • AIS switched off inside the corridor (radar pass still sees a ship)
   • ship is on a sanctions list or linked to past incidents
4. Alert: "MV X: 2 knots over Estlink 2 for 3h. AIS off for 40 min.
           Sister ship of Fitburg operator."  [Risk: HIGH]
5. Operator clicks → timeline, track, radar image → "Notify coast guard"
   → (after any incident) "Export evidence file" (see idea 04)
```

## Demo "wow moment"
Replay the Eagle S night of 25 Dec 2024: the track slows over Estlink 2, the anchor-drag pattern appears, the alert fires **hours before** the cable broke. Then a live view of today's Baltic with current risk scores.

## Space data (essential)
| Source | Used for |
|---|---|
| **Sentinel-1** + **APEx Ship Detection** | Find ships in the corridor that are **not** broadcasting AIS |
| Sentinel-2 | Visual check |
| **Galileo** | Accurate positions; flag spoofed AIS tracks (jumps) inside corridors |

## Other data
- Cable routes: [EMODnet Human Activities](https://emodnet.ec.europa.eu/en/human-activities) ℹ️ (check the cable layer), plus operator data
- AIS: [Digitraffic](https://digitraffic.fi/en/marine-traffic) (live; archive it yourself)
- Sanctions: EU sanctions lists

## Competition
| Who | What | Gap we fill |
|---|---|---|
| **Windward** (maritime AI) | "Critical Maritime Infrastructure Protection" product since Feb 2025 ([Marine Insight](https://www.marineinsight.com/shipping-news/windward-launches-first-of-its-kind-ai-tool-to-protect-undersea-infrastructure/)) | Expensive enterprise product, proprietary data. We use **free Copernicus radar** to catch AIS-dark ships and target smaller operators. |
| **EMSA CMS** | Vessel detection vs AIS for authorities ([EMSA](https://www.emsa.europa.eu/copernicus.html)) | **Not available to private cable operators** |
| Kpler / Spire / MarineTraffic | AIS data and analytics | Data, not a cable-specific alert workflow |
| Hackathon | KAIKU ("threats to the Baltic Sea"), Maris, MARINER | Check KAIKU in detail; possibly the closest |

## Business model
Subscription per km of protected cable or per asset. Upsell an incident evidence pack.

## Risks
- Overlap with Windward is real, so the pitch must lean on **"free EU radar data + affordable"**.
- Radar passes are every few days, not continuous. Present them as "spot checks", with AIS behaviour as the continuous layer.

## Scoring self-check
| Relevance | Innovativeness and business | Team fit |
|---|---|---|
| 5 | 3–4 (Windward exists) | 4 |
