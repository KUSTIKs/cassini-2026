# Case study: HHS emPOWER (USA)

Researched 28 Nov 2026 from official HHS/ASPR sources (links at the bottom). Anything no source covered is marked **not found**. Nothing here is from general knowledge.

## What it is
A federal programme, started in **2013**, that uses Medicare insurance claims to find people who live at home and depend on electrically powered medical equipment or essential health services. The person never signs up: they're included automatically because of their insurance claims.

## Parties
| Party | Role |
|---|---|
| **ASPR** (HHS Administration for Strategic Preparedness and Response) | Runs the programme and approves requests for individual-level data |
| **CMS** (Centers for Medicare & Medicaid Services) | Partner; its Medicare claims are the source data |
| **State and territorial public health authorities** (plus New York City, Chicago, LA County and DC) | The only ones who can request the named list; they get a planning dataset every month |
| **"Authorized partners"** | Receive the data from the public health authority. Partners named in real cases: county health departments, the Army National Guard, a state Aging and Disability Services agency, a tribal emergency manager, medical equipment suppliers |
| **Public users** (emergency managers, hospitals, first responders, electricity companies, citizens) | Use the public map and data feed (counts only, no names) |
| **The patient** | No active role; included automatically from their claims |

## Who is included
Medicare members (Parts A/B or C) **who live at home** and have a recent claim for one of the following:
- **Equipment:** ventilator, BiPAP, oxygen concentrator, home dialysis machine, feeding tube, IV pump, suction pump, electric bed, electric wheelchair or scooter, heart-assist devices (LVAD, RVAD, BIVAD, total artificial heart)
- **Services:** dialysis at a centre, home oxygen tank delivery, home health care, hospice at home
- **"At-risk combinations":** people who use one of the services above *and* at least one piece of electrically powered equipment

What gets someone on the list is the **equipment or service**, not their age. Medicare mostly covers people aged 65+, so in practice the list is mostly older people. Excluded: people on private, military or Medicaid-only insurance, and people living in care facilities.

**Scale:** over **4.5 million** people (executive summary). The Connecticut health department page says 3.9 million, so the figure varies by source and year.

## Three tiers of data
| Tier | Content | Who gets it | How often |
|---|---|---|---|
| **Public map and data feed (REST service)** | Counts only, by state, county, metro area or ZIP code. The map also has natural-hazard layers in near real time (storms, hurricanes, floods, wildfires, earthquakes) | Anyone | Monthly |
| **Emergency Planning Dataset** | Counts per ZIP code, broken down by equipment type and service | State and territorial public health authorities | Sent monthly |
| **Emergency Response Outreach Dataset** (restricted) | "Limited individual-level" data: **names and addresses**, equipment type, the patient's healthcare providers and suppliers | Authorised public health authorities, through an official request | Only during an incident, emergency or disaster; limited to the "minimum necessary" |

There's also **emPOWER AI**, a tool that answers questions about the map data and the programme.

