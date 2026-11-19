/* 晴川阁 · 室内：一楼崔颢《黄鹤楼》诗屏与“晴川图”；二楼李白“江城五月落梅花”、武汉三镇图、鹦鹉洲图；禹稷行宫里的大禹治水
 * 字画都是用代码画出来的示意，不是实物照片 */
(function () {
'use strict';
const H = window.HHL, T = THREE, IC = H.ic, P = IC.paint;
const { offsetPoly, canvasTex } = H;
const { AX, AZ, Y, VW, TY, XG, rect } = H.tower;
const MI = IC.init({ ceil: 'ming' });
const PIC = {};

/* ---- 一楼 ---- */
PIC.cui = IC.poemSheet('黄鹤楼', '唐 崔颢', ['昔人已乘黄鹤去', '此地空余黄鹤楼', '黄鹤一去不复返', '白云千载空悠悠', '晴川历历汉阳树', '芳草萋萋鹦鹉洲', '日暮乡关何处是', '烟波江上使人愁'], { seal: '崔颢', seed: 41 });
PIC.qingchuan = IC.landscapeTex({ title: '晴川图', seal: '晴川', seed: 9, hy: 360, tower: [1080, 470, 70, 5], boats: [[520, 600], [820, 700, 0.8]], birds: [[640, 230], [680, 214], [610, 210]],
  extra: function (g, w, h) { for (let i = 0; i < 26; i++) { const x = 60 + i * 34, y = 860 - (i % 3) * 8, s = 18 + (i % 4) * 4; g.fillStyle = 'rgba(52,72,48,.8)'; g.fillRect(x, y - s * 2.4, 2, s * 2.4); for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(x, y - s * (1.2 + k * 0.6), s * (0.8 - k * 0.18), s * 0.35, 0, 0, 7); g.fill(); } } P.htext(g, '汉阳树', 300, 780, 30, 'rgba(60,50,40,.7)'); } });
PIC.cuiScroll = IC.poetScroll('崔颢', ['#5e6e7e', '#3c4854'], '晴川历历汉阳树', '芳草萋萋鹦鹉洲', 31, { beard: true });

/* ---- 二楼 ---- */
PIC.li = IC.poemSheet('与史郎中钦听黄鹤楼上吹笛', '唐 李白', ['一为迁客去长沙', '西望长安不见家', '黄鹤楼中吹玉笛', '江城五月落梅花'], { seal: '太白', seed: 43 });
PIC.libai = IC.poetScroll('太白', ['#e8e2d0', '#b8b0a0'], '黄鹤楼中吹玉笛', '江城五月落梅花', 47, { beard: true });
PIC.sanzhen = canvasTex(1536, 900, function (g, w, h) {          // 武汉三镇：长江和汉江把城市分成三块
  P.paper(g, w, h, '#efe5c8', '#ddca9e', 21);
  g.strokeStyle = 'rgba(80,140,160,.75)'; g.lineCap = 'round'; g.lineWidth = 90; g.beginPath(); g.moveTo(560, 900); g.bezierCurveTo(640, 640, 760, 460, 900, 330); g.bezierCurveTo(1020, 210, 1180, 130, 1400, 40); g.stroke();
  g.lineWidth = 40; g.beginPath(); g.moveTo(80, 300); g.bezierCurveTo(360, 360, 600, 420, 840, 380); g.stroke();
  P.ripples(g, 0, w, 0, h, 120, 5, '40,90,110');
  P.htext(g, '汉 口', 520, 200, 64, '#3a2e22'); P.htext(g, '汉 阳', 420, 600, 64, '#3a2e22'); P.htext(g, '武 昌', 1120, 620, 64, '#3a2e22');
  P.htext(g, '长 江', 1000, 380, 40, 'rgba(250,250,245,.95)'); P.htext(g, '汉 江', 330, 330, 34, 'rgba(250,250,245,.95)');
  P.drawTower(g, 960, 540, 46, 5); P.htext(g, '黄鹤楼', 1010, 590, 30, '#8a1c12'); P.drawTower(g, 740, 470, 34, 2); P.htext(g, '晴川阁', 720, 520, 30, '#8a1c12');
  P.vtext(g, '武汉三镇图', 1470, 120, 54, '#2a2420', 1.2); P.seal(g, 1446, 440, 40, '江城'); P.frame(g, w, h);
});
PIC.yingwu = IC.picScroll(function (g, w, h) {                   // 鹦鹉洲：芳草萋萋，洲上一只绿鹦鹉
  g.fillStyle = 'rgba(110,150,160,.3)'; g.fillRect(0, 560, w, 300); P.ripples(g, 0, w, 570, 850, 90, 3);
  g.fillStyle = 'rgba(90,130,70,.85)'; g.beginPath(); g.ellipse(250, 620, 220, 40, 0, 0, 7); g.fill();
  g.strokeStyle = 'rgba(70,110,50,.9)'; g.lineWidth = 2; for (let i = 0; i < 120; i++) { const x = 50 + i * 3.4, y = 610; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 4, y - 30, x + 8 - (i % 5) * 3, y - 50 - (i % 7) * 6); g.stroke(); }
  g.save(); g.translate(260, 420); g.fillStyle = '#3e9a4a'; g.beginPath(); g.ellipse(0, 0, 34, 60, 0.2, 0, 7); g.fill(); g.fillStyle = '#2f7a3a'; g.beginPath(); g.moveTo(-10, 40); g.lineTo(-30, 150); g.lineTo(10, 50); g.fill();
  g.fillStyle = '#e8c44a'; g.beginPath(); g.arc(8, -56, 22, 0, 7); g.fill(); g.fillStyle = '#c23a1a'; g.beginPath(); g.moveTo(26, -58); g.quadraticCurveTo(46, -50, 30, -38); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(14, -62, 4, 0, 7); g.fill(); g.restore();
  g.strokeStyle = 'rgba(60,40,20,.9)'; g.lineWidth = 6; g.beginPath(); g.moveTo(170, 488); g.lineTo(360, 470); g.stroke();
  P.vtext(g, '芳草萋萋鹦鹉洲', 450, 80, 54, '#221e1a', 1.12); P.seal(g, 60, 900, 40, '洲');
}, 61);

