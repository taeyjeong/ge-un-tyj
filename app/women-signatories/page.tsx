import Link from 'next/link';
import DatasetTabs from '../../components/DatasetTabs';
import {navigationCountries} from '../../lib/navigation';
export const metadata={title:'Women signatories · GE / UN Data',description:'In comprehensive peace agreements, does it matter what role women hold? The Peace Agreement Delegate Dataset (PADD) joined with the PA-X Peace Agreements Database.'};
const B='/peace-agreements/',SLIDES=B+'women-signatories-in-comprehensive-agreements.html',NOTEBOOK=B+'women-signatories-in-comprehensive-agreements.ipynb',JOINED=B+'women-signatories-in-comprehensive-agreements.csv',PADD_A=B+'padd-agreement-level.csv',PADD_D=B+'padd-delegate-level.csv';
export default async function Page({searchParams}:{searchParams:Promise<{countries?:string|string[]}>}){
 const params=await searchParams;const selected=navigationCountries(params.countries);
 return <><header><Link className="brand" href="/">GE<span> / UN DATA</span></Link><span>WOMEN SIGNATORIES</span></header><main><DatasetTabs active="/women-signatories" countries={selected}/>
  <div className="eyebrow">PART 2A · PADD + PA-X PEACE AGREEMENTS</div>
  <h1>In comprehensive peace agreements, does it matter what role women hold?</h1>
  <p className="intro">An extension of the <Link href="/peace-agreements">peace agreements project</Link>. The Peace Agreement Delegate Dataset (Good, <i>American Political Science Review</i>, 2025) names every person in 116 comprehensive agreements with their role and coded gender; PA-X records which agreements mention women. When a woman signed, 80% of agreements mention women, about three times the odds of agreements naming no women. Women present without signing made no clear difference.</p>
  <div className="project-actions"><a className="button" href={SLIDES} target="_blank" rel="noopener">Open slides full screen ↗</a><a className="button secondary" href={NOTEBOOK} download>Download the notebook (.ipynb)</a><a className="button secondary" href={JOINED} download>Joined data (CSV, 119 agreements)</a><a className="button secondary" href={PADD_A} download>PADD agreements (CSV)</a><a className="button secondary" href={PADD_D} download>PADD delegates (CSV, 4 MB)</a></div>
  <div className="project-slides"><iframe src={SLIDES} title="In comprehensive peace agreements, does it matter what role women hold? Slides" loading="lazy"/></div>
  <p className="project-note">Click the slides, then use ← → to move between them. Every slide links to the notebook; put it in the same folder as the CSVs (including the <Link href="/peace-agreements">part 1 PA-X CSV</Link>) to run it. Known data issues are listed in the <Link href="/project-log#issues">project log</Link>.</p>
  <footer><p>Data: Peace Agreement Delegate Dataset 1.0, E. Good, Harvard Dataverse (doi:10.7910/DVN/MBMU7F), CC0 · PA-X Peace Agreements Database, Version 10, University of Edinburgh (peaceagreements.org).</p><p>Independent explorer.<br/>Not affiliated with the data publishers.</p></footer>
 </main></>;
}
