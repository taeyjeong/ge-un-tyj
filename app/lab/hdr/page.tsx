import Explorer from '../../../components/Explorer';
import {hdrPageCountries,initialHdrSelection} from '../../../lib/hdr-data';
export const metadata={title:'Full HDR explorer · Data lab',description:'The complete 40-measure HDR explorer, kept in the data lab.'};
export default async function Page({searchParams}:{searchParams:Promise<{countries?:string|string[]}>}){const params=await searchParams;const selected=initialHdrSelection(params.countries);return <Explorer key={selected?.join(',')??'default'} countries={hdrPageCountries()} initialSelected={selected}/>;}
