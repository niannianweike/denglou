/* 鹳雀楼 · 楼内：底层王之涣《登鹳雀楼》诗屏与“白日依山尽”图；中层沈括《梦溪笔谈》与李益、畅当诗轴；顶层黄河万里图、铁牛图、白鹳图
 * 字画都是用代码画出来的示意，不是楼里实物的照片 */
(function () {
'use strict';
const H = window.HHL, T = THREE;
const { lerp, clamp, rng, V3, fbm, ridged, canvasTex, stripGeo, shapeGeo, boxGeo, mergeGeos, offsetPoly } = H;
const { group: tower, AX, AZ, Y, TY, VW, TX, KAI, rect } = H.tower;

/* ============================== 水墨画工具 ============================== */
const rgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
function paper(g, w, h, c1, c2, seed) {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, c1 || '#efe5ca'); gr.addColorStop(1, c2 || '#e0d0aa'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const r = rng(seed || 1);
  for (let i = 0; i < w * h / 700; i++) { g.strokeStyle = 'rgba(110,85,45,' + (0.02 + r() * 0.05) + ')'; g.lineWidth = 0.6 + r(); const x = r() * w, y = r() * h, a = r() * 6.283, l = 4 + r() * 16; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  const vg = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75); vg.addColorStop(0, 'rgba(90,60,20,0)'); vg.addColorStop(1, 'rgba(90,60,20,.22)'); g.fillStyle = vg; g.fillRect(0, 0, w, h);
}
function ridge(g, w, o) {
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
function waves(g, x0, x1, y0, y1, n, seed, col) { const r = rng(seed); g.lineCap = 'round'; for (let i = 0; i < n; i++) { const x = lerp(x0, x1, r()), y = lerp(y0, y1, r()), l = 18 + r() * 60; g.strokeStyle = 'rgba(' + (col || '110,80,40') + ',' + (0.14 + r() * 0.26) + ')'; g.lineWidth = 1 + r() * 1.4; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l * 0.3, y - 5 - r() * 4, x + l * 0.55, y - 1); g.quadraticCurveTo(x + l * 0.75, y + 3, x + l, y - 2); g.stroke(); } }
function drawStork(g, x, y, s, flip) {                         // 白鹳（工笔）：白身、黑飞羽、红喙红腿
  g.save(); g.translate(x, y); g.scale(flip ? -s : s, s); g.lineJoin = g.lineCap = 'round';
  const ink = 'rgba(40,36,30,.85)';
  g.fillStyle = '#f6f2e6'; g.strokeStyle = ink; g.lineWidth = 0.02;
  g.beginPath(); g.ellipse(0, 0, 0.75, 0.3, -0.15, 0, 7); g.fill(); g.stroke();
  g.fillStyle = '#26221e'; g.beginPath(); g.moveTo(-0.55, -0.05); g.quadraticCurveTo(-0.1, -0.32, 0.45, -0.1); g.quadraticCurveTo(0.1, 0.12, -0.6, 0.18); g.closePath(); g.fill();
  g.strokeStyle = '#f6f2e6'; g.lineWidth = 0.13; g.beginPath(); g.moveTo(0.6, -0.1); g.quadraticCurveTo(0.85, -0.45, 0.8, -0.85); g.stroke();
  g.strokeStyle = ink; g.lineWidth = 0.015; g.stroke();
  g.fillStyle = '#f6f2e6'; g.beginPath(); g.arc(0.8, -0.9, 0.1, 0, 7); g.fill(); g.stroke();
  g.strokeStyle = '#c0281a'; g.lineWidth = 0.05; g.beginPath(); g.moveTo(0.88, -0.9); g.lineTo(1.35, -0.78); g.stroke();
  g.lineWidth = 0.035; g.beginPath(); g.moveTo(0.05, 0.25); g.lineTo(0.1, 0.95); g.lineTo(0.22, 1.0); g.moveTo(-0.15, 0.25); g.lineTo(-0.25, 0.92); g.lineTo(-0.12, 0.98); g.stroke();
  g.restore();
}
function drawOx(g, x, y, s) {                                  // 铁牛（白描加淡墨）
  g.save(); g.translate(x, y); g.scale(s, s); g.lineJoin = g.lineCap = 'round';
  g.fillStyle = 'rgba(70,52,40,.9)'; g.strokeStyle = 'rgba(25,20,16,.95)'; g.lineWidth = 0.025;
  g.beginPath(); g.moveTo(-1.1, -0.55); g.quadraticCurveTo(-0.2, -0.95, 0.75, -0.62); g.quadraticCurveTo(1.15, -0.62, 1.35, -0.35); g.quadraticCurveTo(1.45, -0.05, 1.2, 0.0); g.quadraticCurveTo(0.95, 0.0, 0.85, -0.15);
  g.lineTo(0.75, 0.35); g.lineTo(0.55, 0.35); g.lineTo(0.5, 0.0); g.lineTo(-0.6, 0.0); g.lineTo(-0.7, 0.35); g.lineTo(-0.9, 0.35); g.quadraticCurveTo(-1.2, -0.1, -1.1, -0.55); g.closePath(); g.fill(); g.stroke();
  g.lineWidth = 0.05; g.beginPath(); g.moveTo(1.05, -0.6); g.quadraticCurveTo(1.3, -0.95, 1.05, -1.05); g.moveTo(1.2, -0.55); g.quadraticCurveTo(1.55, -0.85, 1.4, -1.0); g.stroke();
  g.fillStyle = 'rgba(180,150,110,.35)'; for (let i = 0; i < 40; i++) { g.fillRect(-1 + Math.random() * 2, -0.7 + Math.random() * 0.6, 0.03, 0.03); }
  g.restore();
}
function vtext(g, s, x, y, size, color, gap) { g.fillStyle = color; g.font = 'bold ' + size + 'px ' + KAI; g.textAlign = 'center'; g.textBaseline = 'middle'; for (let i = 0; i < s.length; i++) g.fillText(s[i], x, y + i * size * (gap || 1.12)); }
function htext(g, s, x, y, size, color) { g.fillStyle = color; g.font = 'bold ' + size + 'px ' + KAI; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y); }
function seal(g, x, y, s, t) { g.fillStyle = '#a8261a'; g.fillRect(x, y, s, s * (t.length > 1 ? 1.9 : 1)); for (let i = 0; i < t.length; i++) htext(g, t[i], x + s / 2, y + s * (0.52 + i * 0.92), s * 0.62, '#f6ead8'); }
const INK = [38, 44, 46], QING = [58, 96, 100], HUANG = [150, 110, 52];

/* ============================== 底层：“白日依山尽”图、《登鹳雀楼》诗屏、王之涣立轴、柱上的诗句 ============================== */
const PIC = {};
PIC.sunset = canvasTex(1536, 900, function (g, w, h) {           // 太阳靠着远山落下，黄河浩浩荡荡向东流去
  paper(g, w, h, '#efe2c4', '#dcc69a', 3);
  g.save(); g.filter = 'blur(16px)'; g.fillStyle = 'rgba(230,130,60,.5)'; g.beginPath(); g.arc(380, 330, 90, 0, 7); g.fill(); g.restore();
  g.fillStyle = 'rgba(206,80,40,.9)'; g.beginPath(); g.arc(380, 345, 54, 0, 7); g.fill();
  ridge(g, w, { y: 380, amp: 150, freq: 0.0032, seed: 7, col: QING, a: 0.34, fade: 80, blur: 4 });
  ridge(g, w, { y: 430, amp: 90, freq: 0.006, seed: 17, col: INK, a: 0.5, fade: 60, blur: 1.5, rough: 160, trees: 30 });
  mist(g, w / 2, 440, w * 0.6, 26, 0.7, 18);
  g.fillStyle = 'rgba(190,150,90,.55)'; g.beginPath(); g.moveTo(0, 520); g.bezierCurveTo(400, 470, 900, 600, w, 500); g.lineTo(w, h); g.lineTo(0, h); g.fill();   // 黄河
  waves(g, 0, w, 520, h - 30, 520, 4);
  g.fillStyle = 'rgba(150,100,40,.9)'; g.fillRect(1200, 420, 34, 90); g.beginPath(); g.moveTo(1180, 425); g.lineTo(1217, 395); g.lineTo(1254, 425); g.fill();   // 远处小楼
  for (const p of [[620, 250], [660, 232], [600, 225], [700, 262]]) { g.strokeStyle = 'rgba(40,36,30,.75)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(p[0] - 12, p[1] - 4); g.quadraticCurveTo(p[0] - 5, p[1] - 9, p[0], p[1]); g.quadraticCurveTo(p[0] + 5, p[1] - 9, p[0] + 12, p[1] - 4); g.stroke(); }
  vtext(g, '白日依山尽', 1460, 100, 58, '#2a2420', 1.2); vtext(g, '黄河入海流', 1380, 100, 58, '#2a2420', 1.2); seal(g, 1356, 470, 44, '鹳');
  g.strokeStyle = 'rgba(150,110,40,.9)'; g.lineWidth = 10; g.strokeRect(14, 14, w - 28, h - 28);
});
PIC.wang = canvasTex(1280, 760, function (g, w, h) {             // 《登鹳雀楼》全诗
  paper(g, w, h, '#f1e8d0', '#e4d6b2', 41);
  vtext(g, '登鹳雀楼', 1170, 120, 76, '#8a1c12', 1.2); vtext(g, '唐 王之涣', 1080, 150, 44, '#8a1c12', 1.2);
  ['白日依山尽', '黄河入海流', '欲穷千里目', '更上一层楼'].forEach((s, i) => vtext(g, s, 930 - i * 190, 150, 104, '#1e1a16', 1.14));
  seal(g, 90, 520, 56, '之涣');
  g.strokeStyle = 'rgba(150,110,40,.9)'; g.lineWidth = 8; g.strokeRect(12, 12, w - 24, h - 24);
});
const poetScroll = H.exhibits.quoteScroll;
PIC.wangzhihuan = poetScroll('之涣', ['#5a6a7a', '#3a4654'], '欲穷千里目', '更上一层楼', 31, { beard: true });
PIC.yellow = poetScroll('鹳雀', ['#7a6a52', '#56483a'], '白日依山尽', '黄河入海流', 35, {});
function coupletTex(t) {
  return canvasTex(160, 860, function (g, w, h) {
    const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#2a140a'); gr.addColorStop(0.5, '#3e1e10'); gr.addColorStop(1, '#2a140a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#c9a24a'; g.lineWidth = 8; g.strokeRect(6, 6, w - 12, h - 12); g.shadowColor = 'rgba(0,0,0,.7)'; g.shadowBlur = 6;
    vtext(g, t, w / 2, 110, 110, '#f0c95a', 1.2);
  });
}
PIC.coupletL = coupletTex('欲穷千里目'); PIC.coupletR = coupletTex('更上一层楼');

/* ============================== 中层：沈括《梦溪笔谈》、李益与畅当 ============================== */
const SHEN = [['梦溪笔谈', '宋　沈括'], ['河中府鹳雀楼三层'], ['前瞻中条'], ['下瞰大河'], ['唐人留诗者甚多'], ['唯李益王之涣'], ['畅当三篇'], ['能状其景']];
PIC.shen = canvasTex(8 * 256, 1152, function (g, w, h) {
  const r = rng(9);
  g.fillStyle = '#2a1209'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 700; i++) { g.strokeStyle = 'rgba(' + (70 + r() * 40 | 0) + ',30,14,' + (0.15 + r() * 0.25) + ')'; g.lineWidth = 1 + r() * 2; const x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + (r() - 0.5) * 8, y + 40, x + (r() - 0.5) * 6, y + 80 + r() * 120); g.stroke(); }
  SHEN.forEach((cols, i) => {
    const x0 = w - (i + 1) * 256;
    g.strokeStyle = '#8a6a2a'; g.lineWidth = 6; g.strokeRect(x0 + 10, 10, 236, h - 20);
    g.strokeStyle = 'rgba(201,162,74,.5)'; g.lineWidth = 2; g.strokeRect(x0 + 22, 70, 212, h - 170);
    const n = cols.length, gap = 212 / (n + 1), longest = Math.max(...cols.map(c => c.length)), size = Math.min(110, 900 / longest / 1.12);
    g.shadowColor = 'rgba(0,0,0,.8)'; g.shadowBlur = 4;
    cols.forEach((c, j) => vtext(g, c, x0 + 22 + 212 - gap * (j + 1), 130, i === 0 && j === 1 ? 52 : size, i === 0 && j === 0 ? '#f3d27a' : '#d9b25a', 1.12));
    g.shadowBlur = 0;
  });
});
PIC.liyi = poetScroll('李益', ['#6e5a48', '#4a3c30'], '汉家箫鼓随流水', '魏国山河半夕阳', 51, { beard: true, wings: true });
PIC.changdang = poetScroll('畅当', ['#4e6a5e', '#34483f'], '迥临飞鸟上', '高出世尘间', 57, {});
PIC.river = canvasTex(1536, 900, function (g, w, h) {           // 中层另一面：黄河穿过黄土高原
  paper(g, w, h, '#ede0c0', '#dac39a', 13);
  ridge(g, w, { y: 330, amp: 140, freq: 0.0035, seed: 61, col: HUANG, a: 0.36, fade: 120, blur: 4 });
  ridge(g, w, { y: 420, amp: 110, freq: 0.006, seed: 71, col: [120, 90, 50], a: 0.5, fade: 80, blur: 1.5, rough: 180 });
  g.strokeStyle = 'rgba(176,130,60,.75)'; g.lineWidth = 46; g.lineCap = 'round'; g.beginPath(); g.moveTo(200, 880); g.bezierCurveTo(500, 600, 300, 520, 760, 470); g.bezierCurveTo(1100, 430, 1100, 380, 1480, 360); g.stroke();
  waves(g, 0, w, 460, h - 20, 200, 9);
  vtext(g, '黄河', 120, 120, 70, '#2a2420', 1.2); seal(g, 96, 300, 44, '河');
  g.strokeStyle = 'rgba(150,110,40,.9)'; g.lineWidth = 10; g.strokeRect(14, 14, w - 28, h - 28);
});

