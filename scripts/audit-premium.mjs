import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
const current=new Database(fileURLToPath(new URL('backend/prisma/dev.db',root)),{readonly:true});
const before=new Database(fileURLToPath(new URL('backups/pre-premium-20261024.db',root)),{readonly:true});
try{
  for(const table of ['Product','User','Order','OrderItem','CartItem','Review','Category']){
    const oldRows=before.prepare(`SELECT * FROM [${table}]`).all();
    for(const old of oldRows){const row=current.prepare(`SELECT * FROM [${table}] WHERE id=?`).get(old.id);assert.ok(row,`${table} ${old.id} still exists`);for(const key of Object.keys(old))assert.deepEqual(row[key],old[key],`${table} ${old.id}.${key} unchanged`);}
    console.log(`PASS preserved ${table}: ${oldRows.length} existing rows`);
  }
  const demos=current.prepare('SELECT * FROM Product WHERE demo=1').all();assert.equal(demos.length,120);
  const expected={phone:30,gaming:12,office:13,tablet:15,audio:20,charging:15,peripheral:15};
  for(const [segment,count] of Object.entries(expected))assert.equal(demos.filter(p=>p.segment===segment).length,count);
  const slugs=new Set(demos.map(p=>p.slug));assert.equal(slugs.size,120);
  const imageContents=new Set();
  for(const p of demos){assert.ok(p.brand&&p.warranty);assert.ok(p.originalPrice>=p.price);assert.ok(Object.keys(JSON.parse(p.specifications)).length>=4);for(const src of JSON.parse(p.gallery)){const path=new URL(`frontend/public${src}`,root);assert.ok(existsSync(path),src);const svg=readFileSync(path,'utf8');assert.match(svg,/<svg/);assert.match(svg,/<\/svg>/);imageContents.add(svg);}}
  assert.equal(imageContents.size,240);
  console.log('PASS 120 demos, exact allocation, unique slugs, 240 unique local SVG images, metadata and original data preservation');
}finally{current.close();before.close();}