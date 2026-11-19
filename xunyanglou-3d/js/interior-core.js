/* 登楼课件 · 室内工具：水墨画工具（宣纸、远山、云气、水波、人物、楼阁、印章、竖排字）、常用字画模板、搭房间、灯笼、室内灯光
 * 每座楼的 interior.js 用它画字画、搭每一层，最后 IC.finish() */
(function () {
'use strict';
const H = window.HHL, T = THREE;
const { lerp, clamp, rng, V3, fbm, ridged, canvasTex, stripGeo, shapeGeo, boxGeo, mergeGeos, offsetPoly } = H;
const KAI = H.kit.KAI;
const IC = {};

/* ============================== 水墨画工具 ============================== */
const rgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
const P = IC.paint = {};
P.INK = [38, 44, 46]; P.QING = [58, 96, 100]; P.LV = [72, 104, 78]; P.HUANG = [150, 110, 52];
P.paper = function (g, w, h, c1, c2, seed) {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, c1 || '#efe5ca'); gr.addColorStop(1, c2 || '#e0d0aa'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const r = rng(seed || 1);
  for (let i = 0; i < w * h / 700; i++) { g.strokeStyle = 'rgba(110,85,45,' + (0.02 + r() * 0.05) + ')'; g.lineWidth = 0.6 + r(); const x = r() * w, y = r() * h, a = r() * 6.283, l = 4 + r() * 16; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  const vg = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75); vg.addColorStop(0, 'rgba(90,60,20,0)'); vg.addColorStop(1, 'rgba(90,60,20,.22)'); g.fillStyle = vg; g.fillRect(0, 0, w, h);
};
P.ridge = function (g, w, o) {
  const top = [];
  for (let x = -30; x <= w + 30; x += 5) { const n = ridged(x * o.freq + o.seed, o.seed * 1.7, 4), m = fbm(x * o.freq * 4 + o.seed, 3.3, 3); top.push([x, o.y - o.amp * (0.2 + 0.95 * Math.pow(n, 1.25)) - o.amp * 0.14 * m]); }
  g.save(); if (o.blur) g.filter = 'blur(' + o.blur + 'px)';
  g.beginPath(); g.moveTo(-30, o.y + o.fade); top.forEach(p => g.lineTo(p[0], p[1])); g.lineTo(w + 30, o.y + o.fade); g.closePath();
  const A = Math.min(1, o.a * 1.45), gr = g.createLinearGradient(0, o.y - o.amp * 1.25, 0, o.y + o.fade); gr.addColorStop(0, rgba(o.col, A)); gr.addColorStop(0.5, rgba(o.col, A * 0.62)); gr.addColorStop(1, rgba(o.col, 0)); g.fillStyle = gr; g.fill(); g.restore();
  if (o.rough) { const r = rng(o.seed * 97 | 0); g.lineCap = 'round';
    for (let i = 0; i < o.rough; i++) { const p = top[r() * top.length | 0], x = p[0] + (r() - 0.5) * 12, y = p[1] + 3 + r() * o.amp * 0.55; g.strokeStyle = rgba(o.col, o.a * (0.25 + r() * 0.4)); g.lineWidth = 0.8 + r() * 1.6; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 3, y + 6, x + (r() - 0.35) * 9, y + 8 + r() * 16); g.stroke(); }
    if (o.trees) for (let i = 0; i < o.trees; i++) { const p = top[r() * top.length | 0], s = 3 + r() * 5; g.fillStyle = rgba(o.col, Math.min(1, o.a * 1.3)); g.fillRect(p[0], p[1] - s * 2.2, 1.2, s * 2.4); for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(p[0], p[1] - s * (0.9 + k * 0.6), s * (1 - k * 0.25), s * 0.3, 0, 0, 7); g.fill(); } } }
  return top;
};
P.mist = function (g, x, y, rw, rh, a, blur) { g.save(); g.filter = 'blur(' + (blur || 16) + 'px)'; g.fillStyle = 'rgba(244,238,220,' + a + ')'; g.beginPath(); g.ellipse(x, y, rw, rh, 0, 0, 7); g.fill(); g.restore(); };
P.ripples = function (g, x0, x1, y0, y1, n, seed, col) { const r = rng(seed); g.lineCap = 'round'; for (let i = 0; i < n; i++) { const x = lerp(x0, x1, r()), y = lerp(y0, y1, r()), l = 14 + r() * 50; g.strokeStyle = 'rgba(' + (col || '60,70,75') + ',' + (0.1 + r() * 0.22) + ')'; g.lineWidth = 0.8 + r(); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l / 2, y - 2 - r() * 2, x + l, y); g.stroke(); } };
P.sun = function (g, x, y, r, col) { g.save(); g.filter = 'blur(' + r * 0.3 + 'px)'; g.fillStyle = 'rgba(230,130,60,.45)'; g.beginPath(); g.arc(x, y, r * 1.6, 0, 7); g.fill(); g.restore(); g.fillStyle = col || 'rgba(206,80,40,.9)'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
P.moon = function (g, x, y, r) { g.save(); g.filter = 'blur(' + r * 0.4 + 'px)'; g.fillStyle = 'rgba(250,245,220,.5)'; g.beginPath(); g.arc(x, y, r * 1.7, 0, 7); g.fill(); g.restore(); g.fillStyle = 'rgba(252,248,232,.95)'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
P.birdsV = function (g, pts, s) { g.strokeStyle = 'rgba(40,36,30,.75)'; g.lineWidth = 2.5 * (s || 1); for (const p of pts) { const k = (s || 1) * 12; g.beginPath(); g.moveTo(p[0] - k, p[1] - k / 3); g.quadraticCurveTo(p[0] - k * 0.4, p[1] - k * 0.75, p[0], p[1]); g.quadraticCurveTo(p[0] + k * 0.4, p[1] - k * 0.75, p[0] + k, p[1] - k / 3); g.stroke(); } };
P.boat = function (g, x, y, s, sail) { g.fillStyle = 'rgba(40,36,30,.85)'; g.beginPath(); g.moveTo(x - 26 * s, y); g.quadraticCurveTo(x, y + 10 * s, x + 26 * s, y); g.fill(); if (sail) { g.fillStyle = 'rgba(250,245,230,.9)'; g.beginPath(); g.moveTo(x, y - 2 * s); g.lineTo(x, y - 40 * s); g.quadraticCurveTo(x + 20 * s, y - 20 * s, x + 18 * s, y - 2 * s); g.fill(); } };
P.drawTower = function (g, x, y, s, levels, roofCol) {                     // 画中楼阁，(x,y) 为底边中点
  let w = s, top = y; g.lineJoin = 'round';
  for (let i = 0; i < levels; i++) {
    w = s * (1 - i * 0.125); const hh = s * 0.32, yy = y - i * s * 0.48; top = yy - hh - s * 0.15;
    g.fillStyle = '#8a2418'; g.fillRect(x - w * 0.36, yy - hh, w * 0.72, hh); g.fillStyle = 'rgba(240,228,190,.85)'; for (let j = -2; j <= 2; j++) g.fillRect(x + j * w * 0.135 - w * 0.035, yy - hh * 0.82, w * 0.07, hh * 0.6);
    g.strokeStyle = 'rgba(50,30,20,.8)'; g.lineWidth = Math.max(1, s * 0.012); g.strokeRect(x - w * 0.36, yy - hh, w * 0.72, hh);
    g.beginPath(); g.moveTo(x - w * 0.7, yy - hh - s * 0.05); g.quadraticCurveTo(x - w * 0.4, yy - hh + s * 0.03, x - w * 0.3, top); g.lineTo(x + w * 0.3, top); g.quadraticCurveTo(x + w * 0.4, yy - hh + s * 0.03, x + w * 0.7, yy - hh - s * 0.05); g.quadraticCurveTo(x, yy - hh + s * 0.11, x - w * 0.7, yy - hh - s * 0.05);
    g.fillStyle = roofCol || '#d9a52e'; g.fill(); g.stroke();
  }
  g.beginPath(); g.moveTo(x - w * 0.3, top + 1); g.quadraticCurveTo(x - w * 0.08, top - s * 0.1, x, top - s * 0.32); g.quadraticCurveTo(x + w * 0.08, top - s * 0.1, x + w * 0.3, top + 1); g.fillStyle = roofCol || '#d9a52e'; g.fill(); g.stroke();
};
P.drawFigure = function (g, x, y, s, robe, o) {                         // 人物：墨线 + 淡彩，(x,y) 为脚底
  o = o || {}; g.save(); g.translate(x, y); g.scale(s, s); g.lineJoin = g.lineCap = 'round';
  const gr = g.createLinearGradient(0, -1.6, 0, 0); gr.addColorStop(0, robe[0]); gr.addColorStop(1, robe[1]);
  g.beginPath(); g.moveTo(-0.2, -1.52); g.quadraticCurveTo(-0.62, -1.3, -0.72, -0.72); g.quadraticCurveTo(-0.5, -0.62, -0.42, -0.9); g.quadraticCurveTo(-0.55, -0.3, -0.52, 0); g.lineTo(0.52, 0); g.quadraticCurveTo(0.55, -0.3, 0.42, -0.9); g.quadraticCurveTo(0.5, -0.62, 0.72, -0.72); g.quadraticCurveTo(0.62, -1.3, 0.2, -1.52); g.closePath();
  g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(30,26,22,.9)'; g.lineWidth = 0.022; g.stroke();
  g.lineWidth = 0.014; g.beginPath(); g.moveTo(-0.12, -1.5); g.lineTo(0.02, -1.05); g.lineTo(0.16, -1.5); g.moveTo(-0.2, -0.85); g.quadraticCurveTo(-0.1, -0.4, -0.22, 0); g.moveTo(0.18, -0.9); g.quadraticCurveTo(0.26, -0.45, 0.16, 0); g.stroke();
  g.fillStyle = '#3a2a22'; g.fillRect(-0.3, -0.98, 0.6, 0.06);
  g.fillStyle = '#f1dcc0'; g.beginPath(); g.ellipse(0, -1.72, 0.17, 0.2, 0, 0, 7); g.fill(); g.lineWidth = 0.018; g.stroke();
  if (o.woman) { g.fillStyle = '#1c1a18'; g.beginPath(); g.ellipse(0, -1.86, 0.2, 0.13, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(0.06, -2.02, 0.1, 0.09, 0.3, 0, 7); g.fill(); g.fillStyle = '#c9a24a'; g.fillRect(0.08, -2.04, 0.18, 0.025); }
  else { g.fillStyle = '#1c1a18'; g.beginPath(); g.moveTo(-0.19, -1.8); g.quadraticCurveTo(0, -2.12, 0.19, -1.8); g.quadraticCurveTo(0, -1.9, -0.19, -1.8); g.fill(); g.fillRect(-0.07, -2.14, 0.14, 0.2); if (o.wings) { g.fillRect(-0.42, -1.97, 0.3, 0.035); g.fillRect(0.12, -1.97, 0.3, 0.035); } }
  g.lineWidth = 0.012; g.beginPath(); g.moveTo(-0.08, -1.74); g.lineTo(-0.03, -1.74); g.moveTo(0.03, -1.74); g.lineTo(0.08, -1.74); g.stroke();
  if (o.beard) { g.strokeStyle = 'rgba(30,26,22,.75)'; g.lineWidth = 0.012; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 0.025, -1.6); g.quadraticCurveTo(i * 0.04, -1.45, i * 0.03, -1.32 - Math.abs(i) * 0.02); g.stroke(); } }
  if (o.cup) { g.fillStyle = '#c9a24a'; g.beginPath(); g.moveTo(0.45, -1.05); g.lineTo(0.62, -1.05); g.lineTo(0.58, -0.92); g.lineTo(0.49, -0.92); g.fill(); }
  g.restore();
};
P.vtext = function (g, s, x, y, size, color, gap) { g.fillStyle = color; g.font = 'bold ' + size + 'px ' + KAI; g.textAlign = 'center'; g.textBaseline = 'middle'; for (let i = 0; i < s.length; i++) g.fillText(s[i], x, y + i * size * (gap || 1.12)); };
P.htext = function (g, s, x, y, size, color) { g.fillStyle = color; g.font = 'bold ' + size + 'px ' + KAI; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y); };
P.seal = function (g, x, y, s, t) { g.fillStyle = '#a8261a'; g.fillRect(x, y, s, s * (t.length > 1 ? (t.length > 2 ? 2.8 : 1.9) : 1)); for (let i = 0; i < t.length; i++) P.htext(g, t[i], x + s / 2, y + s * (0.52 + i * 0.92), s * 0.62, '#f6ead8'); };
P.frame = function (g, w, h) { g.strokeStyle = 'rgba(150,110,40,.9)'; g.lineWidth = 10; g.strokeRect(14, 14, w - 28, h - 28); };

