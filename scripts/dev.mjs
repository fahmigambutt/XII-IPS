import { spawn } from 'node:child_process';
import { createApp } from '../server/app.js';
const app = createApp();
const server = await new Promise(resolve => { const api = app.listen(0, '127.0.0.1', () => resolve(api)); });
const apiURL = `http://127.0.0.1:${server.address().port}`;
console.log(`XII IPS API: ${apiURL} (port otomatis, database di data/)`);
const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js'], { stdio: 'inherit', env: { ...process.env, YEARBOOK_API_URL: apiURL } });
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true; vite.kill();
  server.close(() => { app.locals.close(); process.exitCode = code; });
}
process.on('SIGINT', () => stop()); process.on('SIGTERM', () => stop());
vite.on('exit', code => stop(code || 0)); vite.on('error', error => { console.error(error.message); stop(1); });
