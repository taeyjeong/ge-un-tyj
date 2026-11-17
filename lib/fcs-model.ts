export const fcsGroups=[
 {key:'staples',variable:'FCSStap',label:'Staples',weight:2,description:'Cereals, grains, roots and tubers'},
 {key:'pulses',variable:'FCSPulse',label:'Pulses',weight:3,description:'Legumes, nuts and seeds'},
 {key:'dairy',variable:'FCSDairy',label:'Dairy',weight:4,description:'Milk and other dairy products'},
 {key:'protein',variable:'FCSPr',label:'Meat, fish & eggs',weight:4,description:'Animal-source protein'},
 {key:'vegetables',variable:'FCSVeg',label:'Vegetables',weight:1,description:'Vegetables and leaves'},
 {key:'fruit',variable:'FCSFruit',label:'Fruit',weight:1,description:'Fruit, excluding packaged fruit juice'},
 {key:'fats',variable:'FCSFat',label:'Oils & fats',weight:.5,description:'Oils, fats and butter'},
 {key:'sugar',variable:'FCSSugar',label:'Sugar & sweets',weight:.5,description:'Sugar, sweets and sugary drinks'},
] as const;
export type FcsInputs=Record<string,number|null>;
export const wfpExample={id:'WFP worked example',country:'Not specified',date:'Not specified',weight:1,inputs:{staples:7,pulses:2,dairy:3,protein:2,vegetables:2,fruit:1,fats:7,sugar:7},reported:50,source:'WFP Indicator Compendium, Food Consumption Score, V5.0 (2026). Illustrative household; not a national statistic.'};
export function calculateFcs(inputs:FcsInputs){
 const missing=fcsGroups.filter(g=>inputs[g.key]==null);if(missing.length)return {value:null,contributions:[],error:'Missing seven-day frequencies: '+missing.map(g=>g.label).join(', ')};
 const invalid=fcsGroups.filter(g=>!Number.isInteger(inputs[g.key])||inputs[g.key]!<0||inputs[g.key]!>7);if(invalid.length)return {value:null,contributions:[],error:'Enter whole numbers of days from 0 to 7: '+invalid.map(g=>g.label).join(', ')};
 const contributions=fcsGroups.map(g=>({...g,days:inputs[g.key]!,value:inputs[g.key]!*g.weight}));
 return {value:contributions.reduce((sum,g)=>sum+g.value,0),contributions};
}
export function fcsCategory(value:number,adjusted=false){return value<=(adjusted?28:21)?'Poor':value<=(adjusted?42:35)?'Borderline':'Acceptable';}
export interface FcsHousehold {id:string;country:string;date:string;weight:number;inputs:FcsInputs;reported:number|null;source:string}
/** RFC4180-style quoted CSV; no eval, no network, no spreadsheet formula execution. */
export function parseFcsCsv(text:string):FcsHousehold[]{
 if(text.length>1_000_000)throw new Error('Use a CSV smaller than 1 MB.');
 const lines:string[][]=[];let row:string[]=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){const ch=text[i];if(ch==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else if(quoted||!cell)quoted=!quoted;else throw new Error('Invalid quote in CSV.');}else if(ch===','&&!quoted){row.push(cell);cell='';}else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(v=>v.trim()))lines.push(row);row=[];cell='';}else cell+=ch;}
 if(quoted)throw new Error('CSV has an unclosed quoted field.');row.push(cell);if(row.some(v=>v.trim()))lines.push(row);
 const header=lines.shift()?.map(v=>v.replace(/^\uFEFF/,'').trim())??[];
 if(!header.length||new Set(header).size!==header.length)throw new Error('CSV headers must be present and unique.');
 const columns=fcsGroups.map(g=>({group:g,index:header.includes(g.key)?header.indexOf(g.key):header.indexOf(g.variable)}));
 if(columns.some(c=>c.index<0))throw new Error('Include all eight food groups: '+fcsGroups.map(g=>g.key).join(', '));
 if(!lines.length||lines.length>500)throw new Error('Use between 1 and 500 household records.');
 const ids=new Set<string>();
 return lines.map((cells,i)=>{
  if(cells.length!==header.length)throw new Error(`Row ${i+2}: column count does not match the header.`);
  const get=(key:string)=>cells[header.indexOf(key)]?.trim()??'';const id=get('household_id')||`Household ${i+1}`;
  if(ids.has(id))throw new Error(`Duplicate household_id: ${id}`);ids.add(id);
  const inputs=Object.fromEntries(columns.map(({group,index})=>[group.key,cells[index].trim()===''?null:Number(cells[index])]));const calculation=calculateFcs(inputs);
  if(calculation.value===null)throw new Error(`Row ${i+2}: ${calculation.error}`);
  const weight=get('weight')===''?1:Number(get('weight'));if(!Number.isFinite(weight)||weight<=0)throw new Error(`Row ${i+2}: weight must be positive.`);
  const reported=get('reported_fcs')===''?null:Number(get('reported_fcs'));if(reported!==null&&(!Number.isFinite(reported)||reported<0||reported>112))throw new Error(`Row ${i+2}: reported_fcs must be 0–112.`);
  const date=get('date');if(date&&(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date))throw new Error(`Row ${i+2}: date must use YYYY-MM-DD.`);
  return {id,country:get('country')||'Not specified',date:date||'Not specified',weight,inputs,reported,source:'User-supplied CSV; computed locally. Representativeness has not been established.'};
 });
}
export function summarizeFcs(rows:FcsHousehold[],adjusted=false){
 const valid=rows.map(row=>({row,result:calculateFcs(row.inputs)})).filter(r=>r.result.value!==null);
 if(valid.some(r=>!Number.isFinite(r.row.weight)||r.row.weight<=0))throw new Error('Survey weights must be finite and positive.');
 const maximum=Math.max(0,...valid.map(r=>r.row.weight));if(!maximum)return null;
 const scaled=(weight:number)=>weight/maximum;const total=valid.reduce((s,r)=>s+scaled(r.row.weight),0);
 return {households:valid.length,weightedMean:valid.reduce((s,r)=>s+scaled(r.row.weight)*r.result.value!,0)/total,shares:Object.fromEntries(['Poor','Borderline','Acceptable'].map(category=>[category,100*valid.filter(r=>fcsCategory(r.result.value!,adjusted)===category).reduce((s,r)=>s+scaled(r.row.weight),0)/total]))};
}
