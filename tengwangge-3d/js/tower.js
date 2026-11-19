/* 滕王阁 · 楼体：12 m 高台座、明三暗七的主阁、碧瓦飞檐、歇山顶、南北两亭
 * 通高约 57.5 m（含台座），这里按课堂观感取整；正面朝 +z 的赣江 */
(function () {
'use strict';
const H = window.HHL, T = THREE;
const { lerp, smooth, rng, canvasTex, makeCanvas, pixelCanvas, texFrom, normalFromCanvas, gridGeo, stripGeo, tubeGeo, boxGeo, tint, mergeGeos, polyInfo, offsetPoly, shapeGeo } = H;
const KAI = '"KaiTi","STKaiti","楷体","SimSun",serif';

const PH = 0.6, TY = PH + 0.15;                       // 主阁月台高（台座顶面 y = 0）、楼体基面
const tower = new T.Group(); tower.position.y = TY; H.scene.add(tower);
const AX = [17, 15, 13], AZ = [11, 10, 9];            // 各层檐柱一圈的半宽（x 为面宽方向，z 为进深方向）
const Y = [0, 14, 26];                                // 各明层楼面标高；两层之间夹着屋檐后的暗层
const DARK = [3.2, 2.6, 0];                           // 暗层：檐口以上、上一层平座以下那一段
const RISE = [2.6, 2.4, 2.4], YTOP = 35, HELM = 7.6;  // 各层屋檐起坡；三层檐口之上是歇山顶（HELM 为屋顶高）
const rect = (ax, az) => [[ax, -az], [ax, az], [-ax, az], [-ax, -az]];
const C = { red: 0x6e1c10, dark: 0x45120a, blue: 0x234a6a, green: 0x2e6a52, gold: 0xc9a24a, stone: 0xb0ab9e };

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
  return [(cover ? 30 : 22) * k, (cover ? 112 : 84) * k, (cover ? 100 : 74) * k];   // 碧色琉璃瓦（偏深的青绿）
});
const TX = { tile: texFrom(tileColor), tileN: normalFromCanvas(tileHeight, 3.2) };
(function () {                                        // 檐下椽子
  const hc = pixelCanvas(128, 128, u => { const d = Math.abs(u - 0.5) / 0.3, k = d < 1 ? 90 + 165 * Math.sqrt(1 - d * d) : 40; return [k, k, k]; });
  TX.rafter = texFrom(pixelCanvas(128, 128, (u, v) => { const d = Math.abs(u - 0.5) / 0.3, n = 0.85 + 0.3 * H.vnoise(u * 9, v * 30, 0); return d < 1 ? [112 * n, 46 * n, 30 * n] : [80 * n, 34 * n, 22 * n]; }));
  TX.rafterN = normalFromCanvas(hc, 2.5);
})();
(function () {                                        // 隔扇门窗：颜色、夜间透光、起伏（岳阳楼的木作是偏褐的朱红）
  const W = 512, Hh = 1024;
  function draw(mode) {                               // 0 颜色 1 透光 2 高度
    return makeCanvas(W, Hh, function (g) {
      const fill = (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
      fill(mode === 0 ? '#4a1a0e' : mode === 1 ? '#000' : '#b0b0b0', 0, 0, W, Hh);
      for (const x0 of [30, 262]) {
        const lw = 220;
        fill(mode === 0 ? '#5e2012' : mode === 1 ? '#000' : '#e0e0e0', x0, 14, lw, Hh - 28);
        const panel = (y, h, deco) => {
          fill(mode === 0 ? '#4e1a0e' : mode === 1 ? '#000' : '#8a8a8a', x0 + 16, y, lw - 32, h);
          if (mode === 0) {
            g.strokeStyle = '#a8843a'; g.lineWidth = 2.5; g.strokeRect(x0 + 26, y + 10, lw - 52, h - 20);
            if (deco) { g.beginPath(); const cx = x0 + lw / 2, cy = y + h / 2, r = Math.min(lw, h) * 0.2;
              for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; g.moveTo(cx, cy); g.quadraticCurveTo(cx + Math.cos(a - 0.5) * r * 1.5, cy + Math.sin(a - 0.5) * r * 1.5, cx + Math.cos(a) * r * 1.9, cy + Math.sin(a) * r * 1.9); g.quadraticCurveTo(cx + Math.cos(a + 0.5) * r * 1.5, cy + Math.sin(a + 0.5) * r * 1.5, cx, cy); }
              g.stroke(); g.beginPath(); g.arc(cx, cy, r * 0.45, 0, 7); g.stroke(); }
          }
        };
        panel(30, 78, false); panel(668, 70, false); panel(756, 236, true);
        const lx = x0 + 16, ly = 126, lww = lw - 32, lh = 524;                                           // 棂格（步步锦）
        fill(mode === 0 ? '#17110e' : mode === 1 ? '#ffb665' : '#101010', lx, ly, lww, lh);
        const bar = mode === 0 ? '#6e2414' : mode === 1 ? '#1a0a04' : '#d8d8d8';
        for (let r = 0; r < 6; r++) {
          const y = ly + r * lh / 6, ins = (r % 2) * 18;
          fill(bar, lx, y - 2.5, lww, 5); fill(bar, lx + 30 + ins, y, 5, lh / 6); fill(bar, lx + lww - 35 - ins, y, 5, lh / 6);
          fill(bar, lx + 30 + ins, y + lh / 12 - 2.5, lww - 60 - ins * 2, 5); fill(bar, lx + lww / 2 - 2.5, y, 5, lh / 12);
        }
        g.strokeStyle = bar; g.lineWidth = 9; g.strokeRect(lx + 2, ly + 2, lww - 4, lh - 4);
      }
      if (mode === 0) { const gr = g.createLinearGradient(0, 0, 0, Hh); gr.addColorStop(0, 'rgba(0,0,0,.28)'); gr.addColorStop(0.2, 'rgba(0,0,0,0)'); gr.addColorStop(0.85, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.3)'); g.fillStyle = gr; g.fillRect(0, 0, W, Hh); }
    });
  }
  TX.wall = texFrom(draw(0)); TX.wallGlow = texFrom(draw(1)); TX.wallN = normalFromCanvas(draw(2), 1.6);
})();
TX.caihua = canvasTex(1024, 128, function (g, w, h) {  // 额枋彩画：青绿为主，枋心留白（比官式彩画素净，合乎江南楼阁的味道）
  g.fillStyle = '#244a62'; g.fillRect(0, 0, w, h);
  const band = (x, ww, c) => { g.fillStyle = c; g.fillRect(x, 0, ww, h); };
  band(0, 46, '#2e6a52'); band(w - 46, 46, '#2e6a52'); band(46, 12, '#c9a24a'); band(w - 58, 12, '#c9a24a');
  g.fillStyle = '#e7dcc0'; g.beginPath(); g.moveTo(330, 8); g.lineTo(390, h / 2); g.lineTo(330, h - 8); g.lineTo(694, h - 8); g.lineTo(634, h / 2); g.lineTo(694, 8); g.fill();
  g.strokeStyle = '#c9a24a'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(330, 8); g.lineTo(390, h / 2); g.lineTo(330, h - 8); g.moveTo(694, 8); g.lineTo(634, h / 2); g.lineTo(694, h - 8); g.stroke();
  g.strokeStyle = 'rgba(40,60,70,.75)'; g.lineWidth = 2; g.beginPath();                      // 枋心：几笔水波
  for (let r = 0; r < 3; r++) for (let x = 410; x <= 614; x += 3) { const y = 44 + r * 20 + Math.sin((x - 410) / 34 + r) * 5; x === 410 ? g.moveTo(x, y) : g.lineTo(x, y); }
  g.stroke();
  const rosette = (cx) => { for (let r = 46; r > 8; r -= 12) { g.strokeStyle = r % 24 ? '#e8e2d0' : '#c9a24a'; g.lineWidth = 2; g.beginPath(); g.arc(cx, h / 2, r, 0, 7); g.stroke(); }
    g.fillStyle = '#8a2a1c'; g.beginPath(); g.arc(cx, h / 2, 8, 0, 7); g.fill(); };
  rosette(120); rosette(250); rosette(774); rosette(904);
  g.strokeStyle = 'rgba(232,226,208,.8)'; g.lineWidth = 2; g.strokeRect(1, 5, w - 2, h - 10);
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(0,0,0,.35)'); gr.addColorStop(0.35, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.15)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
});
(function () {                                        // 青石：砌缝 + 细纹
  const S = 512, joints = (x, y) => { const row = Math.floor(y * 4), xo = (row % 2) * 0.25, fx = ((x + xo) * 2) % 1, fy = (y * 4) % 1; return fx < 0.012 || fy < 0.03; };
  TX.stone = texFrom(pixelCanvas(S, S, (u, v) => { const n = H.fbm(u * 6, v * 6, 5, 6), m = H.fbm(u * 30 + 9, v * 30, 3, 30); let k = 0.8 + 0.2 * n + 0.06 * m; if (joints(u, v)) k *= 0.62; return [200 * k, 198 * k, 190 * k]; }));
  TX.stoneN = normalFromCanvas(pixelCanvas(S, S, (u, v) => { const k = (joints(u, v) ? 60 : 170) + 60 * H.fbm(u * 40, v * 40, 3, 40); return [k, k, k]; }), 1.4);
})();
TX.railPanel = canvasTex(256, 128, function (g, w, h) { // 木栏杆的透空棂条
  g.clearRect(0, 0, w, h); g.strokeStyle = '#5e1a0e'; g.lineWidth = 9;
  g.strokeRect(5, 5, w - 10, h - 10); g.lineWidth = 7;
  for (let x = 0; x <= w; x += 64) { g.beginPath(); g.moveTo(x, 5); g.lineTo(x, h - 5); g.stroke(); }
  g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
  for (let x = 32; x < w; x += 64) { g.strokeRect(x - 15, h / 2 - 22, 30, 44); }
});
TX.hang = canvasTex(256, 128, function (g, w, h) {      // 挂檐板
  g.fillStyle = '#561a0e'; g.fillRect(0, 0, w, h); g.strokeStyle = '#b8923f'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(0, 14); g.lineTo(w, 14); g.moveTo(0, h - 14); g.lineTo(w, h - 14); g.stroke();
  for (let x = 32; x < w; x += 64) { g.beginPath(); g.arc(x, h / 2, 20, 0, 7); g.stroke(); g.beginPath(); g.arc(x, h / 2, 8, 0, 7); g.fillStyle = '#b8923f'; g.fill(); g.beginPath(); g.moveTo(x + 20, h / 2); g.lineTo(x + 44, h / 2); g.stroke(); }
});
TX.gable = canvasTex(512, 256, function (g, w, h) {     // 山花：朱红底、金色绶带
  g.fillStyle = '#6a1c12'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c9a24a'; g.lineWidth = 5;
  const cx = w / 2, cy = h * 0.62;
  for (const r of [h * 0.3, h * 0.2]) { g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke(); }
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g.beginPath(); g.moveTo(cx + Math.cos(a) * h * 0.08, cy + Math.sin(a) * h * 0.08); g.lineTo(cx + Math.cos(a) * h * 0.2, cy + Math.sin(a) * h * 0.2); g.stroke(); }
  g.fillStyle = '#c9a24a'; g.beginPath(); g.arc(cx, cy, h * 0.07, 0, 7); g.fill();
  for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(cx + sx * h * 0.36, cy + 10); g.quadraticCurveTo(cx + sx * h * 0.6, cy - 30, cx + sx * h * 0.8, cy + 30); g.stroke(); }
});
function plaqueTex(text) {                            // 黑底金字匾
  const n = text.length;
  return canvasTex(150 * n + 130, 270, function (g, w, h) {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1c1612'); gr.addColorStop(1, '#0c0907'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#d9b04a'; g.lineWidth = 18; g.strokeRect(9, 9, w - 18, h - 18); g.strokeStyle = '#7a1c12'; g.lineWidth = 5; g.strokeRect(25, 25, w - 50, h - 50);
    g.fillStyle = '#f0c95a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 150px ' + KAI;
    g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 8; g.shadowOffsetY = 4;
    for (let i = 0; i < n; i++) g.fillText(text[i], 65 + 150 * i + 75, h / 2 + 8);
  });
}

