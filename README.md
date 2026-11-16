# Gender equality · UN data

An interactive explorer for the **UNDP Human Development Report 2025**. Compare countries across human development, gender equality, inequality and environmental pressures, then inspect how HDI and GII are calculated.

- Website: https://gender-equality-un-data.vercel.app
- Repository: https://github.com/taeyjeong/gender-equality-un-data
- Stack: Next.js 16 App Router, React 19, TypeScript and CSS; SVG charts without an external charting library.

The app reads bundled public data. It requires no database, API key or environment variables. This is an independent project, not affiliated with UNDP or the United Nations. The source tree may include local work that has not yet been deployed.

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

HDI/GII calculation tabs support left/right arrows and Home/End.

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

The GitHub repository is connected to the Vercel project **gender-equality-un-data**. Pushing to `main` triggers a production deployment. `vercel.json` selects Next.js, `npm run build` and the `.next` output directory.

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
