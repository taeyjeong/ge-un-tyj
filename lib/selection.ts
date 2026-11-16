import type {Country} from './types';
export const countryFacets=[['developingRegion','Developing region'],['developmentGroup','Development group'],['geographicalRegion','Geographical region']] as const;
export type CountryFilters = Record<typeof countryFacets[number][0],string>;
export function matchingCountries(countries:Country[],search:string,filters:CountryFilters){
  const query=search.trim().toLocaleLowerCase();
  return countries.filter(country=>country.name.toLocaleLowerCase().includes(query)&&countryFacets.every(([key])=>!filters[key]||country[key]===filters[key]));
}
export function addCountries(selected:Iterable<string>,countries:Country[]){return new Set([...selected,...countries.map(country=>country.code)]);}
export function removeCountries(selected:Iterable<string>,countries:Country[]){const remove=new Set(countries.map(country=>country.code));return new Set([...selected].filter(code=>!remove.has(code)));}
export function selectedCountriesFirst(countries:Country[],selected:Iterable<string>){
  const codes=new Set(selected);
  return [...countries].sort((a,b)=>Number(codes.has(b.code))-Number(codes.has(a.code))||a.name.localeCompare(b.name));
}
