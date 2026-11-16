import {chartDetails} from '../lib/chart-details';
import {flagFor,formatValue,indicatorFor,type Country,type Metric} from '../lib/types';
export default function ChartTooltip({country,metric,year,id}:{country:Country;metric:Metric;year:number;id:string}){
 const details=chartDetails(country,metric,year);
 return <div id={id} role="tooltip" className="chart-tooltip-content">
  <div className="tooltip-country"><strong><span aria-hidden="true">{flagFor(country.iso2)} </span>{country.name}</strong><span className="tooltip-year">{year}</span></div>
  <div className="tooltip-value"><span>{indicatorFor(metric).name}</span><strong>{formatValue(details.value,metric)}</strong></div>
  {details.health.length>0&&<div className="tooltip-health">{details.health.map(row=><div key={row.label}><span>{row.label}<small>{row.unit}</small></span><strong>{formatValue(row.value,metric)}</strong></div>)}</div>}
  {details.factors.length>0&&<table className="tooltip-factors"><caption>{metric==='gdi'?'HDI and its components':'Empowerment & labour market'} · {year}</caption><thead><tr><th scope="col">Measure</th><th scope="col">Female</th><th scope="col">Male</th></tr></thead><tbody>{details.factors.map(row=><tr key={row.label}><th scope="row">{row.label}<small>{row.unit}</small></th><td>{formatValue(row.female,metric)}</td><td>{formatValue(row.male,metric)}</td></tr>)}</tbody></table>}
  {details.notes.map(note=><p className="tooltip-note" key={note}>{note}</p>)}
  {(details.factors.length>0||details.health.length>0)&&<p className="tooltip-missing">— = unavailable for this country and year</p>}
 </div>;
}
