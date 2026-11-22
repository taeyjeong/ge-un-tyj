'use client';
// The shared public chat (Supabase community_messages): history, polling and composer.
// Shown inside the notebook panel: the only view when signed out, a tab when signed in.
import {useEffect,useId,useRef,useState,type FormEvent} from 'react';
import {notesSupabase} from '../lib/supabase/browser';
import {mergePublicMessages,publicChatFields,publicChatPageSize,validatePublicMessage,type PublicMessage} from '../lib/public-chat';
import styles from './PublicChat.module.css';
import {messagePage,messagePageLabel} from '../lib/message-page';
const guestKey='ge:public-chat:guest';
const nameKey='ge:public-chat:name';
export default function PublicChatFeed({defaultName}:{defaultName?:string}){
 const [messages,setMessages]=useState<PublicMessage[]>([]);
 const [name,setName]=useState(''),[body,setBody]=useState(''),[loading,setLoading]=useState(false),[saving,setSaving]=useState(false),[older,setOlder]=useState(false),[hasOlder,setHasOlder]=useState(false),[error,setError]=useState('');
 const [connected,setConnected]=useState(false);
 const client=useRef<ReturnType<typeof notesSupabase>>(null),guest=useRef(''),pendingId=useRef<string|null>(null),lastId=useRef(0),alive=useRef(false),busy=useRef(false),initialized=useRef(false),nearBottom=useRef(true),scrollAfterUpdate=useRef(false);
 const list=useRef<HTMLDivElement>(null),composer=useRef<HTMLTextAreaElement>(null);
 const id=useId();
 useEffect(()=>{alive.current=true;try{client.current=notesSupabase();setConnected(!!client.current);}catch{setError('Public chat is temporarily unavailable.');}try{const storedGuest=localStorage.getItem(guestKey);guest.current=storedGuest&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(storedGuest)?storedGuest:crypto.randomUUID();localStorage.setItem(guestKey,guest.current);setName(localStorage.getItem(nameKey)??defaultName??'');}catch{guest.current=crypto.randomUUID();}composer.current?.focus();return()=>{alive.current=false;};},[defaultName]);
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
 useEffect(()=>{if(!connected)return;void refresh();const timer=setInterval(()=>{if(document.visibilityState==='visible')void refresh();},5000);return()=>clearInterval(timer);},[connected]);
 useEffect(()=>{if(scrollAfterUpdate.current){list.current?.scrollTo({top:list.current.scrollHeight});scrollAfterUpdate.current=false;}},[messages]);
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
   const {data,error}=await client.current.rpc('send_community_message',{p_request_id:pendingId.current,p_guest_id:guest.current,p_display_name:name.trim()||'Guest',p_body:body.trim(),p_page_path:messagePage(window.location)});
   if(error)throw error;if(!data?.length)throw new Error();
   if(!alive.current)return;
   scrollAfterUpdate.current=true;setMessages(previous=>mergePublicMessages(previous,data as PublicMessage[]));
   // The polling cursor only advances on reads, so messages posted concurrently are not skipped.
   setBody('');pendingId.current=null;try{localStorage.setItem(nameKey,name.trim());}catch{}
  }catch(error){const message=(error as {message?:string})?.message??'';setError(message.includes('wait 5 seconds')||message.includes('100 messages')?message:'Could not send your message. Your text has been kept; please retry.');}finally{setSaving(false);composer.current?.focus();}
 }
 return <div className={styles.feed}>
  <div className={styles.visibility}><span aria-hidden="true">◎</span><span>Public chat · visible to everyone · no sign-in needed.<small>Display names aren’t verified. Private notes stay private.</small></span></div>
  <div className={styles.status}><span>{connected?'Shared history · updates every 5 seconds':'Public chat is not connected'}</span><button type="button" disabled={!connected||loading} onClick={()=>void refresh()}>Refresh</button></div>{error&&<p className={styles.error} role="alert">{error}</p>}
  <div ref={list} className={styles.messages} role="log" aria-label="Public message history" aria-relevant="additions" onScroll={()=>{const el=list.current;if(el)nearBottom.current=el.scrollHeight-el.scrollTop-el.clientHeight<80;}}>{hasOlder&&<button className={styles.earlier} type="button" disabled={older} onClick={loadOlder}>{older?'Loading…':'Load earlier messages'}</button>}{loading&&!messages.length?<p className={styles.empty}>Loading the conversation…</p>:!messages.length&&<p className={styles.empty}>{connected?'Start the conversation. Your message will be visible to other visitors.':'Public messages are temporarily unavailable.'}</p>}{messages.map(message=><article className={styles.message} key={message.id}><div><strong>{message.display_name}</strong><time dateTime={message.created_at}>{new Date(message.created_at).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</time></div><p>{message.body}</p><span className={styles.page} title={message.page_path??undefined}>From: {messagePageLabel(message.page_path)}</span></article>)}</div>
  <form className={styles.composer} onSubmit={send}><label className={styles.nameLabel}>Display name <span>(optional)</span><input type="text" maxLength={40} autoComplete="nickname" placeholder="Guest" value={name} disabled={saving} onChange={event=>{setName(event.target.value);pendingId.current=null;}}/></label><label htmlFor={`${id}-message`} className={styles.srOnly}>Public message</label><textarea ref={composer} id={`${id}-message`} placeholder="Say something to everyone…" rows={3} maxLength={2000} disabled={saving||!connected} value={body} onChange={event=>{setBody(event.target.value);pendingId.current=null;}} onKeyDown={event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.nativeEvent.isComposing){event.preventDefault();void send();}}}/><div className={styles.sendRow}><span>Public message · {body.length}/2,000</span><button type="submit" disabled={saving||!connected||!body.trim()}>{saving?'Sending…':'Send'}</button></div></form>
 </div>;
}
