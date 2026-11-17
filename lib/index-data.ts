import data from './countries.json';
import snapshots from './index-snapshots.json';
import financial from './fdi-data.json';
import {inputsForIndex,type IndexId} from './indices';
import type {Country,Observation} from './types';
export interface IndexObservation {country:string;year:number;value:number|null;display:string;period:string;inputs:Record<string,number|null>;inputDisplays?:Record<string,string>;note:string;scores?:Record<string,number|null>}
export function indexPageData(id:IndexId){
 const fields=inputsForIndex(id).map(f=>f.key);const metrics=[...new Set([id,'hdi',...fields])];
 const countries:Country[]=data.map(c=>({...c,series:Object.fromEntries(metrics.map(key=>[key,(c.series as Record<string,(number|null)[][]>)[key]?.map(([y,v]):Observation=>[y!,v])??[]]))}));
 if(id==='fdi')for(const [code,name,iso2,geographicalRegion] of [['ABW','Aruba','AW','Caribbean'],['MAC','Macao','MO','Eastern Asia'],['PYF','French Polynesia','PF','Polynesia']])countries.push({code,name,iso2,geographicalRegion,developmentGroup:'Not classified in HDR data',developingRegion:'Not classified in HDR data',series:{}});
 if(id==='epi')countries.push({code:'TWN',name:'Taiwan',iso2:'TW',developmentGroup:'Not classified in HDR data',developingRegion:'Not classified in HDR data',geographicalRegion:'Eastern Asia',series:Object.fromEntries(metrics.map(key=>[key,[]]))});
 const rows:IndexObservation[]=id==='fdi'?financial.map(r=>({country:r.country,year:r.year,value:r.fd,display:r.fd.toFixed(3),period:String(r.year),inputs:{fid:r.fid,fia:r.fia,fie:r.fie,fmd:r.fmd,fma:r.fma,fme:r.fme},scores:{FI:r.fi,FM:r.fm},note:'IMF published annual indices. This retrieved release ends in 2020; reconstruction parameters are calibrated to the published sub-index relationships.'})):id==='mpi'||id==='ghi'||id==='epi'?(snapshots[id] as IndexObservation[]):countries.flatMap(c=>(c.series[id]??[]).map(([year,value])=>({country:c.code,year,value,display:value===null?'Unavailable':String(value),period:String(year),inputs:Object.fromEntries(fields.map(f=>[f,c.series[f]?.find(([y])=>y===year)?.[1]??null])),note:'UNDP HDR 2025 release. Chart values are reported scores; reconstruction uses published rounded inputs.'})));
 return {countries:countries.sort((a,b)=>a.name.localeCompare(b.name)),rows};
}
