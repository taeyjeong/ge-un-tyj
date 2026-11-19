export interface PublicMessage {id:number;display_name:string;body:string;created_at:string;page_path:string|null}
export const publicChatFields='id,display_name,body,created_at,page_path';
export const publicChatPageSize=50;
export function validatePublicMessage(body:string,name:string){
 if(!body.trim()||body.trim().length>2000)return 'Write a message of 1–2,000 characters.';
 if(name.trim().length>40)return 'Use a display name of 40 characters or fewer.';
 return null;
}
export function mergePublicMessages(current:PublicMessage[],incoming:PublicMessage[]){
 return [...new Map([...current,...incoming].map(message=>[message.id,message])).values()].sort((a,b)=>a.id-b.id);
}
