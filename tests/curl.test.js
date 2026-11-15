import test from 'node:test';
import assert from 'node:assert/strict';
import { sheetPoint, PAGE_WIDTH, PAGE_HEIGHT } from '../src/PageCurlSolver.js';
test('binding remains fixed during diagonal and reverse turns', () => {
  for (let p = 0; p <= 1; p += .025) {
    for (const v of [0, .5, 1]) {
      const point = sheetPoint(0, v, p, .6);
      assert.equal(point.x, 0); assert.equal(point.z, 0);
      assert.equal(point.y, (v - .5) * PAGE_HEIGHT);
    }
  }
});
test('sheet rests on the right and left stacks at endpoints', () => {
  for (const u of [0, .2, .6, 1]) {
    assert.ok(Math.abs(sheetPoint(u, .5, 0).x - u * PAGE_WIDTH) < 1e-10);
    assert.ok(Math.abs(sheetPoint(u, .5, 1).x + u * PAGE_WIDTH) < 1e-10);
    assert.ok(Math.abs(sheetPoint(u, .5, 1).z) < 1e-10);
  }
});
test('curl stays above the stacks, remains bounded and has continuous trajectories', () => {
  let last = sheetPoint(1, 0, 0);
  for (let i = 1; i <= 100; i++) {
    const now = sheetPoint(1, 0, i / 100, .4);
    assert.ok(now.z >= 0 && now.z <= PAGE_WIDTH);
    assert.ok(Math.hypot(now.x - last.x, now.z - last.z) < .13);
    last = now;
  }
  assert.ok(sheetPoint(.5, .5, .4).z > .2);
});
