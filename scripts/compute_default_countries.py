"""Compute each section's three default countries and write lib/default-countries.json.

Rule (same for every section):
  1. Biggest change: the country whose value moved most between its first and latest year
     (needs >= 10 years between them and a latest value within 3 years of the newest data).
  2-3. Worst today: the two worst latest values, in the measure's "bad" direction.
  All three come from different UN sub-regions (e.g. Caribbean vs Central America), and only countries
  with at least 1 million people count, so tiny states don't dominate per-person measures.
  Survey-based pages (UNICEF, UN time use) accept latest values from the last 12 years.
  Snapshot data with no history -> the three worst. Neutral measures -> the three biggest changes.

Built-in data (HDR indices, MPI/GHI/EPI snapshots, IMF FDI) is read from lib/. Live sections
(World Bank topics, UNICEF, UN SDG, ILO) are fetched from their public APIs.
Run from the repo root:  python3 scripts/compute_default_countries.py
"""
import json, sys, urllib.request, urllib.parse, datetime

countries = json.load(open('lib/countries.json'))
NAME = {c['code']: c['name'] for c in countries}
SUBREGION = {c['code']: c['geographicalRegion'] for c in countries}
def population(c):
    pts = [v for y, v in c['series'].get('pop_total', []) if v is not None]
    return pts[-1] if pts else 0
VALID = {c['code'] for c in countries if c['developmentGroup'] != 'Other Countries or Territories' and population(c) >= 1.0}  # millions

def continent(code):
    r = SUBREGION.get(code, '')
    if 'Africa' in r: return 'Africa'
    if r in ('Caribbean', 'Central America', 'South America', 'Northern America'): return 'Americas'
    if 'Asia' in r: return 'Asia'
    if 'Europe' in r: return 'Europe'
    if r in ('Australia and New Zealand', 'Melanesia', 'Micronesia', 'Polynesia'): return 'Oceania'
    return 'Other'

def fmt(v):
    return f'{v:,.3f}' if abs(v) < 10 else f'{v:,.1f}'

def pick(series, worse, label, min_span=10, recent_years=3):
    """series: {code: [(year, value), ...]}; worse: 'higher', 'lower', or None (neutral: three biggest changes)."""
    clean = {c: sorted((y, v) for y, v in pts if v is not None) for c, pts in series.items() if c in VALID}
    clean = {c: p for c, p in clean.items() if p}
    if not clean: raise ValueError(f'no data for {label}')
    newest = max(p[-1][0] for p in clean.values())
    recent = {c: p for c, p in clean.items() if p[-1][0] >= newest - recent_years}
    chosen, used = [], set()

    def take(code, reason):
        chosen.append({'code': code, 'name': NAME.get(code, code), 'reason': reason}); used.add(SUBREGION.get(code))

    changers = sorted(((abs(p[-1][1] - p[0][1]), c, p) for c, p in recent.items() if p[-1][0] - p[0][0] >= min_span), reverse=True)
    for _, c, p in changers:
        if len(chosen) == (3 if worse is None else 1): break
        if SUBREGION.get(c) in used: continue
        take(c, f'biggest change: {fmt(p[0][1])} ({p[0][0]}) → {fmt(p[-1][1])} ({p[-1][0]})')
    if worse is None:
        return {'countries': [x['code'] for x in chosen], 'picks': chosen, 'measure': label, 'worse': None}
    ranked = sorted(recent.items(), key=lambda kv: kv[1][-1][1], reverse=(worse == 'higher'))
    for c, p in ranked:
        if len(chosen) == 3: break
        if c in {x['code'] for x in chosen} or SUBREGION.get(c) in used: continue
        take(c, f'{"highest" if worse == "higher" else "lowest"} latest: {fmt(p[-1][1])} ({p[-1][0]})')
    return {'countries': [x['code'] for x in chosen], 'picks': chosen, 'measure': label, 'worse': worse}

out = {}

# --- HDR indices (yearly series in countries.json) ---
HDR = {'gii': ('Gender Inequality Index', 'higher'), 'hdi': ('Human Development Index', 'lower'),
       'gdi': ('Gender Development Index (female ÷ male HDI)', 'lower'), 'ihdi': ('Inequality-adjusted HDI', 'lower'),
       'phdi': ('Planetary pressures-adjusted HDI', 'lower')}
for key, (label, worse) in HDR.items():
    series = {c['code']: [(y, v) for y, v in c['series'].get(key, [])] for c in countries}
    out[f'/indices/{key}'] = pick(series, worse, label)
out['/'] = out['/indices/gii']            # homepage is GII
out['/lab/hdr'] = out['/indices/gii']     # full HDR explorer opens on gender

# --- Snapshots (one recent value each) ---
snap = json.load(open('lib/index-snapshots.json'))
for key, label, worse in [('mpi', 'Multidimensional Poverty Index', 'higher'), ('ghi', 'Global Hunger Index', 'higher'), ('epi', 'Environmental Performance Index', 'lower')]:
    series = {}
    for r in snap[key]:
        series.setdefault(r['country'], []).append((r['year'], r['value']))
    out[f'/indices/{key}'] = pick(series, worse, label)

