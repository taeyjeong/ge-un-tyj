import assert from 'node:assert/strict';
import fs from 'node:fs';
import {evaluateIndex,indexDefinitions,inputsForIndex} from '../lib/indices.ts';
const snapshots=JSON.parse(fs.readFileSync(new URL('../lib/index-snapshots.json',import.meta.url)));
const near=(actual,expected,tolerance=1e-6)=>assert(Math.abs(actual-expected)<tolerance,`${actual} vs ${expected}`);
assert.equal(indexDefinitions.length,10);assert.equal(new Set(indexDefinitions.map(i=>i.id)).size,10);
// Independent published examples: UNDP HDR 2025 technical notes, Benin HDI, Ecuador GDI, Nepal IHDI, China PHDI.
near(evaluateIndex('hdi',{le:60.8,eys:10.4,mys:3.2,gnipc:3806}).value,.515,.0005);
near(evaluateIndex('gdi',{le_f:80.1,eys_f:15.4,mys_f:8.9,gni_pc_f:12333.2,le_m:74.7,eys_m:14.4,mys_m:9,gni_pc_m:15648.9}).value,.998,.001);
near(evaluateIndex('ihdi',{hdi:.622,ineq_le:15,ineq_edu:39.8,ineq_inc:31.9}).value,.437,.001);
near(evaluateIndex('phdi',{hdi:.797,co2_prod:8.3,mf:24.9}).value,.644,.0005);
near(evaluateIndex('mpi',{headcount:20,intensity:50}).value,.1);
near(evaluateIndex('ghi',{undernourishment:40,wasting:15,stunting:35,mortality:17.5}).value,50);
near(evaluateIndex('epi',{health:100,ecosystems:0,climate:0}).value,25);
near(evaluateIndex('epi',{health:0,ecosystems:100,climate:0}).value,45);
near(evaluateIndex('epi',{health:0,ecosystems:0,climate:100}).value,30);
near(evaluateIndex('ihdi',{hdi:.8,ineq_le:0,ineq_edu:0,ineq_inc:0}).value,.8);
near(evaluateIndex('phdi',{hdi:.8,co2_prod:0,mf:0}).value,.8);
near(evaluateIndex('mpi',{headcount:0,intensity:0}).value,0);
for(const id of indexDefinitions.map(i=>i.id)){assert.equal(evaluateIndex(id,Object.fromEntries(inputsForIndex(id).map(f=>[f.key,null]))).value,null);assert.equal(evaluateIndex(id,Object.fromEntries(inputsForIndex(id).map(f=>[f.key,Infinity]))).value,null);}
assert.equal(evaluateIndex('mpi',{headcount:20,intensity:10}).value,null);assert.equal(evaluateIndex('phdi',{hdi:.8,co2_prod:77,mf:5}).value,null);
assert.equal(evaluateIndex('ghi',{undernourishment:null,wasting:10,stunting:10,mortality:2}).value,null);
assert(snapshots.ghi.some(r=>r.display==='<5'&&r.value===null));assert(snapshots.ghi.some(r=>Object.values(r.inputDisplays??{}).some(v=>v.startsWith('<'))));
assert.equal(snapshots.mpi.length,108);assert.equal(snapshots.epi.length,177);assert(snapshots.epi.some(r=>r.country==='TWN'));
for(const id of ['mpi','ghi','epi'])for(const r of snapshots[id]){assert.equal(r.year===2026||id==='ghi',true);if(r.value!==null)assert(Number.isFinite(r.value));}
// Check source reconstruction, allowing the precision actually published in each workbook.
for(const r of snapshots.mpi){const result=evaluateIndex('mpi',r.inputs);assert.notEqual(result.value,null,r.country);near(result.value,r.value,.00001);}
for(const r of snapshots.epi){const result=evaluateIndex('epi',r.inputs);assert.notEqual(result.value,null);near(result.value,r.value,.011);}
const india=snapshots.ghi.find(r=>r.country==='IND'&&r.year===2026);// Each component and the final score is published to one decimal. Bound accumulated rounding analytically.
const ghiRoundingBound=.05+.05*(100/(3*80)+100/(6*30)+100/(6*70)+100/(3*35));
near(evaluateIndex('ghi',india.inputs).value,india.value,ghiRoundingBound);
console.log('Passed ten-index formulas, published examples, edition/censoring preservation, missing-input validation and source score reconstruction.');
