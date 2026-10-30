import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:net';

const root = new URL('../', import.meta.url);
async function availablePort() {
  const server = createServer().listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}
const apiPort = await availablePort();
const frontendPort = await availablePort();
const processes = [];
function start(args, directory, env = {}) {
  const child = spawn(process.execPath, args, { cwd: fileURLToPath(new URL(directory, root)), env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.on('data', (data) => process.stdout.write(data));
  child.stderr.on('data', (data) => process.stderr.write(data));
  processes.push(child);
  return child;
}
async function waitFor(url, child) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) throw new Error(`Process exited: ${child.exitCode}`);
    try { const response = await fetch(url); if (response.ok) return response; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Timeout: ${url}`);
}
try {
  const backend = start(['src/server.js'], 'backend/', { PORT: String(apiPort), HOST: '127.0.0.1' });
  await waitFor(`http://127.0.0.1:${apiPort}/api/health`, backend);
  const frontend = start([fileURLToPath(new URL('node_modules/vite/bin/vite.js', root)), '--host', '127.0.0.1', '--port', String(frontendPort)], 'frontend/', { BACKEND_PROXY_TARGET: `http://127.0.0.1:${apiPort}` });
  const base = `http://127.0.0.1:${frontendPort}`;
  const home = await waitFor(base, frontend);
  assert.match(await home.text(), /KT-SHOP/);
  const proxy = await fetch(`${base}/api/health`);
  assert.equal((await proxy.json()).data.service, 'kt-shop-api');
  const route = await fetch(`${base}/system`);
  assert.equal(route.status, 200);
  assert.match(await route.text(), /id="root"/);
  const module = await fetch(`${base}/src/main.tsx`);
  assert.equal(module.status, 200);
  assert.match(await module.text(), /App/);
  console.log('PASS: frontend HTTP, API proxy, SPA deep-link refresh, TSX transform');
} finally {
  await Promise.all(processes.map(async (child) => {
    if (child.exitCode !== null) return;
    const exited = once(child, 'exit');
    child.kill();
    await exited;
  }));
}