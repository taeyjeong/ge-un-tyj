import data from '../../lib/countries.json';
import {defaultCountriesFor} from '../../lib/navigation';
import LiveExplorer from '../../components/LiveExplorer';
export const metadata={title:'UNICEF · Gender equality'};
export default async function Page({searchParams}:{searchParams:Promise<{countries?:string}>}){
 const params=await searchParams;
 const countries=data.map(({code,name,iso2,developmentGroup,developingRegion,geographicalRegion})=>({code,name,iso2,developmentGroup,developingRegion,geographicalRegion,series:{}})).sort((a,b)=>a.name.localeCompare(b.name));
 const selected=(params.countries??defaultCountriesFor('/unicef').join(',')).split(',').filter(c=>countries.some(x=>x.code===c));
 return <LiveExplorer source="unicef" countries={countries} initialSelected={selected}/>;
}
