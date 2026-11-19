/* 鹳雀楼 · 河山世界：天空与时辰、黄河与河滩、河对岸的远山、楼后的中条山、黄土台塬、林木芳草、蒲津渡铁牛、白鹳、木船
 * 坐标：楼在原点，正面朝 +z；楼前是黄河（z 约 170～1100），太阳傍晚落在河对岸的山后——“白日依山尽，黄河入海流” */
(function () {
'use strict';
const H = window.HHL, T = THREE;
const { lerp, clamp, smooth, rng, V3, fbm, ridged, vnoise, canvasTex, makeCanvas, pixelCanvas, texFrom, normalFromCanvas, gridGeo, tubeGeo, mergeGeos, tint } = H;
const scene = H.scene, camera = H.camera, renderer = H.renderer, TY = H.tower.TY;
const rand = rng(20261114), WATER_Y = -4;
const RIVER = { z0: 175, z1: 1100 };                   // 黄河两岸（近岸、对岸）
const OXEN = { x: -78, z: 104 };                       // 蒲津渡铁牛
const ZT = { x: -300, z: -1500 };                      // 中条山（标注用）

/* ============================== 天空 ============================== */
const SU = {
  uSun: { value: V3(0, 1, 0) }, uZenith: { value: new T.Color() }, uHorizon: { value: new T.Color() }, uSunCol: { value: new T.Color() },
  uCloudLit: { value: new T.Color() }, uCloudDark: { value: new T.Color() }, uCover: { value: 0.5 }, uStars: { value: 0 }, uDisc: { value: 20 }, uGlow: { value: 1 },
  uMoon: { value: 0 }, uTime: H.uTime, uEnv: { value: 0 }
};
const SKY_VS = 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const SKY_FS = `
uniform vec3 uSun, uZenith, uHorizon, uSunCol, uCloudLit, uCloudDark; uniform float uCover, uStars, uDisc, uGlow, uMoon, uTime, uEnv; varying vec3 vDir;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float hash3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * noise(p); p = p * 2.03 + vec2(17.0, 9.0); a *= 0.5; } return s; }
float cloud(vec2 p){ return fbm(p + 0.85 * vec2(fbm(p * 0.6 + 3.1), fbm(p * 0.6 - 7.7))); }
void main(){
  vec3 d = normalize(vDir); float h = max(d.y, 0.0), sd = max(dot(d, uSun), 0.0);
  vec3 col = mix(uHorizon, uZenith, pow(h, 0.42));
  col = mix(col, uHorizon, exp(-h * 9.0) * 0.6);
  if (d.y < 0.0) col = mix(uHorizon, uHorizon * 0.55, clamp(-d.y * 5.0, 0.0, 1.0));
  col += uSunCol * (pow(sd, 5.0) * 0.10 + pow(sd, 40.0) * 0.30) * uGlow * (0.4 + 0.6 * exp(-h * 3.0));
  float occ = 0.0;
  if (d.y > 0.012) {
    vec2 p = d.xz / (d.y + 0.14) * 1.25 + vec2(uTime * 0.0045, uTime * 0.0016);
    float n = cloud(p), dens = smoothstep(uCover, uCover + 0.3, n);
    float n2 = cloud(p + normalize(uSun.xz + 0.0001) * 0.16);
    float lit = clamp(0.5 + (n - n2) * 3.2, 0.0, 1.0);
    vec3 cc = mix(uCloudDark, uCloudLit, lit * (0.55 + 0.45 * (1.0 - dens)));
    cc += uSunCol * pow(sd, 8.0) * 0.45 * uGlow * (1.0 - dens * 0.6);
    float wisp = smoothstep(0.52, 0.9, fbm(p * vec2(0.35, 1.6) + 11.0)) * 0.35;
    float fh = smoothstep(0.012, 0.2, d.y);
    occ = dens * fh;
    col = mix(col, mix(col, uCloudLit, 0.6), wisp * fh * (1.0 - dens));
    col = mix(col, cc, occ * 0.94);
  }
  if (uEnv < 0.5) {
    float disc = smoothstep(0.99955, 0.99985, sd);
    if (uMoon > 0.5) { disc = smoothstep(0.9993, 0.9996, sd); col += uSunCol * disc * uDisc * (1.0 - occ) * (0.75 + 0.25 * noise(d.xy * 260.0)); }
    else col += uSunCol * disc * uDisc * (1.0 - occ * 0.92);
    if (uStars > 0.01 && d.y > 0.0) {
      vec3 q = d * 210.0, c = floor(q); float r = hash3(c);
      float s = step(0.9935, r) * smoothstep(0.42, 0.0, length(fract(q) - 0.5)) * (0.6 + 0.4 * sin(uTime * 2.3 + r * 600.0));
      col += vec3(0.85, 0.9, 1.0) * s * uStars * 2.4 * (1.0 - occ) * smoothstep(0.0, 0.25, d.y);
    }
  }
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <encodings_fragment>
}`;
const skyGeo = new T.SphereGeometry(12000, 48, 24);
const sky = new T.Mesh(skyGeo, new T.ShaderMaterial({ uniforms: SU, vertexShader: SKY_VS, fragmentShader: SKY_FS, side: T.BackSide, depthWrite: false, fog: false }));
sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky);
const pmrem = new T.PMREMGenerator(renderer), envScene = new T.Scene(); let envRT = null;
envScene.add(new T.Mesh(skyGeo, new T.ShaderMaterial({ uniforms: Object.assign({}, SU, { uEnv: { value: 1 } }), vertexShader: SKY_VS, fragmentShader: SKY_FS, side: T.BackSide, depthWrite: false, fog: false })));
function bakeEnv() { const rt = pmrem.fromScene(envScene, 0, 1, 30000); scene.environment = rt.texture; if (envRT) envRT.dispose(); envRT = rt; }

/* ============================== 光照与时辰 ============================== */
scene.fog = new T.FogExp2(0xcfc8b4, 0.00042);
const hemi = new T.HemisphereLight(0xffffff, 0x554a33, 0.3); scene.add(hemi);
const sun = new T.DirectionalLight(0xffffff, 3); sun.castShadow = true;
Object.assign(sun.shadow.camera, { left: -110, right: 110, top: 110, bottom: -110, near: 60, far: 1000 });
sun.shadow.camera.updateProjectionMatrix(); sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.08; sun.target.position.set(0, 20, 10); scene.add(sun, sun.target);
const bounce = new T.DirectionalLight(0xffe6c0, 0.6); bounce.position.set(0, -300, 60); bounce.target.position.set(0, 30, 0); scene.add(bounce, bounce.target);
let indoor = 0;
const C = h => new T.Color(h), D = (x, y, z) => V3(x, y, z).normalize();
const ENV = {                                                      // 黄土高原的天：晴天也带一点黄沙的暖灰
  day: { zenith: C(0x2f66b4), horizon: C(0xd2d4cc), sunCol: C(0xfff0d4), cloudLit: C(0xffffff), cloudDark: C(0x9096a0), cover: 0.52, stars: 0, disc: 26, glowSky: 1, moon: 0,
    dir: D(-0.5, 0.64, 0.58), light: C(0xfff1dc), lightI: 3.3, hemiSky: C(0xd6e2f6), hemiGround: C(0x6a5a3c), hemiI: 0.32, fog: C(0xcfc9b6), fogD: 0.0005, water: C(0x5a4426), glow: 0, exposure: 0.8 },
  dusk: { zenith: C(0x26305f), horizon: C(0xf29a52), sunCol: C(0xff7e30), cloudLit: C(0xffb07a), cloudDark: C(0x5a4a60), cover: 0.5, stars: 0.04, disc: 24, glowSky: 2.4, moon: 0,
    dir: D(-0.12, 0.1, 0.98), light: C(0xff9450), lightI: 3.0, hemiSky: C(0xc9a0b8), hemiGround: C(0x3e2c26), hemiI: 0.42, fog: C(0xdc9a64), fogD: 0.0006, water: C(0x4a3020), glow: 0.4, exposure: 0.9 },
  night: { zenith: C(0x02050d), horizon: C(0x0d1832), sunCol: C(0xbccaff), cloudLit: C(0x27325a), cloudDark: C(0x080c1c), cover: 0.58, stars: 1, disc: 5, glowSky: 0.5, moon: 1,
    dir: D(0.32, 0.3, 0.9), light: C(0x9db2f0), lightI: 0.85, hemiSky: C(0x3a4c82), hemiGround: C(0x10131e), hemiI: 0.7, fog: C(0x0a1124), fogD: 0.0005, water: C(0x0a0c12), glow: 1, exposure: 1.05 }
};
const COLK = ['zenith', 'horizon', 'sunCol', 'cloudLit', 'cloudDark', 'light', 'hemiSky', 'hemiGround', 'fog', 'water'];
const NUMK = ['cover', 'stars', 'disc', 'glowSky', 'lightI', 'hemiI', 'fogD', 'glow', 'exposure'];
const cloneEnv = e => { const o = {}; COLK.forEach(k => o[k] = e[k].clone()); NUMK.forEach(k => o[k] = e[k]); o.dir = e.dir.clone(); o.moon = e.moon; return o; };
const env = { name: 'day', mist: false, cur: cloneEnv(ENV.day), tgt: cloneEnv(ENV.day), bakeAt: [] };
let clock = 0, water = null, waterLow = null, silt = null;
function setEnv(name, mist) {
  if (name && ENV[name]) env.name = name; if (mist !== undefined) env.mist = !!mist;
  env.tgt = cloneEnv(ENV[env.name]);
  if (env.mist) { env.tgt.horizon.lerp(env.tgt.fog, 1); env.tgt.cloudLit.lerp(env.tgt.fog, 0.55); env.tgt.zenith.lerp(env.tgt.fog, 0.6); env.tgt.cloudDark.lerp(env.tgt.fog, 0.6); env.tgt.fogD = env.name === 'day' ? 0.0036 : 0.0045; env.tgt.cover = Math.min(env.tgt.cover, 0.44); env.tgt.lightI *= 0.7; env.tgt.hemiI *= 1.6; }
  env.bakeAt = [clock + 0.5, clock + 1.3, clock + 2.6, clock + 4.2];
}
function applyEnv(k) {
  const c = env.cur, t = env.tgt;
  COLK.forEach(n => c[n].lerp(t[n], k)); NUMK.forEach(n => c[n] = lerp(c[n], t[n], k)); c.dir.lerp(t.dir, k).normalize(); c.moon = t.moon;
  SU.uSun.value.copy(c.dir); SU.uZenith.value.copy(c.zenith); SU.uHorizon.value.copy(c.horizon); SU.uSunCol.value.copy(c.sunCol);
  SU.uCloudLit.value.copy(c.cloudLit); SU.uCloudDark.value.copy(c.cloudDark); SU.uCover.value = c.cover; SU.uStars.value = c.stars; SU.uDisc.value = c.disc; SU.uGlow.value = c.glowSky; SU.uMoon.value = c.moon;
  scene.fog.color.copy(c.fog); scene.fog.density = c.fogD;
  sun.color.copy(c.light); sun.intensity = c.lightI; sun.position.copy(c.dir).multiplyScalar(500).add(sun.target.position);
  hemi.color.copy(c.hemiSky); hemi.groundColor.copy(c.hemiGround); hemi.intensity = c.hemiI * (1 - 0.72 * indoor);
  bounce.color.copy(c.light).lerp(c.hemiGround, 0.35); bounce.intensity = c.lightI * 0.2 * (1 - 0.85 * indoor);
  if (H.bloom) { H.bloom.threshold = lerp(lerp(3.4, 1.3, c.glow), 2.3, indoor); H.bloom.strength = lerp(lerp(0.5, 0.55, c.glow), 0.6, indoor); }
  if (water) { const u = water.material.uniforms; u.sunDirection.value.copy(c.dir); u.sunColor.value.copy(c.light).multiplyScalar(Math.min(1.5, c.lightI * 0.45)); u.waterColor.value.copy(c.water); }
  if (waterLow) waterLow.material.color.copy(c.water).multiplyScalar(2.0);
  if (silt) silt.material.color.copy(c.water).multiplyScalar(1.5).lerp(c.fog, 0.15);
  H.tower.setGlow(c.glow); if (H.interior) H.interior.setTime(c.glow);
  H.exposure = c.exposure;
}
function snapEnv() { env.cur = cloneEnv(env.tgt); applyEnv(1); bakeEnv(); env.bakeAt = []; }

/* ============================== 地形 ============================== */
function groundH(x, z) {
  const ax = Math.abs(x);
  let h = 0.12 * (fbm(x * 0.05, z * 0.05, 2) - 0.5);                              // 楼前后的平地
  h += smooth(80, 420, Math.hypot(x, z * 0.6)) * (fbm(x * 0.008, z * 0.008 + 5, 3) - 0.42) * 14;   // 黄土台塬，起伏不大
  h += smooth(-160, -700, z) * (8 + 70 * fbm(x * 0.003 + 3, z * 0.003, 4));      // 楼后渐渐抬高，接到中条山脚
  h = lerp(h, WATER_Y + 1.4, smooth(RIVER.z0 - 70, RIVER.z0 - 25, z));           // 河岸坡
  h = lerp(h, WATER_Y + 0.35 + 0.5 * fbm(x * 0.02, z * 0.02, 3), smooth(RIVER.z0 - 25, RIVER.z0, z));   // 河滩（黄河的泥沙滩）
  h = lerp(h, -16, smooth(RIVER.z0 + 10, RIVER.z0 + 90, z));                      // 河床
  for (const s of [[-260, 420, 160, 36], [380, 640, 220, 50], [-80, 860, 120, 26]]) {   // 河心的沙洲
    const q = Math.pow((x - s[0]) / s[2], 2) + Math.pow((z - s[1]) / s[3], 2); if (q < 2.2) h = Math.max(h, WATER_Y - 1.4 + 2.2 * Math.exp(-q * 1.6) * (0.8 + 0.4 * fbm(x * 0.03, z * 0.03, 3)));
  }
  const fb = smooth(RIVER.z1 - 80, RIVER.z1 + 40, z);                             // 对岸
  if (fb > 0) h = lerp(h, WATER_Y + 1.2 + smooth(RIVER.z1 + 40, RIVER.z1 + 600, z) * (24 + 60 * fbm(x * 0.004, z * 0.004 + 7, 4)), fb);
  const mf = smooth(RIVER.z1 + 700, 3600, z) * 0.75, mb = smooth(450, 1700, -z), ms = smooth(1100, 2600, ax) * 0.5, m = Math.max(mf, mb, ms);
  if (m > 0) {                                                                    // 楼后是高大的中条山，河对岸是一抹远山
    const big = ridged(x * 0.0007 + 5, z * 0.0007 + 2, 4), mid = ridged(x * 0.0028 + 40, z * 0.0028 + 9, 4), fine = ridged(x * 0.011, z * 0.011 + 70, 3);
    h += m * (40 + 640 * big * big + 180 * mid * (0.3 + big) + 30 * fine * (0.2 + big));
  }
  return h;
}
(function () {
  const N = 330, S = 1500, a = 0.22, warp = u => S * (a * u + (1 - a) * u * u * u * u * u);
  const g = new T.PlaneGeometry(2, 2, N, N); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, uv = g.attributes.uv, col = new Float32Array(p.count * 3), c = new T.Color(), c2 = new T.Color();
  const PAL = { floor: 0x6a5e3c, meadow: 0x5a6230, dry: 0x8e7c50, sand: 0x9a8662, wet: 0x5e4a32, rock: 0x6e6250, far: 0x4e5a3a, farHi: 0x6a6a52 };
  for (let i = 0; i < p.count; i++) {
    const x = warp(p.getX(i)), z = warp(p.getZ(i)) + 120, h = groundH(x, z); p.setXYZ(i, x, h, z); uv.setXY(i, x / 7, z / 7);
    const e = 3, sl = Math.hypot(groundH(x + e, z) - h, groundH(x, z + e) - h) / e, n = fbm(x * 0.02 + 40, z * 0.02, 4), n2 = fbm(x * 0.09, z * 0.09 + 20, 3);
    c.set(PAL.floor).lerp(c2.set(PAL.meadow), smooth(0.42, 0.64, n)).lerp(c2.set(PAL.dry), smooth(0.6, 0.85, n2) * 0.45);
    c.lerp(c2.set(PAL.rock), smooth(0.55, 1.1, sl));
    if (h < WATER_Y + 3) c.lerp(c2.set(PAL.sand), smooth(WATER_Y + 3, WATER_Y + 1.0, h));
    if (h < WATER_Y + 0.6) c.lerp(c2.set(PAL.wet), smooth(WATER_Y + 0.6, WATER_Y - 0.2, h));
    if (h > 40) c.lerp(c2.set(PAL.far).lerp(new T.Color(PAL.farHi), smooth(160, 420, h)), smooth(40, 120, h));
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new T.BufferAttribute(col, 3)); g.computeVertexNormals();
  const dh = pixelCanvas(256, 256, (u, v) => { const k = 255 * fbm(u * 24, v * 24, 4, 24); return [k, k, k]; });
  const dc = pixelCanvas(256, 256, (u, v) => { const k = 190 + 65 * fbm(u * 32 + 5, v * 32, 4, 32), m = fbm(u * 8, v * 8 + 3, 3, 8); return [k * (0.97 + 0.1 * m), k * 0.96, k * (0.86 - 0.1 * m)]; });
  const mat = new T.MeshStandardMaterial({ vertexColors: true, map: texFrom(dc), normalMap: normalFromCanvas(dh, 2.2), roughness: 0.96, envMapIntensity: 0.45 });
  const m = new T.Mesh(g, mat); m.receiveShadow = true; m.frustumCulled = false; scene.add(m);
  const NR = 54, NA = 720, R0 = 1380, R1 = 11000, rp = [], rc = [], ri = [], ruv = [];
  for (let j = 0; j <= NR; j++) { const rr = R0 * Math.pow(R1 / R0, j / NR);
    for (let i = 0; i <= NA; i++) { const an = i / NA * Math.PI * 2, x = Math.cos(an) * rr, z = Math.sin(an) * rr + 120, h = groundH(x, z) - 2.5 * (1 - smooth(1500, 2100, rr));
      rp.push(x, h, z); ruv.push(x / 60, z / 60);
      const sl = Math.abs(groundH(x + 12, z) - groundH(x, z)) / 12 + Math.abs(groundH(x, z + 12) - groundH(x, z)) / 12, n = fbm(x * 0.004, z * 0.004, 3);
      c.set(PAL.floor).lerp(c2.set(PAL.meadow), n * 0.6).lerp(c2.set(PAL.far), smooth(30, 120, h)).lerp(c2.set(PAL.rock), smooth(0.5, 1.2, sl) * 0.8).lerp(c2.set(PAL.farHi), smooth(240, 700, h));
      if (h < WATER_Y + 3) c.lerp(c2.set(PAL.sand), smooth(WATER_Y + 3, WATER_Y + 1.0, h));
      rc.push(c.r, c.g, c.b); } }
  for (let j = 0; j < NR; j++) for (let i = 0; i < NA; i++) { const a0 = j * (NA + 1) + i, b0 = a0 + 1, c0 = a0 + NA + 1, d0 = c0 + 1; ri.push(a0, c0, b0, b0, c0, d0); }
  const rg = new T.BufferGeometry(); rg.setAttribute('position', new T.Float32BufferAttribute(rp, 3)); rg.setAttribute('color', new T.Float32BufferAttribute(rc, 3)); rg.setAttribute('uv', new T.Float32BufferAttribute(ruv, 2)); rg.setIndex(ri); rg.computeVertexNormals();
  const ring = new T.Mesh(rg, new T.MeshStandardMaterial({ vertexColors: true, normalMap: mat.normalMap, normalScale: new T.Vector2(1.6, 1.6), roughness: 1, envMapIntensity: 0.4, side: T.DoubleSide })); ring.frustumCulled = false; scene.add(ring);

  // 楼前石板广场，和一条通到黄河边的神道
  const pc = makeCanvas(512, 512, function (cx, w, h) {
    cx.fillStyle = '#857c68'; cx.fillRect(0, 0, w, h); const r = rng(4);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const k = 124 + r() * 34 | 0; cx.fillStyle = 'rgb(' + k + ',' + (k - 4) + ',' + (k - 16) + ')'; cx.fillRect(x * 64 + (y % 2) * 32 - 32, y * 64, 62, 62); cx.fillRect(x * 64 + (y % 2) * 32 + 480, y * 64, 62, 62); }
    for (let i = 0; i < 2600; i++) { cx.fillStyle = 'rgba(70,60,40,' + r() * 0.12 + ')'; cx.fillRect(r() * w, r() * h, 2 + r() * 3, 2 + r() * 3); }
  });
  const plazaW = 120, plazaZ0 = -64, plazaZ1 = 52;
  const pl = new T.Mesh(new T.PlaneGeometry(plazaW, plazaZ1 - plazaZ0), new T.MeshStandardMaterial({ map: texFrom(pc, true, [plazaW / 4, (plazaZ1 - plazaZ0) / 4]), roughness: 0.86, envMapIntensity: 0.5 }));
  pl.rotation.x = -Math.PI / 2; pl.position.set(0, 0.06, (plazaZ0 + plazaZ1) / 2); pl.receiveShadow = true; scene.add(pl);
  const pathL = RIVER.z0 - 60 - plazaZ1, path = new T.Mesh(new T.PlaneGeometry(14, pathL, 1, 24), new T.MeshStandardMaterial({ map: texFrom(pc, true, [3.5, pathL / 4]), roughness: 0.88, envMapIntensity: 0.45 }));
  path.rotation.x = -Math.PI / 2; const pp = path.geometry.attributes.position;
  for (let i = 0; i < pp.count; i++) { const z = plazaZ1 + pathL / 2 - pp.getY(i); pp.setZ(i, groundH(pp.getX(i), z) + 0.08 - 0.0); }
  path.geometry.computeVertexNormals(); path.position.set(0, 0, plazaZ1 + pathL / 2); path.receiveShadow = true; scene.add(path);
})();

