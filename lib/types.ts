import dictionary from './dictionary.json';
export type Metric = string;
export type Observation = [year: number, value: number | null];
export interface Country {
  code: string;
  name: string;
  iso2: string;
  developmentGroup: string;
  developingRegion: string;
  geographicalRegion: string;
  series: Record<Metric, Observation[]>;
}
export type ChartMode = 'line' | 'bar';
export interface GraphSettings {metric: Metric; startYear: number; endYear: number; mode: ChartMode; zeroBaseline: boolean}
export const indicators = dictionary.filter(item => item.group !== 'Identifiers');
export function indicatorFor(metric: Metric) {return indicators.find(item => item.prefix === metric) ?? indicators[0];}
export function flagFor(iso2: string) {return [...iso2.toUpperCase()].map(char => String.fromCodePoint(127397 + char.charCodeAt(0))).join('');}
export function colorFor(code: string) {
  const hash = [...code].reduce((value,char) => value * 31 + char.charCodeAt(0),0);
  return `hsl(${hash * 137.508 % 360} 56% 39%)`;
}
export function observations(country: Country, settings: GraphSettings) {
  return country.series[settings.metric].filter(([year])=>year>=settings.startYear && year<=settings.endYear);
}
export function formatValue(value: number | null, metric: Metric) {
  if(value===null) return '—';
  if(metric.endsWith('rank') || metric==='rankdiff_hdi_phdi' || metric==='gdi_group') return String(value);
  return value.toLocaleString('en-US',{maximumFractionDigits:3});
}
export function descriptionFor(metric: Metric) {
  if(metric==='gii') return 'Lower values indicate less gender inequality (0–1).';
  if(metric==='gdi') return 'Female HDI divided by male HDI. Closer to 1 indicates greater parity.';
  if(metric==='mmr') return 'Deaths per 100,000 live births. The 2020 estimate is repeated for 2020–2023.';
  if(metric==='ineq_inc') return 'Income inequality (%). The 2022 estimate is used for 2022–2023.';
  if(metric==='gdi_group') return '2023 classification: group 1 is closest to gender parity; group 5 is furthest.';
  if(indicatorFor(metric).years==='2023') return 'A 2023 snapshot. Switch to bars to compare countries at a glance.';
  return `${indicatorFor(metric).name}. Available series: ${indicatorFor(metric).years}.`;
}
