import { base64ToBytes } from '../src/native/base64';
import { extractEdges, placeholderMask } from '../src/render/fluid/FluidSim';

const toB64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));

describe('base64ToBytes', () => {
  test('round-trips arbitrary bytes', () => {
    const bytes = new Uint8Array(1000);
    for (let i = 0; i < bytes.length; i++) bytes[i] = (i * 37 + 11) & 255;
    const b64 = toB64(bytes);
    expect(Array.from(base64ToBytes(b64))).toEqual(Array.from(bytes));
  });
  test('handles padding variants', () => {
    for (const n of [1, 2, 3, 4, 5]) {
      const bytes = new Uint8Array(n).map((_, i) => i + 1);
      expect(Array.from(base64ToBytes(toB64(bytes)))).toEqual(Array.from(bytes));
    }
  });
});

describe('extractEdges', () => {
  test('finds left, right and top edges of the placeholder figure with outward normals', () => {
    const mask = placeholderMask(120, 160);
    const edges = extractEdges(mask);
    expect(edges.length).toBeGreaterThan(30);
    const lefts = edges.filter((e) => e.nx < -0.5);
    const rights = edges.filter((e) => e.nx > 0.5);
    const tops = edges.filter((e) => e.ny < -0.9);
    expect(lefts.length).toBeGreaterThan(5);
    expect(rights.length).toBeGreaterThan(5);
    expect(tops.length).toBeGreaterThan(3);
    for (const l of lefts) expect(l.x).toBeLessThan(0.5);
    for (const r of rights) expect(r.x).toBeGreaterThan(0.5);
    for (const e of edges) expect(Math.hypot(e.nx, e.ny)).toBeCloseTo(1, 5);
  });
  test('returns nothing for an empty mask', () => {
    expect(extractEdges({ width: 10, height: 10, data: new Uint8Array(100), imageAspect: 1 })).toEqual([]);
  });
});
