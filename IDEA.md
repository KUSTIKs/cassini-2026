# Lifeline (working name)

> **Short version.** The final, fully sourced definition with personas, KPIs and the demo data check is in `PROJECT.md`. If the two disagree, `PROJECT.md` wins.

**One line:** Lifeline warns a mayor **before the power goes** which people on home ventilators and oxygen will lose power, ranks them by **hours of battery left**, and gives firefighters a **route around the flooded roads** to reach them.

**Challenge:** #2, Space-enabled crisis response and civil resilience. **Market:** Czech Republic first. **Demo:** Krnov, September 2024 floods (replay).

Decisions behind this (28 Nov grilling session): Czech market only; **electricity-dependent people only** (not all elderly); **first hour**, meaning before the outage and not after the satellite map; main user is the **mayor and town flood commission**.

---

## Facts nobody can argue with

1. **Sept 2024, Czech floods: about 260,000 households lost power at the peak.** The flooded **Krnov and Bohumín substations** were the main thing holding back repairs. **About 30,000 were still without power 4 days later**, and **a few hundred after 11 days**. (Czech Radio, ČEZ situation report 16 Sept, oEnergetice)
2. **Czechia already has a named list of these people.** Since **1 Jan 2024** anyone whose life depends on equipment that needs constant power (home ventilation, oxygen) can register as a **"vulnerable customer"**. The grid operator keeps the register **with name, contacts and address**. (Energy Act, LEX OZE II; ČEZ)
3. **The list is only used to send letters about planned outages.** It isn't linked to any forecast, and nobody hands it to the mayor or the fire service in a flood.
4. **The state tells the mayor to look after them, without giving them the list.** The fire service's 2025 flood checklist for towns says one line: *"pay increased attention to people with specific needs."* The town's crisis card counts people but holds **no names**. (HZS ČR)
5. **4 July 2025: one fallen power line blacked out about 1 million Czech customers**, including much of Prague. (Radio Prague, oEnergetice)
6. **People die or nearly die when the battery runs out.**
   - **Portugal, April 2025 blackout:** a 77-year-old on a home ventilator died when her battery ran out (under investigation).
   - **France, Storm Ciarán:** a ventilator patient went **5 days without power** because she wasn't on the grid operator's list.
7. **Even the best system in the world is too slow for the first hour.** The US emPOWER programme covers **4.5 million** people, but a named list takes **3–4 hours** to get (Missouri procedure). In Florida, about 45,000 people were robocalled to find **169** who needed help.
8. **The rule everywhere:** the grid operator's duty is **"to inform, not to keep the power on"** (French health agency). Nobody is assigned to actually reach the person.

**The gap in one sentence:** *the grid company knows who depends on power, the mayor has the people, and Copernicus knows where the water is going, but nobody connects the three.*

---

## How it works (plain version)

| When | What happens | EU space data |
|---|---|---|
| **Days to hours before** | The Copernicus flood forecast shows water heading for a substation. Lifeline lists every registered vulnerable customer fed by that substation. | **EFAS** (Copernicus flood forecast, up to 5 days ahead) |
| **First hour** | The mayor gets: *"In ~12 h, 14 people on ventilators or oxygen will likely lose power. First: Ms N., ventilator, ~3 h battery, 2nd floor, lives alone."* They call, send help, or evacuate before the outage. | EFAS + flood-zone maps |
| **Power is out** | Firefighters get each address, what to bring (generator, spare oxygen bottle, ambulance) and a route that avoids flooded roads. | **Sentinel-1 flood map (Copernicus GFM)**; **Galileo** positioning |
| **After** | Report: who was reached, when, and who was missed. | n/a |

**Lifeline doesn't detect floods and doesn't replace the register.** It joins three things that already exist.

---

## What each party gets

