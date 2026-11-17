import assert from 'node:assert/strict';
import {decodeUnicef,numeric} from '../lib/live-data.ts';
assert.equal(numeric(''),null);assert.equal(numeric(null),null);assert.equal(numeric('..'),null);assert.equal(numeric('0'),0);
const payload={data:{structure:{dimensions:{series:[{id:'SEX',values:[{id:'_T',name:'Total'}]},{id:'REF_AREA',values:[{id:'IND',name:'India'}]}],observation:[{id:'TIME_PERIOD',values:[{id:'2021'}]}]},attributes:{dataset:[],series:[],observation:[{id:'DATA_SOURCE',values:[{id:'NFHS',name:'NFHS 2019–21'}]},{id:'AGE',values:[{id:'Y20T24',name:'20 to 24 years old'}]}]}},dataSets:[{series:{'0:0':{observations:{'0':['23.3',0,0]}}}}]}};
const rows=decodeUnicef(payload);assert.deepEqual(rows,[{country:'IND',year:2021,value:23.3,details:{SEX:'Total',REF_AREA:'India',TIME_PERIOD:'2021',DATA_SOURCE:'NFHS 2019–21',AGE:'20 to 24 years old'}}]);
assert.throws(()=>decodeUnicef({}));
console.log('Live data decoding tests passed.');
