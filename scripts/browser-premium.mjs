import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createServer} from 'node:net';
import {fileURLToPath} from 'node:url';
import {mkdirSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url),children=[],pending=new Map(),errors=[];
let socket,sequence=0;
async function port(){const s=createServer().listen(0,'127.0.0.1');await once(s,'listening');const p=s.address().port;await new Promise(r=>s.close(r));return p;}
function start(command,args,cwd,env={}){const child=spawn(command,args,{cwd,env:{...process.env,...env},stdio:'ignore'});children.push(child);return child;}
async function wait(url){for(let i=0;i<150;i++){try{const r=await fetch(url);if(r.ok)return r;}catch{}await new Promise(r=>setTimeout(r,200));}throw Error(`Timeout ${url}`);}
function send(method,params={}){return new Promise((resolve,reject)=>{const id=++sequence;const timeout=setTimeout(()=>{pending.delete(id);reject(Error(`Timeout ${method}`));},20000);pending.set(id,{resolve,reject,timeout});socket.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));return result.result.value;}
async function until(expression){for(let i=0;i<100;i++){if(await evaluate(expression))return;await new Promise(r=>setTimeout(r,150));}throw Error(`Condition timeout: ${expression}`);}
const profile=mkdtempSync(join(tmpdir(),'kt-shop-browser-'));
const output=new URL('docs/screenshots/',root);mkdirSync(output,{recursive:true});
try{
  const apiPort=await port(),frontPort=await port(),debugPort=await port();
  start(process.execPath,['src/server.js'],fileURLToPath(new URL('backend/',root)),{PORT:String(apiPort),HOST:'127.0.0.1'});
  await wait(`http://127.0.0.1:${apiPort}/api/health`);
  start(process.execPath,[fileURLToPath(new URL('node_modules/vite/bin/vite.js',root)),'--host','127.0.0.1','--port',String(frontPort)],fileURLToPath(new URL('frontend/',root)),{BACKEND_PROXY_TARGET:`http://127.0.0.1:${apiPort}`});
  const base=`http://127.0.0.1:${frontPort}`;await wait(base);
  start('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--disable-gpu','--no-first-run',`--remote-debugging-port=${debugPort}`,`--user-data-dir=${profile}`,'about:blank'],fileURLToPath(root));
  const targets=await (await wait(`http://127.0.0.1:${debugPort}/json`)).json();
  socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
  socket.addEventListener('message',event=>{const message=JSON.parse(event.data);if(message.id&&pending.has(message.id)){const request=pending.get(message.id);pending.delete(message.id);clearTimeout(request.timeout);message.error?request.reject(Error(JSON.stringify(message.error))):request.resolve(message.result);}if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails);});
  await send('Page.enable');await send('Runtime.enable');
  if(process.env.ADDRESS_BROWSER_TEST==='1'){
    const {testAddressFlow}=await import('./browser-address-flow.mjs');
    await testAddressFlow({base,send,evaluate,until,output});
  }
  for(const [label,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:label==='mobile'});
    await send('Page.navigate',{url:base});await until('document.querySelectorAll(".product-card").length >= 60');
    await evaluate('document.fonts.ready');
    await until('[...document.images].filter(i=>i.loading!=="lazy").every(i=>i.complete)');
    assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'),true,`${label}: no horizontal overflow`);
    assert.equal(await evaluate('document.querySelectorAll(".category-grid a").length >= 6'),true);
    await evaluate('document.querySelector(".header-search input").focus()');
    await evaluate(`(()=>{const i=document.querySelector('.header-search input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,'Samsung');i.dispatchEvent(new Event('input',{bubbles:true}));})()`);
    await until('document.querySelectorAll(".search-suggestions a").length > 0');
    await evaluate('document.querySelector(".header-search input").dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true}))');
    await until('document.querySelector(".search-suggestions")===null');
    const screenshot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(new URL(`${label}-home.png`,output),Buffer.from(screenshot.data,'base64'));
    await send('Page.navigate',{url:`${base}/?brand=Samsung&stock=in&sort=price_asc`});await until('document.querySelectorAll(".product-card").length > 0');
    assert.equal(await evaluate('[...document.querySelectorAll(".product-info .eyebrow")].every(e=>e.textContent==="Samsung")'),true);
    await evaluate('document.querySelector(".product-card a").click()');await until('!!document.querySelector(".gallery-main img")');
    assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'),true,`${label}: detail no overflow`);
    await evaluate('document.querySelector(".gallery-main").click()');await until('!!document.querySelector("[role=dialog]")');
    await evaluate('document.querySelector("[role=dialog] button").click()');
    assert.equal(await evaluate('document.querySelector("[role=dialog]")===null'),true);
    const detail=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(new URL(`${label}-product.png`,output),Buffer.from(detail.data,'base64'));
    await send('Page.navigate',{url:`${base}/admin`});await until('location.pathname==="/login"');
    console.log(`PASS ${label}: homepage, search suggestions, brand/stock filter, product gallery, zoom, overflow and admin login guard`);
  }
  assert.equal(errors.length,0,JSON.stringify(errors));console.log('PASS no uncaught browser exceptions. Screenshots saved in docs/screenshots.');
}finally{
  socket?.close();for(const p of pending.values())clearTimeout(p.timeout);
  await Promise.all(children.reverse().map(async c=>{if(c.exitCode!==null)return;const closed=once(c,'exit');c.kill();await closed;}));
  try{rmSync(profile,{recursive:true,force:true});}catch{}
}