import data from '../../lib/countries.json';
import LiveExplorer from '../../components/LiveExplorer';
export const metadata={title:'SDG · Gender equality'};
export default async function Page({searchParams}:{searchParams:Promise<{countries?:string}>}){
 const params=await searchParams;
 const countries=data.map(({code,name,iso2,developmentGroup,developingRegion,geographicalRegion})=>({code,name,iso2,developmentGroup,developingRegion,geographicalRegion,series:{}})).sort((a,b)=>a.name.localeCompare(b.name));
 const selected=(params.countries??'JPN,KOR,USA').split(',').filter(c=>countries.some(x=>x.code===c));
 return <LiveExplorer source="sdg" countries={countries} initialSelected={selected}/>;
}
