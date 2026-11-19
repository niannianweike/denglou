/* 大观楼 · 滇池世界：五百里滇池、对岸像仰卧美人的西山（睡美人山）、湖边的大观公园（垂柳、荷花池、长堤）、红嘴鸥、湖上的帆船、高原的蓝天
 * 坐标：大观楼在原点，正面朝 +z 的滇池（向南），西山在西南方（−x，+z） */
(function () {
'use strict';
const H = window.HHL, T = THREE, W = H.wc;
const { lerp, smooth, fbm, ridged } = H;
const WATER_Y = 0, GROUND = H.tower.GROUND, SHORE = 30, XS = { x: -1600, z: 2200 };
W.sky({ day: { zenith: 0x1e5cc0, horizon: 0xbcd4ea, fog: 0xbcd0e0, fogD: 0.00032, cover: 0.56, lightI: 3.6 }, dusk: { dir: [-0.86, 0.12, 0.48] }, night: { dir: [0.1, 0.3, 0.95] } }, 90);   // 昆明在云贵高原，天特别蓝

function groundH(x, z) {
  let h = GROUND - 0.2 + 0.4 * fbm(x * 0.02, z * 0.02, 2) + smooth(-200, -900, z) * (6 + 30 * fbm(x * 0.004, z * 0.004, 4)) + smooth(-1500, -3000, z) * 200 * ridged(x * 0.0015, z * 0.0015, 4);
  h = lerp(h, -5, smooth(SHORE - 4, SHORE + 20, z));
  for (const p of [[-60, 70, 14], [-130, 120, 12]]) { const d = Math.hypot(x - p[0], (z - p[1]) * 0.3); if (d < p[2]) h = Math.max(h, lerp(GROUND - 0.6, -5, smooth(p[2] * 0.4, p[2], d))); }   // 伸进湖里的长堤
  // 西山：远看像一位仰面躺着的女子——头、胸、腹、腿依次排开，长发垂进水里
  const along = (x - XS.x) * 0.6 + (z - XS.z) * 0.8, across = -(x - XS.x) * 0.8 + (z - XS.z) * 0.6;
  if (Math.abs(across) < 900 && Math.abs(along) < 2600) {
    const t = along / 2600, prof = 260 * Math.exp(-Math.pow((t + 0.65) / 0.12, 2)) + 340 * Math.exp(-Math.pow((t + 0.25) / 0.16, 2)) + 230 * Math.exp(-Math.pow((t - 0.15) / 0.18, 2)) + 170 * Math.exp(-Math.pow((t - 0.6) / 0.22, 2)) + 60;
    h = Math.max(h, -5 + prof * Math.exp(-Math.pow(across / 420, 2)) * (0.9 + 0.15 * ridged(x * 0.004, z * 0.004, 4)));
  }
  h = Math.max(h, lerp(-5, 2 + 120 * ridged(x * 0.0018 + 3, z * 0.0018, 4), smooth(3800, 5200, Math.hypot(x + 400, z - 2600))));   // 滇池四周的远山
  return h;
}
W.terrain(groundH, { cx: -400, cz: 1400, waterY: WATER_Y, S: 2600, PAL: { floor: 0x4a6a2e, meadow: 0x5a7a34, dry: 0x7a7444, sand: 0x9a8a66, wet: 0x5e5240, rock: 0x7a6e5e, far: 0x4a6a56, farHi: 0x6a7a86 } });
W.water({ y: WATER_Y, color: 0x2e6a7a, size: 2.4, distortion: 2.2, speed: 0.3 });
W.groundPlane(W.pavingTex(0xb4ac9c, 13), -11, 11, -10, 22, 0.05, 4);

/* ---- 荷花池：楼两侧的一片片荷叶和粉色荷花 ---- */
(function () {
  const r = W.rand;
  for (let i = 0; i < 2600; i++) { const x = (r() < 0.5 ? -1 : 1) * (14 + r() * 40), z = SHORE + 2 + r() * 30; if (groundH(x, z) < -0.5) W.grass(x, z, 0.4, 0x4a8a3a); }
  const fl = new H.Batch(new T.SphereGeometry(0.35, 8, 6), new T.MeshStandardMaterial({ color: 0xf0a0b8, roughness: 0.6, emissive: 0x401020, emissiveIntensity: 0.2 }));
  for (let i = 0; i < 160; i++) { const x = (r() < 0.5 ? -1 : 1) * (14 + r() * 40), z = SHORE + 2 + r() * 30; if (groundH(x, z) < -0.5) fl.add(x, 0.7, z, 1, 1.3, 1); }
  fl.build(H.scene);
})();

/* ---- 树木 ---- */
(function () {
  const r = W.rand;
  const free = (x, z) => { if (Math.abs(x) < 13 && z > -12 && z < 24) return false; if (Math.abs(x) < 26 && z > 10) return false; return groundH(x, z) > WATER_Y + 0.8; };
  for (let i = 0; i < 9000; i++) { const x = (r() - 0.5) * 2600, z = -1200 + r() * (SHORE + 1200); if (!free(x, z)) continue; if (fbm(x * 0.012 + 3, z * 0.012 + 8, 3) < 0.38 && Math.hypot(x, z) > 80) continue; W.plant(x, z, r() < 0.25 ? 'pine' : r() < 0.4 ? 'willow' : 'leaf', 9 + r() * 5); }
  for (let i = 0; i < 200; i++) { const x = -400 + r() * 800; if (Math.abs(x) > 30) W.plant(x, SHORE - 3 - r() * 3, 'willow', 8 + r() * 3); }
  for (const p of [[-60, 70], [-130, 120]]) for (let i = 0; i < 18; i++) W.plant(p[0] + (r() - 0.5) * 6, p[1] - 30 + i * 4, i % 2 ? 'willow' : 'bloom', i % 2 ? 7 : 5);
  for (let i = 0; i < 5000; i++) { const x = XS.x + (r() - 0.5) * 2600, z = XS.z + (r() - 0.5) * 2600; if (groundH(x, z) > 20 && groundH(x, z) < 300) W.plant(x, z, r() < 0.5 ? 'pine' : 'leaf', 16 + r() * 8); }
  for (const p of [[-11, -8], [11, -8]]) W.plant(p[0], p[1], 'bloom', 6);
  for (let i = 0; i < 8000; i++) { const x = (r() - 0.5) * 260, z = -140 + r() * 170; if (free(x, z)) W.grass(x, z, 0.4 + r() * 0.5); }
})();

/* 红嘴鸥：每年冬天从西伯利亚飞来昆明过冬，白身子、红嘴红脚 */
W.birds({ n: 26, center: [0, WATER_Y, 60], R: [16, 90], h: [3, 20], speed: [0.14, 0.26], scale: 0.7, body: 0xf8f8f6, wingOut: 0xc8ccd2, tip: 0x1a1a1e, head: 0xf8f8f6, beak: 0xd02a1a, legs: 0xd02a1a, flap: 7 });
W.boats([[-400, 400, 1.6], [300, 700, -1.2], [900, 1200, 1.0], [-800, 1500, -0.8], [0, 260, 0.6, 0.5]], WATER_Y, { range: 2000 });

H.world = W.finish({ WATER_Y, SHORE, XS, GROUND });
})();
