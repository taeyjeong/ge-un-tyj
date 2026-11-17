import type {IndexObservation} from '../../lib/index-data';
export function numericRow(row:IndexObservation):row is IndexObservation&{value:number}{return row.value!==null&&Number.isFinite(row.value);}
export function latestCountryRows(rows:IndexObservation[],codes:string[],from:number,to:number){
 return codes.map(code=>rows.filter(r=>r.country===code&&r.year>=from&&r.year<=to).sort((a,b)=>b.year-a.year)[0]).filter((r):r is IndexObservation=>!!r);
}
export function previousObservation(rows:IndexObservation[],row:IndexObservation){return rows.filter(r=>r.country===row.country&&r.year<row.year&&numericRow(r)).sort((a,b)=>b.year-a.year)[0];}
export function indexChange(current:number|null,previous:number|null|undefined){return current===null||previous===null||previous===undefined?null:current-previous;}
export function reportHref(index:string,countries:string[]){return '/indices-redone?'+new URLSearchParams({index,countries:countries.join(',')}).toString();}
export function csvRows(rows:IndexObservation[],name:(code:string)=>string){return [['Country','Code','Year / edition','Score','Published display','Period','Notes'],...rows.map(r=>[name(r.country),r.country,r.year,r.value,r.display,r.period,r.note])].map(row=>row.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\r\n');}
