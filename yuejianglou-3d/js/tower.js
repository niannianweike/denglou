/* 阅江楼 · 楼体：狮子山顶的高台上，主楼和侧楼成“曲尺形”（像一把木工用的直角尺）：主楼外观四层、重檐歇山顶，侧楼三层；黄琉璃瓦、朱红柱、青绿彩画
 * 阅江楼 2001 年建成，主楼高约 52 米，外观四层、内部七层。这里按课堂观感取整，单位约等于米；主楼正面朝 +z 的长江 */
(function () {
'use strict';
const H = window.HHL, T = THREE, K = H.kit;
const { rect } = K;
const GROUND = 46;                                                 // 狮子山顶
const M = K.materials({ tile: 'yellow', ridge: 0xb8811a, wall: 'ming', caihua: 'xuan', band: 'ming', rail: 'ming', dougong: 'ming', lacquer: 0x8a2416 });

const PH = 4.2, TY = GROUND + PH;
const tower = new T.Group(); tower.position.y = TY; H.scene.add(tower);
/* 主楼：四个明层 */
const AX = [12.0, 10.6, 9.2, 7.8], AZ = [9.6, 8.6, 7.6, 6.6], Y = [0, 9.6, 17.6, 25.0], VW = [1.6, 1.4, 1.3, 1.2], YTOP = 32.0;
const bd = new K.Builder(tower, M, { dg: 1.2 });
const ss = [];
for (let k = 0; k < 4; k++) ss.push(bd.storey(rect(AX[k], AZ[k]), { y: Y[k], nextY: k < 3 ? Y[k + 1] : YTOP, eaveGap: k < 3 ? 1.3 : 0.6, rise: 2.0, vw: VW[k], r: k ? 0.32 : 0.4, colStep: 3.2, pingzuo: k ? 1.2 : false, din: -1.4, dout: k ? 2.8 : 3.2, lift: 2.0, sweep: 1.2, w: 2.6, beasts: true, dgS: 1.2, tileScale: 1.2, rr: 0.18 }));
/* 重檐：顶层上面再加一重屋檐，然后才是歇山顶 */
const top2 = bd.storey(rect(AX[3] - 1.0, AZ[3] - 1.0), { y: YTOP, nextY: YTOP + 3.2, eaveGap: 0.5, rise: 1.6, noWall: true, vw: 0, r: 0.28, colStep: 3.0, din: -1.2, dout: 2.4, lift: 1.8, sweep: 1.0, w: 2.2, beasts: true, dgS: 1.0, que: false, tileScale: 1.1, rr: 0.16 });
const ROOF = bd.xieshan(AX[3] - 2.2, AZ[3] - 2.2, AX[3] - 2.2 - 2.8, { y0: top2.eaveTop, HR: 4.0, ov: 0.5, rr: 0.2, endScale: 0.6 });
const colTopY = ss.map(s => s.colTop);
const PLAQUE = { y: colTopY[1] - 0.7, z: AZ[1] + 0.55 };
bd.plaque('阅江楼', 4.8, 1.8, PLAQUE.y, PLAQUE.z);
bd.build();

/* 侧楼：在主楼西边，转了 90 度，正面朝西（江的上游方向），和主楼连成曲尺形 */
const WING = { x: -24, z: -6, ax: [6.8, 5.8, 4.8], az: [8.4, 7.4, 6.4], y: [0, 8.4, 15.6], top: 22.0 };
const wg = new T.Group(); wg.position.set(WING.x, TY, WING.z); wg.rotation.y = -Math.PI / 2; H.scene.add(wg);
const bw = new K.Builder(wg, M, { dg: 1.0 });
const ws = [];
for (let k = 0; k < 3; k++) ws.push(bw.storey(rect(WING.az[k], WING.ax[k]), { y: WING.y[k], nextY: k < 2 ? WING.y[k + 1] : WING.top, eaveGap: k < 2 ? 1.1 : 0.5, rise: 1.7, vw: 1.2, r: 0.3, colStep: 3.0, pingzuo: k ? 1.0 : false, din: -1.2, dout: k ? 2.4 : 2.8, lift: 1.8, sweep: 1.0, w: 2.2, beasts: true, dgS: 1.0, rr: 0.16 }));
bw.xieshan(WING.az[2] - 1.2, WING.ax[2] - 1.2, WING.az[2] - 1.2 - 2.4, { y0: ws[2].eaveTop, HR: 3.2, ov: 0.45, rr: 0.17, endScale: 0.5 });
bw.build();
/* 连廊：主楼和侧楼之间一段两层的廊子 */
(function () {
  const g = new T.Group(); g.position.set(-14.6, TY, -6); H.scene.add(g); const b = new K.Builder(g, M, { dg: 0.8 });
  const s = b.storey(rect(3.0, 4.6), { y: 0, nextY: 7.0, eaveGap: 0.6, rise: 1.3, vw: 0.8, r: 0.26, colStep: 3.0, din: -1.0, dout: 2.0, lift: 1.2, w: 1.8, dgS: 0.8, rr: 0.13 });
  b.xieshan(2.0, 3.6, 0.6, { y0: s.eaveTop, HR: 2.2, ov: 0.35, rr: 0.13, endScale: 0.35 }); b.build();
})();
/* 高台：两层石台，前面一条宽宽的大台阶 */
K.platform(M, { hx: 30, hz: 18, y0: GROUND - 0.5, y1: GROUND + 2.0, cx: -6, cz: -2, stairs: [{ side: 'front', w: 14, yb: GROUND - 0.5, at: 6 }] });
K.platform(M, { hx: 16, hz: 13, y0: GROUND + 1.8, y1: TY, cx: 0, cz: 0, stairs: [{ side: 'front', w: 8, yb: GROUND + 2.0 }] });
K.platform(M, { hx: 10, hz: 11, y0: GROUND + 1.8, y1: TY, cx: WING.x, cz: WING.z, rail: true });
const BASE = { hx: 30, hz: 18, cx: -6, cz: -2, top: TY };

const setGlow = K.glowSetter(M, bd.plaqueMats, [[22, 18, TY - 1], [-22, 18, TY - 1], [22, -16, TY - 1], [-34, 12, TY - 1]], 30, 7);
H.tower = { group: tower, M, TX: M.TX, KAI: K.KAI, rect, PH, TY, GROUND, AX, AZ, Y, VW, YTOP, ROOF, PLAQUE, BASE, colTopY, WING, setGlow,
  LZ: [AZ[0] + 0.8, AZ[1] + 0.7, AZ[2] + 0.7, AZ[3] + 0.7], lookoutX: 4 };
})();