/* ============================== 黄河 ============================== */
const waterN = normalFromCanvas(pixelCanvas(512, 512, (u, v) => { const k = 255 * (0.6 * fbm(u * 6, v * 6, 5, 6) + 0.4 * fbm(u * 14 + 3, v * 14, 4, 14)); return [k, k, k]; }), 5);
(function () {
  const geo = new T.PlaneGeometry(30000, 30000);
  if (T.Water) {                                                    // 黄河水含沙多，颜色浑黄、反光也比湖水弱
    water = new T.Water(geo, { textureWidth: H.Q.refl || 256, textureHeight: H.Q.refl || 256, waterNormals: waterN, sunDirection: V3(0, 1, 0), sunColor: 0xffffff, waterColor: 0x5a4426, distortionScale: 3.2, fog: true });
    water.rotation.x = -Math.PI / 2; water.position.y = WATER_Y; water.material.uniforms.size.value = 2.2; scene.add(water);
  }
  const ln = waterN.clone(); ln.needsUpdate = true; ln.repeat.set(700, 700);
  waterLow = new T.Mesh(geo, new T.MeshStandardMaterial({ color: 0x7a6038, roughness: 0.32, metalness: 0.15, normalMap: ln, normalScale: new T.Vector2(0.6, 0.6), envMapIntensity: 1.0 }));
  waterLow.rotation.x = -Math.PI / 2; waterLow.position.y = WATER_Y; waterLow.userData.n = ln; scene.add(waterLow);
  silt = new T.Mesh(new T.PlaneGeometry(30000, 30000), new T.MeshBasicMaterial({ color: 0x8a6a3a, transparent: true, opacity: 0.42, depthWrite: false }));   // 一层浑黄的泥沙色，压住天空的倒影
  silt.rotation.x = -Math.PI / 2; silt.position.y = WATER_Y + 0.03; silt.renderOrder = 1; scene.add(silt);
})();

