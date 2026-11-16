'use client';
import {useState} from 'react';
import {flagFor,formatValue,indicatorFor,indicators,observations,type Country,type GraphSettings} from '../lib/types';
type TableMode='latest'|'annual'|'all';
export default function DataTable({countries,settings}:{countries:Country[];settings:GraphSettings}){
 const [mode,setMode]=useState<TableMode>('latest');
 const [year,setYear]=useState(2023);
 const years=Array.from({length:settings.endYear-settings.startYear+1},(_,index)=>settings.startYear+index);
 const metadata=['Country','ISO3','Development group','Developing region','Geographical region'];
 const headers=[...metadata,...(mode==='latest'?['Year',indicatorFor(settings.metric).name]:mode==='annual'?years.map(String):indicators.map(indicator=>`${indicator.name} (${indicator.prefix})`))];
 const rows=countries.map(country=>{
  const meta=[country.name,country.code,country.developmentGroup,country.developingRegion,country.geographicalRegion];
  const points=observations(country,settings);
  const latest=points.filter(([,value])=>value!==null).at(-1);
  const numbers=mode==='latest'?[latest?.[0]??'—',latest?.[1]??'—']:mode==='annual'?points.map(([,value])=>value??'—'):indicators.map(indicator=>country.series[indicator.prefix].find(([observationYear])=>observationYear===year)?.[1]??'—');
  return {country,cells:[...meta,...numbers]};
 });
 function download(){
  const escape=(value:string|number)=>`"${String(value).replaceAll('"','""')}"`;
  const csv=[headers,...rows.map(row=>row.cells)].map(row=>row.map(escape).join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob(['\uFEFF',csv],{type:'text/csv;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download=`hdr-${mode==='all'?`all-measures-${year}`:`${settings.metric}-${mode}`}.csv`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 return <section className="data-section"><div className="data-heading"><div><div className="eyebrow">LOOK AT THE NUMBERS</div><h2>Data preview</h2></div><button className="button secondary" disabled={!countries.length} onClick={download}>Download this view ↓</button></div><div className="table-controls"><label>Show<select value={mode} onChange={event=>setMode(event.target.value as TableMode)}><option value="latest">Latest values in graph range</option><option value="annual">Selected measure · every year</option><option value="all">All 40 measures · one year</option></select></label>{mode==='all'&&<label>Data year<select value={year} onChange={event=>setYear(Number(event.target.value))}>{Array.from({length:34},(_,index)=>1990+index).map(value=><option key={value}>{value}</option>)}</select></label>}</div><p className="muted">{mode==='all'?`All measures for ${year}; graph indicator and year-range settings do not limit this view.`:`${indicatorFor(settings.metric).name} · ${settings.startYear}–${settings.endYear}.`}{' '}Includes only selected countries. “—” means unavailable.</p><div className="table-wrap data-scroll" tabIndex={0} role="region" aria-label="Scrollable data preview"><table><caption className="sr-only">{countries.length} countries · {mode} observations</caption><thead><tr>{headers.map((header,index)=><th scope="col" key={`${header}-${index}`}>{header}</th>)}</tr></thead><tbody>{rows.map(({country,cells})=><tr key={country.code}>{cells.map((value,index)=>index===0?<th scope="row" key={index}><span aria-hidden="true">{flagFor(country.iso2)} </span>{value}</th>:<td key={index}>{typeof value==='number'?formatValue(value,index===5&&mode==='latest'?'hdi_rank':mode==='all'?indicators[index-5]?.prefix??settings.metric:settings.metric):value}</td>)}</tr>)}</tbody></table>{!countries.length&&<p className="empty">Select countries to inspect their values.</p>}</div></section>;
}