/* ---- 禹稷行宫 ---- */
PIC.yu = IC.landscapeTex({ title: '大禹治水图', seal: '禹', seed: 19, hy: 420, waterCol: 'rgba(110,130,140,.35)',
  extra: function (g, w, h) {
    for (let i = 0; i < 9; i++) { g.strokeStyle = 'rgba(245,245,240,.7)'; g.lineWidth = 3; const x = 120 + i * 120, y = 640 + Math.sin(i) * 30; g.beginPath(); g.moveTo(x - 50, y + 20); g.quadraticCurveTo(x, y - 40, x + 50, y + 10); g.stroke(); }
    P.drawFigure(g, 760, 760, 210, ['#7a6a4e', '#4e4232'], { beard: true });
    g.strokeStyle = '#3a2a1a'; g.lineWidth = 8; g.beginPath(); g.moveTo(840, 760); g.lineTo(880, 420); g.stroke(); g.fillStyle = '#5a4a3a'; g.fillRect(860, 400, 44, 26);
    for (let i = 0; i < 6; i++) P.drawFigure(g, 330 + i * 70, 800, 80, ['#8a7a5e', '#5a4c3a'], {});
  } });
PIC.yuScreen = IC.textScreen([['禹功矶', '汉阳龟山'], ['上古之时', '洪水滔天'], ['大禹带领百姓'], ['疏通江河'], ['导水入海'], ['三过家门而不入'], ['后人纪念他'], ['名此矶为禹功']]);
PIC.yuScroll = IC.poetScroll('禹功矶', ['#5c665b'], '疏川导水', '因势利导', 71);

