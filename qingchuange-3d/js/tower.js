/* 晴川阁 · 楼体：禹功矶上的石台、两层楼阁、重檐歇山顶（青瓦朱柱、青绿彩画），旁边的禹稷行宫和禹碑亭
 * 今天的晴川阁是 1983 年起按清代样子重建的，高约 17.5 米。单位约等于米，正面朝 +z 的长江 */
(function () {
'use strict';
const H = window.HHL, T = THREE, K = H.kit;
const { rect } = K, { offsetPoly } = H;
const GROUND = 3.5;                                           // 禹功矶顶上的平地高度（江面在 -6）
const M = K.materials({ tile: 'grey', ridge: 0x4e5258, wall: 'ming', caihua: 'xuan', band: 'ming', rail: 'ming', dougong: 'ming', lacquer: 0x7a1e12 });

/* ---- 主阁 ---- */
const PH = 1.3, TY = GROUND + PH;
const tower = new T.Group(); tower.position.y = TY; H.scene.add(tower);
const AX = [9.4, 7.9], AZ = [6.8, 5.6], Y = [0, 7.4], VW = [1.4, 1.2], YTOP = 13.6;
const bd = new K.Builder(tower, M, { dg: 1 });
const s0 = bd.storey(rect(AX[0], AZ[0]), { y: 0, nextY: Y[1], eaveGap: 1.3, rise: 1.8, vw: VW[0], r: 0.32, colStep: 2.9, din: -1.2, dout: 2.6, lift: 1.7, sweep: 1.0, w: 2.2, beasts: true });
const s1 = bd.storey(rect(AX[1], AZ[1]), { y: Y[1], nextY: YTOP, eaveGap: 0.6, rise: 1.7, vw: VW[1], r: 0.27, colStep: 2.6, pingzuo: 1.0, din: -1.2, dout: 2.4, lift: 1.7, sweep: 1.0, w: 2.2, beasts: true });
const ROOF = bd.xieshan(AX[1] - 1.2, AZ[1] - 1.2, AX[1] - 1.2 - 2.6, { y0: s1.eaveTop, HR: 3.4, ov: 0.5, rr: 0.17, endScale: 0.5 });
const colTopY = [s0.colTop, s1.colTop], eaveEdgeY = [s0.edge, s1.edge];
const PLAQUE = { y: colTopY[1] - 0.5, z: AZ[1] + 0.5 };
bd.plaque('晴川阁', 3.8, 1.45, PLAQUE.y, PLAQUE.z);
bd.build();
const base = K.platform(M, { hx: 13.5, hz: 10.5, y0: GROUND - 0.6, y1: TY, mat: 'stone', stairs: [{ side: 'front', w: 5, yb: GROUND - 0.3 }, { side: 'left', w: 4, yb: GROUND - 0.3 }] });
const BASE = { hx: 13.5, hz: 10.5, top: TY };

/* ---- 禹稷行宫：纪念大禹治水的明代殿宇 ---- */
const XG = { x: -36, z: -20, y: GROUND + 0.6, ax: 8.5, az: 5.5, vw: 1.0 };
const xgG = new T.Group(); xgG.position.set(XG.x, XG.y, XG.z); H.scene.add(xgG);
const bx = new K.Builder(xgG, M, { dg: 0.9 });
const xs = bx.storey(rect(XG.ax, XG.az), { y: 0, nextY: 6.2, eaveGap: 0.6, rise: 1.6, vw: XG.vw, r: 0.28, colStep: 2.8, din: -1.0, dout: 2.3, lift: 1.3, w: 2.0, beasts: true, dgS: 0.9 });
bx.xieshan(XG.ax - 1.0, XG.az - 1.0, XG.ax - 1.0 - 2.4, { y0: xs.eaveTop, HR: 2.8, ov: 0.45, rr: 0.15, endScale: 0.42 });
bx.plaque('禹稷行宫', 3.6, 1.0, xs.colTop - 0.45, XG.az + 0.45);
bx.build();
K.platform(M, { hx: 10.5, hz: 7.5, y0: GROUND - 0.4, y1: XG.y, cx: XG.x, cz: XG.z, stairs: [{ side: 'front', w: 4, yb: GROUND - 0.3 }] });
XG.colTop = xs.colTop;

/* ---- 禹碑亭：亭里立着一块刻满奇古文字的“禹碑”拓本复制品 ---- */
const BT = { x: 24, z: -6, y: GROUND + 0.5 };
const btG = new T.Group(); btG.position.set(BT.x, BT.y, BT.z); H.scene.add(btG);
const bb = new K.Builder(btG, M, { dg: 0.6 });
const bs = bb.storey(rect(2.4, 2.4), { y: 0, nextY: 4.1, eaveGap: 0.4, rise: 1.0, noWall: true, r: 0.18, colStep: 4.8, din: -0.6, dout: 1.4, lift: 1.1, w: 1.2, dgS: 0.6, rr: 0.1, tileScale: 0.8 });
BT.top = bb.zanjian(rect(1.95, 1.95), bs.eaveTop - 0.02, 2.0, { rr: 0.09, finial: 0.55 });
bb.build();
K.platform(M, { hx: 3.6, hz: 3.6, y0: GROUND - 0.3, y1: BT.y, cx: BT.x, cz: BT.z, rail: false, stairs: [{ side: 'front', w: 1.8, yb: GROUND - 0.2 }] });
(function () {                                                 // 禹碑：深色石碑，刻满像蝌蚪一样的古怪文字
  const tex = H.canvasTex(256, 512, function (g, w, h) {
    g.fillStyle = '#2e2b28'; g.fillRect(0, 0, w, h); const r = H.rng(13);
    g.strokeStyle = 'rgba(200,190,170,.55)'; g.lineWidth = 3; g.lineCap = 'round';
    for (let c = 0; c < 5; c++) for (let k = 0; k < 9; k++) { const x = 40 + c * 44, y = 50 + k * 50; g.beginPath(); for (let s = 0; s < 3; s++) { const a = r() * 6.28; g.moveTo(x + Math.cos(a) * 12, y + Math.sin(a) * 12); g.quadraticCurveTo(x + (r() - 0.5) * 20, y + (r() - 0.5) * 20, x + Math.cos(a + 2.5) * 12, y + Math.sin(a + 2.5) * 12); } g.stroke(); }
    g.strokeStyle = 'rgba(200,190,170,.4)'; g.lineWidth = 6; g.strokeRect(14, 14, w - 28, h - 28);
  });
  const st = new T.Mesh(new T.BoxGeometry(1.1, 2.2, 0.32), [M.stoneI, M.stoneI, M.stoneI, M.stoneI, new T.MeshStandardMaterial({ map: tex, roughness: 0.7 }), M.stoneI]);
  st.position.set(0, 1.35, 0); st.castShadow = true; btG.add(st);
  const ped = new T.Mesh(new T.BoxGeometry(1.5, 0.3, 0.7), M.stone); ped.position.y = 0.15; btG.add(ped);
})();

const setGlow = K.glowSetter(M, bd.plaqueMats.concat(bx.plaqueMats), [[16, 13, TY - 1.2], [-16, 13, TY - 1.2], [16, -13, TY - 1.2], [-16, -13, TY - 1.2]], 14, 4);
H.tower = { group: tower, M, TX: M.TX, KAI: K.KAI, rect, PH, TY, GROUND, AX, AZ, Y, VW, YTOP, ROOF, PLAQUE, BASE, colTopY, eaveEdgeY, XG, BT, setGlow, LZ: [AZ[0] + 0.6, AZ[1] + 0.55] };
})();
