/* 鹳雀楼 · 楼体：高台基、副阶、三层楼身（外观三层四檐，内部六层）、唐式斗拱、平坐回廊、歇山顶与鸱尾
 * 今天的鹳雀楼是 2002 年按唐代风格重建的，通高约 73.9 米（含台基）。这里按课堂观感取整，单位约等于米 */
(function () {
'use strict';
const H = window.HHL, T = THREE;
const { lerp, smooth, clamp, rng, canvasTex, makeCanvas, pixelCanvas, texFrom, normalFromCanvas, gridGeo, stripGeo, tubeGeo, boxGeo, tint, mergeGeos, polyInfo, offsetPoly, shapeGeo } = H;
const KAI = '"KaiTi","STKaiti","楷体","SimSun",serif';

const PH = 10, TY = PH + 0.2;                         // 台基高、楼体基面
const tower = new T.Group(); tower.position.y = TY; H.scene.add(tower);
const AX = [15, 13.4, 11.8], AZ = [12, 10.8, 9.6];    // 各层檐柱一圈的半宽（正面朝 +z 的黄河）
const Y = [0, 17, 32];                                // 三个明层的楼面标高（每个明层里还藏着一个暗层）
const RISE = [3.4, 3.0, 2.8], YTOP = 46, HR = 5.6;    // 屋檐起坡；顶层之上是歇山顶
const rect = (ax, az) => [[ax, -az], [ax, az], [-ax, az], [-ax, -az]];
const C = { red: 0x8e2416, dark: 0x5a160c, ochre: 0x9c3a22, ochre2: 0x7a2c1a, white: 0xe9e2d0, grey: 0x55585c, stone: 0xb4ab98 };

/* ============================== 贴图 ============================== */
const tr = rng(77), tileRnd = []; for (let i = 0; i < 16; i++) tileRnd.push(0.88 + tr() * 0.22);
function tileH(u, v) {                                // 筒瓦隆起、板瓦下凹、逐行叠压
  const cu = (u * 4) % 1, cv = (v * 4) % 1, d = Math.abs(cu - 0.5) / 0.29;
  let h = d < 1 ? 0.42 + 0.58 * Math.sqrt(1 - d * d) : 0.3 - 0.16 * Math.min(1, (d - 1) / 0.72);
  h += 0.1 * cv; if (cv < 0.05) h -= 0.22;
  return Math.max(0, Math.min(1, h));
}
const tileHeight = pixelCanvas(512, 512, (u, v) => { const k = tileH(u, v) * 255; return [k, k, k]; });
const tileColor = pixelCanvas(512, 512, (u, v) => {   // 唐代多用青灰陶瓦，不像明清那样满铺黄琉璃
  const cu = (u * 4) % 1, cv = (v * 4) % 1, d = Math.abs(cu - 0.5) / 0.29, cover = d < 1 ? 1 : 0;
  const r = tileRnd[(Math.floor(u * 4) & 3) * 4 + (Math.floor(v * 4) & 3)], n = 0.88 + 0.24 * H.fbm(u * 40, v * 40, 3, 40);
  const k = r * n * (cv < 0.05 ? 0.55 : 1) * (cover ? 1 : 0.78);
  return [96 * k, 100 * k, 106 * k];
});
const TX = { tile: texFrom(tileColor), tileN: normalFromCanvas(tileHeight, 3.2) };
(function () {                                        // 檐下椽子
  const hc = pixelCanvas(128, 128, u => { const d = Math.abs(u - 0.5) / 0.3, k = d < 1 ? 90 + 165 * Math.sqrt(1 - d * d) : 40; return [k, k, k]; });
  TX.rafter = texFrom(pixelCanvas(128, 128, (u, v) => { const d = Math.abs(u - 0.5) / 0.3, n = 0.85 + 0.3 * H.vnoise(u * 9, v * 30, 0); return d < 1 ? [150 * n, 62 * n, 38 * n] : [228 * n, 220 * n, 204 * n]; }));
  TX.rafterN = normalFromCanvas(hc, 2.5);
})();
(function () {                                        // 唐式外墙：红柱、白粉壁、直棂窗、槛墙（颜色 / 夜间透光 / 起伏）
  const W = 512, Hh = 1024;
  function draw(mode) {
    return makeCanvas(W, Hh, function (g) {
      const fill = (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
      const col = (c0, c1, c2) => mode === 0 ? c0 : mode === 1 ? c1 : c2;
      fill(col('#e6dfcc', '#000', '#c8c8c8'), 0, 0, W, Hh);                         // 白粉壁
      if (mode === 0) { const r = rng(5); for (let i = 0; i < 900; i++) { g.fillStyle = 'rgba(120,100,70,' + r() * 0.05 + ')'; g.fillRect(r() * W, r() * Hh, 2 + r() * 8, 1 + r() * 3); } }
      fill(col('#8e2a18', '#000', '#e8e8e8'), 0, 120, W, 26);                       // 上额
      fill(col('#1a120c', '#ffb665', '#101010'), 40, 190, W - 80, 440);            // 窗洞
      const bars = 13, bw = (W - 80) / bars;
      for (let i = 0; i <= bars; i++) fill(col('#9a3220', '#1a0a04', '#e0e0e0'), 40 + i * bw - 7, 190, 14, 440);   // 直棂
      fill(col('#8e2a18', '#140804', '#e8e8e8'), 30, 180, W - 60, 18); fill(col('#8e2a18', '#140804', '#e8e8e8'), 30, 622, W - 60, 22);
      fill(col('#8e2a18', '#000', '#e8e8e8'), 0, 690, W, 22);                       // 腰串
      fill(col('#6a2a1a', '#000', '#a0a0a0'), 0, 800, W, Hh - 800);                 // 槛墙
      if (mode === 0) { g.strokeStyle = 'rgba(30,14,8,.5)'; g.lineWidth = 2; for (let y = 812; y < Hh; y += 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); } }
      fill(col('#8e2a18', '#000', '#f0f0f0'), 0, 0, 22, Hh); fill(col('#8e2a18', '#000', '#f0f0f0'), W - 22, 0, 22, Hh);   // 立颊
      if (mode === 0) { const gr = g.createLinearGradient(0, 0, 0, Hh); gr.addColorStop(0, 'rgba(0,0,0,.3)'); gr.addColorStop(0.15, 'rgba(0,0,0,0)'); gr.addColorStop(0.9, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.25)'); g.fillStyle = gr; g.fillRect(0, 0, W, Hh); }
    });
  }
  TX.wall = texFrom(draw(0)); TX.wallGlow = texFrom(draw(1)); TX.wallN = normalFromCanvas(draw(2), 1.6);
})();
TX.caihua = canvasTex(1024, 128, function (g, w, h) {  // 阑额彩画“七朱八白”：土朱底上隔开一段段白色长方块，是唐宋常见的做法
  g.fillStyle = '#9c3a22'; g.fillRect(0, 0, w, h);
  const r = rng(3); for (let i = 0; i < 500; i++) { g.fillStyle = 'rgba(40,10,4,' + r() * 0.08 + ')'; g.fillRect(r() * w, r() * h, 2 + r() * 10, 1); }
  g.fillStyle = '#ece4cf'; for (let i = 0; i < 8; i++) { const x = 30 + i * (w - 60) / 8; g.fillRect(x + 12, h * 0.3, (w - 60) / 8 - 24, h * 0.4); }
  g.fillStyle = 'rgba(60,20,10,.6)'; g.fillRect(0, 0, w, 6); g.fillRect(0, h - 6, w, 6);
});
TX.band = canvasTex(512, 256, function (g, w, h) {      // 拱眼壁：白壁上画淡淡的卷草
  g.fillStyle = '#e4dccb'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#9c3a22'; g.lineWidth = 14; g.strokeRect(7, 7, w - 14, h - 14);
  g.strokeStyle = 'rgba(140,70,40,.55)'; g.lineWidth = 4; g.beginPath();
  for (let x = 40; x < w - 40; x += 4) { const y = h / 2 + Math.sin(x / 34) * 30; x === 40 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
  for (let x = 74; x < w - 40; x += 108) { g.beginPath(); g.arc(x, h / 2 - 22, 16, 0, 5); g.stroke(); g.beginPath(); g.arc(x + 54, h / 2 + 22, 16, 3, 8); g.stroke(); }
});
(function () {                                        // 台基砖面
  const S = 512, joints = (x, y) => { const row = Math.floor(y * 16), xo = (row % 2) * 0.5, fx = ((x * 8) + xo) % 1, fy = (y * 16) % 1; return fx < 0.03 || fy < 0.08; };
  TX.brick = texFrom(pixelCanvas(S, S, (u, v) => { const n = H.fbm(u * 8, v * 8, 4, 8), m = H.fbm(u * 40 + 9, v * 40, 3, 40); let k = 0.82 + 0.18 * n + 0.06 * m; if (joints(u, v)) return [168, 162, 150]; return [128 * k, 118 * k, 104 * k]; }));
  TX.brickN = normalFromCanvas(pixelCanvas(S, S, (u, v) => { const k = (joints(u, v) ? 70 : 170) + 50 * H.fbm(u * 40, v * 40, 3, 40); return [k, k, k]; }), 1.8);
  const sj = (x, y) => { const row = Math.floor(y * 4), xo = (row % 2) * 0.25, fx = ((x + xo) * 2) % 1, fy = (y * 4) % 1; return fx < 0.012 || fy < 0.03; };
  TX.stone = texFrom(pixelCanvas(S, S, (u, v) => { const n = H.fbm(u * 6, v * 6, 5, 6), m = H.fbm(u * 30 + 9, v * 30, 3, 30); let k = 0.8 + 0.2 * n + 0.06 * m; if (sj(u, v)) k *= 0.62; return [200 * k, 194 * k, 182 * k]; }));
  TX.stoneN = normalFromCanvas(pixelCanvas(S, S, (u, v) => { const k = (sj(u, v) ? 60 : 170) + 60 * H.fbm(u * 40, v * 40, 3, 40); return [k, k, k]; }), 1.4);
})();
TX.railPanel = canvasTex(256, 128, function (g, w, h) { // 勾片栏杆（唐代栏杆常见的勾片纹）
  g.clearRect(0, 0, w, h); g.strokeStyle = '#8a2414'; g.lineWidth = 9; g.strokeRect(5, 5, w - 10, h - 10); g.lineWidth = 7;
  for (let x = 0; x <= w; x += 128) { g.beginPath(); g.moveTo(x, 5); g.lineTo(x, h - 5); g.stroke(); }
  for (let x = 0; x < w; x += 128) { g.beginPath(); g.moveTo(x + 14, h - 14); g.lineTo(x + 64, 18); g.lineTo(x + 114, h - 14); g.moveTo(x + 14, 18); g.lineTo(x + 64, h - 14); g.lineTo(x + 114, 18); g.stroke(); }
});
TX.hang = canvasTex(256, 128, function (g, w, h) {      // 平坐挂檐板
  g.fillStyle = '#7e2a18'; g.fillRect(0, 0, w, h); g.fillStyle = '#e6dcc6';
  for (let x = 16; x < w; x += 64) g.fillRect(x, 30, 32, h - 60);
});
TX.gable = canvasTex(512, 256, function (g, w, h) {     // 山花：歇山两侧的三角墙面，木板涂土朱，正中挂悬鱼
  g.fillStyle = '#8a3220'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(40,12,6,.5)'; g.lineWidth = 3;
  for (let x = 0; x < w; x += 22) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
  g.fillStyle = '#d9b25a'; g.beginPath(); g.moveTo(w / 2, 10); g.lineTo(w / 2 + 26, 70); g.quadraticCurveTo(w / 2 + 40, 130, w / 2, 170); g.quadraticCurveTo(w / 2 - 40, 130, w / 2 - 26, 70); g.closePath(); g.fill();
});
function plaqueTex(text) {                            // 竖匾：深蓝底金字（唐宋楼阁的匾多是竖写）
  const n = text.length;
  return canvasTex(300, 150 * n + 110, function (g, w, h) {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1e2f4e'); gr.addColorStop(1, '#101a30'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#d9b04a'; g.lineWidth = 18; g.strokeRect(9, 9, w - 18, h - 18); g.strokeStyle = '#7a1c12'; g.lineWidth = 5; g.strokeRect(25, 25, w - 50, h - 50);
    g.fillStyle = '#f0c95a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 140px ' + KAI;
    g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 8; g.shadowOffsetY = 4;
    for (let i = 0; i < n; i++) g.fillText(text[i], w / 2, 55 + 150 * i + 78);
  });
}

/* ============================== 材质 ============================== */
const M = H.towerMat = {
  tile: new T.MeshStandardMaterial({ map: TX.tile, normalMap: TX.tileN, normalScale: new T.Vector2(1.6, 1.6), roughness: 0.72, side: T.DoubleSide, envMapIntensity: 0.8, emissive: 0xffb45a, emissiveIntensity: 0 }),
  glaze: new T.MeshStandardMaterial({ color: 0x4a4d52, roughness: 0.6, envMapIntensity: 0.7, emissive: 0xffb45a, emissiveIntensity: 0 }),
  gold: new T.MeshStandardMaterial({ color: 0xd8a93a, roughness: 0.28, metalness: 1, emissive: 0xffa520, emissiveIntensity: 0 }),
  rafter: new T.MeshStandardMaterial({ map: TX.rafter, normalMap: TX.rafterN, roughness: 0.7, side: T.DoubleSide, envMapIntensity: 0.8, emissive: 0xff6a20, emissiveIntensity: 0 }),
  wall: new T.MeshStandardMaterial({ map: TX.wall, normalMap: TX.wallN, roughness: 0.62, envMapIntensity: 0.55, emissive: 0xffffff, emissiveMap: TX.wallGlow, emissiveIntensity: 0, side: T.DoubleSide }),
  caihua: new T.MeshStandardMaterial({ map: TX.caihua, roughness: 0.66, envMapIntensity: 0.45, side: T.DoubleSide, emissive: 0x6a5a40, emissiveIntensity: 0 }),
  band: new T.MeshStandardMaterial({ map: TX.band, roughness: 0.7, envMapIntensity: 0.45, side: T.DoubleSide, emissive: 0x6a5a40, emissiveIntensity: 0 }),
  lacquer: new T.MeshStandardMaterial({ color: C.red, roughness: 0.45, envMapIntensity: 0.7, emissive: 0xff3a10, emissiveIntensity: 0 }),
  woodI: new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.58, envMapIntensity: 0.45 }),
  paint: new T.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.62, envMapIntensity: 0.4, emissive: 0x6a3a20, emissiveIntensity: 0 }),
  slab: new T.MeshStandardMaterial({ color: 0x6e2a18, roughness: 0.6, envMapIntensity: 0.4 }),
  hang: new T.MeshStandardMaterial({ map: TX.hang, roughness: 0.6, envMapIntensity: 0.4, side: T.DoubleSide }),
  gable: new T.MeshStandardMaterial({ map: TX.gable, roughness: 0.62, envMapIntensity: 0.4, side: T.DoubleSide, emissive: 0x6a3a20, emissiveIntensity: 0 }),
  railPanel: new T.MeshStandardMaterial({ map: TX.railPanel, alphaTest: 0.5, side: T.DoubleSide, roughness: 0.6, envMapIntensity: 0.4 }),
  brick: new T.MeshStandardMaterial({ map: TX.brick, normalMap: TX.brickN, roughness: 0.88, envMapIntensity: 0.5 }),
  stone: new T.MeshStandardMaterial({ color: 0xc8c0b0, map: TX.stone, normalMap: TX.stoneN, roughness: 0.8, envMapIntensity: 0.6 }),
  stoneI: new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, envMapIntensity: 0.6 }),
  bronze: new T.MeshStandardMaterial({ color: 0x6a5a3a, roughness: 0.42, metalness: 0.9 })
};