/* ============================== 材质 ============================== */
const M = H.towerMat = {
  tile: new T.MeshPhysicalMaterial({ map: TX.tile, normalMap: TX.tileN, normalScale: new T.Vector2(1.5, 1.5), roughness: 0.42, clearcoat: 0.75, clearcoatRoughness: 0.22, side: T.DoubleSide, emissive: 0xffb45a, emissiveIntensity: 0 }),
  gable: new T.MeshStandardMaterial({ map: TX.gable, roughness: 0.6, side: T.DoubleSide, envMapIntensity: 0.4 }),
  glaze: new T.MeshPhysicalMaterial({ color: 0x1f6a5a, roughness: 0.36, clearcoat: 0.8, clearcoatRoughness: 0.2, emissive: 0xffb45a, emissiveIntensity: 0 }),
  gold: new T.MeshStandardMaterial({ color: 0xe0ad3a, roughness: 0.24, metalness: 1, emissive: 0xffa520, emissiveIntensity: 0 }),
  rafter: new T.MeshStandardMaterial({ map: TX.rafter, normalMap: TX.rafterN, roughness: 0.7, side: T.DoubleSide, envMapIntensity: 0.8, emissive: 0xff6a20, emissiveIntensity: 0 }),
  wall: new T.MeshStandardMaterial({ map: TX.wall, normalMap: TX.wallN, roughness: 0.5, envMapIntensity: 0.55, emissive: 0xffffff, emissiveMap: TX.wallGlow, emissiveIntensity: 0, side: T.DoubleSide }),
  caihua: new T.MeshStandardMaterial({ map: TX.caihua, roughness: 0.62, envMapIntensity: 0.4, side: T.DoubleSide, emissive: 0x6a5a40, emissiveIntensity: 0 }),
  lacquer: new T.MeshStandardMaterial({ color: C.red, roughness: 0.38, envMapIntensity: 0.75, emissive: 0xff3a10, emissiveIntensity: 0 }),
  woodI: new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, envMapIntensity: 0.45 }),
  paint: new T.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.6, envMapIntensity: 0.35, emissive: 0x33506a, emissiveIntensity: 0 }),
  slab: new T.MeshStandardMaterial({ color: 0x4e1a0e, roughness: 0.6, envMapIntensity: 0.4 }),
  hang: new T.MeshStandardMaterial({ map: TX.hang, roughness: 0.6, envMapIntensity: 0.4, side: T.DoubleSide }),
  railPanel: new T.MeshStandardMaterial({ map: TX.railPanel, alphaTest: 0.5, side: T.DoubleSide, roughness: 0.6, envMapIntensity: 0.4 }),
  stone: new T.MeshStandardMaterial({ color: 0xc4c0b4, map: TX.stone, normalMap: TX.stoneN, roughness: 0.8, envMapIntensity: 0.6 }),
  stoneI: new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, envMapIntensity: 0.6 }),
  bronze: new T.MeshStandardMaterial({ color: 0x6a5a3a, roughness: 0.42, metalness: 0.9 })
};

