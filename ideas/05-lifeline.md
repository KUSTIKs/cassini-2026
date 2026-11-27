# Lifeline: "Europe's emPOWER"

**One-liner:** when Copernicus detects a flood, fire or blackout zone, instantly show which vulnerable people (home oxygen, dialysis, limited mobility, care homes) are inside it, with a prioritised rescue list.
**Challenge:** #2, wording "enhance the safety and resilience of civilian infrastructure", "support routes for goods and people using Galileo"
**Status:** shortlisted (the evidence comes from research, not X)

## Why (evidence)
- **Valencia floods 2024:** about half of the ~224 dead were **70+**; many were older people or people with reduced mobility who **drowned in their own homes**, including care-home residents ([Euronews](https://www.euronews.com/my-europe/2024/11/15/almost-half-of-spains-flood-victims-were-aged-70-or-over-data-shows), [PreventionWeb](https://www.preventionweb.net/news/valencia-floods-one-year-what-have-we-learned-and-how-can-we-prevent-similar-tragedies-future), [Guardian via inkl](https://inkl.com/news/almost-half-of-spain-s-flood-victims-were-over-70-figures-show)).
- **Ukraine:** home ventilator and oxygen patients rationed oxygen during blackouts; authorities gave no official comment on patients who depend on electricity ([Kyiv Post](https://www.kyivpost.com/post/11474)); hospitals hit by outages ([PHR report](https://phr.org/wp-content/uploads/2024/12/REPORT-PHR-TRUTHHOUNDS-UKRAINE-Health-Care-in-the-Dark-2024_Updated-12-20-24.pdf), [Ukraine Ministry of Health 2026](https://moz.gov.ua/en/minister-of-health-inspects-how-kyiv-medical-facilities-operate-amid-power-outages)).
- **US precedent:** the HHS **emPOWER Map** tracks 3M+ Medicare patients who depend on electricity-powered medical equipment, combined with live hazards ([about](https://empowerprogram.hhs.gov/about-empowermap.html), [job aid](https://empowerprogram.hhs.gov/Map-Job-Aid.pdf)). Plus a dialysis emergency app in 13 US states ([ASPR](https://www.aspr.gov/readiness-response/healthcare-readiness/healthcare-readiness-action/stories-field/hpp-supported-app-now-provides-lifesaving)).
- **EU equivalent: none found.**

## Who uses it
| User | Who exactly | What they need |
|---|---|---|
| **Primary: civil protection duty officer** | Regional or municipal emergency coordination centre (e.g. Valencia 112, a German Kreis crisis team) | "The flood is here. Who can't get out alone, and in what order do we go?" |
| Municipal social services | Elderly care and disability services | Keep the list of people who need help (with consent); call them first |
| Home-care and care-home operators | Nurses' dispatch, care-home managers | "Which of our clients and homes are in the zone? Evacuate or not?" |
| Dialysis and oxygen providers | Clinics, home-oxygen suppliers | "Which patients can't reach the clinic, and who needs a battery or oxygen delivered?" |

**Buyer:** regions and municipalities (civil protection budgets), care-home chains, home-care companies.

## User flow (simplified)
```
BEFORE (setup)
1. Social services / care providers register people WITH CONSENT:
   address, need (oxygen / dialysis / wheelchair / bedridden), contact, carer.
   Care homes, clinics and hospitals are imported automatically.

DURING
2. Copernicus flood map (GFM) / fire (EFFIS) / forecast (EFAS) arrives
   → zone drawn on map (or the duty officer draws a blackout area).
3. Instantly: "342 vulnerable people in zone: 41 dialysis, 18 oxygen.
               3 care homes. 2 dialysis centres cut off."
4. Priority list (most urgent first), each with a passable route
   (flooded roads avoided) → assign to rescue teams → status updates.
5. Alerts to the people themselves and their carers (SMS / Galileo EWSS).

AFTER
6. Report: who was reached, when; gaps for next time.
```

## Demo "wow moment"
Replay Valencia, 29 Oct 2024: water spreads across the map, care homes and person dots turn red one by one, and the rescue list builds itself: "First: 84, home oxygen, battery ~3h, ground floor."

## Space data (essential)
| Source | Used for |
|---|---|
| **Copernicus GFM** (Global Flood Monitoring), **EFAS** forecasts, **EFFIS** fires, **CEMS Rapid Mapping** | Where the danger is, now and next |
| Sentinel-1 | Flood extent through cloud |
| **Galileo** (routing; **EWSS** alerts) | Routes for rescuers; alerts even when mobile networks are down |

## Competition
| Who | What | Gap |
|---|---|---|
| HHS emPOWER (US gov) | Aggregate counts plus hazards; individual data for responders | US only, Medicare only |
| Everbridge, Rave Mobile Safety, Smart911 (US) | Alerting and self-registration | Not satellite-driven; US focus |
| Google (Flood Hub, alerts) | Public alerts | Doesn't touch health data |
| Hackathon | SatMed (emergency hotspots), RESQNET, CrisisBrief | None focus on vulnerable people |

## Risks
- **Health data and GDPR:** consent-based registration, data kept in the EU, minimal sharing only during an emergency. Demo with made-up people.
- Less "war" than the Baltic ideas, but blackouts from energy attacks (Ukraine) fit the theme.

## Scoring self-check
| Relevance | Innovativeness and business | Team fit |
|---|---|---|
| 4–5 | 5 | 5 |
