// Public history of "Ask the data" questions and answers (public.ask_data_log), read with the
// server's secret key. Visitors are told in the chat that their questions are public. The random
// browser ID (visitor_id) is never returned. Questions asked in one chat conversation are grouped by
// conversation_id (a random id per conversation, not per visitor); ?thread=<row id> returns the whole
// conversation that row belongs to, plus any conversation it was continued from, oldest first.
import {NextRequest, NextResponse} from 'next/server';
import {serverSupabase} from '../../../lib/supabase/server-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STATUSES = ['answered', 'partial', 'insufficient_data', 'refused', 'error'] as const;
const FIELDS = 'id,created_at,page_path,question,answer,status,tools_used,data_gap,model,duration_ms';
type Db = NonNullable<ReturnType<typeof serverSupabase>>;
interface LogRow {id: number; conversation_id: string | null; continued_from: number | null; [key: string]: unknown}
const strip = ({conversation_id: _c, continued_from: _p, ...rest}: LogRow) => rest;  // eslint-disable-line @typescript-eslint/no-unused-vars

// The conversation a row belongs to, oldest first, with the conversation(s) it was continued from in front.
async function thread(db: Db, id: number) {
  const out: LogRow[] = [], seen = new Set<number>();
  let next: number | null = id;
  for (let depth = 0; next && depth < 8 && out.length < 60; depth++) {
    if (seen.has(next)) break;
    const one = await db.from('ask_data_log').select(`${FIELDS},conversation_id,continued_from`).eq('id', next).maybeSingle();
    const row = one.data as LogRow | null;
    if (!row) break;
    let rows: LogRow[] = [row];
    if (row.conversation_id) {
      const all = await db.from('ask_data_log').select(`${FIELDS},conversation_id,continued_from`).eq('conversation_id', row.conversation_id).order('id').limit(40);
      if (all.data?.length) rows = all.data as LogRow[];
    }
    rows.forEach(r => seen.add(r.id));
    out.unshift(...rows);
    next = rows.find(r => r.continued_from)?.continued_from ?? null;
  }
  return out.map(strip);
}

export async function GET(request: NextRequest) {
  const db = serverSupabase();
  if (!db) return NextResponse.json({error: 'The question history isn’t available on this site yet.'}, {status: 503});

  const p = request.nextUrl.searchParams;
  const threadId = Number(p.get('thread'));
  if (Number.isSafeInteger(threadId) && threadId > 0) {
    const rows = await thread(db, threadId);
    if (!rows.length) return NextResponse.json({error: 'That question wasn’t found.'}, {status: 404});
    return NextResponse.json({rows}, {headers: {'Cache-Control': 'public, max-age=30, s-maxage=30'}});
  }
  const status = p.get('status'), q = p.get('q')?.trim().slice(0, 200), before = Number(p.get('before')) || undefined;
  const limit = Math.min(Math.max(Number(p.get('limit')) || 50, 1), 100);

  let query = db.from('ask_data_log').select(`${FIELDS},conversation_id,continued_from`).order('id', {ascending: false}).limit(limit);
  if (status && (STATUSES as readonly string[]).includes(status)) query = query.eq('status', status);
  if (q) query = query.ilike('question', `%${q.replace(/[%_\\]/g, m => '\\' + m)}%`);
  if (before) query = query.lt('id', before);
  const {data, error} = await query;
  if (error) {console.error('ask-history: query failed', error.code); return NextResponse.json({error: 'Could not load the history.'}, {status: 500});}

  const counts = Object.fromEntries(await Promise.all(STATUSES.map(async s => {
    const {count} = await db.from('ask_data_log').select('id', {count: 'exact', head: true}).eq('status', s);
    return [s, count ?? 0] as const;
  })));
  // Where each question sits in its conversation, e.g. question 2 of 3, so follow-ups read in context.
  const list = (data ?? []) as unknown as LogRow[];
  const ids = [...new Set(list.map(r => r.conversation_id).filter((c): c is string => !!c))];
  const members = ids.length ? ((await db.from('ask_data_log').select('id,conversation_id').in('conversation_id', ids).order('id').limit(2000)).data ?? []) as {id: number; conversation_id: string}[] : [];
  const rows = list.map(r => {
    const group = r.conversation_id ? members.filter(m => m.conversation_id === r.conversation_id) : [];
    const position = group.findIndex(m => m.id === r.id) + 1;
    return {...strip(r), conversation: group.length > 1 || r.continued_from ? {position: position || 1, size: Math.max(group.length, 1), continued: !!r.continued_from} : null};
  });
  return NextResponse.json({rows, counts, hasMore: (data?.length ?? 0) === limit},
    {headers: {'Cache-Control': 'public, max-age=30, s-maxage=30'}});
}