/* ============================== 构件原型 ============================== */
const unitBox = new T.BoxGeometry(1, 1, 1);
const colGeo = new T.LatheGeometry([[1, 0], [1, 0.03], [0.985, 0.55], [0.92, 1]].map(p => new T.Vector2(p[0], p[1])), 20);     // 唐柱有明显的收分
const baseGeo = new T.LatheGeometry([[1.7, 0], [1.7, 0.2], [1.55, 0.4], [1.3, 0.62], [1.12, 1]].map(p => new T.Vector2(p[0], p[1])), 20);   // 覆盆柱础
const dougongGeo = (function () {                     // 唐式斗拱：构件大、出跳深、简洁有力，土朱刷饰、白色勾边（单位尺寸，使用时放大）
  const g = [], Bx = (w, h, d, x, y, z, c) => g.push(tint(boxGeo(w, h, d, x, y, z), c));
  const O = C.ochre, O2 = C.ochre2, Wt = C.white;
  Bx(0.36, 0.2, 0.36, 0, 0.1, 0, O2);                                       // 栌斗
  Bx(1.05, 0.14, 0.16, 0, 0.28, 0, O); Bx(0.16, 0.14, 1.0, 0, 0.28, 0.2, O); // 泥道拱、华拱一跳
  for (const sx of [-0.46, 0.46]) Bx(0.2, 0.11, 0.2, sx, 0.405, 0, O2); Bx(0.2, 0.11, 0.2, 0, 0.405, 0.6, O2);
  Bx(1.4, 0.14, 0.16, 0, 0.535, 0, O); Bx(0.16, 0.14, 1.4, 0, 0.535, 0.4, O); Bx(1.15, 0.14, 0.16, 0, 0.535, 0.6, O);   // 二跳
  for (const sx of [-0.55, 0.55]) Bx(0.2, 0.11, 0.2, sx, 0.66, 0.6, O2); Bx(0.2, 0.11, 0.2, 0, 0.66, 1.0, O2);
  Bx(1.3, 0.16, 0.16, 0, 0.8, 1.0, O);                                        // 令拱托替木
  const ang = new T.BoxGeometry(0.15, 0.13, 1.6); ang.rotateX(-0.38); ang.translate(0, 0.62, 0.55); g.push(tint(ang, O2));   // 下昂
  Bx(0.17, 0.03, 1.02, 0, 0.36, 0.2, Wt); Bx(0.17, 0.03, 1.42, 0, 0.615, 0.4, Wt); Bx(1.08, 0.03, 0.17, 0, 0.36, 0, Wt);   // 白色勾边
  return mergeGeos(g);
})();
const wadangGeo = (function () {                      // 莲花瓦当 + 滴水
  const a = new T.CylinderGeometry(0.16, 0.16, 0.12, 12); a.rotateX(Math.PI / 2); a.translate(0, 0.07, 0);
  const b = new T.BoxGeometry(0.26, 0.26, 0.05); b.rotateZ(Math.PI / 4); b.translate(0.34, -0.12, 0);
  return mergeGeos([a, b]);
})();
const bellGeo = (function () { const a = new T.CylinderGeometry(0.1, 0.26, 0.5, 10, 1, true); a.translate(0, -0.55, 0); const b = new T.CylinderGeometry(0.025, 0.025, 0.4, 4); b.translate(0, -0.15, 0); const c = new T.SphereGeometry(0.07, 6, 5); c.translate(0, -0.85, 0); return mergeGeos([a, b, c]); })();   // 风铎
const stonePostGeo = (function () {                   // 石栏望柱
  const a = boxGeo(0.24, 1.0, 0.24, 0, 0.5, 0), b = boxGeo(0.29, 0.06, 0.29, 0, 1.03, 0);
  const c = new T.LatheGeometry([[0.07, 0], [0.13, 0.05], [0.15, 0.15], [0.12, 0.26], [0.06, 0.33], [0.0, 0.36]].map(p => new T.Vector2(p[0], p[1])), 10); c.translate(0, 1.06, 0);
  return mergeGeos([a, b, c].map(g => { g.deleteAttribute('uv'); return g; }));
})();
const chiweiGeo = (function () {                      // 鸱尾：唐代正脊两端高高翘起的鱼尾形装饰，局部 +x 朝屋脊中间
  const s = new T.Shape();
  s.moveTo(-0.35, 0); s.lineTo(1.5, 0); s.quadraticCurveTo(0.95, 0.45, 0.8, 1.15); s.quadraticCurveTo(0.74, 1.85, 1.25, 2.35);
  s.quadraticCurveTo(0.95, 2.62, 0.62, 2.5); s.quadraticCurveTo(0.42, 2.85, 0.2, 3.15); s.quadraticCurveTo(-0.45, 2.3, -0.42, 1.2); s.quadraticCurveTo(-0.4, 0.5, -0.35, 0);
  const g = new T.ExtrudeGeometry(s, { depth: 0.56, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 2, curveSegments: 10 }); g.translate(0, 0, -0.28);
  return g;
})();

