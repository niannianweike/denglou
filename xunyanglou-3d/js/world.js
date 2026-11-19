/* 浔阳楼 · 江山世界：九江长江南岸的江堤与码头、白墙青瓦的老街、锁江楼塔、楼后的庐山、秋天的红枫与荻花、白鹭、停在岸边的篷船
 * 坐标：浔阳楼在原点，正面朝 +z 的长江（向北），+x 朝东；长江在这一段古时候叫浔阳江 */
(function () {
'use strict';
const H = window.HHL, T = THREE, W = H.wc, K = H.kit;
const { lerp, smooth, fbm, ridged, V3 } = H;
const WATER_Y = -5, RIVER = { z0: 58, z1: 1180 }, PAGODA = { x: 560, z: 26 }, BOAT = { x: -16, z: 84 };
W.sky({ day: { horizon: 0xd2d6d2, fog: 0xc8cfcf }, dusk: { dir: [-0.92, 0.1, 0.36] }, night: { dir: [0.02, 0.2, 0.98] } }, 110);

/* ============================== 地形 ============================== */
function groundH(x, z) {
  let h = 0.12 * (fbm(x * 0.05, z * 0.05, 2) - 0.5);
  h += smooth(-260, -1100, z) * (4 + 28 * fbm(x * 0.006 + 3, z * 0.006, 4));                               // 城南渐渐起伏
  const m = smooth(-1300, -2700, z);                                                                       // 庐山：楼后（南边）连绵的大山
  if (m > 0) { const big = ridged(x * 0.0009 + 5, z * 0.0009 + 2, 4), mid = ridged(x * 0.0035 + 40, z * 0.0035 + 9, 4); h += m * (60 + 300 * big * big + 90 * mid * (0.3 + big)); }
  h = lerp(h, WATER_Y + 0.6, smooth(RIVER.z0 - 6, RIVER.z0, z) * smooth(RIVER.z1 + 40, RIVER.z1, z));    // 江堤外是水
  h = lerp(h, -16, smooth(RIVER.z0 + 10, RIVER.z0 + 80, z) * smooth(RIVER.z1, RIVER.z1 - 70, z));
  h += smooth(RIVER.z1 + 40, RIVER.z1 + 600, z) * (3 + 10 * fbm(x * 0.005, z * 0.005, 3)) + smooth(RIVER.z1 + 1500, 4000, z) * 180 * ridged(x * 0.0012, z * 0.0012, 4);   // 江北岸
  return h;
}
W.terrain(groundH, { cx: 0, cz: 300, waterY: WATER_Y, PAL: { floor: 0x5a5a32, meadow: 0x6a6a34, dry: 0x8a7442, sand: 0x9a8a68, wet: 0x5a4e3a, rock: 0x6e6858, far: 0x3e5a3c, farHi: 0x56684e } });
W.water({ y: WATER_Y, color: 0x41594e, size: 2.6, distortion: 2.6, speed: 0.4, silt: { color: 0x7a7458, opacity: 0.18 } });

/* 楼前石板广场、江堤、码头石阶 */
W.groundPlane(W.pavingTex(0xb4ac9c, 5), -40, 40, -26, 50, 0.05, 4);
(function () {
  const M = H.tower.M, g = new T.Group(); H.scene.add(g); const wall = new H.Batch(new T.BoxGeometry(1, 1, 1), M.stoneI);
  const zW = RIVER.z0 - 3;
  for (const [a, b] of [[-900, -8], [8, 900]]) { const L = b - a; wall.add((a + b) / 2, (WATER_Y - 1 + 0.4) / 2, zW, L, 0.4 - WATER_Y + 1, 2.4, 0, 0xb4ae9e); const n = Math.round(L / 2.2); for (let i = 0; i <= n; i++) wall.add(a + i * L / n, 0.85, zW + 0.9, 0.32, 0.95, 0.32, 0, 0xc0baac); wall.add((a + b) / 2, 1.18, zW + 0.9, L, 0.16, 0.22, 0, 0xc0baac); }
  const N = 18, run = 0.7, rise = (0.4 - WATER_Y) / N;                                              // 码头石阶一直通到水边
  for (let s = 0; s < N; s++) wall.add(0, 0.4 - (s + 0.5) * rise, zW - 1.2 + s * run, 15, rise * (s === N - 1 ? 2 : 1) + 0.6, run, 0, s % 2 ? 0xc8c2b4 : 0xb4ae9e);
  wall.build(g); g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
})();

/* ============================== 老街：白墙青瓦的江边民居 ============================== */
(function () {
  const wallM = new T.MeshStandardMaterial({ color: 0xe8e4da, roughness: 0.92, envMapIntensity: 0.4 }), roofM = new T.MeshStandardMaterial({ color: 0x4a4e54, roughness: 0.75, envMapIntensity: 0.5, side: T.DoubleSide });
  const prism = new T.BufferGeometry(); prism.setAttribute('position', new T.Float32BufferAttribute([-0.5, 0, -0.5, 0.5, 0, -0.5, 0, 1, -0.5, -0.5, 0, 0.5, 0.5, 0, 0.5, 0, 1, 0.5], 3)); prism.setIndex([0, 2, 1, 3, 4, 5, 0, 3, 5, 0, 5, 2, 1, 2, 5, 1, 5, 4]); prism.computeVertexNormals();
  const walls = new H.Batch(new T.BoxGeometry(1, 1, 1), wallM), roofs = new H.Batch(prism, roofM), r = H.rng(71), g = new T.Group(); H.scene.add(g);
  for (let i = 0; i < 70; i++) {
    const side = r() < 0.5 ? -1 : 1, x = side * (52 + r() * 360), z = -230 + r() * 270; if (Math.abs(x - PAGODA.x) < 30 && Math.abs(z - PAGODA.z) < 30) continue;
    const w = 8 + r() * 7, d = 6 + r() * 3, hh = 4 + r() * 3, ry = (r() < 0.5 ? 0 : Math.PI / 2) + (r() - 0.5) * 0.06, y = groundH(x, z);
    walls.add(x, y + hh / 2, z, w, hh, d, ry); roofs.add(x, y + hh, z, w + 0.8, 2.2 + r() * 0.8, d + 1.0, ry);
    walls.add(x + (side > 0 ? -1 : 1) * w * 0.5, y + hh + 0.6, z, 0.4, 1.6, d + 0.4, ry, 0xe0dcd2);           // 马头墙
  }
  walls.build(g); roofs.build(g); g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
})();

/* ============================== 锁江楼塔：江边的明代砖塔 ============================== */
(function () {
  const M = H.tower.M, y0 = groundH(PAGODA.x, PAGODA.z), g = new T.Group(); g.position.set(PAGODA.x, y0, PAGODA.z); H.scene.add(g);
  const b = new K.Builder(g, M, { dg: 0.5 }); let y = 1.4, r = 4.0;
  const ped = new T.Mesh(new T.CylinderGeometry(5.2, 5.6, 1.4, 8), M.stone); ped.position.y = 0.7; g.add(ped);
  for (let i = 0; i < 7; i++) {
    const hh = 4.2 - i * 0.18, body = new T.Mesh(new T.CylinderGeometry(r, r * 1.02, hh, 8), M.brick); body.position.y = y + hh / 2; body.rotation.y = Math.PI / 8; g.add(body);
    const win = new T.Mesh(new T.BoxGeometry(r * 0.5, hh * 0.45, r * 2.08), new T.MeshStandardMaterial({ color: 0x1a1410, roughness: 1 })); win.position.y = y + hh * 0.45; win.rotation.y = (i % 2) * Math.PI / 4; g.add(win);
    b.eave(K.poly(8, r + 0.1, Math.PI / 8 + Math.PI / 8), { din: -0.4, dout: 1.3, yTop: y + hh + 0.55, rise: 0.6, lift: 0.55, sweep: 0.35, w: 1.0, th: 0.14, rr: 0.07, tileScale: 0.6 });
    y += hh + 0.5; r -= 0.38;
  }
  PAGODA.top = y0 + b.zanjian(K.poly(8, r + 0.3, Math.PI / 4), y, 3.2, { rr: 0.07, finial: 0.7 });
  b.build(); g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
})();

/* ============================== 林木（秋天的红枫、黄叶）与荻花 ============================== */
(function () {
  const r = W.rand, AUT = [0xb8361a, 0xd0582a, 0xe0862e, 0xd8b030, 0xa8a03a, 0x5a7a34, 0x4a6a2e];
  const free = (x, z) => { if (Math.abs(x) < 44 && z > -30 && z < 54) return false; if (Math.abs(x - PAGODA.x) < 14 && Math.abs(z - PAGODA.z) < 14) return false; return W.groundH(x, z) > WATER_Y + 1.2; };
  for (let i = 0; i < 9000; i++) { const x = (r() - 0.5) * 2200, z = -1300 + r() * 1320; if (!free(x, z)) continue; if (fbm(x * 0.012 + 3, z * 0.012 + 8, 3) < 0.4) continue; if (Math.abs(x) < 420 && z > -240 && r() < 0.75) continue; W.plant(x, z, r() < 0.15 ? 'pine' : 'leaf', 9 + r() * 6, AUT[r() * AUT.length | 0]); }
  for (let i = 0; i < 160; i++) { const x = (r() - 0.5) * 1700, z = RIVER.z0 - 9 - r() * 4; if (free(x, z) && Math.abs(x) > 70) W.plant(x, z, r() < 0.5 ? 'willow' : 'leaf', 8 + r() * 4, r() < 0.5 ? undefined : AUT[r() * 3 | 0]); }      // 堤上的柳与红枫
  for (const p of [[34, 40], [-38, -18], [38, -18]]) W.plant(p[0], p[1], 'leaf', 9, 0xc0441e);
  for (let i = 0; i < 3000; i++) { const x = (r() - 0.5) * 3000, z = RIVER.z1 + 20 + r() * 900; if (fbm(x * 0.01, z * 0.01, 3) > 0.42) W.plant(x, z, 'leaf', 10 + r() * 5, AUT[3 + (r() * 4 | 0)]); }
  for (let i = 0; i < 9000; i++) { const x = (r() - 0.5) * 300, z = -160 + r() * 200; if (free(x, z)) W.grass(x, z, 0.45 + r() * 0.5, new T.Color(0x8a8a46).lerp(new T.Color(0xb09a52), r()).getHex()); }
  for (let i = 0; i < 9000; i++) { const x = (r() - 0.5) * 2600, z = RIVER.z1 + 4 + r() * 40; W.grass(x, z, 1.4 + r() * 1.2, new T.Color(0xcfc8b4).lerp(new T.Color(0xeee8da), r()).getHex()); }          // 对岸江滩上一片荻花
  for (let i = 0; i < 2500; i++) { const x = (r() - 0.5) * 1800, z = RIVER.z0 - 12 + r() * 3; if (Math.abs(x) > 20) W.grass(x, z, 1.0 + r() * 0.8, new T.Color(0xd8d2c0).lerp(new T.Color(0xf0eadc), r()).getHex()); }
})();

/* ============================== 白鹭、江船、岸边的篷船 ============================== */
W.birds({ n: 12, center: [0, WATER_Y, 320], R: [40, 220], h: [8, 40], speed: [0.06, 0.12], scale: 1.0, body: 0xf8f8f4, wingOut: 0xf0f0ec, tip: 0xe8e8e4, beak: 0x2a2620, legs: 0x1c1a18, neck: true, flap: 4.2, glide: 0.4 });
W.boats([[-500, 380, 2.0], [260, 560, -1.6], [700, 820, 1.2], [-300, 980, -0.9], [900, 300, 0.7]], WATER_Y, { range: 1600 });
W.boats([[BOAT.x, BOAT.z, 0, 0.75]], WATER_Y, { range: 1600, noSail: true });
const lamp = new T.Mesh(new T.SphereGeometry(0.32, 12, 10), new T.MeshStandardMaterial({ color: 0xffb060, emissive: 0xffa040, emissiveIntensity: 0 }));
lamp.position.set(BOAT.x, WATER_Y + 3.0, BOAT.z - 1.5); H.scene.add(lamp);
const lampLight = new T.PointLight(0xffa860, 0, 30, 1.6); lampLight.position.copy(lamp.position); H.scene.add(lampLight);
W.onUpdate((dt, t) => { const gl = H.world.env.cur.glow; lamp.material.emissiveIntensity = gl * 4; lampLight.intensity = gl * 2.2; if (H.wcFlag) H.wcFlag.rotation.y = Math.sin(t * 1.3) * 0.12; });

H.world = W.finish({ WATER_Y, RIVER, PAGODA, BOAT, GROUND: 0 });
})();
