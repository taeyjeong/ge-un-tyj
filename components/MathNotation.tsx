import type {ReactNode} from 'react';
export function Fraction({top,bottom}:{top:ReactNode;bottom:ReactNode}){return <span className="math-fraction"><span>{top}</span><span>{bottom}</span></span>;}
export function Root({children,cube=false}:{children:ReactNode;cube?:boolean}){return <span className="math-root"><span>{cube?'∛':'√'}</span><span className="math-radicand">{children}</span></span>;}
