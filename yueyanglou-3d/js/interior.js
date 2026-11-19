/* 岳阳楼 · 楼内三层：四根楠木金柱贯通上下；一层《洞庭湖图》与名联，二层《岳阳楼记》雕屏，三层杜甫《登岳阳楼》
 * 画与雕屏都是用代码画出来的示意，不是实物照片 */
(function () {
'use strict';
const H = window.HHL, T = THREE;
const { lerp, clamp, rng, V3, fbm, ridged, canvasTex, makeCanvas, pixelCanvas, texFrom, normalFromCanvas, stripGeo, shapeGeo, boxGeo, mergeGeos, offsetPoly } = H;
const { group: tower, AX, AZ, Y, YTOP, TY, VW, colTopY, TX, KAI, rect } = H.tower;

/* ============================== 水墨画工具 ============================== */
const rgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
function paper(g, w, h, c1, c2, seed) {                      // 宣纸：底色、纤维、做旧
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, c1 || '#efe5ca'); gr.addColorStop(1, c2 || '#e0d0aa'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const r = rng(seed || 1);
  for (let i = 0; i < w * h / 700; i++) { g.strokeStyle = 'rgba(110,85,45,' + (0.02 + r() * 0.05) + ')'; g.lineWidth = 0.6 + r(); const x = r() * w, y = r() * h, a = r() * 6.283, l = 4 + r() * 16; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  const vg = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75); vg.addColorStop(0, 'rgba(90,60,20,0)'); vg.addColorStop(1, 'rgba(90,60,20,.22)'); g.fillStyle = vg; g.fillRect(0, 0, w, h);
}
function ridge(g, w, o) {                                    // 一层远山：山脊线以下由浓到淡晕开
  const top = [];
  for (let x = -30; x <= w + 30; x += 5) { const n = ridged(x * o.freq + o.seed, o.seed * 1.7, 4), m = fbm(x * o.freq * 4 + o.seed, 3.3, 3); top.push([x, o.y - o.amp * (0.2 + 0.95 * Math.pow(n, 1.25)) - o.amp * 0.14 * m]); }
  g.save(); if (o.blur) g.filter = 'blur(' + o.blur + 'px)';
  g.beginPath(); g.moveTo(-30, o.y + o.fade); top.forEach(p => g.lineTo(p[0], p[1])); g.lineTo(w + 30, o.y + o.fade); g.closePath();
  const A = Math.min(1, o.a * 1.45);
  const gr = g.createLinearGradient(0, o.y - o.amp * 1.25, 0, o.y + o.fade); gr.addColorStop(0, rgba(o.col, A)); gr.addColorStop(0.5, rgba(o.col, A * 0.62)); gr.addColorStop(1, rgba(o.col, 0)); g.fillStyle = gr; g.fill(); g.restore();
  if (o.rough) { const r = rng(o.seed * 97 | 0); g.lineCap = 'round';
    for (let i = 0; i < o.rough; i++) { const p = top[r() * top.length | 0], x = p[0] + (r() - 0.5) * 12, y = p[1] + 3 + r() * o.amp * 0.55; g.strokeStyle = rgba(o.col, o.a * (0.25 + r() * 0.4)); g.lineWidth = 0.8 + r() * 1.6; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 3, y + 6, x + (r() - 0.35) * 9, y + 8 + r() * 16); g.stroke(); }
    if (o.trees) for (let i = 0; i < o.trees; i++) { const p = top[r() * top.length | 0], s = 3 + r() * 5; g.fillStyle = rgba(o.col, Math.min(1, o.a * 1.3)); g.fillRect(p[0], p[1] - s * 2.2, 1.2, s * 2.4); for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(p[0], p[1] - s * (0.9 + k * 0.6), s * (1 - k * 0.25), s * 0.3, 0, 0, 7); g.fill(); } } }
  return top;
}
function mist(g, x, y, rw, rh, a, blur) { g.save(); g.filter = 'blur(' + (blur || 16) + 'px)'; g.fillStyle = 'rgba(244,238,220,' + a + ')'; g.beginPath(); g.ellipse(x, y, rw, rh, 0, 0, 7); g.fill(); g.restore(); }
function ripples(g, x0, x1, y0, y1, n, seed) { const r = rng(seed); g.lineCap = 'round'; for (let i = 0; i < n; i++) { const x = lerp(x0, x1, r()), y = lerp(y0, y1, r()), l = 14 + r() * 50; g.strokeStyle = 'rgba(60,70,75,' + (0.1 + r() * 0.22) + ')'; g.lineWidth = 0.8 + r(); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l / 2, y - 2 - r() * 2, x + l, y); g.stroke(); } }
function auspCloud(g, x, y, s) {                             // 祥云：白粉填色 + 墨线卷纹
  g.save(); g.filter = 'blur(1.5px)'; g.fillStyle = 'rgba(250,247,236,.93)';
  for (const c of [[0, 0, 1], [1.1, 0.12, 0.8], [-1.1, 0.16, 0.72], [0.45, -0.5, 0.72], [-0.5, -0.4, 0.62], [1.9, 0.3, 0.5], [-1.85, 0.32, 0.46], [2.7, 0.42, 0.3]]) { g.beginPath(); g.arc(x + c[0] * s, y + c[1] * s, c[2] * s, 0, 7); g.fill(); }
  g.restore(); g.strokeStyle = 'rgba(70,90,110,.55)'; g.lineWidth = Math.max(1, s * 0.035);
  for (const c of [[0, 0, 0.55], [1.05, 0.15, 0.42], [-1.05, 0.2, 0.38]]) { g.beginPath(); for (let a = 0; a < 7.5; a += 0.2) { const rr = c[2] * s * (1 - a / 9.5); g.lineTo(x + c[0] * s + Math.cos(a + 2) * rr, y + c[1] * s + Math.sin(a + 2) * rr * 0.85); } g.stroke(); }
}
function drawCrane(g, x, y, s, rot) {                        // 飞鹤（工笔）
  g.save(); g.translate(x, y); g.rotate(rot || 0); g.scale(s, s); g.lineJoin = g.lineCap = 'round';
  const ink = 'rgba(40,36,30,.85)';
  const wing = (pts, fill) => { g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 4) g.quadraticCurveTo(pts[i], pts[i + 1], pts[i + 2], pts[i + 3]); g.closePath(); g.fillStyle = fill; g.fill(); g.strokeStyle = ink; g.lineWidth = 0.018; g.stroke(); };
  wing([-0.15, 0.02, -0.5, -0.95, -1.5, -1.05, -1.0, -0.55, -0.55, -0.25, -0.2, -0.1, 0.25, 0.02], '#f6f1e2');
  wing([-1.5, -1.05, -1.25, -0.6, -0.78, -0.3, -1.05, -0.62, -1.5, -1.05], '#2a2622');
  wing([0.0, 0.04, 0.25, -0.95, 1.05, -1.3, 0.92, -0.72, 0.62, -0.25, 0.5, -0.05, 0.42, 0.1], '#fbf7ea');
  wing([1.05, -1.3, 1.02, -0.86, 0.72, -0.42, 0.9, -0.8, 1.05, -1.3], '#2a2622');
  g.beginPath(); g.ellipse(0.02, 0.1, 0.72, 0.23, -0.12, 0, 7); g.fillStyle = '#f7e9b4'; g.fill(); g.strokeStyle = ink; g.lineWidth = 0.018; g.stroke();
  g.beginPath(); g.moveTo(-0.6, 0.16); g.quadraticCurveTo(-0.95, 0.2, -1.05, 0.34); g.quadraticCurveTo(-0.85, 0.36, -0.55, 0.26); g.fillStyle = '#2a2622'; g.fill();
  g.strokeStyle = '#f7e9b4'; g.lineWidth = 0.11; g.beginPath(); g.moveTo(0.62, 0.02); g.quadraticCurveTo(1.15, -0.06, 1.42, -0.42); g.stroke();
  g.strokeStyle = '#2a2622'; g.lineWidth = 0.1; g.beginPath(); g.moveTo(1.05, -0.12); g.quadraticCurveTo(1.3, -0.22, 1.42, -0.42); g.stroke();
  g.fillStyle = '#f7e9b4'; g.beginPath(); g.arc(1.45, -0.47, 0.085, 0, 7); g.fill(); g.fillStyle = '#c02a1a'; g.beginPath(); g.ellipse(1.46, -0.535, 0.06, 0.035, 0.2, 0, 7); g.fill();
  g.strokeStyle = '#3a342a'; g.lineWidth = 0.035; g.beginPath(); g.moveTo(1.52, -0.46); g.lineTo(1.88, -0.38); g.stroke();
  g.lineWidth = 0.025; g.beginPath(); g.moveTo(-0.55, 0.2); g.lineTo(-1.45, 0.5); g.moveTo(-0.5, 0.24); g.lineTo(-1.4, 0.58); g.stroke();
  g.restore();
}
function drawTower(g, x, y, s, levels) {                     // 画中楼阁，(x,y) 为底边中点
  let w = s, top = y; g.lineJoin = 'round';
  for (let i = 0; i < levels; i++) {
    w = s * (1 - i * 0.125); const hh = s * 0.32, yy = y - i * s * 0.48; top = yy - hh - s * 0.15;
    g.fillStyle = '#8a2418'; g.fillRect(x - w * 0.36, yy - hh, w * 0.72, hh); g.fillStyle = 'rgba(240,228,190,.85)'; for (let j = -2; j <= 2; j++) g.fillRect(x + j * w * 0.135 - w * 0.035, yy - hh * 0.82, w * 0.07, hh * 0.6);
    g.strokeStyle = 'rgba(50,30,20,.8)'; g.lineWidth = Math.max(1, s * 0.012); g.strokeRect(x - w * 0.36, yy - hh, w * 0.72, hh);
    g.beginPath(); g.moveTo(x - w * 0.7, yy - hh - s * 0.05); g.quadraticCurveTo(x - w * 0.4, yy - hh + s * 0.03, x - w * 0.3, top); g.lineTo(x + w * 0.3, top); g.quadraticCurveTo(x + w * 0.4, yy - hh + s * 0.03, x + w * 0.7, yy - hh - s * 0.05); g.quadraticCurveTo(x, yy - hh + s * 0.11, x - w * 0.7, yy - hh - s * 0.05);
    g.fillStyle = '#d9a52e'; g.fill(); g.stroke();
  }
  g.beginPath(); g.moveTo(x - w * 0.3, top + 1); g.quadraticCurveTo(x - w * 0.08, top - s * 0.1, x, top - s * 0.32); g.quadraticCurveTo(x + w * 0.08, top - s * 0.1, x + w * 0.3, top + 1); g.fillStyle = '#d9a52e'; g.fill(); g.stroke();
  g.beginPath(); g.arc(x, top - s * 0.35, s * 0.05, 0, 7); g.fill(); g.stroke();
}
function drawFigure(g, x, y, s, robe, o) {                   // 人物：墨线 + 淡彩，(x,y) 为脚底
  o = o || {}; g.save(); g.translate(x, y); g.scale(s, s); g.lineJoin = g.lineCap = 'round';
  const gr = g.createLinearGradient(0, -1.6, 0, 0); gr.addColorStop(0, robe[0]); gr.addColorStop(1, robe[1]);
  g.beginPath(); g.moveTo(-0.2, -1.52); g.quadraticCurveTo(-0.62, -1.3, -0.72, -0.72); g.quadraticCurveTo(-0.5, -0.62, -0.42, -0.9); g.quadraticCurveTo(-0.55, -0.3, -0.52, 0); g.lineTo(0.52, 0); g.quadraticCurveTo(0.55, -0.3, 0.42, -0.9); g.quadraticCurveTo(0.5, -0.62, 0.72, -0.72); g.quadraticCurveTo(0.62, -1.3, 0.2, -1.52); g.closePath();
  g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(30,26,22,.9)'; g.lineWidth = 0.022; g.stroke();
  g.lineWidth = 0.014; g.beginPath(); g.moveTo(-0.12, -1.5); g.lineTo(0.02, -1.05); g.lineTo(0.16, -1.5); g.moveTo(-0.2, -0.85); g.quadraticCurveTo(-0.1, -0.4, -0.22, 0); g.moveTo(0.18, -0.9); g.quadraticCurveTo(0.26, -0.45, 0.16, 0); g.moveTo(-0.42, -0.9); g.quadraticCurveTo(-0.3, -1.1, -0.26, -1.3); g.stroke();
  g.fillStyle = '#3a2a22'; g.fillRect(-0.3, -0.98, 0.6, 0.06);
  g.fillStyle = '#f1dcc0'; g.beginPath(); g.ellipse(0, -1.72, 0.17, 0.2, 0, 0, 7); g.fill(); g.lineWidth = 0.018; g.stroke();
  g.fillStyle = '#1c1a18'; g.beginPath(); g.moveTo(-0.19, -1.8); g.quadraticCurveTo(0, -2.12, 0.19, -1.8); g.quadraticCurveTo(0, -1.9, -0.19, -1.8); g.fill(); g.fillRect(-0.07, -2.14, 0.14, 0.2);
  if (o.wings) { g.fillRect(-0.42, -1.97, 0.3, 0.035); g.fillRect(0.12, -1.97, 0.3, 0.035); }
  g.lineWidth = 0.012; g.beginPath(); g.moveTo(-0.08, -1.74); g.lineTo(-0.03, -1.74); g.moveTo(0.03, -1.74); g.lineTo(0.08, -1.74); g.stroke();
  if (o.beard) { g.strokeStyle = 'rgba(30,26,22,.75)'; g.lineWidth = 0.012; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 0.025, -1.6); g.quadraticCurveTo(i * 0.04, -1.45, i * 0.03, -1.32 - Math.abs(i) * 0.02); g.stroke(); } }
  g.restore();
}
function vtext(g, s, x, y, size, color, gap) { g.fillStyle = color; g.font = 'bold ' + size + 'px ' + KAI; g.textAlign = 'center'; g.textBaseline = 'middle'; for (let i = 0; i < s.length; i++) g.fillText(s[i], x, y + i * size * (gap || 1.12)); }
function htext(g, s, x, y, size, color) { g.fillStyle = color; g.font = 'bold ' + size + 'px ' + KAI; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y); }
function seal(g, x, y, s, t) { g.fillStyle = '#a8261a'; g.fillRect(x, y, s, s * (t.length > 1 ? 1.9 : 1)); for (let i = 0; i < t.length; i++) htext(g, t[i], x + s / 2, y + s * (0.52 + i * 0.92), s * 0.62, '#f6ead8'); }
const INK = [38, 44, 46], QING = [58, 96, 100], LV = [72, 104, 78];
function landscape(g, w, h, seed, o) {                       // 一幅完整的山水：远山、云气、近山、江水
  o = o || {}; const hy = h * (o.horizon || 0.62);
  ridge(g, w, { y: hy - h * 0.06, amp: h * 0.3, freq: 0.0032, seed: seed + 1, col: QING, a: 0.28, fade: h * 0.2, blur: 5 });
  mist(g, w * 0.5, hy - h * 0.05, w * 0.7, h * 0.05, 0.75, 18);
  ridge(g, w, { y: hy, amp: h * 0.24, freq: 0.0045, seed: seed + 9, col: QING, a: 0.45, fade: h * 0.16, blur: 2.5, rough: 90 });
  mist(g, w * 0.35, hy + h * 0.015, w * 0.4, h * 0.035, 0.7, 14); mist(g, w * 0.8, hy - h * 0.01, w * 0.3, h * 0.03, 0.6, 14);
  ridge(g, w, { y: hy + h * 0.1, amp: h * 0.17, freq: 0.007, seed: seed + 23, col: INK, a: 0.62, fade: h * 0.1, blur: 1, rough: 240, trees: 46 });
  ripples(g, 0, w, hy + h * 0.14, h * 0.97, w * h / 5200, seed + 3);
}

