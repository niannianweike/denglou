/* 望江楼 · 园林与锦江：望江楼公园的竹林（一百多种竹子）、小径、锦江与江上的九眼桥、远处的城市与西边的雪山
 * 坐标：崇丽阁在原点，正面朝 +z 的锦江，锦江从西（−x）往东（+x）流 */
(function () {
'use strict';
const H = window.HHL, T = THREE, W = H.wc;
const { lerp, smooth, fbm, ridged } = H;
const WATER_Y = -1.5, GROUND = H.tower.GROUND, RIVER = { z0: 30, z1: 130 }, BRIDGE = { x: -260 };
W.sky({ day: { horizon: 0xd2d8dc, fog: 0xc8d0d4, fogD: 0.0009, cover: 0.42 }, dusk: { dir: [-0.9, 0.12, -0.42] }, night: { dir: [0.25, 0.3, 0.92] } }, 80);   // 成都多云雾

function groundH(x, z) {
  let h = GROUND - 0.1 + 0.4 * fbm(x * 0.03, z * 0.03, 2);
  h = lerp(h, WATER_Y + 0.6, smooth(RIVER.z0 - 6, RIVER.z0, z) * smooth(RIVER.z1 + 6, RIVER.z1, z));
  h = lerp(h, -6, smooth(RIVER.z0 + 2, RIVER.z0 + 20, z) * smooth(RIVER.z1 - 2, RIVER.z1 - 20, z));
  h += smooth(RIVER.z1 + 6, RIVER.z1 + 20, z) * 0.2;
  const m = smooth(2600, 5200, -x) * 0.9;                                                 // 西边远处的雪山（天气好的时候成都能望见）
  if (m > 0) h += m * (200 + 1300 * Math.pow(ridged(x * 0.0006 + 3, z * 0.0006, 4), 2));
  return h;
}
W.terrain(groundH, { cx: 0, cz: 0, waterY: WATER_Y, S: 1400, PAL: { floor: 0x3e5a2a, meadow: 0x4e6a30, dry: 0x6a7040, sand: 0x7e7660, wet: 0x4e4636, rock: 0x7a7a78, far: 0x6a7a80, farHi: 0xf0f2f4 } });
W.water({ y: WATER_Y, color: 0x3e5a50, size: 2.2, distortion: 2.0, speed: 0.36 });

const pave = W.pavingTex(0xb0a898, 9);
W.groundPlane(pave, -12, 12, -12, 22, 0.05, 4);
W.groundPlane(pave, 12, 44, 15, 21, 0.05, 3);
W.groundPlane(pave, -26, -12, 12, 18, 0.05, 3);
W.groundPlane(pave, -2, 2, -120, -12, 0.05, 3);

/* ---- 九眼桥：锦江上的石拱桥 ---- */
(function () {
  const M = H.tower.M, g = new T.Group(); g.position.set(BRIDGE.x, 0, (RIVER.z0 + RIVER.z1) / 2); H.scene.add(g);
  const L = RIVER.z1 - RIVER.z0 + 20, deckY = 4.2;
  const deck = new T.Mesh(new T.BoxGeometry(10, 1.2, L), M.stone); deck.position.y = deckY; g.add(deck);
  for (let i = 0; i < 9; i++) { const z = -L / 2 + 6 + i * (L - 12) / 8, p = new T.Mesh(new T.BoxGeometry(10, deckY - WATER_Y + 3, 2.4), M.stone); p.position.set(0, (deckY + WATER_Y - 3) / 2, z); g.add(p); }
  for (const s of [-1, 1]) { const rl = new T.Mesh(new T.BoxGeometry(0.4, 1.0, L), M.stoneI); rl.position.set(s * 4.8, deckY + 1.0, 0); g.add(rl); }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
})();

/* ---- 对岸的城市：高高低低的楼房 ---- */
(function () {
  const m = new T.MeshStandardMaterial({ color: 0xc8c6c0, roughness: 0.8 }), B = new H.Batch(new T.BoxGeometry(1, 1, 1), m), r = H.rng(5), g = new T.Group(); H.scene.add(g);
  for (let i = 0; i < 220; i++) { const x = (r() - 0.5) * 2200, z = RIVER.z1 + 60 + r() * 900, hh = 12 + r() * r() * 90, w = 14 + r() * 18; B.add(x, hh / 2, z, w, hh, 12 + r() * 14, 0, new T.Color(0xd8d4cc).lerp(new T.Color(0x9aa0a6), r()).getHex()); }
  B.build(g);
})();

/* ---- 竹林：园里最多的就是竹子 ---- */
(function () {
  const r = W.rand, YS = H.tower.YS, J = H.tower.JING;
  const free = (x, z) => { if (Math.abs(x) < 13 && Math.abs(z) < 13) return false; if (Math.abs(x) < 3 && z < -12) return false; if (x > 12 && x < 44 && z > 14 && z < 30) return false; if (Math.hypot(x - J.x, z - J.z) < 4) return false; if (x > -27 && x < -11 && z > 11 && z < 19) return false; if (Math.abs(x) < 26 && z > 10) return false; return groundH(x, z) > WATER_Y + 0.8; };
  for (let i = 0; i < 9000; i++) { const x = (r() - 0.5) * 340, z = -260 + r() * 285; if (!free(x, z)) continue; if (fbm(x * 0.04, z * 0.04, 3) < 0.36) continue; W.plant(x, z, 'bamboo', 7 + r() * 5, new T.Color(0x4e7a3a).lerp(new T.Color(0x8aa04a), r()).getHex()); }
  for (let i = 0; i < 1600; i++) { const x = (r() - 0.5) * 900, z = -500 + r() * 520; if (!free(x, z) || Math.abs(x) < 170 && z > -260) continue; W.plant(x, z, r() < 0.5 ? 'leaf' : 'bamboo', 9 + r() * 5); }
  for (let i = 0; i < 120; i++) { const x = (r() - 0.5) * 900; if (Math.abs(x) < 70 || (x > 20 && x < 50)) continue; W.plant(x, RIVER.z0 - 3 - r() * 3, 'willow', 8 + r() * 3); }
  for (const p of [[-15, -6], [15, -6], [-15, 8], [15, 8]]) W.plant(p[0], p[1], 'bloom', 6);
  for (let i = 0; i < 8000; i++) { const x = (r() - 0.5) * 200, z = -150 + r() * 175; if (free(x, z)) W.grass(x, z, 0.4 + r() * 0.5); }
})();

W.birds({ n: 14, center: [0, GROUND, 0], R: [20, 70], h: [10, 30], speed: [0.12, 0.22], scale: 0.55, body: 0xf2c43a, wingIn: 0xe8b42a, wingOut: 0x2a2620, tip: 0x1a1816, head: 0xf2c43a, beak: 0xe07a5a, flap: 9 });   // 黄鹂
W.boats([[-400, 80, 1.2, 0.5], [300, 70, -1.0, 0.5]], WATER_Y, { range: 700, noSail: true });

H.world = W.finish({ WATER_Y, RIVER, BRIDGE, GROUND });
})();
