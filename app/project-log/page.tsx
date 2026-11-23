import Link from 'next/link';
import DatasetTabs from '../../components/DatasetTabs';
import {navigationCountries} from '../../lib/navigation';
import {askGuide, decisions, issues, lastUpdated, projectPlan, questionSets, sources, updates, type Dataset} from '../../lib/project-log';
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
  <nav className="log-jump" aria-label="On this page"><a href="#updates">Updates ({updates.length})</a><a href="#ask-ai">Using the AI</a><a href="#plan">Plan</a><a href="#questions">Questions</a><a href="#sources">Data sources</a><a href="#issues">Issues ({issues.length})</a><a href="#decisions">Decisions</a></nav>

  <section id="updates" aria-labelledby="updates-h"><h2 id="updates-h">Update history</h2>
   <ol className="log-updates">{updates.map(u=><li key={u.date+u.title}><time dateTime={u.date}>{long(u.date)}</time><div><strong>{u.title}</strong><p>{u.detail}</p></div></li>)}</ol>
  </section>

  <section id="ask-ai" aria-labelledby="ask-ai-h"><h2 id="ask-ai-h">How to use the AI (Ask the data)</h2>
   <p className="project-note">{askGuide.model} <Link href="/ask-history">See every question asked →</Link></p>
   <div className="log-ask">
    <article className="topic-card"><div className="eyebrow">HOW TO ASK</div><ol className="log-steps">{askGuide.steps.map(s=><li key={s}>{s}</li>)}</ol>
     <div className="eyebrow" style={{marginTop:16}}>TIPS</div><ul className="log-steps">{askGuide.tips.map(s=><li key={s}>{s}</li>)}</ul></article>
    <article className="topic-card"><div className="eyebrow">QUESTIONS YOU CAN ASK</div><ul className="log-examples">{askGuide.examples.map(e=><li key={e.question}>“{e.question}”<span className="log-uses">{e.uses}</span></li>)}</ul>
     <p className="log-cannot"><strong>What it can’t answer:</strong> {askGuide.cannot}</p></article>
   </div>
   <h3 className="log-subhead">Sources the AI uses</h3>
   <div className="log-table"><table><thead><tr><th>Source</th><th>What it covers</th></tr></thead><tbody>
    {askGuide.sources.map(s=><tr key={s.name}><td><strong>{s.url.startsWith('/')?<Link href={s.url}>{s.name}</Link>:<a href={s.url} target="_blank" rel="noopener noreferrer">{s.name}</a>}</strong><br/><small>{s.publisher}</small></td><td>{s.covers}</td></tr>)}
   </tbody></table></div>
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
