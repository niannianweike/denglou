/* 登楼 · 山河：按真实经纬度生成的立体中国地形（中东部）、海与海岸线、江河湖泊、省名、云，以及 14 座诗楼的小模型和光柱
 * 投影：x = (经度 − 112.5) × 40，z = −(纬度 − 31.3) × 46；地势高低做了夸张，好让孩子一眼看出高原、山脉和平原 */
(function () {
'use strict';
const H = window.HHL, T = THREE;
const { lerp, clamp, smooth, rng, V3, fbm, ridged, canvasTex, makeCanvas, pixelCanvas, texFrom, normalFromCanvas, mergeGeos } = H;
const scene = H.scene, camera = H.camera, renderer = H.renderer;
const KAI = '"KaiTi","STKaiti","楷体","SimSun",serif';
const PX = lon => (lon - 112.5) * 40, PZ = lat => -(lat - 31.3) * 46;
const LON = x => x / 40 + 112.5, LAT = z => 31.3 - z / 46;
const P = (lon, lat) => [PX(lon), PZ(lat)];
const rand = rng(20261114);

/* ============================== 天空与光（固定为晴朗的白天） ============================== */
const SU = {
  uSun: { value: V3(-0.45, 0.62, 0.64).normalize() }, uZenith: { value: new T.Color(0x2c64b6) }, uHorizon: { value: new T.Color(0xc9d8e2) }, uSunCol: { value: new T.Color(0xfff0d4) },
  uCloudLit: { value: new T.Color(0xffffff) }, uCloudDark: { value: new T.Color(0x8e9aac) }, uCover: { value: 0.54 }, uTime: H.uTime, uEnv: { value: 0 }
};
const SKY_VS = 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const SKY_FS = `
uniform vec3 uSun, uZenith, uHorizon, uSunCol, uCloudLit, uCloudDark; uniform float uCover, uTime, uEnv; varying vec3 vDir;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * noise(p); p = p * 2.03 + vec2(17.0, 9.0); a *= 0.5; } return s; }
float cloud(vec2 p){ return fbm(p + 0.85 * vec2(fbm(p * 0.6 + 3.1), fbm(p * 0.6 - 7.7))); }
void main(){
  vec3 d = normalize(vDir); float h = max(d.y, 0.0), sd = max(dot(d, uSun), 0.0);
  vec3 col = mix(uHorizon, uZenith, pow(h, 0.42));
  col = mix(col, uHorizon, exp(-h * 9.0) * 0.6);
  if (d.y < 0.0) col = mix(uHorizon, uHorizon * 0.6, clamp(-d.y * 5.0, 0.0, 1.0));
  col += uSunCol * (pow(sd, 5.0) * 0.10 + pow(sd, 40.0) * 0.30) * (0.4 + 0.6 * exp(-h * 3.0));
  if (d.y > 0.012) {
    vec2 p = d.xz / (d.y + 0.14) * 1.25 + vec2(uTime * 0.0045, uTime * 0.0016);
    float n = cloud(p), dens = smoothstep(uCover, uCover + 0.3, n), n2 = cloud(p + normalize(uSun.xz + 0.0001) * 0.16);
    float lit = clamp(0.5 + (n - n2) * 3.2, 0.0, 1.0);
    vec3 cc = mix(uCloudDark, uCloudLit, lit * (0.55 + 0.45 * (1.0 - dens))) + uSunCol * pow(sd, 8.0) * 0.45 * (1.0 - dens * 0.6);
    float fh = smoothstep(0.012, 0.2, d.y);
    col = mix(col, cc, dens * fh * 0.94);
  }
  if (uEnv < 0.5) col += uSunCol * smoothstep(0.99955, 0.99985, sd) * 26.0;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <encodings_fragment>
}`;
const skyGeo = new T.SphereGeometry(12000, 48, 24);
const sky = new T.Mesh(skyGeo, new T.ShaderMaterial({ uniforms: SU, vertexShader: SKY_VS, fragmentShader: SKY_FS, side: T.BackSide, depthWrite: false, fog: false }));
sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky);
const pmrem = new T.PMREMGenerator(renderer), envScene = new T.Scene();
envScene.add(new T.Mesh(skyGeo, new T.ShaderMaterial({ uniforms: Object.assign({}, SU, { uEnv: { value: 1 } }), vertexShader: SKY_VS, fragmentShader: SKY_FS, side: T.BackSide, depthWrite: false, fog: false })));
function bakeEnv() { scene.environment = pmrem.fromScene(envScene, 0, 1, 30000).texture; }
scene.fog = new T.FogExp2(0xc4d2dc, 0.00034);
const hemi = new T.HemisphereLight(0xd6e4ff, 0x5a5a40, 0.36); scene.add(hemi);
const sun = new T.DirectionalLight(0xfff1dc, 3.2); sun.castShadow = true;
Object.assign(sun.shadow.camera, { left: -900, right: 900, top: 900, bottom: -900, near: 200, far: 4000 });
sun.shadow.camera.updateProjectionMatrix(); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 1.2;
sun.target.position.set(0, 0, 60); sun.position.copy(SU.uSun.value).multiplyScalar(1800).add(sun.target.position); scene.add(sun, sun.target);
H.exposure = 0.8;

/* ============================== 海岸线、岛屿、湖泊、山脉、江河（经纬度） ============================== */
const COAST = [                                       // 大陆外缘：从西北角起，沿北边到朝鲜半岛，再顺着海岸线一路往南、往西
  [80, 60], [131, 60], [131, 42.6], [129.7, 41.0], [129.0, 40.0], [128.5, 38.5], [129.3, 36.0], [129.2, 35.2], [128.9, 35.1], [127.0, 34.6], [126.3, 34.6], [126.5, 35.8], [126.6, 37.0], [125.4, 37.7], [124.9, 38.3], [125.3, 39.5],
  [124.3, 39.85], [123.0, 39.6], [122.2, 39.2], [121.2, 38.75], [121.6, 39.4], [122.2, 40.6], [121.1, 40.85], [120.8, 40.6], [119.6, 39.9], [118.6, 39.1], [117.8, 38.95], [117.6, 38.4], [118.2, 38.0], [118.9, 37.7],
  [119.9, 37.2], [120.3, 37.65], [120.75, 37.82], [121.4, 37.55], [122.1, 37.5], [122.7, 37.4], [122.5, 36.9], [121.6, 36.8], [120.4, 36.05], [119.6, 35.5], [119.5, 35.2], [119.4, 34.7], [120.3, 34.2], [120.8, 33.3],
  [121.4, 32.4], [121.9, 31.8], [121.95, 31.2], [121.85, 30.85], [121.3, 30.7], [120.9, 30.45], [120.5, 30.35], [120.8, 30.15], [121.3, 30.2], [121.7, 30.05], [121.9, 29.9], [121.9, 29.3], [121.5, 28.6],
  [120.9, 27.9], [120.3, 27.1], [119.65, 26.0], [119.2, 25.4], [118.7, 24.85], [118.1, 24.45], [117.2, 23.6], [116.7, 23.3], [115.6, 22.8], [114.8, 22.6], [114.1, 22.45], [113.6, 22.75], [113.5, 22.15],
  [112.4, 21.8], [111.2, 21.5], [110.4, 21.2], [110.25, 20.25], [109.9, 20.4], [109.7, 21.0], [109.1, 21.45], [108.3, 21.6], [107.9, 21.5], [106.7, 20.75], [106.0, 19.8], [105.7, 18.8], [106.4, 17.6], [107.2, 16.6],
  [108.8, 15.0], [109.3, 12.5], [109.0, 11.0], [106.5, 9.0], [105.0, 8.6], [80, 8]
];
const TAIWAN = [[121.5, 25.3], [122.0, 25.0], [121.6, 24.0], [121.0, 22.6], [120.8, 21.9], [120.2, 22.6], [120.1, 23.5], [121.0, 25.0]];
const HAINAN = [[108.6, 19.1], [108.7, 18.5], [109.5, 18.2], [110.3, 18.6], [111.0, 19.6], [110.7, 20.1], [110.0, 20.05], [109.2, 19.8]];
const LAKES = [                                       // [名字, 经度, 纬度, 东西半径, 南北半径]
  ['洞庭湖', 112.85, 29.1, 0.42, 0.27], ['鄱阳湖', 116.25, 29.1, 0.22, 0.48], ['太湖', 120.2, 31.2, 0.3, 0.27], ['滇池', 102.68, 24.83, 0.09, 0.2],
  ['巢湖', 117.55, 31.58, 0.2, 0.1], ['洪泽湖', 118.65, 33.3, 0.18, 0.18], ['洱海', 100.2, 25.8, 0.06, 0.25]
];
const RIDGES = [                                      // [经纬度折线, 宽（度）, 高]
  [[[104.8, 34.0], [107, 33.9], [109, 33.8], [111.2, 33.7]], 0.45, 26],          // 秦岭
  [[[106.3, 32.4], [108.2, 32.0], [110.2, 31.6]], 0.35, 14],                     // 大巴山
  [[[112.9, 35.1], [113.6, 36.6], [114.1, 38.2], [114.9, 39.7]], 0.35, 20],      // 太行山
  [[[111.2, 35.9], [111.4, 37.3], [111.6, 38.6]], 0.3, 13],                      // 吕梁山
  [[[110.5, 34.75], [111.3, 35.0], [112.0, 35.3]], 0.2, 10],                     // 中条山
  [[[115.2, 40.4], [117.3, 40.5], [119.2, 40.2]], 0.35, 13],                     // 燕山
  [[[114.2, 31.4], [115.4, 31.1], [116.5, 30.8]], 0.35, 10],                     // 大别山
  [[[109.2, 29.3], [109.9, 28.0], [110.5, 26.6]], 0.45, 13],                     // 武陵山、雪峰山
  [[[109.8, 25.4], [111.5, 25.2], [113.5, 25.2], [115.3, 24.9]], 0.45, 12],      // 南岭
  [[[113.9, 25.9], [114.1, 27.2], [114.3, 28.6]], 0.3, 10],                      // 罗霄山
  [[[116.0, 25.9], [117.0, 27.0], [117.8, 27.9], [118.5, 28.6]], 0.4, 14],       // 武夷山
  [[[118.6, 27.0], [119.8, 28.3], [120.7, 29.0]], 0.5, 9],                       // 浙东的山
  [[[105.8, 28.4], [107.4, 28.0]], 0.3, 8],                                      // 大娄山
  [[[121.5, 24.9], [121.0, 23.6], [120.8, 22.3]], 0.3, 24],                      // 台湾中央山脉
  [[[127.8, 40.5], [128.3, 38.5], [128.8, 36.5]], 0.6, 16]                       // 朝鲜半岛东侧的山
];
const PEAKS = [[117.1, 36.25, 0.35, 9], [121.2, 37.2, 0.6, 4], [118.17, 30.13, 0.25, 9], [115.98, 29.55, 0.13, 6], [112.7, 27.25, 0.2, 6], [110.08, 34.48, 0.15, 9], [109.6, 19.0, 0.5, 10]];   // 泰山、胶东、黄山、庐山、衡山、华山、五指山
const RIVERS = [                                      // [名字, 折线, 宽, 颜色]
  ['黄河', [[101.7, 36.0], [103.8, 36.1], [104.6, 36.8], [105.2, 37.5], [106.3, 38.5], [106.8, 39.2], [106.8, 39.7], [107.0, 40.3], [108.0, 40.8], [110.0, 40.6], [111.2, 40.3], [111.1, 39.4], [110.6, 38.3], [110.5, 37.3], [110.4, 36.3], [110.35, 35.5], [110.27, 34.9], [110.3, 34.6], [111.2, 34.8], [112.0, 34.9], [113.6, 34.95], [114.3, 34.9], [115.0, 35.6], [116.0, 36.1], [117.0, 36.7], [118.0, 37.3], [119.1, 37.75]], 3.4, 0xb08a4a],
  ['长江', [[99.5, 28.5], [100.2, 27.3], [101.7, 26.6], [102.8, 26.3], [103.6, 27.6], [104.6, 28.8], [105.4, 28.9], [106.5, 29.6], [107.6, 30.0], [108.4, 30.8], [109.5, 31.0], [111.3, 30.7], [112.2, 30.3], [112.8, 29.7], [113.1, 29.45], [113.8, 29.9], [114.3, 30.6], [115.0, 30.2], [116.0, 29.75], [117.0, 30.5], [117.8, 30.95], [118.35, 31.35], [118.5, 31.7], [118.8, 32.1], [119.45, 32.25], [120.3, 31.95], [121.2, 31.7], [122.0, 31.4]], 4.0, 0x3f86a8],
  ['汉江', [[107.0, 33.07], [109.0, 32.7], [110.8, 32.6], [112.1, 32.0], [112.6, 31.0], [113.6, 30.6], [114.25, 30.58]], 2.0, 0x4a8ca8],
  ['湘江', [[112.95, 28.95], [112.95, 28.2], [113.1, 27.8], [112.6, 26.9], [111.8, 26.3], [111.0, 25.8]], 2.0, 0x4a8ca8],
  ['赣江', [[116.15, 29.0], [115.88, 28.7], [115.5, 28.1], [115.0, 27.1], [114.9, 25.9]], 2.0, 0x4a8ca8],
  ['湖口', [[116.2, 29.45], [116.2, 29.75]], 2.4, 0x4a8ca8],
  ['淮河', [[113.5, 32.4], [114.1, 32.15], [115.5, 32.5], [116.5, 32.6], [117.4, 32.95], [118.5, 33.2]], 2.0, 0x5a90a4],
  ['西江', [[106.8, 23.2], [108.3, 22.8], [109.4, 23.1], [111.3, 23.5], [112.5, 23.1], [113.3, 23.1], [113.6, 22.75]], 2.4, 0x4a8ca8],
  ['钱塘江', [[118.6, 29.4], [119.0, 29.4], [119.6, 29.7], [119.9, 29.95], [120.2, 30.2], [120.5, 30.3]], 2.0, 0x4a8ca8],
  ['嘉陵江', [[105.8, 32.4], [106.1, 31.3], [106.4, 30.3], [106.5, 29.6]], 1.8, 0x4a8ca8],
  ['岷江', [[103.6, 31.6], [103.9, 30.8], [104.0, 30.4], [103.8, 29.6], [104.6, 28.8]], 1.8, 0x4a8ca8],
  ['渭河', [[105.5, 34.6], [107.1, 34.4], [108.9, 34.35], [109.9, 34.55], [110.3, 34.6]], 1.8, 0x9a8450],
  ['汾河', [[111.9, 38.5], [112.5, 37.85], [112.0, 37.0], [111.5, 36.1], [110.6, 35.6]], 1.6, 0x9a8450]
];

/* ---- 折线几何 ---- */
const toXZ = L => L.map(p => P(p[0], p[1]));
function segDist(px, pz, a, b) { const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1, t = clamp(((px - a[0]) * dx + (pz - a[1]) * dz) / l2, 0, 1), x = a[0] + dx * t - px, z = a[1] + dz * t - pz; return Math.sqrt(x * x + z * z); }
function lineDist(px, pz, L, closed) { let d = 1e9; const n = L.length; for (let i = 0; i < (closed ? n : n - 1); i++) { const v = segDist(px, pz, L[i], L[(i + 1) % n]); if (v < d) d = v; } return d; }
function inside(px, pz, L) { let c = false; for (let i = 0, j = L.length - 1; i < L.length; j = i++) { const a = L[i], b = L[j]; if ((a[1] > pz) !== (b[1] > pz) && px < (b[0] - a[0]) * (pz - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
function bbox(L, pad) { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of L) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); } return [x0 - pad, x1 + pad, z0 - pad, z1 + pad]; }
const coastXZ = toXZ(COAST), twXZ = toXZ(TAIWAN), hnXZ = toXZ(HAINAN);
const ridgeXZ = RIDGES.map(r => ({ L: toXZ(r[0]), w: r[1] * 40, h: r[2], bb: bbox(toXZ(r[0]), r[1] * 40 * 2.6) }));
const riverXZ = RIVERS.map(r => ({ name: r[0], L: toXZ(r[1]), w: r[2], col: r[3], bb: bbox(toXZ(r[1]), 30) }));
const lakeXZ = LAKES.map(l => ({ name: l[0], x: PX(l[1]), z: PZ(l[2]), rx: l[3] * 40, rz: l[4] * 46 }));

/* ============================== 地形高度 ============================== */
function landDist(x, z) {                             // 带符号的离岸距离：陆上为正、海上为负
  let d = lineDist(x, z, coastXZ, true), land = inside(x, z, coastXZ);
  for (const isl of [twXZ, hnXZ]) { const di = lineDist(x, z, isl, true); if (inside(x, z, isl)) { land = true; d = di; } else if (!land) d = Math.min(d, di); }
  return land ? d : -d;
}
function rawH(x, z) {
  const lon = LON(x), lat = LAT(z);
  let h = 2.5 + 4.5 * fbm(x * 0.012 + 7, z * 0.012, 4);                                                  // 丘陵起伏
  const pw = smooth(105.0, 102.2, lon) * lerp(0.45, 1, smooth(25.5, 28.2, lat));                          // 青藏高原东缘、云贵高原
  h += pw * (28 + 22 * ridged(x * 0.006 + 3, z * 0.006, 5));
  h += smooth(108.8, 106.5, lon) * smooth(22.8, 24.5, lat) * smooth(29.3, 27.8, lat) * (10 + 9 * ridged(x * 0.01, z * 0.01 + 4, 4));
  const basin = Math.exp(-Math.pow((lon - 105.6) / 1.6, 2) - Math.pow((lat - 30.2) / 1.3, 2));            // 四川盆地
  h = lerp(h, 3 + 2 * fbm(x * 0.02, z * 0.02, 3), basin * 0.92);
  h += smooth(103.8, 105.5, lon) * smooth(112.3, 111.0, lon) * smooth(34.6, 35.6, lat) * smooth(40.2, 38.8, lat) * (12 + 9 * fbm(x * 0.03, z * 0.03, 4));   // 黄土高原
  h += smooth(39.4, 40.6, lat) * smooth(119.5, 116.5, lon) * (11 + 4 * fbm(x * 0.01, z * 0.01, 3));       // 内蒙古高原
  const plain = smooth(113.6, 114.6, lon) * smooth(119.8, 118.8, lon) * smooth(32.6, 33.6, lat) * smooth(39.6, 38.8, lat);   // 华北平原、长江中下游平原压平
  const plainS = smooth(111.5, 112.5, lon) * smooth(121.5, 120.0, lon) * smooth(29.0, 29.8, lat) * smooth(32.6, 31.6, lat);
  h = lerp(h, 1.6 + 1.2 * fbm(x * 0.02, z * 0.02, 2), Math.max(plain, plainS * 0.75));
  for (const r of ridgeXZ) { if (x < r.bb[0] || x > r.bb[1] || z < r.bb[2] || z > r.bb[3]) continue; const d = lineDist(x, z, r.L); h += r.h * Math.exp(-Math.pow(d / r.w, 2)) * (0.7 + 0.6 * ridged(x * 0.03 + r.h, z * 0.03, 4)); }
  for (const p of PEAKS) { const dx = (lon - p[0]) / p[2], dz = (lat - p[1]) / p[2], q = dx * dx + dz * dz; if (q < 9) h += p[3] * Math.exp(-q * 1.4) * (0.8 + 0.4 * ridged(x * 0.05, z * 0.05, 3)); }
  let g = 0; for (const r of riverXZ) { if (x < r.bb[0] || x > r.bb[1] || z < r.bb[2] || z > r.bb[3]) continue; const d = lineDist(x, z, r.L); g = Math.max(g, Math.exp(-Math.pow(d / (r.w * 3.2), 2))); }
  h -= (h - 1.0) * 0.72 * g;                                                                              // 江河冲出的河谷
  for (const l of lakeXZ) { const q = Math.pow((x - l.x) / l.rx, 2) + Math.pow((z - l.z) / l.rz, 2); if (q < 2.2) h = lerp(h, Math.min(h, -0.9), 1 - smooth(0.8, 1.15, q)); }
  return h;
}
function groundH(x, z) {
  const s = landDist(x, z), h = rawH(x, z);
  return s > 0 ? 0.5 + (h - 0.5) * smooth(0, 22, s) : -1.5 - 14 * smooth(0, 70, -s);
}

/* ============================== 地形网格与着色 ============================== */
const field = { N: 520, S: 1500 };
(function () {
  const N = field.N, S = field.S, a = 0.35, warp = u => S * (a * u + (1 - a) * u * u * u);
  const g = new T.PlaneGeometry(2, 2, N, N); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, uv = g.attributes.uv, col = new Float32Array(p.count * 3), c = new T.Color(), c2 = new T.Color();
  const PAL = { south: 0x4c7838, north: 0x8e8c56, loess: 0xb69c62, plateau: 0x7c7357, rock: 0x8c8678, snow: 0xeef0f2, sand: 0xcbbb8c, basin: 0x5e8a3e };
  const H0 = new Float32Array(p.count);
  for (let i = 0; i < p.count; i++) { const x = warp(p.getX(i)) + 20, z = warp(p.getZ(i)) + 60, h = groundH(x, z); p.setXYZ(i, x, h, z); uv.setXY(i, x / 9, z / 9); H0[i] = h; }
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), h = H0[i], lon = LON(x), lat = LAT(z);
    const n = fbm(x * 0.03 + 40, z * 0.03, 4), n2 = fbm(x * 0.11, z * 0.11 + 20, 3);
    c.set(PAL.south).lerp(c2.set(PAL.north), smooth(30.5, 37, lat));
    c.lerp(c2.set(PAL.loess), smooth(103.8, 105.5, lon) * smooth(112.3, 111.0, lon) * smooth(34.6, 35.8, lat) * smooth(40.2, 38.6, lat) * 0.85);
    c.lerp(c2.set(PAL.basin), Math.exp(-Math.pow((lon - 105.6) / 1.5, 2) - Math.pow((lat - 30.2) / 1.2, 2)) * 0.6);
    c.lerp(c2.set(PAL.plateau), smooth(16, 36, h));
    c.lerp(c2.set(PAL.rock), smooth(38, 54, h));
    c.lerp(c2.set(PAL.snow), smooth(56, 66, h) * 0.85);
    c.multiplyScalar(0.84 + 0.3 * n * (0.8 + 0.4 * n2));
    if (h < 1.4 && h > -0.5) c.lerp(c2.set(PAL.sand), smooth(1.4, 0.6, h) * 0.8);
    if (h <= -0.5) c.set(0x5a6a60);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new T.BufferAttribute(col, 3)); g.computeVertexNormals();
  const dh = pixelCanvas(256, 256, (u, v) => { const k = 255 * fbm(u * 24, v * 24, 4, 24); return [k, k, k]; });
  const dc = pixelCanvas(256, 256, (u, v) => { const k = 200 + 55 * fbm(u * 32 + 5, v * 32, 4, 32); return [k, k, k * 0.95]; });
  const mat = new T.MeshStandardMaterial({ vertexColors: true, map: texFrom(dc), normalMap: normalFromCanvas(dh, 2.4), normalScale: new T.Vector2(1.2, 1.2), roughness: 0.95, envMapIntensity: 0.5 });
  const m = new T.Mesh(g, mat); m.receiveShadow = true; m.castShadow = true; m.frustumCulled = false; scene.add(m);
})();

