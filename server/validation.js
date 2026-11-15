export class InputError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

const plainObject = (v) => v && typeof v === 'object' && !Array.isArray(v);
function object(value, label) { if (!plainObject(value)) throw new InputError(`${label} tidak valid.`); return value; }
function text(value, label, max = 1000, required = false) {
  if (typeof value !== 'string' || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) throw new InputError(`${label} tidak valid (maksimal ${max} karakter).`);
  const cleaned = value.trim();
  if (required && !cleaned) throw new InputError(`${label} wajib diisi.`);
  return cleaned;
}
function image(value, label = 'Foto') {
  value = text(value ?? '', label, 200);
  if (value && !/^\/uploads\/[a-f0-9-]{36}\.webp$/.test(value)) throw new InputError(`${label} harus berasal dari unggahan dashboard.`);
  return value;
}
function position(value) {
  if (!/^\d{1,3}(\.\d+)?% \d{1,3}(\.\d+)?%$/.test(value || '') || value.split(' ').some((n) => parseFloat(n) > 100)) return '50% 50%';
  return value;
}
function list(value, label, min, max) {
  if (!Array.isArray(value) || value.length < min || value.length > max) throw new InputError(`${label} harus berisi ${min === max ? min : `${min}–${max}`} item.`);
  return value;
}

export function validateContent(input) {
  const c = object(input, 'Konten');
  const cover = object(c.cover, 'Sampul');
  const teacher = object(c.teacher, 'Wali kelas');
  const farewell = object(c.farewell, 'Perpisahan');
  const settings = object(c.settings, 'Pengaturan');
  const students = list(c.students, 'Siswa', 32, 32).map((s, i) => {
    object(s, 'Siswa');
    if (s.id !== i + 1) throw new InputError('Identitas dan urutan 32 siswa harus tetap 1–32.');
    return { id: s.id, name: text(s.name, 'Nama siswa', 120, true), photo: image(s.photo), description: text(s.description ?? '', 'Deskripsi siswa', 2000), position: position(s.position) };
  });
  const ids = new Set();
  const memories = list(c.memories, 'Kenangan', 0, 300).map((m) => {
    object(m, 'Kenangan');
    const id = text(m.id, 'ID kenangan', 100, true);
    if (!/^[a-zA-Z0-9_-]+$/.test(id) || ids.has(id)) throw new InputError('ID kenangan harus unik.');
    ids.add(id);
    if (![4, 5, 6].includes(m.page)) throw new InputError('Foto kenangan hanya untuk halaman 4–6.');
    return { id, page: m.page, photo: image(m.photo), caption: text(m.caption ?? '', 'Caption', 800), date: text(m.date ?? '', 'Tanggal', 40), alt: text(m.alt ?? '', 'Teks alternatif', 500), position: position(m.position), order: Number.isFinite(Number(m.order)) ? Math.max(0, Math.min(1000, Number(m.order))) : 0 };
  });
  const pages = list(c.pages, 'Halaman', 11, 11).map((p, i) => {
    object(p, 'Halaman');
    if (p.id !== i + 2) throw new InputError('Halaman editorial harus berurutan dari 2 sampai 12.');
    return { id: p.id, title: text(p.title, 'Judul halaman', 140, true), subtitle: text(p.subtitle ?? '', 'Subjudul', 300), text: text(p.text ?? '', 'Teks halaman', 6000), ornament: p.ornament === 'none' ? 'none' : 'botanical', photo: image(p.photo) };
  });
  if (!['high', 'balanced', 'lite'].includes(settings.quality)) throw new InputError('Kualitas visual tidak valid.');
  const audioUrl = text(settings.audioUrl ?? '', 'URL audio', 200);
  if (audioUrl && !/^\/uploads\/[a-f0-9-]{36}\.(mp3|wav|ogg)$/.test(audioUrl)) throw new InputError('Audio harus berasal dari unggahan dashboard.');
  if (typeof settings.audioEnabled !== 'boolean' || typeof settings.particles !== 'boolean' || typeof settings.messagesEnabled !== 'boolean') throw new InputError('Pengaturan harus berupa boolean.');
  if (typeof settings.volume !== 'number' || settings.volume < 0 || settings.volume > 1) throw new InputError('Volume harus berada di antara 0 dan 1.');
  if (!Number.isSafeInteger(c.version) || c.version < 1) throw new InputError('Versi konten tidak valid.');
  return {
    version: c.version,
    cover: { title: text(cover.title, 'Judul sampul', 120, true), year: text(cover.year, 'Tahun', 50, true), tagline: text(cover.tagline, 'Tagline', 300), image: image(cover.image) },
    teacher: { name: text(teacher.name, 'Nama wali kelas', 120, true), subject: text(teacher.subject ?? '', 'Mata pelajaran', 200), photo: image(teacher.photo), message: text(teacher.message ?? '', 'Pesan wali kelas', 6000), note: text(teacher.note ?? '', 'Catatan wali kelas', 2000), position: position(teacher.position) },
    students, memories, pages,
    farewell: { text: text(farewell.text ?? '', 'Teks perpisahan', 6000), photo: image(farewell.photo), position: position(farewell.position) },
    settings: { audioEnabled: settings.audioEnabled, volume: settings.volume, audioUrl, quality: settings.quality, particles: settings.particles, messagesEnabled: settings.messagesEnabled },
  };
}