/* ---- 常用字画模板 ---- */
IC.poemSheet = function (title, author, lines, o) {   // 整首诗：竖排，标题作者在右，印章在左下
  o = o || {}; const n = lines.length, W = Math.max(1280, 360 + n * 170);
  return canvasTex(W, 760, function (g, w, h) {
    P.paper(g, w, h, '#f1e8d0', '#e4d6b2', o.seed || 41);
    const titleSize = Math.min(title.length > 6 ? 56 : 72, (h - 160) / (title.length * 1.18));
    P.vtext(g, title, w - 110, 120, titleSize, '#8a1c12', 1.18);
    P.vtext(g, author, w - 200, 150, Math.min(42, (h - 184) / (author.length * 1.2)), '#8a1c12', 1.2);
    const longest = Math.max(...lines.map(s => s.length)), size = Math.min(104, 540 / longest / 1.14), step = Math.min(190, (w - 420) / n);
    lines.forEach((s, i) => P.vtext(g, s, w - 330 - i * step, 140, size, '#1e1a16', 1.14));
    P.seal(g, 80, 520, 54, o.seal || author.slice(-2)); P.frame(g, w, h);
  });
};
IC.poetScroll = H.exhibits.quoteScroll;
IC.picScroll = function (draw, seed) { return canvasTex(512, 1024, function (g, w, h) { P.paper(g, w, h, '#efe6cc', '#e2d3ae', seed || 7); draw(g, w, h); }); };
IC.coupletTex = function (t) {
  return canvasTex(160, 980, function (g, w, h) {
    const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#2a140a'); gr.addColorStop(0.5, '#3e1e10'); gr.addColorStop(1, '#2a140a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#c9a24a'; g.lineWidth = 8; g.strokeRect(6, 6, w - 12, h - 12); g.shadowColor = 'rgba(0,0,0,.7)'; g.shadowBlur = 6;
    const size = Math.min(110, 860 / t.length / 1.16); P.vtext(g, t, w / 2, 70 + size / 2, size, '#f0c95a', 1.16);
  });
};
IC.textScreen = function (cols, ground = '#2a1209') {                       // 多扇刻字屏：cols = [[第一扇的几列], …]，第一扇是标题
  return canvasTex(cols.length * 256, 1152, function (g, w, h) {
    const r = rng(9); g.fillStyle = ground; g.fillRect(0, 0, w, h);
    for (let i = 0; i < cols.length * 110; i++) { g.strokeStyle = 'rgba(' + (70 + r() * 40 | 0) + ',30,14,' + (0.15 + r() * 0.25) + ')'; g.lineWidth = 1 + r() * 2; const x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + (r() - 0.5) * 8, y + 40, x + (r() - 0.5) * 6, y + 80 + r() * 120); g.stroke(); }
    cols.forEach((cs, i) => {
      const x0 = w - (i + 1) * 256; g.strokeStyle = '#8a6a2a'; g.lineWidth = 6; g.strokeRect(x0 + 10, 10, 236, h - 20); g.strokeStyle = 'rgba(201,162,74,.5)'; g.lineWidth = 2; g.strokeRect(x0 + 22, 70, 212, h - 170);
      const n = cs.length, gap = 212 / (n + 1), longest = Math.max(...cs.map(c => c.length)), size = Math.min(110, 900 / longest / 1.12);
      g.shadowColor = 'rgba(0,0,0,.8)'; g.shadowBlur = 4;
      cs.forEach((c, j) => P.vtext(g, c, x0 + 22 + 212 - gap * (j + 1), 130, i === 0 && j === 1 ? 52 : size, i === 0 && j === 0 ? '#f3d27a' : '#d9b25a', 1.12));
      g.shadowBlur = 0;
    });
  });
};
IC.landscapeTex = function (o) {                        // 一幅横幅山水：o = { title, seal, seed, sun, moon, water:true, tower:{x,levels}, birds, boats, extra(g,w,h) }
  return canvasTex(1536, 900, function (g, w, h) {
    P.paper(g, w, h, o.c1 || '#ece4cc', o.c2 || '#d9c8a0', o.seed || 3);
    if (o.sun) P.sun(g, o.sun[0], o.sun[1], o.sun[2] || 50); if (o.moon) P.moon(g, o.moon[0], o.moon[1], o.moon[2] || 40);
    P.ridge(g, w, { y: o.hy || 380, amp: 140, freq: 0.0032, seed: (o.seed || 3) + 4, col: P.QING, a: 0.3, fade: 80, blur: 4 });
    P.mist(g, w / 2, (o.hy || 380) + 10, w * 0.6, 28, 0.75, 18);
    P.ridge(g, w, { y: (o.hy || 380) + 60, amp: 90, freq: 0.006, seed: (o.seed || 3) + 14, col: P.INK, a: 0.5, fade: 60, blur: 1.5, rough: 160, trees: 30 });
    if (o.water !== false) { g.fillStyle = o.waterCol || 'rgba(120,160,165,.25)'; g.fillRect(0, (o.hy || 380) + 80, w, h); P.ripples(g, 0, w, (o.hy || 380) + 90, h - 20, 600, (o.seed || 3) + 1); }
    if (o.tower) P.drawTower(g, o.tower[0], o.tower[1], o.tower[2] || 90, o.tower[3] || 3, o.tower[4]);
    if (o.boats) o.boats.forEach(b => P.boat(g, b[0], b[1], b[2] || 1, true));
    if (o.birds) P.birdsV(g, o.birds, 1);
    if (o.extra) o.extra(g, w, h);
    if (o.title) { P.vtext(g, o.title, w - 70, 110, 56, '#2a2420', 1.2); P.seal(g, w - 94, 110 + o.title.length * 67 + 20, 44, o.seal || o.title[0]); }
    P.frame(g, w, h);
  });
};

