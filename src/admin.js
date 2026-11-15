import './admin.css';

const escapeHtml = (value = '') => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone = value => structuredClone(value);
const menu = [['overview','Ringkasan'],['cover','Edit cover'],['teacher','Wali kelas'],['students','32 siswa'],['memories','Foto kebersamaan'],['messages','Pesan anonim'],['pages','Edit halaman'],['settings','Pengaturan'],['backup','Backup & restore']];
const imageSource = value => /^(\/uploads\/|blob:)/.test(String(value || '')) ? value : '';
const asDate = value => value ? new Date(value).toLocaleString('id-ID') : '';

/** Real same-origin administration; all server mutations require the session CSRF token. */
export async function mountAdmin(container, {onExit = () => {}, onSaved = () => {}, onPreview} = {}) {
  const abort = new AbortController();
  let disposed = false, csrfToken = '', username = '', content, draft, messages = [], section = 'overview';
  let studentId = 1, pageId = 2, memoryId = '', search = '', messageFilter = 'all', messageSearch = '';
  let dirty = false, busy = false, uploading = 0, notice = '', noticeError = false;
  const objectUrls = new Set();

  async function api(url, options = {}) {
    const {body, ...rest} = options;
    const isForm = body instanceof FormData;
    const response = await fetch(url, {
      ...rest, credentials: 'same-origin', signal: abort.signal,
      headers: {...(!isForm && body !== undefined ? {'Content-Type':'application/json'} : {}), ...(csrfToken ? {'x-csrf-token':csrfToken} : {}), ...options.headers},
      ...(body !== undefined ? {body:isForm ? body : JSON.stringify(body)} : {})
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || data.message || `Permintaan gagal (${response.status}).`);
      error.status = response.status;
      throw error;
    }
    return data;
  }
  function inform(message, error = false) {
    notice = message; noticeError = error;
    const target = container.querySelector('[data-admin-notice]');
    if (target) {target.textContent = message; target.classList.toggle('is-error', error); target.hidden = !message;}
  }
  function canLeave() {
    if ((dirty || uploading) && !confirm('Ada perubahan atau unggahan yang belum disimpan. Keluar dan abaikan perubahan?')) return false;
    dirty = false;
    return true;
  }
  function beforeUnload(event) {
    if (!dirty && !uploading) return;
    event.preventDefault();
    event.returnValue = '';
  }
  const getPath = path => path.split('.').reduce((obj, key) => obj?.[key], draft);
  function setPath(path, value) {
    const keys = path.split('.');
    const key = keys.pop();
    const object = keys.reduce((obj, item) => obj[item], draft);
    object[key] = value; dirty = true;
    container.querySelectorAll('[data-unsaved]').forEach(el => {el.textContent = 'Perubahan belum disimpan';});
  }
  function field(label, path, {type = 'text', textarea = false, max = 500, required = false, help = ''} = {}) {
    const value = getPath(path) ?? '';
    const id = `admin-${path.replaceAll('.', '-')}`;
    return `<label class="ad-field" for="${id}"><span>${escapeHtml(label)}</span>${textarea
      ? `<textarea id="${id}" aria-label="${escapeHtml(label)}" ${help?`aria-describedby="${id}-help"`:''} data-path="${path}" rows="5" maxlength="${max}" ${required?'required':''}>${escapeHtml(value)}</textarea>`
      : `<input id="${id}" aria-label="${escapeHtml(label)}" ${help?`aria-describedby="${id}-help"`:''} data-path="${path}" type="${type}" value="${escapeHtml(value)}" maxlength="${max}" ${required?'required':''}>`}${help?`<small id="${id}-help">${escapeHtml(help)}</small>`:''}</label>`;
  }
  function select(label, path, options) {
    return `<label class="ad-field"><span>${escapeHtml(label)}</span><select aria-label="${escapeHtml(label)}" data-path="${path}">${options.map(([value,text])=>`<option value="${escapeHtml(value)}" ${String(getPath(path))===String(value)?'selected':''}>${escapeHtml(text)}</option>`).join('')}</select></label>`;
  }
  function checkbox(label, path, help = '') {
    return `<label class="ad-check"><input type="checkbox" data-path="${path}" ${getPath(path)?'checked':''}><span>${escapeHtml(label)}${help?`<small>${escapeHtml(help)}</small>`:''}</span></label>`;
  }
  function photoEditor(path, positionPath, {landscape = false, audio = false} = {}) {
    const source = getPath(path) || '';
    const position = positionPath ? getPath(positionPath) || '50% 50%' : '50% 50%';
    const coords = position.split(' ').map(v=>Number.isFinite(parseFloat(v))?parseFloat(v):50);
    return `<div class="ad-photo-editor">${audio
      ? (source?`<audio controls src="${escapeHtml(imageSource(source))}"></audio>`:'<div class="ad-photo-empty">Belum ada musik latar</div>')
      : `<div class="ad-photo ${landscape?'is-landscape':''}" data-photo-preview="${path}">${imageSource(source)?`<img src="${escapeHtml(imageSource(source))}" alt="Preview foto" style="object-position:${escapeHtml(position)}">`:'<span aria-hidden="true">▧</span><small>Foto belum diunggah</small>'}</div>`}
      <div class="ad-photo-actions"><label class="ad-button ad-secondary ad-upload">${source?'Ganti':'Unggah'} ${audio?'audio':'foto'}<input type="file" accept="${audio?'audio/mpeg,audio/wav,audio/ogg':'image/jpeg,image/png,image/webp'}" data-upload="${path}" class="ad-file-input"></label>${source?`<button type="button" class="ad-text-button" data-remove-photo="${path}">Hapus ${audio?'audio':'foto'}</button>`:''}</div>
      ${positionPath?`<fieldset class="ad-crop"><legend>Atur posisi potong</legend><label>Horizontal<input aria-label="Posisi horizontal foto" type="range" min="0" max="100" value="${coords[0]}" data-crop="${positionPath}" data-axis="0" data-image="${path}"></label><label>Vertikal<input aria-label="Posisi vertikal foto" type="range" min="0" max="100" value="${coords[1]}" data-crop="${positionPath}" data-axis="1" data-image="${path}"></label></fieldset>`:''}
      <small class="ad-muted">${audio?'MP3, WAV, atau OGG. Maks. 12 MB.':'JPG, PNG, atau WebP. Maks. 12 MB. Foto dioptimalkan oleh server.'}</small></div>`;
  }
  const actions = (page = 1) => `<div class="ad-form-actions"><button type="submit" class="ad-button" ${busy||uploading?'disabled':''}>${busy?'Menyimpan…':'Simpan perubahan'}</button><button type="button" class="ad-button ad-secondary" data-action="preview" data-page="${page}">Preview</button><button type="button" class="ad-text-button" data-action="cancel">Batalkan perubahan</button><small data-unsaved>${dirty?'Perubahan belum disimpan':'Tersimpan di database'}</small></div>`;

  function renderLogin() {
    if (disposed) return;
    container.innerHTML = `<div class="admin-app ad-login"><button type="button" class="ad-back" data-action="exit">← Kembali ke buku</button><div class="ad-login-intro"><span class="ad-eyebrow">XII IPS MEMORIES</span><h1>Merawat cerita,<br><em>menjaga kenangan.</em></h1><p>Ruang untuk menyusun setiap foto, setiap nama, dan hal-hal kecil yang ingin kita simpan.</p><span class="ad-flower" aria-hidden="true">✳</span></div><section class="ad-login-card"><span class="ad-eyebrow">RUANG PENGELOLA</span><h2>Selamat datang kembali.</h2><p class="ad-muted">Masuk untuk mengelola yearbook kelas.</p><div data-admin-notice role="status" aria-live="polite" class="ad-notice ${noticeError?'is-error':''}" ${notice?'':'hidden'}>${escapeHtml(notice)}</div><form data-admin-login><label class="ad-field"><span>Username</span><input name="username" autocomplete="username" required maxlength="80"></label><label class="ad-field"><span>Password</span><span class="ad-password"><input id="admin-password" aria-label="Password" name="password" type="password" autocomplete="current-password" required maxlength="256"><button type="button" data-action="show-password" aria-label="Tampilkan password">Lihat</button></span></label><button class="ad-button ad-login-submit" type="submit" ${busy?'disabled':''}>${busy?'Memeriksa…':'Masuk dashboard'} <span>↗</span></button></form><p class="ad-login-note">ID dan password dapat diganti melalui Pengaturan setelah masuk.</p></section></div>`;
  }
  function overview() {
    const cards = [[draft.students.length,'Siswa dalam buku'],[draft.students.filter(s=>s.photo).length,'Foto siswa terisi'],[draft.memories.filter(m=>m.photo).length,'Foto kebersamaan'],[messages.length,'Pesan masuk'],[messages.filter(m=>m.status==='pending').length,'Menunggu moderasi']];
    return `<div class="ad-welcome"><div><span class="ad-eyebrow">SETIAP CERITA BERARTI</span><h2>Kenangan yang terus dirawat.</h2><p>Lengkapi foto resmi, rapikan cerita, lalu simpan. Perubahan akan tampil di buku tanpa mengubah kode.</p><button type="button" class="ad-button" data-section="students">Lengkapi foto siswa ↗</button></div><div class="ad-mini-cover"><small>OUR MEMORIES, OUR STORY</small><strong>${escapeHtml(draft.cover.title)}</strong><span>${escapeHtml(draft.cover.year)}</span></div></div><div class="ad-stats">${cards.map(([n,label])=>`<article><strong>${n}</strong><span>${label}</span></article>`).join('')}</div><div class="ad-panel"><h3>Status yearbook</h3><p><span class="ad-dot"></span> Database terhubung · ${draft.settings.messagesEnabled?'Pesan anonim aktif':'Pesan anonim dinonaktifkan'}</p><p class="ad-muted">Foto kosong tetap tampil sebagai placeholder. Pesan hanya dipublikasikan setelah disetujui admin.</p><button type="button" class="ad-text-button" data-section="messages">Tinjau pesan masuk →</button></div>`;
  }
  function coverForm() {
    return `<form data-admin-save><div class="ad-editor-grid"><div class="ad-panel"><h3>Identitas buku</h3>${field('Judul yearbook','cover.title',{required:true,max:100})}${field('Tahun angkatan','cover.year',{required:true,max:50})}${field('Tagline','cover.tagline',{max:160})}</div><div class="ad-panel"><h3>Gambar sampul</h3>${photoEditor('cover.image',null,{landscape:false})}<p class="ad-muted">Tanpa gambar, sampul memakai desain linen dan ornamen bawaan.</p></div></div>${actions(1)}</form>`;
  }
  function teacherForm() {
    return `<form data-admin-save><div class="ad-editor-grid"><div class="ad-panel"><h3>Profil wali kelas</h3>${field('Nama lengkap','teacher.name',{required:true,max:120})}${field('Mata pelajaran','teacher.subject',{max:150})}${field('Pesan dan kesan','teacher.message',{textarea:true,max:4000})}${field('Ucapan khusus / keterangan tambahan','teacher.note',{textarea:true,max:2000})}</div><div class="ad-panel"><h3>Foto wali kelas</h3>${photoEditor('teacher.photo','teacher.position')}</div></div>${actions(3)}</form>`;
  }
  function studentsForm() {
    const index = Math.max(0,draft.students.findIndex(s=>Number(s.id)===Number(studentId)));
    const selected = draft.students[index];
    const filtered = draft.students.filter(s=>s.name.toLocaleLowerCase('id').includes(search.toLocaleLowerCase('id')));
    return `<div class="ad-student-grid"><section class="ad-panel ad-student-list"><label class="ad-field"><span>Cari siswa</span><input type="search" data-student-search value="${escapeHtml(search)}" placeholder="Cari nama…" autocomplete="off"></label><div data-student-results>${studentList(filtered,selected.id)}</div></section><form data-admin-save><div class="ad-panel"><div class="ad-section-head"><h3>Profil siswa ${String(selected.id).padStart(2,'0')}</h3><span class="ad-badge">Halaman ${7+Math.floor(index/8)}</span></div><div class="ad-profile-grid">${photoEditor(`students.${index}.photo`,`students.${index}.position`)}<div>${field('Nama lengkap',`students.${index}.name`,{required:true,max:120,help:'Nama resmi hanya diubah setelah konfirmasi saat menyimpan.'})}${field('Keterangan / deskripsi',`students.${index}.description`,{textarea:true,max:1000})}<p class="ad-muted">Identitas siswa dan urutannya tetap. Setiap halaman memuat 8 siswa.</p></div></div></div>${actions(7+Math.floor(index/8))}</form></div>`;
  }
  function studentList(students, selectedId) {
    return students.length ? students.map(s=>`<button type="button" class="ad-student-item ${s.id===selectedId?'is-active':''}" data-student="${s.id}"><span>${String(s.id).padStart(2,'0')}</span><strong>${escapeHtml(s.name)}</strong><small>${s.photo?'●':'○'}</small></button>`).join('') : '<p class="ad-muted">Nama tidak ditemukan.</p>';
  }
  function memoriesForm() {
    const sorted = draft.memories.map((m,index)=>({...m,index})).sort((a,b)=>Number(a.page)-Number(b.page)||Number(a.order)-Number(b.order));
    let selected = sorted.find(m=>String(m.id)===String(memoryId)) || sorted[0];
    if (selected) memoryId=selected.id;
    return `<div class="ad-gallery-tools"><button type="button" class="ad-button" data-action="add-memory">+ Tambah kenangan</button><label class="ad-button ad-secondary ad-upload">Unggah banyak foto<input type="file" accept="image/jpeg,image/png,image/webp" multiple data-bulk-upload class="ad-file-input"></label><span class="ad-muted">Foto baru masuk ke halaman 4; halaman dapat dipindahkan.</span></div><div class="ad-student-grid"><section class="ad-panel ad-memory-list">${sorted.map(m=>`<button type="button" class="ad-memory-item ${String(m.id)===String(memoryId)?'is-active':''}" data-memory="${escapeHtml(m.id)}">${imageSource(m.photo)?`<img src="${escapeHtml(imageSource(m.photo))}" alt="" loading="lazy">`:'<span class="ad-memory-empty">▧</span>'}<span><small>HALAMAN ${m.page}</small><strong>${escapeHtml(m.caption||'Foto belum diunggah')}</strong></span></button>`).join('')||'<p class="ad-muted">Belum ada kenangan.</p>'}</section>${selected?`<form data-admin-save><div class="ad-panel"><div class="ad-section-head"><h3>Detail kenangan</h3><button type="button" class="ad-danger ad-text-button" data-action="delete-memory">Hapus</button></div>${photoEditor(`memories.${selected.index}.photo`,`memories.${selected.index}.position`,{landscape:true})}${field('Caption',`memories.${selected.index}.caption`,{max:300})}${field('Teks alternatif foto',`memories.${selected.index}.alt`,{max:300})}<div class="ad-two-columns">${field('Tanggal kegiatan (opsional)',`memories.${selected.index}.date`,{type:'date'})}${select('Tampilkan di halaman',`memories.${selected.index}.page`,[[4,'4 — Our Togetherness'],[5,'5 — Our Togetherness'],[6,'6 — Our Togetherness']])}</div><div class="ad-order"><span>Urutan dalam halaman</span><button type="button" class="ad-button ad-secondary" data-action="memory-up" aria-label="Pindahkan foto ke atas">↑</button><button type="button" class="ad-button ad-secondary" data-action="memory-down" aria-label="Pindahkan foto ke bawah">↓</button><small>${Number(selected.order)+1}</small></div></div>${actions(Number(selected.page))}</form>`:'<form data-admin-save><div class="ad-panel"><p>Tambahkan foto pertama untuk mulai menyusun galeri.</p></div>'+actions(4)+'</form>'}</div>`;
  }
  function messagesPanel() {
    const filtered = messages.filter(m=>(messageFilter==='all'||m.status===messageFilter) && `${m.recipientName||draft.students.find(s=>Number(s.id)===Number(m.recipientId))?.name||''} ${m.body}`.toLowerCase().includes(messageSearch.toLowerCase()));
    const statusName = {pending:'Menunggu',approved:'Disetujui',hidden:'Disembunyikan',rejected:'Ditolak'};
    return `<div class="ad-panel"><div class="ad-two-columns"><label class="ad-field"><span>Cari nama penerima / isi pesan</span><input type="search" data-message-search value="${escapeHtml(messageSearch)}" placeholder="Cari pesan…"></label><label class="ad-field"><span>Status moderasi</span><select data-message-filter>${[['all','Semua pesan'],['pending','Menunggu moderasi'],['approved','Disetujui'],['hidden','Disembunyikan'],['rejected','Ditolak']].map(([v,t])=>`<option value="${v}" ${messageFilter===v?'selected':''}>${t}</option>`).join('')}</select></label></div><div class="ad-section-head"><p class="ad-muted">${filtered.length} pesan · Pengirim tetap anonim</p><button type="button" class="ad-text-button" data-action="refresh-messages">Muat ulang ↻</button></div></div><div data-message-results>${filtered.map(m=>`<article class="ad-panel ad-message"><div class="ad-section-head"><div><span class="ad-eyebrow">UNTUK ${escapeHtml(m.recipientName||draft.students.find(s=>Number(s.id)===Number(m.recipientId))?.name||'Siswa')}</span><p class="ad-muted">${escapeHtml(asDate(m.createdAt))}</p></div><span class="ad-badge ad-status-${escapeHtml(m.status)}">${statusName[m.status]||escapeHtml(m.status)}</span></div><p class="ad-message-body">${escapeHtml(m.body)}</p><div class="ad-message-actions">${[['approved','Setujui'],['hidden','Sembunyikan'],['rejected','Tolak']].map(([status,label])=>`<button type="button" class="ad-button ad-secondary" data-moderate="${escapeHtml(m.id)}" data-status="${status}" ${m.status===status?'disabled':''}>${label}</button>`).join('')}<button type="button" class="ad-text-button ad-danger" data-delete-message="${escapeHtml(m.id)}">Hapus permanen</button></div></article>`).join('')||'<div class="ad-panel ad-empty"><span>✉</span><h3>Belum ada pesan di sini.</h3><p class="ad-muted">Pesan yang masuk akan muncul untuk ditinjau sebelum ditampilkan di yearbook.</p></div>'}</div>`;
  }
  function pagesForm() {
    const index = Math.max(0,draft.pages.findIndex(p=>Number(p.id)===Number(pageId)));
    const page = draft.pages[index];
    return `<form data-admin-save><div class="ad-panel"><label class="ad-field"><span>Pilih halaman editorial</span><select data-page-select>${draft.pages.map(p=>`<option value="${p.id}" ${p.id===page.id?'selected':''}>${p.id} — ${escapeHtml(p.title)}</option>`).join('')}</select></label></div><div class="ad-editor-grid"><div class="ad-panel"><h3>Isi halaman ${page.id}</h3>${field('Judul',`pages.${index}.title`,{required:true,max:120})}${field('Subjudul',`pages.${index}.subtitle`,{max:300})}${field('Teks / deskripsi halaman',`pages.${index}.text`,{textarea:true,max:4000})}${select('Ornamen',`pages.${index}.ornament`,[['botanical','Botanical / dedaunan'],['none','Tanpa ornamen']])}${Number(page.id)===12?field('Teks perpisahan','farewell.text',{textarea:true,max:4000,help:'Gunakan cerita kelas yang telah disetujui.'}):''}</div><div class="ad-panel"><h3>${Number(page.id)===12?'Foto perpisahan':'Visual tambahan halaman'}</h3>${Number(page.id)===12?photoEditor('farewell.photo','farewell.position',{landscape:true}):photoEditor(`pages.${index}.photo`,null,{landscape:true})}<p class="ad-muted">Foto siswa, wali kelas, dan kolase utama dikelola melalui menunya masing-masing.</p></div></div>${actions(Number(page.id))}</form>`;
  }
  function settingsForm() {
    return `<form data-admin-save><div class="ad-editor-grid"><section class="ad-panel"><h3>Pengalaman membaca</h3>${select('Kualitas visual','settings.quality',[['high','High — detail dan bayangan penuh'],['balanced','Balanced — direkomendasikan'],['lite','Lite — perangkat terbatas']])}${checkbox('Partikel cahaya','settings.particles')}${checkbox('Terima pesan anonim','settings.messagesEnabled','Pesan baru tetap melalui moderasi admin.')}${checkbox('Sediakan audio','settings.audioEnabled','Audio hanya diputar setelah pengunjung mengaktifkannya.')}<label class="ad-field"><span>Volume audio</span><input type="range" data-path="settings.volume" min="0" max="1" step="0.05" value="${Number(draft.settings.volume)||0}"><small>0 = senyap · 1 = maksimum</small></label></section><section class="ad-panel"><h3>Musik latar</h3>${photoEditor('settings.audioUrl',null,{audio:true})}<p class="ad-muted">Gunakan audio yang Anda miliki izin penggunaannya. Efek gesekan halaman tersedia terpisah dari musik.</p></section></div>${actions(2)}</form>${accountForm()}`;
  }
  function accountForm() {
    return `<form class="ad-panel ad-account-form" data-admin-account><span class="ad-eyebrow">AKUN PENGELOLA</span><h3>Ganti ID dan password</h3><p class="ad-muted">Masukkan password saat ini untuk mengganti akun. Sesi login lain akan diakhiri setelah perubahan berhasil.</p><div class="ad-two-columns"><label class="ad-field"><span>ID admin baru</span><input name="newUsername" aria-label="ID admin baru" autocomplete="username" spellcheck="false" value="${escapeHtml(username)}" required minlength="3" maxlength="80" pattern="[a-zA-Z0-9_.@\\-]{3,80}"></label><label class="ad-field"><span>Password saat ini</span><input name="currentPassword" aria-label="Password saat ini" type="password" autocomplete="current-password" required maxlength="256"></label></div><div class="ad-two-columns"><label class="ad-field"><span>Password baru</span><input name="newPassword" aria-label="Password baru" type="password" autocomplete="new-password" required minlength="12" maxlength="256"><small>Gunakan 12–256 karakter untuk password baru.</small></label><label class="ad-field"><span>Ulangi password baru</span><input name="confirmPassword" aria-label="Ulangi password baru" type="password" autocomplete="new-password" required minlength="12" maxlength="256"></label></div><p class="ad-account-result" data-account-result role="status" aria-live="polite"></p><button class="ad-button" type="submit">Simpan akun admin</button></form>`;
  }
  function backupPanel() {
    return `<div class="ad-editor-grid"><section class="ad-panel"><span class="ad-eyebrow">SIMPAN SALINAN CERITA</span><h3>Backup & export</h3><p class="ad-muted">Unduh backup sebelum melakukan perubahan besar. Backup berisi konten, pesan, serta aset unggahan.</p><div class="ad-backup-buttons"><button type="button" class="ad-button" data-action="backup">Unduh backup lengkap ↓</button><button type="button" class="ad-button ad-secondary" data-action="export-students">Export data 32 siswa (JSON)</button><button type="button" class="ad-button ad-secondary" data-action="export-messages">Export pesan anonim (JSON)</button></div><p class="ad-muted">Export dan backup memakai data yang sudah disimpan di server.</p></section><section class="ad-panel"><span class="ad-eyebrow">PULIHKAN DARI SALINAN</span><h3>Restore data</h3><p>Restore mengganti data yang sekarang tersimpan. Pastikan backup yang dipilih berasal dari yearbook ini.</p><label class="ad-field"><span>File backup JSON</span><input type="file" accept="application/json,.json" data-restore-file></label><p class="ad-muted">Anda akan diminta mengonfirmasi sebelum data diganti. Akun dan password admin tidak termasuk backup.</p></section></div>`;
  }
  function render() {
    if(disposed||!draft) return;
    const title=menu.find(([key])=>key===section)?.[1]||'Dashboard';
    const panels={overview,cover:coverForm,teacher:teacherForm,students:studentsForm,memories:memoriesForm,messages:messagesPanel,pages:pagesForm,settings:settingsForm,backup:backupPanel};
    container.innerHTML=`<div class="admin-app ad-shell"><aside class="ad-sidebar"><button type="button" class="ad-brand" data-action="exit"><span class="ad-brand-mark">XII</span><span>IPS MEMORIES<small>CONTENT STUDIO</small></span></button><nav aria-label="Navigasi dashboard">${menu.map(([key,label],index)=>`<button type="button" data-section="${key}" class="${section===key?'is-active':''}" ${section===key?'aria-current="page"':''}><span>${String(index+1).padStart(2,'0')}</span>${label}${key==='messages'&&messages.some(m=>m.status==='pending')?'<i class="ad-dot"></i>':''}</button>`).join('')}</nav><div class="ad-sidebar-footer"><span>Masuk sebagai <strong>${escapeHtml(username)}</strong></span><button type="button" data-action="logout">Keluar akun ↗</button><button type="button" data-action="exit">← Kembali ke buku</button></div></aside><div class="ad-main"><header class="ad-header"><div><span class="ad-eyebrow">YOUR YEARBOOK, BEAUTIFULLY KEPT</span><h1>${escapeHtml(title)}</h1></div><span class="ad-header-status"><span class="ad-dot"></span> Database terhubung</span></header><div class="ad-content"><div data-admin-notice role="status" aria-live="polite" class="ad-notice ${noticeError?'is-error':''}" ${notice?'':'hidden'}>${escapeHtml(notice)}</div>${panels[section]()}</div><footer class="ad-footer">XII IPS · Our memories, our story.</footer></div></div>`;
  }
  async function load() {
    const [data,messageData]=await Promise.all([api('/api/admin/content'),api('/api/admin/messages')]);
    content=data.content||data; draft=clone(content); messages=messageData.messages||[]; dirty=false; render();
  }
  async function save() {
    if(busy||uploading) return;
    const renamed=draft.students.filter(s=>s.name!==content.students.find(old=>old.id===s.id)?.name);
    if(renamed.length&&!confirm(`Anda mengubah ${renamed.length} nama siswa resmi. Simpan perubahan nama ini?`)) return;
    busy=true; inform('Menyimpan perubahan…');
    try {
      const data=await api('/api/admin/content',{method:'PUT',body:{content:draft}});
      content=data.content||data; draft=clone(content); dirty=false;
      await onSaved(clone(content)); inform('Perubahan berhasil disimpan dan diterapkan ke yearbook.');
    } finally {busy=false;render();}
  }
  async function upload(file,path) {
    if(!file) return;
    const audio=path==='settings.audioUrl';
    if(file.size>12*1024*1024) throw new Error('Ukuran file maksimal 12 MB.');
    uploading++; const form=new FormData();form.append('file',file);
    let preview;
    if(!audio&&file.type.startsWith('image/')) {
      preview=URL.createObjectURL(file);objectUrls.add(preview);
      const wrapper=container.querySelector(`[data-photo-preview="${path}"]`);
      if(wrapper)wrapper.innerHTML=`<img src="${escapeHtml(preview)}" alt="Preview foto yang akan diunggah">`;
    }
    inform('Mengunggah dan mengoptimalkan file…');
    try {const result=await api('/api/admin/upload',{method:'POST',body:form});setPath(path,result.url);inform('File diunggah. Klik Simpan perubahan untuk menerapkannya ke buku.');}
    finally {uploading--;if(preview){URL.revokeObjectURL(preview);objectUrls.delete(preview);}render();}
  }
  function download(data,name) {
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    const anchor=document.createElement('a');anchor.href=url;anchor.download=name;anchor.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function preview() {
    const old=container.querySelector('dialog'); old?.remove();
    const dialog=document.createElement('dialog');dialog.className='ad-preview-dialog';
    const title=section==='cover'?draft.cover.title:section==='teacher'?draft.teacher.name:section==='students'?draft.students.find(s=>Number(s.id)===Number(studentId))?.name:section==='pages'?draft.pages.find(p=>Number(p.id)===Number(pageId))?.title:'Preview perubahan';
    let body='';
    if(section==='cover')body=`<div class="ad-preview-cover"><small>${escapeHtml(draft.cover.tagline)}</small><strong>${escapeHtml(draft.cover.title)}</strong><span>${escapeHtml(draft.cover.year)}</span>${imageSource(draft.cover.image)?`<img src="${escapeHtml(imageSource(draft.cover.image))}" alt="Gambar sampul">`:''}</div>`;
    else if(section==='teacher'||section==='students') {
      const person=section==='teacher'?draft.teacher:draft.students.find(s=>Number(s.id)===Number(studentId));
      body=`<div class="ad-preview-person">${imageSource(person.photo)?`<img src="${escapeHtml(imageSource(person.photo))}" alt="${escapeHtml(person.name)}" style="object-position:${escapeHtml(person.position||'50% 50%')}">`:'<div class="ad-photo-empty">Foto belum diunggah</div>'}<h3>${escapeHtml(person.name)}</h3><p>${escapeHtml(person.subject||person.description||'')}</p><p>${escapeHtml(person.message||'')}</p><p>${escapeHtml(person.note||'')}</p></div>`;
    } else if(section==='memories') {
      const memory=draft.memories.find(m=>String(m.id)===String(memoryId));
      if(memory)body=`<div class="ad-preview-person">${imageSource(memory.photo)?`<img class="is-landscape" src="${escapeHtml(imageSource(memory.photo))}" alt="${escapeHtml(memory.alt||memory.caption)}" style="object-position:${escapeHtml(memory.position||'50% 50%')}">`:'<div class="ad-photo-empty">Foto belum diunggah</div>'}<h3>${escapeHtml(memory.caption)}</h3><p>${escapeHtml(memory.date)}</p><small>Halaman ${memory.page} · Urutan ${Number(memory.order)+1}</small></div>`;
    } else if(section==='pages') {
      const page=draft.pages.find(p=>Number(p.id)===Number(pageId));
      const source=Number(page.id)===12?draft.farewell.photo:page.photo;
      body=`<div class="ad-preview-page">${page.ornament==='botanical'?'<span class="ad-preview-leaf" aria-hidden="true">❧</span>':''}<small>HALAMAN ${page.id}</small><h3>${escapeHtml(page.title)}</h3><p>${escapeHtml(page.subtitle)}</p>${imageSource(source)?`<img src="${escapeHtml(imageSource(source))}" alt="Visual halaman">`:''}<p>${escapeHtml(page.text)}</p>${Number(page.id)===12?`<p>${escapeHtml(draft.farewell.text)}</p>`:''}</div>`;
    } else body=`<p>Pengaturan kualitas: <strong>${escapeHtml(draft.settings.quality)}</strong>.</p><p>Audio ${draft.settings.audioEnabled?'aktif':'nonaktif'} · Partikel ${draft.settings.particles?'aktif':'nonaktif'} · Pesan anonim ${draft.settings.messagesEnabled?'aktif':'nonaktif'}.</p>`;
    dialog.innerHTML=`<div class="ad-section-head"><div><span class="ad-eyebrow">PREVIEW · BELUM DISIMPAN</span><h2>${escapeHtml(title)}</h2></div><button type="button" class="ad-button ad-secondary" data-close-preview aria-label="Tutup preview">×</button></div>${body}${onPreview?'<button type="button" class="ad-button" data-book-preview>Lihat di buku ↗</button>':''}`;
    container.append(dialog);dialog.showModal();
    dialog.querySelector('[data-close-preview]').onclick=()=>dialog.close();
    dialog.querySelector('[data-book-preview]')?.addEventListener('click',()=>{dialog.close();onPreview(clone(draft),section==='cover'?1:section==='teacher'?3:section==='students'?7+Math.floor((studentId-1)/8):section==='memories'?Number(draft.memories.find(m=>String(m.id)===String(memoryId))?.page)||4:pageId);});
    dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  }
  async function click(event) {
    const element=event.target.closest('button,[data-section]'); if(!element)return;
    const action=element.dataset.action;
    try {
      if(element.dataset.section){section=element.dataset.section;notice='';render();return;}
      if(element.dataset.student){studentId=Number(element.dataset.student);render();return;}
      if(element.dataset.memory){memoryId=element.dataset.memory;render();return;}
      if(element.dataset.removePhoto){if(confirm('Hapus foto/audio ini dari konten?')){setPath(element.dataset.removePhoto,'');render();}return;}
      if(element.dataset.moderate){await api(`/api/admin/messages/${encodeURIComponent(element.dataset.moderate)}`,{method:'PATCH',body:{status:element.dataset.status}});messages=(await api('/api/admin/messages')).messages;inform('Status pesan berhasil diperbarui.');await onSaved(clone(content));render();return;}
      if(element.dataset.deleteMessage){if(!confirm('Hapus pesan ini secara permanen?'))return;await api(`/api/admin/messages/${encodeURIComponent(element.dataset.deleteMessage)}`,{method:'DELETE'});messages=messages.filter(m=>String(m.id)!==element.dataset.deleteMessage);inform('Pesan dihapus.');await onSaved(clone(content));render();return;}
      if(action==='exit'){if(!canLeave())return;onExit();}
      if(action==='show-password'){const input=container.querySelector('#admin-password');input.type=input.type==='password'?'text':'password';element.textContent=input.type==='password'?'Lihat':'Sembunyikan';element.setAttribute('aria-label',input.type==='password'?'Tampilkan password':'Sembunyikan password');}
      if(action==='logout'){if(!canLeave())return;await api('/api/auth/logout',{method:'POST'});csrfToken='';draft=undefined;content=undefined;notice='Anda sudah keluar.';noticeError=false;renderLogin();}
      if(action==='cancel'){if(!dirty||confirm('Batalkan semua perubahan yang belum disimpan?')){draft=clone(content);dirty=false;inform('Perubahan dibatalkan.');render();}}
      if(action==='preview')preview();
      if(action==='refresh-messages'){messages=(await api('/api/admin/messages')).messages;inform('Pesan berhasil dimuat.');render();}
      if(action==='add-memory'){const id=crypto.randomUUID();const last=Math.max(-1,...draft.memories.filter(m=>Number(m.page)===4).map(m=>Number(m.order)));draft.memories.push({id,page:4,photo:'',caption:'',date:'',alt:'',position:'50% 50%',order:last+1});memoryId=id;dirty=true;render();}
      if(action==='delete-memory'){if(!confirm('Hapus kenangan ini? Penghapusan diterapkan setelah Simpan.'))return;draft.memories=draft.memories.filter(m=>String(m.id)!==String(memoryId));memoryId='';dirty=true;render();}
      if(action==='memory-up'||action==='memory-down'){const selected=draft.memories.find(m=>String(m.id)===String(memoryId));const list=draft.memories.filter(m=>Number(m.page)===Number(selected.page)).sort((a,b)=>Number(a.order)-Number(b.order));const index=list.indexOf(selected), other=list[index+(action==='memory-up'?-1:1)];if(other){list.forEach((m,i)=>m.order=i);[selected.order,other.order]=[other.order,selected.order];dirty=true;render();}}
      if(action==='backup'){inform('Menyiapkan backup…');const backup=await api('/api/admin/backup');download(backup,`xii-ips-backup-${new Date().toISOString().slice(0,10)}.json`);inform('Backup berhasil diunduh.');}
      if(action==='export-students'){const data=await api('/api/admin/content');download((data.content||data).students,'xii-ips-siswa.json');inform('Data siswa berhasil diexport.');}
      if(action==='export-messages'){const data=await api('/api/admin/messages');download(data.messages,'xii-ips-pesan.json');inform('Data pesan berhasil diexport.');}
    }catch(error){if(error.name!=='AbortError')inform(error.message,true);}
  }
  function input(event) {
    const el=event.target;
    if(el.dataset.path){let value=el.type==='checkbox'?el.checked:el.value;if(el.type==='range'||el.dataset.path.endsWith('.page'))value=Number(value);setPath(el.dataset.path,value);}
    if(el.dataset.crop){const coords=(getPath(el.dataset.crop)||'50% 50%').split(' ');coords[Number(el.dataset.axis)]=`${el.value}%`;setPath(el.dataset.crop,coords.join(' '));const img=container.querySelector(`[data-photo-preview="${el.dataset.image}"] img`);if(img)img.style.objectPosition=coords.join(' ');}
    if(el.hasAttribute('data-student-search')){search=el.value;container.querySelector('[data-student-results]').innerHTML=studentList(draft.students.filter(s=>s.name.toLowerCase().includes(search.toLowerCase())),studentId);}
  }
  async function change(event) {
    const el=event.target;
    try {
      if(el.hasAttribute('data-page-select')){pageId=Number(el.value);render();}
      if(el.hasAttribute('data-message-filter')){messageFilter=el.value;render();}
      if(el.hasAttribute('data-message-search')){messageSearch=el.value;render();container.querySelector('[data-message-search]')?.focus();}
      if(el.dataset.upload)await upload(el.files?.[0],el.dataset.upload);
      if(el.hasAttribute('data-bulk-upload')){
        const files=[...el.files||[]];if(files.length>30)throw new Error('Unggah maksimal 30 foto dalam satu kali pilihan.');
        for(const file of files){const id=crypto.randomUUID();draft.memories.push({id,page:4,photo:'',caption:file.name.replace(/\.[^.]+$/,''),date:'',alt:'',position:'50% 50%',order:draft.memories.length});memoryId=id;dirty=true;await upload(file,`memories.${draft.memories.length-1}.photo`);}
        inform(`${files.length} foto diunggah. Atur caption/halaman, lalu Simpan perubahan.`);render();
      }
      if(el.hasAttribute('data-restore-file')&&el.files?.[0]){
        if(el.files[0].size>150*1024*1024)throw new Error('Ukuran backup maksimal 150 MB.');
        const backup=JSON.parse(await el.files[0].text());
        if(!confirm('RESTORE akan mengganti konten dan pesan saat ini. Sudah menyimpan backup terbaru dan ingin melanjutkan?')){el.value='';return;}
        inform('Memulihkan backup…');await api('/api/admin/restore',{method:'POST',body:{backup}});await load();await onSaved(clone(content));inform('Data berhasil dipulihkan dari backup.');
      }
    }catch(error){if(error.name!=='AbortError')inform(error instanceof SyntaxError?'File bukan JSON backup yang valid.':error.message,true);}
  }
  async function submit(event) {
    event.preventDefault();
    try {
      if(event.target.hasAttribute('data-admin-login')){
        if(busy)return;const form=new FormData(event.target);busy=true;
        const button=event.target.querySelector('button[type="submit"]');button.disabled=true;button.textContent='Memeriksa…';
        try{const data=await api('/api/auth/login',{method:'POST',body:{username:form.get('username'),password:form.get('password')}});csrfToken=data.csrfToken;username=data.username;notice='';await load();}
        finally{busy=false;if(!draft){button.disabled=false;button.textContent='Masuk dashboard ↗';}}
      }else if(event.target.hasAttribute('data-admin-account')){
        const form = new FormData(event.target), result = event.target.querySelector('[data-account-result]'), button = event.target.querySelector('button[type="submit"]');
        if(form.get('newPassword') !== form.get('confirmPassword')){result.textContent='Ulangi password baru dengan nilai yang sama.';event.target.elements.confirmPassword.focus();return;}
        button.disabled=true;result.textContent='Memperbarui akun…';
        try {
          const data=await api('/api/admin/account',{method:'POST',body:{currentPassword:form.get('currentPassword'),newUsername:form.get('newUsername'),newPassword:form.get('newPassword')}});
          csrfToken=data.csrfToken;username=data.username;inform('ID dan password admin berhasil diperbarui. Sesi lain telah diakhiri.');render();
        } catch(error) { result.textContent=error.message;button.disabled=false; }
      }else if(event.target.hasAttribute('data-admin-save'))await save();
    }catch(error){if(error.name!=='AbortError')inform(error.message,true);}
  }
  container.addEventListener('click',click);container.addEventListener('input',input);container.addEventListener('change',change);container.addEventListener('submit',submit);
  window.addEventListener('beforeunload',beforeUnload);
  container.innerHTML='<div class="admin-app ad-loading" role="status">Membuka ruang pengelola…</div>';
  try{const session=await api('/api/auth/session');csrfToken=session.csrfToken;username=session.username;await load();}
  catch(error){if(error.name!=='AbortError'){if(error.status!==401){notice='Tidak dapat terhubung ke server. Pastikan backend berjalan.';noticeError=true;}renderLogin();}}
  return {get hasUnsavedChanges(){return dirty || uploading > 0;},canLeave,dispose(){disposed=true;abort.abort();window.removeEventListener('beforeunload',beforeUnload);objectUrls.forEach(url=>URL.revokeObjectURL(url));container.removeEventListener('click',click);container.removeEventListener('input',input);container.removeEventListener('change',change);container.removeEventListener('submit',submit);container.querySelector('dialog')?.remove();}};
}

