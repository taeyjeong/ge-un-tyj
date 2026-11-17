"""Extract official 2026 MPI/GHI/EPI workbooks without changing original files.
Run from the project root. Sources and SHA256 hashes are written into the manifest.
"""
import json,re,unicodedata,sys,hashlib,importlib.util
from pathlib import Path
sys.dont_write_bytecode=True
spec=importlib.util.spec_from_file_location('workbook',Path(__file__).with_name('read-index-workbook.py'));reader=importlib.util.module_from_spec(spec);spec.loader.exec_module(reader)
root=Path(__file__).resolve().parent.parent
countries=json.loads((root/'lib/countries.json').read_text())
def norm(s):return re.sub('[^a-z0-9]','',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower())
lookup={norm(c['name']):c['code'] for c in countries}
aliases={'Bolivia':'BOL','Congo, Dem. Rep.':'COD','Congo, Rep.':'COG','Congo (Democratic Republic of the)':'COD','Congo':'COG','Côte d’Ivoire':'CIV','Iran':'IRN','Korea, North':'PRK','Korea, Dem. People’s Rep.':'PRK','Korea, Dem. People\'s Rep.':'PRK','Lao PDR':'LAO','Laos':'LAO','Micronesia':'FSM','Moldova':'MDA','Russia':'RUS','Syria':'SYR','Tanzania':'TZA','Türkiye':'TUR','Turkey':'TUR','Venezuela':'VEN','Vietnam':'VNM','Viet Nam':'VNM','Palestine, State of':'PSE','State of Palestine':'PSE','Swaziland':'SWZ','Eswatini (Kingdom of)':'SWZ','Bosnia & Herzegovina':'BIH','Central African Rep.':'CAF','Timor Leste':'TLS','Gambia, The':'GMB','Kyrgyz Republic':'KGZ','Egypt, Arab Rep.':'EGY','Yemen, Rep.':'YEM','São Tomé and Príncipe':'STP','Sao Tome & Principe':'STP','Trinidad & Tobago':'TTO','St. Lucia':'LCA','St. Vincent & Grenadines':'VCT','Sao Tome and Principe':'STP'}
aliases.update({'Bolivia (Plurinat. State of)':'BOL','Congo (Republic of)':'COG','Dem. Rep. of the Congo':'COD','Eswatini':'SWZ','Korea (DPR)':'PRK','Moldova (Rep. of)':'MDA','Naoero':'NRU','Tanzania (United Rep. of)':'TZA','Venezuela (Boliv. Rep. of)':'VEN'})
lookup.update({norm(k):v for k,v in aliases.items()})
def simple(row):return {re.sub(r'\d','',k):v for k,v in row.items()}
def num(v):return v if isinstance(v,(float,int)) and not isinstance(v,bool) else None
unmatched=set()
aggregates={norm(s) for s in ['Arab States','Developing countries','East Asia and the Pacific','Europe and Central Asia','Latin America and the Caribbean','Small Island Developing States','South Asia','Sub-Saharan Africa']}
def code(name):
 if norm(str(name)) in aggregates:return None
 c=lookup.get(norm(str(name)))
 if not c:unmatched.add(str(name))
 return c
records={k:[] for k in ['mpi','ghi','epi']}
mpi=dict(reader.sheets(root/'public/index-sources/mpi-2026.xlsx'))
for raw in mpi['gMPI2026_Table1']:
 r=simple(raw)
 if num(r.get('D')) is None or num(r.get('F')) is None:continue
 c=code(r.get('A',''))
 if not c:continue
 records['mpi'].append(dict(country=c,year=2026,value=r['D'],display=str(round(r['D'],6)),period=str(r.get('B','')),inputs={'headcount':num(r.get('F')),'intensity':num(r.get('L'))},note='2026 release, latest survey in Table 1. Survey periods differ by country. '+('Source footnote codes: '+', '.join(str(r[k]) for k in ['C','E','G','M'] if r.get(k)) if any(r.get(k) for k in ['C','E','G','M']) else '')))
ghi=dict(reader.sheets(root/'public/index-sources/ghi-2026.xlsx'))
inputs={}
input_displays={}
for raw in ghi['GHI Indicator Values 2026']:
 r=simple(raw)
 if not r.get('A') or not any(num(r.get(k)) is not None for k in ['B','C','D','E','F']):continue
 c=code(r['A'])
 if c:
  for year,cols in [(2000,['B','G','Q','AA']),(2006,['C','I','S','AB']),(2012,['D','K','U','AC']),(2018,['E','M','W','AD']),(2026,['F','O','Y','AE'])]:
   inputs[c,year]={key:num(r.get(col)) for key,col in zip(['undernourishment','wasting','stunting','mortality'],cols)}
   input_displays[c,year]={key:str(r.get(col,'')) for key,col in zip(['undernourishment','wasting','stunting','mortality'],cols)}