const bag = new H.Bag(), DG = 2.0, B = {
  col: new H.Batch(colGeo, M.lacquer), base: new H.Batch(baseGeo, M.stoneI), dg: new H.Batch(dougongGeo, M.paint),
  wd: new H.Batch(wadangGeo, M.glaze), bell: new H.Batch(bellGeo, M.bronze),
  wood: new H.Batch(unitBox, M.woodI), stone: new H.Batch(unitBox, M.stoneI), post: new H.Batch(stonePostGeo, M.stoneI)
};
const edgeRy = (dx, dz) => -Math.atan2(dz, dx);       // 让局部 x 轴沿 (dx,dz)
const outRy = (dx, dz) => Math.atan2(dz, -dx);        // 让局部 z 轴朝逆时针多边形的外法线

function beam(P, yb, h, depth, mat, uLen) {           // 沿多边形一圈的方木：外立面 + 底面
  const Po = offsetPoly(P, depth / 2), Pi = offsetPoly(P, -depth / 2), n = P.length, pos = [], uv = [], idx = [];
  bag.add(mat, stripGeo(Po, yb, yb + h, uLen || 6));
  for (let i = 0; i < n; i++) { const j = (i + 1) % n, b = pos.length / 3; pos.push(Pi[i][0], yb, Pi[i][1], Pi[j][0], yb, Pi[j][1], Po[j][0], yb, Po[j][1], Po[i][0], yb, Po[i][1]); uv.push(0, 0, 1, 0, 1, 0.3, 0, 0.3); idx.push(b, b + 1, b + 2, b, b + 2, b + 3); }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); bag.add(mat, g);
}
function dougongRow(P, y, step, s) {
  const n = P.length; s = s || DG;
  for (let i = 0; i < n; i++) {
    const A = P[i], Bq = P[(i + 1) % n], dx = Bq[0] - A[0], dz = Bq[1] - A[1], L = Math.hypot(dx, dz), m = Math.max(1, Math.round(L / step)), ry = outRy(dx, dz);
    for (let j = 0; j <= m; j++) B.dg.add(A[0] + dx * j / m, y, A[1] + dz * j / m, s, s, s, ry);
  }
}
function fence(ax, az, bx, bz, y) {                   // 平坐上的木栏杆（人站着扶的高度，不随楼放大）
  const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz); if (L < 0.3) return;
  const ry = edgeRy(dx, dz), mx = (ax + bx) / 2, mz = (az + bz) / 2;
  B.wood.add(mx, y + 1.1, mz, L + 0.1, 0.12, 0.16, ry, C.red); B.wood.add(mx, y + 0.76, mz, L, 0.07, 0.08, ry, C.red); B.wood.add(mx, y + 0.18, mz, L, 0.08, 0.1, ry, C.red);
  const n = Math.max(1, Math.round(L / 1.8));
  for (let i = 0; i <= n; i++) { const x = ax + dx * i / n, z = az + dz * i / n; B.wood.add(x, y + 0.62, z, 0.16, 1.24, 0.16, ry, C.red); B.wood.add(x, y + 1.28, z, 0.2, 0.08, 0.2, ry, C.dark); }
  const g = new T.BufferGeometry(), rep = Math.max(1, Math.round(L / 1.2));
  g.setAttribute('position', new T.Float32BufferAttribute([ax, y + 0.22, az, bx, y + 0.22, bz, bx, y + 0.74, bz, ax, y + 0.74, az], 3));
  g.setAttribute('uv', new T.Float32BufferAttribute([0, 0, rep, 0, rep, 1, 0, 1], 2)); g.setIndex([0, 2, 1, 0, 3, 2]); g.computeVertexNormals(); bag.add(M.railPanel, g);
}

