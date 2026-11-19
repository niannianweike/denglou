/* 登楼课件 · 建楼工具：各楼共用的贴图、材质和构件（屋檐、斗拱、柱、墙、平坐、栏杆、歇山顶、攒尖顶、匾额、台基、夜景灯）
 * 每座楼的 tower.js 用它来“搭积木”。单位约等于米，楼体放在 y = TY 的 group 里，正面朝 +z */
(function () {
'use strict';
const H = window.HHL, T = THREE;
const { lerp, smooth, rng, canvasTex, makeCanvas, pixelCanvas, texFrom, normalFromCanvas, gridGeo, stripGeo, tubeGeo, boxGeo, tint, mergeGeos, polyInfo, offsetPoly, shapeGeo } = H;
const KAI = '"KaiTi","STKaiti","楷体","SimSun",serif';
const rect = (ax, az) => [[ax, -az], [ax, az], [-ax, az], [-ax, -az]];
const poly = (n, r, rot) => { const P = []; for (let i = 0; i < n; i++) { const a = (rot || 0) + i * 2 * Math.PI / n; P.push([Math.cos(a) * r, Math.sin(a) * r]); } return P; };   // 逆时针（与 rect 同向）的正多边形

/* ============================== 贴图 ============================== */
const TILE = { grey: [[96, 100, 106], 0.78], yellow: [[214, 152, 32], 0.82], green: [[58, 118, 84], 0.8], black: [[58, 60, 64], 0.8], blue: [[52, 88, 128], 0.8] };
function tileTex(scheme) {
  const c = TILE[scheme] || TILE.grey, tr = rng(77), R = []; for (let i = 0; i < 16; i++) R.push(0.86 + tr() * 0.26);
  const tileH = (u, v) => { const cu = (u * 4) % 1, cv = (v * 4) % 1, d = Math.abs(cu - 0.5) / 0.29; let h = d < 1 ? 0.42 + 0.58 * Math.sqrt(1 - d * d) : 0.3 - 0.16 * Math.min(1, (d - 1) / 0.72); h += 0.1 * cv; if (cv < 0.05) h -= 0.22; return Math.max(0, Math.min(1, h)); };
  const col = pixelCanvas(512, 512, (u, v) => {
    const cu = (u * 4) % 1, cv = (v * 4) % 1, d = Math.abs(cu - 0.5) / 0.29, cover = d < 1 ? 1 : c[1];
    const k = R[(Math.floor(u * 4) & 3) * 4 + (Math.floor(v * 4) & 3)] * (0.88 + 0.24 * H.fbm(u * 40, v * 40, 3, 40)) * (cv < 0.05 ? 0.55 : 1) * cover;
    return [c[0][0] * k, c[0][1] * k, c[0][2] * k];
  });
  return { map: texFrom(col), normal: normalFromCanvas(pixelCanvas(512, 512, (u, v) => { const k = tileH(u, v) * 255; return [k, k, k]; }), 3.2) };
}
function rafterTex(style) {
  const a = style === 'tang' ? [150, 62, 38] : [40, 92, 84], b = style === 'tang' ? [228, 220, 204] : [120, 40, 26];
  const hc = pixelCanvas(128, 128, u => { const d = Math.abs(u - 0.5) / 0.3, k = d < 1 ? 90 + 165 * Math.sqrt(1 - d * d) : 40; return [k, k, k]; });
  return { map: texFrom(pixelCanvas(128, 128, (u, v) => { const d = Math.abs(u - 0.5) / 0.3, n = 0.85 + 0.3 * H.vnoise(u * 9, v * 30, 0); const c = d < 1 ? a : b; return [c[0] * n, c[1] * n, c[2] * n]; })), normal: normalFromCanvas(hc, 2.5) };
}
function wallTex(style) {                               // 'tang' 白壁直棂窗；'ming' 朱红隔扇门窗
  const W = 512, Hh = 1024;
  function draw(mode) {
    return makeCanvas(W, Hh, function (g) {
      const fill = (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
      const col = (c0, c1, c2) => mode === 0 ? c0 : mode === 1 ? c1 : c2;
      if (style === 'tang') {
        fill(col('#e6dfcc', '#000', '#c8c8c8'), 0, 0, W, Hh);
        if (mode === 0) { const r = rng(5); for (let i = 0; i < 900; i++) { g.fillStyle = 'rgba(120,100,70,' + r() * 0.05 + ')'; g.fillRect(r() * W, r() * Hh, 2 + r() * 8, 1 + r() * 3); } }
        fill(col('#8e2a18', '#000', '#e8e8e8'), 0, 120, W, 26);
        fill(col('#1a120c', '#ffb665', '#101010'), 40, 190, W - 80, 440);
        const bars = 13, bw = (W - 80) / bars; for (let i = 0; i <= bars; i++) fill(col('#9a3220', '#1a0a04', '#e0e0e0'), 40 + i * bw - 7, 190, 14, 440);
        fill(col('#8e2a18', '#140804', '#e8e8e8'), 30, 180, W - 60, 18); fill(col('#8e2a18', '#140804', '#e8e8e8'), 30, 622, W - 60, 22);
        fill(col('#8e2a18', '#000', '#e8e8e8'), 0, 690, W, 22); fill(col('#6a2a1a', '#000', '#a0a0a0'), 0, 800, W, Hh - 800);
        fill(col('#8e2a18', '#000', '#f0f0f0'), 0, 0, 22, Hh); fill(col('#8e2a18', '#000', '#f0f0f0'), W - 22, 0, 22, Hh);
      } else {
        fill(col('#4a1a0e', '#000', '#b0b0b0'), 0, 0, W, Hh);
        for (const x0 of [30, 262]) {
          const lw = 220; fill(col('#6a2214', '#000', '#e0e0e0'), x0, 14, lw, Hh - 28);
          const panel = (y, h) => { fill(col('#561c10', '#000', '#8a8a8a'), x0 + 16, y, lw - 32, h); if (mode === 0) { g.strokeStyle = '#b8923f'; g.lineWidth = 2.5; g.strokeRect(x0 + 26, y + 10, lw - 52, h - 20); } };
          panel(30, 78); panel(668, 70); panel(756, 236);
          const lx = x0 + 16, ly = 126, lww = lw - 32, lh = 524;
          fill(col('#17110e', '#ffb665', '#101010'), lx, ly, lww, lh);
          const bar = col('#7a2616', '#1a0a04', '#d8d8d8');
          for (let r = 0; r < 6; r++) { const y = ly + r * lh / 6, ins = (r % 2) * 18; fill(bar, lx, y - 2.5, lww, 5); fill(bar, lx + 30 + ins, y, 5, lh / 6); fill(bar, lx + lww - 35 - ins, y, 5, lh / 6); fill(bar, lx + 30 + ins, y + lh / 12 - 2.5, lww - 60 - ins * 2, 5); fill(bar, lx + lww / 2 - 2.5, y, 5, lh / 12); }
          g.strokeStyle = bar; g.lineWidth = 9; g.strokeRect(lx + 2, ly + 2, lww - 4, lh - 4);
        }
      }
      if (mode === 0) { const gr = g.createLinearGradient(0, 0, 0, Hh); gr.addColorStop(0, 'rgba(0,0,0,.3)'); gr.addColorStop(0.15, 'rgba(0,0,0,0)'); gr.addColorStop(0.9, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.25)'); g.fillStyle = gr; g.fillRect(0, 0, W, Hh); }
    });
  }
  return { map: texFrom(draw(0)), glow: texFrom(draw(1)), normal: normalFromCanvas(draw(2), 1.6) };
}
function caihuaTex(style) {                            // 'qizhu' 七朱八白（唐宋）；'xuan' 青绿旋子彩画（明清）
  return canvasTex(1024, 128, function (g, w, h) {
    if (style === 'qizhu') {
      g.fillStyle = '#9c3a22'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#ece4cf'; for (let i = 0; i < 8; i++) { const x = 30 + i * (w - 60) / 8; g.fillRect(x + 12, h * 0.3, (w - 60) / 8 - 24, h * 0.4); }
      g.fillStyle = 'rgba(60,20,10,.6)'; g.fillRect(0, 0, w, 6); g.fillRect(0, h - 6, w, 6); return;
    }
    g.fillStyle = '#244a62'; g.fillRect(0, 0, w, h);
    const band = (x, ww, c) => { g.fillStyle = c; g.fillRect(x, 0, ww, h); };
    band(0, 46, '#2e6a52'); band(w - 46, 46, '#2e6a52'); band(46, 12, '#c9a24a'); band(w - 58, 12, '#c9a24a');
    g.fillStyle = '#e7dcc0'; g.beginPath(); g.moveTo(330, 8); g.lineTo(390, h / 2); g.lineTo(330, h - 8); g.lineTo(694, h - 8); g.lineTo(634, h / 2); g.lineTo(694, 8); g.fill();
    g.strokeStyle = '#c9a24a'; g.lineWidth = 3; g.stroke();
    const rosette = cx => { for (let r = 46; r > 8; r -= 12) { g.strokeStyle = r % 24 ? '#e8e2d0' : '#c9a24a'; g.lineWidth = 2; g.beginPath(); g.arc(cx, h / 2, r, 0, 7); g.stroke(); } g.fillStyle = '#8a2a1c'; g.beginPath(); g.arc(cx, h / 2, 8, 0, 7); g.fill(); };
    rosette(120); rosette(250); rosette(774); rosette(904);
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(0,0,0,.35)'); gr.addColorStop(0.35, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.15)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
}
function bandTex(style) {
  return canvasTex(512, 256, function (g, w, h) {
    if (style === 'tang') { g.fillStyle = '#e4dccb'; g.fillRect(0, 0, w, h); g.strokeStyle = '#9c3a22'; g.lineWidth = 14; g.strokeRect(7, 7, w - 14, h - 14); }
    else { g.fillStyle = '#1f4a46'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c9a24a'; g.lineWidth = 6; g.strokeRect(10, 10, w - 20, h - 20); g.strokeStyle = 'rgba(220,210,180,.5)'; g.lineWidth = 3; g.strokeRect(30, 30, w - 60, h - 60); }
    g.strokeStyle = style === 'tang' ? 'rgba(140,70,40,.55)' : 'rgba(230,220,190,.45)'; g.lineWidth = 4; g.beginPath();
    for (let x = 40; x < w - 40; x += 4) { const y = h / 2 + Math.sin(x / 34) * 30; x === 40 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
  });
}
function railTex(style) {
  return canvasTex(256, 128, function (g, w, h) {
    g.clearRect(0, 0, w, h); g.strokeStyle = style === 'tang' ? '#8a2414' : '#5e1a0e'; g.lineWidth = 9; g.strokeRect(5, 5, w - 10, h - 10); g.lineWidth = 7;
    if (style === 'tang') { for (let x = 0; x <= w; x += 128) { g.beginPath(); g.moveTo(x, 5); g.lineTo(x, h - 5); g.stroke(); } for (let x = 0; x < w; x += 128) { g.beginPath(); g.moveTo(x + 14, h - 14); g.lineTo(x + 64, 18); g.lineTo(x + 114, h - 14); g.moveTo(x + 14, 18); g.lineTo(x + 64, h - 14); g.lineTo(x + 114, 18); g.stroke(); } }
    else { for (let x = 0; x <= w; x += 64) { g.beginPath(); g.moveTo(x, 5); g.lineTo(x, h - 5); g.stroke(); } g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke(); for (let x = 32; x < w; x += 64) g.strokeRect(x - 15, h / 2 - 22, 30, 44); }
  });
}
function plaqueTex(text, o) {                           // 匾：o.vertical 竖写；o.bg 底色；o.ink 字色
  o = o || {}; const n = text.length, vert = !!o.vertical;
  const W = vert ? 300 : 150 * n + 130, Hh = vert ? 150 * n + 110 : 270;
  return canvasTex(W, Hh, function (g, w, h) {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, o.bg || '#1c1612'); gr.addColorStop(1, o.bg2 || '#0c0907'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#d9b04a'; g.lineWidth = 18; g.strokeRect(9, 9, w - 18, h - 18); g.strokeStyle = '#7a1c12'; g.lineWidth = 5; g.strokeRect(25, 25, w - 50, h - 50);
    g.fillStyle = o.ink || '#f0c95a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold ' + (vert ? 140 : 150) + 'px ' + KAI;
    g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 8; g.shadowOffsetY = 4;
    for (let i = 0; i < n; i++) vert ? g.fillText(text[i], w / 2, 55 + 150 * i + 78) : g.fillText(text[i], 65 + 150 * i + 75, h / 2 + 8);
  });
}
const STONE = (function () {
  const S = 512, sj = (x, y) => { const row = Math.floor(y * 4), xo = (row % 2) * 0.25, fx = ((x + xo) * 2) % 1, fy = (y * 4) % 1; return fx < 0.012 || fy < 0.03; };
  const bj = (x, y) => { const row = Math.floor(y * 16), xo = (row % 2) * 0.5, fx = ((x * 8) + xo) % 1, fy = (y * 16) % 1; return fx < 0.03 || fy < 0.08; };
  return {
    stone: texFrom(pixelCanvas(S, S, (u, v) => { const n = H.fbm(u * 6, v * 6, 5, 6), m = H.fbm(u * 30 + 9, v * 30, 3, 30); let k = 0.8 + 0.2 * n + 0.06 * m; if (sj(u, v)) k *= 0.62; return [200 * k, 196 * k, 186 * k]; })),
    stoneN: normalFromCanvas(pixelCanvas(S, S, (u, v) => { const k = (sj(u, v) ? 60 : 170) + 60 * H.fbm(u * 40, v * 40, 3, 40); return [k, k, k]; }), 1.4),
    brick: texFrom(pixelCanvas(S, S, (u, v) => { const n = H.fbm(u * 8, v * 8, 4, 8), m = H.fbm(u * 40 + 9, v * 40, 3, 40); let k = 0.82 + 0.18 * n + 0.06 * m; if (bj(u, v)) return [168, 162, 150]; return [124 * k, 120 * k, 112 * k]; })),
    brickN: normalFromCanvas(pixelCanvas(S, S, (u, v) => { const k = (bj(u, v) ? 70 : 170) + 50 * H.fbm(u * 40, v * 40, 3, 40); return [k, k, k]; }), 1.8)
  };
})();

/* ============================== 材质 ============================== */
/* o: { tile:'grey|yellow|green|black|blue', ridge: 颜色, wall:'tang|ming', caihua:'qizhu|xuan', band:'tang|ming', rail:'tang|ming', lacquer: 颜色, dougong:'tang|ming' } */
function materials(o) {
  const tt = tileTex(o.tile || 'grey'), rt = rafterTex(o.dougong === 'tang' ? 'tang' : 'ming'), wt = wallTex(o.wall || 'ming');
  const glazed = o.tile === 'yellow' || o.tile === 'green' || o.tile === 'blue';
  const M = {
    tile: glazed ? new T.MeshPhysicalMaterial({ map: tt.map, normalMap: tt.normal, normalScale: new T.Vector2(1.5, 1.5), roughness: 0.42, clearcoat: 0.75, clearcoatRoughness: 0.22, side: T.DoubleSide, emissive: 0xffb45a, emissiveIntensity: 0 })
      : new T.MeshStandardMaterial({ map: tt.map, normalMap: tt.normal, normalScale: new T.Vector2(1.6, 1.6), roughness: 0.72, side: T.DoubleSide, envMapIntensity: 0.8, emissive: 0xffb45a, emissiveIntensity: 0 }),
    glaze: new T.MeshPhysicalMaterial({ color: o.ridge || (glazed ? 0xb8811a : 0x4a4d52), roughness: glazed ? 0.36 : 0.6, clearcoat: glazed ? 0.8 : 0, emissive: 0xffb45a, emissiveIntensity: 0 }),
    gold: new T.MeshStandardMaterial({ color: 0xe0ad3a, roughness: 0.24, metalness: 1, emissive: 0xffa520, emissiveIntensity: 0 }),
    rafter: new T.MeshStandardMaterial({ map: rt.map, normalMap: rt.normal, roughness: 0.7, side: T.DoubleSide, envMapIntensity: 0.8, emissive: 0xff6a20, emissiveIntensity: 0 }),
    wall: new T.MeshStandardMaterial({ map: wt.map, normalMap: wt.normal, roughness: 0.55, envMapIntensity: 0.55, emissive: 0xffffff, emissiveMap: wt.glow, emissiveIntensity: 0, side: T.DoubleSide }),
    caihua: new T.MeshStandardMaterial({ map: caihuaTex(o.caihua || 'xuan'), roughness: 0.64, envMapIntensity: 0.45, side: T.DoubleSide, emissive: 0x6a5a40, emissiveIntensity: 0 }),
    band: new T.MeshStandardMaterial({ map: bandTex(o.band || 'ming'), roughness: 0.7, envMapIntensity: 0.45, side: T.DoubleSide, emissive: 0x6a5a40, emissiveIntensity: 0 }),
    lacquer: new T.MeshStandardMaterial({ color: o.lacquer || 0x7a1e12, roughness: 0.42, envMapIntensity: 0.7, emissive: 0xff3a10, emissiveIntensity: 0 }),
    woodI: new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.58, envMapIntensity: 0.45 }),
    paint: new T.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.62, envMapIntensity: 0.4, emissive: 0x334a5a, emissiveIntensity: 0 }),
    slab: new T.MeshStandardMaterial({ color: 0x5e1e10, roughness: 0.6, envMapIntensity: 0.4 }),
    hang: new T.MeshStandardMaterial({ map: canvasTex(256, 128, function (g, w, h) { g.fillStyle = '#5e1c0e'; g.fillRect(0, 0, w, h); g.strokeStyle = '#b8923f'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 14); g.lineTo(w, 14); g.moveTo(0, h - 14); g.lineTo(w, h - 14); g.stroke(); for (let x = 32; x < w; x += 64) { g.beginPath(); g.arc(x, h / 2, 20, 0, 7); g.stroke(); } }), roughness: 0.6, envMapIntensity: 0.4, side: T.DoubleSide }),
    gable: new T.MeshStandardMaterial({ map: canvasTex(512, 256, function (g, w, h) { g.fillStyle = o.gable || '#7a2a1a'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(40,12,6,.5)'; g.lineWidth = 3; for (let x = 0; x < w; x += 22) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } g.fillStyle = '#d9b25a'; g.beginPath(); g.moveTo(w / 2, 10); g.lineTo(w / 2 + 26, 70); g.quadraticCurveTo(w / 2 + 40, 130, w / 2, 170); g.quadraticCurveTo(w / 2 - 40, 130, w / 2 - 26, 70); g.closePath(); g.fill(); }), roughness: 0.62, envMapIntensity: 0.4, side: T.DoubleSide, emissive: 0x6a3a20, emissiveIntensity: 0 }),
    railPanel: new T.MeshStandardMaterial({ map: railTex(o.rail || 'ming'), alphaTest: 0.5, side: T.DoubleSide, roughness: 0.6, envMapIntensity: 0.4 }),
    brick: new T.MeshStandardMaterial({ map: STONE.brick, normalMap: STONE.brickN, roughness: 0.88, envMapIntensity: 0.5 }),
    stone: new T.MeshStandardMaterial({ color: 0xc8c0b0, map: STONE.stone, normalMap: STONE.stoneN, roughness: 0.8, envMapIntensity: 0.6 }),
    stoneI: new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, envMapIntensity: 0.6 }),
    bronze: new T.MeshStandardMaterial({ color: 0x6a5a3a, roughness: 0.42, metalness: 0.9 }),
    whiteWall: new T.MeshStandardMaterial({ color: 0xe8e2d4, roughness: 0.9, envMapIntensity: 0.4 })
  };
  M.TX = { wall: wt.map, wallGlow: wt.glow, wallN: wt.normal };
  M.style = o; return M;
}

/* ============================== 构件原型 ============================== */
const unitBox = new T.BoxGeometry(1, 1, 1);
const colGeo = new T.LatheGeometry([[1, 0], [1, 0.03], [0.985, 0.55], [0.94, 1]].map(p => new T.Vector2(p[0], p[1])), 20);
const baseGeo = new T.LatheGeometry([[1.62, 0], [1.62, 0.22], [1.5, 0.42], [1.22, 0.7], [1.12, 1]].map(p => new T.Vector2(p[0], p[1])), 20);
function dougongGeo(style) {
  const g = [], Bx = (w, h, d, x, y, z, c) => g.push(tint(boxGeo(w, h, d, x, y, z), c));
  if (style === 'tang') {
    const O = 0x9c3a22, O2 = 0x7a2c1a, Wt = 0xe9e2d0;
    Bx(0.36, 0.2, 0.36, 0, 0.1, 0, O2); Bx(1.05, 0.14, 0.16, 0, 0.28, 0, O); Bx(0.16, 0.14, 1.0, 0, 0.28, 0.2, O);
    for (const sx of [-0.46, 0.46]) Bx(0.2, 0.11, 0.2, sx, 0.405, 0, O2); Bx(0.2, 0.11, 0.2, 0, 0.405, 0.6, O2);
    Bx(1.4, 0.14, 0.16, 0, 0.535, 0, O); Bx(0.16, 0.14, 1.4, 0, 0.535, 0.4, O); Bx(1.15, 0.14, 0.16, 0, 0.535, 0.6, O);
    for (const sx of [-0.55, 0.55]) Bx(0.2, 0.11, 0.2, sx, 0.66, 0.6, O2); Bx(0.2, 0.11, 0.2, 0, 0.66, 1.0, O2); Bx(1.3, 0.16, 0.16, 0, 0.8, 1.0, O);
    const ang = new T.BoxGeometry(0.15, 0.13, 1.6); ang.rotateX(-0.38); ang.translate(0, 0.62, 0.55); g.push(tint(ang, O2));
    Bx(0.17, 0.03, 1.02, 0, 0.36, 0.2, Wt); Bx(0.17, 0.03, 1.42, 0, 0.615, 0.4, Wt); Bx(1.08, 0.03, 0.17, 0, 0.36, 0, Wt);
  } else {
    const G = 0x2e6a52, Bl = 0x234a6a, Go = 0xc9a24a;
    Bx(0.30, 0.16, 0.30, 0, 0.08, 0, G); Bx(0.84, 0.12, 0.13, 0, 0.24, 0, Bl); Bx(0.13, 0.12, 0.84, 0, 0.24, 0.14, Bl);
    for (const sx of [-0.36, 0.36]) Bx(0.16, 0.09, 0.16, sx, 0.345, 0, G); Bx(0.16, 0.09, 0.16, 0, 0.345, 0.48, G);
    Bx(1.12, 0.12, 0.13, 0, 0.45, 0, G); Bx(0.13, 0.12, 1.0, 0, 0.45, 0.27, G); Bx(0.9, 0.12, 0.13, 0, 0.45, 0.48, Bl);
    for (const sx of [-0.5, 0.5]) Bx(0.16, 0.09, 0.16, sx, 0.555, 0, Bl); Bx(0.16, 0.09, 0.16, 0, 0.555, 0.72, Bl);
    Bx(1.0, 0.1, 0.13, 0, 0.65, 0.72, G); Bx(0.12, 0.03, 0.86, 0, 0.315, 0.14, Go); Bx(0.12, 0.03, 1.0, 0, 0.525, 0.27, Go);
  }
  return mergeGeos(g);
}
const queGeo = (function () { const s = new T.Shape(); s.moveTo(0, 0); s.lineTo(1.05, 0); s.quadraticCurveTo(0.95, -0.14, 0.62, -0.2); s.quadraticCurveTo(0.34, -0.3, 0.26, -0.5); s.quadraticCurveTo(0.2, -0.7, 0, -0.76); s.lineTo(0, 0); const g = new T.ExtrudeGeometry(s, { depth: 0.09, bevelEnabled: false }); g.translate(0, 0, -0.045); return mergeGeos([tint(g, 0x2e6a52), tint(boxGeo(1.0, 0.035, 0.11, 0.52, -0.02, 0), 0xc9a24a)]); })();
const wadangGeo = (function () { const a = new T.CylinderGeometry(0.078, 0.078, 0.07, 12); a.rotateX(Math.PI / 2); a.translate(0, 0.04, 0); const b = new T.BoxGeometry(0.14, 0.14, 0.03); b.rotateZ(Math.PI / 4); b.translate(0.18, -0.07, 0); return mergeGeos([a, b]); })();
const beastGeo = (function () { const a = new T.SphereGeometry(0.11, 8, 6); a.scale(1, 1.25, 1.2); a.translate(0, 0.13, 0); const b = new T.SphereGeometry(0.075, 8, 6); b.translate(0, 0.31, 0.07); const c = new T.ConeGeometry(0.035, 0.12, 5); c.translate(0, 0.42, 0.03); return mergeGeos([a, b, c]); })();
const bellGeo = (function () { const a = new T.CylinderGeometry(0.05, 0.13, 0.26, 10, 1, true); a.translate(0, -0.3, 0); const b = new T.CylinderGeometry(0.012, 0.012, 0.22, 4); b.translate(0, -0.08, 0); const c = new T.SphereGeometry(0.035, 6, 5); c.translate(0, -0.46, 0); return mergeGeos([a, b, c]); })();
const stonePostGeo = (function () { const a = boxGeo(0.22, 1.0, 0.22, 0, 0.5, 0), b = boxGeo(0.27, 0.06, 0.27, 0, 1.03, 0); const c = new T.LatheGeometry([[0.07, 0], [0.12, 0.05], [0.135, 0.14], [0.11, 0.24], [0.06, 0.31], [0.0, 0.34]].map(p => new T.Vector2(p[0], p[1])), 10); c.translate(0, 1.06, 0); return mergeGeos([a, b, c].map(g => { g.deleteAttribute('uv'); return g; })); })();
const chiweiGeo = (function () {                       // 鸱尾 / 正吻：屋脊两端翘起的装饰，局部 +x 朝屋脊中间
  const s = new T.Shape(); s.moveTo(-0.35, 0); s.lineTo(1.5, 0); s.quadraticCurveTo(0.95, 0.45, 0.8, 1.15); s.quadraticCurveTo(0.74, 1.85, 1.25, 2.35); s.quadraticCurveTo(0.95, 2.62, 0.62, 2.5); s.quadraticCurveTo(0.42, 2.85, 0.2, 3.15); s.quadraticCurveTo(-0.45, 2.3, -0.42, 1.2); s.quadraticCurveTo(-0.4, 0.5, -0.35, 0);
  const g = new T.ExtrudeGeometry(s, { depth: 0.56, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 2, curveSegments: 10 }); g.translate(0, 0, -0.28); return g;
})();
const edgeRy = (dx, dz) => -Math.atan2(dz, dx), outRy = (dx, dz) => Math.atan2(dz, -dx);

/* ============================== 搭楼器 ============================== */
class Builder {
  constructor(group, M, o) {
    this.g = group; this.M = M; this.o = Object.assign({ dg: 1, ming: M.style.dougong !== 'tang' }, o || {});
    this.bag = new H.Bag();
    this.B = { col: new H.Batch(colGeo, M.lacquer), base: new H.Batch(baseGeo, M.stoneI), dg: new H.Batch(dougongGeo(M.style.dougong), M.paint), que: new H.Batch(queGeo, M.paint),
      wd: new H.Batch(wadangGeo, M.glaze), beast: new H.Batch(beastGeo, M.glaze), bell: new H.Batch(bellGeo, M.style.dougong === 'tang' ? M.bronze : M.gold), wood: new H.Batch(unitBox, M.woodI) };
    this.plaqueMats = [];
  }
  beam(P, yb, h, depth, mat, uLen) {
    const Po = offsetPoly(P, depth / 2), Pi = offsetPoly(P, -depth / 2), n = P.length, pos = [], uv = [], idx = [];
    this.bag.add(mat, stripGeo(Po, yb, yb + h, uLen || 4));
    for (let i = 0; i < n; i++) { const j = (i + 1) % n, b = pos.length / 3; pos.push(Pi[i][0], yb, Pi[i][1], Pi[j][0], yb, Pi[j][1], Po[j][0], yb, Po[j][1], Po[i][0], yb, Po[i][1]); uv.push(0, 0, 1, 0, 1, 0.3, 0, 0.3); idx.push(b, b + 1, b + 2, b, b + 2, b + 3); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); this.bag.add(mat, g);
  }
  dougongRow(P, y, step, s) {
    s = s || this.o.dg; const n = P.length;
    for (let i = 0; i < n; i++) { const A = P[i], Bq = P[(i + 1) % n], dx = Bq[0] - A[0], dz = Bq[1] - A[1], L = Math.hypot(dx, dz), m = Math.max(1, Math.round(L / step)), ry = outRy(dx, dz); for (let j = 0; j < m; j++) this.B.dg.add(A[0] + dx * (j + 0.5) / m, y, A[1] + dz * (j + 0.5) / m, s, s, s, ry); }
  }
  fence(ax, az, bx, bz, y, color) {                   // 人扶的高度（约 1.1 米），不随楼放大
    const B = this.B, c = color || 0x7a1e12, dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz); if (L < 0.3) return;
    const ry = edgeRy(dx, dz), mx = (ax + bx) / 2, mz = (az + bz) / 2;
    B.wood.add(mx, y + 1.08, mz, L + 0.1, 0.1, 0.14, ry, c); B.wood.add(mx, y + 0.75, mz, L, 0.06, 0.07, ry, c); B.wood.add(mx, y + 0.18, mz, L, 0.07, 0.09, ry, c);
    const n = Math.max(1, Math.round(L / 1.6));
    for (let i = 0; i <= n; i++) { const x = ax + dx * i / n, z = az + dz * i / n; B.wood.add(x, y + 0.6, z, 0.14, 1.2, 0.14, ry, c); B.wood.add(x, y + 1.25, z, 0.18, 0.07, 0.18, ry, 0x4a120a); }
    const g = new T.BufferGeometry(), rep = Math.max(1, Math.round(L / 1.1));
    g.setAttribute('position', new T.Float32BufferAttribute([ax, y + 0.21, az, bx, y + 0.21, bz, bx, y + 0.72, bz, ax, y + 0.72, az], 3));
    g.setAttribute('uv', new T.Float32BufferAttribute([0, 0, rep, 0, rep, 1, 0, 1], 2)); g.setIndex([0, 2, 1, 0, 3, 2]); g.computeVertexNormals(); this.bag.add(this.M.railPanel, g);
  }
  fenceRing(P, y, color) { const n = P.length; for (let i = 0; i < n; i++) this.fence(P[i][0], P[i][1], P[(i + 1) % n][0], P[(i + 1) % n][1], y, color); }
  /* 屋檐：o = { din, dout, yTop, rise, lift, sweep, w, th, rr(脊粗), tileScale, beasts, bells } */
  eave(P, o) {
    const M = this.M, B = this.B, bag = this.bag, n = P.length, info = polyInfo(P), Pin = offsetPoly(P, o.din), Pout = offsetPoly(P, o.dout), ts = o.tileScale || 1;
    function pt(i, u, t, dy) {
      const j = (i + 1) % n;
      const ax = lerp(Pin[i][0], Pin[j][0], u), az = lerp(Pin[i][1], Pin[j][1], u), bx = lerp(Pout[i][0], Pout[j][0], u), bz = lerp(Pout[i][1], Pout[j][1], u);
      let x = lerp(ax, bx, t), z = lerp(az, bz, t), y = o.yTop - o.rise + o.rise * Math.pow(1 - t, o.curve || 1.6);
      const L = Math.hypot(Pout[j][0] - Pout[i][0], Pout[j][1] - Pout[i][1]), t2 = t * t;
      const corner = (c, d) => { if (!info[c].convex) return; const g = Math.exp(-Math.pow(d / o.w, 2)) * (1 - smooth(0.5, 1, d / L)); y += o.lift * g * t2 * (0.4 + 0.6 * t); x += info[c].diag[0] * o.sweep * g * t2; z += info[c].diag[1] * o.sweep * g * t2; };
      corner(i, u * L); corner(j, (1 - u) * L);
      return [x, y + (dy || 0), z];
    }
    const NT = 10, slope = Math.hypot(o.dout - o.din, o.rise), rows = Math.max(4, Math.round(slope / (0.42 * ts))), th = o.th || 0.2;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const Lm = Math.hypot((Pin[j][0] + Pout[j][0] - Pin[i][0] - Pout[i][0]) / 2, (Pin[j][1] + Pout[j][1] - Pin[i][1] - Pout[i][1]) / 2), Lo = Math.hypot(Pout[j][0] - Pout[i][0], Pout[j][1] - Pout[i][1]);
      const nu = Math.max(2, Math.ceil(Lo / 0.5)), rep = Math.max(1, Math.round(Lm / (0.36 * ts)));
      bag.add(M.tile, gridGeo(nu, NT, (u, t) => { const p = pt(i, u, t, 0); return [p[0], p[1], p[2], u * rep / 4, t * rows / 4]; }));
      bag.add(M.rafter, gridGeo(nu, NT, (u, t) => { const p = pt(i, u, t, -th); return [p[0], p[1], p[2], u * rep * 1.5, t * 2]; }));
      bag.add(M.slab, gridGeo(nu, 1, (u, v) => { const p = pt(i, u, 1, v ? -th - 0.04 : 0.02); return [p[0], p[1], p[2], u, v]; }));
      for (let k = 0; k < rep; k++) { const u = (k + 0.5) / rep, p = pt(i, u, 1, 0), q = pt(i, u, 0.9, 0); B.wd.add(p[0], p[1] - 0.02, p[2], ts, ts, ts, Math.atan2(p[0] - q[0], p[2] - q[2])); }
    }
    const rr = o.rr || 0.14;
    for (let i = 0; i < n; i++) {                       // 戗脊、翘角、脊兽、风铃
      if (!info[i].convex) continue;
      const pts = [], d = info[i].diag; for (let k = 0; k <= 10; k++) pts.push(pt(i, 0, k / 10, rr * 0.7));
      const e = pts[10]; pts.push([e[0] + d[0] * rr * 3.5, e[1] + rr * 2.8, e[2] + d[1] * rr * 3.5]); if (o.lift > o.rise * 0.6) pts.push([e[0] + d[0] * rr * 6, e[1] + rr * 8, e[2] + d[1] * rr * 6]);
      bag.add(M.glaze, tubeGeo(pts, rr, 8)); bag.add(M.glaze, tubeGeo(pts.slice(0, 11).map(p => [p[0], p[1] + rr, p[2]]), rr * 0.43, 5));
      const ry = Math.atan2(d[0], d[1]);
      if (o.beasts) for (const k of [6, 7, 8, 9]) B.beast.add(pts[k][0], pts[k][1] + rr * 1.2, pts[k][2], ts * 0.85, ts * 0.85, ts * 0.85, ry);
      if (o.bells !== false) B.bell.add(e[0] + d[0] * rr * 2, e[1] - rr, e[2] + d[1] * rr * 2, ts, ts, ts, 0);
    }
  }
  /* 一层楼身：P 檐柱平面；o = { y, nextY, eaveGap, rise, vw(回廊宽), r(柱半径), colStep, din, dout, lift, sweep, w, th, rr, dgStep, dgS, pingzuo(平坐), wallU, beasts, que, tileScale } 返回 { colTop, edge, eaveTop } */
  storey(P, o) {
    const M = this.M, B = this.B, n = P.length, y = o.y, eaveTop = o.nextY - (o.eaveGap === undefined ? 0.6 : o.eaveGap), edge = eaveTop - o.rise, colTop = edge + (o.colOver || 0.25), hc = colTop - y;
    const W = offsetPoly(P, -(o.vw || 0));
    if (!o.noWall) {
      this.bag.add(M.wall, stripGeo(W, y + 0.12, colTop + 0.3, o.wallU || 2.3));
      if (o.nextY - 0.4 > colTop + 0.3) this.bag.add(M.band, stripGeo(W, colTop + 0.3, o.nextY - 0.4, (o.wallU || 2.3) * 1.8));
      for (let i = 0; i < n; i++) { const A = W[i], Bq = W[(i + 1) % n], dx = Bq[0] - A[0], dz = Bq[1] - A[1], L = Math.hypot(dx, dz), nx = dz / L, nz = -dx / L; B.wood.add((A[0] + Bq[0]) / 2 + nx * 0.06, y + 0.07, (A[1] + Bq[1]) / 2 + nz * 0.06, L, 0.14, 0.2, edgeRy(dx, dz), 0x45120a); }
    }
    const r = o.r || 0.25, step = o.colStep || 2.9;
    for (let i = 0; i < n; i++) {
      const A = P[i], Bq = P[(i + 1) % n], dx = Bq[0] - A[0], dz = Bq[1] - A[1], L = Math.hypot(dx, dz), ry = edgeRy(dx, dz), seg = Math.max(1, Math.round(L / step));
      for (let j = 0; j <= seg; j++) {
        const x = lerp(A[0], Bq[0], j / seg), z = lerp(A[1], Bq[1], j / seg);
        if (j < seg) { B.col.add(x, y, z, r, hc, r, 0); B.base.add(x, y, z, r, Math.min(0.5, r * 1.3), r, 0, 0xb0ab9e); }
        if (o.que !== false && this.o.ming) { if (j < seg) B.que.add(x + dx / L * r * 0.9, colTop - 0.56 * r * 4, z + dz / L * r * 0.9, r * 3.4, r * 3.4, r * 3.4, ry); if (j > 0) B.que.add(x - dx / L * r * 0.9, colTop - 0.56 * r * 4, z - dz / L * r * 0.9, r * 3.4, r * 3.4, r * 3.4, ry + Math.PI); }
      }
    }
    const k = o.dgS || this.o.dg;
    this.beam(P, colTop - 0.55 * k, 0.5 * k, 0.32 * k, M.caihua, 4.2 * k); this.beam(P, colTop - 0.02, 0.2 * k, 0.4 * k, M.caihua, 4.2 * k);
    this.dougongRow(P, colTop + 0.18 * k, o.dgStep || 0.7 * k, k); this.beam(offsetPoly(P, 0.72 * k), colTop + 0.18 * k + 0.7 * k, 0.16 * k, 0.2 * k, M.caihua, 4.2 * k);
    if (o.pingzuo) {
      const pz = o.pingzuo === true ? 0.8 : o.pingzuo, g = shapeGeo(offsetPoly(P, pz), 0.3); g.translate(0, y - 0.3, 0); this.bag.add(M.slab, g);
      this.bag.add(M.hang, stripGeo(offsetPoly(P, pz + 0.02), y - 0.78, y - 0.04, 1.6));
      this.dougongRow(offsetPoly(P, 0.1), y - 0.7 - 0.78 * k, 0.8 * k, k * 0.9);
      this.fenceRing(offsetPoly(P, pz - 0.14), y);
    }
    this.eave(P, { din: o.din === undefined ? -1.2 : o.din, dout: o.dout || 2.5, yTop: eaveTop, rise: o.rise, lift: o.lift === undefined ? 2.0 : o.lift, sweep: o.sweep === undefined ? 1.0 : o.sweep, w: o.w || 2.2, th: o.th, rr: o.rr, beasts: o.beasts, tileScale: o.tileScale, curve: o.curve });
    return { colTop, edge, eaveTop };
  }
  /* 歇山顶：在 (rx, rz) 的矩形上；rg 山花位置；o = { y0, HR, ov, rr, ends:'chiwei'|'wen', tileScale } */
  xieshan(rx, rz, rg, o) {
    const M = this.M, bag = this.bag, y0 = o.y0, HR = o.HR, sg = (rx - rg) / rz, ov = o.ov || 0.5, rr = o.rr || 0.16;
    const prof = s => y0 + HR * Math.pow(s, 0.85), yg = prof(sg);
    for (const sz of [1, -1]) bag.add(M.tile, gridGeo(18, 14, (u, s) => { const half = s < sg ? lerp(rx, rg + ov, s / sg) : rg + ov, x = (u * 2 - 1) * half, z = sz * rz * (1 - s); return [x, prof(s), z, x / 1.44, s * 3.8 * HR / 3]; }));
    for (const sx of [1, -1]) {
      bag.add(M.tile, gridGeo(10, 6, (u, s) => { const f = s * sg, zh = rz * (1 - f), z = (u * 2 - 1) * zh, x = sx * lerp(rx, rg, s); return [x, prof(f), z, z / 1.44, s * 2]; }));
      const tri = new T.BufferGeometry(), zb = rz * (1 - sg);
      tri.setAttribute('position', new T.Float32BufferAttribute([sx * rg, yg, -zb, sx * rg, yg, zb, sx * rg, y0 + HR, 0], 3)); tri.setAttribute('uv', new T.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1], 2)); tri.computeVertexNormals(); bag.add(M.gable, tri);
      for (const sz of [1, -1]) {
        bag.add(M.glaze, tubeGeo([[sx * (rg + ov * 0.6), y0 + HR + rr, 0], [sx * (rg + ov * 0.6), (yg + y0 + HR) / 2 + rr, sz * zb / 2], [sx * (rg + ov * 0.6), yg + rr, sz * zb]], rr, 6));
        bag.add(M.glaze, tubeGeo([[sx * (rg + ov * 0.6), yg + rr, sz * zb], [sx * (rx - 0.3), y0 + 0.4, sz * (rz - 0.3)], [sx * (rx + 0.3), y0 + 0.15, sz * (rz + 0.3)]], rr, 6));
        if (this.o.ming) for (const t of [0.3, 0.5, 0.7]) this.B.beast.add(sx * lerp(rg + ov * 0.6, rx, t), lerp(yg, y0, t) + rr * 2.2, sz * lerp(zb, rz, t), rr * 7, rr * 7, rr * 7, Math.atan2(sx, sz));
      }
    }
    const yt = y0 + HR, E = rg + ov + 0.1;
    bag.add(M.glaze, boxGeo(E * 2, rr * 4, rr * 3.2, 0, yt + rr, 0)); bag.add(M.glaze, boxGeo(E * 2 - 0.3, rr * 0.9, rr * 4, 0, yt + rr * 3.2, 0));
    const cs = o.endScale || rr * 6;
    for (const sx of [1, -1]) { const g = chiweiGeo.clone(); g.scale(cs, cs, cs); if (sx > 0) g.rotateY(Math.PI); g.translate(sx * (E - cs * 0.5), yt + rr * 2.5, 0); bag.add(M.glaze, g); }
    return { y0, yt, E, top: yt + rr * 2.5 + 3.15 * cs };
  }
  /* 攒尖顶：P 为平面（任意凸多边形），从 y0 升起 h，顶上是宝顶 */
  zanjian(P, y0, h, o) {
    o = o || {}; const M = this.M, n = P.length, rr = o.rr || 0.14;
    for (let i = 0; i < n; i++) {
      const A = P[i], Bq = P[(i + 1) % n];
      this.bag.add(M.tile, gridGeo(8, 12, (u, s) => { const x = lerp(A[0], Bq[0], u) * (1 - s), z = lerp(A[1], Bq[1], u) * (1 - s), y = y0 + h * Math.pow(s, o.curve || 1.25); return [x, y, z, u * Math.hypot(Bq[0] - A[0], Bq[1] - A[1]) / 1.44 * (1 - s), s * h / 0.9]; }));
      const pts = []; for (let k = 0; k <= 12; k++) { const s = k / 12; pts.push([A[0] * (1 - s), y0 + h * Math.pow(s, o.curve || 1.25) + rr, A[1] * (1 - s)]); }
      this.bag.add(M.glaze, tubeGeo(pts, rr, 6));
    }
    const fs = o.finial || 1, fin = new T.LatheGeometry([[0.01, 0], [0.32, 0], [0.4, 0.12], [0.24, 0.3], [0.36, 0.55], [0.3, 0.8], [0.12, 0.98], [0.15, 1.08], [0.01, 1.3]].map(p => new T.Vector2(p[0] * fs, p[1] * fs)), 24);
    fin.translate(0, y0 + h - 0.1, 0); this.bag.add(M.gold, fin);
    return y0 + h + 1.3 * fs;
  }
  /* 匾：text、宽高、位置；rot 绕 y 转（0 朝 +z） */
  plaque(text, w, h, y, dist, o) {
    o = o || {}; const M = this.M, mat = new T.MeshStandardMaterial({ map: plaqueTex(text, o), roughness: 0.42, envMapIntensity: 0.6, emissive: 0xffffff, emissiveIntensity: 0 }); mat.emissiveMap = mat.map; this.plaqueMats.push(mat);
    const g = new T.Group(); g.rotation.y = o.rot || 0; this.g.add(g);
    const m = new T.Mesh(new T.BoxGeometry(w, h, 0.12), [M.gold, M.gold, M.gold, M.gold, mat, M.gold]); m.position.set(0, y, dist); m.rotation.x = o.tilt === undefined ? 0.12 : o.tilt; m.castShadow = true; g.add(m);
    const f = new T.Mesh(new T.BoxGeometry(w + 0.2, h + 0.2, 0.07), M.gold); f.position.set(0, y, dist - 0.06); f.rotation.x = m.rotation.x; g.add(f);
  }
  build() {
    const M = this.M, B = this.B;
    this.bag.build(this.g, { noCast: new Set([M.rafter, M.railPanel]) });
    B.col.build(this.g); B.base.build(this.g); B.dg.build(this.g); B.que.build(this.g, false); B.wd.build(this.g, false); B.beast.build(this.g, false); B.bell.build(this.g, false); B.wood.build(this.g);
  }
}

/* ============================== 台基（加在场景里，不随楼体平移） ============================== */
/* o = { hx, hz, y0, y1, mat:'stone|brick', stairs:[{side:'front|back|left|right', w, run}], rail:true, cx, cz, rot } */
function platform(M, o) {
  const sbag = new H.Bag(), root = new T.Group(), post = new H.Batch(stonePostGeo, M.stoneI), stoneB = new H.Batch(unitBox, M.stoneI);
  root.position.set(o.cx || 0, 0, o.cz || 0); root.rotation.y = o.rot || 0; H.scene.add(root);
  const mat = o.mat === 'brick' ? M.brick : M.stone;
  function texBox(m, w, h, d, x, y, z, s) { const g = new T.BoxGeometry(w, h, d), uv = g.attributes.uv, f = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]], k = s || 3.2; for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) uv.setXY(i * 4 + j, uv.getX(i * 4 + j) * f[i][0] / k, uv.getY(i * 4 + j) * f[i][1] / k); g.translate(x, y, z); sbag.add(m, g); }
  function rail(ax, az, bx, bz, y) { const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz), ry = edgeRy(dx, dz), n = Math.max(1, Math.round(L / 1.9)); for (let i = 0; i <= n; i++) post.add(ax + dx * i / n, y, az + dz * i / n, 1, 1, 1, ry, 0xb8b2a4); for (let i = 0; i < n; i++) { const mx = ax + dx * (i + 0.5) / n, mz = az + dz * (i + 0.5) / n, l = L / n - 0.22; stoneB.add(mx, y + 0.42, mz, l, 0.5, 0.1, ry, 0xa9a598); stoneB.add(mx, y + 0.86, mz, l, 0.1, 0.13, ry, 0xb8b2a4); stoneB.add(mx, y + 0.09, mz, l, 0.18, 0.16, ry, 0xb8b2a4); } }
  const { hx, hz } = o, y0 = o.y0 === undefined ? -0.3 : o.y0, y1 = o.y1, inset = 0.35;
  texBox(mat, hx * 2, y1 - y0 - 0.25, hz * 2, 0, (y0 + y1 - 0.25) / 2, 0, o.mat === 'brick' ? 4 : 3.2);
  texBox(M.stone, hx * 2 + 0.3, 0.25, hz * 2 + 0.3, 0, y1 - 0.125, 0);
  const gaps = { front: [], back: [], left: [], right: [] };
  for (const s of o.stairs || []) {
    const N = Math.max(3, Math.round((y1 - (s.yb || 0)) / 0.16)), rise = (y1 - (s.yb || 0)) / N, run = s.run || 0.34, w = s.w || 6;
    const dir = { front: [0, 1], back: [0, -1], right: [1, 0], left: [-1, 0] }[s.side], edge = s.side === 'front' || s.side === 'back' ? hz : hx;
    for (let k = 0; k < N; k++) {
      const off = edge + (N - k - 0.5) * run, h = (k + 1) * rise;
      if (dir[0] === 0) stoneB.add(s.at || 0, (s.yb || 0) + h / 2, dir[1] * off, w - 0.6, h, run, 0, k % 2 ? 0xc8c3b5 : 0xb8b2a4);
      else stoneB.add(dir[0] * off, (s.yb || 0) + h / 2, s.at || 0, run, h, w - 0.6, 0, k % 2 ? 0xc8c3b5 : 0xb8b2a4);
    }
    for (const sd of [-1, 1]) { const len = N * run, cx = dir[0] === 0 ? (s.at || 0) + sd * (w / 2 - 0.15) : dir[0] * (edge + len / 2), cz = dir[0] === 0 ? dir[1] * (edge + len / 2) : (s.at || 0) + sd * (w / 2 - 0.15); stoneB.add(cx, (y1 + (s.yb || 0)) / 2 + 0.1, cz, dir[0] === 0 ? 0.4 : len + 0.1, y1 - (s.yb || 0) + 0.2, dir[0] === 0 ? len + 0.1 : 0.4, 0, 0xb8b2a4); }
    gaps[s.side].push([(s.at || 0) - w / 2, (s.at || 0) + w / 2]);
  }
  if (o.rail !== false) {
    const side = (name, a, b, fixed, alongX) => { const gs = gaps[name].slice().sort((p, q) => p[0] - q[0]); let s = a; for (const gp of gs.concat([[b, b]])) { if (gp[0] - s > 0.5) alongX ? rail(s, fixed, gp[0], fixed, y1) : rail(fixed, s, fixed, gp[0], y1); s = gp[1]; } };
    side('front', -hx + inset, hx - inset, hz - inset, true); side('back', -hx + inset, hx - inset, -hz + inset, true);
    side('right', -hz + inset, hz - inset, hx - inset, false); side('left', -hz + inset, hz - inset, -hx + inset, false);
  }
  sbag.build(root); stoneB.build(root); post.build(root);
  return root;
}

