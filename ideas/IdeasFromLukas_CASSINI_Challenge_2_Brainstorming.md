# CASSINI Hackathon — Challenge 2
## EO Project Brainstorming | Prague | 27 November 2026

**Challenge:** Space-enabled crisis response and civil resilience  
**Goal:** Identify an original, technically credible and scalable Earth Observation (EO) application that can be demonstrated within a two-day hackathon.  
**Status:** Discussion document — concepts, customer hypotheses and proposed methods still need validation.

---

## 1. Shortlist

The order below reflects the initial preference, not a final team decision.

| # | Concept | Core question | Potential primary customer |
|---|---|---|---|
| 1 | **RUBBLEFLOW** | Where should disaster debris go, and how can we manage it efficiently? | Municipalities and reconstruction authorities |
| 2 | **AQUATRACE** | Where should we test water quality after a disaster? | Water utilities and environmental authorities |
| 3 | **SECONDWAVE** | Where could the next disaster emerge as a consequence of the first? | Civil protection and water utilities |
| 4 | **RECOVERYCLOCK** | Which affected communities are recovering, and which are being left behind? | Reconstruction funds and development banks |
| 5 | **AIDBLIND** | Where do we have insufficient information to make reliable humanitarian decisions? | Civil protection and humanitarian organizations |

**Shared principle:** Do not build another generic disaster dashboard. Build a product that converts EO observations into a concrete decision, makes uncertainty explicit and creates measurable operational or economic value.

---

## 2. RUBBLEFLOW — Disaster Waste & Reconstruction Logistics

> Turn disaster debris from a reconstruction bottleneck into a manageable logistics and recycling problem.

### Problem

Floods, earthquakes and other major disasters generate large quantities of debris. Authorities need to identify temporary storage sites, organize removal, avoid further environmental damage and make material available for recycling. Poor decisions can delay reconstruction, increase transport costs and create additional pollution.

### Proposed solution

An EO-supported planning and monitoring tool that identifies suitable temporary debris storage areas, estimates scenario-based capacity, connects affected zones to candidate sites and monitors large-scale stockpile changes over time.

### EO contribution and additional data

- **Sentinel-2:** Land cover, open-space screening and change detection for sufficiently large debris storage areas.
- **Sentinel-1:** Complementary flood extent and radar observations where optical imagery is obscured by clouds.
- **Copernicus DEM:** Terrain and slope screening.
- **Additional data:** OpenStreetMap roads and buildings, existing waste facilities, protected areas, flood hazard zones, land ownership or permitted-use data where available.
- **Optional:** Galileo-enabled field reporting to geolocate inspected sites and verify conditions.

### Potential innovation

Combine EO-derived site conditions with spatial constraints, capacity scenarios and transport optimization to answer **where debris should be taken**, not just where damage occurred. A longer-term product could support recycling flows, site monitoring and reconstruction logistics across multiple municipalities.

### Two-day MVP

- Select a historical disaster, e.g. the October 2024 Valencia floods.
- Identify affected areas using an existing flood extent or Sentinel imagery.
- Screen potential storage sites using open land, slope, flood exposure and accessibility; exclude known restricted areas.
- Rank candidate sites and demonstrate allocation of hypothetical debris volumes through a simplified road-network or distance-based model.
- Show a map and a scenario comparison: estimated capacity, transport distance and affected demand served.

### Customers and value proposition

Municipalities, civil protection agencies, reconstruction authorities, waste-management companies and contractors. Potential value: reduced transport distance and cleanup delays, better coordination and more transparent site selection.

### Critical assumptions / risks

- Sentinel cannot reliably identify small individual rubble piles or determine exact waste volume or composition.
- Capacity must be estimated from area and explicit assumed usable fraction, stacking height and density where relevant; it is not directly measured by EO.
- Hazardous waste, legal permissions, environmental suitability and actual ground conditions require expert and on-site verification.
- Without official debris quantities, use clearly labeled demand scenarios rather than invented observations.

### Questions for the team

- Is the strongest product site selection, logistics optimization, recycling coordination or monitoring?
- Can we find actual debris sites or official waste quantities for validation?
- Who owns the decision and budget for temporary storage and transport?

---

## 3. AQUATRACE — Post-Disaster Water Sampling Intelligence

> Help water authorities decide where to test first when contamination may be spreading after a disaster.

### Problem

Floods can mobilize sediments, sewage, agricultural runoff and industrial pollutants. Potentially affected water bodies may extend far beyond the original flooded area. Laboratory testing is expensive and field teams cannot sample everywhere simultaneously.

### Proposed solution

