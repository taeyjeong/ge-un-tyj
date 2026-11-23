# How the datasets connect (as of 22 Nov 2026)

Which datasets are joined to each other right now, on what key, and how well they match. Update this file when a new join is added.

## Connected

| From | To | Key | Match | Where it's used |
|---|---|---|---|---|
| PA-X | PADD | `AgtId` = `agt_id` | All 116 PADD agreements match a PA-X agreement | Part 2a, AI tools, SQL (`padd_agreements.agt_id`, `padd_delegates.agt_id`) |
| PA-X | CFR | Hand-made match file `cfr-to-pax-match.csv` (CFR `slug` → PA-X `AgtId`) | 50 of 73 CFR pages map to 47 PA-X agreements (3 pages repeat an agreement). The other 23 are ongoing talks or have no matching agreement. | Part 2b, AI tools, SQL (`cfr_processes.pax_agt_id`) |
| PADD + CFR | PA-X | Joined view `women_at_the_table` | Agreements with PADD and/or CFR data | SQL |
| PA-X | UNDP HDR 2025 | PA-X `Loc1ISO` = HDR ISO3 code (or country name) | 2,217 of 2,257 agreements have an ISO3 code, and all 87 codes are in the HDR data. 40 agreements (mostly inter-state or regional) have none. HDR ends in 2023, so the 124 agreements signed in 2024–2025 can only use the latest values. | AI only: the AI looks up the country with `country_gender_indicators`. It isn't a SQL join and isn't on the website. |
| HDR indices (HDI, GII, GDI, IHDI, PHDI) | Each other | ISO3, year | Same file (`lib/countries.json`) | Index pages, `/lab/hdr` |
| HDR, MPI, GHI, EPI, FDI, World Bank, UNICEF, SDG, ILO | The country picker | ISO3 (SDG via UN M49 codes in `lib/sdg-geographies.json`) | Each source covers its own set of countries | The selected countries carry from page to page. The data itself stays separate. |

## Not connected yet

- **Peace data ↔ live sources (World Bank, ILO, UNICEF, SDG).** No join. The keys exist (ISO3 and year), so the World Bank conflict topic (battle deaths, displacement) could be linked to PA-X by country and year.
- **Peace data ↔ HDR in SQL.** The HDR data isn't in Supabase, so SQL can't join agreements to country gender indicators in one query. The AI does it in two steps instead.
- **CFR ↔ PADD directly.** They only connect through PA-X. The two overlap on a small number of agreements, and they measure different things: CFR counts presence in the process, PADD counts names in the agreement text.
- **MPI, GHI, EPI, FDI, FCS ↔ anything.** These are shown on their own pages only. FCS is a household calculator, not country data.
- **Website pages ↔ AI.** The chat can't see the indices, topics, UNICEF, SDG or ILO pages' data, apart from the HDR gender indicators listed above.

## Keys to use when adding a join

- Countries: ISO3 (`country_iso3` in SQL, `code` in `lib/countries.json`). PA-X country names don't always match HDR names, so use ISO3. `lib/gender-indicators.ts` has aliases for common name differences.
- Agreements: PA-X `AgtId`.
- Years: PA-X signing year (`year`). HDR is 1990–2023, PADD 1990–2020 and PA-X 1990–2025.
