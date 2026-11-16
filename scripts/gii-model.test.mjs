import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calculateGii,giiInputsFor} from '../lib/gii-model.ts';
// Independent worked example: Germany, HDR 2025 Technical note 4, pp. 10–11.
const example={mmr:4.428,abr:5.473,pr_f:35.279,pr_m:64.721,se_f:93.591,se_m:94.346,lfpr_f:56.410,lfpr_m:66.720};
const result=calculateGii(example);
assert.equal(result.status,'complete');
assert.equal(result.steps.normalized.mmr,10);
assert.equal(Number(result.steps.gender.female.toFixed(3)),.517);
assert.equal(Number(result.steps.gender.male.toFixed(3)),.805);
assert.equal(Number(result.steps.harmonicMean.toFixed(3)),.630);
assert.equal(Number(result.steps.referenceIndex.toFixed(3)),.668);
assert.equal(Number(result.steps.calculatedGii.toFixed(3)),.057);
const parity=calculateGii({...example,mmr:10,abr:1,pr_f:50,pr_m:50,se_f:90,se_m:90,lfpr_f:70,lfpr_m:70});
assert.equal(parity.steps.calculatedGii,0);
const missing=calculateGii({...example,se_f:null});
assert.deepEqual(missing,{status:'missing-inputs',fields:['se_f']});
assert.equal(calculateGii({...example,pr_f:-1}).status,'invalid-inputs');
assert.equal(calculateGii({...example,se_m:101}).status,'invalid-inputs');
assert.equal(calculateGii({...example,abr:NaN}).status,'invalid-inputs');
assert.equal(calculateGii({...example,mmr:1500}).steps.normalized.mmr,1000);
const zero=calculateGii({...example,pr_f:0,se_f:0,lfpr_f:0,abr:0});
assert.equal(zero.steps.normalized.pr_f,.001);assert.equal(zero.steps.normalized.abr,.1);
assert.ok(Number.isFinite(zero.steps.calculatedGii));
const countries=JSON.parse(readFileSync(new URL('../lib/countries.json',import.meta.url)));
let complete=0,maxDifference=0,nonzeroMaxDifference=0,zeroCases=0;
for(const country of countries)for(let year=1990;year<=2023;year++){
 const inputs=giiInputsFor(country,year),calculation=calculateGii(inputs);
 if(calculation.status!=='complete')continue;
 complete++;
 assert.ok(calculation.steps.calculatedGii>=0 && calculation.steps.calculatedGii<=1);
 const official=country.series.gii.find(point=>point[0]===year)?.[1];
 if(official!==null&&official!==undefined){
  const difference=Math.abs(official-calculation.steps.calculatedGii);
  maxDifference=Math.max(maxDifference,difference);
  if(Object.values(inputs).every(value=>value>0))nonzeroMaxDifference=Math.max(nonzeroMaxDifference,difference);
  else zeroCases++;
 }
}
assert.ok(complete>4500);
assert.ok(nonzeroMaxDifference<.000501,`Nonzero inputs should reproduce reported precision: ${nonzeroMaxDifference}`);
// Zero-input records are intentionally flagged, not silently fitted to the published score.
assert.ok(zeroCases>0&&maxDifference>.01);
console.log(`Passed UNDP Germany example, parity, missing/invalid inputs, bounds, zero rules, and ${complete} country-years. Nonzero inputs match within ${nonzeroMaxDifference.toFixed(6)}; ${zeroCases} zero-input records retain explicit reconstruction caveats.`);