/* ---- 屋檐：唐代屋檐出挑深远、坡度平缓，四角只是微微翘起，像大鸟舒展翅膀 ---- */
function buildEave(P, o) {
  const n = P.length, info = polyInfo(P), Pin = offsetPoly(P, o.din), Pout = offsetPoly(P, o.dout);
  function pt(i, u, t, dy) {
    const j = (i + 1) % n;
    const ax = lerp(Pin[i][0], Pin[j][0], u), az = lerp(Pin[i][1], Pin[j][1], u), bx = lerp(Pout[i][0], Pout[j][0], u), bz = lerp(Pout[i][1], Pout[j][1], u);
    let x = lerp(ax, bx, t), z = lerp(az, bz, t), y = o.yTop - o.rise + o.rise * Math.pow(1 - t, 1.45);
    const L = Math.hypot(Pout[j][0] - Pout[i][0], Pout[j][1] - Pout[i][1]), t2 = t * t;
    const corner = (c, d) => { if (!info[c].convex) return; const g = Math.exp(-Math.pow(d / o.w, 2)) * (1 - smooth(0.5, 1, d / L)); y += o.lift * g * t2 * (0.4 + 0.6 * t); x += info[c].diag[0] * o.sweep * g * t2; z += info[c].diag[1] * o.sweep * g * t2; };
    corner(i, u * L); corner(j, (1 - u) * L);
    return [x, y + (dy || 0), z];
  }
  const NT = 10, slope = Math.hypot(o.dout - o.din, o.rise), rows = Math.max(4, Math.round(slope / 0.7)), th = o.th || 0.4;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const Lm = Math.hypot((Pin[j][0] + Pout[j][0] - Pin[i][0] - Pout[i][0]) / 2, (Pin[j][1] + Pout[j][1] - Pin[i][1] - Pout[i][1]) / 2);
    const Lo = Math.hypot(Pout[j][0] - Pout[i][0], Pout[j][1] - Pout[i][1]);
    const nu = Math.max(2, Math.ceil(Lo / 0.8)), rep = Math.max(1, Math.round(Lm / 0.66));
    bag.add(M.tile, gridGeo(nu, NT, (u, t) => { const p = pt(i, u, t, 0); return [p[0], p[1], p[2], u * rep / 4, t * rows / 4]; }));
    bag.add(M.rafter, gridGeo(nu, NT, (u, t) => { const p = pt(i, u, t, -th); return [p[0], p[1], p[2], u * rep * 1.5, t * 2]; }));
    bag.add(M.slab, gridGeo(nu, 1, (u, v) => { const p = pt(i, u, 1, v ? -th - 0.06 : 0.04); return [p[0], p[1], p[2], u, v]; }));
    for (let k = 0; k < rep; k++) {
      const u = (k + 0.5) / rep, p = pt(i, u, 1, 0), q = pt(i, u, 0.9, 0);
      B.wd.add(p[0], p[1] - 0.04, p[2], 1, 1, 1, Math.atan2(p[0] - q[0], p[2] - q[2]));
    }
  }
  for (let i = 0; i < n; i++) {                       // 戗脊、风铎
    if (!info[i].convex) continue;
    const pts = [], d = info[i].diag; for (let k = 0; k <= 10; k++) pts.push(pt(i, 0, k / 10, 0.2));
    const e = pts[10]; pts.push([e[0] + d[0] * 0.7, e[1] + 0.35, e[2] + d[1] * 0.7]);
    bag.add(M.glaze, tubeGeo(pts, 0.28, 8)); bag.add(M.glaze, tubeGeo(pts.slice(0, 11).map(p => [p[0], p[1] + 0.28, p[2]]), 0.12, 5));
    B.bell.add(e[0] + d[0] * 0.45, e[1] - 0.2, e[2] + d[1] * 0.45, 1, 1, 1, 0);
  }
}

