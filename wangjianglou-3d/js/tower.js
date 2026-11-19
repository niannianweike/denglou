/* 望江楼 · 楼体：锦江边的崇丽阁（下两层四方、上两层八角，攒尖顶加鎏金宝顶），旁边临水的吟诗楼，院里的薛涛井
 * 崇丽阁建于清光绪年间。单位约等于米，正面朝 +z 的锦江 */
(function () {
'use strict';
const H = window.HHL, T = THREE, K = H.kit;
const { rect, poly } = K;
const GROUND = 1.5;
const M = K.materials({ tile: 'green', ridge: 0x3a6a4a, wall: 'ming', caihua: 'xuan', band: 'ming', rail: 'ming', dougong: 'ming', lacquer: 0x8a2416 });

const PH = 1.4, TY = GROUND + PH;
const tower = new T.Group(); tower.position.y = TY; H.scene.add(tower);
const R8 = (r) => poly(8, r, Math.PI / 8);
const Y = [0, 7.0, 13.2, 18.8], YTOP = 23.6;
const PL = [rect(7.4, 7.4), rect(6.4, 6.4), R8(6.4), R8(5.3)];                     // 一、二层四方，三、四层八角
const bd = new K.Builder(tower, M, { dg: 0.9 });
const ss = [];
for (let k = 0; k < 4; k++) ss.push(bd.storey(PL[k], { y: Y[k], nextY: k < 3 ? Y[k + 1] : YTOP, eaveGap: k < 3 ? 1.1 : 0.5, rise: 1.5, vw: 1.1, r: k ? 0.26 : 0.3, colStep: k > 1 ? 2.4 : 2.6, pingzuo: k ? 0.9 : false, din: -1.0, dout: 2.2, lift: k > 1 ? 0.9 : 2.0, sweep: k > 1 ? 0.6 : 1.2, w: k > 1 ? 1.1 : 1.8, beasts: true, dgS: 0.9, rr: 0.14 }));
const TOP = bd.zanjian(R8(4.4), ss[3].eaveTop - 0.05, 4.6, { rr: 0.13, finial: 1.5, curve: 1.4 });
const colTopY = ss.map(s => s.colTop);
const PLAQUE = { y: colTopY[1] - 0.5, z: 6.4 + 0.45 };
bd.plaque('崇丽阁', 3.0, 1.15, PLAQUE.y, PLAQUE.z);
bd.build();
K.platform(M, { hx: 10, hz: 10, y0: GROUND - 0.4, y1: TY, stairs: [{ side: 'front', w: 5, yb: GROUND - 0.2 }, { side: 'back', w: 4, yb: GROUND - 0.2 }] });

/* ---- 吟诗楼：临江的两层小楼，半边伸到水上 ---- */
const YS = { x: 34, z: 24, ax: 6.0, az: 4.2 };
const yg = new T.Group(); yg.position.set(YS.x, GROUND + 0.6, YS.z); H.scene.add(yg);
const by = new K.Builder(yg, M, { dg: 0.7 });
const y0 = by.storey(rect(YS.ax, YS.az), { y: 0, nextY: 4.6, eaveGap: 0.8, rise: 1.2, vw: 0.8, r: 0.22, colStep: 2.4, din: -0.9, dout: 1.9, lift: 1.6, w: 1.6, dgS: 0.7, rr: 0.11 });
const y1 = by.storey(rect(YS.ax - 0.9, YS.az - 0.9), { y: 4.6, nextY: 8.6, eaveGap: 0.4, rise: 1.1, vw: 0.6, r: 0.2, colStep: 2.2, pingzuo: 0.7, din: -0.8, dout: 1.7, lift: 1.6, w: 1.5, dgS: 0.7, rr: 0.11 });
by.xieshan(YS.ax - 1.7, YS.az - 1.7, YS.ax - 1.7 - 1.6, { y0: y1.eaveTop, HR: 2.0, ov: 0.35, rr: 0.11, endScale: 0.3 });
by.plaque('吟诗楼', 2.2, 0.8, y0.colTop - 0.35, YS.az + 0.35);
by.build();
K.platform(M, { hx: 7.2, hz: 5.4, y0: GROUND - 3, y1: GROUND + 0.6, cx: YS.x, cz: YS.z, rail: false });
YS.y = GROUND + 0.6; YS.colTop = y0.colTop; YS.top = YS.y + y1.eaveTop + 2.2;

/* ---- 薛涛井：石栏围着的一口古井，旁边立一块石碑 ---- */
const JING = { x: -22, z: 14 };
(function () {
  const g = new T.Group(); g.position.set(JING.x, GROUND, JING.z); H.scene.add(g);
  const ring = new T.Mesh(new T.CylinderGeometry(1.2, 1.3, 0.9, 16, 1, true), M.stone); ring.material.side = T.DoubleSide; ring.position.y = 0.45; g.add(ring);
  const top = new T.Mesh(new T.TorusGeometry(1.25, 0.15, 6, 20), M.stoneI); top.rotation.x = Math.PI / 2; top.position.y = 0.9; g.add(top);
  const water = new T.Mesh(new T.CircleGeometry(1.1, 16), new T.MeshStandardMaterial({ color: 0x1a2a2a, roughness: 0.1, metalness: 0.4 })); water.rotation.x = -Math.PI / 2; water.position.y = 0.2; g.add(water);
  const tex = H.canvasTex(256, 512, function (c, w, h) { c.fillStyle = '#5a5650'; c.fillRect(0, 0, w, h); c.fillStyle = '#e8e2d2'; c.font = 'bold 110px ' + K.KAI; c.textAlign = 'center'; c.textBaseline = 'middle'; '薛涛井'.split('').forEach((s, i) => c.fillText(s, w / 2, 110 + i * 140)); });
  const st = new T.Mesh(new T.BoxGeometry(0.9, 1.8, 0.24), [M.stoneI, M.stoneI, M.stoneI, M.stoneI, new T.MeshStandardMaterial({ map: tex, roughness: 0.7 }), M.stoneI]); st.position.set(0, 0.9 + 0.2, -2.0); g.add(st);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
})();

const setGlow = K.glowSetter(M, bd.plaqueMats.concat(by.plaqueMats), [[12, 12, TY - 1], [-12, 12, TY - 1], [12, -12, TY - 1], [-12, -12, TY - 1]], 16, 4.5);
H.tower = { group: tower, M, TX: M.TX, KAI: K.KAI, rect, PH, TY, GROUND, Y, YTOP, TOP, PLAQUE, colTopY, YS, JING, setGlow, PL,
  AX: [7.4, 6.4, 6.4, 5.3], AZ: [7.4, 6.4, 6.4, 5.3], BASE: { hx: 10, hz: 10, top: TY }, LZ: [8.0, 7.0, 6.9, 5.9] };
})();
