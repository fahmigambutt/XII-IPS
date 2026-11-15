export const PAGE_WIDTH = 2.35;
export const PAGE_HEIGHT = 3.1;

// Integrate the tangent of a bent sheet: the bound edge stays at x=z=0.
// The diagonal term concentrates extra curl near the corner being pulled.
export function sheetPoint(u, v, progress, dragY = 0, width = PAGE_WIDTH, height = PAGE_HEIGHT) {
  const p = Math.max(0, Math.min(1, progress));
  const lift = Math.sin(Math.PI * p);
  const steps = 20;
  const ds = width * u / steps;
  let x = 0, z = 0;
  for (let j = 0; j < steps; j++) {
    const s = u * (j + .5) / steps;
    const bend = .93 * lift * (2 * s - 1);
    const corner = .3 * lift * s * s * (v - .5 + dragY);
    const angle = Math.max(0, Math.min(Math.PI, Math.PI * p + bend + corner));
    x += Math.cos(angle) * ds;
    z += Math.sin(angle) * ds;
  }
  const y = (v - .5) * height + .022 * lift * u * u * (v - .5);
  return { x, y, z: Math.max(0, z) };
}