/* ============================== 一层：洞庭湖图、楹联 ============================== */
const PIC = {};
PIC.lake = canvasTex(1536, 900, function (g, w, h) {
  paper(g, w, h, '#e6e2cf', '#d8c8a0', 3);
  g.save(); g.filter = 'blur(10px)'; g.fillStyle = 'rgba(214,120,60,.45)'; g.beginPath(); g.arc(1180, 190, 60, 0, 7); g.fill(); g.restore();
  g.fillStyle = 'rgba(196,74,40,.8)'; g.beginPath(); g.arc(1180, 190, 42, 0, 7); g.fill();
  ridge(g, w, { y: 360, amp: 120, freq: 0.003, seed: 7, col: QING, a: 0.26, fade: 90, blur: 5 });
  mist(g, w / 2, 360, w * 0.6, 30, 0.8, 18);
  ripples(g, 0, w, 380, h - 20, 700, 4);
  g.fillStyle = 'rgba(62,92,70,.85)'; g.beginPath(); g.ellipse(420, 470, 150, 34, 0, 0, 7); g.fill();
  ridge(g, 600, { y: 470, amp: 70, freq: 0.02, seed: 30, col: LV, a: 0.7, fade: 20, blur: 1, rough: 60, trees: 26 });
  for (const b of [[760, 560], [980, 640], [1260, 520], [620, 700]]) {
    g.fillStyle = 'rgba(40,36,30,.8)'; g.beginPath(); g.moveTo(b[0] - 26, b[1]); g.quadraticCurveTo(b[0], b[1] + 10, b[0] + 26, b[1]); g.fill();
    g.fillStyle = 'rgba(250,245,230,.9)'; g.beginPath(); g.moveTo(b[0], b[1] - 2); g.lineTo(b[0], b[1] - 40); g.quadraticCurveTo(b[0] + 20, b[1] - 20, b[0] + 18, b[1] - 2); g.fill();
  }
  g.strokeStyle = 'rgba(40,36,30,.75)'; g.lineWidth = 2.5;
  for (const p of [[900, 300], [940, 280], [870, 270], [1000, 320]]) { g.beginPath(); g.moveTo(p[0] - 12, p[1] - 4); g.quadraticCurveTo(p[0] - 5, p[1] - 9, p[0], p[1]); g.quadraticCurveTo(p[0] + 5, p[1] - 9, p[0] + 12, p[1] - 4); g.stroke(); }
  vtext(g, '洞庭湖图', 1460, 110, 56, '#2a2420', 1.25); seal(g, 1436, 420, 44, '岳');
  g.strokeStyle = 'rgba(150,110,40,.9)'; g.lineWidth = 10; g.strokeRect(14, 14, w - 28, h - 28);
});
function coupletTex(t) {
  return canvasTex(160, 980, function (g, w, h) {
    const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#2a140a'); gr.addColorStop(0.5, '#3e1e10'); gr.addColorStop(1, '#2a140a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#c9a24a'; g.lineWidth = 8; g.strokeRect(6, 6, w - 12, h - 12); g.shadowColor = 'rgba(0,0,0,.7)'; g.shadowBlur = 6;
    vtext(g, t, w / 2, 90, 100, '#f0c95a', 1.18);
  });
}
PIC.coupletL = coupletTex('四面湖山归眼底'); PIC.coupletR = coupletTex('万家忧乐到心头');

