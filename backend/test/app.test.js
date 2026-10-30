import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { env } from '../src/config/env.js';

let server;
let base;
before(async () => {
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); }));

test('health checks the database and returns service readiness', async () => {
  const response = await fetch(`${base}/api/health`);
  assert.equal(response.status, 200);
  const { data } = await response.json();
  assert.equal(data.status, 'ok');
  assert.equal(data.service, 'kt-shop-api');
  assert.equal(data.database, 'connected');
  assert.ok(Number.isFinite(Date.parse(data.timestamp)));
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-powered-by'), null);
});
test('unknown API returns JSON 404', async () => {
  const response = await fetch(`${base}/api/missing`);
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error.code, 'NOT_FOUND');
});
test('invalid JSON returns 400 without stack traces', async () => {
  const response = await fetch(`${base}/api/health`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
  assert.equal(response.status, 400);
  assert.deepEqual(Object.keys(await response.json()), ['error']);
});
test('oversized body returns 413', async () => {
  const response = await fetch(`${base}/api/health`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: 'a'.repeat(110000) }) });
  assert.equal(response.status, 413);
});
test('configured frontend origin is allowed', async () => {
  const response = await fetch(`${base}/api/health`, { headers: { Origin: env.frontendOrigin } });
  assert.equal(response.headers.get('access-control-allow-origin'), env.frontendOrigin);
});
test('other origins do not receive CORS permission', async () => {
  const response = await fetch(`${base}/api/health`, { headers: { Origin: 'https://untrusted.example' } });
  assert.equal(response.headers.get('access-control-allow-origin'), null);
});
test('preflight supports authorization header', async () => {
  const response = await fetch(`${base}/api/health`, { method: 'OPTIONS', headers: { Origin: env.frontendOrigin } });
  assert.equal(response.status, 204);
  assert.match(response.headers.get('access-control-allow-headers'), /Authorization/);
});
test('SQLite native driver executes an in-memory query on Windows', () => {
  const db = new Database(':memory:');
  try { assert.equal(db.prepare('SELECT 1 AS value').get().value, 1); }
  finally { db.close(); }
});
test('bcrypt and JWT dependencies work (not an authentication API test)', async () => {
  const hash = await bcrypt.hash('test-password', 4);
  assert.ok(await bcrypt.compare('test-password', hash));
  assert.equal(await bcrypt.compare('wrong', hash), false);
  const secret = 'test-only-secret';
  const token = jwt.sign({ sub: 'test-user' }, secret, { expiresIn: '1m' });
  assert.equal(jwt.verify(token, secret).sub, 'test-user');
});