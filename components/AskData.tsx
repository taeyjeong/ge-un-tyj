'use client';
// "Ask the data": a Q&A with Claude over the PA-X, PADD and CFR data (via /api/ask). Questions and
// answers are saved on the server and shown publicly at /ask-history; each visitor's own past
// conversations are also kept in their browser (localStorage) and can be reopened from History.
import {useEffect, useRef, useState, type FormEvent} from 'react';
import styles from './PublicChat.module.css';
import {downloadChatPdf, pdfFilename} from '../lib/chat-pdf';

interface Turn {role: 'user' | 'assistant'; content: string; at?: string; coverage?: 'full' | 'partial' | 'none'}
interface Conversation {id: string; started: string; updated: string; turns: Turn[]}

const VISITOR_KEY = 'ge:ask-data:visitor', HISTORY_KEY = 'ge:ask-data:history', MAX_SAVED = 50;
function visitorId() {  // random id kept in this browser so the log can group a visitor's questions; not linked to any account
  try {
    const saved = localStorage.getItem(VISITOR_KEY);
    if (saved) return saved;
    const fresh = crypto.randomUUID(); localStorage.setItem(VISITOR_KEY, fresh); return fresh;
  } catch {return undefined;}
}
function readHistory(): Conversation[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter(c => c && typeof c.id === 'string' && Array.isArray(c.turns)) : [];
  } catch {return [];}
}
function writeHistory(list: Conversation[]) {try {localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, MAX_SAVED)));} catch {}}
const when = (iso: string) => new Date(iso).toLocaleString(undefined, {month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'});

const EXAMPLES = ['Which kinds of peace agreements mention women most often?', 'Did women sign the 2016 Colombia peace agreement?', 'Does it matter if a woman signs a comprehensive agreement?'];

function linkify(text: string) {
  // Show bare URLs and [label](url) links as clickable links; everything else stays plain text.
  const parts: (string | {href: string; label: string})[] = [];
  const re = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s)]+)/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push({href: m[2] ?? m[3], label: m[1] ?? m[3]});
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.map((p, i) => typeof p === 'string' ? <span key={i}>{p.replace(/\*\*(.+?)\*\*/g, '$1')}</span> : <a key={i} href={p.href} target="_blank" rel="noopener noreferrer">{p.label}</a>);
}