/* ============================== 三个明层 ============================== */
const eaveEdgeY = [], colTopY = [], VW = [2.4, 2.0, 2.0];   // VW：檐柱到外墙的回廊宽
for (let k = 0; k < 3; k++) {
  const P = rect(AX[k], AZ[k]), n = P.length;
  const nextY = k < 2 ? Y[k + 1] : YTOP, eaveTop = nextY - (k < 2 ? 2.6 : 0.8), edge = eaveTop - RISE[k], colTop = edge + 0.4, hc = colTop - Y[k];
  eaveEdgeY.push(edge); colTopY.push(colTop);
  const W = offsetPoly(P, -VW[k]);
  // 墙身：白壁、直棂窗、立颊（一开间一张贴图）
  bag.add(M.wall, stripGeo(W, Y[k] + 0.12, colTop + 0.4, 4.6));
  bag.add(M.band, stripGeo(W, colTop + 0.4, nextY - (k < 2 ? 0.4 : 0.8), 4.6));
  for (let i = 0; i < n; i++) {
    const A = W[i], Bq = W[(i + 1) % n], dx = Bq[0] - A[0], dz = Bq[1] - A[1], L = Math.hypot(dx, dz), nx = dz / L, nz = -dx / L, ry = edgeRy(dx, dz);
    B.wood.add((A[0] + Bq[0]) / 2 + nx * 0.08, Y[k] + 0.1, (A[1] + Bq[1]) / 2 + nz * 0.08, L, 0.2, 0.3, ry, C.dark);
  }
  // 檐柱、覆盆柱础
  const r = k === 0 ? 0.78 : 0.66;
  for (let i = 0; i < n; i++) {
    const A = P[i], Bq = P[(i + 1) % n], L = Math.hypot(Bq[0] - A[0], Bq[1] - A[1]), seg = Math.max(1, Math.round(L / 4.8));
    for (let j = 0; j < seg; j++) { const x = lerp(A[0], Bq[0], j / seg), z = lerp(A[1], Bq[1], j / seg); B.col.add(x, Y[k], z, r, hc, r, 0); B.base.add(x, Y[k], z, r, 0.5, r, 0, C.stone); }
  }
  // 阑额（七朱八白）、普拍枋、斗拱、橑檐枋
  beam(P, colTop - 1.2, 1.0, 0.7, M.caihua, 8.0); beam(P, colTop - 0.05, 0.35, 0.9, M.caihua, 8.0);
  dougongRow(P, colTop + 0.3, 2.4); beam(offsetPoly(P, 2.0), colTop + 0.3 + 0.8 * DG, 0.4, 0.4, M.caihua, 8.0);
  // 平坐：二、三层外面一圈回廊——挂檐板、平坐斗拱、勾片栏杆
  if (k > 0) {
    const g = shapeGeo(offsetPoly(P, 1.7), 0.4); g.translate(0, Y[k] - 0.4, 0); bag.add(M.slab, g);
    bag.add(M.hang, stripGeo(offsetPoly(P, 1.72), Y[k] - 1.1, Y[k] - 0.05, 2.0));
    dougongRow(offsetPoly(P, 0.2), Y[k] - 2.5, 2.4, 1.5);
    const R = offsetPoly(P, 1.45); for (let i = 0; i < n; i++) fence(R[i][0], R[i][1], R[(i + 1) % n][0], R[(i + 1) % n][1], Y[k]);
  }
  buildEave(P, { din: -2.4, dout: k === 0 ? 5.6 : 5.0, yTop: eaveTop, rise: RISE[k], lift: 1.5, sweep: 1.4, w: 4.5, th: 0.45 });
}

