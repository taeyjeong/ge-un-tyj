// MCP server over Streamable HTTP (stateless, JSON responses). Connect clients such as ChatGPT to
// https://<site>/api/mcp. Tools are read-only and defined in lib/peace-mcp.ts.
import {NextRequest, NextResponse} from 'next/server';
import {SERVER_INSTRUCTIONS, TOOLS} from '../../../lib/peace-mcp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SUPPORTED = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];
const SERVER_INFO = {name: 'peace-agreements-gender', title: 'Peace agreements & women (PA-X, PADD, CFR)', version: '1.0.0'};
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID',
  'Access-Control-Expose-Headers': 'Mcp-Session-Id, Mcp-Protocol-Version',
};

interface RpcMessage {jsonrpc?: string; id?: string|number|null; method?: string; params?: Record<string, unknown>}
const rpcError = (id: RpcMessage['id'], code: number, message: string) => ({jsonrpc: '2.0', id: id ?? null, error: {code, message}});

function handle(msg: RpcMessage) {
  const isRequest = msg.id !== undefined && msg.id !== null;
  if (msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') return isRequest ? rpcError(msg.id, -32600, 'Invalid request') : null;
  if (!isRequest) return null; // notifications (e.g. notifications/initialized) need no reply
  const params = msg.params ?? {};
  switch (msg.method) {
    case 'initialize': {
      const asked = typeof params.protocolVersion === 'string' ? params.protocolVersion : '';
      return {jsonrpc: '2.0', id: msg.id, result: {protocolVersion: SUPPORTED.includes(asked) ? asked : SUPPORTED[0], capabilities: {tools: {listChanged: false}}, serverInfo: SERVER_INFO, instructions: SERVER_INSTRUCTIONS}};
    }
    case 'ping':
      return {jsonrpc: '2.0', id: msg.id, result: {}};
    case 'tools/list':
      return {jsonrpc: '2.0', id: msg.id, result: {tools: TOOLS.map(t => ({name: t.name, title: t.title, description: t.description, inputSchema: t.inputSchema,
        annotations: {title: t.title, readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false}}))}};
    case 'tools/call': {
      const tool = TOOLS.find(t => t.name === params.name);
      if (!tool) return rpcError(msg.id, -32602, `Unknown tool: ${String(params.name)}`);
      try {
        const args = params.arguments && typeof params.arguments === 'object' ? (params.arguments as Record<string, unknown>) : {};
        return {jsonrpc: '2.0', id: msg.id, result: tool.run(args)};
      } catch (e) {
        return {jsonrpc: '2.0', id: msg.id, result: {content: [{type: 'text', text: `Tool error: ${e instanceof Error ? e.message : String(e)}`}], isError: true}};
      }
    }
    case 'resources/list': return {jsonrpc: '2.0', id: msg.id, result: {resources: []}};
    case 'prompts/list': return {jsonrpc: '2.0', id: msg.id, result: {prompts: []}};
    default:
      return rpcError(msg.id, -32601, `Method not found: ${msg.method}`);
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {body = await request.json();} catch {return NextResponse.json(rpcError(null, -32700, 'Parse error'), {status: 400, headers: CORS});}
  const batch = Array.isArray(body);
  const messages: unknown[] = batch ? (body as unknown[]) : [body];
  const replies = messages.map(m => handle((m ?? {}) as RpcMessage)).filter(r => r !== null);
  if (!replies.length) return new NextResponse(null, {status: 202, headers: CORS});
  return NextResponse.json(batch ? replies : replies[0], {headers: CORS});
}

// This server doesn't push messages, so there is no event stream to open.
export async function GET() {
  return new NextResponse('This MCP endpoint accepts JSON-RPC over POST (Streamable HTTP).', {status: 405, headers: {...CORS, Allow: 'POST'}});
}
export async function DELETE() {return new NextResponse(null, {status: 405, headers: {...CORS, Allow: 'POST'}});}
export async function OPTIONS() {return new NextResponse(null, {status: 204, headers: CORS});}
