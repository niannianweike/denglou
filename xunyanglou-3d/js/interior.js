/* 浔阳楼 · 室内：一层白居易《琵琶行》；二层《水浒传》宋江题诗；顶层望庐山（李白、陶渊明）
 * 字画都是用代码画出来的示意，不是实物照片 */
(function () {
'use strict';
const H = window.HHL, T = THREE, IC = H.ic, P = IC.paint;
const { offsetPoly } = H;
const { AX, AZ, Y, VW, rect } = H.tower;
IC.init({ ceil: 'tang', band: 0x5a1e10, beam: 0x5a1e10 });
const PIC = {};

/* ---- 一层：琵琶行 ---- */
PIC.pipa = IC.poemSheet('琵琶行', '唐 白居易', ['浔阳江头夜送客', '枫叶荻花秋瑟瑟', '主人下马客在船', '举酒欲饮无管弦', '醉不成欢惨将别', '别时茫茫江浸月', '忽闻水上琵琶声', '主人忘归客不发'], { seal: '乐天', seed: 51 });
PIC.night = IC.landscapeTex({ title: '浔阳夜月', seal: '浔阳', seed: 23, hy: 400, moon: [1040, 170, 44], c1: '#d8d2bc', c2: '#b8ae90', waterCol: 'rgba(70,90,110,.3)',
  extra: function (g, w, h) {
    for (let i = 0; i < 70; i++) { const x = 40 + i * 6, y = 860; g.strokeStyle = 'rgba(240,236,226,.8)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 6, y - 60, x + 12 - (i % 5) * 4, y - 100 - (i % 7) * 10); g.stroke(); }   // 荻花
    for (let i = 0; i < 14; i++) { g.fillStyle = 'rgba(180,50,30,.75)'; g.beginPath(); g.arc(1300 + (i % 4) * 40, 640 + (i >> 2) * 30, 22, 0, 7); g.fill(); }   // 枫叶
    g.fillStyle = 'rgba(250,240,200,.5)'; g.fillRect(1020, 420, 40, 420);                              // 江浸月
    P.boat(g, 720, 700, 3.2, false); g.fillStyle = 'rgba(60,46,32,.9)'; g.beginPath(); g.ellipse(700, 660, 70, 40, 0, Math.PI, 0); g.fill();
    P.drawFigure(g, 640, 690, 60, ['#8a5a5a', '#5a3a3a'], { woman: true });
    g.fillStyle = '#7a4a22'; g.beginPath(); g.ellipse(668, 650, 12, 20, -0.5, 0, 7); g.fill(); g.strokeStyle = '#3a2410'; g.lineWidth = 3; g.beginPath(); g.moveTo(660, 640); g.lineTo(690, 600); g.stroke();
    P.drawFigure(g, 380, 860, 110, ['#4e5e6e', '#34404c'], { beard: true });
  } });
PIC.bai = IC.poetScroll('乐天', ['#5a6a5a', '#3a463a'], '同是天涯沦落人', '相逢何必曾相识', 53, { beard: true });

/* ---- 二层：水浒 ---- */
PIC.song = IC.landscapeTex({ title: '浔阳楼题诗', seal: '水浒', seed: 29, water: false, hy: 300,
  extra: function (g, w, h) {
    g.fillStyle = 'rgba(232,226,210,.95)'; g.fillRect(260, 220, 820, 520); g.strokeStyle = 'rgba(120,90,60,.8)'; g.lineWidth = 8; g.strokeRect(260, 220, 820, 520);
    const r = H.rng(5); g.strokeStyle = 'rgba(30,26,22,.85)'; g.lineWidth = 5; g.lineCap = 'round';
    for (let c = 0; c < 9; c++) for (let k = 0; k < 9; k++) { const x = 1020 - c * 80, y = 270 + k * 50; g.beginPath(); g.moveTo(x - 14, y); g.lineTo(x + 14, y + (r() - 0.5) * 10); g.moveTo(x, y - 14); g.lineTo(x + (r() - 0.5) * 8, y + 16); g.stroke(); }
    P.drawFigure(g, 1240, 860, 230, ['#3e4e3e', '#2a342a'], { beard: true });
    g.strokeStyle = '#2a1a10'; g.lineWidth = 7; g.beginPath(); g.moveTo(1150, 600); g.lineTo(1090, 520); g.stroke();
    g.fillStyle = '#6a4a2a'; g.fillRect(1300, 760, 160, 60); g.fillStyle = '#c9a24a'; g.beginPath(); g.ellipse(1340, 752, 18, 8, 0, 0, 7); g.fill();
  } });
PIC.songScreen = IC.textScreen([['宋江题诗', '水浒传'], ['心在山东身在吴'], ['飘蓬江海谩嗟吁'], ['他时若遂凌云志'], ['敢笑黄巢不丈夫']]);
PIC.ming = IC.picScroll(function (g, w, h) { P.vtext(g, '浔阳楼', w / 2, 220, 190, '#1e1a16', 1.15); P.vtext(g, '东坡书', 90, 700, 40, '#8a1c12', 1.2); P.seal(g, 64, 860, 44, '东坡'); }, 57);

/* ---- 顶层：望庐山 ---- */
PIC.lushan = IC.landscapeTex({ title: '庐山瀑布图', seal: '庐山', seed: 37, hy: 560, water: false,
  extra: function (g, w, h) {
    P.ridge(g, w, { y: 760, amp: 520, freq: 0.0045, seed: 61, col: P.QING, a: 0.55, fade: 40, blur: 1.2, rough: 220, trees: 40 });
    const gr = g.createLinearGradient(0, 200, 0, 760); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(1, 'rgba(255,255,255,.6)'); g.fillStyle = gr; g.beginPath(); g.moveTo(760, 200); g.quadraticCurveTo(790, 480, 770, 760); g.lineTo(820, 760); g.quadraticCurveTo(830, 480, 800, 200); g.fill();
    P.mist(g, 790, 780, 160, 40, 0.9, 20); P.mist(g, 600, 300, 300, 40, 0.6, 22);
    g.save(); g.filter = 'blur(10px)'; g.fillStyle = 'rgba(150,110,170,.35)'; g.beginPath(); g.ellipse(700, 160, 200, 50, 0, 0, 7); g.fill(); g.restore();     // 紫烟
  } });
PIC.libai = IC.poemSheet('望庐山瀑布', '唐 李白', ['日照香炉生紫烟', '遥看瀑布挂前川', '飞流直下三千尺', '疑是银河落九天'], { seal: '太白', seed: 59 });
PIC.tao = IC.poetScroll('渊明', ['#7a6e52', '#504834'], '采菊东篱下', '悠然见南山', 63, { beard: true });

/* ============================== 搭三层 ============================== */
const lantern4 = (ax, az) => [[-ax * 0.5, az * 0.35], [ax * 0.5, az * 0.35], [-ax * 0.5, -az * 0.5], [ax * 0.5, -az * 0.5]];
function room(k, H0, cols) { const ax = AX[k] - VW[k], az = AZ[k] - VW[k]; return Object.assign(IC.floor({ P: offsetPoly(rect(AX[k], AZ[k]), -VW[k] - 0.07), y0: Y[k], H: H0, cols, colR: 0.34, lanterns: lantern4(ax, az), drop: 0.7, ty: 2.4 }), { ax, az }); }
(function () {
  const f = room(0, 4.4, [[-3.4, -2.6], [3.4, -2.6], [-3.4, 2.6], [3.4, 2.6]]);
  IC.framed(f.grp, PIC.pipa, 6.4, 2.82, 0, 2.5, f.zb, 0, { glow: 0.55 });
  IC.framed(f.grp, PIC.night, 3.6, 2.11, -f.ax + 0.25, 2.4, -0.3, Math.PI / 2, { glow: 0.5 });
  IC.hangScroll(f.grp, PIC.bai, 1.0, 2.0, f.ax - 0.25, 2.4, -0.3, -Math.PI / 2);
  IC.couplets(f.grp, '同是天涯沦落人', '相逢何必曾相识', 3.2, -3.4, 3.4, 2.3, 2.6 + 0.42);
  IC.table(f.grp, 3.0, 1.0, 0, 0, f.zb + 1.4);
})();
(function () {
  const f = room(1, 4.3, [[-3.0, -2.2], [3.0, -2.2], [-3.0, 2.2], [3.0, 2.2]]), y0 = Y[1];
  IC.framed(f.grp, PIC.song, 4.8, 2.81, 0, y0 + 2.4, f.zb, 0, { glow: 0.55 });
  IC.panelScreen(f.grp, PIC.songScreen, 5, 0.62, 2.4, -f.ax + 0.5, y0 + 1.85, 0, Math.PI / 2);
  IC.hangScroll(f.grp, PIC.ming, 1.0, 2.0, f.ax - 0.25, y0 + 2.3, 0, -Math.PI / 2);
  IC.couplets(f.grp, '世间无比酒', '天下有名楼', 2.8, -3.0, 3.0, y0 + 2.2, 2.2 + 0.4);
})();
(function () {
  const f = room(2, 4.0, [[-2.6, -1.8], [2.6, -1.8], [-2.6, 1.8], [2.6, 1.8]]), y0 = Y[2];
  IC.framed(f.grp, PIC.lushan, 4.4, 2.58, 0, y0 + 2.2, f.zb, 0, { glow: 0.55 });
  IC.framed(f.grp, PIC.libai, 3.4, 2.02, -f.ax + 0.25, y0 + 2.2, 0, Math.PI / 2, { glow: 0.55 });
  IC.hangScroll(f.grp, PIC.tao, 0.95, 1.9, f.ax - 0.25, y0 + 2.2, 0, -Math.PI / 2);
})();
IC.finish(PIC);
})();
