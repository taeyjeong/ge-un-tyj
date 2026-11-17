'use client';
import {useEffect,useState} from 'react';
import {colorFor,type Country} from '../lib/types';
import type {TopicRow} from '../lib/topics';
export default function TopicLineChart({rows,countries,unit,from,to,zero}:{rows:TopicRow[];countries:Country[];unit:string;from:number;to:number;zero:boolean}){
 const [detail,setDetail]=useState<TopicRow|null>(null),[pinned,setPinned]=useState(false);
 useEffect(()=>{setDetail(null);setPinned(false);},[rows]);
 useEffect(()=>{const close=()=>{setPinned(false);setDetail(null);};document.addEventListener('click',close);return()=>document.removeEventListener('click',close);},[]);
 const values=rows.flatMap(r=>r.value===null?[]:[r.value]);
 if(!values.length)return <p className="empty">No numeric observations for this measure and these filters. Missing data is not zero.</p>;
 let low=Math.min(...values),high=Math.max(...values);if(zero){low=Math.min(0,low);high=Math.max(0,high);}if(low===high){const pad=Math.abs(low)*.05||1;low-=pad;high+=pad;}
 const left=85,right=925,top=30,bottom=330;
 const x=(year:number)=>from===to?(left+right)/2:left+(year-from)/(to-from)*(right-left);
 const y=(value:number)=>bottom-(value-low)/(high-low)*(bottom-top);
 const format=(v:number)=>v.toLocaleString(undefined,{notation:Math.abs(v)>=100000?'compact':'standard',maximumFractionDigits:2});
 const years=Array.from({length:to-from+1},(_,i)=>from+i);const ticks=years.filter((_,i)=>i===0||i===years.length-1||i%Math.max(1,Math.ceil(years.length/6))===0);
 return <div className="topic-line-chart" onClick={e=>e.stopPropagation()}><div className="topic-legend">{countries.map(c=><span key={c.code}><i style={{background:colorFor(c.code)}}/>{c.name}</span>)}</div><p className="muted">One point per country and year. Gaps remain gaps. Hover or focus a point for details; click to pin and highlight that country. Click outside the chart to dismiss.</p><div className="topic-svg-scroll" tabIndex={0} role="region" aria-label={`Scrollable annual chart, ${unit}`}><svg viewBox="0 0 960 385" role="group" aria-label={`Annual observations from ${from} to ${to}; ${unit}`}>
 {Array.from({length:5},(_,i)=>{const v=low+(high-low)*i/4;return <g key={i}><line x1={left} x2={right} y1={y(v)} y2={y(v)} stroke="#dce4dc"/><text x={left-12} y={y(v)+4} textAnchor="end" fill="#65736b" fontSize="12">{format(v)}</text></g>;})}
 {ticks.map(year=><text key={year} x={x(year)} y={bottom+25} textAnchor="middle" fill="#65736b" fontSize="12">{year}</text>)}
 <text x={left} y={375} fill="#65736b" fontSize="12">{unit}</text>
 {countries.map(c=>{const countryRows=rows.filter(r=>r.country===c.code);const byYear=new Map(countryRows.map(r=>[r.year,r]));const paths:string[]=[];let path='';for(const year of years){const row=byYear.get(year);if(row?.value==null){if(path)paths.push(path);path='';continue;}path+=(path?' L':'M')+x(year)+' '+y(row.value);}if(path)paths.push(path);
 return <g key={c.code} opacity={pinned&&detail?.country!==c.code?0.15:1}>{paths.map((d,i)=><path key={i} d={d} fill="none" stroke={colorFor(c.code)} strokeWidth="2.5"/>)}{countryRows.filter(r=>r.value!==null).map(r=><circle key={r.year} cx={x(r.year)} cy={y(r.value!)} r={detail===r?6:4} fill={colorFor(c.code)} stroke="white" strokeWidth="1.5" tabIndex={0} role="button" aria-label={`${c.name}, ${r.year}: ${r.value} ${unit}. Press Enter to pin details.`} onMouseEnter={()=>{if(!pinned)setDetail(r);}} onMouseLeave={()=>{if(!pinned)setDetail(null);}} onFocus={()=>{if(!pinned)setDetail(r);}} onBlur={()=>{if(!pinned)setDetail(null);}} onClick={()=>{setDetail(r);setPinned(true);}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setDetail(r);setPinned(true);}if(e.key==='Escape'){setDetail(null);setPinned(false);}}}/>)}</g>;})}
 </svg></div>{detail&&<div className="live-details" role="status"><div className="data-heading"><strong>{countries.find(c=>c.code===detail.country)?.name??detail.country} · {detail.year} · {detail.value?.toLocaleString(undefined,{maximumFractionDigits:3})} {unit}</strong><button className="text-button" onClick={()=>{setDetail(null);setPinned(false);}}>Close details ×</button></div><dl>{Object.entries(detail.details).filter(([,v])=>v).map(([key,value])=><div key={key}><dt>{key.replaceAll('_',' ')}</dt><dd>{value}</dd></div>)}</dl></div>}</div>;
}
