import type {Country} from './types';
export const hdiInputDefinitions=[
 {key:'le',label:'Life expectancy at birth',unit:'years',minimum:20,maximum:85},
 {key:'eys',label:'Expected years of schooling',unit:'years',minimum:0,maximum:18},
 {key:'mys',label:'Mean years of schooling',unit:'years · ages 25+',minimum:0,maximum:15},
 {key:'gnipc',label:'GNI per capita',unit:'2021 PPP $',minimum:100,maximum:75000},
] as const;
export type HdiInputKey=typeof hdiInputDefinitions[number]['key'];
export type HdiInputs=Record<HdiInputKey,number|null>;
export interface HdiSteps{
 bounded:Record<HdiInputKey,number>;
 schooling:{expected:number;mean:number};
 dimensions:{health:number;education:number;income:number};
 calculatedHdi:number;
}
export type HdiCalculationResult=
 |{status:'complete';steps:HdiSteps}
 |{status:'missing-inputs'|'invalid-inputs';fields:HdiInputKey[]};
/** UNDP HDR 2025 Technical note 1. Raw observations stay unchanged.
 * Use goalposts for calculation only; keep full intermediate precision.
 */
export function calculateHdi(inputs:HdiInputs):HdiCalculationResult{
 const missing=hdiInputDefinitions.filter(({key})=>inputs[key]===null).map(({key})=>key);
 if(missing.length)return {status:'missing-inputs',fields:missing};
 const invalid=hdiInputDefinitions.filter(({key})=>!Number.isFinite(inputs[key])||inputs[key]!<0||((key==='le'||key==='gnipc')&&inputs[key]===0)).map(({key})=>key);
 if(invalid.length)return {status:'invalid-inputs',fields:invalid};
 const bounded=Object.fromEntries(hdiInputDefinitions.map(({key,minimum,maximum})=>[key,Math.min(maximum,Math.max(minimum,inputs[key]!))])) as Record<HdiInputKey,number>;
 const schooling={expected:bounded.eys/18,mean:bounded.mys/15};
 const dimensions={health:(bounded.le-20)/(85-20),education:(schooling.expected+schooling.mean)/2,income:(Math.log(bounded.gnipc)-Math.log(100))/(Math.log(75000)-Math.log(100))};
 return {status:'complete',steps:{bounded,schooling,dimensions,calculatedHdi:Math.cbrt(dimensions.health*dimensions.education*dimensions.income)}};
}
export function hdiInputsFor(country:Country,year:number):HdiInputs{
 return Object.fromEntries(hdiInputDefinitions.map(({key})=>[key,country.series[key]?.find(([observationYear])=>observationYear===year)?.[1]??null])) as HdiInputs;
}
