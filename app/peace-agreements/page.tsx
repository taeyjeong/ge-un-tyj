import Link from 'next/link';
import DatasetTabs from '../../components/DatasetTabs';
import {navigationCountries} from '../../lib/navigation';
export const metadata={title:'Peace agreements · GE / UN Data',description:'Which peace agreements mention women? A decision tree, random forest and gradient boosting analysis of 2,257 agreements in the PA-X Peace Agreements Database.'};
const SLIDES='/peace-agreements/gender-provisions-in-peace-agreements.html',CSV='/peace-agreements/gender-provisions-in-peace-agreements.csv',NOTEBOOK='/peace-agreements/gender-provisions-in-peace-agreements.ipynb';
export default async function Page({searchParams}:{searchParams:Promise<{countries?:string|string[]}>}){
 const params=await searchParams;const selected=navigationCountries(params.countries);
 return <><header><Link className="brand" href="/">GE<span> / UN DATA</span></Link><span>PEACE AGREEMENTS</span></header><main><DatasetTabs active="/peace-agreements" countries={selected}/>
  <div className="eyebrow">PA-X PEACE AGREEMENTS DATABASE · V10</div>
  <h1>Which peace agreements mention women?</h1>
  <p className="intro">A data science project on 2,257 peace agreements signed from 1990 to 2025. Decision trees, a random forest and gradient boosting predict whether an agreement includes provisions on women, girls or gender from when and where it was signed, the stage of the peace process, the type of conflict and who signed it.</p>
  <div className="project-actions"><a className="button" href={SLIDES} target="_blank" rel="noopener">Open slides full screen ↗</a><a className="button secondary" href={NOTEBOOK} download>Download the notebook (.ipynb)</a><a className="button secondary" href={CSV} download>Download the data (CSV, 3.6 MB)</a></div>
  <div className="project-slides"><iframe src={SLIDES} title="Which peace agreements mention women? Slides" loading="lazy"/></div>
  <p className="project-note">Click the slides, then use ← → to move between them. Slide 7 has the full interactive decision tree: drag to move around and hold Ctrl while scrolling to zoom. Every slide also has a link to download the notebook; put it in the same folder as the CSV to run it.</p>
  <footer><p>Data: PA-X Peace Agreements Database, Version 10, University of Edinburgh (peaceagreements.org).</p><p>Independent explorer.<br/>Not affiliated with the data publishers.</p></footer>
 </main></>;
}
