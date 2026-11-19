/* 黄鹤楼 · 楼体：台基、五层楼身、飞檐、斗拱、攒尖顶 */
(function () {
'use strict';
const H = window.HHL, T = THREE;
const { lerp, smooth, rng, canvasTex, makeCanvas, pixelCanvas, texFrom, normalFromCanvas, gridGeo, stripGeo, tubeGeo, boxGeo, tint, mergeGeos, polyInfo, offsetPoly, plan, shapeGeo } = H;
const KAI = '"KaiTi","STKaiti","楷体","SimSun",serif';

const PH = 3.0, TY = PH + 0.35;                       // 台基高、楼体基面
const tower = new T.Group(); tower.position.y = TY; H.scene.add(tower);
const E = [15, 13.5, 12, 10.5, 9];                    // 各层半边宽（底层边宽 30 m，顶层 18 m）
const PP = [2.0, 1.8, 1.6, 1.5, 1.4];                 // 抱厦出挑
const Y = [0, 10.5, 17.6, 24.5, 31.2];                // 各层楼面标高
const RISE = [2.8, 2.4, 2.3, 2.2, 2.2], YTOP = 38.0;
const C = { red: 0x7a1c12, dark: 0x4f140c, blue: 0x1f4a7c, green: 0x2a6f55, gold: 0xc9a24a, stone: 0xb4afa2 };

/* ============================== 贴图 ============================== */
const tr = rng(77), tileRnd = []; for (let i = 0; i < 16; i++) tileRnd.push(0.86 + tr() * 0.26);
function tileH(u, v) {                                // 筒瓦隆起、板瓦下凹、逐行叠压
  const cu = (u * 4) % 1, cv = (v * 4) % 1, d = Math.abs(cu - 0.5) / 0.29;
  let h = d < 1 ? 0.42 + 0.58 * Math.sqrt(1 - d * d) : 0.3 - 0.16 * Math.min(1, (d - 1) / 0.72);
  h += 0.1 * cv; if (cv < 0.05) h -= 0.22;
  return Math.max(0, Math.min(1, h));
}
const tileHeight = pixelCanvas(512, 512, (u, v) => { const k = tileH(u, v) * 255; return [k, k, k]; });
const tileColor = pixelCanvas(512, 512, (u, v) => {
  const cu = (u * 4) % 1, cv = (v * 4) % 1, d = Math.abs(cu - 0.5) / 0.29, cover = d < 1 ? 1 : 0;
  const r = tileRnd[(Math.floor(u * 4) & 3) * 4 + (Math.floor(v * 4) & 3)], n = 0.9 + 0.2 * H.fbm(u * 40, v * 40, 3, 40);
  let k = r * n * (cv < 0.05 ? 0.55 : 1) * (cover ? 1 : 0.72);
  return [208 * k, (cover ? 148 : 122) * k, (cover ? 26 : 18) * k];
});
const TX = {
  tile: texFrom(tileColor), tileN: normalFromCanvas(tileHeight, 3.2),
  rafter: null, rafterN: null, wall: null, wallN: null, wallGlow: null, caihua: null, stone: null, stoneN: null, relief: null, railPanel: null, hang: null, gable: null
};
(function () {                                        // 檐下椽子
  const hc = pixelCanvas(128, 128, u => { const d = Math.abs(u - 0.5) / 0.3, k = d < 1 ? 90 + 165 * Math.sqrt(1 - d * d) : 40; return [k, k, k]; });
  TX.rafter = texFrom(pixelCanvas(128, 128, (u, v) => { const d = Math.abs(u - 0.5) / 0.3, n = 0.85 + 0.3 * H.vnoise(u * 9, v * 30, 0); return d < 1 ? [124 * n, 48 * n, 31 * n] : [92 * n, 38 * n, 25 * n]; }));
  TX.rafterN = normalFromCanvas(hc, 2.5);
})();
(function () {                                        // 隔扇门窗：颜色、夜间透光、起伏
  const W = 512, Hh = 1024;
  function draw(mode) {                               // 0 颜色 1 透光 2 高度
    return makeCanvas(W, Hh, function (g) {
      const fill = (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
      fill(mode === 0 ? '#551810' : mode === 1 ? '#000' : '#b0b0b0', 0, 0, W, Hh);
      for (const x0 of [30, 262]) {
        const lw = 220;
        fill(mode === 0 ? '#6a2014' : mode === 1 ? '#000' : '#e0e0e0', x0, 14, lw, Hh - 28);                 // 边梃
        const panel = (y, h, deco) => {
          fill(mode === 0 ? '#571a10' : mode === 1 ? '#000' : '#8a8a8a', x0 + 16, y, lw - 32, h);
          if (mode === 0) {
            g.strokeStyle = '#b8923f'; g.lineWidth = 2.5; g.strokeRect(x0 + 26, y + 10, lw - 52, h - 20);
            if (deco) { g.beginPath(); const cx = x0 + lw / 2, cy = y + h / 2, r = Math.min(lw, h) * 0.2;
              for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; g.moveTo(cx, cy); g.quadraticCurveTo(cx + Math.cos(a - 0.5) * r * 1.5, cy + Math.sin(a - 0.5) * r * 1.5, cx + Math.cos(a) * r * 1.9, cy + Math.sin(a) * r * 1.9); g.quadraticCurveTo(cx + Math.cos(a + 0.5) * r * 1.5, cy + Math.sin(a + 0.5) * r * 1.5, cx, cy); }
              g.stroke(); g.beginPath(); g.arc(cx, cy, r * 0.45, 0, 7); g.stroke(); }
          }
        };
        panel(30, 78, false); panel(668, 70, false); panel(756, 236, true);
        const lx = x0 + 16, ly = 126, lww = lw - 32, lh = 524;                                           // 棂格
        fill(mode === 0 ? '#17110e' : mode === 1 ? '#ffb665' : '#101010', lx, ly, lww, lh);
        const bar = mode === 0 ? '#7a2618' : mode === 1 ? '#1a0a04' : '#d8d8d8', st = lww / 7;
        for (let i = 0; i <= 7; i++) fill(bar, lx + i * st - 2.5, ly, 5, lh);
        for (let y = ly; y <= ly + lh + 1; y += st) fill(bar, lx, y - 2.5, lww, 5);
        g.strokeStyle = bar; g.lineWidth = 9; g.strokeRect(lx + 2, ly + 2, lww - 4, lh - 4);
        if (mode === 0) { g.fillStyle = '#b8923f'; for (let i = 1; i < 7; i++) for (let y = ly + st; y < ly + lh - 2; y += st) { g.beginPath(); g.arc(lx + i * st, y, 2.2, 0, 7); g.fill(); } }
      }
      if (mode === 0) { const gr = g.createLinearGradient(0, 0, 0, Hh); gr.addColorStop(0, 'rgba(0,0,0,.28)'); gr.addColorStop(0.2, 'rgba(0,0,0,0)'); gr.addColorStop(0.85, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.3)'); g.fillStyle = gr; g.fillRect(0, 0, W, Hh); }
    });
  }
  TX.wall = texFrom(draw(0)); TX.wallGlow = texFrom(draw(1)); TX.wallN = normalFromCanvas(draw(2), 1.6);
})();
TX.caihua = canvasTex(1024, 128, function (g, w, h) {  // 旋子彩画：箍头—藻头—枋心
  g.fillStyle = '#20406e'; g.fillRect(0, 0, w, h);
  const band = (x, ww, c) => { g.fillStyle = c; g.fillRect(x, 0, ww, h); };
  band(0, 46, '#2c6a52'); band(w - 46, 46, '#2c6a52'); band(46, 12, '#c9a24a'); band(w - 58, 12, '#c9a24a');
  g.fillStyle = '#285f4c'; g.beginPath(); g.moveTo(330, 0); g.lineTo(390, h / 2); g.lineTo(330, h); g.lineTo(694, h); g.lineTo(634, h / 2); g.lineTo(694, 0); g.fill();
  g.strokeStyle = '#c9a24a'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(330, 4); g.lineTo(390, h / 2); g.lineTo(330, h - 4); g.moveTo(694, 4); g.lineTo(634, h / 2); g.lineTo(694, h - 4); g.stroke();
  const rosette = (cx) => { for (let r = 46; r > 8; r -= 12) { g.strokeStyle = r % 24 ? '#e8e2d0' : '#c9a24a'; g.lineWidth = 2; g.beginPath(); g.arc(cx, h / 2, r, 0, 7); g.stroke(); }
    for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; g.beginPath(); g.arc(cx + Math.cos(a) * 30, h / 2 + Math.sin(a) * 30, 9, 0, 7); g.strokeStyle = '#c9a24a'; g.stroke(); }
    g.fillStyle = '#8a2a1c'; g.beginPath(); g.arc(cx, h / 2, 8, 0, 7); g.fill(); };
  rosette(120); rosette(250); rosette(774); rosette(904);
  g.strokeStyle = '#c9a24a'; g.lineWidth = 2.5; g.beginPath();
  for (let x = 410; x <= 614; x += 4) { const y = h / 2 + Math.sin((x - 410) / 204 * Math.PI * 4) * 16; x === 410 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
  g.strokeStyle = 'rgba(232,226,208,.8)'; g.lineWidth = 2; g.strokeRect(1, 5, w - 2, h - 10);
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(0,0,0,.35)'); gr.addColorStop(0.35, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.15)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
});
(function () {                                        // 汉白玉：砌缝 + 细纹
  const S = 512, joints = (x, y) => { const row = Math.floor(y * 4), xo = (row % 2) * 0.25, fx = ((x + xo) * 2) % 1, fy = (y * 4) % 1; return fx < 0.012 || fy < 0.03; };
  TX.stone = texFrom(pixelCanvas(S, S, (u, v) => { const n = H.fbm(u * 6, v * 6, 5, 6), m = H.fbm(u * 30 + 9, v * 30, 3, 30); let k = 0.82 + 0.2 * n + 0.06 * m; if (joints(u, v)) k *= 0.62; return [222 * k, 216 * k, 202 * k]; }));
  TX.stoneN = normalFromCanvas(pixelCanvas(S, S, (u, v) => { const k = (joints(u, v) ? 60 : 170) + 60 * H.fbm(u * 40, v * 40, 3, 40); return [k, k, k]; }), 1.4);
  const rc = makeCanvas(512, 256, function (g, w, h) {  // 栏板、御路的浮雕（云纹）
    g.fillStyle = '#606060'; g.fillRect(0, 0, w, h); g.strokeStyle = '#d0d0d0'; g.lineWidth = 10; g.strokeRect(14, 14, w - 28, h - 28);
    const r = rng(9); g.lineWidth = 7; g.lineCap = 'round';
    for (let i = 0; i < 9; i++) { const cx = 60 + r() * (w - 120), cy = 50 + r() * (h - 100), s = 16 + r() * 16; g.strokeStyle = '#c8c8c8'; g.beginPath(); for (let a = 0; a < 9; a += 0.25) { const rr = s * (1 - a / 10); g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.8); } g.stroke();
      g.beginPath(); g.moveTo(cx + s, cy); g.quadraticCurveTo(cx + s * 2.2, cy - s * 0.6, cx + s * 3, cy + s * 0.2); g.stroke(); }
  });
  TX.relief = normalFromCanvas(rc, 3);
})();
TX.railPanel = canvasTex(256, 128, function (g, w, h) { // 木栏杆的透空棂条
  g.clearRect(0, 0, w, h); g.strokeStyle = '#6e1e13'; g.lineWidth = 9;
  g.strokeRect(5, 5, w - 10, h - 10); g.lineWidth = 7;
  for (let x = 0; x <= w; x += 64) { g.beginPath(); g.moveTo(x, 5); g.lineTo(x, h - 5); g.stroke(); }
  g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
  for (let x = 32; x < w; x += 64) { g.strokeRect(x - 15, h / 2 - 22, 30, 44); }
});
TX.hang = canvasTex(256, 128, function (g, w, h) {      // 挂檐板
  g.fillStyle = '#641a10'; g.fillRect(0, 0, w, h); g.strokeStyle = '#b8923f'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(0, 14); g.lineTo(w, 14); g.moveTo(0, h - 14); g.lineTo(w, h - 14); g.stroke();
  for (let x = 32; x < w; x += 64) { g.beginPath(); g.arc(x, h / 2, 20, 0, 7); g.stroke(); g.beginPath(); g.arc(x, h / 2, 8, 0, 7); g.fillStyle = '#b8923f'; g.fill(); g.beginPath(); g.moveTo(x + 20, h / 2); g.lineTo(x + 44, h / 2); g.stroke(); }
});
TX.gable = canvasTex(512, 256, function (g, w, h) {     // 山花
  g.fillStyle = '#6a1c12'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c9a24a'; g.lineWidth = 5;
  const cx = w / 2, cy = h * 0.62;
  for (const r of [h * 0.3, h * 0.2]) { g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke(); }
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g.beginPath(); g.moveTo(cx + Math.cos(a) * h * 0.08, cy + Math.sin(a) * h * 0.08); g.lineTo(cx + Math.cos(a) * h * 0.2, cy + Math.sin(a) * h * 0.2); g.stroke(); }
  g.fillStyle = '#c9a24a'; g.beginPath(); g.arc(cx, cy, h * 0.07, 0, 7); g.fill();
  for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(cx + sx * h * 0.36, cy + 10); g.quadraticCurveTo(cx + sx * h * 0.6, cy - 30, cx + sx * h * 0.8, cy + 30); g.stroke(); }
});
function plaqueTex(text) {
  const n = text.length;
  return canvasTex(150 * n + 130, 270, function (g, w, h) {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0f2a5c'); gr.addColorStop(1, '#081a3c'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#d9b04a'; g.lineWidth = 18; g.strokeRect(9, 9, w - 18, h - 18); g.strokeStyle = '#7a1c12'; g.lineWidth = 5; g.strokeRect(25, 25, w - 50, h - 50);
    g.fillStyle = '#f0c95a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 150px ' + KAI;
    g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 8; g.shadowOffsetY = 4;
    for (let i = 0; i < n; i++) g.fillText(text[i], 65 + 150 * i + 75, h / 2 + 8);
  });
}

