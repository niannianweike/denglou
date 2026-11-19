/* 北固楼 · 江山世界：伸进长江的北固山（三面临江）、上游江心的金山与金山寺慈寿塔、下游江中的焦山、山下的镇江城、江帆与大雁
 * 坐标：北固楼在后峰顶的原点，正面朝 +z 的长江；+x 是下游（东），焦山在东，金山在西 */
(function () {
'use strict';
const H = window.HHL, T = THREE, W = H.wc, K = H.kit;
const { lerp, smooth, fbm, ridged } = H;
const WATER_Y = 0, GROUND = H.tower.GROUND, RIVER = { z0: -30, z1: 1300 };
const JINSHAN = { x: -1100, z: 160 }, JIAOSHAN = { x: 1000, z: 380 };

W.sky({ dusk: { dir: [-0.88, 0.11, 0.46] }, night: { dir: [0.2, 0.3, 0.93] } }, 120);
function hill(x, z, cx, cz, rx, rz, h, s) { const q = Math.pow((x - cx) / rx, 2) + Math.pow((z - cz) / rz, 2); return q < 4 ? -8 + (h + 8) * Math.exp(-q * 1.3) * (0.82 + 0.3 * ridged(x * s + cx, z * s, 4)) : -1e9; }   // 岛外返回 −1e9，不会把江底抬起来
function groundH(x, z) {
  let h = 3 + 2 * fbm(x * 0.01, z * 0.01, 3);
  h += smooth(-200, -700, z) * (4 + 30 * fbm(x * 0.004, z * 0.004, 4)) + smooth(-900, -2200, z) * 160 * ridged(x * 0.0015, z * 0.0015, 4);
  const shore = z > RIVER.z0 + 30 ? lerp(-14, WATER_Y + 1.2, 1 - smooth(RIVER.z0 + 30, RIVER.z0 + 90, z)) : h;   // 长江在北
  h = Math.min(h, shore);
  if (z > RIVER.z1 - 60) h = lerp(-14, 3 + 4 * fbm(x * 0.006, z * 0.006, 3), smooth(RIVER.z1 - 60, RIVER.z1 + 20, z)) + smooth(RIVER.z1 + 300, 3000, z) * 120 * ridged(x * 0.0015, z * 0.0015, 4);
  // 北固山：南北长条，北头伸进江里；前峰、中峰低，后峰最高
  const ridge = Math.exp(-Math.pow(x / 42, 2)) * smooth(-260, -150, z) * (1 - smooth(70, 110, z));
  const peak = Math.exp(-Math.pow(x / 46, 2) - Math.pow(z / 60, 2)) * (GROUND - 2) + Math.exp(-Math.pow((x + 4) / 40, 2) - Math.pow((z + 120) / 50, 2)) * 26 + Math.exp(-Math.pow((x + 6) / 40, 2) - Math.pow((z + 210) / 50, 2)) * 22;
  const ph = ridge * 12 + peak * (0.92 + 0.12 * ridged(x * 0.03, z * 0.03, 3)); if (ph > 1.5) h = Math.max(h, ph - 1.5 + Math.min(0, h) * smooth(6, 1.5, ph));   // 只在山体真正高出来的地方叠加
  h = lerp(h, GROUND - 0.4, 1 - smooth(14, 22, Math.max(Math.abs(x) - 0, Math.abs(z) * 1.1)));                      // 楼前后削平
  h = lerp(h, GROUND - 4.4, (1 - smooth(22, 28, Math.abs(x + 2))) * smooth(-64, -58, z) * smooth(-24, -30, z));        // 甘露寺所在的台地
  h = Math.max(h, hill(x, z, JINSHAN.x, JINSHAN.z, 70, 60, 42, 0.03), hill(x, z, JIAOSHAN.x, JIAOSHAN.z, 120, 90, 70, 0.02));
  return h;
}
W.terrain(groundH, { cx: 0, cz: 400, waterY: WATER_Y, S: 1700, PAL: { floor: 0x38522a, meadow: 0x4c6a2e, dry: 0x6e7242, sand: 0x8a7e62, wet: 0x4e4636, rock: 0x6e6658, far: 0x3c5244, farHi: 0x5e6a76 } });
W.water({ y: WATER_Y, color: 0x405a52, size: 2.6, distortion: 2.6, speed: 0.42, silt: { color: 0x7a7458, opacity: 0.18 } });
W.groundPlane(W.pavingTex(0xb4ac9c, 8), -11, 11, -10, 10, 0.05, 4);
H.tower.LY.build(groundH(H.tower.LY.x, H.tower.LY.z));

/* ============================== 金山寺慈寿塔：上游江边金山上的七层砖木塔 ============================== */
(function () {
  const M = H.tower.M, y0 = groundH(JINSHAN.x, JINSHAN.z), g = new T.Group(); g.position.set(JINSHAN.x, y0 - 1, JINSHAN.z); H.scene.add(g);
  const b = new K.Builder(g, M, { dg: 0.5 }); let y = 1.0, r = 4.2;
  const ped = new T.Mesh(new T.CylinderGeometry(5.4, 5.8, 1.0, 8), M.stone); ped.position.y = 0.5; g.add(ped);
  const white = new T.MeshStandardMaterial({ color: 0xece6d8, roughness: 0.85 });
  for (let i = 0; i < 7; i++) {
    const hh = 4.6 - i * 0.2, body = new T.Mesh(new T.CylinderGeometry(r, r * 1.02, hh, 8), white); body.position.y = y + hh / 2; body.rotation.y = Math.PI / 8; g.add(body);
    if (i > 0) b.fenceRing(K.poly(8, r + 0.8, Math.PI / 8 + Math.PI / 8), y);
    b.eave(K.poly(8, r + 0.1, Math.PI / 4), { din: -0.4, dout: 1.4, yTop: y + hh + 0.6, rise: 0.7, lift: 0.9, sweep: 0.4, w: 1.0, th: 0.14, rr: 0.08, tileScale: 0.6 });
    y += hh + 0.6; r -= 0.36;
  }
  JINSHAN.top = y0 + b.zanjian(K.poly(8, r + 0.4, Math.PI / 4), y, 3.6, { rr: 0.08, finial: 0.8 });
  b.build(); g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
})();

/* ============================== 镇江城：山脚下的白墙黑瓦 ============================== */
(function () {
  const wallM = new T.MeshStandardMaterial({ color: 0xe6e2d8, roughness: 0.92 }), roofM = new T.MeshStandardMaterial({ color: 0x4a4e54, roughness: 0.75, side: T.DoubleSide });
  const prism = new T.BufferGeometry(); prism.setAttribute('position', new T.Float32BufferAttribute([-0.5, 0, -0.5, 0.5, 0, -0.5, 0, 1, -0.5, -0.5, 0, 0.5, 0.5, 0, 0.5, 0, 1, 0.5], 3)); prism.setIndex([0, 2, 1, 3, 4, 5, 0, 3, 5, 0, 5, 2, 1, 2, 5, 1, 5, 4]); prism.computeVertexNormals();
  const walls = new H.Batch(new T.BoxGeometry(1, 1, 1), wallM), roofs = new H.Batch(prism, roofM), r = H.rng(81), g = new T.Group(); H.scene.add(g);
  for (let i = 0; i < 160; i++) { const x = -700 + r() * 1400, z = -320 + r() * 280; if (Math.abs(x) < 80 && z > -260) continue; const y = groundH(x, z); if (y > 14) continue; const w = 8 + r() * 6, d = 6 + r() * 3, hh = 4 + r() * 3, ry = (r() < 0.5 ? 0 : Math.PI / 2); walls.add(x, y + hh / 2, z, w, hh, d, ry); roofs.add(x, y + hh, z, w + 0.8, 2.4, d + 1.0, ry); }
  walls.build(g); roofs.build(g); g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
})();

/* ============================== 林木、芳草 ============================== */
(function () {
  const r = W.rand, LY = H.tower.LY, GL = H.tower.GL, TT = H.tower.TT;
  const free = (x, z) => { if (Math.abs(x) < 14 && Math.abs(z) < 12) return false; if (Math.abs(x - GL.x) < 14 && Math.abs(z - GL.z) < 11) return false; if (Math.hypot(x - TT.x, z - TT.z) < 5) return false; if (Math.hypot(x - LY.x, z - LY.z) < 6) return false; if (Math.abs(x - 1) < 4 && z > -36 && z < -10) return false; if (Math.abs(x) < 26 && z > 6 && z < 64) return false; if (Math.hypot(x - LY.x, z - LY.z) < 16) return false; if (Math.hypot(x, z) < 30) return false; return groundH(x, z) > WATER_Y + 1.2; };
  for (let i = 0; i < 9000; i++) { const x = (r() - 0.5) * 2600, z = -1300 + r() * 1360; if (!free(x, z)) continue; if (fbm(x * 0.012 + 3, z * 0.012 + 8, 3) < 0.4) continue; W.plant(x, z, r() < 0.3 ? 'pine' : 'leaf', 10 + r() * 6); }
  for (let i = 0; i < 260; i++) { const x = (r() - 0.5) * 80, z = -260 + r() * 330; if (free(x, z) && Math.hypot(x, z) > 34 && Math.hypot(x - LY.x, z - LY.z) > 16) W.plant(x, z, r() < 0.4 ? 'pine' : 'leaf', 8 + r() * 4); }
  for (const c of [JINSHAN, JIAOSHAN]) for (let i = 0; i < 700; i++) { const a = r() * 6.283, rr = Math.sqrt(r()) * (c === JIAOSHAN ? 120 : 70); const x = c.x + Math.cos(a) * rr, z = c.z + Math.sin(a) * rr * 0.8; if (Math.hypot(x - c.x, z - c.z) < 10) continue; if (groundH(x, z) > 2) W.plant(x, z, r() < 0.4 ? 'pine' : 'leaf', 10 + r() * 5); }
  for (let i = 0; i < 3000; i++) { const x = (r() - 0.5) * 3000, z = RIVER.z1 + 30 + r() * 800; if (groundH(x, z) > 2 && fbm(x * 0.01, z * 0.01, 3) > 0.42) W.plant(x, z, 'leaf', 11 + r() * 5); }
  for (let i = 0; i < 8000; i++) { const x = (r() - 0.5) * 120, z = -80 + r() * 160; if (free(x, z)) W.grass(x, z, 0.5 + r() * 0.6); }
})();

/* 大雁：排成“人”字往北飞（这里让它们绕着北固山盘旋） */
W.birds({ n: 14, center: [0, GROUND, 120], R: [70, 160], h: [16, 50], speed: [0.06, 0.09], scale: 1.4, body: 0x8a7e6a, wingIn: 0x7a6e5a, wingOut: 0x5a5244, tip: 0x2a2620, head: 0x3a3430, beak: 0x2a2620, neck: true, flap: 4.5, glide: 0.2 });
W.boats([[-600, 260, 2.2], [300, 480, -1.6], [900, 700, 1.2], [-200, 900, -0.9], [1400, 300, 0.8]], WATER_Y, { range: 1900 });

H.world = W.finish({ WATER_Y, RIVER, JINSHAN, JIAOSHAN, GROUND });
})();
