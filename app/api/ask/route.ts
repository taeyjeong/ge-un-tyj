// "Ask the data": answers questions about peace agreements with Claude, using the same read-only
// tools as the MCP server (lib/peace-mcp.ts) over the PA-X, PADD and CFR data and UNDP HDR country gender indicators. Each question and
// answer is logged to Supabase (public.ask_data_log) when SUPABASE_SECRET_KEY is configured, and
// listed publicly at /ask-history (without the visitor's browser ID).
// Needs ANTHROPIC_API_KEY (.env.local locally, Vercel project settings in production).
import Anthropic from '@anthropic-ai/sdk';
import {betaTool} from '@anthropic-ai/sdk/helpers/beta/json-schema';
import {after, NextRequest, NextResponse} from 'next/server';
import {TOOLS} from '../../../lib/peace-mcp';
import {serverSupabase} from '../../../lib/supabase/server-admin';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MODEL = 'claude-opus-5-5';
const MAX_TURNS = 12, MAX_CHARS = 2000;
const SYSTEM = `You answer questions on a public website about peace agreements and women's inclusion.

Your data comes only from the tools:
- PA-X Peace Agreements Database v10: 2,257 agreements (1990–2025) and whether each includes provisions on women, girls or gender ("mentions women").
- PADD (Peace Agreement Delegate Dataset): people named in 116 comprehensive agreements, with role and gender inferred from names.
- CFR Women's Participation in Peace Processes: women's share of negotiators for 47 major agreements.
- UNDP Human Development Report 2025 country gender indicators (country_gender_indicators): GII, GDI, women's share of parliament seats, labour force participation, secondary education, maternal mortality, adolescent births, life expectancy, schooling and income by sex, for 195 countries, 1990-2023. Country context only, not data about the peace process. Countries join to agreements by country name or ISO3 (pax_agreements.country_iso3).
- The project's own findings (project_findings) and known data issues (data_issues).
- query_database: read-only SQL over the same three datasets, for questions the other tools can't answer (custom filters, counts by year/region/country, joins across datasets, named delegates). Prefer the other tools when they fit; use SQL when they don't, and keep queries small.

How to answer:
- Get every number from a tool; don't state figures from memory. Keep answers short: a few sentences or a small list, in plain language for a general reader.
- Say which source a number comes from (PA-X, PADD or CFR) and give a link from the tool's url field when you name a specific agreement.
- Shares from gender_provision_rates are raw (no controls). When the project's findings cover the question, prefer them and mention their caveats.
- PADD's gender is assumed from names; CFR counts presence, not influence. Mention this when it matters.

When the project's data can't answer the question, fully or in part:
- Say so plainly at the start: the data here isn't sufficient to answer it. Don't fill the gap from general knowledge, and don't guess.
- Explain in one sentence what is missing (for example: years after 2025, the text of a provision, implementation, battle deaths).
- Call report_data_gap once, describing what was missing, with coverage "partial" if you can still answer part of the question from the data, or "none" if you can't answer any of it.
- Call official_data_sources and name one to three sources from that list that would cover it, with their links, and note that they could be added to this project. Only suggest sources from that list; if none fits, say that no listed source covers it.
- If part of the question can be answered from the data, answer that part too, clearly separated.

Stay on the topic of peace agreements, women's participation and this project. For an unrelated question, call report_data_gap with coverage "none" (so it's recorded), then briefly say it's outside what this project covers; don't answer it from general knowledge.`;

// Best-effort limit per visitor IP (resets when the server instance restarts).
const recent = new Map<string, number[]>();
function rateLimited(ip: string) {
  const now = Date.now(), windowMs = 10 * 60 * 1000, max = 20;
  const hits = (recent.get(ip) ?? []).filter(t => now - t < windowMs);
  hits.push(now); recent.set(ip, hits);
  return hits.length > max;
}

interface ChatTurn {role: 'user' | 'assistant'; content: string}
interface DataGap {coverage: 'partial' | 'none'; missing: string; topics?: string[]}
interface LogEntry {visitor_id: string | null; conversation_id: string | null; continued_from: number | null; page_path: string | null; question: string; answer: string | null; status: 'answered' | 'partial' | 'insufficient_data' | 'refused' | 'error';
  tools_used: string[]; data_gap: DataGap | null; model: string; duration_ms: number; input_tokens: number | null; output_tokens: number | null; error: string | null}

function saveLog(entry: LogEntry) {
  const db = serverSupabase();
  if (!db) return;
  after(async () => {  // runs after the response is sent, so logging never slows the answer
    let {error} = await db.from('ask_data_log').insert(entry);
    if (error?.code === '23503') ({error} = await db.from('ask_data_log').insert({...entry, continued_from: null}));  // unknown parent row
    if (error) console.error('ask: could not log question', error.code, error.message);
  });
}