/* ============================== 蒲津渡铁牛：唐朝铸来拴黄河浮桥的大铁牛 ============================== */
(function () {
  const iron = new T.MeshStandardMaterial({ color: 0x6a4a34, roughness: 0.66, metalness: 0.45, envMapIntensity: 0.9 });
  const g0 = [];
  const body = new T.SphereGeometry(1, 20, 14); body.scale(0.85, 0.78, 1.7); body.translate(0, 1.25, 0); g0.push(body);
  const hump = new T.SphereGeometry(0.6, 12, 10); hump.scale(1, 0.7, 1.1); hump.translate(0, 1.85, 0.75); g0.push(hump);
  const head = new T.SphereGeometry(0.5, 14, 10); head.scale(0.85, 0.85, 1.25); head.translate(0, 1.35, 1.95); g0.push(head);
  const nose = new T.CylinderGeometry(0.36, 0.4, 0.4, 12); nose.rotateX(Math.PI / 2); nose.translate(0, 1.15, 2.5); g0.push(nose);
  for (const s of [-1, 1]) { const horn = H.tubeGeo([[s * 0.3, 1.7, 1.85], [s * 0.75, 1.95, 1.8], [s * 0.85, 2.3, 2.0]], 0.09, 6); g0.push(horn);
    for (const z of [-0.9, 0.9]) { const leg = new T.CylinderGeometry(0.2, 0.24, 1.0, 8); leg.translate(s * 0.48, 0.5, z); g0.push(leg); } }
  const tail = H.tubeGeo([[0, 1.45, -1.65], [0, 1.0, -1.9], [0.1, 0.45, -1.85]], 0.06, 5); g0.push(tail);
  const oxGeo = mergeGeos(g0.map(g => { if (g.attributes.uv) g.deleteAttribute('uv'); return g; }));
  const g1 = [];                                                                        // 铁人：站在牛旁边拉着绳
  const tor = new T.CylinderGeometry(0.28, 0.38, 1.2, 10); tor.translate(0, 1.5, 0); g1.push(tor);
  const hd = new T.SphereGeometry(0.22, 12, 10); hd.translate(0, 2.3, 0); g1.push(hd);
  for (const s of [-1, 1]) { const lg = new T.CylinderGeometry(0.13, 0.15, 0.95, 8); lg.translate(s * 0.16, 0.48, 0); g1.push(lg); const ar = new T.CylinderGeometry(0.08, 0.09, 0.8, 6); ar.rotateX(-1.0); ar.translate(s * 0.3, 1.65, 0.3); g1.push(ar); }
  const manGeo = mergeGeos(g1.map(g => { g.deleteAttribute('uv'); return g; }));
  const stoneM = H.tower.M.stone, grp = new T.Group(); grp.position.set(OXEN.x, groundH(OXEN.x, OXEN.z) - 0.2, OXEN.z); scene.add(grp);
  const pit = new T.Mesh(new T.BoxGeometry(34, 0.5, 11), stoneM); pit.position.y = 0.05; grp.add(pit);
  for (let i = 0; i < 4; i++) {                                                         // 四头铁牛一字排开，牛头朝着黄河
    const x = -12 + i * 8, ox = new T.Mesh(oxGeo, iron); ox.position.set(x, 0.3, -0.5); ox.rotation.y = (i - 1.5) * 0.04; grp.add(ox);
    const man = new T.Mesh(manGeo, iron); man.position.set(x + 2.3, 0.3, 0.6); man.rotation.y = -0.4; grp.add(man);
    const pillar = new T.Mesh(new T.CylinderGeometry(0.22, 0.22, 2.6, 8), iron); pillar.position.set(x, 1.6, -3.2); grp.add(pillar);
    const rope = new T.Mesh(H.tubeGeo([[x, 1.4, 2.4], [x + 1.2, 1.2, 1.4], [x + 2.2, 1.7, 0.9]], 0.05, 4), new T.MeshStandardMaterial({ color: 0x5a4a32, roughness: 0.9 })); grp.add(rope);
  }
  grp.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
})();

