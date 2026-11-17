'use client';
import {useId,useState,type KeyboardEvent} from 'react';
import Image from 'next/image';
import HdiCalculation from './HdiCalculation';
import HdiFormula from './HdiFormula';
import GiiCalculation from './GiiCalculation';
import GiiFormula from './GiiFormula';
import type {Country} from '../lib/types';
import type {FocusIndex} from '../lib/hdr-focus';
export default function IndexCalculations({countries,defaultYear,activeIndex,onIndexChange}:{countries:Country[];defaultYear:number;activeIndex?:FocusIndex;onIndexChange?:(index:FocusIndex)=>void}){
 const [localIndex,setLocalIndex]=useState<FocusIndex>('hdi');
 const index=activeIndex??localIndex;
 function setIndex(value:FocusIndex){setLocalIndex(value);onIndexChange?.(value);}
 const id=useId();
 function navigate(event:KeyboardEvent<HTMLButtonElement>){
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  event.preventDefault();
  const next=event.key==='Home'?'hdi':event.key==='End'?'gii':index==='hdi'?'gii':'hdi';
  setIndex(next);
  event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`[data-index-tab="${next}"]`)?.focus();
 }
 return <section className="index-calculations" aria-labelledby={`${id}-heading`}><div className="index-calculations-heading"><div><div className="eyebrow">HOW INDICES WORK</div><h2 id={`${id}-heading`}>Explore the calculations</h2></div><div role="tablist" aria-label="Index calculation" className="index-tabs">{(['hdi','gii'] as const).map(value=><button key={value} type="button" role="tab" data-index-tab={value} id={`${id}-${value}-tab`} aria-selected={index===value} aria-controls={`${id}-${value}-panel`} tabIndex={index===value?0:-1} onClick={()=>setIndex(value)} onKeyDown={navigate}>{value.toUpperCase()}</button>)}</div></div>
 <div role="tabpanel" hidden={index!=='hdi'} id={`${id}-hdi-panel`} aria-labelledby={`${id}-hdi-tab`}><HdiCalculation countries={countries} defaultYear={defaultYear} key={defaultYear}/><HdiFormula/></div>
 <div role="tabpanel" hidden={index!=='gii'} id={`${id}-gii-panel`} aria-labelledby={`${id}-gii-tab`}><GiiCalculation countries={countries} defaultYear={defaultYear} key={defaultYear}/><details id="gii-diagram" className="methodology" open><summary>How the Gender Inequality Index is built</summary><p>GII combines reproductive health, empowerment and labour-market participation. The diagram below shows how its component measures feed into the index.</p><a href="/gii-diagram.png" target="_blank" rel="noreferrer" aria-label="Open the full-size GII diagram"><Image src="/gii-diagram.png" alt="UNDP diagram: maternal mortality and adolescent births form the female reproductive health index; education and parliamentary seats form empowerment indices; labour participation forms labour-market indices. Female and male gender indices combine into the Gender Inequality Index." width={1366} height={400} className="gii-diagram" unoptimized/></a><p className="muted">Source: <a href="https://hdr.undp.org/data-center/thematic-composite-indices/gender-inequality-index">UNDP · Gender Inequality Index</a>. Open the image to view it at full size.</p></details><GiiFormula/></div></section>;
}