/* ---- 副阶：底层外面再绕一圈矮柱和一重屋檐，这就是“三层四檐”里多出来的那一重 ---- */
const FUJIE = { off: 4.4, h: 7.2 };
(function () {
  const P0 = rect(AX[0], AZ[0]), P = offsetPoly(P0, FUJIE.off), n = P.length, colTop = FUJIE.h;
  for (let i = 0; i < n; i++) {
    const A = P[i], Bq = P[(i + 1) % n], L = Math.hypot(Bq[0] - A[0], Bq[1] - A[1]), seg = Math.max(1, Math.round(L / 4.8));
    for (let j = 0; j < seg; j++) { const x = lerp(A[0], Bq[0], j / seg), z = lerp(A[1], Bq[1], j / seg); B.col.add(x, 0, z, 0.6, colTop, 0.6, 0); B.base.add(x, 0, z, 0.6, 0.45, 0.6, 0, C.stone); }
  }
  beam(P, colTop - 0.95, 0.8, 0.6, M.caihua, 8.0); beam(P, colTop - 0.05, 0.3, 0.75, M.caihua, 8.0);
  dougongRow(P, colTop + 0.25, 2.4, 1.6);
  FUJIE.eaveTop = colTop + 3.6; FUJIE.edge = FUJIE.eaveTop - 2.2;
  buildEave(P, { din: -FUJIE.off - 0.3, dout: 4.2, yTop: FUJIE.eaveTop, rise: 2.2, lift: 1.1, sweep: 1.0, w: 3.6, th: 0.4 });
  const g = shapeGeo(offsetPoly(P, 1.0), 0.2); g.translate(0, -0.2, 0);               // 副阶下的阶条石
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 3, uv.getY(i) / 3); bag.add(M.stone, g);
})();

