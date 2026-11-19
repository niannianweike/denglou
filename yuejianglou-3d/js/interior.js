/* 阅江楼 · 室内：一层宋濂、朱元璋两篇《阅江楼记》与“龙湾之战”；三层李白《登金陵凤凰台》与刘禹锡《乌衣巷》；顶层王安石《泊船瓜洲》与长江万里图
 * 字画都是用代码画出来的示意，不是实物照片 */
(function () {
'use strict';
const H = window.HHL, IC = H.ic, P = IC.paint;
const { offsetPoly, canvasTex } = H;
const { AX, AZ, Y, VW, rect } = H.tower;
IC.init({ ceil: 'ming' });
const PIC = {};

PIC.ji = IC.textScreen([['阅江楼记', '明　宋濂'], ['金陵为帝王之州'], ['自六朝迄于南唐'], ['类皆偏据一方'], ['逮我皇帝'], ['定鼎于兹'], ['始足以当之'], ['京城之西北'], ['有狮子山'], ['登览之顷'], ['万象森列'], ['千载之秘一旦轩露']]);
PIC.longwan = IC.landscapeTex({ title: '龙湾之战', seal: '龙湾', seed: 17, hy: 380, boats: [[300, 640, 1.6], [520, 700, 1.4], [760, 660, 1.6], [980, 720, 1.2]],
  extra: function (g, w, h) { P.ridge(g, 700, { y: 600, amp: 260, freq: 0.01, seed: 61, col: P.LV, a: 0.7, fade: 20, blur: 1, rough: 120, trees: 24 }); for (let i = 0; i < 10; i++) { g.strokeStyle = '#a8261a'; g.lineWidth = 4; g.beginPath(); g.moveTo(260 + i * 50, 540); g.lineTo(260 + i * 50, 470); g.stroke(); g.fillStyle = '#c02a1a'; g.fillRect(260 + i * 50, 470, 24, 16); } } });
PIC.zhu = IC.picScroll(function (g, w, h) { P.vtext(g, '阅江楼记', w - 90, 120, 56, '#8a1c12', 1.2); P.vtext(g, '明太祖朱元璋', w - 170, 140, 34, '#8a1c12', 1.2); ['朕闻三皇五帝', '下及唐宋', '皆华夏之君', '建都中土'].forEach((s, i) => P.vtext(g, s, w - 260 - i * 74, 140, 56, '#1e1a16', 1.14)); P.seal(g, 60, 860, 44, '洪武'); }, 7);

PIC.fenghuang = IC.poemSheet('登金陵凤凰台', '唐 李白', ['凤凰台上凤凰游', '凤去台空江自流', '吴宫花草埋幽径', '晋代衣冠成古丘', '三山半落青天外', '二水中分白鹭洲', '总为浮云能蔽日', '长安不见使人愁'], { seal: '太白', seed: 41 });
PIC.wuyi = IC.picScroll(function (g, w, h) {
  P.ridge(g, w, { y: 820, amp: 120, freq: 0.006, seed: 3, col: P.QING, a: 0.2, fade: 150, blur: 5 });
  g.fillStyle = 'rgba(230,226,214,.95)'; g.fillRect(40, 520, 430, 300); g.fillStyle = '#4a4e54'; g.beginPath(); g.moveTo(20, 530); g.lineTo(255, 440); g.lineTo(490, 530); g.fill();
  g.fillStyle = '#1c1a18'; g.fillRect(200, 660, 110, 160);
  g.strokeStyle = 'rgba(30,26,22,.9)'; g.lineWidth = 4; for (const p of [[160, 380], [300, 330], [240, 300]]) { g.beginPath(); g.moveTo(p[0] - 30, p[1] + 6); g.quadraticCurveTo(p[0] - 10, p[1] - 14, p[0], p[1]); g.quadraticCurveTo(p[0] + 10, p[1] - 14, p[0] + 30, p[1] + 6); g.stroke(); }
  P.vtext(g, '旧时王谢堂前燕', 440, 70, 48, '#221e1a', 1.12); P.vtext(g, '飞入寻常百姓家', 380, 70, 48, '#221e1a', 1.12); P.seal(g, 50, 70, 40, '梦得');
}, 61);
PIC.liuyuxi = IC.poemSheet('乌衣巷', '唐 刘禹锡', ['朱雀桥边野草花', '乌衣巷口夕阳斜', '旧时王谢堂前燕', '飞入寻常百姓家'], { seal: '梦得', seed: 47 });

PIC.guazhou = IC.poemSheet('泊船瓜洲', '宋 王安石', ['京口瓜洲一水间', '钟山只隔数重山', '春风又绿江南岸', '明月何时照我还'], { seal: '半山', seed: 53 });
PIC.changjiang = canvasTex(1536, 900, function (g, w, h) {         // 长江万里图：从青藏高原到东海
  P.paper(g, w, h, '#efe4c6', '#dccaa0', 21);
  const pts = [[80, 420], [240, 520], [360, 640], [520, 620], [640, 520], [760, 520], [880, 470], [1000, 500], [1120, 440], [1260, 420], [1440, 380]];
  g.strokeStyle = 'rgba(70,130,160,.85)'; g.lineWidth = 26; g.lineJoin = g.lineCap = 'round'; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke();
  for (const [x, y, t] of [[360, 690, '重庆'], [760, 570, '武汉'], [1000, 550, '九江'], [1190, 490, '南京'], [1440, 430, '上海'], [80, 470, '青海']]) { g.fillStyle = '#b3261a'; g.beginPath(); g.arc(x, y - 30, 8, 0, 7); g.fill(); P.htext(g, t, x, y, 34, '#3a3226'); }
  P.vtext(g, '长江万里图', 1470, 110, 54, '#2a2420', 1.2); P.seal(g, 1446, 430, 40, '大江'); P.frame(g, w, h);
});
PIC.navigation = IC.picScroll((g, w, h) => P.htext(g, '郑和启航', w / 2, h / 2, 68, '#2a495f'), 63);

/* ============================== 搭三层：一层、三层、顶层 ============================== */
const lantern4 = (ax, az) => [[-ax * 0.5, az * 0.35], [ax * 0.5, az * 0.35], [-ax * 0.5, -az * 0.5], [ax * 0.5, -az * 0.5]];
function room(k, H0, cols, ls) { const ax = AX[k] - VW[k], az = AZ[k] - VW[k]; return Object.assign(IC.floor({ P: offsetPoly(rect(AX[k], AZ[k]), -VW[k] - 0.07), y0: Y[k], H: H0, cols, colR: 0.45, lanterns: lantern4(ax, az), drop: 1.0, lanternS: ls || 1.3, beamStep: 2.6, ty: 3.0, light: 1.5 }), { ax, az }); }
(function () {
  const f = room(0, 6.4, [[-4.6, -3.2], [4.6, -3.2], [-4.6, 3.2], [4.6, 3.2]]);
  IC.panelScreen(f.grp, PIC.ji, 12, 0.66, 3.4, 0, 2.7, f.zb + 0.1);
  IC.framed(f.grp, PIC.longwan, 5.2, 3.05, -f.ax + 0.3, 3.2, -0.5, Math.PI / 2, { glow: 0.5 });
  IC.hangScroll(f.grp, PIC.zhu, 1.4, 2.8, f.ax - 0.3, 3.2, -0.5, -Math.PI / 2);
  IC.couplets(f.grp, '佳气郁葱来北极', '大江日夜向东流', 4.4, -4.6, 4.6, 3.0, 3.2 + 0.55);
})();
(function () {
  const f = room(2, 5.6, [[-3.8, -2.6], [3.8, -2.6], [-3.8, 2.6], [3.8, 2.6]]), y0 = Y[2];
  IC.framed(f.grp, PIC.fenghuang, 6.2, 2.74, 0, y0 + 2.9, f.zb, 0, { glow: 0.55 });
  IC.framed(f.grp, PIC.liuyuxi, 4.0, 2.37, -f.ax + 0.3, y0 + 2.8, 0, Math.PI / 2, { glow: 0.55 });
  IC.hangScroll(f.grp, PIC.wuyi, 1.2, 2.4, f.ax - 0.3, y0 + 2.8, 0, -Math.PI / 2);
})();
(function () {
  const f = room(3, 5.2, [[-3.2, -2.2], [3.2, -2.2], [-3.2, 2.2], [3.2, 2.2]], 1.1), y0 = Y[3];
  IC.framed(f.grp, PIC.navigation, 5.4, 3.16, 0, y0 + 2.7, f.zb, 0, { glow: 0.55 });
  IC.framed(f.grp, PIC.guazhou, 3.8, 2.25, -f.ax + 0.3, y0 + 2.6, 0, Math.PI / 2, { glow: 0.55 });
  IC.framed(f.grp, PIC.changjiang, 3.8, 2.22, f.ax - 0.32, y0 + 2.6, -0.2, -Math.PI / 2, { glow: 0.55 });
})();
IC.finish(PIC);
})();