// Read-only SQL over the peace tables in Supabase (migration 20261122000300). Runs through the
// query_peace_data() function as the read-only role peace_reader: one SELECT, max 200 rows, 5 s.
const DB_SCHEMA = `Postgres tables (read-only; one SELECT or WITH query; max 200 rows returned, so aggregate in SQL):
pax_agreements: one row per PA-X agreement (2,257, 1990-2025). agt_id (PA-X AgtId; link https://www.peaceagreements.org/view/<agt_id>), name, signed_on date, year, country, region, process_id, process_name, conflict_type (Government | Territory | Government/territory | Inter-group | Other), agreement_level (Inter | InterIntra | Intra | IntraLocal), stage (Pre | SubPar | SubComp | Imp | Ren | Cea | Oth), stage_label (Pre-negotiation | Partial substantive | Comprehensive | Implementation | Renewal | Ceasefire | Other), status, pages, n_characters, parties, third_parties, country_iso3, country2_iso3, mentions_women boolean (any provision on women, girls or gender), gewom (PA-X GeWom code), un_signatory, other_intl_signatory, peacekeeping (booleans), raw jsonb (all 279 PA-X columns, e.g. raw->>'GeMe', raw->>'GeLgbti', raw->>'GeFa', raw->>'Cons'; values are numbers or text).
padd_agreements: PADD, one row per comprehensive agreement with named people (116, 1990-2020). agt_id (joins pax_agreements), delegates, women_delegates, pct_women_delegates (0-1), signatories, women_signatories, pct_women_signatories (0-1), negotiators, women_negotiators, pct_women_negotiators (0-1), mediators, women_mediators, observers, women_observers, women_role_group (Woman signatory | Women present, none signed | No women named), raw jsonb (all PADD columns).
padd_delegates: one row per person named (2,301). id, agt_id, name, position_simple (Sig | Neg | Ob | Med | Adv | Log | WomCom | Unknown), position_label, position_detail, title, affiliation, is_woman (true, false, or null = unknown; assumed from names).
cfr_processes: CFR Women's Participation in Peace Processes (73 process pages). slug, url, country, agreement, process_type, negotiators_pct, mediators_pct, signatories_pct (0-100, null = no data), parliament_year, parliament_pct, ref_women_girls_gender (copied from PA-X), ref_violence_against_women, negotiating_parties, third_parties, pax_agt_id (joins pax_agreements; null if unmatched).
women_at_the_table (view): agreements with PADD and/or CFR data. agt_id, name, year, country, region, stage_label, mentions_women, un_signatory, pct_women_delegates, pct_women_signatories, women_signatories, women_role_group, cfr_negotiators_pct, cfr_signatories_pct, cfr_url.`;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({error: 'The AI assistant isn’t set up on this site yet.'}, {status: 503});
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (rateLimited(ip)) return NextResponse.json({error: 'Too many questions in a short time. Please wait a few minutes.'}, {status: 429});

  let turns: ChatTurn[], visitorId: string | null = null, pagePath: string | null = null, conversationId: string | null = null, continuedFrom: number | null = null;
  try {
    const body = await request.json() as {messages?: unknown; visitorId?: unknown; pagePath?: unknown; conversationId?: unknown; continuedFrom?: unknown};
    turns = (Array.isArray(body.messages) ? body.messages : []).filter((m): m is ChatTurn =>
      !!m && typeof m === 'object' && ((m as ChatTurn).role === 'user' || (m as ChatTurn).role === 'assistant') && typeof (m as ChatTurn).content === 'string');
    if (typeof body.visitorId === 'string' && UUID.test(body.visitorId)) visitorId = body.visitorId;
    if (typeof body.conversationId === 'string' && UUID.test(body.conversationId)) conversationId = body.conversationId;
    if (Number.isSafeInteger(body.continuedFrom) && (body.continuedFrom as number) > 0) continuedFrom = body.continuedFrom as number;
    if (typeof body.pagePath === 'string' && body.pagePath.startsWith('/') && !body.pagePath.startsWith('//')) pagePath = body.pagePath.slice(0, 1000);
  } catch {return NextResponse.json({error: 'Invalid request.'}, {status: 400});}
  turns = turns.slice(-MAX_TURNS).map(t => ({role: t.role, content: t.content.slice(0, MAX_CHARS)}));
  while (turns.length && turns[0].role !== 'user') turns.shift();  // the conversation must start with a question
  const question = turns[turns.length - 1]?.content.trim() ?? '';
  if (!turns.length || turns[turns.length - 1].role !== 'user' || !question) {
    return NextResponse.json({error: 'Ask a question of 1–2,000 characters.'}, {status: 400});
  }

  // Per-request tool wrappers, so this request's tool calls and any data gap can be logged.
  const toolsUsed: string[] = [];
  let dataGap: DataGap | null = null;
  const tools = [
    ...TOOLS.map(t => betaTool({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema as {type: 'object'; properties: Record<string, never>},
      run: (input: Record<string, unknown>) => {
        toolsUsed.push(t.name);
        const result = t.run(input ?? {});
        const text = result.content.map(c => c.text).join('\n');
        if (result.isError) throw new Error(text);  // returned to Claude as an error result
        return text;
      },
    })),
    betaTool({
      name: 'report_data_gap',
      description: 'Record that this project’s data can’t fully answer the question. Call it once, before answering, whenever data is missing or insufficient. coverage: "partial" when part of the question can still be answered from the data, "none" when none of it can.',
      inputSchema: {type: 'object', properties: {
        coverage: {type: 'string', enum: ['partial', 'none'], description: 'partial = some of the question is answered from the data; none = the data can’t answer any of it.'},
        missing: {type: 'string', description: 'One sentence: what data would be needed but isn’t in PA-X, PADD or CFR as used here.'},
        topics: {type: 'array', items: {type: 'string'}, description: 'Short topic labels, e.g. "implementation", "after 2025", "battle deaths".'},
      }, required: ['coverage', 'missing']},
      run: (input: {coverage?: string; missing: string; topics?: string[]}) => {
        toolsUsed.push('report_data_gap');
        dataGap = {coverage: input.coverage === 'partial' ? 'partial' : 'none', missing: String(input.missing).slice(0, 500), topics: Array.isArray(input.topics) ? input.topics.slice(0, 8).map(s => String(s).slice(0, 60)) : undefined};
        return input.coverage === 'partial'
          ? 'Recorded as partial. Answer the part the data covers, say plainly which part it can’t answer, and suggest official sources for that part.'
          : 'Recorded. Tell the visitor plainly that the data is not sufficient to answer, and suggest official sources.';
      },
    }),
  ];
  const db = serverSupabase();
  if (db) tools.push(betaTool({
    name: 'query_database',
    description: `Run one read-only SQL query over the project's peace agreements data and get the rows back as JSON. ${DB_SCHEMA}`,
    inputSchema: {type: 'object', properties: {sql: {type: 'string', description: 'One PostgreSQL SELECT (or WITH ... SELECT) query, no semicolons in the middle.'}}, required: ['sql']},
    run: async (input: {sql: string}) => {
      toolsUsed.push('query_database');
      const {data, error} = await db.rpc('query_peace_data', {sql: String(input.sql ?? '').slice(0, 4000)});
      if (error) throw new Error(`SQL error: ${error.message}`);  // returned to Claude so it can fix the query
      const text = JSON.stringify(data);
      return text.length > 20000 ? text.slice(0, 20000) + ' … (truncated; aggregate or select fewer columns)' : text;
    },
  }) as unknown as typeof tools[number]);

  const started = Date.now();
  const base = {visitor_id: visitorId, conversation_id: conversationId, continued_from: continuedFrom, page_path: pagePath, question, model: MODEL};
  const client = new Anthropic();
  try {
    const final = await client.beta.messages.toolRunner({
      model: MODEL,
      max_tokens: 8000,
      max_iterations: 8,
      output_config: {effort: 'medium'},
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',  // if Opus declines a request on safety grounds, the API retries it on a suitable model
      system: SYSTEM,
      tools,
      messages: turns,
    });
    const usage = {input_tokens: final.usage?.input_tokens ?? null, output_tokens: final.usage?.output_tokens ?? null};
    if (final.stop_reason === 'refusal') {
      const answer = 'Sorry, I can’t help with that question. Try asking about peace agreements and women’s inclusion.';
      saveLog({...base, answer, status: 'refused', tools_used: toolsUsed, data_gap: null, duration_ms: Date.now() - started, ...usage, error: null});
      return NextResponse.json({answer});
    }
    const answer = final.content.filter(b => b.type === 'text').map(b => (b as {text: string}).text).join('\n').trim()
      || 'I couldn’t finish that answer. Please try a more specific question.';
    saveLog({...base, answer, status: dataGap ? ((dataGap as DataGap).coverage === 'partial' ? 'partial' : 'insufficient_data') : 'answered', tools_used: toolsUsed, data_gap: dataGap, duration_ms: Date.now() - started, ...usage, error: null});
    return NextResponse.json({answer, coverage: dataGap ? (dataGap as DataGap).coverage : 'full'});
  } catch (error) {
    const status = error instanceof Anthropic.APIError ? error.status : undefined;
    saveLog({...base, answer: null, status: 'error', tools_used: toolsUsed, data_gap: null, duration_ms: Date.now() - started, input_tokens: null, output_tokens: null,
      error: (error instanceof Anthropic.APIError ? `Anthropic API ${status}` : error instanceof Error ? error.message : 'unknown').slice(0, 500)});
    if (error instanceof Anthropic.RateLimitError) return NextResponse.json({error: 'The assistant is busy right now. Please try again in a minute.'}, {status: 429});
    if (error instanceof Anthropic.AuthenticationError) {console.error('ask: Anthropic authentication failed'); return NextResponse.json({error: 'The AI assistant isn’t set up correctly.'}, {status: 503});}
    if (error instanceof Anthropic.APIError) {console.error('ask: Anthropic API error', status); return NextResponse.json({error: 'The assistant couldn’t answer right now. Please try again.'}, {status: 502});}
    console.error('ask: unexpected error', error);
    return NextResponse.json({error: 'Something went wrong. Please try again.'}, {status: 500});
  }
}
