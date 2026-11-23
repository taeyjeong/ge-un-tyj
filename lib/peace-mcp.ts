// Tools for the peace agreements MCP server (/api/mcp). Read-only: every tool answers from the
// bundled project data (lib/peace-mcp-data.json, built by scripts/build_peace_mcp_data.py).
import data from './peace-mcp-data.json';
import {issues, type Dataset, type IssueStatus} from './project-log';
import {GENDER_INDICATORS, genderIndicators} from './gender-indicators';

const SITE = 'https://ge-un-tyj.vercel.app';
const paxUrl = (id: number) => `https://www.peaceagreements.org/view/${id}`;

interface Padd {Del_N: number|null; FemDel_N: number|null; FemDel_P: number|null; Sig_N: number|null; FemSig_N: number|null; FemSig_P: number|null; Neg_N: number|null; FemNeg_N: number|null; FemNeg_P: number|null; women_roles: string[]; role_group: string}
interface Cfr {slug: string; url: string; process_type: string|null; negotiators_pct: number|null; mediators_pct: number|null; signatories_pct: number|null; parliament_pct: number|null}
interface Agreement {id: number; name: string; date: string; year: number|null; country: string; region: string; process: string|null; stage: string; conflict_type: string|null; agreement_level: string; mentions_women: boolean; un_signed: boolean; other_intl_signed: boolean; third_party: string|null; padd: Padd|null; cfr: Cfr|null}

const AGREEMENTS = (data as {agreements: Agreement[]}).agreements;
const BY_ID = new Map(AGREEMENTS.map(a => [a.id, a]));
const STAGES = ['Pre-negotiation', 'Partial substantive', 'Comprehensive', 'Implementation', 'Renewal', 'Ceasefire', 'Other'];
const REGIONS = [...new Set(AGREEMENTS.map(a => a.region))].sort();
const ROLE_NAMES: Record<string, string> = {Sig: 'signatory', Neg: 'negotiator', Ob: 'observer', Med: 'mediator', Adv: 'adviser', Log: 'support staff', WomCom: "women's committee", Unknown: 'unknown role'};

export interface ToolResult {content: {type: 'text'; text: string}[]; structuredContent?: Record<string, unknown>; isError?: boolean}
type Args = Record<string, unknown>;
interface ToolDef {name: string; title: string; description: string; inputSchema: Record<string, unknown>; run: (args: Args) => ToolResult}

const ok = (payload: Record<string, unknown>): ToolResult => ({content: [{type: 'text', text: JSON.stringify(payload)}], structuredContent: payload});
const fail = (message: string): ToolResult => ({content: [{type: 'text', text: message}], isError: true});
const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v.trim() && Number.isFinite(Number(v)) ? Number(v) : undefined);
const bool = (v: unknown) => (typeof v === 'boolean' ? v : v === 'true' ? true : v === 'false' ? false : undefined);
const pct = (v: number|null|undefined, scale = 100) => (v === null || v === undefined ? null : Math.round(v * scale * 10) / 10);
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function summary(a: Agreement) {
  return {id: a.id, name: a.name, date: a.date, country: a.country, region: a.region, stage: a.stage, mentions_women: a.mentions_women, un_signed: a.un_signed, url: paxUrl(a.id)};
}

function detail(a: Agreement) {
  return {
    ...summary(a), process: a.process, conflict_type: a.conflict_type, agreement_level: a.agreement_level,
    other_international_signatory: a.other_intl_signed, third_parties: a.third_party,
    women_at_the_table: {
      padd: a.padd ? {
        source: 'PADD 1.0: people named in the agreement text, gender assumed from names with hand checks',
        named_delegates: a.padd.Del_N, women_named: a.padd.FemDel_N, pct_women_named: pct(a.padd.FemDel_P),
        signatories: a.padd.Sig_N, women_signatories: a.padd.FemSig_N, pct_women_signatories: pct(a.padd.FemSig_P),
        pct_women_negotiators: pct(a.padd.FemNeg_P), roles_held_by_women: a.padd.women_roles.map(r => ROLE_NAMES[r] ?? r), group: a.padd.role_group,
      } : a.stage === 'Comprehensive' ? 'Not in PADD (PADD covers comprehensive agreements 1990-2020; this one is missing or was added to PA-X later)' : 'Not in PADD (PADD covers comprehensive agreements only)',
      cfr: a.cfr ? {
        source: 'CFR Women’s Participation in Peace Processes (outside records; page read 22 Nov 2026)',
        pct_women_negotiators: a.cfr.negotiators_pct, pct_women_mediators: a.cfr.mediators_pct, pct_women_signatories: a.cfr.signatories_pct,
        pct_women_in_parliament: a.cfr.parliament_pct, cfr_process_type: a.cfr.process_type, cfr_page: a.cfr.url,
      } : 'Not in the CFR tracker',
    },
  };
}

