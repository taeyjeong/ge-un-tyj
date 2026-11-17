'use client';
import {useEffect,useId,useRef,useState,type FormEvent,type KeyboardEvent} from 'react';
import {notesSupabase} from '../lib/supabase/browser';
import {mergePublicMessages,publicChatFields,publicChatPageSize,validatePublicMessage,type PublicMessage} from '../lib/public-chat';
import styles from './PublicChat.module.css';
const guestKey='ge:public-chat:guest';
const nameKey='ge:public-chat:name';
export default function PublicChat(){
 const [open,setOpen]=useState(false),[messages,setMessages]=useState<PublicMessage[]>([]);
 const [name,setName]=useState(''),[body,setBody]=useState(''),[loading,setLoading]=useState(false),[saving,setSaving]=useState(false),[older,setOlder]=useState(false),[hasOlder,setHasOlder]=useState(false),[error,setError]=useState('');
 const [connected,setConnected]=useState(false);
 const client=useRef<ReturnType<typeof notesSupabase>>(null),guest=useRef(''),pendingId=useRef<string|null>(null),lastId=useRef(0),alive=useRef(false),busy=useRef(false),initialized=useRef(false),nearBottom=useRef(true),scrollAfterUpdate=useRef(false);
 const list=useRef<HTMLDivElement>(null),panel=useRef<HTMLElement>(null),trigger=useRef<HTMLButtonElement>(null),composer=useRef<HTMLTextAreaElement>(null);
 const id=useId();
 useEffect(()=>{alive.current=true;try{client.current=notesSupabase();setConnected(!!client.current);}catch{setError('Public chat is temporarily unavailable.');}try{const storedGuest=localStorage.getItem(guestKey);guest.current=storedGuest&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(storedGuest)?storedGuest:crypto.randomUUID();localStorage.setItem(guestKey,guest.current);setName(localStorage.getItem(nameKey)??'');}catch{guest.current=crypto.randomUUID();}return()=>{alive.current=false;};},[]);
 async function refresh(){
  if(!client.current||busy.current)return;
  busy.current=true;const first=!initialized.current;if(first)setLoading(true);
  try{
   let query=client.current.from('community_messages').select(publicChatFields).order('id',{ascending:!first}).limit(first?publicChatPageSize:100);
   if(!first)query=query.gt('id',lastId.current);
   const {data,error}=await query;if(!alive.current)return;
   if(error)throw error;
   const incoming=(data??[]) as PublicMessage[];
   scrollAfterUpdate.current=first||nearBottom.current;
   setMessages(previous=>mergePublicMessages(previous,incoming));
   if(first)setHasOlder(incoming.length===publicChatPageSize);
   lastId.current=Math.max(lastId.current,...incoming.map(m=>m.id));initialized.current=true;setError('');
  }catch{if(alive.current)setError('Could not refresh public messages. Retrying automatically.');}finally{busy.current=false;if(alive.current)setLoading(false);}
 }
 useEffect(()=>{if(!open||!connected)return;void refresh();const timer=setInterval(()=>{if(document.visibilityState==='visible')void refresh();},5000);return()=>clearInterval(timer);},[open,connected]);
 useEffect(()=>{if(open)composer.current?.focus();},[open]);
 useEffect(()=>{if(open&&scrollAfterUpdate.current){list.current?.scrollTo({top:list.current.scrollHeight});scrollAfterUpdate.current=false;}},[messages,open]);
 async function loadOlder(){
  if(!client.current||older||!messages.length)return;setOlder(true);
  const element=list.current,previousHeight=element?.scrollHeight??0,previousTop=element?.scrollTop??0;
  try{const {data,error}=await client.current.from('community_messages').select(publicChatFields).lt('id',messages[0].id).order('id',{ascending:false}).limit(publicChatPageSize);if(error)throw error;
   if(!alive.current)return;scrollAfterUpdate.current=false;setMessages(previous=>mergePublicMessages(previous,(data??[]) as PublicMessage[]));setHasOlder(data?.length===publicChatPageSize);
   requestAnimationFrame(()=>{if(element)element.scrollTop=previousTop+element.scrollHeight-previousHeight;});
  }catch{setError('Could not load earlier messages. Please try again.');}finally{setOlder(false);}
 }
 async function send(event?:FormEvent){
  event?.preventDefault();if(saving||!client.current)return;
  const validation=validatePublicMessage(body,name);if(validation){setError(validation);return;}
  setSaving(true);setError('');pendingId.current??=crypto.randomUUID();
  try{
   const {data,error}=await client.current.rpc('send_community_message',{p_request_id:pendingId.current,p_guest_id:guest.current,p_display_name:name.trim()||'Guest',p_body:body.trim()});
   if(error)throw error;if(!data?.length)throw new Error();
   if(!alive.current)return;
   scrollAfterUpdate.current=true;setMessages(previous=>mergePublicMessages(previous,data as PublicMessage[]));
   // The polling cursor only advances on reads, so messages posted concurrently are not skipped.
   setBody('');pendingId.current=null;try{localStorage.setItem(nameKey,name.trim());}catch{}
  }catch(error){const message=(error as {message?:string})?.message??'';setError(message.includes('wait 5 seconds')||message.includes('100 messages')?message:'Could not send your message. Your text has been kept; please retry.');}finally{setSaving(false);composer.current?.focus();}
 }
 function close(){setOpen(false);trigger.current?.focus();}
 function keyboard(event:KeyboardEvent<HTMLElement>){
  if(event.key==='Escape'){event.stopPropagation();close();return;}
  if(event.key!=='Tab')return;const elements=panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),textarea:not(:disabled)');if(!elements?.length)return;
  const first=elements[0],last=elements[elements.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 }
 return <div className={styles.widget}><button ref={trigger} className={styles.launcher} type="button" aria-expanded={open} aria-controls={`${id}-panel`} onClick={()=>open?close():setOpen(true)}><span aria-hidden="true">{open?'×':'☷'}</span>Public chat</button>
 {open&&<section ref={panel} id={`${id}-panel`} className={styles.panel} role="dialog" aria-label="Public community chat" onKeyDown={keyboard}><div className={styles.heading}><div><h2>Public chat</h2><p>Questions, ideas & discoveries, together.</p></div><button type="button" aria-label="Close public chat" onClick={close}>×</button></div><div className={styles.visibility}><span aria-hidden="true">◎</span><span>Visible to everyone · no sign-in needed.<small>Display names aren’t verified. Private notes stay private.</small></span></div>
 <div className={styles.status}><span>{connected?'Shared history · updates every 5 seconds':'Public chat is not connected'}</span><button type="button" disabled={!connected||loading} onClick={()=>void refresh()}>Refresh</button></div>{error&&<p className={styles.error} role="alert">{error}</p>}
 <div ref={list} className={styles.messages} role="log" aria-label="Public message history" aria-relevant="additions" onScroll={()=>{const el=list.current;if(el)nearBottom.current=el.scrollHeight-el.scrollTop-el.clientHeight<80;}}>{hasOlder&&<button className={styles.earlier} type="button" disabled={older} onClick={loadOlder}>{older?'Loading…':'Load earlier messages'}</button>}{loading&&!messages.length?<p className={styles.empty}>Loading the conversation…</p>:!messages.length&&<p className={styles.empty}>{connected?'Start the conversation. Your message will be visible to other visitors.':'Public messages are temporarily unavailable.'}</p>}{messages.map(message=><article className={styles.message} key={message.id}><div><strong>{message.display_name}</strong><time dateTime={message.created_at}>{new Date(message.created_at).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</time></div><p>{message.body}</p></article>)}</div>
 <form className={styles.composer} onSubmit={send}><label className={styles.nameLabel}>Display name <span>(optional)</span><input type="text" maxLength={40} autoComplete="nickname" placeholder="Guest" value={name} disabled={saving} onChange={event=>{setName(event.target.value);pendingId.current=null;}}/></label><label htmlFor={`${id}-message`} className={styles.srOnly}>Public message</label><textarea ref={composer} id={`${id}-message`} placeholder="Say something to everyone…" rows={3} maxLength={2000} disabled={saving||!connected} value={body} onChange={event=>{setBody(event.target.value);pendingId.current=null;}} onKeyDown={event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.nativeEvent.isComposing){event.preventDefault();void send();}}}/><div className={styles.sendRow}><span>Public message · {body.length}/2,000</span><button type="submit" disabled={saving||!connected||!body.trim()}>{saving?'Sending…':'Send'}</button></div></form>
 </section>}</div>;
}
