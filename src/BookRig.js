import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { gsap } from 'gsap';
import { sheetPoint, PAGE_WIDTH as W, PAGE_HEIGHT as H } from './PageCurlSolver.js';

const TOP = .155;
export class BookRig {
  constructor(host, textures, { quality = 'balanced', reducedMotion = false, onState, onPage, onAction, onFailure, onTurn } = {}) {
    Object.assign(this, { host, textures, quality, reducedMotion, onState, onPage, onAction, onFailure, onTurn });
    this.state = 'LOADING'; this.currentEditorialPage = 2; this.spread = 2; this.disposed = false;
    this.progress = { value: 0 }; this.openAmount = { value: 0 }; this.samples = []; this.renderCount = 0;
    this.view = { zoom: 1, panX: 0, panY: 0, focus: 0 }; this.touchPoints = new Map(); this.wheelTravel = 0;
    this.renderer = new THREE.WebGLRenderer({ antialias: quality !== 'lite', alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality === 'high' ? 2 : quality === 'lite' ? 1 : 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = .95;
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.canvas = this.renderer.domElement; this.canvas.tabIndex = 0;
    this.canvas.setAttribute('aria-label', 'Buku kenangan 3D. Klik untuk membuka; gunakan tombol navigasi atau tarik tepi halaman.');
    this.canvas.setAttribute('role', 'img'); host.append(this.canvas);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(34, 1, .1, 50); this.camera.position.set(0, 0, 10);
    const pmrem = new THREE.PMREMGenerator(this.renderer), room = new RoomEnvironment();
    this.environment = pmrem.fromScene(room, .04); this.scene.environment = this.environment.texture; this.scene.environmentIntensity = .3;
    room.dispose(); pmrem.dispose();
    this.scene.add(new THREE.HemisphereLight(0xffefd4, 0x63432d, .65));
    const key = new THREE.DirectionalLight(0xffe4bb, 1.3); key.position.set(-3, 5, 8); key.castShadow = true;
    key.shadow.mapSize.setScalar(quality === 'high' ? 2048 : 1024);
    Object.assign(key.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: .1, far: 20 });
    key.shadow.bias = -.0002; key.shadow.normalBias = .004; key.shadow.radius = 4; this.scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, .36); fill.position.set(5, -2, 5); this.scene.add(fill);
    this.wood = this.makeWood(); this.woodBump = this.wood.clone(); this.woodBump.colorSpace = THREE.NoColorSpace;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ map: this.wood, bumpMap: this.woodBump, bumpScale: .022, roughness: .86, color: '#b99168' }));
    floor.name = 'VintageReadingTable'; floor.position.z = -.055; floor.receiveShadow = true; this.scene.add(floor);
    this.book = new THREE.Group(); this.scene.add(this.book);
    this.book.position.set(-W / 2, 0, .015); this.book.rotation.set(0, 0, -.065);
    this.cloth = this.makeCloth();
    this.coverMaterial = new THREE.MeshStandardMaterial({ color: '#5b1823', roughness: .91, bumpMap: this.cloth, bumpScale: .008 });
    this.paperMaterial = new THREE.MeshStandardMaterial({ color: '#c9ab76', roughness: .98, bumpMap: this.cloth, bumpScale: .002 });
    this.backCover = this.board('BackCover'); this.backCover.position.set(W / 2, 0, -.015); this.book.add(this.backCover);
    this.spine = new THREE.Mesh(new RoundedBoxGeometry(.105, H + .12, .22, 3, .025), this.coverMaterial);
    this.spine.name = 'Spine'; this.spine.position.set(-.024, 0, .07); this.spine.castShadow = true; this.book.add(this.spine);
    this.frontPivot = new THREE.Group(); this.frontPivot.position.set(0, 0, .185); this.book.add(this.frontPivot);
    this.frontCover = this.board('FrontCover'); this.frontCover.position.x = W / 2; this.frontPivot.add(this.frontCover);
    this.coverFace = new THREE.Mesh(new THREE.PlaneGeometry(W + .015, H + .055), new THREE.MeshStandardMaterial({ roughness: .86, bumpMap: this.cloth, bumpScale: .012 }));
    this.coverFace.position.set(W / 2, 0, .028); this.frontPivot.add(this.coverFace);
    const inner = new THREE.Mesh(new THREE.PlaneGeometry(W - .035, H + .025), new THREE.MeshStandardMaterial({ color: '#b69a66', roughness: 1 }));
    inner.rotation.y = Math.PI; inner.position.set(W / 2, 0, -.028); this.frontPivot.add(inner);
    this.stackR = this.stack('PageStackRight', 1); this.stackL = this.stack('PageStackLeft', -1);
    this.left = this.restingPage(-1); this.right = this.restingPage(1);
    this.leftWing = new THREE.Group(); this.leftWing.name = 'BoundLeftPages'; this.book.add(this.leftWing);
    this.leftWing.add(this.stackL, this.left); this.leftWing.visible = false;
    this.turnFront = this.leaf(false); this.turnBack = this.leaf(true); this.turnFront.visible = this.turnBack.visible = false;
    this.raycaster = new THREE.Raycaster(); this.pointer = new THREE.Vector2();
    this.makeDust();
    this.resizeObserver = new ResizeObserver(() => this.resize()); this.resizeObserver.observe(host);
    this.events = [];
    this.listen(this.canvas, 'pointerdown', e => this.pointerDown(e));
    this.listen(this.canvas, 'pointermove', e => this.pointerMove(e));
    this.listen(this.canvas, 'pointerup', e => this.pointerUp(e));
    this.listen(this.canvas, 'pointercancel', () => this.cancelDrag());
    this.listen(this.canvas, 'lostpointercapture', () => { if (this.press && !this.touchPoints.size) this.cancelDrag(); });
    this.canvas.addEventListener('wheel', this.wheelHandler = e => this.wheel(e), { passive: false });
    this.events.push(() => this.canvas.removeEventListener('wheel', this.wheelHandler));
    this.listen(this.canvas, 'contextmenu', e => e.preventDefault());
    this.listen(window, 'blur', () => this.cancelDrag());
    this.listen(this.canvas, 'webglcontextlost', e => { e.preventDefault(); this.cancelDrag(); this.pause(true); this.onFailure?.('Tampilan 3D terhenti. Muat ulang buku untuk melanjutkan.'); });
    this.listen(document, 'visibilitychange', () => { if (document.hidden) this.cancelDrag(); else this.invalidate(); });
    this.resize();
  }
  makeCloth() {
    const c = document.createElement('canvas'); c.width = c.height = 128; const ctx = c.getContext('2d');
    ctx.fillStyle = '#888'; ctx.fillRect(0, 0, 128, 128);
    for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
      const n = 110 + ((x * 17 + y * 31) % 23) + (x % 3 === 0 ? 25 : 0) + (y % 4 === 0 ? 20 : 0);
      ctx.fillStyle = `rgb(${n},${n},${n})`; ctx.fillRect(x, y, 1, 1);
    }
    const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(4, 5); return tex;
  }
  makeWood() {
    const c = document.createElement('canvas'); c.width = c.height = 1024; const ctx = c.getContext('2d');
    let seed = 471; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const tones = ['#946c48', '#896341', '#9c744e', '#896644'];
    for (let board = 0; board < 4; board++) {
      const y = board * 256; ctx.fillStyle = tones[board]; ctx.fillRect(0, y, 1024, 256);
      for (let i = 0; i < 490; i++) {
        const gy = y + rnd() * 256, phase = rnd() * 6.28, amp = rnd() * 5 + .5;
        ctx.strokeStyle = i % 3 ? `rgba(49,24,9,${.025 + rnd() * .07})` : `rgba(241,201,135,${.02 + rnd() * .07})`;
        ctx.lineWidth = .3 + rnd() * 1.3; ctx.beginPath();
        for (let x = 0; x <= 1024; x += 8) { const py = gy + Math.sin(x * .006 + phase) * amp + Math.sin(x * .023 + phase) * amp * .15; if (!x) ctx.moveTo(x, py); else ctx.lineTo(x, py); } ctx.stroke();
      }
      ctx.fillStyle = 'rgba(40,20,9,.25)'; ctx.fillRect(0, y, 1024, 1.5); ctx.fillStyle = 'rgba(255,211,153,.1)'; ctx.fillRect(0, y + 2, 1024, 1);
    }
    for (let i = 0; i < 340; i++) { ctx.strokeStyle = 'rgba(238,210,164,.09)'; const x = rnd() * 1024, y = rnd() * 1024; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + rnd() * 24, y + rnd() * 2); ctx.stroke(); }
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(6, 6); tex.anisotropy = 4; return tex;
  }
  board(name) {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(W + .10, H + .12, .05, 3, .018), this.coverMaterial);
    mesh.name = name; mesh.castShadow = mesh.receiveShadow = true; return mesh;
  }
  stack(name, side) {
    const group = new THREE.Group(); group.name = name; this.book.add(group);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(W - .035, H - .035, .09), this.paperMaterial);
    mesh.position.set(side * W / 2, 0, .09); mesh.castShadow = mesh.receiveShadow = true; group.add(mesh);
    const lines = new THREE.BufferGeometry(), pts = [];
    for (let i = 0; i < 17; i++) {
      const z = .048 + i * .0052;
      pts.push(side * .025, -H / 2 + .018, z, side * (W - .018), -H / 2 + .018, z);
      pts.push(side * (W - .018), -H / 2 + .018, z, side * (W - .018), H / 2 - .018, z);
    }
    lines.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    group.add(new THREE.LineSegments(lines, new THREE.LineBasicMaterial({ color: '#bcad90', transparent: true, opacity: .38 })));
    return group;
  }
  restingPage(side) {
    const geom = new THREE.PlaneGeometry(W, H, 18, 8); const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const u = (pos.getX(i) + W / 2) / W;
      pos.setX(i, side < 0 ? (u - 1) * W : u * W);
      pos.setZ(i, TOP + .028 * Math.sin(Math.PI * u) - .012 * Math.exp(-Math.abs(pos.getX(i)) * 12));
    }
    geom.computeVertexNormals();
    const mesh = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({ color: '#fffaf0', roughness: .97 }));
    mesh.receiveShadow = true; this.book.add(mesh); return mesh;
  }
  leaf(back) {
    const geom = new THREE.PlaneGeometry(W, H, this.quality === 'lite' ? 24 : 48, this.quality === 'lite' ? 12 : 24);
    geom.attributes.position.setUsage(THREE.DynamicDrawUsage);
    if (back) { const uv = geom.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i)); }
    const mat = new THREE.MeshStandardMaterial({ color: '#fffaf0', roughness: .98, side: back ? THREE.BackSide : THREE.FrontSide });
    const mesh = new THREE.Mesh(geom, mat); mesh.name = back ? 'ActiveTurningLeafVerso' : 'ActiveTurningLeafRecto';
    mesh.castShadow = mesh.receiveShadow = true; mesh.frustumCulled = false; this.book.add(mesh); return mesh;
  }
  async init() {
    this.coverFace.material.map = await this.textures.cover(); this.coverFace.material.needsUpdate = true;
    await this.setPages(2);
    this.setState('INTRO'); this.invalidate();
    this.setState('CLOSED_IDLE'); this.invalidate();
  }
  listen(el, name, fn) { el.addEventListener(name, fn); this.events.push(() => el.removeEventListener(name, fn)); }
  setState(state) { this.state = state; this.onState?.(state); }
  async setPages(base) {
    this.textures.pinPages([base, base + 1]);
    const [left, right] = await Promise.all([this.textures.page(base), base + 1 <= 12 ? this.textures.page(base + 1) : this.textures.endpaper()]);
    this.left.material.map = left; this.right.material.map = right;
    this.left.material.needsUpdate = this.right.material.needsUpdate = true;
    const ratio = (base - 2) / 10;
    this.stackL.scale.z = .35 + ratio * .65; this.stackR.scale.z = 1 - ratio * .65;
    this.levelLeft = .135 * this.stackL.scale.z + .005;
    this.levelRight = .135 * this.stackR.scale.z + .005;
    this.poseRestingPage(this.left, -1, this.levelLeft);
    this.poseRestingPage(this.right, 1, this.levelRight);
    this.invalidate();
  }
  poseRestingPage(mesh, side, edgeLevel) {
    const position = mesh.geometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
      const u = Math.abs(position.getX(i)) / W;
      position.setZ(i, edgeLevel + (.145 - edgeLevel) * Math.exp(-u * 9) + .015 * Math.sin(Math.PI * u));
    }
    position.needsUpdate = true; mesh.geometry.computeVertexNormals();
  }
  tween(target, values) {
    return new Promise(resolve => gsap.to(target, { ...values, onUpdate: () => this.invalidate(), onComplete: resolve }));
  }
  async open() {
    if (this.state !== 'CLOSED_IDLE') return;
    this.setState('OPENING'); this.leftWing.visible = true; this.onTurn?.(); this.resetView(false);
    const duration = this.reducedMotion ? .01 : 1.15;
    await this.tween(this.openAmount, { value: 1, duration, ease: 'power2.inOut' });
    this.frontPivot.visible = true; this.setState('READING'); this.resize(); this.onPage?.(this.currentEditorialPage);
  }
  async close() {
    if (this.state !== 'READING') return;
    this.setState('CLOSING'); this.onTurn?.(); this.press = this.drag = null;
    this.turnFront.visible = this.turnBack.visible = false; this.leftWing.visible = true;
    const duration = this.reducedMotion ? .01 : 1.1;
    await this.tween(this.openAmount, { value: 0, duration, ease: 'power2.inOut' });
    this.leftWing.visible = false; this.spread = 2; this.currentEditorialPage = 2; this.resetView(false);
    await this.setPages(2); this.onPage?.(2);
    this.setState('CLOSED_IDLE'); this.resize();
  }
  async goTo(page) {
    if (this.state !== 'READING') return;
    page = Math.max(2, Math.min(12, Number(page)));
    const base = 2 + 2 * Math.floor((page - 2) / 2);
    if (base === this.spread) {
      if (this.isMobile && page !== this.currentEditorialPage) { this.setState('FOCUSING'); await this.focusPage(page); }
      this.currentEditorialPage = page; this.setState('READING'); this.onPage?.(page); return;
    }
    const direction = base > this.spread ? 1 : -1;
    await this.prepareTurn(direction, base);
    await this.finishTurn(true, page);
  }
  next() { return this.goTo(Math.min(12, this.isMobile ? this.currentEditorialPage + 1 : this.spread + 2)); }
  previous() { return this.goTo(Math.max(2, this.isMobile ? this.currentEditorialPage - 1 : this.spread - 2)); }
  async focusPage(page) { if (this.isMobile) await this.tween(this.view, { focus: page % 2 ? W / 2 : -W / 2, duration: this.reducedMotion ? .01 : .35, ease: 'power2.inOut' }); }
  async prepareTurn(direction, target) {
    if (this.state !== 'READING') return false;
    this.setState('PREPARING'); this.direction = direction; this.target = target;
    const targetRatio = (target - 2) / 10;
    this.turnRightLevel = direction > 0 ? this.levelRight : .135 * (1 - targetRatio * .65) + .005;
    this.turnLeftLevel = direction > 0 ? .135 * (.35 + targetRatio * .65) + .005 : this.levelLeft;
    const frontPage = direction > 0 ? this.spread + 1 : target + 1;
    const backPage = direction > 0 ? target : this.spread;
    this.textures.pinPages([this.spread, this.spread + 1, frontPage, backPage, target, target + 1]);
    const [front, back] = await Promise.all([this.textures.page(frontPage), this.textures.page(backPage)]);
    this.turnFront.material.map = front; this.turnBack.material.map = back;
    this.turnFront.material.needsUpdate = this.turnBack.material.needsUpdate = true;
    if (direction > 0) this.right.material.map = target < 12 ? await this.textures.page(target + 1) : await this.textures.endpaper();
    else this.left.material.map = await this.textures.page(target);
    this.turnFront.visible = this.turnBack.visible = true;
    this.progress.value = direction > 0 ? 0 : 1; this.deform(this.progress.value);
    this.setState('DRAGGING'); this.invalidate(); return true;
  }
  deform(progress, dragY = 0) {
    const front = this.turnFront.geometry, back = this.turnBack.geometry;
    const uv = front.attributes.uv, a = front.attributes.position, b = back.attributes.position;
    for (let i = 0; i < uv.count; i++) {
      const pt = sheetPoint(uv.getX(i), uv.getY(i), progress, dragY);
      const u = uv.getX(i), level = this.turnRightLevel * (1 - progress) + this.turnLeftLevel * progress;
      const baseline = level + (.145 - level) * Math.exp(-u * 9) + .015 * Math.sin(Math.PI * u) + .003;
      a.setXYZ(i, pt.x, pt.y, baseline + pt.z);
      b.setXYZ(i, pt.x, pt.y, baseline + pt.z - .001);
    }
    a.needsUpdate = b.needsUpdate = true; front.computeVertexNormals(); back.computeVertexNormals(); this.invalidate();
  }
  async finishTurn(commit, page = this.target) {
    if (!['DRAGGING', 'PREPARING'].includes(this.state)) return;
    this.setState(commit ? 'SETTLING' : 'SNAP_BACK'); this.onTurn?.();
    const end = commit ? (this.direction > 0 ? 1 : 0) : (this.direction > 0 ? 0 : 1);
    await new Promise(resolve => gsap.to(this.progress, { value: end, duration: this.reducedMotion ? .01 : Math.max(.25, Math.abs(end - this.progress.value) * (this.target === 12 ? 1.2 : .9)), ease: 'power2.inOut', onUpdate: () => this.deform(this.progress.value), onComplete: resolve }));
    if (commit) { this.spread = this.target; this.currentEditorialPage = page; }
    await this.setPages(this.spread);
    this.turnFront.visible = this.turnBack.visible = false; this.drag = null;
    if (commit) await this.focusPage(page);
    this.setState('READING'); this.onPage?.(this.currentEditorialPage); this.invalidate();
  }
  pick(e) {
    const r = this.canvas.getBoundingClientRect(); this.pointer.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    this.scene.updateMatrixWorld(true); this.camera.updateMatrixWorld(true); this.raycaster.setFromCamera(this.pointer, this.camera);
    return this.raycaster.intersectObjects(this.state === 'CLOSED_IDLE' ? [this.coverFace, this.frontCover] : [this.left, this.right])[0];
  }
  pointerDown(e) {
    if (e.pointerType === 'touch') {
      this.touchPoints.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.touchPoints.size === 2 && this.state === 'READING') {
        this.press = null; const [a,b] = [...this.touchPoints.values()];
        this.pinch = { distance: Math.hypot(a.x-b.x,a.y-b.y), zoom: this.view.zoom, x: (a.x+b.x)/2, y: (a.y+b.y)/2, panX: this.view.panX, panY: this.view.panY };
        this.canvas.setPointerCapture(e.pointerId); return;
      }
    }
    if (e.button === 2 || (e.shiftKey && this.view.zoom > 1)) { this.panDrag = { x: e.clientX, y: e.clientY, panX: this.view.panX, panY: this.view.panY }; this.canvas.setPointerCapture(e.pointerId); return; }
    if (e.button !== 0) return;
    const hit = this.pick(e); if (!hit) return;
    if (this.state === 'CLOSED_IDLE') { this.open(); return; }
    if (this.state !== 'READING') return;
    const local = this.book.worldToLocal(hit.point.clone());
    this.press = { x: e.clientX, y: e.clientY, time: performance.now(), local, object: hit.object, uv: hit.uv?.clone() };
    this.canvas.setPointerCapture(e.pointerId);
  }
  async pointerMove(e) {
    if (this.touchPoints.has(e.pointerId)) this.touchPoints.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.pinch && this.touchPoints.size === 2) {
      const [a,b] = [...this.touchPoints.values()], r = this.canvas.getBoundingClientRect();
      this.view.zoom = THREE.MathUtils.clamp(this.pinch.zoom * Math.hypot(a.x-b.x,a.y-b.y) / this.pinch.distance, 1, 2.6);
      this.view.panX = this.pinch.panX - ((a.x+b.x)/2-this.pinch.x) / r.width * 5 / this.view.zoom;
      this.view.panY = this.pinch.panY + ((a.y+b.y)/2-this.pinch.y) / r.height * 4 / this.view.zoom;
      this.invalidate(); return;
    }
    if (this.panDrag) {
      const r = this.canvas.getBoundingClientRect(); this.view.panX = this.panDrag.panX - (e.clientX-this.panDrag.x)/r.width*5/this.view.zoom;
      this.view.panY = this.panDrag.panY + (e.clientY-this.panDrag.y)/r.height*4/this.view.zoom; this.invalidate(); return;
    }
    if (!this.press) return;
    const dx = e.clientX - this.press.x;
    if (this.focusSwipe) {
      const amount = Math.min(1, Math.abs(dx)/Math.max(140,this.width*.55)); this.focusSwipe.amount = amount;
      this.view.focus = this.focusSwipe.from + (this.focusSwipe.to-this.focusSwipe.from)*amount; this.invalidate(); return;
    }
    if (!this.drag && this.state === 'READING' && Math.abs(dx) > 14) {
      const dir = dx < 0 ? 1 : -1, editorial = this.isMobile ? this.currentEditorialPage+dir : this.spread+dir*2;
      if (editorial < 2 || editorial > 12) return;
      const target = 2+2*Math.floor((editorial-2)/2);
      if (this.isMobile && target === this.spread) { this.focusSwipe = { page: editorial, from: this.view.focus, to: editorial%2 ? W/2 : -W/2, amount: 0 }; this.setState('PANNING_PAGE'); return; }
      if (target < 2 || target > 12 || (dir > 0 && this.press.local.x < .2) || (dir < 0 && this.press.local.x > -.2)) return;
      this.drag = { pending: true, page: editorial, lastX: e.clientX, time: performance.now(), velocity: 0 };
      await this.prepareTurn(dir, target);
      if (!this.press) { await this.finishTurn(false); return; }
      this.drag.pending = false;
    }
    if (this.drag && !this.drag.pending && this.state === 'DRAGGING') {
      const t = performance.now(), r = this.canvas.getBoundingClientRect();
      this.drag.velocity = (e.clientX - this.drag.lastX) / Math.max(1, t - this.drag.time);
      this.drag.lastX = e.clientX; this.drag.time = t;
      const travel = Math.min(1, Math.abs(dx) / Math.max(160, r.width * .37));
      this.progress.value = this.direction > 0 ? travel : 1 - travel;
      this.deform(this.progress.value, Math.max(-.7, Math.min(.7, (this.press.y - e.clientY) / r.height * 2)));
    }
  }
  pointerUp(e) {
    this.touchPoints.delete(e.pointerId);
    if (this.pinch || this.panDrag) { if (this.touchPoints.size < 2) this.pinch = null; this.panDrag = null; this.press = null; if (this.canvas.hasPointerCapture(e.pointerId)) this.canvas.releasePointerCapture(e.pointerId); return; }
    const press = this.press; this.press = null;
    if (this.focusSwipe) { this.finishFocusSwipe(this.focusSwipe.amount > .24); if (this.canvas.hasPointerCapture(e.pointerId)) this.canvas.releasePointerCapture(e.pointerId); return; }
    if (this.canvas.hasPointerCapture(e.pointerId)) this.canvas.releasePointerCapture(e.pointerId);
    if (this.drag && !this.drag.pending && this.state === 'DRAGGING') {
      const p = this.direction > 0 ? this.progress.value : 1 - this.progress.value;
      const velocity = -this.direction * this.drag.velocity;
      this.finishTurn(p > .34 || (p > .08 && velocity > .6), this.drag.page);
    } else if (press && this.state === 'READING' && Math.hypot(e.clientX - press.x, e.clientY - press.y) < 12) {
      const page = press.local.x < 0 ? this.spread : this.spread + 1;
      this.onAction?.(page, press.uv);
    }
  }
  async finishFocusSwipe(commit) {
    const swipe = this.focusSwipe; if (!swipe) return; this.focusSwipe = null; this.setState('SETTLING');
    await this.tween(this.view,{focus:commit?swipe.to:swipe.from,duration:this.reducedMotion?.01:.24,ease:'power2.out'});
    if (commit) this.currentEditorialPage = swipe.page; this.setState('READING'); this.onPage?.(this.currentEditorialPage);
  }
  cancelDrag() { this.press = null; this.pinch = this.panDrag = null; this.touchPoints.clear(); if (this.focusSwipe) this.finishFocusSwipe(false); else if (this.state === 'DRAGGING') this.finishTurn(false); }
  wheel(event) {
    if (this.state !== 'READING') return;
    event.preventDefault();
    if (event.ctrlKey || event.metaKey) { this.zoomBy(event.deltaY < 0 ? .12 : -.12); return; }
    this.wheelTravel += event.deltaY || event.deltaX;
    if (Math.abs(this.wheelTravel) > 65 && performance.now() - (this.lastWheelTurn || 0) > 750) {
      const next = this.wheelTravel > 0; this.wheelTravel = 0; this.lastWheelTurn = performance.now(); next ? this.next() : this.previous();
    }
  }
  zoomBy(amount) { if (this.state !== 'READING') return; gsap.killTweensOf(this.view); this.tween(this.view, { zoom: THREE.MathUtils.clamp(this.view.zoom + amount, 1, 2.6), duration: .24, ease: 'power2.out' }); }
  resetView(animated = true) {
    gsap.killTweensOf(this.view);
    const values = { zoom: 1, panX: 0, panY: 0, focus: this.currentEditorialPage % 2 ? W/2 : -W/2 };
    if (animated) this.tween(this.view, { ...values, duration: .3, ease: 'power2.out' }); else { Object.assign(this.view, values); this.invalidate(); }
  }
  resize() {
    const { width, height } = this.host.getBoundingClientRect(); if (!width || !height) return;
    this.renderer.setSize(width, height, false); this.camera.aspect = width / height;
    this.width = width; this.height = height; const mobile = width < 760;
    if (mobile !== this.isMobile) { this.isMobile = mobile; this.view.focus = this.currentEditorialPage % 2 ? W/2 : -W/2; }
    this.camera.updateProjectionMatrix(); this.updatePose(); this.invalidate();
  }
  updatePose() {
    if (!this.width) return;
    const p = this.openAmount.value, mobile = this.isMobile, tangent = Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2));
    this.frontPivot.rotation.y = -Math.PI * p; this.frontPivot.position.z = .185 - .21*p;
    this.leftWing.rotation.y = Math.PI*(1-p); this.leftWing.position.z = this.frontPivot.position.z + .025;
    this.spine.position.z = .07 - .11*p;
    const safeRatio = this.height / Math.max(280,this.height-(mobile?200:160));
    const closedHeight = (H + (mobile ? 1.05 : .40))*safeRatio, openHeight = (H + .22)*safeRatio;
    const closedDistance = Math.max(closedHeight/2/tangent, (W+.45)/2/tangent/this.camera.aspect);
    const openWidth = mobile ? W+.16 : W*2+.14;
    const openDistance = Math.max(openHeight/2/tangent,openWidth/2/tangent/this.camera.aspect) + .1;
    const leafLift = this.turnFront.visible ? Math.sin(Math.PI*this.progress.value) : 0;
    const zoom = 1 + (this.view.zoom-1)*p*(1-leafLift);
    const distance = (closedDistance*(1-p)+openDistance*p + leafLift*.95) / zoom;
    const closedOffset = !mobile ? closedDistance*tangent*this.camera.aspect*.32 : 0;
    this.book.position.set((-W/2+closedOffset)*(1-p), mobile ? -.13*(1-p) : 0, .015);
    this.book.rotation.set(0,0,-.065*(1-p));
    const x = p*((mobile ? this.view.focus : 0)+this.view.panX), y = p*this.view.panY;
    this.camera.position.set(x,y-.24,distance); this.camera.lookAt(x,y,0);
    this.scene.updateMatrixWorld(true);
  }
  invalidate() {
    if (this.disposed || this.paused || this.frame || document.hidden) return;
    // Render after GSAP updates in the same tick. A nested rAF would skip every
    // other display frame while a tween is active. The one-shot listener sleeps
    // with GSAP when the book is idle.
    this.frame = () => {
      gsap.ticker.remove(this.frame);
      const time = performance.now();
      this.frame = null;
      const before = performance.now();
      if (this.disposed || this.paused) return;
      this.updatePose();
      this.dust.visible = this.particlesEnabled && this.quality !== 'lite' && this.state !== 'READING';
      this.dust.rotation.z = Math.sin(time * .0001) * .015;
      this.renderer.render(this.scene, this.camera);
      this.renderCount++; if (this.lastFrame && time - this.lastFrame < 250) this.samples.push(time - this.lastFrame);
      if (this.samples.length > 600) this.samples.shift(); this.lastFrame = time;
      this.lastRenderMs = performance.now() - before;
    };
    gsap.ticker.add(this.frame);
  }
  pause(value) { this.paused = value; if (!value) { this.resize(); this.invalidate(); } }
  makeDust() {
    const points = [];
    for (let i = 0; i < 18; i++) points.push(Math.sin(i * 21.7) * 4, Math.cos(i * 17.3) * 2.8, -.05 + (i % 3) * .08);
    const geom = new THREE.BufferGeometry(); geom.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    this.dust = new THREE.Points(geom, new THREE.PointsMaterial({ color: '#fff7d4', size: .016, transparent: true, opacity: .45, depthWrite: false }));
    this.particlesEnabled = true; this.scene.add(this.dust);
  }
  applySettings(settings) {
    this.particlesEnabled = settings.particles;
    const quality = window.innerWidth < 650 ? 'lite' : settings.quality;
    if (quality !== this.quality) {
      this.quality = quality;
      this.renderer.setPixelRatio(Math.min(devicePixelRatio, quality === 'high' ? 2 : quality === 'lite' ? 1 : 1.5));
      for (const mesh of [this.turnFront, this.turnBack]) {
        mesh.geometry.dispose();
        mesh.geometry = new THREE.PlaneGeometry(W, H, quality === 'lite' ? 24 : 48, quality === 'lite' ? 12 : 24);
        mesh.geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
        if (mesh === this.turnBack) { const uv = mesh.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i)); }
      }
      const light = this.scene.children.find(x => x.isDirectionalLight && x.castShadow);
      light.shadow.mapSize.setScalar(quality === 'high' ? 2048 : quality === 'lite' ? 512 : 1024);
      light.shadow.map?.dispose(); light.shadow.map = null;
      this.resize();
    }
    this.invalidate();
  }
  async refresh() { this.coverFace.material.map = await this.textures.cover(); this.coverFace.material.needsUpdate = true; await this.setPages(this.spread); this.invalidate(); }
  metrics() {
    const sum = this.samples.reduce((a,b) => a+b,0), sorted = [...this.samples].sort((a,b)=>b-a);
    return { threeRevision: THREE.REVISION, quality: this.quality, renderCount: this.renderCount, sampledFrames: this.samples.length, averageFpsWhileRendering: sum ? +(1000 * this.samples.length / sum).toFixed(1) : null, onePercentLow: sorted.length ? +(1000 / sorted.slice(0, Math.max(1, Math.ceil(sorted.length / 100))).reduce((a,b)=>a+b,0) * Math.max(1,Math.ceil(sorted.length / 100))).toFixed(1) : null, calls: this.renderer.info.render.calls, triangles: this.renderer.info.render.triangles, textures: this.renderer.info.memory.textures, geometries: this.renderer.info.memory.geometries, lastRenderMs: this.lastRenderMs, heapBytes: performance.memory?.usedJSHeapSize ?? null };
  }
  dispose() {
    this.disposed = true; if (this.frame) gsap.ticker.remove(this.frame); this.resizeObserver.disconnect(); this.events.forEach(fn => fn());
    [this.progress, this.openAmount, this.view].forEach(x => gsap.killTweensOf(x));
    const geometries = new Set(), materials = new Set(); this.scene.traverse(obj => { if (obj.geometry) geometries.add(obj.geometry); if (obj.material) (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(m => materials.add(m)); });
    geometries.forEach(x => x.dispose()); materials.forEach(x => x.dispose()); this.cloth.dispose(); this.wood.dispose(); this.woodBump.dispose(); this.environment.dispose(); this.renderer.dispose(); this.canvas.remove();
  }
}
