import assert from 'node:assert/strict';
import {chartInteractionReducer,countryOpacity} from '../lib/chart-interaction.ts';
const point={country:'KOR',year:2020};
const other={country:'SWE',year:2023};
let state={hovered:null,pinned:null};
state=chartInteractionReducer(state,{type:'hover',point});
assert.equal(state.hovered,point);
state=chartInteractionReducer(state,{type:'pin',point});
assert.equal(state.pinned,point);assert.equal(state.hovered,null);
for(const action of [{type:'hover',point:other},{type:'hover',point:null},{type:'leave'},{type:'blur'}]){
 const next=chartInteractionReducer(state,action);
 assert.equal(next,state,'Pinned state survives mouse movement, pointer exit and focus changes');
}
state=chartInteractionReducer(state,{type:'pin',point:other});
assert.equal(state.pinned,other,'A second point replaces the pinned point');
state=chartInteractionReducer(state,{type:'dismiss'});
assert.deepEqual(state,{hovered:null,pinned:null});
assert.deepEqual(chartInteractionReducer({hovered:point,pinned:null},{type:'leave'}),{hovered:null,pinned:null});
assert.deepEqual(chartInteractionReducer({hovered:point,pinned:null},{type:'blur'}),{hovered:null,pinned:null});
assert.equal(countryOpacity('KOR','KOR',true,true),1);
assert.equal(countryOpacity('SWE','KOR',true,false),.12);
assert.ok(countryOpacity('SWE','KOR',true,false)<countryOpacity('SWE','KOR',false,false));
assert.equal(countryOpacity('KOR',undefined,false,false),1);
console.log('Passed pinned selection, movement/blur persistence, replacement, dismissal and country fading.');