function filterAgreements(args: Args) {
  const country = str(args.country), region = str(args.region), stage = str(args.stage), q = str(args.name_contains);
  const from = num(args.year_from), to = num(args.year_to), women = bool(args.mentions_women), un = bool(args.un_signed);
  return AGREEMENTS.filter(a =>
    (!country || norm(a.country).includes(norm(country))) &&
    (!region || norm(a.region).includes(norm(region))) &&
    (!stage || norm(a.stage) === norm(stage)) &&
    (!q || norm(a.name).includes(norm(q))) &&
    (from === undefined || (a.year ?? 0) >= from) && (to === undefined || (a.year ?? 9999) <= to) &&
    (women === undefined || a.mentions_women === women) && (un === undefined || a.un_signed === un));
}

const FILTER_PROPS = {
  country: {type: 'string', description: 'Country name or part of it, e.g. "Colombia", "Sudan".'},
  region: {type: 'string', enum: REGIONS, description: 'PA-X region.'},
  stage: {type: 'string', enum: STAGES, description: 'Stage of the peace process.'},
  year_from: {type: 'integer', minimum: 1990, maximum: 2025}, year_to: {type: 'integer', minimum: 1990, maximum: 2025},
  mentions_women: {type: 'boolean', description: 'Only agreements that do (true) or do not (false) include provisions on women, girls or gender (PA-X GeWom).'},
  un_signed: {type: 'boolean', description: 'Only agreements a UN official did (true) or did not (false) sign.'},
};

const FINDINGS: Record<string, Record<string, unknown>> = {
  '1': {part: '1', question: 'What kinds of peace agreements mention women?', data: 'PA-X v10, 2,257 agreements (1990–2025)', page: `${SITE}/peace-agreements`,
    answer: 'The stage of the peace process matters most, then the year. 21.9% of agreements mention women overall (494 of 2,257).',
    key_numbers: ['Comprehensive agreements: 58.9% mention women (73 of 124), about 7× the odds of pre-negotiation agreements with other features held constant', 'Ceasefires 10.8%, renewals 4.1%', 'Clear rise after UN Resolution 1325 (2000)', 'UN signature: odds ratio 1.69 with controls; other international signatories and third parties show no independent effect', 'Africa stays ahead of the Americas, MENA and Europe after controls', 'Test ROC AUC: tuned tree 0.73, random forest 0.76'],
    caveats: ['One random split; agreements from one peace process can land in both training and test sets', 'GeWom records mentions, not the strength of provisions']},
  '2a': {part: '2a', question: 'In comprehensive peace agreements, does it matter what role women hold?', data: 'PA-X + PADD, 119 comprehensive agreements 1990–2020 (116 in PADD)', page: `${SITE}/women-signatories`,
    answer: 'Yes: power matters more than presence. When a woman signed, 80% of agreements mention women (16 of 20), about 3.3× the odds of agreements naming no women (p ≈ 0.05, era held constant). Women present without signing: 61% (11 of 18), no clear difference from no women named (53%, 41 of 78).',
    key_numbers: ['Women are 7% of named signatories and 6% of named negotiators', 'Robustness: with only confidently coded genders, 93% vs 52%', 'Women signatories rose in the 2010s (29% of agreements vs about 10–13% before)'],
    caveats: ['Gender assumed from names (Gender API + hand checks); 309 of 2,301 people unknown', 'Only people named in the agreement text', 'Comprehensive agreements only; 20 agreements with a woman signatory']},
  '2b': {part: '2b', question: 'Does the link between women negotiators and gender provisions depend on the type of agreement?', data: 'PA-X + CFR, 33 agreements with a negotiator figure', page: `${SITE}/women-negotiators`,
    answer: 'No clear link in either type. Women were about 11% of negotiators whether or not the agreement mentioned women (11.5% vs 10.7%, p ≈ 0.95). Comprehensive deals almost all mention women (15 of 16); in other stages the ≥15% group is slightly higher (4 of 6 vs 5 of 11) but the regression is flat (OR 1.02 per +10 points, p = 0.97).',
    key_numbers: ['Stage still dominates: 18 of 19 comprehensive vs 13 of 28 other matched agreements mention women', 'Odds ratio for women negotiators stays near 1 with stage and year controlled (95% CI about 0.5–3 per +10 points)'],
    caveats: ['33 agreements; the by-type split is exploratory (17 non-comprehensive)', 'CFR measures presence, not influence', 'CFR data read from 73 web pages; no download exists']},
  original: {part: 'original question', question: 'Predict gender provisions from women’s share of negotiators, the year, and UN involvement', data: 'PA-X + CFR, 33 agreements', page: `${SITE}/women-negotiators`,
    answer: 'These three features predict gender provisions barely better than guessing (leave-one-out AUC 0.57; accuracy 73%, the same as always guessing yes). UN signature is the strongest hint (11 of 12 UN-signed agreements mention women vs 13 of 21; OR 6.1, p = 0.13). The feature that does predict well, the stage of the agreement, was not in the original feature list.',
    key_numbers: ['Women negotiators OR 1.4 per +10 points (p = 0.44)', 'Year OR 0.65 per +10 years (p = 0.43)'],
    caveats: ['Small sample', 'The 16 agreements in all three datasets cannot answer it: 15 of 16 mention women']},
  '3': {part: '3', question: 'Do CFR’s and PADD’s counts of women at the table agree?', data: 'PA-X + PADD + CFR, 19 agreements in all three, 16 with both measures', status: 'Not built yet; exploratory',
    answer: 'Too small for conclusions. Early patterns: CFR finds more women than the signed text in 11 of 16; in 8, women negotiated (CFR) but no woman signed (PADD); the two measures barely correlate (Spearman ≈ 0.24–0.29).'},
};

