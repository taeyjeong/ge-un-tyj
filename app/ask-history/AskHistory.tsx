'use client';
// Public list of every "Ask the data" question and answer, read through /api/ask-history.
import {Fragment, useCallback, useEffect, useState} from 'react';
import {downloadChatPdf, pdfFilename, type PdfEntry} from '../../lib/chat-pdf';
import {continueInChat} from '../../lib/ask-data-events';

interface Row {id: number; created_at: string; page_path: string | null; question: string; answer: string | null;
  status: 'answered' | 'partial' | 'insufficient_data' | 'refused' | 'error'; tools_used: string[]; data_gap: {missing?: string; topics?: string[]} | null;
  model: string | null; duration_ms: number | null; conversation?: {position: number; size: number; continued: boolean} | null}
const LABEL: Record<Row['status'], string> = {answered: 'Answered', partial: 'Partly answered', insufficient_data: 'Data not sufficient', refused: 'Declined', error: 'Error'};
const PILL: Record<Row['status'], string> = {answered: 'resolved', partial: 'handled', insufficient_data: 'limitation', refused: 'open', error: 'open'};
const when = (iso: string) => new Date(iso).toLocaleString(undefined, {year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'});

function linkify(text: string) {  // clickable links in answers; markdown bold markers dropped
  const parts: (string | {href: string; label: string})[] = [];
  const re = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s)]+)/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(text))) {if (m.index > last) parts.push(text.slice(last, m.index)); parts.push({href: m[2] ?? m[3], label: m[1] ?? m[3]}); last = m.index + m[0].length;}
  if (last < text.length) parts.push(text.slice(last));
  return parts.map((p, i) => typeof p === 'string' ? <span key={i}>{p.replace(/\*\*(.+?)\*\*/g, '$1')}</span> : <a key={i} href={p.href} target="_blank" rel="noopener noreferrer">{p.label}</a>);
}

function entries(list: Row[]): PdfEntry[] {
  return list.flatMap(r => [
    {role: 'user' as const, content: r.question, at: r.created_at, note: LABEL[r.status]},
    {role: 'assistant' as const, content: (r.answer ?? '(no answer: the assistant couldn’t respond)') + (r.data_gap?.missing ? `\n\nWhat data was missing: ${r.data_gap.missing}` : '')},
  ]);
}

// The whole conversation a question belongs to (and any conversation it was continued from), oldest first.
async function loadThread(r: Row): Promise<Row[]> {
  if (!r.conversation) return [r];
  const res = await fetch(`/api/ask-history?thread=${r.id}`);
  const data = await res.json().catch(() => ({})) as {rows?: Row[]; error?: string};
  if (!res.ok || !data.rows?.length) throw new Error(data.error ?? 'Could not load the conversation.');
  return data.rows;
}

// Opens the chat with the whole conversation so follow-up questions build on it. Questions that got
// no answer are left out; if the last one had none, it's put back in the box to ask again.
function continueThread(rows: Row[], from: number) {
  const answered = rows.filter(r => r.answer);
  const last = rows[rows.length - 1];
  continueInChat({continuedFrom: from, draft: last.answer ? undefined : last.question,
    turns: answered.flatMap(r => [
      {role: 'user' as const, content: r.question, at: r.created_at},
      {role: 'assistant' as const, content: r.answer!, at: r.created_at, coverage: r.status === 'partial' ? 'partial' as const : r.status === 'insufficient_data' ? 'none' as const : 'full' as const},
    ])});
}