/* ============================== 材质 ============================== */
const M = H.towerMat = {
  tile: new T.MeshPhysicalMaterial({ map: TX.tile, normalMap: TX.tileN, normalScale: new T.Vector2(1.5, 1.5), roughness: 0.42, clearcoat: 0.75, clearcoatRoughness: 0.22, side: T.DoubleSide, emissive: 0xffb45a, emissiveIntensity: 0 }),
  glaze: new T.MeshPhysicalMaterial({ color: 0xb8811a, roughness: 0.36, clearcoat: 0.8, clearcoatRoughness: 0.2, emissive: 0xffb45a, emissiveIntensity: 0 }),
  gold: new T.MeshStandardMaterial({ color: 0xe0ad3a, roughness: 0.24, metalness: 1, emissive: 0xffa520, emissiveIntensity: 0 }),
  rafter: new T.MeshStandardMaterial({ map: TX.rafter, normalMap: TX.rafterN, roughness: 0.7, side: T.DoubleSide, envMapIntensity: 0.8, emissive: 0xff6a20, emissiveIntensity: 0 }),
  wall: new T.MeshStandardMaterial({ map: TX.wall, normalMap: TX.wallN, roughness: 0.5, envMapIntensity: 0.55, emissive: 0xffffff, emissiveMap: TX.wallGlow, emissiveIntensity: 0, side: T.DoubleSide }),
  caihua: new T.MeshStandardMaterial({ map: TX.caihua, roughness: 0.62, envMapIntensity: 0.4, side: T.DoubleSide, emissive: 0x6a5a40, emissiveIntensity: 0 }),
  lacquer: new T.MeshStandardMaterial({ color: C.red, roughness: 0.36, envMapIntensity: 0.75, emissive: 0xff3a10, emissiveIntensity: 0 }),
  woodI: new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, envMapIntensity: 0.45 }),
  paint: new T.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.6, envMapIntensity: 0.35, emissive: 0x33506a, emissiveIntensity: 0 }),
  slab: new T.MeshStandardMaterial({ color: 0x5e1a10, roughness: 0.6, envMapIntensity: 0.4 }),
  hang: new T.MeshStandardMaterial({ map: TX.hang, roughness: 0.6, envMapIntensity: 0.4, side: T.DoubleSide }),
  railPanel: new T.MeshStandardMaterial({ map: TX.railPanel, alphaTest: 0.5, side: T.DoubleSide, roughness: 0.6, envMapIntensity: 0.4 }),
  stone: new T.MeshStandardMaterial({ color: 0xc9c5ba, map: TX.stone, normalMap: TX.stoneN, roughness: 0.78, envMapIntensity: 0.6 }),
  stoneI: new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, envMapIntensity: 0.6 }),
  relief: new T.MeshStandardMaterial({ color: C.stone, normalMap: TX.relief, normalScale: new T.Vector2(1.6, 1.6), roughness: 0.7, envMapIntensity: 0.6 }),
  gable: new T.MeshStandardMaterial({ map: TX.gable, roughness: 0.6, side: T.DoubleSide, envMapIntensity: 0.4 }),
  bronze: new T.MeshStandardMaterial({ color: 0x6a5a3a, roughness: 0.42, metalness: 0.9 })
};