/* ============================== 顶层：黄河万里图、铁牛图、白鹳图 ============================== */
PIC.map = canvasTex(1536, 900, function (g, w, h) {             // 黄河从青海流到渤海，中间拐了个大大的“几”字
  paper(g, w, h, '#efe4c6', '#dccaa0', 21);
  g.strokeStyle = 'rgba(70,60,40,.35)'; g.lineWidth = 2; g.setLineDash([10, 8]); g.strokeRect(60, 60, w - 120, h - 120); g.setLineDash([]);
  const P = [[150, 560], [300, 520], [420, 600], [560, 560], [620, 300], [700, 220], [930, 230], [960, 320], [940, 520], [960, 640], [1100, 610], [1260, 520], [1420, 470]];
  g.strokeStyle = 'rgba(176,128,52,.9)'; g.lineWidth = 22; g.lineJoin = g.lineCap = 'round'; g.beginPath(); P.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke();
  g.strokeStyle = 'rgba(240,210,150,.6)'; g.lineWidth = 6; g.stroke();
  g.fillStyle = '#b3261a'; g.beginPath(); g.arc(950, 620, 16, 0, 7); g.fill(); htext(g, '鹳雀楼', 1010, 680, 40, '#8a1c12');
  htext(g, '青海', 150, 620, 36, '#3a3226'); htext(g, '渤海', 1440, 420, 36, '#3a3226'); htext(g, '黄土高原', 780, 440, 36, 'rgba(90,70,40,.8)');
  vtext(g, '黄河万里图', 1480, 120, 54, '#2a2420', 1.2); seal(g, 1456, 440, 40, '九曲');
  g.strokeStyle = 'rgba(150,110,40,.9)'; g.lineWidth = 10; g.strokeRect(14, 14, w - 28, h - 28);
});
PIC.ox = canvasTex(512, 1024, function (g, w, h) {
  paper(g, w, h, '#efe6cc', '#e2d3ae', 63);
  g.fillStyle = 'rgba(176,130,60,.35)'; g.fillRect(0, 640, w, 160); waves(g, 0, w, 650, 790, 60, 2);
  drawOx(g, 230, 560, 120);
  vtext(g, '蒲津渡', 450, 110, 50, '#8a1c12', 1.15); vtext(g, '开元铁牛', 380, 110, 54, '#221e1a', 1.15);
  seal(g, 60, 880, 42, '牛');
});
PIC.stork = canvasTex(512, 1024, function (g, w, h) {
  paper(g, w, h, '#efe6cc', '#e2d3ae', 67);
  ridge(g, w, { y: 820, amp: 160, freq: 0.006, seed: 3, col: QING, a: 0.24, fade: 150, blur: 5 }); mist(g, 256, 800, 260, 30, 0.7, 16);
  drawStork(g, 230, 420, 160, false); drawStork(g, 380, 240, 70, true);
  vtext(g, '鹳雀', 450, 560, 56, '#221e1a', 1.15);
  seal(g, 60, 70, 42, '鹳');
});

