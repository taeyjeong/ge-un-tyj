"""Create a compact, attributed IMF FDI extract and audited reconstruction parameters.
Usage: python3 scripts/prepare-fdi.py /path/to/official-sdmx-response.csv
Fetch URL: https://api.imf.org/external/sdmx/2.1/data/IMF.MCM,FDI/all
The source is a large SDMX CSV with repeated metadata. Only observation columns are
copied into the compact CSV; the original response SHA256 and URL are recorded.
"""
import csv,json,sys,collections,hashlib,math
from pathlib import Path
root=Path(__file__).resolve().parent.parent
source=Path(sys.argv[1]);series=collections.defaultdict(dict);meta={}
keys={'FD_IX':'fd','FI_IX':'fi','FM_IX':'fm','FDD_IX':'fid','FDA_IX':'fia','FDE_IX':'fie','FMD_IX':'fmd','FMA_IX':'fma','FME_IX':'fme'}
with source.open(newline='',encoding='utf-8-sig') as f:
 for r in csv.DictReader(f):
  area=r['COUNTRY'];year=int(r['TIME_PERIOD']);indicator=r['INDICATOR']
  if len(area)!=3 or not area.isalpha():continue # exclude IMF regional aggregates
  if indicator not in keys:raise ValueError('Unknown IMF indicator '+indicator)
  value=float(r['OBS_VALUE']) if r['OBS_VALUE'] else None
  if value is not None and (not math.isfinite(value) or not 0<=value<=1):raise ValueError('Invalid IMF score')
  key=area,year;field=keys[indicator]
  if field in series[key]:raise ValueError('Duplicate country-year-indicator')
  series[key][field]=value
  meta={'dataflow':r['DATAFLOW'],'source':'International Monetary Fund','license':r.get('LICENSE',''),'citation':r.get('SUGGESTED_CITATION','')}
if not series:raise ValueError('No country observations found')
def solve(a,b):
 m=[r[:]+[v] for r,v in zip(a,b)];n=len(b)
 for i in range(n):
  k=max(range(i,n),key=lambda k:abs(m[k][i]));m[i],m[k]=m[k],m[i]
  if abs(m[i][i])<1e-12:raise ValueError('Singular reconstruction fit')
  p=m[i][i];m[i]=[v/p for v in m[i]]
  for j in range(n):
   if j!=i:
    p=m[j][i];m[j]=[v-p*w for v,w in zip(m[j],m[i])]
 return [m[i][-1] for i in range(n)]
parameters={}
for target,fields in [('fi',['fid','fia','fie']),('fm',['fmd','fma','fme']),('fd',['fi','fm'])]:
 pairs=[([1]+[d[k] for k in fields],d[target]) for d in series.values() if all(d.get(k) is not None for k in fields+[target])];n=len(fields)+1
 coef=solve([[sum(x[i]*x[j] for x,y in pairs) for j in range(n)] for i in range(n)],[sum(x[i]*y for x,y in pairs) for i in range(n)])
 error=max(abs(sum(a*b for a,b in zip(x,coef))-y) for x,y in pairs)
 if error>1e-6:raise ValueError('Published indices no longer match an affine aggregation: '+target)
 total=sum(coef[1:]);weights={field:c/total for field,c in zip(fields,coef[1:])}
 if any(w<0 for w in weights.values()):raise ValueError('Invalid reconstruction weights')
 parameters[target]={'weights':weights,'minimum':-coef[0]/total,'maximum':(1-coef[0])/total,'maxAbsoluteError':error,'observations':len(pairs)}
rows=[{'country':c,'year':y,**d} for (c,y),d in sorted(series.items())]
(root/'lib/fdi-data.json').write_text(json.dumps(rows,separators=(',',':'))+'\n')
(root/'lib/fdi-reconstruction.json').write_text(json.dumps({'method':'Affine least-squares reconstruction of published IMF sub-index relationships; parameters inferred from this extract, not official published PCA loadings.','normalization':'Weighted mean followed by min-max normalization, as described by IMF WP/16/5.','sample':'All individual-country observations in the downloaded dataflow, excluding IMF regional aggregates.','parameters':parameters},indent=2)+'\n')
output=root/'public/index-sources/fdi-imf-extract.csv'
with output.open('w',newline='') as f:
 writer=csv.DictWriter(f,fieldnames=['country','year',*keys.values()]);writer.writeheader();writer.writerows(rows)
manifest={'url':'https://api.imf.org/external/sdmx/2.1/data/IMF.MCM,FDI/all','download':'/index-sources/fdi-imf-extract.csv','metadataUrl':'https://data.imf.org/Datasets/FDI','retrievedDate':'2026-11-17','sourceResponseSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'extractSha256':hashlib.sha256(output.read_bytes()).hexdigest(),'rows':len(rows),'countries':len(set(c for c,y in series)),'from':min(y for c,y in series),'to':max(y for c,y in series),**meta}
(root/'lib/fdi-source.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Extract:',manifest['rows'],'country-years;',manifest['countries'],'countries;',manifest['from'],'to',manifest['to']);print('Reconstruction residuals:',{k:v['maxAbsoluteError'] for k,v in parameters.items()})
