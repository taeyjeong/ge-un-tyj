import {NextRequest,NextResponse} from 'next/server';
import areas from '../../../lib/sdg-geographies.json';
import {decodeUnicef,liveMeasures,numeric,type LiveRow,type LiveSource} from '../../../lib/live-data';
export const runtime='nodejs';export const maxDuration=60;
export async function GET(request:NextRequest){
 const p=request.nextUrl.searchParams;const source=p.get('source') as LiveSource;const measure=p.get('measure')??(source==='sdg'?'care':'marriage18');
 const countries=[...new Set((p.get('countries')??'').split(','))];const from=Number(p.get('from')),to=Number(p.get('to'));
 if(!Object.hasOwn(liveMeasures,source??'')||!Object.hasOwn(liveMeasures[source],measure)||!countries.length||countries.length>60||countries.some(c=>!Object.hasOwn(areas,c))||!Number.isInteger(from)||!Number.isInteger(to)||from<1990||to>2100||from>to||to-from>40)return NextResponse.json({error:'Choose a supported measure, 1–60 countries, and a year range of up to 41 years (1990–2100).'},{status:400});
 const definition=liveMeasures[source][measure as never] as {code:string};const sourceUrls:string[]=[];
 async function get(url:URL){sourceUrls.push(url.toString());const r=await fetch(url,{next:{revalidate:86400},signal:AbortSignal.timeout(25000)});if(r.status===404&&source==='unicef')return null;if(!r.ok)throw new Error(`${source.toUpperCase()} returned HTTP ${r.status}. Try a smaller query or retry later.`);return r.json();}
 try{
 let rows:LiveRow[]=[];
 if(source==='unicef'){
 const url=new URL(`https://sdmx.data.unicef.org/ws/public/sdmxapi/rest/data/UNICEF,GLOBAL_DATAFLOW,1.0/${countries.join('+')}.${definition.code}.`);url.search=new URLSearchParams({startPeriod:String(from),endPeriod:String(to),format:'sdmx-json'}).toString();const data=await get(url);rows=data?decodeUnicef(data):[];
 }else{
 const reverse=Object.fromEntries(countries.map(c=>[String(Number(areas[c as keyof typeof areas])),c]));
 const url=new URL('https://unstats.un.org/SDGAPI/v1/sdg/Series/Data');url.searchParams.set('seriesCode',definition.code);countries.forEach(c=>url.searchParams.append('areaCode',String(Number(areas[c as keyof typeof areas]))));for(let year=from;year<=to;year++)url.searchParams.append('timePeriod',String(year));url.searchParams.set('pageSize','1000');
 for(let page=1,total=1;page<=total;page++){
 url.searchParams.set('page',String(page));const data=await get(url);if(!Array.isArray(data?.data)||!Number.isInteger(data.totalPages))throw new Error('Unexpected UN SDG response format.');total=data.totalPages;if(total>10)throw new Error('Too many observations. Choose fewer countries or a shorter range.');
 rows.push(...data.data.map((r:Record<string,unknown>)=>({country:reverse[String(r.geoAreaCode)],year:Number(r.timePeriodStart),value:numeric(r.value),details:{...r.dimensions as Record<string,string>,...r.attributes as Record<string,string>,Source:String(r.source??''),Footnotes:Array.isArray(r.footnotes)?r.footnotes.join(' · '):'',Reference_period:String(r.timeCoverage??''),Lower_bound:String(r.lowerBound??''),Upper_bound:String(r.upperBound??'')}})));
 }
 }
 rows=rows.filter(r=>countries.includes(r.country)&&r.year>=from&&r.year<=to).sort((a,b)=>a.country.localeCompare(b.country)||a.year-b.year);
 return NextResponse.json({rows,sourceUrls,queriedAt:new Date().toISOString()});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to fetch data. Please retry.',sourceUrls},{status:502});}
}
