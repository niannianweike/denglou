/* 望湖楼 · 西湖山水：北岸的宝石山与保俶塔、东边的断桥、白堤（垂柳与桃花）、湖中的孤山、远处南岸的雷峰塔与连绵的青山、湖上的游船
 * 坐标：望湖楼在西湖北岸的原点，正面朝 +z 的湖面；断桥在东（+x），白堤从断桥往西通到孤山 */
(function () {
'use strict';
const H = window.HHL, T = THREE, W = H.wc, K = H.kit;
const { lerp, smooth, fbm, ridged } = H;
const WATER_Y = 0, GROUND = H.tower.GROUND, SHORE = 26;
const DQ = { x: 150, z: 46 }, GS = { x: -430, z: 170 }, BS = { x: 60, z: -260 }, LF = { x: 220, z: 2300 };
const DIKE = [[DQ.x - 8, DQ.z + 4], [-60, 92], [-250, 140], [GS.x + 70, GS.z - 10]];
W.sky({ day: { horizon: 0xd0dce2, fog: 0xc8d4da, fogD: 0.0007 }, dusk: { dir: [-0.9, 0.11, 0.42] }, night: { dir: [0.1, 0.3, 0.95] } }, 90);
W.mistD = 0.0055;

function segD(x, z, a, b) { const dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz))); return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t); }
function dikeD(x, z) { let d = 1e9; for (let i = 0; i < DIKE.length - 1; i++) d = Math.min(d, segD(x, z, DIKE[i], DIKE[i + 1])); return d; }
function groundH(x, z) {
  let h = GROUND - 0.2 + 0.5 * fbm(x * 0.02, z * 0.02, 2);
  const bs = Math.exp(-Math.pow((x - BS.x) / 260, 2) - Math.pow((z - BS.z) / 140, 2)); h += 70 * bs * (0.85 + 0.3 * ridged(x * 0.01, z * 0.01, 4));   // 宝石山
  h += smooth(-120, -600, z) * (20 + 80 * fbm(x * 0.004 + 3, z * 0.004, 4));
  h = lerp(h, -4, smooth(SHORE - 6, SHORE + 20, z) * smooth(2100, 2000, z));                      // 西湖（只有两三米深）
  const dd = dikeD(x, z); if (dd < 12) h = Math.max(h, lerp(GROUND - 0.6, -4, smooth(5, 12, dd)));   // 白堤
  const gq = Math.pow((x - GS.x) / 110, 2) + Math.pow((z - GS.z) / 80, 2); if (gq < 3) h = Math.max(h, -4 + 40 * Math.exp(-gq * 1.4) * (0.85 + 0.3 * ridged(x * 0.02, z * 0.02, 3)));   // 孤山
  const ph = (1 - smooth(10, 14, Math.abs(x - H.tower.PH2.x))) * (1 - smooth(8, 12, Math.abs(z - H.tower.PH2.z))); h = lerp(h, GROUND - 0.2, ph);
  if (z > 1900) h = Math.max(h, lerp(-4, 4, smooth(1950, 2050, z)) + smooth(2050, 3600, z) * 220 * ridged(x * 0.0016 + 4, z * 0.0016, 4));   // 南岸的青山
  const side = smooth(900, 1500, Math.abs(x)) * smooth(0, 400, z); h = Math.max(h, lerp(-4, 3 + 150 * ridged(x * 0.002, z * 0.002, 4) * smooth(1400, 2400, Math.abs(x)), side));   // 西湖三面环山
  return h;
}
W.terrain(groundH, { cx: 0, cz: 600, waterY: WATER_Y, S: 1800, PAL: { floor: 0x3a5a2a, meadow: 0x4e6e30, dry: 0x6e7242, sand: 0x8a8066, wet: 0x4e4a3a, rock: 0x6a6a5e, far: 0x3c5a48, farHi: 0x5a6e72 } });
const terrain = H.scene.children.find(object => object.material === W.terrainMat);
W.water({ y: WATER_Y, color: 0x3e6a64, size: 1.8, distortion: 1.6, speed: 0.22 });

const pave = W.pavingTex(0xb4ac9c, 10);
const plaza = W.groundPlane(pave, -12, 12, -10, 10, 0.05, 4);
W.groundPlane(pave, -400, 200, SHORE - 14, SHORE - 6, 0.04, 3);          // 湖边的北山路
H.world_DIKE = DIKE;

