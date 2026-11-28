# PROJECT.md: Lifeline (working name)

Source of truth for **what we're building and why**. Background (rules, judging, tools, competition) is in `context/`; case studies in `context/08-case-empower.md` and `context/09-case-france.md`.

Every fact below has a source link. **Unverified** means we haven't checked it, and **general knowledge** means it isn't from a source we read. Don't pitch either as fact.

---

## 1. The product in one line
**Lifeline tells a Czech mayor, before the power goes, which people on home ventilators and oxygen will lose it when a flood hits their substation. It ranks them by hours of battery left and sends firefighters a route around the flooded roads.**

- **Challenge:** #2, Space-enabled crisis response and civil resilience.
- **Market:** Czech Republic first.
- **Demo:** replay of **Krnov, September 2024**.

It joins three things that already exist but have never been connected:

| What exists | Who holds it | What it's used for today |
|---|---|---|
| Copernicus **EFAS** flood forecast | Copernicus, sent to national flood centres | River forecasts |
| **"Vulnerable customer" register** (names, addresses) | Grid operators (ČEZ Distribuce, EG.D, PREdistribuce) | Letters about *planned* outages |
| The **duty to warn, evacuate and give medical care in a flood** | Mayor and town flood commission | Done with no list |

We don't detect floods, and we don't build a new register.

---

## 2. Facts nobody can argue with

