// Running log for the peace agreements project: open research questions, data sources,
// data issues found along the way, and decisions made. Edit this file to add entries.

export type Dataset = 'PA-X' | 'PADD' | 'CFR' | 'Project';
export type IssueStatus = 'Resolved' | 'Handled' | 'Limitation' | 'Open';

export interface QuestionOption {title: string; detail: string; recommended?: boolean}
export interface QuestionSet {part: string; data: string; status: string; strength: string; options: QuestionOption[]}
export interface Issue {id: string; date: string; dataset: Dataset; issue: string; impact: string; handling: string; status: IssueStatus}
export interface Source {name: string; publisher: string; unit: string; size: string; access: string; join: string}
export interface Decision {date: string; decision: string; why: string}

export interface Update {date: string; title: string; detail: string}

// Dated history of the project, newest first. lastUpdated follows the newest entry.
export const updates: Update[] = [
  {date: '2026-11-22', title: 'Chat: maximize, PDF downloads, and UNDP gender data', detail: 'Ask the data can be maximized to a large window, and any conversation can be downloaded as a PDF from the chat or from your saved history. On the Questions asked page you can download one answer or every question shown. The AI can now also look up country gender indicators from the UNDP Human Development Report 2025 (GII, women in parliament, labour force participation, education, maternal mortality and more, 1990–2023), so it can put an agreement’s country in context. A “How to use the AI” section on this page lists example questions and the sources the AI uses.'},
  {date: '2026-11-22', title: 'Peace data in SQL (Supabase), queried by the AI', detail: 'The PA-X, PADD and CFR CSVs are now also loaded into Supabase tables (pax_agreements, padd_agreements, padd_delegates, cfr_processes, and a joined view women_at_the_table) by scripts/load_peace_data.py. Ask the data gained a read-only SQL tool, so it can answer questions the fixed tools couldn’t, such as counts for one region and decade, or the names of women signatories. The CSVs stay as the source and as downloads.'},
  {date: '2026-11-22', title: 'Data-driven default countries; OECD selection; 60-country limit', detail: 'Each section now opens with its own three countries instead of Japan, Korea and the USA: the country with the biggest change plus the two worst today, from different UN sub-regions and with at least 1 million people (scripts/compute_default_countries.py). The country picker has a Select all OECD (38) button, and the live-data pages accept up to 60 countries.'},
  {date: '2026-11-22', title: 'One Peace agreements page; public chat moved into the notebook', detail: 'Parts 1, 2a and 2b now sit in order on a single Peace agreements page, with this log linked from it. The public chat moved into the bottom-left panel (shown to everyone not signed in; a tab for signed-in users). The bottom-right button is now Ask the data only, with each visitor’s own history saved in their browser. Every question and answer is listed publicly on the Questions asked page (no visitor IDs shown).'},
  {date: '2026-11-22', title: 'Ask-the-data log and honest “data not sufficient” answers', detail: 'Every AI question and answer is logged to Supabase (ask_data_log), including the data gap when the data can’t answer. The assistant now says so plainly and points to checked official sources that could be added.'},
  {date: '2026-11-22', title: 'AI chat and MCP server', detail: 'Added the “Ask the data” chat (Claude, using the project’s data as tools) and a read-only MCP server at /api/mcp for clients such as ChatGPT.'},
  {date: '2026-11-22', title: 'Parts 2a and 2b published', detail: 'Part 2a (PA-X + PADD): a woman signatory is linked to about 3× the odds of gender provisions in comprehensive agreements. Part 2b (PA-X + CFR): no clear link between women negotiators and gender provisions in either agreement type. All 73 CFR pages were collected and matched to PA-X. This project log was started.'},
  {date: '2026-11-22', title: 'Part 1 published on the site', detail: 'Part 1 slides, notebook and PA-X CSV added to the site, with a notebook download on every slide.'},
  {date: '2026-11-21', title: 'Part 1 slides and interactive decision tree', detail: '17 slides, including the full 121-node decision tree with drag-to-move and Ctrl+scroll zoom.'},
  {date: '2026-11-20', title: 'Part 1 analysis', detail: 'PA-X v10 (2,257 agreements) analyzed in a Jupyter notebook: decision tree, random forest and gradient boosting; feature importance; deep dives on stage, region, conflict type and signers.'},
];
export const lastUpdated = updates[0].date;

