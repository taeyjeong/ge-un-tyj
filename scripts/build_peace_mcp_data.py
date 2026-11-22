"""Build lib/peace-mcp-data.json for the /api/mcp endpoint from the project CSVs in public/peace-agreements.

Run from the repo root:  python3 scripts/build_peace_mcp_data.py   (needs pandas)
"""
import json, pandas as pd
P = "public/peace-agreements/"
pax = pd.read_csv(P + "gender-provisions-in-peace-agreements.csv", low_memory=False)
padd = pd.read_csv(P + "padd-agreement-level.csv")
dele = pd.read_csv(P + "padd-delegate-level.csv", low_memory=False)
cfr = pd.read_csv(P + "cfr-womens-participation-73-processes.csv")
match = pd.read_csv(P + "cfr-to-pax-match.csv")

def clean(v):
    if isinstance(v, float) and pd.isna(v): return None
    if hasattr(v, "item"): v = v.item()
    return v

women_roles = dele[dele.FemTrack1 == 1].groupby("AgtId").Pos_Smp.agg(lambda s: sorted(set(s.dropna())))
padd_by = {}
for _, r in padd.iterrows():
    roles = women_roles.get(r.AgtId, [])
    group = "Woman signatory" if "Sig" in roles else ("Women present, none signed" if roles else "No women named")
    padd_by[int(r.AgtId)] = {k: clean(r[k]) for k in ["Del_N", "FemDel_N", "FemDel_P", "Sig_N", "FemSig_N", "FemSig_P", "Neg_N", "FemNeg_N", "FemNeg_P"]} | {"women_roles": roles, "role_group": group}

c = cfr.merge(match, on="slug")
cfr_by = {}
for _, r in c.iterrows():
    a = int(r.pax_AgtId)
    if a in cfr_by: continue
    cfr_by[a] = {"slug": r.slug, "url": r.url, "process_type": clean(r.process_type), "negotiators_pct": clean(r.negotiators_pct),
                 "mediators_pct": clean(r.mediators_pct), "signatories_pct": clean(r.signatories_pct), "parliament_pct": clean(r.parliament_pct)}

STAGE = {"Pre": "Pre-negotiation", "SubPar": "Partial substantive", "SubComp": "Comprehensive", "Imp": "Implementation", "Ren": "Renewal", "Cea": "Ceasefire", "Oth": "Other"}
LEVEL = {"Inter": "Interstate", "InterIntra": "Interstate about an internal conflict", "Intra": "Within one country (national)", "IntraLocal": "Within one country (local)"}
rows = []
for _, r in pax.iterrows():
    a = int(r.AgtId)
    tp = str(r.ThrdPart) if isinstance(r.ThrdPart, str) else ""
    rows.append({"id": a, "name": r.Agt, "date": r.Dat, "year": int(str(r.Dat)[:4]) if isinstance(r.Dat, str) else None,
                 "country": r.Con, "region": r.Reg, "process": clean(r.PPName), "stage": STAGE.get(r.Stage, r.Stage),
                 "conflict_type": clean(r.Contp), "agreement_level": LEVEL.get(r.Agtp, r.Agtp),
                 "mentions_women": bool(r.GeWom > 0), "un_signed": bool(r.ImUN == 1), "other_intl_signed": bool(r.ImOth == 1),
                 "third_party": tp.strip()[:300] or None, "padd": padd_by.get(a), "cfr": cfr_by.get(a)})
out = {"source": "PA-X v10 (2,257 agreements) + PADD 1.0 (116) + CFR tracker (73 pages, 47 matched)", "agreements": rows,
       "cfr_unmatched": [{"slug": r.slug, "country": r.country, "agreement": clean(r.agreement), "process_type": clean(r.process_type),
                          "negotiators_pct": clean(r.negotiators_pct), "url": r.url} for _, r in cfr[~cfr.slug.isin(match.slug)].iterrows()]}
json.dump(out, open("lib/peace-mcp-data.json", "w"), ensure_ascii=False, separators=(",", ":"))
print(len(rows), "agreements |", sum(1 for x in rows if x["padd"]), "with PADD |", sum(1 for x in rows if x["cfr"]), "with CFR |", len(out["cfr_unmatched"]), "CFR pages without a PA-X match")