/* ============================== 构件原型 ============================== */
const unitBox = new T.BoxGeometry(1, 1, 1);
const colGeo = new T.LatheGeometry([[1, 0], [1, 0.03], [0.985, 0.55], [0.94, 1]].map(p => new T.Vector2(p[0], p[1])), 22);     // 略带收分的圆柱
const baseGeo = new T.LatheGeometry([[1.62, 0], [1.62, 0.22], [1.5, 0.42], [1.22, 0.7], [1.12, 1]].map(p => new T.Vector2(p[0], p[1])), 22);
const dougongGeo = (function () {                     // 一攒斗拱（两跳），局部 z 轴朝外
  const g = [], Bx = (w, h, d, x, y, z, c) => g.push(tint(boxGeo(w, h, d, x, y, z), c));
  Bx(0.30, 0.16, 0.30, 0, 0.08, 0, C.green);
  Bx(0.84, 0.12, 0.13, 0, 0.24, 0, C.blue); Bx(0.13, 0.12, 0.84, 0, 0.24, 0.14, C.blue);
  for (const sx of [-0.36, 0.36]) Bx(0.16, 0.09, 0.16, sx, 0.345, 0, C.green); Bx(0.16, 0.09, 0.16, 0, 0.345, 0.48, C.green);
  Bx(1.12, 0.12, 0.13, 0, 0.45, 0, C.green); Bx(0.13, 0.12, 1.0, 0, 0.45, 0.27, C.green); Bx(0.9, 0.12, 0.13, 0, 0.45, 0.48, C.blue);
  for (const sx of [-0.5, 0.5]) Bx(0.16, 0.09, 0.16, sx, 0.555, 0, C.blue); Bx(0.16, 0.09, 0.16, 0, 0.555, 0.72, C.blue);
  for (const sx of [-0.38, 0.38]) Bx(0.16, 0.09, 0.16, sx, 0.555, 0.48, C.blue);
  Bx(1.0, 0.1, 0.13, 0, 0.65, 0.72, C.green); Bx(0.12, 0.03, 0.86, 0, 0.315, 0.14, C.gold); Bx(0.12, 0.03, 1.0, 0, 0.525, 0.27, C.gold);
  return mergeGeos(g);
})();
const queGeo = (function () {                         // 雀替：柱头两侧托着额枋的曲线小木构，局部 x 轴沿枋
  const s = new T.Shape(); s.moveTo(0, 0); s.lineTo(1.05, 0); s.quadraticCurveTo(0.95, -0.14, 0.62, -0.2); s.quadraticCurveTo(0.34, -0.3, 0.26, -0.5); s.quadraticCurveTo(0.2, -0.7, 0, -0.76); s.lineTo(0, 0);
  const g = new T.ExtrudeGeometry(s, { depth: 0.09, bevelEnabled: false }); g.translate(0, 0, -0.045);
  const f = tint(g, C.green), e = tint(boxGeo(1.0, 0.035, 0.11, 0.52, -0.02, 0), C.gold); return mergeGeos([f, e]);
})();
const wadangGeo = (function () {                      // 瓦当 + 滴水，局部 z 轴朝外
  const a = new T.CylinderGeometry(0.078, 0.078, 0.07, 12); a.rotateX(Math.PI / 2); a.translate(0, 0.04, 0);
  const b = new T.BoxGeometry(0.14, 0.14, 0.03); b.rotateZ(Math.PI / 4); b.translate(0.18, -0.07, 0);
  return mergeGeos([a, b]);
})();
const beastGeo = (function () {                       // 脊兽（简化的蹲坐造型）
  const a = new T.SphereGeometry(0.11, 8, 6); a.scale(1, 1.25, 1.2); a.translate(0, 0.13, 0);
  const b = new T.SphereGeometry(0.075, 8, 6); b.translate(0, 0.31, 0.07); const c = new T.ConeGeometry(0.035, 0.12, 5); c.translate(0, 0.42, 0.03);
  return mergeGeos([a, b, c]);
})();
const bellGeo = (function () { const a = new T.CylinderGeometry(0.05, 0.13, 0.26, 10, 1, true); a.translate(0, -0.3, 0); const b = new T.CylinderGeometry(0.012, 0.012, 0.22, 4); b.translate(0, -0.08, 0); const c = new T.SphereGeometry(0.035, 6, 5); c.translate(0, -0.46, 0); return mergeGeos([a, b, c]); })();
const stonePostGeo = (function () {                   // 石栏望柱：方身 + 莲瓣柱头
  const a = boxGeo(0.22, 1.12, 0.22, 0, 0.56, 0), b = boxGeo(0.27, 0.06, 0.27, 0, 1.15, 0);
  const c = new T.LatheGeometry([[0.07, 0], [0.12, 0.05], [0.135, 0.14], [0.11, 0.24], [0.06, 0.31], [0.0, 0.34]].map(p => new T.Vector2(p[0], p[1])), 10); c.translate(0, 1.18, 0);
  return mergeGeos([a, b, c].map(g => { g.deleteAttribute('uv'); return g; }));
})();

