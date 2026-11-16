# HDR 2025 data dictionary

The original file contains 206 rows (195 countries/territories plus 11 aggregates) and 1,112 columns. The explorer includes the 195 country/territory rows with nonempty `hdicode`.

A year suffix identifies the series year: `gii_2023` means GII for 2023. `_f` means female and `_m` means male. Missing values are unavailable, never zero. Most families cover 1990–2023; IHDI families cover 2010–2023; ranks and the GDI group are 2023 only.

| Prefix | Meaning and units | Coverage | Columns |
|---|---|---|---|
| `iso3` | ISO3 | - | 1 |
| `country` | HDR Country Name | - | 1 |
| `hdicode` | Human Development Groups | - | 1 |
| `region` | UNDP Developing Regions | - | 1 |
| `hdi_rank` | HDI Rank | 2023 | 1 |
| `hdi` | Human Development Index (value) | 1990-2023 | 34 |
| `le` | Life Expectancy at Birth (years) | 1990-2023 | 34 |
| `eys` | Expected Years of Schooling (years) | 1990-2023 | 34 |
| `mys` | Mean Years of Schooling (years) | 1990-2023 | 34 |
| `gnipc` | Gross National Income Per Capita (2021 PPP$) | 1990-2023 | 34 |
| `gdi_group` | GDI Group | 2023 | 1 |
| `gdi` | Gender Development Index (value) | 1990-2023 | 34 |
| `hdi_f` | HDI female (value) | 1990-2023 | 34 |
| `le_f` | Life Expectancy at Birth, female (years) | 1990-2023 | 34 |
| `eys_f` | Expected Years of Schooling, female (years) | 1990-2023 | 34 |
| `mys_f` | Mean Years of Schooling, female (years) | 1990-2023 | 34 |
| `gni_pc_f` | Gross National Income Per Capita, female (2021 PPP$) | 1990-2023 | 34 |
| `hdi_m` | HDI male (value) | 1990-2023 | 34 |
| `le_m` | Life Expectancy at Birth, male (years) | 1990-2023 | 34 |
| `eys_m` | Expected Years of Schooling, male (years) | 1990-2023 | 34 |
| `mys_m` | Mean Years of Schooling, male (years) | 1990-2023 | 34 |
| `gni_pc_m` | Gross National Income Per Capita, male (2021 PPP$) | 1990-2023 | 34 |
| `ihdi` | Inequality-adjusted Human Development Index (value) | 2010-2023 | 14 |
| `coef_ineq` | Coefficient of human inequality | 2010-2023 | 14 |
| `loss` | Overall loss (%) | 2010-2023 | 14 |
| `ineq_le` | Inequality in life expectancy | 2010-2023 | 14 |
| `ineq_edu` | Inequality in education | 2010-2023 | 14 |
| `ineq_inc` | Inequality in income | 2010-2021, 2022-2023=2022 | 14 |
| `gii_rank` | GII Rank | 2023 | 1 |
| `gii` | Gender Inequality Index (value) | 1990-2023 | 34 |
| `mmr` | Maternal Mortality Ratio (deaths per 100,000 live births) | 1990-2019, 2020-2023=2020 | 34 |
| `abr` | Adolescent Birth Rate (births per 1,000 women ages 15-19) | 1990-2023 | 34 |
| `se_f` | Population with at least some secondary education, female (% ages 25 and older) | 1990-2023 | 34 |
| `se_m` | Population with at least some secondary education, male (% ages 25 and older) | 1990-2023 | 34 |
| `pr_f` | Share of seats in parliament, female (% held by women) | 1990-2023 | 34 |
| `pr_m` | Share of seats in parliament, male (% held by men) | 1990-2023 | 34 |
| `lfpr_f` | Labour force participation rate, female (% ages 15 and older) | 1990-2023 | 34 |
| `lfpr_m` | Labour force participation rate, male (% ages 15 and older) | 1990-2023 | 34 |
| `rankdiff_hdi_phdi` | Difference from HDI rank | 2023 | 1 |
| `phdi` | Planetary pressures–adjusted Human Development Index (value) | 1990-2023 | 34 |
| `diff_hdi_phdi` | Difference from HDI value (%) | 1990-2023 | 34 |
| `co2_prod` | Carbon dioxide emissions per capita (production) (tonnes) | 1990-2023 | 34 |
| `mf` | Material footprint per capita (tonnes) | 1990-2023 | 34 |
| `pop_total` | Population, total (millions) | 1990-2023 | 34 |

## Interpretation

- HDI, female/male HDI, IHDI and PHDI: higher values indicate more human development.
- GII: lower values indicate less gender inequality.
- GDI: female HDI divided by male HDI; closeness to 1 indicates parity, rather than higher always being better.
- GDI groups 1–5 reflect increasing absolute deviation from parity: up to 2.5%, over 2.5–5%, over 5–7.5%, over 7.5–10%, and over 10%.
- `hdicode`: Low / Medium / High / Very High human development group.
- `region`: UNDP developing-region code; blank does not mean a country is missing. AS = Arab States; EAP = East Asia and the Pacific; ECA = Europe and Central Asia; LAC = Latin America and the Caribbean; SA = South Asia; SSA = Sub-Saharan Africa.
- `eys`: schooling years expected for a child entering school; `mys`: schooling years achieved by adults ages 25 and older.
- `gnipc` and `gni_pc_f/m`: GNI per person in 2021 purchasing-power-parity dollars. Female/male income values are estimates.
- `coef_ineq`: arithmetic average of health, education and income inequality, expressed as a percentage.
- `loss`: 100 × (HDI − IHDI) / HDI; relative loss due to inequality.
- `ineq_le`, `ineq_edu`, `ineq_inc`: inequality within each dimension, expressed as percentages.
- `diff_hdi_phdi`: percentage reduction relative to HDI, 100 × (HDI − PHDI) / HDI.
- `rankdiff_hdi_phdi`: HDI rank minus PHDI rank on the comparable set; a positive value indicates a better PHDI rank.
- Maternal mortality (`mmr`) in 2020–2023 repeats the 2020 estimate.
- Income inequality (`ineq_inc`) in 2022–2023 uses 2022 data.
- `pop_total` is in millions, not individual people.

## Official sources

- [UNDP metadata workbook](https://hdr.undp.org/sites/default/files/2025_HDR/HDR25_Composite_indices_metadata.xlsx)
- [2025 technical notes](https://hdr.undp.org/sites/default/files/2025_HDR/HDR25_Technical_Notes.pdf)
- [Documentation and downloads](https://hdr.undp.org/data-center/documentation-and-downloads)

## Added geographical region column

`public/HDR25_with_geographical_regions.csv` adds `geographical_region` to the 1,112 original columns. This UTF-8 copy preserves source values and uses the most specific UN M49 intermediate region where available, otherwise the subregion (e.g. Central America, Eastern Asia, Western Europe). All 195 country/territory rows are classified; aggregates have a blank derived region. The unmodified original stays available separately.

Mappings and ISO alpha-2 flag codes are saved in `lib/geography.json`, retrieved from the [official UN M49 English table](https://unstats.un.org/unsd/methodology/m49/overview/) on 2026-11-16. UN M49 groupings are statistical classifications and do not replace the HDR developing-region field.