/* ============================== 海 ============================== */
let water = null, waterLow = null;
(function () {
  const wn = normalFromCanvas(pixelCanvas(512, 512, (u, v) => { const k = 255 * (0.6 * fbm(u * 6, v * 6, 5, 6) + 0.4 * fbm(u * 14 + 3, v * 14, 4, 14)); return [k, k, k]; }), 5);
  const geo = new T.PlaneGeometry(30000, 30000);
  if (T.Water) {
    water = new T.Water(geo, { textureWidth: H.Q.refl || 256, textureHeight: H.Q.refl || 256, waterNormals: wn, sunDirection: SU.uSun.value.clone(), sunColor: 0xfff0d8, waterColor: 0x1c4a62, distortionScale: 3.0, fog: true });
    water.rotation.x = -Math.PI / 2; water.position.y = 0; water.material.uniforms.size.value = 0.6; scene.add(water);
  }
  const ln = wn.clone(); ln.needsUpdate = true; ln.repeat.set(400, 400);
  waterLow = new T.Mesh(geo, new T.MeshStandardMaterial({ color: 0x2c6680, roughness: 0.18, metalness: 0.3, normalMap: ln, normalScale: new T.Vector2(0.5, 0.5), envMapIntensity: 1.3 }));
  waterLow.rotation.x = -Math.PI / 2; waterLow.userData.n = ln; scene.add(waterLow);
})();

