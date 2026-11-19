/* 黄鹤楼 · 楼内五层：暗厅、透光窗棂、宫灯，以及水墨风格的壁画、石刻、卷轴、屏风 */
(function () {
'use strict';
const H = window.HHL, T = THREE;
const { lerp, clamp, rng, V3, fbm, ridged, canvasTex, makeCanvas, pixelCanvas, texFrom, normalFromCanvas, stripGeo, shapeGeo, boxGeo, mergeGeos, offsetPoly, plan } = H;
const { group: tower, E, PP, Y, YTOP, TY, colTopY, TX, KAI } = H.tower;

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

/* ============================== 各层的画与石刻 ============================== */
const PIC = {};
PIC.crane = canvasTex(768, 1152, function (g, w, h) {         // 一层《白云黄鹤图》
  paper(g, w, h, '#d9e4dc', '#ead9ae', 3);
  g.save(); g.filter = 'blur(10px)'; g.fillStyle = 'rgba(214,120,60,.5)'; g.beginPath(); g.arc(560, 210, 62, 0, 7); g.fill(); g.restore(); g.fillStyle = 'rgba(196,74,40,.82)'; g.beginPath(); g.arc(560, 210, 46, 0, 7); g.fill();
  ridge(g, w, { y: 800, amp: 300, freq: 0.0034, seed: 4, col: QING, a: 0.3, fade: 220, blur: 6 });
  mist(g, 400, 780, 460, 46, 0.8, 22);
  ridge(g, w, { y: 900, amp: 220, freq: 0.005, seed: 17, col: LV, a: 0.5, fade: 160, blur: 2.5, rough: 110 });
  mist(g, 560, 880, 300, 34, 0.7, 16);
  ridge(g, w, { y: 1000, amp: 150, freq: 0.008, seed: 40, col: INK, a: 0.6, fade: 110, blur: 1, rough: 220, trees: 40 });
  ripples(g, 0, w, 1020, 1140, 150, 5);
  g.save(); g.filter = 'blur(1px)'; g.fillStyle = 'rgba(52,64,58,.78)'; g.beginPath(); g.moveTo(40, 1010); g.quadraticCurveTo(90, 900, 150, 880); g.lineTo(330, 880); g.quadraticCurveTo(390, 930, 420, 1010); g.closePath(); g.fill(); g.restore();
  drawTower(g, 240, 884, 200, 5);
  auspCloud(g, 180, 300, 54); auspCloud(g, 590, 520, 62); auspCloud(g, 330, 690, 44); auspCloud(g, 640, 760, 36); auspCloud(g, 110, 560, 34);
  drawCrane(g, 400, 410, 150, -0.12); drawFigure(g, 392, 412, 62, ['#3a5f9a', '#27457a'], { beard: true });
  drawCrane(g, 640, 300, 52, 0.1); drawCrane(g, 150, 170, 44, -0.25);
  const r = rng(6); for (let i = 0; i < 260; i++) { g.fillStyle = 'rgba(214,170,70,' + (0.2 + r() * 0.5) + ')'; g.fillRect(r() * w, r() * h * 0.6, 1.5 + r() * 2.5, 1.5 + r() * 2.5); }
  vtext(g, '白云黄鹤图', 706, 96, 50, '#2a2420', 1.28); seal(g, 684, 430, 42, '仙');
  // 印花釉面下的示意图保留画意，板缝与釉层反光显出陶板的实体感。
  for (let y = 0; y < h; y += 96) for (let x = 0; x < w; x += 96) {
    const glaze = g.createLinearGradient(x, y, x + 96, y + 96);
    glaze.addColorStop(0, 'rgba(255,244,223,' + (0.10 + r() * 0.14) + ')');
    glaze.addColorStop(0.48, 'rgba(255,249,235,0)');
    glaze.addColorStop(1, 'rgba(60,46,34,' + (0.07 + r() * 0.09) + ')');
    g.fillStyle = glaze;
    g.fillRect(x, y, 96, 96);
    g.strokeStyle = 'rgba(78,65,52,.48)';
    g.lineWidth = 1.4;
    g.strokeRect(x + 0.7, y + 0.7, 94.6, 94.6);
    g.strokeStyle = 'rgba(255,244,222,.48)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x + 2.5, y + 94);
    g.lineTo(x + 2.5, y + 2.5);
    g.lineTo(x + 94, y + 2.5);
    g.stroke();
  }
});
function coupletTex(t) { return canvasTex(160, 1280, function (g, w, h) { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#0d1c3c'); gr.addColorStop(0.5, '#182c58'); gr.addColorStop(1, '#0d1c3c'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.strokeStyle = '#c9a24a'; g.lineWidth = 9; g.strokeRect(7, 7, w - 14, h - 14); g.shadowColor = 'rgba(0,0,0,.7)'; g.shadowBlur = 6; vtext(g, t, w / 2, 90, 96, '#f0c95a', 1.16); }); }
PIC.coupletL = coupletTex('爽气西来云雾扫开天地撼'); PIC.coupletR = coupletTex('大江东去波涛洗净古今愁');
(function () {                                                // 二层《黄鹤楼记》石刻：深色石面 + 阴刻填金
  const W = 1536, Hh = 560;
  const txt = makeCanvas(W, Hh, function (g) {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, Hh);
    vtext(g, '黃鶴樓記', 1430, 75, 58, '#fff', 1.25);
    vtext(g, '唐閻伯理撰', 1430, 369, 27, '#fff', 1.28);
    // 《文苑英华》卷八一〇通行文字，保留竖排右读，异文依课件所据版本。
    const text = '州城西南隅有黃鶴樓者圖經云費禕登仙嘗駕黃鶴返憩于此遂以名樓事列神仙之傳跡存述異之志觀其聳構巍峨高標巃嵸上倚河漢下臨江流重簷翼館四闥霞敞坐窺井邑俯拍雲煙亦荊吳形勝之最也何必賴鄉九柱東陽八詠乃可賞觀時物會集靈仙者哉刺史兼侍御史淮西租庸使鄂岳沔等州都團練使河南穆公名寧下車而亂繩皆理發號而庶政其凝或逶迤退公或登車送遠遊必於是極長川之浩浩見眾山之累累王室載懷思仲宣之能賦仙蹤可揖嘉叔偉之芳塵乃喟然曰黃鶴來時歌城郭之並是浮雲一去惜人世之俱非有命抽毫紀茲貞石時皇唐永泰元年歲次大荒落月孟夏日庚寅也';
    (text.match(/.{1,13}/gu) || []).forEach((column, i) => vtext(g, column, 1334 - i * 61, 60, 33, '#fff', 1.12));
  });
  const m = txt.getContext('2d').getImageData(0, 0, W, Hh).data;
  PIC.tablet = texFrom(pixelCanvas(W, Hh, (u, v, x, y) => { const t = m[(y * W + x) * 4] / 255, n = fbm(u * 10, v * 7, 5), vein = Math.pow(n, 3) * 0.22; const k = 0.63 + 0.42 * n + vein; return [lerp(46 * k, 212, t), lerp(54 * k, 168, t), lerp(56 * k, 82, t)]; }));
  PIC.tabletN = normalFromCanvas(pixelCanvas(W, Hh, (u, v, x, y) => { const k = 200 - m[(y * W + x) * 4] * 0.7; return [k, k, k]; }), 2.4);
})();
function exhibitTiles(width, height, title, seed) {
  return canvasTex(width, height, (g, w, h) => {
    paper(g, w, h, '#ddcfb9', '#d1c1a8', seed);
    g.strokeStyle = 'rgba(70,55,43,0.21)';
    g.lineWidth = 1;
    for (let y = 0; y < h; y += 90) for (let x = 0; x < w; x += 90) g.strokeRect(x, y, 90, 90);
    htext(g, title, w / 2, h / 2, h * 0.067, '#5b4536');
  });
}
PIC.sunquan = exhibitTiles(800, 760, '孫權築城', 57);
PIC.zhouyu = exhibitTiles(800, 760, '周瑜設宴', 58);
PIC.poetMural = exhibitTiles(2048, 740, '人文薈萃', 59);
PIC.cuiPoem = canvasTex(768, 600, function (g, w, h) {
  paper(g, w, h, '#f1e8d0', '#e4d6b2', 41); vtext(g, '黄鹤楼', 706, 84, 52, '#8a1c12', 1.18); vtext(g, '崔颢', 706, 330, 34, '#8a1c12', 1.2); seal(g, 688, 440, 36, '颢');
  ['昔人已乘黄鹤去', '此地空余黄鹤楼', '黄鹤一去不复返', '白云千载空悠悠', '晴川历历汉阳树', '芳草萋萋鹦鹉洲', '日暮乡关何处是', '烟波江上使人愁'].forEach((s, i) => vtext(g, s, 622 - i * 78, 74, 62, '#1e1a16', 1.16));
});
PIC.screen = canvasTex(2048, 900, function (g, w, h) {          // 四层：通景屏风
  paper(g, w, h, '#efe6cc', '#dfd0aa', 51); landscape(g, w, h, 120, { horizon: 0.6 });
  drawTower(g, 1420, 520, 110, 3); g.save(); g.filter = 'blur(8px)'; g.fillStyle = 'rgba(196,74,40,.75)'; g.beginPath(); g.arc(420, 170, 46, 0, 7); g.fill(); g.restore();
  for (const b of [[700, 720], [1100, 770], [1700, 740]]) { g.fillStyle = 'rgba(40,36,30,.8)'; g.beginPath(); g.moveTo(b[0] - 30, b[1]); g.quadraticCurveTo(b[0], b[1] + 12, b[0] + 30, b[1]); g.fill(); g.fillStyle = 'rgba(250,245,230,.85)'; g.beginPath(); g.moveTo(b[0], b[1] - 2); g.lineTo(b[0], b[1] - 46); g.quadraticCurveTo(b[0] + 22, b[1] - 22, b[0] + 20, b[1] - 2); g.fill(); }
  drawCrane(g, 900, 230, 46, -0.1); drawCrane(g, 1010, 180, 34, -0.2); vtext(g, '江汉揽胜', 1960, 90, 60, '#221e1a', 1.2); seal(g, 1936, 400, 44, '游');
});
function calliScroll(t, seed) { return canvasTex(256, 1024, function (g, w, h) { paper(g, w, h, '#f1e8d0', '#e6d8b4', seed); vtext(g, t, w / 2, 150, 150, '#1a1612', 1.3); seal(g, 180, 880, 40, '印'); }); }
PIC.calli = [calliScroll('白云黄鹤', 61), calliScroll('江山如画', 62)];
PIC.scroll = canvasTex(2048, 512, function (g, w, h) {          // 五层《长江万里图》
  paper(g, w, h, '#eee4c8', '#e0d0a8', 71);
  ridge(g, w, { y: 250, amp: 190, freq: 0.0026, seed: 200, col: QING, a: 0.3, fade: 130, blur: 5 }); mist(g, 1000, 250, 1100, 26, 0.75, 16);
  g.fillStyle = 'rgba(252,250,244,.95)'; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(60 + i * 62, 180); g.lineTo(96 + i * 62, 96 + i * 10); g.lineTo(132 + i * 62, 180); g.fill(); }
  ridge(g, 520, { y: 300, amp: 170, freq: 0.006, seed: 210, col: [120, 134, 140], a: 0.6, fade: 100, blur: 1.5, rough: 60 });
  g.save(); g.beginPath(); g.rect(640, 0, 420, h); g.clip(); ridge(g, w, { y: 250, amp: 210, freq: 0.012, seed: 220, col: LV, a: 0.72, fade: 60, blur: 1, rough: 170, trees: 24 }); ridge(g, w, { y: 500, amp: 150, freq: 0.012, seed: 230, col: INK, a: 0.66, fade: 30, blur: 1, rough: 150, trees: 20 }); g.restore();
  ridge(g, w, { y: 470, amp: 90, freq: 0.006, seed: 240, col: INK, a: 0.45, fade: 60, blur: 1.5, rough: 130, trees: 30 });
  g.save(); g.filter = 'blur(2px)'; g.strokeStyle = 'rgba(94,138,150,.9)'; g.lineWidth = 58; g.lineCap = 'round'; g.beginPath(); g.moveTo(130, 330); g.bezierCurveTo(430, 420, 580, 300, 830, 340); g.bezierCurveTo(1080, 380, 1180, 260, 1410, 330); g.bezierCurveTo(1590, 380, 1730, 310, 1840, 330); g.stroke();
  g.fillStyle = 'rgba(94,138,150,.9)'; g.fillRect(1820, 190, 240, 290); g.restore(); ripples(g, 140, 2030, 320, 345, 70, 9); ripples(g, 1830, 2040, 200, 470, 60, 10);
  g.fillStyle = 'rgba(70,90,72,.85)'; g.beginPath(); g.ellipse(1320, 292, 130, 26, 0, 0, 7); g.fill(); drawTower(g, 1330, 280, 74, 5);
  for (const x of [480, 1040, 1560, 1730]) { g.fillStyle = 'rgba(40,36,30,.85)'; g.beginPath(); g.moveTo(x - 22, 330); g.quadraticCurveTo(x, 340, x + 22, 330); g.fill(); g.fillStyle = 'rgba(250,245,230,.9)'; g.beginPath(); g.moveTo(x, 328); g.lineTo(x, 290); g.quadraticCurveTo(x + 18, 310, x + 16, 328); g.fill(); }
  for (const t of [['雪山', 190, 50], ['三峡', 850, 50], ['武汉 · 黄鹤楼', 1330, 50], ['大海', 1930, 130]]) { g.fillStyle = 'rgba(168,38,26,.9)'; const tw = t[0].length * 44 + 30; g.fillRect(t[1] - tw / 2, t[2] - 30, tw, 60); htext(g, t[0], t[1], t[2] + 3, 42, '#f6ead8'); }
  vtext(g, '长江万里图', 40, 320, 34, '#2a2420', 1.15);
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
const modelWood = new T.MeshStandardMaterial({ color: 0x674020, roughness: 0.75, envMapIntensity: 0.22 });
const modelTrim = new T.MeshStandardMaterial({ color: 0xa37847, roughness: 0.67, envMapIntensity: 0.22 });
const modelRoof = new T.MeshStandardMaterial({ color: 0x8c5d35, roughness: 0.7, envMapIntensity: 0.22, side: T.DoubleSide });

function modelEaves(group, y, w, d, rise, ridge, corners) {
  const positions = [], indices = [];
  const rows = [[1, 0], [0.82, 0.11], [0.54, 0.47], [ridge, 1]];
  const ring = Array.from({ length: corners }, (_, i) => {
    const a = Math.PI * 2 * (i + 0.5) / corners;
    return [Math.cos(a), Math.sin(a)];
  });
  const sides = corners * 3;
  rows.forEach(([scale, height], row) => {
    for (let i = 0; i < corners; i++) {
      const a = ring[i], b = ring[(i + 1) % corners];
      for (let step = 0; step < 3; step++) {
        const t = step / 3;
        const lift = step === 0 ? 0.09 * (1 - height) : 0;
        const x = a[0] + (b[0] - a[0]) * t;
        const z = a[1] + (b[1] - a[1]) * t;
        positions.push(w * x * scale, y + rise * height + lift, d * z * (row === 3 ? 0.045 : scale));
      }
    }
  });
  for (let r = 0; r < rows.length - 1; r++) for (let k = 0; k < sides; k++) {
    const a = r * sides + k, b = r * sides + (k + 1) % sides;
    indices.push(a, b, a + sides, b, b + sides, a + sides);
  }
  const roof = new T.BufferGeometry();
  roof.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  roof.setIndex(indices);
  roof.computeVertexNormals();
  add(group, roof, modelRoof);
}

function modelStorey(group, y, w, d, height, roofRise, ridge, corners) {
  add(group, new T.BoxGeometry(w * 1.23, 0.058, d * 1.23), modelTrim, 0, y, 0);
  add(group, new T.BoxGeometry(w * 0.66, height, d * 0.66), modelWood, 0, y + height / 2, 0);
  for (const side of [-1, 1]) {
    add(group, new T.BoxGeometry(w * 1.18, 0.024, 0.024), modelTrim, 0, y + 0.137, side * d * 0.58);
    add(group, new T.BoxGeometry(0.024, 0.024, d * 1.18), modelTrim, side * w * 0.58, y + 0.137, 0);
    for (const t of [-0.54, -0.27, 0, 0.27, 0.54]) {
      add(group, new T.BoxGeometry(0.033, height, 0.033), modelTrim, t * w, y + height / 2, side * d * 0.53);
      add(group, new T.BoxGeometry(0.027, 0.107, 0.027), modelWood, t * w, y + 0.07, side * d * 0.58);
      add(group, new T.BoxGeometry(0.027, 0.107, 0.027), modelWood, side * w * 0.58, y + 0.07, t * d);
    }
  }
  modelEaves(group, y + height, w * (corners === 4 ? 1.15 : 0.83), d * (corners === 4 ? 1.15 : 0.83), roofRise, ridge, corners);
}

function miniTower(grp, x, y, z, period) {
  const display = new T.Group();
  display.position.set(x, y, z);
  display.rotation.y = x < 0 ? 0.19 : -0.19;
  grp.add(display);
  const song = period === '宋';
  add(display, new T.BoxGeometry(3.35, 0.69, 1.9), MI.wood, 0, 0.345, 0);
  add(display, new T.BoxGeometry(3.51, 0.09, 2.06), MI.wood, 0, 0.698, 0);
  add(display, new T.PlaneGeometry(0.78, 0.32), new T.MeshBasicMaterial({ map: tagTex(period + '代') }), 0, 0.42, 0.958);
  add(display, new T.BoxGeometry(2.85, 0.095, 1.51), modelWood, 0, 0.797, 0);
  if (song) {
    modelStorey(display, 0.86, 1.26, 0.92, 0.4, 0.28, 0.60, 4);
    modelStorey(display, 1.41, 1.01, 0.78, 0.37, 0.38, 0.59, 4);
    for (const side of [-1, 1]) {
      const wing = new T.Group();
      wing.position.set(side * 1.0, 0, 0.07);
      modelStorey(wing, 0.85, 0.56, 0.62, 0.36, 0.26, 0.6, 4);
      display.add(wing);
    }
  } else {
    modelStorey(display, 0.85, 1.27, 1.15, 0.41, 0.27, 0.47, 8);
    modelStorey(display, 1.45, 0.98, 0.91, 0.37, 0.27, 0.47, 8);
    modelStorey(display, 2.0, 0.76, 0.71, 0.32, 0.39, 0.035, 8);
    add(display, new T.SphereGeometry(0.043, 12, 8), modelTrim, 0, 2.72, 0);
  }
}
function tilePicture(group, texture, w, h, x, y, z, angle, caption, sections = 1) {
  const material = picMat(texture, 0.85);
  material.roughness = 0.49;
  const mount = framed(group, null, w, h, x, y, z, angle, { mat: material });
  for (let i = 1; i < sections; i++) {
    add(mount, new T.BoxGeometry(0.055, h, 0.035), MI.wood, w * (i / sections - 0.5), 0, 0.14);
  }
  const label = canvasTex(768, 68, (g, width, height) => {
    g.fillStyle = '#36231c';
    g.fillRect(0, 0, width, height);
    htext(g, caption, width / 2, height / 2, 39, '#e3d0a8');
  });
  const labelWidth = Math.min(w * 0.92, 4.6);
  add(mount, new T.PlaneGeometry(labelWidth, labelWidth * 68 / 768), new T.MeshBasicMaterial({ map: label }), 0, -h / 2 + 0.13, 0.17);
}
for (let k = 0; k < 5; k++) {
  const a = E[k] - PP[k], vw = k === 0 ? 2.4 : 2.0, aw = a - vw, y0 = Y[k], nextY = k < 4 ? Y[k + 1] : YTOP;
  const yc = k < 4 ? nextY - 0.5 : YTOP - 1.55, Hh = yc - y0, colTop = colTopY[k];
  const W = offsetPoly(plan(a, a * 0.5, PP[k]), -vw - 0.07), grp = new T.Group(); tower.add(grp);
  const fl = shapeGeo(W); add(grp, fl, MI.floor, 0, y0 + 0.03, 0).receiveShadow = true; add(grp, shapeGeo(W), MI.ceil, 0, yc, 0);
  add(grp, stripGeo(W, y0 + 0.12, colTop + 0.3, 2.3), MI.wallIn); add(grp, stripGeo(W, colTop + 0.3, yc, 4.2), MI.bandIn);
  const cf = k === 4 ? 0.82 : 0.62, zb = -aw * (k === 4 ? 0.8 : 0.6), beams = [];
  for (let v = -aw; v <= aw + 0.01; v += aw / Math.round(aw / 1.7)) { beams.push(boxGeo(aw * 2, 0.22, 0.2, 0, yc - 0.11, v)); beams.push(boxGeo(0.2, 0.22, aw * 2, v, yc - 0.11, 0)); }
  add(grp, mergeGeos(beams), MI.beam);                         // 天花井口枋
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const c = add(grp, H.tower.M.lacquer.userData.colGeo || (H.tower.M.lacquer.userData.colGeo = new T.CylinderGeometry(0.93, 1, 1, 24)), MI.lacquer, sx * aw * cf, y0 + Hh / 2, sz * aw * cf); c.scale.set(0.44, Hh, 0.44);
    add(grp, new T.CylinderGeometry(0.56, 0.68, 0.34, 20), MI.stoneBase, sx * aw * cf, y0 + 0.17, sz * aw * cf); add(grp, new T.CylinderGeometry(0.46, 0.46, 0.14, 20), MI.gilt, sx * aw * cf, yc - 0.5, sz * aw * cf);
  }
  const lz = aw * 0.18;
  for (const p of (k === 4 ? [] : [[-aw * 0.34, lz], [aw * 0.34, lz]]).concat([[-aw * 0.34, zb + 2.2], [aw * 0.34, zb + 2.2]])) lantern(grp, p[0], yc - 0.22, p[1], k === 0 ? 2.6 : 0.9);
  const ty = k === 0 ? 5.1 : 3.0;
  INSIDE.push({ grp, aw, y0, H: Hh, zb, view: { pos: V3(0, TY + y0 + 1.7, aw * 0.76), target: V3(0, TY + y0 + ty, zb) } });

  if (k === 0) {                                               // 一层：白云黄鹤图 + 长联
    const mural = picMat(PIC.crane, 0.9);
    mural.roughness = 0.34;
    mural.envMapIntensity = 0.32;
    framed(grp, null, 6, 9, 0, y0 + 5.1, zb, 0, { mat: mural });
    for (const s of [-1, 1]) { const m = add(grp, new T.BoxGeometry(0.82, 6.6, 0.06), [MI.gilt, MI.gilt, MI.gilt, MI.gilt, picMat(s < 0 ? PIC.coupletL : PIC.coupletR, 0.55), MI.gilt], s * aw * cf, y0 + 4.6, -aw * cf + 0.5); m.rotation.y = -s * 0.08; }
    const tb = add(grp, new T.BoxGeometry(3.4, 0.9, 1.1), MI.wood, 0, y0 + 0.45, zb + 1.3); add(grp, new T.BoxGeometry(3.6, 0.06, 1.3), MI.gilt, 0, y0 + 0.93, zb + 1.3);
    const censer = new T.LatheGeometry([[0.01, 0], [0.22, 0.02], [0.3, 0.2], [0.34, 0.38], [0.26, 0.5], [0.3, 0.56], [0.01, 0.58]].map(p => new T.Vector2(p[0], p[1])), 16); add(grp, censer, H.tower.M.bronze, 0, y0 + 0.96, zb + 1.3);
  } else if (k === 1) {                                        // 二层：《黄鹤楼记》石刻 + 两幅故事画 + 历代模型
    const engraved = picMat(PIC.tablet, 0.23, PIC.tabletN);
    engraved.roughness = 0.59;
    framed(grp, null, 8.0, 3.35, 0, y0 + 4.0, zb, 0, { mat: engraved });
    tilePicture(grp, PIC.sunquan, 3.55, 3.3, -aw * 0.69, y0 + 3.67, zb + 0.8, 0.43, '孫權築城 · 課件示意');
    tilePicture(grp, PIC.zhouyu, 3.55, 3.3, aw * 0.69, y0 + 3.67, zb + 0.8, -0.43, '周瑜設宴 · 課件示意');
    miniTower(grp, -2.2, y0, zb + 2.05, '宋');
    miniTower(grp, 2.2, y0, zb + 2.05, '清');
  } else if (k === 2) {                                        // 三层：连续瓷板人物组画
    tilePicture(grp, PIC.poetMural, 9.8, 3.55, 0, y0 + 3.24, zb, 0, '人文薈萃 · 課件示意', 3);
    framed(grp, PIC.cuiPoem, 2.7, 2.08, -aw * 0.86, y0 + 2.95, zb + 1.7, 0.66, { glow: 0.53 });
  } else if (k === 3) {                                        // 四层：通景屏风 + 书案
    for (let i = 0; i < 6; i++) {
      const g = new T.Group(), pg = new T.PlaneGeometry(1.3, 3.3), uv = pg.attributes.uv; for (let j = 0; j < uv.count; j++) uv.setX(j, (i + uv.getX(j)) / 6);
      add(g, new T.BoxGeometry(1.42, 3.5, 0.07), MI.wood); add(g, pg, picMat(PIC.screen, 0.42), 0, 0.02, 0.04); add(g, new T.BoxGeometry(1.42, 0.5, 0.075), MI.lacquer, 0, -1.98, 0);
      g.position.set((i - 2.5) * 1.3, y0 + 2.45, zb + (i % 2 ? 0.24 : 0)); g.rotation.y = i % 2 ? -0.36 : 0.36; grp.add(g);
    }
    hangScroll(grp, PIC.calli[0], 0.9, 3.4, -aw * 0.8, y0 + 3.1, zb + 1.2, 0.6); hangScroll(grp, PIC.calli[1], 0.9, 3.4, aw * 0.8, y0 + 3.1, zb + 1.2, -0.6);
    add(grp, new T.BoxGeometry(2.8, 0.1, 1.2), MI.wood, 0, y0 + 0.86, zb + 2.7); for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(grp, new T.BoxGeometry(0.11, 0.82, 0.11), MI.wood, sx * 1.28, y0 + 0.41, zb + 2.7 + sz * 0.48);
    add(grp, new T.BoxGeometry(1.6, 0.012, 0.7), MI.paper, -0.25, y0 + 0.918, zb + 2.7); add(grp, new T.BoxGeometry(0.3, 0.05, 0.2), MI.ink, 0.75, y0 + 0.94, zb + 2.9);
    add(grp, new T.CylinderGeometry(0.07, 0.06, 0.2, 10), MI.gilt, 1.1, y0 + 1.01, zb + 2.5); for (const d of [-0.02, 0.02, 0]) add(grp, new T.CylinderGeometry(0.008, 0.008, 0.34, 4), MI.wood, 1.1 + d, y0 + 1.22, zb + 2.5 + d);
  } else {                                                     // 五层：长江万里图
    framed(grp, PIC.scroll, 8.4, 2.1, 0, y0 + 2.95, zb, 0, { glow: 0.45 });
    add(grp, new T.BoxGeometry(9.2, 0.7, 0.7), MI.wood, 0, y0 + 0.35, zb + 0.4); add(grp, new T.BoxGeometry(9.3, 0.05, 0.8), MI.gilt, 0, y0 + 0.72, zb + 0.4);
  }
}

/* ============================== 室内灯光 ============================== */
const lights = [new T.PointLight(0xffe2b8, 0, 34, 1.3), new T.PointLight(0xffb878, 0, 42, 1.4), new T.PointLight(0xffd8a8, 0, 26, 1.5)];
lights.forEach(l => H.scene.add(l));
let cur = -1, dayK = 0;
function enter(k) {
  cur = k;
  if (k >= 0) { const I = INSIDE[k]; lights[0].position.set(0, TY + I.y0 + Math.min(I.H * 0.72, 6.5), I.zb + 4.2); lights[1].position.set(0, TY + I.y0 + Math.min(I.H * 0.5, 3.4), I.aw * 0.15); lights[2].position.set(0, TY + I.y0 + 2.4, I.aw * 0.7); }
  setTime(dayK);
}
function setTime(g) {                                          // g：0 白天 … 1 夜晚。白天窗棂透进冷白天光，傍晚转暖，夜里只剩灯
  dayK = g; const on = cur >= 0 ? 1 : 0;
  const d = clamp(1 - g * 2.5, 0, 1), du = clamp(1 - Math.abs(g - 0.4) * 2.5, 0, 1);
  MI.wallIn.emissive.setRGB(0.85 * d + 1.25 * du + 0.05, 0.98 * d + 0.7 * du + 0.07, 1.25 * d + 0.4 * du + 0.14);
  MI.wallIn.emissiveIntensity = 1.15 * d + 0.9 * du + 0.1;
  lights[0].intensity = on * (1.5 + g * 0.5); lights[1].intensity = on * (0.9 + g * 0.6); lights[2].intensity = on * 0.5;
}
H.interior = { INSIDE, enter, setTime, MI, PIC };
H.exhibits.upgrade(H.interior);
})();
