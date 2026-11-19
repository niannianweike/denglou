/* 太白楼 · 室内：一层“谪仙”李白像与《将进酒》；二层《望天门山》《夜泊牛渚怀古》；三层捉月与《月下独酌》
 * 字画都是用代码画出来的示意，不是实物照片 */
(function () {
'use strict';
const H = window.HHL, IC = H.ic, P = IC.paint;
const { offsetPoly } = H;
const { AX, AZ, Y, VW, MZ, TY, rect } = H.tower;
IC.init({ ceil: 'ming' });
const PIC = {};

PIC.portrait = IC.picScroll(function (g, w, h) {                 // 李白像：白衣、长须、仰头举杯
  P.ridge(g, w, { y: 800, amp: 200, freq: 0.006, seed: 3, col: P.QING, a: 0.24, fade: 150, blur: 5 }); P.mist(g, 256, 790, 260, 30, 0.7, 16);
  P.moon(g, 380, 170, 46);
  P.drawFigure(g, 230, 930, 300, ['#f2eee2', '#c8c0ae'], { beard: true, cup: true });
  P.vtext(g, '谪仙人', 450, 360, 58, '#221e1a', 1.15); P.seal(g, 60, 70, 46, '太白');
}, 3);
PIC.jiang = IC.poemSheet('将进酒', '唐 李白', ['君不见黄河之水天上来', '奔流到海不复回', '君不见高堂明镜悲白发', '朝如青丝暮成雪', '人生得意须尽欢', '莫使金樽空对月', '天生我材必有用', '千金散尽还复来'], { seal: '太白', seed: 41 });
PIC.he = IC.poetScroll('知章', ['#5e5a72', '#3e3a52'], '呼为谪仙人', '金龟换酒乐', 31, { beard: true, wings: true });

PIC.tianmen = IC.landscapeTex({ title: '天门山图', seal: '天门', seed: 13, hy: 340, boats: [[760, 520, 1.6]], sun: [770, 420, 48],
  extra: function (g, w, h) { P.ridge(g, 620, { y: 720, amp: 380, freq: 0.01, seed: 41, col: P.LV, a: 0.75, fade: 20, blur: 1, rough: 120, trees: 30 }); g.save(); g.translate(w, 0); g.scale(-1, 1); P.ridge(g, 620, { y: 720, amp: 360, freq: 0.01, seed: 47, col: P.LV, a: 0.75, fade: 20, blur: 1, rough: 120, trees: 30 }); g.restore(); } });
PIC.tianmenPoem = IC.poemSheet('望天门山', '唐 李白', ['天门中断楚江开', '碧水东流至此回', '两岸青山相对出', '孤帆一片日边来'], { seal: '太白', seed: 43 });
PIC.niuzhu = IC.poetScroll('太白', ['#e8e2d0', '#b8b0a0'], '登舟望秋月', '空忆谢将军', 47, { beard: true });

PIC.zhuoyue = IC.landscapeTex({ title: '捉月图', seal: '捉月', seed: 23, hy: 420, moon: [1100, 170, 54], c1: '#d6d0bc', c2: '#b0a68a', waterCol: 'rgba(60,80,100,.35)',
  extra: function (g, w, h) {
    g.fillStyle = 'rgba(250,244,220,.7)'; g.beginPath(); g.ellipse(700, 700, 60, 18, 0, 0, 7); g.fill();       // 水中月
    P.boat(g, 620, 640, 3.4, false); P.drawFigure(g, 600, 640, 120, ['#f2eee2', '#c8c0ae'], { beard: true });
    g.strokeStyle = 'rgba(40,36,30,.8)'; g.lineWidth = 6; g.beginPath(); g.moveTo(640, 560); g.quadraticCurveTo(680, 620, 690, 690); g.stroke();
    g.fillStyle = 'rgba(70,90,120,.55)'; g.beginPath(); g.moveTo(200, 860); g.quadraticCurveTo(340, 760, 520, 820); g.quadraticCurveTo(420, 800, 360, 860); g.fill();   // 鲸鱼的脊背
  } });
PIC.duzhuo = IC.poemSheet('月下独酌', '唐 李白', ['花间一壶酒', '独酌无相亲', '举杯邀明月', '对影成三人'], { seal: '太白', seed: 53 });
PIC.ye = IC.poetScroll('太白', ['#e8e2d0', '#b8b0a0'], '小时不识月', '呼作白玉盘', 59, { beard: true });

/* ============================== 搭三层（楼体在 z = MZ，视点要换成世界坐标） ============================== */
const lantern4 = (ax, az) => [[-ax * 0.5, az * 0.35], [ax * 0.5, az * 0.35], [-ax * 0.5, -az * 0.5], [ax * 0.5, -az * 0.5]];
function room(k, H0, cols, ty) {
  const ax = AX[k] - VW[k], az = AZ[k] - VW[k];
  const f = IC.floor({ P: offsetPoly(rect(AX[k], AZ[k]), -VW[k] - 0.07), y0: Y[k], H: H0, cols, colR: 0.32, lanterns: lantern4(ax, az), drop: 0.6, eye: { pos: [0, Y[k] + 1.7, MZ + az * 0.78], target: [0, Y[k] + (ty || 2.3), MZ - az + 0.45] } });
  return Object.assign(f, { ax, az });
}
(function () {
  const f = room(0, 4.0, [[-3.2, -2.0], [3.2, -2.0], [-3.2, 2.0], [3.2, 2.0]]);
  IC.hangScroll(f.grp, PIC.portrait, 1.25, 2.5, 0, 2.3, f.zb, 0);
  IC.framed(f.grp, PIC.jiang, 3.6, 1.59, -f.ax + 0.25, 2.3, 0, Math.PI / 2, { glow: 0.55 });
  IC.hangScroll(f.grp, PIC.he, 0.95, 1.9, f.ax - 0.25, 2.3, 0, -Math.PI / 2);
  IC.couplets(f.grp, '诗中无敌', '酒里称仙', 2.8, -3.2, 3.2, 2.1, 2.0 + 0.4);
  IC.table(f.grp, 2.4, 0.9, 0, 0, f.zb + 1.3);
})();
(function () {
  const f = room(1, 3.8, [[-2.6, -1.6], [2.6, -1.6], [-2.6, 1.6], [2.6, 1.6]]), y0 = Y[1];
  IC.framed(f.grp, PIC.tianmen, 4.0, 2.34, 0, y0 + 2.15, f.zb, 0, { glow: 0.55 });
  IC.framed(f.grp, PIC.tianmenPoem, 3.2, 1.9, -f.ax + 0.25, y0 + 2.1, 0, Math.PI / 2, { glow: 0.55 });
  IC.hangScroll(f.grp, PIC.niuzhu, 0.9, 1.8, f.ax - 0.25, y0 + 2.1, 0, -Math.PI / 2);
})();
(function () {
  const f = room(2, 3.6, [[-2.0, -1.2], [2.0, -1.2], [-2.0, 1.2], [2.0, 1.2]]), y0 = Y[2];
  IC.framed(f.grp, PIC.zhuoyue, 3.6, 2.1, 0, y0 + 2.0, f.zb, 0, { glow: 0.55 });
  IC.framed(f.grp, PIC.duzhuo, 2.9, 1.72, -f.ax + 0.25, y0 + 2.0, 0, Math.PI / 2, { glow: 0.55 });
  IC.hangScroll(f.grp, PIC.ye, 0.85, 1.7, f.ax - 0.25, y0 + 2.0, 0, -Math.PI / 2);
})();
IC.finish(PIC);
})();