for raw in ghi['GHI Ranking 2026']:
 r=simple(raw)
 if not r.get('C') or not any(num(r.get(k)) is not None or str(r.get(k))=='<5' for k in ['D','E','F','G','H']):continue
 c=code(r['C'])
 if not c:continue
 for year,col in [(2000,'D'),(2006,'E'),(2012,'F'),(2018,'G'),(2026,'H')]:
  v=r.get(col);display=str(v) if isinstance(v,(int,float)) or str(v)=='<5' else 'Unavailable'
  records['ghi'].append(dict(country=c,year=year,value=num(v),display=display,period='Reference score '+str(year)+' in the 2026 edition',inputs=inputs.get((c,year),{}),inputDisplays=input_displays.get((c,year),{}),note='2026 edition comparable reference scores; not annual observations. '+('Score is censored below 5, not an exact numeric value. ' if str(v)=='<5' else '')+('2026 components: undernourishment 2023–2025; wasting 2021–2025; stunting and mortality 2024.' if year==2026 else 'Components refer to the source reference windows for this score.')))
epi=dict(reader.sheets(root/'public/index-sources/epi-2026.xlsx'))['data']
header={re.sub(r'\d','',k):v for k,v in epi[0].items()}
for raw in epi[1:]:
 r={header.get(k,k):v for k,v in simple(raw).items()}
 if not re.fullmatch('[A-Z]{3}',str(r.get('iso',''))):continue
 v=num(r.get('EPI.new'))
 if v is None:continue
 records['epi'].append(dict(country=r['iso'],year=2026,value=v,display=str(v),period='2026 edition; underlying indicator years vary',inputs={k:num(r.get(col+'.new')) for k,col in [('health','HLT'),('ecosystems','ECO'),('climate','PCC')]},scores={k[:-4]:num(value) for k,value in r.items() if k.endswith('.new')},note='2026 EPI edition snapshot, not a measurement for calendar 2026. Do not combine separate EPI editions into an annual trend.'))
methods=dict(reader.sheets(root/'public/index-sources/epi_methods-2026.xlsx'))
weights=[simple(r) for r in methods['Weights'][1:]];attributes={simple(r).get('A'):simple(r) for r in methods['Variable attributes'][1:]}
methodrows=[]
for r in weights:
 if r.get('A')!='Indicator':continue
 a=attributes.get(r.get('B'),{})
 methodrows.append(dict(code=r['B'],label=r.get('C',''),category=r.get('E',''),objective=r.get('F',''),parent=r.get('D',''),weight=num(r.get('G')),globalWeight=num(r.get('H')),unit=str(a.get('E','')),polarity=str(a.get('F','')),transform=str(a.get('G','')),alpha=num(a.get('H')),good=num(a.get('K')),bad=num(a.get('L')),materiality=str(a.get('O','')),latestYear=a.get('P'),baselineYear=a.get('Q')))
if unmatched:raise ValueError('Unmapped source countries: '+', '.join(sorted(unmatched)))
(root/'lib/index-snapshots.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n')
(root/'lib/epi-methods.json').write_text(json.dumps(methodrows,ensure_ascii=False,indent=2)+'\n')
urls={'mpi':'https://hdr.undp.org/sites/default/files/publications/additional-files/2026-10/2026_gMPI_Table1and2.xlsx','ghi':'https://www.globalhungerindex.org/xlsx/2026.xlsx','epi':'https://epi.yale.edu/sites/default/files/2026-09/epi2026results2026-07-07.xlsx','epi_methods':'https://epi.yale.edu/sites/default/files/2026-09/epi2026methods.xlsx'}
manifest={k:{'url':url,'file':'/index-sources/'+k+'-2026.xlsx','sha256':hashlib.sha256((root/'public/index-sources'/f'{k}-2026.xlsx').read_bytes()).hexdigest()} for k,url in urls.items()}
(root/'lib/index-sources.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Records:',{k:len(v) for k,v in records.items()},'EPI indicator methods:',len(methodrows));print('Unmatched names:',sorted(unmatched))