/* ============================== 二层：《岳阳楼记》雕屏（只刻名句，示意） ============================== */
const JI = [
  ['岳阳楼记', '宋　范仲淹'],
  ['衔远山吞长江', '浩浩汤汤', '横无际涯'],
  ['朝晖夕阴', '气象万千'],
  ['春和景明', '波澜不惊'],
  ['上下天光', '一碧万顷'],
  ['沙鸥翔集', '锦鳞游泳'],
  ['长烟一空', '皓月千里'],
  ['浮光跃金', '静影沉璧'],
  ['不以物喜', '不以己悲'],
  ['先天下之忧而忧'],
  ['后天下之乐而乐'],
  ['时六年九月十五日']
];
function carvedText(replica) {
  return canvasTex(12 * 256, 1152, function (g, w, h) {
  const r = rng(9);
  const ground = g.createLinearGradient(0, 0, 0, h);
  ground.addColorStop(0, '#27231e');
  ground.addColorStop(0.54, '#1d1712');
  ground.addColorStop(1, '#211711');
  g.fillStyle = ground; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) { g.strokeStyle = 'rgba(' + (70 + r() * 40 | 0) + ',30,14,' + (0.15 + r() * 0.25) + ')'; g.lineWidth = 1 + r() * 2; const x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + (r() - 0.5) * 8, y + 40, x + (r() - 0.5) * 6, y + 80 + r() * 120); g.stroke(); }
  JI.forEach((cols, i) => {
    const x0 = w - (i + 1) * 256;
    g.strokeStyle = '#8a6a2a'; g.lineWidth = 6; g.strokeRect(x0 + 10, 10, 236, h - 20);
    g.strokeStyle = 'rgba(201,162,74,.5)'; g.lineWidth = 2; g.strokeRect(x0 + 22, 70, 212, h - 170);
    for (const y of [40, h - 60]) { g.beginPath(); g.ellipse(x0 + 128, y, 50, 16, 0, 0, 7); g.stroke(); }
    const n = cols.length, gap = 212 / (n + 1), longest = Math.max(...cols.map(c => c.length)), size = Math.min(96, 900 / longest / 1.12);
    g.shadowColor = 'rgba(0,0,0,.8)'; g.shadowBlur = 4;
    cols.forEach((c, j) => {
      const x = x0 + 22 + 212 - gap * (j + 1);
      const scale = i === 0 && j === 1 ? 52 : size;
      vtext(g, c, x + 1.4, 121.6, scale, '#100e0b', 1.12);
      vtext(g, c, x, 120, scale, replica ? '#9bbf91' : '#d9b25a', 1.12);
    });
    g.shadowBlur = 0;
  });
  });
}
PIC.jiReplica = carvedText(true);
PIC.ji = carvedText(false);