/* ============================== 室内材质 ============================== */
const EI = 0.1;
function cofferTex(style) { return canvasTex(256, 256, function (g, w, h) {
  if (style === 'tang') { g.fillStyle = '#7a2c1a'; g.fillRect(0, 0, w, h); g.fillStyle = '#e4dccb'; g.fillRect(22, 22, w - 44, h - 44); g.strokeStyle = '#9c3a22'; g.lineWidth = 6; g.beginPath(); g.arc(128, 128, 70, 0, 7); g.stroke(); g.lineWidth = 3; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.beginPath(); g.ellipse(128 + Math.cos(a) * 44, 128 + Math.sin(a) * 44, 18, 9, a, 0, 7); g.stroke(); } g.fillStyle = '#c9a24a'; g.beginPath(); g.arc(128, 128, 16, 0, 7); g.fill(); return; }
  g.fillStyle = '#143a34'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c9a24a'; g.lineWidth = 5; g.strokeRect(22, 22, w - 44, h - 44); g.beginPath(); g.arc(128, 128, 70, 0, 7); g.stroke(); g.lineWidth = 3; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.beginPath(); g.arc(128 + Math.cos(a) * 44, 128 + Math.sin(a) * 44, 18, 0, 7); g.stroke(); } g.fillStyle = '#c9a24a'; g.beginPath(); g.arc(128, 128, 16, 0, 7); g.fill(); g.fillStyle = '#7a2418'; for (const p of [[40, 40], [216, 40], [40, 216], [216, 216]]) { g.beginPath(); g.arc(p[0], p[1], 9, 0, 7); g.fill(); }
}, true, [0.4, 0.4]); }
const floorT = canvasTex(512, 512, function (g, w, h) { const r = rng(15); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const k = 46 + r() * 16 | 0; g.fillStyle = 'rgb(' + (k + 14) + ',' + (k + 4) + ',' + (k - 4) + ')'; g.fillRect(x * 128, y * 128, 128, 128); } g.strokeStyle = 'rgba(10,8,6,.9)'; g.lineWidth = 3; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, h); g.moveTo(0, i * 128); g.lineTo(w, i * 128); g.stroke(); } for (let i = 0; i < 1800; i++) { g.fillStyle = 'rgba(255,240,210,' + r() * 0.05 + ')'; g.fillRect(r() * w, r() * h, 1 + r() * 4, 1); } }, true, [0.22, 0.22]);
const lanternT = canvasTex(256, 128, function (g, w, h) { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffd08a'); gr.addColorStop(0.5, '#fff0c8'); gr.addColorStop(1, '#ffb866'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#5a140c'; for (let x = 0; x < w; x += w / 6) g.fillRect(x - 4, 0, 8, h); g.fillRect(0, 0, w, 10); g.fillRect(0, h - 10, w, 10); g.strokeStyle = 'rgba(150,40,20,.7)'; g.lineWidth = 2; for (let x = w / 12; x < w; x += w / 6) { g.beginPath(); g.arc(x, h / 2, 13, 0, 7); g.stroke(); } });
let MI = null;
IC.init = function (o) {                                  // o = { ceil:'tang|ming', band: 颜色, colColor }
  o = o || {}; const TX = H.tower.TX, cof = cofferTex(o.ceil || 'ming');
  MI = IC.MI = {
    floor: new T.MeshStandardMaterial({ map: floorT, roughness: 0.2, metalness: 0.05, envMapIntensity: 0.12 }),
    ceil: new T.MeshStandardMaterial({ color: 0x9a9a9a, map: cof, roughness: 0.7, envMapIntensity: EI, side: T.DoubleSide, emissive: 0x3a2a18, emissiveMap: cof, emissiveIntensity: 0.1 }),
    wood: new T.MeshStandardMaterial({ color: 0x3a1a0e, roughness: 0.5, envMapIntensity: EI }),
    lacquer: new T.MeshStandardMaterial({ color: 0x64160e, roughness: 0.3, envMapIntensity: 0.2 }),
    beam: new T.MeshStandardMaterial({ color: o.beam || 0x3e120b, roughness: 0.5, envMapIntensity: EI }),
    col: new T.MeshStandardMaterial({ color: o.colColor || 0x7a4624, roughness: 0.42, envMapIntensity: 0.2 }),
    gilt: new T.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.35, metalness: 0.9, envMapIntensity: 0.5, emissive: 0x4a3410, emissiveIntensity: 0.6 }),
    stoneBase: new T.MeshStandardMaterial({ color: 0x9a968a, roughness: 0.7, envMapIntensity: EI }),
    wallIn: new T.MeshStandardMaterial({ map: TX.wall, normalMap: TX.wallN, roughness: 0.6, envMapIntensity: EI, emissive: 0xffffff, emissiveMap: TX.wallGlow, emissiveIntensity: 1.5, side: T.DoubleSide }),
    bandIn: new T.MeshStandardMaterial({ color: o.band || 0x4a140c, roughness: 0.6, envMapIntensity: EI, side: T.DoubleSide }),
    lantern: new T.MeshStandardMaterial({ map: lanternT, emissive: 0xffc890, emissiveMap: lanternT, emissiveIntensity: 2.4, roughness: 0.8, envMapIntensity: 0 }),
    red: new T.MeshStandardMaterial({ color: 0x8a1810, roughness: 0.6, envMapIntensity: EI }),
    silk: new T.MeshStandardMaterial({ color: 0x4a5a66, roughness: 0.75, envMapIntensity: EI }),
    paper: new T.MeshStandardMaterial({ color: 0xefe4c8, roughness: 0.9, envMapIntensity: EI }),
    bronze: new T.MeshStandardMaterial({ color: 0x6a5a3a, roughness: 0.42, metalness: 0.9, envMapIntensity: 0.4 })
  };
  return MI;
};
IC.picMat = (tex, glow) => new T.MeshStandardMaterial({ color: 0x9c958a, map: tex, roughness: 0.85, envMapIntensity: EI, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: (glow === undefined ? 0.42 : glow) * 0.1 });

