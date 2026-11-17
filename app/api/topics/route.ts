import {NextRequest,NextResponse} from 'next/server';
import {fetchTopicData,parseTopicQuery,type TopicQuery} from '../../../lib/topics';
export const runtime='nodejs';
export const maxDuration=60;
export async function GET(request:NextRequest){
 let query:TopicQuery;
 try{query=parseTopicQuery(request.nextUrl.searchParams);}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Invalid filters.'},{status:400});}
 try{
  const signal=AbortSignal.any([request.signal,AbortSignal.timeout(50000)]);
  const result=await fetchTopicData(query,async url=>{
   const response=await fetch(url,{headers:{Accept:'application/json'},next:{revalidate:86400},signal});
   if(!response.ok)throw new Error(`World Bank returned HTTP ${response.status}. Please retry later.`);
   return response.json();
  });
  return NextResponse.json(result);
 }catch(error){
  const timeout=error instanceof Error&&['TimeoutError','AbortError'].includes(error.name);
  return NextResponse.json({error:timeout?'The source took too long to respond. Retry or use fewer countries or years.':error instanceof Error?error.message:'Could not load topic data.'},{status:timeout?504:502});
 }
}
