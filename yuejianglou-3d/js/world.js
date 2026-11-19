/* 阅江楼 · 江山世界：狮子山（楼建在山顶）、明城墙从山上翻过、山下挹江门、北面的长江与江心洲、下游的南京长江大桥、远处的紫金山
 * 坐标：阅江楼在狮子山顶的原点，主楼正面朝 +z 的长江（向西北），+x 是下游方向 */
(function () {
'use strict';
const H = window.HHL, T = THREE, W = H.wc, K = H.kit;
const { lerp, smooth, fbm, ridged } = H, rect = K.rect;
const WATER_Y = 0, GROUND = H.tower.GROUND, RIVER = { z0: 330, z1: 1500 };
const BRIDGE = { x: 1200, deck: 48 }, GATE = { x: -170, z: 70 }, ZJ = { x: 1500, z: -2600 };
W.sky({ day: { horizon: 0xcad8e2 }, dusk: { dir: [-0.85, 0.12, 0.5] }, night: { dir: [0.1, 0.3, 0.95] } }, 140);

function groundH(x, z) {
  let h = 4 + 3 * fbm(x * 0.01 + 3, z * 0.01, 3);
  const q = Math.pow(x / 150, 2) + Math.pow(z / 130, 2);                                        // 狮子山：山顶削平建楼
  h += (GROUND - 4) * Math.exp(-q * 0.9) * (0.92 + 0.12 * ridged(x * 0.02, z * 0.02, 3));
  h = lerp(h, GROUND - 0.4, 1 - smooth(38, 48, Math.max(Math.abs(x + 6) - 6, Math.abs(z + 2) * 1.2)));
  h += smooth(-500, -1600, z) * 30 * fbm(x * 0.004, z * 0.004, 3);
  const zj = Math.pow((x - ZJ.x) / 900, 2) + Math.pow((z - ZJ.z) / 500, 2); h += 300 * Math.exp(-zj * 1.4) * (0.8 + 0.3 * ridged(x * 0.002, z * 0.002, 4));   // 紫金山
  h = lerp(h, WATER_Y + 1.2, smooth(RIVER.z0 - 60, RIVER.z0 - 10, z) * smooth(RIVER.z1 + 60, RIVER.z1 + 10, z));
  h = lerp(h, -14, smooth(RIVER.z0, RIVER.z0 + 70, z) * smooth(RIVER.z1, RIVER.z1 - 70, z));
  const iz = Math.pow((x + 500) / 420, 2) + Math.pow((z - 900) / 120, 2); if (iz < 2) h = Math.max(h, WATER_Y - 1 + 3 * Math.exp(-iz * 1.2));   // 江心洲
  if (z > RIVER.z1) h += smooth(RIVER.z1 + 300, 3000, z) * 120 * ridged(x * 0.0015, z * 0.0015, 4);
  return h;
}
W.terrain(groundH, { cx: 0, cz: 500, waterY: WATER_Y, S: 1700, PAL: { floor: 0x38522a, meadow: 0x4c6a2e, dry: 0x6e7242, sand: 0x8a7e62, wet: 0x4e4636, rock: 0x6a6658, far: 0x3c5244, farHi: 0x5e6a76 } });
W.water({ y: WATER_Y, color: 0x3e5a52, size: 2.6, distortion: 2.6, speed: 0.42, silt: { color: 0x7a7458, opacity: 0.18 } });

const pave = W.pavingTex(0xb4ac9c, 7);
W.groundPlane(pave, -38, 26, -22, 18, 0.05, 4);

/* ============================== 明城墙：从狮子山北坡翻过，一直延伸出去；山下是挹江门 ============================== */
const WALL = [];
(function () {
  const M = H.tower.M, g = new T.Group(); H.scene.add(g);
  const brickM = new T.MeshStandardMaterial({ map: M.brick.map, normalMap: M.brick.normalMap, color: 0xb8c0c8, roughness: 0.9, envMapIntensity: 0.45 });
  const body = new H.Batch(new T.BoxGeometry(1, 1, 1), brickM), mer = new H.Batch(new T.BoxGeometry(1, 1, 1), brickM);
  const path = []; for (let x = -620; x <= 620; x += 8) path.push([x, 60 + 30 * Math.sin(x / 260) + (x < GATE.x ? (x - GATE.x) * 0.15 : 0)]);
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i], b = path[i + 1], mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2, L = Math.hypot(b[0] - a[0], b[1] - a[1]), ry = -Math.atan2(b[1] - a[1], b[0] - a[0]);
    if (Math.abs(mx - GATE.x) < 10) continue;
    const gh = Math.min(groundH(a[0], a[1]), groundH(b[0], b[1]), groundH(mx, mz)) - 1, top = Math.max(groundH(mx, mz) + 9, gh + 9);
    body.add(mx, (gh + top) / 2, mz, L + 0.2, top - gh, 7, ry);
    for (const s of [-1, 1]) for (let k = 0; k < 2; k++) mer.add(mx + Math.sin(-ry) * s * 3.2 + Math.cos(-ry) * (k - 0.5) * L * 0.5, top + 0.7, mz - Math.cos(-ry) * s * 3.2 + Math.sin(-ry) * (k - 0.5) * L * 0.5, 1.6, 1.4, 0.6, ry);
    WALL.push([mx, mz, top]);
  }
  body.build(g); mer.build(g);
  /* 挹江门：城门洞上面有一座城楼 */
  const gy = groundH(GATE.x, GATE.z), gate = new T.Mesh(new T.BoxGeometry(22, 12, 9), brickM); gate.position.set(GATE.x, gy + 6, GATE.z); g.add(gate);
  const sh = new T.Shape(); sh.moveTo(-3, 0); sh.lineTo(-3, 4.8); sh.absarc(0, 4.8, 3, Math.PI, 0, true); sh.lineTo(3, 0); sh.lineTo(-3, 0);
  for (const s of [-1, 1]) { const a = new T.Mesh(new T.ShapeGeometry(sh, 20), new T.MeshStandardMaterial({ color: 0x14100c, roughness: 1 })); a.position.set(GATE.x, gy, GATE.z + s * 4.52); if (s < 0) a.rotation.y = Math.PI; g.add(a); }
  const lg = new T.Group(); lg.position.set(GATE.x, gy + 12, GATE.z); H.scene.add(lg); const lb = new K.Builder(lg, H.tower.M, { dg: 0.8 });
  const ls = lb.storey(rect(8, 3.6), { y: 0, nextY: 6.2, eaveGap: 0.6, rise: 1.4, vw: 0.8, r: 0.28, colStep: 3.2, din: -1.0, dout: 2.2, lift: 1.4, w: 2.0, dgS: 0.8, beasts: true });
  lb.xieshan(7.0, 2.6, 4.8, { y0: ls.eaveTop, HR: 2.4, ov: 0.4, rr: 0.14, endScale: 0.4 }); lb.plaque('挹江门', 3.0, 1.0, ls.colTop - 0.4, 3.9, { tilt: 0.1 }); lb.build();
  GATE.top = gy + 12 + ls.eaveTop + 3;
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
})();