/* ============================== 陈设 ============================== */
function add(grp, geo, mat, x, y, z, ry) { const m = new T.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); if (ry) m.rotation.y = ry; grp.add(m); return m; }
IC.add = add;
IC.framed = function (grp, tex, w, h, x, y, z, ry, o) { o = o || {}; const g = new T.Group(), b = Math.max(0.25, w * 0.045); add(g, new T.BoxGeometry(w + b * 2, h + b * 2, 0.2), MI.wood); add(g, new T.BoxGeometry(w + b * 0.6, h + b * 0.6, 0.04), MI.gilt, 0, 0, 0.1); add(g, new T.PlaneGeometry(w, h), o.mat || IC.picMat(tex, o.glow), 0, 0, 0.125); H.exhibits.frame(g, w, h); g.position.set(x, y, z); g.rotation.y = ry || 0; grp.add(g); return g; };
IC.hangScroll = function (grp, tex, w, h, x, y, z, ry) { const g = new T.Group(); add(g, new T.BoxGeometry(w + 0.16, h + h * 0.42, 0.02), MI.silk); add(g, new T.PlaneGeometry(w, h), IC.picMat(tex, 0.4), 0, 0, 0.012); const rod = new T.CylinderGeometry(0.035, 0.035, w + 0.36, 8); rod.rotateZ(Math.PI / 2); add(g, rod, MI.wood, 0, -h / 2 - h * 0.21, 0.02); add(g, new T.BoxGeometry(w + 0.2, 0.03, 0.03), MI.wood, 0, h / 2 + h * 0.21, 0); H.exhibits.scroll(g, w, h, h * 0.21); g.position.set(x, y, z); g.rotation.y = ry || 0; grp.add(g); return g; };
IC.panelScreen = function (grp, tex, n, pw, ph, x, y, z, ry) { const root = new T.Group(); root.position.set(x, y, z); root.rotation.y = ry || 0; grp.add(root); for (let i = 0; i < n; i++) { const g = new T.Group(), pg = new T.PlaneGeometry(pw, ph), uv = pg.attributes.uv; for (let j = 0; j < uv.count; j++) uv.setX(j, (i + uv.getX(j)) / n); add(g, new T.BoxGeometry(pw + 0.08, ph + 0.16, 0.07), MI.wood); add(g, pg, IC.picMat(tex, 0.6), 0, 0, 0.04); add(g, new T.BoxGeometry(pw + 0.08, 0.42, 0.08), MI.lacquer, 0, -ph / 2 - 0.29, 0); g.position.set((i - (n - 1) / 2) * pw, 0, i % 2 ? 0.16 : 0); g.rotation.y = i % 2 ? -0.25 : 0.25; root.add(g); } return root; };
IC.lantern = function (grp, x, yc, z, drop, s) { s = s || 1; const g = new T.Group(); add(g, new T.CylinderGeometry(0.012, 0.012, drop, 4), MI.wood, 0, -drop / 2, 0); add(g, new T.CylinderGeometry(0.3 * s, 0.3 * s, 0.52 * s, 6, 1, true), MI.lantern, 0, -drop - 0.3 * s, 0); for (const dy of [-0.02, -0.58]) add(g, new T.CylinderGeometry(0.2 * s, 0.33 * s, 0.07 * s, 6), MI.wood, 0, -drop + dy * s, 0).rotation.x = dy < -0.3 ? Math.PI : 0; add(g, new T.CylinderGeometry(0.025 * s, 0.05 * s, 0.4 * s, 5), MI.red, 0, -drop - 0.82 * s, 0); g.position.set(x, yc, z); grp.add(g); };
IC.table = function (grp, w, d, x, y, z, ry) { const g = new T.Group(); H.exhibits.joinery(g, w, d); add(g, new T.BoxGeometry(w + 0.12, 0.065, d + 0.12), MI.wood, 0, 0.875, 0); g.position.set(x, y, z); g.rotation.y = ry || 0; grp.add(g); return g; };
IC.couplets = function (grp, l, r, h, xl, xr, y, z, ry) { for (const [t, x] of [[l, xl], [r, xr]]) { const m = add(grp, new T.BoxGeometry(h * 0.16, h, 0.06), [MI.gilt, MI.gilt, MI.gilt, MI.gilt, IC.picMat(IC.coupletTex(t), 0.6), MI.gilt], x, y, z); m.rotation.y = ry || 0; } };