/* ============================== 室内材质 ============================== */
const EI = 0.1;
const floorT = canvasTex(512, 512, function (g, w, h) { const r = rng(15); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const k = 50 + r() * 16 | 0; g.fillStyle = 'rgb(' + (k + 16) + ',' + (k + 6) + ',' + (k - 4) + ')'; g.fillRect(x * 128, y * 128, 128, 128); } g.strokeStyle = 'rgba(10,8,6,.9)'; g.lineWidth = 3; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, h); g.moveTo(0, i * 128); g.lineTo(w, i * 128); g.stroke(); } for (let i = 0; i < 1800; i++) { g.fillStyle = 'rgba(255,240,210,' + r() * 0.05 + ')'; g.fillRect(r() * w, r() * h, 1 + r() * 4, 1); } }, true, [0.2, 0.2]);
const cofferT = canvasTex(256, 256, function (g, w, h) { g.fillStyle = '#7a2c1a'; g.fillRect(0, 0, w, h); g.fillStyle = '#e4dccb'; g.fillRect(22, 22, w - 44, h - 44); g.strokeStyle = '#9c3a22'; g.lineWidth = 6; g.beginPath(); g.arc(128, 128, 70, 0, 7); g.stroke(); g.lineWidth = 3; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.beginPath(); g.ellipse(128 + Math.cos(a) * 44, 128 + Math.sin(a) * 44, 18, 9, a, 0, 7); g.stroke(); } g.fillStyle = '#c9a24a'; g.beginPath(); g.arc(128, 128, 16, 0, 7); g.fill(); }, true, [0.3, 0.3]);   // 唐式平棋：白底土朱宝相花
const lanternT = canvasTex(256, 128, function (g, w, h) { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffd08a'); gr.addColorStop(0.5, '#fff0c8'); gr.addColorStop(1, '#ffb866'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#5a140c'; for (let x = 0; x < w; x += w / 6) g.fillRect(x - 4, 0, 8, h); g.fillRect(0, 0, w, 10); g.fillRect(0, h - 10, w, 10); });
const MI = {
  floor: new T.MeshStandardMaterial({ map: floorT, roughness: 0.22, metalness: 0.05, envMapIntensity: 0.12 }),
  ceil: new T.MeshStandardMaterial({ color: 0x9a9a9a, map: cofferT, roughness: 0.7, envMapIntensity: EI, side: T.DoubleSide, emissive: 0x3a2a18, emissiveMap: cofferT, emissiveIntensity: 0.1 }),
  wood: new T.MeshStandardMaterial({ color: 0x4a1c0e, roughness: 0.5, envMapIntensity: EI }),
  lacquer: new T.MeshStandardMaterial({ color: 0x7a1e10, roughness: 0.3, envMapIntensity: 0.2 }),
  beam: new T.MeshStandardMaterial({ color: 0x8a3220, roughness: 0.55, envMapIntensity: EI }),
  gilt: new T.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.35, metalness: 0.9, envMapIntensity: 0.5, emissive: 0x4a3410, emissiveIntensity: 0.6 }),
  stoneBase: new T.MeshStandardMaterial({ color: 0x9a968a, roughness: 0.7, envMapIntensity: EI }),
  wallIn: new T.MeshStandardMaterial({ map: TX.wall, normalMap: TX.wallN, roughness: 0.6, envMapIntensity: EI, emissive: 0xffffff, emissiveMap: TX.wallGlow, emissiveIntensity: 1.5, side: T.DoubleSide }),
  bandIn: new T.MeshStandardMaterial({ color: 0xd8cfbb, roughness: 0.75, envMapIntensity: EI, side: T.DoubleSide }),
  lantern: new T.MeshStandardMaterial({ map: lanternT, emissive: 0xffc890, emissiveMap: lanternT, emissiveIntensity: 2.4, roughness: 0.8, envMapIntensity: 0 }),
  red: new T.MeshStandardMaterial({ color: 0x8a1810, roughness: 0.6, envMapIntensity: EI }),
  silk: new T.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.75, envMapIntensity: EI })
};
const picMat = (tex, glow) => new T.MeshStandardMaterial({ color: 0x9c958a, map: tex, roughness: 0.85, envMapIntensity: EI, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: (glow === undefined ? 0.42 : glow) * 0.1 });

