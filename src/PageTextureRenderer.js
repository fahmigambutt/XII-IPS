import { CanvasTexture, SRGBColorSpace } from 'three';
import { TOC_ENTRIES, DEFAULT_PAGE_TITLES, safeImageURL, safePosition } from './page-content.js';

const W = 1024;
const H = 1280;
const INK = '#3b2b22';
const SOFT = '#78624c';
const GOLD = '#947139';
const SERIF = '"Cormorant Garamond", Georgia, serif';
const SANS = '"DM Sans", Arial, sans-serif';

function randomFactory(seed) {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
}

function wrap(ctx, text, width, maxLines = Infinity) {
  const paragraphs = String(text || '').split('\n');
  const lines = [];
  for (const paragraph of paragraphs) {
    let line = '';
    for (const word of paragraph.split(/\s+/)) {
      if (line && ctx.measureText(`${line} ${word}`).width > width) { lines.push(line); line = word; }
      else line = line ? `${line} ${word}` : word;
    }
    if (line) lines.push(line);
  }
  if (lines.length > maxLines) {
    const limited = lines.slice(0, maxLines);
    let last = limited[limited.length - 1];
    while (ctx.measureText(`${last}…`).width > width && last.length) last = last.slice(0, -1);
    limited[limited.length - 1] = `${last}…`;
    return limited;
  }
  return lines;
}

function textBlock(ctx, text, x, y, width, { size = 26, line = size * 1.45, color = INK, font = SANS, maxLines = Infinity, align = 'left', weight = '' } = {}) {
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  const lines = wrap(ctx, text, width, maxLines);
  lines.forEach((item, index) => ctx.fillText(item, x, y + index * line));
  ctx.textAlign = 'left';
  return y + lines.length * line;
}

function smallCaps(ctx, text, x, y, { size = 15, color = SOFT, align = 'left', spacing = 2.6 } = {}) {
  ctx.font = `${size}px ${SANS}`;
  ctx.fillStyle = color;
  let width = 0;
  for (const letter of text) width += ctx.measureText(letter).width + spacing;
  let cursor = x - (align === 'center' ? width / 2 : align === 'right' ? width : 0);
  for (const letter of text) { ctx.fillText(letter, cursor, y); cursor += ctx.measureText(letter).width + spacing; }
}

function botanical(ctx, x, y, scale = 1, color = '#927341', rotation = 0) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rotation); ctx.scale(scale, scale);
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.globalAlpha = .65; ctx.lineWidth = 1.7;
  ctx.beginPath(); ctx.moveTo(0, 95); ctx.bezierCurveTo(-8, 16, 18, -38, 2, -140); ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const leafY = 63 - i * 24;
    const side = i % 2 ? -1 : 1;
    ctx.beginPath(); ctx.moveTo(4, leafY);
    ctx.bezierCurveTo(40 * side, leafY - 30, 58 * side, leafY - 38, 39 * side, leafY - 2);
    ctx.bezierCurveTo(24 * side, leafY + 13, 9 * side, leafY + 8, 4, leafY); ctx.fill();
    ctx.globalAlpha = .35;
    ctx.beginPath(); ctx.moveTo(4, leafY); ctx.lineTo(40 * side, leafY - 18); ctx.stroke();
    ctx.globalAlpha = .58;
  }
  ctx.restore();
}