/* ============================== 构件原型 ============================== */
const unitBox = new T.BoxGeometry(1, 1, 1);
const colGeo = new T.LatheGeometry([[1, 0], [1, 0.03], [0.985, 0.55], [0.94, 1]].map(p => new T.Vector2(p[0], p[1])), 20);     // 略带收分的圆柱
const baseGeo = new T.LatheGeometry([[1.62, 0], [1.62, 0.22], [1.5, 0.42], [1.22, 0.7], [1.12, 1]].map(p => new T.Vector2(p[0], p[1])), 20);
const dougongGeo = (function () {                     // 一攒如意斗拱（两跳，斜出的翘也用正交件近似），局部 z 轴朝外
  const g = [], Bx = (w, h, d, x, y, z, c) => g.push(tint(boxGeo(w, h, d, x, y, z), c));
  Bx(0.30, 0.16, 0.30, 0, 0.08, 0, C.green);
  Bx(0.84, 0.12, 0.13, 0, 0.24, 0, C.blue); Bx(0.13, 0.12, 0.84, 0, 0.24, 0.14, C.blue);
  for (const sx of [-0.36, 0.36]) Bx(0.16, 0.09, 0.16, sx, 0.345, 0, C.green); Bx(0.16, 0.09, 0.16, 0, 0.345, 0.48, C.green);
  Bx(1.12, 0.12, 0.13, 0, 0.45, 0, C.green); Bx(0.13, 0.12, 1.0, 0, 0.45, 0.27, C.green); Bx(0.9, 0.12, 0.13, 0, 0.45, 0.48, C.blue);
  for (const sx of [-0.5, 0.5]) Bx(0.16, 0.09, 0.16, sx, 0.555, 0, C.blue); Bx(0.16, 0.09, 0.16, 0, 0.555, 0.72, C.blue);
  for (const sx of [-0.38, 0.38]) Bx(0.16, 0.09, 0.16, sx, 0.555, 0.48, C.blue);
  for (const sx of [-1, 1]) { const b = tint(boxGeo(0.11, 0.1, 0.7, 0, 0.45, 0.3), C.green); b.rotateY(sx * 0.62); g.push(b); }   // 如意斗拱的斜拱
  Bx(1.0, 0.1, 0.13, 0, 0.65, 0.72, C.green); Bx(0.12, 0.03, 0.86, 0, 0.315, 0.14, C.gold); Bx(0.12, 0.03, 1.0, 0, 0.525, 0.27, C.gold);
  return mergeGeos(g);
})();
const queGeo = (function () {                         // 雀替
  const s = new T.Shape(); s.moveTo(0, 0); s.lineTo(1.05, 0); s.quadraticCurveTo(0.95, -0.14, 0.62, -0.2); s.quadraticCurveTo(0.34, -0.3, 0.26, -0.5); s.quadraticCurveTo(0.2, -0.7, 0, -0.76); s.lineTo(0, 0);
  const g = new T.ExtrudeGeometry(s, { depth: 0.09, bevelEnabled: false }); g.translate(0, 0, -0.045);
  const f = tint(g, C.green), e = tint(boxGeo(1.0, 0.035, 0.11, 0.52, -0.02, 0), C.gold); return mergeGeos([f, e]);
})();
const wadangGeo = (function () {                      // 瓦当 + 滴水
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
const stonePostGeo = (function () {                   // 石栏望柱
  const a = boxGeo(0.22, 1.0, 0.22, 0, 0.5, 0), b = boxGeo(0.27, 0.06, 0.27, 0, 1.03, 0);
  const c = new T.LatheGeometry([[0.07, 0], [0.12, 0.05], [0.135, 0.14], [0.11, 0.24], [0.06, 0.31], [0.0, 0.34]].map(p => new T.Vector2(p[0], p[1])), 10); c.translate(0, 1.06, 0);
  return mergeGeos([a, b, c].map(g => { g.deleteAttribute('uv'); return g; }));
})();

const bag = new H.Bag(), B = {
  col: new H.Batch(colGeo, M.lacquer), base: new H.Batch(baseGeo, M.stoneI), dg: new H.Batch(dougongGeo, M.paint), que: new H.Batch(queGeo, M.paint),
  wd: new H.Batch(wadangGeo, M.glaze), beast: new H.Batch(beastGeo, M.glaze), bell: new H.Batch(bellGeo, M.gold),
  wood: new H.Batch(unitBox, M.woodI), stone: new H.Batch(unitBox, M.stoneI), post: new H.Batch(stonePostGeo, M.stoneI)
};
const edgeRy = (dx, dz) => -Math.atan2(dz, dx);       // 让局部 x 轴沿 (dx,dz)
const outRy = (dx, dz) => Math.atan2(dz, -dx);        // 让局部 z 轴朝逆时针多边形的外法线

function beam(P, yb, h, depth, mat, uLen) {           // 沿多边形一圈的方木：外立面 + 底面
  const Po = offsetPoly(P, depth / 2), Pi = offsetPoly(P, -depth / 2), n = P.length, pos = [], uv = [], idx = [];
  bag.add(mat, stripGeo(Po, yb, yb + h, uLen || 3.2));
  for (let i = 0; i < n; i++) { const j = (i + 1) % n, b = pos.length / 3; pos.push(Pi[i][0], yb, Pi[i][1], Pi[j][0], yb, Pi[j][1], Po[j][0], yb, Po[j][1], Po[i][0], yb, Po[i][1]); uv.push(0, 0, 1, 0, 1, 0.3, 0, 0.3); idx.push(b, b + 1, b + 2, b, b + 2, b + 3); }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); bag.add(mat, g);
}
function dougongRow(P, y, step) {
  const n = P.length;
  for (let i = 0; i < n; i++) {
    const A = P[i], Bq = P[(i + 1) % n], dx = Bq[0] - A[0], dz = Bq[1] - A[1], L = Math.hypot(dx, dz), m = Math.max(1, Math.round(L / (step || 0.9))), ry = outRy(dx, dz);
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

/* ---- 飞檐：沿平面生成带翘角的曲面屋檐（岳阳楼的翘角又高又尖，像鸟翅） ---- */
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
    for (let k = 0; k < rep; k++) {
      const u = (k + 0.5) / rep, p = pt(i, u, 1, 0), q = pt(i, u, 0.9, 0);
      B.wd.add(p[0], p[1] - 0.02, p[2], 1, 1, 1, Math.atan2(p[0] - q[0], p[2] - q[2]));
    }
  }
  for (let i = 0; i < n; i++) {                       // 戗脊、翘角、脊兽、风铃
    if (!info[i].convex) continue;
    const pts = [], d = info[i].diag; for (let k = 0; k <= 10; k++) pts.push(pt(i, 0, k / 10, 0.1));
    const e = pts[10]; pts.push([e[0] + d[0] * 0.5, e[1] + 0.4, e[2] + d[1] * 0.5]); pts.push([e[0] + d[0] * 0.85, e[1] + 1.15, e[2] + d[1] * 0.85]);
    bag.add(M.glaze, tubeGeo(pts, 0.14, 8)); bag.add(M.glaze, tubeGeo(pts.slice(0, 11).map(p => [p[0], p[1] + 0.15, p[2]]), 0.06, 5));
    const ry = Math.atan2(d[0], d[1]);
    for (const k of [6, 7, 8, 9]) B.beast.add(pts[k][0], pts[k][1] + 0.17, pts[k][2], 0.85, 0.85, 0.85, ry);
    B.bell.add(e[0] + d[0] * 0.3, e[1] - 0.12, e[2] + d[1] * 0.3, 1, 1, 1, 0);
  }
}

/* ============================== 三层楼身 ============================== */
const eaveEdgeY = [], colTopY = [], VW = [2.0, 1.6, 1.6];   // VW：檐柱到隔扇墙的回廊宽
for (let k = 0; k < 3; k++) {
  const P = rect(AX[k], AZ[k]), n = P.length;
  const nextY = k < 2 ? Y[k + 1] : YTOP, eaveTop = nextY - 0.6 - DARK[k], edge = eaveTop - RISE[k], colTop = edge + 0.25, hc = colTop - Y[k];
  eaveEdgeY.push(edge); colTopY.push(colTop);
  const W = offsetPoly(P, -VW[k]);
  // 墙身：隔扇门窗 + 抱框
  bag.add(M.wall, stripGeo(W, Y[k] + 0.12, colTop + 0.3, 2.3));
  bag.add(M.caihua, stripGeo(W, colTop + 0.3, eaveTop, 4.2));
  if (k < 2) {                                        // 暗层：藏在屋檐后面的一圈矮墙，外面看不出是一层
    const D = offsetPoly(rect(AX[k + 1], AZ[k + 1]), -0.3);
    bag.add(M.wall, stripGeo(D, eaveTop - 1.2, nextY - 0.3, 2.3));
    const g = shapeGeo(offsetPoly(P, -1.1)); g.translate(0, eaveTop - 1.1, 0); bag.add(M.slab, g);
  }
  for (let i = 0; i < n; i++) {
    const A = W[i], Bq = W[(i + 1) % n], dx = Bq[0] - A[0], dz = Bq[1] - A[1], L = Math.hypot(dx, dz), rep = Math.max(1, Math.round(L / 2.3)), ry = edgeRy(dx, dz), nx = dz / L, nz = -dx / L;
    for (let j = 0; j <= rep; j++) B.wood.add(A[0] + dx * j / rep + nx * 0.05, Y[k] + (hc + 0.3) / 2, A[1] + dz * j / rep + nz * 0.05, 0.2, hc + 0.3, 0.16, ry, C.dark);
    B.wood.add((A[0] + Bq[0]) / 2 + nx * 0.06, Y[k] + 0.07, (A[1] + Bq[1]) / 2 + nz * 0.06, L, 0.14, 0.2, ry, C.dark);
  }
  // 檐柱、柱础、雀替
  const r = k === 0 ? 0.46 : 0.4;
  for (let i = 0; i < n; i++) {
    const A = P[i], Bq = P[(i + 1) % n], dx = Bq[0] - A[0], dz = Bq[1] - A[1], L = Math.hypot(dx, dz), ry = edgeRy(dx, dz);
    const seg = Math.max(1, Math.round(L / 2.9));
    for (let j = 0; j <= seg; j++) {
      const x = lerp(A[0], Bq[0], j / seg), z = lerp(A[1], Bq[1], j / seg);
      if (j < seg) { B.col.add(x, Y[k], z, r, hc, r, 0); B.base.add(x, Y[k], z, r, 0.32, r, 0, C.stone); }
      if (j < seg) B.que.add(x + dx / L * r * 0.9, colTop - 0.56, z + dz / L * r * 0.9, 0.85, 0.85, 0.85, ry);
      if (j > 0) B.que.add(x - dx / L * r * 0.9, colTop - 0.56, z - dz / L * r * 0.9, 0.85, 0.85, 0.85, ry + Math.PI);
    }
  }
  // 额枋、如意斗拱（排得很密）、挑檐枋
  beam(P, colTop - 0.55, 0.5, 0.32, M.caihua, 4.2); beam(P, colTop - 0.02, 0.2, 0.4, M.caihua, 4.2);
  dougongRow(P, colTop + 0.18, 0.62); beam(offsetPoly(P, 0.72), colTop + 0.88, 0.16, 0.2, M.caihua, 4.2);
  // 平座：二、三层外面一圈回廊，挂檐板、平座斗拱、栏杆
  if (k > 0) {
    const g = shapeGeo(offsetPoly(P, 0.8), 0.3); g.translate(0, Y[k] - 0.3, 0); bag.add(M.slab, g);
    bag.add(M.hang, stripGeo(offsetPoly(P, 0.82), Y[k] - 0.78, Y[k] - 0.04, 1.6));
    dougongRow(offsetPoly(P, 0.1), Y[k] - 1.48, 0.8);
    const R = offsetPoly(P, 0.66); for (let i = 0; i < n; i++) fence(R[i][0], R[i][1], R[(i + 1) % n][0], R[(i + 1) % n][1], Y[k]);
  }
  buildEave(P, { din: -1.2, dout: k === 0 ? 3.6 : 3.2, yTop: eaveTop, rise: RISE[k], lift: 2.4, sweep: 1.2, w: 2.8 });
}
(function () {                                        // 楼身下的阶条石
  const g = shapeGeo(offsetPoly(rect(AX[0], AZ[0]), 1.0), 0.15); g.translate(0, -0.15, 0);
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 3, uv.getY(i) / 3); bag.add(M.stone, g);
})();

