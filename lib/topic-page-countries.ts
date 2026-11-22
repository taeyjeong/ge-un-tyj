import data from './countries.json';
import {defaultCountriesFor} from './navigation';
export function topicPageCountries(){return data.map(({code,name,iso2,developmentGroup,developingRegion,geographicalRegion})=>({code,name,iso2,developmentGroup,developingRegion,geographicalRegion,series:{}})).sort((a,b)=>a.name.localeCompare(b.name));}
export function initialTopicCountries(param:string|string[]|undefined,path='/topics'){const countries=topicPageCountries();return [...new Set((Array.isArray(param)?param.join(','):param??defaultCountriesFor(path).join(',')).split(',').map(code=>code.trim().toUpperCase()))].filter(code=>countries.some(c=>c.code===code));}