/* ============================== 歇山顶：前后两坡加两侧三角形的山花，正脊两端立鸱尾 ============================== */
const ROOF = {};
(function () {
  const y0 = YTOP - 0.8, rx = AX[2] - 2.4, rz = AZ[2] - 2.4, rg = rx - 3.4, sg = (rx - rg) / rz;
  const prof = s => y0 + HR * Math.pow(s, 0.85);                                   // 略带凹曲的坡面
  const yg = prof(sg), ov = 0.9;                                                    // 山花底边高度、悬出
  for (const sz of [1, -1]) {                                                       // 前后两坡（下段收成梯形，接两侧的小坡）
    bag.add(M.tile, gridGeo(18, 14, (u, s) => { const half = s < sg ? lerp(rx, rg + ov, s / sg) : rg + ov, x = (u * 2 - 1) * half, z = sz * rz * (1 - s); return [x, prof(s), z, x / 2.6, s * 6]; }));
  }
  for (const sx of [1, -1]) {                                                       // 两侧的小坡（撒头）
    bag.add(M.tile, gridGeo(10, 6, (u, s) => { const f = s * sg, zh = rz * (1 - f), z = (u * 2 - 1) * zh, x = sx * lerp(rx, rg, s); return [x, prof(f), z, z / 2.6, s * 3]; }));
    const tri = new T.BufferGeometry(), zb = rz * (1 - sg);                         // 山花板
    tri.setAttribute('position', new T.Float32BufferAttribute([sx * rg, yg, -zb, sx * rg, yg, zb, sx * rg, y0 + HR, 0], 3));
    tri.setAttribute('uv', new T.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2)); tri.computeVertexNormals(); bag.add(M.gable, tri);
    for (const sz of [1, -1]) {                                                     // 垂脊（博风）与戗脊
      bag.add(M.glaze, tubeGeo([[sx * (rg + ov * 0.6), y0 + HR + 0.2, 0], [sx * (rg + ov * 0.6), (yg + y0 + HR) / 2 + 0.25, sz * zb / 2], [sx * (rg + ov * 0.6), yg + 0.25, sz * zb]], 0.26, 6));
      bag.add(M.glaze, tubeGeo([[sx * (rg + ov * 0.6), yg + 0.25, sz * zb], [sx * (rx - 0.6), y0 + 0.6, sz * (rz - 0.6)], [sx * (rx + 0.4), y0 + 0.2, sz * (rz + 0.4)]], 0.26, 6));
    }
  }
  const yt = y0 + HR, E = rg + ov + 0.2;
  bag.add(M.glaze, boxGeo(E * 2, 1.0, 0.8, 0, yt + 0.3, 0)); bag.add(M.glaze, boxGeo(E * 2 - 0.4, 0.22, 1.05, 0, yt + 0.85, 0));   // 正脊
  for (const sx of [1, -1]) { const g = chiweiGeo.clone(); g.scale(1.25, 1.25, 1.25); if (sx > 0) g.rotateY(Math.PI); g.translate(sx * (E - 0.6), yt + 0.7, 0); bag.add(M.glaze, g); }
  Object.assign(ROOF, { y0, yt, rx, rz, rg, E, top: yt + 0.7 + 3.15 * 1.25 });
})();

/* ============================== 匾额 ============================== */
const plaqueMats = [];
function plaque(text, w, h, y, dist) {
  const mat = new T.MeshStandardMaterial({ map: plaqueTex(text), roughness: 0.42, envMapIntensity: 0.6, emissive: 0xffffff, emissiveIntensity: 0 }); mat.emissiveMap = mat.map; plaqueMats.push(mat);
  const m = new T.Mesh(new T.BoxGeometry(w, h, 0.18), [M.gold, M.gold, M.gold, M.gold, mat, M.gold]); m.position.set(0, y, dist); m.rotation.x = 0.08; m.castShadow = true; tower.add(m);
  const f = new T.Mesh(new T.BoxGeometry(w + 0.3, h + 0.3, 0.1), M.gold); f.position.set(0, y, dist - 0.08); f.rotation.x = 0.08; tower.add(f);
}
const PLAQUE = { y: colTopY[1] - 3.4, z: AZ[1] + 0.9 };
plaque('鹳雀楼', 2.6, 6.2, PLAQUE.y, PLAQUE.z);

