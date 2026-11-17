import {calculateHdi,hdiInputDefinitions,type HdiInputs} from './hdi-model.ts';
import {calculateGii,giiInputDefinitions,type GiiInputs} from './gii-model.ts';
import {fdiAggregate,fdiFields} from './fdi-model.ts';
import {calculateFcs,fcsGroups} from './fcs-model.ts';
export const indexDefinitions=[
 {id:'hdi',title:'Human Development Index',short:'HDI',direction:'Higher means greater human development.',range:'0–1',source:'UNDP HDR 2025',kind:'annual',description:'Health, education and income combined into a geometric mean.'},
 {id:'gii',title:'Gender Inequality Index',short:'GII',direction:'Lower means less gender inequality.',range:'0–1',source:'UNDP HDR 2025',kind:'annual',description:'Reproductive health, empowerment and labour participation, compared between women and men.'},
 {id:'gdi',title:'Gender Development Index',short:'GDI',direction:'Closer to 1 means greater parity between female and male HDI.',range:'ratio',source:'UNDP HDR 2025',kind:'annual',description:'Female human development divided by male human development.'},
 {id:'ihdi',title:'Inequality-adjusted HDI',short:'IHDI',direction:'Higher means greater development after accounting for inequality.',range:'0–1',source:'UNDP HDR 2025',kind:'annual',description:'HDI discounted for inequalities in health, education and income.'},
 {id:'phdi',title:'Planetary pressures-adjusted HDI',short:'PHDI',direction:'Higher means greater development after accounting for planetary pressures.',range:'0–1',source:'UNDP HDR 2025',kind:'annual',description:'HDI adjusted for carbon emissions and material footprint per person.'},
 {id:'fdi',title:'Financial Development Index',short:'FDI',direction:'Higher means greater financial development.',range:'0–1',source:'International Monetary Fund · FDI',kind:'annual',description:'Financial institutions and markets, each measured through depth, access and efficiency.'},
 {id:'fcs',title:'Food Consumption Score',short:'FCS',direction:'Higher means more frequent and diverse household food consumption.',range:'0–112',source:'World Food Programme · FCS',kind:'household',description:'Eight food-group frequencies over the previous seven days, multiplied by fixed nutritional weights.'},
 {id:'mpi',title:'Multidimensional Poverty Index',short:'MPI',direction:'Lower means less acute multidimensional poverty.',range:'0–1',source:'UNDP / OPHI · 2026',kind:'snapshot',description:'The incidence of multidimensional poverty multiplied by its average intensity.'},
 {id:'ghi',title:'Global Hunger Index',short:'GHI',direction:'Lower means less hunger.',range:'100-point scale',source:'Global Hunger Index · 2026',kind:'reference',description:'Undernourishment, child wasting, child stunting and child mortality, standardized and weighted.'},
 {id:'epi',title:'Environmental Performance Index',short:'EPI',direction:'Higher means stronger environmental performance.',range:'0–100',source:'Yale / Columbia · 2026',kind:'snapshot',description:'Environmental health, ecosystem vitality and climate performance combined into a weighted score.'},
] as const;
export type IndexId=typeof indexDefinitions[number]['id'];
export function indexFor(id:string){return indexDefinitions.find(i=>i.id===id);}
export interface IndexInput {key:string;label:string;unit:string;min:number;max?:number}
export function inputsForIndex(id:IndexId):IndexInput[]{
 if(id==='hdi')return hdiInputDefinitions.map(f=>({key:f.key,label:f.label,unit:f.unit,min:0}));
 if(id==='gii')return giiInputDefinitions.map(f=>({...f,min:0,...(!['mmr','abr'].includes(f.key)?{max:100}:{})}));
 if(id==='gdi')return ['f','m'].flatMap(sex=>[{key:'le_'+sex,label:`Life expectancy · ${sex==='f'?'female':'male'}`,unit:'years',min:0},{key:'eys_'+sex,label:`Expected schooling · ${sex==='f'?'female':'male'}`,unit:'years',min:0},{key:'mys_'+sex,label:`Mean schooling · ${sex==='f'?'female':'male'}`,unit:'years',min:0},{key:'gni_pc_'+sex,label:`Estimated earned income · ${sex==='f'?'female':'male'}`,unit:'2021 PPP $ / person',min:0}]);
 if(id==='ihdi')return [{key:'hdi',label:'HDI',unit:'0–1',min:0,max:1},...['le','edu','inc'].map((d,i)=>({key:'ineq_'+d,label:['Health inequality','Education inequality','Income inequality'][i],unit:'Atkinson inequality, %',min:0,max:100}))];
 if(id==='phdi')return [{key:'hdi',label:'HDI',unit:'0–1',min:0,max:1},{key:'co2_prod',label:'Production CO₂ per person',unit:'tonnes / person',min:0,max:76.61},{key:'mf',label:'Material footprint per person',unit:'tonnes / person',min:0,max:90.27}];
 if(id==='fdi')return fdiFields.map(f=>({key:f.key,label:f.label,unit:'published sub-index, 0–1',min:0,max:1}));
 if(id==='fcs')return fcsGroups.map(f=>({key:f.key,label:f.label,unit:'days in the past seven days',min:0,max:7}));
 if(id==='mpi')return [{key:'headcount',label:'Incidence of poverty · H',unit:'% of population',min:0,max:100},{key:'intensity',label:'Intensity of deprivation · A',unit:'% among people in poverty',min:0,max:100}];
 if(id==='ghi')return [{key:'undernourishment',label:'Undernourishment',unit:'% of population',min:0,max:100},{key:'wasting',label:'Child wasting',unit:'% of children under 5',min:0,max:100},{key:'stunting',label:'Child stunting',unit:'% of children under 5',min:0,max:100},{key:'mortality',label:'Under-five mortality',unit:'% of live births',min:0,max:100}];
 return [{key:'health',label:'Environmental health · HLT',unit:'published objective score, 0–100',min:0,max:100},{key:'ecosystems',label:'Ecosystem vitality · ECO',unit:'published objective score, 0–100',min:0,max:100},{key:'climate',label:'Climate change · PCC',unit:'published objective score, 0–100',min:0,max:100}];
}
export interface IndexStep {label:string;formula:string;value:number}
export interface IndexEvaluation {value:number|null;steps:IndexStep[];error?:string}
export function evaluateIndex(id:IndexId,inputs:Record<string,number|null>):IndexEvaluation{
 const fields=inputsForIndex(id);const missing=fields.filter(f=>inputs[f.key]==null);
 if(missing.length)return {value:null,steps:[],error:'Missing exact inputs: '+missing.map(f=>f.label).join(', ')+'.'};
 const invalid=fields.filter(f=>!Number.isFinite(inputs[f.key])||inputs[f.key]!<f.min||(f.max!==undefined&&inputs[f.key]!>f.max));
 if(invalid.length)return {value:null,steps:[],error:'Inputs outside the valid range: '+invalid.map(f=>f.label).join(', ')+'.'};
 const v=inputs as Record<string,number>;const steps:IndexStep[]=[];const step=(label:string,formula:string,value:number)=>{steps.push({label,formula,value});return value;};
 if(id==='hdi'){
  const r=calculateHdi(v as HdiInputs);if(r.status!=='complete')return {value:null,steps,error:'HDI needs positive life expectancy and income.'};const d=r.steps.dimensions;step('Health','(bounded LE − 20) / 65',d.health);step('Education','[(bounded EYS / 18) + (bounded MYS / 15)] / 2',d.education);step('Income','[ln(bounded GNI) − ln(100)] / [ln(75,000) − ln(100)]',d.income);return {value:step('HDI','∛(health × education × income)',r.steps.calculatedHdi),steps};
 }
 if(id==='gii'){
  const r=calculateGii(v as GiiInputs);if(r.status!=='complete')return {value:null,steps,error:'Unable to compute GII.'};step('Female gender index','∛(female health × empowerment × labour)',r.steps.gender.female);step('Male gender index','∛(male health × empowerment × labour)',r.steps.gender.male);step('Harmonic mean','2 / (1/Gf + 1/Gm)',r.steps.harmonicMean);step('Reference index','∛(mean health × mean empowerment × mean labour)',r.steps.referenceIndex);return {value:step('GII','1 − harmonic mean / reference index',r.steps.calculatedGii),steps};
 }
 if(id==='gdi'){
  if(v.le_f<=0||v.le_m<=0||v.gni_pc_f<=0||v.gni_pc_m<=0)return {value:null,steps,error:'Life expectancy and estimated earned income must be positive.'};
  const indices=['f','m'].map(sex=>{const r=calculateHdi({le:Math.max(20,v['le_'+sex]+(sex==='f'?-2.5:2.5)),eys:v['eys_'+sex],mys:v['mys_'+sex],gnipc:v['gni_pc_'+sex]});if(r.status!=='complete')return null;return step(sex==='f'?'Female HDI':'Male HDI','∛(sex-specific health × education × income)',r.steps.calculatedHdi);});
  if(indices[0]===null||indices[1]===null||indices[1]===0)return {value:null,steps,error:'GDI needs valid sex-specific inputs and a nonzero male HDI.'};return {value:step('GDI','HDIf / HDIm',indices[0]/indices[1]),steps};
 }
 if(id==='ihdi'){const discount=step('Inequality adjustment','∛[(1 − AH/100)(1 − AE/100)(1 − AI/100)]',Math.cbrt((1-v.ineq_le/100)*(1-v.ineq_edu/100)*(1-v.ineq_inc/100)));return {value:step('IHDI','HDI × inequality adjustment',v.hdi*discount),steps};}
 if(id==='phdi'){const c=step('Carbon adjustment','(76.61 − CO₂) / 76.61',(76.61-v.co2_prod)/76.61),m=step('Material adjustment','(90.27 − MF) / 90.27',(90.27-v.mf)/90.27);const a=step('Planetary adjustment','(carbon adjustment + material adjustment) / 2',(c+m)/2);return {value:step('PHDI','HDI × planetary adjustment',v.hdi*a),steps};}
 if(id==='fdi'){const fi=fdiAggregate('fi',v),fm=fdiAggregate('fm',v);step('Institutions · weighted aggregate','Σ institutional category score × calibrated weight',fi.weighted);step('Financial institutions · FI','(weighted aggregate − minimum) / (maximum − minimum)',fi.value);step('Markets · weighted aggregate','Σ market category score × calibrated weight',fm.weighted);step('Financial markets · FM','(weighted aggregate − minimum) / (maximum − minimum)',fm.value);const fd=fdiAggregate('fd',{fi:fi.value,fm:fm.value});step('Overall · weighted aggregate','wFI × FI + wFM × FM',fd.weighted);return {value:step('FDI · reconstructed','(overall aggregate − minimum) / (maximum − minimum)',fd.value),steps};}
 if(id==='fcs'){const result=calculateFcs(v);if(result.value===null)return {value:null,steps:[],error:result.error};for(const g of result.contributions)step(g.label,`${g.days} days × weight ${g.weight}`,g.value);return {value:step('FCS','sum of weighted seven-day food-group frequencies',result.value),steps};}
 if(id==='mpi'){if(v.headcount>0&&v.intensity<100/3-1e-6)return {value:null,steps,error:'Among people identified as poor, average deprivation must be at least one third.'};return {value:step('MPI','(H / 100) × (A / 100)',v.headcount/100*v.intensity/100),steps};}
 if(id==='ghi'){for(const [key,threshold,weight] of [['undernourishment',80,1/3],['wasting',30,1/6],['stunting',70,1/6],['mortality',35,1/3]] as const)step(key,`100 × ${key} / ${threshold} × ${weight===1/3?'⅓':'⅙'}`,100*v[key]/threshold*weight);return {value:step('GHI','sum of the four weighted standardized components',steps.reduce((sum,s)=>sum+s.value,0)),steps};}
 step('Environmental health contribution','0.25 × HLT',.25*v.health);step('Ecosystem contribution','0.45 × ECO',.45*v.ecosystems);step('Climate contribution','0.30 × PCC',.30*v.climate);return {value:step('EPI','0.25 HLT + 0.45 ECO + 0.30 PCC',.25*v.health+.45*v.ecosystems+.30*v.climate),steps};
}
