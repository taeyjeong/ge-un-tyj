import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {evaluateIndex,inputsForIndex} from '../lib/indices.ts';
import {calculateFcs,fcsGroups,wfpExample,fcsCategory,parseFcsCsv,summarizeFcs} from '../lib/fcs-model.ts';
import {fdiAggregate,fdiReconstruction} from '../lib/fdi-model.ts';
const near=(a,b,tolerance=1e-6)=>assert(Math.abs(a-b)<=tolerance,`${a} vs ${b}`);
assert.equal(calculateFcs(wfpExample.inputs).value,50);assert.equal(evaluateIndex('fcs',wfpExample.inputs).value,50);
const all=v=>Object.fromEntries(fcsGroups.map(g=>[g.key,v]));
assert.equal(calculateFcs(all(0)).value,0);assert.equal(calculateFcs(all(7)).value,112);
for(const invalid of [null,undefined,NaN,Infinity,-1,8,.5])assert.equal(calculateFcs({...wfpExample.inputs,staples:invalid}).value,null);
assert.equal(fcsCategory(21),'Poor');assert.equal(fcsCategory(21.5),'Borderline');assert.equal(fcsCategory(35),'Borderline');assert.equal(fcsCategory(35.5),'Acceptable');assert.equal(fcsCategory(28,true),'Poor');assert.equal(fcsCategory(28.5,true),'Borderline');assert.equal(fcsCategory(42,true),'Borderline');assert.equal(fcsCategory(42.5,true),'Acceptable');
const header='household_id,country,date,weight,staples,pulses,dairy,protein,vegetables,fruit,fats,sugar,reported_fcs';
const csv=header+'\r\n"HH, 1",Nepal,2026-11-17,1,7,2,3,2,2,1,7,7,50\r\nHH2,Nepal,2026-11-17,3,0,0,0,0,0,0,0,0,0';
const households=parseFcsCsv('\uFEFF'+csv);assert.equal(households[0].id,'HH, 1');assert.equal(households[0].reported,50);assert.equal(calculateFcs(households[0].inputs).value,50);
const summary=summarizeFcs(households);near(summary.weightedMean,12.5);near(summary.shares.Poor,75);near(summary.shares.Acceptable,25);near(Object.values(summary.shares).reduce((a,b)=>a+b,0),100);
const huge=summarizeFcs(households.map(h=>({...h,weight:1e308})));near(huge.weightedMean,25);assert(Number.isFinite(huge.shares.Poor));
assert.equal(summarizeFcs([]),null);assert.throws(()=>summarizeFcs([{...households[0],weight:0}]));
const officialHeader='FCSStap,FCSPulse,FCSDairy,FCSPr,FCSVeg,FCSFruit,FCSFat,FCSSugar';assert.equal(calculateFcs(parseFcsCsv(officialHeader+'\n7,2,3,2,2,1,7,7')[0].inputs).value,50);
for(const invalid of [header+'\nHH,Nepal,2026-11-17,1,,2,3,2,2,1,7,7,50',csv.replace('2026-11-17','2026-02-30'),csv.replace('HH2','"HH, 1"'),csv.replace(',3,0,0,0,0,0,0,0,0,0',',0,0,0,0,0,0,0,0,0,0'),officialHeader+'\n7,2,3,2,2,1,7,8','staples,staples\n7,7','"unclosed'])assert.throws(()=>parseFcsCsv(invalid));
assert.throws(()=>parseFcsCsv('x'.repeat(1_000_001)));
const data=JSON.parse(fs.readFileSync(new URL('../lib/fdi-data.json',import.meta.url)));const source=JSON.parse(fs.readFileSync(new URL('../lib/fdi-source.json',import.meta.url)));
assert.equal(data.length,7503);assert.equal(new Set(data.map(r=>r.country)).size,183);assert.equal(Math.min(...data.map(r=>r.year)),1980);assert.equal(Math.max(...data.map(r=>r.year)),2020);
let max=0;for(const row of data){const result=evaluateIndex('fdi',row);assert.notEqual(result.value,null);const error=Math.abs(result.value-row.fd);max=Math.max(max,error);near(result.value,row.fd,2e-7);near(fdiAggregate('fi',row).value,row.fi,1e-7);near(fdiAggregate('fm',row).value,row.fm,1e-7);}
const japan=data.find(r=>r.country==='JPN'&&r.year===2020);near(japan.fd,.924515784,1e-9);assert.equal(evaluateIndex('fdi',{...japan,fia:null}).value,null);assert.equal(evaluateIndex('fdi',{...japan,fia:2}).value,null);
for(const p of Object.values(fdiReconstruction.parameters)){near(Object.values(p.weights).reduce((a,b)=>a+b,0),1,1e-12);assert(p.minimum<p.maximum);assert(p.maxAbsoluteError<1e-7);}
const extract=fs.readFileSync(new URL('../public'+source.download,import.meta.url));assert.equal(createHash('sha256').update(extract).digest('hex'),source.extractSha256);
console.log(`Passed WFP example, 0–112 limits, thresholds, CSV validation/aliases, survey weighting, and all ${data.length} IMF country-year reconstructions (max error ${max.toExponential(3)}).`);