/* ============================== 夜景：泛光灯与发光 ============================== */
function glowSetter(M, plaqueMats, floodPts, floodH, floodI) {
  const floods = [];
  for (const p of floodPts) { const l = new T.SpotLight(0xffb866, 0, floodH * 4, 0.75, 0.7, 1.2); l.position.set(p[0], p[2] || 1.6, p[1]); l.target.position.set(p[0] * 0.1, floodH, p[1] * 0.1); H.scene.add(l, l.target); floods.push(l); }
  return function setGlow(g) {
    M.wall.emissiveIntensity = g * 2.0; M.tile.emissiveIntensity = g * 0.035; M.glaze.emissiveIntensity = g * 0.035; M.gold.emissiveIntensity = g * 0.3;
    M.rafter.emissiveIntensity = g * 0.1; M.lacquer.emissiveIntensity = g * 0.04; M.caihua.emissiveIntensity = g * 0.5; M.band.emissiveIntensity = g * 0.5; M.paint.emissiveIntensity = g * 0.5; M.gable.emissiveIntensity = g * 0.4;
    plaqueMats.forEach(m => m.emissiveIntensity = g * 0.6);
    const on = g > 0.02 && H.Q.post; floods.forEach(l => { l.visible = on; l.intensity = g * (floodI || 4); });
  };
}

H.kit = { KAI, rect, poly, materials, Builder, platform, glowSetter, plaqueTex, tileTex, wallTex, edgeRy, outRy, chiweiGeo, STONE };
})();
