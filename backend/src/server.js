import { app } from './app.js';
import { env } from './config/env.js';

const server = app.listen(env.port, env.host, () => {
  console.log(`KT-SHOP API listening at http://${env.host}:${env.port}`);
});
server.on('error', (error) => { console.error(`Cannot start API: ${error.message}`); process.exitCode = 1; });
function shutdown() {
  server.close(() => { process.exitCode = 0; });
  server.closeIdleConnections();
  setTimeout(() => process.exit(1), 5000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);