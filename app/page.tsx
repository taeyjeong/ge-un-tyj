import IndexExplorer from '../components/IndexExplorer';
import {indexPageData} from '../lib/index-data';
import {navigationCountries} from '../lib/navigation';
export const metadata={title:'GII · Gender Inequality Index',description:'Compare gender inequality across countries, inspect the component values and follow the GII calculation and full equation.'};
export default async function Page({searchParams}:{searchParams:Promise<{countries?:string|string[]}>}){const params=await searchParams;const {countries,rows}=indexPageData('gii');const selected=navigationCountries(params.countries).filter(code=>countries.some(c=>c.code===code));return <IndexExplorer key={'gii-'+selected.join(',')} id="gii" countries={countries} observations={rows} initialSelected={selected}/>;}
