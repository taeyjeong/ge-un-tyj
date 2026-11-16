"""Validate derived observations, coverage, source preservation, and regional assignments."""
import csv, json, pathlib, math
ROOT=pathlib.Path(__file__).resolve().parents[1]
with (ROOT/'public/HDR25_Composite_indices_complete_time_series.csv').open(encoding='cp1252',newline='') as f:
    reader=csv.DictReader(f)
    columns=reader.fieldnames
    source=list(reader)
with (ROOT/'public/HDR25_with_geographical_regions.csv').open(encoding='utf-8-sig',newline='') as f:
    reader=csv.DictReader(f)
    assert reader.fieldnames==columns+['geographical_region']
    enriched=list(reader)
assert len(source)==len(enriched)==206
countries=json.loads((ROOT/'lib/countries.json').read_text())
geography=json.loads((ROOT/'lib/geography.json').read_text())
metrics=[row['prefix'] for row in json.loads((ROOT/'lib/dictionary.json').read_text()) if row['group']!='Identifiers']
assert len(metrics)==40 and len(countries)==195
lookup={country['code']:country for country in countries}
observations=0
for original,new in zip(source,enriched):
    assert all(original[key]==new[key] for key in columns),original['iso3']
    if not original['hdicode']:
        continue
    country=lookup[original['iso3']]
    assert country['geographicalRegion']==new['geographical_region']==geography[country['code']]['geographicalRegion']
    assert len(country['iso2'])==2 and country['developmentGroup']==original['hdicode']
    assert set(country['series'])==set(metrics)
    for metric in metrics:
        assert len(country['series'][metric])==34
        for year,value in country['series'][metric]:
            try:
                expected=float(original.get(f'{metric}_{year}',''))
                if not math.isfinite(expected):expected=None
            except (ValueError,TypeError):expected=None
            assert value==expected,(country['code'],metric,year)
            observations+=1
for code,region in [('KOR','Eastern Asia'),('DEU','Western Europe'),('GTM','Central America')]:
    assert lookup[code]['geographicalRegion']==region
assert len({c['code'] for c in countries})==195
print(f'Passed: {observations:,} observations, 195 flags/regions, 40 measures, all original source cells preserved in enriched CSV.')
