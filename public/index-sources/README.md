# Published composite-index source files

The original workbooks are unchanged. Source URLs and SHA-256 hashes are recorded in `lib/index-sources.json` in the codebase. `scripts/prepare-indices.py` extracts the country scores and inputs, preserving censored GHI values and survey periods.

- `mpi-2026.xlsx`: UNDP and OPHI, 2026 Global Multidimensional Poverty Index, Tables 1 and 2. This website uses Table 1's latest survey snapshots. Table 2 harmonized trends are not combined with Table 1 estimates. Source: https://hdr.undp.org/data-center/documentation-and-downloads
- `ghi-2026.xlsx`: Global Hunger Index, 2026 scores and component data. Historical reference scores are taken from this same edition. Publisher credit: Welthungerhilfe, Concern Worldwide and IFHV. Source: https://www.globalhungerindex.org/download/all.html
- `epi-2026.xlsx` and `epi_methods-2026.xlsx`: Yale / Columbia, 2026 Environmental Performance Index. EPI source workbooks and EPI-derived data retain the publisher's Creative Commons Attribution-NonCommercial-ShareAlike 4.0 license: https://creativecommons.org/licenses/by-nc-sa/4.0/. Environmental Performance Index is a registered trademark of Yale University. Source: https://epi.yale.edu/2026/downloads

The local JSON extracts reorganize the source data for display; they do not replace published scores with reconstructed values. EPI edition scores are not an annual time series. GHI values such as `<5` remain text bounds, with no invented exact score.

- `fdi-imf-extract.csv`: a compact extract of all nine published IMF Financial Development indices, retrieved 2026-11-17 from `https://api.imf.org/external/sdmx/2.1/data/IMF.MCM,FDI/all`. It includes 183 individual countries, 1980–2020 (7,503 country-years); IMF regional aggregates and repeated SDMX metadata columns are excluded. The raw response and compact extract hashes are recorded in `lib/fdi-source.json`. IMF attribution and terms remain applicable: https://www.imf.org/external/terms.htm. This is not the World Bank FinData index or a Foreign Direct Investment series.

The app's FDI reconstruction parameters are inferred from the affine relationships among the published sub-indices, with residuals checked against the complete extracted sample. They are not represented as official vintage-specific PCA loadings. See `lib/fdi-reconstruction.json` and the methodology display on the FDI page. Recreate the extract using `python3 scripts/prepare-fdi.py /path/to/the/official/SDMX.csv`.

The Food Consumption Score page uses WFP's published 2026 Indicator Compendium worked example (frequencies 7, 2, 3, 2, 2, 1, 7, 7; score 50), not an invented country observation. Original example and methodology: https://monitoringhandbook.manuals.wfp.org/wfp-indicator-compendium/docs/1-food-consumption-score. User-imported household CSVs are processed locally and are not part of this published source directory.