const bag = new H.Bag(), B = {
  col: new H.Batch(colGeo, M.lacquer), base: new H.Batch(baseGeo, M.stoneI), dg: new H.Batch(dougongGeo, M.paint), que: new H.Batch(queGeo, M.paint),
  wd: new H.Batch(wadangGeo, M.glaze), beast: new H.Batch(beastGeo, M.glaze), bell: new H.Batch(bellGeo, M.gold),
  wood: new H.Batch(unitBox, M.woodI), stone: new H.Batch(unitBox, M.stoneI), post: new H.Batch(stonePostGeo, M.stoneI), relief: new H.Batch(unitBox, M.relief)
};
const edgeRy = (dx, dz) => -Math.atan2(dz, dx);       // 让局部 x 轴沿 (dx,dz)
const outRy = (dx, dz) => Math.atan2(dz, -dx);        // 让局部 z 轴朝逆时针多边形的外法线 (dz,-dx)

function beam(P, yb, h, depth, mat, uLen) {           // 沿多边形一圈的方木：外立面 + 底面
  const Po = offsetPoly(P, depth / 2), Pi = offsetPoly(P, -depth / 2), n = P.length, pos = [], uv = [], idx = [];
  bag.add(mat, stripGeo(Po, yb, yb + h, uLen || 3.2));
  for (let i = 0; i < n; i++) { const j = (i + 1) % n, b = pos.length / 3; pos.push(Pi[i][0], yb, Pi[i][1], Pi[j][0], yb, Pi[j][1], Po[j][0], yb, Po[j][1], Po[i][0], yb, Po[i][1]); uv.push(0, 0, 1, 0, 1, 0.3, 0, 0.3); idx.push(b, b + 1, b + 2, b, b + 2, b + 3); }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); bag.add(mat, g);
}
function dougongRow(P, y) {
  const n = P.length;
  for (let i = 0; i < n; i++) {
    const A = P[i], Bq = P[(i + 1) % n], dx = Bq[0] - A[0], dz = Bq[1] - A[1], L = Math.hypot(dx, dz), m = Math.max(1, Math.round(L / 0.98)), ry = outRy(dx, dz);
    for (let j = 0; j < m; j++) B.dg.add(A[0] + dx * (j + 0.5) / m, y, A[1] + dz * (j + 0.5) / m, 1, 1, 1, ry);
  }
}
function fence(ax, az, bx, bz, y) {                   // 木栏杆一段
  const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz); if (L < 0.3) return;
  const ry = edgeRy(dx, dz), mx = (ax + bx) / 2, mz = (az + bz) / 2;
  B.wood.add(mx, y + 1.06, mz, L + 0.1, 0.09, 0.13, ry, C.red); B.wood.add(mx, y + 0.74, mz, L, 0.06, 0.07, ry, C.red); B.wood.add(mx, y + 0.18, mz, L, 0.07, 0.08, ry, C.red);
  const n = Math.max(1, Math.round(L / 1.55));
  for (let i = 0; i <= n; i++) { const x = ax + dx * i / n, z = az + dz * i / n; B.wood.add(x, y + 0.6, z, 0.13, 1.2, 0.13, ry, C.red); B.wood.add(x, y + 1.23, z, 0.17, 0.07, 0.17, ry, C.dark); }
  const m = Math.round(L / 0.52); for (let i = 0; i < m; i++) B.wood.add(ax + dx * (i + 0.5) / m, y + 0.9, az + dz * (i + 0.5) / m, 0.07, 0.26, 0.07, ry, C.red);
  const g = new T.BufferGeometry(), rep = Math.max(1, Math.round(L / 1.1));
  g.setAttribute('position', new T.Float32BufferAttribute([ax, y + 0.21, az, bx, y + 0.21, bz, bx, y + 0.71, bz, ax, y + 0.71, az], 3));
  g.setAttribute('uv', new T.Float32BufferAttribute([0, 0, rep, 0, rep, 1, 0, 1], 2)); g.setIndex([0, 2, 1, 0, 3, 2]); g.computeVertexNormals(); bag.add(M.railPanel, g);
}