| Party | Today | With Lifeline |
|---|---|---|
| **Person on a ventilator or oxygen** | A letter about *planned* outages. In a flood: nothing, unless a neighbour remembers them. | Called **before** the power goes; help arrives before the battery runs out. |
| **Family or carer** | Finds out from the news. | Notified together with the person; can confirm "she's with us" so rescuers skip that address. |
| **Mayor and flood commission** | Legally responsible for "people with specific needs", but has no names. | A ranked list with reasons, ready the moment the warning comes in. A record that the duty was carried out. |
| **Fire and rescue service (HZS) and ambulance** | Learn about a ventilator patient when a family calls 112. | Addresses, what to bring, and a passable route, **before** it becomes a 112 emergency. |
| **Grid operator (ČEZ Distribuce, EG.D, PREdistribuce)** | Keeps the register for letters; flooded substations are repaired in engineering order. | The register becomes useful in an emergency; can see **which substation has the most dependent people** behind it (emPOWER did this in Broome County, NY). |
| **Oxygen and medical equipment suppliers** | Get calls from desperate patients. | Know in advance who needs a spare bottle or battery delivered. |
| **Region and state** | No data on how many vulnerable people a flood affected. | Numbers per event, to plan and to report. |

---

## KPIs for government

What a mayor or region can measure, today versus with Lifeline. The targets are our proposal; we still have to validate them with real users.

| KPI | Today | Lifeline target |
|---|---|---|
| Time from flood warning to a named, ranked list | No list. In the US, 3–4 h (emPOWER) | **Under 5 minutes** |
| Registered vulnerable people contacted **before** losing power | Not measured | **100 % attempted**, all results logged |
| People whose battery ran out before help arrived | Not measured | **0**, tracked per event |
| Emergency 112 calls from electricity-dependent people | Not measured | Down: they get help before it becomes an emergency |
| Proof the mayor's duty ("people with specific needs") was carried out | One line on a checklist | Audit log: who was called, when, by whom |

---

## Non-technical requirements

1. **Legal access to the list.** The grid operator keeps the register. Lifeline only receives the names for the affected area, only once a flood alert is declared, and only the minimum needed: address, device, contact, carer. *Legal basis is unverified:* our guess is GDPR "vital interests" plus the Czech crisis laws, and it needs checking.
2. **Works for a mayor of a 500-person village.** No training needed; one screen, in Czech; the first useful answer within 2 minutes of opening it.
3. **Works when the power and mobile network are down.** The list can be printed or exported, and it's ready **before** the outage.
4. **Every rank is explainable.** "First because: ventilator, ~3 h battery, lives alone." No black-box scoring.
5. **Nobody gets lost from the list.** Each person ends as "reached", "confirmed away" or "not reached", with no blanks.
6. **Data protection.**
   - Data stays in the EU and is deleted after the event (emPOWER's Missouri rule is 30 days).
   - Every view is logged.
   - Access is by role: the mayor, fire service and suppliers each see only what they need.
7. **Fits existing procedures.** It plugs into the fire service flood checklist and the town crisis card, and adds no new process.
8. **Demo uses made-up people only** (rules §8.8). Substations, roads and flood data are real.

---

## Versus what exists

| | Has names | Linked to a hazard forecast | Ranks who goes first | Routes to the person | Time to list |
|---|---|---|---|---|---|
| **US emPOWER** | Yes (on request) | Map of counts only | No | No | 3–4 h |
| **France: PHRV list** | Yes (~4,000) | No | No | No | Unplanned cuts: no warning |
| **France: town-hall register** | Yes (1–5 % of eligible) | No | No | No | Sent to the prefect by post or secure email |
| **Czech vulnerable-customer register** | Yes | No | No | No | Used for letters only |
| **Lifeline** | Uses the existing register | **Yes (EFAS + Sentinel-1)** | **Yes (hours of battery)** | **Yes** | **Minutes** |

---

## Still unverified (don't pitch as fact)
- How many people are on the Czech vulnerable-customer register (an ERÚ report may say).
- Whether a grid operator may legally hand the register to a mayor in an emergency.
- Battery times (ventilator 2–4 h, etc.) are general knowledge and need a medical source.
- Rough estimate of ~150,000 electricity-dependent people in Czechia, scaled from the US. **Upper bound, not a count.**
- ~~Krnov data~~ checked 28 Nov: EFAS notification for the Opava confirmed (60 h lead time); **no CEMS activation for Czechia**, so we use GFM/Sentinel-1; Krnov substation is in OSM. See `PROJECT.md` §5.
- Whether Galileo's emergency warning service (EWSS) is operational.
- The product name (shortlist: emLIFE, Golden Hour, FirstReach).

Detailed sources: `context/08-case-empower.md`, `context/09-case-france.md`, and the source links in `PROJECT.md`.