/* ============================== 南京长江大桥：1968 年建成，中国人自己设计建造的第一座长江大桥 ============================== */
(function () {
  const steel = new T.MeshStandardMaterial({ color: 0x5c6a66, roughness: 0.55, metalness: 0.5, envMapIntensity: 0.7 }), conc = new T.MeshStandardMaterial({ color: 0xc0baac, roughness: 0.85 });
  const bx = BRIDGE.x, D = BRIDGE.deck, z0 = RIVER.z0 - 30, z1 = RIVER.z1 + 30, half = 9, mem = new H.Batch(new T.BoxGeometry(1, 1, 1), steel), pier = new H.Batch(new T.BoxGeometry(1, 1, 1), conc), g = new T.Group(); H.scene.add(g);
  const N = 9, span = (z1 - z0) / (N + 1);
  for (let i = 1; i <= N; i++) { const z = z0 + span * i; pier.add(bx, (D - 17 - 16) / 2, z, 18, D - 1, 7, 0, 0xc6c0b2); }
  const yb = D - 16, yt = D;
  for (const sx of [-half, half]) { mem.add(bx + sx, yt, (z0 + z1) / 2, 0.9, 1.2, z1 - z0); mem.add(bx + sx, yb, (z0 + z1) / 2, 0.9, 1.4, z1 - z0); const n = Math.round((z1 - z0) / 16); for (let k = 0; k <= n; k++) { const z = z0 + k * (z1 - z0) / n; mem.add(bx + sx, (yb + yt) / 2, z, 0.6, yt - yb, 0.6); if (k < n) mem.add(bx + sx, (yb + yt) / 2, z + (z1 - z0) / n / 2, 0.5, Math.hypot(yt - yb, (z1 - z0) / n), 0.5, 0, 0xffffff, Math.atan2((z1 - z0) / n, yt - yb) * (k % 2 ? 1 : -1)); } }
  for (let k = 0; k <= 80; k++) { const z = z0 + k * (z1 - z0) / 80; mem.add(bx, yt + 0.2, z, half * 2, 0.4, 0.5); }
  const deck = new T.Mesh(new T.BoxGeometry(22, 0.6, z1 - z0), new T.MeshStandardMaterial({ color: 0x3a3c40, roughness: 0.9 })); deck.position.set(bx, yt + 0.8, (z0 + z1) / 2); g.add(deck);
  const redM = new T.MeshStandardMaterial({ color: 0xc02a1a, roughness: 0.5, emissive: 0x401008, emissiveIntensity: 0.3 });
  for (const zt of [z0 - 8, z1 + 8]) {                                    // 桥头堡：高塔顶上三面红旗
    const gh = groundH(bx, zt), tw = new T.Mesh(new T.BoxGeometry(14, yt - gh + 26, 10), conc); tw.position.set(bx, (gh + yt + 26) / 2, zt); g.add(tw);
    for (let i = -1; i <= 1; i++) { const f = new T.Mesh(H.gridGeo(4, 4, (u, v) => [u * 5, v * 3.2 + Math.sin(u * 3) * 0.3, Math.sin(u * 2.5 + v) * 0.4, u, v]), redM); f.material.side = T.DoubleSide; f.position.set(bx - 2.5 + i * 0.3, yt + 26 + 1 + Math.abs(i) * -0.6, zt + i * 2.2); f.rotation.y = i * 0.5; g.add(f); }
  }
  mem.build(g); pier.build(g); g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
})();