/* ---- 飞檐：沿十二折角平面生成带翘角的曲面屋檐 ---- */
function buildEave(P, o) {
  const n = P.length, info = polyInfo(P), Pin = offsetPoly(P, o.din), Pout = offsetPoly(P, o.dout);
  function pt(i, u, t, dy) {
    const j = (i + 1) % n;
    const ax = lerp(Pin[i][0], Pin[j][0], u), az = lerp(Pin[i][1], Pin[j][1], u), bx = lerp(Pout[i][0], Pout[j][0], u), bz = lerp(Pout[i][1], Pout[j][1], u);
    let x = lerp(ax, bx, t), z = lerp(az, bz, t), y = o.yTop - o.rise + o.rise * Math.pow(1 - t, 1.7);
    const L = Math.hypot(Pout[j][0] - Pout[i][0], Pout[j][1] - Pout[i][1]), t2 = t * t;
    const corner = (c, d) => { if (!info[c].convex) return; const g = Math.exp(-Math.pow(d / o.w, 2)) * (1 - smooth(0.5, 1, d / L)); y += o.lift * g * t2 * (0.4 + 0.6 * t); x += info[c].diag[0] * o.sweep * g * t2; z += info[c].diag[1] * o.sweep * g * t2; };
    corner(i, u * L); corner(j, (1 - u) * L);
    return [x, y + (dy || 0), z];
  }
  const NT = 10, slope = Math.hypot(o.dout - o.din, o.rise), rows = Math.max(4, Math.round(slope / 0.42));
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const Lm = Math.hypot((Pin[j][0] + Pout[j][0] - Pin[i][0] - Pout[i][0]) / 2, (Pin[j][1] + Pout[j][1] - Pin[i][1] - Pout[i][1]) / 2);
    const Lo = Math.hypot(Pout[j][0] - Pout[i][0], Pout[j][1] - Pout[i][1]);
    const nu = Math.max(2, Math.ceil(Lo / 0.5)), rep = Math.max(1, Math.round(Lm / 0.36));
    bag.add(M.tile, gridGeo(nu, NT, (u, t) => { const p = pt(i, u, t, 0); return [p[0], p[1], p[2], u * rep / 4, t * rows / 4]; }));
    bag.add(M.rafter, gridGeo(nu, NT, (u, t) => { const p = pt(i, u, t, -0.2); return [p[0], p[1], p[2], u * rep * 1.5, t * 2]; }));
    bag.add(M.slab, gridGeo(nu, 1, (u, v) => { const p = pt(i, u, 1, v ? -0.22 : 0.02); return [p[0], p[1], p[2], u, v]; }));
    for (let k = 0; k < rep; k++) {                   // 檐口一排瓦当滴水
      const u = (k + 0.5) / rep, p = pt(i, u, 1, 0), q = pt(i, u, 0.9, 0);
      B.wd.add(p[0], p[1] - 0.02, p[2], 1, 1, 1, Math.atan2(p[0] - q[0], p[2] - q[2]));
    }
  }
  for (let i = 0; i < n; i++) {                       // 戗脊、翘角、脊兽、风铃
    if (!info[i].convex) continue;
    const pts = [], d = info[i].diag; for (let k = 0; k <= 10; k++) pts.push(pt(i, 0, k / 10, 0.1));
    const e = pts[10]; pts.push([e[0] + d[0] * 0.45, e[1] + 0.32, e[2] + d[1] * 0.45]); pts.push([e[0] + d[0] * 0.82, e[1] + 0.95, e[2] + d[1] * 0.82]);
    bag.add(M.glaze, tubeGeo(pts, 0.15, 8)); bag.add(M.glaze, tubeGeo(pts.slice(0, 11).map(p => [p[0], p[1] + 0.16, p[2]]), 0.06, 5));
    const ry = Math.atan2(d[0], d[1]);
    for (const k of [5, 6, 7, 8, 9]) B.beast.add(pts[k][0], pts[k][1] + 0.18, pts[k][2], 0.9, 0.9, 0.9, ry);
    B.bell.add(e[0] + d[0] * 0.3, e[1] - 0.12, e[2] + d[1] * 0.3, 1, 1, 1, 0);
  }
}

