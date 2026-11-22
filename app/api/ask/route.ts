// "Ask the data": answers questions about peace agreements with Claude, using the same read-only
// tools as the MCP server (lib/peace-mcp.ts) over the PA-X, PADD and CFR data.
// Needs ANTHROPIC_API_KEY in the environment (.env.local locally, Vercel project settings in production).
import Anthropic from '@anthropic-ai/sdk';
import {betaTool} from '@anthropic-ai/sdk/helpers/beta/json-schema';
import {NextRequest, NextResponse} from 'next/server';
import {TOOLS} from '../../../lib/peace-mcp';

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
- Get every number from a tool; don't state figures from memory. If the tools don't cover something, say so plainly.
- Keep answers short: a few sentences or a small list, in plain language for a general reader.
- Say which source a number comes from (PA-X, PADD or CFR) and give a link from the tool's url field when you name a specific agreement.
- Shares from gender_provision_rates are raw (no controls). When the project's findings cover the question, prefer them and mention their caveats.
- PADD's gender is assumed from names; CFR counts presence, not influence. Mention this when it matters.
- Stay on the topic of peace agreements, women's participation and this project; briefly decline unrelated requests.`;

// The data tools, wrapped for the SDK tool runner. A tool that reports an error throws, which the
// runner returns to Claude as an error result.
const tools = TOOLS.map(t => betaTool({
  name: t.name,
  description: t.description,
  inputSchema: t.inputSchema as {type: 'object'; properties: Record<string, never>},
  run: (input: Record<string, unknown>) => {
    const result = t.run(input ?? {});
    const text = result.content.map(c => c.text).join('\n');
    if (result.isError) throw new Error(text);
    return text;
  },
}));

// Best-effort limit per visitor IP (resets when the server instance restarts).
const recent = new Map<string, number[]>();
function rateLimited(ip: string) {
  const now = Date.now(), windowMs = 10 * 60 * 1000, max = 20;
  const hits = (recent.get(ip) ?? []).filter(t => now - t < windowMs);
  hits.push(now); recent.set(ip, hits);
  return hits.length > max;
}

interface ChatTurn {role: 'user' | 'assistant'; content: string}

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({error: 'The AI assistant isn’t set up on this site yet.'}, {status: 503});
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (rateLimited(ip)) return NextResponse.json({error: 'Too many questions in a short time. Please wait a few minutes.'}, {status: 429});

  let turns: ChatTurn[];
  try {
    const body = await request.json() as {messages?: unknown};
    turns = (Array.isArray(body.messages) ? body.messages : []).filter((m): m is ChatTurn =>
      !!m && typeof m === 'object' && ((m as ChatTurn).role === 'user' || (m as ChatTurn).role === 'assistant') && typeof (m as ChatTurn).content === 'string');
  } catch {return NextResponse.json({error: 'Invalid request.'}, {status: 400});}
  turns = turns.slice(-MAX_TURNS).map(t => ({role: t.role, content: t.content.slice(0, MAX_CHARS)}));
  while (turns.length && turns[0].role !== 'user') turns.shift();  // the conversation must start with a question
  if (!turns.length || turns[turns.length - 1].role !== 'user' || !turns[turns.length - 1].content.trim()) {
    return NextResponse.json({error: 'Ask a question of 1–2,000 characters.'}, {status: 400});
  }

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
    if (final.stop_reason === 'refusal') return NextResponse.json({answer: 'Sorry, I can’t help with that question. Try asking about peace agreements and women’s inclusion.'});
    const answer = final.content.filter(b => b.type === 'text').map(b => (b as {text: string}).text).join('\n').trim();
    if (!answer) return NextResponse.json({answer: 'I couldn’t finish that answer. Please try a more specific question.'});
    return NextResponse.json({answer});
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return NextResponse.json({error: 'The assistant is busy right now. Please try again in a minute.'}, {status: 429});
    if (error instanceof Anthropic.AuthenticationError) {console.error('ask: Anthropic authentication failed'); return NextResponse.json({error: 'The AI assistant isn’t set up correctly.'}, {status: 503});}
    if (error instanceof Anthropic.APIError) {console.error('ask: Anthropic API error', error.status); return NextResponse.json({error: 'The assistant couldn’t answer right now. Please try again.'}, {status: 502});}
    console.error('ask: unexpected error', error);
    return NextResponse.json({error: 'Something went wrong. Please try again.'}, {status: 500});
  }
}