/* 两种天气：淫雨霏霏 / 春和景明 */
PIC.rain = canvasTex(768, 620, function (g, w, h) {
  paper(g, w, h, '#a8a69c', '#86847a', 23);
  ridge(g, w, { y: 300, amp: 120, freq: 0.004, seed: 51, col: INK, a: 0.35, fade: 120, blur: 6 });
  g.fillStyle = 'rgba(40,44,46,.35)'; g.fillRect(0, 0, w, 260);
  for (let i = 0; i < 26; i++) { const x = 40 + i * 28, y = 420 + Math.sin(i) * 30; g.strokeStyle = 'rgba(245,245,240,.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 30, y + 20); g.quadraticCurveTo(x, y - 30, x + 30, y + 10); g.stroke(); }
  ripples(g, 0, w, 330, h - 10, 260, 6);
  g.save(); g.translate(430, 470); g.rotate(-0.35); g.fillStyle = 'rgba(30,26,22,.85)'; g.beginPath(); g.moveTo(-70, 0); g.quadraticCurveTo(0, 26, 70, 0); g.fill(); g.strokeStyle = 'rgba(30,26,22,.85)'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, 0); g.lineTo(-10, -70); g.lineTo(18, -100); g.stroke(); g.restore();
  const rr = rng(5); g.strokeStyle = 'rgba(230,232,235,.35)'; g.lineWidth = 1.2;
  for (let i = 0; i < 420; i++) { const x = rr() * w, y = rr() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 10, y + 34); g.stroke(); }
  vtext(g, '淫雨霏霏', 712, 70, 46, '#1e1a16', 1.2); seal(g, 694, 300, 34, '悲');
});
PIC.spring = canvasTex(768, 620, function (g, w, h) {
  paper(g, w, h, '#f1ead2', '#e6dab6', 24);
  g.fillStyle = 'rgba(210,90,50,.8)'; g.beginPath(); g.arc(150, 120, 34, 0, 7); g.fill();
  ridge(g, w, { y: 300, amp: 110, freq: 0.004, seed: 61, col: LV, a: 0.32, fade: 100, blur: 4 });
  g.fillStyle = 'rgba(120,170,175,.25)'; g.fillRect(0, 310, w, h - 310);
  ripples(g, 0, w, 330, h - 10, 120, 7);
  g.strokeStyle = 'rgba(40,36,30,.75)'; g.lineWidth = 2.5;
  for (const p of [[380, 200], [420, 180], [350, 175], [460, 220], [300, 210]]) { g.beginPath(); g.moveTo(p[0] - 12, p[1] - 4); g.quadraticCurveTo(p[0] - 5, p[1] - 9, p[0], p[1]); g.quadraticCurveTo(p[0] + 5, p[1] - 9, p[0] + 12, p[1] - 4); g.stroke(); }
  for (const p of [[300, 470], [360, 500], [460, 455]]) { g.fillStyle = 'rgba(214,110,50,.85)'; g.beginPath(); g.ellipse(p[0], p[1], 16, 6, 0.2, 0, 7); g.fill(); g.beginPath(); g.moveTo(p[0] - 14, p[1]); g.lineTo(p[0] - 26, p[1] - 8); g.lineTo(p[0] - 26, p[1] + 8); g.fill(); }
  g.strokeStyle = 'rgba(70,110,60,.85)'; g.lineWidth = 2;
  for (let i = 0; i < 60; i++) { const x = 20 + i * 4 + (i % 3) * 2, y = h - 20; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 6, y - 60, x + 14 - (i % 5) * 5, y - 90 - (i % 7) * 8); g.stroke(); }
  vtext(g, '春和景明', 712, 70, 46, '#1e1a16', 1.2); seal(g, 694, 300, 34, '喜');
});

