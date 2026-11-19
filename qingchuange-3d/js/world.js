/* 晴川阁 · 江山世界：长江与汉江交汇处、龟山、禹功矶、江对岸蛇山上的黄鹤楼、武汉长江大桥、鹦鹉洲、铁门关、白鹭与江船
 * 坐标：晴川阁在原点，正面朝 +z 的长江；+x 朝北（汉江在北边汇入长江），江对岸是武昌 */
(function () {
'use strict';
const H = window.HHL, T = THREE, W = H.wc, K = H.kit;
const { lerp, smooth, fbm, ridged, V3, rect } = Object.assign({}, H, K);
const WATER_Y = -6, GROUND = H.tower.GROUND;
const RIVER = { z0: 75, z1: 1120 }, HAN = { x0: 300, x1: 390 };
const YH = { x: -10, z: 1240 }, BRIDGE = { x: 150, z0: -150, z1: 1420, deck: 38 }, YWZ = { x: -620, z: 280 };

W.sky({ dusk: { dir: [-0.42, 0.12, -0.9] }, night: { dir: [0.3, 0.32, 0.9] } }, 110);

/* ============================== 地形 ============================== */
function groundH(x, z) {
  let h = 4 + 3 * fbm(x * 0.01 + 3, z * 0.01, 3);
  const gs = Math.exp(-Math.pow((x - 115) / 70, 2)) * smooth(-40, -180, z) * smooth(-1500, -1000, z);       // 龟山：东西走向，东头伸到江边
  h += 80 * gs * (0.82 + 0.3 * ridged(x * 0.01, z * 0.01 + 3, 4));
  const ss = Math.exp(-Math.pow((x - 0) / 58, 2)) * smooth(1170, 1260, z) * smooth(2600, 2100, z);          // 蛇山：在江对岸，也是东西走向
  h += 50 * ss * (0.85 + 0.25 * ridged(x * 0.012 + 7, z * 0.012, 4));
  h += smooth(1700, 3800, z) * 60 * fbm(x * 0.002, z * 0.002, 4) + smooth(-1600, -3500, z) * 140 * ridged(x * 0.0015, z * 0.0015, 4) + smooth(1800, 3600, Math.abs(x)) * 120 * fbm(x * 0.0018, z * 0.0018 + 5, 4);
  // 汉江：从西边流过来，在龟山北边汇入长江
  const hj = smooth(HAN.x0 - 40, HAN.x0, x) * smooth(HAN.x1 + 40, HAN.x1, x) * smooth(-2500, -2300, z) * smooth(RIVER.z0 + 40, RIVER.z0, z);
  h = lerp(h, -12, hj);
  // 长江：两岸是缓缓的江滩，中间是深水
  h = lerp(h, WATER_Y + 1.2, smooth(RIVER.z0 - 30, RIVER.z0 - 5, z) * smooth(RIVER.z1 + 50, RIVER.z1 + 10, z));
  h = lerp(h, -18, smooth(RIVER.z0, RIVER.z0 + 60, z) * smooth(RIVER.z1 + 10, RIVER.z1 - 50, z));
  // 鹦鹉洲：下游汉阳岸边的一片沙洲
  const yq = Math.pow((x - YWZ.x) / 170, 2) + Math.pow((z - YWZ.z) / 45, 2); if (yq < 2) h = Math.max(h, WATER_Y - 1 + 2.4 * Math.exp(-yq * 1.3));
  // 禹功矶：伸进江里的石矶，顶上平整，建着晴川阁和禹稷行宫
  const q = Math.pow(x / 64, 2) + Math.pow((z + 16) / 58, 2);
  h = lerp(h, GROUND, 1 - smooth(0.82, 1.08, q));
  if (q > 0.95 && q < 1.6 && z > -10) h = Math.max(h, lerp(GROUND - 1, WATER_Y - 1, smooth(1.0, 1.55, q)) + 1.6 * ridged(x * 0.15, z * 0.15, 3));   // 石矶陡岸
  return h;
}
W.terrain(groundH, { cx: 0, cz: 500, waterY: WATER_Y, PAL: { floor: 0x36502a, meadow: 0x4f6a30, dry: 0x7a7a46, sand: 0x8a7e62, wet: 0x4e4636, rock: 0x6e6a60, far: 0x3c5244, farHi: 0x627080 } });
W.water({ y: WATER_Y, color: 0x3c5a4c, size: 2.6, distortion: 2.8, speed: 0.45, silt: { color: 0x7a7050, opacity: 0.22 } });

/* 矶顶石板地、通往江边的石阶 */
const pave = W.pavingTex(0xb0a898, 4);
W.groundPlane(pave, -58, 42, -46, 22, 0.05, 4);
(function () {                                                    // 禹功矶临江一面的石砌驳岸
  const M = H.tower.M, g = new T.Group(); H.scene.add(g); const seg = new H.Batch(new T.BoxGeometry(1, 1, 1), M.stoneI);
  for (let a = -1.05; a <= 1.05; a += 0.05) { const x = Math.sin(a) * 60, z = -16 + Math.cos(a) * 54, nx = Math.sin(a), nz = Math.cos(a); seg.add(x, (GROUND + WATER_Y) / 2 - 0.4, z, 3.2, GROUND - WATER_Y + 1.6, 1.4, Math.atan2(nx, nz), 0xa8a294); }
  seg.build(g);
})();

/* ============================== 江对岸：蛇山上的黄鹤楼（远景） ============================== */
(function () {
  const M2 = K.materials({ tile: 'yellow', wall: 'ming', caihua: 'xuan', band: 'ming', rail: 'ming', dougong: 'ming', lacquer: 0x8a2416 });
  const y0 = groundH(YH.x, YH.z) + 2.5, g = new T.Group(); g.position.set(YH.x, y0, YH.z); g.rotation.y = Math.PI; H.scene.add(g);
  const b = new K.Builder(g, M2, { dg: 1.3 });
  let y = 0, a = 13;
  for (let i = 0; i < 5; i++) { const s = b.storey(H.plan(a - 3.2, a - 6, 3.2), { y, nextY: y + 8.4, eaveGap: 0.8, rise: 1.9, vw: 1.4, r: 0.45, colStep: 3.2, pingzuo: i > 0 ? 1.0 : false, din: -1.4, dout: 3.0, lift: 2.4, sweep: 1.3, w: 2.4, beasts: true, dgS: 1.3, tileScale: 1.3, que: false }); y += 8.4; a -= 1.6; }
  YH.top = y0 + b.zanjian(rect(a - 3.6, a - 3.6), y - 0.8, 6.5, { rr: 0.2, finial: 1.4 });
  b.build(); g.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
  K.platform(M2, { hx: 20, hz: 20, y0: y0 - 4, y1: y0, cx: YH.x, cz: YH.z, rail: true });
  W.onQuality(Q => { /* 远景楼不投影，省性能 */ });
})();

/* ============================== 武汉长江大桥：1957 年建成的“万里长江第一桥”，上层走汽车，下层走火车 ============================== */
(function () {
  const steel = new T.MeshStandardMaterial({ color: 0x5c6a66, roughness: 0.55, metalness: 0.5, envMapIntensity: 0.7 });
  const conc = new T.MeshStandardMaterial({ color: 0xb8b2a4, roughness: 0.85, envMapIntensity: 0.4 });
  const road = new T.MeshStandardMaterial({ color: 0x3a3c40, roughness: 0.9 });
  const bx = BRIDGE.x, D = BRIDGE.deck, z0 = RIVER.z0 - 20, z1 = RIVER.z1 + 20, half = 9;
  const mem = new H.Batch(new T.BoxGeometry(1, 1, 1), steel), pier = new H.Batch(new T.BoxGeometry(1, 1, 1), conc);
  const g = new T.Group(); H.scene.add(g);
  const N = 8, span = (z1 - z0) / (N + 1);
  for (let i = 1; i <= N; i++) { const z = z0 + span * i, bot = -18, top = D - 17; pier.add(bx, (bot + top) / 2, z, 20, top - bot, 7, 0, 0xbab4a6); pier.add(bx, top + 0.5, z, 22, 1, 8, 0, 0xd0cabc); }
  const yb = D - 16, yt = D;                                       // 钢桁梁：上弦、下弦、竖杆、斜杆
  for (const sx of [-half, half]) {
    mem.add(bx + sx, yt, (z0 + z1) / 2, 0.9, 1.2, z1 - z0, 0); mem.add(bx + sx, yb, (z0 + z1) / 2, 0.9, 1.4, z1 - z0, 0);
    const seg = 16, n = Math.round((z1 - z0) / seg);
    for (let k = 0; k <= n; k++) { const z = z0 + k * (z1 - z0) / n; mem.add(bx + sx, (yb + yt) / 2, z, 0.6, yt - yb, 0.6, 0); if (k < n) { const zz = z + (z1 - z0) / n / 2, L = Math.hypot(yt - yb, (z1 - z0) / n), ang = Math.atan2((z1 - z0) / n, yt - yb) * (k % 2 ? 1 : -1); mem.add(bx + sx, (yb + yt) / 2, zz, 0.5, L, 0.5, 0, 0xffffff, ang); } }
  }
  for (let k = 0; k <= 64; k++) { const z = z0 + k * (z1 - z0) / 64; mem.add(bx, yt + 0.2, z, half * 2, 0.4, 0.5, 0); mem.add(bx, yb, z, half * 2, 0.5, 0.5, 0); }
  const deck = new T.Mesh(new T.BoxGeometry(22, 0.6, z1 - z0), road); deck.position.set(bx, yt + 0.8, (z0 + z1) / 2); g.add(deck);
  for (const sx of [-11, 11]) { const rl = new T.Mesh(new T.BoxGeometry(0.3, 1.1, z1 - z0), conc); rl.position.set(bx + sx, yt + 1.6, (z0 + z1) / 2); g.add(rl); }
  for (const [za, zb] of [[BRIDGE.z0, z0], [z1, BRIDGE.z1]]) {     // 两岸的引桥
    const d = new T.Mesh(new T.BoxGeometry(22, 2.0, Math.abs(zb - za)), conc); d.position.set(bx, yt + 0.3, (za + zb) / 2); g.add(d);
    const n = Math.round(Math.abs(zb - za) / 26); for (let k = 1; k < n; k++) { const z = za + (zb - za) * k / n, gh = groundH(bx, z); if (gh < yt - 2) pier.add(bx, (gh + yt) / 2, z, 4, yt - gh, 4, 0, 0xc0baac); }
  }
  for (const zt of [z0 - 6, z1 + 6]) for (const sx of [-1, 1]) {   // 桥头堡：四座高塔，塔顶是小小的中式亭子
    const gh = groundH(bx + sx * 13, zt), tw = new T.Mesh(new T.BoxGeometry(7, yt - gh + 14, 7), conc); tw.position.set(bx + sx * 14, (gh + yt + 14) / 2, zt); g.add(tw);
    const pg = new T.Group(); pg.position.set(bx + sx * 14, yt + 14, zt); H.scene.add(pg); const pb = new K.Builder(pg, H.tower.M, { dg: 0.5 });
    const ps = pb.storey(rect(2.6, 2.6), { y: 0, nextY: 3.6, eaveGap: 0.4, rise: 0.9, noWall: true, r: 0.2, colStep: 5.2, din: -0.6, dout: 1.2, lift: 0.9, w: 1.1, dgS: 0.5, rr: 0.1, tileScale: 0.7, que: false });
    pb.zanjian(rect(2.1, 2.1), ps.eaveTop - 0.02, 2.2, { rr: 0.09, finial: 0.5 }); pb.build();
  }
  mem.build(g); pier.build(g); g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
})();

/* ============================== 铁门关：龟山上的古关隘 ============================== */
(function () {
  const M = H.tower.M, x = 104, z = -150, gh = groundH(x, z), g = new T.Group(); g.position.set(x, gh, z); g.rotation.y = Math.PI / 2; H.scene.add(g);
  const bk = new T.Mesh(new T.BoxGeometry(16, 8, 9), M.brick); bk.position.y = 3; g.add(bk);
  const arch = new T.Shape(); arch.moveTo(-2.2, 0); arch.lineTo(-2.2, 3.4); arch.absarc(0, 3.4, 2.2, Math.PI, 0, true); arch.lineTo(2.2, 0); arch.lineTo(-2.2, 0);
  for (const s of [-1, 1]) { const a = new T.Mesh(new T.ShapeGeometry(arch, 20), new T.MeshStandardMaterial({ color: 0x14100c, roughness: 1 })); a.position.set(0, -1, s * 4.52); if (s < 0) a.rotation.y = Math.PI; g.add(a); }
  const hg = new T.Group(); hg.position.y = 7; g.add(hg); const hb = new K.Builder(hg, M, { dg: 0.7 });
  const hs = hb.storey(rect(5.5, 3.2), { y: 0, nextY: 4.6, eaveGap: 0.5, rise: 1.2, vw: 0.6, r: 0.22, colStep: 2.6, din: -0.8, dout: 1.6, lift: 1.1, w: 1.5, dgS: 0.7, beasts: true });
  hb.xieshan(4.8, 2.5, 2.9, { y0: hs.eaveTop, HR: 2.0, ov: 0.35, rr: 0.12, endScale: 0.32 }); hb.plaque('铁门关', 2.4, 0.8, hs.colTop - 0.35, 3.3, { tilt: 0.1 }); hb.build();
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
})();

/* ============================== 林木、芳草 ============================== */
(function () {
  const free = (x, z) => {
    if (Math.abs(x) < 17 && z > -14 && z < 22) return false;                                // 晴川阁与台阶
    if (x > -50 && x < -22 && z > -32 && z < -4) return false;                              // 禹稷行宫
    if (x > 18 && x < 30 && z > -12 && z < 2) return false;                                 // 禹碑亭
    if (Math.abs(x - BRIDGE.x) < 16 && z > BRIDGE.z0 - 10) return false;                    // 大桥
    if (Math.abs(x - YH.x) < 26 && Math.abs(z - YH.z) < 26) return false;                   // 黄鹤楼
    if (Math.abs(x) < 80 && z > 0 && z < RIVER.z0) return false;                            // 楼前临江一面留空
    return W.groundH(x, z) > WATER_Y + 1.4;
  };
  const r = W.rand;
  for (let i = 0; i < 9000; i++) { const x = (r() - 0.5) * 1600, z = -1100 + r() * 1150; if (!free(x, z)) continue; const d = fbm(x * 0.012 + 3, z * 0.012 + 8, 3); if (d < 0.36 && Math.hypot(x, z) > 70) continue; if (Math.hypot(x, z + 16) < 66 && r() < 0.8) continue; W.plant(x, z, r() < 0.22 ? 'pine' : 'leaf', 10 + r() * 6); }
  for (let i = 0; i < 4000; i++) { const x = (r() - 0.5) * 1800, z = RIVER.z1 + 30 + r() * 900; if (!free(x, z)) continue; if (fbm(x * 0.012, z * 0.012, 3) < 0.4) continue; W.plant(x, z, r() < 0.2 ? 'pine' : 'leaf', 11 + r() * 6); }
  for (let i = 0; i < 260; i++) { const x = (r() - 0.5) * 1500, z = RIVER.z0 - 22 + r() * 10; if (free(x, z) && Math.abs(x) > 70) W.plant(x, z, 'willow', 9 + r() * 4); }            // 江岸垂柳
  for (const p of [[-56, 10], [40, 14], [-60, -40], [44, -30], [-14, -44], [10, -46]]) W.plant(p[0], p[1], 'pine', 11);
  for (const p of [[-48, -2], [36, 6]]) W.plant(p[0], p[1], 'bloom', 7);
  for (let i = 0; i < 9000; i++) { const x = (r() - 0.5) * 340, z = -200 + r() * 260; if (free(x, z) && Math.hypot(x, z + 16) > 64) W.grass(x, z, 0.5 + r() * 0.6); }
  for (let i = 0; i < 5000; i++) { const a = r() * 6.283, rr = Math.sqrt(r()); W.grass(YWZ.x + Math.cos(a) * rr * 170, YWZ.z + Math.sin(a) * rr * 40, 1.1 + r() * 1.2, new T.Color(0x6a8a3a).lerp(new T.Color(0xa8b060), r()).getHex()); }   // 鹦鹉洲上芳草萋萋
})();

/* ============================== 白鹭与江船 ============================== */
W.birds({ n: 12, center: [0, WATER_Y, 260], R: [40, 200], h: [8, 40], speed: [0.06, 0.12], scale: 1.0, body: 0xf8f8f4, wingOut: 0xf0f0ec, tip: 0xe8e8e4, beak: 0x2a2620, legs: 0x1c1a18, neck: true, legsTrail: true, legs: 0x1c1a18, flap: 4.2, glide: 0.4 });
W.boats([[-500, 360, 2.0], [200, 520, -1.6], [600, 760, 1.2], [-200, 940, -0.9], [900, 300, 0.7]], WATER_Y, { range: 1500 });

H.world = W.finish({ WATER_Y, RIVER, HAN, YH, BRIDGE, YWZ, GROUND });
})();
