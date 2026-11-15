import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { createApp } from '../server/app.js';
import { createAdmin, checkPassword } from '../server/database.js';

test('explicit requested account bootstrap and authenticated account replacement', async (t) => {
  const dataDir=await mkdtemp(join(tmpdir(),'yearbook-account-'));
  const app=createApp({dataDir});
  const db=app.locals.db;
  await assert.rejects(createAdmin(db,'admin','admin'),/12–256/);
  await assert.rejects(createAdmin(db,'someone','admin',{allowRequestedBootstrap:true}),/12–256/);
  await createAdmin(db,'admin','admin',{allowRequestedBootstrap:true});
  await createAdmin(db,'existing','existing-long-password');
  const row=db.prepare('SELECT * FROM admins WHERE username=?').get('admin');
  assert.notEqual(row.password_hash,'admin');assert.equal(await checkPassword('admin',row.salt,row.password_hash),true);
  const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
  const base=`http://127.0.0.1:${server.address().port}`;
  t.after(async()=>{await new Promise(resolve=>server.close(resolve));app.locals.close();assert.equal(dirname(resolve(dataDir)),resolve(tmpdir()));await rm(dataDir,{recursive:true,force:true});});
  async function request(path,{method='GET',body,cookie,csrf}={}){
    const response=await fetch(base+path,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{}),...(csrf?{'x-csrf-token':csrf}:{})},...(body?{body:JSON.stringify(body)}:{})});
    return {status:response.status,body:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]};
  }
  async function login(username='admin',password='admin'){
    const response=await request('/api/auth/login',{method:'POST',body:{username,password}});
    return {...response,csrf:response.body.csrfToken};
  }
  const current=await login(),second=await login();assert.equal(current.status,200);
  const body={currentPassword:'admin',newUsername:'class-admin',newPassword:'my-new-admin-password-397'};
  assert.equal((await request('/api/admin/account',{method:'POST',body})).status,401);
  assert.equal((await request('/api/admin/account',{method:'POST',cookie:current.cookie,body})).status,403);
  assert.equal((await request('/api/admin/account',{method:'POST',cookie:current.cookie,csrf:current.csrf,body:{...body,currentPassword:'wrong'}})).status,401);
  assert.equal((await request('/api/admin/account',{method:'POST',cookie:current.cookie,csrf:current.csrf,body:{...body,newPassword:'short'}})).status,400);
  assert.equal((await request('/api/admin/account',{method:'POST',cookie:current.cookie,csrf:current.csrf,body:{...body,newUsername:'existing'}})).status,409);
  const updated=await request('/api/admin/account',{method:'POST',cookie:current.cookie,csrf:current.csrf,body});
  assert.equal(updated.status,200);assert.equal(updated.body.username,'class-admin');assert.ok(updated.cookie);assert.notEqual(updated.body.csrfToken,current.csrf);assert.notEqual(updated.cookie,current.cookie);
  assert.equal((await request('/api/auth/session',{cookie:current.cookie})).status,401);
  assert.equal((await request('/api/auth/session',{cookie:second.cookie})).status,401);
  assert.equal((await request('/api/auth/session',{cookie:updated.cookie})).body.username,'class-admin');
  assert.equal((await login()).status,401);
  assert.equal((await login('class-admin','admin')).status,401);
  assert.equal((await login('class-admin',body.newPassword)).status,200);
  assert.equal(db.prepare('SELECT username FROM admins WHERE username=?').get('admin'),undefined);
  const newRow=db.prepare('SELECT * FROM admins WHERE username=?').get('class-admin');assert.equal(await checkPassword(body.newPassword,newRow.salt,newRow.password_hash),true);
});
