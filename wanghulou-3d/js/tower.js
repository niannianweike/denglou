/* 望湖楼 · 楼体：西湖北岸的两层楼阁（重檐歇山、青瓦朱柱），临湖的石台与栏杆；孤山脚下的“平湖秋月”水阁
 * 望湖楼相传始建于五代吴越国，今天的楼是后来重建的。单位约等于米，正面朝 +z 的西湖 */
(function () {
'use strict';
const H = window.HHL, T = THREE, K = H.kit;
const { rect } = K;
const GROUND = 2.0;
const M = K.materials({ tile: 'grey', ridge: 0x4e5258, wall: 'ming', caihua: 'xuan', band: 'ming', rail: 'ming', dougong: 'ming', lacquer: 0x7a1e12 });

const PH = 1.2, TY = GROUND + PH;
const tower = new T.Group(); tower.position.y = TY; H.scene.add(tower);
const AX = [8.4, 7.0], AZ = [6.0, 5.0], Y = [0, 6.4], VW = [1.2, 1.0], YTOP = 11.8;
const bd = new K.Builder(tower, M, { dg: 0.85 });
const s0 = bd.storey(rect(AX[0], AZ[0]), { y: 0, nextY: Y[1], eaveGap: 1.1, rise: 1.5, vw: VW[0], r: 0.28, colStep: 2.8, din: -1.1, dout: 2.3, lift: 1.8, sweep: 1.0, w: 2.0, beasts: true, dgS: 0.85 });
const s1 = bd.storey(rect(AX[1], AZ[1]), { y: Y[1], nextY: YTOP, eaveGap: 0.5, rise: 1.4, vw: VW[1], r: 0.24, colStep: 2.4, pingzuo: 0.9, din: -1.0, dout: 2.2, lift: 1.8, sweep: 1.0, w: 1.9, beasts: true, dgS: 0.85 });
const ROOF = bd.xieshan(AX[1] - 1.0, AZ[1] - 1.0, AX[1] - 1.0 - 2.4, { y0: s1.eaveTop, HR: 2.7, ov: 0.45, rr: 0.14, endScale: 0.4 });
const colTopY = [s0.colTop, s1.colTop];
const PLAQUE = { y: colTopY[1] - 0.5, z: AZ[1] + 0.45 };
bd.plaque('望湖楼', 3.2, 1.2, PLAQUE.y, PLAQUE.z);
bd.build();
K.platform(M, { hx: 11, hz: 8.6, y0: GROUND - 0.4, y1: TY, stairs: [{ side: 'front', w: 5, yb: GROUND - 0.2 }, { side: 'back', w: 4, yb: GROUND - 0.2 }] });

/* ---- 平湖秋月：孤山脚下临水的厅堂，前面一座伸进湖里的平台 ---- */
const PH2 = { x: -330, z: 150, ax: 7.0, az: 4.6 };
const pg = new T.Group(); pg.position.set(PH2.x, GROUND + 0.6, PH2.z); H.scene.add(pg);
const bp = new K.Builder(pg, M, { dg: 0.75 });
const ps = bp.storey(rect(PH2.ax, PH2.az), { y: 0, nextY: 5.2, eaveGap: 0.5, rise: 1.3, vw: 0.9, r: 0.24, colStep: 2.6, din: -1.0, dout: 2.0, lift: 1.6, w: 1.8, beasts: true, dgS: 0.75 });
bp.xieshan(PH2.ax - 0.9, PH2.az - 0.9, PH2.ax - 0.9 - 2.2, { y0: ps.eaveTop, HR: 2.2, ov: 0.4, rr: 0.12, endScale: 0.34 });
bp.plaque('平湖秋月', 3.0, 0.85, ps.colTop - 0.4, PH2.az + 0.4);
bp.build();
K.platform(M, { hx: 8.6, hz: 6.0, y0: -3, y1: GROUND + 0.6, cx: PH2.x, cz: PH2.z, rail: false });
K.platform(M, { hx: 8, hz: 6, y0: -3, y1: GROUND + 0.1, cx: PH2.x, cz: PH2.z + 12, rail: true });   // 临水平台
PH2.y = GROUND + 0.6; PH2.colTop = ps.colTop; PH2.top = PH2.y + ps.eaveTop + 2.4;

const setGlow = K.glowSetter(M, bd.plaqueMats.concat(bp.plaqueMats), [[13, 11, TY - 1], [-13, 11, TY - 1], [13, -11, TY - 1], [-13, -11, TY - 1]], 12, 4);
H.tower = { group: tower, M, TX: M.TX, KAI: K.KAI, rect, PH, TY, GROUND, AX, AZ, Y, VW, YTOP, ROOF, PLAQUE, colTopY, PH2, setGlow,
  BASE: { hx: 11, hz: 8.6, top: TY }, LZ: [AZ[0] + 0.6, AZ[1] + 0.55] };
})();
