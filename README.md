# Gender equality · UN data

## Current entry points

- `/`: the **GII homepage**, with country comparisons, components, staged calculations, what-if controls, the diagram and full equation. Japan, Korea and USA remain the defaults.
- `/indices`: composite indices and scores grouped by subject. Individual pages use `/indices/<id>`; `/indices/gii` redirects to the homepage with country selection preserved.
- `/data`: individual indicators and datasets grouped by topic, with links to the existing API and World Bank explorers.
- `/lab`: a separate workspace for source exploration and views whose presentation is still being refined.
- `/lab/hdr`: the full original 40-measure HDR explorer.

Every page shares the **Indices · Data · Data lab** navigation. GII remains the homepage and appears under **Indices → Gender**; the site logo links home. Indices are grouped into Human development, Gender, Poverty & food, Finance and Environment. Data are grouped into Gender & work, Climate & environment, Poverty & food, Health & education, Water & energy, Economy & cities, and Peace & conflict. Menus open on click, support keyboard navigation/Escape/outside-click dismissal, and become accordion sections inside a collapsible mobile menu. The active index or dataset is identified in the navigation. Country selections, including an explicitly empty selection, are retained in links; each destination applies its own country coverage. FCS household selection remains separate from the navigation's country context.

Index pages use **Compare → Calculate → Experiment → Equation & sources** section links instead of a row containing every index. Calculations and data sources are unchanged by this navigation restructure.

An interactive explorer for the **UNDP Human Development Report 2025**. Compare countries across human development, gender equality, inequality and environmental pressures, then inspect how HDI and GII are calculated.

- Website: https://ge-un-tyj.vercel.app
- Repository: https://github.com/taeyjeong/ge-un-tyj
- Stack: Next.js 16 App Router, React 19, TypeScript and CSS; SVG charts without an external charting library.

The HDR explorer reads bundled public data; the employment page queries ILOSTAT through a cached Next.js server endpoint. The public data explorers require no API key. ILO queries require network access. The optional personal notebook uses a dedicated Supabase database and public connection environment variables for signed-in syncing. This is an independent project, not affiliated with UNDP or the United Nations. The source tree may include local work that has not yet been deployed.

## Run locally

Use Node.js 24 and npm. Data preparation and validation also require Python 3; the Python scripts use only the standard library.

```sh
npm ci
npm run dev
```

Open http://localhost:3000.

For a production build and local server:

```sh
npm run build
npm start
```

Next.js generates route types during development/build. Run `npm run typecheck` after an initial build or development-server start.

## Features

- Compare any of **40 numeric measures** across **195 countries and territories**.
- Search countries, view flags, and keep selected countries at the top of both lists.
- Select all countries or combine selections by UNDP developing region, human development group and UN M49 geographical region. Country-filter facets intersect; **Select matching** adds the matches to existing selections.
- Choose an indicator, year range, line/bar chart and vertical-axis baseline in the graph popup.
- Draw one point per available annual observation. Missing observations remain gaps.
- Hover for details; click a point or bar to pin its country/year and fade other countries to 12% opacity. Clicking another point replaces the pin; clicking elsewhere dismisses it. The card stays open while being read or scrolled.
- Inspect the underlying factors for HDI, GDI and GII in chart tooltips.
- Maximize the graph. Bars show each country’s latest available observation within the selected range; observation years can differ.
- Preview latest values, one measure across all selected years, or all 40 measures for one year. Download the current table as CSV.
- Switch between **HDI / GII calculation tabs**, each with country/year selectors, numeric steps, a reported-score comparison and complete mathematical formulas. HDI is initially selected. Switching tabs preserves each tab’s controls; changing the graph’s end year resets their year to that value.
- Read the data dictionary at `/data-dictionary` or in [DATA_DICTIONARY.md](DATA_DICTIONARY.md).

### Chart keyboard controls

Focus the chart, then use:

| Key | Action |
| --- | --- |
| Left / right | Previous / next available year in a line chart |
| Up / down | Previous / next country |
| Home / End | First / last available observation in a line chart |
| Enter / Space | Pin the active point |
| Escape | Dismiss details; another press can close the expanded view |

Navigation dropdowns support Tab, arrow keys, Home/End and Escape. Index pages provide direct links to Compare, Calculate, Experiment and Equation & sources.

## Data sources and preparation

