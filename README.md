# Gender equality · UN data

Next.js App Router + React + TypeScript country comparison explorer for UNDP Human Development Report 2025 data.

```sh
npm install
npm run dev
```

Open http://localhost:3000. Production checks: `npm run build` and `npm run typecheck`. Production server: `npm start`.

Select one or several countries to compare all 40 numeric measures across 1990–2023. The graph popup selects the indicator, date range, lines/bars and vertical-axis baseline. Ranks and GDI groups are 2023 snapshots. Missing observations remain gaps.

The country popup supports individual selection, select all, and bulk selection by UNDP developing region, human development group, and UN M49 geographical region. Its facets intersect; Select matching adds that set to existing selections. Country rows include flag emoji.

Data preview supports latest observations, annual observations for one measure, and all 40 measures for a selected year. Each view can be downloaded as CSV. The UNDP GII diagram is included in the methodology section.

## Data

The byte-for-byte original CSV is in `public/HDR25_Composite_indices_complete_time_series.csv` (Windows-1252 encoding). `lib/countries.json` contains all 40 numeric series for the 195 country/territory rows with nonempty `hdicode`, excluding 11 aggregates. Missing values remain null.

[DATA_DICTIONARY.md](DATA_DICTIONARY.md) explains all 1,112 columns using the 44 families in UNDP's official metadata. The website includes the same information at `/data-dictionary`; its table is in `lib/dictionary.json`.

## Structure

- `app/`: routes, layout, metadata and CSS
- `components/Explorer.tsx`: interactive selection and comparison
- `components/Chart.tsx`: typed SVG time-series chart
- `lib/`: typed models, derived chart data and column definitions
- `public/`: original downloadable source CSV

## Hosting

The project is connected to Vercel as `gender-equality-un-data`, using the Next.js framework preset. `vercel.json` supplies Next.js build settings. GitHub pushes trigger deployments.

Independent explorer, not affiliated with UNDP or the United Nations.

Source: UNDP (United Nations Development Programme). 2025. Human Development Report 2025 — A matter of choice: People and possibilities in the age of AI. New York.

## Regenerate data

Run `python3 scripts/prepare-data.py` to rebuild `lib/countries.json` and the enriched CSV from the original source and saved UN M49 mapping. Run `python3 scripts/validate-data.py` to validate every observation and geographical assignment.

`public/HDR25_with_geographical_regions.csv` adds `geographical_region`. See the data dictionary for provenance and handling of aggregates. The original CSV remains byte-for-byte unchanged.

Diagram: [UNDP GII overview](https://hdr.undp.org/data-center/thematic-composite-indices/gender-inequality-index), downloaded from the page’s official GII_diagram.png asset.

## Chart details and expanded view

Every available annual observation is drawn as a line-chart point. Hover or tap to see country, year and value. GDI details include female/male HDI, life expectancy, expected and mean schooling, and estimated income. GII details include maternal mortality, adolescent births, female/male secondary education, parliamentary representation and labour participation. All factors use the hovered year; missing factors remain unavailable. Cards identify reused maternal-mortality and income-inequality estimates.

Maximize expands the graph in a modal. Keyboard users can focus the chart and use left/right arrows for years, up/down arrows for countries, Home/End for first/last observations, and Escape to dismiss details, then close the expanded view. Bars show each country’s actual latest observation year in the selected range.

Tooltip regression checks: `node --experimental-strip-types scripts/chart-details.test.mjs`.

## GII calculation model

Selected countries appear first in both country lists, alphabetical within the selected and unselected groups.

The **Explore the GII calculation** section follows the methodology diagram for any selected country and year. `lib/gii-model.ts` holds typed raw inputs, normalized inputs, gender-specific dimension indices, female/male composite indices, the harmonic mean, the reference index and the final reconstruction. The model never replaces reported chart values or imputes missing data.

The calculation is based on [HDR 2025 Technical note 4](https://hdr.undp.org/sites/default/files/2025_HDR/HDR25_Technical_Notes.pdf), including the maternal mortality bounds, positive input floors, percentage conversion, geometric means and harmonic mean. Male health is a fixed reference of 1. Display rounding is separate from the full-precision calculation.

Validation reproduces the official worked Germany example and all 4,520 complete, nonzero-input country-years to the published GII precision. The 80 complete zero-input records do not reproduce under the documented floor; differences are explicitly shown beside the reported score, without modifying inputs or fitting the model to the answer. Missing and invalid inputs block reconstruction.

Model checks: `node --experimental-strip-types scripts/gii-model.test.mjs`.

## Pinned chart details and complete equations

Click a point or bar to pin that country/year. Its details remain open through pointer movement, pointer exit and focus changes. Other countries' lines, points and bars fade to 12% opacity. Clicking another point replaces the pin; clicking elsewhere dismisses it. Clicking inside the detail card keeps it open so it can be read and scrolled. Enter pins the keyboard-selected point; Escape dismisses it.

The bottom-of-page `GiiFormula` section displays input adjustments, dimension equations, gender geometric means, the harmonic mean, the reference standard and a fully substituted expression. It uses accessible HTML fractions and roots without an external math-rendering dependency. The wide expanded equation scrolls horizontally on smaller screens.

Interaction state checks: `node --experimental-strip-types scripts/chart-interaction.test.mjs`.
