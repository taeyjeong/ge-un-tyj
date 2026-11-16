import Explorer from '../components/Explorer';
import data from '../lib/countries.json';
import type {Country,Observation} from '../lib/types';
const countries:Country[]=data.map(country=>({
 ...country,
 series:Object.fromEntries(Object.entries(country.series).map(([metric,points])=>[
  metric,
  points.map(([year,value]):Observation=>{
   if(typeof year!=='number'||(value!==null&&typeof value!=='number'))throw new Error(`Invalid observation: ${country.code}/${metric}`);
   return [year,value];
  })
 ]))
}));
export default function Page(){return <Explorer countries={countries.toSorted((a,b)=>a.name.localeCompare(b.name))}/>;}
