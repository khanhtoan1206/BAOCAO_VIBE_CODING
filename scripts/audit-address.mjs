import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
const before=new Database(fileURLToPath(new URL('backups/pre-address-20261024.db',root)),{readonly:true});
const after=new Database(fileURLToPath(new URL('backend/prisma/dev.db',root)),{readonly:true});
try{
  for(const table of ['Product','Category','User','Order','OrderItem','CartItem','Review']){
    const rows=before.prepare(`SELECT * FROM [${table}]`).all();
    const total=after.prepare(`SELECT COUNT(*) AS n FROM [${table}]`).get().n;
    if(total!==rows.length)console.log(`NOTICE ${table}: ${total-rows.length} additional rows since backup; not removed by audit.`);
    for(const old of rows){const now=after.prepare(`SELECT * FROM [${table}] WHERE id=?`).get(old.id);assert.ok(now);for(const field of Object.keys(old))assert.deepEqual(now[field],old[field],`${table}.${old.id}.${field}`);if(table==='Order'){assert.equal(now.fullAddress,old.address);assert.equal(now.addressVersion,'legacy-free-text');assert.equal(now.provinceCode,null);}}
    console.log(`PASS unchanged ${table}: ${rows.length} rows`);
  }
  assert.equal(after.prepare("SELECT COUNT(*) n FROM User WHERE email LIKE 'address-browser-%@test.local'").get().n,0);
  assert.equal(after.prepare("SELECT COUNT(*) n FROM Product WHERE name LIKE 'Address Browser %'").get().n,0);
  assert.equal(after.prepare("SELECT COUNT(*) n FROM Category WHERE name LIKE 'Address Browser %'").get().n,0);
  console.log('PASS address migration preserved every original field; legacy order snapshots backfilled; browser fixtures removed. New non-test records are preserved.');
}finally{before.close();after.close();}