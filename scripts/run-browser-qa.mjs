import { spawn } from 'node:child_process';
for (const script of ['scripts/browser-qa.mjs', 'scripts/admin-qa.mjs']) {
  const code = await new Promise(resolve => { const child = spawn(process.execPath, [script], { stdio: 'inherit' }); child.on('exit', resolve); child.on('error', () => resolve(1)); });
  if (code) { process.exitCode = code; break; }
}
