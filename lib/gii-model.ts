import type {Country} from './types';
export const giiInputDefinitions=[
 {key:'mmr',label:'Maternal mortality',unit:'deaths / 100,000 live births'},
 {key:'abr',label:'Adolescent births',unit:'births / 1,000 women ages 15–19'},
 {key:'pr_f',label:'Parliament seats · female',unit:'%'},
 {key:'pr_m',label:'Parliament seats · male',unit:'%'},
 {key:'se_f',label:'Secondary education · female',unit:'% ages 25+'},
 {key:'se_m',label:'Secondary education · male',unit:'% ages 25+'},
 {key:'lfpr_f',label:'Labour participation · female',unit:'% ages 15+'},
 {key:'lfpr_m',label:'Labour participation · male',unit:'% ages 15+'},
] as const;
export type GiiInputKey=typeof giiInputDefinitions[number]['key'];
export type GiiInputs=Record<GiiInputKey,number|null>;
export interface GiiSteps {
 normalized:Record<GiiInputKey,number>;
 dimensions:{health:{female:number;male:number};empowerment:{female:number;male:number};labour:{female:number;male:number}};
 gender:{female:number;male:number};
 harmonicMean:number;
 referenceDimensions:{health:number;empowerment:number;labour:number};
 referenceIndex:number;
 calculatedGii:number;
}
export type GiiCalculationResult=
 |{status:'complete';steps:GiiSteps}
 |{status:'missing-inputs'|'invalid-inputs';fields:GiiInputKey[]};
/** HDR 2025 Technical note 4. Raw percentages are supplied on a 0–100 scale.
 * Male health is a fixed reference of 1, not an observed male health measure.
 * Never impute missing values or round intermediate stages.
 */
export function calculateGii(inputs:GiiInputs):GiiCalculationResult{
 const missing=giiInputDefinitions.filter(({key})=>inputs[key]===null).map(({key})=>key);
 if(missing.length)return {status:'missing-inputs',fields:missing};
 const invalid=giiInputDefinitions.filter(({key})=>{
  const value=inputs[key]!;
  return !Number.isFinite(value)||value<0||(key!=='mmr'&&key!=='abr'&&value>100);
 }).map(({key})=>key);
 if(invalid.length)return {status:'invalid-inputs',fields:invalid};
 const proportion=(key:GiiInputKey)=>Math.max(.1,inputs[key]!)/100;
 const normalized={
  mmr:Math.max(10,Math.min(1000,inputs.mmr!)),abr:Math.max(.1,inputs.abr!),
  pr_f:proportion('pr_f'),pr_m:proportion('pr_m'),
  se_f:proportion('se_f'),se_m:proportion('se_m'),
  lfpr_f:proportion('lfpr_f'),lfpr_m:proportion('lfpr_m'),
 };
 const dimensions={
  health:{female:Math.sqrt((10/normalized.mmr)*(1/normalized.abr)),male:1},
  empowerment:{female:Math.sqrt(normalized.pr_f*normalized.se_f),male:Math.sqrt(normalized.pr_m*normalized.se_m)},
  labour:{female:normalized.lfpr_f,male:normalized.lfpr_m},
 };
 const gender={
  female:Math.cbrt(dimensions.health.female*dimensions.empowerment.female*dimensions.labour.female),
  male:Math.cbrt(dimensions.health.male*dimensions.empowerment.male*dimensions.labour.male),
 };
 const harmonicMean=2/(1/gender.female+1/gender.male);
 const referenceDimensions={health:(dimensions.health.female+dimensions.health.male)/2,empowerment:(dimensions.empowerment.female+dimensions.empowerment.male)/2,labour:(dimensions.labour.female+dimensions.labour.male)/2};
 const referenceIndex=Math.cbrt(referenceDimensions.health*referenceDimensions.empowerment*referenceDimensions.labour);
 const result=1-harmonicMean/referenceIndex;
 return {status:'complete',steps:{normalized,dimensions,gender,harmonicMean,referenceDimensions,referenceIndex,calculatedGii:Math.abs(result)<1e-14?0:result}};
}
export function giiInputsFor(country:Country,year:number):GiiInputs{
 return Object.fromEntries(giiInputDefinitions.map(({key})=>[key,country.series[key]?.find(([observationYear])=>observationYear===year)?.[1]??null])) as GiiInputs;
}
