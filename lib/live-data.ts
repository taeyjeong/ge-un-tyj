export const liveMeasures={
 sdg:{care:{name:'Time spent on unpaid domestic and care work',code:'SL_DOM_TSPD',unit:'% of a 24-hour day',description:'SDG 5.4.1. Compare women and men within the same age group and location. Survey definitions and years differ across countries.'}},
 unicef:{marriage18:{name:'Women married before age 18',code:'PT_F_20-24_MRD_U18',unit:'%',description:'Women aged 20–24 who were married or in union before age 18. Observation years can represent the end of survey fieldwork; reference periods are retained below.'},marriage15:{name:'Women married before age 15',code:'PT_F_20-24_MRD_U15',unit:'%',description:'Women aged 20–24 who were married or in union before age 15. These are survey observations, not annual estimates.'}}
} as const;
export type LiveSource=keyof typeof liveMeasures;
export interface LiveRow {country:string;year:number;value:number|null;details:Record<string,string>}
export interface LiveResult {rows:LiveRow[];sourceUrls:string[];queriedAt:string}
export function numeric(value:unknown):number|null {if(typeof value!=='number'&&typeof value!=='string')return null;if(String(value).trim()==='')return null;const n=Number(value);return Number.isFinite(n)?n:null;}
interface Code {id:string;name?:string}
interface Dimension {id:string;values:Code[]}
interface SdmxStructure {dimensions:{series:Dimension[];observation:Dimension[]};attributes:{series:Dimension[];observation:Dimension[];dataset:Dimension[]}}
export function decodeUnicef(input:unknown):LiveRow[]{
 const raw=input as {data?:unknown};const root=(raw.data??raw) as {structure:SdmxStructure;dataSets:{series:Record<string,{attributes?:number[];observations:Record<string,unknown[]>}>;attributes?:number[]}[]};
 if(!root.structure?.dimensions||!Array.isArray(root.dataSets))throw new Error('Unexpected UNICEF response format.');
 const rows:LiveRow[]=[];const structure=root.structure;
 function labels(defs:Dimension[],indices:unknown[]){return Object.fromEntries((defs??[]).flatMap((d,i)=>{const v=indices[i]==null?undefined:d.values[Number(indices[i])];return v?[[d.id,v.name??v.id]]:[];}));}
 for(const dataset of root.dataSets)for(const [key,series] of Object.entries(dataset.series??{}))for(const [obsKey,obs] of Object.entries(series.observations)){
 const seriesIndices=key.split(':').map(Number),obsIndices=obsKey.split(':').map(Number);
 const dimensions={...labels(structure.dimensions.series,seriesIndices),...labels(structure.dimensions.observation,obsIndices)};
 const codes=Object.fromEntries([...structure.dimensions.series.map((d,i)=>[d.id,d.values[seriesIndices[i]]?.id]),...structure.dimensions.observation.map((d,i)=>[d.id,d.values[obsIndices[i]]?.id])]);
 const year=Number(codes.TIME_PERIOD);if(!Number.isInteger(year))continue;
 rows.push({country:codes.REF_AREA,year,value:numeric(obs[0]),details:{...dimensions,...labels(structure.attributes.dataset,dataset.attributes??[]),...labels(structure.attributes.series,series.attributes??[]),...labels(structure.attributes.observation,obs.slice(1))}});
 }
 return rows;
}