/* ============================== 歇山顶：前后坡直通正脊，两侧小坡上面是竖直的山花 ============================== */
const HELM_TOP = YTOP - 0.6 + HELM;
function xieshan(cx, cz, rx, rz, y0, Hh, gi, s) {     // 中心 (cx,cz)，檐口内沿半宽 rx/rz，起点高 y0，屋顶高 Hh，山花内收 gi，s 为构件缩放
  const prof = t => y0 + Hh * Math.pow(t, 1.45), sg = gi / rz;
  for (const sz of [1, -1]) bag.add(M.tile, gridGeo(20, 16, (u, t) => { const d = t * rz, half = rx - Math.min(d, gi), x = (u * 2 - 1) * half; return [cx + x, prof(t), cz + sz * (rz - d), x / 1.44, t * Hh * 0.7]; }));
  for (const sx of [1, -1]) {
    bag.add(M.tile, gridGeo(12, 6, (u, v) => { const t = v * sg, d = t * rz, half = rz - d, z = (u * 2 - 1) * half; return [cx + sx * (rx - d), prof(t), cz + z, z / 1.44, t * Hh * 0.7]; }));
    const pts = [], N = 12; for (let i = 0; i <= N; i++) { const t = sg + (1 - sg) * i / N; pts.push([rz - t * rz, prof(t)]); }
    const sh = new T.Shape(); pts.forEach((p, i) => i ? sh.lineTo(p[0], p[1]) : sh.moveTo(p[0], p[1])); for (let i = N; i >= 0; i--) sh.lineTo(-pts[i][0], pts[i][1]);
    const g = new T.ShapeGeometry(sh), uv = g.attributes.uv, ps = g.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (ps.getX(i) + rz) / (2 * rz), (ps.getY(i) - prof(sg)) / (Hh - (prof(sg) - y0)));
    g.rotateY(sx * Math.PI / 2); g.translate(cx + sx * (rx - gi + 0.05), 0, cz); bag.add(M.gable, g);
    for (const sz of [1, -1]) {
      const hip = [], ver = [];
      for (let i = 0; i <= 6; i++) { const t = sg * i / 6, d = t * rz; hip.push([cx + sx * (rx - d), prof(t) + 0.12 * s, cz + sz * (rz - d)]); }
      for (let i = 0; i <= 10; i++) { const t = sg + (1 - sg) * i / 10; ver.push([cx + sx * (rx - gi), prof(t) + 0.14 * s, cz + sz * (rz - t * rz)]); }
      bag.add(M.glaze, tubeGeo(hip, 0.15 * s, 8)); bag.add(M.glaze, tubeGeo(ver, 0.16 * s, 8));
      for (const f of [0.35, 0.55, 0.75]) { const p = hip[Math.round(f * 6)]; B.beast.add(p[0], p[1] + 0.15 * s, p[2], s, s, s, Math.atan2(sx, sz)); }
    }
  }
  const yt = y0 + Hh, rr = rx - gi;
  bag.add(M.glaze, boxGeo(rr * 2 + 0.6 * s, 0.5 * s, 0.4 * s, cx, yt + 0.18 * s, cz));
  for (const sx of [-1, 1]) {                         // 鸱吻
    bag.add(M.glaze, tubeGeo([[cx + sx * rr, yt + 0.3 * s, cz], [cx + sx * (rr + 0.35 * s), yt + 0.9 * s, cz], [cx + sx * (rr + 0.25 * s), yt + 1.5 * s, cz], [cx + sx * (rr - 0.3 * s), yt + 1.75 * s, cz], [cx + sx * (rr - 0.6 * s), yt + 1.5 * s, cz]], 0.2 * s, 8));
  }
}
xieshan(0, 0, AX[2] - 1.2, AZ[2] - 1.2, YTOP - 0.6, HELM, 3.0, 1.6);