/* ============================== 五层楼身 ============================== */
const eaveEdgeY = [], colTopY = [];
for (let k = 0; k < 5; k++) {
  const a = E[k] - PP[k], P = plan(a, a * 0.5, PP[k]), n = P.length, inf = polyInfo(P);
  const nextY = k < 4 ? Y[k + 1] : YTOP, eaveTop = nextY - 0.6, edge = eaveTop - RISE[k], colTop = edge + 0.25, hc = colTop - Y[k];
  eaveEdgeY.push(edge); colTopY.push(colTop);
  const vw = k === 0 ? 2.4 : 2.0, W = offsetPoly(P, -vw);
  // 墙身：隔扇门窗 + 抱框
  bag.add(M.wall, stripGeo(W, Y[k] + 0.12, colTop + 0.3, 2.3));
  bag.add(M.caihua, stripGeo(W, colTop + 0.3, nextY - 0.4, 4.2));
  for (let i = 0; i < n; i++) {
    const A = W[i], Bq = W[(i + 1) % n], dx = Bq[0] - A[0], dz = Bq[1] - A[1], L = Math.hypot(dx, dz), rep = Math.max(1, Math.round(L / 2.3)), ry = edgeRy(dx, dz), nx = dz / L, nz = -dx / L;
    for (let j = 0; j <= rep; j++) B.wood.add(A[0] + dx * j / rep + nx * 0.05, Y[k] + (hc + 0.3) / 2, A[1] + dz * j / rep + nz * 0.05, 0.2, hc + 0.3, 0.16, ry, C.dark);
    B.wood.add((A[0] + Bq[0]) / 2 + nx * 0.06, Y[k] + 0.07, (A[1] + Bq[1]) / 2 + nz * 0.06, L, 0.14, 0.2, ry, C.dark);
  }
  // 檐柱、柱础、雀替
  const r = k === 0 ? 0.42 : 0.33;
  for (let i = 0; i < n; i++) {
    const A = P[i], Bq = P[(i + 1) % n], dx = Bq[0] - A[0], dz = Bq[1] - A[1], L = Math.hypot(dx, dz), ry = edgeRy(dx, dz);
    let seg = Math.max(1, Math.round(L / 3.8)); if (inf[i].convex && inf[(i + 1) % n].convex && seg % 2 === 0) seg += 1;
    for (let j = 0; j <= seg; j++) {
      const x = lerp(A[0], Bq[0], j / seg), z = lerp(A[1], Bq[1], j / seg);
      if (j < seg) { B.col.add(x, Y[k], z, r, hc, r, 0); B.base.add(x, Y[k], z, r, 0.36, r, 0, C.stone); }
      if (L / seg > 1.9) {
        if (j < seg) B.que.add(x + dx / L * r * 0.9, colTop - 0.56, z + dz / L * r * 0.9, 1, 1, 1, ry);
        if (j > 0) B.que.add(x - dx / L * r * 0.9, colTop - 0.56, z - dz / L * r * 0.9, 1, 1, 1, ry + Math.PI);
      }
    }
  }
  // 额枋彩画、斗拱、挑檐枋
  beam(P, colTop - 0.55, 0.5, 0.34, M.caihua, 4.2); beam(P, colTop - 0.02, 0.2, 0.42, M.caihua, 4.2);
  dougongRow(P, colTop + 0.18); beam(offsetPoly(P, 0.72), colTop + 0.88, 0.16, 0.2, M.caihua, 4.2);
  // 平座：楼面出挑、挂檐板、平座斗拱、栏杆
  if (k > 0) {
    const g = shapeGeo(offsetPoly(P, 0.8), 0.3); g.translate(0, Y[k] - 0.3, 0); bag.add(M.slab, g);
    bag.add(M.hang, stripGeo(offsetPoly(P, 0.82), Y[k] - 0.78, Y[k] - 0.04, 1.6));
    dougongRow(offsetPoly(P, 0.1), Y[k] - 1.48); beam(P, Y[k] - 1.95, 0.46, 0.5, M.caihua, 4.2);
    const R = offsetPoly(P, 0.66); for (let i = 0; i < n; i++) fence(R[i][0], R[i][1], R[(i + 1) % n][0], R[(i + 1) % n][1], Y[k]);
  }
  buildEave(P, { din: -1.2, dout: k === 0 ? 3.3 : 2.8, yTop: eaveTop, rise: RISE[k], lift: k === 0 ? 1.9 : 1.6, sweep: 0.9, w: 2.5 });
}
(function () {                                        // 楼身下的石阶基座
  const P0 = plan(E[0] - PP[0], (E[0] - PP[0]) * 0.5, PP[0]), g = shapeGeo(offsetPoly(P0, 1.5), 0.35); g.translate(0, -0.35, 0);
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 3, uv.getY(i) / 3); bag.add(M.stone, g);
})();

