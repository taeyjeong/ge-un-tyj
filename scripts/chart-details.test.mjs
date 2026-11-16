import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chartDetails,valueAt} from '../lib/chart-details.ts';
const fixture={code:'TST',name:'Test country',series:Object.fromEntries([
 ['gdi',0.8,1.01],['gii',0.6,0.15],['hdi_f',0.4,0.91],['hdi_m',0.5,0.9],
 ['le_f',55,85],['le_m',50,80],['eys_f',6,16],['eys_m',8,15],['mys_f',3,12],['mys_m',4,11],
 ['gni_pc_f',1000,30000],['gni_pc_m',2000,40000],['mmr',500,15],['abr',90,7],
 ['se_f',20,90],['se_m',30,92],['pr_f',4,45],['pr_m',96,55],['lfpr_f',30,65],['lfpr_m',80,75]
].map(([metric,oldValue,newValue])=>[metric,[[1990,oldValue],[2023,newValue]]]))};
const gdi=chartDetails(fixture,'gdi',2023);
assert.equal(gdi.year,2023);assert.equal(gdi.value,1.01);
assert.deepEqual(gdi.factors.map(row=>[row.female,row.male]),[[0.91,0.9],[85,80],[16,15],[12,11],[30000,40000]]);
assert.equal(chartDetails(fixture,'gdi',1990).factors[1].female,55);
assert.equal(chartDetails(fixture,'gdi',2000).value,null);
assert.ok(chartDetails(fixture,'gdi',2000).factors.every(row=>row.female===null&&row.male===null));
const gii=chartDetails(fixture,'gii',2023);
assert.deepEqual(gii.health.map(row=>row.value),[15,7]);
assert.deepEqual(gii.factors.map(row=>[row.female,row.male]),[[90,92],[45,55],[65,75]]);
assert.ok(gii.notes.some(note=>note.includes('2020 estimate')));
assert.ok(!chartDetails(fixture,'gii',1990).notes.some(note=>note.includes('2020 estimate')));
assert.equal(valueAt(fixture,'missing',2023),null);
const simple=chartDetails(fixture,'le_f',2023);
assert.equal(simple.value,85);assert.equal(simple.factors.length,0);assert.equal(simple.health.length,0);
const countries=JSON.parse(readFileSync(new URL('../lib/countries.json',import.meta.url)));
for(const country of countries){
 for(const metric of ['gdi','gii']){
  for(const year of [1990,2000,2010,2023]){
   const detail=chartDetails(country,metric,year);
   assert.equal(detail.value,country.series[metric].find(point=>point[0]===year)[1]);
   assert.equal(detail.factors.length,metric==='gdi'?5:3);
  }
 }
}
console.log('Passed tooltip components: both indices, exact hovered-year values, unavailable values, simple indicators, repeated-year caveats, and all 195 countries.');

for(const country of countries){
 const detail=chartDetails(country,"hdi",2023);
 assert.equal(detail.health.length,4);
 assert.deepEqual(detail.health.map(row=>row.value),["le","eys","mys","gnipc"].map(metric=>valueAt(country,metric,2023)));
}
console.log("Passed HDI tooltip: all four exact-year inputs for every country.");