/* ============================== 搭一层：地面、天花、墙、梁、柱、灯笼 ============================== */
const INSIDE = [];
/* o = { P(墙所在的平面), y0, H, cols:[[x,z]], colR, lanterns:[[x,z]], drop, eye:{pos:[x,y,z], target:[x,y,z]} 或 { ty, zb } , wallU } */
IC.floor = function (o) {
  const grp = new T.Group(); H.tower.group.add(grp); const y0 = o.y0, yc = y0 + o.H, Pw = o.P;
  add(grp, shapeGeo(Pw), MI.floor, 0, y0 + 0.03, 0).receiveShadow = true; add(grp, shapeGeo(Pw), MI.ceil, 0, yc, 0);
  add(grp, stripGeo(Pw, y0 + 0.12, yc - (o.bandH || 1.0), o.wallU || 2.3), MI.wallIn); add(grp, stripGeo(Pw, yc - (o.bandH || 1.0), yc, 4.2), MI.bandIn);
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of Pw) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
  const ax = (x1 - x0) / 2, az = (z1 - z0) / 2, bs = o.beamStep || 1.7, beams = [];
  for (let v = x0; v <= x1 + 0.01; v += (x1 - x0) / Math.max(1, Math.round((x1 - x0) / bs))) beams.push(boxGeo(0.2, 0.22, az * 2, v, yc - 0.11, (z0 + z1) / 2));
  for (let v = z0; v <= z1 + 0.01; v += (z1 - z0) / Math.max(1, Math.round((z1 - z0) / bs))) beams.push(boxGeo(ax * 2, 0.22, 0.2, (x0 + x1) / 2, yc - 0.11, v));
  add(grp, mergeGeos(beams), MI.beam);
  for (const c of o.cols || []) { add(grp, new T.CylinderGeometry(o.colR || 0.4, (o.colR || 0.4) * 1.05, o.H, 24), MI.col, c[0], y0 + o.H / 2, c[1]); add(grp, new T.CylinderGeometry((o.colR || 0.4) * 1.4, (o.colR || 0.4) * 1.65, 0.3, 20), MI.stoneBase, c[0], y0 + 0.15, c[1]); }
  for (const l of o.lanterns || []) IC.lantern(grp, l[0], yc - 0.22, l[1], o.drop || 0.8, o.lanternS || 1);
  const zb = z0 + 0.45, TY = H.tower.TY;
  const view = o.eye ? { pos: V3(o.eye.pos[0], TY + o.eye.pos[1], o.eye.pos[2]), target: V3(o.eye.target[0], TY + o.eye.target[1], o.eye.target[2]) } : { pos: V3(0, TY + y0 + 1.7, z1 * 0.8), target: V3(0, TY + y0 + (o.ty || 2.4), zb) };
  const info = { grp, ax, az, x0, x1, z0, z1, y0, H: o.H, zb, view, light: o.light };
  INSIDE.push(info); return info;
};

