import '@fontsource/cormorant-garamond/latin-400.css';
import '@fontsource/cormorant-garamond/latin-400-italic.css';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import './style.css';
import { BookRig } from './BookRig.js';
import { PageTextureRenderer } from './PageTextureRenderer.js';
import { AudioManager } from './AudioManager.js';
import { escapeHTML as esc, safeImageURL } from './page-content.js';
import { createSeed } from '../server/seed.js';

const bookIcon = '<svg viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M14 6c-3-2-7-2-11-1v17c4-1 8-1 11 1m0-17c3-2 7-2 11-1v17c-4-1-8-1-11 1V6Z" stroke="currentColor" stroke-width="1.2"/></svg>';
const arrow = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15m-5-5 5 5-5 5" stroke="currentColor" stroke-width="1.3"/></svg>';
document.querySelector('#app').innerHTML = `
<div class="loading" id="loading"><p>WELCOME TO XII IPS</p><span></span></div>
<div id="experience" class="experience">
  <header class="site-header"><button class="brand" aria-label="Kembali ke sampul">${bookIcon}<span>XII IPS<small>THE MEMORY ARCHIVE</small></span></button><span class="header-edition">VOLUME XII <i>✧</i> A STORY TO KEEP</span></header>
  <main class="main-experience" aria-label="Yearbook 3D di atas meja">
    <div class="stage-wrap"><div id="stage" class="stage"></div></div>
    <section class="hero" aria-labelledby="hero-title"><p class="eyebrow" id="hero-year">THE CLASS OF 2025 / 2026 / 2027</p><h1 id="hero-title">A place for<br><em>all our yesterdays.</em></h1><p class="hero-description">Di antara lembar yang menua,<br>cerita kita tetap tinggal.</p><button class="primary-button" data-open-book>Buka buku kenangan ${arrow}</button><p class="hero-caption">Our memories, our story.</p></section>
    <div class="reading-toolbar" hidden><div class="zoom-tools" role="group" aria-label="Ukuran buku"><button id="zoom-out" class="tool-button" aria-label="Perkecil buku">−</button><span id="zoom-level">100%</span><button id="zoom-in" class="tool-button" aria-label="Perbesar buku">+</button><button id="reset-view" class="text-button" aria-label="Atur ulang posisi buku">Atur ulang</button></div><button id="close-book" class="text-button">Tutup buku <span aria-hidden="true">×</span></button></div>
    <div class="page-actions" hidden><button id="write-letter" class="primary-button" hidden>Tulis pesan ${arrow}</button><button id="view-letters" class="text-button" hidden>Lihat surat yang diterima</button></div>
    <nav class="book-navigation" aria-label="Navigasi halaman" hidden><button id="prev" class="round-button" aria-label="Halaman sebelumnya">${arrow}</button><div class="page-indicator"><span id="page-number" aria-live="polite">02 — 03</span><div class="page-dots" aria-hidden="true">${[2,4,6,8,10,12].map(p=>`<span data-progress="${p}"></span>`).join('')}</div></div><button id="next" class="round-button" aria-label="Halaman berikutnya">${arrow}</button></nav>
    <p class="interaction-hint" id="interaction-hint">KLIK SAMPUL UNTUK MEMBUKA</p>
    <div id="fallback-note" class="fallback-note" role="status" hidden><p id="fallback-message"></p><button id="retry-3d" class="primary-button">Muat ulang 3D</button></div>
  </main>
  <footer class="site-footer"><a href="#admin" id="admin-link" hidden>ADMIN</a><span class="footer-signature">32 stories. <em>One place to remember.</em></span><div class="utility"><button id="audio" class="icon-button" aria-label="Aktifkan audio" title="Audio"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m12 5-6 5H3v4h3l6 5V5Zm4 4 5 6m0-6-5 6" stroke="currentColor" stroke-width="1.3"/></svg></button><button id="fullscreen" class="icon-button" aria-label="Layar penuh" title="Layar penuh"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" stroke="currentColor" stroke-width="1.3"/></svg></button></div></footer>
  <div id="notification" class="notification" role="status" hidden></div>
</div>
<div id="admin-root" hidden></div>
<dialog id="letter-dialog" class="letter-dialog"><button class="dialog-close" data-dialog-close aria-label="Tutup">×</button><p class="eyebrow">A LETTER WITHOUT A NAME</p><h2>Some words<br>are worth <em>keeping.</em></h2><p class="dialog-description">Untuk teman yang membuat cerita ini berarti.</p><form id="letter-form"><label for="recipient">Surat ini untuk</label><select id="recipient" name="recipientId" required></select><label for="letter-body">Yang ingin kamu sampaikan</label><textarea id="letter-body" name="body" rows="5" minlength="3" maxlength="1000" placeholder="Terima kasih sudah menjadi bagian dari cerita ini…" required></textarea><div class="letter-count"><span>Tanpa nama. Dengan sepenuh hati.</span><span id="letter-counter">0 / 1000</span></div><input class="honeypot" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><button class="primary-button" type="submit">Kirim surat ${arrow}</button><p class="moderation-note">Pesan ditinjau admin sebelum tampil. Hindari membagikan informasi pribadi.</p><p id="letter-result" role="status"></p></form></dialog>
<dialog id="letters-dialog" class="letters-dialog"><button class="dialog-close" data-dialog-close aria-label="Tutup surat">×</button><p class="eyebrow">LETTERS TO REMEMBER</p><h2>Kata-kata yang tinggal.</h2><div id="approved-letters"></div></dialog>
<dialog id="photo-dialog" class="photo-dialog"><button class="dialog-close" data-dialog-close aria-label="Tutup foto">×</button><img id="full-photo" alt="Foto kenangan yang diperbesar"><p id="photo-caption"></p></dialog>`;

