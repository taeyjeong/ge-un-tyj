import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import * as chartInteraction from '../lib/chart-interaction.ts';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
const {transform,loadBindings}=require('next/dist/build/swc');
await loadBindings();
async function loadComponent(path){
 const source=await transform(fs.readFileSync(new URL(path,import.meta.url),'utf8'),{filename:path,jsc:{parser:{syntax:'typescript',tsx:true},target:'es2022',transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
 const module={exports:{}};new Function('require','module','exports',source.code)(id=>id==='../lib/types'?{colorFor:()=> '#226c59'}:id==='../lib/chart-interaction'?chartInteraction:require(id),module,module.exports);return module.exports.default;
}
const Bars=await loadComponent('../components/LiveObservationChart.tsx');
const Line=await loadComponent('../components/TopicLineChart.tsx');
const countries=[{code:'JPN',name:'Japan'},{code:'KOR',name:'Korea'}];
const rows=[{country:'JPN',year:2024,value:-10,details:{}},{country:'KOR',year:2024,value:10,details:{}}];
const bars=renderToStaticMarkup(React.createElement(Bars,{rows,countries,unit:'%'}));
assert(bars.includes('left:0%;width:50%'));assert(bars.includes('left:50%;width:50%'));assert(bars.includes('>-10<'));assert(bars.includes('live-bar-zero'));
const withGap=[{country:'JPN',year:2020,value:10,details:{}},{country:'JPN',year:2021,value:null,details:{}},{country:'JPN',year:2022,value:20,details:{}}];
const line=renderToStaticMarkup(React.createElement(Line,{rows:withGap,countries:[countries[0]],unit:'%',from:2020,to:2022,zero:true}));
assert.equal((line.match(/data-chart-point="true"/g)??[]).length,2);assert.equal((line.match(/r="11"/g)??[]).length,2);assert(line.includes('Click a point to keep its details visible'));assert.equal((line.match(/<circle /g)??[]).length,4);assert.equal((line.match(/<path /g)??[]).length,2);assert(!line.includes(' L'));assert(line.includes('2020: 10'));assert(line.includes('2022: 20'));
const empty=renderToStaticMarkup(React.createElement(Line,{rows:[withGap[1]],countries,unit:'%',from:2020,to:2022,zero:true}));assert(empty.includes('No numeric observations'));
console.log('Passed negative/positive bar baselines, annual point labels, missing-year line gaps and empty-chart rendering checks.');