export const projectPlan = [
  {part: 'Part 1', data: 'PA-X', question: 'What kinds of peace agreements mention women?', status: 'Done · live (20–22 Nov 2026)'},
  {part: 'Part 2a', data: 'PA-X + PADD', question: 'In comprehensive peace agreements, does it matter what role women hold?', status: 'Done · live (22 Nov 2026)'},
  {part: 'Part 2b', data: 'PA-X + CFR', question: 'Does the link between women negotiators and gender provisions depend on the type of agreement?', status: 'Done · live (22 Nov 2026)'},
  {part: 'Part 3', data: 'PA-X + PADD + CFR', question: 'Do both measures of women at the table agree, and does the answer hold when combined?', status: 'Not started · exploratory patterns noted 22 Nov 2026'},
];

export const questionSets: QuestionSet[] = [
  {
    part: 'Part 2a', data: 'PA-X + PADD', status: 'Chosen: option 1',
    strength: 'Every named person in 116 comprehensive agreements, with their role (signatory, negotiator, mediator, observer, adviser). Covers only comprehensive deals, so stage can’t be compared.',
    options: [
      {recommended: true, title: 'In comprehensive peace agreements, does it matter what role women hold?', detail: 'Are gender provisions more likely when women are signatories, the people with decision power, than when they’re only present as observers or advisers? Uses PADD’s main strength and ties directly to its paper’s “power over presence” finding.'},
      {title: 'In comprehensive agreements, does the share of women among named delegates predict gender provisions?', detail: 'The same question as the CFR draft, only on a different sample.'},
      {title: 'Has women’s presence among delegates grown since UN Resolution 1325 (2000)?', detail: 'A trend question. The outcome is women’s share itself, with PA-X supplying dates and context.'},
    ],
  },
  {
    part: 'Part 2b', data: 'PA-X + CFR', status: 'Chosen: option 1',
    strength: 'Women’s share of negotiators from outside records, across all stages (ceasefires to comprehensive deals), plus women in each country’s parliament.',
    options: [
      {recommended: true, title: 'Does the link between women negotiators and gender provisions depend on the type of agreement?', detail: 'In short deals (ceasefires, pre-negotiation) vs. comprehensive deals, do women negotiators make a difference in either? Uses the stage variety PADD lacks and builds on part 1’s finding that stage matters most. Only 17 non-comprehensive agreements have a negotiator figure, so this would be exploratory.'},
      {title: 'Do agreements with more women negotiators include more gender provisions?', detail: 'The current draft, as is.'},
      {title: 'Do countries with more women in parliament send more women to the negotiating table?', detail: 'Women in parliament → women negotiators, with PA-X adding stage and year.'},
    ],
  },
];

export const sources: Source[] = [
  {name: 'PA-X Peace Agreements Database, v10', publisher: 'PeaceRep, University of Edinburgh', unit: 'One row per agreement', size: '2,257 agreements, 1990–2025, 279 columns', access: 'Public CSV download', join: 'AgtId (its own ID)'},
  {name: 'PADD: Peace Agreement Delegate Dataset 1.0', publisher: 'Elizabeth Good, American Political Science Review (2025)', unit: 'Agreement file: one row per agreement. Delegate file: one row per named person', size: '116 comprehensive agreements (1990–2020); 2,301 delegate rows', access: 'Public CSV download, Harvard Dataverse, CC0 license (PDFs are only the codebook and README)', join: 'AgtId, the same ID as PA-X'},
  {name: 'Women’s Participation in Peace Processes', publisher: 'Council on Foreign Relations', unit: 'One web page per process or agreement', size: '73 pages; 47 matched to PA-X agreements; 33 with a negotiator figure', access: 'No download. Read from the 73 pages on 22 Nov 2026 into a CSV that keeps each page’s link', join: 'By hand: country + agreement name → PA-X AgtId'},
];

