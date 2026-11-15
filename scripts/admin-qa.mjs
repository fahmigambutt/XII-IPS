import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import express from 'express';
import sharp from 'sharp';
import { createServer } from 'vite';
import { chromium } from '@playwright/test';
import { createApp } from '../server/app.js';
import { createAdmin } from '../server/database.js';
import { officialNames } from '../server/seed.js';

// Isolated integration QA: no default admin account or project database is changed.
const projectDir = fileURLToPath(new URL('../', import.meta.url));
const outputDir = join(projectDir, 'docs', 'qa');
const dataDir = await mkdtemp(join(tmpdir(), 'xii-ips-admin-qa-'));
const username = 'qa-admin';
const password = randomBytes(24).toString('base64url');
const results = { suite: 'isolated-admin-browser', startedAt: new Date().toISOString(), browser: 'Chrome / Chromium, headless', checks: [], screenshots: [], browserErrors: [], confirmations: [] };
let backend, vite, server, browser;

async function check(name, work) {
  const started = performance.now();
  try {
    await work();
    results.checks.push({ name, status: 'pass', durationMs: Math.round(performance.now() - started) });
    console.log(`PASS ${name}`);
  } catch (error) {
    results.checks.push({ name, status: 'fail', durationMs: Math.round(performance.now() - started), error: error.message });
    throw error;
  }
}

async function launchBrowser() {
  if (process.env.BROWSER_EXECUTABLE) return chromium.launch({ executablePath: process.env.BROWSER_EXECUTABLE, headless: true });
  try { return await chromium.launch({ channel: 'chrome', headless: true }); }
  catch { return chromium.launch({ headless: true }); }
}