/* ============================== 室内灯光 ============================== */
const lights = [new T.PointLight(0xffe2b8, 0, 26, 1.3), new T.PointLight(0xffb878, 0, 30, 1.4), new T.PointLight(0xffd8a8, 0, 20, 1.5)];
lights.forEach(l => H.scene.add(l));
let cur = -1, dayK = 0;
function enter(k) {
  cur = k;
  if (k >= 0) { const I = INSIDE[k], TY = H.tower.TY, s = I.light || 1, gp = H.tower.group.position, cx = gp.x + (I.x0 + I.x1) / 2, oz = gp.z; lights.forEach(l => l.distance = 26 * s); lights[0].position.set(cx, TY + I.y0 + Math.min(I.H * 0.72, 4.5 * s), oz + I.zb + 3.2 * s); lights[1].position.set(cx, TY + I.y0 + Math.min(I.H * 0.5, 3 * s), oz + (I.z0 + I.z1) / 2 + I.az * 0.2); lights[2].position.set(cx, TY + I.y0 + 2.2, oz + I.z1 - I.az * 0.3); }
  setTime(dayK);
}
function setTime(g) {
  dayK = g; const on = cur >= 0 ? 1 : 0; if (!MI) return;
  const d = clamp(1 - g * 2.5, 0, 1), du = clamp(1 - Math.abs(g - 0.4) * 2.5, 0, 1);
  MI.wallIn.emissive.setRGB(0.85 * d + 1.25 * du + 0.05, 0.98 * d + 0.7 * du + 0.07, 1.25 * d + 0.4 * du + 0.14);
  MI.wallIn.emissiveIntensity = 1.15 * d + 0.9 * du + 0.1;
  lights[0].intensity = on * (1.4 + g * 0.5); lights[1].intensity = on * (0.9 + g * 0.6); lights[2].intensity = on * 0.5;
}
IC.finish = function (PIC) { H.interior = { INSIDE, enter, setTime, MI, PIC: PIC || {} }; H.exhibits.upgrade(H.interior); return H.interior; };
H.ic = IC;
})();
