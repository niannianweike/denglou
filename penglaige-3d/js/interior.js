/* 蓬莱阁 · 室内：一层八仙过海图；二层苏轼《海市》诗与“蓬莱仙境”；天后宫里的妈祖与戚继光
 * 字画都是用代码画出来的示意，不是实物照片 */
(function () {
'use strict';
const H = window.HHL, IC = H.ic, P = IC.paint;
const { offsetPoly } = H;
const { AX, AZ, Y, VW, TY, TH, rect } = H.tower;
IC.init({ ceil: 'ming' });
const PIC = {};

PIC.baxian = IC.landscapeTex({ title: '八仙过海', seal: '八仙', seed: 23, hy: 300, c1: '#e6e0cc', c2: '#cfc4a4', waterCol: 'rgba(80,130,150,.35)',
  extra: function (g, w, h) {
    for (let i = 0; i < 14; i++) { g.strokeStyle = 'rgba(245,245,240,.75)'; g.lineWidth = 4; const x = 60 + i * 100, y = 520 + Math.sin(i * 1.3) * 40; g.beginPath(); g.moveTo(x - 50, y + 20); g.quadraticCurveTo(x, y - 40, x + 50, y + 10); g.stroke(); }
    const robes = [['#7a6a52', '#4e4232'], ['#e8a0a8', '#b8707a'], ['#4e6a8a', '#2e4a6a'], ['#8a3a2a', '#5a2418'], ['#4e7a4e', '#2e4a2e'], ['#c8a040', '#8a6a20'], ['#6a5a8a', '#4a3a6a'], ['#e8e2d0', '#b8b0a0']];
    const names = ['铁拐李', '何仙姑', '韩湘子', '汉钟离', '张果老', '吕洞宾', '曹国舅', '蓝采和'];
    robes.forEach((rb, i) => { const x = 130 + i * 165, y = 700 + (i % 2) * 40; g.fillStyle = 'rgba(110,80,40,.75)'; g.beginPath(); g.ellipse(x, y + 4, 60, 12, 0, 0, 7); g.fill(); P.drawFigure(g, x, y, 110, rb, { woman: i === 1, beard: i === 0 || i === 3 || i === 4 }); P.htext(g, names[i], x, y + 50, 26, '#3a2e22'); });
    P.drawTower(g, 1300, 300, 60, 2, '#6a6e74');
  } });
PIC.baxianScroll = IC.picScroll(function (g, w, h) { P.vtext(g, '八仙过海', w / 2 + 70, 140, 100, '#1e1a16', 1.1); P.vtext(g, '各显神通', w / 2 - 70, 240, 100, '#1e1a16', 1.1); P.seal(g, 60, 880, 44, '蓬莱'); }, 51);

PIC.haishi = IC.poemSheet('海市', '宋 苏轼', ['东方云海空复空', '群仙出没空明中', '荡摇浮世生万象', '岂有贝阙藏珠宫'], { seal: '东坡', seed: 41 });
PIC.xianjing = IC.landscapeTex({ title: '海市蜃楼', seal: '仙境', seed: 13, hy: 520, c1: '#e8ecf0', c2: '#cdd6dc', waterCol: 'rgba(90,140,170,.3)',
  extra: function (g, w, h) {
    const r = H.rng(5); for (let i = 0; i < 40; i++) { const x = 100 + r() * 1300, bw = 20 + r() * 50, bh = 40 + r() * 140; g.fillStyle = 'rgba(160,176,190,' + (0.3 + r() * 0.3) + ')'; g.fillRect(x, 470 - bh, bw, bh); if (r() < 0.5) { g.beginPath(); g.moveTo(x - 10, 470 - bh); g.lineTo(x + bw / 2, 440 - bh); g.lineTo(x + bw + 10, 470 - bh); g.fill(); } }
    P.mist(g, 760, 480, 760, 30, 0.8, 16);
  } });
PIC.sushi = IC.poetScroll('东坡', ['#5a6a7a', '#3a4654'], '东方云海空复空', '群仙出没空明中', 31, { beard: true });

PIC.mazu = IC.poetScroll('妈祖信俗', ['#805445'], '海上祈安', '舟行望归', 61);
PIC.qi = IC.poemSheet('韬钤深处', '明 戚继光', ['小筑暂高枕', '忧时旧有盟', '呼樽来揖客', '挥麈坐谈兵', '云护牙签满', '星含宝剑横', '封侯非我意', '但愿海波平'], { seal: '元敬', seed: 53 });
PIC.qiScroll = IC.poetScroll('继光', ['#5a4a3a', '#3a2e22'], '封侯非我意', '但愿海波平', 67, { beard: true });

const lantern4 = (ax, az) => [[-ax * 0.5, az * 0.35], [ax * 0.5, az * 0.35], [-ax * 0.5, -az * 0.5], [ax * 0.5, -az * 0.5]];
(function () {
  const ax = AX[0] - VW[0], az = AZ[0] - VW[0], f = IC.floor({ P: offsetPoly(rect(AX[0], AZ[0]), -VW[0] - 0.07), y0: 0, H: 4.4, cols: [[-2.8, -1.4], [2.8, -1.4], [-2.8, 1.4], [2.8, 1.4]], colR: 0.3, lanterns: lantern4(ax, az), drop: 0.7, ty: 2.4 });
  IC.framed(f.grp, PIC.baxian, 4.6, 2.7, 0, 2.4, f.zb, 0, { glow: 0.55 });
  IC.hangScroll(f.grp, PIC.baxianScroll, 0.9, 1.8, -ax + 0.25, 2.3, 0, Math.PI / 2);
  IC.couplets(f.grp, '东方云海空复空', '群仙出没空明中', 3.0, -2.8, 2.8, 2.3, 1.4 + 0.4);
})();
(function () {
  const ax = AX[1] - VW[1], az = AZ[1] - VW[1], y0 = Y[1], f = IC.floor({ P: offsetPoly(rect(AX[1], AZ[1]), -VW[1] - 0.07), y0, H: 3.9, cols: [[-2.2, -1.0], [2.2, -1.0], [-2.2, 1.0], [2.2, 1.0]], colR: 0.26, lanterns: lantern4(ax, az), drop: 0.6, ty: 2.2 });
  IC.framed(f.grp, PIC.xianjing, 3.8, 2.23, 0, y0 + 2.1, f.zb, 0, { glow: 0.55 });
  IC.framed(f.grp, PIC.haishi, 2.4, 1.42, -ax + 0.25, y0 + 2.0, 0, Math.PI / 2, { glow: 0.55 });
  IC.hangScroll(f.grp, PIC.sushi, 0.8, 1.6, ax - 0.25, y0 + 2.0, 0, -Math.PI / 2);
})();
(function () {
  const ox = TH.x, oz = TH.z, y0 = TH.y - TY, Pw = offsetPoly(rect(TH.ax, TH.az), -1.07).map(p => [p[0] + ox, p[1] + oz]), ax = TH.ax - 1.0, az = TH.az - 1.0;
  const f = IC.floor({ P: Pw, y0, H: 3.9, cols: [[ox - 3, oz - 1.4], [ox + 3, oz - 1.4]], colR: 0.3, lanterns: [[ox - 2.6, oz + 1.4], [ox + 2.6, oz + 1.4]], drop: 0.5, eye: { pos: [ox, y0 + 1.7, oz + az * 0.75], target: [ox, y0 + 2.2, oz - az] } });
  IC.hangScroll(f.grp, PIC.mazu, 1.2, 2.4, ox, y0 + 2.2, f.zb, 0);
  IC.framed(f.grp, PIC.qi, 3.4, 1.51, ox - ax + 0.25, y0 + 2.1, oz, Math.PI / 2, { glow: 0.55 });
  IC.hangScroll(f.grp, PIC.qiScroll, 0.85, 1.7, ox + ax - 0.25, y0 + 2.1, oz, -Math.PI / 2);
  IC.table(f.grp, 2.4, 0.9, ox, y0, f.zb + 1.3);
})();
IC.finish(PIC);
})();
