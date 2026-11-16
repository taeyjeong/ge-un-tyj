"""Regenerate app data and enriched CSV from the unmodified HDR source and UN M49 mapping."""
import csv, json, math, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'public/HDR25_Composite_indices_complete_time_series.csv'
geography = json.loads((ROOT / 'lib/geography.json').read_text())
dictionary = json.loads((ROOT / 'lib/dictionary.json').read_text())
metrics = [item for item in dictionary if item['group'] != 'Identifiers']
regions = {'AS':'Arab States','EAP':'East Asia and the Pacific','ECA':'Europe and Central Asia','LAC':'Latin America and the Caribbean','SA':'South Asia','SSA':'Sub-Saharan Africa'}
with SOURCE.open(encoding='cp1252', newline='') as f:
    reader = csv.DictReader(f)
    columns = reader.fieldnames
    rows = list(reader)
countries = []
for row in rows:
    if not row['hdicode']:
        continue
    geo = geography.get(row['iso3'])
    if not geo:
        raise ValueError(f"Missing geographical classification: {row['iso3']}")
    country = {'code':row['iso3'], 'name':row['country'], 'iso2':geo['iso2'], 'developmentGroup':row['hdicode'], 'developingRegion':regions.get(row['region'],'Not in a UNDP developing region'), 'geographicalRegion':geo['geographicalRegion'], 'series':{}}
    for metric in metrics:
        points = []
        for year in range(1990,2024):
            try:
                value = float(row.get(f"{metric['prefix']}_{year}",''))
                if not math.isfinite(value):
                    value = None
            except (ValueError,TypeError):
                value = None
            points.append([year,value])
        country['series'][metric['prefix']] = points
    countries.append(country)
(ROOT/'lib/countries.json').write_text(json.dumps(countries,ensure_ascii=False,separators=(',',':'))+'\n')
with (ROOT/'public/HDR25_with_geographical_regions.csv').open('w',encoding='utf-8-sig',newline='') as f:
    writer=csv.DictWriter(f,fieldnames=columns+['geographical_region'],lineterminator='\n')
    writer.writeheader()
    for row in rows:
        writer.writerow({**row,'geographical_region':geography.get(row['iso3'],{}).get('geographicalRegion','')})
print(f"Prepared {len(countries)} countries, {len(metrics)} numeric measures, and enriched CSV with {len(columns)+1} columns.")
