'use client';
import {useEffect,useId,useRef,useState,type FormEvent,type KeyboardEvent} from 'react';
import type {User} from '@supabase/supabase-js';
import {notesSupabase} from '../lib/supabase/browser';
import {maxNoteLength,notesStorageKey,readStoredNotes,validNoteBody,type NoteKind,type ResearchNote} from '../lib/notes';
import NotebookAccount from './NotebookAccount';
import {messagePage,messagePageLabel} from '../lib/message-page';
import NotebookAttachment from './NotebookAttachment';
import {attachmentBucket,attachmentAccept,attachmentError,attachmentSize,maxAttachments,type NoteAttachment} from '../lib/note-attachments';
const table='gender_equality_notes';
const fields='id,body,kind,created_at,page_path,attachments';
export default function PersonalNotebook(){
 const [open,setOpen]=useState(false);
 const [localNotes,setLocalNotes]=useState<ResearchNote[]>([]);
 const [cloudNotes,setCloudNotes]=useState<ResearchNote[]>([]);
 const [user,setUser]=useState<User|null>(null);
 const [ready,setReady]=useState(false),[loading,setLoading]=useState(false),[saving,setSaving]=useState(false);
 const [body,setBody]=useState(''),[kind,setKind]=useState<NoteKind>('note');
 const [showAccount,setShowAccount]=useState(false),[recovery,setRecovery]=useState(false);
 const [files,setFiles]=useState<File[]>([]);
 const [error,setError]=useState(''),[notice,setNotice]=useState('');
 const [storageReady,setStorageReady]=useState(false);
 const clientRef=useRef<ReturnType<typeof notesSupabase>>(null);
 const userId=useRef<string|null>(null);
 const loadVersion=useRef(0);
 const panelRef=useRef<HTMLElement>(null);
 const triggerRef=useRef<HTMLButtonElement>(null);
 const composerRef=useRef<HTMLTextAreaElement>(null);
 const messagesRef=useRef<HTMLDivElement>(null);
 const id=useId();
 async function loadCloud(account:User){
  const client=clientRef.current;if(!client)return;
  const version=++loadVersion.current;setLoading(true);setError('');
  const {data,error}=await client.from(table).select(fields).eq('user_id',account.id).order('created_at',{ascending:false}).order('id',{ascending:false}).limit(500);
  if(version!==loadVersion.current)return;
  if(error)setError('Could not load your synced notes. Your browser notes are still safe.');
  else setCloudNotes((data??[]).reverse() as ResearchNote[]);
  setLoading(false);
 }
 useEffect(()=>{
  try{setLocalNotes(readStoredNotes(localStorage.getItem(notesStorageKey)));setStorageReady(true);}catch{setError('Could not read browser notes. Existing storage has been left unchanged.');}
  let client:ReturnType<typeof notesSupabase>;
  try{client=notesSupabase();clientRef.current=client;}catch{setError('Cloud connection is unavailable. You can keep notes in this browser.');setReady(true);return;}
  if(!client){setReady(true);return;}
  if(new URLSearchParams(window.location.search).get('notebook')==='account'){setOpen(true);}
  let alive=true;
  const {data:{subscription}}=client.auth.onAuthStateChange((_event,session)=>{
   if(!alive)return;
   const account=session?.user??null;
   if(_event==='PASSWORD_RECOVERY'){setRecovery(true);setShowAccount(true);setOpen(true);}
   if(userId.current!==account?.id)setFiles([]);
   if(userId.current!==account?.id){
    loadVersion.current++;userId.current=account?.id??null;setCloudNotes([]);setUser(account);
    if(account){setLoading(true);setTimeout(()=>{if(alive&&userId.current===account.id)void loadCloud(account);},0);}else setLoading(false);
   }
   setReady(true);
  });
  client.auth.getSession().then(({error})=>{if(alive&&error){setError('Could not restore your account session.');setReady(true);}}).catch(()=>{if(alive){setError('Could not restore your account session.');setReady(true);}});
  return()=>{alive=false;loadVersion.current++;subscription.unsubscribe();};
 },[]);
 useEffect(()=>{
  function receiveStorage(event:StorageEvent){if(event.key===notesStorageKey){try{setLocalNotes(readStoredNotes(event.newValue));}catch{setError('Could not read notes changed in another tab.');}}}
  window.addEventListener('storage',receiveStorage);
  return()=>window.removeEventListener('storage',receiveStorage);
 },[]);
 const notes=user?cloudNotes:localNotes;
 useEffect(()=>{if(open)messagesRef.current?.scrollTo({top:messagesRef.current.scrollHeight,behavior:'smooth'});},[notes.length,open]);
 useEffect(()=>{if(open)composerRef.current?.focus();},[open]);
 function persistLocal(update:(current:ResearchNote[])=>ResearchNote[]){
  if(!storageReady)throw new Error('Browser storage is unavailable. Please export or recover existing notes before saving more.');
  const next=update(readStoredNotes(localStorage.getItem(notesStorageKey)));
  localStorage.setItem(notesStorageKey,JSON.stringify(next));setLocalNotes(next);
 }
 function close(){setOpen(false);triggerRef.current?.focus();}
 function keyboard(event:KeyboardEvent<HTMLElement>){
  if(event.key==='Escape'){event.stopPropagation();close();return;}
  if(event.key!=='Tab')return;
  const focusable=panelRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),a[href],select:not(:disabled)');
  if(!focusable?.length)return;
  const first=focusable[0],last=focusable[focusable.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 }
 async function save(event?:FormEvent){
  event?.preventDefault();if(saving||loading||!ready||(!validNoteBody(body)&&!files.length))return;
  setSaving(true);setError('');setNotice('');
  const account=user;
  const uploaded:NoteAttachment[]=[];
  const note:ResearchNote={id:crypto.randomUUID(),body:body.trim(),kind,created_at:new Date().toISOString(),page_path:messagePage(window.location)};
  try{
   if(account){
    for(const file of files){
     const path=account.id+'/'+note.id+'/'+crypto.randomUUID();
     const {error}=await clientRef.current!.storage.from(attachmentBucket).upload(path,file,{contentType:'application/octet-stream',upsert:false});
     if(error)throw new Error('Could not upload '+file.name+'. Your message and selected files have been kept.');
     uploaded.push({path,name:file.name,size:file.size,type:file.type});
    }
    note.attachments=uploaded;
    const {data,error}=await clientRef.current!.from(table).insert({...note,user_id:account.id}).select(fields).single();
    if(error||!data)throw new Error('Could not save to Supabase. Your text is still in the composer.');
    if(userId.current===account.id)setCloudNotes(previous=>[...previous,data as ResearchNote].slice(-500));
   }else persistLocal(current=>[...current,note]);
   setBody('');setFiles([]);
  }catch(error){if(uploaded.length)await clientRef.current!.storage.from(attachmentBucket).remove(uploaded.map(file=>file.path));setError(error instanceof Error?error.message:'Could not save your note. Your text is still in the composer.');}
  finally{setSaving(false);composerRef.current?.focus();}
 }
 async function remove(note:ResearchNote){
  if(saving)return;setSaving(true);setError('');const account=user;
  try{
   if(account){const {data,error}=await clientRef.current!.from(table).delete().eq('id',note.id).eq('user_id',account.id).select('id');if(error||data?.length!==1)throw new Error('Could not delete the synced note.');if(userId.current===account.id)setCloudNotes(previous=>previous.filter(item=>item.id!==note.id));if(note.attachments?.length){const {error:cleanupError}=await clientRef.current!.storage.from(attachmentBucket).remove(note.attachments.map(file=>file.path));if(cleanupError)setError('Note deleted, but its files could not be removed from storage.');}}
   else persistLocal(current=>current.filter(item=>item.id!==note.id));
  }catch(error){setError(error instanceof Error?error.message:'Could not delete this note.');}finally{setSaving(false);}
 }
 async function signOut(){
  if(!clientRef.current||saving)return;
  setSaving(true);const {error}=await clientRef.current.auth.signOut();if(error)setError('Could not sign out. Please try again.');else{setShowAccount(false);setNotice('Signed out. Showing notes saved in this browser.');}setSaving(false);
 }
 async function importBrowserNotes(){
  if(!user||!clientRef.current||saving||!localNotes.length)return;
  setSaving(true);setError('');const account=user;
  try{
   const records=localNotes.map(note=>({...note,id:crypto.randomUUID(),browser_id:note.id,user_id:account.id}));
   const {error}=await clientRef.current.from(table).upsert(records,{onConflict:'user_id,browser_id',ignoreDuplicates:true});
   if(error)throw new Error('Could not copy browser notes. The browser originals have been kept.');
   if(userId.current===account.id)await loadCloud(account);
   setNotice('Browser notes copied to your account. Browser originals have been kept.');
  }catch(error){setError(error instanceof Error?error.message:'Could not copy browser notes.');}finally{setSaving(false);}
 }
 return <div className="personal-notebook">
 <button ref={triggerRef} type="button" className="notebook-launcher" aria-expanded={open} aria-controls={`${id}-panel`} onClick={()=>open?close():setOpen(true)}><span aria-hidden="true">{open?'×':'✎'}</span><span>My notes</span></button>
 {open&&<section ref={panelRef} id={`${id}-panel`} className="notebook-panel" role="dialog" aria-label="Personal questions and notes" onKeyDown={keyboard}>
 <div className="notebook-heading"><div><h2>My notebook</h2><p>A place to think out loud.</p></div><button type="button" className="close-button" aria-label="Close notebook" onClick={close}>×</button></div>
 <div className="notebook-status"><span>{!ready?'Checking account…':user?'Account notes · private':'Saved in this browser'}</span>{clientRef.current&&<button type="button" className="text-button" onClick={()=>setShowAccount(previous=>!previous)}>{user?'Account':'Sign in to sync'}</button>}</div>
 {showAccount&&clientRef.current&&(user&&!recovery?<div className="notebook-account"><p>{user.email}</p><button className="text-button" disabled={saving} onClick={signOut}>Sign out</button><button className="text-button" disabled={saving} onClick={()=>setRecovery(true)}>Set or change password</button>{localNotes.length>0&&<button className="button secondary" disabled={saving||loading} onClick={importBrowserNotes}>Copy {localNotes.length} browser notes to account</button>}</div>:<NotebookAccount client={clientRef.current} recovery={recovery} onClose={()=>{setShowAccount(false);setRecovery(false);}}/>)}
 {!clientRef.current&&ready&&<p className="notebook-local-hint">Cloud sync isn’t connected yet. Notes still save here.</p>}
 {error&&<p className="notebook-error" role="alert">{error}</p>}{notice&&<p className="notebook-notice" role="status">{notice}</p>}
 <div ref={messagesRef} className="notebook-messages" role="log" aria-label="Your questions and notes" aria-relevant="additions"><p className="notebook-empty">{loading?'Loading your notes…':notes.length?'':'Write a question, capture a thought, or leave yourself a reminder.'}</p>{notes.map(note=><article className={`notebook-message ${note.kind}`} key={note.id}><div className="notebook-message-meta"><span>{note.kind==='question'?'Question':'Note'}</span><time dateTime={note.created_at}>{new Date(note.created_at).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</time><button type="button" disabled={saving} aria-label={`Delete ${note.kind} from ${new Date(note.created_at).toLocaleString()}`} onClick={()=>remove(note)}>×</button></div><p>{note.body}</p>{note.attachments?.map(file=><NotebookAttachment key={file.path} file={file}/>)}<span className="notebook-page" title={note.page_path}>From: {messagePageLabel(note.page_path)}</span></article>)}{user&&notes.length>=500&&<p className="notebook-empty">Showing your latest 500 notes.</p>}</div>
 <form className="notebook-composer" onSubmit={save}><div className="notebook-kind" aria-label="Message type">{(['note','question'] as const).map(value=><button type="button" key={value} aria-pressed={kind===value} onClick={()=>setKind(value)}>{value==='note'?'Note':'Question'}</button>)}</div><label htmlFor={`${id}-body`} className="sr-only">Your {kind}</label><textarea ref={composerRef} id={`${id}-body`} value={body} maxLength={maxNoteLength} disabled={!ready||saving||loading} onChange={event=>setBody(event.target.value)} onKeyDown={event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.nativeEvent.isComposing){event.preventDefault();void save();}}} placeholder={kind==='question'?'What are you wondering about?':'Leave yourself a note…'} rows={3}/><div className="notebook-upload"><label className="text-button">Attach files<input type="file" multiple accept={attachmentAccept} disabled={saving||loading||!ready} onChange={event=>{const picked=Array.from(event.target.files??[]);event.target.value='';if(!user){setNotice('Sign in or create an account to attach files.');setShowAccount(true);return;}if(files.length+picked.length>maxAttachments){setError('Attach up to 10 files per message.');return;}const error=picked.map(attachmentError).find(Boolean);if(error){setError(error);return;}setError('');setFiles(previous=>[...previous,...picked]);}}/></label><small>Documents, ZIPs & images · 20 MB each</small></div>{files.length>0&&<ul className="notebook-pending-files">{files.map((file,index)=><li key={index}><span>{file.name} · {attachmentSize(file.size)}</span><button type="button" disabled={saving} aria-label={'Remove '+file.name} onClick={()=>setFiles(previous=>previous.filter((_,i)=>i!==index))}>×</button></li>)}</ul>}<div className="notebook-compose-footer"><span>Enter to save · Shift + Enter for a new line</span><button className="button" disabled={!ready||saving||loading||(!validNoteBody(body)&&!files.length)}>{saving?'Saving…':'Save'}</button></div></form>
 </section>}
 </div>;
}
