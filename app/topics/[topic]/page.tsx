import {notFound} from 'next/navigation';
import TopicExplorer from '../../../components/TopicExplorer';
import {topicFor} from '../../../lib/topics';
import {initialTopicCountries,topicPageCountries} from '../../../lib/topic-page-countries';
interface Props {params:Promise<{topic:string}>;searchParams:Promise<{countries?:string}>}
export async function generateMetadata({params}:Props){const {topic}=await params;return {title:`${topicFor(topic)?.title??'Topic not found'} · GE / World Data`};}
export default async function Page({params,searchParams}:Props){const [{topic},filters]=await Promise.all([params,searchParams]);if(!topicFor(topic))notFound();return <TopicExplorer key={topic} topicId={topic} countries={topicPageCountries()} initialSelected={initialTopicCountries(filters.countries,'/topics/'+topic)}/>;}
