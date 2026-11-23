'use client';
// Floating "Ask the data" button and panel (bottom right). The public chat lives in the notebook
// panel (bottom left) instead.
import {useId, useRef, useState, type KeyboardEvent} from 'react';
import AskData from './AskData';
import styles from './PublicChat.module.css';

export default function AskDataWidget() {
  const [open, setOpen] = useState(false), [focusKey, setFocusKey] = useState(0), [big, setBig] = useState(false);
  const panel = useRef<HTMLElement>(null), trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  function close() {setOpen(false); trigger.current?.focus();}
  function keyboard(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {event.stopPropagation(); if (big) setBig(false); else close(); return;}
    if (event.key !== 'Tab') return;
    const elements = panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),a[href]');
    if (!elements?.length) return;
    const first = elements[0], last = elements[elements.length - 1];
    if (event.shiftKey && document.activeElement === first) {event.preventDefault(); last.focus();}
    else if (!event.shiftKey && document.activeElement === last) {event.preventDefault(); first.focus();}
  }
  return <div className={styles.widget}>
    {open && big && <div className={styles.backdrop} aria-hidden="true" onClick={() => setBig(false)}/>}
    <button ref={trigger} className={styles.launcher} type="button" aria-expanded={open} aria-controls={`${id}-panel`} onClick={() => {if (open) close(); else {setOpen(true); setFocusKey(n => n + 1);}}}>
      <span aria-hidden="true">{open ? '×' : '✦'}</span>Ask the data</button>
    {open && <section ref={panel} id={`${id}-panel`} className={big ? `${styles.panel} ${styles.panelMax}` : styles.panel} role="dialog" aria-modal={big || undefined} aria-label="Ask the data" onKeyDown={keyboard}>
      <div className={styles.heading}><div><h2>Ask the data</h2><p>Peace agreements & women’s inclusion, answered from the data.</p></div><div className={styles.headingButtons}><button type="button" className={styles.maximize} aria-pressed={big} aria-label={big ? 'Restore chat size' : 'Maximize chat'} title={big ? 'Restore size' : 'Maximize'} onClick={() => setBig(v => !v)}>{big ? '⤡' : '⤢'}</button><button type="button" aria-label="Close" onClick={close}>×</button></div></div>
      <AskData focusKey={focusKey}/>
    </section>}
  </div>;
}
