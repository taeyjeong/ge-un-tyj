export interface NoteAttachment {path:string;name:string;size:number;type:string}
export const attachmentBucket='notebook-attachments';
export const maxAttachmentSize=20*1024*1024;
export const maxAttachments=10;
export const attachmentAccept='image/*,.ppt,.pptx,.pps,.ppsx,.pot,.potx,.xls,.xlsx,.xlsm,.xlsb,.csv,.ods,.doc,.docx,.docm,.odt,.rtf,.zip,.pdf,.heic,.heif,.avif,.svg,.tif,.tiff,.ico,.bmp,.raw,.dng,.cr2,.nef,.psd,.eps,.ai,.jxl';
const extensions=new Set(attachmentAccept.split(',').filter(x=>x.startsWith('.')).map(x=>x.slice(1)).concat(['jpg','jpeg','png','gif','webp','apng','jfif','exr','hdr','arw','orf','rw2']));
export function attachmentError(file:{name:string;size:number;type:string}){
 if(file.size===0)return `${file.name} is empty.`;
 if(file.size>maxAttachmentSize)return `${file.name} exceeds the 20 MB limit.`;
 if(!file.type.startsWith('image/')&&!extensions.has(file.name.split('.').pop()?.toLowerCase()??''))return `${file.name}: choose a document, ZIP, or image file.`;
 return null;
}
export function previewableImage(type:string){return ['image/jpeg','image/png','image/gif','image/webp','image/avif','image/bmp','image/x-icon','image/apng'].includes(type);}
export function attachmentSize(size:number){return size<1024*1024?`${Math.ceil(size/1024)} KB`:`${(size/1024/1024).toFixed(1)} MB`;}
