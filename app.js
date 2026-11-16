'use strict';
const $ = id => document.getElementById(id);
const palette = ['#216b59','#c96342','#4c78b2','#9361a5','#ae851f','#c14f79','#308c95','#76604b'];
const selected = new Set(['KOR','USA','SWE']);
let countries = [];
const descriptions = {gii:'A lower value indicates less gender inequality. The index ranges from 0 to 1.',gdi:'Female HDI divided by male HDI. Values closer to 1 indicate greater parity in human development; values above 1 mean female HDI is higher.'};
function renderCountries(){
 const query = $('search').value.toLocaleLowerCase();
 const filtered = countries.filter(c=>c.name.toLocaleLowerCase().includes(query));
 $('countries').replaceChildren(...filtered.map(c=>{
  const label=document.createElement('label');label.className='country';
  const input=document.createElement('input');input.type='checkbox';input.checked=selected.has(c.code);
  input.addEventListener('change',()=>{input.checked?selected.add(c.code):selected.delete(c.code);renderChart();});
  label.append(input,document.createTextNode(c.name));return label;
 }));
 if(!filtered.length) $('countries').textContent='No countries found.';
 updateCount();
}
function updateCount(){$('count').textContent=`${selected.size} selected · ${countries.length} countries`;}
function renderChart(){
 updateCount();const metric=$('metric').value;
 $('chart-title').textContent=$('metric').selectedOptions[0].textContent;
 $('explanation').textContent=descriptions[metric];
 const chosen=[...selected].map(code=>countries.find(c=>c.code===code)).filter(Boolean);
 $('legend').replaceChildren(...chosen.map((c,i)=>{const el=document.createElement('span');el.className='key';const dot=document.createElement('span');dot.className='swatch';dot.style.background=palette[i%palette.length];el.append(dot,document.createTextNode(c.name));return el;}));
 $('latest').replaceChildren(...chosen.map(c=>{const row=document.createElement('tr');const last=c.series[metric].filter(p=>p[1]!==null).at(-1);for(const value of [c.name,last?last[0]:'—',last?last[1].toFixed(3):'No data']){const td=document.createElement('td');td.textContent=value;row.append(td);}return row;}));
 const values=chosen.flatMap(c=>c.series[metric].filter(p=>p[1]!==null).map(p=>p[1]));
 if(!values.length){const el=document.createElement('p');el.className='empty';el.textContent=chosen.length?'No observations are available for these countries and this indicator.':'Select one or more countries to draw a graph.';$('plot').replaceChildren(el);return;}
 const ns='http://www.w3.org/2000/svg';const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 860 360');svg.setAttribute('role','img');svg.setAttribute('aria-label',`${$('chart-title').textContent}, 1990–2023. Latest values are listed in the table below.`);
 const add=(tag,attrs,text)=>{const el=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);if(text!==undefined)el.textContent=text;svg.append(el);return el;};
 const lo=metric==='gii'?0:Math.max(0,Math.floor((Math.min(...values)-0.03)*10)/10),hi=metric==='gii'?1:Math.max(1.1,Math.ceil((Math.max(...values)+0.03)*10)/10);
 const x=y=>58+(y-1990)/33*770,y=v=>310-(v-lo)/(hi-lo)*280;
 for(let i=0;i<=5;i++){const v=lo+(hi-lo)*i/5;add('line',{x1:58,x2:828,y1:y(v),y2:y(v),stroke:'#e6ebe4'});add('text',{x:45,y:y(v)+4,'text-anchor':'end'},v.toFixed(2));}
 for(const year of [1990,1995,2000,2005,2010,2015,2020,2023]) add('text',{x:x(year),y:337,'text-anchor':'middle'},year);
 if(metric==='gdi')add('line',{x1:58,x2:828,y1:y(1),y2:y(1),stroke:'#a4afa4','stroke-dasharray':'5 5'});
 chosen.forEach((c,i)=>{let d='',gap=true;for(const [year,v] of c.series[metric]){if(v===null){gap=true;continue;}d+=`${gap?'M':'L'}${x(year)},${y(v)} `;gap=false;}add('path',{d,fill:'none',stroke:palette[i%palette.length],'stroke-width':2.5});for(const [year,v]of c.series[metric])if(v!==null){const dot=add('circle',{cx:x(year),cy:y(v),r:3,fill:palette[i%palette.length]});const title=document.createElementNS(ns,'title');title.textContent=`${c.name} · ${year}: ${v.toFixed(3)}`;dot.append(title);}});
 $('plot').replaceChildren(svg);
}
$('search').addEventListener('input',renderCountries);
$('metric').addEventListener('change',renderChart);
$('clear').addEventListener('click',()=>{selected.clear();renderCountries();renderChart();});
fetch('data.json').then(r=>{if(!r.ok)throw new Error('Dataset request failed');return r.json();}).then(data=>{countries=data.sort((a,b)=>a.name.localeCompare(b.name));renderCountries();renderChart();}).catch(()=>{$('count').textContent='Dataset unavailable';$('plot').textContent='Unable to load the dataset. Serve this directory with a local web server, then reload the page.';});