/* ============================== 江河：贴着地面的水带 ============================== */
(function () {
  for (const r of riverXZ) {
    const curve = new T.CatmullRomCurve3(r.L.map(p => V3(p[0], 0, p[1])), false, 'centripetal'), n = Math.max(40, r.L.length * 14), pts = curve.getSpacedPoints(n);
    const pos = [], uv = [], idx = [];
    for (let i = 0; i <= n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)], dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l, w = r.w * (0.65 + 0.35 * i / n);
      for (const s of [-1, 1]) { const x = pts[i].x + nx * w * s, z = pts[i].z + nz * w * s; pos.push(x, Math.max(groundH(x, z), groundH(pts[i].x, pts[i].z), 0) + 0.45, z); uv.push(s * 0.5 + 0.5, i / 4); }
      if (i < n) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const m = new T.Mesh(g, new T.MeshStandardMaterial({ color: r.col, roughness: 0.14, metalness: 0.2, envMapIntensity: 1.7, emissive: r.col, emissiveIntensity: 0.12, polygonOffset: true, polygonOffsetFactor: -2 }));
    m.receiveShadow = true; scene.add(m);
  }
})();

/* ============================== 省名：淡淡地写在山河上 ============================== */
const PROV = [['河北', 115.5, 38.5], ['山西', 112.3, 37.6], ['内蒙古', 111.5, 40.7], ['陕西', 108.5, 35.6], ['甘肃', 104.5, 35.4], ['宁夏', 106.0, 37.2], ['河南', 113.6, 33.9], ['山东', 118.0, 36.3],
  ['江苏', 119.6, 33.3], ['安徽', 117.0, 32.6], ['浙江', 119.8, 29.1], ['江西', 115.6, 27.4], ['福建', 118.2, 25.8], ['湖北', 112.3, 31.2], ['湖南', 111.7, 27.5], ['广东', 113.4, 23.8],
  ['广西', 108.8, 23.9], ['贵州', 106.7, 26.7], ['云南', 101.8, 24.2], ['四川', 102.4, 31.6], ['重庆', 107.6, 30.1], ['台湾', 120.95, 23.8], ['青海', 100.4, 36.0], ['北京', 116.4, 40.1], ['上海', 121.5, 31.25], ['海南', 109.8, 19.3]];
