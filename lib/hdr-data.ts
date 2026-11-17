import data from './countries.json';
import {homeMetrics} from './hdr-focus';
import type {Country,Observation} from './types';
const allCountries:Country[]=data.map(country=>({...country,series:Object.fromEntries(Object.entries(country.series).map(([metric,points])=>[metric,points.map(([year,value]):Observation=>{if(typeof year!=='number'||(value!==null&&typeof value!=='number'))throw new Error(`Invalid observation: ${country.code}/${metric}`);return [year,value];})]))})).sort((a,b)=>a.name.localeCompare(b.name));
export function hdrPageCountries(focused=false):Country[]{return focused?allCountries.map(c=>({...c,series:Object.fromEntries(homeMetrics.map(metric=>[metric,c.series[metric]]))})):allCountries;}
export function initialHdrSelection(param:string|string[]|undefined){if(param===undefined)return undefined;const requested=(Array.isArray(param)?param.join(','):param).split(',').map(code=>code.trim().toUpperCase());return [...new Set(requested)].filter(code=>allCountries.some(c=>c.code===code));}