function paper(ctx, page = 0) {
  ctx.fillStyle = '#e9d8b2'; ctx.fillRect(0, 0, W, H);
  const random = randomFactory(page + 100);
  const glow = ctx.createRadialGradient(W * .48, H * .43, 70, W * .48, H * .43, H * .78);
  glow.addColorStop(0, '#f3e6ca'); glow.addColorStop(.62, '#ecddba'); glow.addColorStop(1, '#d6bd89');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
  // Aged rag paper has uneven sizing and fine fibres, rather than a flat tint.
  for (let i = 0; i < 11; i++) {
    const x = random() * W, y = random() * H, radius = 130 + random() * 270;
    const wash = ctx.createRadialGradient(x, y, 0, x, y, radius);
    wash.addColorStop(0, `rgba(126,83,37,${.016 + random() * .022})`); wash.addColorStop(1, 'rgba(126,83,37,0)');
    ctx.fillStyle = wash; ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  const edges = [
    [0, 0, 58, 0, 0, 0, 58, H], [W, 0, W - 58, 0, W - 58, 0, 58, H],
    [0, 0, 0, 58, 0, 0, W, 58], [0, H, 0, H - 58, 0, H - 58, W, 58],
  ];
  for (const [x0, y0, x1, y1, x, y, width, height] of edges) {
    const edge = ctx.createLinearGradient(x0, y0, x1, y1);
    edge.addColorStop(0, 'rgba(132,85,35,.21)'); edge.addColorStop(.2, 'rgba(145,98,46,.09)'); edge.addColorStop(1, 'rgba(145,98,46,0)');
    ctx.fillStyle = edge; ctx.fillRect(x, y, width, height);
  }
  const leftPage = page > 0 && page % 2 === 0;
  const light = ctx.createLinearGradient(leftPage ? W : 0, 0, leftPage ? 0 : W, 0);
  light.addColorStop(0, 'rgba(82,51,24,.21)'); light.addColorStop(.065, 'rgba(112,76,35,.025)');
  light.addColorStop(.94, 'rgba(112,76,35,0)'); light.addColorStop(1, 'rgba(112,76,35,.04)');
  ctx.fillStyle = light; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 11000; i++) {
    ctx.fillStyle = i % 2 ? 'rgba(104,68,30,.039)' : 'rgba(255,250,225,.14)';
    ctx.fillRect(random() * W, random() * H, random() * 2.3 + .3, random() * 1.5 + .3);
  }
  ctx.lineWidth = .45;
  for (let i = 0; i < 390; i++) {
    const x = random() * W, y = random() * H;
    ctx.strokeStyle = i % 2 ? 'rgba(106,80,38,.06)' : 'rgba(255,253,231,.17)';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 1 + random() * 4, y + 3 + random() * 13); ctx.stroke();
  }
  // Foxing is concentrated at the margins so the printed content stays clear.
  for (let i = 0; i < 90; i++) {
    const edge = Math.floor(random() * 4), inset = 8 + random() * 51;
    const x = edge === 0 ? inset : edge === 1 ? W - inset : random() * W;
    const y = edge === 2 ? inset : edge === 3 ? H - inset : random() * H;
    ctx.fillStyle = `rgba(132,86,38,${.025 + random() * .055})`;
    ctx.beginPath(); ctx.ellipse(x, y, .7 + random() * 2.4, .6 + random() * 2, random() * 3, 0, Math.PI * 2); ctx.fill();
  }
}