/* ============================== 南北两亭：压江亭、挹翠亭（两层小阁，示意） ============================== */
const PAV = { x: 37, a: 4.6 };
for (const sx of [-1, 1]) {
  const cx = sx * PAV.x, a = PAV.a, P = rect(a, a).map(p => [p[0] + cx, p[1]]);
  const h1 = 4.6, W = offsetPoly(P, -1.0);
  bag.add(M.wall, stripGeo(W, 0.12, h1, 2.3));
  for (const p of P) { B.col.add(p[0], 0, p[1], 0.26, h1, 0.26, 0); B.base.add(p[0], 0, p[1], 0.26, 0.3, 0.26, 0, C.stone); }
  for (let i = 0; i < 4; i++) { const A = P[i], Bq = P[(i + 1) % 4]; for (const t of [1 / 3, 2 / 3]) { const x = lerp(A[0], Bq[0], t), z = lerp(A[1], Bq[1], t); B.col.add(x, 0, z, 0.24, h1, 0.24, 0); } }
  beam(P, h1 - 0.5, 0.5, 0.3, M.caihua, 4.2); dougongRow(P, h1 + 0.1, 0.7);
  buildEave(P, { din: -1.0, dout: 2.4, yTop: h1 + 2.4, rise: 1.6, lift: 1.6, sweep: 0.8, w: 1.6 });
  const P2 = rect(a - 1.0, a - 1.0).map(p => [p[0] + cx, p[1]]), y2 = h1 + 2.6, h2 = 3.4;
  { const g = shapeGeo(offsetPoly(P2, 0.6), 0.25); g.translate(0, y2 - 0.25, 0); bag.add(M.slab, g); }
  bag.add(M.wall, stripGeo(offsetPoly(P2, -0.8), y2, y2 + h2, 2.3));
  for (const p of P2) B.col.add(p[0], y2, p[1], 0.22, h2, 0.22, 0);
  const R = offsetPoly(P2, 0.45); for (let i = 0; i < 4; i++) fence(R[i][0], R[i][1], R[(i + 1) % 4][0], R[(i + 1) % 4][1], y2);
  dougongRow(P2, y2 + h2 + 0.1, 0.7);
  buildEave(P2, { din: -1.0, dout: 2.2, yTop: y2 + h2 + 2.2, rise: 1.5, lift: 1.5, sweep: 0.8, w: 1.5 });
  xieshan(cx, 0, a - 2.0, a - 2.0, y2 + h2 + 2.2, 2.6, 1.0, 0.8);
}

