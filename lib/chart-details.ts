import type {Country,Metric} from './types';
export interface FactorRow {label:string;unit:string;female:number|null;male:number|null}
export interface ChartDetails {
  metric:Metric;
  year:number;
  value:number|null;
  factors:FactorRow[];
  health:{label:string;unit:string;value:number|null}[];
  notes:string[];
}
export function valueAt(country:Country,metric:Metric,year:number):number|null{
  return country.series[metric]?.find(([observationYear])=>observationYear===year)?.[1]??null;
}
export function chartDetails(country:Country,metric:Metric,year:number):ChartDetails{
  const details:ChartDetails={metric,year,value:valueAt(country,metric,year),factors:[],health:[],notes:[]};
  if(metric==='gdi'){
    details.factors=[
      {label:'Human Development Index',unit:'index',female:valueAt(country,'hdi_f',year),male:valueAt(country,'hdi_m',year)},
      {label:'Life expectancy at birth',unit:'years',female:valueAt(country,'le_f',year),male:valueAt(country,'le_m',year)},
      {label:'Expected schooling',unit:'years',female:valueAt(country,'eys_f',year),male:valueAt(country,'eys_m',year)},
      {label:'Mean schooling (ages 25+)',unit:'years',female:valueAt(country,'mys_f',year),male:valueAt(country,'mys_m',year)},
      {label:'Estimated GNI per capita',unit:'2021 PPP $',female:valueAt(country,'gni_pc_f',year),male:valueAt(country,'gni_pc_m',year)},
    ];
    details.notes.push('GDI = female HDI ÷ male HDI. Values closer to 1 indicate greater parity.');
  }else if(metric==='gii'){
    details.health=[
      {label:'Maternal mortality',unit:'deaths / 100,000 live births',value:valueAt(country,'mmr',year)},
      {label:'Adolescent birth rate',unit:'births / 1,000 women ages 15–19',value:valueAt(country,'abr',year)},
    ];
    details.factors=[
      {label:'At least some secondary education',unit:'% ages 25+',female:valueAt(country,'se_f',year),male:valueAt(country,'se_m',year)},
      {label:'Seats in parliament',unit:'%',female:valueAt(country,'pr_f',year),male:valueAt(country,'pr_m',year)},
      {label:'Labour force participation',unit:'% ages 15+',female:valueAt(country,'lfpr_f',year),male:valueAt(country,'lfpr_m',year)},
    ];
    details.notes.push('Lower GII indicates less inequality. Component values are reported inputs, not additive contributions.');
    if(year>=2020)details.notes.push('Maternal mortality uses the 2020 estimate for 2020–2023.');
  }else if(metric==='mmr'&&year>=2020){
    details.notes.push('The 2020 maternal mortality estimate is repeated for 2020–2023.');
  }else if(metric==='ineq_inc'&&year>=2022){
    details.notes.push('Income inequality uses the 2022 estimate for 2022–2023.');
  }
  return details;
}