function placeholder(ctx, x, y, width, height, { portrait = false } = {}) {
  ctx.fillStyle = '#dcd0b5'; ctx.fillRect(x, y, width, height);
  const wash = ctx.createLinearGradient(x, y, x + width, y + height);
  wash.addColorStop(0, '#d4cbb3'); wash.addColorStop(1, '#e8d7b5');
  ctx.fillStyle = wash; ctx.fillRect(x, y, width, height);
  ctx.save(); ctx.strokeStyle = '#9b8763'; ctx.globalAlpha = .55; ctx.lineWidth = 1;
  ctx.strokeRect(x + 11, y + 11, width - 22, height - 22);
  ctx.beginPath();
  if (portrait) {
    ctx.arc(x + width / 2, y + height * .34, Math.min(width, height) * .12, 0, Math.PI * 2);
    ctx.moveTo(x + width * .25, y + height * .69);
    ctx.bezierCurveTo(x + width * .25, y + height * .43, x + width * .75, y + height * .43, x + width * .75, y + height * .69);
    ctx.stroke();
  } else {
    const cx = x + width / 2; const cy = y + height * .42;
    ctx.moveTo(cx - 21, cy - 15); ctx.lineTo(cx + 21, cy - 15); ctx.lineTo(cx + 21, cy + 15); ctx.lineTo(cx - 21, cy + 15); ctx.closePath();
    ctx.moveTo(cx - 15, cy + 9); ctx.lineTo(cx - 1, cy - 3); ctx.lineTo(cx + 6, cy + 4); ctx.lineTo(cx + 12, cy - 2); ctx.lineTo(cx + 18, cy + 9);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + 10, cy - 8, 3, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
  textBlock(ctx, 'FOTO BELUM\nDITAMBAHKAN', x + width / 2, y + height * .78, width - 18, { size: Math.min(15, width * .075), line: Math.min(20, width * .1), color: '#705e42', align: 'center' });
}

function drawCropped(ctx, image, x, y, width, height, position = '50% 50%') {
  const [px, py] = safePosition(position).split(' ').map(value => Math.min(100, Math.max(0, parseFloat(value))) / 100);
  const ratio = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sourceW = width / ratio; const sourceH = height / ratio;
  const sourceX = (image.naturalWidth - sourceW) * px;
  const sourceY = (image.naturalHeight - sourceH) * py;
  ctx.drawImage(image, sourceX, sourceY, sourceW, sourceH, x, y, width, height);
}

export class PageTextureRenderer {
  constructor(content, { resolution = 1024, anisotropy = 4 } = {}) {
    this.content = content;
    this.resolution = resolution;
    this.anisotropy = anisotropy;
    this.cache = new Map();
    this.images = new Map();
    this.generation = 0;
    this.messages = [];
    this.messageSignature = '';
    this.pinned = new Set(['cover', 'endpaper']);
    this.tocRows = [];
    this.photoHotspots = new Map();
  }

  async image(url) {
    url = safeImageURL(url);
    if (!url) return null;
    if (this.images.has(url)) return this.images.get(url);
    const pending = new Promise(resolve => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = url;
    });
    this.images.set(url, pending);
    if (this.images.size > 24) this.images.delete(this.images.keys().next().value);
    return pending;
  }

  canvas() {
    const canvas = document.createElement('canvas');
    canvas.width = this.resolution;
    canvas.height = Math.round(this.resolution * H / W);
    const ctx = canvas.getContext('2d');
    ctx.scale(this.resolution / W, this.resolution / W);
    return { canvas, ctx };
  }

  texture(canvas, key) {
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = this.anisotropy;
    texture.name = `Yearbook:${key}`;
    this.cache.set(key, texture);
    while (this.cache.size > 7) {
      const oldest = [...this.cache.keys()].find(item => !this.pinned.has(item) && item !== key)
        || [...this.cache.keys()].find(item => item !== key);
      this.cache.get(oldest).dispose();
      this.cache.delete(oldest);
    }
    return texture;
  }

  cached(key) {
    if (!this.cache.has(key)) return null;
    const value = this.cache.get(key);
    this.cache.delete(key); this.cache.set(key, value);
    return value;
  }

  pinPages(numbers = []) {
    const pages = [...new Set(numbers.map(Number).filter(page => page >= 2 && page <= 12))].slice(0, 5);
    this.pinned = new Set(['cover', 'endpaper', ...pages.map(page => `page-${page}`)]);
  }

  setMessages(messages = []) {
    const next = messages.filter(message => !message.status || message.status === 'approved').slice(0, 2).map(message => ({
      id: message.id,
      recipientId: Number(message.recipientId),
      recipientName: String(message.recipientName || ''),
      body: String(message.body || ''),
    }));
    const signature = JSON.stringify(next);
    if (signature === this.messageSignature) return false;
    this.messages = next;
    this.messageSignature = signature;
    this.generation++;
    this.cache.get('page-11')?.dispose();
    this.cache.delete('page-11');
    return true;
  }

  async cover() {
    const cached = this.cached('cover'); if (cached) return cached;
    const { canvas, ctx } = this.canvas();
    const cover = this.content.cover || {};
    ctx.fillStyle = '#6a282b'; ctx.fillRect(0, 0, W, H);
    const image = await this.image(cover.image);
    if (image) { drawCropped(ctx, image, 0, 0, W, H); ctx.fillStyle = 'rgba(93,24,28,.64)'; ctx.fillRect(0, 0, W, H); }
    const random = randomFactory(42);
    for (let y = 0; y < H; y += 2.1) { ctx.strokeStyle = `rgba(242,198,155,${.035 + random() * .045})`; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y + random() * .6); ctx.stroke(); }
    for (let x = 0; x < W; x += 2.2) { ctx.strokeStyle = `rgba(27,8,10,${.06 + random() * .07})`; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + random() * .6, H); ctx.stroke(); }
    for (let i = 0; i < 5200; i++) {
      ctx.fillStyle = i % 3 ? 'rgba(231,182,151,.065)' : 'rgba(26,8,10,.07)';
      ctx.fillRect(random() * W, random() * H, .4 + random() * 1.7, .4 + random() * 1.4);
    }
    const vignette = ctx.createRadialGradient(510, 460, 80, 510, 460, 950);
    vignette.addColorStop(0, 'rgba(255,213,160,.055)'); vignette.addColorStop(.65, 'rgba(41,8,12,.025)'); vignette.addColorStop(1, 'rgba(26,5,9,.38)');
    ctx.fillStyle = vignette; ctx.fillRect(0, 0, W, H);
    // Frayed bookcloth catches a warmer light at the board edges.
    for (const [x, y, width, height] of [[8, 12, 12, H - 24], [W - 20, 12, 12, H - 24], [12, 8, W - 24, 12], [12, H - 20, W - 24, 12]]) {
      ctx.fillStyle = 'rgba(201,148,113,.095)'; ctx.fillRect(x, y, width, height);
    }
    for (let i = 0; i < 145; i++) {
      const nearVerticalEdge = i % 2 === 0;
      const x = nearVerticalEdge ? (i % 4 ? W - 17 - random() * 12 : 10 + random() * 12) : random() * W;
      const y = nearVerticalEdge ? random() * H : (i % 3 ? H - 20 - random() * 10 : 8 + random() * 14);
      ctx.strokeStyle = `rgba(219,164,123,${.05 + random() * .08})`; ctx.lineWidth = .5;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (nearVerticalEdge ? random() * 2 : random() * 8), y + (nearVerticalEdge ? random() * 8 : random() * 2)); ctx.stroke();
    }
    const gold = ctx.createLinearGradient(100, 70, 900, 1220);
    gold.addColorStop(0, '#d4b879'); gold.addColorStop(.43, '#af884d'); gold.addColorStop(.7, '#dec68e'); gold.addColorStop(1, '#b18b50');
    ctx.strokeStyle = gold; ctx.lineWidth = 2; ctx.strokeRect(72, 69, 880, 1142);
    ctx.lineWidth = .7; ctx.strokeRect(83, 80, 858, 1120);
    for (const [x, y, sx, sy] of [[72, 69, 1, 1], [952, 69, -1, 1], [72, 1211, 1, -1], [952, 1211, -1, -1]]) {
      ctx.save(); ctx.translate(x, y); ctx.scale(sx, sy); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, 36); ctx.quadraticCurveTo(34, 34, 36, 0); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.translate(x, y); ctx.scale(sx, sy); ctx.lineWidth = .8;
      ctx.beginPath(); ctx.moveTo(9, 58); ctx.bezierCurveTo(55, 57, 58, 36, 57, 10); ctx.moveTo(22, 47); ctx.quadraticCurveTo(41, 42, 47, 22); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(28, 40, 5, 11, -.7, 0, Math.PI * 2); ctx.ellipse(41, 27, 4, 9, .7, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
    smallCaps(ctx, 'A COLLECTION OF US', W / 2, 210, { color: '#d7c99d', align: 'center', size: 16, spacing: 4.2 });
    botanical(ctx, W / 2, 308, .37, '#d2c38f', -.18);
    ctx.fillStyle = gold; ctx.textAlign = 'center';
    const title = cover.title || 'XII IPS';
    if (/^XII\s+IPS$/i.test(title)) {
      ctx.font = `162px ${SERIF}`; ctx.fillText('XII', W / 2, 530);
      ctx.font = `154px ${SERIF}`; ctx.fillText('IPS', W / 2, 690);
    } else {
      textBlock(ctx, title, W / 2, 510, 700, { font: SERIF, size: 118, line: 128, maxLines: 3, align: 'center', color: '#d7c695' });
    }
    ctx.textAlign = 'left';
    ctx.strokeStyle = gold; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(412, 755); ctx.lineTo(612, 755); ctx.stroke();
    smallCaps(ctx, cover.year || '2025/2026/2027', W / 2, 816, { color: '#d7c99d', align: 'center', size: 23, spacing: 3.2 });
    textBlock(ctx, cover.tagline || 'OUR MEMORIES, OUR STORY', W / 2, 925, 740, { font: SANS, size: 17, line: 27, maxLines: 3, align: 'center', color: '#e2d6b2' });
    botanical(ctx, W / 2 - 34, 1078, .38, '#c8bc8c', -.65);
    botanical(ctx, W / 2 + 34, 1078, .38, '#c8bc8c', .65);
    smallCaps(ctx, 'MEMORY ARCHIVE', W / 2, 1156, { color: '#bea475', align: 'center', size: 12, spacing: 4 });
    const spineShade = ctx.createLinearGradient(0, 0, 63, 0);
    spineShade.addColorStop(0, 'rgba(0,0,0,.24)'); spineShade.addColorStop(.55, 'rgba(0,0,0,.05)'); spineShade.addColorStop(.75, 'rgba(0,0,0,.16)'); spineShade.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = spineShade; ctx.fillRect(0, 0, 63, H);
    return this.texture(canvas, 'cover');
  }

  async endpaper() {
    const cached = this.cached('endpaper'); if (cached) return cached;
    const { canvas, ctx } = this.canvas(); paper(ctx);
    botanical(ctx, W / 2, H / 2, 1.1, '#a28a5b', -.12);
    return this.texture(canvas, 'endpaper');
  }

  async photo(ctx, item, x, y, width, height, options = {}) {
    const image = await this.image(item?.photo);
    if (image) {
      drawCropped(ctx, image, x, y, width, height, item.position);
      if (options.page) {
        const rect = options.hotspotRect || { x, y, width, height };
        this.photoHotspots.get(options.page)?.push({
          x: rect.x / W, y: rect.y / H, width: rect.width / W, height: rect.height / H,
          url: safeImageURL(item.photo), caption: item.caption || item.name || item.alt || 'Foto kenangan',
        });
      }
    }
    else placeholder(ctx, x, y, width, height, options);
  }

  header(ctx, page) {
    const data = this.content.pages?.find(item => Number(item.id) === page) || {};
    smallCaps(ctx, page >= 7 && page <= 10 ? `THE CLASS  /  ${String((page - 7) * 8 + 1).padStart(2, '0')}—${String((page - 6) * 8).padStart(2, '0')}` : 'XII IPS · MEMORY ARCHIVE', 91, 85, { size: 13 });
    let y = textBlock(ctx, data.title || DEFAULT_PAGE_TITLES[page], 90, 156, data.photo && page !== 12 ? 700 : 835, { font: SERIF, size: page >= 7 && page <= 10 ? 57 : 65, line: 66, maxLines: 2 });
    if (data.subtitle) y = textBlock(ctx, data.subtitle, 93, y + 8, 810, { size: 19, color: SOFT, line: 28, maxLines: 2 });
    if (data.text && page !== 12) y = textBlock(ctx, data.text, 93, y + 8, 810, { size: 21, color: SOFT, line: 29, maxLines: 3 });
    if (data.ornament !== 'none') botanical(ctx, 914, 186, .28, '#9b8153', .4);
    ctx.strokeStyle = '#ac9265'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(92, y + 20); ctx.lineTo(932, y + 20); ctx.stroke();
    return Math.max(260, y + 54);
  }

  footer(ctx, page) {
    ctx.strokeStyle = '#bca67f'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(92, 1193); ctx.lineTo(932, 1193); ctx.stroke();
    smallCaps(ctx, this.content.cover?.title || 'XII IPS', 93, 1225, { size: 11, spacing: 2 });
    smallCaps(ctx, String(page).padStart(2, '0'), 931, 1225, { size: 13, align: 'right', spacing: 1 });
  }

  async page(page) {
    page = Number(page);
    if (page === 1) return this.cover();
    if (page < 2 || page > 12) return this.endpaper();
    const key = `page-${page}`;
    const cached = this.cached(key); if (cached) return cached;
    const generation = this.generation;
    this.photoHotspots.set(page, []);
    const { canvas, ctx } = this.canvas(); paper(ctx, page);
    const top = this.header(ctx, page);
    const pageData = this.content.pages?.find(item => Number(item.id) === page) || {};
    if (pageData.photo && page !== 12) await this.photo(ctx, pageData, 806, 112, 115, 88, { page });
    if (page === 2) {
      this.tocRows = [];
      textBlock(ctx, 'The chapters we keep.', 94, top + 30, 800, { font: SERIF, size: 31, color: SOFT });
      TOC_ENTRIES.forEach((entry, i) => {
        const y = top + 125 + i * 121;
        smallCaps(ctx, String(i + 1).padStart(2, '0'), 95, y, { size: 12, color: GOLD, spacing: 1 });
        textBlock(ctx, entry.title, 141, y + 2, 660, { font: SERIF, size: 35, line: 41, maxLines: 1 });
        textBlock(ctx, entry.label, 143, y + 35, 640, { size: 15, color: SOFT });
        textBlock(ctx, entry.number, 921, y + 3, 50, { font: SERIF, size: 29, align: 'right', color: GOLD });
        ctx.strokeStyle = '#bca67f'; ctx.beginPath(); ctx.moveTo(143, y + 61); ctx.lineTo(926, y + 61); ctx.stroke();
      });
    } else if (page === 3) {
      const teacher = this.content.teacher || {};
      ctx.save(); ctx.shadowColor = 'rgba(79,46,22,.18)'; ctx.shadowBlur = 15; ctx.shadowOffsetY = 7; ctx.fillStyle = '#f1e5cb'; ctx.fillRect(261, top + 6, 502, 505); ctx.restore();
      await this.photo(ctx, teacher, 278, top + 23, 468, 414, { portrait: true, page });
      smallCaps(ctx, 'OUR HOMEROOM TEACHER', 512, top + 479, { size: 12, align: 'center', spacing: 2.4 });
      let y = textBlock(ctx, teacher.name || 'Perdini Adma Sari, S.Pd.', 512, top + 571, 820, { font: SERIF, size: 41, line: 48, align: 'center', maxLines: 2 });
      if (teacher.subject) y = textBlock(ctx, teacher.subject, 512, y + 9, 780, { size: 19, align: 'center', color: SOFT, maxLines: 1 });
      textBlock(ctx, teacher.message || 'Pesan dari wali kelas akan ditambahkan di sini.', 512, y + 35, 740, { font: SERIF, size: 29, line: 39, align: 'center', color: SOFT, maxLines: 5 });
      if (!teacher.message) smallCaps(ctx, 'PESAN BELUM DITAMBAHKAN', 512, 1129, { size: 11, align: 'center' });
    } else if (page >= 4 && page <= 6) {
      const items = (this.content.memories || []).filter(item => Number(item.page) === page).sort((a, b) => (a.order || 0) - (b.order || 0));
      while (items.length < 3) items.push({ caption: '', photo: '' });
      if (items.length === 3) {
        const space = 1160 - top;
        const mainH = Math.min(372, space * .46);
        await this.memoryFrame(ctx, items[0], 105, top + 14, 808, mainH, -.018, { page });
        const lowerY = top + mainH + 105;
        const lowerH = Math.min(265, 1155 - lowerY - 50);
        await this.memoryFrame(ctx, items[1], 111, lowerY, 368, lowerH, -.052, { page });
        await this.memoryFrame(ctx, items[2], 539, lowerY + 6, 368, lowerH, .045, { page });
      } else {
        const cols = items.length <= 6 ? 2 : 3;
        const rows = Math.ceil(items.length / cols), cellW = 840 / cols, cellH = (1153 - top) / rows;
        for (let index = 0; index < items.length; index++) {
          const item = items[index], x = 98 + (index % cols) * cellW, y = top + 9 + Math.floor(index / cols) * cellH;
          const photoH = Math.max(14, cellH - Math.min(64, cellH * .35));
          await this.memoryFrame(ctx, item, x + 9, y, cellW - 38, photoH, index % 2 ? .019 : -.019, { page, compact: true });
        }
      }
    } else if (page >= 7 && page <= 10) {
      const students = (this.content.students || []).slice((page - 7) * 8, (page - 6) * 8);
      const gap = 36; const cardW = 405; const cellH = (1170 - top) / 4;
      for (let index = 0; index < students.length; index++) {
        const student = students[index];
        const x = 93 + (index % 2) * (cardW + gap);
        const y = top + Math.floor(index / 2) * cellH;
        const photoH = Math.min(176, cellH - 28); const photoW = photoH * .8;
        ctx.fillStyle = '#f0e4ca'; ctx.fillRect(x, y, photoW + 12, photoH + 12);
        await this.photo(ctx, student, x + 6, y + 6, photoW, photoH, { portrait: true, page });
        smallCaps(ctx, String(student.id).padStart(2, '0'), x + photoW + 30, y + 23, { size: 12, color: GOLD, spacing: 2 });
        const nameY = textBlock(ctx, student.name, x + photoW + 30, y + 62, cardW - photoW - 32, { font: SANS, size: 23, line: 28, maxLines: 4, color: INK, weight: '500' });
        if (student.description) textBlock(ctx, student.description, x + photoW + 30, nameY + 3, cardW - photoW - 32, { font: SERIF, size: 19, line: 23, maxLines: 1, color: SOFT });
        ctx.strokeStyle = '#bca67f'; ctx.beginPath(); ctx.moveTo(x, y + cellH - 12); ctx.lineTo(x + cardW, y + cellH - 12); ctx.stroke();
      }
    } else if (page === 11) {
      if (this.messages.length) {
        const letterH = this.messages.length === 1 ? 286 : 172;
        for (let index = 0; index < this.messages.length; index++) {
          const message = this.messages[index];
          const recipient = message.recipientName || this.content.students?.find(student => student.id === message.recipientId)?.name || '';
          const y = top + 68 + index * 196;
          ctx.save();
          ctx.shadowColor = 'rgba(67,59,32,.11)'; ctx.shadowBlur = 17; ctx.shadowOffsetY = 6;
          ctx.fillStyle = index % 2 ? '#ddcba7' : '#efe1bf'; ctx.fillRect(143, y, 738, letterH);
          ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
          smallCaps(ctx, `UNTUK ${recipient}`, 174, y + 37, { size: 12, spacing: 1.1, color: '#7a4e36' });
          textBlock(ctx, message.body, 174, y + 79, 668, { font: SERIF, size: 27, line: 34, maxLines: this.messages.length === 1 ? 4 : 2, color: INK });
          smallCaps(ctx, '— SESEORANG DARI CERITA INI', 849, y + letterH - 21, { size: 9, spacing: 1, align: 'right' });
          ctx.restore();
        }
      } else {
      ctx.save(); ctx.translate(512, top + 249); ctx.rotate(-.045);
      ctx.shadowColor = 'rgba(67,59,32,.13)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
      ctx.fillStyle = '#d9c29b'; ctx.fillRect(-290, -155, 580, 310); ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      ctx.strokeStyle = '#ab8c5d'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-290, -155); ctx.lineTo(0, 42); ctx.lineTo(290, -155); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-290, 155); ctx.lineTo(-73, -8); ctx.moveTo(290, 155); ctx.lineTo(73, -8); ctx.stroke();
      ctx.fillStyle = '#7d3433'; ctx.beginPath(); ctx.arc(0, 50, 29, 0, Math.PI * 2); ctx.fill();
      botanical(ctx, 0, 56, .14, '#d9bd82', 0); ctx.restore();
      }
      textBlock(ctx, 'Some words deserve\na little place to stay.', 512, top + 528, 770, { font: SERIF, size: 43, line: 51, align: 'center', maxLines: 2 });
      textBlock(ctx, 'Untuk seseorang yang menjadi bagian dari cerita ini.\nTulis pesan tanpa nama, simpan kesan yang berarti.', 512, top + 680, 770, { size: 21, line: 34, color: SOFT, align: 'center', maxLines: 3 });
      smallCaps(ctx, 'TULIS SEBUAH PESAN  ↗', 512, 1109, { size: 14, color: INK, align: 'center', spacing: 1.7 });
      textBlock(ctx, 'Pesan ditinjau admin sebelum ditampilkan.', 512, 1160, 780, { size: 15, color: SOFT, align: 'center' });
    } else if (page === 12) {
      const pageData = this.content.pages?.find(item => Number(item.id) === page) || {};
      await this.memoryFrame(ctx, { photo: this.content.farewell?.photo || pageData.photo, position: this.content.farewell?.position, caption: '' }, 112, top + 12, 800, 366, -.016, { page });
      const farewell = this.content.farewell?.text || 'Halaman boleh berakhir. Cerita kita tetap punya tempat untuk dikenang.';
      if (!this.content.farewell?.text) smallCaps(ctx, 'TEKS CONTOH · DAPAT DIGANTI ADMIN', 512, top + 487, { size: 10, align: 'center' });
      textBlock(ctx, farewell, 512, top + 518, 730, { font: SERIF, size: 31, line: 40, color: INK, align: 'center', maxLines: 4 });
      textBlock(ctx, 'With love, XII IPS', 512, 1030, 730, { font: SERIF, size: 32, color: SOFT, align: 'center' });
      smallCaps(ctx, 'TUTUP BUKU  ↙', 512, 1119, { size: 13, align: 'center', spacing: 2.2 });
    }
    this.footer(ctx, page);
    if (generation !== this.generation) return this.page(page);
    return this.texture(canvas, key);
  }

  async memoryFrame(ctx, item, x, y, width, height, angle, { page, compact = false } = {}) {
    ctx.save(); ctx.translate(x + width / 2, y + height / 2); ctx.rotate(angle);
    ctx.shadowColor = 'rgba(75,65,40,.15)'; ctx.shadowBlur = 15; ctx.shadowOffsetY = 6;
    const captionH = compact ? Math.min(48, height * .45) : 71;
    ctx.fillStyle = '#efe1c4'; ctx.fillRect(-width / 2 - 12, -height / 2 - 12, width + 24, height + captionH);
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    await this.photo(ctx, item, -width / 2, -height / 2, width, height, { page, hotspotRect: { x, y, width, height } });
    textBlock(ctx, item.caption || 'Ruang untuk sebuah kenangan.', -width / 2 + 8, height / 2 + (compact ? Math.min(26, captionH * .7) : 33), width - 15, { font: SERIF, size: compact ? Math.min(19, width / 12) : width > 500 ? 23 : 20, line: 25, maxLines: 1, color: '#745e43' });
    if (item.date) smallCaps(ctx, item.date, width / 2 - 10, height / 2 + 52, { size: 9, align: 'right', spacing: .7 });
    ctx.fillStyle = 'rgba(164,132,80,.28)'; ctx.fillRect(-width / 2 + 15, -height / 2 - 26, Math.min(83, width * .3), 29);
    ctx.restore();
  }

  setContent(content) {
    this.content = content;
    this.generation++;
    for (const texture of this.cache.values()) texture.dispose();
    this.cache.clear();
    this.images.clear();
    this.photoHotspots.clear();
    this.tocRows = [];
  }

  dispose() {
    this.generation++;
    for (const texture of this.cache.values()) texture.dispose();
    this.cache.clear(); this.images.clear(); this.photoHotspots.clear();
  }
}
