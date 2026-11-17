import {indexPageData} from '../../lib/index-data';
import {indexFor} from '../../lib/indices';
import {navigationCountries} from '../../lib/navigation';
import IndicesDashboard from './IndicesDashboard';
export const metadata={title:'Indices reports · GE Analytics',description:'An experimental analytics dashboard for composite development indices, country comparisons and index components.'};
export default async function Page({searchParams}:{searchParams:Promise<{index?:string;countries?:string}>}){
 const params=await searchParams;
 const definition=indexFor(params.index??'gii')??indexFor('gii')!;
 const {countries,rows}=indexPageData(definition.id);
 const compact=countries.map(country=>({...country,series:{}}));
 return <IndicesDashboard key={definition.id} indexId={definition.id} countries={compact} observations={rows} initialSelected={navigationCountries(params.countries)}/>;
}