export function validateMessage(input) {
  const value = object(input, 'Pesan');
  const recipientId = Number(value.recipientId);
  if (!Number.isInteger(recipientId) || recipientId < 1 || recipientId > 32) throw new InputError('Pilih penerima dari daftar siswa.');
  const body = text(value.body, 'Pesan', 1000, true);
  if (body.length < 3) throw new InputError('Pesan minimal 3 karakter.');
  if (/[<>]/.test(body)) throw new InputError('Pesan hanya boleh berupa teks biasa, tanpa HTML.');
  if (/https?:\/\/|www\.|\b(?:fuck|kontol|memek|ngentot|bangsat)\b/i.test(body)) throw new InputError('Pesan mengandung tautan atau kata yang tidak diperbolehkan.');
  return { recipientId, body };
}

export function validateBackup(input) {
  const backup = object(input, 'Backup');
  if (backup.format !== 'xii-ips-yearbook/v1') throw new InputError('Format backup tidak dikenali.');
  const content = validateContent(backup.content);
  const seenMessages = new Set();
  const messages = list(backup.messages, 'Pesan backup', 0, 10000).map((m) => {
    object(m, 'Pesan backup');
    if (!Number.isSafeInteger(m.id) || m.id < 1 || seenMessages.has(m.id)) throw new InputError('ID pesan backup tidak valid.');
    seenMessages.add(m.id);
    if (!['pending', 'approved', 'hidden', 'rejected'].includes(m.status)) throw new InputError('Status pesan backup tidak valid.');
    if (!Number.isFinite(Date.parse(m.createdAt))) throw new InputError('Waktu pesan backup tidak valid.');
    return { id: m.id, ...validateMessage(m), status: m.status, createdAt: m.createdAt };
  });
  let totalBytes = 0;
  const seenAssets = new Set();
  const assets = list(backup.assets ?? [], 'Aset backup', 0, 1500).map((a) => {
    object(a, 'Aset backup');
    if (typeof a.name !== 'string' || !/^[a-f0-9-]{36}\.(webp|mp3|wav|ogg)$/.test(a.name) || seenAssets.has(a.name)) throw new InputError('Nama aset backup tidak valid.');
    seenAssets.add(a.name);
    if (typeof a.data !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(a.data) || a.data.length % 4) throw new InputError('Data aset backup tidak valid.');
    const buffer = Buffer.from(a.data, 'base64');
    totalBytes += buffer.length;
    if (!buffer.length || buffer.length > 12 * 1024 * 1024 || totalBytes > 80 * 1024 * 1024) throw new InputError('Backup aset terlalu besar (maksimal total 80 MB).');
    return { name: a.name, buffer };
  });
  return { content, messages, assets };
}
