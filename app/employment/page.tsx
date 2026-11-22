import data from '../../lib/countries.json';
import {defaultCountriesFor} from '../../lib/navigation';
import EmploymentExplorer from '../../components/EmploymentExplorer';
export const metadata={title:'Employment & earnings · UN data',description:'Explore ILOSTAT employment and earnings data by country and sex.'};
export default async function EmploymentPage({searchParams}:{searchParams:Promise<{countries?:string}>}){
 const params=await searchParams;
 const requested=(params.countries??defaultCountriesFor('/employment').join(',')).split(',');
 const countries=data.map(({code,name,iso2,developmentGroup,developingRegion,geographicalRegion})=>({code,name,iso2,developmentGroup,developingRegion,geographicalRegion,series:{}})).toSorted((a,b)=>a.name.localeCompare(b.name));
 return <EmploymentExplorer countries={countries} initialSelected={requested.filter(code=>countries.some(country=>country.code===code))}/>;
}
