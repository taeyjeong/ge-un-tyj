import catalog from './topics.json' with {type:'json'};
import areas from './sdg-geographies.json' with {type:'json'};
import type {LiveRow} from './live-data';
export const topics=catalog;
export type Topic=typeof topics[number];
export type TopicMeasure=Topic['measures'][number];
export interface TopicQuery {topic:string;countries:string[];from:number;to:number}
export interface TopicRow extends LiveRow {indicator:string}
export interface TopicResult {rows:TopicRow[];sourceUrls:string[];queriedAt:string;updated:string;topic:string;countries:string[];from:number;to:number}
export function topicFor(id:string){return topics.find(t=>t.id===id);}
export function measuresFor(id:string){return id==='all'?topics.flatMap(t=>t.measures):topicFor(id)?.measures??[];}
export function parseTopicQuery(params:URLSearchParams):TopicQuery{
 const topic=params.get('topic')??'all';
 if(topic!=='all'&&!topicFor(topic))throw new Error('Choose a supported topic.');
 const countries=[...new Set((params.get('countries')??'JPN,KOR,USA').split(',').map(c=>c.trim().toUpperCase()).filter(Boolean))].sort();
 const limit=topic==='all'?5:60;
 if(!countries.length||countries.length>limit||countries.some(c=>!Object.hasOwn(areas,c)))throw new Error(`Choose 1–${limit} supported countries${topic==='all'?' for the overview':''}.`);
 const fromText=params.get('from')??'2000',toText=params.get('to')??'2025';
 const from=Number(fromText),to=Number(toText);
 if(!/^\d{4}$/.test(fromText)||!/^\d{4}$/.test(toText)||from<1960||to>2100||from>to||to-from>40)throw new Error('Choose a range of up to 41 years between 1960 and 2100.');
 return {topic,countries,from,to};
}
export function topicSourceUrl(query:TopicQuery,page=1){
 const url=new URL(`https://api.worldbank.org/v2/country/${encodeURIComponent(query.countries.join(';'))}/indicator/${encodeURIComponent(measuresFor(query.topic).map(m=>m.code).join(';'))}`);
 url.search=new URLSearchParams({source:'2',format:'json',date:`${query.from}:${query.to}`,per_page:'5000',footnote:'y',page:String(page)}).toString();return url;
}
export interface WorldBankRecord {indicator:{id:string;value:string};countryiso3code:string;date:string;value:number|null;unit?:string;obs_status?:string;decimal?:number;footnote?:string}
export function parseWorldBankPage(input:unknown){
 if(!Array.isArray(input)||input.length!==2||!input[0]||typeof input[0]!=='object')throw new Error('World Bank returned an unexpected response. Please retry later.');
 const meta=input[0] as Record<string,unknown>;
 const page=Number(meta.page),pages=Number(meta.pages),total=Number(meta.total);
 if(!Number.isInteger(page)||page<1||!Number.isInteger(pages)||pages<0||pages>10||!Number.isInteger(total)||total<0||total>50000)throw new Error('Invalid or oversized World Bank response. Try a smaller query.');
 if(input[1]===null&&total===0)return {page,pages,total,updated:String(meta.lastupdated??''),records:[] as WorldBankRecord[]};
 if(!Array.isArray(input[1])||input[1].length>5000)throw new Error('Invalid World Bank observations.');
 for(const r of input[1]){
  if(!r||typeof r!=='object'||typeof r.indicator?.id!=='string'||typeof r.countryiso3code!=='string'||typeof r.date!=='string'||!/^\d{4}$/.test(r.date)||(r.value!==null&&(typeof r.value!=='number'||!Number.isFinite(r.value))))throw new Error('Invalid World Bank observation values.');
 }
 return {page,pages,total,updated:String(meta.lastupdated??''),records:input[1] as WorldBankRecord[]};
}
export async function fetchTopicData(query:TopicQuery,get:(url:URL)=>Promise<unknown>):Promise<TopicResult>{
 const sourceUrls:string[]=[],records:WorldBankRecord[]=[];
 let pages=1,total=-1,updated='';
 for(let page=1;page<=pages;page++){
  const url=topicSourceUrl(query,page);sourceUrls.push(url.toString());const data=parseWorldBankPage(await get(url));
  if(data.page!==page||(total!==-1&&(data.total!==total||data.pages!==pages)))throw new Error('The source changed during pagination. Please reload the query.');
  pages=data.pages;total=data.total;updated=data.updated;records.push(...data.records);
 }
 if(records.length!==total)throw new Error('Incomplete World Bank response. Please reload the query.');
 const allowed=measuresFor(query.topic);const byCode=new Map(allowed.map(m=>[m.code,m]));
 const rows=records.filter(r=>query.countries.includes(r.countryiso3code)&&byCode.has(r.indicator.id)&&Number(r.date)>=query.from&&Number(r.date)<=query.to).map(r=>{
  const m=byCode.get(r.indicator.id)!;
  return {indicator:m.code,country:r.countryiso3code,year:Number(r.date),value:r.value,details:{Source:'World Bank · WDI',Footnote:r.footnote??'',Status:r.obs_status??'',Database_updated:updated}};
 }).sort((a,b)=>a.indicator.localeCompare(b.indicator)||a.country.localeCompare(b.country)||a.year-b.year);
 return {rows,sourceUrls,queriedAt:new Date().toISOString(),updated,...query};
}
export function latestTopicRows(rows:TopicRow[],indicator:string,countries:string[]){
 return countries.map(code=>rows.filter(r=>r.indicator===indicator&&r.country===code&&r.value!==null).reduce<TopicRow|null>((latest,r)=>!latest||r.year>latest.year?r:latest,null));
}