function add(grp, geo, mat, x, y, z, ry) { const m = new T.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); if (ry) m.rotation.y = ry; grp.add(m); return m; }
function framed(grp, tex, w, h, x, y, z, ry, o) {
  o = o || {}; const g = new T.Group();
  add(g, new T.BoxGeometry(w + 0.6, h + 0.6, 0.24), MI.wood); add(g, new T.BoxGeometry(w + 0.18, h + 0.18, 0.05), MI.gilt, 0, 0, 0.12);
  add(g, new T.PlaneGeometry(w, h), o.mat || picMat(tex, o.glow), 0, 0, 0.15);
  H.exhibits.frame(g, w, h, 0.15); g.position.set(x, y, z); g.rotation.y = ry || 0; grp.add(g); return g;
}
function hangScroll(grp, tex, w, h, x, y, z, ry) {
  const g = new T.Group();
  add(g, new T.BoxGeometry(w + 0.2, h + 1.0, 0.02), MI.silk); add(g, new T.PlaneGeometry(w, h), picMat(tex, 0.4), 0, 0, 0.012);
  const rod = new T.CylinderGeometry(0.045, 0.045, w + 0.44, 8); rod.rotateZ(Math.PI / 2); add(g, rod, MI.wood, 0, -h / 2 - 0.5, 0.02); add(g, new T.BoxGeometry(w + 0.24, 0.04, 0.04), MI.wood, 0, h / 2 + 0.5, 0);
  H.exhibits.scroll(g, w, h, 0.5); g.position.set(x, y, z); g.rotation.y = ry || 0; grp.add(g); return g;
}
function lantern(grp, x, yc, z, drop) {
  const g = new T.Group();
  add(g, new T.CylinderGeometry(0.015, 0.015, drop, 4), MI.wood, 0, -drop / 2, 0);
  add(g, new T.CylinderGeometry(0.42, 0.42, 0.7, 6, 1, true), MI.lantern, 0, -drop - 0.4, 0);
  for (const dy of [-0.02, -0.78]) add(g, new T.CylinderGeometry(0.28, 0.46, 0.09, 6), MI.wood, 0, -drop + dy, 0).rotation.x = dy < -0.3 ? Math.PI : 0;
  add(g, new T.CylinderGeometry(0.03, 0.06, 0.5, 5), MI.red, 0, -drop - 1.05, 0);
  g.position.set(x, yc, z); grp.add(g);
}
function panelScreen(grp, tex, n, pw, ph, x, y, z) {          // 多扇屏风：每扇取贴图的一段，前后错开站立
  for (let i = 0; i < n; i++) {
    const g = new T.Group(), pg = new T.PlaneGeometry(pw, ph), uv = pg.attributes.uv; for (let j = 0; j < uv.count; j++) uv.setX(j, (i + uv.getX(j)) / n);
    add(g, new T.BoxGeometry(pw + 0.1, ph + 0.2, 0.09), MI.wood); add(g, pg, picMat(tex, 0.6), 0, 0, 0.05); add(g, new T.BoxGeometry(pw + 0.1, 0.5, 0.1), MI.lacquer, 0, -ph / 2 - 0.35, 0);
    g.position.set(x + (i - (n - 1) / 2) * pw, y, z + (i % 2 ? 0.2 : 0)); g.rotation.y = i % 2 ? -0.25 : 0.25; grp.add(g);
  }
}

