# Data used by the AI

The **Ask the data** chat (`app/api/ask/route.ts`) and the MCP server (`app/api/mcp`, tools in `lib/peace-mcp.ts`) answer only from the data below. The AI is Claude (`claude-opus-5-5`). It is told to take every number from a tool and to say plainly when the data can't answer a question.

## Datasets

| Dataset | What it covers | Where the AI reads it |
|---|---|---|
| **PA-X Peace Agreements Database v10** (PeaceRep, University of Edinburgh) | 2,257 peace agreements, 1990–2025: stage, region, country, conflict type, parties, signatories and 279 coded columns. `mentions_women` = any provision on women, girls or gender (`GeWom > 0`). | Bundled JSON `lib/peace-mcp-data.json`, plus the Supabase table `pax_agreements` |
| **PADD: Peace Agreement Delegate Dataset 1.0** (Good, APSR 2025) | People named in 116 comprehensive agreements (1990–2020), with role and gender. Gender is assumed from names. | `lib/peace-mcp-data.json`, plus `padd_agreements` (116 rows) and `padd_delegates` (2,301 people) |
| **CFR Women's Participation in Peace Processes** (Council on Foreign Relations) | Women's share of negotiators, mediators and signatories on 73 process pages (read 22 Nov 2026). 47 agreements are matched to PA-X. | `lib/peace-mcp-data.json`, plus `cfr_processes` |
| **UNDP Human Development Report 2025** | Country gender indicators for 195 countries, 1990–2023: GII, GDI, women's share of parliament seats, labour force participation, secondary education, maternal mortality, adolescent births, and life expectancy, schooling, income and HDI by sex. | `lib/countries.json`, through `lib/gender-indicators.ts` |
| **Project findings and data issues** | What parts 1, 2a and 2b found, and known data problems. | `lib/peace-mcp.ts` (`FINDINGS`) and `lib/project-log.ts` (`issues`) |
| **Official data sources list** | Checked links to outside sources the AI may suggest when data is missing (UCDP, Peace Accords Matrix, IPU Parline, UN Women and others). These are suggestions only, not data. | `OFFICIAL_SOURCES` in `lib/peace-mcp.ts` |

Source CSVs for the three peace datasets are in `public/peace-agreements/`. They are the source of truth and the public downloads.

## AI tools

| Tool | Reads | Use |
|---|---|---|
| `search`, `fetch` | PA-X (+ PADD and CFR detail) | Find one agreement by name or id |
| `find_agreements` | PA-X | Filter by country, region, stage, years, mentions women, UN signature |
| `gender_provision_rates` | PA-X (+ PADD role group) | Share that mention women, grouped by stage, region, decade and more |
| `women_at_the_table` | PADD + CFR | Women negotiators and signatories for an agreement or country |
| `country_gender_indicators` | UNDP HDR 2025 | Country context, e.g. women in parliament in the signing year |
| `project_findings`, `data_issues` | Project log | Conclusions and caveats |
| `official_data_sources` | Source list | Where to find data the project doesn't have |
| `report_data_gap` | (logging only) | Marks an answer as partial or data not sufficient |
| `query_database` | Supabase tables (chat only, not MCP) | Read-only SQL for questions the fixed tools can't answer |

## How it's connected

```
public/peace-agreements/*.csv ──scripts/build_peace_mcp_data.py──> lib/peace-mcp-data.json ──> fixed tools
            │
            └──scripts/load_peace_data.py──> Supabase tables ──query_peace_data()──> query_database
lib/countries.json (UNDP HDR) ──lib/gender-indicators.ts──> country_gender_indicators
```

- **SQL safety.** The Supabase tables have no public access. `query_database` calls `query_peace_data(sql)`, which runs as the read-only role `peace_reader`. It accepts one SELECT, returns at most 200 rows and stops after 5 seconds. Schema: `supabase/migrations/20261122000300_peace_data_tables.sql`.
- **Updating the data.** Replace a CSV, then run both scripts: `scripts/build_peace_mcp_data.py` for the JSON and `../DataScience/.venv/bin/python scripts/load_peace_data.py` for Supabase.
- **Logging.** Every question, answer, status (answered, partial, insufficient_data, refused, error), tools used and data gap goes to `ask_data_log`. They are listed publicly at `/ask-history`, without visitor IDs. Each answer there has a "Continue this chat" button (`lib/ask-data-events.ts`), which opens the chat with that question and answer as the start of a new conversation.

See [data-connections.md](data-connections.md) for how the datasets join.

## Public guide

The "How to use the AI" section of `/project-log#ask-ai` (data in `askGuide`, `lib/project-log.ts`) tells visitors how to ask, gives example questions with the source each one uses, and lists the sources above. Update it when a source or tool changes.
