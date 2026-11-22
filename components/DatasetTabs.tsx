'use client';
import Link from 'next/link';
import {useEffect,useId,useRef,useState,type KeyboardEvent} from 'react';
import {dataNavigation,indexNavigation,navigationContext,navigationHref,type NavigationGroup} from '../lib/navigation';
type Menu='indices'|'data';
export default function SiteNavigation({active,countries=['JPN','KOR','USA']}:{active:string;countries?:string[]}){
 const [open,setOpen]=useState<Menu|null>(null),[mobileOpen,setMobileOpen]=useState(false);
 const nav=useRef<HTMLElement>(null),indexButton=useRef<HTMLButtonElement>(null),dataButton=useRef<HTMLButtonElement>(null),mobileButton=useRef<HTMLButtonElement>(null);
 const id=useId(),context=navigationContext(active);const href=(path:string)=>navigationHref(path,countries);
 function close(){setOpen(null);setMobileOpen(false);}
 useEffect(()=>{
  const outside=(e:PointerEvent)=>{if(!nav.current?.contains(e.target as Node)){setOpen(null);setMobileOpen(false);}};
  document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside);
 },[]);
 function escape(e:KeyboardEvent<HTMLElement>){
  if(e.key!=='Escape')return;
  e.preventDefault();e.stopPropagation();
  if(open){(open==='indices'?indexButton:dataButton).current?.focus();setOpen(null);}else if(mobileOpen){mobileButton.current?.focus();setMobileOpen(false);}
 }
 function toggle(menu:Menu){setOpen(current=>current===menu?null:menu);}
 function focusMenu(e:KeyboardEvent<HTMLButtonElement>,menu:Menu){
  if(e.key!=='ArrowDown'&&e.key!=='ArrowUp')return;
  e.preventDefault();setOpen(menu);
  const last=e.key==='ArrowUp';requestAnimationFrame(()=>{const links=nav.current?.querySelectorAll<HTMLAnchorElement>(`[data-nav-panel="${menu}"] a`);if(links?.length)links[last?links.length-1:0].focus();});
 }
 function moveInMenu(e:KeyboardEvent<HTMLDivElement>){
  if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key))return;
  const links=[...e.currentTarget.querySelectorAll<HTMLAnchorElement>('a')];const position=links.indexOf(document.activeElement as HTMLAnchorElement);if(position<0)return;
  e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?links.length-1:(position+(e.key==='ArrowDown'?1:-1)+links.length)%links.length;links[next]?.focus();
 }
 function panel(menu:Menu,groups:NavigationGroup[]){return <div className={`site-nav-panel site-nav-panel-${menu}`} id={`${id}-${menu}`} data-nav-panel={menu} hidden={open!==menu} onKeyDown={moveInMenu}>
  <div className="site-nav-panel-heading"><div><strong>{menu==='indices'?'Composite indices & scores':'Indicators & datasets'}</strong><p>{menu==='indices'?'See how component measurements become a score.':'Explore measurements by topic, with units, dates and sources.'}</p></div><Link href={href(menu==='indices'?'/indices':'/data')} onClick={close}>View all {menu==='indices'?'indices':'data'} →</Link></div>
  <div className="site-nav-groups">{groups.map(group=><section key={group.label}><h2>{group.label}</h2>{group.links.map(link=><Link href={href(link.href)} key={link.href} aria-current={context.path===link.href?'page':undefined} onClick={close}><span>{link.label}</span>{link.description&&<small>{link.description}</small>}</Link>)}</section>)}</div>
  {menu==='data'&&<div className="site-nav-panel-footer"><Link href={href('/topics')} onClick={close}>World Bank overview · 50 measures →</Link><Link href={href('/lab/hdr')} onClick={close}>Full HDR dataset · 40 measures →</Link></div>}
 </div>;}
 return <nav ref={nav} className={`site-nav ${mobileOpen?'site-nav-mobile-open':''}`} aria-label="Main navigation" onKeyDown={escape} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))close();}}>
  <button ref={mobileButton} className="site-nav-mobile-toggle" type="button" aria-expanded={mobileOpen} aria-controls={`${id}-links`} onClick={()=>{setMobileOpen(v=>!v);setOpen(null);}}><span>{mobileOpen?'Close':'Menu'}</span><span aria-hidden="true">{mobileOpen?'×':'☰'}</span></button>
  <div className="site-nav-links" id={`${id}-links`}>
   <div className="site-nav-dropdown"><button ref={indexButton} type="button" className={`site-nav-trigger ${context.isIndex?'is-current':''}`} aria-expanded={open==='indices'} aria-controls={`${id}-indices`} onClick={()=>toggle('indices')} onKeyDown={e=>focusMenu(e,'indices')}><span>Indices{context.indexLabel&&<small> / {context.indexLabel}</small>}</span><span className="site-nav-chevron" aria-hidden="true">⌄</span></button>{panel('indices',indexNavigation)}</div>
   <div className="site-nav-dropdown"><button ref={dataButton} type="button" className={`site-nav-trigger ${context.isData?'is-current':''}`} aria-expanded={open==='data'} aria-controls={`${id}-data`} onClick={()=>toggle('data')} onKeyDown={e=>focusMenu(e,'data')}><span>Data{context.dataLabel&&<small> / {context.dataLabel}</small>}</span><span className="site-nav-chevron" aria-hidden="true">⌄</span></button>{panel('data',dataNavigation)}</div>
   <Link className={`site-nav-lab ${context.path==='/lab'?'is-current':''}`} href={href('/lab')} aria-current={context.path==='/lab'?'page':undefined} onClick={close}>Data lab<span aria-hidden="true"> ↗</span></Link>
   <Link className={`site-nav-lab ${context.path==='/peace-agreements'?'is-current':''}`} href={href('/peace-agreements')} aria-current={context.path==='/peace-agreements'?'page':undefined} onClick={close}>Peace agreements</Link>
  </div>
 </nav>;
}
