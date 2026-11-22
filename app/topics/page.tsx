import TopicExplorer from '../../components/TopicExplorer';
import {initialTopicCountries,topicPageCountries} from '../../lib/topic-page-countries';
export const metadata={title:'World topics · GE / World Data',description:'Explore 50 country indicators across climate, poverty, health, education, energy, conflict and more.'};
export default async function Page({searchParams}:{searchParams:Promise<{countries?:string}>}){const params=await searchParams;return <TopicExplorer topicId="all" countries={topicPageCountries()} initialSelected={initialTopicCountries(params.countries,'/topics')}/>;}
