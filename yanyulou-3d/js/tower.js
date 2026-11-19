/* 烟雨楼 · 楼体：南湖湖心岛上的两层重檐楼阁（青瓦朱柱），楼前的清晖堂，岛边的石驳岸
 * 烟雨楼始建于五代，明朝嘉靖年间移到湖心岛上，今天的楼是后来重建的。单位约等于米，正面朝 +z */
(function () {
'use strict';
const H = window.HHL, T = THREE, K = H.kit;
const { rect } = K;
const GROUND = 1.6;
const M = K.materials({ tile: 'grey', ridge: 0x4e5258, wall: 'ming', caihua: 'xuan', band: 'ming', rail: 'ming', dougong: 'ming', lacquer: 0x7a1e12 });

const PH = 1.1, TY = GROUND + PH, MZ = -10;
const tower = new T.Group(); tower.position.set(0, TY, MZ); H.scene.add(tower);
const AX = [9.0, 7.6], AZ = [6.2, 5.0], Y = [0, 6.2], VW = [1.2, 1.0], YTOP = 11.4;
const bd = new K.Builder(tower, M, { dg: 0.85 });
const s0 = bd.storey(rect(AX[0], AZ[0]), { y: 0, nextY: Y[1], eaveGap: 1.1, rise: 1.5, vw: VW[0], r: 0.28, colStep: 2.8, din: -1.1, dout: 2.3, lift: 1.9, sweep: 1.1, w: 2.0, beasts: true, dgS: 0.85 });
const s1 = bd.storey(rect(AX[1], AZ[1]), { y: Y[1], nextY: YTOP, eaveGap: 0.5, rise: 1.4, vw: VW[1], r: 0.24, colStep: 2.5, pingzuo: 0.9, din: -1.0, dout: 2.2, lift: 1.9, sweep: 1.1, w: 1.9, beasts: true, dgS: 0.85 });
const ROOF = bd.xieshan(AX[1] - 1.0, AZ[1] - 1.0, AX[1] - 1.0 - 2.6, { y0: s1.eaveTop, HR: 2.7, ov: 0.45, rr: 0.14, endScale: 0.4 });
const colTopY = [s0.colTop, s1.colTop];
const PLAQUE = { y: colTopY[1] - 0.5, z: AZ[1] + 0.45 };
bd.plaque('烟雨楼', 3.2, 1.2, PLAQUE.y, PLAQUE.z);
bd.build();
K.platform(M, { hx: 11.5, hz: 8.4, y0: GROUND - 0.4, y1: TY, cz: MZ, stairs: [{ side: 'front', w: 5, yb: GROUND - 0.2 }] });

/* ---- 清晖堂：楼前的厅堂，中间隔着一个小院 ---- */
const QH = { x: 0, z: 18, ax: 8.0, az: 4.4 };
const qg = new T.Group(); qg.position.set(QH.x, GROUND + 0.5, QH.z); H.scene.add(qg);
const bq = new K.Builder(qg, M, { dg: 0.75 });
const qs = bq.storey(rect(QH.ax, QH.az), { y: 0, nextY: 5.2, eaveGap: 0.5, rise: 1.3, vw: 0.9, r: 0.24, colStep: 2.7, din: -1.0, dout: 2.0, lift: 1.6, w: 1.8, beasts: true, dgS: 0.75 });
bq.xieshan(QH.ax - 0.9, QH.az - 0.9, QH.ax - 0.9 - 2.4, { y0: qs.eaveTop, HR: 2.2, ov: 0.4, rr: 0.12, endScale: 0.34 });
bq.plaque('清晖堂', 2.6, 0.85, qs.colTop - 0.4, QH.az + 0.4);
bq.build();
K.platform(M, { hx: 9.4, hz: 5.6, y0: GROUND - 0.3, y1: GROUND + 0.5, cx: QH.x, cz: QH.z, rail: false, stairs: [{ side: 'front', w: 4, yb: GROUND - 0.2 }, { side: 'back', w: 4, yb: GROUND - 0.2 }] });
QH.y = GROUND + 0.5; QH.colTop = qs.colTop; QH.top = QH.y + qs.eaveTop + 2.4;

/* ---- 院子两侧的游廊 ---- */
(function () {
  for (const sx of [-1, 1]) {
    const g = new T.Group(); g.position.set(sx * 10.5, GROUND + 0.2, 6); H.scene.add(g); const b = new K.Builder(g, M, { dg: 0.5 });
    const s = b.storey(rect(1.6, 8.5), { y: 0, nextY: 3.6, eaveGap: 0.3, rise: 0.8, noWall: true, r: 0.14, colStep: 2.4, din: -0.5, dout: 1.0, lift: 0.4, sweep: 0.2, w: 1.0, dgS: 0.45, rr: 0.08, tileScale: 0.6, que: false, bells: false });
    b.xieshan(1.2, 8.0, 0.2, { y0: s.eaveTop, HR: 1.0, ov: 0.2, rr: 0.07, endScale: 0.2 }); b.build();
  }
})();

const setGlow = K.glowSetter(M, bd.plaqueMats.concat(bq.plaqueMats), [[14, MZ + 11, TY - 1], [-14, MZ + 11, TY - 1], [14, MZ - 10, TY - 1], [-14, MZ - 10, TY - 1]], 12, 4);
H.tower = { group: tower, M, TX: M.TX, KAI: K.KAI, rect, PH, TY, GROUND, MZ, AX, AZ, Y, VW, YTOP, ROOF, PLAQUE, colTopY, QH, setGlow,
  BASE: { hx: 11.5, hz: 8.4, cz: MZ, top: TY }, LZ: [MZ + AZ[0] + 0.6, MZ + AZ[1] + 0.55] };
})();