/* ============================== 匾额 ============================== */
const plaqueMats = [];
function plaque(text, w, h, y, dist, rot) {
  const mat = new T.MeshStandardMaterial({ map: plaqueTex(text), roughness: 0.42, envMapIntensity: 0.6, emissive: 0xffffff, emissiveIntensity: 0 }); mat.emissiveMap = mat.map; plaqueMats.push(mat);
  const g = new T.Group(); g.rotation.y = rot; tower.add(g);
  const m = new T.Mesh(new T.BoxGeometry(w, h, 0.12), [M.gold, M.gold, M.gold, M.gold, mat, M.gold]); m.position.set(0, y, dist); m.rotation.x = 0.17; m.castShadow = true; g.add(m);
  const f = new T.Mesh(new T.BoxGeometry(w + 0.3, h + 0.3, 0.08), M.gold); f.position.set(0, y, dist - 0.06); f.rotation.x = 0.17; g.add(f);
}
const PLAQUE = { y: colTopY[2] - 0.4, z: AZ[2] + 0.5 };
plaque('滕王阁', 5.4, 2.2, PLAQUE.y, PLAQUE.z, 0);

bag.build(tower, { noCast: new Set([M.rafter, M.railPanel]) });
B.col.build(tower); B.base.build(tower); B.dg.build(tower); B.que.build(tower, false); B.wd.build(tower, false); B.beast.build(tower, false); B.bell.build(tower, false); B.wood.build(tower);