/* ============================== 搭三处室内 ============================== */
function lantern4(ax, az) { return [[-ax * 0.5, az * 0.35], [ax * 0.5, az * 0.35], [-ax * 0.5, -az * 0.5], [ax * 0.5, -az * 0.5]]; }
// 一楼
(function () {
  const Pw = offsetPoly(rect(AX[0], AZ[0]), -VW[0] - 0.07), ax = AX[0] - VW[0], az = AZ[0] - VW[0];
  const f = IC.floor({ P: Pw, y0: 0, H: 4.3, cols: [[-3.6, -2.2], [3.6, -2.2], [-3.6, 2.2], [3.6, 2.2]], colR: 0.36, lanterns: lantern4(ax, az), drop: 0.7, ty: 2.5 });
  IC.framed(f.grp, PIC.cui, 6.2, 2.74, 0, 2.5, f.zb, 0, { glow: 0.55 });
  IC.framed(f.grp, PIC.qingchuan, 3.4, 2.0, -ax + 0.25, 2.4, -0.6, Math.PI / 2, { glow: 0.5 });
  IC.hangScroll(f.grp, PIC.cuiScroll, 1.0, 2.0, ax - 0.25, 2.4, -0.6, -Math.PI / 2);
  IC.couplets(f.grp, '晴川历历汉阳树', '芳草萋萋鹦鹉洲', 3.2, -3.6, 3.6, 2.3, 2.2 + 0.4);
  IC.table(f.grp, 3.0, 1.0, 0, 0, f.zb + 1.4);
})();
// 二楼
(function () {
  const Pw = offsetPoly(rect(AX[1], AZ[1]), -VW[1] - 0.07), ax = AX[1] - VW[1], az = AZ[1] - VW[1], y0 = Y[1];
  const f = IC.floor({ P: Pw, y0, H: 4.6, cols: [[-2.8, -1.8], [2.8, -1.8], [-2.8, 1.8], [2.8, 1.8]], colR: 0.32, lanterns: lantern4(ax, az), drop: 0.7, ty: 2.4 });
  IC.framed(f.grp, PIC.li, 4.8, 2.6, 0, y0 + 2.35, f.zb, 0, { glow: 0.55 });
  IC.framed(f.grp, PIC.sanzhen, 3.0, 1.76, -ax + 0.25, y0 + 2.3, -0.3, Math.PI / 2, { glow: 0.5 });
  IC.hangScroll(f.grp, PIC.yingwu, 0.95, 1.9, ax - 0.25, y0 + 2.4, -1.2, -Math.PI / 2);
  IC.hangScroll(f.grp, PIC.libai, 0.95, 1.9, ax - 0.25, y0 + 2.4, 1.0, -Math.PI / 2);
})();
// 禹稷行宫
(function () {
  const ox = XG.x, oz = XG.z, y0 = XG.y - TY, Pw = offsetPoly(rect(XG.ax, XG.az), -XG.vw - 0.07).map(p => [p[0] + ox, p[1] + oz]), ax = XG.ax - XG.vw, az = XG.az - XG.vw;
  const f = IC.floor({ P: Pw, y0, H: 4.0, cols: [[ox - 3.2, oz - 1.6], [ox + 3.2, oz - 1.6]], colR: 0.32, lanterns: [[ox - 3, oz + 1.5], [ox + 3, oz + 1.5]], drop: 0.6,
    eye: { pos: [ox, y0 + 1.7, oz + az * 0.75], target: [ox, y0 + 2.3, oz - az] } });
  IC.framed(f.grp, PIC.yu, 5.2, 3.05, ox, y0 + 2.25, f.zb, 0, { glow: 0.55 });
  IC.panelScreen(f.grp, PIC.yuScreen, 8, 0.48, 2.2, ox - ax + 0.5, y0 + 1.75, oz, Math.PI / 2);
  IC.hangScroll(f.grp, PIC.yuScroll, 0.95, 1.9, ox + ax - 0.25, y0 + 2.3, oz, -Math.PI / 2);
  IC.table(f.grp, 2.4, 0.9, ox, y0, f.zb + 1.3);
})();
IC.finish(PIC);
})();