export const issues: Issue[] = [
  // PA-X
  {id: 'PAX-1', date: '2026-11-22', dataset: 'PA-X', issue: 'The CSV has 2,257 rows but 31,203 lines.', impact: 'Counting lines (e.g. wc -l, or a commit’s “lines added”) overstates the data 14×. Text cells in Part, ThrdPart and OthAgr contain 28,945 line breaks.', handling: 'Always read with pandas read_csv, which gives 2,257 rows and 2,257 unique AgtIds.', status: 'Resolved'},
  {id: 'PAX-2', date: '2026-11-22', dataset: 'PA-X', issue: 'The signatory column (Part) lists organizations, not people.', impact: 'PA-X alone can’t say whether any woman negotiated or signed. No dataset codes delegate gender for the 2,133 non-comprehensive agreements.', handling: 'Use PADD (comprehensive) and CFR (all stages, 47 agreements). Coding a sample of non-comprehensive agreements from their texts is a possible extension.', status: 'Limitation'},
  {id: 'PAX-3', date: '2026-11-20', dataset: 'PA-X', issue: 'Agreements from the same peace process can land in both the training and test sets.', impact: 'Test scores in part 1 are slightly optimistic.', handling: 'Stated in part 1’s limitations. GroupKFold by peace process (PP) would be stricter.', status: 'Open'},
  {id: 'PAX-4', date: '2026-11-20', dataset: 'PA-X', issue: 'Some categories have no agreements that mention women (Stage “Oth”, Contp “Other”, Agtp “Inter”).', impact: 'Logistic regression can’t estimate them (perfect separation) and gives convergence warnings.', handling: 'Those few rows are left out of the regressions only.', status: 'Handled'},
  {id: 'PAX-5', date: '2026-11-20', dataset: 'PA-X', issue: 'Afghanistan is coded in the Europe and Eurasia region.', impact: 'Afghanistan’s high share (59%) raises that region’s average.', handling: 'Noted on the part 1 slides.', status: 'Limitation'},
  {id: 'PAX-6', date: '2026-11-20', dataset: 'PA-X', issue: 'Only two country-code slots per agreement; 40 agreements have none.', impact: 'Multi-country agreements are missing from country counts; two-country agreements count twice.', handling: 'Country tables count each agreement under both codes and say so.', status: 'Limitation'},
  // PADD
  {id: 'PADD-1', date: '2026-11-22', dataset: 'PADD', issue: 'Gender is assumed, not self-reported.', impact: 'Names go through Gender API; if confidence ≤ 75 or names disagree, the author hand-checked social media, profiles and news. About 481 of 2,071 named people needed a hand check; in 60 cases the final answer differs from the software’s first-name guess. 309 people (13%) remain unknown.', handling: 'Method slide added to part 2a. Robustness check with only the ~1,590 software-confident people: the gap widens (93% vs. 52% mention women), so uncertain coding isn’t creating the result.', status: 'Handled'},
  {id: 'PADD-2', date: '2026-11-22', dataset: 'PADD', issue: 'Comprehensive agreements only.', impact: 'Stage, the strongest predictor in part 1, can’t be compared within PADD.', handling: 'Part 2a states its scope (comprehensive agreements, 1990–2020). Part 2b (CFR) covers other stages.', status: 'Limitation'},
  {id: 'PADD-3', date: '2026-11-22', dataset: 'PADD', issue: '3 of PA-X’s 119 comprehensive agreements from 1990–2020 are not in PADD.', impact: 'Ghana Kumasi Accord (AgtId 2487), Sudan 2019 Constitutional Charter (2683), South Sudan Pakam–Rup resolutions (2679). Their high IDs show PA-X added them after PADD was published.', handling: 'Keep all 119 rows; mark these 3 as “not in PADD” instead of dropping them.', status: 'Handled'},
  {id: 'PADD-4', date: '2026-11-22', dataset: 'PADD', issue: 'Blank values inside PADD.', impact: '% women delegates is blank for 8 agreements, % women signatories for 13. % women negotiators exists for only 18, because many texts don’t label anyone a negotiator.', handling: 'Show as “PADD: no data”. Use delegates and signatories as the main measures, not negotiators.', status: 'Handled'},
  {id: 'PADD-5', date: '2026-11-22', dataset: 'PADD', issue: 'Only people named in the agreement text are counted.', impact: 'Women who were in a delegation but aren’t listed in the signed document are invisible.', handling: 'State it on the slides; compare with CFR, which uses outside records, on the 19 agreements in both.', status: 'Limitation'},
  {id: 'PADD-6', date: '2026-11-22', dataset: 'PADD', issue: 'PADD ships its own GeWom, likely from an older PA-X version.', impact: 'Could differ from the PA-X v10 outcome used in part 1.', handling: 'Join on AgtId and use PA-X v10’s GeWom for every part.', status: 'Handled'},
  {id: 'PADD-7', date: '2026-11-22', dataset: 'PADD', issue: 'Delegate file has 2,301 rows; the paper reports 2,299 delegates.', impact: '230 rows have no name (a position only, or a placeholder for agreements naming no one).', handling: 'Use the 116-row agreement file for analysis; treat delegate rows as people only when a name is present.', status: 'Handled'},
  // CFR
  {id: 'CFR-1', date: '2026-11-22', dataset: 'CFR', issue: 'No download, API or hidden data file.', impact: 'The data exists only as text on 73 web pages.', handling: 'All 73 pages share one template; each was read into cfr_womens_participation_raw.csv on 22 Nov 2026, keeping the page URL so any row can be checked.', status: 'Handled'},
  {id: 'CFR-2', date: '2026-11-22', dataset: 'CFR', issue: 'List page and detail page disagree for 3 processes.', impact: 'Yemen-4 (list 4%, page “No Data”), Zimbabwe (list none, page 17%), Côte d’Ivoire (list 0%, page “No Data”).', handling: 'Detail page used; disagreement noted in the data (list_page_negotiators column).', status: 'Handled'},
  {id: 'CFR-3', date: '2026-11-22', dataset: 'CFR', issue: 'No signing year on the pages.', impact: 'Year can’t be read from CFR directly.', handling: 'Taken from the matched PA-X agreement.', status: 'Resolved'},
  {id: 'CFR-4', date: '2026-11-22', dataset: 'CFR', issue: '22 entries are ongoing talks, not signed agreements.', impact: 'No agreement text, so no gender-provision outcome.', handling: 'Excluded from the analysis (51 signed agreements remain).', status: 'Handled'},
  {id: 'CFR-5', date: '2026-11-22', dataset: 'CFR', issue: 'Three agreements appear twice.', impact: 'South Sudan R-ARCSS, the Yemen GCC implementation mechanism and the Djibouti Agreement would be double-counted.', handling: 'Duplicates dropped after matching (47 unique agreements).', status: 'Resolved'},
  {id: 'CFR-6', date: '2026-11-22', dataset: 'CFR', issue: 'Some names don’t match PA-X automatically.', impact: 'Mali (Bamako Agreement = Accord pour la Paix et la Réconciliation) and two Central African Republic agreements needed manual lookup; the June 2020 Yemen ceasefire isn’t in PA-X at all.', handling: 'Matched by hand and saved in cfr_to_pax_match.csv; Yemen 2020 left unmatched.', status: 'Handled'},
  {id: 'CFR-7', date: '2026-11-22', dataset: 'CFR', issue: 'CFR’s “Women, Girls, and Gender” checkbox is copied from PA-X.', impact: 'Using it as a feature would leak the answer (it is the label).', handling: 'Never used as a feature. Used only to validate the matching: it agrees with PA-X’s GeWom for 46 of 47 agreements.', status: 'Handled'},
  {id: 'CFR-8', date: '2026-11-22', dataset: 'CFR', issue: 'Small sample: 33 agreements with a negotiator figure.', impact: 'The negotiator effect’s interval is wide (odds ratio 0.5–3 per +10 points); a moderate effect can’t be ruled out.', handling: 'Simple comparisons and logistic regression instead of forests; stated on the slides.', status: 'Limitation'},
  {id: 'CFR-9', date: '2026-11-22', dataset: 'CFR', issue: 'Measures presence, not influence.', impact: 'Counting women in delegations doesn’t show whether they shaped the text; all four cells of the 2×2 occur.', handling: 'Stated on the slides. PADD’s role data (part 2a) is one way to get closer to influence.', status: 'Limitation'},
  {id: 'CFR-11', date: '2026-11-22', dataset: 'CFR', issue: 'Comprehensive agreements sit at a ceiling: 15 of 16 mention women.', impact: 'Within comprehensive deals there is almost no variation left for negotiators to explain, so the by-type comparison rests on the 17 other agreements.', handling: 'Part 2b presents the by-type result as exploratory; part 2a (PADD) covers comprehensive deals with many more rows.', status: 'Limitation'},
  {id: 'CFR-10', date: '2026-11-22', dataset: 'CFR', issue: 'Parliament year field sometimes holds a country name.', impact: 'For multi-country processes (e.g. Armenia–Azerbaijan) the page shows one bar per country.', handling: 'Parliament % used only as a side comparison; year not used.', status: 'Limitation'},
];

