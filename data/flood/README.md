# Flood data (checked 28 Nov 2026)

| File | What | Source and licence | Re-create |
|---|---|---|---|
| `krnov-q100.geojson` | Official designated **Q100 (100-year) flood zones** around Krnov: the Opava, the Opavice and the Zátoráček (whole river reaches, simplified to ~2 m) | VÚV TGM, ISVS-Voda "Záplavová území", layer `ZaplavUzemi_Q100` ([ArcGIS service](https://ags.vuv.cz/arcgis/rest/services/isvs_voda/isvs_voda/MapServer/13)). Open Data of the Czech Republic, **CC BY 4.0** (catalogue record `CZ-VUV-MD-ZaplavUzemi`, revised 31 Aug 2025) | `pnpm --filter @firstreach/api data:flood-zones` |
| `opava-gfm-2024-09-15.geojson` | **Observed flood extent, 15 Sept 2024 ~05:00 UTC**, Krnov to Opava, from Sentinel-1 radar | Copernicus EMS **Global Flood Monitoring** (GFM), `ensemble_flood_extent`, read from EODC's public STAC (`https://stac.eodc.eu/api/v1`, collection `GFM`). Copernicus data: free, full and open; attribution © European Union, Copernicus Emergency Management Service | `pnpm --filter @firstreach/api data:gfm 2024-09-15` |

## What the data says
- **Both Krnov substations (110/22 kV "Krnov", OSM way 55375417, and the 22 kV one next to it, way 55375414) lie inside the Opava's Q100 zone.** That matches the 2024 reports that the flooded Krnov substation slowed restoration. One 22 kV/400 V substation north of the town (way 800727970) lies in the Opavice's Q100 zone.
- 14 of the 30 synthetic people in `data/demo/krnov-register.csv` live inside a Q100 zone themselves.
- **GFM saw 0.74 km² of flooding on 15 Sept, in 7 areas; 6 of the 7 lie inside the Opava's Q100 zone.** The observation agrees with the official prediction. Most of it is near the city of Opava; around Krnov it saw ~0.03 km².

## Limits (say these in the pitch)
- **Sentinel-1 cannot see water inside towns.** GFM's exclusion mask covers ~80% of Krnov's centre on 15 Sept (radar shadow and layover between buildings). So the satellite **cannot confirm the Krnov substation flooded**; it confirms water in the open floodplain and on roads between towns.
- Coverage: the 13, 16 and 17 Sept passes don't cover Krnov (16–17 only clip the eastern edge of the area). 15 Sept is the only useful observation around the peak. 18 Sept shows ~0.09 km².
- The Q100 zone is the **predicted** extent of a 100-year flood; the Sept 2024 event on the Opava was larger in places. It's the best official answer to "where does this river flood", not a record of what happened.
