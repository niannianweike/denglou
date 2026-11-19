/* 大观楼 · 楼体：滇池北岸的三层三重檐楼阁（攒尖顶、黄琉璃瓦、朱红门窗），一层正门两侧挂着 180 字的长联；楼前临水石台
 * 大观楼始建于清康熙二十九年（1690 年），今天的楼是清同治年间重建的。单位约等于米，正面朝 +z 的滇池 */
(function () {
'use strict';
const H = window.HHL, T = THREE, K = H.kit;
const { rect } = K;
const GROUND = 1.6;
const M = K.materials({ tile: 'yellow', ridge: 0xb8811a, wall: 'ming', caihua: 'xuan', band: 'ming', rail: 'ming', dougong: 'ming', lacquer: 0x8a2416 });

const PH = 1.3, TY = GROUND + PH;
const tower = new T.Group(); tower.position.y = TY; H.scene.add(tower);
const AX = [8.2, 7.0, 5.8], AZ = [7.0, 6.0, 5.0], Y = [0, 5.8, 10.8], VW = [1.2, 1.1, 1.0], YTOP = 15.2;
const bd = new K.Builder(tower, M, { dg: 0.85 });
const ss = [];
for (let k = 0; k < 3; k++) ss.push(bd.storey(rect(AX[k], AZ[k]), { y: Y[k], nextY: k < 2 ? Y[k + 1] : YTOP, eaveGap: k < 2 ? 1.0 : 0.5, rise: 1.4, vw: VW[k], r: k ? 0.25 : 0.3, colStep: 2.7, pingzuo: k ? 0.9 : false, din: -1.0, dout: 2.3, lift: 2.0, sweep: 1.2, w: 1.9, beasts: true, dgS: 0.85 }));
const TOP = bd.zanjian(rect(AX[2] - 1.0, AZ[2] - 1.0), ss[2].eaveTop - 0.05, 3.6, { rr: 0.13, finial: 1.1, curve: 1.3 });
const colTopY = ss.map(s => s.colTop);
const PLAQUE = { y: colTopY[1] - 0.5, z: AZ[1] + 0.45 };
bd.plaque('大观楼', 3.0, 1.15, PLAQUE.y, PLAQUE.z);
bd.build();
K.platform(M, { hx: 11, hz: 10, y0: GROUND - 0.4, y1: TY, stairs: [{ side: 'front', w: 5, yb: GROUND - 0.2 }, { side: 'back', w: 4, yb: GROUND - 0.2 }] });

/* ---- 长联：一层正门两边各一条长长的木联，各九十个字，竖排成几行 ---- */
const UP = '五百里滇池奔来眼底披襟岸帻喜茫茫空阔无边看东骧神骏西翥灵仪北走蜿蜒南翔缟素高人韵士何妨选胜登临趁蟹屿螺洲梳裹就风鬟雾鬓更苹天苇地点缀些翠羽丹霞莫辜负四围香稻万顷晴沙九夏芙蓉三春杨柳';
const DOWN = '数千年往事注到心头把酒凌虚叹滚滚英雄谁在想汉习楼船唐标铁柱宋挥玉斧元跨革囊伟烈丰功费尽移山心力尽珠帘画栋卷不及暮雨朝云便断碣残碑都付与苍烟落照只赢得几杵疏钟半江渔火两行秋雁一枕清霜';
function lianTex(s) {
  return H.canvasTex(512, 2048, function (g, w, h) {
    const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#2a140a'); gr.addColorStop(0.5, '#3e1e10'); gr.addColorStop(1, '#2a140a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#c9a24a'; g.lineWidth = 12; g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = '#f0c95a'; g.font = 'bold 82px ' + K.KAI; g.textAlign = 'center'; g.textBaseline = 'middle';
    const cols = 5, per = Math.ceil(s.length / cols);
    for (let c = 0; c < cols; c++) for (let i = 0; i < per; i++) { const ch = s[c * per + i]; if (ch) g.fillText(ch, w - 60 - c * 98, 70 + i * 100); }
  });
}
const LIAN = { z: AZ[0] - VW[0] + 0.05, x: 2.4, h: 4.2 };
for (const [sx, s] of [[1, UP], [-1, DOWN]]) {
  const mat = new T.MeshStandardMaterial({ map: lianTex(s), roughness: 0.5, emissive: 0xffffff, emissiveIntensity: 0 }); mat.emissiveMap = mat.map; bd.plaqueMats.push(mat);
  const m = new T.Mesh(new T.BoxGeometry(1.05, LIAN.h, 0.08), [M.gold, M.gold, M.gold, M.gold, mat, M.gold]); m.position.set(sx * LIAN.x, LIAN.h / 2 + 0.3, LIAN.z + 0.06); tower.add(m);
}

const setGlow = K.glowSetter(M, bd.plaqueMats, [[13, 12, TY - 1], [-13, 12, TY - 1], [13, -12, TY - 1], [-13, -12, TY - 1]], 14, 4);
H.tower = { group: tower, M, TX: M.TX, KAI: K.KAI, rect, PH, TY, GROUND, AX, AZ, Y, VW, YTOP, TOP, PLAQUE, colTopY, LIAN, UP, DOWN, setGlow,
  BASE: { hx: 11, hz: 10, top: TY }, LZ: [AZ[0] + 0.6, AZ[1] + 0.55, AZ[2] + 0.55] };
})();