| File | Role |
| --- | --- |
| `public/HDR25_Composite_indices_complete_time_series.csv` | Unmodified supplied source; Windows-1252 encoding; 206 rows and 1,112 columns. |
| `lib/countries.json` | Derived chart/model data: 195 country/territory rows, 40 numeric measure families and 34 year slots per measure. |
| `lib/dictionary.json` | Definitions of the source’s 44 column families: four identifiers and 40 numeric measures. |
| `lib/geography.json` | Saved UN M49 classification and ISO alpha-2 flag-code mapping. |
| `public/HDR25_with_geographical_regions.csv` | UTF-8 CSV with BOM; preserves all original cell values and adds `geographical_region`, for 1,113 columns. |
| `public/gii-diagram.png` | Diagram downloaded from UNDP’s GII overview page. |

Most series cover **1990–2023**; inequality-adjusted series cover **2010–2023**. HDI rank, GII rank, GDI group and the HDI/PHDI rank difference are 2023 snapshots. An unavailable year slot is `null`, not zero.

The original CSV has 195 countries/territories plus 11 aggregate rows: four development groups, six UNDP developing regions and World. Aggregate rows remain in the downloadable CSVs but are excluded from the interactive country list and calculation models.

Geographical regions use the most specific UN M49 intermediate region where available, otherwise the subregion—for example, Central America, Eastern Asia and Western Europe. All 195 countries have a classification. This enrichment is separate from the original UNDP developing-region field.

Regenerate and validate the derived files:

```sh
python3 scripts/prepare-data.py
python3 scripts/validate-data.py
```

Preparation reads the original CSV, dictionary and saved geography mapping without a network request. It regenerates `lib/countries.json` and the enriched CSV. Original observations must remain unchanged.

### Data caveats

- Maternal mortality for 2020–2023 repeats the 2020 estimate.
- Income inequality for 2022–2023 uses 2022 data.
- Population is in **millions**; income is in **2021 purchasing-power-parity dollars**.
- Some observations represent the most recent available survey rather than a measurement taken in the series year. The annex workbook includes country-specific footnotes that are not yet modeled in the app.
- Female/male income values are estimates.
- Missing factors prevent a calculation; the app does not impute them.
- Calculation reconstructions never replace the reported index values used by charts.

## What the Excel statistical annex mirrors

The separately supplied `HDR25_Statistical_Annex_Tables_1-7.xlsx` is a reference source, **not an application dependency**. It has six sheets—Tables 1–5 and 7. Table 6 is absent.

The workbook mirrors **38 of the CSV’s 40 numeric measure families**. A country-name-based comparison checked **9,779 overlapping numeric cells**, including repeated measures across tables: every mapped country-level value agreed within numeric precision (`rel_tol=1e-7`, `abs_tol=1e-7`). Excel can retain more decimal digits than the CSV. This comparison does not establish exact equality for aggregate rows.

In the mapping below, letters identify Excel columns; CSV suffixes identify the source year. Every sheet also repeats the 2023 HDI rank in column A, mapped to `hdi_rank_2023`. Country names in column B map to `country`.

| Excel sheet | Mirrored Excel columns → CSV fields |
| --- | --- |
| **Table 1 · HDI** | C → `hdi_2023`; E → `le_2023`; G → `eys_2023`; I → `mys_2023`; K → `gnipc_2023`. |
| **Table 2 · HDI trends** | C, E, G, I, K, M, O, Q → `hdi_1990`, `hdi_2000`, `hdi_2010`, `hdi_2015`, `hdi_2020`, `hdi_2021`, `hdi_2022`, `hdi_2023`. The CSV additionally contains the intervening annual values. |
| **Table 3 · IHDI** | C → `hdi_2023`; E → `ihdi_2023`; G → `loss_2023`; K → `coef_ineq_2023`; M → `ineq_le_2023`; Q → `ineq_edu_2023`; U → `ineq_inc_2022`. |
| **Table 4 · GDI** | C → `gdi_2023`; E → `gdi_group_2023`; G/I → `hdi_f_2023` / `hdi_m_2023`; K/M → `le_f_2023` / `le_m_2023`; O/Q → `eys_f_2023` / `eys_m_2023`; S/U → `mys_f_2023` / `mys_m_2023`; W/Y → `gni_pc_f_2023` / `gni_pc_m_2023`. |
| **Table 5 · GII** | C → `gii_2023`; E → `gii_rank_2023`; G → `mmr_2020`; I → `abr_2023`; K → `pr_f_2023`; M/O → `se_f_2023` / `se_m_2023`; Q/S → `lfpr_f_2023` / `lfpr_m_2023`. |
| **Table 7 · PHDI** | C → `hdi_2023`; E → `phdi_2023`; G → `diff_hdi_phdi_2023`; I → `rankdiff_hdi_phdi_2023`; M → `co2_prod_2023`; Q → `mf_2023`. |

