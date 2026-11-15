import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { openDatabase, createAdmin } from '../server/database.js';

const username = process.env.ADMIN_USERNAME;
const password = process.env.ADMIN_PASSWORD;
if (!username || !password) {
  console.error('Atur ADMIN_USERNAME dan ADMIN_PASSWORD (minimal 12 karakter), lalu jalankan npm run admin:create. Tidak ada akun atau password bawaan.');
  process.exit(1);
}
const dataDir = resolve(process.env.DATA_DIR || fileURLToPath(new URL('../data', import.meta.url)));
const db = openDatabase(dataDir);
try {
  await createAdmin(db, username, password, { replace: process.argv.includes('--replace'), allowRequestedBootstrap: process.argv.includes('--requested-bootstrap') });
  console.log(`Admin "${username}" berhasil disimpan. Password tidak ditampilkan. Semua sesi lama akun tersebut telah dicabut.`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { db.close(); delete process.env.ADMIN_PASSWORD; }
