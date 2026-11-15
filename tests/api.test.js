import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { createApp } from '../server/app.js';
import { createAdmin } from '../server/database.js';
import { officialNames } from '../server/seed.js';

async function fixture(options = {}) {
  const dataDir = await mkdtemp(join(tmpdir(), 'xii-ips-api-'));
  const app = createApp({ dataDir, ...options });
  await createAdmin(app.locals.db, 'test-admin', 'a-long-test-password-459');
  const server = await new Promise((resolve) => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = async (path, { method = 'GET', body, headers = {}, raw = false, cookie, csrf } = {}) => {
    const result = await fetch(`${base}${path}`, { method, headers: { ...(body && !raw ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...(csrf ? { 'x-csrf-token': csrf } : {}), ...headers }, ...(body ? { body: raw ? body : JSON.stringify(body) } : {}) });
    const contentType = result.headers.get('content-type');
    return { status: result.status, headers: result.headers, body: contentType?.includes('application/json') ? await result.json() : await result.arrayBuffer() };
  };
  const login = async () => {
    const response = await request('/api/auth/login', { method: 'POST', body: { username: 'test-admin', password: 'a-long-test-password-459' } });
    assert.equal(response.status, 200);
    return { cookie: response.headers.get('set-cookie').split(';')[0], csrf: response.body.csrfToken };
  };
  const close = async () => {
    await new Promise((resolve) => server.close(resolve));
    app.locals.close();
    await rm(dataDir, { recursive: true, force: true });
  };
  return { app, dataDir, request, login, close };
}

test('API: exact class data, database persistence, auth, CSRF, CMS, moderation, upload, backup/restore', async (t) => {
  const f = await fixture();
  t.after(f.close);
  let auth;
  let content;
  let messageId;
  let uploadedUrl;
  let backup;
  await t.test('seeds all 32 official students in order and correct editorial pages', async () => {
    const result = await f.request('/api/content');
    assert.equal(result.status, 200);
    content = result.body;
    assert.deepEqual(content.students.map((s) => s.name), officialNames);
    assert.deepEqual(content.students.map((s) => s.id), Array.from({ length: 32 }, (_, i) => i + 1));
    assert.equal(content.teacher.name, 'Perdini Adma Sari, S.Pd.');
    assert.deepEqual(content.pages.map((p) => p.id), Array.from({ length: 11 }, (_, i) => i + 2));
    for (const page of [4, 5, 6]) assert.equal(content.memories.filter((m) => m.page === page).length, 3);
  });
  await t.test('protects every admin route and rejects cross-origin login', async () => {
    for (const [path, method] of [['/api/admin/content', 'GET'], ['/api/admin/content', 'PUT'], ['/api/admin/messages', 'GET'], ['/api/admin/upload', 'POST'], ['/api/admin/backup', 'GET'], ['/api/admin/restore', 'POST']]) {
      assert.equal((await f.request(path, { method, body: method === 'GET' ? undefined : {} })).status, 401);
    }
    assert.equal((await f.request('/api/auth/login', { method: 'POST', body: { username: 'test-admin', password: 'a-long-test-password-459' }, headers: { Origin: 'https://attacker.example' } })).status, 403);
  });
  await t.test('uses hashed passwords, HttpOnly cookies and server-side sessions', async () => {
    auth = await f.login();
    const result = await f.request('/api/auth/session', auth);
    assert.equal(result.body.username, 'test-admin');
    const raw = f.app.locals.db.prepare('SELECT password_hash,salt FROM admins').get();
    assert.equal(raw.password_hash.length, 128);
    assert.notEqual(raw.password_hash, 'a-long-test-password-459');
    assert.equal(raw.salt.length, 64);
    const login = await f.request('/api/auth/login', { method: 'POST', body: { username: 'test-admin', password: 'a-long-test-password-459' } });
    assert.match(login.headers.get('set-cookie'), /HttpOnly/);
    assert.match(login.headers.get('set-cookie'), /SameSite=Strict/);
    assert.notEqual(f.app.locals.db.prepare('SELECT token_hash FROM sessions LIMIT 1').get().token_hash, auth.cookie.split('=')[1]);
  });
  await t.test('rejects missing CSRF, invalid roster, unsafe asset URL and conflicting content versions', async () => {
    assert.equal((await f.request('/api/admin/content', { method: 'PUT', cookie: auth.cookie, body: { content } })).status, 403);
    const invalid = structuredClone(content); invalid.students.pop();
    assert.equal((await f.request('/api/admin/content', { method: 'PUT', ...auth, body: { content: invalid } })).status, 400);
    const malicious = structuredClone(content); malicious.teacher.photo = 'javascript:alert(1)';
    assert.equal((await f.request('/api/admin/content', { method: 'PUT', ...auth, body: { content: malicious } })).status, 400);
    const reordered = structuredClone(content); reordered.students.reverse();
    assert.equal((await f.request('/api/admin/content', { method: 'PUT', ...auth, body: { content: reordered } })).status, 400);
    content.cover.tagline = 'Our tested memory';
    const saved = await f.request('/api/admin/content', { method: 'PUT', ...auth, body: { content } });
    assert.equal(saved.status, 200);
    assert.equal(saved.body.version, 2);
    assert.equal((await f.request('/api/admin/content', { method: 'PUT', ...auth, body: { content } })).status, 409);
    content = saved.body;
  });
  await t.test('validates anonymous messages, holds pending messages for moderation and blocks duplicates', async () => {
    for (const body of [{ recipientId: 0, body: 'Hello' }, { recipientId: 1, body: ' ' }, { recipientId: 1, body: '<img onerror=alert(1)>' }, { recipientId: 1, body: 'x'.repeat(1001) }]) {
      assert.equal((await f.request('/api/messages', { method: 'POST', body })).status, 400);
    }
    const pending = await f.request('/api/messages', { method: 'POST', body: { recipientId: 32, body: 'Terima kasih sudah menjadi teman yang baik.', website: '' } });
    assert.equal(pending.status, 201);
    messageId = pending.body.id;
    assert.equal(pending.body.status, 'pending');
    assert.equal((await f.request('/api/messages')).body.messages.length, 0);
    assert.equal((await f.request('/api/admin/messages', auth)).body.messages[0].recipientName, 'ZASKIA');
  });
  await t.test('moderates, hides and re-approves a message without exposing sender identity', async () => {
    assert.equal((await f.request(`/api/admin/messages/${messageId}`, { method: 'PATCH', ...auth, body: { status: 'approved' } })).status, 200);
    let publicMessages = (await f.request('/api/messages')).body.messages;
    assert.equal(publicMessages.length, 1);
    assert.equal(publicMessages[0].recipientId, 32);
    assert.deepEqual(Object.keys(publicMessages[0]).sort(), ['body', 'createdAt', 'id', 'recipientId', 'recipientName']);
    await f.request(`/api/admin/messages/${messageId}`, { method: 'PATCH', ...auth, body: { status: 'hidden' } });
    assert.equal((await f.request('/api/messages')).body.messages.length, 0);
    await f.request(`/api/admin/messages/${messageId}`, { method: 'PATCH', ...auth, body: { status: 'approved' } });
  });
  await t.test('re-encodes images safely, strips metadata, serves WebP and rejects disguised or unsupported uploads', async () => {
    const png = await sharp({ create: { width: 80, height: 120, channels: 3, background: '#b2bc9f' } }).png().toBuffer();
    const form = new FormData(); form.set('file', new Blob([png], { type: 'image/png' }), '../../portrait.png');
    const result = await f.request('/api/admin/upload', { method: 'POST', ...auth, body: form, raw: true });
    assert.equal(result.status, 201);
    uploadedUrl = result.body.url;
    assert.match(uploadedUrl, /^\/uploads\/[a-f0-9-]{36}\.webp$/);
    const file = await f.request(uploadedUrl);
    assert.equal(file.status, 200);
    assert.equal(file.headers.get('content-type'), 'image/webp');
    const metadata = await sharp(Buffer.from(file.body)).metadata();
    assert.equal(metadata.exif, undefined);
    const fake = new FormData(); fake.set('file', new Blob(['<svg onload="alert(1)"></svg>'], { type: 'image/png' }), 'fake.png');
    assert.equal((await f.request('/api/admin/upload', { method: 'POST', ...auth, body: fake, raw: true })).status, 400);
    const svg = new FormData(); svg.set('file', new Blob(['<svg/>'], { type: 'image/svg+xml' }), 'file.svg');
    assert.equal((await f.request('/api/admin/upload', { method: 'POST', ...auth, body: svg, raw: true })).status, 400);
  });
  await t.test('backs up content, messages and asset bytes; rejects malformed restore; restores transactionally', async () => {
    content.teacher.photo = uploadedUrl;
    const saved = await f.request('/api/admin/content', { method: 'PUT', ...auth, body: { content } }); content = saved.body;
    const exported = await f.request('/api/admin/backup', auth);
    assert.equal(exported.status, 200);
    backup = exported.body;
    assert.equal(backup.format, 'xii-ips-yearbook/v1');
    assert.equal(backup.assets.length, 1);
    assert.equal(backup.messages[0].status, 'approved');
    assert.equal((await f.request('/api/admin/restore', { method: 'POST', ...auth, body: { backup: { ...backup, assets: [{ name: '../hack.js', data: 'YWJj' }] } } })).status, 400);
    content.teacher.name = 'Perubahan sementara';
    content = (await f.request('/api/admin/content', { method: 'PUT', ...auth, body: { content } })).body;
    await f.request(`/api/admin/messages/${messageId}`, { method: 'DELETE', ...auth });
    assert.equal((await f.request('/api/admin/restore', { method: 'POST', ...auth, body: { backup } })).status, 200);
    const restored = (await f.request('/api/content')).body;
    assert.equal(restored.teacher.name, 'Perdini Adma Sari, S.Pd.');
    assert.equal(restored.teacher.photo, uploadedUrl);
    assert.equal((await f.request('/api/messages')).body.messages.length, 1);
  });
  await t.test('persists data when the database is reopened and invalidates logout sessions', async () => {
    const { openDatabase } = await import('../server/database.js');
    const db = openDatabase(f.dataDir);
    assert.equal(JSON.parse(db.prepare('SELECT json FROM content WHERE id=1').get().json).cover.tagline, 'Our tested memory');
    db.close();
    assert.equal((await f.request('/api/auth/logout', { method: 'POST', ...auth })).status, 200);
    assert.equal((await f.request('/api/admin/content', auth)).status, 401);
  });
});

test('API: persistent login rate limiting, anonymous throttling, duplicate protection and session expiration', async (t) => {
  let time = Date.now();
  const f = await fixture({ loginLimit: 2, messageLimit: 3, now: () => time });
  t.after(f.close);
  const badLogin = { method: 'POST', body: { username: 'test-admin', password: 'wrong' } };
  assert.equal((await f.request('/api/auth/login', badLogin)).status, 401);
  assert.equal((await f.request('/api/auth/login', badLogin)).status, 401);
  assert.equal((await f.request('/api/auth/login', badLogin)).status, 429);
  time += 16 * 60 * 1000;
  const auth = await f.login();
  const msg = { method: 'POST', body: { recipientId: 1, body: 'A kind test message.' } };
  assert.equal((await f.request('/api/messages', msg)).status, 201);
  assert.equal((await f.request('/api/messages', msg)).status, 409);
  assert.equal((await f.request('/api/messages', { method: 'POST', body: { recipientId: 2, body: 'Another kind message.' } })).status, 201);
  assert.equal((await f.request('/api/messages', msg)).status, 429);
  time += 9 * 60 * 60 * 1000;
  assert.equal((await f.request('/api/auth/session', auth)).status, 401);
});