The two CSV numeric families not presented as separate annex columns are **`pop_total`** (total population) and **`pr_m`** (male parliamentary-seat share). ISO3 identifiers and the geographical-region enrichment also come from the CSV/mapping rather than a dedicated annex column. Human development groups appear as section headings in the workbook.

### What the Excel file adds

These fields have **not been imported into the app**:

| Sheet | Additional data absent as CSV columns |
| --- | --- |
| Table 1 | GNI per capita rank minus HDI rank; 2022 HDI rank. |
| Table 2 | HDI rank change over 2015–2023; annualized HDI growth for 1990–2000, 2000–2010, 2010–2023 and 1990–2023. |
| Table 3 | IHDI rank difference; inequality-adjusted life expectancy, education and income indices; income shares of the poorest 40%, richest 10% and richest 1%; Gini coefficient. |
| Table 7 | Planetary-pressure adjustment factor; CO₂ emissions index; material footprint index. |

This is 18 additional numeric fields: four income-distribution measures and 14 ranks, growth rates or intermediate calculations. Many of the latter can be reconstructed, but rank calculations must use the correct country set and tie rules.

The workbook also adds aggregate rows for **Developing countries, Least developed countries, Small island developing states and OECD**, plus country-specific notes, definitions and source annotations. The raw CSV already has 11 other aggregates, though the app does not expose those in its country list.

Income shares for the poorest 40% and richest 10%, and Gini coefficients, use the most recent observation during **2010–2023**; richest-1% shares are labeled **2023**. These should not be imported as complete annual time series. The richest 1% is included in the richest 10%, so those shares must not be treated as disjoint stacked categories.

**Aggregate-value caution:** matching the workbook’s source years against the raw CSV found differences in all 11 shared aggregate rows for maternal mortality and income inequality. Keep those source/period distinctions rather than automatically overwriting CSV aggregates with Excel values. Overlapping country-level observations matched as described above.

## Calculation models

### HDI

`lib/hdi-model.ts` applies the UNDP goalposts, normalizes health and schooling, uses natural logarithms for income, averages the two education indices and takes the geometric mean of the three dimensions:

```text
Health    = (bounded life expectancy − 20) / (85 − 20)
Education = ((bounded expected schooling / 18) + (bounded mean schooling / 15)) / 2
Income    = (ln(bounded GNI per capita) − ln(100)) / (ln(75000) − ln(100))
HDI       = cube_root(Health × Education × Income)
```

The model reproduces the published Benin example and 5,940 complete country/year HDI scores within the published three-decimal precision.

### GII

`lib/gii-model.ts` holds typed raw/normalized inputs, gender-specific dimension indices, female/male composite indices, the harmonic mean, reference index and final GII. Male reproductive health is a fixed reference of 1, not an observed male health measure.

The model reproduces the published Germany example and 4,520 complete nonzero-input country/year scores to the published precision. The 80 complete zero-input records do not reproduce under the documented floor. The UI explicitly flags those differences; it does not fit inputs to the reported answer.

Both models keep full intermediate precision while displaying six decimal places. Goalposts and adjustments affect calculations only, not source observations. Full equations and variable definitions are displayed in their respective tabs.

## Project structure