export default function AskHistory() {
  const [rows, setRows] = useState<Row[]>([]), [counts, setCounts] = useState<Record<string, number>>({}), [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState(''), [search, setSearch] = useState(''), [applied, setApplied] = useState(''), [message, setMessage] = useState(''), [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<number | null>(null), [saving, setSaving] = useState(false);
  async function continueRow(r: Row) {
    setSaving(true); setMessage('');
    try {continueThread(await loadThread(r), r.id);}
    catch (e) {setMessage(e instanceof Error ? e.message : 'Could not load the conversation.');}
    finally {setSaving(false);}
  }
  async function download(list: Row[], one: boolean) {
    setSaving(true); setMessage('');
    try {
      if (one && list[0].conversation) {
        const all = await loadThread(list[0]);
        await downloadChatPdf({title: 'Ask the data: conversation', subtitle: `${all.length} questions · started ${when(all[0].created_at)}`, entries: entries(all), filename: pdfFilename(`ask-the-data-conversation-q${list[0].id}`, all[0].created_at)});
        return;
      }
      await downloadChatPdf(one
        ? {title: 'Ask the data: question and answer', subtitle: `Asked ${when(list[0].created_at)}${list[0].page_path ? ` on ${list[0].page_path}` : ''}`, entries: entries(list), filename: pdfFilename(`ask-the-data-q${list[0].id}`, list[0].created_at)}
        : {title: 'Ask the data: questions people have asked', subtitle: `${list.length} question${list.length === 1 ? '' : 's'}, newest first${status ? ` · ${LABEL[status as Row['status']]}` : ''}${applied ? ` · matching “${applied}”` : ''}`, entries: entries(list), filename: pdfFilename('ask-the-data-history')});
    } catch {setMessage('Couldn’t make the PDF. Please try again.');}
    finally {setSaving(false);}
  }

  const load = useCallback(async (append = false, before?: number) => {
    setLoading(true); setMessage('');
    const params = new URLSearchParams({limit: '50'});
    if (status) params.set('status', status);
    if (applied) params.set('q', applied);
    if (before) params.set('before', String(before));
    try {
      const res = await fetch('/api/ask-history?' + params);
      const data = await res.json().catch(() => ({})) as {rows?: Row[]; counts?: Record<string, number>; hasMore?: boolean; error?: string};
      if (!res.ok) throw new Error(data.error ?? 'Could not load the history.');
      setRows(prev => append ? [...prev, ...(data.rows ?? [])] : data.rows ?? []); setCounts(data.counts ?? {}); setHasMore(!!data.hasMore);
    } catch (e) {setMessage(e instanceof Error ? e.message : 'Could not load the history.');}
    finally {setLoading(false);}
  }, [status, applied]);
  useEffect(() => {void load();}, [load]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return <>
    <div className="log-filters">
      <button type="button" aria-pressed={!status} onClick={() => setStatus('')}>All ({total})</button>
      {(Object.keys(LABEL) as Row['status'][]).map(s => <button key={s} type="button" aria-pressed={status === s} onClick={() => setStatus(s)}><span className={`log-pill log-pill-${PILL[s]}`}>{LABEL[s]}</span> {counts[s] ?? 0}</button>)}
      <form onSubmit={e => {e.preventDefault(); setApplied(search.trim());}}><input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search questions…" aria-label="Search questions"/></form>
      <button type="button" disabled={!rows.length || saving} onClick={() => void download(rows, false)}>{saving ? 'Making PDF…' : `↓ Download ${rows.length} as PDF`}</button>
    </div>
    {message && <p className="project-note" role="alert">{message}</p>}
    <div className="log-table"><table><thead><tr><th>When</th><th>Status</th><th>Question</th><th>What data was missing</th></tr></thead><tbody>
      {!rows.length && <tr><td colSpan={4}>{loading ? 'Loading…' : 'No questions match.'}</td></tr>}
      {rows.map(r => <Fragment key={r.id}>
        <tr className="log-row" onClick={() => setOpen(open === r.id ? null : r.id)}>
          <td><small>{when(r.created_at)}</small>{r.page_path && <><br/><small>asked on {r.page_path}</small></>}</td>
          <td><span className={`log-pill log-pill-${PILL[r.status]}`}>{LABEL[r.status]}</span></td>
          <td><button type="button" className="log-expand" aria-expanded={open === r.id}>{r.question}</button><br/>{r.conversation && <small className="log-thread">{r.conversation.size > 1 ? `Question ${r.conversation.position} of ${r.conversation.size} in a conversation` : 'Follow-up'}{r.conversation.continued ? ' · continued from an earlier chat' : ''} · </small>}<small>{open === r.id ? 'Hide answer' : 'Show answer'}</small></td>
          <td>{r.data_gap?.missing ?? ''}{r.data_gap?.topics?.length ? <><br/><small>{r.data_gap.topics.join(' · ')}</small></> : null}</td>
        </tr>
        {open === r.id && <tr className="log-answer"><td colSpan={4}>
          <p className="log-answer-text">{r.answer ? linkify(r.answer) : '(no answer: the assistant couldn’t respond)'}</p>
          <p className="log-answer-actions">
            <button type="button" className="button" disabled={saving} onClick={() => void continueRow(r)}>{saving ? 'Loading…' : r.conversation ? 'Continue this conversation →' : r.answer ? 'Continue this chat →' : 'Ask this again →'}</button>
            <button type="button" className="button secondary" disabled={saving} onClick={() => void download([r], true)}>{r.conversation ? '↓ Download this conversation as PDF' : '↓ Download this answer as PDF'}</button>
          </p>
          <small>{[r.model && `Answered by ${r.model}`, r.duration_ms != null && `${(r.duration_ms / 1000).toFixed(1)}s`, r.tools_used.length && `tools: ${r.tools_used.join(', ')}`].filter(Boolean).join(' · ')}</small>
        </td></tr>}
      </Fragment>)}
    </tbody></table></div>
    {hasMore && <p><button type="button" className="button secondary" disabled={loading} onClick={() => void load(true, rows[rows.length - 1]?.id)}>{loading ? 'Loading…' : 'Load older questions'}</button></p>}
  </>;
}
