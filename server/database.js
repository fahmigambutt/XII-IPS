import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { createSeed } from './seed.js';
import { InputError } from './validation.js';

const scrypt = promisify(scryptCallback);
export async function hashPassword(password, salt = randomBytes(32).toString('hex')) {
  const hash = await scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return { salt, hash: hash.toString('hex') };
}
export async function checkPassword(password, salt, expected) {
  const { hash } = await hashPassword(password, salt);
  const expectedBuffer = Buffer.from(expected, 'hex');
  const actualBuffer = Buffer.from(hash, 'hex');
  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function openDatabase(dataDir) {
  mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(join(dataDir, 'yearbook.sqlite'));
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS content (id INTEGER PRIMARY KEY CHECK (id = 1), json TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS admins (username TEXT PRIMARY KEY, password_hash TEXT NOT NULL, salt TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, username TEXT NOT NULL REFERENCES admins(username), csrf_token TEXT NOT NULL, expires_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, recipient_id INTEGER NOT NULL CHECK (recipient_id BETWEEN 1 AND 32), body TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','hidden','rejected')), created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS assets (name TEXT PRIMARY KEY, mime TEXT NOT NULL, bytes INTEGER NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  `);
  if (!db.prepare('SELECT id FROM content WHERE id = 1').get()) db.prepare('INSERT INTO content (id,json) VALUES (1,?)').run(JSON.stringify(createSeed()));
  if (!db.prepare("SELECT value FROM metadata WHERE key = 'ip-salt'").get()) db.prepare("INSERT INTO metadata (key,value) VALUES ('ip-salt',?)").run(randomBytes(32).toString('hex'));
  return db;
}

function validateCredentials(username, password, allowRequestedBootstrap = false) {
  if (typeof username !== 'string' || !/^[a-zA-Z0-9_.@-]{3,80}$/.test(username)) throw new InputError('Username harus 3–80 karakter (huruf, angka, titik, @, garis bawah, tanda hubung).');
  const requestedBootstrap = allowRequestedBootstrap && username === 'admin' && password === 'admin';
  if (!requestedBootstrap && (typeof password !== 'string' || password.length < 12 || password.length > 256)) throw new InputError('Password baru harus 12–256 karakter.');
}

export async function createAdmin(db, username, password, { replace = false, allowRequestedBootstrap = false } = {}) {
  validateCredentials(username, password, allowRequestedBootstrap);
  if (db.prepare('SELECT username FROM admins WHERE username = ?').get(username) && !replace) throw new InputError('Admin sudah ada. Gunakan --replace untuk mengubah password secara sadar.');
  const { hash, salt } = await hashPassword(password);
  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare('INSERT INTO admins (username,password_hash,salt) VALUES (?,?,?) ON CONFLICT(username) DO UPDATE SET password_hash=excluded.password_hash,salt=excluded.salt').run(username, hash, salt);
    db.prepare('DELETE FROM sessions WHERE username = ?').run(username);
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}

export async function changeAdminAccount(db, currentUsername, currentPassword, newUsername, newPassword) {
  if (typeof currentPassword !== 'string' || currentPassword.length > 256) throw new InputError('Password saat ini tidak benar.', 401);
  validateCredentials(newUsername, newPassword);
  const current = db.prepare('SELECT * FROM admins WHERE username=?').get(currentUsername);
  if (!current || !(await checkPassword(currentPassword, current.salt, current.password_hash))) throw new InputError('Password saat ini tidak benar.', 401);
  if (newUsername !== currentUsername && db.prepare('SELECT username FROM admins WHERE username=?').get(newUsername)) throw new InputError('Username tersebut sudah digunakan.', 409);
  const { hash, salt } = await hashPassword(newPassword);
  db.exec('BEGIN IMMEDIATE');
  try {
    const fresh = db.prepare('SELECT password_hash FROM admins WHERE username=?').get(currentUsername);
    if (fresh?.password_hash !== current.password_hash) throw new InputError('Akun telah berubah. Masuk kembali untuk melanjutkan.', 409);
    db.prepare('DELETE FROM sessions WHERE username=?').run(currentUsername);
    db.prepare('UPDATE admins SET username=?,password_hash=?,salt=? WHERE username=?').run(newUsername, hash, salt, currentUsername);
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); throw error; }
  return newUsername;
}
