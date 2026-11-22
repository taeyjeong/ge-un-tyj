'use client';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {countriesQuery} from '../lib/navigation';
import Link from 'next/link';
import DatasetTabs from './DatasetTabs';
import LiveObservationChart from './LiveObservationChart';
import CountryFilters from './CountryFilters';
import {iloDatasets,type IloDataset,type IloResponse,type IloRow} from '../lib/ilostat';
import {flagFor,type Country} from '../lib/types';
export default function EmploymentExplorer({countries,initialSelected}:{countries:Country[];initialSelected:string[]}){
 const [selected,setSelected]=useState(initialSelected);
 const [dataset,setDataset]=useState<IloDataset>('women-management');
 const [from,setFrom]=useState(2020),[to,setTo]=useState(2023);
 const [sex,setSex]=useState('both');
 const [modal,setModal]=useState(false),[loading,setLoading]=useState(false);
 const [error,setError]=useState(''),[result,setResult]=useState<IloResponse|null>(null);
 const requestId=useRef(0);
 function changeFilters(){requestId.current++;setResult(null);setError('');setLoading(false);}
 async function load(event:FormEvent){
  event.preventDefault();if(!selected.length||selected.length>20)return;
  const id=++requestId.current;setLoading(true);setError('');setResult(null);
  try{
   const params=new URLSearchParams({dataset,countries:selected.join(','),from:String(from),to:String(to),sex});
   const response=await fetch('/api/ilostat?'+params,{signal:AbortSignal.timeout(30000)});
   const data=await response.json();
   if(!response.ok)throw new Error(data.error??'Unable to load ILOSTAT data.');
   if(id===requestId.current)setResult(data);
  }catch(error){if(id===requestId.current)setError(error instanceof Error?error.message:'Unable to load data.');}
  finally{if(id===requestId.current)setLoading(false);}
 }
 useEffect(()=>{void load({preventDefault(){}} as FormEvent);return()=>{requestId.current++;};},[]);
 function csv(){
  if(!result)return;
  const columns=[...new Set(result.rows.flatMap(row=>Object.keys(row)))];
  const escape=(value:unknown)=>`"${String(value??'').replaceAll('"','""')}"`;
  const body=[columns,...result.rows.map(row=>columns.map(column=>row[column]))].map(row=>row.map(escape).join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob(['\uFEFF',body],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download=`ilostat-${dataset}.csv`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 const definition=iloDatasets[dataset];
 const missingCountries=result?countries.filter(country=>selected.includes(country.code)&&!result.rows.some(row=>row.ref_area===country.code)):[];
 function label(row:IloRow,key:string){return String(row[key+'.label']??row[key]??'—');}
 return <><header><Link className="brand" href={'/'+countriesQuery(selected)}>GE<span> / UN DATA</span></Link><span>ILOSTAT · INTERNATIONAL LABOUR ORGANIZATION</span></header><main><DatasetTabs active="/employment" countries={selected}/><div className="eyebrow">WORK, PAY & OPPORTUNITY</div><h1>Employment<br/>& earnings.</h1><p className="intro">Query ILOSTAT by country, year and sex. Inspect the returned observations and their source notes.</p><section className="data-section"><form onSubmit={load}><div className="ilo-filters"><label>Measure<select value={dataset} onChange={event=>{changeFilters();setDataset(event.target.value as IloDataset);}}>{Object.entries(iloDatasets).map(([key,value])=><option key={key} value={key}>{value.name}</option>)}</select></label><label>From year<input type="number" min={1900} max={2100} required value={from} onChange={event=>{changeFilters();setFrom(Number(event.target.value));}}/></label><label>To year<input type="number" min={from} max={Math.min(2100,from+40)} required value={to} onChange={event=>{changeFilters();setTo(Number(event.target.value));}}/></label><label>Sex<select disabled={!definition.sex} value={sex} onChange={event=>{changeFilters();setSex(event.target.value);}}><option value="both">Female and male</option><option value="female">Female</option><option value="male">Male</option><option value="total">Total</option></select></label></div><p className="muted">{definition.description}</p><div className="bulk-actions"><button type="button" className="button secondary" onClick={()=>setModal(true)}>Choose countries ({selected.length})</button><button className="button" disabled={loading||!selected.length||selected.length>20}>{loading?'Loading ILOSTAT…':'Load data'}</button></div><p className="muted">Selected: {selected.map(code=>{const country=countries.find(country=>country.code===code);return country?`${flagFor(country.iso2)} ${country.name}`:code;}).join(' · ')||'None'}. Query up to 20 countries at a time.</p>{selected.length>20&&<p className="gii-status">Choose up to 20 countries for this query, or load smaller groups separately.</p>}</form></section><section className="data-section" aria-busy={loading}><div className="data-heading"><h2>{definition.name}</h2><button className="button secondary" onClick={csv} disabled={!result?.rows.length}>Download returned data ↓</button></div><p className="muted">Unit: {definition.unit}. Source classifications and notes are retained; no observations are averaged or combined.</p><div role="status" aria-live="polite">{loading&&<p className="muted">Requesting observations from ILOSTAT…</p>}{error&&<p className="gii-status">{error}</p>}{!result&&!loading&&!error&&<p className="empty">Choose your filters and load data to see the available observations.</p>}{result&&<p className="muted">{result.rows.length} observations · queried {new Date(result.queriedAt).toLocaleString()}. <a href={result.sourceUrl} target="_blank" rel="noreferrer">Open source query ↗</a></p>}{result&&result.rows.length>0&&missingCountries.length>0&&<p className="muted">No observations returned for {missingCountries.map(country=>country.name).join(', ')} under these filters. Missing countries are not treated as zero.</p>}{result&&!result.rows.length&&<p className="empty">No observations match this query. Try a wider range or another measure.</p>}</div>{result&&result.rows.length>0&&<LiveObservationChart countries={countries} unit={definition.unit} rows={result.rows.map(row=>({country:String(row.ref_area),year:Number(row.time),value:typeof row.obs_value==='number'?row.obs_value:null,details:Object.fromEntries(Object.entries(row).filter(([key,value])=>key.endsWith('.label')&&value!=null).map(([key,value])=>[key.replace('.label',''),String(value)]))}))}/>}{result&&result.rows.length>0&&<div className="table-wrap data-scroll" tabIndex={0} role="region" aria-label="Scrollable ILOSTAT observations"><table><caption className="sr-only">Returned ILOSTAT observations</caption><thead><tr>{['Country','Year','Sex','Value','Breakdown','Source','Notes'].map(name=><th scope="col" key={name}>{name}</th>)}</tr></thead><tbody>{result.rows.slice(0,1000).map((row,index)=><tr key={index}><th scope="row">{label(row,'ref_area')}</th><td>{row.time}</td><td>{label(row,'sex')}</td><td>{typeof row.obs_value==='number'?row.obs_value.toLocaleString('en-US',{maximumFractionDigits:3}):'—'}</td><td>{['classif1','classif2'].filter(key=>row[key]||row[key+'.label']).map(key=>label(row,key)).join(' · ')||'—'}</td><td>{label(row,'source')}</td><td className="ilo-notes">{Object.entries(row).filter(([key,value])=>key.startsWith('note_')&&key.endsWith('.label')&&value).map(([,value])=>value).join(' · ')||'—'}</td></tr>)}</tbody></table></div>}{result&&result.rows.length>1000&&<p className="muted">Showing the first 1,000 rows. The download includes all returned observations.</p>}</section><footer><p>Source: <a href="https://rplumber.ilo.org/__docs__/" target="_blank" rel="noreferrer">ILOSTAT API documentation</a><br/>Responses may be cached for up to 24 hours. Query time is not the source publication date.</p><p>Independent explorer.<br/>Not affiliated with the United Nations.</p></footer></main>{modal&&<CountryFilters countries={countries} selected={selected} onClose={()=>setModal(false)} onApply={codes=>{changeFilters();setSelected(codes);setModal(false);}}/>}</>;
}
