import Link from 'next/link';
import DatasetTabs from '../../components/DatasetTabs';
import {navigationCountries} from '../../lib/navigation';
import {lastUpdated} from '../../lib/project-log';
export const metadata={title:'Peace agreements · GE / UN Data',description:'Which peace agreements mention women, and does it matter who is at the table? A three-part data science project using the PA-X Peace Agreements Database, the Peace Agreement Delegate Dataset (PADD) and the CFR Women’s Participation in Peace Processes tracker.'};
const B='/peace-agreements/';
interface Part{id:string;label:string;data:string;question:string;intro:string;finding:string;slides:string;notebook:string;downloads:{href:string;label:string;external?:boolean}[];note?:string}
const PARTS:Part[]=[
 {id:'part-1',label:'Part 1',data:'PA-X',question:'Which peace agreements mention women?',
  intro:'2,257 peace agreements signed from 1990 to 2025. Decision trees, a random forest and gradient boosting predict whether an agreement includes provisions on women, girls or gender from when and where it was signed, the stage of the peace process, the type of conflict and who signed it.',
  finding:'The stage of the peace process matters most: 58.9% of comprehensive agreements mention women, compared with 10.8% of ceasefires. The year comes next, with a clear rise after UN Resolution 1325 (2000).',
  slides:B+'gender-provisions-in-peace-agreements.html',notebook:B+'gender-provisions-in-peace-agreements.ipynb',
  downloads:[{href:B+'gender-provisions-in-peace-agreements.csv',label:'PA-X data (CSV, 3.6 MB)'}],
  note:'Slide 7 has the full interactive decision tree: drag to move around and hold Ctrl while scrolling to zoom.'},
 {id:'part-2a',label:'Part 2a',data:'PA-X + PADD',question:'In comprehensive peace agreements, does it matter what role women hold?',
  intro:'The Peace Agreement Delegate Dataset (Good, American Political Science Review, 2025) names every person in 116 comprehensive agreements, with their role and coded gender. It joins PA-X exactly on the agreement ID.',
  finding:'When a woman signed, 80% of agreements mention women: about three times the odds of agreements naming no women. Women present without signing made no clear difference.',
  slides:B+'women-signatories-in-comprehensive-agreements.html',notebook:B+'women-signatories-in-comprehensive-agreements.ipynb',
  downloads:[{href:B+'women-signatories-in-comprehensive-agreements.csv',label:'Joined data (CSV, 119 agreements)'},{href:B+'padd-agreement-level.csv',label:'PADD agreements (CSV)'},{href:B+'padd-delegate-level.csv',label:'PADD delegates (CSV, 4 MB)'}]},
 {id:'part-2b',label:'Part 2b',data:'PA-X + CFR',question:'Does the link between women negotiators and gender provisions depend on the type of agreement?',
  intro:'The Council on Foreign Relations records women’s share of negotiators in 73 major peace processes across all stages. It has no download, so its 73 pages were read on 22 Nov 2026 and matched to PA-X by hand.',
  finding:'No clear link in either type. Women were about 11% of negotiators whether or not the agreement mentioned women; comprehensive deals nearly all mention women regardless.',
  slides:B+'women-negotiators-and-gender-provisions.html',notebook:B+'women-negotiators-and-gender-provisions.ipynb',
  downloads:[{href:B+'women-negotiators-and-gender-provisions.csv',label:'Joined data (CSV, 33 agreements)'},{href:B+'cfr-womens-participation-73-processes.csv',label:'CFR data (CSV, 73 processes)'},{href:B+'cfr-to-pax-match.csv',label:'CFR → PA-X matches (CSV)'},{href:B+'cfr-pages-collected.html',label:'All 73 CFR pages collected ↗',external:true}]},
];
const updated=new Date(lastUpdated+'T12:00:00Z').toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'});
export default async function Page({searchParams}:{searchParams:Promise<{countries?:string|string[]}>}){
 const params=await searchParams;const selected=navigationCountries(params.countries);
 return <><header><Link className="brand" href="/">GE<span> / UN DATA</span></Link><span>PEACE AGREEMENTS</span></header><main className="project-log"><DatasetTabs active="/peace-agreements" countries={selected}/>
  <div className="eyebrow">A THREE-PART DATA SCIENCE PROJECT · PA-X · PADD · CFR</div>
  <h1>Which peace agreements mention women, and does it matter who is at the table?</h1>
  <p className="intro">Each part adds one dataset and asks a question the previous part couldn’t. Every part has its slides, a Jupyter notebook to download, and its data.</p>
  <p className="project-updated">Last updated {updated} · <Link href="/project-log">Project log: questions, data issues & decisions →</Link> · <Link href="/ask-history">Questions people asked the AI →</Link></p>
  <nav className="log-jump" aria-label="Parts of the project">{PARTS.map(p=><a key={p.id} href={'#'+p.id}>{p.label} · {p.data}</a>)}</nav>
  {PARTS.map(p=><section key={p.id} id={p.id} className="project-part" aria-labelledby={p.id+'-h'}>
   <div className="eyebrow">{p.label.toUpperCase()} · {p.data}</div>
   <h2 id={p.id+'-h'}>{p.question}</h2>
   <p className="project-part-intro">{p.intro}</p>
   <p className="project-finding"><strong>Finding:</strong> {p.finding}</p>
   <div className="project-actions"><a className="button" href={p.slides} target="_blank" rel="noopener">Open slides full screen ↗</a><a className="button secondary" href={p.notebook} download>Download the notebook (.ipynb)</a>{p.downloads.map(d=>d.external?<a key={d.href} className="button secondary" href={d.href} target="_blank" rel="noopener">{d.label}</a>:<a key={d.href} className="button secondary" href={d.href} download>{d.label}</a>)}</div>
   <div className="project-slides"><iframe src={p.slides} title={`${p.label}: ${p.question} Slides`} loading="lazy"/></div>
   <p className="project-note">Click the slides, then use ← → to move between them. Every slide links to its notebook; put it in the same folder as the CSVs (including the part 1 PA-X CSV) to run it.{p.note?' '+p.note:''}</p>
  </section>)}
  <p className="project-updated" style={{marginTop:40}}><Link href="/project-log">Project log →</Link> Questions considered, data sources, every data issue found and how it was handled, and dated updates. Last updated {updated}.</p>
  <footer><p>Data: PA-X Peace Agreements Database, Version 10, University of Edinburgh (peaceagreements.org) · Peace Agreement Delegate Dataset 1.0, E. Good, Harvard Dataverse (doi:10.7910/DVN/MBMU7F), CC0 · Council on Foreign Relations, Women’s Participation in Peace Processes (cfr.org).</p><p>Independent explorer.<br/>Not affiliated with the data publishers.</p></footer>
 </main></>;
}
