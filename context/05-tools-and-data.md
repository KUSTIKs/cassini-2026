# Tools and data we can use

Labels: ✅ = checked on the official page during research (27 Nov 2026). ℹ️ = from general knowledge, not checked; confirm before relying on it.

## Tools provided by the hackathon
Source: https://www.cassini.eu/hackathons/node/104 ✅

| Tool | What it gives us | Link |
|---|---|---|
| **Copernicus Data Space Ecosystem (CDSE)** | Free access to all Sentinel data, plus cloud compute and storage for the event. Browser, Jupyter, openEO and Sentinel Hub APIs. | https://dataspace.copernicus.eu/ |
| **Jupyter data notebooks** | A themed notebook per hackathon. ⚠️ No notebook for the 12th edition was on GitHub as of 27 Nov; the newest is the 11th edition's humanitarian one (`intdev-humaid-examples`). | https://github.com/cassinihackathons |
| **APEx Algorithm Catalogue (ESA)** | Ready-to-run Earth observation algorithms, most on CDSE openEO. Runs on demand with the CDSE free tier. | https://algorithm-catalogue.apex.esa.int/ |
| **FlyPix AI** | No-code AI object detection, counting and change tracking on satellite, aerial or drone imagery. Exports GeoJSON or interactive maps. Also has an API and Python SDK. Ask organisers about hackathon access. | https://flypix.ai/ |
| **KINEIS** | Satellite IoT connectivity: devices send small messages via satellite, with no mobile network needed. | https://www.kineis.com/en/spatial-iot-connectivity/ |
| **Code repository** | Past participants' code. | https://github.com/cassinihackathons |
| **Participant Playbook (12th edition)** | Event how-to. | https://www.cassini.eu/hackathons/sites/default/files/2026-10/Participant%20Playbook_12th%20CASSINI%20Hackathon.pdf |
| **Business Design Playbook** | Business model guidance; useful for the innovativeness and business score. | https://www.cassini.eu/hackathons/sites/default/files/2024-11/Business%20Design%20Playbook_update.pdf |
| **On-demand training** | Intro videos: Galileo and EGNOS, CDSE, Copernicus Browser, openEO, Jupyter, IoT and satellite connectivity, business model, pitching. | (on the tools page) |

Other links on the tools page: GNSS raw measurements white paper and database, list of Galileo-enabled devices, Android phones with raw GNSS, EGNOS/Galileo programme reference documents, European power plant database.

## APEx algorithms relevant to us ✅
85 algorithms in the catalogue. The relevant ones (mostly openEO, "Community", often "No Benchmark", so test before relying on them):

| Algorithm | Use |
|---|---|
| **Ship Detection (S1/S2 Fusion)**, process id `ship_detection` | Ships as bright Sentinel-1 VV/VH returns over water masked with Sentinel-2. Backend: openeo.dataspace.copernicus.eu. Adapted from a Sentinel Hub custom script. ⚠️ Needs a usable Sentinel-2 pass for the water mask (clouds). |
| **Change detection using Sentinel-1 data** | Land cover changes for given areas, through cloud. Damage, clearings, new pits. |
| **Flood Detection (S1…)** | Flood extent from radar. |
| **Burned Area Severity (BAS)** / **Fire Boundary Detection** / **Forest Fire Progression** | Fire damage and spread. |
| **NDVI Anomaly Detection** | Vegetation loss: deforestation, crop damage. |
| **MAGO Water Quality**, **NDCI (cyanobacteria)** | Turbidity and water quality: plumes, pollution. |
| **DinSAR Sentinel-1 interferogram and displacements** | Ground movement: subsidence, landslides, earthquakes. |
| **Simple Water Bodies Mapping**, **Cloudless Mosaic**, **Best-Available-Pixel composite** | Base layers. |
| **Photovoltaic farms mapping**, **Land Surface Temperature (Sentinel-3)** | Infrastructure and heat. |
| **Delineate Anything v2**, **Parcel Delineation** | Field and plot boundaries. |

## Copernicus services and data (beyond raw Sentinels)
| Source | What | Access |
|---|---|---|
| **Sentinel-1** (radar) | Sees through cloud and at night: ships, floods, damage, ground movement | CDSE ✅ |
| **Sentinel-2** (optical, 10 m) | Vegetation, land cover, visual change | CDSE ✅ |
| **Sentinel-3** | Land and sea surface temperature, fire radiative power | CDSE ℹ️ |
| **Sentinel-5P** | Air pollution gases (NO₂, SO₂, CO…) | CDSE ℹ️ |
| **Copernicus Emergency Management Service (CEMS)** | Rapid Mapping (expert damage maps within hours of activation), Risk & Recovery | https://emergency.copernicus.eu ℹ️ |
| **GFM: Global Flood Monitoring** (CEMS) | Automatic flood maps from every Sentinel-1 image | portal/API with registration ℹ️ |
| **EFAS / GloFAS** (CEMS) | Flood forecasts (Europe / global) | registration for data ℹ️ |
| **EFFIS** (CEMS) | Active fires, burned areas, fire danger | WMS / downloads ℹ️ |
| **EDO / GDO** (CEMS) | Drought monitoring | ℹ️ |
| **CAMS** (atmosphere) | Air quality and wildfire smoke forecasts, hourly, about 5 days | Atmosphere Data Store API, free registration ℹ️ |
| **C3S** (climate) | ERA5 reanalysis, heat-stress indices | Climate Data Store API ℹ️ |
| **CLMS** (land) | Land cover, forest layers, Urban Atlas, riparian zones | ℹ️ |

## Galileo / EGNOS
| Capability | Use | Notes |
|---|---|---|
| **Positioning and timing** | Location and time stamps, routing | Phones use Galileo automatically. ⚠️ The browser Geolocation API doesn't say which constellation was used. |
| **OSNMA** (signal authentication) | Proves navigation data really came from Galileo; anti-spoofing | Needs raw navigation-message access (native Android or a GNSS receiver), **not available in the browser**. Present it as roadmap or native add-on unless we have hardware. ℹ️ |
| **EWSS** (Emergency Warning Satellite Service) | Alerts delivered through the Galileo signal, even when mobile networks are down | ℹ️ Check current service status before claiming it's operational. |
| **HAS** (High Accuracy Service) | Decimetre-level positioning | ℹ️ |
| **Raw GNSS measurements on Android** | Spoofing and jamming analysis | Lists of supported phones are on the tools page ✅ |

## Other free data (not EU space, useful in combination)
| Source | What |
|---|---|
| **GDACS** (EU JRC + UN) | Global disaster alerts (earthquakes, floods, cyclones, volcanoes, droughts, fires) with GeoJSON/RSS API ℹ️ |
| **Danish Maritime Authority AIS** (web.ais.dk) | Free historical AIS ship positions, Danish and Baltic waters ℹ️ |
| **EMODnet** | Subsea cables, pipelines, maritime layers ℹ️ |
| **JRC Global Forest Cover 2020** | EUDR reference forest map ℹ️ |
| **OpenStreetMap / healthsites.io** | Roads, hospitals, facilities |
| **openrouteservice** | Routing with `avoid_polygons` (route around flooded areas) ℹ️ |
| **HHS emPOWER** (US) | Precedent and benchmark for vulnerable-population disaster data ✅ |

## Practical setup (do first)
1. Create a CDSE account and an OAuth client (Sentinel Hub / openEO).
2. Run one APEx process or one Sentinel Hub request end to end before building the UI.
3. Front end: React + MapLibre / deck.gl. Back end: Node calling CDSE and openEO. Process results ahead of time and replay real events so the demo feels instant.
