// Public history of "Ask the data" questions and answers (public.ask_data_log), read with the
// server's secret key. Visitors are told in the chat that their questions are public. The random
// browser ID (visitor_id) is never returned, so one person's questions can't be linked together.
import {NextRequest, NextResponse} from 'next/server';
import {serverSupabase} from '../../../lib/supabase/server-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STATUSES = ['answered', 'partial', 'insufficient_data', 'refused', 'error'] as const;
const FIELDS = 'id,created_at,page_path,question,answer,status,tools_used,data_gap,model,duration_ms';

export async function GET(request: NextRequest) {
  const db = serverSupabase();
  if (!db) return NextResponse.json({error: 'The question history isn’t available on this site yet.'}, {status: 503});

  const p = request.nextUrl.searchParams;
  const status = p.get('status'), q = p.get('q')?.trim().slice(0, 200), before = Number(p.get('before')) || undefined;
  const limit = Math.min(Math.max(Number(p.get('limit')) || 50, 1), 100);

  let query = db.from('ask_data_log').select(FIELDS).order('id', {ascending: false}).limit(limit);
  if (status && (STATUSES as readonly string[]).includes(status)) query = query.eq('status', status);
  if (q) query = query.ilike('question', `%${q.replace(/[%_\\]/g, m => '\\' + m)}%`);
  if (before) query = query.lt('id', before);
  const {data, error} = await query;
  if (error) {console.error('ask-history: query failed', error.code); return NextResponse.json({error: 'Could not load the history.'}, {status: 500});}

  const counts = Object.fromEntries(await Promise.all(STATUSES.map(async s => {
    const {count} = await db.from('ask_data_log').select('id', {count: 'exact', head: true}).eq('status', s);
    return [s, count ?? 0] as const;
  })));
  return NextResponse.json({rows: data ?? [], counts, hasMore: (data?.length ?? 0) === limit},
    {headers: {'Cache-Control': 'public, max-age=30, s-maxage=30'}});
}
