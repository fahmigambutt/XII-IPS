export const TOC_ENTRIES = [
  { title: 'Our Homeroom Teacher', label: 'Sosok di balik perjalanan kita', page: 3, number: '03' },
  { title: 'Our Togetherness', label: 'Potongan cerita bersama', page: 4, number: '04' },
  { title: 'Our Class Memories', label: 'Kenangan yang ingin disimpan', page: 5, number: '05' },
  { title: 'Meet the Students', label: 'Tiga puluh dua cerita, satu kelas', page: 7, number: '07' },
  { title: 'Anonymous Messages', label: 'Kata-kata yang belum sempat terucap', page: 11, number: '11' },
  { title: 'Our Last Goodbye', label: 'Sampai bertemu di cerita berikutnya', page: 12, number: '12' },
];

export function escapeHTML(value = '') {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

export function safeImageURL(url) {
  return typeof url === 'string' && /^\/uploads\/[a-zA-Z0-9._-]+$/.test(url) ? url : '';
}

export function safePosition(value) {
  return typeof value === 'string' && /^\d{1,3}% \d{1,3}%$/.test(value) ? value : '50% 50%';
}

const paragraph = value => value ? `<p>${escapeHTML(value).replace(/\n/g, '<br>')}</p>` : '';

function photoHTML(photo, alt, position, className = '') {
  const url = safeImageURL(photo);
  return url
    ? `<button type="button" class="page-photo ${className}" data-photo="${escapeHTML(url)}" aria-label="Lihat foto ${escapeHTML(alt)}"><img src="${escapeHTML(url)}" alt="${escapeHTML(alt)}" loading="lazy" style="object-position:${safePosition(position)}"></button>`
    : `<div class="photo-placeholder ${className}" role="img" aria-label="Foto belum ditambahkan"><span aria-hidden="true">✧</span><small>FOTO BELUM DITAMBAHKAN</small></div>`;
}

export const DEFAULT_PAGE_TITLES = {
  1: 'XII IPS', 2: 'Table of Contents', 3: 'Our Homeroom Teacher',
  4: 'Our Togetherness', 5: 'Our Class Memories', 6: 'Little Moments, Lasting Memories',
  7: 'Meet the Students', 8: 'Meet the Students', 9: 'Meet the Students', 10: 'Meet the Students',
  11: 'Anonymous Messages', 12: 'Our Last Goodbye',
};

export function pageHTML(content, page, { messages = [] } = {}) {
  const pageData = content.pages?.find(item => Number(item.id) === Number(page)) || {};
  const title = pageData.title || (page === 1 ? content.cover?.title : '') || DEFAULT_PAGE_TITLES[page] || '';
  const kicker = page >= 7 && page <= 10 ? `THE CLASS / ${String((page - 7) * 8 + 1).padStart(2, '0')}—${String((page - 6) * 8).padStart(2, '0')}` : 'XII IPS · MEMORY ARCHIVE';
  let body = '';
  if (page === 1) {
    body = `<div class="reading-cover"><p class="page-kicker">${escapeHTML(content.cover?.year)}</p><h2>${escapeHTML(title)}</h2><p>${escapeHTML(content.cover?.tagline)}</p><button class="primary-button" data-goto="2">Buka buku <span aria-hidden="true">↗</span></button></div>`;
  } else if (page === 2) {
    body = `<nav class="contents-list" aria-label="Daftar isi">${TOC_ENTRIES.map(entry => `<button type="button" data-goto="${entry.page}"><span><strong>${escapeHTML(entry.title)}</strong><small>${escapeHTML(entry.label)}</small></span><span class="contents-number">${entry.number}</span></button>`).join('')}</nav>`;
  } else if (page === 3) {
    const teacher = content.teacher || {};
    body = `<figure class="teacher-portrait">${photoHTML(teacher.photo, teacher.name || 'Wali kelas', teacher.position)}<figcaption><h3>${escapeHTML(teacher.name || 'Perdini Adma Sari, S.Pd.')}</h3>${teacher.subject ? `<p>${escapeHTML(teacher.subject)}</p>` : '<small>Mata pelajaran belum ditambahkan</small>'}</figcaption></figure>${teacher.message ? `<blockquote>${paragraph(teacher.message)}</blockquote>` : '<p class="placeholder-note">Pesan wali kelas akan hadir di sini setelah ditambahkan melalui dashboard.</p>'}${paragraph(teacher.note)}`;
  } else if (page >= 4 && page <= 6) {
    const items = (content.memories || []).filter(item => Number(item.page) === page).sort((a, b) => (a.order || 0) - (b.order || 0));
    while (items.length < 3) items.push({ id: `placeholder-${items.length}`, caption: '', photo: '' });
    body = `<div class="memory-grid">${items.map(item => `<figure>${photoHTML(item.photo, item.alt || item.caption || 'Kenangan kelas', item.position)}<figcaption>${item.caption ? `<p>${escapeHTML(item.caption)}</p>` : '<p class="placeholder-note">Ruang untuk sebuah kenangan.</p>'}${item.date ? `<small>${escapeHTML(item.date)}</small>` : ''}</figcaption></figure>`).join('')}</div>`;
  } else if (page >= 7 && page <= 10) {
    const students = (content.students || []).slice((page - 7) * 8, (page - 6) * 8);
    body = `<div class="student-grid">${students.map(student => `<figure class="student-card" data-student-id="${Number(student.id)}">${photoHTML(student.photo, student.name, student.position)}<figcaption><small>${String(student.id).padStart(2, '0')}</small><h3>${escapeHTML(student.name)}</h3>${paragraph(student.description)}</figcaption></figure>`).join('')}</div>`;
  } else if (page === 11) {
    body = `<div class="letter-invitation"><span class="letter-symbol" aria-hidden="true">✉</span><p>Untuk seseorang yang menjadi bagian dari cerita ini.</p><p>Tinggalkan pesan tanpa nama. Setiap pesan akan ditinjau sebelum ditampilkan.</p>${content.settings?.messagesEnabled === false ? '<p class="placeholder-note">Pengiriman pesan sedang dinonaktifkan.</p>' : '<button type="button" class="primary-button" data-message-compose>Tulis sebuah pesan <span aria-hidden="true">↗</span></button>'}</div><section class="received-messages" aria-label="Pesan yang telah disetujui"><h3>Letters to remember</h3>${messages.length ? messages.map(message => `<blockquote><small>UNTUK ${escapeHTML(message.recipientName || content.students?.find(student => student.id === message.recipientId)?.name || '')}</small>${paragraph(message.body)}<footer>— seseorang dari cerita ini</footer></blockquote>`).join('') : '<p class="placeholder-note">Belum ada pesan yang disetujui. Cerita berikutnya bisa dimulai dari satu kalimatmu.</p>'}</section>`;
  } else if (page === 12) {
    body = `<figure class="farewell-photo">${photoHTML(content.farewell?.photo || pageData.photo, 'Foto perpisahan kelas', content.farewell?.position)}</figure>${content.farewell?.text ? `<div class="farewell-text">${paragraph(content.farewell.text)}</div>` : '<div class="farewell-text"><small class="placeholder-note">TEKS CONTOH · DAPAT DIGANTI ADMIN</small><p>Halaman boleh berakhir. Cerita kita tetap punya tempat untuk dikenang.</p></div>'}<p class="closing-signature">With love, XII IPS</p><button type="button" class="primary-button" data-close-book>Tutup Buku <span aria-hidden="true">↙</span></button>`;
  }
  return `<article class="reading-page reading-page-${page}" data-editorial-page="${page}">${page === 1 ? '' : `<p class="page-kicker">${escapeHTML(kicker)}</p><h2>${escapeHTML(title)}</h2>${pageData.subtitle ? `<p class="page-subtitle">${escapeHTML(pageData.subtitle)}</p>` : ''}${pageData.text ? `<div class="page-introduction">${paragraph(pageData.text)}</div>` : ''}${pageData.photo && page !== 12 ? `<figure class="editorial-photo">${photoHTML(pageData.photo, `Visual tambahan ${title}`, '50% 50%')}</figure>` : ''}`}${body}<footer class="page-folio"><span>${escapeHTML(content.cover?.title || 'XII IPS')}</span><span>${String(page).padStart(2, '0')} / 12</span></footer></article>`;
}