export const decisions: Decision[] = [
  {date: '2026-11-22', decision: 'Hybrid storage: CSVs stay the source and downloads; Supabase holds a copy for SQL.', why: 'Notebooks and downloads keep working unchanged, and the AI gets flexible queries. The tables have no public access; the AI’s SQL runs through one function as a read-only role (one SELECT, 200 rows, 5 s).'},
  {date: '2026-11-21', decision: 'Website file names describe the project, not the author (gender-provisions-in-peace-agreements.*).', why: 'Clearer public links; the coursework copies keep the JeongTae- prefix.'},
  {date: '2026-11-22', decision: 'Part 1 committed and deployed alone; part 2 kept local.', why: 'Part 2 is still being designed.'},
  {date: '2026-11-22', decision: 'One dataset per part added: 1 = PA-X, 2 = PA-X + one more, 3 = all three.', why: 'Each part answers something the previous one couldn’t.'},
  {date: '2026-11-22', decision: 'PADD chosen as the main source for women at the table.', why: 'Clean join on AgtId, about 108 usable agreements, a published downloadable dataset rather than scraped pages.'},
  {date: '2026-11-22', decision: 'Split part 2 into 2a (PA-X + PADD) and 2b (PA-X + CFR), each with its own question.', why: 'The two sources measure different things: named people and roles vs. negotiator shares across all stages.'},
  {date: '2026-11-22', decision: 'Part 2a question: does women’s role matter in comprehensive agreements? Part 2b question: does the women-negotiator link depend on agreement type?', why: 'The recommended option for each: they use what is unique to PADD (roles) and to CFR (all stages).'},
  {date: '2026-11-22', decision: 'All 73 CFR pages listed with links and their status in the analysis (cfr-pages-collected.html).', why: 'Anyone can check every scraped value against its source page.'},
  {date: '2026-11-22', decision: 'The project is available as a read-only MCP server at /api/mcp (7 tools: search, fetch, find_agreements, gender_provision_rates, women_at_the_table, project_findings, data_issues).', why: 'So ChatGPT and other MCP clients can query the PA-X, PADD and CFR data and the findings directly. Rebuild its data with scripts/build_peace_mcp_data.py when the CSVs change.'},
  {date: '2026-11-22', decision: 'The site chat has an “Ask the data” tab: Claude (Opus 5.5) answers questions using the same tools as the MCP server, via /api/ask.', why: 'Visitors can ask about the data in plain language; answers come from the project’s data and findings, not the model’s memory. Limited to 20 questions per visitor per 10 minutes.'},
  {date: '2026-11-22', decision: 'Ask-the-data questions and answers are logged and shown publicly on the Questions asked page (/ask-history), without visitor IDs; each visitor’s own conversations are also kept in their browser.', why: 'Anyone can see what people ask and where the data falls short, which shows what data to add next. The chat tells visitors their questions are public and not to include personal details.'},
  {date: '2026-11-22', decision: 'Every slide links to its Jupyter notebook.', why: 'Anyone viewing a slide can download the code and data behind it.'},
];