(function () {
  for (const p of PROV) {
    const t = p[0], tex = canvasTex(160 * t.length + 40, 200, function (g, w, h) { g.clearRect(0, 0, w, h); g.font = 'bold 150px ' + KAI; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = 'rgba(40,30,10,.5)'; g.shadowBlur = 10; g.fillStyle = 'rgba(255,248,230,.92)'; g.fillText(t.split('').join(' '), w / 2, h / 2 + 6); });
    const w = (t.length * 9 + 4) * 1.7, m = new T.Mesh(new T.PlaneGeometry(w, 9 * 1.7), new T.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.62, depthWrite: false, fog: true }));
    const x = PX(p[1]), z = PZ(p[2]); let top = 0; for (let i = -2; i <= 2; i++) for (let j = -1; j <= 1; j++) top = Math.max(top, groundH(x + i * w / 4, z + j * 6));
    m.rotation.x = -Math.PI / 2; m.position.set(x, top + 1.2, z); m.renderOrder = 2; scene.add(m);
  }
})();

/* ============================== 云 ============================== */
const clouds = [];
(function () {
  const tex = canvasTex(256, 256, function (g, w, h) {
    g.clearRect(0, 0, w, h); const r = rng(5);
    for (let i = 0; i < 26; i++) { const x = 60 + r() * 136, y = 90 + r() * 70, rr = 26 + r() * 46, gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill(); }
  });
  for (let i = 0; i < 20; i++) {
    const mat = new T.SpriteMaterial({ map: tex, color: 0xffffff, transparent: true, opacity: 0.3 + rand() * 0.25, depthWrite: false, fog: true });
    const s = new T.Sprite(mat), k = 120 + rand() * 130; s.scale.set(k, k * 0.5, 1);
    s.position.set(-700 + rand() * 1400, 120 + rand() * 60, -600 + rand() * 1250); s.userData.v = 2 + rand() * 3; scene.add(s); clouds.push(s);
  }
})();