```text
app/                         Routes, metadata and global CSS
  page.tsx                   Loads and types derived country data
  data-dictionary/page.tsx    Column definitions
components/
  Explorer.tsx               Country selection and main layout
  Chart.tsx                  SVG chart, pointer/keyboard input and pinned details
  ChartTooltip.tsx           Country/year values and component details
  CountryFilters.tsx         Country-selection popup
  GraphFilters.tsx           Indicator/date/chart settings popup
  DataTable.tsx              Data preview and CSV export
  IndexCalculations.tsx      HDI/GII calculation tabs
  HdiCalculation.tsx         Numeric HDI walkthrough
  GiiCalculation.tsx         Numeric GII walkthrough
  HdiFormula.tsx             Complete HDI equations
  GiiFormula.tsx             Complete GII equations
  MathNotation.tsx           Shared fractions and roots
  Modal.tsx                  Native dialog wrapper
lib/                         Types, data, geography and calculation/interaction logic
public/                      Downloadable datasets and GII diagram
scripts/                     Data preparation, validation and regression checks
DATA_DICTIONARY.md           Full CSV definitions and enrichment notes
vercel.json                  Next.js deployment configuration
```

## Validation

```sh
npm run build
npm run typecheck
python3 scripts/validate-data.py
node --experimental-strip-types scripts/selection.test.mjs
node --experimental-strip-types scripts/chart-details.test.mjs
node --experimental-strip-types scripts/chart-interaction.test.mjs
node --experimental-strip-types scripts/hdi-model.test.mjs
node --experimental-strip-types scripts/gii-model.test.mjs
```

Checks cover 265,200 source observation slots, geographical assignments, preserved CSV values, group selection/sorting, tooltip factors, pin/dismiss behavior, calculation examples, bounds and missing inputs. State/model tests and HTTP checks do not substitute for visual browser testing of dialogs, charts and responsive layouts.

## Deployment

The GitHub repository is connected to the Vercel project **ge-un-tyj**. Pushing to `main` triggers a production deployment. `vercel.json` selects Next.js, `npm run build` and the `.next` output directory.

With an authenticated Vercel CLI, a production deployment can also be started from this directory:

```sh
vercel --prod
```

Do not commit `.env*`, `.vercel/`, `node_modules/`, `.next/` or local credentials. Inspect and validate source/data changes before publishing.

## Sources

