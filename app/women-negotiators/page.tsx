import Link from 'next/link';
import DatasetTabs from '../../components/DatasetTabs';
import {navigationCountries} from '../../lib/navigation';
export const metadata={title:'Women negotiators · GE / UN Data',description:'Does the link between women negotiators and gender provisions depend on the type of peace agreement? The CFR Women’s Participation in Peace Processes tracker joined with the PA-X Peace Agreements Database.'};
const B='/peace-agreements/',SLIDES=B+'women-negotiators-and-gender-provisions.html',JOINED=B+'women-negotiators-and-gender-provisions.csv',CFR=B+'cfr-womens-participation-73-processes.csv',MATCH=B+'cfr-to-pax-match.csv',NOTEBOOK=B+'women-negotiators-and-gender-provisions.ipynb',PAGES=B+'cfr-pages-collected.html';
export default async function Page({searchParams}:{searchParams:Promise<{countries?:string|string[]}>}){
 const params=await searchParams;const selected=navigationCountries(params.countries);
 return <><header><Link className="brand" href="/">GE<span> / UN DATA</span></Link><span>WOMEN NEGOTIATORS</span></header><main><DatasetTabs active="/women-negotiators" countries={selected}/>
  <div className="eyebrow">PART 2B · CFR TRACKER + PA-X PEACE AGREEMENTS</div>
  <h1>Does the link between women negotiators and gender provisions depend on the type of agreement?</h1>
  <p className="intro">An extension of the <Link href="/peace-agreements">peace agreements project</Link> and a companion to <Link href="/women-signatories">part 2a</Link>. The Council on Foreign Relations records women’s share of negotiators in 73 major peace processes across all stages; PA-X records which agreements mention women. In the 33 agreements covered by both, women’s share of negotiators showed no clear link to gender provisions in comprehensive deals or in shorter ones; the type of deal itself did.</p>
  <div className="project-actions"><a className="button" href={SLIDES} target="_blank" rel="noopener">Open slides full screen ↗</a><a className="button secondary" href={NOTEBOOK} download>Download the notebook (.ipynb)</a><a className="button secondary" href={JOINED} download>Joined data (CSV, 33 agreements)</a><a className="button secondary" href={CFR} download>CFR tracker data (CSV, 73 processes)</a><a className="button secondary" href={MATCH} download>CFR → PA-X matches (CSV)</a><a className="button secondary" href={PAGES} target="_blank" rel="noopener">All 73 CFR pages collected ↗</a></div>
  <div className="project-slides"><iframe src={SLIDES} title="Does the link between women negotiators and gender provisions depend on the type of agreement? Slides" loading="lazy"/></div>
  <p className="project-note">Click the slides, then use ← → to move between them. The CFR tracker has no download; its 73 process pages were read on 22 Nov 2026. The “All 73 CFR pages collected” list links to every page and shows how each was used. Known data issues are in the <Link href="/project-log#issues">project log</Link>.</p>
  <footer><p>Data: Council on Foreign Relations, Women’s Participation in Peace Processes (cfr.org) · PA-X Peace Agreements Database, Version 10, University of Edinburgh (peaceagreements.org).</p><p>Independent explorer.<br/>Not affiliated with the data publishers.</p></footer>
 </main></>;
}
