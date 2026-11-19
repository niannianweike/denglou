/* 烟雨楼 · 南湖世界：湖心岛（垂柳、驳岸、码头）、岛边停着的红船、宽阔的南湖、远处嘉兴城的白墙黛瓦、湖上的小船与菱叶、黄莺
 * 坐标：烟雨楼在湖心岛中央，正面朝 +z（南），湖心岛四面环水 */
(function () {
'use strict';
const H = window.HHL, T = THREE, W = H.wc;
const { lerp, smooth, fbm } = H;
const WATER_Y = 0, GROUND = H.tower.GROUND, ISL = { rx: 62, rz: 56 }, RB = { x: 34, z: 66 };
W.sky({ day: { horizon: 0xd2dade, fog: 0xccd4d8, fogD: 0.0009, cover: 0.44 }, dusk: { dir: [-0.88, 0.12, 0.46] }, night: { dir: [0.15, 0.3, 0.94] } }, 90);
W.mistD = 0.006;

function groundH(x, z) {
  const q = Math.pow(x / ISL.rx, 2) + Math.pow((z - 4) / ISL.rz, 2);
  let h = lerp(GROUND - 0.1 + 0.3 * fbm(x * 0.05, z * 0.05, 2), -3, smooth(0.94, 1.05, q));          // 湖心岛：边上是陡直的石驳岸
  const shore = Math.hypot(x / 900, (z - 100) / 700);                                                   // 南湖的岸在几百米外
  h = Math.max(h, lerp(-3, 1.5 + 2 * fbm(x * 0.01, z * 0.01, 3), smooth(0.95, 1.05, shore)));
  return h;
}
W.terrain(groundH, { cx: 0, cz: 100, waterY: WATER_Y, S: 1600, PAL: { floor: 0x3a5a2a, meadow: 0x4e6e30, dry: 0x6e7242, sand: 0x8a8066, wet: 0x4e4a3a, rock: 0x6a6a5e, far: 0x4a5e48, farHi: 0x5a6e72 } });
W.water({ y: WATER_Y, color: 0x4a6e66, size: 1.6, distortion: 1.4, speed: 0.2 });

const pave = W.pavingTex(0xb4ac9c, 11);
W.groundPlane(pave, -9.5, 9.5, -18, 26, 0.05, 4);
(function () {                                                         // 岛边的石驳岸、石栏、码头
  const M = H.tower.M, g = new T.Group(); H.scene.add(g); const B = new H.Batch(new T.BoxGeometry(1, 1, 1), M.stoneI);
  for (let a = 0; a < Math.PI * 2; a += 0.04) { const x = Math.cos(a) * ISL.rx * 0.985, z = 4 + Math.sin(a) * ISL.rz * 0.985, ry = -a + Math.PI / 2; B.add(x, (GROUND - 3) / 2, z, 3.0, GROUND + 3, 1.2, ry, 0xa8a294); B.add(x, GROUND + 0.5, z, 0.25, 0.9, 0.25, 0, 0xc0baac); }
  for (let s = 0; s < 6; s++) B.add(RB.x - 14, GROUND - 0.25 - s * 0.32, 4 + ISL.rz + 1 + s * 0.6, 6, 0.4, 0.6, 0, 0xb8b2a4);   // 码头石阶
  B.build(g); g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
})();

/* ---- 红船：1921 年中共一大在南湖的一条游船上闭幕；岸边停着的是照原样仿制的纪念船 ---- */
(function () {
  const g = new T.Group(); g.position.set(RB.x, WATER_Y, RB.z); g.rotation.y = -0.25; H.scene.add(g);
  const red = new T.MeshStandardMaterial({ color: 0xa8281a, roughness: 0.55 }), dark = new T.MeshStandardMaterial({ color: 0x3a2a1c, roughness: 0.8 }), wood = new T.MeshStandardMaterial({ color: 0x8a5a32, roughness: 0.7 }), roofM = new T.MeshStandardMaterial({ color: 0x2a2a2c, roughness: 0.7, side: T.DoubleSide });
  const hull = H.gridGeo(20, 6, (u, v) => { const t = u * 2 - 1, hw = 2.2 * (1 - 0.8 * Math.pow(Math.abs(t), 3)), a = Math.PI * v; return [Math.cos(a) * hw, 0.5 + 0.6 * t * t - Math.sin(a) * 1.0, t * 8, u, v]; });
  const hm = new T.Mesh(hull, dark); hm.material.side = T.DoubleSide; g.add(hm);
  const deck = new T.Mesh(new T.BoxGeometry(4.0, 0.15, 14), wood); deck.position.y = 0.55; g.add(deck);
  const cabin = new T.Mesh(new T.BoxGeometry(3.4, 1.9, 9), red); cabin.position.set(0, 1.55, -0.5); g.add(cabin);
  for (let i = 0; i < 6; i++) for (const s of [-1, 1]) { const w = new T.Mesh(new T.PlaneGeometry(1.0, 0.9), new T.MeshStandardMaterial({ color: 0xf0e2b8, emissive: 0xffc070, emissiveIntensity: 0 })); w.position.set(s * 1.71, 1.6, -4.2 + i * 1.45); w.rotation.y = s * Math.PI / 2; g.add(w); w.userData.win = true; }
  const roof = new T.Mesh(H.gridGeo(4, 12, (u, v) => { const x = (u * 2 - 1) * 2.0; return [x, 2.5 + 0.5 * (1 - x * x / 4), (v * 2 - 1) * 5.0, u, v]; }), roofM); roof.position.z = -0.5; g.add(roof);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  RB.g = g;
})();

/* ---- 对岸的嘉兴城：白墙黛瓦 ---- */
(function () {
  const wallM = new T.MeshStandardMaterial({ color: 0xe6e2d8, roughness: 0.92 }), roofM = new T.MeshStandardMaterial({ color: 0x4a4e54, roughness: 0.75, side: T.DoubleSide });
  const prism = new T.BufferGeometry(); prism.setAttribute('position', new T.Float32BufferAttribute([-0.5, 0, -0.5, 0.5, 0, -0.5, 0, 1, -0.5, -0.5, 0, 0.5, 0.5, 0, 0.5, 0, 1, 0.5], 3)); prism.setIndex([0, 2, 1, 3, 4, 5, 0, 3, 5, 0, 5, 2, 1, 2, 5, 1, 5, 4]); prism.computeVertexNormals();
  const walls = new H.Batch(new T.BoxGeometry(1, 1, 1), wallM), roofs = new H.Batch(prism, roofM), r = H.rng(91), g = new T.Group(); H.scene.add(g);
  for (let i = 0; i < 400; i++) { const a = r() * Math.PI * 2, d = 1.08 + r() * 0.4, x = Math.cos(a) * 900 * d, z = 100 + Math.sin(a) * 700 * d, y = groundH(x, z); if (y < 1) continue; const w = 8 + r() * 6, dd = 6 + r() * 3, hh = 4 + r() * 3, ry = r() < 0.5 ? 0 : Math.PI / 2; walls.add(x, y + hh / 2, z, w, hh, dd, ry); roofs.add(x, y + hh, z, w + 0.8, 2.4, dd + 1, ry); }
  walls.build(g); roofs.build(g);
})();

/* ---- 树木：岛上的垂柳和古树、对岸 ---- */
(function () {
  const r = W.rand, QH = H.tower.QH, MZ = H.tower.MZ;
  for (let a = 0; a < Math.PI * 2; a += 0.11) { const x = Math.cos(a) * ISL.rx * 0.9, z = 4 + Math.sin(a) * ISL.rz * 0.9; if (z > 20 && Math.abs(x) < 34) continue; if (Math.hypot(x - RB.x + 14, z - 60) < 8) continue; W.plant(x, z, a % 0.33 < 0.11 ? 'leaf' : 'willow', 6.5 + r() * 2); }
  for (let i = 0; i < 140; i++) { const x = (r() - 0.5) * 110, z = -50 + r() * 100; const q = Math.pow(x / ISL.rx, 2) + Math.pow((z - 4) / ISL.rz, 2); if (q > 0.7) continue; if (Math.abs(x) < 15 && z > MZ - 12 && z < QH.z + 9) continue; if (z > 20 && Math.abs(x) < 34) continue; W.plant(x, z, r() < 0.3 ? 'pine' : 'leaf', 7 + r() * 3); }
  for (let i = 0; i < 4000; i++) { const a = r() * Math.PI * 2, d = 1.06 + r() * 0.6, x = Math.cos(a) * 900 * d, z = 100 + Math.sin(a) * 700 * d; if (groundH(x, z) > 1) W.plant(x, z, r() < 0.4 ? 'willow' : 'leaf', 10 + r() * 5); }
  for (let i = 0; i < 4000; i++) { const x = (r() - 0.5) * 120, z = -50 + r() * 110; const q = Math.pow(x / ISL.rx, 2) + Math.pow((z - 4) / ISL.rz, 2); if (q < 0.9 && !(Math.abs(x) < 11 && z > -20 && z < 27)) W.grass(x, z, 0.4 + r() * 0.5); }
  for (let i = 0; i < 3500; i++) { const a = r() * Math.PI * 2, d = 1.15 + r() * 1.8, x = Math.cos(a) * ISL.rx * d, z = 4 + Math.sin(a) * ISL.rz * d; if (Math.hypot(x - RB.x, z - RB.z) < 16) continue; W.grass(x, z, 0.35, 0x4a7a36); }   // 南湖的菱叶
})();

W.birds({ n: 14, center: [0, GROUND, 0], R: [18, 70], h: [8, 26], speed: [0.12, 0.22], scale: 0.55, body: 0xf2c43a, wingIn: 0xe8b42a, wingOut: 0x2a2620, tip: 0x1a1816, head: 0x2a2620, beak: 0xe07a5a, flap: 9 });   // 黄莺
W.boats([[-300, 200, 0.8, 0.45], [200, 300, -0.7, 0.45], [-120, -200, 0.6, 0.45], [350, -120, -0.6, 0.45]], WATER_Y, { range: 600, noSail: true });
W.onUpdate(() => { const gl = H.world.env.cur.glow; RB.g.traverse(o => { if (o.userData.win) o.material.emissiveIntensity = gl * 1.6; }); });

H.world = W.finish({ WATER_Y, ISL, RB, GROUND });
})();
