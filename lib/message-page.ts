/** Store page identity without auth tokens, fragments, or unrelated URL parameters. */
export function messagePage(location:{pathname:string;search:string}){
 const path=location.pathname;
 if(!path.startsWith('/')||path.startsWith('//')||/[\\?#\s]/.test(path)||path.length>900)return '/';
 if(path==='/indices-redone'){
  const index=new URLSearchParams(location.search).get('index');
  return path+(index&&/^(gii|hdi|gdi|ihdi|phdi|fdi|fcs|mpi|ghi|epi)$/.test(index)?'?index='+index:'');
 }
 return path;
}
const labels:Record<string,string>={'/':'GII · Homepage','/indices':'Indices','/indices-redone':'Indices dashboard','/data':'Data','/lab':'Data lab','/lab/hdr':'HDR data explorer','/employment':'Employment & earnings','/sdg':'Unpaid care work','/unicef':'Child marriage','/topics':'World data','/data-dictionary':'Data dictionary'};
export function messagePageLabel(page:string|null|undefined){
 if(!page)return 'Page not recorded';
 const [path,query]=page.split('?');
 if(path==='/indices-redone'){const index=new URLSearchParams(query).get('index')??'gii';return 'Indices dashboard · '+index.toUpperCase();}
 if(path.startsWith('/indices/'))return path.slice('/indices/'.length).toUpperCase()+' · Index explorer';
 if(path.startsWith('/topics/'))return path.slice('/topics/'.length).replaceAll('-',' ')+' · World data';
 return labels[path]??path;
}