A spatial decision-support tool that combines observed water anomalies, flood exposure and plausible downstream connectivity to prioritize water-quality sampling locations.

### EO contribution and additional data

- **Sentinel-2:** Optical observations of surface-water extent and relative turbidity or suspended-sediment proxies, subject to atmospheric correction and local calibration.
- **Sentinel-1:** Flood extent and complementary observations during cloudy conditions.
- **Copernicus DEM:** Terrain-based hydrological context.
- **Additional data:** River networks, catchments, known industrial or agricultural land uses, water intakes, precipitation and available water-quality station measurements.
- **Optional:** Galileo-enabled geolocation of physical samples and field observations.

### Potential innovation

Move from visualizing water anomalies to optimizing **where limited sampling resources should be deployed**. A future product could integrate laboratory results and update sampling priorities as new evidence becomes available.

### Two-day MVP

- Select a documented flood affecting a river, reservoir or coastal water body.
- Compare pre-event and post-event Sentinel imagery and identify observable water anomalies.
- Combine anomalies with flood extent, river connectivity and the proximity of relevant water uses.
- Rank candidate sampling locations according to potential exposure, evidence quality and coverage.
- Show an example sampling plan for a team with a limited number of available tests.

### Customers and value proposition

Water utilities, environmental agencies, public-health authorities and environmental response contractors. Potential value: faster investigation, more efficient sampling and improved situational awareness.

### Critical assumptions / risks

- Optical anomalies are not proof of contamination; Sentinel cannot directly identify most dissolved chemicals, pathogens or their concentrations.
- Narrow rivers, cloud cover, mixed pixels and atmospheric effects can substantially limit the method.
- DEM or river connectivity does not establish actual pollutant transport speed, concentration or exposure.
- Outputs must be framed as sampling priorities, never as drinking-water safety declarations.

### Questions for the team

- Which water body provides a sufficiently clear satellite signal and reliable reference data?
- Is the customer most interested in drinking-water protection, environmental monitoring or industrial incident response?
- Can we obtain any real water-quality measurements to evaluate the prioritization?

---

## 4. SECONDWAVE — Cascading Disaster Risk Intelligence

> The first disaster may be over, but the next crisis may already be developing.

### Problem

Primary disasters can create new environmental hazards. Wildfires remove vegetation and increase vulnerability to erosion, flash floods and debris flows; flooding may destabilize slopes and disrupt water systems. Emergency management often focuses on the immediate event rather than its secondary consequences.

### Proposed solution

An EO-driven tool that identifies where a primary disaster has changed the landscape in ways that increase susceptibility to a defined secondary hazard, and prioritizes preventive inspections or interventions.

### EO contribution and additional data

- **Sentinel-2:** Burn severity proxies (e.g. dNBR), vegetation loss and land-cover changes.
- **Sentinel-1:** Complementary flood or surface-change observations where appropriate.
- **Copernicus DEM:** Slope, catchments and drainage pathways.
- **Additional data:** Rainfall observations or forecasts, soils, geology, exposed settlements and water infrastructure.

### Potential innovation

Connect sequential hazards in a single workflow, translating landscape change into a new operational risk picture. A focused product could help water utilities and civil protection anticipate consequences before they become emergencies.

### Two-day MVP

Focus on **wildfire → heavy rainfall → erosion / debris-flow susceptibility** rather than attempting to model every possible disaster chain.

- Select a documented wildfire with suitable pre- and post-fire imagery.
- Map burn severity using Sentinel-2 and calculate slope and catchment properties.
- Combine landscape susceptibility with observed or scenario-based rainfall and downstream exposure.
- Rank catchments or locations for inspection, erosion-control measures or further assessment.
- Compare risk-priority maps before and after the wildfire, clearly explaining the scoring assumptions.

### Customers and value proposition

Civil protection agencies, water utilities, municipalities, environmental authorities and insurers. Potential value: earlier preventive action, targeted inspections and better allocation of mitigation resources.

### Critical assumptions / risks

- Burn severity and terrain alone do not predict individual landslides or debris flows.
- Rainfall intensity, soil properties and local calibration are essential for a validated forecasting model.
- A weekend MVP should produce relative susceptibility and inspection priorities, not operational warnings or calibrated probabilities.
- Existing post-fire hazard models are established; differentiation must come from the decision workflow, data integration or customer-specific use case.

### Questions for the team

- Which specific disaster chain offers the strongest customer need and data availability?
- Can we obtain a documented secondary event to test whether our priority map is meaningful?
- What preventive decision can a customer realistically make using the output?

---

## 5. RECOVERYCLOCK — Independent Reconstruction Monitoring

