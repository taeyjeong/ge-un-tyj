// "Ask the data": answers questions about peace agreements with Claude, using the same read-only
// tools as the MCP server (lib/peace-mcp.ts) over the PA-X, PADD and CFR data. Each question and
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
- The project's own findings (project_findings) and known data issues (data_issues).

How to answer:
- Get every number from a tool; don't state figures from memory. Keep answers short: a few sentences or a small list, in plain language for a general reader.
- Say which source a number comes from (PA-X, PADD or CFR) and give a link from the tool's url field when you name a specific agreement.
- Shares from gender_provision_rates are raw (no controls). When the project's findings cover the question, prefer them and mention their caveats.
- PADD's gender is assumed from names; CFR counts presence, not influence. Mention this when it matters.

When the project's data can't answer the question, fully or in part:
- Say so plainly at the start: the data here isn't sufficient to answer it. Don't fill the gap from general knowledge, and don't guess.
- Explain in one sentence what is missing (for example: years after 2025, the text of a provision, implementation, battle deaths, women in parliament).
- Call report_data_gap once, describing what was missing.
- Call official_data_sources and name one to three official public sources that would cover it, with their links, and note that they could be added to this project.
- If part of the question can be answered from the data, answer that part too, clearly separated.

Stay on the topic of peace agreements, women's participation and this project; briefly decline unrelated requests.`;

// Best-effort limit per visitor IP (resets when the server instance restarts).
const recent = new Map<string, number[]>();
function rateLimited(ip: string) {
  const now = Date.now(), windowMs = 10 * 60 * 1000, max = 20;
  const hits = (recent.get(ip) ?? []).filter(t => now - t < windowMs);
  hits.push(now); recent.set(ip, hits);
  return hits.length > max;
}

interface ChatTurn {role: 'user' | 'assistant'; content: string}
interface DataGap {missing: string; topics?: string[]}
interface LogEntry {visitor_id: string | null; page_path: string | null; question: string; answer: string | null; status: 'answered' | 'insufficient_data' | 'refused' | 'error';
  tools_used: string[]; data_gap: DataGap | null; model: string; duration_ms: number; input_tokens: number | null; output_tokens: number | null; error: string | null}

function saveLog(entry: LogEntry) {
  const db = serverSupabase();
  if (!db) return;
  after(async () => {  // runs after the response is sent, so logging never slows the answer
    const {error} = await db.from('ask_data_log').insert(entry);
    if (error) console.error('ask: could not log question', error.code, error.message);
  });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({error: 'The AI assistant isn’t set up on this site yet.'}, {status: 503});
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (rateLimited(ip)) return NextResponse.json({error: 'Too many questions in a short time. Please wait a few minutes.'}, {status: 429});

  let turns: ChatTurn[], visitorId: string | null = null, pagePath: string | null = null;
  try {
    const body = await request.json() as {messages?: unknown; visitorId?: unknown; pagePath?: unknown};
    turns = (Array.isArray(body.messages) ? body.messages : []).filter((m): m is ChatTurn =>
      !!m && typeof m === 'object' && ((m as ChatTurn).role === 'user' || (m as ChatTurn).role === 'assistant') && typeof (m as ChatTurn).content === 'string');
    if (typeof body.visitorId === 'string' && UUID.test(body.visitorId)) visitorId = body.visitorId;
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
      description: 'Record that this project’s data can’t fully answer the question. Call it once, before answering, whenever data is missing or insufficient.',
      inputSchema: {type: 'object', properties: {
        missing: {type: 'string', description: 'One sentence: what data would be needed but isn’t in PA-X, PADD or CFR as used here.'},
        topics: {type: 'array', items: {type: 'string'}, description: 'Short topic labels, e.g. "implementation", "after 2025", "women in parliament".'},
      }, required: ['missing']},
      run: (input: {missing: string; topics?: string[]}) => {
        toolsUsed.push('report_data_gap');
        dataGap = {missing: String(input.missing).slice(0, 500), topics: Array.isArray(input.topics) ? input.topics.slice(0, 8).map(s => String(s).slice(0, 60)) : undefined};
        return 'Recorded. Now tell the visitor plainly that the data is not sufficient, and suggest official sources.';
      },
    }),
  ];

  const started = Date.now();
  const base = {visitor_id: visitorId, page_path: pagePath, question, model: MODEL};
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
    saveLog({...base, answer, status: dataGap ? 'insufficient_data' : 'answered', tools_used: toolsUsed, data_gap: dataGap, duration_ms: Date.now() - started, ...usage, error: null});
    return NextResponse.json({answer, dataGap: !!dataGap});
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
