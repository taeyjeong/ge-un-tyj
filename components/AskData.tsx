'use client';
// "Ask the data" tab of the chat panel: a private Q&A with Claude over the PA-X, PADD and CFR data
// (via /api/ask). Nothing here is posted to the public chat or saved on the server.
import {useEffect, useRef, useState, type FormEvent} from 'react';
import styles from './PublicChat.module.css';

interface Turn {role: 'user' | 'assistant'; content: string}
const VISITOR_KEY = 'ge:ask-data:visitor';
function visitorId() {  // random id kept in this browser so the log can group a visitor's questions; not linked to any account
  try {
    const saved = localStorage.getItem(VISITOR_KEY);
    if (saved) return saved;
    const fresh = crypto.randomUUID(); localStorage.setItem(VISITOR_KEY, fresh); return fresh;
  } catch {return undefined;}
}
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
  const list = useRef<HTMLDivElement>(null), box = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {box.current?.focus();}, [focusKey]);
  useEffect(() => {list.current?.scrollTo({top: list.current.scrollHeight});}, [turns, busy]);

  async function ask(text: string, event?: FormEvent) {
    event?.preventDefault();
    const q = text.trim();
    if (!q || busy) return;
    if (q.length > 2000) {setError('Ask a question of up to 2,000 characters.'); return;}
    const next: Turn[] = [...turns, {role: 'user', content: q}];
    setTurns(next); setQuestion(''); setBusy(true); setError('');
    try {
      const res = await fetch('/api/ask', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({messages: next, visitorId: visitorId(), pagePath: window.location.pathname})});
      const data = await res.json().catch(() => ({})) as {answer?: string; error?: string};
      if (!res.ok || !data.answer) throw new Error(data.error || 'The assistant couldn’t answer right now. Please try again.');
      setTurns([...next, {role: 'assistant', content: data.answer}]);
    } catch (e) {
      setTurns(turns); setQuestion(q);  // keep the question so it can be resent
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {setBusy(false); box.current?.focus();}
  }

  return <>
    <div className={styles.visibility}><span aria-hidden="true">✦</span><span>Answers from an AI (Claude) using PA-X, PADD and CFR data.<small>Not shown to other visitors · questions and answers are saved to improve the site (no account or name attached) · AI can make mistakes; check the linked sources.</small></span></div>
    {error && <p className={styles.error} role="alert">{error}</p>}
    <div ref={list} className={styles.messages} role="log" aria-label="Questions and answers" aria-live="polite">
      {!turns.length && <div className={styles.empty}><p>Ask about 2,257 peace agreements and women’s inclusion. For example:</p>
        <div className={styles.examples}>{EXAMPLES.map(e => <button key={e} type="button" disabled={busy} onClick={() => void ask(e)}>{e}</button>)}</div></div>}
      {turns.map((t, i) => <article key={i} className={t.role === 'user' ? `${styles.message} ${styles.mine}` : `${styles.message} ${styles.ai}`}>
        <div><strong>{t.role === 'user' ? 'You' : 'Data assistant'}</strong></div><p>{t.role === 'assistant' ? linkify(t.content) : t.content}</p></article>)}
      {busy && <p className={styles.thinking}>Looking through the data…</p>}
    </div>
    <form className={styles.composer} onSubmit={e => void ask(question, e)}>
      <label htmlFor="ask-data-question" className={styles.srOnly}>Question about the data</label>
      <textarea ref={box} id="ask-data-question" placeholder="Ask a question about the data…" rows={3} maxLength={2000} disabled={busy} value={question}
        onChange={e => setQuestion(e.target.value)} onKeyDown={e => {if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {e.preventDefault(); void ask(question);}}}/>
      <div className={styles.sendRow}><span>{turns.length ? <button type="button" className={styles.linkButton} disabled={busy} onClick={() => {setTurns([]); setError('');}}>New conversation</button> : 'Answered by Claude · saved to improve the site'}</span>
        <button type="submit" disabled={busy || !question.trim()}>{busy ? 'Thinking…' : 'Ask'}</button></div>
    </form>
  </>;
}