> Measure observable recovery over time, not just immediate disaster damage.

### Problem

Governments and international donors invest substantial resources in recovery, but monitoring progress consistently across many affected regions can be difficult. Some areas may recover rapidly while others experience prolonged disruption or environmental damage.

### Proposed solution

A longitudinal EO-based monitoring service that compares observable recovery indicators across affected areas, flags stalled or uneven recovery and supports prioritization of further investigation and assistance.

### EO contribution and additional data

- **Sentinel-2:** Vegetation recovery, persistent water, land-cover change and sufficiently large surface changes associated with reconstruction.
- **Sentinel-1:** Complementary radar time series and persistent flood observations.
- **Additional data:** Official disaster extent, administrative boundaries, population data, reconstruction milestones and field reports where available.
- **Optional:** Other open EO products, such as coarse-resolution night-time lights, if allowed and spatially appropriate.

### Potential innovation

A transparent, repeatable recovery measurement framework that goes beyond individual post-disaster snapshots. Instead of claiming to measure total recovery, the product tracks several observable indicators and identifies areas requiring further assessment.

### Two-day MVP

- Select a disaster with several months of post-event satellite observations.
- Establish a pre-disaster baseline and define two or three measurable recovery indicators.
- Compare time series for multiple municipalities or affected zones, accounting for seasonal variation where possible.
- Build a simple, explainable recovery score or show the indicators separately.
- Flag locations with persistent anomalies and show why they were flagged.

### Customers and value proposition

Reconstruction authorities, development banks, international donors, insurers and humanitarian organizations. Potential value: independent progress monitoring, improved prioritization and more transparent reporting.

### Critical assumptions / risks

- Satellite-observable physical or environmental recovery is not equivalent to social, economic or institutional recovery.
- Vegetation seasonality, weather and construction unrelated to the disaster can confound indicators.
- Sentinel resolution is not sufficient for reliable assessment of individual small-building repairs.
- Any composite index must disclose indicator weights, observation gaps and uncertainty; it must not be used alone to allocate funding.

### Questions for the team

- Should the first product focus on agriculture, flooded settlements or broader regional reconstruction?
- What independent recovery milestones could validate the indicators?
- Would a paying customer prefer periodic reports, an API or a monitoring dashboard?

---

## 6. AIDBLIND — Humanitarian Information Gap Intelligence

> The most dangerous part of a crisis map may be what is missing from it.

### Problem

Emergency responders have to make decisions even when information is incomplete. Cloud cover, acquisition gaps, outdated imagery, uneven reporting and limited field capacity mean that some potentially affected regions remain poorly understood. A blank map does not mean that no one needs help.

### Proposed solution

A decision-support tool that combines potential humanitarian impact with evidence coverage and quality to identify locations where additional information would be most valuable.

### EO contribution and additional data

- **Sentinel-2:** Optical imagery availability, cloud masks, image age and relevant change indicators.
- **Sentinel-1:** Complementary radar coverage and event-relevant observations.
- **Additional data:** Population grids, disaster footprints, civilian infrastructure, field-report coverage and available emergency mapping products.
- **Optional:** Galileo-enabled field assessments with geolocated and time-stamped reports.

### Potential innovation

Turn the inherent limitations of EO into a product feature. Rather than producing another damage map, generate an **information-gap priority map** recommending where to request further analysis or conduct civilian field assessments. A future version could optimize assessment resources using formal value-of-information methods.

### Two-day MVP

- Select a historical disaster with incomplete optical coverage and available reference mapping.
- Create a grid or use administrative units for comparison.
- Combine population exposure or modeled hazard potential with evidence freshness, sensor coverage and usable imagery.
- Rank locations by the need for additional assessment; distinguish observed impact from uncertain potential impact.
- Demonstrate a limited assessment budget: which five areas should be investigated first, and why?

### Customers and value proposition

Humanitarian organizations, civil protection agencies, emergency mapping teams and public-sector crisis coordinators. Potential value: fewer overlooked communities, more efficient assessment allocation and better communication of uncertainty.

### Critical assumptions / risks

- A missing observation or report is not evidence that damage occurred.
- Cloud-free imagery does not guarantee that humanitarian impacts are observable from space.
- Population exposure is not a direct measure of humanitarian need.
- A heuristic priority score is not a calibrated probability or validated value-of-information model.
- A real emergency deployment must consider safeguarding, data protection and the sensitivity of field observations.

### Questions for the team

- What kind of information gap are we addressing first: satellite coverage, field reports or uncertainty in damage assessments?
- Can we demonstrate that our ranking improves upon simple population-based or hazard-based prioritization?
- Who would pay for this service, and how would it fit into existing humanitarian assessment workflows?

