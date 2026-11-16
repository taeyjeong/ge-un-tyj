'use client';
import {useState} from 'react';
import {calculateHdi,hdiInputDefinitions,hdiInputsFor} from '../lib/hdi-model';
import {flagFor,formatValue,type Country} from '../lib/types';
const precise=(value:number)=>value.toFixed(6);
export default function HdiCalculation({countries,defaultYear}:{countries:Country[];defaultYear:number}){
 const [countryCode,setCountryCode]=useState(countries[0]?.code??'');
 const [year,setYear]=useState(defaultYear);
 const country=countries.find(country=>country.code===countryCode)??countries[0];
 if(!country)return <section id="hdi-calculation" className="gii-model"><h2>Explore the HDI calculation</h2><p className="muted">Select a country above to see its inputs and each calculation stage.</p></section>;
 const inputs=hdiInputsFor(country,year);
 const calculation=calculateHdi(inputs);
 const reported=country.series.hdi.find(([observationYear])=>observationYear===year)?.[1]??null;
 const steps=calculation.status==='complete'?calculation.steps:null;
 const difference=steps&&reported!==null?steps.calculatedHdi-reported:null;
 const mismatch=difference!==null&&Math.abs(difference)>.000501;
 const fieldNames=calculation.status!=='complete'?calculation.fields.map(key=>hdiInputDefinitions.find(field=>field.key===key)!.label).join(', '):'';
 return <section id="hdi-calculation" className="gii-model" aria-labelledby="hdi-model-title">
 <div className="data-heading"><div><div className="eyebrow">FROM INPUTS TO INDEX</div><h2 id="hdi-model-title">Explore the HDI calculation</h2></div><a href="#hdi-full-formula">View the full formula ↓</a></div>
 <p className="muted">Follow a country and year from four raw inputs to three dimension indices and the final Human Development Index.</p>
 <div className="table-controls"><label>Country<select value={country.code} onChange={event=>setCountryCode(event.target.value)}>{countries.map(item=><option key={item.code} value={item.code}>{flagFor(item.iso2)} {item.name}</option>)}</select></label><label>Year<select value={year} onChange={event=>setYear(Number(event.target.value))}>{Array.from({length:34},(_,index)=>1990+index).map(value=><option key={value}>{value}</option>)}</select></label></div>
 <h3>1. Prepare the four inputs</h3><p className="muted">Apply UNDP’s minimum and maximum goalposts for calculation. The original observations stay unchanged; missing values stay missing.</p>
 <div className="table-wrap"><table className="gii-inputs"><caption className="sr-only">{country.name} · {year} · HDI inputs and goalposts</caption><thead><tr><th scope="col">Input</th><th scope="col">Unit</th><th scope="col">CSV value</th><th scope="col">Goalposts</th><th scope="col">Used in formula</th></tr></thead><tbody>{hdiInputDefinitions.map(({key,label,unit,minimum,maximum})=><tr key={key}><th scope="row">{label}</th><td>{unit}</td><td>{formatValue(inputs[key],key)}</td><td>{minimum.toLocaleString('en-US')}–{maximum.toLocaleString('en-US')}</td><td>{steps?precise(steps.bounded[key]):'—'}</td></tr>)}</tbody></table></div>
 {!steps?<p className="gii-status" role="status">{calculation.status==='missing-inputs'?'Cannot reconstruct this year because inputs are unavailable':'Cannot reconstruct this year because inputs are outside the valid range'}: {fieldNames}. Reported HDI: {formatValue(reported,'hdi')}.</p>:<>
 <h3>2. Build the three dimensions</h3><div className="gii-flow dimensions">
 <article><h4>Health · H</h4><p>Life expectancy index</p><p>({precise(steps.bounded.le)} − 20) / (85 − 20)</p><strong>{precise(steps.dimensions.health)}</strong><small>A long and healthy life.</small></article>
 <article><h4>Education · E</h4><p>Expected schooling index = {precise(steps.bounded.eys)} / 18 = {precise(steps.schooling.expected)}</p><p>Mean schooling index = {precise(steps.bounded.mys)} / 15 = {precise(steps.schooling.mean)}</p><p>({precise(steps.schooling.expected)} + {precise(steps.schooling.mean)}) / 2</p><strong>{precise(steps.dimensions.education)}</strong><small>The two schooling indices are averaged equally.</small></article>
 <article><h4>Income · I</h4><p>[ln({precise(steps.bounded.gnipc)}) − ln(100)] / [ln(75,000) − ln(100)]</p><strong>{precise(steps.dimensions.income)}</strong><small>Natural logarithms reflect the diminishing contribution of additional income.</small></article></div>
 <p className="gii-flow-arrow" aria-hidden="true">↓</p><h3>3. Combine the dimensions</h3><div className="gii-flow hdi-combination"><article><h4>Geometric mean</h4><p>HDI = ∛(H × E × I)</p><p>∛({precise(steps.dimensions.health)} × {precise(steps.dimensions.education)} × {precise(steps.dimensions.income)})</p><strong>{precise(steps.calculatedHdi)}</strong><small>Each dimension has equal weight in the geometric mean.</small></article></div>
 <p className="gii-flow-arrow" aria-hidden="true">↓</p><h3>4. Compare with the reported score</h3><div className="gii-result"><div><span>Reconstructed HDI</span><strong>{steps.calculatedHdi.toFixed(3)}</strong><code>HDI = ∛(H × E × I)</code></div><div><span>Reported HDI · CSV</span><strong>{formatValue(reported,'hdi')}</strong><small>{difference===null?'No reported HDI for this year':mismatch?`Reconstructed minus reported: ${difference>0?'+':''}${precise(difference)}`:'Matches the reported score to 3 decimals.'}</small></div></div>
 {mismatch&&<p className="gii-status" role="status">The reconstruction differs from the reported score. It uses the published inputs and current goalposts. The reported score remains the value used in charts.</p>}
 <p className="muted">Higher HDI means greater human development. Intermediate results are displayed to six decimals; calculations retain full precision.</p></>}
 <p className="muted">Source: <a href="https://hdr.undp.org/sites/default/files/2025_HDR/HDR25_Technical_Notes.pdf" target="_blank" rel="noreferrer">UNDP HDR 2025 · Technical note 1, pages 3–4</a>.</p></section>;
}