# --- IMF Financial Development Index (yearly to 2020) ---
fdi = json.load(open('lib/fdi-data.json'))
series = {}
for r in fdi: series.setdefault(r['country'], []).append((r['year'], r['fd']))
out['/indices/fdi'] = pick(series, 'lower', 'Financial Development Index')

# --- World Bank topics (live API; each topic's default measure) ---
def get_json(url, tries=3):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'ge-un-tyj-defaults/1.0'}), timeout=60) as r:
                return json.load(r)
        except Exception as e:
            if i == tries - 1: raise
def worldbank(code):
    series, page = {}, 1
    while True:
        meta, rows = get_json(f'https://api.worldbank.org/v2/country/all/indicator/{code}?format=json&per_page=20000&date=1990:2025&page={page}')
        for r in rows or []:
            if r['value'] is not None: series.setdefault(r['countryiso3code'], []).append((int(r['date']), float(r['value'])))
        if page >= meta['pages']: return series
        page += 1
WORSE = {'climate': 'higher', 'poverty': 'higher', 'food': 'higher', 'health': 'lower', 'education': 'lower', 'water': 'lower',
         'energy': 'lower', 'economy': 'lower', 'cities': None, 'peace': 'higher', 'conflict': 'higher'}
for t in json.load(open('lib/topics.json')):
    m = t['measures'][0]
    out[f"/topics/{t['id']}"] = pick(worldbank(m['code']), WORSE[t['id']], f"{m['label']} (World Bank {m['code']})")
out['/topics'] = out['/indices/gii']  # overview of all topics: same as the gender homepage

# --- UNICEF: women married before 18 (SDMX, all countries) ---
def unicef(code):
    d = get_json(f'https://sdmx.data.unicef.org/ws/public/sdmxapi/rest/data/UNICEF,GLOBAL_DATAFLOW,1.0/.{code}.?startPeriod=1990&endPeriod=2025&format=sdmx-json')
    root = d.get('data', d); st = root['structure']; sdims, odims = st['dimensions']['series'], st['dimensions']['observation']
    ai = [x['id'] for x in sdims].index('REF_AREA'); ti = [x['id'] for x in odims].index('TIME_PERIOD')
    extra = {x['id']: i for i, x in enumerate(sdims)}
    series = {}
    for ds in root['dataSets']:
        for key, sr in ds['series'].items():
            idx = [int(k) for k in key.split(':')]
            if 'SEX' in extra and sdims[extra['SEX']]['values'][idx[extra['SEX']]]['id'] not in ('F', '_T'): continue
            area = sdims[ai]['values'][idx[ai]]['id']
            for ok, obs in sr['observations'].items():
                year = int(odims[ti]['values'][int(ok.split(':')[ti])]['id'][:4])
                if obs[0] is not None: series.setdefault(area, []).append((year, float(obs[0])))
    return series
out['/unicef'] = pick(unicef('PT_F_20-24_MRD_U18'), 'higher', 'Women married before age 18 (UNICEF, latest survey per country)', recent_years=15)  # UNICEF's global dataset has only each country's latest survey, some from 2010-2012

# --- UN SDG 5.4.1: share of the day women spend on unpaid care and domestic work ---
areas = json.load(open('lib/sdg-geographies.json'))
m49 = {str(int(v)): k for k, v in areas.items()}
series, page, total = {}, 1, 1
while page <= total:
    d = get_json(f'https://unstats.un.org/SDGAPI/v1/sdg/Series/Data?seriesCode=SL_DOM_TSPD&pageSize=5000&page={page}')
    total = d['totalPages']
    for r in d['data']:
        dims = r.get('dimensions', {})
        if dims.get('Sex') != 'FEMALE' or dims.get('Location', 'ALLAREA') != 'ALLAREA' or dims.get('Age') not in ('15+', 'ALLAGE', '10+', '12+'): continue
        iso = m49.get(str(r.get('geoAreaCode')))
        v = r.get('value')
        try: v = float(v)
        except (TypeError, ValueError): continue
        if iso: series.setdefault(iso, []).append((int(float(r['timePeriodStart'])), v))
    page += 1
out['/sdg'] = pick(series, 'higher', 'Women’s time on unpaid care and domestic work (% of day, UN SDG 5.4.1)', recent_years=12)  # time-use surveys are infrequent

# --- ILO: women in senior and middle management ---
rows = get_json('https://rplumber.ilo.org/data/indicator?id=SDG_0552_NOC_RT_A&timefrom=1990&timeto=2025&format=.json&type=both&lang=en')
series = {}
for r in rows:
    if r.get('obs_value') is not None: series.setdefault(r['ref_area'], []).append((int(str(r['time'])[:4]), float(r['obs_value'])))
out['/employment'] = pick(series, 'lower', 'Women in senior and middle management (ILO)')

open('lib/default-countries.json', 'w').write(json.dumps(out, ensure_ascii=False, indent=1))
for path, d in out.items():
    print(f"{path:16s} {d['measure'][:40]:40s} " + ' | '.join(f"{p['name']} ({p['reason']})" for p in d['picks']))
