import type {NoteAttachment} from './note-attachments';
export const noteKinds=['note','question'] as const;
export type NoteKind=typeof noteKinds[number];
export interface ResearchNote {id:string;body:string;kind:NoteKind;created_at:string;page_path:string;attachments?:NoteAttachment[]}
export const notesStorageKey='gender-equality-un-data:personal-notes:v1';
export const maxNoteLength=4000;
export function validNoteBody(body:string){return body.trim().length>0&&body.trim().length<=maxNoteLength;}
export function readStoredNotes(value:string|null):ResearchNote[]{
 if(!value)return [];
 const data:unknown=JSON.parse(value);
 if(!Array.isArray(data))throw new Error('Stored notes are not a list.');
 return data.map((note:unknown)=>{
  if(typeof note!=='object'||note===null)throw new Error('Invalid stored note.');
  const item=note as Record<string,unknown>;
  if(typeof item.id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id)||typeof item.body!=='string'||!validNoteBody(item.body)||!noteKinds.includes(item.kind as NoteKind)||typeof item.created_at!=='string'||!Number.isFinite(Date.parse(item.created_at))||typeof item.page_path!=='string')throw new Error('A stored note is invalid.');
  return {id:item.id,body:item.body,kind:item.kind as NoteKind,created_at:item.created_at,page_path:item.page_path};
 }).sort((a,b)=>a.created_at.localeCompare(b.created_at)||a.id.localeCompare(b.id));
}
