'use client';
import {useEffect,useState} from 'react';
import {notesSupabase} from '../lib/supabase/browser';
import {attachmentBucket,attachmentSize,previewableImage,type NoteAttachment} from '../lib/note-attachments';
export default function NotebookAttachment({file}:{file:NoteAttachment}){
 const [preview,setPreview]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{let alive=true,url='';if(previewableImage(file.type))void notesSupabase()?.storage.from(attachmentBucket).download(file.path).then(({data})=>{if(data&&alive){url=URL.createObjectURL(new Blob([data],{type:file.type}));setPreview(url);}});return()=>{alive=false;if(url)URL.revokeObjectURL(url);};},[file.path,file.type]);
 async function download(){setBusy(true);setError('');try{const result=await notesSupabase()?.storage.from(attachmentBucket).download(file.path);if(!result?.data||result.error)throw new Error();const url=URL.createObjectURL(result.data),link=document.createElement('a');link.href=url;link.download=file.name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch{setError('Could not download. Please try again.');}finally{setBusy(false);}}
 return <div className="notebook-attachment">{preview&&<img src={preview} alt={file.name} loading="lazy"/>}<button type="button" className="text-button" onClick={download} disabled={busy}>{busy?'Downloading…':file.name} ↓</button><small>{attachmentSize(file.size)}</small>{error&&<small role="alert">{error}</small>}</div>;
}
