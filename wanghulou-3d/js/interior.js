/* 望湖楼 · 室内：一层苏轼《六月二十七日望湖楼醉书》与骤雨图；二层《饮湖上初晴后雨》与西湖全景；平湖秋月里白居易《钱塘湖春行》与西湖十景
 * 字画都是用代码画出来的示意，不是实物照片 */
(function () {
'use strict';
const H = window.HHL, IC = H.ic, P = IC.paint;
const { offsetPoly, canvasTex } = H;
const { AX, AZ, Y, VW, TY, PH2, rect } = H.tower;
IC.init({ ceil: 'ming' });
const PIC = {};

PIC.zuishu = IC.poemSheet('六月二十七日望湖楼醉书', '宋 苏轼', ['黑云翻墨未遮山', '白雨跳珠乱入船', '卷地风来忽吹散', '望湖楼下水如天'], { seal: '东坡', seed: 41 });
PIC.zhouyu = IC.landscapeTex({ title: '望湖楼骤雨', seal: '跳珠', seed: 13, hy: 420, boats: [[700, 640, 1.6]], c1: '#c8c6bc', c2: '#a8a496',
  extra: function (g, w, h) {
    g.save(); g.filter = 'blur(14px)'; g.fillStyle = 'rgba(30,30,34,.85)'; g.beginPath(); g.ellipse(700, 160, 700, 150, 0, 0, 7); g.fill(); g.restore();
    const r = H.rng(4); g.strokeStyle = 'rgba(240,240,236,.55)'; g.lineWidth = 1.6; for (let i = 0; i < 600; i++) { const x = r() * w, y = 200 + r() * 600; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 8, y + 34); g.stroke(); }
    for (let i = 0; i < 80; i++) { const x = 560 + r() * 300, y = 640 + r() * 80; g.fillStyle = 'rgba(250,250,250,.85)'; g.beginPath(); g.arc(x, y, 3 + r() * 3, 0, 7); g.fill(); }   // 跳珠
    P.drawTower(g, 180, 520, 70, 2, '#6a6e74');
  } });
PIC.sushi = IC.poetScroll('东坡', ['#5a6a7a', '#3a4654'], '水光潋滟晴方好', '山色空蒙雨亦奇', 31, { beard: true });

PIC.yinhu = IC.poemSheet('饮湖上初晴后雨', '宋 苏轼', ['水光潋滟晴方好', '山色空蒙雨亦奇', '欲把西湖比西子', '淡妆浓抹总相宜'], { seal: '东坡', seed: 43 });
PIC.xihu = canvasTex(1536, 900, function (g, w, h) {              // 西湖全景图
  P.paper(g, w, h, '#ece4cc', '#d9c8a0', 21);
  P.ridge(g, w, { y: 280, amp: 120, freq: 0.004, seed: 7, col: P.QING, a: 0.35, fade: 60, blur: 3, rough: 120, trees: 30 });
  g.fillStyle = 'rgba(120,170,170,.35)'; g.beginPath(); g.ellipse(760, 520, 640, 300, 0, 0, 7); g.fill(); P.ripples(g, 200, 1300, 300, 800, 300, 5);
  g.strokeStyle = 'rgba(90,120,60,.85)'; g.lineWidth = 14; g.beginPath(); g.moveTo(600, 230); g.lineTo(560, 820); g.stroke(); P.htext(g, '苏堤', 520, 520, 30, '#3a2e22');
  g.beginPath(); g.moveTo(1100, 300); g.lineTo(820, 380); g.stroke(); P.htext(g, '白堤', 980, 310, 30, '#3a2e22');
  g.fillStyle = 'rgba(80,110,60,.85)'; g.beginPath(); g.ellipse(790, 390, 60, 34, 0, 0, 7); g.fill(); P.htext(g, '孤山', 790, 440, 28, '#3a2e22');
  P.drawTower(g, 1120, 240, 18, 7, '#b8a890'); P.htext(g, '保俶塔', 1120, 200, 24, '#8a1c12'); P.drawTower(g, 900, 860, 26, 5, '#9a3a22'); P.htext(g, '雷峰塔', 980, 850, 24, '#8a1c12');
  g.fillStyle = '#b3261a'; g.beginPath(); g.arc(1060, 285, 8, 0, 7); g.fill(); P.htext(g, '望湖楼', 1070, 330, 24, '#b3261a');
  P.vtext(g, '西湖全图', 1470, 110, 54, '#2a2420', 1.2); P.seal(g, 1446, 380, 40, '西子'); P.frame(g, w, h);
});
PIC.xizi = IC.poetScroll('东坡', ['#576465'], '欲把西湖比西子', '淡妆浓抹总相宜', 47);

PIC.chunxing = IC.poemSheet('钱塘湖春行', '唐 白居易', ['孤山寺北贾亭西', '水面初平云脚低', '几处早莺争暖树', '谁家新燕啄春泥', '乱花渐欲迷人眼', '浅草才能没马蹄', '最爱湖东行不足', '绿杨阴里白沙堤'], { seal: '乐天', seed: 53 });
PIC.shijing = IC.textScreen([['西湖十景'], ['苏堤春晓'], ['曲院风荷'], ['平湖秋月'], ['断桥残雪'], ['柳浪闻莺'], ['花港观鱼'], ['雷峰夕照'], ['双峰插云'], ['南屏晚钟'], ['三潭印月']]);

const lantern4 = (ax, az) => [[-ax * 0.5, az * 0.35], [ax * 0.5, az * 0.35], [-ax * 0.5, -az * 0.5], [ax * 0.5, -az * 0.5]];
(function () {
  const ax = AX[0] - VW[0], az = AZ[0] - VW[0], f = IC.floor({ P: offsetPoly(rect(AX[0], AZ[0]), -VW[0] - 0.07), y0: 0, H: 4.2, cols: [[-3.2, -1.6], [3.2, -1.6], [-3.2, 1.6], [3.2, 1.6]], colR: 0.3, lanterns: lantern4(ax, az), drop: 0.7, ty: 2.4 });
  IC.framed(f.grp, PIC.zuishu, 3.4, 2.56, -1.0, 2.35, f.zb, 0, { glow: 0.55 });
  IC.framed(f.grp, PIC.zhouyu, 3.2, 1.88, -ax + 0.25, 2.3, 0, Math.PI / 2, { glow: 0.5 });
  IC.hangScroll(f.grp, PIC.sushi, 1.11, 2.22, 1.78, 2.35, f.zb + 0.14, -0.05);
  IC.couplets(f.grp, '黑云翻墨未遮山', '白雨跳珠乱入船', 3.0, -3.2, 3.2, 2.2, 1.6 + 0.4);
})();
(function () {
  const ax = AX[1] - VW[1], az = AZ[1] - VW[1], y0 = Y[1], f = IC.floor({ P: offsetPoly(rect(AX[1], AZ[1]), -VW[1] - 0.07), y0, H: 3.9, cols: [[-2.6, -1.3], [2.6, -1.3], [-2.6, 1.3], [2.6, 1.3]], colR: 0.26, lanterns: lantern4(ax, az), drop: 0.6, ty: 2.2 });
  IC.framed(f.grp, PIC.xihu, 4.6, 2.7, 0, y0 + 2.1, f.zb, 0, { glow: 0.55 });
  IC.framed(f.grp, PIC.yinhu, 2.8, 1.65, -ax + 0.25, y0 + 2.0, 0, Math.PI / 2, { glow: 0.55 });
  IC.hangScroll(f.grp, PIC.xizi, 0.85, 1.7, ax - 0.25, y0 + 2.0, 0, -Math.PI / 2);
})();
(function () {
  const ox = PH2.x, oz = PH2.z, y0 = PH2.y - TY, Pw = offsetPoly(rect(PH2.ax, PH2.az), -0.97).map(p => [p[0] + ox, p[1] + oz]), ax = PH2.ax - 0.9, az = PH2.az - 0.9;
  const f = IC.floor({ P: Pw, y0, H: 3.6, cols: [], lanterns: [[ox - 2.5, oz], [ox + 2.5, oz]], drop: 0.5, lanternS: 0.9, eye: { pos: [ox, y0 + 1.7, oz + az * 0.75], target: [ox, y0 + 2.0, oz - az] } });
  IC.framed(f.grp, PIC.chunxing, 4.4, 1.95, ox, y0 + 2.0, f.zb, 0, { glow: 0.55 });
  IC.panelScreen(f.grp, PIC.shijing, 11, 0.4, 2.0, ox - ax + 0.4, y0 + 1.6, oz, Math.PI / 2);
})();
IC.finish(PIC);
})();
