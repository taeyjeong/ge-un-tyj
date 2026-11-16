'use client';
import {useEffect,useId,useLayoutEffect,useReducer,useRef,useState,type KeyboardEvent,type PointerEvent} from 'react';
import {colorFor,formatValue,indicatorFor,observations,type Country,type GraphSettings} from '../lib/types';
import ChartTooltip from './ChartTooltip';
import {chartInteractionReducer,countryOpacity} from '../lib/chart-interaction';
interface ActivePoint {country:Country;year:number;value:number;x:number;y:number}
export default function Chart({countries,settings,expanded=false}:{countries:Country[];settings:GraphSettings;expanded?:boolean}){
 const [interaction,dispatch]=useReducer(chartInteractionReducer<ActivePoint>,{hovered:null,pinned:null});
 const active=interaction.pinned??interaction.hovered;
 const pinned=interaction.pinned!==null;
 const [position,setPosition]=useState({left:0,top:0,maxHeight:400});
 const wrapper=useRef<HTMLDivElement>(null);
 const svgRef=useRef<SVGSVGElement>(null);
 const tooltip=useRef<HTMLDivElement>(null);
 const tooltipId=useId();
 const series=countries.map(country=>({country,points:observations(country,settings)}));
 const values=series.flatMap(({points})=>points.flatMap(([,value])=>value===null?[]:[value]));
 const width=expanded?1200:860,height=expanded?560:360;
 const left=82,right=width-40,top=30,bottom=height-50;
 const min=values.length?Math.min(...values):0,max=values.length?Math.max(...values):1;
 const padding=(max-min||Math.abs(max)||1)*.08;
 const barMode=settings.mode==='bar';
 const lo=settings.zeroBaseline||barMode?Math.min(0,min-padding):min-padding;
 const hi=Math.max(max+padding,lo+0.001);
 const x=(year:number)=>settings.startYear===settings.endYear?(left+right)/2:left+(year-settings.startYear)/(settings.endYear-settings.startYear)*(right-left);
 const y=(value:number)=>bottom-(value-lo)/(hi-lo)*(bottom-top);
 const ticks=[...new Set([settings.startYear,...Array.from({length:34},(_,i)=>1990+i).filter(year=>year%5===0&&year>settings.startYear&&year<settings.endYear),settings.endYear])];
 const bars=series.flatMap(({country,points})=>{const point=points.filter(([,value])=>value!==null).at(-1);return point?[{country,year:point[0],value:point[1]!}]:[];});
 function activate(point:ActivePoint){if(active?.country.code!==point.country.code||active.year!==point.year)dispatch({type:pinned?'pin':'hover',point});}
 useEffect(()=>{
  if(!pinned)return;
  function dismissOutside(event:globalThis.PointerEvent){
   const target=event.target;
   if(!(target instanceof Node)||tooltip.current?.contains(target))return;
   if(target instanceof Element&&target.closest('[data-chart-mark]')&&svgRef.current?.contains(target))return;
   dispatch({type:'dismiss'});
  }
  document.addEventListener('pointerdown',dismissOutside,true);
  return()=>document.removeEventListener('pointerdown',dismissOutside,true);
 },[pinned]);
 useLayoutEffect(()=>{
  if(!active)return;
  function reposition(){
   const matrix=svgRef.current?.getScreenCTM();
   if(!matrix||!wrapper.current||!tooltip.current||!active)return;
   const anchor=new DOMPoint(active.x,active.y).matrixTransform(matrix);
   const container=wrapper.current.getBoundingClientRect();
   const box=tooltip.current.getBoundingClientRect();
   const anchorX=anchor.x-container.left,anchorY=anchor.y-container.top;
   const maxHeight=Math.max(180,container.height-16);
   const boxHeight=Math.min(box.height,maxHeight);
   const preferredLeft=anchorX+18+box.width<=container.width?anchorX+18:anchorX-box.width-18;
   setPosition({left:Math.max(8,Math.min(preferredLeft,container.width-box.width-8)),top:Math.max(8,Math.min(anchorY-boxHeight/2,container.height-boxHeight-8)),maxHeight});
  }
  reposition();
  const observer=new ResizeObserver(reposition);
  if(wrapper.current)observer.observe(wrapper.current);
  if(tooltip.current)observer.observe(tooltip.current);
  return()=>observer.disconnect();
 },[active]);
 function handlePointer(event:PointerEvent<SVGSVGElement>){
  if(pinned)return;
  const matrix=event.currentTarget.getScreenCTM();if(!matrix)return;
  const cursor=new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse());
  if(cursor.x<left-8||cursor.x>right+8||cursor.y<top-8||cursor.y>bottom+8){dispatch({type:'dismiss'});return;}
  if(barMode){
   const index=Math.min(bars.length-1,Math.max(0,Math.floor((cursor.x-left)/(right-left)*bars.length)));
   const bar=bars[index];if(!bar){dispatch({type:'dismiss'});return;}
   const barY=y(bar.value),baseline=y(0);
   if(cursor.y<Math.min(barY,baseline)-8||cursor.y>Math.max(barY,baseline)+8){dispatch({type:'dismiss'});return;}
   activate({...bar,x:left+(index+.5)*(right-left)/bars.length,y:barY});
  }else{
   const year=Math.max(settings.startYear,Math.min(settings.endYear,Math.round(settings.startYear+(cursor.x-left)/(right-left)*(settings.endYear-settings.startYear))));
   const candidates=series.flatMap(({country,points})=>{const point=points.find(([pointYear,value])=>pointYear===year&&value!==null);return point?[{country,year,value:point[1]!,x:x(year),y:y(point[1]!)}]:[];});
   const nearest=candidates.reduce<ActivePoint|null>((closest,point)=>!closest||Math.abs(point.y-cursor.y)<Math.abs(closest.y-cursor.y)?point:closest,null);
   if(nearest)activate(nearest);else dispatch({type:'dismiss'});
  }
 }
 function handleKeyboard(event:KeyboardEvent<SVGSVGElement>){
  if(event.key==='Escape'){if(active){dispatch({type:'dismiss'});event.preventDefault();}return;}
  if((event.key==='Enter'||event.key===' ')&&active){event.preventDefault();dispatch({type:'pin',point:active});return;}
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))return;
  event.preventDefault();
  const available=series.filter(({points})=>points.some(([,value])=>value!==null));
  if(!available.length)return;
  const currentIndex=Math.max(0,available.findIndex(({country})=>country.code===active?.country.code));
  const index=event.key==='ArrowUp'?Math.max(0,currentIndex-1):event.key==='ArrowDown'?Math.min(available.length-1,currentIndex+1):currentIndex;
  const current=available[index];
  const points=current.points.filter(([,value])=>value!==null);
  let point=points.find(([year])=>year===active?.year)??points.at(-1)!;
  if(event.key==='Home')point=points[0];
  if(event.key==='End')point=points.at(-1)!;
  if(event.key==='ArrowLeft')point=points.filter(([year])=>year<point[0]).at(-1)??point;
  if(event.key==='ArrowRight')point=points.find(([year])=>year>point[0])??point;
  if(barMode){const bar=bars.find(bar=>bar.country.code===current.country.code)!;const barIndex=bars.indexOf(bar);activate({...bar,x:left+(barIndex+.5)*(right-left)/bars.length,y:y(bar.value)});}
  else activate({country:current.country,year:point[0],value:point[1]!,x:x(point[0]),y:y(point[1]!)});
 }
 if(!values.length)return <p className="empty">{countries.length?'No observations are available for these countries, this measure and this year range. Try a wider range.':'Select one or more countries to draw a graph.'}</p>;
 return <div ref={wrapper} className={`interactive-chart ${expanded?'interactive-chart-expanded':''}`} onPointerLeave={()=>dispatch({type:'leave'})}>
 <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} role="group" tabIndex={0} aria-label={`${indicatorFor(settings.metric).name}, ${settings.startYear}–${settings.endYear}. ${barMode?'Each bar shows a country’s latest available observation.':'Each point is one year.'} Use left and right arrows for years, up and down arrows for countries. Enter pins details. Escape dismisses details.`} aria-describedby={active?tooltipId:undefined} onPointerMove={handlePointer} onKeyDown={handleKeyboard} onBlur={()=>dispatch({type:'blur'})} onFocus={()=>{if(!active){const first=series.find(({points})=>points.some(([,value])=>value!==null));const point=first?.points.filter(([,value])=>value!==null).at(-1);if(first&&point){if(barMode){const barIndex=bars.findIndex(bar=>bar.country.code===first.country.code);activate({country:first.country,year:point[0],value:point[1]!,x:left+(barIndex+.5)*(right-left)/bars.length,y:y(point[1]!)});}else activate({country:first.country,year:point[0],value:point[1]!,x:x(point[0]),y:y(point[1]!)});}}}}>
 {Array.from({length:6},(_,i)=>{const value=lo+(hi-lo)*i/5;return <g key={i}><line x1={left} x2={right} y1={y(value)} y2={y(value)} stroke="#e6ebe4"/><text x={left-10} y={y(value)+4} textAnchor="end">{Math.abs(value)>=10000?new Intl.NumberFormat('en',{notation:'compact',maximumFractionDigits:1}).format(value):Number(value.toPrecision(3)).toLocaleString('en-US')}</text></g>})}
 {!barMode&&ticks.map(year=><text key={year} x={x(year)} y={bottom+27} textAnchor="middle">{year}</text>)}
 {settings.metric==='gdi'&&lo<=1&&hi>=1&&<line x1={left} x2={right} y1={y(1)} y2={y(1)} stroke="#a4afa4" strokeDasharray="5 5"/>}
 {barMode?bars.map(({country,year,value},index)=>{const step=(right-left)/bars.length;const baseline=y(0);const barX=left+index*step;return <g key={country.code}><rect data-chart-mark="bar" onClick={()=>dispatch({type:'pin',point:{country,year,value,x:barX+step/2,y:y(value)}})} style={{cursor:'pointer'}} x={barX+step*.1} width={step*.8} y={Math.min(y(value),baseline)} height={Math.max(1,Math.abs(y(value)-baseline))} fill={colorFor(country.code)} opacity={countryOpacity(country.code,active?.country.code,pinned,countries.length>20)} aria-label={`${country.name}, ${year}: ${formatValue(value,settings.metric)}`}/>{bars.length<=15&&<text x={barX+step/2} y={bottom+27} textAnchor="middle">{country.code}</text>}</g>}):series.map(({country,points})=>{let path='',gap=true;for(const [year,value] of points){if(value===null){gap=true;continue;}path+=`${gap?'M':'L'}${x(year)},${y(value)} `;gap=false;}return <g key={country.code} opacity={countryOpacity(country.code,active?.country.code,pinned,countries.length>20)}><path d={path} fill="none" stroke={colorFor(country.code)} strokeWidth={countries.length>20?1.3:2.5}/>{points.map(([year,value])=>value===null?null:<circle data-chart-mark="point" onClick={()=>dispatch({type:'pin',point:{country,year,value,x:x(year),y:y(value)}})} style={{cursor:'pointer'}} stroke="transparent" strokeWidth={10} pointerEvents="all" key={year} cx={x(year)} cy={y(value)} r={countries.length>20?1.8:3} fill={colorFor(country.code)} aria-label={`${country.name}, ${year}: ${formatValue(value,settings.metric)}`}/>)}</g>})}
 {active&&<g pointerEvents="none">{!barMode&&<line x1={active.x} x2={active.x} y1={top} y2={bottom} stroke="#52665e" strokeDasharray="4 4"/>}<circle cx={active.x} cy={active.y} r={6} fill={colorFor(active.country.code)} stroke="white" strokeWidth={2}/>{!barMode&&<><rect x={active.x-23} y={bottom+10} width={46} height={23} fill="#183e33" rx={4}/><text x={active.x} y={bottom+26} textAnchor="middle" style={{fill:'white'}}>{active.year}</text></>}</g>}
 </svg>
 {active&&<div ref={tooltip} className="chart-tooltip" style={{left:position.left,top:position.top,maxHeight:position.maxHeight}}><p className="tooltip-pin-status">{pinned?'Pinned · click elsewhere to dismiss':'Click a point or bar to keep these details open'}</p><ChartTooltip id={tooltipId} country={active.country} metric={settings.metric} year={active.year}/></div>}
 </div>;
}