- [UNDP documentation, downloads and metadata](https://hdr.undp.org/data-center/documentation-and-downloads)
- [HDR 2025 technical notes](https://hdr.undp.org/sites/default/files/2025_HDR/HDR25_Technical_Notes.pdf): Technical note 1 for HDI; Technical note 4 for GII.
- [UN M49 geographical classifications](https://unstats.un.org/unsd/methodology/m49/overview/)
- [UNDP GII overview and diagram](https://hdr.undp.org/data-center/thematic-composite-indices/gender-inequality-index)

Data attribution: UNDP (United Nations Development Programme). 2025. *Human Development Report 2025 — A matter of choice: People and possibilities in the age of AI*. New York.

## ILOSTAT employment and earnings

`/employment` is a separate data-query page linked from the main explorer. Selected countries are passed in its URL when opened from the HDR page. It supports hourly earnings by sex, unemployment by sex (ages 15+) and women in senior/middle management. Queries use the official [ILOSTAT REST API](https://rplumber.ilo.org/__docs__/).

The integration runs in **Next.js/Node.js**, not Python. The Python package shown in ILO’s documentation is an optional client for the same HTTP API; it is not required by this site.

```text
Employment filters → GET /api/ilostat → ILOSTAT /data/indicator → JSON observations
```

The server endpoint accepts an allowlisted measure, 1–20 ISO3 country codes, a bounded year range and a sex filter. It requests labeled JSON, preserves observation/source notes and caches upstream responses for up to 24 hours. Source query links and a query timestamp are shown; the timestamp is not the source publication date. Timeouts and unavailable data are displayed explicitly. No API key or additional dependency is required.

Hourly earnings use each country’s local currency, so absolute amounts are not directly comparable across countries. Returned observations are not averaged across sources or classifications. The table displays up to 1,000 rows; the CSV export retains every returned row and field. The management indicator has no separate sex dimension.

Example local request:

```text
/api/ilostat?dataset=women-management&countries=JPN,KOR,USA&from=2023&to=2023
```

Relevant files: `app/employment/page.tsx`, `components/EmploymentExplorer.tsx`, `app/api/ilostat/route.ts`, and `lib/ilostat.ts`.

Validation: `node --experimental-strip-types scripts/ilostat.test.mjs`.

## Personal notebook

A bottom-left **My notes** button opens a chat-style panel for private questions and notes. It is available across the HDR explorer, employment page and data dictionary. Messages include dates, page context and Note/Question labels; Enter saves and Shift+Enter adds a line. There are no automated replies.

Browser notes persist locally, and Supabase account syncing is optional. The integration uses email/password sign-in, a signup modal with email confirmation, and password setup/reset links for existing accounts. Notes use an owner-only RLS table. Signed-in users can attach PowerPoint, Excel, Word, ZIP, PDF and image files to messages (up to 10 files, 20 MB each), stored in a private Supabase bucket. Browser-supported images preview inline; other formats download in their original form. Browser notes are only copied to an account through the explicit copy action. The public data explorer does not require sign-in.

See [supabase/README.md](supabase/README.md) for environment variables, migration, authentication redirect settings and privacy checks. Without Supabase configuration the panel works in browser-only mode. Notes validation checks: `node --experimental-strip-types scripts/notes.test.mjs`.

### Live gender equality tabs

- `/sdg`: UN SDG 5.4.1 (`SL_DOM_TSPD`), time spent on unpaid domestic and care work as a percentage of a 24-hour day. Retains age, sex, location, nature, sources and footnotes. Country codes use an ISO3–M49 mapping extracted from the [official UN M49 table](https://unstats.un.org/unsd/methodology/m49/). The server follows every response page, rejecting oversized results rather than presenting an incomplete response.
- `/unicef`: women aged 20–24 married/in union before 18 or 15 (`PT_F_20-24_MRD_U18`, `PT_F_20-24_MRD_U15`). Uses UNICEF's global SDMX dataflow. Decodes dimension and attribute indices, including survey source, reference period, age, observation status and footnotes. `SEX=Total` describes the series dimension; the indicator itself explicitly concerns women. Some countries have no observations in this flow. Direct visits start with India, Nepal and Bangladesh; navigation preserves the current selected countries and offers an explicit example shortcut.
- `/employment`: ILOSTAT management, unemployment by sex and hourly earnings by sex, via ILO's public R API. Starts with women in senior/middle management. Earnings are in local currency and must not be interpreted as a common currency comparison across countries.

These tabs fetch public data server-side without API keys. `/api/live` allowlists the upstream hosts, measures and country codes; limits queries to 20 countries and 41 years; and caches responses for 24 hours. `/api/ilostat` retains its own equivalent query validation. Initial visits load automatically; subsequent filter edits require **Load data**. Query timestamps are not publication dates. Empty observations remain missing, never zero.

Bar charts display individual observations with hover/focus details and click-to-pin. Latest mode uses each country's latest available year, clearly labeling the year; choose an explicit year for same-year comparison. Multiple sources and population groups remain separate bars. Display limits are 80 bars and 1,000 table rows; CSV exports all returned rows with metadata. The HDR equations remain on their existing page.

Validation: `node scripts/live-data.test.mjs`, `node scripts/ilostat.test.mjs`, `npm run typecheck`, `npm run build`. Live endpoint checks cover all three providers; upstream availability and country coverage can vary.

### World topics and grouped navigation

`/topics` is the world overview. It requests all **50 curated indicators across 11 topics** in one World Bank V2 API query for the selected countries and year range. Each card previews one measure; open a topic to switch between every included measure without another request:

| Route | Coverage |
| --- | --- |
| `/topics/climate` | CO₂ and greenhouse gases per person, forests, PM2.5, protected land |
| `/topics/poverty` | $3/day poverty at 2021 PPP, Gini, poorest quintile income share, national poverty |
| `/topics/food` | Food insecurity, undernourishment, child stunting and wasting |
| `/topics/health` | Life expectancy, child mortality, TB, health service coverage and spending |
| `/topics/education` | Completion, literacy, out-of-school children and education spending |
| `/topics/water` | Safely managed water and sanitation, handwashing, water stress |
| `/topics/energy` | Electricity, clean cooking, renewables, energy intensity |
| `/topics/economy` | Real GDP per capita, growth, inflation, unemployment and productivity |
| `/topics/cities` | Urban population/growth, internet access and slum populations |
| `/topics/peace` | Homicide, birth registration, control of corruption and rule of law |
| `/topics/conflict` | Battle deaths, UNHCR refugees by asylum/origin, internal displacement, new conflict displacement and military spending |

Unpaid care, UNICEF and ILOSTAT pages are grouped under **Data → Gender & work**. The Data menu links to all world topics and the full HDR explorer. Country selection is carried in navigation links. Japan, Korea and USA remain the default; explicit example-country shortcuts help with measures not reported for those countries.

`lib/topics.json` contains the allowlisted indicator catalog and official World Bank definitions/source organizations verified against the WDI metadata API in November 2026. No new API credentials are required. These country statistics are distributed through World Bank WDI, including data from UN agencies and research providers; this implementation does not call UCDP's token-protected event API or NASA's location-based weather API. Conflict data are annual country statistics, not live events, and battle deaths exclude many indirect consequences of war. Refugees by asylum and by origin are separate measures, not additive totals. Source years and missing values remain visible.

`/api/topics` accepts `topic`, comma-separated ISO3 `countries`, `from` and `to`. It permits up to 5 countries for the 50-measure overview or 20 for an individual topic, over at most 41 years (1960–2100). Source requests use a fixed host, explicit source 2, exact date ranges, observation footnotes and no gap filling. Every page is fetched and its record count checked; incomplete, changing, oversized and HTTP-200 API error responses fail visibly. Responses cache for 24 hours with a 50-second overall upstream timeout.

Topic pages include annual line charts, year-specific/latest-country bars, keyboard-accessible points, click-to-pin details, country dimming and full-screen graphs. Missing years break lines; zero and negative values remain valid. The overview and individual topics export all returned records (including nulls) with units, source definitions and footnotes. The visible table is capped at 1,000 rows. Database update dates are distinct from response times and observation years.

Checks: `node scripts/topics.test.mjs` exercises query validation, API errors, pagination completeness, changing page totals, null/zero/negative values and latest non-null selection. `node scripts/topic-charts.test.mjs` checks negative bar baselines, missing-year line gaps, annual point labels and empty-chart rendering. `npm run build` checks every route and TypeScript. A live 2000–2025 overview query for Japan, Korea and USA returned 3,900 annual records across all 50 measures, including 2,736 numeric observations; coverage varies by country and measure.

### Separate composite-index tabs

`/indices` lists the composite indices and scores by subject; GII lives at `/`. Each index now has its own `/indices/<id>` page with shared country selection, an index-specific chart, published observations, input inspection, a conditional what-if calculator and its equation:

- `hdi`: Human Development Index; existing UNDP reconstruction and full formula.
- `gii`: Gender Inequality Index; existing reconstruction, diagram and full formula, on a separate page from HDI.
- `gdi`: Gender Development Index; female/male HDI from eight sex-specific inputs, using the female/male life expectancy goalposts.
- `ihdi`: Inequality-adjusted HDI; discounts HDI using the three published Atkinson inequality measures.
- `phdi`: Planetary pressures-adjusted HDI; HDR 2025 maxima of 76.61 tonnes CO₂ and 90.27 tonnes material footprint per person.
- `mpi`: 2026 UNDP/OPHI latest survey snapshots for 108 countries, using published incidence and intensity. The full explanation includes the ten indicator weights, household deprivation cutoff and survey-weighted aggregation. These snapshots are not mixed with Table 2 harmonized trends.
- `ghi`: 2026 GHI workbook, including 2000/2006/2012/2018/2026 reference scores from the same edition and the four component indicators. Censored scores and inputs stay censored; exact calculations are unavailable when an input is only a bound.
- `epi`: 2026 EPI scores for 177 countries/territories. The calculator starts from the published environmental health, ecosystem vitality and climate objective scores, weighted 25%/45%/30%. The full methodology section lists all 47 indicators, their scores, transformations, targets and nominal weights. It does not claim to reconstruct imputation or country-specific materiality handling from raw data. EPI snapshots are not connected into annual trends.

The complete HDR explorer is preserved at `/lab/hdr`; the main `/` page is dedicated to GII. The shared Indices dropdown lists the composite indices by subject, while the Data dropdown organizes individual measurements and source datasets. Japan, Korea and USA remain the defaults. MPI/GHI offer an explicit India/Nepal/Bangladesh shortcut where the defaults have no coverage. Taiwan is available in the EPI country picker because it is in that publisher's workbook, while it has no HDR observations in this project's source CSV.

`lib/index-sources.json` records original source URLs and file hashes. Downloaded workbooks are in `public/index-sources/`; `python3 scripts/prepare-indices.py` regenerates the JSON extracts with the standard-library XLSX reader. EPI data and derived EPI extracts retain the publisher's CC BY-NC-SA 4.0 license; see `public/index-sources/README.md` and the publisher's downloads page. No new API key is needed for these downloaded snapshots.

`node scripts/indices.test.mjs` verifies ten-index calculations, published UNDP examples, full MPI/EPI workbook reconstruction at source precision, GHI rounding bounds, null/censoring preservation, and valid input ranges. Existing HDI and GII tests remain in place. Scenario inputs never overwrite official chart values. The tab for each index shows the source/reconstructed baseline difference rather than hiding it.

### Financial Development Index, Food Consumption Score and staged calculations

The composite-index navigation now includes **FDI** and **FCS**, alongside MPI, GHI, EPI and the existing UNDP indices. MPI/GHI/EPI now also have a dedicated source-input table and numbered baseline calculation stages before their what-if controls, following the HDI/GII display pattern.

**`/indices/fdi` — IMF Financial Development Index.** The official public IMF SDMX CSV supplies all nine indices for 183 individual countries over 1980–2020 (7,503 country-years). `lib/fdi-data.json` and the downloadable `public/index-sources/fdi-imf-extract.csv` retain these published observations; missing later years are not extrapolated. The page shows the six category indices (institutions/markets × depth/access/efficiency), the published FI/FM parents, the reported overall index, annual charts, exact-year inputs, step-by-step reconstruction, the normalization/PCA equations, a what-if calculator and CSV export. Japan, Korea and USA remain the defaults. Aruba, Macao and French Polynesia are included in this index's picker because the IMF publishes them.

The IMF method normalizes aggregates after weighting. Current vintage-specific PCA loadings/endpoints and the complete raw/proprietary input series are not supplied in this dataflow. `scripts/prepare-fdi.py` therefore fits the three affine relationships between the **published** indices across the complete individual-country sample, converts them to weighted-average/min-max parameters, and refuses to generate files if residuals exceed 1e-6. These are explicitly labeled **data-derived reconstruction parameters**, not official published PCA coefficients. The six-component-to-overall reconstruction has a maximum absolute residual below 8e-8 over all 7,503 observations. The publisher's reported scores remain the chart values. What-if experiments fix these reconstructed parameters; combinations outside the source normalization range remain visible rather than being silently clipped. `lib/fdi-source.json` records attribution, URLs, dates, time coverage and both response/extract hashes. No IMF API key is needed for the static extract.

**`/indices/fcs` — WFP Food Consumption Score.** This is a household score (0–112), with eight seven-day food-group frequencies and nutritional weights, not an annual country index. The initial observation is WFP's published illustrative worked example (score 50), with no assigned country or survey date. The page includes household comparison bars with hover/focus/pinned details, a source-frequency table, contribution stages, reported-versus-computed results, a what-if calculator, the expanded equation, all weights, standard/adjusted category thresholds, and the survey-weighted mean/category-share equations.

The FCS page supports optional **local CSV import** (1–500 households, ≤1 MB). All eight frequencies are required, integer 0–7. Both descriptive column names and official WFP variable names are accepted. Optional `household_id`, `country`, `date`, positive `weight` and `reported_fcs` columns allow sample comparisons and weighted poor/borderline/acceptable shares. IDs must be unique and dates valid. Missing frequencies are rejected instead of interpreted as zero. The file remains in the browser; nothing is uploaded or written to Supabase. Location/date filters, a template, result export and full-screen comparison are included. Imported sample summaries do not establish national representativeness. Threshold selection changes classifications, not household scores.

Verification: `node scripts/financial-food.test.mjs` checks WFP's source example, valid score limits, both threshold schemes, CSV validation and aliases, stable weighting for extreme finite weights, source hashes and every IMF country-year reconstruction. `node scripts/indices.test.mjs` covers all ten indices plus the existing MPI/GHI/EPI workbook checks. `npm run build` validates the route/UI TypeScript. Downloaded index data remain subject to the original publishers' terms; see the source directory README.

## Public chat

The bottom-right **Public chat** is shared by all visitors and does not require sign-in. Messages persist in Supabase, with optional unverified display names, earlier-history pagination and updates every five seconds while the panel is open. This is separate from the bottom-left private notebook. Nothing from private notes or their attachments is published automatically. See [Supabase setup](supabase/README.md#public-community-chat) for storage and access details.