// "How to use the AI" guide shown on the project log. Keep in step with docs/ai-data.md.
export interface AskExample {question: string; uses: string}
export const askGuide = {
  steps: [
    'Click “Ask the data” at the bottom right of any page. Use ⤢ to open a larger window.',
    'Type a question in plain English and press Enter. Answers take 10–30 seconds while the AI looks through the data.',
    'Ask follow-up questions in the same conversation. “New” starts over; “History” reopens your past conversations (kept in this browser only).',
    'Use “↓ PDF” to download a conversation. Every question and answer is also public on the Questions asked page, where each one can be downloaded too.',
  ],
  tips: [
    'Be specific about place, years and agreement type, e.g. “ceasefires in Africa since 2010”.',
    'Name the agreement or country when you can; the AI links each agreement to its PA-X page.',
    'Every number comes from the data below. If the data can’t answer, the answer is marked “Partly answered” or “Data not sufficient” and suggests where the data could be found.',
    'Don’t include personal details: questions are published. The AI can make mistakes, so check the linked sources.',
  ],
  examples: [
    {question: 'Which kinds of peace agreements mention women most often?', uses: 'PA-X'},
    {question: 'How many agreements signed in Africa in the 2010s mention women?', uses: 'PA-X (SQL)'},
    {question: 'Did the share of agreements mentioning women change after UN Resolution 1325 (2000)?', uses: 'PA-X'},
    {question: 'Did women sign the 2016 Colombia peace agreement?', uses: 'PA-X, PADD, CFR'},
    {question: 'List the women mediators named in PADD.', uses: 'PADD (SQL)'},
    {question: 'Does it matter if a woman signs a comprehensive agreement?', uses: 'Project findings (part 2a)'},
    {question: 'What share of negotiators were women in the Philippines–MILF talks?', uses: 'CFR'},
    {question: 'What share of parliament did women hold in South Sudan when its 2018 agreement was signed?', uses: 'PA-X + UNDP HDR'},
    {question: 'Compare the Gender Inequality Index of countries with the most peace agreements.', uses: 'PA-X + UNDP HDR'},
    {question: 'What are the known problems with the PADD data?', uses: 'Data issues log'},
  ] as AskExample[],
  cannot: 'It can’t answer questions outside this data: the full text of provisions, whether agreements were carried out, battle deaths, agreements after 2025, or topics unrelated to peace agreements and women’s inclusion. For those it says the data isn’t sufficient and points to official sources such as UCDP, the Peace Accords Matrix or UN Women.',
  sources: [
    {name: 'PA-X Peace Agreements Database v10', publisher: 'PeaceRep, University of Edinburgh', covers: '2,257 agreements, 1990–2025, and whether each has provisions on women, girls or gender', url: 'https://www.peaceagreements.org/'},
    {name: 'PADD: Peace Agreement Delegate Dataset 1.0', publisher: 'Elizabeth Good, APSR 2025', covers: '2,301 people named in 116 comprehensive agreements (1990–2020), with role and gender assumed from names', url: 'https://doi.org/10.7910/DVN/MBMU7F'},
    {name: 'Women’s Participation in Peace Processes', publisher: 'Council on Foreign Relations', covers: 'Women’s share of negotiators, mediators and signatories in 73 processes (47 matched to PA-X)', url: 'https://www.cfr.org/womens-participation-in-peace-processes'},
    {name: 'Human Development Report 2025', publisher: 'UNDP', covers: 'Country gender indicators for 195 countries, 1990–2023: GII, GDI, women in parliament, labour force, education, maternal mortality', url: 'https://hdr.undp.org/data-center/documentation-and-downloads'},
    {name: 'This project’s findings and data issues', publisher: 'GE / UN Data', covers: 'Results of parts 1, 2a and 2b, and every known data problem (this page)', url: '/project-log#issues'},
  ],
  model: 'Answers come from Claude (Anthropic), which can only read the sources listed below, using fixed tools and read-only SQL queries on a copy of the PA-X, PADD and CFR data.',
};