/* ============================== 林木 ============================== */
const leafTex = canvasTex(512, 512, function (g, w, h) {
  g.clearRect(0, 0, w, h); const r = rng(31);
  for (let cell = 0; cell < 4; cell++) {
    const cx = (cell % 2) * 256 + 128, cy = (cell >> 1) * 256 + 128;
    if (cell < 2) for (let i = 0; i < 260; i++) {
      const a = r() * 6.283, d = Math.pow(r(), 0.6) * 108, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.94, k = 150 + r() * 105 | 0;
      g.save(); g.translate(x, y); g.rotate(r() * 6.283); g.fillStyle = 'rgb(' + k + ',' + k + ',' + k + ')'; g.beginPath(); g.ellipse(0, 0, 8 + r() * 8, 3.5 + r() * 4, 0, 0, 7); g.fill(); g.restore();
    } else for (let i = 0; i < 44; i++) {
      const a = r() * 6.283, d = Math.pow(r(), 0.7) * 92, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
      for (let j = 0; j < 26; j++) { const b = r() * 6.283, l = 12 + r() * 16, k = 140 + r() * 115 | 0; g.strokeStyle = 'rgb(' + k + ',' + k + ',' + k + ')'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(b) * l, y + Math.sin(b) * l); g.stroke(); }
    }
  }
});
function swayPatch(mat, amp) {
  mat.onBeforeCompile = function (sh) {
    sh.uniforms.uTime = H.uTime;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      #ifdef USE_INSTANCING
        float ph = instanceMatrix[3].x * 0.21 + instanceMatrix[3].z * 0.17;
      #else
        float ph = 0.0;
      #endif
      float sw = position.y * position.y * ${amp.toFixed(3)};
      transformed.x += sin(uTime * 1.1 + ph + position.y * 3.0) * sw + sin(uTime * 2.9 + ph * 1.7 + position.x * 11.0) * sw * 0.25;
      transformed.z += cos(uTime * 0.9 + ph * 1.3) * sw * 0.8;`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', T.ShaderChunk.normal_fragment_begin.replace(/normal\s*=\s*normal\s*\*\s*faceDirection;|normal\s*\*=\s*faceDirection;/g, ''));
  };
  return mat;
}
const leafMat = swayPatch(new T.MeshStandardMaterial({ map: leafTex, alphaTest: 0.3, alphaToCoverage: true, side: T.DoubleSide, vertexColors: true, roughness: 0.88, envMapIntensity: 0.55 }), 0.014);
const leafDepth = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking, map: leafTex, alphaTest: 0.42 });
const barkMat = new T.MeshStandardMaterial({ color: 0x3a3026, roughness: 0.95, envMapIntensity: 0.3 });
function makeTree(seed, kind) {
  const r = rng(seed), pos = [], nor = [], uv = [], col = [], idx = [], trunk = [];
  const card = (cx, cy, cz, nx, ny, nz, s, cell, center, bright) => {
    const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
    let ux = -nz, uy = 0, uz = nx; const ul = Math.hypot(ux, uz) || 1; ux /= ul; uz /= ul; if (ul < 0.01) { ux = 1; uz = 0; }
    const vx = ny * uz - nz * uy, vy = nz * ux - nx * uz, vz = nx * uy - ny * ux, b = pos.length / 3, u0 = (cell % 2) * 0.5, v0 = cell < 2 ? 0.5 : 0;
    for (const q of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const px = cx + (ux * q[0] + vx * q[1]) * s, py = cy + (uy * q[0] + vy * q[1]) * s, pz = cz + (uz * q[0] + vz * q[1]) * s; pos.push(px, py, pz);
      let ox = px - center[0], oy = py - center[1] + 0.12, oz = pz - center[2]; const ol = Math.hypot(ox, oy, oz) || 1; nor.push(ox / ol, oy / ol, oz / ol);
      uv.push(u0 + (q[0] * 0.5 + 0.5) * 0.5, v0 + (q[1] * 0.5 + 0.5) * 0.5); col.push(bright, bright, bright);
    }
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  };
  if (kind === 'pine') {
    const th = new T.CylinderGeometry(0.006, 0.02, 0.92, 7); th.translate(0, 0.46, 0); trunk.push(th);
    for (let L = 0; L < 6; L++) {
      const y = 0.38 + L * 0.11, rad = 0.36 * (1 - L / 7.2) * (0.8 + 0.4 * r()), ox = (r() - 0.5) * 0.16, oz = (r() - 0.5) * 0.16, n = 13 - L;
      const br = new T.CylinderGeometry(0.003, 0.007, rad * 1.1, 4); br.rotateZ(Math.PI / 2); br.rotateY(r() * 3); br.translate(ox, y - 0.01, oz); trunk.push(br);
      for (let i = 0; i < n; i++) { const a = i / n * 6.283 + r(), d = rad * (0.35 + 0.65 * r()); card(ox + Math.cos(a) * d, y + (r() - 0.5) * 0.03, oz + Math.sin(a) * d, (r() - 0.5) * 0.6, 1, (r() - 0.5) * 0.6, 0.12 + r() * 0.05, 2 + (i & 1), [ox, y - 0.14, oz], 0.62 + 0.38 * (L / 5)); }
    }
  } else if (kind === 'poplar') {                                    // 白杨：北方黄土地上最常见的树，又高又直
    const th = new T.CylinderGeometry(0.008, 0.02, 0.95, 7); th.translate(0, 0.475, 0); trunk.push(th);
    for (let i = 0; i < 70; i++) {
      const y = 0.32 + r() * 0.62, w = 0.13 * Math.sin(Math.PI * (y - 0.28) / 0.72) + 0.02, a = r() * 6.283, d = w * (0.5 + 0.5 * r());
      card(Math.cos(a) * d, y, Math.sin(a) * d, Math.cos(a), (r() - 0.3) * 0.8, Math.sin(a), 0.07 + r() * 0.04, i & 1, [0, y, 0], 0.55 + 0.45 * (y - 0.3) / 0.65);
    }
  } else {
    const th = new T.CylinderGeometry(0.011, 0.024, 0.46, 7); th.translate(0, 0.23, 0); trunk.push(th);
    const blobs = []; const nb = 5 + (r() * 3 | 0);
    for (let i = 0; i < nb; i++) { const a = r() * 6.283, d = i ? 0.14 + r() * 0.16 : 0; blobs.push([Math.cos(a) * d, 0.48 + r() * 0.3, Math.sin(a) * d, 0.2 + r() * 0.1]);
      const br = new T.CylinderGeometry(0.004, 0.009, 0.34, 4), bb = blobs[i]; br.translate(0, 0.17, 0); br.rotateZ(-Math.atan2(Math.hypot(bb[0], bb[2]), 0.3) * Math.cos(a)); br.rotateX(Math.atan2(Math.hypot(bb[0], bb[2]), 0.3) * Math.sin(a)); br.translate(0, 0.34, 0); trunk.push(br); }
    for (let i = 0; i < 78; i++) {
      const bl = blobs[i % nb], u = r() * 2 - 1, a = r() * 6.283, sq = Math.sqrt(1 - u * u), dx = sq * Math.cos(a), dy = u * 0.8 + 0.2, dz = sq * Math.sin(a), rr = bl[3] * (0.55 + 0.5 * r());
      const px = bl[0] + dx * rr, py = bl[1] + dy * rr, pz = bl[2] + dz * rr, depth = clamp((py - 0.36) / 0.55, 0, 1), out = clamp(Math.hypot(px, pz) / 0.4, 0, 1);
      card(px, py, pz, dx + (r() - 0.5) * 0.9, dy + (r() - 0.5) * 0.9, dz + (r() - 0.5) * 0.9, 0.125 + r() * 0.07, i & 1, [0, 0.55, 0], 0.55 + 0.45 * Math.max(depth, out * 0.8));
    }
  }
  const f = new T.BufferGeometry();
  f.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); f.setAttribute('normal', new T.Float32BufferAttribute(nor, 3)); f.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); f.setAttribute('color', new T.Float32BufferAttribute(col, 3)); f.setIndex(idx);
  return { leaf: f, trunk: mergeGeos(trunk) };
}
const forests = [];
(function () {
  const kinds = { leafA: makeTree(1, 'leaf'), leafB: makeTree(2, 'leaf'), leafC: makeTree(3, 'leaf'), pine: makeTree(4, 'pine'), poplar: makeTree(6, 'poplar') }, lists = {}; Object.keys(kinds).forEach(k => lists[k] = []);
  const c = new T.Color(), c2 = new T.Color(), BX = H.tower.BASE.hx + 6, BZ = H.tower.BASE.hz + 6;
  function plant(x, z, kind, scale) {
    const y = groundH(x, z); if (y < WATER_Y + 1.2 || y > 220) return;
    if (Math.abs(x) < BX && z > -BZ && z < H.tower.BASE.stairEnd + 4) return;      // 台基与台阶
    if (Math.abs(x) < 62 && z > -66 && z < 54) return;                              // 广场
    if (Math.abs(x) < 10 && z > 0 && z < RIVER.z0) return;                          // 神道
    if (Math.abs(x) < 75 && z > 50 && z < 150) return;                                // 楼前留一片开阔的草坪
    if (Math.abs(x - OXEN.x) < 45 && Math.abs(z - OXEN.z) < 30) return;            // 铁牛四周留空
    let k = kind; if (k === 'leaf') k = ['leafA', 'leafB', 'leafC'][rand() * 3 | 0];
    if (k === 'pine') c.set(0x2b4a3a).lerp(c2.set(0x3f5f42), rand());
    else if (k === 'poplar') c.set(0x5a7a3a).lerp(c2.set(0x8a9a52), rand());
    else c.set(0x4e6a2e).lerp(c2.set(0x82984a), rand()).lerp(c2.set(0x3a542f), rand() * 0.55);
    const s = (k === 'pine' ? 12 + rand() * 7 : k === 'poplar' ? 16 + rand() * 8 : 10 + rand() * 6) * (scale || 1);
    lists[k].push([x, y - 0.15, z, s * (0.95 + rand() * 0.3), s, rand() * 6.283, c.getHex()]);
  }
  for (let i = 0; i < 6000; i++) {                                 // 楼四周的园林与台塬上的林子
    const x = (rand() - 0.5) * 1400, z = -700 + rand() * (RIVER.z0 + 680);
    const dens = fbm(x * 0.012 + 3, z * 0.012 + 8, 3); if (dens < 0.4) continue;
    plant(x, z, rand() < 0.15 ? 'pine' : rand() < 0.35 ? 'poplar' : 'leaf', 0.85);
  }
  for (let i = 0; i < 70; i++) { const s = rand() < 0.5 ? -1 : 1; plant(s * (12 + rand() * 6), 56 + rand() * (RIVER.z0 - 120), 'poplar', 0.9); }   // 神道两旁的白杨
  for (let i = 0; i < 900; i++) { const x = (rand() - 0.5) * 2600; plant(x, RIVER.z0 - 80 + rand() * 40, rand() < 0.6 ? 'poplar' : 'leaf'); }            // 河岸防护林
  for (let i = 0; i < 1600; i++) { const x = (rand() - 0.5) * 3000, z = RIVER.z1 + 40 + rand() * 500; plant(x, z, rand() < 0.4 ? 'poplar' : 'leaf', 1.1); }  // 对岸
  const d = new T.Object3D(), col = new T.Color();
  Object.keys(kinds).forEach(function (k) {
    const L = lists[k]; if (!L.length) return;
    const leaf = new T.InstancedMesh(kinds[k].leaf, leafMat, L.length), trunk = new T.InstancedMesh(kinds[k].trunk, barkMat, L.length);
    L.forEach((t, i) => { d.position.set(t[0], t[1], t[2]); d.scale.set(t[3], t[4], t[3]); d.rotation.set(0, t[5], 0); d.updateMatrix(); leaf.setMatrixAt(i, d.matrix); trunk.setMatrixAt(i, d.matrix); leaf.setColorAt(i, col.set(t[6])); });
    leaf.customDepthMaterial = leafDepth; leaf.castShadow = trunk.castShadow = true; leaf.receiveShadow = true; leaf.frustumCulled = trunk.frustumCulled = false;
    leaf.userData.full = trunk.userData.full = L.length; scene.add(leaf, trunk); forests.push(leaf, trunk);
  });
})();

/* ============================== 芳草与河滩芦苇 ============================== */
let grass = null;
(function () {
  const gt = canvasTex(256, 128, function (g, w, h) { g.clearRect(0, 0, w, h); const r = rng(8); for (let i = 0; i < 90; i++) { const x = 8 + r() * (w - 16), hh = (36 + r() * 88) * (1 - 0.7 * Math.pow(x / w * 2 - 1, 2)), k = 130 + r() * 125 | 0, b = (r() - 0.5) * 30; g.strokeStyle = 'rgb(' + k + ',' + k + ',' + k + ')'; g.lineWidth = 1.5 + r() * 2; g.beginPath(); g.moveTo(x, h); g.quadraticCurveTo(x + b * 0.3, h - hh * 0.6, x + b, h - hh); g.stroke(); } });
  const q = (ry) => { const p = new T.PlaneGeometry(1, 1, 1, 2); p.translate(0, 0.5, 0); p.rotateY(ry); return p; };
  const geo = mergeGeos([q(0), q(Math.PI / 2.6), q(-Math.PI / 2.6)]), n = geo.attributes.position.count, col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const k = 0.35 + 0.65 * geo.attributes.position.getY(i); col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = k; geo.attributes.normal.setXYZ(i, 0, 1, 0); }
  geo.setAttribute('color', new T.BufferAttribute(col, 3));
  const mat = swayPatch(new T.MeshStandardMaterial({ map: gt, alphaTest: 0.3, alphaToCoverage: true, side: T.DoubleSide, vertexColors: true, roughness: 0.95, envMapIntensity: 0.4 }), 0.16);
  const L = [], c = new T.Color(), c2 = new T.Color();
  const put = (x, z, s, reed) => { const y = groundH(x, z); if (y < WATER_Y + 0.2) return; if (Math.abs(x) < 62 && z > -66 && z < 54) return; if (Math.abs(x) < 8 && z > 0 && z < RIVER.z0) return;
    if (reed) c.set(0x9a9258).lerp(c2.set(0xc8b878), rand()); else c.set(0x55682c).lerp(c2.set(0x9a9a4a), rand() * rand()); L.push([x, y - 0.05, z, s, c.getHex()]); };
  for (let i = 0; i < 9000; i++) { const x = (rand() - 0.5) * 320, z = -160 + rand() * (RIVER.z0 + 100); put(x, z, 0.5 + rand() * 0.6); }
  for (let i = 0; i < 7000; i++) { const x = (rand() - 0.5) * 1200, z = RIVER.z0 - 30 + rand() * 45; put(x, z, 1.1 + rand() * 1.3, true); }    // 黄河滩上的芦苇
  grass = new T.InstancedMesh(geo, mat, L.length); const d = new T.Object3D();
  L.forEach((t, i) => { d.position.set(t[0], t[1], t[2]); d.scale.set(t[3] * 2.0, t[3], t[3] * 2.0); d.rotation.set(0, rand() * 6.283, 0); d.updateMatrix(); grass.setMatrixAt(i, d.matrix); grass.setColorAt(i, c.set(t[4])); });
  grass.receiveShadow = true; grass.frustumCulled = false; grass.userData.full = L.length; scene.add(grass);
})();

/* ============================== 白鹳：鹳雀楼名字里的“鹳雀”，白身子、黑翅尖、红嘴红腿 ============================== */
const cranes = [], STORK_C = V3(0, 0, 10);
(function () {
  const mat = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, side: T.DoubleSide, envMapIntensity: 0.6 });
  const WH = [0.96, 0.96, 0.94], BK = [0.05, 0.05, 0.06], RD = [0.78, 0.12, 0.1], DK = [0.12, 0.12, 0.13];
  const paint = (g, f) => { const n = g.attributes.position.count, a = new Float32Array(n * 3), p = g.attributes.position; for (let i = 0; i < n; i++) { const c = f(p.getX(i), p.getY(i), p.getZ(i)); a[i * 3] = c[0]; a[i * 3 + 1] = c[1]; a[i * 3 + 2] = c[2]; } g.setAttribute('color', new T.BufferAttribute(a, 3)); return g; };
  const body = new T.LatheGeometry([[0.001, -0.6], [0.07, -0.5], [0.18, -0.22], [0.2, 0.05], [0.16, 0.3], [0.08, 0.45]].map(p => new T.Vector2(p[0], p[1])), 12); body.rotateX(Math.PI / 2);
  const neck = H.tubeGeo([[0, 0.02, 0.4], [0, 0.12, 0.65], [0, 0.14, 0.9]], 0.06, 6);
  const head = new T.SphereGeometry(0.1, 10, 8); head.scale(1, 1, 1.25); head.translate(0, 0.14, 0.98);
  const beak = new T.ConeGeometry(0.035, 0.42, 6); beak.rotateX(Math.PI / 2); beak.translate(0, 0.12, 1.28);
  const legs = []; for (const s of [-1, 1]) { const l = new T.CylinderGeometry(0.018, 0.018, 0.9, 4); l.rotateX(Math.PI / 2); l.translate(s * 0.05, -0.05, -0.95); legs.push(paint(l, () => RD)); }
  const bodyGeo = mergeGeos([paint(body, () => WH), paint(neck, () => WH), paint(head, () => WH), paint(beak, () => RD)].concat(legs).map(g => { if (g.attributes.uv) g.deleteAttribute('uv'); return g; }));
  const wing = (x0, x1, c0, c1, outer) => paint(gridGeo(6, 3, (u, v) => { const x = lerp(x0, x1, u), ch = lerp(c0, c1, u) * (outer ? 1 - 0.3 * Math.pow(u, 2) : 1); return [x - x0, 0.03 * Math.sin(v * Math.PI) - (outer ? 0.05 * u * u : 0), 0.2 - v * ch, u, v]; }),
    (x, y, z) => z < 0.2 - (outer ? 0.22 : 0.3) ? BK : (outer && x > 0.55 ? DK : WH));     // 后缘的飞羽是黑的
  const inner = wing(0.12, 0.9, 0.5, 0.46, false), outerG = wing(0.9, 2.0, 0.46, 0.26, true);
  for (let i = 0; i < 12; i++) {
    const g = new T.Group(); g.add(new T.Mesh(bodyGeo, mat)); const W = [];
    for (const s of [1, -1]) { const a = new T.Group(), b = new T.Group(); a.position.set(0.12 * s, 0.06, 0.1); a.scale.x = s; a.add(new T.Mesh(inner, mat)); b.position.set(0.78, 0, 0); b.add(new T.Mesh(outerG, mat)); a.add(b); g.add(a); W.push([a, b, s]); }
    g.scale.setScalar(1.6); g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    g.userData = { W, R: 34 + rand() * 70, h: TY + 26 + rand() * 40, w: (0.07 + rand() * 0.06) * (i % 3 ? 1 : -1), ph: rand() * 6.283, fl: 3.2 + rand() * 1.2 };
    scene.add(g); cranes.push(g);
  }
})();

/* ============================== 河上的木船 ============================== */
const boats = [];
(function () {
  const hullM = new T.MeshStandardMaterial({ color: 0x4a3322, roughness: 0.8, side: T.DoubleSide, envMapIntensity: 0.4 }), deckM = new T.MeshStandardMaterial({ color: 0x7a6248, roughness: 0.9, side: T.DoubleSide });
  const sailT = canvasTex(256, 512, function (g, w, h) { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#cdbd98'); gr.addColorStop(0.5, '#e3d6b6'); gr.addColorStop(1, '#bfae88'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const r = rng(12); for (let i = 0; i < 1500; i++) { g.fillStyle = 'rgba(90,70,40,' + r() * 0.08 + ')'; g.fillRect(r() * w, r() * h, 1 + r() * 30, 1); }
    g.fillStyle = '#5a4630'; for (let y = 20; y < h; y += 58) g.fillRect(0, y, w, 6); });
  const sailM = new T.MeshStandardMaterial({ map: sailT, roughness: 0.9, side: T.DoubleSide, envMapIntensity: 0.5 });
  const hw = u => 1.7 * (1 - 0.86 * Math.pow(Math.abs(u), 2.4)), top = u => 1.0 + 1.0 * u * u, U = u => u * 2 - 1;
  const hull = gridGeo(18, 8, (u, v) => { const t = U(u), a = Math.PI * v; return [Math.cos(a) * hw(t), top(t) - Math.sin(a) * (1.25 - 0.5 * t * t), t * 7, u, v]; });
  const deck = gridGeo(18, 1, (u, v) => { const t = U(u); return [(v - 0.5) * 2 * hw(t) * 0.94, top(t) - 0.2, t * 7, u, v]; });
  const cabin = gridGeo(6, 8, (u, v) => { const a = Math.PI * v; return [Math.cos(a) * 1.15, 0.85 + Math.sin(a) * 1.15, lerp(-4.2, -0.6, u), u * 3, v]; });
  const mast = new T.CylinderGeometry(0.09, 0.13, 11, 6); mast.translate(0, 6.2, 1.2);
  const sail = gridGeo(4, 9, (u, v) => { const b = Math.sin(v * Math.PI) * 0.9 * Math.sin(u * Math.PI * 0.9 + 0.2); return [b + 0.15, 2.2 + v * 9, 1.2 + (u - 0.3) * 6.2 * (0.82 + 0.18 * Math.sin(v * 3)), u, v]; });
  const defs = [[-300, 300, 2.2], [180, 520, -1.6], [520, 760, 1.2], [-640, 640, -1.0], [-120, 960, 0.8]];   // 黄河水急，船顺流快、逆流慢
  defs.forEach(function (d) {
    const g = new T.Group(); g.add(new T.Mesh(hull, hullM), new T.Mesh(deck, deckM), new T.Mesh(cabin, deckM), new T.Mesh(mast, hullM), new T.Mesh(sail, sailM));
    g.traverse(o => { if (o.isMesh) o.castShadow = true; }); g.rotation.y = d[2] > 0 ? Math.PI / 2 : -Math.PI / 2;
    g.position.set(d[0], WATER_Y - 0.55, d[1]); g.userData.v = d[2]; scene.add(g); boats.push(g);
  });
})();

/* ============================== 画质与逐帧更新 ============================== */
function setQuality() {
  const Q = H.Q;
  if (water) water.visible = !!Q.refl; waterLow.visible = !Q.refl || !water;
  forests.forEach(m => m.count = Math.max(1, Math.floor(m.userData.full * Q.trees)));
  grass.count = Math.floor(grass.userData.full * Q.grass); grass.visible = Q.grass > 0;
  if (sun.shadow.mapSize.x !== Q.shadow) { sun.shadow.mapSize.set(Q.shadow, Q.shadow); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
}
function update(dt, time, inside) {
  clock = time; H.uTime.value = time; indoor = lerp(indoor, inside ? 1 : 0, 1 - Math.exp(-dt * 6));
  applyEnv(1 - Math.exp(-dt * 1.7));
  if (env.bakeAt.length && time >= env.bakeAt[0]) { env.bakeAt.shift(); bakeEnv(); }
  sky.position.copy(camera.position);
  const showWater = !inside;
  if (water) { water.visible = showWater && !!H.Q.refl; water.material.uniforms.time.value = time * 0.5; }   // 黄河流得比湖水急
  waterLow.visible = showWater && (!H.Q.refl || !water); silt.visible = showWater; waterLow.userData.n.offset.set(time * 0.012, time * 0.002);
  for (const c of cranes) {
    const u = c.userData, a = u.ph + time * u.w, b = a + Math.sign(u.w) * 0.05;
    c.position.set(STORK_C.x + Math.cos(a) * u.R, u.h + Math.sin(time * 0.25 + u.ph) * 4, STORK_C.z + Math.sin(a) * u.R * 0.8);
    c.lookAt(STORK_C.x + Math.cos(b) * u.R, c.position.y + Math.cos(time * 0.25 + u.ph) * 0.2, STORK_C.z + Math.sin(b) * u.R * 0.8); c.rotateZ(-Math.sign(u.w) * 0.25);
    const amp = 0.2 + 0.8 * smooth(0.45, 0.7, vnoise(time * 0.18 + u.ph, u.ph)), f = time * u.fl + u.ph;          // 白鹳多半在盘旋滑翔，偶尔扇几下翅膀
    for (const w of u.W) { w[0].rotation.z = w[2] * (0.05 + Math.sin(f) * 0.42 * amp); w[1].rotation.z = (-0.06 + Math.sin(f - 1.0) * 0.45 * amp); }
  }
  for (const b of boats) {
    b.position.x += b.userData.v * dt; if (b.position.x > 1400) b.position.x = -1400; if (b.position.x < -1400) b.position.x = 1400;
    b.position.y = WATER_Y - 0.55 + Math.sin(time * 0.9 + b.position.z) * 0.14; b.rotation.z = Math.sin(time * 0.7 + b.position.z) * 0.025;
  }
}
setQuality();
H.world = { WATER_Y, RIVER, OXEN, ZT, groundH, ENV, env, setEnv, snapEnv, update, setQuality, sun, bakeEnv };
})();
