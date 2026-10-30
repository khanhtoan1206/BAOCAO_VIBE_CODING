import {readFileSync} from 'node:fs';
import {fail} from '../validators/input.js';
const cache=new Map();
export function normalizeAddressSearch(value){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase().replace(/\s+/g,' ').trim();}
export function addressDataset(mode='current'){
  if(!['current','historical'].includes(mode))fail('Chế độ địa chỉ không hợp lệ.');
  if(!cache.has(mode)){
    try{
      const dataset=JSON.parse(readFileSync(new URL(`../../data/addresses/${mode}.json`,import.meta.url),'utf8'));
      if(dataset.mode!==mode||dataset.provinces.length!==(mode==='current'?34:63))throw Error('Invalid dataset');
      cache.set(mode,dataset);
    }catch{fail('Dữ liệu địa chỉ nội bộ chưa sẵn sàng. Vui lòng thử lại hoặc liên hệ quản trị.',503);}
  }
  return cache.get(mode);
}
function fieldError(field,message){throw Object.assign(new Error(message),{status:400,fields:{[field]:message}});}
function code(value,field,length){if(typeof value!=='string'||!new RegExp(`^\\d{${length}}$`).test(value))fieldError(field,'Vui lòng chọn địa phương hợp lệ từ danh sách.');return value;}
function provinceIn(dataset,value){const p=dataset.provinces.find(p=>p.code===code(value,'provinceCode',2));if(!p)fieldError('provinceCode','Tỉnh/thành phố không có trong bộ dữ liệu đã chọn.');return p;}
function districtIn(province,value){const d=province.districts.find(d=>d.code===code(value,'districtCode',3));if(!d)fieldError('districtCode','Quận/huyện không thuộc tỉnh/thành phố đã chọn.');return d;}
export function addressMetadata(){return ['current','historical'].map(mode=>{const {provinces,...metadata}=addressDataset(mode);return metadata;});}
export function listAddressUnits(query){
  const dataset=addressDataset(query.mode??'current');
  const level=query.level??'provinces';
  let items;
  if(level==='provinces')items=dataset.provinces;
  else if(level==='districts'){
    if(dataset.mode!=='historical')fail('Địa chỉ hiện hành không sử dụng cấp huyện.');
    items=provinceIn(dataset,query.provinceCode).districts;
  }else if(level==='wards'){
    const p=provinceIn(dataset,query.provinceCode);
    if(dataset.mode==='current'&&query.districtCode)fail('Không trộn mã huyện lịch sử vào địa chỉ hiện hành.');
    items=dataset.mode==='current'?p.wards:districtIn(p,query.districtCode).wards;
  }else fail('Cấp hành chính không hợp lệ.');
  if(query.q!==undefined&&(typeof query.q!=='string'||query.q.length>100))fail('Từ khóa địa chỉ không hợp lệ.');
  const search=normalizeAddressSearch(query.q||'');
  return {version:dataset.version,items:items.filter(u=>normalizeAddressSearch(u.name).includes(search)).map(({code,name})=>({code,name}))};
}
export function validateShippingAddress(body){
  if(typeof body.addressVersion!=='string')fieldError('addressVersion','Vui lòng chọn địa chỉ giao hàng theo danh mục.');
  const mode=body.addressVersion.startsWith('current-')?'current':body.addressVersion.startsWith('historical-')?'historical':null;
  if(!mode)fieldError('addressVersion','Phiên bản địa chỉ không hợp lệ.');
  const dataset=addressDataset(mode);
  if(body.addressVersion!==dataset.version)fieldError('addressVersion','Bộ dữ liệu địa chỉ đã thay đổi. Vui lòng tải lại và chọn lại địa chỉ.');
  const province=provinceIn(dataset,body.provinceCode);
  if(mode==='current'&&body.districtCode!==undefined&&body.districtCode!==null&&body.districtCode!=='')fieldError('districtCode','Địa chỉ hiện hành không được chứa quận/huyện lịch sử.');
  const district=mode==='historical'?districtIn(province,body.districtCode):null;
  const ward=(district?district.wards:province.wards).find(w=>w.code===code(body.wardCode,'wardCode',5));
  if(!ward)fieldError('wardCode',district?'Phường/xã không thuộc quận/huyện đã chọn.':'Phường/xã/đặc khu không thuộc tỉnh/thành phố đã chọn.');
  if(typeof body.addressLine!=='string'||body.addressLine.trim().length<5||body.addressLine.trim().length>300)fieldError('addressLine','Nhập số nhà, tên đường hoặc thôn/xóm (5–300 ký tự).');
  if(mode==='historical'&&body.historicalAcknowledged!==true)fieldError('historicalAcknowledged','Cần xác nhận đây là địa chỉ lịch sử, không phải địa giới hiện hành.');
  const addressLine=body.addressLine.trim().replace(/\s+/g,' ');
  const fullAddress=[addressLine,ward.name,district?.name,province.name].filter(Boolean).join(', ');
  return {provinceCode:province.code,provinceName:province.name,wardCode:ward.code,wardName:ward.name,districtCode:district?.code??null,districtName:district?.name??null,addressLine,addressVersion:dataset.version,fullAddress,address:fullAddress};
}