/* ============================== 搭建三个可以进去的楼层（每个明层里看得到的那一层） ============================== */
const INSIDE = [], ROOM_H = 7.2;
const COLX = 5.2, COLZ = 3.8, WOOD = new T.MeshStandardMaterial({ color: 0x8e2416, roughness: 0.4, envMapIntensity: 0.2 });
for (let k = 0; k < 3; k++) {
  const vw = VW[k], ax = AX[k] - vw, az = AZ[k] - vw, y0 = Y[k], yc = y0 + ROOM_H, Hh = ROOM_H;
  const W = offsetPoly(rect(AX[k], AZ[k]), -vw - 0.08), grp = new T.Group(); tower.add(grp);
  add(grp, shapeGeo(W), MI.floor, 0, y0 + 0.03, 0).receiveShadow = true; add(grp, shapeGeo(W), MI.ceil, 0, yc, 0);
  add(grp, stripGeo(W, y0 + 0.12, yc - 1.4, 4.6), MI.wallIn); add(grp, stripGeo(W, yc - 1.4, yc, 6), MI.bandIn);
  const beams = [];
  for (let v = -ax; v <= ax + 0.01; v += 2 * ax / Math.round(2 * ax / 3)) beams.push(boxGeo(0.35, 0.4, az * 2, v, yc - 0.2, 0));
  for (let v = -az; v <= az + 0.01; v += 2 * az / Math.round(2 * az / 3)) beams.push(boxGeo(ax * 2, 0.4, 0.35, 0, yc - 0.2, v));
  add(grp, mergeGeos(beams), MI.beam);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    add(grp, new T.CylinderGeometry(0.62, 0.68, Hh, 24), WOOD, sx * COLX, y0 + Hh / 2, sz * COLZ);
    add(grp, new T.CylinderGeometry(0.9, 1.05, 0.4, 20), MI.stoneBase, sx * COLX, y0 + 0.2, sz * COLZ);
  }
  const zb = -az + 0.5;
  for (const p of [[-ax * 0.5, az * 0.3], [ax * 0.5, az * 0.3], [-ax * 0.5, zb + 3.5], [ax * 0.5, zb + 3.5]]) lantern(grp, p[0], yc - 0.4, p[1], 1.6);
  const ty = k === 0 ? 3.6 : 3.1;
  INSIDE.push({ grp, ax, az, y0, H: Hh, zb, view: { pos: V3(0, TY + y0 + 1.7, az * 0.78), target: V3(0, TY + y0 + ty, zb) } });

  if (k === 0) {                                               // 底层：诗屏居中，两边“白日依山尽”图与王之涣立轴，前排两根柱上挂诗句
    framed(grp, PIC.wang, 7.2, 4.27, 0, y0 + 3.6, zb, 0, { glow: 0.55 });
    framed(grp, PIC.sunset, 5.2, 3.05, -ax * 0.72, y0 + 3.3, zb + 3.2, 0.62, { glow: 0.5 });
    hangScroll(grp, PIC.wangzhihuan, 1.5, 3.0, ax * 0.74, y0 + 3.4, zb + 3.0, -0.62);
    for (const sx of [-1, 1]) add(grp, new T.BoxGeometry(0.8, 4.3, 0.08), [MI.gilt, MI.gilt, MI.gilt, MI.gilt, picMat(sx < 0 ? PIC.coupletL : PIC.coupletR, 0.6), MI.gilt], sx * COLX, y0 + 3.2, COLZ + 0.7);
    add(grp, new T.BoxGeometry(4.2, 1.0, 1.4), MI.wood, 0, y0 + 0.5, zb + 2.0); add(grp, new T.BoxGeometry(4.4, 0.08, 1.6), MI.gilt, 0, y0 + 1.04, zb + 2.0);
  } else if (k === 1) {                                        // 中层：沈括记文与蒲州古渡并置
    panelScreen(grp, PIC.shen, 8, 0.62, 3.4, -2.83, y0 + 3.1, zb + 0.15);
    hangScroll(grp, PIC.liyi, 1.5, 3.0, -ax * 0.74, y0 + 3.4, zb + 3.0, 0.62); hangScroll(grp, PIC.changdang, 1.5, 3.0, ax * 0.74, y0 + 3.4, zb + 3.0, -0.62);
    framed(grp, PIC.river, 4.9, 2.9, 2.83, y0 + 3.25, zb + 0.15, -0.05, { glow: 0.5 });
  } else {                                                     // 顶层：黄河万里图，两侧铁牛图、白鹳图
    framed(grp, PIC.map, 6.6, 3.87, 0, y0 + 3.4, zb, 0, { glow: 0.55 });
    hangScroll(grp, PIC.ox, 1.5, 3.0, -ax * 0.74, y0 + 3.4, zb + 3.0, 0.62); hangScroll(grp, PIC.stork, 1.5, 3.0, ax * 0.74, y0 + 3.4, zb + 3.0, -0.62);
  }
}