**The danger is real and recent**
1. **Sept 2024 floods:**
   - About **260,000 Czech households lost power** at the peak. The flooded **Krnov and Bohumín substations** were the main obstacle to restoring it. ([oEnergetice / Czech Radio](https://oenergetice.cz/en/quick-news/more-than-42000-customers-remain-without-power-after-widespread-flooding-in-czechia-with-numbers-falling), [ČEZ situation report 16 Sept](https://smocr.cz/Shared/Clanky/14551/stav-vyroby-a-distribuce-energii-v-skc.pdf))
   - About **30,000 were still without power on 19 Sept** ([oEnergetice](https://oenergetice.cz/en/electricity/czech-utility-cez-still-reports-30000-sites-without-power-awaits-customer-property-inspections)).
   - Damage to ČEZ energy equipment came to about **CZK 1 billion** ([oEnergetice](https://oenergetice.cz/en/czech-energy-sector/cez-estimates-flood-damage-to-czech-energy-facilities-at-one-billion-crowns)).
2. **Rescue services in that flood: 1,516 people rescued, 147 of them by helicopter, and 21,488 evacuated** (integrated rescue system figures, 23 Sept 2024; [ČTK](https://www.ceskenoviny.cz/zpravy/cesko-druhym-dnem-suzuji-povodne-evakuovano-bylo-pres-10000-lidi/2568042), [Ministry of Interior](https://mv.gov.cz/bsmv/clanek/ustredni-krizovy-stab-k-povodnim-usili-se-presouva-k-likvidaci-nasledku-a-obnove-volby-se-podarilo-zajistit-ve-vsech-obcich.aspx)). The ERCC counted **more than 350,000 people affected** in Czechia ([EFAS Bulletin Aug–Sep 2024](https://european-flood.emergency.copernicus.eu/sites/default/files/bulletins-documents/2024/EFAS_Bimonthly_Bulletin_Aug_Sep2024.pdf)).
3. **4 July 2025:** one fault left about **1 million Czech customers** without power, including much of Prague ([Radio Prague](https://english.radio.cz/node/8855960)). The regulator recorded **2,277 MWh undelivered and a 225-minute transmission interruption** from that single event ([ERÚ continuity report 2025](https://eru.gov.cz/sites/default/files/obsah/prilohy/erv032026.pdf)).
4. **When the battery runs out, people die:**
   - **Portugal, April 2025 blackout:** a 77-year-old on a home ventilator died; it's under investigation ([Portugal Resident](https://www.portugalresident.com/possible-death-as-result-of-blackout-ministry-of-health-opens-investigation/)).
   - **France, Storm Ciarán:** a ventilator patient went **5 days without power** because she wasn't on the grid operator's list ([Assemblée nationale Q680](https://questions.assemblee-nationale.fr/dyn/17/questions/QANR5L17QE680.pdf)).

**The data exists, and nobody uses it in a flood**

5. Since **1 Jan 2024**, Czech law lets people whose health depends on equipment needing constant power (home ventilation, oxygen therapy) register as **"vulnerable customers"**. They need a doctor's confirmation, which is valid for up to 2 years ([ČEZ](https://www.cez.cz/cs/podpora/elektrina/zranitelny-zakaznik), [finance.cz](https://www.finance.cz/550716-osoby-zavisle-na-dodavce-elektriny-zaruka/)). The grid operator keeps the register **with identification and contact details, tied to the supply address** ([epravo.cz](https://www.epravo.cz/top/clanky/ochrana-zranitelneho-zakaznika-v-oblasti-dodavek-energii-118296.html)).
6. **What registration gets them:** notice of *planned* outages and protection from being cut off for unpaid bills. **Nothing for unplanned outages, floods or storms** (same sources).
7. **Copernicus saw the flood coming:**
   - **EFAS** sent a **formal flood notification for the Opava river, which runs through Krnov, on 12 Sept 2024**, with a **60-hour lead time**.
   - For the Czech Oder it was **78 h**, and for the Morava a formal notification went out on **10 Sept, 144 h ahead**.

   ([EFAS Bulletin Aug–Sep 2024, Table 1](https://european-flood.emergency.copernicus.eu/sites/default/files/bulletins-documents/2024/EFAS_Bimonthly_Bulletin_Aug_Sep2024.pdf)) **Two and a half days of warning, and no link from it to the people who would lose power.**

**The duty exists, and the tool doesn't**

8. The law tells the **mayor's flood commission** to:
   - **warn** people in the town (§78(3)(f) Water Act)
   - **organise evacuation** (§78(3)(j))
   - **"ensure the necessary hygiene and medical care during a flood"** (§78(3)(k))

   The **mayor chairs the commission** (§78(1)). ([Act 254/2001](https://www.zakonyprolidi.cz/cs/2001-254)) In a declared crisis, the mayor must also warn the people in the town and order and organise evacuation (§21(3) Crisis Act, [Act 240/2000](https://www.zakonyprolidi.cz/cs/2000-240)).
9. The fire service's 2025 flood checklist for towns gives the mayor one line on these people: *"pay increased attention to people with specific needs"*, with no list and no method ([HZS ČR checklist](https://hzscr.gov.cz/soubor/2025-09-check-list-povoden-pdf.aspx)). The town crisis card counts people for evacuation but holds **no names** ([HZS crisis card methodology](https://hzscr.gov.cz/soubor/krizova-karta-obce-metodika-pdf.aspx)).

**No incentive and no system: nobody owns the problem**

10. **Flood outages cost the grid company nothing on its quality KPI.** The regulator's quality bonus or penalty is worth up to **±4 % of the operator's profit**. It **excludes** outages "in adverse weather", caused by third parties, forced, or "extraordinary" ([ERÚ price-regulation methodology 2026–2030, §5.3.5](https://eru.gov.cz/sites/default/files/obsah/prilohy/metodika-cenove-regulace-2026-2030240830final0_0.pdf)). A flood is exactly the case that isn't counted.
11. **Even the best system elsewhere is too slow for the first hour:**
    - The US emPOWER programme lists **over 4.5 million** people, but a named list takes **3–4 hours** to get, and **only once a disaster is under way** ([Missouri health department fact sheet](https://content.govdelivery.com/attachments/MODHSS/2026/10/01/file_attachments/3802039/MO%20DHSS%20emPOWER%20FactSheet%20for%20Locals%208.2026.pdf), [HHS executive summary](https://empowerprogram.hhs.gov/Program-Executive-Summary.pdf)).
    - In Florida, about **45,000 people were robocalled to find 169** with a health need ([HHS](https://empowerprogram.hhs.gov/Hurricane-Matthew-Florida-South-Carolina.pdf)).
    - **France:** the grid operator's duty is *"to inform, not to keep the power on"*, and for an unplanned cut no warning is possible ([ARS Île-de-France](https://www.iledefrance.ars.sante.fr/patient-haut-risque-vital-demarches-suivre-pour-etre-informe-en-cas-de-coupure-electrique-0)).

**The group is small enough to reach everyone**

12. About **500 Czech families care for someone on home ventilation** (patient group Dech života, via [CNN Prima](https://cnn.iprima.cz/nestiham-zit-pecuji-24-7-aneb-podpora-pecujicich-o-pacienty-na-domaci-umele-plicni-ventilaci-472657)). Add home-oxygen users, and a flooded town has **tens of people to reach, not thousands**. That's a list a mayor can finish in the first hour.

> **The pitch in one sentence:** *Copernicus warned about the Opava river 60 hours ahead, the grid operator had the names, and the mayor had the legal duty. Nobody connected them. Lifeline does, in minutes.*

---

## 3. Personas: what each one is measured on, and how Lifeline helps them hit it

Governments act on **duties, KPIs and liability**, not on goodwill, so each row starts from what that party is **measured on or legally liable for**.

### 3.1 Mayor and town flood commission (primary user, buyer)
| | |
|---|---|
| **Measured on / liable for** | Warning, evacuation and **medical care during a flood** (§78(3)(f), (j), (k) Water Act; §21 Crisis Act). After a disaster, the question is always *"did the town do what the law says?"* |
| **Today** | One checklist line, "pay increased attention to people with specific needs", and no names. |
| **Lifeline gives them** | When EFAS raises a warning for their river: a **named, ranked list** of who will lose power, a phone script, and a print/export option for when the network is down. |
| **KPI they can report** | **100 % of registered vulnerable people in the zone contacted before the outage**, with time and outcome logged, as **proof the §78 duty was met**. |

### 3.2 Fire and Rescue Service (HZS ČR) and regional operations centre (receives the list)
| | |
|---|---|
| **Measured on** | People rescued and evacuated. 2024 floods: 1,516 rescued (147 by helicopter), 21,488 evacuated (sources in §2). |
| **Today** | Learn about a ventilator patient when someone calls 112, often after the roads are under water. |
| **Lifeline gives them** | Each address, what to bring (generator, spare oxygen bottle, transport), and **a route avoiding flooded roads** from the Sentinel-1 flood map. Visits are planned during the 60-hour forecast window instead of done as emergencies during the flood. |
| **KPI they can report** | Fewer emergency rescues of dependent people **after** the outage (especially by helicopter); more **planned** moves made before the outage. |

### 3.3 Emergency medical service (ZZS) and region (kraj)
| | |
|---|---|
| **Measured on** | By law, every location must be reachable **within 20 minutes**, and the standard "must be met". The only exception is **"unforeseen adverse traffic or weather conditions"** (§5 [Act 374/2011](https://www.zakonyprolidi.cz/cs/2011-374)). The region must ensure **continuous availability** of the service (§24). |
| **Today** | In a flood, the 20-minute standard breaks down, and a ventilator patient on a dying battery becomes an emergency the ambulance can't reach. |
| **Lifeline gives them** | Patients identified and moved or supplied **before** the roads close, turning an impossible emergency into a planned transfer. |
| **KPI they can report** | Fewer emergencies from electricity-dependent patients during an outage; transfers done while the 20-minute standard still holds. |

### 3.4 Grid operator (ČEZ Distribuce, EG.D, PREdistribuce): data holder
| | |
|---|---|
| **Measured on** | SAIDI/SAIFI quality bonus or penalty of up to ±4 % of profit, **with weather outages excluded** (ERÚ, §2 fact 10). Czech SAIDI in 2025 was **214 min/customer/year** ([ERÚ](https://eru.gov.cz/sites/default/files/obsah/prilohy/erv032026.pdf)). |
| **Pressure that's coming** | The **EU Critical Entities Resilience Directive (2022/2557)**: member states had to name their critical entities, energy included, **by 17 July 2026**. Those entities must assess risks and take resilience measures ([IEA summary](https://www.iea.org/policies/26916-directive-20222557-on-the-resilience-of-critical-entities), [DLA Piper](https://www.dlapiper.com/en/insights/publications/2026/07/cer-directive-enters-a-new-phase-as-critical-entity)). *Unverified: whether each Czech distributor has been designated.* |
| **Today** | It keeps a register by law and uses it only to send letters about planned work. During a flood, it fields calls from desperate patients it can't help. |
| **Lifeline gives them** | A legally clean way to make the register **useful in an emergency**: names go out only for the affected area, only when an alert is declared, with every access logged. It also shows **which substation has the most dependent people behind it**, which can inform restoration order (US precedent: Broome County, NY used emPOWER this way, per [HHS](https://empowerprogram.hhs.gov/Program-Executive-Summary.pdf)). |
| **KPI they can report** | A documented resilience measure for vulnerable customers, which counts under CER (our argument, not a legal opinion). Fewer complaints and media stories about "the patient nobody warned". |

### 3.5 Ministry of the Interior / HZS headquarters, and the EU
| | |
|---|---|
| **Measured on** | **EU Disaster Resilience Goals (2023):**<br>• **"Alert": warnings must "reach the right people on time"**<br>• **"Anticipate": "identify vulnerabilities in critical sectors"**<br>• **"Secure": "information sharing … with critical infrastructure providers"**<br>([European Commission](https://civil-protection-humanitarian-aid.ec.europa.eu/what/civil-protection/european-disaster-risk-management/european-disaster-resilience-goals_en))<br>**Sendai Framework 2030:** Target A "substantially reduce global disaster mortality", and the early-warning target ([PreventionWeb](https://www.preventionweb.net/sendai-framework/sendai-framework-at-a-glance)). |
| **Today** | The national population-protection concept ([HZS](https://hzscr.gov.cz/soubor/uv-560-2021-koob-pdf.aspx)) covers warning and evacuation. *Unverified: whether it names vulnerable groups.* |
| **Lifeline gives them** | A measurable, Copernicus-based answer to "Alert" and "Anticipate", reportable per event: **minutes from EFAS notification to a named list**, and **% of vulnerable people reached before the outage**. |

### 3.6 The person on a ventilator or oxygen, and their family
| | |
|---|---|
| **Today** | A letter about planned work. In a flood, nobody calls unless a neighbour remembers them. |
| **Lifeline gives them** | A call **before** the power goes. A spare battery, oxygen or a transfer arranges itself. The family can confirm "she's with us", so rescuers skip the address. |
| **What it means** | The difference between the French Storm Ciarán case (5 days without power) and a planned visit on day one. |

### 3.7 Oxygen and medical equipment suppliers, and health insurers (secondary, roadmap)
They'd know in advance who needs a spare bottle or battery delivered. *Unverified: their contractual duties during outages, and the cost to insurers of emergency admissions. Don't pitch numbers here.*

---

## 4. How it works (the demo flow)

| Step | What happens | EU space data |
|---|---|---|
| **A. Forecast (days–hours before)** | An EFAS flood notification for a river turns the substations in its flood zone red. Lifeline lists every registered vulnerable customer fed by those substations. | **Copernicus EFAS** |
| **B. Rank (first hour)** | *"14 people will likely lose power in ~X h. First: ventilator, ~3 h battery, lives alone, 2nd floor."* Every rank has a one-line reason. | n/a |
| **C. Route (once power is out)** | Firefighters get the address, what to bring, and a route avoiding flooded roads. | **Sentinel-1 flood extent (Copernicus GFM)**; **Galileo** positioning |
| **After** | Report: contacted / confirmed away / not reached, with timestamps. This is the mayor's §78 evidence. | n/a |

A and B are built properly; C is one route on the map (decided 28 Nov).

**Priority rule (explainable):** hours until critical (device type × battery/backup), then lives alone, then floor or mobility. *Battery times (ventilator ~2–4 h, etc.) are general knowledge; we need a medical source.*

---

## 5. Demo data for Krnov, Sept 2024: what we checked (28 Nov)
| Data | Status |
|---|---|
| **EFAS notification for the Opava** (formal, forecast 11 Sept 12 UTC, issued 12 Sept, lead time 60 h); Oder CZ 78 h; Morava 144 h | **Confirmed**, [EFAS Bulletin Table 1](https://european-flood.emergency.copernicus.eu/sites/default/files/bulletins-documents/2024/EFAS_Bimonthly_Bulletin_Aug_Sep2024.pdf) |
| **CEMS Rapid Mapping for Czechia** | **Doesn't exist.** The five activations (13–14 Sept) covered Germany (EMSR755), Poland (EMSR756), Slovakia (EMSR757), and Romania, Hungary and Austria (EMSR759); *same bulletin*. So we must **not** claim a CEMS map for Krnov. |
| **GFM / Sentinel-1 flood extent near Opava, 15 Sept 2024** | **Exists**; JRC published the map ([JRC news, 20 Sept 2024](https://joint-research-centre.ec.europa.eu/jrc-news-and-updates/europe-floods-new-tool-estimate-water-depth-and-extent-2024-09-20_en)). The Krnov-specific polygon still needs downloading from the GFM portal or the Copernicus Data Space Ecosystem (CDSE). |
| **Krnov substation** | **Confirmed in OSM:** "Krnov" 110/22 kV, ČEZ Distribuce, way [55375417](https://www.openstreetmap.org/way/55375417), ~50.0821 N, 17.6811 E. A 22 kV substation sits next to it (way 55375414). |
| **Vulnerable customers** | **Made up** (rules §8.8). Real registry numbers aren't published. *Unverified: ERÚ may hold a count.* |

---

## 6. Non-technical requirements
1. **Legal access, minimum data.**
   - Names leave the grid operator **only** for the affected area, **only** after an alert, and only the fields needed: address, device, contact, carer.
   - *Legal basis unverified:* GDPR vital interests (Art. 9(2)(c)) plus Czech crisis law is our hypothesis, not a legal opinion.
2. **Usable by a mayor of a 500-person village:** Czech language, one screen, the first useful answer within 2 minutes, no training.
3. **Works when power and mobile networks are down:** the list is ready **before** the outage and can be printed or exported.
4. **Every rank is explainable,** with no black-box scoring.
5. **Nobody is lost:** every person ends as reached / confirmed away / not reached.
6. **Data protection:**
   - EU hosting and role-based access.
   - Every view is logged.
   - Data is deleted after the event (emPOWER's Missouri procedure: 30 days).
7. **Fits existing procedures:** it plugs into the fire service flood checklist and the town crisis card, with no new process.
8. **Demo uses synthetic people only.** Substations, rivers and Copernicus data are real.

---

## 7. Versus what exists
| | Names | Linked to a forecast | Ranks who first | Route to the person | Time to list |
|---|---|---|---|---|---|
| US emPOWER | On request | Counts only | No | No | 3–4 h, after the disaster starts |
| France PHRV list | ~4,000 people | No | No | No | No warning for unplanned cuts |
| France town-hall register | 1–5 % of eligible people | No | No | No | Sent to the prefect by post or secure email |
| Czech vulnerable-customer register | Yes | No | No | No | Used for letters only |
| **Lifeline** | Uses the existing register | **EFAS + Sentinel-1** | **Hours of battery** | **Yes** | **Minutes, before the outage** |

Sources: `context/08-case-empower.md`, `context/09-case-france.md`.

---

## 8. Build scope
**Must have**
1. Krnov replay: EFAS notification for the Opava → flood zone → the Krnov substation turns red.
2. Synthetic vulnerable customers (ventilator, oxygen), each tied to a substation.
3. Summary: "N people will likely lose power in ~X h".
4. Ranked list with reasons, plus contact status per person.
5. One route to a person, avoiding the GFM flood extent.

**Nice to have:** after-event report (§78 evidence), print/export, family confirmation.

**Out of scope:** real personal data; our own flood detection; any new register.

**Stack:** Turborepo, Next.js (web), Hono (API, hexagonal), Postgres + PostGIS. See `ARCHITECTURE.md`.

## 9. Security (counts in judging)
Login with roles, HTTPS, encrypted storage, an audit log of who viewed which person, EU hosting, data deleted after the event, and names shared only during an alert and only for the affected area.

## 10. Open questions
- [ ] Download the GFM / Sentinel-1 flood extent covering Krnov (14–16 Sept 2024)
- [ ] Ask a mentor or civil-protection person: *"In the first hour of a flood warning, would you use this list?"*
- [ ] Legal basis for the grid operator to share the register with the mayor in an alert
- [ ] Size of the Czech vulnerable-customer register (ERÚ?)
- [ ] Medical source for battery or backup times
- [ ] Is Galileo EWSS operational? If not, it's roadmap
- [ ] Product name (shortlist: emLIFE, Golden Hour, FirstReach)
- [ ] Who owns the business model and the pitch

## 11. Decision log
- **27 Nov:** Lifeline chosen (Challenge #2). Runner-up was the Baltic combo, dropped over the switch of challenge and unconfirmed AIS/Sentinel-1 replay data.
- **28 Nov (grilling session):**
  - Czech market.
  - **Electricity-dependent people only.** Czech flood deaths don't show "nobody knew they were there", and the Valencia victims weren't on any register; a Czech named register does exist.
  - The **first hour**, triggered by EFAS, not the satellite map.
  - The user is the **mayor and flood commission**; fire and rescue receive the list.
  - Flow A + B + C.
  - **Krnov, Sept 2024** as the demo.
- **28 Nov (data check):** no CEMS activation for Czechia, so we use EFAS (confirmed for the Opava) plus GFM/Sentinel-1. The Krnov substation is confirmed in OSM.

## Deadline
Submission on TAIKAI **Sun 29 Nov 2026, 15:00 CET**, marked "completed". Freeze the build by Sunday 13:00.
