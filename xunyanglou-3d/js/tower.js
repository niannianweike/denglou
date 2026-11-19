/* 浔阳楼 · 楼体：临江石台、外观三层（内有四层）的宋式楼阁、九脊歇山顶，门前一对朱红华表和《水浒传》里写到的酒旗
 * 今天的浔阳楼是 1987 年照宋代风格重建的，高约 21 米。单位约等于米，正面朝 +z 的长江 */
(function () {
'use strict';
const H = window.HHL, T = THREE, K = H.kit;
const { rect } = K;
const GROUND = 0;
const M = K.materials({ tile: 'grey', ridge: 0x464a50, wall: 'ming', caihua: 'qizhu', band: 'tang', rail: 'tang', dougong: 'tang', lacquer: 0x8a2a16, gable: '#7a2a1a' });

const PH = 1.4, TY = GROUND + PH;
const tower = new T.Group(); tower.position.y = TY; H.scene.add(tower);
const AX = [9.0, 7.8, 6.6], AZ = [7.6, 6.6, 5.6], Y = [0, 7.0, 12.6], VW = [1.3, 1.2, 1.1], YTOP = 17.4;
const bd = new K.Builder(tower, M, { dg: 1 });
const s0 = bd.storey(rect(AX[0], AZ[0]), { y: Y[0], nextY: Y[1], eaveGap: 1.1, rise: 1.6, vw: VW[0], r: 0.32, colStep: 3.0, din: -1.2, dout: 2.6, lift: 1.4, sweep: 0.9, w: 2.4 });
const s1 = bd.storey(rect(AX[1], AZ[1]), { y: Y[1], nextY: Y[2], eaveGap: 0.9, rise: 1.5, vw: VW[1], r: 0.28, colStep: 2.8, pingzuo: 1.0, din: -1.2, dout: 2.4, lift: 1.4, sweep: 0.9, w: 2.2 });
const s2 = bd.storey(rect(AX[2], AZ[2]), { y: Y[2], nextY: YTOP, eaveGap: 0.6, rise: 1.5, vw: VW[2], r: 0.26, colStep: 2.6, pingzuo: 0.9, din: -1.2, dout: 2.3, lift: 1.4, sweep: 0.9, w: 2.1 });
const ROOF = bd.xieshan(AX[2] - 1.2, AZ[2] - 1.2, AX[2] - 1.2 - 2.4, { y0: s2.eaveTop, HR: 3.2, ov: 0.5, rr: 0.16, endScale: 0.5 });
const colTopY = [s0.colTop, s1.colTop, s2.colTop], eaveEdgeY = [s0.edge, s1.edge, s2.edge];
const PLAQUE = { y: colTopY[1] - 0.6, z: AZ[1] + 0.5 };
bd.plaque('浔阳楼', 3.7, 1.4, PLAQUE.y, PLAQUE.z);
bd.build();
K.platform(M, { hx: 12.5, hz: 11, y0: GROUND - 0.5, y1: TY, mat: 'stone', stairs: [{ side: 'front', w: 6, yb: GROUND }, { side: 'back', w: 5, yb: GROUND }] });
const BASE = { hx: 12.5, hz: 11, top: TY };

/* ---- 门前华表：“世间无比酒，天下有名楼”（《水浒传》里写的浔阳楼门前的两块粉牌） ---- */
const HB = { z: 11 + 4.4, x: 4.6, h: 7.2 };
(function () {
  const g = new T.Group(); H.scene.add(g);
  const red = new T.MeshStandardMaterial({ color: 0x9a2416, roughness: 0.45, envMapIntensity: 0.6 });
  function board(t) { return H.canvasTex(160, 820, function (c, w, h) { c.fillStyle = '#f2ece0'; c.fillRect(0, 0, w, h); c.strokeStyle = '#2a2420'; c.lineWidth = 8; c.strokeRect(8, 8, w - 16, h - 16); c.fillStyle = '#1e1a16'; c.font = 'bold 120px ' + K.KAI; c.textAlign = 'center'; c.textBaseline = 'middle'; for (let i = 0; i < t.length; i++) c.fillText(t[i], w / 2, 100 + i * 150); }); }
  for (const [sx, t] of [[-1, '世间无比酒'], [1, '天下有名楼']]) {
    const x = sx * HB.x, col = new T.Mesh(new T.CylinderGeometry(0.3, 0.34, HB.h, 16), red); col.position.set(x, GROUND + HB.h / 2, HB.z); g.add(col);
    const cap = new T.Mesh(new T.CylinderGeometry(0.55, 0.4, 0.5, 16), M.gold); cap.position.set(x, GROUND + HB.h + 0.2, HB.z); g.add(cap);
    const wing = new T.Mesh(new T.BoxGeometry(1.8, 0.35, 0.18), red); wing.position.set(x, GROUND + HB.h - 1.0, HB.z); g.add(wing);
    const ped = new T.Mesh(new T.BoxGeometry(1.1, 0.9, 1.1), M.stone); ped.position.set(x, GROUND + 0.45, HB.z); g.add(ped);
    const bm = new T.MeshStandardMaterial({ map: board(t), roughness: 0.8 });
    const b = new T.Mesh(new T.BoxGeometry(0.9, 4.6, 0.12), [M.whiteWall, M.whiteWall, M.whiteWall, M.whiteWall, bm, M.whiteWall]); b.position.set(x, GROUND + 3.6, HB.z + 0.42); g.add(b);
  }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  // 酒旗：青布，写着“浔阳江正库”
  const flagT = H.canvasTex(256, 768, function (c, w, h) { c.fillStyle = '#2e4a6a'; c.fillRect(0, 0, w, h); c.fillStyle = '#c94a2a'; c.fillRect(0, 0, w, 40); for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(i * w / 6, h); c.lineTo(i * w / 6 + w / 12, h - 50); c.lineTo((i + 1) * w / 6, h); c.fill(); } c.fillStyle = '#f2ece0'; c.font = 'bold 88px ' + K.KAI; c.textAlign = 'center'; c.textBaseline = 'middle'; const s = '浔阳江正库'; for (let i = 0; i < s.length; i++) c.fillText(s[i], w / 2, 120 + i * 112); });
  const pole = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 6, 6), new T.MeshStandardMaterial({ color: 0x4a3020, roughness: 0.8 })); pole.position.set(AX[0] + 1.6, TY + 3.5, AZ[0] + 1.2); pole.rotation.z = -0.5; H.scene.add(pole);
  const flag = new T.Mesh(H.gridGeo(4, 12, (u, v) => [u * 1.3, -v * 3.6, Math.sin(v * 3 + u * 2) * 0.12, u, 1 - v]), new T.MeshStandardMaterial({ map: flagT, side: T.DoubleSide, roughness: 0.9 }));
  flag.position.set(AX[0] + 2.9, TY + 5.9, AZ[0] + 1.2); flag.castShadow = true; H.scene.add(flag);
  H.wcFlag = flag;
})();

const setGlow = K.glowSetter(M, bd.plaqueMats, [[15, 14, TY - 1.2], [-15, 14, TY - 1.2], [15, -14, TY - 1.2], [-15, -14, TY - 1.2]], 18, 4.5);
H.tower = { group: tower, M, TX: M.TX, KAI: K.KAI, rect, PH, TY, GROUND, AX, AZ, Y, VW, YTOP, ROOF, PLAQUE, BASE, colTopY, eaveEdgeY, HB, setGlow };
})();