/* ============================== 攒尖顶、四面歇山抱厦、葫芦宝顶 ============================== */
(function () {
  const y0 = YTOP - 0.7, R = 6.7, Hh = 9.1, prof = s => y0 + Hh * (0.3 * s + 0.7 * s * s);
  const rot = (g, k) => { g.rotateY(k * Math.PI / 2); return g; };
  for (let k = 0; k < 4; k++) {
    bag.add(M.tile, rot(gridGeo(14, 18, (u, s) => { const r = R * (1 - s) + 0.02, w = (u * 2 - 1) * r; return [w, prof(s), r, w / 1.44, s * 6]; }), k));
    const pts = [[R + 0.95, y0 + 0.85, R + 0.95], [R + 0.45, y0 + 0.25, R + 0.45]];
    for (let i = 0; i <= 10; i++) { const s = i / 10, r = R * (1 - s); pts.push([r, prof(s) + 0.12, r]); }
    bag.add(M.glaze, rot(tubeGeo(pts, 0.19, 8), k)); bag.add(M.glaze, rot(tubeGeo(pts.slice(2).map(p => [p[0], p[1] + 0.2, p[2]]), 0.07, 5), k));
    const c = Math.cos(k * Math.PI / 2), sn = Math.sin(k * Math.PI / 2), tr = (x, z) => [x * c + z * sn, -x * sn + z * c];
    for (const s of [0.1, 0.17, 0.24, 0.31]) { const r = R * (1 - s), q = tr(r, r); B.beast.add(q[0], prof(s) + 0.3, q[1], 1.1, 1.1, 1.1, k * Math.PI / 2 + Math.PI / 4); }
    const b0 = tr(R + 0.55, R + 0.55); B.bell.add(b0[0], y0 + 0.2, b0[1], 1, 1, 1, 0);
    // 歇山抱厦
    const hg = 3.5, wg = 4.7, z0 = 1.5, z1 = 8.7, gy = q => y0 - 0.4 + (hg + 0.4) * Math.pow(1 - q, 1.5);
    for (const sgn of [-1, 1]) {
      bag.add(M.tile, rot(gridGeo(8, 8, (u, q) => [sgn * wg * q, gy(q), lerp(z0, z1, u), u * 5, q * 3]), k));
      const bp = []; for (let i = 0; i <= 8; i++) bp.push([sgn * wg * i / 8, gy(i / 8) + 0.12, z1]); bp.push([sgn * (wg + 0.5), gy(1) + 0.5, z1]);
      bag.add(M.glaze, rot(tubeGeo(bp, 0.16, 8), k));
      for (let j = 0; j < 20; j++) { const q = tr(sgn * wg, lerp(z0 + 2.4, z1, (j + 0.5) / 20)); B.wd.add(q[0], gy(1) - 0.02, q[1], 1, 1, 1, k * Math.PI / 2 + sgn * Math.PI / 2); }
    }
    bag.add(M.glaze, rot(tubeGeo([[0, y0 + hg + 0.1, z0], [0, y0 + hg + 0.14, z1 - 0.6], [0, y0 + hg + 0.3, z1 + 0.1], [0, y0 + hg + 0.95, z1 + 0.45]], 0.2, 8), k));
    const tri = new T.BufferGeometry();
    tri.setAttribute('position', new T.Float32BufferAttribute([-wg * 0.84, y0 - 0.2, z1 - 0.45, wg * 0.84, y0 - 0.2, z1 - 0.45, 0, y0 + hg * 0.88, z1 - 0.45], 3));
    tri.setAttribute('uv', new T.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2)); tri.computeVertexNormals(); bag.add(M.gable, rot(tri, k));
  }
  const prof2 = [[0.01, 0], [1.05, 0], [1.2, 0.12], [1.12, 0.26], [0.62, 0.5], [0.58, 0.62], [0.78, 0.78], [1.18, 1.25], [1.3, 1.72], [1.1, 2.25], [0.56, 2.66], [0.5, 2.78], [0.72, 3.02], [0.82, 3.32], [0.6, 3.72], [0.22, 4.0], [0.16, 4.12], [0.2, 4.2], [0.1, 4.62], [0.01, 5.0]];
  const fin = new T.LatheGeometry(prof2.map(p => new T.Vector2(p[0], p[1])), 36); fin.translate(0, y0 + Hh - 0.3, 0); bag.add(M.gold, fin);
})();

/* ============================== 匾额 ============================== */
const plaqueMats = [];
function plaque(text, w, h, y, dist, rot) {
  const mat = new T.MeshStandardMaterial({ map: plaqueTex(text), roughness: 0.42, envMapIntensity: 0.6, emissive: 0xffffff, emissiveIntensity: 0 }); mat.emissiveMap = mat.map; plaqueMats.push(mat);
  const g = new T.Group(); g.rotation.y = rot; tower.add(g);
  const m = new T.Mesh(new T.BoxGeometry(w, h, 0.1), [M.gold, M.gold, M.gold, M.gold, mat, M.gold]); m.position.set(0, y, dist); m.rotation.x = 0.17; m.castShadow = true; g.add(m);
  const f = new T.Mesh(new T.BoxGeometry(w + 0.22, h + 0.22, 0.07), M.gold); f.position.set(0, y, dist - 0.05); f.rotation.x = 0.17; g.add(f);
}
plaque('黄鹤楼', 4.6, 2.0, colTopY[4] + 0.2, E[4] + 1.05, 0);
plaque('楚天极目', 4.8, 1.7, colTopY[4] + 0.2, E[4] + 1.05, Math.PI);
plaque('南维高拱', 4.8, 1.7, colTopY[4] + 0.2, E[4] + 1.05, Math.PI / 2);
plaque('北斗平临', 4.8, 1.7, colTopY[4] + 0.2, E[4] + 1.05, -Math.PI / 2);
plaque('气吞云梦', 6.0, 2.1, colTopY[0] + 0.15, E[0] + 1.1, 0);