---

## 7. Team Decision Matrix

Score each criterion from **1 (weak) to 5 (strong)** after discussing the concepts. Scores should reflect what the team can actually access and build this weekend, not the long-term vision alone.

| Criterion | Weight | RUBBLEFLOW | AQUATRACE | SECONDWAVE | RECOVERYCLOCK | AIDBLIND |
|---|---:|---|---|---|---|---|
| Importance of the problem / societal impact | 15% | — | — | — | — | — |
| Originality and differentiation | 20% | — | — | — | — | — |
| Essential and credible use of EU space data | 15% | — | — | — | — | — |
| Availability of real data and validation | 15% | — | — | — | — | — |
| Feasibility within two days | 15% | — | — | — | — | — |
| Clear customer and economic value | 10% | — | — | — | — | — |
| Demonstration and pitch potential | 10% | — | — | — | — | — |
| **Weighted total / 5** | **100%** | — | — | — | — | — |

Suggested weights are a starting point for the team, not official judging criteria. Each weighted total is the sum of the criterion scores multiplied by their fractional weights.

### Go/no-go questions

1. Can we obtain usable satellite imagery and the essential complementary data today?
2. Is EO genuinely necessary to the solution, rather than a decorative map layer?
3. Can we identify a specific decision-maker, their problem and the decision our product improves?
4. Can we demonstrate an end-to-end result using real observations, with any simulated inputs clearly labeled?
5. Can we explain what is new compared with existing products and research?

---

## 8. Shared Data & Technical Starting Points

| Resource | Potential use | Access |
|---|---|---|
| Copernicus Data Space Ecosystem | Sentinel-1/2 imagery, discovery and processing | [Copernicus Browser](https://browser.dataspace.copernicus.eu/) |
| openEO | Cloud-based EO processing | [openEO on CDSE](https://openeo.dataspace.copernicus.eu/) |
| Copernicus DEM | Terrain, slope and drainage context | [CDSE](https://dataspace.copernicus.eu/) |
| Copernicus Emergency Management Service | Historical disaster footprints and reference mapping | [CEMS Mapping](https://mapping.emergency.copernicus.eu/) |
| OpenStreetMap | Roads, buildings, facilities and access | [OpenStreetMap](https://www.openstreetmap.org/) |
| WorldPop | Gridded population estimates | [WorldPop](https://www.worldpop.org/) |
| HydroSHEDS | Hydrological networks and catchments | [HydroSHEDS](https://www.hydrosheds.org/) |
| Copernicus Climate Data Store | Historical weather and precipitation context | [CDS](https://cds.climate.copernicus.eu/) |

**Candidate case studies:** October 2024 Valencia floods; September 2024 Central European floods; a documented wildfire with subsequent heavy rainfall. These are starting points, not confirmed selections. Check actual scene dates, usable coverage, spatial resolution, access conditions and reference data before committing.

**Possible technical stack:** Python, GeoPandas, Rasterio, Xarray, NumPy, QGIS, openEO, OSMnx (where routing is needed), and Streamlit or a lightweight web map. Choose the simplest stack the team already knows. ML is optional; a transparent and testable spatial workflow may be stronger for the MVP.

**Galileo / EGNOS:** Potentially useful for positioning field observations or sampling teams where suitable equipment and services are available. They do not provide a public live feed of people, vehicles or objects. Do not force GNSS into the concept if EO is the core contribution.

---

## 9. Proposed Brainstorming Session

| Time | Activity | Desired output |
|---|---|---|
| 5 min | Align on the challenge and constraints | Shared understanding of scope |
| 15 min | Discuss all five ideas | Main strengths, objections and improvements |
| 15 min | Parallel checks: data, competitors and customer needs | Evidence for or against feasibility and differentiation |
| 10 min | Score and compare | Shortlist of one or two concepts |
| 10 min | Define the winning MVP | Case study, dataset, decision output and roles |

### Fill in together

- **Selected concept:**
- **Target user / paying customer:**
- **Specific problem and current workflow:**
- **Our differentiation from existing solutions:**
- **Essential Sentinel input:**
- **Complementary datasets:**
- **Case study / study area:**
- **Minimum viable output:**
- **Success metric / comparison baseline:**
- **Main technical risk and fallback:**
- **Team roles:**
- **One-sentence pitch:**

> For **[specific customer]**, who struggles with **[specific crisis-response problem]**, our solution uses **[EU space data + complementary information]** to deliver **[actionable decision]**, improving **[measurable outcome]**.

---

## 10. Notes and New Ideas

- 
- 
- 