bag.build(tower, { noCast: new Set([M.rafter, M.railPanel]) });
B.col.build(tower); B.base.build(tower); B.dg.build(tower); B.wd.build(tower, false); B.bell.build(tower, false); B.wood.build(tower);

/* ============================== 高台基：砖砌台体、正面大台阶、石栏杆 ============================== */
const BASE = { hx: AX[0] + FUJIE.off + 7, hz: AZ[0] + FUJIE.off + 7 };
(function () {
  const sbag = new H.Bag(), root = H.scene;
  function texBox(mat, w, h, d, x, y, z, s) {
    const g = new T.BoxGeometry(w, h, d), uv = g.attributes.uv, f = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]], k = s || 4;
    for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) uv.setXY(i * 4 + j, uv.getX(i * 4 + j) * f[i][0] / k, uv.getY(i * 4 + j) * f[i][1] / k);
    g.translate(x, y, z); sbag.add(mat, g);
  }
  function stoneRail(ax, az, bx, bz, y) {
    const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz), ry = edgeRy(dx, dz), n = Math.max(1, Math.round(L / 2.1));
    for (let i = 0; i <= n; i++) B.post.add(ax + dx * i / n, y, az + dz * i / n, 1, 1, 1, ry, C.stone);
    for (let i = 0; i < n; i++) {
      const mx = ax + dx * (i + 0.5) / n, mz = az + dz * (i + 0.5) / n, l = L / n - 0.24;
      B.stone.add(mx, y + 0.42, mz, l, 0.5, 0.1, ry, 0xa9a598); B.stone.add(mx, y + 0.86, mz, l, 0.1, 0.14, ry, C.stone); B.stone.add(mx, y + 0.09, mz, l, 0.18, 0.18, ry, C.stone);
    }
  }
  const { hx, hz } = BASE, y0 = -0.3, y1 = PH, gap = 16;
  texBox(M.brick, hx * 2, y1 - y0 - 0.5, hz * 2, 0, (y0 + y1 - 0.5) / 2, 0, 4);                // 砖台
  texBox(M.stone, hx * 2 + 0.6, 0.5, hz * 2 + 0.6, 0, y1 - 0.25, 0, 3.2);                       // 压面石
  texBox(M.stone, hx * 2 + 1.2, 0.7, hz * 2 + 1.2, 0, 0.05, 0, 3.2);                           // 台脚
  texBox(M.stone, hx * 2, 0.2, hz * 2, 0, y1 + 0.1, 0, 3.2);                                   // 台面
  const N = 30, rise = y1 / N, run = 0.42, inset = 0.4;                                        // 正面大台阶：从黄河边一步步登上高台
  for (let s = 0; s < N; s++) B.stone.add(0, (s + 1) * rise / 2, hz + (N - s - 0.5) * run, gap - 1.2, (s + 1) * rise, run, 0, s % 2 ? 0xc8c0b0 : C.stone);
  for (const sx of [-1, 1]) {
    const len = Math.hypot(N * run, y1), cw = new T.Mesh(new T.BoxGeometry(0.8, 1.0, len), M.stone);
    cw.position.set(sx * (gap / 2 - 0.2), y1 / 2 + 0.5, hz + N * run / 2); cw.rotation.x = Math.atan2(y1, N * run); cw.castShadow = cw.receiveShadow = true; root.add(cw);
    texBox(M.brick, 3, y1 - 0.5, N * run, sx * (gap / 2 + 1.5), (y1 - 0.5) / 2 - 0.3, hz + N * run / 2, 4);
  }
  for (const seg of [[-hx + inset, -gap / 2], [gap / 2, hx - inset]]) stoneRail(seg[0], hz - inset, seg[1], hz - inset, y1 + 0.2);
  stoneRail(-hx + inset, -hz + inset, hx - inset, -hz + inset, y1 + 0.2);
  for (const sx of [1, -1]) stoneRail(sx * (hx - inset), -hz + inset, sx * (hx - inset), hz - inset, y1 + 0.2);
  sbag.build(root); B.stone.build(root); B.post.build(root);
  BASE.stairEnd = hz + N * run;
})();

/* ============================== 夜景：泛光灯与发光强度 ============================== */
const floods = [];
for (const p of [[30, 28], [-30, 28], [30, -28], [-30, -28]]) {
  const l = new T.SpotLight(0xffc27a, 0, 160, 0.7, 0.7, 1.2); l.position.set(p[0], PH + 1, p[1]); l.target.position.set(p[0] * 0.1, 40, p[1] * 0.1); H.scene.add(l, l.target); floods.push(l);
}
function setGlow(g) {
  M.wall.emissiveIntensity = g * 2.0; M.tile.emissiveIntensity = g * 0.03; M.glaze.emissiveIntensity = g * 0.02; M.gold.emissiveIntensity = g * 0.3;
  M.rafter.emissiveIntensity = g * 0.12; M.lacquer.emissiveIntensity = g * 0.05; M.caihua.emissiveIntensity = g * 0.5; M.band.emissiveIntensity = g * 0.5; M.paint.emissiveIntensity = g * 0.5; M.gable.emissiveIntensity = g * 0.4;
  plaqueMats.forEach(m => m.emissiveIntensity = g * 0.6);
  const on = g > 0.02 && H.Q.post; floods.forEach(l => { l.visible = on; l.intensity = g * 9; });
}
H.tower = { group: tower, PH, TY, AX, AZ, Y, RISE, YTOP, ROOF, VW, BASE, PLAQUE, FUJIE, eaveEdgeY, colTopY, C, M, TX, setGlow, KAI, rect };
})();