/* ---- 断桥：白堤东头的石拱桥（《白蛇传》里白娘子和许仙在这里相遇） ---- */
(function () {
  const M = H.tower.M, g = new T.Group(); H.scene.add(g);
  const a = DIKE[0], L = 30, dirX = 1, cx = a[0] + 6, cz = a[1] - 4;
  const arch = new T.Shape(); arch.moveTo(-L / 2, -4); arch.lineTo(-L / 2, 0.8); arch.quadraticCurveTo(0, 4.6, L / 2, 0.8); arch.lineTo(L / 2, -4); arch.lineTo(5, -4); arch.absarc(0, -4, 5, 0, Math.PI, false); arch.lineTo(-L / 2, -4);
  const geo = new T.ExtrudeGeometry(arch, { depth: 8, bevelEnabled: false, curveSegments: 24 }); geo.translate(0, 0, -4);
  const br = new T.Mesh(geo, M.stone); br.position.set(cx, 0, cz); br.rotation.y = Math.atan2(-(DQ.z - cz), 1) * 0 + 0.3; br.castShadow = br.receiveShadow = true; g.add(br);
  DQ.x = cx; DQ.z = cz;
})();

/* ---- 保俶塔：宝石山上瘦瘦高高的实心砖塔 ---- */
(function () {
  const x = BS.x - 30, z = BS.z + 40, y0 = groundH(x, z) - 1, g = new T.Group(); g.position.set(x, y0, z); H.scene.add(g);
  const brick = new T.MeshStandardMaterial({ color: 0xb8a890, roughness: 0.9 }); let y = 0, r = 3.4;
  for (let i = 0; i < 7; i++) { const hh = 5.2, m = new T.Mesh(new T.CylinderGeometry(r * 0.94, r, hh, 6), brick); m.position.y = y + hh / 2; g.add(m); const e = new T.Mesh(new T.CylinderGeometry(r + 0.3, r + 0.5, 0.4, 6), brick); e.position.y = y + hh; g.add(e); y += hh + 0.4; r *= 0.9; }
  const top = new T.Mesh(new T.CylinderGeometry(0.15, 0.4, 6, 6), H.tower.M.bronze); top.position.y = y + 3; g.add(top);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  BS.tx = x; BS.tz = z; BS.top = y0 + y + 6;
})();
/* ---- 雷峰塔：南岸夕照山上的八角楼阁式塔（远景） ---- */
(function () {
  const y0 = groundH(LF.x, LF.z), g = new T.Group(); g.position.set(LF.x, y0, LF.z); H.scene.add(g);
  const b = new K.Builder(g, H.tower.M, { dg: 0.6 }); let y = 2, r = 9;
  const ped = new T.Mesh(new T.CylinderGeometry(12, 13, 2, 8), H.tower.M.stone); ped.position.y = 1; g.add(ped);
  const body = new T.MeshStandardMaterial({ color: 0x9a3a22, roughness: 0.7 });
  for (let i = 0; i < 5; i++) { const hh = 7, m = new T.Mesh(new T.CylinderGeometry(r, r, hh, 8), body); m.position.y = y + hh / 2; m.rotation.y = Math.PI / 8; g.add(m); b.eave(K.poly(8, r + 0.2, Math.PI / 8), { din: -1, dout: 2.6, yTop: y + hh + 0.9, rise: 1.2, lift: 1.0, sweep: 0.6, w: 1.6, th: 0.2, rr: 0.12, tileScale: 0.8 }); y += hh + 0.9; r -= 0.9; }
  LF.top = y0 + b.zanjian(K.poly(8, r + 0.6, Math.PI / 8), y, 5, { rr: 0.12, finial: 1.2 }); b.build();
  g.traverse(o => { if (o.isMesh) { o.castShadow = false; } });
})();

