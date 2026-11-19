/* 太白楼 · 楼体：采石矶翠螺山脚下，前后两进的院落——前面是三间门厅，后面是三层的太白楼主楼（歇山顶、黄瓦朱墙），院墙环绕
 * 今天的太白楼是清朝光绪年间重建的，主楼高约 16 米。单位约等于米，正面朝 +z 的长江 */
(function () {
'use strict';
const H = window.HHL, T = THREE, K = H.kit;
const { rect } = K;
const GROUND = 6;                                                  // 矶头的平地，比江面高 11 米
const M = K.materials({ tile: 'yellow', ridge: 0xb8811a, wall: 'ming', caihua: 'xuan', band: 'ming', rail: 'ming', dougong: 'ming', lacquer: 0x8a2416 });

/* ---- 主楼（后进） ---- */
const PH = 1.6, TY = GROUND + PH, MZ = -6;                          // 主楼往后（离江远一点），前面是门厅和院子
const tower = new T.Group(); tower.position.set(0, TY, MZ); H.scene.add(tower);
const AX = [8.6, 7.2, 6.0], AZ = [6.4, 5.4, 4.6], Y = [0, 5.6, 10.4], VW = [1.2, 1.1, 1.0], YTOP = 14.6;
const bd = new K.Builder(tower, M, { dg: 0.9 });
const s0 = bd.storey(rect(AX[0], AZ[0]), { y: Y[0], nextY: Y[1], eaveGap: 1.0, rise: 1.4, vw: VW[0], r: 0.3, colStep: 2.8, din: -1.1, dout: 2.3, lift: 1.7, sweep: 1.0, w: 2.0, beasts: true, dgS: 0.9 });
const s1 = bd.storey(rect(AX[1], AZ[1]), { y: Y[1], nextY: Y[2], eaveGap: 0.9, rise: 1.3, vw: VW[1], r: 0.26, colStep: 2.6, pingzuo: 0.9, din: -1.1, dout: 2.2, lift: 1.7, sweep: 1.0, w: 2.0, beasts: true, dgS: 0.9 });
const s2 = bd.storey(rect(AX[2], AZ[2]), { y: Y[2], nextY: YTOP, eaveGap: 0.5, rise: 1.3, vw: VW[2], r: 0.24, colStep: 2.4, pingzuo: 0.8, din: -1.0, dout: 2.1, lift: 1.7, sweep: 1.0, w: 1.9, beasts: true, dgS: 0.9 });
const ROOF = bd.xieshan(AX[2] - 1.0, AZ[2] - 1.0, AX[2] - 1.0 - 2.2, { y0: s2.eaveTop, HR: 2.9, ov: 0.45, rr: 0.15, endScale: 0.45 });
const colTopY = [s0.colTop, s1.colTop, s2.colTop];
const PLAQUE = { y: colTopY[1] - 0.5, z: AZ[1] + 0.45 };
bd.plaque('太白楼', 3.4, 1.3, PLAQUE.y, PLAQUE.z);
bd.build();
K.platform(M, { hx: 11, hz: 8.4, y0: GROUND - 0.3, y1: TY, cz: MZ, stairs: [{ side: 'front', w: 5, yb: GROUND }] });

/* ---- 门厅（前进）与院墙 ---- */
const MT = { z: 22, ax: 7.6, az: 3.6 };
const mg = new T.Group(); mg.position.set(0, GROUND + 0.9, MT.z); H.scene.add(mg);
const bm = new K.Builder(mg, M, { dg: 0.8 });
const ms = bm.storey(rect(MT.ax, MT.az), { y: 0, nextY: 5.4, eaveGap: 0.5, rise: 1.3, vw: 0.9, r: 0.26, colStep: 3.0, din: -1.0, dout: 2.0, lift: 1.4, w: 1.8, beasts: true, dgS: 0.8 });
bm.xieshan(MT.ax - 0.9, MT.az - 0.9, MT.ax - 0.9 - 2.0, { y0: ms.eaveTop, HR: 2.0, ov: 0.4, rr: 0.13, endScale: 0.38 });
bm.plaque('唐李公青莲祠', 4.4, 0.95, ms.colTop - 0.45, MT.az + 0.4);
bm.build();
K.platform(M, { hx: 8.8, hz: 4.6, y0: GROUND - 0.3, y1: GROUND + 0.9, cz: MT.z, rail: false, stairs: [{ side: 'front', w: 4, yb: GROUND }] });
(function () {                                                    // 黄墙黛瓦的院墙
  const wallM = new T.MeshStandardMaterial({ color: 0xd8b05a, roughness: 0.85, envMapIntensity: 0.4 }), capM = new T.MeshStandardMaterial({ color: 0x5a5a5a, roughness: 0.7 });
  const g = new T.Group(); H.scene.add(g); const B = new H.Batch(new T.BoxGeometry(1, 1, 1), wallM), C = new H.Batch(new T.BoxGeometry(1, 1, 1), capM), x0 = 15, z0 = -18, z1 = MT.z, h = 4.2;
  const seg = (ax, az, bx, bz) => { const L = Math.hypot(bx - ax, bz - az), ry = -Math.atan2(bz - az, bx - ax); B.add((ax + bx) / 2, GROUND + h / 2, (az + bz) / 2, L, h, 0.7, ry); C.add((ax + bx) / 2, GROUND + h + 0.15, (az + bz) / 2, L + 0.4, 0.3, 1.3, ry, 0xffffff); };
  seg(-x0, z0, x0, z0); seg(-x0, z0, -x0, z1); seg(x0, z0, x0, z1); seg(-x0, z1, -MT.ax - 0.5, z1); seg(MT.ax + 0.5, z1, x0, z1);
  B.build(g); C.build(g); g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
})();

/* ---- 李白像：院子里一座白石雕像，举杯望月 ---- */
const STATUE = { x: 0, z: 12, y: GROUND };
(function () {
  const marble = new T.MeshStandardMaterial({ color: 0xece8de, roughness: 0.5, envMapIntensity: 0.6 }), g = new T.Group(); g.position.set(STATUE.x, STATUE.y, STATUE.z); H.scene.add(g);
  const ped = new T.Mesh(new T.BoxGeometry(2.2, 1.6, 2.2), M.stone); ped.position.y = 0.8; g.add(ped);
  const robe = new T.Mesh(new T.LatheGeometry([[0.01, 0], [0.75, 0], [0.62, 0.8], [0.48, 1.7], [0.42, 2.1], [0.2, 2.25], [0.01, 2.3]].map(p => new T.Vector2(p[0], p[1])), 20), marble); robe.position.y = 1.6; g.add(robe);
  const head = new T.Mesh(new T.SphereGeometry(0.28, 16, 12), marble); head.position.y = 4.2; g.add(head);
  const hat = new T.Mesh(new T.CylinderGeometry(0.12, 0.2, 0.3, 10), marble); hat.position.y = 4.55; g.add(hat);
  const arm = H.tubeGeo([[0.38, 3.45, 0], [0.62, 3.9, 0.2], [0.7, 4.45, 0.32]], 0.1, 8); g.add(new T.Mesh(arm, marble));
  const cup = new T.Mesh(new T.CylinderGeometry(0.13, 0.07, 0.16, 10), marble); cup.position.set(0.72, 4.62, 0.34); g.add(cup);
  const sleeve = H.tubeGeo([[-0.4, 3.4, 0], [-0.8, 2.8, 0.15], [-0.95, 2.3, 0.25]], 0.18, 8); g.add(new T.Mesh(sleeve, marble));
  const cuff = new T.Mesh(new T.ConeGeometry(0.42, 0.9, 12, 1, true), marble); cuff.position.set(-1.0, 2.0, 0.28); cuff.rotation.z = -0.3; g.add(cuff);   // 宽大的袖口
  const beard = new T.Mesh(new T.ConeGeometry(0.13, 0.55, 8), marble); beard.position.set(0, 3.82, 0.2); beard.rotation.x = Math.PI + 0.25; g.add(beard);
  for (const s of [-1, 1]) { const eye = new T.Mesh(new T.BoxGeometry(0.09, 0.025, 0.02), new T.MeshStandardMaterial({ color: 0x8a8478 })); eye.position.set(s * 0.1, 4.26, 0.27); g.add(eye); }
  const sash = H.tubeGeo([[0.3, 3.0, -0.3], [0.9, 2.6, -0.6], [1.2, 1.9, -0.5], [1.3, 1.6, -0.2]], 0.07, 6); g.add(new T.Mesh(sash, marble));   // 被风吹起的衣带
  const tag = H.canvasTex(512, 128, function (c, w, h) { c.fillStyle = '#d8d2c4'; c.fillRect(0, 0, w, h); c.fillStyle = '#2a2420'; c.font = 'bold 84px ' + K.KAI; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('诗仙李白', w / 2, h / 2 + 4); });
  const tg = new T.Mesh(new T.PlaneGeometry(1.8, 0.45), new T.MeshStandardMaterial({ map: tag, roughness: 0.7 })); tg.position.set(0, 0.85, 1.111); g.add(tg);
  g.rotation.y = Math.PI / 2 + 0.25; g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  STATUE.top = STATUE.y + 4.7;
})();

const setGlow = K.glowSetter(M, bd.plaqueMats.concat(bm.plaqueMats), [[13, MZ + 12, TY - 1.2], [-13, MZ + 12, TY - 1.2], [13, MZ - 11, TY - 1.2], [-13, MZ - 11, TY - 1.2]], 14, 4);
H.tower = { group: tower, M, TX: M.TX, KAI: K.KAI, rect, PH, TY, GROUND, MZ, AX, AZ, Y, VW, YTOP, ROOF, PLAQUE, colTopY, MT, STATUE, setGlow,
  BASE: { hx: 11, hz: 8.4, cz: MZ, top: TY }, LZ: [MZ + AZ[0] + 0.6, MZ + AZ[1] + 0.55, MZ + AZ[2] + 0.55] };
})();
