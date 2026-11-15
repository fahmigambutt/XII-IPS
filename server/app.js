import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { randomBytes, createHash, createHmac, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, unlink, stat } from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase, checkPassword, changeAdminAccount } from './database.js';
import { InputError, validateContent, validateMessage, validateBackup } from './validation.js';

const projectDir = fileURLToPath(new URL('../', import.meta.url));
const twelveMB = 12 * 1024 * 1024;
const hash = (value) => createHash('sha256').update(value).digest('hex');

function audioType(buffer) {
  if (buffer.length < 12) return null;
  if (buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WAVE') return { extension: 'wav', mime: 'audio/wav' };
  if (buffer.subarray(0, 4).toString() === 'OggS') return { extension: 'ogg', mime: 'audio/ogg' };
  if (buffer.subarray(0, 3).toString() === 'ID3' || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0)) return { extension: 'mp3', mime: 'audio/mpeg' };
  return null;
}

export function createApp({ dataDir = process.env.DATA_DIR || join(projectDir, 'data'), production = process.env.NODE_ENV === 'production', secureCookies = process.env.SECURE_COOKIES === 'true', loginLimit = 5, messageLimit = 5, now = () => Date.now() } = {}) {
  dataDir = resolve(dataDir);
  const uploadsDir = join(dataDir, 'uploads');
  mkdirSync(uploadsDir, { recursive: true, mode: 0o700 });
  const db = openDatabase(dataDir);
  const app = express();
  app.disable('x-powered-by');
  if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);
  const ipSalt = db.prepare("SELECT value FROM metadata WHERE key = 'ip-salt'").get().value;
  const loadContent = () => JSON.parse(db.prepare('SELECT json FROM content WHERE id=1').get().json);
  const ipKey = (req) => createHmac('sha256', ipSalt).update(req.ip || 'unknown').digest('hex');
  const secure = (req) => secureCookies || req.secure;
  const cookie = (req, value, expiry) => `yearbook_session=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${expiry}${secure(req) ? '; Secure' : ''}`;

  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (production) res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
    if (req.path.startsWith('/api/')) res.setHeader('Cache-Control', 'no-store');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.headers.origin) {
      let originHost;
      try { originHost = new URL(req.headers.origin).host; } catch { return res.status(403).json({ error: 'Origin tidak valid.' }); }
      if (originHost !== req.headers.host) return res.status(403).json({ error: 'Permintaan lintas origin ditolak.' });
    }
    next();
  });
  app.use('/api/admin/restore', authenticated, express.json({ limit: '120mb', type: 'application/json' }));
  app.use(express.json({ limit: '512kb', type: 'application/json' }));

  function rateLimit(req, label, limit, windowMS) {
    const key = `${label}:${ipKey(req)}`;
    const row = db.prepare('SELECT count,reset_at FROM rate_limits WHERE key=?').get(key);
    if (row && row.reset_at > now() && row.count >= limit) throw new InputError('Terlalu banyak percobaan. Silakan coba lagi beberapa saat lagi.', 429);
    db.prepare('INSERT INTO rate_limits (key,count,reset_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=?,reset_at=?').run(key, now() + windowMS, row && row.reset_at > now() ? row.count + 1 : 1, row && row.reset_at > now() ? row.reset_at : now() + windowMS);
    db.prepare('DELETE FROM rate_limits WHERE reset_at < ?').run(now() - 24 * 60 * 60 * 1000);
  }

  function authenticated(req, res, next) {
    const rawCookie = req.headers.cookie?.split(';').map((s) => s.trim()).find((s) => s.startsWith('yearbook_session='))?.slice('yearbook_session='.length);
    if (!rawCookie || !/^[a-f0-9]{64}$/.test(rawCookie)) return res.status(401).json({ error: 'Silakan masuk sebagai admin.' });
    const session = db.prepare('SELECT * FROM sessions WHERE token_hash=? AND expires_at>?').get(hash(rawCookie), now());
    if (!session) return res.status(401).json({ error: 'Sesi berakhir. Silakan masuk kembali.' });
    req.adminSession = session;
    if (!['GET', 'HEAD'].includes(req.method) && req.headers['x-csrf-token'] !== session.csrf_token) return res.status(403).json({ error: 'Token keamanan tidak valid. Muat ulang dashboard.' });
    next();
  }

  app.get('/api/health', (req, res) => res.json({ status: 'ok', storage: 'sqlite' }));
  app.get('/api/content', (req, res) => res.json(loadContent()));
  app.get('/api/auth/session', authenticated, (req, res) => res.json({ username: req.adminSession.username, csrfToken: req.adminSession.csrf_token }));
  app.post('/api/auth/login', async (req, res) => {
    rateLimit(req, 'login', loginLimit, 15 * 60 * 1000);
    const { username, password } = req.body ?? {};
    if (typeof username !== 'string' || username.length > 80 || typeof password !== 'string' || password.length > 256) throw new InputError('Username atau password salah.', 401);
    const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
    const valid = await checkPassword(password, admin?.salt || '0'.repeat(64), admin?.password_hash || '0'.repeat(128));
    if (!admin || !valid) throw new InputError('Username atau password salah.', 401);
    const token = randomBytes(32).toString('hex');
    const csrfToken = randomBytes(32).toString('hex');
    db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now());
    db.prepare('INSERT INTO sessions (token_hash,username,csrf_token,expires_at) VALUES (?,?,?,?)').run(hash(token), username, csrfToken, now() + 8 * 60 * 60 * 1000);
    db.prepare('DELETE FROM rate_limits WHERE key=?').run(`login:${ipKey(req)}`);
    res.setHeader('Set-Cookie', cookie(req, token, 8 * 60 * 60));
    res.json({ username, csrfToken });
  });
  app.post('/api/auth/logout', authenticated, (req, res) => {
    db.prepare('DELETE FROM sessions WHERE token_hash=?').run(req.adminSession.token_hash);
    res.setHeader('Set-Cookie', cookie(req, '', 0));
    res.json({ success: true });
  });

  function messages(status) {
    const rows = status ? db.prepare('SELECT * FROM messages WHERE status=? ORDER BY id DESC LIMIT 1000').all(status) : db.prepare('SELECT * FROM messages ORDER BY id DESC LIMIT 10000').all();
    const students = loadContent().students;
    return rows.map((m) => ({ id: m.id, recipientId: m.recipient_id, recipientName: students.find((s) => s.id === m.recipient_id)?.name || '', body: m.body, status: m.status, createdAt: m.created_at }));
  }
  app.get('/api/messages', (req, res) => res.json({ messages: messages('approved').map(({ status, ...m }) => m) }));
  app.post('/api/messages', (req, res) => {
    if (!loadContent().settings.messagesEnabled) throw new InputError('Pengiriman pesan sedang dinonaktifkan.', 403);
    rateLimit(req, 'message', messageLimit, 10 * 60 * 1000);
    if (req.body?.website) throw new InputError('Pesan tidak dapat dikirim.');
    const message = validateMessage(req.body);
    const duplicateKey = `duplicate:${ipKey(req)}:${hash(`${message.recipientId}:${message.body.toLowerCase()}`)}`;
    if (db.prepare('SELECT key FROM rate_limits WHERE key=? AND reset_at>?').get(duplicateKey, now())) throw new InputError('Pesan ini sudah dikirim. Tunggu moderasi admin.', 409);
    db.prepare('INSERT INTO rate_limits(key,count,reset_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET reset_at=excluded.reset_at').run(duplicateKey, now() + 10 * 60 * 1000);
    const result = db.prepare("INSERT INTO messages(recipient_id,body,status,created_at) VALUES (?,?,'pending',?)").run(message.recipientId, message.body, new Date(now()).toISOString());
    res.status(201).json({ id: Number(result.lastInsertRowid), status: 'pending', message: 'Pesan terkirim dan menunggu persetujuan admin.' });
  });

  app.use('/api/admin', authenticated);
  app.post('/api/admin/account', async (req, res) => {
    rateLimit(req, 'account', 5, 15 * 60 * 1000);
    const { currentPassword, newUsername, newPassword } = req.body ?? {};
    const username = await changeAdminAccount(db, req.adminSession.username, currentPassword, newUsername, newPassword);
    const token = randomBytes(32).toString('hex');
    const csrfToken = randomBytes(32).toString('hex');
    db.prepare('INSERT INTO sessions (token_hash,username,csrf_token,expires_at) VALUES (?,?,?,?)').run(hash(token), username, csrfToken, now() + 8 * 60 * 60 * 1000);
    db.prepare('DELETE FROM rate_limits WHERE key=?').run(`account:${ipKey(req)}`);
    res.setHeader('Set-Cookie', cookie(req, token, 8 * 60 * 60));
    res.json({ success: true, username, csrfToken });
  });
  app.get('/api/admin/content', (req, res) => res.json(loadContent()));
  app.put('/api/admin/content', (req, res) => {
    const content = validateContent(req.body?.content);
    const current = loadContent();
    if (content.version !== current.version) throw new InputError('Konten telah berubah di sesi lain. Muat ulang sebelum menyimpan.', 409);
    content.version = current.version + 1;
    db.prepare('UPDATE content SET json=? WHERE id=1').run(JSON.stringify(content));
    res.json(content);
  });
  app.get('/api/admin/messages', (req, res) => res.json({ messages: messages() }));
  app.patch('/api/admin/messages/:id', (req, res) => {
    if (!['approved', 'hidden', 'rejected'].includes(req.body?.status)) throw new InputError('Status moderasi tidak valid.');
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) throw new InputError('ID pesan tidak valid.');
    const result = db.prepare('UPDATE messages SET status=? WHERE id=?').run(req.body.status, id);
    if (!result.changes) throw new InputError('Pesan tidak ditemukan.', 404);
    res.json({ success: true });
  });
  app.delete('/api/admin/messages/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) throw new InputError('ID pesan tidak valid.');
    const result = db.prepare('DELETE FROM messages WHERE id=?').run(id);
    if (!result.changes) throw new InputError('Pesan tidak ditemukan.', 404);
    res.json({ success: true });
  });

  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: twelveMB, files: 1, fields: 2 }, fileFilter(req, file, cb) {
    cb(null, ['image/jpeg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'application/ogg'].includes(file.mimetype));
  } });
  app.post('/api/admin/upload', upload.single('file'), async (req, res) => {
    if (!req.file) throw new InputError('Pilih JPEG, PNG, WebP, MP3, WAV, atau OGG (maksimal 12 MB).');
    let buffer, type;
    if (req.file.mimetype.startsWith('image/')) {
      try {
        const image = sharp(req.file.buffer, { limitInputPixels: 32 * 1024 * 1024, failOn: 'error', animated: false });
        const metadata = await image.metadata();
        if (!['jpeg', 'png', 'webp'].includes(metadata.format) || (metadata.pages ?? 1) > 1) throw new Error('unsupported');
        buffer = await image.rotate().resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true }).webp({ quality: 84 }).toBuffer();
      } catch { throw new InputError('Gambar rusak, terlalu besar, atau format tidak didukung.'); }
      type = { extension: 'webp', mime: 'image/webp' };
    } else {
      type = audioType(req.file.buffer);
      if (!type) throw new InputError('Isi file audio tidak valid.');
      buffer = req.file.buffer;
    }
    const name = `${randomUUID()}.${type.extension}`;
    await writeFile(join(uploadsDir, name), buffer, { flag: 'wx', mode: 0o600 });
    db.prepare('INSERT INTO assets (name,mime,bytes,created_at) VALUES (?,?,?,?)').run(name, type.mime, buffer.length, new Date(now()).toISOString());
    res.status(201).json({ url: `/uploads/${name}`, bytes: buffer.length, mime: type.mime });
  });

  app.get('/api/admin/backup', async (req, res) => {
    const rows = db.prepare('SELECT name,bytes FROM assets ORDER BY name').all();
    if (rows.reduce((total, a) => total + a.bytes, 0) > 80 * 1024 * 1024) throw new InputError('Aset melebihi 80 MB. Salin folder data untuk backup lengkap.', 413);
    const assets = [];
    for (const { name } of rows) {
      try { assets.push({ name, data: (await readFile(join(uploadsDir, name))).toString('base64') }); }
      catch { throw new InputError('Ada aset yang hilang. Periksa penyimpanan sebelum membuat backup.', 409); }
    }
    res.setHeader('Content-Disposition', 'attachment; filename="xii-ips-backup.json"');
    res.json({ format: 'xii-ips-yearbook/v1', createdAt: new Date(now()).toISOString(), content: loadContent(), messages: messages().map(({ recipientName, ...m }) => m), assets });
  });

  app.post('/api/admin/restore', async (req, res) => {
    const backup = validateBackup(req.body?.backup);
    const names = new Set(backup.assets.map((a) => a.name));
    const urls = [backup.content.cover.image, backup.content.teacher.photo, backup.content.farewell.photo, backup.content.settings.audioUrl, ...backup.content.students.map((s) => s.photo), ...backup.content.memories.map((m) => m.photo), ...backup.content.pages.map((p) => p.photo)];
    for (const url of urls.filter(Boolean)) if (!names.has(url.slice('/uploads/'.length))) throw new InputError('Backup tidak lengkap: aset yang dirujuk tidak ditemukan.');
    const validatedAssets = [];
    for (const asset of backup.assets) {
      const extension = extname(asset.name).slice(1);
      if (extension === 'webp') {
        try {
          const metadata = await sharp(asset.buffer, { limitInputPixels: 32 * 1024 * 1024 }).metadata();
          if (metadata.format !== 'webp' || (metadata.pages ?? 1) > 1) throw new Error('invalid');
        } catch { throw new InputError('Gambar dalam backup tidak valid.'); }
      } else if (audioType(asset.buffer)?.extension !== extension) throw new InputError('Audio dalam backup tidak valid.');
      const target = join(uploadsDir, asset.name);
      if (existsSync(target) && hash(await readFile(target)) !== hash(asset.buffer)) throw new InputError('Aset backup bertentangan dengan aset yang ada.', 409);
      validatedAssets.push({ ...asset, mime: extension === 'webp' ? 'image/webp' : audioType(asset.buffer).mime, target });
    }
    const newFiles = [];
    try {
      for (const asset of validatedAssets) if (!existsSync(asset.target)) { await writeFile(asset.target, asset.buffer, { flag: 'wx', mode: 0o600 }); newFiles.push(asset.target); }
      db.exec('BEGIN IMMEDIATE');
      try {
        backup.content.version = loadContent().version + 1;
        db.prepare('UPDATE content SET json=? WHERE id=1').run(JSON.stringify(backup.content));
        db.prepare('DELETE FROM messages').run();
        const insert = db.prepare('INSERT INTO messages (id,recipient_id,body,status,created_at) VALUES (?,?,?,?,?)');
        for (const m of backup.messages) insert.run(m.id, m.recipientId, m.body, m.status, m.createdAt);
        const insertAsset = db.prepare('INSERT INTO assets(name,mime,bytes,created_at) VALUES(?,?,?,?) ON CONFLICT(name) DO NOTHING');
        for (const a of validatedAssets) insertAsset.run(a.name, a.mime, a.buffer.length, new Date(now()).toISOString());
        db.exec('COMMIT');
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    } catch (error) {
      for (const file of newFiles) await unlink(file).catch(() => {});
      throw error;
    }
    res.json({ success: true, version: backup.content.version });
  });

  app.use('/uploads', express.static(uploadsDir, { dotfiles: 'deny', immutable: true, maxAge: '1y', index: false, setHeaders(res) { res.setHeader('Content-Security-Policy', "default-src 'none'"); } }));
  app.use('/api', (req, res) => res.status(404).json({ error: 'Endpoint tidak ditemukan.' }));
  const dist = join(projectDir, 'dist');
  if (existsSync(join(dist, 'index.html'))) {
    app.use(express.static(dist, { index: false }));
    app.get(/.*/, (req, res) => res.sendFile(join(dist, 'index.html')));
  }
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error instanceof multer.MulterError) return res.status(400).json({ error: error.code === 'LIMIT_FILE_SIZE' ? 'Ukuran file maksimal 12 MB.' : 'Unggahan tidak valid.' });
    if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Ukuran permintaan terlalu besar.' });
    if (error instanceof SyntaxError && 'body' in error) return res.status(400).json({ error: 'JSON tidak valid.' });
    if (!(error instanceof InputError)) console.error('[API]', error.message);
    res.status(error.status || 500).json({ error: error instanceof InputError ? error.message : 'Terjadi kesalahan server. Silakan coba kembali.' });
  });
  app.locals.db = db;
  app.locals.close = () => db.close();
  app.locals.dataDir = dataDir;
  return app;
}
