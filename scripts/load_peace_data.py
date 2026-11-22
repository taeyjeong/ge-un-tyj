"""Load the peace agreements CSVs (public/peace-agreements/) into the Supabase tables made by
supabase/migrations/20261122000300_peace_data_tables.sql. The CSVs stay the source of truth: re-run
this after replacing a CSV. It upserts every row, so running it twice is safe.

Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local (the secret key is never printed).
Run from the repo root:  ../DataScience/.venv/bin/python scripts/load_peace_data.py
"""
import json, math, urllib.request, pandas as pd
from types import SimpleNamespace

env = dict(l.split('=', 1) for l in open('.env.local').read().splitlines() if '=' in l and not l.startswith('#'))
URL, KEY = env['NEXT_PUBLIC_SUPABASE_URL'].strip().strip('"'), env['SUPABASE_SECRET_KEY'].strip().strip('"')
DIR = 'public/peace-agreements/'

def clean(v):
    if v is None or (isinstance(v, float) and math.isnan(v)) or v == 'NA': return None
    if hasattr(v, 'item'): v = v.item()  # numpy -> python
    if isinstance(v, float) and v.is_integer() and abs(v) < 2**31: return int(v)
    return v
def num(v): v = clean(v); return None if v is None else float(v)
def int_(v): v = clean(v); return None if v is None else int(float(v))
def flag(v): v = clean(v); return None if v is None else bool(int(float(v)))
def raw(row): return {k: clean(v) for k, v in row.items()}

def upsert(table, rows, key):
    for i in range(0, len(rows), 500):
        body = json.dumps(rows[i:i + 500]).encode()
        req = urllib.request.Request(f'{URL}/rest/v1/{table}?on_conflict={key}', data=body, method='POST', headers={
            'apikey': KEY, 'Authorization': f'Bearer {KEY}', 'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates,return=minimal'})
        urllib.request.urlopen(req, timeout=120).read()
    print(f'{table}: {len(rows)} rows')

STAGE = {'Pre': 'Pre-negotiation', 'SubPar': 'Partial substantive', 'SubComp': 'Comprehensive', 'Imp': 'Implementation',
         'Ren': 'Renewal', 'Cea': 'Ceasefire', 'Oth': 'Other'}
POSITION = {'Sig': 'signatory', 'Neg': 'negotiator', 'Ob': 'observer', 'Med': 'mediator', 'Adv': 'adviser',
            'Log': 'support staff', 'WomCom': "women's committee", 'Unknown': 'unknown'}

pax = pd.read_csv(DIR + 'gender-provisions-in-peace-agreements.csv', low_memory=False)
upsert('pax_agreements', [{
    'agt_id': int(r.AgtId), 'name': r.Agt, 'signed_on': clean(r.Dat), 'year': int(str(r.Dat)[:4]) if clean(r.Dat) else None,
    'country': clean(r.Con), 'region': clean(r.Reg), 'process_id': int_(r.PP), 'process_name': clean(r.PPName),
    'conflict_type': clean(r.Contp), 'agreement_level': clean(r.Agtp), 'stage': clean(r.Stage), 'stage_label': STAGE.get(r.Stage),
    'status': clean(r.Status), 'pages': int_(r.Lgt), 'n_characters': int_(r.N_characters), 'parties': clean(r.Part),
    'third_parties': clean(r.ThrdPart), 'country_iso3': clean(r.Loc1ISO), 'country2_iso3': clean(r.Loc2ISO),
    'mentions_women': (int_(r.GeWom) or 0) > 0, 'gewom': int_(r.GeWom), 'un_signatory': flag(r.ImUN),
    'other_intl_signatory': flag(r.ImOth), 'peacekeeping': flag(r.ImPK), 'ucdp_conflict': None if clean(r.UcdpCon) is None else str(clean(r.UcdpCon)),
    'pam_agreement': None if clean(r.PamAgr) is None else str(clean(r.PamAgr)), 'raw': raw(vars(r))}
    for r in (SimpleNamespace(**d) for d in pax.to_dict('records'))], 'agt_id')

padd = pd.read_csv(DIR + 'padd-agreement-level.csv', encoding='utf-8-sig')
def group(r):
    if (int_(r['FemSig_N']) or 0) > 0: return 'Woman signatory'
    if (int_(r['FemDel_N']) or 0) > 0: return 'Women present, none signed'
    return 'No women named'
upsert('padd_agreements', [{
    'agt_id': int(r['AgtId']), 'delegates': int_(r['Del_N']), 'women_delegates': int_(r['FemDel_N']), 'pct_women_delegates': num(r['FemDel_P']),
    'signatories': int_(r['Sig_N']), 'women_signatories': int_(r['FemSig_N']), 'pct_women_signatories': num(r['FemSig_P']),
    'negotiators': int_(r['Neg_N']), 'women_negotiators': int_(r['FemNeg_N']), 'pct_women_negotiators': num(r['FemNeg_P']),
    'mediators': int_(r['Med_N']), 'women_mediators': int_(r['FemMed_N']), 'observers': int_(r['Ob_N']), 'women_observers': int_(r['FemOb_N']),
    'women_role_group': group(r), 'raw': raw(r.to_dict())} for _, r in padd.iterrows()], 'agt_id')

dele = pd.read_csv(DIR + 'padd-delegate-level.csv', encoding='utf-8-sig', low_memory=False)
upsert('padd_delegates', [{
    'id': i + 1, 'agt_id': int(r['AgtId']), 'name': clean(r['Name']), 'position_simple': clean(r['Pos_Smp']),
    'position_label': POSITION.get(r['Pos_Smp']), 'position_detail': clean(r['Pos_Dtl']), 'title': clean(r['Title']),
    'affiliation': clean(r['Affiliation']), 'is_woman': flag(r['FemTrack1'])} for i, (_, r) in enumerate(dele.iterrows())], 'id')

cfr = pd.read_csv(DIR + 'cfr-womens-participation-73-processes.csv')
match = dict(pd.read_csv(DIR + 'cfr-to-pax-match.csv').dropna().astype({'pax_AgtId': int}).values.tolist())
def tf(v): v = clean(v); return None if v is None else str(v).lower() == 'true'
upsert('cfr_processes', [{
    'slug': r['slug'], 'url': r['url'], 'country': clean(r['country']), 'agreement': clean(r['agreement']), 'process_type': clean(r['process_type']),
    'negotiators_pct': num(r['negotiators_pct']), 'mediators_pct': num(r['mediators_pct']), 'signatories_pct': num(r['signatories_pct']),
    'parliament_year': None if clean(r['parliament_year']) is None else str(clean(r['parliament_year'])), 'parliament_pct': num(r['parliament_pct']),
    'ref_women_girls_gender': tf(r['ref_women_girls_gender']), 'ref_violence_against_women': tf(r['ref_violence_against_women']),
    'negotiating_parties': clean(r['negotiating_parties']), 'third_parties': clean(r['third_parties']),
    'list_page_negotiators': num(r['list_page_negotiators']), 'pax_agt_id': match.get(r['slug'])} for _, r in cfr.iterrows()], 'slug')
