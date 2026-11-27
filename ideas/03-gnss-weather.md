# GNSS Weather: "is GPS reliable here, right now?"

**One-liner:** a weather-style map and alerts for GPS reliability on the ground and at sea, so ferries, ambulances, drones and ports know when to switch to backup navigation.
**Challenge:** #1, wording "validate signals… improve cybersecurity across Europe"
**Status:** exploring (crowded area, so it needs a sharp angle)

## Why now (signals)
- Stockholm, 21–23 Nov 2026: up to 50% of flights affected; **ships affected too**, per Transportstyrelsen ([@auonsson](https://x.com/auonsson/status/2125974957356147062), [@flightradar24](https://x.com/flightradar24/status/2124827436747743282)).
- Spoofing in the Baltic is becoming coordinated: GPS is faked while the other constellations are jammed, so receivers can't cross-check, and **ships appear on land in AIS** ([Maritime Executive](https://maritime-executive.com/article/study-baltic-gps-disruption-comes-from-a-tactically-controlled-network)).
- Finland's coast guard detected about 10 tankers spoofing positions near St Petersburg ([MarineLink](https://marinelink.com/news/finland-coast-guard-detects-satnav-518723)).
- Sweden says **spoofing is now the bigger worry** ([AeroCorner](https://aerocorner.com/news/gps-jamming-sweden-klm-air-canada-flights/)).
- Market signal: Iridium advertises "Iridium PNT" as the fix for jamming (X post by @IridiumComm, 27 Nov).

## Who uses it
| User | Who exactly | What they need |
|---|---|---|
| **Primary: maritime operators** | Ferry operators (e.g. Stockholm–Åland, Helsinki–Tallinn), port pilots, VTS (vessel traffic) centres | "Is GPS on my route reliable in the next hours? Should crews use radar and visual navigation?" |
| Emergency services | Air ambulance and rescue helicopter dispatch, police drone units | "Can I fly a GPS-dependent approach or drone mission here now?" |
| Drone operators | Inspection and delivery companies | Go / no-go for missions |
| Authorities | Transport agencies | Official situation picture |

**Buyer:** ferry and port companies, emergency service operators, drone companies. Each pays a subscription for alerts on their own routes or areas.

## User flow (simplified)
```
1. User saves their routes or areas (ferry line, hospital helipad, drone zone).
2. Map like a weather radar: green = GPS reliable, amber = degraded, red = jammed or spoofed.
   Layers: aircraft reports (ADS-B), ships "teleporting" in AIS, ground sensors.
3. Alert: "GPS UNRELIABLE on Kapellskär–Mariehamn route, now to ~18:00.
           3 ships showed position jumps in the last hour."
4. User taps → why (evidence), since when, trend → acknowledges → crew briefed.
5. Weekly report: hours affected per route (for safety management and insurers).
```

## Demo "wow moment"
Time-lapse of 21–23 Nov: the Baltic goes from green to red, and the ferry route lights up with "ship on land" spoofing markers.

## Space data
| Source | Used for |
|---|---|
| **Galileo / OSNMA** | Explain how authenticated Galileo receivers stay trustworthy; recommend Galileo-OSNMA-capable equipment (roadmap: OSNMA status from ground receivers) |
| **EGNOS** | Integrity information for aviation and maritime |
| Copernicus | Base maps and sea state (secondary, so this idea is **weaker on Copernicus**) |

## Other data
[gpsjam.org](https://gpsjam.org/faq/), [OpenSky Network](https://opensky-network.org/), [Flightradar24 jamming map](https://www.flightradar24.com/blog/gps-jamming-map/), AIS via [Digitraffic](https://digitraffic.fi/en/marine-traffic), [SeaSpoofFinder method](https://arxiv.org/html/2602.16257v1)

## Competition
| Who | What | Gap |
|---|---|---|
| gpsjam.org, Flightradar24 | Free daily maps of jamming from aircraft data | Aviation only, no alerts per route, nothing for ships |
| SkAI GPSwise | Spoofing map from OpenSky (per [GPS World](https://www.gpsworld.com/gps-spoofing-and-jamming-tracker-map/)) | Aviation |
| Spire, HawkEye 360 | Commercial interference intelligence | Defence and intelligence buyers |
| Iridium PNT | Alternative positioning | Hardware, not monitoring |
| **Hackathon** | **~15 spoofing and jamming teams**: TrueSignal, GNSS Integrity Watch, Baltic Shield (maritime!) | **Very crowded.** Baltic Shield is the closest. |

## Risks
- Most crowded topic in the hackathon. Only pick it with a clear maritime and route angle.
- Weak Copernicus use lowers relevance; the space story is mostly Galileo.

## Scoring self-check
| Relevance | Innovativeness and business | Team fit |
|---|---|---|
| 4 | 2–3 | 5 |
