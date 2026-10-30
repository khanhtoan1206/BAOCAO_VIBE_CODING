import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const directory=new URL('../backend/data/addresses/',import.meta.url);
const repo='thanglequoc/vietnamese-provinces-database';
const configurations=[{mode:'current',tag:'v5.2.0',date:'2026-09-20',provinces:34},{mode:'historical',tag:'v2.4.1',date:'2025-03-01',provinces:63}];
async function download(url){const response=await fetch(url);if(!response.ok)throw Error(`${response.status}: ${url}`);return response.text();}
const output=[];
for(const config of configurations){
  const commit=JSON.parse(await download(`https://api.github.com/repos/${repo}/commits/${config.tag}`)).sha;
  const url=`https://raw.githubusercontent.com/${repo}/${commit}/json/simplified_json_generated_data_vn_units.json`;
  const raw=await download(url),source=JSON.parse(raw);
  const unit=u=>({code:u.Code,name:u.FullName});
  const provinces=source.map(p=>({...unit(p),...(config.mode==='current'?{wards:p.Wards.map(w=>{assert.equal(w.ProvinceCode,p.Code);return unit(w);})}:{districts:p.District.map(d=>{assert.equal(d.ProvinceCode,p.Code);return {...unit(d),wards:(d.Ward??[]).map(w=>{assert.equal(w.DistrictCode,d.Code);return unit(w);})};})})}));
  assert.equal(provinces.length,config.provinces);
  const wards=provinces.flatMap(p=>p.wards||p.districts.flatMap(d=>d.wards));
  assert.equal(new Set(wards.map(w=>w.code)).size,wards.length);
  assert.equal(new Set(provinces.map(p=>p.code)).size,provinces.length);
  if(config.mode==='current')assert.equal(wards.length,3321);
  const snapshot={version:`${config.mode}-${config.tag}`,mode:config.mode,updatedAt:config.date,importedAt:new Date().toISOString(),source:{name:'Vietnamese Provinces Database (cộng đồng, dẫn nguồn thống kê Việt Nam)',release:`https://github.com/${repo}/releases/tag/${config.tag}`,url,commit,sha256:createHash('sha256').update(raw).digest('hex'),officialBasis:'https://chinhphu.vn/?pageid=27160&docid=214409',note:config.mode==='current'?'Snapshot hai cấp; không tự cập nhật khi checkout. Chưa đối chiếu độc lập toàn bộ các dòng với văn bản gốc.':'Snapshot lịch sử 01/03/2025; không đại diện địa giới hiện hành, không phải bản chốt 30/06/2025.'},counts:{provinces:provinces.length,districts:provinces.reduce((n,p)=>n+(p.districts?.length||0),0),wards:wards.length},provinces};
  output.push([`${config.mode}.json`,JSON.stringify(snapshot)]);
  console.log(config.mode,snapshot.counts,commit);
}
const license=await download(`https://raw.githubusercontent.com/${repo}/v5.2.0/LICENSE`);
await mkdir(directory,{recursive:true});
for(const [file,contents] of output)await writeFile(new URL(file,directory),contents+'\n');
await writeFile(new URL('LICENSE.upstream',directory),license);
console.log('Imported pinned address snapshots. No runtime external API required.');