export default function AskData({focusKey}: {focusKey: number}) {
  const [turns, setTurns] = useState<Turn[]>([]), [question, setQuestion] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false), [history, setHistory] = useState<Conversation[]>([]);
  const conversationId = useRef<string | null>(null), started = useRef<string>('');
  const list = useRef<HTMLDivElement>(null), box = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {setHistory(readHistory());}, []);
  useEffect(() => {if (!showHistory) box.current?.focus();}, [focusKey, showHistory]);
  useEffect(() => {list.current?.scrollTo({top: list.current.scrollHeight});}, [turns, busy]);

  function save(next: Turn[]) {  // keep this conversation at the top of the browser's history
    if (!conversationId.current) {conversationId.current = crypto.randomUUID(); started.current = new Date().toISOString();}
    const entry: Conversation = {id: conversationId.current, started: started.current, updated: new Date().toISOString(), turns: next};
    const updated = [entry, ...readHistory().filter(c => c.id !== entry.id)];
    writeHistory(updated); setHistory(updated.slice(0, MAX_SAVED));
  }
  function startNew() {conversationId.current = null; setTurns([]); setError(''); setShowHistory(false);}
  function reopen(c: Conversation) {conversationId.current = c.id; started.current = c.started; setTurns(c.turns); setError(''); setShowHistory(false);}
  function forget(id: string) {const updated = readHistory().filter(c => c.id !== id); writeHistory(updated); setHistory(updated); if (conversationId.current === id) startNew();}

  const [saving, setSaving] = useState(false);
  async function downloadPdf(c: {started: string; turns: Turn[]}) {
    setSaving(true); setError('');
    try {
      await downloadChatPdf({title: 'Ask the data: conversation', subtitle: `Peace agreements & women’s inclusion · started ${when(c.started)}`, filename: pdfFilename('ask-the-data', c.started),
        entries: c.turns.map(t => ({role: t.role, content: t.content, at: t.at, note: t.coverage === 'partial' ? 'Partly answered' : t.coverage === 'none' ? 'Data not sufficient' : undefined}))});
    } catch {setError('Couldn’t make the PDF. Please try again.');}
    finally {setSaving(false);}
  }

  async function ask(text: string, event?: FormEvent) {
    event?.preventDefault();
    const q = text.trim();
    if (!q || busy) return;
    if (q.length > 2000) {setError('Ask a question of up to 2,000 characters.'); return;}
    const next: Turn[] = [...turns, {role: 'user', content: q, at: new Date().toISOString()}];
    setTurns(next); setQuestion(''); setBusy(true); setError('');
    try {
      const res = await fetch('/api/ask', {method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({messages: next.map(({role, content}) => ({role, content})), visitorId: visitorId(), pagePath: window.location.pathname})});
      const data = await res.json().catch(() => ({})) as {answer?: string; error?: string; coverage?: Turn['coverage']};
      if (!res.ok || !data.answer) throw new Error(data.error || 'The assistant couldn’t answer right now. Please try again.');
      const done: Turn[] = [...next, {role: 'assistant', content: data.answer, at: new Date().toISOString(), coverage: data.coverage}];
      setTurns(done); save(done);
    } catch (e) {
      setTurns(turns); setQuestion(q);  // keep the question so it can be resent
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {setBusy(false); box.current?.focus();}
  }

  const toolbar = <div className={styles.status}>
    <span>{showHistory ? `${history.length} saved conversation${history.length === 1 ? '' : 's'} · this browser only` : turns.length ? `Conversation started ${when(started.current || new Date().toISOString())}` : 'New conversation'}</span>
    <span className={styles.toolbarButtons}>
      {!showHistory && turns.length > 0 && <button type="button" disabled={busy || saving} onClick={() => void downloadPdf({started: started.current || new Date().toISOString(), turns})} aria-label="Download this conversation as a PDF">{saving ? 'Saving…' : '↓ PDF'}</button>}
      {!showHistory && turns.length > 0 && <button type="button" disabled={busy} onClick={startNew}>New</button>}
      <button type="button" disabled={busy} aria-pressed={showHistory} onClick={() => setShowHistory(v => !v)}>{showHistory ? 'Back to chat' : `History (${history.length})`}</button>
    </span>
  </div>;

  if (showHistory) return <>
    {toolbar}
    <div className={styles.messages} role="list" aria-label="Your past conversations">
      {!history.length && <p className={styles.empty}>No saved conversations yet. Questions you ask here are kept in this browser.</p>}
      {history.map(c => {
        const first = c.turns.find(t => t.role === 'user')?.content ?? '(no question)';
        const asked = c.turns.filter(t => t.role === 'user').length;
        return <article key={c.id} role="listitem" className={`${styles.message} ${styles.historyItem}`}>
          <div><strong>{when(c.updated)}</strong><span>{asked} question{asked === 1 ? '' : 's'}</span></div>
          <p>{first.length > 160 ? first.slice(0, 160) + '…' : first}</p>
          <div className={styles.historyActions}><button type="button" onClick={() => reopen(c)}>Open</button><button type="button" disabled={saving} onClick={() => void downloadPdf(c)} aria-label={`Download conversation from ${when(c.updated)} as a PDF`}>PDF</button><button type="button" onClick={() => forget(c.id)} aria-label={`Delete conversation from ${when(c.updated)}`}>Delete</button></div>
        </article>;
      })}
      {history.length > 0 && <p className={styles.empty}>Your conversations, saved in this browser (up to {MAX_SAVED}). Everyone’s questions are on the <a href="/ask-history">Questions asked</a> page.</p>}
    </div>
  </>;

  return <>
    <div className={styles.visibility}><span aria-hidden="true">✦</span><span>Answers from an AI (Claude) using PA-X, PADD and CFR peace data, plus UNDP country gender indicators.<small><b>Questions and answers are public</b>: they’re saved and listed on the <a href="/ask-history">Questions asked</a> page (no name or account attached), so don’t include personal details. AI can make mistakes; check the linked sources.</small></span></div>
    {toolbar}
    {error && <p className={styles.error} role="alert">{error}</p>}
    <div ref={list} className={styles.messages} role="log" aria-label="Questions and answers" aria-live="polite">
      {!turns.length && <div className={styles.empty}><p>Ask about 2,257 peace agreements and women’s inclusion. For example:</p>
        <div className={styles.examples}>{EXAMPLES.map(e => <button key={e} type="button" disabled={busy} onClick={() => void ask(e)}>{e}</button>)}</div></div>}
      {turns.map((t, i) => <article key={i} className={t.role === 'user' ? `${styles.message} ${styles.mine}` : `${styles.message} ${styles.ai}`}>
        <div><strong>{t.role === 'user' ? 'You' : 'Data assistant'}</strong>{t.role === 'assistant' && t.coverage && t.coverage !== 'full' && <span className={t.coverage === 'partial' ? styles.badgePartial : styles.badgeNone}>{t.coverage === 'partial' ? 'Partly answered' : 'Data not sufficient'}</span>}{t.at && <time dateTime={t.at}>{when(t.at)}</time>}</div><p>{t.role === 'assistant' ? linkify(t.content) : t.content}</p></article>)}
      {busy && <p className={styles.thinking}>Looking through the data…</p>}
    </div>
    <form className={styles.composer} onSubmit={e => void ask(question, e)}>
      <label htmlFor="ask-data-question" className={styles.srOnly}>Question about the data</label>
      <textarea ref={box} id="ask-data-question" placeholder="Ask a question about the data…" rows={3} maxLength={2000} disabled={busy} value={question}
        onChange={e => setQuestion(e.target.value)} onKeyDown={e => {if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {e.preventDefault(); void ask(question);}}}/>
      <div className={styles.sendRow}><span>Public · <a href="/ask-history">see all questions asked</a></span>
        <button type="submit" disabled={busy || !question.trim()}>{busy ? 'Thinking…' : 'Ask'}</button></div>
    </form>
  </>;
}