/* ============================== 林木、芳草 ============================== */
(function () {
  const r = W.rand;
  const free = (x, z) => { if (x > -42 && x < 28 && z > -24 && z < 22) return false; if (Math.abs(x - 6) < 9 && z > 0 && z < 60) return false; for (const w of WALL) if (Math.hypot(x - w[0], z - w[1]) < 8) return false; if (Math.abs(x - BRIDGE.x) < 20 && z > RIVER.z0 - 80) return false; return groundH(x, z) > WATER_Y + 1.2; };
  for (let i = 0; i < 12000; i++) { const x = (r() - 0.5) * 2200, z = -1300 + r() * (RIVER.z0 + 1240); if (!free(x, z)) continue; const d = fbm(x * 0.012 + 3, z * 0.012 + 8, 3); if (d < 0.38 && Math.hypot(x, z) > 160) continue; W.plant(x, z, r() < 0.3 ? 'pine' : 'leaf', 10 + r() * 6); }
  for (let i = 0; i < 3000; i++) { const x = (r() - 0.5) * 3000, z = RIVER.z1 + 30 + r() * 900; if (groundH(x, z) > 2 && fbm(x * 0.012, z * 0.012, 3) > 0.4) W.plant(x, z, 'leaf', 11 + r() * 5); }
  for (let i = 0; i < 800; i++) { const a = r() * 6.283, rr = Math.sqrt(r()); W.plant(-500 + Math.cos(a) * rr * 400, 900 + Math.sin(a) * rr * 100, r() < 0.5 ? 'willow' : 'poplar', 9 + r() * 4); }
  for (const p of [[-34, 14], [22, 14], [-34, -18], [22, -18], [-6, 20]]) W.plant(p[0], p[1], 'pine', 10);
  for (let i = 0; i < 9000; i++) { const x = (r() - 0.5) * 360, z = -200 + r() * 320; if (free(x, z)) W.grass(x, z, 0.5 + r() * 0.6); }
})();

W.birds({ n: 12, center: [0, GROUND + 10, 60], R: [40, 120], h: [10, 50], speed: [0.06, 0.12], scale: 1.0, body: 0xf6f6f2, wingOut: 0xb0b4ba, tip: 0x111114, beak: 0xf0b030, flap: 6 });
W.boats([[-700, 600, 2.4], [300, 800, -1.8], [900, 1100, 1.2], [-200, 1300, -1.0], [1500, 500, 0.8]], WATER_Y, { range: 2000 });

H.world = W.finish({ WATER_Y, RIVER, BRIDGE, GATE, ZJ, GROUND });
})();
