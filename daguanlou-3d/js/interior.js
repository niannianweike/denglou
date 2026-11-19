/* 大观楼 · 室内：一层孙髯翁像与长联上联的四方景物；二层下联的云南历史；三层“最美的结尾”与滇池全图
 * 字画都是用代码画出来的示意，不是实物照片 */
(function () {
'use strict';
const H = window.HHL, IC = H.ic, P = IC.paint;
const { offsetPoly, canvasTex } = H;
const { AX, AZ, Y, VW, rect } = H.tower;
IC.init({ ceil: 'ming' });
const PIC = {};

PIC.sun = IC.poetScroll('髯翁', ['#6a6a5a', '#44443a'], '五百里滇池', '奔来眼底', 31, { beard: true });
PIC.sifang = canvasTex(1536, 900, function (g, w, h) {           // 上联里的四方之山：东边金马、西边碧鸡、北边长虫、南边白鹤
  P.paper(g, w, h, '#ece4cc', '#d9c8a0', 21);
  g.fillStyle = 'rgba(110,160,180,.4)'; g.beginPath(); g.ellipse(760, 470, 380, 260, 0, 0, 7); g.fill(); P.ripples(g, 420, 1100, 260, 700, 200, 5); P.htext(g, '滇池', 760, 480, 60, 'rgba(250,250,245,.95)');
  const quad = [[1280, 440, '东骧神骏', '金马山'], [240, 440, '西翥灵仪', '碧鸡山'], [760, 66, '北走蜿蜒', '长虫山'], [760, 704, '南翔缟素', '白鹤山']];
  for (const [x, y, verse, mountain] of quad) {
    g.fillStyle = 'rgba(57,79,66,.84)';
    g.beginPath();
    g.moveTo(x - 109, y + 38);
    g.bezierCurveTo(x - 70, y + 27, x - 63, y + 10, x - 43, y + 8);
    g.quadraticCurveTo(x - 24, y + 4, x + 5, y - 22);
    g.quadraticCurveTo(x + 37, y + 7, x + 105, y + 38);
    g.closePath();
    g.fill();
    P.htext(g, verse, x, y + 72, 36, '#2a2420');
    P.htext(g, mountain, x, y + 109, 26, '#842d24');
  }
  P.vtext(g, '滇池四山图', 1470, 110, 52, '#2a2420', 1.2); P.seal(g, 1446, 420, 40, '大观'); P.frame(g, w, h);
});
PIC.shang = IC.textScreen([['上联', '九十字'], ['五百里滇池', '奔来眼底'], ['披襟岸帻', '喜茫茫空阔无边'], ['看东骧神骏', '西翥灵仪'], ['北走蜿蜒', '南翔缟素'], ['高人韵士', '何妨选胜登临'], ['趁蟹屿螺洲', '梳裹就风鬟雾鬓'], ['更苹天苇地', '点缀些翠羽丹霞'], ['莫辜负四围香稻', '万顷晴沙'], ['九夏芙蓉', '三春杨柳']], '#152b51');

PIC.xia = IC.textScreen([['下联', '九十字'], ['数千年往事', '注到心头'], ['把酒凌虚', '叹滚滚英雄谁在'], ['想汉习楼船', '唐标铁柱'], ['宋挥玉斧', '元跨革囊'], ['伟烈丰功', '费尽移山心力'], ['尽珠帘画栋', '卷不及暮雨朝云'], ['便断碣残碑', '都付与苍烟落照'], ['只赢得几杵疏钟', '半江渔火'], ['两行秋雁', '一枕清霜']], '#152b51');
PIC.lishi = IC.landscapeTex({ title: '滇池怀古', seal: '千年', seed: 17, hy: 420, boats: [[400, 640, 1.8], [620, 700, 1.4], [860, 660, 1.6]],
  extra: function (g, w, h) { g.fillStyle = 'rgba(60,50,40,.85)'; g.fillRect(1180, 380, 22, 300); g.fillStyle = 'rgba(80,70,60,.85)'; g.fillRect(1150, 360, 82, 28); P.htext(g, '铁柱', 1191, 720, 30, '#3a2e22'); } });

PIC.jiewei = IC.poemSheet('大观楼长联 结尾', '清 孙髯翁', ['莫辜负', '四围香稻', '万顷晴沙', '九夏芙蓉', '三春杨柳', '只赢得', '几杵疏钟', '半江渔火', '两行秋雁', '一枕清霜'], { seal: '髯翁', seed: 41 });
PIC.dianchi = IC.landscapeTex({ title: '五百里滇池', seal: '滇池', seed: 9, hy: 360, sun: [300, 200, 44], boats: [[700, 620, 1.4], [1000, 700, 1.2]],
  extra: function (g, w, h) { g.save(); g.translate(400, 0); P.ridge(g, 1000, { y: 520, amp: 200, freq: 0.004, seed: 41, col: P.LV, a: 0.6, fade: 30, blur: 2, rough: 80, trees: 20 }); g.restore(); P.htext(g, '睡美人', 900, 300, 30, '#3a2e22'); for (const [x, y] of [[500, 250], [540, 230], [580, 245], [620, 220]]) { g.fillStyle = '#f8f8f6'; g.beginPath(); g.ellipse(x, y, 14, 4, 0, 0, 7); g.fill(); g.fillStyle = '#c02a1a'; g.fillRect(x + 12, y - 1, 6, 2); } } });

const lantern4 = (ax, az) => [[-ax * 0.5, az * 0.35], [ax * 0.5, az * 0.35], [-ax * 0.5, -az * 0.5], [ax * 0.5, -az * 0.5]];
function room(k, H0, cols) { const ax = AX[k] - VW[k], az = AZ[k] - VW[k]; return Object.assign(IC.floor({ P: offsetPoly(rect(AX[k], AZ[k]), -VW[k] - 0.07), y0: Y[k], H: H0, cols, colR: 0.3, lanterns: lantern4(ax, az), drop: 0.6, ty: 2.3 }), { ax, az }); }
(function () {
  const f = room(0, 4.0, [[-3.0, -2.0], [3.0, -2.0], [-3.0, 1.6], [3.0, 1.6]]);
  IC.panelScreen(f.grp, PIC.shang, 10, 0.56, 2.6, 0, 2.0, f.zb + 0.1);
  IC.framed(f.grp, PIC.sifang, 3.4, 2.0, -f.ax + 0.25, 2.2, 0, Math.PI / 2, { glow: 0.5 });
  IC.hangScroll(f.grp, PIC.sun, 0.95, 1.9, f.ax - 0.25, 2.2, 0, -Math.PI / 2);
})();
(function () {
  const f = room(1, 3.9, [[-2.6, -1.6], [2.6, -1.6], [-2.6, 1.6], [2.6, 1.6]]), y0 = Y[1];
  IC.panelScreen(f.grp, PIC.xia, 10, 0.48, 2.4, 0, y0 + 1.9, f.zb + 0.1);
  IC.framed(f.grp, PIC.lishi, 3.0, 1.76, -f.ax + 0.25, y0 + 2.1, 0, Math.PI / 2, { glow: 0.5 });
})();
(function () {
  const f = room(2, 3.6, [[-2.0, -1.2], [2.0, -1.2], [-2.0, 1.2], [2.0, 1.2]]), y0 = Y[2];
  IC.framed(f.grp, PIC.dianchi, 3.4, 2.0, 0, y0 + 2.0, f.zb, 0, { glow: 0.55 });
  IC.framed(f.grp, PIC.jiewei, 3.0, 1.24, -f.ax + 0.25, y0 + 2.0, 0, Math.PI / 2, { glow: 0.55 });
})();
IC.finish(PIC);
})();
