import Link from 'next/link';
import DatasetTabs from '../../components/DatasetTabs';
import {navigationCountries} from '../../lib/navigation';
import AskHistory from './AskHistory';
// Public, but kept out of search engines: visitors' questions are free text.
export const metadata = {title: 'Questions asked · GE / UN Data', description: 'Every question visitors asked the Ask-the-data AI about peace agreements and women’s inclusion, with its answer.', robots: {index: false, follow: true}};
export default async function Page({searchParams}: {searchParams: Promise<{countries?: string | string[]}>}) {
  const params = await searchParams; const selected = navigationCountries(params.countries);
  return <><header><Link className="brand" href="/">GE<span> / UN DATA</span></Link><span>QUESTIONS ASKED</span></header><main className="project-log"><DatasetTabs active="/peace-agreements" countries={selected}/>
    <div className="eyebrow">ASK THE DATA · PUBLIC HISTORY</div>
    <h1>Questions people have asked.</h1>
    <p className="intro">Every question asked in the “Ask the data” chat, newest first, with the AI’s answer. Click a question to read the answer, then “Continue this chat” to ask follow-up questions about it. “Partly answered” means the data covered some of the question; “Data not sufficient” means it couldn’t answer it. Both show what was missing and what data could be added.</p>
    <p className="project-note"><Link href="/peace-agreements">← Peace agreements project</Link> · <Link href="/project-log">Project log</Link> · Answers come from an AI using the project’s data and can contain mistakes.</p>
    <section style={{marginTop: 24}}><AskHistory/></section>
  </main></>;
}