function rates(args: Args): ToolResult {
  const by = str(args.group_by) ?? 'stage';
  const key: Record<string, (a: Agreement) => string> = {
    stage: a => a.stage, region: a => a.region, decade: a => (a.year ? `${Math.floor(a.year / 10) * 10}s` : 'unknown'), year: a => String(a.year ?? 'unknown'),
    conflict_type: a => a.conflict_type ?? 'unknown', agreement_level: a => a.agreement_level, un_signed: a => (a.un_signed ? 'UN signed' : 'No UN signature'),
    women_role_padd: a => a.padd?.role_group ?? 'Not in PADD',
  };
  if (!key[by]) return fail(`group_by must be one of: ${Object.keys(key).join(', ')}`);
  const rows = filterAgreements(args);
  const groups = new Map<string, {agreements: number; mention_women: number}>();
  for (const a of rows) {const g = groups.get(key[by](a)) ?? {agreements: 0, mention_women: 0}; g.agreements++; if (a.mentions_women) g.mention_women++; groups.set(key[by](a), g);}
  const table = [...groups].map(([group, g]) => ({group, ...g, share_mention_women: Math.round((g.mention_women / g.agreements) * 1000) / 10}))
    .sort((x, y) => (by === 'year' || by === 'decade' ? x.group.localeCompare(y.group) : y.agreements - x.agreements));
  const total = rows.filter(a => a.mentions_women).length;
  return ok({grouped_by: by, agreements: rows.length, mention_women: total, overall_share: rows.length ? Math.round((total / rows.length) * 1000) / 10 : null, groups: table,
    note: 'Raw shares (no controls). "mention women" = PA-X GeWom: any provision on women, girls or gender. Small groups are unreliable.'});
}

