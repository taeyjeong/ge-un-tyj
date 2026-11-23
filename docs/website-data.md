# Data on the website

Every dataset the site shows, by where it comes from. **Built in** means the data is stored in the repo and needs no network. **Live** means it's fetched from a public API when the page loads, then cached.

## Built in

| Dataset | Publisher | Pages | File(s) |
|---|---|---|---|
| Human Development Report 2025: HDI, GII, GDI, IHDI, PHDI and their inputs (40 measures, 195 countries, 1990–2023) | UNDP | `/` (GII homepage), `/indices/hdi`, `/indices/gdi`, `/indices/ihdi`, `/indices/phdi`, `/lab/hdr`, `/data-dictionary` | `lib/countries.json`, `lib/dictionary.json`, [DATA_DICTIONARY.md](../DATA_DICTIONARY.md) |
| Multidimensional Poverty Index 2026 (latest survey per country) | UNDP / OPHI | `/indices/mpi` | `lib/index-snapshots.json`, `public/index-sources/mpi-2026.xlsx` |
| Global Hunger Index 2026 | Welthungerhilfe, Concern Worldwide, IFHV | `/indices/ghi` | `lib/index-snapshots.json`, `public/index-sources/ghi-2026.xlsx` |
| Environmental Performance Index 2026 | Yale / Columbia | `/indices/epi` | `lib/index-snapshots.json`, `lib/epi-methods.json`, `public/index-sources/epi-*.xlsx` |
| Financial Development Index (to 2020) | IMF | `/indices/fdi` | `lib/fdi-data.json`, `lib/fdi-source.json`, `lib/fdi-reconstruction.json` |
| Food Consumption Score (method; households you enter) | World Food Programme | `/indices/fcs` | `lib/fcs-model.ts` |
| PA-X Peace Agreements Database v10 | PeaceRep, University of Edinburgh | `/peace-agreements` (part 1 and all parts) | `public/peace-agreements/gender-provisions-in-peace-agreements.csv` |
| PADD: Peace Agreement Delegate Dataset 1.0 | Elizabeth Good, APSR 2025 | `/peace-agreements#part-2a` | `public/peace-agreements/padd-agreement-level.csv`, `padd-delegate-level.csv` |
| CFR Women's Participation in Peace Processes | Council on Foreign Relations | `/peace-agreements#part-2b` | `public/peace-agreements/cfr-womens-participation-73-processes.csv`, `cfr-to-pax-match.csv` |
| Country names, regions and groups | UN M49, UNDP | Every country picker | `lib/countries.json`, `lib/geography.json`, `lib/sdg-geographies.json`, `lib/oecd.ts` |

The three peace datasets are also copied into Supabase for the AI. See [ai-data.md](ai-data.md).

## Live

| Dataset | Publisher | Pages | Measures |
|---|---|---|---|
| World Development Indicators | World Bank | `/topics`, `/topics/<topic>` | 11 topics: climate, poverty, food, health, education, water, energy, economy, cities, peace & institutions, conflict & displacement (codes in `lib/topics.json`) |
| SDG Global Database | UN Statistics Division | `/sdg` | SDG 5.4.1, time spent on unpaid domestic and care work (`SL_DOM_TSPD`) |
| UNICEF Data Warehouse (SDMX) | UNICEF | `/unicef` | Women married before 18 and before 15 (`PT_F_20-24_MRD_U18`, `PT_F_20-24_MRD_U15`) |
| ILOSTAT | International Labour Organization | `/employment` | Hourly earnings by sex, unemployment by sex, women in senior and middle management |

## Site data (Supabase)

These hold visitors' content, not research data: `notes` (signed-in notebook), `community_messages` (public chat), `ask_data_log` (AI questions and answers, shown at `/ask-history`). See [supabase/README.md](../supabase/README.md).

## Default countries

Each section opens with three countries picked from its own data: the biggest change plus the two worst today. `scripts/compute_default_countries.py` writes them to `lib/default-countries.json`.