/* ============================== 台座：12 m 高的青石台（像古城墙），正面大台阶下到江边 ============================== */
const BASE = { hx: 46, hz: 24, bot: -12, stairW: 14, stairL: 30 };
(function () {
  const sbag = new H.Bag(), root = H.scene;
  function stoneBox(w, h, d, x, y, z) {
    const g = new T.BoxGeometry(w, h, d), uv = g.attributes.uv, s = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) uv.setXY(f * 4 + i, uv.getX(f * 4 + i) * s[f][0] / 3.2, uv.getY(f * 4 + i) * s[f][1] / 3.2);
    g.translate(x, y, z); sbag.add(M.stone, g);
  }
  function stoneRail(ax, az, bx, bz, y) {
    const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz), ry = edgeRy(dx, dz), n = Math.max(1, Math.round(L / 1.9));
    for (let i = 0; i <= n; i++) B.post.add(ax + dx * i / n, y, az + dz * i / n, 1, 1, 1, ry, C.stone);
    for (let i = 0; i < n; i++) {
      const mx = ax + dx * (i + 0.5) / n, mz = az + dz * (i + 0.5) / n, l = L / n - 0.22;
      B.stone.add(mx, y + 0.42, mz, l, 0.5, 0.1, ry, 0xa9a598); B.stone.add(mx, y + 0.86, mz, l, 0.1, 0.13, ry, C.stone); B.stone.add(mx, y + 0.09, mz, l, 0.18, 0.16, ry, C.stone);
    }
  }
  const { hx, hz, bot, stairW, stairL } = BASE, sw = stairW / 2, ins = 0.4;
  stoneBox(hx * 2, -bot, hz * 2, 0, bot / 2, 0);                                     // 台身
  stoneBox(hx * 2 + 0.6, 0.35, hz * 2 + 0.6, 0, -0.17, 0);                           // 压面石
  stoneBox(hx * 2 + 1.2, 1.2, hz * 2 + 1.2, 0, bot + 0.6, 0);                         // 台脚
  stoneBox(AX[0] * 2 + 7, PH, AZ[0] * 2 + 7, 0, PH / 2, 0);                            // 主阁月台
  for (const seg of [[-hx + ins, -sw], [sw, hx - ins]]) stoneRail(seg[0], hz - ins, seg[1], hz - ins, 0);
  stoneRail(-hx + ins, -hz + ins, hx - ins, -hz + ins, 0);
  for (const sx of [1, -1]) stoneRail(sx * (hx - ins), -hz + ins, sx * (hx - ins), hz - ins, 0);
  const N = 40, rise = -bot / N, run = stairL / N;                                    // 正面大台阶
  for (let s = 0; s < N; s++) B.stone.add(0, bot + rise * (N - s) / 2, hz + (s + 0.5) * run, stairW - 1.2, rise * (N - s), run, 0, s % 2 ? 0xc8c3b5 : C.stone);
  for (const sx of [-1, 1]) { const len = Math.hypot(stairL, -bot); B.stone.add(sx * (sw - 0.3), bot / 2 + 0.5, hz + stairL / 2, 0.6, 1.0, len, 0, C.stone, Math.atan2(-bot, stairL)); }
  sbag.build(root); B.stone.build(root); B.post.build(root);
})();

