/* 太白楼 · 江山世界：采石矶（长江边的石崖）、楼后的翠螺山、伸进江里的联璧台（李白捉月的传说就在这里）、上游的天门山（东梁山、西梁山隔江相对）、江帆、白鸥
 * 坐标：太白楼在原点附近，正面朝 +z 的长江；长江在这一段从南往北流，+x 是下游（北），−x 是上游（南），天门山就在上游 */
(function () {
'use strict';
const H = window.HHL, T = THREE, W = H.wc, K = H.kit;
const { lerp, smooth, fbm, ridged } = H;
const WATER_Y = -5, GROUND = H.tower.GROUND, RIVER = { z0: 62, z1: 1000 };
const LBT = { x: 46, z: 84 };                                    // 联璧台
const TM = { x: -1250, zE: 30, zW: 1030 };                       // 天门山：东梁山在近岸，西梁山在对岸
W.sky({ dusk: { dir: [-0.9, 0.12, 0.42] }, night: { dir: [0.08, 0.26, 0.96] } }, 110);

function hill(x, z, cx, cz, rx, rz, h, s) { const q = Math.pow((x - cx) / rx, 2) + Math.pow((z - cz) / rz, 2); return q < 4 ? h * Math.exp(-q * 1.2) * (0.8 + 0.35 * ridged(x * s + cx, z * s, 4)) : 0; }
function groundH(x, z) {
  let h = GROUND - 0.2 + 1.5 * fbm(x * 0.03, z * 0.03, 2);
  h += hill(x, z, 30, -270, 170, 120, 125, 0.012);                                            // 翠螺山
  h += smooth(-300, -1200, z) * (20 + 80 * fbm(x * 0.004, z * 0.004, 4));
  h += hill(x, z, TM.x, TM.zE - 30, 170, 110, 150, 0.014);                                    // 东梁山
  const cliff = smooth(RIVER.z0 - 22, RIVER.z0 - 4, z) * (1 - smooth(110, 260, Math.abs(x)));   // 采石矶：只有矶头这一段是陡崖
  const bank = smooth(RIVER.z0 - 50, RIVER.z0, z);
  h = lerp(h, WATER_Y + 1.0, bank * (1 - cliff * 0.85));
  h = lerp(h, -16, smooth(RIVER.z0 + 4, RIVER.z0 + 60, z) * smooth(RIVER.z1, RIVER.z1 - 60, z));
  const lq = Math.pow((x - LBT.x) / 20, 2) + Math.pow((z - LBT.z) / 26, 2);                   // 联璧台：伸进江里的石台
  if (lq < 1.6) h = Math.max(h, lerp(GROUND - 1.5, WATER_Y - 2, smooth(0.6, 1.4, lq)) + 1.2 * ridged(x * 0.2, z * 0.2, 3));
  if (z > RIVER.z1 - 40) { const far = smooth(RIVER.z1 - 40, RIVER.z1 + 40, z); h = Math.max(h, lerp(-16, 2 + 6 * fbm(x * 0.006, z * 0.006, 3), far)); h += far * smooth(RIVER.z1 + 400, 3200, z) * 160 * ridged(x * 0.0012, z * 0.0012, 4); h += hill(x, z, TM.x, TM.zW + 50, 170, 110, 140, 0.014); }
  const site = (1 - smooth(20, 30, Math.abs(x))) * smooth(-34, -24, z) * (1 - smooth(RIVER.z0 - 20, RIVER.z0 - 12, z));   // 太白楼和院子所在的平台
  h = lerp(h, GROUND - 0.2, site);
  return h;
}
W.terrain(groundH, { cx: -200, cz: 400, waterY: WATER_Y, PAL: { floor: 0x34502a, meadow: 0x4a6a2e, dry: 0x6a7040, sand: 0x8a7e62, wet: 0x4e4636, rock: 0x6e6658, far: 0x3c5244, farHi: 0x5e6a76 },
  colorFn: (c, x, z, h, sl) => { if (z > RIVER.z0 - 26 && z < RIVER.z0 + 10 && Math.abs(x) < 240) c.lerp(new T.Color(0x8a5a46), 0.55 * smooth(0.6, 1.4, sl)); } });   // 采石矶的红色砂岩
W.water({ y: WATER_Y, color: 0x3e5a52, size: 2.8, distortion: 2.6, speed: 0.42, silt: { color: 0x7a7458, opacity: 0.16 } });

/* 院里的石板地、楼前通往联璧台的石径 */
const pave = W.pavingTex(0xb0a898, 6);
W.groundPlane(pave, -15, 15, -18, 22, 0.05, 4);
W.groundPlane(pave, -3, 3, 26, 56, 0.05, 3);
(function () {                                                    // 崖边的石栏
  const M = H.tower.M, B = new H.Batch(new T.BoxGeometry(1, 1, 1), M.stoneI), g = new T.Group(); H.scene.add(g);
  for (let x = -60; x <= 60; x += 2.2) { const z = RIVER.z0 - 20, y = groundH(x, z); B.add(x, y + 0.55, z, 0.3, 1.1, 0.3, 0, 0xc0baac); B.add(x + 1.1, y + 0.98, z, 2.2, 0.14, 0.2, 0, 0xc0baac); }
  B.build(g);
})();

/* ============================== 林木、芳草 ============================== */
(function () {
  const r = W.rand;
  const free = (x, z) => { if (Math.abs(x) < 18 && z > -20 && z < 30) return false; if (Math.abs(x) < 5 && z > 24 && z < 58) return false; return groundH(x, z) > WATER_Y + 1.2; };
  for (let i = 0; i < 9000; i++) { const x = -1600 + r() * 2200, z = -900 + r() * (RIVER.z0 - 10 + 900); if (!free(x, z)) continue; if (fbm(x * 0.012 + 3, z * 0.012 + 8, 3) < 0.36 && Math.hypot(x - 20, z + 150) > 160) continue; W.plant(x, z, r() < 0.3 ? 'pine' : 'leaf', 10 + r() * 6); }
  for (let i = 0; i < 4000; i++) { const x = -1700 + r() * 2600, z = RIVER.z1 + 20 + r() * 700; if (groundH(x, z) > WATER_Y + 1.2 && fbm(x * 0.012, z * 0.012, 3) > 0.4) W.plant(x, z, r() < 0.3 ? 'pine' : 'leaf', 10 + r() * 6); }
  for (const p of [[-12, 4], [12, 4], [-12, 18], [12, 18]]) W.plant(p[0], p[1], 'pine', 9);
  for (const p of [[-8, -14], [8, -14]]) W.plant(p[0], p[1], 'bloom', 7);
  for (let i = 0; i < 8000; i++) { const x = -200 + r() * 400, z = -220 + r() * 280; if (free(x, z)) W.grass(x, z, 0.5 + r() * 0.6); }
})();

/* ============================== 鸥鸟、江帆 ============================== */
W.birds({ n: 14, center: [0, WATER_Y, 260], R: [40, 220], h: [6, 30], speed: [0.08, 0.16], scale: 0.9, body: 0xf6f6f2, wingOut: 0xb0b4ba, tip: 0x111114, beak: 0xf0b030, flap: 6.5 });
W.boats([[-500, 300, 2.2], [200, 480, -1.6], [-900, 640, 1.4], [600, 820, -1.0], [-200, 900, 0.9], [900, 260, 0.7]], WATER_Y, { range: 1700 });

H.world = W.finish({ WATER_Y, RIVER, LBT, TM, GROUND });
})();
