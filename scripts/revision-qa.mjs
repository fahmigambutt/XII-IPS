import { chromium,expect } from '@playwright/test';
import { createServer } from 'vite';
import { createApp } from '../server/app.js';
import { createAdmin } from '../server/database.js';
import { mkdtemp,mkdir,writeFile,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join,resolve,dirname } from 'node:path';
import { randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';

const dataDir=await mkdtemp(join(tmpdir(),'yearbook-revision-'));
const app=createApp({dataDir});
await createAdmin(app.locals.db,'revision-qa',randomBytes(20).toString('hex'));
const backend=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
const target=`http://127.0.0.1:${backend.address().port}`;
const vite=await createServer({configFile:false,logLevel:'error',server:{host:'127.0.0.1',port:0,strictPort:false,proxy:{'/api':{target,changeOrigin:false},'/uploads':{target,changeOrigin:false}}}});
await vite.listen();
const url=`http://127.0.0.1:${vite.httpServer.address().port}`;
const browser=await chromium.launch({channel:'chrome',headless:true});
const results=[],errors=[],metrics=[],transitions=[];
const out='docs/qa';await mkdir(out,{recursive:true});
function pass(name,detail=''){results.push({name,status:'PASS',detail});console.log(`PASS ${name}${detail?': '+detail:''}`);}
function watch(page){page.on('pageerror',e=>errors.push(e.message));}
async function ready(page){await page.goto(url);await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');await page.locator('#loading').waitFor({state:'hidden'});}
async function state(page,name='READING'){await page.waitForFunction(name=>window.__YEARBOOK__?.state===name,name);}
async function next(page,expected){await page.locator('#next').click();await page.waitForFunction(expected=>window.__YEARBOOK__.page===expected&&window.__YEARBOOK__.state==='READING',expected);}
async function previous(page,expected){await page.locator('#prev').click();await page.waitForFunction(expected=>window.__YEARBOOK__.page===expected&&window.__YEARBOOK__.state==='READING',expected);}
async function inspect(page){return page.evaluate(()=>{
  const r=window.__YEARBOOK__.rig,c=r.canvas,box=c.getBoundingClientRect(),style=getComputedStyle(c),parent=getComputedStyle(c.parentElement);
  r.scene.updateMatrixWorld(true);r.camera.updateMatrixWorld(true);
  const active=[r.frontCover,r.backCover,r.left,r.right].filter(Boolean);
  const min={x:Infinity,y:Infinity},max={x:-Infinity,y:-Infinity};
  for(const mesh of active){let visible=true;for(let p=mesh;p;p=p.parent)if(!p.visible)visible=false;if(!visible)continue;
    const a=mesh.geometry.attributes.position;
    for(let i=0;i<a.count;i++){
      const v=r.camera.position.clone().set(a.getX(i),a.getY(i),a.getZ(i));mesh.localToWorld(v);v.project(r.camera);
      if(!Number.isFinite(v.x+v.y)||v.z>1||v.z< -1)continue;
      min.x=Math.min(min.x,v.x);min.y=Math.min(min.y,v.y);max.x=Math.max(max.x,v.x);max.y=Math.max(max.y,v.y);
    }
  }
  return {state:window.__YEARBOOK__.state,page:window.__YEARBOOK__.page,open:r.openAmount.value,renderCount:r.renderCount,paused:!!r.paused,canvasVisible:box.width>0&&box.height>0&&style.display!=='none'&&style.visibility!=='hidden'&&parent.visibility!=='hidden',bookVisible:r.book.visible,widthPx:(max.x-min.x)*box.width/2,heightPx:(max.y-min.y)*box.height/2,viewportWidth:innerWidth,stageHeight:box.height,cameraZ:r.camera.position.z,near:r.camera.near,projected:{min,max}};
});}
async function sampleTransition(page,action,label){
  await page.evaluate(action=>{
    window.__revisionSamples=[];
    const token=(window.__revisionToken||0)+1;window.__revisionToken=token;
    const start=performance.now();
    const collect=()=>{
      if(window.__revisionToken!==token)return;
      const r=window.__YEARBOOK__.rig,c=r.canvas,box=c.getBoundingClientRect(),style=getComputedStyle(c),parent=getComputedStyle(c.parentElement);
      r.scene.updateMatrixWorld(true);r.camera.updateMatrixWorld(true);r.backCover.geometry.computeBoundingBox();
      const bounds=r.backCover.geometry.boundingBox,low={x:Infinity,y:Infinity},high={x:-Infinity,y:-Infinity};
      for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
        const point=r.camera.position.clone().set(x,y,z);r.backCover.localToWorld(point);point.project(r.camera);low.x=Math.min(low.x,point.x);low.y=Math.min(low.y,point.y);high.x=Math.max(high.x,point.x);high.y=Math.max(high.y,point.y);
      }
      const inFrame=low.x<1&&high.x> -1&&low.y<1&&high.y> -1;
      window.__revisionSamples.push({t:performance.now()-start,state:window.__YEARBOOK__.state,open:r.openAmount.value,renderCount:r.renderCount,canvasVisible:box.width>0&&box.height>0&&style.display!=='none'&&style.visibility!=='hidden'&&parent.visibility!=='hidden',bookVisible:r.book.visible,inFrame,paused:!!r.paused,cameraZ:r.camera.position.z});
      if(performance.now()-start<1500)requestAnimationFrame(collect);else window.__revisionSampleDone=token;
    };
    requestAnimationFrame(collect);window.__YEARBOOK__[action]();
  },action);
  await page.waitForFunction(action=>window.__YEARBOOK__.state===(action==='open'?'READING':'CLOSED_IDLE'),action);
  await page.waitForFunction(()=>window.__revisionSampleDone===window.__revisionToken);
  const frames=await page.evaluate(()=>window.__revisionSamples);transitions.push({label,frames});
  assert.ok(frames.length>=10,`${label}: insufficient animation samples`);
  assert.ok(frames.every(f=>f.canvasVisible&&f.bookVisible&&f.inFrame&&!f.paused),`${label}: the 3D canvas/book disappeared, left the frame or paused`);
  assert.ok(frames.at(-1).renderCount>frames[0].renderCount,`${label}: renderer did not draw the transition`);
  assert.ok(frames.every(f=>Number.isFinite(f.cameraZ)&&f.cameraZ>0),`${label}: invalid camera`);
  await page.screenshot({path:`${out}/revision-${label}.png`});
}
async function closedPaperBounds(page){return page.evaluate(()=>{
  const r=window.__YEARBOOK__.rig;r.scene.updateMatrixWorld(true);const pts=[];
  for(const mesh of [r.left,r.right]){
    if(!mesh)continue;let visible=true;for(let p=mesh;p;p=p.parent)if(!p.visible)visible=false;if(!visible)continue;
    const a=mesh.geometry.attributes.position;
    for(let i=0;i<a.count;i++){const v=r.camera.position.clone().set(a.getX(i),a.getY(i),a.getZ(i));mesh.localToWorld(v);r.book.worldToLocal(v);pts.push(v.x);}
  }
  return {min:pts.length?Math.min(...pts):0,max:pts.length?Math.max(...pts):0,turnVisible:r.turnFront.visible||r.turnBack.visible,page:window.__YEARBOOK__.page};
});}
async function touchSwipe(page,worldX,expected){
  const start=await page.evaluate(worldX=>{const r=window.__YEARBOOK__.rig;r.scene.updateMatrixWorld(true);const point=r.camera.position.clone().set(worldX,-.65,.1);r.book.localToWorld(point);point.project(r.camera);const rect=r.canvas.getBoundingClientRect();return{x:rect.left+(point.x+1)*rect.width/2,y:rect.top+(1-point.y)*rect.height/2};},worldX);
  const session=await page.context().newCDPSession(page);
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[start]});
  for(let i=1;i<=14;i++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x-i*14,y:start.y-i}]});
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await session.detach();
  await page.waitForFunction(expected=>window.__YEARBOOK__.page===expected&&window.__YEARBOOK__.state==='READING',expected);
}
try{
  const page=await browser.newPage({viewport:{width:1440,height:960},deviceScaleFactor:1});watch(page);await ready(page);
  assert.equal(await page.locator('#admin-link').isVisible(),true);
  assert.equal(await page.locator('#reader,#reader-toggle,.chapter-rail,[data-jump],#skip-intro').count(),0);
  const coverRedFraction=await page.evaluate(()=>{const image=window.__YEARBOOK__.rig.coverFace.material.map.image;const data=image.getContext('2d').getImageData(0,0,image.width,image.height).data;let red=0,total=0;for(let i=0;i<data.length;i+=4*113){if(data[i]>data[i+1]*1.2&&data[i]>data[i+2]*1.05)red++;total++;}return red/total;});
  assert.ok(coverRedFraction>.6,`cover texture is not predominantly vintage red: ${coverRedFraction}`);
  await page.screenshot({path:`${out}/revision-closed-desktop.png`});
  pass('Vintage red 3D interface has no reader, chapter rail or skip controls');
  await sampleTransition(page,'open','opening-desktop');
  assert.equal(await page.locator('#admin-link').isVisible(),false);
  const opened=await inspect(page);assert.ok(opened.widthPx>=opened.viewportWidth*.7||opened.heightPx>=opened.stageHeight*.75,`book too small: ${JSON.stringify(opened)}`);
  pass('Opening keeps 3D visible and book occupies the reading area',`${Math.round(opened.widthPx)}px wide / ${Math.round(opened.heightPx)}px high`);
  const beforeClick=await page.evaluate(()=>window.__YEARBOOK__.page);
  await page.locator('#stage canvas').click({position:{x:opened.viewportWidth*.32,y:opened.stageHeight*.45}});
  assert.equal(await page.locator('#reader,#reader-toggle').count(),0);assert.equal(await page.evaluate(()=>window.__YEARBOOK__.page),beforeClick);
  pass('Clicking a printed page keeps the 3D book and cannot jump chapters');
  const initial=await page.evaluate(()=>window.__YEARBOOK__.page);assert.equal(initial,2);
  await page.locator('#stage canvas').hover();await page.mouse.wheel(0,450);await page.waitForFunction(()=>window.__YEARBOOK__.page===4&&window.__YEARBOOK__.state==='READING');
  await previous(page,2);await next(page,4);await next(page,6);
  await sampleTransition(page,'close','closing-middle');
  let bounds=await closedPaperBounds(page);assert.equal(bounds.turnVisible,false);assert.ok(bounds.min>=-.16&&bounds.max<=2.51,`stray paper: ${JSON.stringify(bounds)}`);
  pass('Closing from the middle folds all sheets within the hardcover');
  await sampleTransition(page,'open','reopening-first');assert.equal(await page.evaluate(()=>window.__YEARBOOK__.page),2);
  for(const n of [4,6,8,10,12])await next(page,n);
  assert.equal(await page.locator('#next').isDisabled(),true);
  await page.screenshot({path:`${out}/revision-final-page.png`});
  await sampleTransition(page,'close','closing-final');bounds=await closedPaperBounds(page);assert.equal(bounds.turnVisible,false);assert.ok(bounds.min>=-.16&&bounds.max<=2.51);
  await sampleTransition(page,'open','reopening-final');assert.equal(await page.evaluate(()=>window.__YEARBOOK__.page),2);
  pass('Sequential reading reaches the final page; reopening always starts at the beginning');
  const beforeZoom=await inspect(page);await page.locator('#zoom-in').click();
  await expect.poll(async()=>{const after=await inspect(page);return Math.max(after.widthPx/beforeZoom.widthPx,after.heightPx/beforeZoom.heightPx);}).toBeGreaterThan(1.03);
  await page.locator('#reset-view').click();pass('3D zoom enlarges the actual mesh and reset restores framing');
  metrics.push({environment:'Chrome headless desktop,1440x960',...await page.evaluate(()=>window.__YEARBOOK__.metrics())});await page.close();
  const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});watch(mobile);await ready(mobile);
  await sampleTransition(mobile,'open','open-mobile');assert.equal(await mobile.locator('#reader,#reader-toggle').count(),0);
  assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await touchSwipe(mobile,-.4,3);await touchSwipe(mobile,2.0,4);await previous(mobile,3);
  await mobile.locator('#zoom-in').click();await mobile.waitForFunction(()=>window.__YEARBOOK__.rig.view.zoom>=1.24);await expect(mobile.locator('#zoom-level')).toHaveText('125%');
  await mobile.screenshot({path:`${out}/revision-zoom-mobile.png`});
  await sampleTransition(mobile,'close','close-mobile');bounds=await closedPaperBounds(mobile);assert.equal(bounds.turnVisible,false);assert.ok(bounds.min>=-.16&&bounds.max<=2.51);
  pass('390px mobile stays in 3D, reads editorial pages sequentially and closes cleanly');
  metrics.push({environment:'Chrome emulated touch390x844,not physical phone',...await mobile.evaluate(()=>window.__YEARBOOK__.metrics())});await mobile.close();
  assert.deepEqual(errors,[]);pass('No uncaught JavaScript errors in revised reading flow');
}catch(error){results.push({name:'Revision browser integration',status:'FAIL',detail:error.stack});console.error(error);process.exitCode=1;}
finally{
  await writeFile(`${out}/revision-results.json`,JSON.stringify({testedAt:new Date().toISOString(),results,metrics,transitions,errors,limits:['Chrome headless only; real Android/iOS not tested','Mesh geometry and animation frames checked; no claim of physically exact paper simulation']},null,2));
  await browser.close();await vite.close();await new Promise(resolve=>backend.close(resolve));app.locals.close();
  assert.equal(dirname(resolve(dataDir)),resolve(tmpdir()));assert.ok(dataDir.includes('yearbook-revision-'));await rm(dataDir,{recursive:true,force:true});
}
