# JammerHunt: find who is jamming GPS

**One-liner:** when GPS gets jammed, automatically locate the likely source area and check satellite radar for a ship hiding there. Minutes instead of days of volunteer OSINT work.
**Challenge:** #1, wording "validate signals… identify anomalies using Earth observation data", **plus** #3, "monitor borders and critical infrastructure"
**Status:** shortlisted (strong news hook)

## The trigger story (this week)
- **21–23 Nov 2026:** severe GPS jamming over Stockholm, Åland and beyond. At Stockholm Arlanda, jammed flights rose from ~1% to **40–50%** ([@auonsson](https://x.com/auonsson/status/2124641428408049923), [@flightradar24](https://x.com/flightradar24/status/2124827436747743282)).
- **26 Nov:** Swedish Transport Agency (Transportstyrelsen) confirmed it, called it serious, said it affected **planes and ships** and that the area and scale were new ([@auonsson](https://x.com/auonsson/status/2125974957356147062)). It didn't point to Åland as the source ([post](https://x.com/auonsson/status/2125973803352363380)).
- **27 Nov:** OSINT analyst @auonsson concluded the source was **a dark ship at 59.22°N 20.66°E**, 75 km south of Åland: "several satellites saw the ship and right above it was a high power signal right at GPS L2 frequency" ([post, 24K views](https://x.com/auonsson/status/2126349133091049967)). He had already ruled out an aircraft ([post](https://x.com/auonsson/status/2126216525099270643)).
- ⚠️ As of 27 Nov I found this only on X, not yet in mainstream news. Treat it as an OSINT claim.

**Wider context:**
- Sweden logged a sharp rise in Baltic GPS interference: 733 incidents to Aug 2025 vs 495 in 2024 and 55 in 2023 ([Transportstyrelsen press release 2025](https://www.transportstyrelsen.se/sv/om-oss/pressrum/nyhetsarkiv/2025/kraftig-okning-av-gps-storningar-i-ostersjon/), [Moscow Times](https://www.themoscowtimes.com/2025/09/04/sweden-accuses-russia-of-widespread-gps-jamming-over-baltic-sea-a90427)).
- KLM and Air Canada flights lost navigation over Sweden ([AeroCorner, Sep 2026](https://aerocorner.com/news/gps-jamming-sweden-klm-air-canada-flights/)).
- Baltic interference is becoming "more complex and stronger", with coordinated spoofing and jamming ([heise](https://heise.de/-11105103), [Maritime Executive](https://maritime-executive.com/article/study-baltic-gps-disruption-comes-from-a-tactically-controlled-network)).

## Who uses it
| User | Who exactly | What they need |
|---|---|---|
| **Primary: national authority analyst** | e.g. an analyst at Transportstyrelsen, the Swedish Post and Telecom Authority (PTS, which manages radio spectrum) or the coast guard ops centre | "Where is this jamming coming from, and is it a ship we can identify?" Today they wait for reports or for volunteers on X |
| Coast guard / navy duty officer | Maritime operations centre | "Is there a vessel we should send a patrol to look at?" |
| Air navigation service (secondary) | e.g. LFV (Sweden), Fintraffic | Warn pilots and choose procedures |

**Buyer:** national transport, spectrum or maritime authorities. Possibly through EU programmes, since this extends EMSA's work (see Competition).

## User flow (simplified)
```
1. Analyst opens the map.
   Red hexagons show where aircraft and ships reported bad GPS today.
2. Clicks the red cluster over Stockholm.
   App estimates the likely SOURCE AREA (centre of the disturbance pattern).
3. App pulls the Sentinel-1 radar pass(es) for that area and time.
   It lists every ship it sees and compares them with AIS.
4. Result:
   "3 ships in area. 2 broadcasting AIS (cargo ship A, ferry B).
    1 ship visible on radar with NO AIS at 59.22N 20.66E → probable jammer."
5. Analyst clicks the ship: radar image crop, size estimate, nearby AIS history.
   → "Send to coast guard" / "Add to case file" (see idea 04, Seizure File)
```

## Demo "wow moment"
Replay 21–23 Nov: the jamming map turns red over Stockholm, the source area narrows to a point south of Åland, the radar image appears, and **a bright dot with no AIS label** gets the "probable jammer" tag. Ends with: "a volunteer needed 5 days. We need 5 minutes."

## Space data (essential)
| Source | Used for |
|---|---|
| **Copernicus Sentinel-1** (radar) via **APEx Ship Detection** | Sees ships at night and through cloud, whether or not they broadcast |
| Sentinel-2 (optical) | Visual confirmation when it's clear |
| **Galileo** | Interference affects GPS and Galileo bands; with OSNMA, show which receivers kept trusted positions (roadmap) |

## Other data
- **Aircraft GPS quality (ADS-B):** [gpsjam.org](https://gpsjam.org/faq/) (built on airplanes.live and ADS-B Exchange data), [OpenSky Network](https://opensky-network.org/) for raw data, [Flightradar24 GPS jamming map](https://www.flightradar24.com/blog/gps-jamming-map/)
- **Ship positions (AIS):** [Fintraffic Digitraffic](https://digitraffic.fi/en/marine-traffic) (open, real time; ⚠️ **no official history API found**, so start archiving now). Danish AIS covers Danish waters only.
- **Ship spoofing signals:** ships jumping onto land, as in the [SeaSpoofFinder paper](https://arxiv.org/html/2602.16257v1)

## Competition
| Who | What | Gap we fill |
|---|---|---|
| **EMSA Copernicus Maritime Surveillance (CMS)** | EU service: SAR and optical vessel detection **correlated with AIS** to find non-transmitting ships ([EMSA CMS](https://www.emsa.europa.eu/copernicus.html), [vessel detection](https://www.emsa.europa.eu/meetings-bcsea/item/3640-what-is-vessel-detection-service-vds.html)). Access only for EU/EFTA authorities. | Not linked to GNSS interference; it's an analyst service, not a "find the jammer" workflow. **Position us as a layer on top, or a pitch to EMSA, not a rival.** |
| **HawkEye 360** (US) | Satellites that geolocate RF emitters, including GNSS jammers and spoofers ([GPS World](https://www.gpsworld.com/hawkeye-360-launches-advanced-gnss-interference-detection-capabilities/)) | Commercial, US, expensive. We use free EU data. |
| **Spire** | GNSS interference reports and AIS position validation ([Baltic report](https://spire.com/blog/space-reconnaissance/gnss-interference-report-russia/)) | Data vendor, not a workflow |
| **OSINT volunteers** (@auonsson) | Manual analysis | Slow and unofficial |
| Hackathon | ~15 teams detect spoofing (see `../context/06-competition.md`) | **None locate the source** |

## Business model
SaaS licence for national authorities. Pilot with Sweden or Finland, then sell through EU/EMSA channels.

## Risks and open questions
- ⚠️ Did **Sentinel-1 pass over 59.22N 20.66E between 21 and 23 Nov**? Check first. If not, pick another documented event.
- Locating a source from aircraft data alone is rough (tens of km). Present it as "search area", not exact position.
- Security clause §8.8: use only open data and don't claim operational military use.

## Scoring self-check
| Relevance | Innovativeness and business | Team fit (web dev) |
|---|---|---|
| 5 (C1 + C3) | 4 (EMSA overlap) | 3 (radar processing via APEx) |
