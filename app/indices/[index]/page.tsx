import {notFound,redirect} from 'next/navigation';
import IndexExplorer from '../../../components/IndexExplorer';
import FcsExplorer from '../../../components/FcsExplorer';
import {indexFor} from '../../../lib/indices';
import {indexPageData} from '../../../lib/index-data';
import {navigationCountries,navigationHref} from '../../../lib/navigation';
interface Props {params:Promise<{index:string}>;searchParams:Promise<{countries?:string|string[]}>}
export async function generateMetadata({params}:Props){const {index}=await params;return {title:`${indexFor(index)?.short??'Index not found'} · Composite indices`};}
export default async function Page({params,searchParams}:Props){const [{index},filters]=await Promise.all([params,searchParams]);const definition=indexFor(index);if(!definition)notFound();if(definition.id==='gii')redirect(navigationHref('/',navigationCountries(filters.countries)));if(definition.id==='fcs'){const raw=Array.isArray(filters.countries)?filters.countries.join(','):filters.countries??'JPN,KOR,USA';return <FcsExplorer navCountries={[...new Set(raw.split(',').filter(c=>/^[A-Z]{3}$/.test(c)))]}/>;}const {countries,rows}=indexPageData(definition.id);const requested=Array.isArray(filters.countries)?filters.countries.join(','):filters.countries??'JPN,KOR,USA';const selected=[...new Set(requested.split(',').map(c=>c.trim().toUpperCase()))].filter(code=>countries.some(c=>c.code===code));return <IndexExplorer key={index+'-'+selected.join(',')} id={definition.id} countries={countries} observations={rows} initialSelected={selected}/>;}