// Official public sources that could answer questions this project's data can't. Links checked 22 Nov 2026.
export const OFFICIAL_SOURCES = [
  {name: 'PA-X Peace Agreements Database (full site)', publisher: 'PeaceRep, University of Edinburgh', url: 'https://www.peaceagreements.org/', covers: 'Full text of every agreement and ~280 coded provisions, including detailed gender provisions (PA-X Gender), beyond the yes/no flag this project uses.', topics: ['agreement text', 'specific provisions', 'gender provision detail', 'local agreements']},
  {name: 'PA-X downloads', publisher: 'PeaceRep, University of Edinburgh', url: 'https://www.peaceagreements.org/downloads', covers: 'Downloadable PA-X datasets and codebooks, including newer versions.', topics: ['agreements after 2025', 'other PA-X variables']},
  {name: 'UCDP datasets', publisher: 'Uppsala Conflict Data Program', url: 'https://ucdp.uu.se/downloads/', covers: 'Peace agreements from 1975 and conflict data: battle deaths, conflict onset and termination, whether fighting resumed.', topics: ['agreements before 1990', 'conflict deaths', 'whether peace lasted', 'violence']},
  {name: 'UN Peacemaker peace agreements database', publisher: 'United Nations', url: 'https://peacemaker.un.org/en/areas-of-work/peace-agreements-database-and-language-of-peace-tool/peace-agreements-search', covers: 'Searchable archive of about 1,300 peace agreement documents.', topics: ['agreement documents', 'UN-mediated processes']},
  {name: 'Peace Accords Matrix', publisher: 'Kroc Institute, University of Notre Dame', url: 'https://kroc.nd.edu/research/peace-processes-accords/', covers: 'Year-by-year implementation of 51 provision types in 34 comprehensive agreements since 1989.', topics: ['implementation', 'whether promises were kept']},
  {name: 'PADD: Peace Agreement Delegate Dataset (Harvard Dataverse)', publisher: 'Elizabeth Good, American Political Science Review 2025', url: 'https://doi.org/10.7910/DVN/MBMU7F', covers: 'Every named delegate in 116 comprehensive agreements with role and coded gender, plus the author\'s code and codebook.', topics: ['individual delegates', 'roles', 'delegate-level detail']},
  {name: 'Women\'s Participation in Peace Processes', publisher: 'Council on Foreign Relations', url: 'https://www.cfr.org/womens-participation-in-peace-processes', covers: 'Women\'s share of negotiators, mediators and signatories in 73 major processes, with case narratives.', topics: ['women negotiators', 'mediators', 'case studies']},
  {name: 'Facts and figures: Women, peace and security', publisher: 'UN Women', url: 'https://www.unwomen.org/en/articles/facts-and-figures/facts-and-figures-women-peace-and-security', covers: 'Recent global figures on women in peace processes from the UN Secretary-General\'s annual reports.', topics: ['recent global totals', 'UN-led processes', 'years after 2020']},
  {name: 'IPU Parline', publisher: 'Inter-Parliamentary Union', url: 'https://data.ipu.org/', covers: 'Women\'s share of seats in every national parliament, over time.', topics: ['women in parliament', 'women in government']},
  {name: 'Women, Peace and Security Index', publisher: 'Georgetown Institute for Women, Peace and Security', url: 'https://giwps.georgetown.edu/the-index/', covers: 'Country scores on women\'s inclusion, justice and security.', topics: ['country-level women\'s status', 'security', 'justice']},
];

