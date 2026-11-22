import defaults from './default-countries.json';
export interface NavigationLink {href:string;label:string;description?:string}
export interface NavigationGroup {label:string;links:NavigationLink[]}
export const indexNavigation:NavigationGroup[]=[
 {label:'Human development',links:[{href:'/indices/hdi',label:'HDI',description:'Human Development Index'},{href:'/indices/ihdi',label:'IHDI',description:'Inequality-adjusted HDI'},{href:'/indices/phdi',label:'PHDI',description:'Planetary pressures-adjusted HDI'}]},
 {label:'Gender',links:[{href:'/',label:'GII',description:'Gender Inequality Index'},{href:'/indices/gdi',label:'GDI',description:'Gender Development Index'}]},
 {label:'Poverty & food',links:[{href:'/indices/mpi',label:'MPI',description:'Multidimensional Poverty Index'},{href:'/indices/ghi',label:'GHI',description:'Global Hunger Index'},{href:'/indices/fcs',label:'FCS',description:'Household Food Consumption Score'}]},
 {label:'Finance',links:[{href:'/indices/fdi',label:'Financial Development Index',description:'IMF · institutions and markets'}]},
 {label:'Environment',links:[{href:'/indices/epi',label:'Environmental Performance Index',description:'Environmental health, ecosystems and climate'}]},
];
export const dataNavigation:NavigationGroup[]=[
 {label:'Gender & work',links:[{href:'/sdg',label:'Unpaid care work',description:'UN SDG · time use by sex and age'},{href:'/employment',label:'Employment & earnings',description:'ILOSTAT · jobs, pay and management'},{href:'/unicef',label:'Child marriage',description:'UNICEF · survey observations'}]},
 {label:'Climate & environment',links:[{href:'/topics/climate',label:'Emissions, forests & air quality'}]},
 {label:'Poverty & food',links:[{href:'/topics/poverty',label:'Poverty & income distribution'},{href:'/topics/food',label:'Food insecurity & nutrition'}]},
 {label:'Health & education',links:[{href:'/topics/health',label:'Health & survival'},{href:'/topics/education',label:'Schooling & literacy'}]},
 {label:'Water & energy',links:[{href:'/topics/water',label:'Water & sanitation'},{href:'/topics/energy',label:'Electricity & clean energy'}]},
 {label:'Economy & cities',links:[{href:'/topics/economy',label:'Economy & employment'},{href:'/topics/cities',label:'Cities & infrastructure'}]},
 {label:'Peace & conflict',links:[{href:'/topics/peace',label:'Safety & institutions'},{href:'/topics/conflict',label:'Conflict & displacement'}]},
];
export function canonicalNavigationPath(path:string){return path==='/indices/gii'?'/':path;}
// Each section has its own three default countries (lib/default-countries.json, computed by
// scripts/compute_default_countries.py: the biggest change plus the two worst latest values).
// Links carry ?countries= only when the visitor changed the selection on the current page;
// otherwise the destination opens with its own defaults.
type Defaults=Record<string,{countries:string[]}>;
const sectionDefaults=defaults as Defaults;
export function defaultCountriesFor(path:string):string[]{return [...(sectionDefaults[canonicalNavigationPath(path)]??sectionDefaults['/']).countries];}
function sameCountries(a:readonly string[],b:readonly string[]){return a.length===b.length&&[...a].map(c=>c.toUpperCase()).sort().join(',')===[...b].sort().join(',');}
export function countriesQuery(countries:readonly string[],fromPath='/'){return sameCountries(countries,defaultCountriesFor(fromPath))?'':'?'+new URLSearchParams({countries:countries.join(',')}).toString();}
export function navigationHref(path:string,countries:readonly string[],fromPath='/'){return canonicalNavigationPath(path)+countriesQuery(countries,fromPath);}
export function navigationCountries(input:string|string[]|undefined,path='/'){return input===undefined?defaultCountriesFor(path):[...new Set((Array.isArray(input)?input.join(','):input).split(',').map(c=>c.trim().toUpperCase()).filter(c=>/^[A-Z]{3}$/.test(c)))];}
export function navigationContext(path:string){
 path=canonicalNavigationPath(path);
 const index=indexNavigation.flatMap(g=>g.links).find(link=>link.href===path);
 const data=dataNavigation.flatMap(g=>g.links).find(link=>link.href===path);
 return {path,indexLabel:path==='/'?undefined:index?.label,dataLabel:data?.label,isIndex:path==='/'||path.startsWith('/indices'),isData:!!data||['/data','/topics','/lab/hdr','/data-dictionary'].includes(path)};
}