const $ = selector => document.querySelector(selector), experience = $('#experience');
let content, textures, book, audio, messages = [], offline = false, failed3D = false, isOpen = false, activePage = 2, adminCleanup;
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
let notificationTimer;
function notify(message) { $('#notification').textContent = message; $('#notification').hidden = false; clearTimeout(notificationTimer); notificationTimer = setTimeout(()=>$('#notification').hidden=true,5000); }
async function request(path,options={}) {
  const response=await fetch(path,{...options,headers:{...(options.body instanceof FormData?{}:{'Content-Type':'application/json'}),...options.headers}});
  const result=await response.json(); if(!response.ok)throw new Error(result.error||'Permintaan gagal. Coba lagi.');return result;
}
function applyBranding() {
  document.title=`${content.cover.title} Memories — ${content.cover.tagline}`;
  $('#hero-year').textContent=`THE CLASS OF ${content.cover.year.split('/').join(' / ')}`;
  $('#audio').classList.toggle('active',!!audio?.enabled);$('#audio').setAttribute('aria-label',audio?.enabled?'Nonaktifkan audio':'Aktifkan audio');
}
function updatePage(page) {
  activePage=page; const base=2+2*Math.floor((page-2)/2), mobile=book?.isMobile;
  $('#page-number').textContent=mobile||base===12?`${String(page).padStart(2,'0')} / 12`:`${String(base).padStart(2,'0')} — ${String(base+1).padStart(2,'0')}`;
  $('#prev').disabled=page===2;$('#next').disabled=mobile?page===12:base===12;
  document.querySelectorAll('[data-progress]').forEach(el=>el.classList.toggle('active',Number(el.dataset.progress)===base));
  const letters=mobile?page===11:base===10;
  $('.page-actions').hidden=!isOpen||!letters;
  $('#write-letter').hidden=!letters||!content.settings.messagesEnabled;$('#view-letters').hidden=!letters||!messages.length;
}
function updateState(state) {
  const closed=['CLOSED_IDLE','INTRO','LOADING'].includes(state);isOpen=!closed;
  experience.classList.toggle('book-open',isOpen);experience.classList.toggle('busy',!['READING','CLOSED_IDLE'].includes(state));
  $('#admin-link').hidden=state!=='CLOSED_IDLE';$('.reading-toolbar').hidden=!isOpen;$('.book-navigation').hidden=!isOpen;
  $('#close-book').disabled=state!=='READING';
  $('#interaction-hint').textContent=isOpen?(book?.isMobile?'GESER UNTUK MEMBALIK · CUBIT UNTUK MEMPERBESAR':'GULIR UNTUK MEMBALIK · SHIFT + SERET UNTUK MENGGESER'):'KLIK SAMPUL UNTUK MEMBUKA';
  updatePage(activePage);
}
async function openBook() { if(failed3D){notify('Muat ulang tampilan 3D terlebih dahulu.');return;}book?.pause(false);await book?.open(); }
async function closeBook() { if(book?.state==='READING')await book.close(); }
async function navigateAdjacent(page) {
  if(!book||book.state!=='READING')return;
  const step=book.isMobile?1:2,target=Number(page);
  if(target===activePage)return;
  if(Math.abs(target-activePage)>step)return;
  await book.goTo(target);
}
async function loadMessages() {
  try{const data=await request('/api/messages');messages=data.messages||[];if(textures.setMessages(messages)&&book?.state==='READING')await book.refresh();updatePage(activePage);}catch{}
}
function compose() {
  if(!content.settings.messagesEnabled){notify('Pengiriman pesan sedang dinonaktifkan.');return;}
  $('#recipient').innerHTML='<option value="">Pilih seorang teman</option>'+content.students.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('');
  $('#letter-result').textContent='';$('#letter-dialog').showModal();
}
function showLetters() {
  $('#approved-letters').innerHTML=messages.map(m=>`<blockquote><small>UNTUK ${esc(m.recipientName)}</small><p>${esc(m.body)}</p><footer>— seseorang dari cerita ini</footer></blockquote>`).join('');$('#letters-dialog').showModal();
}
document.addEventListener('click',async e=>{
  const button=e.target.closest('button');if(!button)return;
  if(button.matches('[data-open-book]'))await openBook();
  if(button.matches('[data-dialog-close]'))button.closest('dialog').close();
});
$('.brand').addEventListener('click',closeBook);$('#close-book').addEventListener('click',closeBook);
$('#prev').addEventListener('click',()=>book?.previous());$('#next').addEventListener('click',()=>book?.next());
$('#zoom-in').addEventListener('click',()=>book?.zoomBy(.25));$('#zoom-out').addEventListener('click',()=>book?.zoomBy(-.25));$('#reset-view').addEventListener('click',()=>book?.resetView());
$('#write-letter').addEventListener('click',compose);$('#view-letters').addEventListener('click',showLetters);
$('#retry-3d').addEventListener('click',()=>location.reload());
motionPreference.addEventListener('change',e=>{if(book)book.reducedMotion=e.matches;});
$('#audio').addEventListener('click',async()=>{const enabled=await audio.toggle();applyBranding();notify(enabled?(content.settings.audioUrl?'Audio aktif.':'Suara kertas aktif. Musik belum ditambahkan.'):'Audio nonaktif.');});
$('#fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{notify('Layar penuh tidak tersedia di browser ini.');}});
document.addEventListener('keydown',e=>{
  if(!$('#admin-root').hidden||document.querySelector('dialog[open]')||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
  if(e.key==='ArrowRight'&&isOpen){e.preventDefault();book?.next();}if(e.key==='ArrowLeft'&&isOpen){e.preventDefault();book?.previous();}
  if(e.key==='+'||e.key==='=')book?.zoomBy(.25);if(e.key==='-')book?.zoomBy(-.25);
  if(e.key==='Escape'&&isOpen)closeBook();
  if((e.key==='Enter'||e.key===' ')&&e.target===book?.canvas&&!isOpen){e.preventDefault();openBook();}
});
$('#letter-body').addEventListener('input',e=>$('#letter-counter').textContent=`${e.target.value.length} / 1000`);
$('#letter-form').addEventListener('submit',async e=>{
  e.preventDefault();const button=e.target.querySelector('[type=submit]');button.disabled=true;$('#letter-result').textContent='Mengirim surat…';
  try{if(offline)throw new Error('Backend belum terhubung. Jalankan npm run dev untuk mengirim pesan.');await request('/api/messages',{method:'POST',body:JSON.stringify({recipientId:Number($('#recipient').value),body:$('#letter-body').value,website:e.target.elements.website.value})});$('#letter-result').textContent='Surat tersimpan. Pesanmu menunggu persetujuan admin.';e.target.reset();$('#letter-counter').textContent='0 / 1000';}catch(error){$('#letter-result').textContent=error.message;}finally{button.disabled=false;}
});
async function reloadContent(force=false) {
  if(!$('#admin-root').hidden&&!force)return;if(!force&&book&&!['READING','CLOSED_IDLE'].includes(book.state))return;
  try{const next=await request('/api/content');if(offline){offline=false;if(!failed3D)$('#fallback-note').hidden=true;notify('Backend kembali terhubung.');}
    if(force||next.version!==content.version){content=next;textures.setContent(content);textures.setMessages(messages);await book?.refresh();book?.applySettings(content.settings);audio.updateSettings(content.settings);applyBranding();updatePage(activePage);notify('Buku telah diperbarui.');}
  }catch{}
}
async function route() {
  if(location.hash==='#admin'){
    book?.cancelDrag();book?.pause(true);experience.hidden=true;$('#admin-root').hidden=false;
    const{mountAdmin}=await import('./admin.js');adminCleanup=await mountAdmin($('#admin-root'),{onExit:()=>{location.hash='';},onSaved:()=>reloadContent(true)});
  }else{
    if(adminCleanup?.hasUnsavedChanges&&!adminCleanup.canLeave()){history.replaceState(null,'','#admin');return;}
    adminCleanup?.dispose?.();adminCleanup=null;$('#admin-root').hidden=true;experience.hidden=false;book?.pause(false);book?.resize();
  }
}
window.addEventListener('hashchange',route);
function fail3D(message) {failed3D=true;$('#fallback-message').textContent=message;$('#fallback-note').hidden=false;$('#retry-3d').hidden=false;}
async function start(){
  const startedAt=performance.now();
  try{content=await request('/api/content');}catch{content=createSeed();offline=true;$('#fallback-message').textContent='MODE OFFLINE · Konten awal saja. Backend belum terhubung; pesan tidak dapat disimpan.';$('#fallback-note').hidden=false;$('#retry-3d').hidden=true;}
  await document.fonts.ready;textures=new PageTextureRenderer(content,{resolution:window.innerWidth<760?1024:1536,anisotropy:8});audio=new AudioManager(content.settings);applyBranding();
  try{
    book=new BookRig($('#stage'),textures,{quality:window.innerWidth<760?'lite':content.settings.quality,reducedMotion:motionPreference.matches,onState:updateState,onPage:updatePage,onTurn:()=>audio.rustle(),onAction:(page,uv)=>{
      if(!uv)return;const x=uv.x,y=1-uv.y;
      const hit=textures.photoHotspots?.get(page)?.find(p=>x>=p.x&&x<=p.x+p.width&&y>=p.y&&y<=p.y+p.height);
      if(hit&&safeImageURL(hit.url)){$('#full-photo').src=hit.url;$('#photo-caption').textContent=hit.caption||'';$('#photo-dialog').showModal();return;}
      if(page===11&&y>.80)compose();if(page===12&&y>.83&&y<.92)closeBook();
    },onFailure:fail3D});
    book.applySettings(content.settings);await book.init();
  }catch(error){console.warn('WebGL:',error.message);fail3D('Tampilan 3D tidak dapat dimuat. Aktifkan WebGL di browser, lalu muat ulang buku.');}
  updatePage(2);$('#loading').classList.add('done');await loadMessages();await route();
  const startupMs=performance.now()-startedAt;
  window.__YEARBOOK__={get state(){return book?.state||'UNAVAILABLE';},get page(){return activePage;},get content(){return content;},get rig(){return book;},open:openBook,close:closeBook,next:()=>book?.next(),previous:()=>book?.previous(),goTo:navigateAdjacent,metrics:()=>({...book?.metrics(),startupMs:+startupMs.toFixed(0)})};
  document.documentElement.dataset.ready='true';
}
start().catch(error=>{$('#loading').classList.add('done');notify(error.message);});
let contentRefreshAt=Date.now();
const statusInterval=setInterval(()=>{if(document.hidden)return;if(book)$('#zoom-level').textContent=`${Math.round(book.view.zoom*100)}%`;if(Date.now()-contentRefreshAt>30000){contentRefreshAt=Date.now();reloadContent();loadMessages();}},250);
window.addEventListener('pagehide',e=>{if(e.persisted){book?.pause(true);return;}clearInterval(statusInterval);book?.dispose();textures?.dispose();audio?.dispose();});
window.addEventListener('pageshow',e=>{if(e.persisted)book?.pause(false);});
