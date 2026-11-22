import Link from 'next/link';
import DatasetTabs from '../../components/DatasetTabs';
import {navigationCountries} from '../../lib/navigation';
import {decisions, issues, lastUpdated, projectPlan, questionSets, sources, updates, type Dataset} from '../../lib/project-log';
export const metadata={title:'Project log · GE / UN Data',description:'Research questions under consideration, data sources, data issues and decisions for the peace agreements project.'};
const DATASETS:Dataset[]=['PA-X','PADD','CFR'];
const long=(d:string)=>new Date(d+'T12:00:00Z').toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'});
export default async function Page({searchParams}:{searchParams:Promise<{countries?:string|string[]}>}){
 const params=await searchParams;const selected=navigationCountries(params.countries);
 const counts=issues.reduce<Record<string,number>>((c,i)=>(c[i.status]=(c[i.status]??0)+1,c),{});
 return <><header><Link className="brand" href="/">GE<span> / UN DATA</span></Link><span>PROJECT LOG</span></header><main className="project-log"><DatasetTabs active="/peace-agreements" countries={selected}/>
  <div className="eyebrow">PEACE AGREEMENTS PROJECT · WORKING NOTES</div>
  <h1>Project log.</h1>
  <p className="intro">Questions being considered, the datasets behind each part, every data issue found so far and how it was handled, and the decisions made along the way. Parts <Link href="/peace-agreements#part-1">1</Link>, <Link href="/peace-agreements#part-2a">2a</Link> and <Link href="/peace-agreements#part-2b">2b</Link> are live; part 3 is next.</p>
  <p className="project-updated">Last updated {long(lastUpdated)} · <Link href="/peace-agreements">← Back to the Peace agreements project</Link></p>
  <nav className="log-jump" aria-label="On this page"><a href="#updates">Updates ({updates.length})</a><a href="#plan">Plan</a><a href="#questions">Questions</a><a href="#sources">Data sources</a><a href="#issues">Issues ({issues.length})</a><a href="#decisions">Decisions</a></nav>

  <section id="updates" aria-labelledby="updates-h"><h2 id="updates-h">Update history</h2>
   <ol className="log-updates">{updates.map(u=><li key={u.date+u.title}><time dateTime={u.date}>{long(u.date)}</time><div><strong>{u.title}</strong><p>{u.detail}</p></div></li>)}</ol>
  </section>

  <section id="plan" aria-labelledby="plan-h"><h2 id="plan-h">Plan</h2>
   <div className="log-table"><table><thead><tr><th>Part</th><th>Data</th><th>Question</th><th>Status</th></tr></thead><tbody>
    {projectPlan.map(p=><tr key={p.part}><td><strong>{p.part}</strong></td><td>{p.data}</td><td>{p.question}</td><td>{p.status}</td></tr>)}
   </tbody></table></div>
  </section>

  <section id="questions" aria-labelledby="questions-h"><h2 id="questions-h">Questions under consideration</h2>
   <div className="log-questions">{questionSets.map(set=><article className="topic-card" key={set.part}>
    <div className="eyebrow">{set.part.toUpperCase()} · {set.data} · {set.status.toUpperCase()}</div>
    <p className="log-strength"><strong>What’s special about this data:</strong> {set.strength}</p>
    <ol className="log-options">{set.options.map(o=><li key={o.title} className={o.recommended?'is-recommended':''}>
     <strong>“{o.title}”</strong>{o.recommended&&<span className="log-pill log-pill-rec">Recommended</span>}<p>{o.detail}</p></li>)}</ol>
   </article>)}</div>
  </section>

  <section id="sources" aria-labelledby="sources-h"><h2 id="sources-h">Data sources</h2>
   <div className="log-table"><table><thead><tr><th>Dataset</th><th>Unit</th><th>Size</th><th>Access</th><th>Joins to PA-X by</th></tr></thead><tbody>
    {sources.map(s=><tr key={s.name}><td><strong>{s.name}</strong><br/><small>{s.publisher}</small></td><td>{s.unit}</td><td>{s.size}</td><td>{s.access}</td><td>{s.join}</td></tr>)}
   </tbody></table></div>
  </section>

  <section id="issues" aria-labelledby="issues-h"><h2 id="issues-h">Data issues</h2>
   <p className="log-summary">{issues.length} logged · {Object.entries(counts).map(([k,v])=><span key={k} className={`log-pill log-pill-${k.toLowerCase()}`}>{v} {k}</span>)}</p>
   <p className="project-note">Resolved: fixed, no effect on results. Handled: dealt with in the analysis. Limitation: can’t be fixed; stated on the slides. Open: still to do.</p>
   {DATASETS.map(ds=><div key={ds} className="log-group"><h3>{ds}</h3><div className="log-table"><table><thead><tr><th>ID</th><th>Issue</th><th>Why it matters</th><th>How it’s handled</th><th>Status</th></tr></thead><tbody>
    {issues.filter(i=>i.dataset===ds).map(i=><tr key={i.id} id={i.id}><td><code>{i.id}</code><br/><small>{i.date}</small></td><td><strong>{i.issue}</strong></td><td>{i.impact}</td><td>{i.handling}</td><td><span className={`log-pill log-pill-${i.status.toLowerCase()}`}>{i.status}</span></td></tr>)}
   </tbody></table></div></div>)}
  </section>

  <section id="decisions" aria-labelledby="decisions-h"><h2 id="decisions-h">Decisions</h2>
   <div className="log-table"><table><thead><tr><th>Date</th><th>Decision</th><th>Why</th></tr></thead><tbody>
    {decisions.map(d=><tr key={d.decision}><td><small>{d.date}</small></td><td>{d.decision}</td><td>{d.why}</td></tr>)}
   </tbody></table></div>
  </section>

  <footer><p>Last updated {long(lastUpdated)}. Entries live in lib/project-log.ts.<br/><Link href="/peace-agreements">← Peace agreements project</Link></p><p>Independent explorer.<br/>Not affiliated with the data publishers.</p></footer>
 </main></>;
}
