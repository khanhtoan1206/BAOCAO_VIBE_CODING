import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {addressDataset,listAddressUnits,validateShippingAddress,normalizeAddressSearch} from '../src/services/address.service.js';
import {app} from '../src/app.js';
import {db} from '../src/config/db.js';
after(()=>db.$disconnect());
const current=addressDataset('current'),historical=addressDataset('historical');
const province=current.provinces[0],ward=province.wards[0];
const valid={addressVersion:current.version,provinceCode:province.code,wardCode:ward.code,addressLine:'Số 25 Nguyễn Trãi'};
test('current snapshot has 34 provinces and isolated parent relationships',()=>{
  assert.equal(current.provinces.length,34);assert.equal(current.provinces.flatMap(p=>p.wards).length,3321);
  const rows=listAddressUnits({mode:'current',level:'wards',provinceCode:province.code}).items;
  assert.deepEqual(rows,province.wards);
  assert.ok(!rows.some(w=>w.code===current.provinces[1].wards[0].code));
  assert.throws(()=>listAddressUnits({mode:'current',level:'districts',provinceCode:province.code}));
});
test('accent insensitive search handles Ha Noi, Da Nang and Vietnamese đ',()=>{
  assert.equal(listAddressUnits({q:'Ha Noi'}).items[0].code,'01');
  assert.equal(listAddressUnits({q:'Da Nang'}).items[0].code,'48');
  assert.equal(normalizeAddressSearch('  Đà Nẵng  '),'da nang');
  assert.equal(listAddressUnits({q:'does-not-exist'}).items.length,0);
});
test('historical district and ward lookup remains in its snapshot and parent',()=>{
  assert.equal(historical.provinces.length,63);
  const p=historical.provinces[0],d=p.districts.find(d=>d.wards.length);
  assert.deepEqual(listAddressUnits({mode:'historical',level:'districts',provinceCode:p.code}).items,p.districts.map(({code,name})=>({code,name})));
  assert.deepEqual(listAddressUnits({mode:'historical',level:'wards',provinceCode:p.code,districtCode:d.code}).items,d.wards);
  const other=historical.provinces[1].districts.find(d=>d.wards.length);
  assert.throws(()=>listAddressUnits({mode:'historical',level:'wards',provinceCode:p.code,districtCode:other.code}));
  assert.throws(()=>validateShippingAddress({addressVersion:historical.version,provinceCode:p.code,districtCode:d.code,wardCode:other.wards[0].code,addressLine:'Số 25 Nguyễn Trãi',historicalAcknowledged:true}));
  const saved=validateShippingAddress({addressVersion:historical.version,provinceCode:p.code,districtCode:d.code,wardCode:d.wards[0].code,addressLine:'Số 25 Nguyễn Trãi',historicalAcknowledged:true});
  assert.equal(saved.districtName,d.name);assert.equal(saved.addressVersion,historical.version);
  assert.throws(()=>validateShippingAddress({...saved,historicalAcknowledged:false}));
});
test('server rejects missing, invalid, mixed and stale addresses; names are canonical',()=>{
  for(const patch of [{provinceCode:'99'},{wardCode:'99999'},{wardCode:current.provinces[1].wards[0].code},{districtCode:'001'},{addressVersion:'current-stale'},{addressVersion:'legacy-free-text'},{addressLine:'   '},{addressLine:'a'.repeat(301)},{provinceCode:1},{wardCode:['00004']}])assert.throws(()=>validateShippingAddress({...valid,...patch}),undefined,JSON.stringify(patch));
  assert.throws(()=>validateShippingAddress({address:'123 old free text'}));
  const result=validateShippingAddress({...valid,provinceName:'Fake name',wardName:'Fake ward',fullAddress:'Forged'});
  assert.equal(result.provinceName,province.name);assert.equal(result.wardName,ward.name);assert.equal(result.districtCode,null);
  assert.equal(result.fullAddress,`${valid.addressLine}, ${ward.name}, ${province.name}`);
});
test('address HTTP endpoints work without third-party calls and reject bad parents',async()=>{
  const server=app.listen(0,'127.0.0.1');await once(server,'listening');const base=`http://127.0.0.1:${server.address().port}/api`;
  try{
    let response=await fetch(`${base}/addresses?mode=current&q=Da%20Nang`);assert.equal(response.status,200);assert.equal((await response.json()).data.items[0].code,'48');
    response=await fetch(`${base}/addresses?mode=historical&level=wards&provinceCode=99&districtCode=001`);assert.equal(response.status,400);assert.ok((await response.json()).error.fields.provinceCode);
    response=await fetch(`${base}/addresses/meta`);const data=(await response.json()).data;assert.equal(data.length,2);assert.equal(data[0].counts.provinces,34);assert.ok(!data[0].provinces);
  }finally{await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});}
});