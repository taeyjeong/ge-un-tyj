import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calculateHdi,hdiInputsFor} from '../lib/hdi-model.ts';
// Independent published example: Benin, HDR 2025 Technical note 1, page 4.
const example={le:60.8,eys:10.4,mys:3.2,gnipc:3806};
const result=calculateHdi(example);
assert.equal(result.status,'complete');
assert.equal(Number(result.steps.dimensions.health.toFixed(3)),.628);
assert.equal(Number(result.steps.dimensions.education.toFixed(3)),.396);
assert.equal(Number(result.steps.dimensions.income.toFixed(3)),.550);
assert.equal(Number(result.steps.calculatedHdi.toFixed(3)),.515);
assert.equal(calculateHdi({le:85,eys:18,mys:15,gnipc:75000}).steps.calculatedHdi,1);
assert.equal(calculateHdi({le:20,eys:0,mys:0,gnipc:100}).steps.calculatedHdi,0);
assert.deepEqual(calculateHdi({...example,mys:null}),{status:'missing-inputs',fields:['mys']});
assert.equal(calculateHdi({...example,gnipc:0}).status,'invalid-inputs');
assert.equal(calculateHdi({...example,le:Infinity}).status,'invalid-inputs');
assert.equal(calculateHdi({...example,eys:-1}).status,'invalid-inputs');
const extremes=calculateHdi({le:90,eys:22,mys:18,gnipc:150000});
assert.deepEqual(extremes.steps.bounded,{le:85,eys:18,mys:15,gnipc:75000});
assert.equal(extremes.steps.calculatedHdi,1);
assert.equal(calculateHdi({...example,gnipc:50}).steps.bounded.gnipc,100);
const countries=JSON.parse(readFileSync(new URL('../lib/countries.json',import.meta.url)));
let compared=0,maxDifference=0;
for(const country of countries)for(let year=1990;year<=2023;year++){
 const inputs=hdiInputsFor(country,year),calculation=calculateHdi(inputs);
 const reported=country.series.hdi.find(point=>point[0]===year)?.[1]??null;
 if(calculation.status!=='complete')continue;
 assert.ok(calculation.steps.calculatedHdi>=0&&calculation.steps.calculatedHdi<=1);
 if(reported!==null){compared++;maxDifference=Math.max(maxDifference,Math.abs(reported-calculation.steps.calculatedHdi));}
}
assert.ok(compared>5500);
assert.ok(maxDifference<.000501,`Mismatch beyond published precision: ${maxDifference}`);
assert.deepEqual(hdiInputsFor({series:{le:[[1990,50],[2023,80]],eys:[[2023,16]],mys:[[2023,12]],gnipc:[[2023,40000]]}},1990),{le:50,eys:null,mys:null,gnipc:null});
console.log(`Passed Benin example, goalposts, missing/invalid inputs, exact-year lookup, and ${compared} country-year comparisons; maximum rounding difference ${maxDifference.toFixed(6)}.`);