bag.build(tower, { noCast: new Set([M.rafter, M.railPanel]) });
B.col.build(tower); B.base.build(tower); B.dg.build(tower); B.que.build(tower, false); B.wd.build(tower, false); B.beast.build(tower, false); B.bell.build(tower, false); B.wood.build(tower);

/* ============================== 台基：两层石台、踏步、汉白玉栏杆 ============================== */
(function () {
  const sbag = new H.Bag(), root = H.scene;
  function stoneBox(w, h, d, x, y, z) {
    const g = new T.BoxGeometry(w, h, d), uv = g.attributes.uv, s = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) uv.setXY(f * 4 + i, uv.getX(f * 4 + i) * s[f][0] / 3.2, uv.getY(f * 4 + i) * s[f][1] / 3.2);
    g.translate(x, y, z); sbag.add(M.stone, g);
  }
  const tiers = [{ half: 28, y0: -3.2, y1: 1.5 }, { half: 21.5, y0: 1.5, y1: PH }], gap = 9;
  const rot = (x, z, r) => { const c = Math.cos(r * Math.PI / 2), s = Math.sin(r * Math.PI / 2); return [x * c + z * s, -x * s + z * c]; };
  function stoneRail(ax, az, bx, bz, y) {
    const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz), ry = edgeRy(dx, dz), n = Math.max(1, Math.round(L / 1.9));
    for (let i = 0; i <= n; i++) B.post.add(ax + dx * i / n, y, az + dz * i / n, 1, 1, 1, ry, C.stone);
    for (let i = 0; i < n; i++) {
      const mx = ax + dx * (i + 0.5) / n, mz = az + dz * (i + 0.5) / n, l = L / n - 0.22;
      B.relief.add(mx, y + 0.42, mz, l, 0.52, 0.1, ry); B.stone.add(mx, y + 0.94, mz, l, 0.1, 0.13, ry, C.stone); B.stone.add(mx, y + 0.09, mz, l, 0.18, 0.16, ry, C.stone);
      for (const o of [-0.25, 0.25]) B.stone.add(mx + dx / L * l * o, y + 0.78, mz + dz / L * l * o, 0.1, 0.22, 0.09, ry, C.stone);
    }
  }
  tiers.forEach((t, ti) => {
    stoneBox(t.half * 2, t.y1 - t.y0, t.half * 2, 0, (t.y0 + t.y1) / 2, 0);
    stoneBox(t.half * 2 + 0.36, 0.22, t.half * 2 + 0.36, 0, t.y1 - 0.11, 0); stoneBox(t.half * 2 + 0.3, 0.3, t.half * 2 + 0.3, 0, (ti ? 1.5 : 0) + 0.15, 0);
    const base = ti ? 1.5 : 0, N = 9, rise = (t.y1 - base) / N, run = 0.42, h = t.half - 0.32, len = N * run, ang = Math.atan2(t.y1 - base, len);
    for (let r = 0; r < 4; r++) {
      for (const seg of [[-h, -gap / 2], [gap / 2, h]]) { const A = rot(seg[0], h, r), Bq = rot(seg[1], h, r); stoneRail(A[0], A[1], Bq[0], Bq[1], t.y1); }
      for (let s = 0; s < N; s++) { const c = rot(0, t.half + (N - s - 0.5) * run, r); B.stone.add(c[0], base + (s + 1) * rise / 2, c[1], gap - 1.0, (s + 1) * rise, run, r * Math.PI / 2, s % 2 ? 0xd2cdbf : C.stone); }
      for (const sx of [-1, 1]) {                     // 垂带与抱鼓石
        const c = rot(sx * (gap / 2 - 0.25), t.half + len / 2, r); B.stone.add(c[0], base + (t.y1 - base) / 2 + 0.12, c[1], 0.5, 0.3, Math.hypot(len, t.y1 - base) + 0.3, r * Math.PI / 2, C.stone, ang);
        const e = rot(sx * (gap / 2 - 0.25), t.half + len + 0.25, r); B.stone.add(e[0], base + 0.3, e[1], 0.5, 0.6, 0.6, r * Math.PI / 2, C.stone);
      }
      if (r === 0) { const c = rot(0, t.half + len / 2, r); B.relief.add(c[0], base + (t.y1 - base) / 2 + 0.07, c[1], 2.4, 0.12, Math.hypot(len, t.y1 - base), 0, undefined, ang); }   // 正面御路浮雕
    }
  });
  sbag.build(root); B.stone.build(root); B.post.build(root); B.relief.build(root);
})();

/* ============================== 夜景：泛光灯与发光强度 ============================== */
const floods = [];
for (const p of [[30, 30], [-30, 30], [30, -30], [-30, -30]]) {
  const l = new T.SpotLight(0xffb866, 0, 120, 0.62, 0.7, 1.2); l.position.set(p[0], 4, p[1]); l.target.position.set(p[0] * 0.12, 30, p[1] * 0.12); H.scene.add(l, l.target); floods.push(l);
}
function setGlow(g) {
  M.wall.emissiveIntensity = g * 2.0; M.tile.emissiveIntensity = g * 0.035; M.glaze.emissiveIntensity = g * 0.035; M.gold.emissiveIntensity = g * 0.3;
  M.rafter.emissiveIntensity = g * 0.1; M.lacquer.emissiveIntensity = g * 0.04; M.caihua.emissiveIntensity = g * 0.5; M.paint.emissiveIntensity = g * 0.5;
  plaqueMats.forEach(m => m.emissiveIntensity = g * 0.6);
  const on = g > 0.02 && H.Q.post; floods.forEach(l => { l.visible = on; l.intensity = g * 6; });
}
H.tower = { group: tower, PH, TY, E, PP, Y, RISE, YTOP, eaveEdgeY, colTopY, C, M, TX, setGlow, KAI };
})();