/* ============================== 十四座诗楼 ============================== */
const MT = {
  red: new T.MeshStandardMaterial({ color: 0x9a2416, roughness: 0.5, emissive: 0xff5020, emissiveIntensity: 0 }),
  gold: new T.MeshStandardMaterial({ color: 0xe2ad3a, roughness: 0.32, metalness: 0.55, emissive: 0xffb040, emissiveIntensity: 0, side: T.DoubleSide }),
  grey: new T.MeshStandardMaterial({ color: 0x5e636a, roughness: 0.6, emissive: 0xffb040, emissiveIntensity: 0, side: T.DoubleSide }),
  stone: new T.MeshStandardMaterial({ color: 0xcfc6b2, roughness: 0.8 }),
  white: new T.MeshStandardMaterial({ color: 0xece4d0, roughness: 0.7 }),
  dark: new T.MeshStandardMaterial({ color: 0x5a1a10, roughness: 0.6 })
};
function roofGeo(hw, ov, rise, ix, iz, lift) {          // 四面坡屋顶：檐口微微下凹、四角起翘；ix/iz 为屋顶上沿的半宽（0 即攒尖，iz≈0 即带正脊）
  const O = hw + ov, sides = [[[-O, O], [O, O], [-ix, iz], [ix, iz]], [[O, O], [O, -O], [ix, iz], [ix, -iz]], [[O, -O], [-O, -O], [ix, -iz], [-ix, -iz]], [[-O, -O], [-O, O], [-ix, -iz], [-ix, iz]]];
  return mergeGeos(sides.map(s => H.gridGeo(8, 6, (u, t) => {
    const bx = lerp(s[0][0], s[1][0], u), bz = lerp(s[0][1], s[1][1], u), tx = lerp(s[2][0], s[3][0], u), tz = lerp(s[2][1], s[3][1], u);
    const cf = Math.max(Math.exp(-Math.pow(u * 5, 2)), Math.exp(-Math.pow((1 - u) * 5, 2))), k = (1 - t) * (1 - t) * cf;
    const cx = Math.abs(bx) < 1e-6 ? 0 : Math.sign(bx), cz = Math.abs(bz) < 1e-6 ? 0 : Math.sign(bz);
    return [lerp(bx, tx, t) + cx * k * ov * 0.35, rise * Math.pow(t, 1.6) + lift * k, lerp(bz, tz, t) + cz * k * ov * 0.35, u, t];
  })));
}
function towerModel(kind) {                          // 小楼：两层石台基、檐柱一圈、红墙白窗、平坐栏杆、起翘的屋檐；顶上是攒尖、盔顶或歇山
  const L = { red: [], roof: [], white: [], stone: [], gold: [], dark: [] }, levels = kind === 'A' ? 5 : 3, roofM = kind === 'D' ? MT.grey : MT.gold;
  const box = (k, w, h, d, x, y, z) => { const g = new T.BoxGeometry(w, h, d); g.translate(x || 0, y, z || 0); L[k].push(g); };
  const cyl = (k, r, h, x, y, z) => { const g = new T.CylinderGeometry(r, r * 1.05, h, 8); g.translate(x, y + h / 2, z); L[k].push(g); };
  box('stone', 5.6, 0.45, 5.6, 0, 0.22); box('stone', 4.7, 0.4, 4.7, 0, 0.62);
  for (let s = 0; s < 3; s++) box('stone', 1.4, 0.28 * (3 - s), 0.3, 0, 0.14 * (3 - s), 2.5 + s * 0.3);
  let y = 0.82, w = 0;
  for (let i = 0; i < levels; i++) {
    w = (kind === 'A' ? 3.1 - i * 0.3 : 3.4 - i * 0.45); const hh = kind === 'D' ? 1.45 : kind === 'A' ? 1.05 : 1.25, hw = w / 2;
    box('red', w * 0.8, hh, w * 0.8, 0, y + hh / 2);
    box('white', w * 0.82, hh * 0.3, w * 0.82, 0, y + hh * 0.62);
    for (let j = 0; j < 4; j++) for (let q = -1.5; q <= 1.5; q += 1) {           // 檐柱一圈
      const a = (q / 1.5) * hw * 0.92, p = [[a, hw * 0.92], [hw * 0.92, a], [a, -hw * 0.92], [-hw * 0.92, a]][j];
      if (j % 2 === 1 && Math.abs(q) === 1.5) continue; cyl('red', 0.06, hh, p[0], y, p[1]);
    }
    box('dark', w * 0.98, 0.1, w * 0.98, 0, y + hh - 0.05);
    if (i > 0) { box('white', w * 1.04, 0.06, w * 1.04, 0, y + 0.32); box('dark', w * 1.06, 0.1, w * 1.06, 0, y + 0.02); }   // 平坐栏杆
    y += hh;
    const g = roofGeo(hw, w * 0.3, kind === 'D' ? 0.45 : 0.55, hw * 0.62, hw * 0.62, kind === 'D' ? 0.18 : 0.42); g.translate(0, y - 0.05, 0); L.roof.push(g);
    y += kind === 'D' ? 0.3 : 0.38;
  }
  const hw = w / 2;
  if (kind === 'C') {                                                          // 盔顶（岳阳楼）
    const g = roofGeo(hw * 0.75, w * 0.18, 0.25, hw * 0.6, hw * 0.6, 0.3); g.translate(0, y, 0); L.roof.push(g);
    const helm = new T.SphereGeometry(hw * 0.78, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2); helm.scale(1, 0.95, 0.8); helm.translate(0, y + 0.2, 0); L.roof.push(helm); y += hw * 0.75 + 0.2;
  } else if (kind === 'D') {                                                   // 歇山顶加鸱尾（唐风）
    const g = roofGeo(hw * 0.8, w * 0.22, 1.0, hw * 0.55, 0.02, 0.15); g.translate(0, y, 0); L.roof.push(g);
    box('roof', hw * 1.25, 0.16, 0.16, 0, y + 1.02); for (const s of [-1, 1]) box('roof', 0.12, 0.5, 0.18, s * hw * 0.62, y + 1.25); y += 1.1;
  } else {                                                                     // 攒尖顶
    const g = roofGeo(hw * 0.8, w * 0.24, 1.25, 0.02, 0.02, 0.35); g.translate(0, y, 0); L.roof.push(g); y += 1.25;
  }
  const fin = new T.LatheGeometry([[0.01, 0], [0.14, 0.02], [0.2, 0.14], [0.1, 0.3], [0.16, 0.42], [0.05, 0.62], [0.01, 0.7]].map(p => new T.Vector2(p[0], p[1])), 10); fin.translate(0, y - 0.05, 0); L.gold.push(fin);
  const grp = new T.Group(), MAT = { red: MT.red, roof: roofM, white: MT.white, stone: MT.stone, gold: MT.gold, dark: MT.dark };
  for (const k in L) {
    if (!L[k].length) continue;
    const mesh = new T.Mesh(mergeGeos(L[k].map(g => { if (!g.attributes.uv) g.setAttribute('uv', new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); return g; })), MAT[k]);
    mesh.castShadow = true; mesh.receiveShadow = true; grp.add(mesh);
  }
  grp.userData.top = y + 0.7;
  return grp;
}
const pillarTex = canvasTex(8, 256, function (g, w, h) { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.55, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,1)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, true);
const ringTex = canvasTex(128, 128, function (g, w, h) { const gr = g.createRadialGradient(64, 64, 20, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.75, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, true);
const markers = [];
function addTower(t) {
  const x = PX(t.lon), z = PZ(t.lat), y = Math.max(groundH(x, z), 0.4);
  const root = new T.Group(); root.position.set(x, y, z); scene.add(root);
  const model = towerModel(t.shape); root.add(model);
  const col = t.course ? 0xffcf6a : 0xe8eef8;
  const pillar = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 20, 1, true), new T.MeshBasicMaterial({ map: pillarTex, color: col, transparent: true, opacity: t.course ? 0.75 : 0.4, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false }));
  pillar.geometry.translate(0, 0.5, 0); root.add(pillar);
  const ring = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: ringTex, color: col, transparent: true, opacity: 0.8, blending: T.AdditiveBlending, depthWrite: false, fog: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.6; root.add(ring);
  const hit = new T.Mesh(new T.BoxGeometry(9, 16, 9), new T.MeshBasicMaterial({ visible: false })); hit.position.y = 8; root.add(hit);
  const mk = { t, root, model, pillar, ring, hit, x, y, z, ph: rand() * 6.28 }; hit.userData.mk = mk; markers.push(mk); return mk;
}

/* ============================== 画质与逐帧 ============================== */
function setQuality() {
  const Q = H.Q;
  if (water) water.visible = !!Q.refl; waterLow.visible = !Q.refl || !water;
  if (sun.shadow.mapSize.x !== Q.shadow) { sun.shadow.mapSize.set(Q.shadow, Q.shadow); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
}
function update(dt, time) {
  H.uTime.value = time; sky.position.copy(camera.position);
  if (water) water.material.uniforms.time.value = time * 0.3;
  waterLow.userData.n.offset.set(time * 0.003, time * 0.0014);
  for (const c of clouds) { c.position.x += c.userData.v * dt; if (c.position.x > 760) c.position.x = -760; }
  if (H.bloom) { H.bloom.threshold = 2.2; H.bloom.strength = 0.5; }
}
setQuality();
H.world = { setQuality };
H.map = { PX, PZ, LON, LAT, groundH, addTower, markers, MT, update, bakeEnv, RIVERS: riverXZ, LAKES: lakeXZ };
})();
