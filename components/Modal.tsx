'use client';
import {useEffect,useId,useRef,type ReactNode} from 'react';
export default function Modal({title,onClose,children,wide=false,fullScreen=false}:{title:string;onClose:()=>void;children:ReactNode;wide?:boolean;fullScreen?:boolean}){
 const ref=useRef<HTMLDialogElement>(null);
 const id=useId();
 useEffect(()=>{const dialog=ref.current;dialog?.showModal();return()=>dialog?.close();},[]);
 return <dialog ref={ref} className={`modal ${wide?'modal-wide':''} ${fullScreen?'modal-fullscreen':''}`} aria-labelledby={id} onCancel={event=>{event.preventDefault();onClose();}} onClick={event=>{if(event.target===event.currentTarget){const rect=event.currentTarget.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)onClose();}}}>
 <div className="modal-heading"><h2 id={id}>{title}</h2><button onClick={onClose} aria-label="Close dialog" className="close-button">×</button></div>{children}</dialog>;
}