/* ---- 树木：白堤的“一株杨柳一株桃”、宝石山的林子、孤山、湖岸 ---- */
(function () {
  const r = W.rand, PH2 = H.tower.PH2;
  const free = (x, z) => { if (Math.abs(x) < 13 && Math.abs(z) < 11) return false; if (Math.abs(x) < 6 && z > 10 && z < SHORE) return false; if (Math.hypot(x - BS.tx, z - BS.tz) < 8) return false; if (Math.abs(x - PH2.x) < 12 && z > PH2.z - 10 && z < PH2.z + 20) return false; return groundH(x, z) > WATER_Y + 1.0; };
  for (let i = 0; i < 9000; i++) { const x = (r() - 0.5) * 2400, z = -1000 + r() * (SHORE + 990); if (!free(x, z)) continue; if (fbm(x * 0.012 + 3, z * 0.012 + 8, 3) < 0.36 && z > -40) continue; if (z > SHORE - 18 && Math.abs(x) < 60) continue; W.plant(x, z, r() < 0.25 ? 'pine' : 'leaf', 10 + r() * 6); }
  for (let i = 0; i < DIKE.length - 1; i++) { const a = DIKE[i], b = DIKE[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.round(L / 7); for (let k = 0; k < n; k++) { const t = (k + 0.5) / n, nx = -(b[1] - a[1]) / L, nz = (b[0] - a[0]) / L; for (const s of [-1, 1]) { const x = a[0] + (b[0] - a[0]) * t + nx * s * 3.6, z = a[1] + (b[1] - a[1]) * t + nz * s * 3.6; W.plant(x, z, k % 2 ? 'bloom' : 'willow', k % 2 ? 5.5 : 8.5); } } }
  for (let i = 0; i < 1400; i++) { const a = r() * 6.283, rr = Math.sqrt(r()) * 1.1, x = GS.x + Math.cos(a) * rr * 110, z = GS.z + Math.sin(a) * rr * 80; if (free(x, z)) W.plant(x, z, r() < 0.3 ? 'pine' : 'leaf', 10 + r() * 5); }
  for (let i = 0; i < 4000; i++) { const x = (r() - 0.5) * 3200, z = 1980 + r() * 900; if (groundH(x, z) > 2) W.plant(x, z, r() < 0.3 ? 'pine' : 'leaf', 12 + r() * 6); }
  for (let i = 0; i < 160; i++) { const x = -400 + r() * 600; if (Math.abs(x) > 45) W.plant(x, SHORE - 4 - r() * 2, 'willow', 8 + r() * 3); }
  for (const p of [[-10, -8], [10, -8]]) W.plant(p[0], p[1], 'bloom', 6);
  for (let i = 0; i < 8000; i++) { const x = (r() - 0.5) * 300, z = -150 + r() * 170; if (free(x, z)) W.grass(x, z, 0.4 + r() * 0.5); }
  for (let i = 0; i < 2500; i++) { const x = -300 + r() * 600, z = SHORE + 6 + r() * 60; if (groundH(x, z) < -1) W.grass(x, z, 0.5, 0x5a8a3a); }   // 荷叶
})();

W.birds({ n: 16, center: [0, GROUND, 40], R: [16, 90], h: [3, 18], speed: [0.2, 0.34], scale: 0.42, body: 0x1e2230, wingIn: 0x1a1e2a, wingOut: 0x14161e, tip: 0x0a0a10, head: 0x7a2a1a, beak: 0x222222, tailLen: 0.6, flap: 12, glide: 0.3 });   // 燕子
W.boats([[-300, 260, 1.2, 0.5], [100, 420, -0.9, 0.5], [400, 700, 0.8, 0.5], [-600, 600, -0.7, 0.5], [0, 140, 0.6, 0.45]], WATER_Y, { range: 900, noSail: true });

/* 骤雨：暗云下的雨丝，只在“起雾”时出现，配合“黑云翻墨”那一站 */
const rain = (function () {
  const n = 5000, pos = new Float32Array(n * 6), r = H.rng(9);
  for (let i = 0; i < n; i++) { const x = (r() - 0.5) * 300, y = r() * 60, z = -40 + r() * 260; pos.set([x, y, z, x - 0.3, y - 2.2, z], i * 6); }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3));
  const m = new T.LineSegments(g, new T.LineBasicMaterial({ color: 0xdfe6ea, transparent: true, opacity: 0, depthWrite: false })); m.frustumCulled = false; H.scene.add(m); return m;
})();
W.onUpdate((dt, t) => { const on = H.world.env.mist && H.world.env.name === 'day'; rain.material.opacity += ((on ? 0.45 : 0) - rain.material.opacity) * Math.min(1, dt * 2); rain.visible = rain.material.opacity > 0.01; rain.position.y = -((t * 40) % 60) + 60; });

const beforeVegetation = new Set(H.scene.children);
H.world = W.finish({ WATER_Y, DQ, GS, BS, LF, SHORE, GROUND });
const vegetation = H.scene.children.filter(object => object.isInstancedMesh && !beforeVegetation.has(object));
// The outer hillside and the West Lake trees pass through the rooms at these coordinates.
// Use the full exterior again as soon as the visitor steps back out.
W.onUpdate((dt, time, inside) => {
  const outside = !inside;
  if (terrain.visible === outside) return;
  terrain.visible = plaza.visible = outside;
  for (const mesh of vegetation) mesh.visible = outside;
});
})();
