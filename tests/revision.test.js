import test from 'node:test';
import assert from 'node:assert/strict';
import { sheetPoint, PAGE_WIDTH, PAGE_HEIGHT } from '../src/PageCurlSolver.js';

test('paper arc length remains close to a bound sheet through diagonal turns', () => {
  for (const progress of [0,.1,.25,.5,.75,.9,1]) {
    for (const v of [0,.25,.5,.75,1]) {
      let last=sheetPoint(0,v,progress,.5), length=0;
      for(let i=1;i<=80;i++) {
        const point=sheetPoint(i/80,v,progress,.5);
        length+=Math.hypot(point.x-last.x,point.y-last.y,point.z-last.z);
        last=point;
      }
      assert.ok(length>PAGE_WIDTH*.98,`sheet contracted at p=${progress},v=${v}`);
      assert.ok(length<PAGE_WIDTH*1.02,`sheet stretched at p=${progress},v=${v}`);
    }
  }
});

test('paper surface never collapses into degenerate quads during turning',()=>{
  const du=1/40,dv=1/24;
  for(const progress of [0,.1,.3,.5,.7,.9,1]) {
    for(let row=0;row<24;row++) for(let col=0;col<40;col++) {
      const u=col*du,v=row*dv;
      const p=sheetPoint(u,v,progress,-.6),a=sheetPoint(u+du,v,progress,-.6),b=sheetPoint(u,v+dv,progress,-.6);
      const ax=a.x-p.x,ay=a.y-p.y,az=a.z-p.z,bx=b.x-p.x,by=b.y-p.y,bz=b.z-p.z;
      const area=Math.hypot(ay*bz-az*by,az*bx-ax*bz,ax*by-ay*bx);
      assert.ok(Number.isFinite(area)&&area>PAGE_WIDTH*PAGE_HEIGHT*du*dv*.85,`collapsed quad at ${progress},${u},${v}`);
    }
  }
});