export const TOOLS: ToolDef[] = [
  {
    name: 'search', title: 'Search peace agreements',
    description: 'Search the 2,257 PA-X peace agreements (1990–2025) by words in the agreement name, country, region, peace process or stage. Returns ids to pass to fetch.',
    inputSchema: {type: 'object', properties: {query: {type: 'string', description: 'Search words, e.g. "Colombia final agreement" or "Darfur ceasefire".'}}, required: ['query']},
    run: args => {
      const q = str(args.query);
      if (!q) return fail('query is required');
      const idMatch = q.match(/^\d+$/) ? BY_ID.get(Number(q)) : undefined;
      const words = norm(q).split(/[^a-z0-9]+/).filter(w => w.length > 1);
      const scored = AGREEMENTS.map(a => {
        const hay = {name: norm(a.name), country: norm(a.country), other: norm(`${a.region} ${a.process ?? ''} ${a.stage} ${a.year ?? ''}`)};
        const all = `${hay.name} ${hay.country} ${hay.other}`;
        let score = words.reduce((s, w) => s + (hay.country.includes(w) ? 3 : 0) + (hay.name.includes(w) ? 2 : 0) + (hay.other.includes(w) ? 1 : 0), 0);
        if (score && words.every(w => all.includes(w))) score += 4;  // every word found somewhere
        const nameWords = words.filter(w => !hay.country.includes(w));
        if (nameWords.length && hay.name.includes(nameWords.join(' '))) score += 6;  // the non-country words appear as a phrase in the name
        if (score && a.stage === 'Comprehensive') score += 1;  // main peace deals win ties with communiqués about them
        return {a, score};
      }).filter(x => x.score > 0).sort((x, y) => y.score - x.score || (y.a.year ?? 0) - (x.a.year ?? 0)).slice(0, 10).map(x => x.a);
      const hits = idMatch ? [idMatch, ...scored.filter(a => a.id !== idMatch.id)].slice(0, 10) : scored;
      return ok({results: hits.map(a => ({id: `pax-${a.id}`, title: `${a.name} (${a.country}, ${a.year ?? 'n.d.'})`, url: paxUrl(a.id)}))});
    },
  },
  {
    name: 'fetch', title: 'Fetch one peace agreement',
    description: 'Get the full record for one agreement by id (from search, e.g. "pax-1845"): stage, region, whether it mentions women, UN involvement, and women at the table from PADD and the CFR tracker where available.',
    inputSchema: {type: 'object', properties: {id: {type: 'string', description: 'Agreement id such as "pax-1845" or "1845".'}}, required: ['id']},
    run: args => {
      const id = Number(String(args.id ?? '').replace(/^pax-/, ''));
      const a = BY_ID.get(id);
      if (!a) return fail(`No agreement with id ${String(args.id)}. Use search to find ids.`);
      const d = detail(a);
      return ok({id: `pax-${a.id}`, title: a.name, text: JSON.stringify(d, null, 1), url: paxUrl(a.id), metadata: {country: a.country, year: a.year, stage: a.stage, mentions_women: a.mentions_women}});
    },
  },
  {
    name: 'find_agreements', title: 'Find agreements by filters',
    description: 'List PA-X peace agreements matching filters (country, region, stage, years, whether they mention women, UN signature). Returns a count and up to `limit` agreements, newest first.',
    inputSchema: {type: 'object', properties: {...FILTER_PROPS, name_contains: {type: 'string', description: 'Words that must appear in the agreement name.'}, limit: {type: 'integer', minimum: 1, maximum: 100, default: 25}}},
    run: args => {
      const rows = filterAgreements(args).sort((x, y) => (y.date ?? '').localeCompare(x.date ?? ''));
      const limit = Math.min(Math.max(num(args.limit) ?? 25, 1), 100);
      return ok({matching: rows.length, mention_women: rows.filter(a => a.mentions_women).length, shown: Math.min(limit, rows.length), agreements: rows.slice(0, limit).map(summary)});
    },
  },
  {
    name: 'gender_provision_rates', title: 'Share of agreements that mention women, by group',
    description: 'Count agreements and the share that mention women, grouped by stage, region, decade, year, conflict_type, agreement_level, un_signed, or women_role_padd (who signed, comprehensive agreements only). Optional filters narrow the agreements first.',
    inputSchema: {type: 'object', properties: {group_by: {type: 'string', enum: ['stage', 'region', 'decade', 'year', 'conflict_type', 'agreement_level', 'un_signed', 'women_role_padd'], default: 'stage'}, ...FILTER_PROPS}},
    run: rates,
  },
  {
    name: 'women_at_the_table', title: 'Women at the negotiating table',
    description: 'For one agreement (id) or all agreements in a country, show women’s share of negotiators, signatories and named delegates from PADD (names in the agreement text) and the CFR tracker (outside records). Only about 116 agreements (PADD) and 47 (CFR) have this data.',
    inputSchema: {type: 'object', properties: {id: {type: 'string', description: 'Agreement id, e.g. "pax-1845".'}, country: {type: 'string', description: 'Country name, e.g. "South Sudan".'}}},
    run: args => {
      const id = args.id !== undefined ? Number(String(args.id).replace(/^pax-/, '')) : undefined;
      const country = str(args.country);
      if (id === undefined && !country) return fail('Give an agreement id or a country.');
      const rows = (id !== undefined ? [BY_ID.get(id)].filter(Boolean) as Agreement[] : AGREEMENTS.filter(a => norm(a.country).includes(norm(country!)) && (a.padd || a.cfr)));
      if (!rows.length) return ok({matching: 0, note: 'No PADD or CFR data for this selection. PADD covers comprehensive agreements 1990–2020; CFR covers 47 major agreements.'});
      return ok({matching: rows.length, agreements: rows.slice(0, 40).map(a => ({id: a.id, name: a.name, year: a.year, stage: a.stage, mentions_women: a.mentions_women, ...detail(a).women_at_the_table}))});
    },
  },
  {
    name: 'country_gender_indicators', title: 'Country gender indicators (UNDP HDR)',
    description: `Gender indicators for countries from the UNDP Human Development Report 2025 data (195 countries, 1990-2023): ${Object.entries(GENDER_INDICATORS).map(([k, v]) => `${k} = ${v}`).join('; ')}. Use it to put an agreement's country in context, e.g. women's share of parliament or the GII in the year an agreement was signed. Omit years for the latest value; give year_from/year_to for a time series. Country-level only: it says nothing about the peace process itself.`,
    inputSchema: {type: 'object', properties: {
      countries: {type: 'array', items: {type: 'string'}, maxItems: 30, description: 'Country names or ISO3 codes, e.g. ["Colombia", "SSD"].'},
      indicators: {type: 'array', items: {type: 'string', enum: Object.keys(GENDER_INDICATORS)}, maxItems: 8, description: 'Default: gii, pr_f, lfpr_f.'},
      year_from: {type: 'integer', minimum: 1990, maximum: 2023}, year_to: {type: 'integer', minimum: 1990, maximum: 2023},
    }, required: ['countries']},
    run: args => {
      const countries = Array.isArray(args.countries) ? args.countries.map(String).filter(Boolean) : str(args.countries) ? [str(args.countries)!] : [];
      if (!countries.length) return fail('Give at least one country name or ISO3 code.');
      const indicators = Array.isArray(args.indicators) ? args.indicators.map(String) : undefined;
      return ok(genderIndicators({countries, indicators, year_from: num(args.year_from), year_to: num(args.year_to)}));
    },
  },
  {
    name: 'project_findings', title: 'Project findings',
    description: 'Summarize what each part of the project found, with key numbers and caveats: part "1" (PA-X: what kinds of agreements mention women), "2a" (PADD: does women’s role matter), "2b" (CFR: women negotiators by agreement type), "original" (the original prediction question), "3" (planned). Omit part for all.',
    inputSchema: {type: 'object', properties: {part: {type: 'string', enum: ['1', '2a', '2b', 'original', '3']}}},
    run: args => {const p = str(args.part); return p ? (FINDINGS[p] ? ok(FINDINGS[p]) : fail('part must be 1, 2a, 2b, original or 3')) : ok({parts: Object.values(FINDINGS)});},
  },
  {
    name: 'official_data_sources', title: 'Official public data sources',
    description: 'List official public data sources (UN, academic) that cover things this project’s data does not, with links and what each covers. Use when a question can’t be answered from the project’s data, to suggest where the answer could be found and what could be added to the project.',
    inputSchema: {type: 'object', properties: {}},
    run: () => ok({sources: OFFICIAL_SOURCES, note: 'Links checked 22 Nov 2026. These are not part of this project’s data yet; any of them could be added.'}),
  },
  {
    name: 'data_issues', title: 'Known data issues',
    description: 'List known data issues and limitations from the project log, optionally filtered by dataset (PA-X, PADD, CFR) or status (Resolved, Handled, Limitation, Open).',
    inputSchema: {type: 'object', properties: {dataset: {type: 'string', enum: ['PA-X', 'PADD', 'CFR']}, status: {type: 'string', enum: ['Resolved', 'Handled', 'Limitation', 'Open']}}},
    run: args => {
      const ds = str(args.dataset) as Dataset|undefined, st = str(args.status) as IssueStatus|undefined;
      const list = issues.filter(i => (!ds || i.dataset === ds) && (!st || i.status === st));
      return ok({count: list.length, issues: list, log: `${SITE}/project-log#issues`});
    },
  },
];

export const SERVER_INSTRUCTIONS = 'Read-only data on 2,257 peace agreements (PA-X v10, 1990–2025) and whether they include provisions on women, girls or gender, plus women at the negotiating table from PADD (116 comprehensive agreements) and the CFR tracker (47 agreements). Use search/fetch for specific agreements, gender_provision_rates for shares by group, women_at_the_table for negotiator and signatory data, country_gender_indicators for country context from the UNDP HDR (GII, women in parliament, labour force, education, maternal mortality; 1990-2023), project_findings for the project’s conclusions, and data_issues for limitations. Shares are raw unless a finding says otherwise; cite the url fields.';
