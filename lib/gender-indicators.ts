// Country gender indicators for the AI chat and MCP server, from the UNDP Human Development Report
// 2025 data already built into the site (lib/countries.json: 195 countries, 1990-2023). Lets answers
// put a peace agreement's country in context (e.g. women in parliament or the GII in the signing year).
import data from './countries.json';

interface Country {code: string; name: string; geographicalRegion: string; series: Record<string, [number, number | null][]>}
const COUNTRIES = data as unknown as Country[];

export const GENDER_INDICATORS: Record<string, string> = {
  gii: 'Gender Inequality Index (0 = equal, 1 = most unequal)',
  gdi: 'Gender Development Index (female HDI ÷ male HDI; 1 = parity)',
  pr_f: 'Share of seats in parliament held by women (%)',
  lfpr_f: 'Labour force participation, women (% ages 15+)',
  lfpr_m: 'Labour force participation, men (% ages 15+)',
  se_f: 'At least some secondary education, women (% ages 25+)',
  se_m: 'At least some secondary education, men (% ages 25+)',
  mmr: 'Maternal mortality (deaths per 100,000 live births; 2020-2023 repeat the 2020 value)',
  abr: 'Adolescent birth rate (births per 1,000 women ages 15-19)',
  le_f: 'Life expectancy at birth, women (years)',
  le_m: 'Life expectancy at birth, men (years)',
  eys_f: 'Expected years of schooling, girls (years)',
  mys_f: 'Mean years of schooling, women (years)',
  mys_m: 'Mean years of schooling, men (years)',
  gni_pc_f: 'Income per person, women (GNI, 2021 PPP $)',
  gni_pc_m: 'Income per person, men (GNI, 2021 PPP $)',
  hdi_f: 'Human Development Index, women',
  hdi_m: 'Human Development Index, men',
};
export const GENDER_SOURCE = {name: 'UNDP Human Development Report 2025 (composite indices time series, 1990-2023)', url: 'https://hdr.undp.org/data-center/documentation-and-downloads'};

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const ALIASES: Record<string, string> = {drc: 'COD', 'dr congo': 'COD', 'democratic republic of congo': 'COD', 'democratic republic of the congo': 'COD', 'congo kinshasa': 'COD',
  'republic of congo': 'COG', 'congo brazzaville': 'COG', 'ivory coast': 'CIV', 'cote d ivoire': 'CIV', burma: 'MMR', 'east timor': 'TLS', uk: 'GBR', 'united kingdom': 'GBR',
  usa: 'USA', us: 'USA', 'united states': 'USA', russia: 'RUS', syria: 'SYR', iran: 'IRN', 'south korea': 'KOR', 'north korea': 'PRK', palestine: 'PSE', 'palestinian territories': 'PSE',
  bosnia: 'BIH', 'bosnia and herzegovina': 'BIH', laos: 'LAO', moldova: 'MDA', tanzania: 'TZA', venezuela: 'VEN', bolivia: 'BOL', vietnam: 'VNM', turkey: 'TUR', turkiye: 'TUR'};

export function findCountry(input: string): Country | undefined {
  const raw = input.trim(), key = norm(raw);
  if (/^[A-Za-z]{3}$/.test(raw)) {const byCode = COUNTRIES.find(c => c.code === raw.toUpperCase()); if (byCode) return byCode;}
  if (ALIASES[key]) return COUNTRIES.find(c => c.code === ALIASES[key]);
  return COUNTRIES.find(c => norm(c.name) === key) ?? COUNTRIES.find(c => norm(c.name).startsWith(key) || key.startsWith(norm(c.name)))
    ?? COUNTRIES.find(c => norm(c.name).includes(key));
}

export function genderIndicators(args: {countries: string[]; indicators?: string[]; year_from?: number; year_to?: number}) {
  const indicators = (args.indicators?.length ? args.indicators : ['gii', 'pr_f', 'lfpr_f']).filter(k => k in GENDER_INDICATORS).slice(0, 8);
  const latestOnly = args.year_from === undefined && args.year_to === undefined;
  const from = args.year_from ?? 1990, to = args.year_to ?? 2023;
  const notFound: string[] = [];
  const rows = args.countries.slice(0, 30).flatMap(input => {
    const c = findCountry(input);
    if (!c) {notFound.push(input); return [];}
    const values: Record<string, unknown> = {};
    for (const k of indicators) {
      const pts = (c.series[k] ?? []).filter(([y, v]) => v !== null && y >= from && y <= to) as [number, number][];
      values[k] = latestOnly ? (pts.length ? {year: pts[pts.length - 1][0], value: pts[pts.length - 1][1]} : null)
        : pts.length > 12 ? pts.filter(([y], i) => i === 0 || i === pts.length - 1 || y % 5 === 0).map(([year, value]) => ({year, value})) : pts.map(([year, value]) => ({year, value}));
    }
    return [{iso3: c.code, country: c.name, subregion: c.geographicalRegion, ...values}];
  });
  return {indicators: Object.fromEntries(indicators.map(k => [k, GENDER_INDICATORS[k]])), years: latestOnly ? 'latest available' : `${from}-${to}${to - from > 12 ? ' (long ranges show every 5th year plus first and last)' : ''}`,
    countries: rows, not_found: notFound.length ? notFound : undefined, source: GENDER_SOURCE};
}
