'use client';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import type {SupabaseClient} from '@supabase/supabase-js';
export default function NotebookAccount({client,recovery,onClose}:{client:SupabaseClient;recovery:boolean;onClose:()=>void}){
 const [mode,setMode]=useState<'signin'|'signup'|'reset'|'password'>(recovery?'password':'signin');
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState('');
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const element=dialog.current,previous=document.activeElement as HTMLElement; element?.showModal();return()=>{element?.close();previous?.focus();};},[]);
 function change(next:typeof mode){setMode(next);setError('');setNotice('');setPassword('');setConfirm('');}
 async function submit(event:FormEvent){
  event.preventDefault();if(busy)return;setError('');setNotice('');
  if((mode==='signup'||mode==='password')&&password!==confirm){setError('Passwords do not match.');return;}
  setBusy(true);
  try{
   const redirect=window.location.origin+'/?notebook=account';
   if(mode==='signin'){const {error}=await client.auth.signInWithPassword({email:email.trim(),password});if(error)throw error;onClose();}
   if(mode==='signup'){const {data,error}=await client.auth.signUp({email:email.trim(),password,options:{emailRedirectTo:redirect}});if(error)throw error;if(data.session)onClose();else{setNotice('Check your email to confirm your account, then sign in. If you already have an account, sign in or reset your password.');setPassword('');setConfirm('');}}
   if(mode==='reset'){const {error}=await client.auth.resetPasswordForEmail(email.trim(),{redirectTo:redirect});if(error)throw error;setNotice('If an account exists for this email, you’ll receive a link to create or reset its password.');}
   if(mode==='password'){const {error}=await client.auth.updateUser({password});if(error)throw error;onClose();}
  }catch(error){setError(error instanceof Error?error.message:'Unable to complete this request. Please try again.');}finally{setBusy(false);}
 }
 const title=mode==='signup'?'Create an account':mode==='reset'?'Create or reset password':mode==='password'?'Choose your password':'Sign in';
 return <dialog ref={dialog} className="notebook-auth-modal" aria-labelledby="notebook-auth-title" onKeyDown={event=>event.stopPropagation()} onCancel={event=>{event.preventDefault();if(!busy)onClose();}} onClick={event=>{if(event.target===event.currentTarget&&!busy)onClose();}}>
 <div className="notebook-auth-content"><div className="notebook-heading"><h2 id="notebook-auth-title">{title}</h2><button type="button" className="close-button" aria-label="Close account dialog" disabled={busy} onClick={onClose}>×</button></div>
 <p>Keep your notes and attachments in your private account.</p><form onSubmit={submit}>
 {mode!=='password'&&<label>Email<input autoFocus type="email" autoComplete="email" required disabled={busy} value={email} onChange={e=>setEmail(e.target.value)}/></label>}
 {mode!=='reset'&&<label>{mode==='password'?'New password':'Password'}<input autoFocus={mode==='password'} type="password" autoComplete={mode==='signin'?'current-password':'new-password'} minLength={mode==='signin'?undefined:8} required disabled={busy} value={password} onChange={e=>setPassword(e.target.value)}/></label>}
 {(mode==='signup'||mode==='password')&&<><label>Confirm password<input type="password" autoComplete="new-password" required minLength={8} disabled={busy} value={confirm} onChange={e=>setConfirm(e.target.value)}/></label><small>Use at least 8 characters.</small></>}
 {error&&<p role="alert" className="notebook-error">{error}</p>}{notice&&<p role="status" className="notebook-notice">{notice}</p>}
 <button className="button" disabled={busy}>{busy?'Please wait…':mode==='reset'?'Email password link':mode==='password'?'Save password':title}</button>
 </form><div className="notebook-auth-links">{mode==='signin'?<><button className="text-button" disabled={busy} onClick={()=>change('signup')}>New here? Sign up</button><button className="text-button" disabled={busy} onClick={()=>change('reset')}>No password yet, or forgot it?</button></>:mode!=='password'&&<button className="text-button" disabled={busy} onClick={()=>change('signin')}>Back to sign in</button>}</div></div></dialog>;
}
