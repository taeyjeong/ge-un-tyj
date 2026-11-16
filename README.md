# Gender equality · UN data

A buildless country comparison explorer for UNDP's Human Development Report 2025 composite indices. Select one or several countries to compare the Gender Inequality Index (default) or Gender Development Index from 1990–2023.

## Run locally

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. No dependencies or build step are required.

## Data

`HDR25_Composite_indices_complete_time_series.csv` is the original supplied file, preserved byte-for-byte (Windows-1252 encoding). `data.json` contains its GII and GDI series for the 195 rows with a nonempty `hdicode`, excluding aggregate rows. Missing values remain null and appear as gaps. Hover over chart points for exact observations, or use the latest-value table.

This is an independent explorer, not affiliated with UNDP or the United Nations. Source data attribution: UNDP, Human Development Report 2025.

## Hosting

Import the public GitHub repository into Vercel with project name `gender-equality-un-data`, framework preset Other, no build command, and output directory `.`. `vercel.json` supplies the static configuration. The requested domain is subject to availability.
