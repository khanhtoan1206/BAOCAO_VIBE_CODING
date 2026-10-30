import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {db} from '../backend/src/config/db.js';
import {addressDataset} from '../backend/src/services/address.service.js';
export async function testAddressFlow({base,send,evaluate,until,output}){
  const suffix=Date.now(),email=`address-browser-${suffix}@test.local`,password='AddressTest123!';
  let userId,productId,categoryId;
  const current=addressDataset('current'),historical=addressDataset('historical');
  async function request(path,method='GET',body,token){const response=await fetch(`${base}/api${path}`,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});const result=await response.json();assert.ok(response.ok,JSON.stringify(result));return result.data;}
  async function input(selector,value){await evaluate(`(()=>{const input=document.querySelector(${JSON.stringify(selector)});input.focus();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}));})()`);}
  async function choose(field,query,expected){
    const selector=`[data-field="${field}"] input`;
    await until(`!!document.querySelector(${JSON.stringify(selector)}) && !document.querySelector(${JSON.stringify(selector)}).disabled`);
    await input(selector,query);
    await until(`!!document.querySelector(${JSON.stringify(`[data-field="${field}"] [role=option]`)})`);
    await evaluate(`document.querySelector(${JSON.stringify(selector)}).dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}))`);
    await until(`document.querySelector(${JSON.stringify(selector)}).value===${JSON.stringify(expected)}`);
  }
  try{
    const auth=await request('/auth/register','POST',{email,password,confirmPassword:password,name:'Kiểm thử địa chỉ',phone:'0901234567'});userId=auth.user.id;
    const category=await db.category.create({data:{name:`Address Browser ${suffix}`}});categoryId=category.id;
    const product=await db.product.create({data:{name:`Address Browser ${suffix}`,description:'Dedicated browser test fixture',image:'/images/category-0.svg',price:1000,originalPrice:1000,stock:5,categoryId}});productId=product.id;
    await request('/cart','POST',{productId,quantity:1},auth.token);
    await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
    await send('Page.navigate',{url:`${base}/login`});await until('!!document.querySelector("input[name=email]")');
    await input('input[name=email]',email);await input('input[name=password]',password);
    await evaluate('document.querySelector("input[name=email]").closest("form").requestSubmit()');
    await until('!!sessionStorage.getItem("kt-token")');
    await send('Page.navigate',{url:`${base}/cart`});await until('!!document.querySelector(".shipping-address")');
    await until('!document.querySelector("[data-field=provinceCode] input").disabled');
    assert.equal(await evaluate('document.querySelector("[data-field=wardCode] input").disabled'),true);
    await evaluate('document.querySelector(".checkout-form").requestSubmit()');
    await until('document.querySelectorAll(".location-error").length>=3');
    const hanoi=current.provinces.find(p=>p.code==='01'),danang=current.provinces.find(p=>p.code==='48');
    await choose('provinceCode','Ha Noi',hanoi.name);
    await choose('wardCode','Ba Dinh',hanoi.wards.find(w=>w.name==='Phường Ba Đình').name);
    // Switching a parent clears its old child before the new request completes.
    await choose('provinceCode','Da Nang',danang.name);
    assert.equal(await evaluate('document.querySelector("[data-field=wardCode] input").value'), '');
    await until('!document.querySelector("[data-field=wardCode] input").disabled');
    await input('[data-field=wardCode] input','Ba Dinh');
    await until('!!document.querySelector("[data-field=wardCode] .location-no-results")');
    assert.equal(await evaluate('document.querySelectorAll("[data-field=wardCode] [role=option]").length'),0);
    await choose('provinceCode','Ha Noi',hanoi.name);
    const thanhxuan=hanoi.wards.find(w=>w.name==='Phường Thanh Xuân');assert.ok(thanhxuan);
    await choose('wardCode','Thanh Xuan',thanhxuan.name);
    await input('#shipping-address-line','Số 25 Nguyễn Trãi, tòa A, căn 302');
    await until('document.querySelector(".address-preview").textContent.includes("Phường Thanh Xuân")');
    await evaluate('document.querySelector(".shipping-address").scrollIntoView({block:"center"})');
    const desktop=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(new URL('desktop-address.png',output),Buffer.from(desktop.data,'base64'));
    await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
    assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true,'mobile checkout no overflow');
    await evaluate('document.querySelector(".shipping-address").scrollIntoView({block:"center"})');
    const mobile=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(new URL('mobile-address.png',output),Buffer.from(mobile.data,'base64'));
    // Test API failure and retry in the browser without disabling the local API permanently.
    await send('Network.enable');await send('Network.setBlockedURLs',{urls:['*addresses?*']});
    await evaluate('document.querySelectorAll(".address-modes button")[1].click()');
    await until('!!document.querySelector(".address-load-error")');
    await send('Network.setBlockedURLs',{urls:[]});
    await evaluate('document.querySelector(".address-load-error button").click()');
    await until('!document.querySelector(".address-load-error") && !document.querySelector("[data-field=provinceCode] input").disabled');
    const oldHanoi=historical.provinces.find(p=>p.code==='01'),oldDistrict=oldHanoi.districts.find(d=>d.name==='Quận Ba Đình');
    await choose('provinceCode','Ha Noi',oldHanoi.name);
    await choose('districtCode','Ba Dinh',oldDistrict.name);
    await choose('wardCode','Phuc Xa',oldDistrict.wards.find(w=>w.name==='Phường Phúc Xá').name);
    const oldOther=oldHanoi.districts.find(d=>d.code!==oldDistrict.code&&d.wards.length);
    await choose('districtCode',oldOther.name,oldOther.name);
    assert.equal(await evaluate('document.querySelector("[data-field=wardCode] input").value'),'');
    await choose('districtCode','Ba Dinh',oldDistrict.name);await choose('wardCode','Phuc Xa','Phường Phúc Xá');
    await evaluate('document.querySelector(".checkout-form").requestSubmit()');
    await until('document.querySelector(".location-error")?.textContent.includes("lịch sử")');
    await evaluate('document.querySelector(".historical-ack input").click();document.querySelector("input[name=confirm]").click();');
    await evaluate('document.querySelector("select[name=payment]").value="COD";document.querySelector(".checkout-form").requestSubmit()');
    await until('/\\/orders\\/\\d+\\/success/.test(location.pathname)');
    await until('document.body.textContent.includes("Địa chỉ lịch sử")');
    let orders=await request('/orders','GET',null,auth.token);assert.equal(orders.length,1);assert.equal(orders[0].addressVersion,historical.version);assert.equal(orders[0].districtCode,oldDistrict.code);assert.equal(orders[0].payment,'COD');
    await request('/cart','POST',{productId,quantity:1},auth.token);
    await send('Page.navigate',{url:`${base}/cart`});await until('!!document.querySelector(".shipping-address")');
    await choose('provinceCode','Ha Noi',hanoi.name);await choose('wardCode','Thanh Xuan',thanhxuan.name);await input('#shipping-address-line','Số 25 Nguyễn Trãi');
    await evaluate('document.querySelector("input[name=confirm]").click();document.querySelector(".checkout-form").requestSubmit()');
    await until('/\\/orders\\/\\d+\\/success/.test(location.pathname)');
    await until('document.body.textContent.includes("Số 25 Nguyễn Trãi, Phường Thanh Xuân, Thành phố Hà Nội")');
    orders=await request('/orders','GET',null,auth.token);assert.equal(orders.length,2);assert.equal(orders[0].addressVersion,current.version);assert.equal(orders[0].districtCode,null);assert.equal(orders[0].payment,'SIMULATED_PAID');
    await db.user.update({where:{id:userId},data:{role:'ADMIN'}});
    await send('Page.navigate',{url:`${base}/admin`});await until('!!document.querySelector(".admin-sidebar")');
    await evaluate('[...document.querySelectorAll(".admin-sidebar button")].find(b=>b.textContent==="Đơn hàng").click()');
    await until('document.body.textContent.includes("Số 25 Nguyễn Trãi, Phường Thanh Xuân, Thành phố Hà Nội")');
    assert.equal(await evaluate('document.body.textContent.includes("Địa chỉ lịch sử")'),true);
    console.log('PASS address browser: login, keyboard/no-accent lookup, parent resets, historical chain, empty validation, loading failure/retry, desktop/mobile, COD historical and current simulated checkout, saved snapshots and Admin address rendering');
  }finally{
    if(userId){await db.orderItem.deleteMany({where:{order:{userId}}});await db.order.deleteMany({where:{userId}});await db.cartItem.deleteMany({where:{userId}});await db.review.deleteMany({where:{userId}});await db.user.delete({where:{id:userId}});}
    if(productId)await db.product.delete({where:{id:productId}});if(categoryId)await db.category.delete({where:{id:categoryId}});
    await db.$disconnect();
  }
}