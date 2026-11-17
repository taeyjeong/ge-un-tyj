import {NextRequest,NextResponse} from 'next/server';
import {iloSourceUrl,parseIloQuery,parseIloRows,type IloQuery} from '../../../lib/ilostat';
export const runtime='nodejs';
export const maxDuration=30;
export async function GET(request:NextRequest){
 let query:IloQuery;
 try{query=parseIloQuery(request.nextUrl.searchParams);}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Invalid query.'},{status:400});}
 const sourceUrl=iloSourceUrl(query).toString();
 try{
  const upstream=await fetch(sourceUrl,{headers:{Accept:'application/json'},next:{revalidate:86400},signal:AbortSignal.timeout(25000)});
  if(!upstream.ok)return NextResponse.json({error:`ILOSTAT returned HTTP ${upstream.status}. Please try again later.`,sourceUrl},{status:502});
  const rows=parseIloRows(await upstream.json());
  return NextResponse.json({dataset:query.dataset,sourceUrl,queriedAt:new Date().toISOString(),rows});
 }catch(error){
  const timeout=error instanceof Error&&(error.name==='TimeoutError'||error.name==='AbortError');
  return NextResponse.json({error:timeout?'ILOSTAT took too long to respond. Try fewer countries or a shorter year range.':'Could not load a valid response from ILOSTAT. Please try again later.',sourceUrl},{status:timeout?504:502});
 }
}