try {
  await mkdir(outputDir, { recursive: true });
  backend = createApp({ dataDir });
  await createAdmin(backend.locals.db, username, password);
  vite = await createServer({ root: projectDir, configFile: false, appType: 'custom', server: { middlewareMode: true, hmr: false } });
  const fixture = express();
  fixture.get('/admin-qa', (req, res) => res.type('html').send(`<!doctype html><html lang="id"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Isolated admin QA</title></head><body style="margin:0"><div id="admin"></div><script type="module">
    import '/node_modules/@fontsource/dm-sans/400.css';
    import '/node_modules/@fontsource/dm-sans/500.css';
    import '/node_modules/@fontsource/cormorant-garamond/400.css';
    import '/node_modules/@fontsource/cormorant-garamond/500.css';
    import { mountAdmin } from '/src/admin.js';
    window.savedSnapshots = [];
    window.admin = await mountAdmin(document.querySelector('#admin'), {onSaved: content => window.savedSnapshots.push(content)});
  </script></body></html>`));
  fixture.use(vite.middlewares);
  fixture.use(backend);
  server = await new Promise(done => { const listener = fixture.listen(0, '127.0.0.1', () => done(listener)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(15000);
  page.on('pageerror', error => results.browserErrors.push(error.message));
  page.on('dialog', async dialog => { results.confirmations.push(dialog.message()); await dialog.accept(); });
  const nav = section => page.locator(`.ad-sidebar [data-section="${section}"]`).click();
  const publicContent = async () => (await fetch(`${base}/api/content`)).json();
  const publicMessages = async () => (await fetch(`${base}/api/messages`)).json();
  const save = async () => {
    await page.getByRole('button', { name: 'Simpan perubahan', exact: true }).click();
    await page.getByText('Perubahan berhasil disimpan dan diterapkan ke yearbook.').waitFor();
  };
  async function publicMessage(body) {
    const response = await fetch(`${base}/api/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipientId: 1, body }) });
    assert.equal(response.status, 201);
    return response.json();
  }
  const png = await sharp({ create: { width: 240, height: 320, channels: 3, background: '#98a577' } }).png().toBuffer();
  let uploadedPhoto;

  await check('Session protection, labeled login and password visibility', async () => {
    await page.goto(`${base}/admin-qa`);
    await page.getByLabel('Username', { exact: true }).fill(username);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.locator('[data-action="show-password"]').click();
    assert.equal(await page.getByLabel('Password', { exact: true }).getAttribute('type'), 'text');
    await page.locator('[data-action="show-password"]').click();
    assert.equal((await page.request.get(`${base}/api/admin/content`)).status(), 401);
    await page.locator('[data-admin-login] button[type="submit"]').click();
    await page.getByRole('heading', { name: 'Ringkasan', exact: true }).waitFor();
    assert.equal((await page.request.get(`${base}/api/auth/session`)).status(), 200);
  });

  await check('All nine CMS menus render', async () => {
    for (const section of ['overview', 'cover', 'teacher', 'students', 'memories', 'messages', 'pages', 'settings', 'backup']) {
      await nav(section);
      assert.equal(await page.locator('.ad-notice.is-error:visible').count(), 0);
      assert.equal(await page.locator('.ad-header h1').count(), 1);
    }
  });

  await check('Unsaved cover preview, unload protection and persistent save', async () => {
    await nav('cover');
    await page.getByLabel('Tagline', { exact: true }).fill('OUR TESTED STORY');
    assert.equal(await page.evaluate(() => window.admin.hasUnsavedChanges), true);
    assert.equal(await page.evaluate(() => { const event = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(event); return event.defaultPrevented; }), true);
    await page.getByRole('button', { name: 'Preview', exact: true }).click();
    await page.locator('dialog[open]').waitFor();
    assert.equal(await page.locator('.ad-preview-cover small').textContent(), 'OUR TESTED STORY');
    assert.notEqual((await publicContent()).cover.tagline, 'OUR TESTED STORY');
    await page.getByRole('button', { name: 'Tutup preview' }).click();
    await save();
    assert.equal((await publicContent()).cover.tagline, 'OUR TESTED STORY');
    assert.equal(await page.evaluate(() => window.admin.hasUnsavedChanges), false);
  });

  await check('Cancel discards drafts and teacher edits persist', async () => {
    await nav('teacher');
    await page.getByLabel('Mata pelajaran', { exact: true }).fill('Draft yang dibatalkan');
    await page.locator('[data-action="cancel"]').click();
    assert.equal(await page.getByLabel('Mata pelajaran', { exact: true }).inputValue(), '');
    await page.getByLabel('Mata pelajaran', { exact: true }).fill('Ilmu Pengetahuan Sosial');
    await save();
    assert.equal((await publicContent()).teacher.subject, 'Ilmu Pengetahuan Sosial');
  });

  await check('All 32 official students, search and fixed selection', async () => {
    await nav('students');
    assert.deepEqual(await page.locator('.ad-student-item strong').allTextContents(), officialNames);
    await page.getByLabel('Cari siswa', { exact: true }).fill('ZASKIA');
    assert.equal(await page.locator('.ad-student-item').count(), 1);
    await page.locator('.ad-student-item').click();
    assert.equal(await page.getByLabel('Nama lengkap', { exact: true }).inputValue(), 'ZASKIA');
  });

  await check('Real PNG upload, server WebP and zero-percent crop', async () => {
    await page.locator('[data-upload="students.31.photo"]').setInputFiles({ name: 'qa-placeholder.png', mimeType: 'image/png', buffer: png });
    await page.getByText('File diunggah. Klik Simpan perubahan untuk menerapkannya ke buku.').waitFor();
    await page.locator('[data-crop][data-axis="0"]').fill('0');
    await save();
    const student = (await publicContent()).students[31];
    uploadedPhoto = student.photo;
    assert.match(uploadedPhoto, /^\/uploads\/.+\.webp$/);
    assert.equal(student.position, '0% 50%');
    assert.equal(await page.locator('[data-crop][data-axis="0"]').inputValue(), '0');
    const asset = await fetch(`${base}${uploadedPhoto}`);
    assert.equal(asset.status, 200);
    assert.match(asset.headers.get('content-type'), /image\/webp/);
  });

  await check('Gallery add, caption and editorial page assignment', async () => {
    await nav('memories');
    await page.locator('[data-action="add-memory"]').click();
    await page.getByLabel('Caption', { exact: true }).fill('A test memory');
    await page.getByLabel('Tampilkan di halaman', { exact: true }).selectOption('6');
    await save();
    const memory = (await publicContent()).memories.at(-1);
    assert.equal(memory.caption, 'A test memory');
    assert.equal(memory.page, 6);
  });

  await check('Bulk upload and gallery order', async () => {
    await page.locator('[data-bulk-upload]').setInputFiles([{ name: 'qa-one.png', mimeType: 'image/png', buffer: png }, { name: 'qa-two.png', mimeType: 'image/png', buffer: png }]);
    await page.getByText('2 foto diunggah. Atur caption/halaman, lalu Simpan perubahan.').waitFor();
    await save();
    const before = (await publicContent()).memories;
    assert.equal(before.length, 12);
    assert.equal(before.filter(memory => memory.photo).length, 2);
    await page.locator('[data-action="memory-up"]').click();
    await save();
    const after = (await publicContent()).memories;
    assert(after.find(m => m.caption === 'qa-two').order < after.find(m => m.caption === 'qa-one').order);
  });

  await check('Anonymous messages remain private until moderation', async () => {
    const sent = await publicMessage('Semoga sukses selalu untuk semuanya.');
    assert.equal(sent.status, 'pending');
    assert.equal((await publicMessages()).messages.length, 0);
    await nav('messages');
    await page.locator('[data-action="refresh-messages"]').click();
    await page.locator('[data-moderate][data-status="approved"]').click();
    await page.getByText('Status pesan berhasil diperbarui.').waitFor();
    assert.equal((await publicMessages()).messages.length, 1);
    await page.locator('[data-moderate][data-status="hidden"]').click();
    await page.getByText('Status pesan berhasil diperbarui.').waitFor();
    assert.equal((await publicMessages()).messages.length, 0);
    await page.locator('[data-moderate][data-status="rejected"]').click();
    await page.getByText('Status pesan berhasil diperbarui.').waitFor();
    assert.equal((await publicMessages()).messages.length, 0);
    await page.locator('[data-delete-message]').click();
    await page.getByText('Pesan dihapus.', { exact: true }).waitFor();
    assert.equal((await page.request.get(`${base}/api/admin/messages`)).status(), 200);
    assert.equal((await (await page.request.get(`${base}/api/admin/messages`)).json()).messages.length, 0);
  });

  await check('Farewell text and page ornaments persist', async () => {
    await nav('pages');
    await page.locator('[data-page-select]').selectOption('12');
    await page.getByLabel('Teks perpisahan', { exact: true }).fill('Semoga kenangan baik tetap bersama kita.');
    await page.getByLabel('Ornamen', { exact: true }).selectOption('none');
    await save();
    const content = await publicContent();
    assert.equal(content.farewell.text, 'Semoga kenangan baik tetap bersama kita.');
    assert.equal(content.pages.find(p => p.id === 12).ornament, 'none');
  });

  await check('Quality and message settings persist', async () => {
    await nav('settings');
    await page.getByLabel('Kualitas visual', { exact: true }).selectOption('lite');
    await page.locator('[data-path="settings.messagesEnabled"]').uncheck();
    await save();
    const content = await publicContent();
    assert.equal(content.settings.quality, 'lite');
    assert.equal(content.settings.messagesEnabled, false);
  });

  await check('Backup download and confirmed restore with uploaded assets', async () => {
    await nav('backup');
    const event = page.waitForEvent('download');
    await page.locator('[data-action="backup"]').click();
    const download = await event;
    assert(download.suggestedFilename().startsWith('xii-ips-backup-'));
    const backup = JSON.parse(await readFile(await download.path(), 'utf8'));
    assert.equal(backup.content.students.length, 32);
    assert(backup.assets.length >= 3);
    await nav('cover');
    await page.getByLabel('Judul yearbook', { exact: true }).fill('Temporarily changed');
    await save();
    await nav('backup');
    await page.locator('[data-restore-file]').setInputFiles({ name: 'qa-backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
    await page.getByText('Data berhasil dipulihkan dari backup.').waitFor();
    assert.equal((await publicContent()).cover.title, 'XII IPS');
    assert.equal((await fetch(`${base}${uploadedPhoto}`)).status, 200);
    assert(results.confirmations.some(message => message.startsWith('RESTORE')));
  });

  await check('Student and message JSON exports', async () => {
    for (const [action, count] of [['export-students', 32], ['export-messages', 0]]) {
      const event = page.waitForEvent('download');
      await page.locator(`[data-action="${action}"]`).click();
      const download = await event;
      const exported = JSON.parse(await readFile(await download.path(), 'utf8'));
      assert.equal(exported.length, count);
    }
  });

  await check('Desktop and 390px mobile visual inspection artifacts', async () => {
    await nav('overview');
    await page.screenshot({ path: join(outputDir, 'admin-desktop.png'), fullPage: true });
    results.screenshots.push('docs/qa/admin-desktop.png');
    await page.setViewportSize({ width: 390, height: 844 });
    await nav('students');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: join(outputDir, 'admin-mobile.png'), fullPage: true });
    results.screenshots.push('docs/qa/admin-mobile.png');
  });

  await check('Logout invalidates session, unload guard cleanup and no JavaScript errors', async () => {
    await page.locator('[data-action="logout"]').click();
    await page.getByLabel('Username', { exact: true }).waitFor();
    assert.equal((await page.request.get(`${base}/api/auth/session`)).status(), 401);
    assert.equal(await page.evaluate(() => window.admin.hasUnsavedChanges), false);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({ path: join(outputDir, 'admin-login.png'), fullPage: true });
    results.screenshots.push('docs/qa/admin-login.png');
    await page.evaluate(() => window.admin.dispose());
    assert.equal(await page.evaluate(() => { const event = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(event); return event.defaultPrevented; }), false);
    assert.deepEqual(results.browserErrors, []);
  });
} catch (error) {
  results.error = error.message;
  console.error(error.message);
  process.exitCode = 1;
} finally {
  results.finishedAt = new Date().toISOString();
  results.passed = results.checks.filter(check => check.status === 'pass').length;
  results.failed = results.checks.filter(check => check.status === 'fail').length;
  await mkdir(outputDir, { recursive: true });
  await writeFile(join(outputDir, 'admin-results.json'), JSON.stringify(results, null, 2));
  await browser?.close();
  await vite?.close();
  if (server) await new Promise(done => server.close(done));
  backend?.locals.close();
  // This exact path comes only from mkdtemp above, never a configured or user folder.
  assert(resolve(dataDir).startsWith(resolve(tmpdir()) + '\\') || resolve(dataDir).startsWith(resolve(tmpdir()) + '/'));
  assert(dataDir.includes('xii-ips-admin-qa-'));
  await rm(dataDir, { recursive: true, force: true });
  console.log(`Admin QA: ${results.passed} passed, ${results.failed} failed. Results: docs/qa/admin-results.json`);
}
