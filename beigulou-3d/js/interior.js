/* 北固楼 · 室内：一层辛弃疾《南乡子》与“京口三山图”；二层《永遇乐·京口北固亭怀古》与孙权像；甘露寺里刘备招亲
 * 字画都是用代码画出来的示意，不是实物照片 */
(function () {
'use strict';
const H = window.HHL, IC = H.ic, P = IC.paint;
const { offsetPoly } = H;
const { AX, AZ, Y, VW, TY, GL, rect } = H.tower;
IC.init({ ceil: 'ming' });
const PIC = {};

PIC.nanxiang = IC.poemSheet('南乡子 登京口北固亭有怀', '宋 辛弃疾', ['何处望神州', '满眼风光北固楼', '千古兴亡多少事', '悠悠', '不尽长江滚滚流', '年少万兜鍪', '坐断东南战未休', '天下英雄谁敌手', '曹刘', '生子当如孙仲谋'], { seal: '稼轩', seed: 41 });
PIC.sanshan = IC.landscapeTex({ title: '京口三山图', seal: '三山', seed: 11, hy: 420, boats: [[600, 640, 1.4], [980, 700, 1.2]],
  extra: function (g, w, h) {
    P.ridge(g, 380, { y: 620, amp: 160, freq: 0.02, seed: 21, col: P.LV, a: 0.75, fade: 10, blur: 1, rough: 60, trees: 20 }); P.drawTower(g, 190, 470, 26, 7, '#e8e2d0'); P.htext(g, '金山', 190, 660, 34, '#3a2e22');
    g.save(); g.translate(560, 0); P.ridge(g, 300, { y: 620, amp: 230, freq: 0.02, seed: 27, col: P.LV, a: 0.8, fade: 10, blur: 1, rough: 60, trees: 20 }); g.restore(); P.drawTower(g, 710, 400, 30, 2); P.htext(g, '北固山', 710, 660, 34, '#3a2e22');
    g.save(); g.translate(1000, 0); P.ridge(g, 380, { y: 640, amp: 190, freq: 0.018, seed: 33, col: P.LV, a: 0.75, fade: 10, blur: 1, rough: 60, trees: 26 }); g.restore(); P.htext(g, '焦山', 1190, 680, 34, '#3a2e22');
  } });
PIC.xin = IC.poetScroll('稼轩', ['#5a5a4a', '#3a3a2e'], '何处望神州', '满眼风光北固楼', 31, { beard: true, wings: true });

PIC.yongyu = IC.poemSheet('永遇乐 京口北固亭怀古', '宋 辛弃疾', ['千古江山', '英雄无觅孙仲谋处', '舞榭歌台', '风流总被雨打风吹去', '斜阳草树', '寻常巷陌', '人道寄奴曾住', '想当年金戈铁马', '气吞万里如虎'], { seal: '稼轩', seed: 43 });
PIC.sunquan = IC.poetScroll('仲谋', ['#7a2a1a', '#4e1a10'], '坐断东南', '生子当如孙仲谋', 47, { beard: true });
PIC.diyi = IC.picScroll(function (g, w, h) { P.vtext(g, '天下第一江山', w / 2, 120, 118, '#1e1a16', 1.08); P.vtext(g, '梁武帝', 70, 760, 36, '#8a1c12', 1.2); P.seal(g, 50, 900, 40, '萧衍'); }, 51);

PIC.zhaoqin = IC.landscapeTex({ title: '甘露寺招亲', seal: '甘露', seed: 19, water: false, hy: 300,
  extra: function (g, w, h) {
    g.fillStyle = 'rgba(120,40,24,.85)'; g.fillRect(200, 420, 1100, 30); g.fillStyle = 'rgba(70,70,74,.85)'; g.beginPath(); g.moveTo(160, 430); g.lineTo(750, 300); g.lineTo(1340, 430); g.fill();
    for (let i = 0; i < 6; i++) { g.fillStyle = '#8a2418'; g.fillRect(260 + i * 190, 450, 18, 330); }
    P.drawFigure(g, 520, 820, 200, ['#4a5a7a', '#2e3a54'], { beard: true });                 // 刘备
    P.drawFigure(g, 860, 820, 190, ['#8a4a5a', '#5a2e3a'], { woman: true });                // 吴国太
    P.drawFigure(g, 1100, 820, 170, ['#7a2a1a', '#4e1a10'], { beard: true });               // 孙权
    P.drawFigure(g, 300, 820, 160, ['#3e5a3e', '#2a3a2a'], { beard: true });                // 赵云
    for (const [x, t] of [[520, '刘备'], [860, '吴国太'], [1100, '孙权'], [300, '赵云']]) P.htext(g, t, x, 860, 30, '#3a2e22');
  } });
PIC.shijian = IC.picScroll(function (g, w, h) {                  // 试剑石：刘备、孙权各劈一剑，石头裂成十字
  P.ridge(g, w, { y: 800, amp: 160, freq: 0.006, seed: 9, col: P.QING, a: 0.2, fade: 150, blur: 5 });
  g.fillStyle = 'rgba(110,104,96,.95)'; g.beginPath(); g.ellipse(256, 640, 170, 110, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(30,26,22,.9)'; g.lineWidth = 8; g.beginPath(); g.moveTo(140, 640); g.lineTo(380, 650); g.moveTo(256, 540); g.lineTo(250, 740); g.stroke();
  P.vtext(g, '试剑石', 450, 120, 64, '#221e1a', 1.15); P.seal(g, 60, 70, 46, '剑');
}, 57);

/* ============================== 搭三处：北固楼一层、二层，甘露寺 ============================== */
const lantern4 = (ax, az) => [[-ax * 0.5, az * 0.35], [ax * 0.5, az * 0.35], [-ax * 0.5, -az * 0.5], [ax * 0.5, -az * 0.5]];
(function () {
  const ax = AX[0] - VW[0], az = AZ[0] - VW[0], f = IC.floor({ P: offsetPoly(rect(AX[0], AZ[0]), -VW[0] - 0.07), y0: 0, H: 4.3, cols: [[-3.0, -2.0], [3.0, -2.0], [-3.0, 2.0], [3.0, 2.0]], colR: 0.34, lanterns: lantern4(ax, az), drop: 0.7, ty: 2.4 });
  IC.framed(f.grp, PIC.nanxiang, 6.0, 2.72, 0, 2.45, f.zb, 0, { glow: 0.55 });
  IC.framed(f.grp, PIC.sanshan, 3.4, 2.0, -ax + 0.25, 2.4, 0, Math.PI / 2, { glow: 0.5 });
  IC.hangScroll(f.grp, PIC.xin, 1.0, 2.0, ax - 0.25, 2.4, 0, -Math.PI / 2);
  IC.couplets(f.grp, '何处望神州', '满眼风光北固楼', 3.0, -3.0, 3.0, 2.2, 2.0 + 0.42);
})();
(function () {
  const ax = AX[1] - VW[1], az = AZ[1] - VW[1], y0 = Y[1], f = IC.floor({ P: offsetPoly(rect(AX[1], AZ[1]), -VW[1] - 0.07), y0, H: 4.0, cols: [[-2.4, -1.5], [2.4, -1.5], [-2.4, 1.5], [2.4, 1.5]], colR: 0.3, lanterns: lantern4(ax, az), drop: 0.6, ty: 2.3 });
  IC.framed(f.grp, PIC.yongyu, 4.4, 2.0, 0, y0 + 2.2, f.zb, 0, { glow: 0.55 });
  IC.hangScroll(f.grp, PIC.sunquan, 0.9, 1.8, -ax + 0.25, y0 + 2.1, 0, Math.PI / 2);
  IC.hangScroll(f.grp, PIC.diyi, 0.9, 1.8, ax - 0.25, y0 + 2.1, 0, -Math.PI / 2);
})();
(function () {
  const ox = GL.x, oz = GL.z, y0 = GL.y + 1.0 - TY, Pw = offsetPoly(rect(GL.ax, GL.az), -GL.vw - 0.07).map(p => [p[0] + ox, p[1] + oz]), ax = GL.ax - GL.vw, az = GL.az - GL.vw;
  const f = IC.floor({ P: Pw, y0, H: 4.0, cols: [[ox - 3.4, oz - 1.6], [ox + 3.4, oz - 1.6]], colR: 0.32, lanterns: [[ox - 3, oz + 1.5], [ox + 3, oz + 1.5]], drop: 0.6, eye: { pos: [ox, y0 + 1.7, oz + az * 0.75], target: [ox, y0 + 2.3, oz - az] } });
  IC.framed(f.grp, PIC.zhaoqin, 5.0, 2.93, ox, y0 + 2.25, f.zb, 0, { glow: 0.55 });
  IC.hangScroll(f.grp, PIC.shijian, 0.95, 1.9, ox - ax + 0.25, y0 + 2.2, oz, Math.PI / 2);
  IC.table(f.grp, 2.4, 0.9, ox, y0, f.zb + 1.3);
})();
IC.finish(PIC);
})();
