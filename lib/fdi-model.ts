import reconstruction from './fdi-reconstruction.json' with {type:'json'};
export const fdiFields=[
 {key:'fid',label:'Institutions · depth',description:'Private-sector credit, pension and mutual fund assets, and insurance premiums relative to GDP.'},
 {key:'fia',label:'Institutions · access',description:'Bank branches and ATMs per 100,000 adults.'},
 {key:'fie',label:'Institutions · efficiency',description:'Bank margins, spreads, income/cost ratios and profitability.'},
 {key:'fmd',label:'Markets · depth',description:'Stock market size/trading and government, financial and nonfinancial debt securities.'},
 {key:'fma',label:'Markets · access',description:'Market capitalization outside the largest ten companies and debt issuers per 100,000 adults.'},
 {key:'fme',label:'Markets · efficiency',description:'Stock market turnover: traded value relative to capitalization.'},
] as const;
export function fdiAggregate(target:'fi'|'fm'|'fd',values:Record<string,number>){
 const p=reconstruction.parameters[target];const weighted=Object.entries(p.weights).reduce((sum,[key,weight])=>sum+values[key]*weight,0);
 return {weighted,value:(weighted-p.minimum)/(p.maximum-p.minimum)};
}
export const fdiReconstruction=reconstruction;