## Data fields in the named list
From the Missouri health department fact sheet (a state source, not HHS's own field list):
- name, address
- date of birth, age / age bracket, gender, race
- Medicare/Medicaid eligibility, poverty level of the area
- contact details of the home-health agency and of the equipment supplier
- most recent care facility the person stayed in
- which equipment or services they use

**No phone number.** Agencies have to find numbers themselves:
- Florida looked them up through its state alerting and notification system.
- New York City paid a vendor to find phone numbers, then sent automated voice and text messages before coastal storms (ASTHO brief).

## How fresh the data is (look-back periods)
- A person is included if they had a claim within a **look-back period**: **3, 13 or 36 months, or 5 years**, depending on how Medicare pays for that equipment or service (job aid).
- Examples: dialysis at a centre is 3 months, a ventilator 13 months, an oxygen concentrator 36 months.
- Data is about **one month old**: the Jan 2019 dataset was accurate as of 28 Dec 2018.
- The dataset only includes people who are alive and currently enrolled.

## Where the data comes from
**Insurers don't upload anything for emPOWER.** It's built from data Medicare already holds for billing.

| Type of Medicare | Who sends the data | How |
|---|---|---|
| **Traditional Medicare** (Parts A/B) | **Equipment suppliers and providers**, when billing | Electronic insurance claim in the standard HIPAA format (ANSI X12 837P), sent to the regional Medicare billing contractor. Equipment suppliers all go through one shared electronic gateway (CEDI) (CGS, Noridian) |
| **Medicare Advantage** (private plans, Part C) | **The private insurer** | Sends a record of each service ("encounter data") to CMS, stored in the CMS research data warehouse (CCW) (CMS methods doc; this source is not about emPOWER) |

```
supplier delivers oxygen concentrator → bills Medicare → claim stored in CMS databases
→ every month ASPR pulls the claims → counts per ZIP (sent to states) + named list (on request)
```
- The monthly planning dataset is sent to states by ASPR's regional administrators and emergency coordinators (job aid).
- **Not found:** which exact CMS databases emPOWER uses (the job aid says only "each CMS database", with the date each was pulled), and whether Medicare Advantage data comes from encounter records.

## Flow in a disaster
```
Disaster hits
  → State public health authority sends ASPR an official request for an area
  → ASPR reviews and approves it
  → Named list "transmitted securely" to the public health authority
  → Shared with authorised partners (county health, National Guard, EMS…)
  → Phone calls, door-to-door checks, voluntary evacuation, reconnecting people
    with their doctors and suppliers, and input to the order power is restored
```

### Detailed example: Missouri
**Turnaround: 3–4 hours.** The list can be requested before the event if the threat is imminent.
1. A local agency or healthcare coalition calls the state health department's emergency response centre. The local public health agency must be included, because it will receive the data.
2. The emergency response centre gathers the situation: event type and time, area, people affected, health facilities affected, a local contact.
3. The state emergency coordination office notifies the state emergency management agency and **phones HHS ASPR** to start.
4. It emails ASPR: a data request form and a secure-portal user form (no signatures), plus signed forms: a cover letter from the public health authority, a HIPAA privacy statement, the **CMS data use agreement (form R-0235)** and its emPOWER addendum.
5. A CMS data contractor sends login details for a secure portal (link by email, password by phone). Named state staff download the file.
6. The local public health agency signs the **state's own data use agreement** and receives the data.
7. Outreach is done together with local emergency management, EMS, fire and police. Power companies and local emergency management may also hold their own lists of people who registered with them.
8. **Within 30 days**, the state emails ASPR certifying the data was destroyed (a 30-day extension can be requested).

## Do they check on people?
- **Before the event: no.** Nobody confirms the person still lives at the address, still uses the device, or is away. Inclusion is just "had a claim in the look-back window", so the list can be out of date.
- **During the event: yes.** Calls and visits are the first and only check.
- **No process found for feeding results back** into the list; it's destroyed after the event.

## Who is prioritised?
- **No ranking.** HHS hands over the list unordered, and each state decides what to do with it.
- Age alone doesn't put anyone on the list. A claim for equipment or care does; being on Medicare (mostly people aged 65+) is just the precondition.
- The only triage found is **by response**: Florida called everyone and then followed up only those who said they had a health need.
- Broome County, NY, used the list to decide **which areas to restore power to first**: a ranking of areas, not people.

## Real cases (from the HHS fact sheet)
- **Florida, Hurricane Matthew (Oct 2016):** the health department and the state emergency management division picked out people in 7 counties, looked up phone numbers and placed "life safety calls" to **nearly 45,000 residents within 2 hours** (the Program Fact Sheet says "over 40,000"). They reached about **17,000**, found **169** who said they might have a health need, and passed them to county and local health officials for follow-up.
- **South Carolina, Hurricane Matthew:** mapped the whole list by census tract to place staging areas and shelters together with fire departments and FEMA search-and-rescue teams; after the storm, contacted 268 people about their recovery needs.
- **Los Angeles County:** requested the named list more than a dozen times (wildfires, mudslides, planned power shutoffs) (ASTHO brief).
- **Tennessee, wildfires:** the Army National Guard reached over 70 people on oxygen.
- **Broome County, NY:** 58 people without power were contacted, and the list informed decisions on which areas to restore first.
- **Wyoming / Goshen County, blizzards:** phone and in-person welfare checks.
- **Nevada, long floods:** outreach together with the Aging and Disability Services agency, a tribal emergency manager and medical equipment suppliers.
- **New Orleans:** chose emergency shelter locations; outreach during hurricanes and infrastructure failures.
- **Los Angeles County:** planning for over 100,000 at-risk people (wildfires, power cuts, floods, mudslides).

## Limitations
- **Medicare only.** It leaves out people on private, military or Medicaid-only insurance, and people living in care facilities (Connecticut health department). A 2018 pilot helps states build similar datasets from their own Medicaid and CHIP data.
- Only people with a recent claim are included.
- **It's a list plus a map, not a decision tool.** HHS hands the list over; each state has to work out on its own who to reach first and how to get there.

## Not found
- The exact legal basis. It's probably the HIPAA rule that allows disclosure to public health authorities, 45 CFR 164.512(b); the Missouri process includes a "HIPAA privacy statement", but no source names the rule.
- HHS's own official list of data fields (the list above comes from Missouri).
- Whether electricity companies may receive the named data.
- A script for the outreach calls, or what happens when a person doesn't answer.

## What it means for Lifeline
- emPOWER proves the model works at scale: a named list during a disaster leads to tens of thousands of people contacted.
- It stops at the list. Deciding who to reach first and how to get there (passable routes) is left to each state, and that's the gap Lifeline fills.
- Its public map shows hazards next to **counts**, never next to **people**. Lifeline puts the Copernicus hazard extent over individual (authorised) records.
- **Nobody checks the list before the event, and it has no phone numbers.** A status check (home or away, battery or oxygen time) before or at the start of an event is a gap Lifeline could fill, and it would improve the priority list.
- **It works because the US has one central payer.** Europe has no equivalent, so Lifeline shouldn't try to be the central database: each holder keeps its own list, and Lifeline matches them against the hazard zone only once an emergency is declared.

## Sources
- [emPOWER executive summary (PDF)](https://empowerprogram.hhs.gov/Program-Executive-Summary.pdf)
- [emPOWER data quick reference (PDF)](https://empowerprogram.hhs.gov/Quick-Data-Reference-Guide.pdf)
- emPOWER programme fact sheet (PDF, linked from the outreach dataset page)
- [Emergency Response Outreach Dataset](https://empowerprogram.hhs.gov/outreach-individual-dataset.html)
- [emPOWER data feed (REST)](https://empowerprogram.hhs.gov/empower-rest.html)
- [Connecticut health department on emPOWER](https://portal.ct.gov/dph/public-health-preparedness/access-and-functional-needs/united-states-health-and-human-services-empower-datasets)
- [ASPR TRACIE: Emergency Response Outreach Dataset](https://asprtracie.hhs.gov/technical-resources/resource/13314/hhs-empower-emncy-response-outreach-dataset)
- [Missouri health department: emPOWER request fact sheet (PDF)](https://content.govdelivery.com/attachments/MODHSS/2026/10/01/file_attachments/3802039/MO%20DHSS%20emPOWER%20FactSheet%20for%20Locals%208.2026.pdf)
- [HHS: Hurricane Matthew in Florida and South Carolina (PDF)](https://empowerprogram.hhs.gov/Hurricane-Matthew-Florida-South-Carolina.pdf)
- [ASTHO: Leveraging the HHS emPOWER Program (PDF, Nov 2021)](https://www.astho.org/globalassets/brief/leveraging-the-hhs-empower-program-to-enhance-power-outage-planning.pdf)
- [emPOWER de-identified dataset job aid (PDF)](https://empowerprogram.hhs.gov/De-Identified-Dataset-Job-Aid.pdf)
- [CGS: Medicare electronic claims](https://www.cgsmedicare.com/jb/claims/edi.html)
- [Noridian: DME electronic claim submission (CEDI)](https://med.noridianmedicare.com/web/jadme/claims-appeals/cedi)
- [CMS: Medicare Advantage methods, encounter data (PDF)](https://data.cms.gov/sites/default/files/2026-08/e60f8a40-37ae-4e28-b0ec-314666f86964/MA_GV_PUF_Methods_Updated_08172026.pdf)
