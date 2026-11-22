'use client';
// Public list of every "Ask the data" question and answer, read through /api/ask-history.
import {Fragment, useCallback, useEffect, useState} from 'react';

interface Row {id: number; created_at: string; page_path: string | null; question: string; answer: string | null;
  status: 'answered' | 'partial' | 'insufficient_data' | 'refused' | 'error'; tools_used: string[]; data_gap: {missing?: string; topics?: string[]} | null;
  model: string | null; duration_ms: number | null}
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

export default function AskHistory() {
  const [rows, setRows] = useState<Row[]>([]), [counts, setCounts] = useState<Record<string, number>>({}), [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState(''), [search, setSearch] = useState(''), [applied, setApplied] = useState(''), [message, setMessage] = useState(''), [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<number | null>(null);

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
    </div>
    {message && <p className="project-note" role="alert">{message}</p>}
    <div className="log-table"><table><thead><tr><th>When</th><th>Status</th><th>Question</th><th>What data was missing</th></tr></thead><tbody>
      {!rows.length && <tr><td colSpan={4}>{loading ? 'Loading…' : 'No questions match.'}</td></tr>}
      {rows.map(r => <Fragment key={r.id}>
        <tr className="log-row" onClick={() => setOpen(open === r.id ? null : r.id)}>
          <td><small>{when(r.created_at)}</small>{r.page_path && <><br/><small>asked on {r.page_path}</small></>}</td>
          <td><span className={`log-pill log-pill-${PILL[r.status]}`}>{LABEL[r.status]}</span></td>
          <td><button type="button" className="log-expand" aria-expanded={open === r.id}>{r.question}</button><br/><small>{open === r.id ? 'Hide answer' : 'Show answer'}</small></td>
          <td>{r.data_gap?.missing ?? ''}{r.data_gap?.topics?.length ? <><br/><small>{r.data_gap.topics.join(' · ')}</small></> : null}</td>
        </tr>
        {open === r.id && <tr className="log-answer"><td colSpan={4}>
          <p className="log-answer-text">{r.answer ? linkify(r.answer) : '(no answer: the assistant couldn’t respond)'}</p>
          <small>{[r.model && `Answered by ${r.model}`, r.duration_ms != null && `${(r.duration_ms / 1000).toFixed(1)}s`, r.tools_used.length && `tools: ${r.tools_used.join(', ')}`].filter(Boolean).join(' · ')}</small>
        </td></tr>}
      </Fragment>)}
    </tbody></table></div>
    {hasMore && <p><button type="button" className="button secondary" disabled={loading} onClick={() => void load(true, rows[rows.length - 1]?.id)}>{loading ? 'Loading…' : 'Load older questions'}</button></p>}
  </>;
}
