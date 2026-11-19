/* 北固楼 · 楼体：北固山后峰顶上的两层重檐楼（北固楼），南边的甘露寺大殿与宋代铁塔，北边崖头的凌云亭
 * 北固山三面临江，山上的北固楼东晋时就有了；今天的楼是后来重建的。单位约等于米，正面朝 +z 的长江 */
(function () {
'use strict';
const H = window.HHL, T = THREE, K = H.kit;
const { rect } = K;
const GROUND = 46;
const M = K.materials({ tile: 'grey', ridge: 0x4e5258, wall: 'ming', caihua: 'xuan', band: 'ming', rail: 'ming', dougong: 'ming', lacquer: 0x7a1e12 });

/* ---- 北固楼 ---- */
const PH = 1.4, TY = GROUND + PH;
const tower = new T.Group(); tower.position.y = TY; H.scene.add(tower);
const AX = [8.0, 6.6], AZ = [6.6, 5.4], Y = [0, 6.8], VW = [1.3, 1.1], YTOP = 12.6;
const bd = new K.Builder(tower, M, { dg: 0.95 });
const s0 = bd.storey(rect(AX[0], AZ[0]), { y: 0, nextY: Y[1], eaveGap: 1.2, rise: 1.7, vw: VW[0], r: 0.3, colStep: 2.7, din: -1.2, dout: 2.5, lift: 1.9, sweep: 1.1, w: 2.2, beasts: true, dgS: 0.95 });
const s1 = bd.storey(rect(AX[1], AZ[1]), { y: Y[1], nextY: YTOP, eaveGap: 0.6, rise: 1.6, vw: VW[1], r: 0.26, colStep: 2.5, pingzuo: 0.95, din: -1.1, dout: 2.3, lift: 1.9, sweep: 1.1, w: 2.1, beasts: true, dgS: 0.95 });
const ROOF = bd.xieshan(AX[1] - 1.1, AZ[1] - 1.1, AX[1] - 1.1 - 2.3, { y0: s1.eaveTop, HR: 3.0, ov: 0.45, rr: 0.16, endScale: 0.45 });
const colTopY = [s0.colTop, s1.colTop];
const PLAQUE = { y: colTopY[1] - 0.5, z: AZ[1] + 0.45 };
bd.plaque('北固楼', 3.3, 1.25, PLAQUE.y, PLAQUE.z);
bd.build();
K.platform(M, { hx: 11, hz: 9.5, y0: GROUND - 0.5, y1: TY, stairs: [{ side: 'front', w: 5, yb: GROUND - 0.3 }, { side: 'back', w: 5, yb: GROUND - 0.3 }] });

/* ---- 甘露寺大殿：在楼的南边、低一点的地方 ---- */
const GL = { x: -10, z: -46, ax: 9.0, az: 6.0, vw: 1.1 };
GL.y = GROUND - 4.4;
const gg = new T.Group(); gg.position.set(GL.x, GL.y + 1.0, GL.z); H.scene.add(gg);
const bg = new K.Builder(gg, M, { dg: 0.9 });
const gs = bg.storey(rect(GL.ax, GL.az), { y: 0, nextY: 6.0, eaveGap: 0.6, rise: 1.6, vw: GL.vw, r: 0.3, colStep: 3.0, din: -1.0, dout: 2.4, lift: 1.5, w: 2.0, beasts: true, dgS: 0.9 });
bg.xieshan(GL.ax - 1.0, GL.az - 1.0, GL.ax - 1.0 - 2.6, { y0: gs.eaveTop, HR: 2.8, ov: 0.45, rr: 0.15, endScale: 0.42 });
bg.plaque('甘露寺', 3.0, 1.0, gs.colTop - 0.45, GL.az + 0.4);
bg.build();
K.platform(M, { hx: 11.5, hz: 8, y0: GL.y - 0.4, y1: GL.y + 1.0, cx: GL.x, cz: GL.z, stairs: [{ side: 'front', w: 4, yb: GL.y - 0.2 }] });
GL.colTop = gs.colTop; GL.top = GL.y + 1.0 + gs.eaveTop + 2.8;

/* ---- 甘露寺铁塔：宋代的铁铸佛塔，只剩下几层了 ---- */
const TT = { x: 14, z: -40 };
(function () {
  const iron = new T.MeshStandardMaterial({ color: 0x3e3430, roughness: 0.6, metalness: 0.7, envMapIntensity: 0.7 }), g = new T.Group(); g.position.set(TT.x, GROUND - 4.4, TT.z); H.scene.add(g);
  const base = new T.Mesh(new T.CylinderGeometry(2.6, 3.0, 1.6, 8), M.stone); base.position.y = 0.8; g.add(base);
  let y = 1.6, r = 1.6;
  for (let i = 0; i < 4; i++) {
    const body = new T.Mesh(new T.CylinderGeometry(r, r, 1.6, 8), iron); body.position.y = y + 0.8; body.rotation.y = Math.PI / 8; g.add(body);
    const eave = new T.Mesh(new T.CylinderGeometry(r + 0.2, r + 1.0, 0.35, 8), iron); eave.position.y = y + 1.75; eave.rotation.y = Math.PI / 8; g.add(eave);
    y += 1.95; r -= 0.18;
  }
  const top = new T.Mesh(new T.ConeGeometry(r + 0.4, 1.2, 8), iron); top.position.y = y + 0.6; g.add(top);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  TT.top = GROUND - 4 + y + 1.4;
})();

/* ---- 凌云亭：北边崖头的小亭子，又叫祭江亭 ---- */
const LY = { x: 6, z: 56 };
const lg = new T.Group(); H.scene.add(lg);
const bl = new K.Builder(lg, M, { dg: 0.5 });
LY.build = function (y) {
  lg.position.set(LY.x, y + 0.6, LY.z);
  const ls = bl.storey(K.poly(6, 2.6, 0), { y: 0, nextY: 3.6, eaveGap: 0.3, rise: 0.9, noWall: true, r: 0.16, colStep: 6, din: -0.5, dout: 1.2, lift: 1.0, w: 1.0, dgS: 0.5, rr: 0.09, tileScale: 0.7, que: false });
  LY.top = y + 0.6 + bl.zanjian(K.poly(6, 2.2, 0), ls.eaveTop - 0.02, 2.0, { rr: 0.08, finial: 0.5 });
  bl.fenceRing(K.poly(6, 2.9, 0), 0.0);
  bl.build();
  K.platform(M, { hx: 3.6, hz: 3.6, y0: y - 0.6, y1: y + 0.6, cx: LY.x, cz: LY.z, rail: false });
  LY.y = y;
};

const setGlow = K.glowSetter(M, bd.plaqueMats.concat(bg.plaqueMats), [[14, 12, TY - 1.2], [-14, 12, TY - 1.2], [14, -12, TY - 1.2], [-14, -12, TY - 1.2]], 12, 4);
H.tower = { group: tower, M, TX: M.TX, KAI: K.KAI, rect, PH, TY, GROUND, AX, AZ, Y, VW, YTOP, ROOF, PLAQUE, colTopY, GL, TT, LY, setGlow,
  BASE: { hx: 11, hz: 9.5, top: TY }, LZ: [AZ[0] + 0.6, AZ[1] + 0.55] };
})();