/* ============================== 三层：杜甫《登岳阳楼》、诗人立轴、《望洞庭》 ============================== */
const DU = ['昔闻洞庭水', '今上岳阳楼', '吴楚东南坼', '乾坤日夜浮', '亲朋无一字', '老病有孤舟', '戎马关山北', '凭轩涕泗流'];
PIC.du = canvasTex(1280, 760, function (g, w, h) {
  paper(g, w, h, '#2b2623', '#191816', 41);
  vtext(g, '登岳陽樓', 1184, 108, 71, '#d0ab62', 1.19);
  vtext(g, '杜甫', 1086, 126, 46, '#d0ab62', 1.2);
  DU.forEach((line, index) => {
    const x = 998 - index * 118;
    vtext(g, line, x + 2, 138, 92, '#100d09', 1.15);
    vtext(g, line, x, 135, 92, '#d6b772', 1.15);
  });
  htext(g, '杜甫詩 · 雕屏釋文', w / 2, h - 54, 34, '#c6a46c');
  g.strokeStyle = '#6e5331';
  g.lineWidth = 8;
  g.strokeRect(12, 12, w - 24, h - 24);
});
const poetScroll = H.exhibits.quoteScroll;
PIC.dufu = poetScroll('杜甫', ['#6e6a58', '#4a463a'], '昔闻洞庭水', '今上岳阳楼', 31, { beard: true });
PIC.junshan = canvasTex(512, 1024, function (g, w, h) {
  paper(g, w, h, '#efe6cc', '#e2d3ae', 33);
  const gr = g.createRadialGradient(256, 330, 20, 256, 330, 220); gr.addColorStop(0, 'rgba(236,240,244,.95)'); gr.addColorStop(1, 'rgba(170,180,190,.9)');
  g.fillStyle = gr; g.beginPath(); g.ellipse(256, 330, 220, 120, 0, 0, 7); g.fill();
  g.strokeStyle = 'rgba(120,130,140,.8)'; g.lineWidth = 4; g.stroke();
  ripples(g, 70, 440, 260, 420, 60, 8);
  g.fillStyle = 'rgba(50,96,70,.92)'; g.beginPath(); g.moveTo(180, 345); g.quadraticCurveTo(250, 250, 330, 345); g.quadraticCurveTo(256, 360, 180, 345); g.fill();
  g.strokeStyle = 'rgba(200,220,190,.6)'; g.lineWidth = 2; g.beginPath(); for (let a = 0; a < 12; a += 0.2) { const r = 40 * (1 - a / 13); g.lineTo(256 + Math.cos(a) * r, 320 + Math.sin(a) * r * 0.35); } g.stroke();
  vtext(g, '望洞庭', 460, 520, 36, '#8a1c12', 1.2); vtext(g, '刘禹锡', 460, 670, 30, '#8a1c12', 1.2);
  vtext(g, '遥望洞庭山水翠', 360, 520, 56, '#221e1a', 1.1); vtext(g, '白银盘里一青螺', 270, 520, 56, '#221e1a', 1.1);
  seal(g, 60, 900, 40, '螺');
});
function tagTex(t) { return canvasTex(128, 64, function (g, w, h) { g.fillStyle = '#12213f'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c9a24a'; g.lineWidth = 4; g.strokeRect(3, 3, w - 6, h - 6); htext(g, t, w / 2, h / 2 + 2, 42, '#f0c95a'); }); }

/* ============================== 室内材质 ============================== */
const EI = 0.1;                                              // 室内几乎不受室外天空的环境反射
const floorT = canvasTex(512, 512, function (g, w, h) { const r = rng(15); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const k = 44 + r() * 16 | 0; g.fillStyle = 'rgb(' + (k + 14) + ',' + (k + 4) + ',' + (k - 4) + ')'; g.fillRect(x * 128, y * 128, 128, 128); } g.strokeStyle = 'rgba(10,8,6,.9)'; g.lineWidth = 3; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, h); g.moveTo(0, i * 128); g.lineTo(w, i * 128); g.stroke(); } for (let i = 0; i < 1800; i++) { g.fillStyle = 'rgba(255,240,210,' + r() * 0.05 + ')'; g.fillRect(r() * w, r() * h, 1 + r() * 4, 1); } }, true, [0.22, 0.22]);
const cofferT = canvasTex(256, 256, function (g, w, h) { g.fillStyle = '#143a34'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c9a24a'; g.lineWidth = 5; g.strokeRect(22, 22, w - 44, h - 44); g.beginPath(); g.arc(128, 128, 70, 0, 7); g.stroke(); g.lineWidth = 3; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.beginPath(); g.arc(128 + Math.cos(a) * 44, 128 + Math.sin(a) * 44, 18, 0, 7); g.stroke(); } g.fillStyle = '#c9a24a'; g.beginPath(); g.arc(128, 128, 16, 0, 7); g.fill(); g.fillStyle = '#7a2418'; for (const p of [[40, 40], [216, 40], [40, 216], [216, 216]]) { g.beginPath(); g.arc(p[0], p[1], 9, 0, 7); g.fill(); } }, true, [0.5, 0.5]);
const lanternT = canvasTex(256, 128, function (g, w, h) { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffd08a'); gr.addColorStop(0.5, '#fff0c8'); gr.addColorStop(1, '#ffb866'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#5a140c'; for (let x = 0; x < w; x += w / 6) g.fillRect(x - 4, 0, 8, h); g.fillRect(0, 0, w, 10); g.fillRect(0, h - 10, w, 10); g.strokeStyle = 'rgba(150,40,20,.7)'; g.lineWidth = 2; for (let x = w / 12; x < w; x += w / 6) { g.beginPath(); g.arc(x, h / 2, 13, 0, 7); g.stroke(); } });
const MI = {
  floor: new T.MeshStandardMaterial({ map: floorT, roughness: 0.2, metalness: 0.05, envMapIntensity: 0.12 }),
  ceil: new T.MeshStandardMaterial({ color: 0x8a8a8a, map: cofferT, roughness: 0.7, envMapIntensity: EI, side: T.DoubleSide, emissive: 0x3a2a18, emissiveMap: cofferT, emissiveIntensity: 0.1 }),
  wood: new T.MeshStandardMaterial({ color: 0x3a1a0e, roughness: 0.5, envMapIntensity: EI }),
  lacquer: new T.MeshStandardMaterial({ color: 0x64160e, roughness: 0.3, envMapIntensity: 0.2 }),
  beam: new T.MeshStandardMaterial({ color: 0x3e120b, roughness: 0.5, envMapIntensity: EI }),
  gilt: new T.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.35, metalness: 0.9, envMapIntensity: 0.5, emissive: 0x4a3410, emissiveIntensity: 0.6 }),
  stoneBase: new T.MeshStandardMaterial({ color: 0x9a968a, roughness: 0.7, envMapIntensity: EI }),
  wallIn: new T.MeshStandardMaterial({ map: TX.wall, normalMap: TX.wallN, roughness: 0.6, envMapIntensity: EI, emissive: 0xffffff, emissiveMap: TX.wallGlow, emissiveIntensity: 1.5, side: T.DoubleSide }),
  bandIn: new T.MeshStandardMaterial({ color: 0x4a140c, roughness: 0.55, envMapIntensity: EI, side: T.DoubleSide }),
  lantern: new T.MeshStandardMaterial({ map: lanternT, emissive: 0xffc890, emissiveMap: lanternT, emissiveIntensity: 2.4, roughness: 0.8, envMapIntensity: 0 }),
  red: new T.MeshStandardMaterial({ color: 0x8a1810, roughness: 0.6, envMapIntensity: EI }),
  silk: new T.MeshStandardMaterial({ color: 0x4a5a66, roughness: 0.75, envMapIntensity: EI }),
  roofMini: new T.MeshStandardMaterial({ color: 0xc9951f, roughness: 0.35, metalness: 0.3, envMapIntensity: 0.4 }),
  paper: new T.MeshStandardMaterial({ color: 0xefe4c8, roughness: 0.9, envMapIntensity: EI }),
  ink: new T.MeshStandardMaterial({ color: 0x141210, roughness: 0.4, envMapIntensity: 0.2 })
};
const picMat = (tex, glow, nrm) => new T.MeshStandardMaterial({ color: nrm ? 0xffffff : 0x9c958a, map: tex, normalMap: nrm || null, roughness: nrm ? 0.35 : 0.85, envMapIntensity: nrm ? 0.3 : EI, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: (glow === undefined ? 0.42 : glow) * 0.1 });

/* ============================== 搭建五层 ============================== */
const INSIDE = [];
function add(grp, geo, mat, x, y, z, ry) { const m = new T.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); if (ry) m.rotation.y = ry; grp.add(m); return m; }
function framed(grp, tex, w, h, x, y, z, ry, o) {              // 木框 + 金线 + 画心
  o = o || {}; const g = new T.Group();
  add(g, new T.BoxGeometry(w + 0.5, h + 0.5, 0.2), MI.wood); add(g, new T.BoxGeometry(w + 0.14, h + 0.14, 0.04), MI.gilt, 0, 0, 0.1);
  add(g, new T.PlaneGeometry(w, h), o.mat || picMat(tex, o.glow), 0, 0, 0.125);
  H.exhibits.frame(g, w, h); g.position.set(x, y, z); g.rotation.y = ry || 0; grp.add(g); return g;
}
function hangScroll(grp, tex, w, h, x, y, z, ry) {             // 立轴：天地头绫边 + 轴头
  const g = new T.Group();
  add(g, new T.BoxGeometry(w + 0.16, h + 0.9, 0.02), MI.silk); add(g, new T.PlaneGeometry(w, h), picMat(tex, 0.4), 0, 0, 0.012);
  const rod = new T.CylinderGeometry(0.035, 0.035, w + 0.36, 8); rod.rotateZ(Math.PI / 2); add(g, rod, MI.wood, 0, -h / 2 - 0.45, 0.02); add(g, new T.BoxGeometry(w + 0.2, 0.03, 0.03), MI.wood, 0, h / 2 + 0.45, 0);
  H.exhibits.scroll(g, w, h, 0.45); g.position.set(x, y, z); g.rotation.y = ry || 0; grp.add(g); return g;
}
function lantern(grp, x, yc, z, drop) {                        // 六角宫灯
  const g = new T.Group();
  add(g, new T.CylinderGeometry(0.012, 0.012, drop, 4), MI.wood, 0, -drop / 2, 0);
  add(g, new T.CylinderGeometry(0.3, 0.3, 0.52, 6, 1, true), MI.lantern, 0, -drop - 0.3, 0);
  for (const dy of [-0.02, -0.58]) add(g, new T.CylinderGeometry(0.2, 0.33, 0.07, 6), MI.wood, 0, -drop + dy, 0).rotation.x = dy < -0.3 ? Math.PI : 0;
  add(g, new T.CylinderGeometry(0.025, 0.05, 0.4, 5), MI.red, 0, -drop - 0.82, 0);
  g.position.set(x, yc, z); grp.add(g);
}

/* ============================== 搭建三层 ============================== */
const NAN = new T.MeshStandardMaterial({ color: 0x7a4624, roughness: 0.42, envMapIntensity: 0.2 });   // 楠木金柱
const COLX = 2.6, COLZ = 2.0;
function panelScreen(grp, tex, n, pw, ph, x, y, z) {          // 相邻雕板在同一平面上，保留木板接缝
  for (let i = 0; i < n; i++) {
    const g = new T.Group(), pg = new T.PlaneGeometry(pw, ph), uv = pg.attributes.uv; for (let j = 0; j < uv.count; j++) uv.setX(j, (i + uv.getX(j)) / n);
    add(g, new T.BoxGeometry(pw + 0.08, ph + 0.16, 0.07), MI.wood); add(g, pg, picMat(tex, 0.6), 0, 0, 0.04); add(g, new T.BoxGeometry(pw + 0.08, 0.42, 0.08), MI.lacquer, 0, -ph / 2 - 0.29, 0);
    g.position.set(x + (i - (n - 1) / 2) * pw, y, z); grp.add(g);
  }
}
for (let k = 0; k < 3; k++) {
  const vw = VW[k], ax = AX[k] - vw, az = AZ[k] - vw, y0 = Y[k], nextY = k < 2 ? Y[k + 1] : YTOP;
  const yc = k < 2 ? nextY - 0.5 : YTOP - 1.55, Hh = yc - y0, colTop = colTopY[k];
  const W = offsetPoly(rect(AX[k], AZ[k]), -vw - 0.07), grp = new T.Group(); tower.add(grp);
  add(grp, shapeGeo(W), MI.floor, 0, y0 + 0.03, 0).receiveShadow = true; add(grp, shapeGeo(W), MI.ceil, 0, yc, 0);
  add(grp, stripGeo(W, y0 + 0.12, colTop + 0.3, 2.3), MI.wallIn); add(grp, stripGeo(W, colTop + 0.3, yc, 4.2), MI.bandIn);
  const beams = [];
  for (let v = -ax; v <= ax + 0.01; v += 2 * ax / Math.round(2 * ax / 1.7)) beams.push(boxGeo(0.2, 0.22, az * 2, v, yc - 0.11, 0));
  for (let v = -az; v <= az + 0.01; v += 2 * az / Math.round(2 * az / 1.7)) beams.push(boxGeo(ax * 2, 0.22, 0.2, 0, yc - 0.11, v));
  add(grp, mergeGeos(beams), MI.beam);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {            // 四根楠木大柱，上下三层在同一位置，像一根柱子直通楼顶
    add(grp, new T.CylinderGeometry(0.4, 0.42, Hh, 24), NAN, sx * COLX, y0 + Hh / 2, sz * COLZ);
    add(grp, new T.CylinderGeometry(0.56, 0.66, 0.3, 20), MI.stoneBase, sx * COLX, y0 + 0.15, sz * COLZ);
  }
  const zb = -az + 0.45;
  for (const p of [[-ax * 0.5, az * 0.35], [ax * 0.5, az * 0.35], [-ax * 0.5, zb + 2.2], [ax * 0.5, zb + 2.2]]) lantern(grp, p[0], yc - 0.22, p[1], k === 0 ? 1.6 : 0.7);
  const ty = k === 0 ? 2.9 : k === 1 ? 2.0 : 1.85;
  INSIDE.push({ grp, ax, az, y0, H: Hh, zb, view: { pos: V3(0, TY + y0 + 1.7, az * 0.8), target: V3(0, TY + y0 + ty, zb) } });

  if (k === 0) {                                               // 一层：复刻雕屏、湖景、楹联
    panelScreen(grp, PIC.jiReplica, 12, Math.min(0.53, ax * 0.13), 2.55, 0, y0 + 2.6, zb + 0.1);
    framed(grp, PIC.lake, 2.9, 2.1, ax * 0.76, y0 + 2.5, zb + 2.4, -0.85, { glow: 0.55 });
    for (const sx of [-1, 1]) add(grp, new T.BoxGeometry(0.6, 3.7, 0.06), [MI.gilt, MI.gilt, MI.gilt, MI.gilt, picMat(sx > 0 ? PIC.coupletL : PIC.coupletR, 0.6), MI.gilt], sx * COLX, y0 + 2.6, -COLZ + 0.45);
    add(grp, new T.BoxGeometry(3.0, 0.85, 1.0), MI.wood, 0, y0 + 0.43, zb + 1.3); add(grp, new T.BoxGeometry(3.2, 0.06, 1.2), MI.gilt, 0, y0 + 0.88, zb + 1.3);
  } else if (k === 1) {                                        // 二层：岳阳楼记雕屏 + 两种天气
    panelScreen(grp, PIC.ji, 12, 0.55, 2.5, 0, y0 + 2.05, zb + 0.1);
    framed(grp, PIC.rain, 2.5, 2.02, -ax * 0.8, y0 + 2.1, zb + 1.9, 0.62); framed(grp, PIC.spring, 2.5, 2.02, ax * 0.8, y0 + 2.1, zb + 1.9, -0.62);
  } else {                                                     // 三层：杜甫诗屏 + 立轴
    framed(grp, PIC.du, 3.8, 2.25, 0, y0 + 1.85, zb, 0, { glow: 0.5 });
    hangScroll(grp, PIC.dufu, 1.05, 2.1, -ax * 0.78, y0 + 1.85, zb + 1.5, 0.62); hangScroll(grp, PIC.junshan, 1.05, 2.1, ax * 0.78, y0 + 1.85, zb + 1.5, -0.62);
  }
}

/* ============================== 室内灯光 ============================== */
const lights = [new T.PointLight(0xffe2b8, 0, 26, 1.3), new T.PointLight(0xffb878, 0, 30, 1.4), new T.PointLight(0xffd8a8, 0, 20, 1.5)];
lights.forEach(l => H.scene.add(l));
let cur = -1, dayK = 0;
function enter(k) {
  cur = k;
  if (k >= 0) { const I = INSIDE[k]; lights[0].position.set(0, TY + I.y0 + Math.min(I.H * 0.72, 4.5), I.zb + 3.2); lights[1].position.set(0, TY + I.y0 + Math.min(I.H * 0.5, 3), I.az * 0.2); lights[2].position.set(0, TY + I.y0 + 2.2, I.az * 0.7); }
  setTime(dayK);
}
function setTime(g) {
  dayK = g; const on = cur >= 0 ? 1 : 0;
  const d = clamp(1 - g * 2.5, 0, 1), du = clamp(1 - Math.abs(g - 0.4) * 2.5, 0, 1);
  MI.wallIn.emissive.setRGB(0.85 * d + 1.25 * du + 0.05, 0.98 * d + 0.7 * du + 0.07, 1.25 * d + 0.4 * du + 0.14);
  MI.wallIn.emissiveIntensity = 1.15 * d + 0.9 * du + 0.1;
  lights[0].intensity = on * (1.3 + g * 0.5); lights[1].intensity = on * (0.8 + g * 0.6); lights[2].intensity = on * 0.45;
}
H.interior = { INSIDE, enter, setTime, MI, PIC };
H.exhibits.upgrade(H.interior);
})();