/* ============================== 夜景：泛光灯与发光强度 ============================== */
const floods = [];
for (const p of [[26, 18], [-26, 18], [26, -18], [-26, -18]]) {
  const l = new T.SpotLight(0xffb866, 0, 110, 0.75, 0.7, 1.2); l.position.set(p[0], 1.2, p[1]); l.target.position.set(p[0] * 0.1, 28, p[1] * 0.1); H.scene.add(l, l.target); floods.push(l);
}
function setGlow(g) {
  M.wall.emissiveIntensity = g * 2.0; M.tile.emissiveIntensity = g * 0.035; M.glaze.emissiveIntensity = g * 0.035; M.gold.emissiveIntensity = g * 0.3;
  M.rafter.emissiveIntensity = g * 0.1; M.lacquer.emissiveIntensity = g * 0.04; M.caihua.emissiveIntensity = g * 0.5; M.paint.emissiveIntensity = g * 0.5;
  plaqueMats.forEach(m => m.emissiveIntensity = g * 0.6);
  const on = g > 0.02 && H.Q.post; floods.forEach(l => { l.visible = on; l.intensity = g * 7; });
}
H.tower = { group: tower, PH, TY, AX, AZ, Y, DARK, RISE, YTOP, HELM_TOP, VW, BASE, PAV, PLAQUE, eaveEdgeY, colTopY, C, M, TX, setGlow, KAI, rect };
})();
