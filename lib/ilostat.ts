export const iloDatasets={
 'hourly-earnings':{id:'EAR_EHRA_SEX_NB_A',name:'Average hourly earnings by sex',unit:'Local currency per hour',description:'Values are in each country’s local currency. Compare female and male earnings within the same country; amounts cannot be compared directly across countries.',sex:true,filters:{}},
 'unemployment':{id:'SDG_0852_SEX_AGE_RT_A',name:'Unemployment rate by sex · ages 15+',unit:'%',description:'Share of the labour force that is unemployed, by sex, ages 15 and older.',sex:true,filters:{classif1:'AGE_YTHADULT_YGE15'}},
 'women-management':{id:'SDG_0552_NOC_RT_A',name:'Women in senior and middle management',unit:'%',description:'Share of senior and middle management positions held by women. This series has no separate male/female filter.',sex:false,filters:{}},
} as const;
export type IloDataset=keyof typeof iloDatasets;
export type IloRow=Record<string,string|number|null>;
export interface IloQuery{dataset:IloDataset;countries:string[];from:number;to:number;sex:'both'|'female'|'male'|'total'}
export interface IloResponse{dataset:IloDataset;sourceUrl:string;queriedAt:string;rows:IloRow[]}
export function parseIloQuery(params:URLSearchParams):IloQuery{
 const dataset=params.get('dataset')??'hourly-earnings';
 if(!Object.hasOwn(iloDatasets,dataset))throw new Error('Choose a supported ILO indicator.');
 const countries=[...new Set((params.get('countries')??'JPN,KOR,USA').split(',').map(code=>code.trim().toUpperCase()).filter(Boolean))].sort();
 if(!countries.length||countries.length>20||countries.some(code=>!/^[A-Z]{3}$/.test(code)))throw new Error('Choose between 1 and 20 valid ISO3 country codes.');
 const rawFrom=params.get('from')??'2020',rawTo=params.get('to')??'2023';
 if(!/^\d{4}$/.test(rawFrom)||!/^\d{4}$/.test(rawTo))throw new Error('Years must contain four digits.');
 const from=Number(rawFrom),to=Number(rawTo);
 if(from<1900||to>2100||from>to||to-from>40)throw new Error('Choose a valid year range of at most 41 years.');
 const sex=params.get('sex')??'both';
 if(!['both','female','male','total'].includes(sex))throw new Error('Choose a supported sex filter.');
 return {dataset:dataset as IloDataset,countries,from,to,sex:sex as IloQuery['sex']};
}
export function iloSourceUrl(query:IloQuery){
 const dataset=iloDatasets[query.dataset];
 const url=new URL('https://rplumber.ilo.org/data/indicator');
 const values:Record<string,string>={id:dataset.id,ref_area:query.countries.join('+'),timefrom:String(query.from),timeto:String(query.to),format:'.json',type:'both',lang:'en',...dataset.filters};
 if(dataset.sex)values.sex={both:'SEX_F+SEX_M',female:'SEX_F',male:'SEX_M',total:'SEX_T'}[query.sex];
 for(const [key,value] of Object.entries(values))url.searchParams.set(key,value);
 return url;
}
export function parseIloRows(data:unknown):IloRow[]{
 if(!Array.isArray(data)||data.length>50000)throw new Error('ILOSTAT returned an unexpected response.');
 return data.map(row=>{
  if(typeof row!=='object'||row===null||Array.isArray(row)||!Object.hasOwn(row,'obs_value'))throw new Error('ILOSTAT returned an unexpected observation.');
  const result:IloRow={};
  for(const [key,value] of Object.entries(row)){
   if(value!==null&&typeof value!=='string'&&typeof value!=='number')throw new Error('ILOSTAT returned an unexpected field.');
   result[key]=value;
  }
  if(result.obs_value!==null&&!(typeof result.obs_value==='number'&&Number.isFinite(result.obs_value)))throw new Error('ILOSTAT returned an invalid observation value.');
  return result;
 });
}