/* ============================== 室内灯光 ============================== */
const lights = [new T.PointLight(0xffe2b8, 0, 40, 1.3), new T.PointLight(0xffb878, 0, 44, 1.4), new T.PointLight(0xffd8a8, 0, 30, 1.5)];
lights.forEach(l => H.scene.add(l));
let cur = -1, dayK = 0;
function enter(k) {
  cur = k;
  if (k >= 0) { const I = INSIDE[k]; lights[0].position.set(0, TY + I.y0 + 5.6, I.zb + 4.6); lights[1].position.set(0, TY + I.y0 + 4, I.az * 0.2); lights[2].position.set(0, TY + I.y0 + 2.6, I.az * 0.7); }
  setTime(dayK);
}
function setTime(g) {
  dayK = g; const on = cur >= 0 ? 1 : 0;
  const d = clamp(1 - g * 2.5, 0, 1), du = clamp(1 - Math.abs(g - 0.4) * 2.5, 0, 1);
  MI.wallIn.emissive.setRGB(0.85 * d + 1.25 * du + 0.05, 0.98 * d + 0.7 * du + 0.07, 1.25 * d + 0.4 * du + 0.14);
  MI.wallIn.emissiveIntensity = 1.15 * d + 0.9 * du + 0.1;
  lights[0].intensity = on * (1.6 + g * 0.6); lights[1].intensity = on * (1.0 + g * 0.6); lights[2].intensity = on * 0.6;
}
H.interior = { INSIDE, enter, setTime, MI, PIC };
H.exhibits.upgrade(H.interior);
})();
