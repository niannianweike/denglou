/* 蓬莱阁 · 海山世界：伸进大海的丹崖山（红色的悬崖）、东边的蓬莱水城（明代海军港口，戚继光练兵的地方）、远处海上的长山列岛、海上的帆船、海鸥，以及偶尔出现的海市蜃楼
 * 坐标：蓬莱阁在丹崖山顶的原点，正面朝 +z 的大海（北边，渤海与黄海在这里分界）；水城在东（+x） */
(function () {
'use strict';
const H = window.HHL, T = THREE, W = H.wc, K = H.kit;
const { lerp, smooth, fbm, ridged } = H, rect = K.rect;
const WATER_Y = 0, GROUND = H.tower.GROUND, SC = { x: 230, z: -10 }, ISLES = [[-900, 2600, 260, 40], [-200, 3000, 180, 30], [600, 2800, 320, 50], [1500, 3200, 220, 34]];
W.sky({ day: { horizon: 0xc8d8e4, water: 0x1e4a60 }, dusk: { dir: [-0.9, 0.12, 0.4] }, night: { dir: [0.1, 0.3, 0.95] } }, 110);
W.mistD = 0.0045;

function groundH(x, z) {
  let h = 6 + 4 * fbm(x * 0.008, z * 0.008, 3) + smooth(-100, -800, z) * (10 + 40 * fbm(x * 0.004, z * 0.004, 4));
  const q = Math.pow(x / 80, 2) + Math.pow((z + 10) / 70, 2);                                     // 丹崖山
  h = Math.max(h, (GROUND + 0.6) * Math.exp(-Math.pow(Math.max(0, q - 0.35), 1.2) * 1.4) * (0.94 + 0.08 * ridged(x * 0.03, z * 0.03, 3)));
  h = lerp(h, GROUND - 0.3, 1 - smooth(16, 24, Math.max(Math.abs(x), Math.abs(z + 10) * 1.0)));
  h = lerp(h, GROUND - 0.3, (1 - smooth(10, 14, Math.abs(x + 4))) * smooth(-44, -38, z) * smooth(-14, -20, z));
  const coast = 42 + 18 * Math.sin(x * 0.006) + 30 * smooth(60, 160, Math.abs(x)) * -1 + 14 * fbm(x * 0.01, 0, 3);   // 海岸线：丹崖山向北凸出
  const cliff = 1 - smooth(60, 120, Math.abs(x));
  h = lerp(h, -12, smooth(coast - (cliff ? 2 : 30), coast + (cliff ? 4 : 30), z));
  const sq = Math.pow((x - SC.x) / 90, 2) + Math.pow((z - SC.z - 30) / 50, 2); if (sq < 1) h = lerp(h, -6, 1 - smooth(0.6, 1.0, sq));   // 水城的小海湾
  for (const s of ISLES) { const iq = Math.pow((x - s[0]) / s[2], 2) + Math.pow((z - s[1]) / (s[2] * 0.5), 2); if (iq < 2) h = Math.max(h, -12 + (s[3] + 12) * Math.exp(-iq * 1.6) * (0.8 + 0.3 * ridged(x * 0.004, z * 0.004, 3))); }
  return h;
}
W.terrain(groundH, { cx: 0, cz: 300, waterY: WATER_Y, S: 1700, PAL: { floor: 0x4a6030, meadow: 0x5a6e34, dry: 0x7a7444, sand: 0xb0a07a, wet: 0x5e5240, rock: 0x8a4a34, far: 0x4a5e50, farHi: 0x6a7480 },
  colorFn: (c, x, z, h, sl) => { if (h > 0.5 && Math.abs(x) < 150) { const k = smooth(0.7, 1.6, sl), band = 0.75 + 0.25 * Math.sin(h * 1.7 + fbm(x * 0.05, z * 0.05, 2) * 4) + 0.15 * (fbm(x * 0.12, h * 0.6, 3) - 0.5); c.lerp(new T.Color(0x6a3e30).multiplyScalar(band), 0.7 * k); } } });   // 丹崖：红色的岩壁
W.water({ y: WATER_Y, color: 0x1e4a60, size: 3.6, distortion: 3.4, speed: 0.4 });
W.groundPlane(W.pavingTex(0xb4ac9c, 12), -11, 11, -44, 18, 0.05, 4);

/* ---- 蓬莱水城：明朝的海军港口，城墙围着一个小海湾，戚继光在这里操练水师 ---- */
(function () {
  const M = H.tower.M, g = new T.Group(); H.scene.add(g); const B = new H.Batch(new T.BoxGeometry(1, 1, 1), M.brick);
  const pts = []; for (let a = 0; a <= Math.PI * 2 + 0.001; a += 0.035) pts.push([SC.x + Math.cos(a) * 100, SC.z + 30 + Math.sin(a) * 58, a]);
  for (let i = 0; i < pts.length - 1; i++) { const p = pts[i], q = pts[i + 1], mx = (p[0] + q[0]) / 2, mz = (p[1] + q[1]) / 2, mid = (p[2] + q[2]) / 2; if (Math.abs(mid - Math.PI / 2) < 0.12) continue; const L = Math.hypot(q[0] - p[0], q[1] - p[1]) + 0.3, ry = -Math.atan2(q[1] - p[1], q[0] - p[0]), y0 = Math.min(groundH(mx, mz), -6); B.add(mx, (y0 + 8) / 2, mz, L, 8 - y0, 3.4, ry); for (let k = 0; k < 2; k++) B.add(mx + Math.cos(-ry) * (k - 0.5) * L * 0.5, 8.6, mz + Math.sin(-ry) * (k - 0.5) * L * 0.5 , 1.0, 1.2, 0.6, ry); }
  B.build(g);
  const gt = new T.Mesh(new T.BoxGeometry(14, 14, 5), M.brick); gt.position.set(SC.x, 1, SC.z + 30 + 58); g.add(gt);
  const gg = new T.Group(); gg.position.set(SC.x, 8, SC.z + 30 + 58); H.scene.add(gg); const b = new K.Builder(gg, M, { dg: 0.6 });   // 水门上的小楼
  const s = b.storey(rect(4, 2.4), { y: 0, nextY: 4.2, eaveGap: 0.4, rise: 1.0, vw: 0.6, r: 0.2, colStep: 2.6, din: -0.8, dout: 1.6, lift: 1.3, w: 1.4, dgS: 0.6 }); b.xieshan(3.4, 1.8, 2.0, { y0: s.eaveTop, HR: 1.6, ov: 0.3, rr: 0.1, endScale: 0.26 }); b.build();
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
})();

/* ---- 海市蜃楼：远处海面上淡淡的城市幻影，“起雾”关掉、白天晴朗时才慢慢出现 ---- */
const mirage = (function () {
  const tex = H.canvasTex(2048, 256, function (g, w, h) {
    g.clearRect(0, 0, w, h); const r = H.rng(3);
    for (let i = 0; i < 70; i++) { const x = r() * w, bw = 20 + r() * 60, bh = 40 + r() * 180; g.fillStyle = 'rgba(200,214,224,' + (0.5 + r() * 0.4) + ')'; g.fillRect(x, h - bh, bw, bh); if (r() < 0.4) { g.beginPath(); g.moveTo(x - 10, h - bh); g.lineTo(x + bw / 2, h - bh - 30); g.lineTo(x + bw + 10, h - bh); g.fill(); } }
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,1)'); g.globalCompositeOperation = 'destination-in'; g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }, true);
  const m = new T.Mesh(new T.PlaneGeometry(3600, 260), new T.MeshBasicMaterial({ map: tex, color: 0x9aa8b6, transparent: true, opacity: 0, depthWrite: false, fog: false })); m.position.set(300, 150, 2400); m.rotation.y = Math.PI; H.scene.add(m); return m;
})();
let mirageOn = false; H.mirage = on => { mirageOn = on; };
W.onUpdate((dt, t) => { const env = H.world.env; const want = mirageOn && env.name === 'day' && !env.mist ? 0.85 + 0.12 * Math.sin(t * 0.7) : 0; mirage.material.opacity += (want - mirage.material.opacity) * Math.min(1, dt * 0.8); mirage.visible = mirage.material.opacity > 0.01; mirage.scale.y = 1 + 0.06 * Math.sin(t * 1.3); });

/* ---- 树木：山上的松柏、山下的林子 ---- */
(function () {
  const r = W.rand, TH = H.tower.TH;
  const free = (x, z) => { if (Math.abs(x) < 13 && z > -46 && z < 20) return false; if (Math.abs(x) < 30 && z > 0 && z < 60) return false; return groundH(x, z) > WATER_Y + 1.4; };
  for (let i = 0; i < 9000; i++) { const x = (r() - 0.5) * 2200, z = -1000 + r() * 1060; if (!free(x, z)) continue; if (fbm(x * 0.012 + 3, z * 0.012 + 8, 3) < 0.38 && Math.hypot(x, z) > 90) continue; W.plant(x, z, r() < 0.5 ? 'pine' : 'leaf', 9 + r() * 5); }
  for (const s of ISLES) for (let i = 0; i < 300; i++) { const a = r() * 6.283, rr = Math.sqrt(r()) * s[2] * 0.8, x = s[0] + Math.cos(a) * rr, z = s[1] + Math.sin(a) * rr * 0.5; if (groundH(x, z) > 3) W.plant(x, z, r() < 0.5 ? 'pine' : 'leaf', 12 + r() * 6); }
  for (let i = 0; i < 6000; i++) { const x = (r() - 0.5) * 200, z = -150 + r() * 190; if (free(x, z)) W.grass(x, z, 0.4 + r() * 0.5); }
})();

W.birds({ n: 16, center: [0, WATER_Y, 120], R: [40, 200], h: [20, 60], speed: [0.08, 0.16], scale: 0.9, body: 0xf6f6f2, wingOut: 0xb0b4ba, tip: 0x111114, beak: 0xf0b030, flap: 6.5 });
W.boats([[-500, 300, 2.0], [300, 500, -1.6], [900, 800, 1.2], [-200, 1200, -0.9], [SC.x - 30, SC.z + 40, 0, 0.6], [SC.x + 20, SC.z + 30, 0, 0.6]], WATER_Y, { range: 1900 });

H.world = W.finish({ WATER_Y, SC, GROUND });
})();
