/* 登楼 · 引擎层：命名空间、数学与噪声、贴图/几何工具、渲染器与相机
 * 各文件通过 window.HHL 共享，按 engine → tower → world → interior → post → main 的顺序加载 */
(function () {
'use strict';
const T = THREE;
if (T.ColorManagement) { T.ColorManagement.legacyMode = false; T.ColorManagement.enabled = true; }
const H = window.HHL = { T };
H.qs = new URLSearchParams(location.search);

/* ---------- 数学 ---------- */
H.lerp = (a, b, t) => a + (b - a) * t;
H.clamp = (x, a, b) => Math.min(b, Math.max(a, x));
H.smooth = (a, b, x) => { const t = H.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
H.V3 = (x, y, z) => new T.Vector3(x, y, z);
H.rng = function (seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
const norm2 = H.norm2 = (x, z) => { const l = Math.hypot(x, z) || 1; return [x / l, z / l]; };

/* ---------- 噪声（值噪声 + 分形） ---------- */
const PERM = new Uint8Array(512);
(function () { const r = H.rng(1985), p = []; for (let i = 0; i < 256; i++) p[i] = i; for (let i = 255; i > 0; i--) { const j = r() * (i + 1) | 0, t = p[i]; p[i] = p[j]; p[j] = t; } for (let i = 0; i < 512; i++) PERM[i] = p[i & 255]; })();
const fade = t => t * t * (3 - 2 * t);
H.vnoise = function (x, y, per) {                       // per：可选周期，用于可平铺贴图
  const x0 = Math.floor(x), y0 = Math.floor(y), xf = x - x0, yf = y - y0;
  const w = per ? v => ((v % per) + per) % per : v => v & 255;
  const xa = w(x0), xb = w(x0 + 1), ya = w(y0), yb = w(y0 + 1);
  const a = PERM[PERM[xa] + ya], b = PERM[PERM[xb] + ya], c = PERM[PERM[xa] + yb], d = PERM[PERM[xb] + yb];
  const u = fade(xf), v = fade(yf), top = a + (b - a) * u, bot = c + (d - c) * u;
  return (top + (bot - top) * v) / 255;
};
H.fbm = function (x, y, oct, per) { let s = 0, a = 0.5, n = 0, f = 1; for (let i = 0; i < (oct || 4); i++) { s += a * H.vnoise(x * f, y * f, per ? per * f : 0); n += a; a *= 0.5; f *= 2; } return s / n; };
H.ridged = function (x, y, oct) { let s = 0, a = 0.5, n = 0, f = 1; for (let i = 0; i < (oct || 4); i++) { const v = 1 - Math.abs(2 * H.vnoise(x * f, y * f) - 1); s += a * v * v; n += a; a *= 0.5; f *= 2.1; } return s / n; };

/* ---------- 贴图 ---------- */
H.makeCanvas = function (w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; if (draw) draw(c.getContext('2d'), w, h); return c; };
H.texFrom = function (canvas, color, repeat) {
  const t = new T.CanvasTexture(canvas); t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 16;
  if (color !== false) t.encoding = T.sRGBEncoding; if (repeat) t.repeat.set(repeat[0], repeat[1]); return t;
};
H.canvasTex = (w, h, draw, color, repeat) => H.texFrom(H.makeCanvas(w, h, draw), color, repeat);
/* 由灰度高度图（取红色通道）生成法线贴图，四边可平铺 */
H.normalFromCanvas = function (src, strength) {
  const w = src.width, h = src.height, s = src.getContext('2d').getImageData(0, 0, w, h).data;
  const out = H.makeCanvas(w, h), g = out.getContext('2d'), img = g.createImageData(w, h), d = img.data, k = (strength || 2) / 255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const L = s[(y * w + (x + w - 1) % w) * 4], R = s[(y * w + (x + 1) % w) * 4], U = s[(((y + h - 1) % h) * w + x) * 4], D = s[(((y + 1) % h) * w + x) * 4];
    let nx = -(R - L) * k, ny = (D - U) * k, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
    const i = (y * w + x) * 4; d[i] = nx * 127.5 + 127.5; d[i + 1] = ny * 127.5 + 127.5; d[i + 2] = nz * 127.5 + 127.5; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0); return H.texFrom(out, false);
};
/* 用函数逐像素生成画布（f 返回 [r,g,b,a?]，0..255） */
H.pixelCanvas = function (w, h, f) {
  const c = H.makeCanvas(w, h), g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const p = f(x / w, y / h, x, y), i = (y * w + x) * 4; d[i] = p[0]; d[i + 1] = p[1]; d[i + 2] = p[2]; d[i + 3] = p[3] === undefined ? 255 : p[3]; }
  g.putImageData(img, 0, 0); return c;
};

/* ---------- 几何 ---------- */
H.gridGeo = function (nu, nv, fn) {                       // fn(u,v) -> [x,y,z,s,t]
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const p = fn(i / nu, j / nv); pos.push(p[0], p[1], p[2]); uv.push(p[3], p[4]); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals(); return g;
};
H.stripGeo = function (P, y0, y1, uLen, vRep) {           // 沿闭合多边形的竖直条带，法线朝外
  const pos = [], uv = [], idx = [], n = P.length;
  for (let i = 0; i < n; i++) {
    const A = P[i], B = P[(i + 1) % n], L = Math.hypot(B[0] - A[0], B[1] - A[1]), rep = Math.max(1, Math.round(L / uLen)), b = pos.length / 3;
    pos.push(A[0], y0, A[1], B[0], y0, B[1], B[0], y1, B[1], A[0], y1, A[1]); uv.push(0, 0, rep, 0, rep, vRep || 1, 0, vRep || 1); idx.push(b, b + 2, b + 1, b, b + 3, b + 2);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals(); return g;
};
H.tubeGeo = function (points, r, radial) {
  const curve = new T.CatmullRomCurve3(points.map(p => new T.Vector3(p[0], p[1], p[2])));
  return new T.TubeGeometry(curve, points.length * 2, r, radial || 6, false);
};
H.boxGeo = function (w, h, d, x, y, z, ry, rx) {
  const g = new T.BoxGeometry(w, h, d); if (rx) g.rotateX(rx); if (ry) g.rotateY(ry); g.translate(x || 0, y || 0, z || 0); return g;
};
H.tint = function (g, hex) { const c = new T.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; } g.setAttribute('color', new T.BufferAttribute(a, 3)); return g; };
H.mergeGeos = function (list) {                           // 合并为一个带索引的几何体（position/normal/uv/color）
  let nv = 0, ni = 0; const hasCol = list.some(g => g.attributes.color), hasUv = list.every(g => g.attributes.uv);
  for (const g of list) { if (!g.attributes.normal) g.computeVertexNormals(); nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uv = hasUv ? new Float32Array(nv * 2) : null, col = hasCol ? new Float32Array(nv * 3).fill(1) : null, idx = new Uint32Array(ni);
  let vo = 0, io = 0;
  for (const g of list) {
    const c = g.attributes.position.count;
    pos.set(g.attributes.position.array, vo * 3); nor.set(g.attributes.normal.array, vo * 3);
    if (uv) uv.set(g.attributes.uv.array, vo * 2); if (col && g.attributes.color) col.set(g.attributes.color.array, vo * 3);
    if (g.index) { const a = g.index.array; for (let k = 0; k < a.length; k++) idx[io++] = a[k] + vo; } else for (let k = 0; k < c; k++) idx[io++] = vo + k;
    vo += c;
  }
  const out = new T.BufferGeometry();
  out.setAttribute('position', new T.BufferAttribute(pos, 3)); out.setAttribute('normal', new T.BufferAttribute(nor, 3));
  if (uv) out.setAttribute('uv', new T.BufferAttribute(uv, 2)); if (col) out.setAttribute('color', new T.BufferAttribute(col, 3));
  out.setIndex(new T.BufferAttribute(idx, 1)); return out;
};
/* 收集器：按材质攒几何体，最后各合并成一个网格，减少绘制调用 */
H.Bag = class {
  constructor() { this.m = new Map(); }
  add(mat, geo) { if (!this.m.has(mat)) this.m.set(mat, []); this.m.get(mat).push(geo); return geo; }
  build(parent, opt) {
    const out = [];
    this.m.forEach((list, mat) => { const mesh = new T.Mesh(H.mergeGeos(list), mat); mesh.castShadow = !(opt && opt.noCast && opt.noCast.has(mat)); mesh.receiveShadow = true; parent.add(mesh); out.push(mesh); });
    return out;
  }
};
/* 批量实例 */
H.Batch = class {
  constructor(geo, mat) { this.geo = geo; this.mat = mat; this.items = []; }
  add(x, y, z, sx, sy, sz, ry, color, rx, rz) { this.items.push([x, y, z, sx, sy, sz, ry || 0, color === undefined ? 0xffffff : color, rx || 0, rz || 0]); }
  build(parent, shadow) {
    if (!this.items.length) return null;
    const m = new T.InstancedMesh(this.geo, this.mat, this.items.length), d = new T.Object3D(), c = new T.Color();
    d.rotation.order = 'YXZ';
    this.items.forEach((it, i) => { d.position.set(it[0], it[1], it[2]); d.scale.set(it[3], it[4], it[5]); d.rotation.set(it[8], it[6], it[9]); d.updateMatrix(); m.setMatrixAt(i, d.matrix); m.setColorAt(i, c.set(it[7])); });
    m.frustumCulled = false; m.castShadow = shadow !== false; m.receiveShadow = true; parent.add(m); return m;
  }
};

/* ---------- 多边形（x,z 平面，逆时针） ---------- */
H.polyInfo = function (P) {
  const n = P.length, out = [];
  for (let i = 0; i < n; i++) {
    const a = P[(i + n - 1) % n], b = P[i], c = P[(i + 1) % n];
    const d1 = norm2(b[0] - a[0], b[1] - a[1]), d2 = norm2(c[0] - b[0], c[1] - b[1]), n1 = [d1[1], -d1[0]], n2 = [d2[1], -d2[0]];
    out.push({ n1, n2, convex: d1[0] * d2[1] - d1[1] * d2[0] > 0, diag: norm2(n1[0] + n2[0], n1[1] + n2[1]) });
  }
  return out;
};
H.offsetPoly = function (P, d) { const inf = H.polyInfo(P); return P.map((p, i) => [p[0] + d * (inf[i].n1[0] + inf[i].n2[0]), p[1] + d * (inf[i].n1[1] + inf[i].n2[1])]); };
H.plan = function (a, b, p) {                             // 十二折角平面：正方形四面各出抱厦
  return [[a + p, -b], [a + p, b], [a, b], [a, a], [b, a], [b, a + p], [-b, a + p], [-b, a], [-a, a], [-a, b],
    [-a - p, b], [-a - p, -b], [-a, -b], [-a, -a], [-b, -a], [-b, -a - p], [b, -a - p], [b, -a], [a, -a], [a, -b]];
};
H.shapeGeo = function (P, depth) {                        // 多边形平板（depth>0 则挤出厚度，顶面在 y=depth）
  const sh = new T.Shape(); P.forEach((p, i) => i ? sh.lineTo(p[0], -p[1]) : sh.moveTo(p[0], -p[1]));
  const g = depth ? new T.ExtrudeGeometry(sh, { depth, bevelEnabled: false }) : new T.ShapeGeometry(sh); g.rotateX(-Math.PI / 2); return g;
};

/* ---------- 画质档位 ---------- */
const QL = { high: { post: true, ao: true, msaa: 4, shadow: 4096, refl: 1024, trees: 1, grass: 1, pr: 1.5 },
  mid: { post: true, ao: false, msaa: 4, shadow: 2048, refl: 512, trees: 0.7, grass: 0.5, pr: 1.25 },
  low: { post: false, ao: false, msaa: 0, shadow: 1024, refl: 0, trees: 0.45, grass: 0, pr: 1 } };
H.QL = QL; H.qualityName = QL[H.qs.get('q')] ? H.qs.get('q') : (window.matchMedia && matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 820 ? 'mid' : 'high'); /* 手机默认中画质 */ H.Q = QL[H.qualityName];

/* ---------- 渲染器、场景、相机 ---------- */
const canvas = H.canvas = document.getElementById('scene');
const renderer = H.renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', stencil: false });
renderer.outputEncoding = T.sRGBEncoding;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
const scene = H.scene = new T.Scene();
const camera = H.camera = new T.PerspectiveCamera(45, 1, 0.4, 16000);
/* 竖屏（手机）时自动加宽视野，横向铺开的景物也能看全 */
(function () { const upm = camera.updateProjectionMatrix.bind(camera); camera.updateProjectionMatrix = function () { const f = this.fov, k = Math.pow(Math.max(1, 1.25 / this.aspect), 0.72); if (k > 1) { this.fov = Math.min(80, 2 * Math.atan(Math.tan(f * Math.PI / 360) * k) * 360 / Math.PI); upm(); this.fov = f; } else upm(); }; })();
camera.position.set(0, 18, 128);
const controls = H.controls = new T.OrbitControls(camera, canvas);
controls.enableDamping = true; controls.dampingFactor = 0.07; controls.rotateSpeed = 0.6; controls.zoomSpeed = 0.8;
controls.minDistance = 0.5; controls.maxDistance = 900; controls.maxPolarAngle = Math.PI * 0.96; controls.autoRotateSpeed = 0.55;
controls.target.set(0, 28, 0);
H.uTime = { value: 0 };                                   // 全局时间（风、水、云共用）
H.resizeHooks = [];
H.resize = function () {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, H.Q.pr)); renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix(); H.resizeHooks.forEach(f => f(w, h));
};
window.addEventListener('resize', H.resize); H.resize();
})();
