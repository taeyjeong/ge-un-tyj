'use client';
import {useEffect,useReducer,useRef} from 'react';
import {chartInteractionReducer,countryOpacity} from '../lib/chart-interaction';
import {colorFor,type Country} from '../lib/types';
import type {TopicRow} from '../lib/topics';
export default function TopicLineChart({rows,countries,unit,from,to,zero}:{rows:TopicRow[];countries:Country[];unit:string;from:number;to:number;zero:boolean}){
 const [interaction,dispatch]=useReducer(chartInteractionReducer<TopicRow>,{hovered:null,pinned:null});
 const detail=interaction.pinned??interaction.hovered,pinned=!!interaction.pinned;
 const root=useRef<HTMLDivElement>(null);
 const countryKey=countries.map(country=>country.code).join(',');
 useEffect(()=>{dispatch({type:'dismiss'});},[from,to,unit,countryKey,rows[0]?.indicator]);
 useEffect(()=>{
  const close=(event:PointerEvent)=>{const target=event.target;if(target instanceof Element&&root.current?.contains(target)&&target.closest('[data-chart-point],[data-chart-details]'))return;dispatch({type:'dismiss'});};
  const escape=(event:globalThis.KeyboardEvent)=>{if(event.key==='Escape')dispatch({type:'dismiss'});};
  document.addEventListener('pointerdown',close);document.addEventListener('keydown',escape);
  return()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',escape);};
 },[]);
 const values=rows.flatMap(r=>r.value===null?[]:[r.value]);
 if(!values.length)return <p className="empty">No numeric observations for this measure and these filters. Missing data is not zero.</p>;
 let low=Math.min(...values),high=Math.max(...values);if(zero){low=Math.min(0,low);high=Math.max(0,high);}if(low===high){const pad=Math.abs(low)*.05||1;low-=pad;high+=pad;}
 const left=85,right=925,top=30,bottom=330;
 const x=(year:number)=>from===to?(left+right)/2:left+(year-from)/(to-from)*(right-left);
 const y=(value:number)=>bottom-(value-low)/(high-low)*(bottom-top);
 const format=(v:number)=>v.toLocaleString(undefined,{notation:Math.abs(v)>=100000?'compact':'standard',maximumFractionDigits:2});
 const years=Array.from({length:to-from+1},(_,i)=>from+i);const ticks=years.filter((_,i)=>i===0||i===years.length-1||i%Math.max(1,Math.ceil(years.length/6))===0);
 return <div ref={root} className="topic-line-chart"><div className="topic-legend">{countries.map(c=><span key={c.code}><i style={{background:colorFor(c.code)}}/>{c.name}</span>)}</div><p className="muted">One point per country and year. Gaps remain gaps. Hover or focus a point for details; click to pin and highlight that country. Click a point to keep its details visible and fade the other countries. Click elsewhere or press Escape to dismiss.</p><div className="topic-svg-scroll" tabIndex={0} role="region" aria-label={`Scrollable annual chart, ${unit}`}><svg viewBox="0 0 960 385" role="group" aria-label={`Annual observations from ${from} to ${to}; ${unit}`}>
 {Array.from({length:5},(_,i)=>{const v=low+(high-low)*i/4;return <g key={i}><line x1={left} x2={right} y1={y(v)} y2={y(v)} stroke="#dce4dc"/><text x={left-12} y={y(v)+4} textAnchor="end" fill="#65736b" fontSize="12">{format(v)}</text></g>;})}
 {ticks.map(year=><text key={year} x={x(year)} y={bottom+25} textAnchor="middle" fill="#65736b" fontSize="12">{year}</text>)}
 <text x={left} y={375} fill="#65736b" fontSize="12">{unit}</text>
 {countries.map(c=>{const countryRows=rows.filter(r=>r.country===c.code);const byYear=new Map(countryRows.map(r=>[r.year,r]));const paths:string[]=[];let path='';for(const year of years){const row=byYear.get(year);if(row?.value==null){if(path)paths.push(path);path='';continue;}path+=(path?' L':'M')+x(year)+' '+y(row.value);}if(path)paths.push(path);
 return <g key={c.code} opacity={countryOpacity(c.code,detail?.country,pinned,false)}>{paths.map((d,i)=><path key={i} d={d} fill="none" stroke={colorFor(c.code)} strokeWidth="2.5"/>)}{countryRows.filter(r=>r.value!==null).map(r=><g key={r.year}><circle cx={x(r.year)} cy={y(r.value!)} r={detail?.country===r.country&&detail.year===r.year?6:4} fill={colorFor(c.code)} stroke="white" strokeWidth="1.5" pointerEvents="none"/><circle data-chart-point="true" cx={x(r.year)} cy={y(r.value!)} r="11" fill="transparent" tabIndex={0} role="button" aria-pressed={pinned&&detail?.country===r.country&&detail.year===r.year} aria-label={`${c.name}, ${r.year}: ${r.value} ${unit}. Press Enter to pin details.`} onMouseEnter={()=>dispatch({type:'hover',point:r})} onMouseLeave={()=>dispatch({type:'leave'})} onFocus={()=>dispatch({type:'hover',point:r})} onBlur={()=>dispatch({type:'blur'})} onClick={()=>dispatch({type:'pin',point:r})} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();dispatch({type:'pin',point:r});}}}/></g>)}</g>;})}
 </svg></div>{detail&&<div className="live-details topic-point-details" data-chart-details="true" role="status"><div className="data-heading"><strong>{countries.find(c=>c.code===detail.country)?.name??detail.country} · {detail.year} · {detail.value?.toLocaleString(undefined,{maximumFractionDigits:3})} {unit}</strong><button className="text-button" onClick={()=>dispatch({type:'dismiss'})}>Close details ×</button></div><p className="topic-detail-state">{pinned?'Pinned · other countries are dimmed':'Click the point to pin these details'}</p><dl>{Object.entries(detail.details).filter(([,v])=>v).map(([key,value])=><div key={key}><dt>{key.replaceAll('_',' ')}</dt><dd>{value}</dd></div>)}</dl></div>}</div>;
}
