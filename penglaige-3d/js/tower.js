/* 蓬莱阁 · 楼体：丹崖山顶的两层楼阁（重檐歇山、回廊环绕、朱柱灰瓦），阁后的天后宫，阁前的石栏
 * 蓬莱阁始建于北宋嘉祐六年（1061 年）。单位约等于米，正面朝 +z 的大海 */
(function () {
'use strict';
const H = window.HHL, T = THREE, K = H.kit;
const { rect } = K;
const GROUND = 34;                                                  // 丹崖山顶，海面在 0
const M = K.materials({ tile: 'grey', ridge: 0x4e5258, wall: 'ming', caihua: 'xuan', band: 'ming', rail: 'ming', dougong: 'ming', lacquer: 0x8a2416 });

const PH = 1.2, TY = GROUND + PH;
const tower = new T.Group(); tower.position.y = TY; H.scene.add(tower);
const AX = [8.6, 6.6], AZ = [6.4, 4.8], Y = [0, 6.8], VW = [1.6, 1.1], YTOP = 12.0;
const bd = new K.Builder(tower, M, { dg: 0.85 });
const s0 = bd.storey(rect(AX[0], AZ[0]), { y: 0, nextY: Y[1], eaveGap: 1.1, rise: 1.6, vw: VW[0], r: 0.3, colStep: 2.8, din: -1.1, dout: 2.4, lift: 1.9, sweep: 1.1, w: 2.0, beasts: true, dgS: 0.85 });
const s1 = bd.storey(rect(AX[1], AZ[1]), { y: Y[1], nextY: YTOP, eaveGap: 0.5, rise: 1.4, vw: VW[1], r: 0.24, colStep: 2.4, pingzuo: 1.2, din: -1.0, dout: 2.2, lift: 1.9, sweep: 1.1, w: 1.9, beasts: true, dgS: 0.85 });
const ROOF = bd.xieshan(AX[1] - 1.0, AZ[1] - 1.0, AX[1] - 1.0 - 2.2, { y0: s1.eaveTop, HR: 2.8, ov: 0.45, rr: 0.14, endScale: 0.4 });
const colTopY = [s0.colTop, s1.colTop];
const PLAQUE = { y: colTopY[1] - 0.5, z: AZ[1] + 0.45 };
bd.plaque('蓬莱阁', 3.0, 1.15, PLAQUE.y, PLAQUE.z);
bd.build();
K.platform(M, { hx: 11, hz: 9, y0: GROUND - 0.4, y1: TY, stairs: [{ side: 'back', w: 5, yb: GROUND - 0.2 }] });

/* ---- 天后宫：阁后的一组殿宇，供奉保佑渔民出海平安的妈祖 ---- */
const TH = { x: -4, z: -30, ax: 8.0, az: 5.4 };
const tg = new T.Group(); tg.position.set(TH.x, GROUND + 0.6, TH.z); H.scene.add(tg);
const bt = new K.Builder(tg, M, { dg: 0.8 });
const ts = bt.storey(rect(TH.ax, TH.az), { y: 0, nextY: 5.6, eaveGap: 0.5, rise: 1.4, vw: 1.0, r: 0.26, colStep: 2.7, din: -1.0, dout: 2.2, lift: 1.7, w: 1.9, beasts: true, dgS: 0.8 });
bt.xieshan(TH.ax - 1.0, TH.az - 1.0, TH.ax - 1.0 - 2.4, { y0: ts.eaveTop, HR: 2.4, ov: 0.4, rr: 0.13, endScale: 0.36 });
bt.plaque('天后宫', 2.8, 0.9, ts.colTop - 0.4, TH.az + 0.4);
bt.build();
K.platform(M, { hx: 9.6, hz: 7, y0: GROUND - 0.4, y1: GROUND + 0.6, cx: TH.x, cz: TH.z, rail: false, stairs: [{ side: 'front', w: 4, yb: GROUND - 0.3 }] });
TH.y = GROUND + 0.6; TH.colTop = ts.colTop; TH.top = TH.y + ts.eaveTop + 2.6;

const setGlow = K.glowSetter(M, bd.plaqueMats.concat(bt.plaqueMats), [[13, 11, TY - 1], [-13, 11, TY - 1], [13, -11, TY - 1], [-13, -11, TY - 1]], 12, 4);
H.tower = { group: tower, M, TX: M.TX, KAI: K.KAI, rect, PH, TY, GROUND, AX, AZ, Y, VW, YTOP, ROOF, PLAQUE, colTopY, TH, setGlow,
  BASE: { hx: 11, hz: 9, top: TY }, LZ: [AZ[0] + 0.6, AZ[1] + 0.8] };
})();
