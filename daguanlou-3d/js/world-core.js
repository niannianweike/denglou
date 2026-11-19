/* 登楼课件 · 山水环境工具：天空与时辰、地形网格、水面、林木（阔叶/松/白杨/垂柳/竹）、芳草芦苇、飞鸟、木船、逐帧更新
 * 每座楼的 world.js 先调 W.sky()，再给出 groundH 搭地形，然后种树、放水、放鸟，最后 W.finish() */
(function () {
'use strict';
const H = window.HHL, T = THREE;
const { lerp, clamp, smooth, rng, V3, fbm, vnoise, canvasTex, pixelCanvas, texFrom, normalFromCanvas, gridGeo, mergeGeos } = H;
const scene = H.scene, camera = H.camera, renderer = H.renderer;
const W = {}; let rand = rng(20261115);
const hooks = [], qualityHooks = [];

/* ============================== 天空与时辰 ============================== */
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
    float n = cloud(p), dens = smoothstep(uCover, uCover + 0.3, n), n2 = cloud(p + normalize(uSun.xz + 0.0001) * 0.16);
    float lit = clamp(0.5 + (n - n2) * 3.2, 0.0, 1.0);
    vec3 cc = mix(uCloudDark, uCloudLit, lit * (0.55 + 0.45 * (1.0 - dens))) + uSunCol * pow(sd, 8.0) * 0.45 * uGlow * (1.0 - dens * 0.6);
    float wisp = smoothstep(0.52, 0.9, fbm(p * vec2(0.35, 1.6) + 11.0)) * 0.35, fh = smoothstep(0.012, 0.2, d.y);
    occ = dens * fh; col = mix(col, mix(col, uCloudLit, 0.6), wisp * fh * (1.0 - dens)); col = mix(col, cc, occ * 0.94);
  }
  if (uEnv < 0.5) {
    float disc = smoothstep(0.99955, 0.99985, sd);
    if (uMoon > 0.5) { disc = smoothstep(0.9993, 0.9996, sd); col += uSunCol * disc * uDisc * (1.0 - occ) * (0.75 + 0.25 * noise(d.xy * 260.0)); }
    else col += uSunCol * disc * uDisc * (1.0 - occ * 0.92);
    if (uStars > 0.01 && d.y > 0.0) { vec3 q = d * 210.0, c = floor(q); float r = hash3(c); float s = step(0.9935, r) * smoothstep(0.42, 0.0, length(fract(q) - 0.5)) * (0.6 + 0.4 * sin(uTime * 2.3 + r * 600.0)); col += vec3(0.85, 0.9, 1.0) * s * uStars * 2.4 * (1.0 - occ) * smoothstep(0.0, 0.25, d.y); }
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
scene.fog = new T.FogExp2(0xc2d2dc, 0.0005);
const hemi = new T.HemisphereLight(0xffffff, 0x445533, 0.3); scene.add(hemi);
const sun = new T.DirectionalLight(0xffffff, 3); sun.castShadow = true; sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.06; scene.add(sun, sun.target);
const bounce = new T.DirectionalLight(0xffe6c0, 0.6); bounce.position.set(0, -300, 60); bounce.target.position.set(0, 20, 0); scene.add(bounce, bounce.target);
const C = h => new T.Color(h), D = (x, y, z) => V3(x, y, z).normalize();
const ENV = {
  day: { zenith: C(0x2a62b8), horizon: C(0xc6d8e4), sunCol: C(0xfff0d4), cloudLit: C(0xffffff), cloudDark: C(0x8a98ac), cover: 0.5, stars: 0, disc: 26, glowSky: 1, moon: 0, dir: D(-0.55, 0.62, 0.56), light: C(0xfff1dc), lightI: 3.3, hemiSky: C(0xcfe2ff), hemiGround: C(0x5a5a40), hemiI: 0.32, fog: C(0xbccdd8), fogD: 0.0006, water: C(0x234a4c), glow: 0, exposure: 0.8 },
  dusk: { zenith: C(0x232c63), horizon: C(0xf0934e), sunCol: C(0xff8136), cloudLit: C(0xffb07a), cloudDark: C(0x574966), cover: 0.47, stars: 0.04, disc: 22, glowSky: 2.2, moon: 0, dir: D(-0.5, 0.115, 0.86), light: C(0xff9450), lightI: 3.0, hemiSky: C(0xc9a0c0), hemiGround: C(0x3a2a30), hemiI: 0.42, fog: C(0xd8946a), fogD: 0.00075, water: C(0x2c3040), glow: 0.4, exposure: 0.9 },
  night: { zenith: C(0x02050d), horizon: C(0x0d1832), sunCol: C(0xbccaff), cloudLit: C(0x27325a), cloudDark: C(0x080c1c), cover: 0.56, stars: 1, disc: 5, glowSky: 0.5, moon: 1, dir: D(0.32, 0.3, 0.9), light: C(0x9db2f0), lightI: 0.85, hemiSky: C(0x3a4c82), hemiGround: C(0x10131e), hemiI: 0.7, fog: C(0x0a1124), fogD: 0.00055, water: C(0x070d18), glow: 1, exposure: 1.05 }
};
const COLK = ['zenith', 'horizon', 'sunCol', 'cloudLit', 'cloudDark', 'light', 'hemiSky', 'hemiGround', 'fog', 'water'];
const NUMK = ['cover', 'stars', 'disc', 'glowSky', 'lightI', 'hemiI', 'fogD', 'glow', 'exposure'];
const cloneEnv = e => { const o = {}; COLK.forEach(k => o[k] = e[k].clone()); NUMK.forEach(k => o[k] = e[k]); o.dir = e.dir.clone(); o.moon = e.moon; return o; };
const env = { name: 'day', mist: false, cur: null, tgt: null, bakeAt: [] };
let clock = 0, indoor = 0;
/* 改写时辰参数：o = { day: { horizon: 0x.., dir: [x,y,z], ... }, dusk: {...}, night: {...} }；shadow = 阴影范围 */
W.sky = function (o, shadow) {
  o = o || {};
  for (const k in o) for (const p in o[k]) { const v = o[k][p]; if (p === 'dir') ENV[k].dir = D(v[0], v[1], v[2]); else if (COLK.includes(p)) ENV[k][p] = C(v); else ENV[k][p] = v; }
  const s = shadow || 80; Object.assign(sun.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 60, far: Math.max(900, s * 8) }); sun.shadow.camera.updateProjectionMatrix();
  env.cur = cloneEnv(ENV.day); env.tgt = cloneEnv(ENV.day);
};
function setEnv(name, mist) {
  if (name && ENV[name]) env.name = name; if (mist !== undefined) env.mist = !!mist;
  env.tgt = cloneEnv(ENV[env.name]);
  if (env.mist) { const t = env.tgt; t.horizon.lerp(t.fog, 1); t.cloudLit.lerp(t.fog, 0.55); t.zenith.lerp(t.fog, 0.6); t.cloudDark.lerp(t.fog, 0.6); t.fogD = env.name === 'day' ? (W.mistD || 0.0042) : (W.mistD || 0.0042) * 1.2; t.cover = Math.min(t.cover, 0.44); t.lightI *= 0.7; t.hemiI *= 1.6; }
  env.bakeAt = [clock + 0.5, clock + 1.3, clock + 2.6, clock + 4.2];
}
let water = null, waterLow = null, silt = null;
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
  if (waterLow) waterLow.material.color.copy(c.water).multiplyScalar(2.2);
  if (silt) silt.material.color.copy(c.water).multiplyScalar(1.5).lerp(c.fog, 0.15);
  H.tower.setGlow(c.glow); if (H.interior) H.interior.setTime(c.glow);
  H.exposure = c.exposure;
}
function snapEnv() { env.cur = cloneEnv(env.tgt); applyEnv(1); bakeEnv(); env.bakeAt = []; }

/* ============================== 地形 ============================== */
/* o = { PAL:{floor,meadow,dry,sand,wet,rock,far,farHi}, cx, cz, S, N, waterY, colorFn(c, x, z, h, sl) } */
W.terrain = function (groundH, o) {
  o = o || {}; W.groundH = groundH;
  const N = o.N || 330, S = o.S || 1500, a = 0.22, warp = u => S * (a * u + (1 - a) * u * u * u * u * u), cx = o.cx || 0, cz = o.cz || 70, WY = o.waterY === undefined ? -9 : o.waterY;
  const PAL = Object.assign({ floor: 0x2a3620, meadow: 0x46562e, dry: 0x6a6a40, sand: 0x7a715c, wet: 0x4a4336, rock: 0x625e55, far: 0x35483f, farHi: 0x5a6670 }, o.PAL || {});
  const g = new T.PlaneGeometry(2, 2, N, N); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, uv = g.attributes.uv, col = new Float32Array(p.count * 3), c = new T.Color(), c2 = new T.Color();
  function shade(x, z, h, sl, fine) {
    const n = fbm(x * 0.02 + 40, z * 0.02, 4), n2 = fbm(x * 0.09, z * 0.09 + 20, 3);
    c.set(PAL.floor).lerp(c2.set(PAL.meadow), smooth(0.4, 0.62, n)).lerp(c2.set(PAL.dry), smooth(0.62, 0.85, n2) * 0.3);
    c.lerp(c2.set(PAL.rock), smooth(0.55, 1.1, sl));
    if (h < WY + 3) c.lerp(c2.set(PAL.sand), smooth(WY + 3, WY + 0.9, h));
    if (h < WY + 0.7) c.lerp(c2.set(PAL.wet), smooth(WY + 0.7, WY - 0.2, h));
    if (h > 30) c.lerp(c2.set(PAL.far).lerp(new T.Color(PAL.farHi), smooth(120, 330, h)), smooth(30, 90, h));
    if (o.colorFn) o.colorFn(c, x, z, h, sl);
  }
  for (let i = 0; i < p.count; i++) {
    const x = warp(p.getX(i)) + cx, z = warp(p.getZ(i)) + cz, h = groundH(x, z); p.setXYZ(i, x, h, z); uv.setXY(i, x / 7, z / 7);
    const e = 3, sl = Math.hypot(groundH(x + e, z) - h, groundH(x, z + e) - h) / e; shade(x, z, h, sl);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new T.BufferAttribute(col, 3)); g.computeVertexNormals();
  const dh = pixelCanvas(256, 256, (u, v) => { const k = 255 * fbm(u * 24, v * 24, 4, 24); return [k, k, k]; });
  const dc = pixelCanvas(256, 256, (u, v) => { const k = 190 + 65 * fbm(u * 32 + 5, v * 32, 4, 32), m = fbm(u * 8, v * 8 + 3, 3, 8); return [k * (0.95 + 0.1 * m), k, k * (0.9 - 0.1 * m)]; });
  const mat = new T.MeshStandardMaterial({ vertexColors: true, map: texFrom(dc), normalMap: normalFromCanvas(dh, 2.2), roughness: 0.96, envMapIntensity: 0.45 });
  const m = new T.Mesh(g, mat); m.receiveShadow = true; m.frustumCulled = false; scene.add(m);
  const NR = 54, NA = 720, R0 = 1380, R1 = 11000, rp = [], rc = [], ri = [], ruv = [];
  for (let j = 0; j <= NR; j++) { const rr = R0 * Math.pow(R1 / R0, j / NR);
    for (let i = 0; i <= NA; i++) { const an = i / NA * Math.PI * 2, x = Math.cos(an) * rr + cx, z = Math.sin(an) * rr + cz, h = groundH(x, z) - 2.5 * (1 - smooth(1500, 2100, rr));
      rp.push(x, h, z); ruv.push(x / 60, z / 60);
      const sl = Math.abs(groundH(x + 12, z) - groundH(x, z)) / 12 + Math.abs(groundH(x, z + 12) - groundH(x, z)) / 12; shade(x, z, h, sl); rc.push(c.r, c.g, c.b); } }
  for (let j = 0; j < NR; j++) for (let i = 0; i < NA; i++) { const a0 = j * (NA + 1) + i, b0 = a0 + 1, c0 = a0 + NA + 1, d0 = c0 + 1; ri.push(a0, c0, b0, b0, c0, d0); }
  const rg = new T.BufferGeometry(); rg.setAttribute('position', new T.Float32BufferAttribute(rp, 3)); rg.setAttribute('color', new T.Float32BufferAttribute(rc, 3)); rg.setAttribute('uv', new T.Float32BufferAttribute(ruv, 2)); rg.setIndex(ri); rg.computeVertexNormals();
  const ring = new T.Mesh(rg, new T.MeshStandardMaterial({ vertexColors: true, normalMap: mat.normalMap, normalScale: new T.Vector2(1.6, 1.6), roughness: 1, envMapIntensity: 0.4, side: T.DoubleSide })); ring.frustumCulled = false; scene.add(ring);
  W.terrainMat = mat;
};
/* 贴地的平面（广场、小路）：按地形起伏贴合 */
W.groundPlane = function (tex, x0, x1, z0, z1, lift, rep) {
  const nx = Math.max(1, Math.round((x1 - x0) / 4)), nz = Math.max(1, Math.round((z1 - z0) / 4));
  const g = gridGeo(nx, nz, (u, v) => { const x = lerp(x0, x1, u), z = lerp(z0, z1, v); return [x, W.groundH(x, z) + (lift || 0.06), z, u * (x1 - x0) / (rep || 4), v * (z1 - z0) / (rep || 4)]; });
  const ix = g.index.array; for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; } g.computeVertexNormals();
  const m = new T.Mesh(g, new T.MeshStandardMaterial({ map: tex, roughness: 0.86, envMapIntensity: 0.5 })); m.receiveShadow = true; scene.add(m); return m;
};
W.pavingTex = function (base, seed) {                  // 石板铺地贴图
  const b = new T.Color(base || 0x857c68);
  return canvasTex(512, 512, function (cx, w, h) {
    cx.fillStyle = '#' + b.getHexString(); cx.fillRect(0, 0, w, h); const r = rng(seed || 4);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const k = 0.9 + r() * 0.26; cx.fillStyle = 'rgb(' + (b.r * 255 * k | 0) + ',' + (b.g * 255 * k | 0) + ',' + (b.b * 255 * k | 0) + ')'; cx.fillRect(x * 64 + (y % 2) * 32 - 32, y * 64, 62, 62); cx.fillRect(x * 64 + (y % 2) * 32 + 480, y * 64, 62, 62); }
    for (let i = 0; i < 2600; i++) { cx.fillStyle = 'rgba(60,55,45,' + r() * 0.12 + ')'; cx.fillRect(r() * w, r() * h, 2 + r() * 3, 2 + r() * 3); }
  }, true);
};

/* ============================== 水 ============================== */
const waterN = normalFromCanvas(pixelCanvas(512, 512, (u, v) => { const k = 255 * (0.6 * fbm(u * 6, v * 6, 5, 6) + 0.4 * fbm(u * 14 + 3, v * 14, 4, 14)); return [k, k, k]; }), 5);
let waterSpeed = 0.32;
/* o = { y, color, size, distortion, speed, silt:{color, opacity} } */
W.water = function (o) {
  o = o || {}; const geo = new T.PlaneGeometry(30000, 30000), y = o.y || 0; waterSpeed = o.speed || 0.32;
  if (T.Water) { water = new T.Water(geo, { textureWidth: H.Q.refl || 256, textureHeight: H.Q.refl || 256, waterNormals: waterN, sunDirection: V3(0, 1, 0), sunColor: 0xffffff, waterColor: o.color || 0x21423f, distortionScale: o.distortion || 2.4, fog: true }); water.rotation.x = -Math.PI / 2; water.position.y = y; water.material.uniforms.size.value = o.size || 3.2; scene.add(water); }
  const ln = waterN.clone(); ln.needsUpdate = true; ln.repeat.set(700, 700);
  waterLow = new T.Mesh(geo, new T.MeshStandardMaterial({ color: o.color || 0x2a5450, roughness: 0.16, metalness: 0.35, normalMap: ln, normalScale: new T.Vector2(0.5, 0.5), envMapIntensity: 1.4 })); waterLow.rotation.x = -Math.PI / 2; waterLow.position.y = y; waterLow.userData.n = ln; scene.add(waterLow);
  if (o.silt) { silt = new T.Mesh(new T.PlaneGeometry(30000, 30000), new T.MeshBasicMaterial({ color: o.silt.color || 0x8a6a3a, transparent: true, opacity: o.silt.opacity || 0.4, depthWrite: false })); silt.rotation.x = -Math.PI / 2; silt.position.y = y + 0.03; silt.renderOrder = 1; scene.add(silt); }
};

/* ============================== 林木 ============================== */
const leafTex = canvasTex(512, 512, function (g, w, h) {
  g.clearRect(0, 0, w, h); const r = rng(31);
  for (let cell = 0; cell < 4; cell++) {
    const cx = (cell % 2) * 256 + 128, cy = (cell >> 1) * 256 + 128;
    if (cell < 2) for (let i = 0; i < 260; i++) { const a = r() * 6.283, d = Math.pow(r(), 0.6) * 108, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.94, k = 150 + r() * 105 | 0; g.save(); g.translate(x, y); g.rotate(r() * 6.283); g.fillStyle = 'rgb(' + k + ',' + k + ',' + k + ')'; g.beginPath(); g.ellipse(0, 0, 8 + r() * 8, 3.5 + r() * 4, 0, 0, 7); g.fill(); g.restore(); }
    else if (cell === 2) for (let i = 0; i < 44; i++) { const a = r() * 6.283, d = Math.pow(r(), 0.7) * 92, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d; for (let j = 0; j < 26; j++) { const b = r() * 6.283, l = 12 + r() * 16, k = 140 + r() * 115 | 0; g.strokeStyle = 'rgb(' + k + ',' + k + ',' + k + ')'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(b) * l, y + Math.sin(b) * l); g.stroke(); } }
    else for (let i = 0; i < 70; i++) { const x = cx - 110 + r() * 220, len = 60 + r() * 120, k = 140 + r() * 115 | 0; g.strokeStyle = 'rgb(' + k + ',' + k + ',' + k + ')'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, cy - 120); g.quadraticCurveTo(x + (r() - 0.5) * 20, cy - 120 + len * 0.5, x + (r() - 0.5) * 30, cy - 120 + len); g.stroke(); for (let j = 0; j < 8; j++) { const yy = cy - 120 + r() * len; g.beginPath(); g.ellipse(x + (r() - 0.5) * 8, yy, 2.5, 7, (r() - 0.5) * 0.6, 0, 7); g.fillStyle = g.strokeStyle; g.fill(); } }   // 垂柳枝条
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
W.swayPatch = swayPatch;
const leafMat = swayPatch(new T.MeshStandardMaterial({ map: leafTex, alphaTest: 0.3, alphaToCoverage: true, side: T.DoubleSide, vertexColors: true, roughness: 0.88, envMapIntensity: 0.55 }), 0.014);
const leafDepth = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking, map: leafTex, alphaTest: 0.42 });
const barkMat = new T.MeshStandardMaterial({ color: 0x2c251f, roughness: 0.95, envMapIntensity: 0.3 });
const bambooMat = new T.MeshStandardMaterial({ color: 0x5a7a3a, roughness: 0.6, envMapIntensity: 0.4 });
function makeTree(seed, kind) {
  const r = rng(seed), pos = [], nor = [], uv = [], col = [], idx = [], trunk = [];
  const card = (cx, cy, cz, nx, ny, nz, s, cell, center, bright, sy) => {
    const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
    let ux = -nz, uy = 0, uz = nx; const ul = Math.hypot(ux, uz) || 1; ux /= ul; uz /= ul; if (ul < 0.01) { ux = 1; uz = 0; }
    const vx = ny * uz - nz * uy, vy = nz * ux - nx * uz, vz = nx * uy - ny * ux, b = pos.length / 3, u0 = (cell % 2) * 0.5, v0 = cell < 2 ? 0.5 : 0, s2 = s * (sy || 1);
    for (const q of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const px = cx + ux * q[0] * s + vx * q[1] * s2, py = cy + uy * q[0] * s + vy * q[1] * s2, pz = cz + uz * q[0] * s + vz * q[1] * s2; pos.push(px, py, pz);
      let ox = px - center[0], oy = py - center[1] + 0.12, oz = pz - center[2]; const ol = Math.hypot(ox, oy, oz) || 1; nor.push(ox / ol, oy / ol, oz / ol);
      uv.push(u0 + (q[0] * 0.5 + 0.5) * 0.5, v0 + (q[1] * 0.5 + 0.5) * 0.5); col.push(bright, bright, bright);
    }
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  };
  if (kind === 'pine') {
    const th = new T.CylinderGeometry(0.006, 0.02, 0.92, 7); th.translate(0, 0.46, 0); trunk.push(th);
    for (let L = 0; L < 6; L++) { const y = 0.38 + L * 0.11, rad = 0.36 * (1 - L / 7.2) * (0.8 + 0.4 * r()), ox = (r() - 0.5) * 0.16, oz = (r() - 0.5) * 0.16, n = 13 - L;
      const br = new T.CylinderGeometry(0.003, 0.007, rad * 1.1, 4); br.rotateZ(Math.PI / 2); br.rotateY(r() * 3); br.translate(ox, y - 0.01, oz); trunk.push(br);
      for (let i = 0; i < n; i++) { const a = i / n * 6.283 + r(), d = rad * (0.35 + 0.65 * r()); card(ox + Math.cos(a) * d, y + (r() - 0.5) * 0.03, oz + Math.sin(a) * d, (r() - 0.5) * 0.6, 1, (r() - 0.5) * 0.6, 0.12 + r() * 0.05, 2, [ox, y - 0.14, oz], 0.62 + 0.38 * (L / 5)); } }
  } else if (kind === 'poplar') {
    const th = new T.CylinderGeometry(0.008, 0.02, 0.95, 7); th.translate(0, 0.475, 0); trunk.push(th);
    for (let i = 0; i < 70; i++) { const y = 0.32 + r() * 0.62, w = 0.13 * Math.sin(Math.PI * (y - 0.28) / 0.72) + 0.02, a = r() * 6.283, d = w * (0.5 + 0.5 * r()); card(Math.cos(a) * d, y, Math.sin(a) * d, Math.cos(a), (r() - 0.3) * 0.8, Math.sin(a), 0.07 + r() * 0.04, i & 1, [0, y, 0], 0.55 + 0.45 * (y - 0.3) / 0.65); }
  } else if (kind === 'willow') {                                    // 垂柳：枝条往下垂
    const th = new T.CylinderGeometry(0.014, 0.03, 0.55, 7); th.translate(0, 0.275, 0); th.rotateZ(0.08); trunk.push(th);
    for (let i = 0; i < 60; i++) { const a = r() * 6.283, d = 0.12 + r() * 0.32, y = 0.5 + r() * 0.3; card(Math.cos(a) * d, y - 0.14, Math.sin(a) * d, Math.cos(a), 0.15, Math.sin(a), 0.11 + r() * 0.05, 3, [0, 0.6, 0], 0.6 + 0.4 * r(), 1.9); }
    for (let i = 0; i < 18; i++) { const a = r() * 6.283, d = r() * 0.25; card(Math.cos(a) * d, 0.72 + r() * 0.12, Math.sin(a) * d, (r() - 0.5), 1, (r() - 0.5), 0.12, i & 1, [0, 0.6, 0], 0.8); }
  } else if (kind === 'bamboo') {                                    // 竹丛：细竿 + 竹叶
    for (let i = 0; i < 9; i++) { const a = r() * 6.283, d = r() * 0.08, hh = 0.75 + r() * 0.25, cul = new T.CylinderGeometry(0.006, 0.008, hh, 5); cul.translate(Math.cos(a) * d, hh / 2, Math.sin(a) * d); cul.rotateZ((r() - 0.5) * 0.15); trunk.push(cul);
      for (let j = 0; j < 7; j++) { const y = hh * (0.45 + r() * 0.55), b = r() * 6.283; card(Math.cos(a) * d + Math.cos(b) * 0.08, y, Math.sin(a) * d + Math.sin(b) * 0.08, Math.cos(b), 0.4, Math.sin(b), 0.07 + r() * 0.03, i & 1, [0, y, 0], 0.6 + 0.4 * r()); } }
  } else {
    const th = new T.CylinderGeometry(0.011, 0.024, 0.46, 7); th.translate(0, 0.23, 0); trunk.push(th);
    const blobs = [], nb = 5 + (r() * 3 | 0);
    for (let i = 0; i < nb; i++) { const a = r() * 6.283, d = i ? 0.14 + r() * 0.16 : 0; blobs.push([Math.cos(a) * d, 0.48 + r() * 0.3, Math.sin(a) * d, 0.2 + r() * 0.1]);
      const br = new T.CylinderGeometry(0.004, 0.009, 0.34, 4), bb = blobs[i]; br.translate(0, 0.17, 0); br.rotateZ(-Math.atan2(Math.hypot(bb[0], bb[2]), 0.3) * Math.cos(a)); br.rotateX(Math.atan2(Math.hypot(bb[0], bb[2]), 0.3) * Math.sin(a)); br.translate(0, 0.34, 0); trunk.push(br); }
    const N = kind === 'bloom' ? 52 : 78;
    for (let i = 0; i < N; i++) { const bl = blobs[i % nb], u = r() * 2 - 1, a = r() * 6.283, sq = Math.sqrt(1 - u * u), dx = sq * Math.cos(a), dy = u * 0.8 + 0.2, dz = sq * Math.sin(a), rr = bl[3] * (0.55 + 0.5 * r());
      const px = bl[0] + dx * rr, py = bl[1] + dy * rr, pz = bl[2] + dz * rr, depth = clamp((py - 0.36) / 0.55, 0, 1), out = clamp(Math.hypot(px, pz) / 0.4, 0, 1);
      card(px, py, pz, dx + (r() - 0.5) * 0.9, dy + (r() - 0.5) * 0.9, dz + (r() - 0.5) * 0.9, 0.125 + r() * 0.07, i & 1, [0, 0.55, 0], 0.55 + 0.45 * Math.max(depth, out * 0.8)); }
  }
  const f = new T.BufferGeometry();
  f.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); f.setAttribute('normal', new T.Float32BufferAttribute(nor, 3)); f.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); f.setAttribute('color', new T.Float32BufferAttribute(col, 3)); f.setIndex(idx);
  return { leaf: f, trunk: mergeGeos(trunk), bamboo: kind === 'bamboo' };
}
const KINDS = { leafA: makeTree(1, 'leaf'), leafB: makeTree(2, 'leaf'), leafC: makeTree(3, 'leaf'), pine: makeTree(4, 'pine'), bloom: makeTree(5, 'bloom'), poplar: makeTree(6, 'poplar'), willow: makeTree(7, 'willow'), bamboo: makeTree(8, 'bamboo') };
const TREE_COL = { pine: [0x2b4a3a, 0x3f5f42], bloom: [0xf2c6d2, 0xfbeef0], poplar: [0x5a7a3a, 0x8a9a52], willow: [0x7a9a48, 0xa8c060], bamboo: [0x4e7a3a, 0x7a9a4a], leaf: [0x4a6a2e, 0x7f9a44] };
const forests = [], treeLists = {}; Object.keys(KINDS).forEach(k => treeLists[k] = []);
/* 种一棵树：kind = leaf|pine|bloom|poplar|willow|bamboo；scale 是高度（米） */
W.plant = function (x, z, kind, height, color) {
  const y = W.groundH(x, z); let k = kind; if (k === 'leaf') k = ['leafA', 'leafB', 'leafC'][rand() * 3 | 0];
  const cc = TREE_COL[kind] || TREE_COL.leaf, c = new T.Color(cc[0]).lerp(new T.Color(cc[1]), rand()); if (kind === 'leaf') c.lerp(new T.Color(0x35542f), rand() * 0.55); if (color) c.set(color);
  treeLists[k].push([x, y - 0.15, z, height * (0.95 + rand() * 0.3), height, rand() * 6.283, c.getHex()]);
};
W.rand = () => rand();
function buildTrees() {
  const d = new T.Object3D(), col = new T.Color();
  Object.keys(KINDS).forEach(function (k) {
    const L = treeLists[k]; if (!L.length) return;
    const leaf = new T.InstancedMesh(KINDS[k].leaf, leafMat, L.length), trunk = new T.InstancedMesh(KINDS[k].trunk, KINDS[k].bamboo ? bambooMat : barkMat, L.length);
    L.forEach((t, i) => { d.position.set(t[0], t[1], t[2]); d.scale.set(t[3], t[4], t[3]); d.rotation.set(0, t[5], 0); d.updateMatrix(); leaf.setMatrixAt(i, d.matrix); trunk.setMatrixAt(i, d.matrix); leaf.setColorAt(i, col.set(t[6])); });
    leaf.customDepthMaterial = leafDepth; leaf.castShadow = trunk.castShadow = true; leaf.receiveShadow = true; leaf.frustumCulled = trunk.frustumCulled = false;
    leaf.userData.full = trunk.userData.full = L.length; scene.add(leaf, trunk); forests.push(leaf, trunk);
  });
}

/* ============================== 芳草芦苇 ============================== */
const grassList = []; let grass = null;
W.grass = function (x, z, s, color) { const y = W.groundH(x, z); grassList.push([x, y - 0.05, z, s, color]); };
function buildGrass() {
  if (!grassList.length) return;
  const gt = canvasTex(256, 128, function (g, w, h) { g.clearRect(0, 0, w, h); const r = rng(8); for (let i = 0; i < 90; i++) { const x = 8 + r() * (w - 16), hh = (36 + r() * 88) * (1 - 0.7 * Math.pow(x / w * 2 - 1, 2)), k = 130 + r() * 125 | 0, b = (r() - 0.5) * 30; g.strokeStyle = 'rgb(' + k + ',' + k + ',' + k + ')'; g.lineWidth = 1.5 + r() * 2; g.beginPath(); g.moveTo(x, h); g.quadraticCurveTo(x + b * 0.3, h - hh * 0.6, x + b, h - hh); g.stroke(); } });
  const q = ry => { const p = new T.PlaneGeometry(1, 1, 1, 2); p.translate(0, 0.5, 0); p.rotateY(ry); return p; };
  const geo = mergeGeos([q(0), q(Math.PI / 2.6), q(-Math.PI / 2.6)]), n = geo.attributes.position.count, col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const k = 0.35 + 0.65 * geo.attributes.position.getY(i); col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = k; geo.attributes.normal.setXYZ(i, 0, 1, 0); }
  geo.setAttribute('color', new T.BufferAttribute(col, 3));
  const mat = swayPatch(new T.MeshStandardMaterial({ map: gt, alphaTest: 0.3, alphaToCoverage: true, side: T.DoubleSide, vertexColors: true, roughness: 0.95, envMapIntensity: 0.4 }), 0.16);
  grass = new T.InstancedMesh(geo, mat, grassList.length); const d = new T.Object3D(), c = new T.Color();
  grassList.forEach((t, i) => { d.position.set(t[0], t[1], t[2]); d.scale.set(t[3] * 2.0, t[3], t[3] * 2.0); d.rotation.set(0, rand() * 6.283, 0); d.updateMatrix(); grass.setMatrixAt(i, d.matrix); grass.setColorAt(i, c.set(t[4] === undefined ? new T.Color(0x4a6a2c).lerp(new T.Color(0x8a9a48), rand() * rand()).getHex() : t[4])); });
  grass.receiveShadow = true; grass.frustumCulled = false; grass.userData.full = grassList.length; scene.add(grass);
}

/* ============================== 飞鸟 ============================== */
const flocks = [];
/* o = { n, center:[x,y,z], R:[a,b], h:[a,b], speed:[a,b], scale, flap, body, wingIn, wingOut, tip, beak, neck(长颈), legs(拖在后面的腿), tail } 颜色为 0xRRGGBB */
W.birds = function (o) {
  const col = h => { const c = new T.Color(h); return [c.r, c.g, c.b]; };
  const B = col(o.body || 0xf6f6f2), WI = col(o.wingIn || o.body || 0xf6f6f2), WO = col(o.wingOut || 0xb0b4ba), TP = col(o.tip || 0x111114), BK = col(o.beak || 0xf0b030), LG = col(o.legs || o.beak || 0xf0b030);
  const mat = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, side: T.DoubleSide, envMapIntensity: 0.6 });
  const paint = (g, f) => { const n = g.attributes.position.count, a = new Float32Array(n * 3), p = g.attributes.position; for (let i = 0; i < n; i++) { const c = f(p.getX(i), p.getY(i), p.getZ(i)); a[i * 3] = c[0]; a[i * 3 + 1] = c[1]; a[i * 3 + 2] = c[2]; } g.setAttribute('color', new T.BufferAttribute(a, 3)); if (g.attributes.uv) g.deleteAttribute('uv'); return g; };
  const parts = [];
  const body = new T.LatheGeometry([[0.001, -0.55], [0.06, -0.45], [0.15, -0.2], [0.17, 0.05], [0.14, 0.3], [0.1, 0.45]].map(p => new T.Vector2(p[0], p[1])), 12); body.rotateX(Math.PI / 2); parts.push(paint(body, () => B));
  if (o.neck) { const neck = H.tubeGeo([[0, 0.02, 0.4], [0, 0.12, 0.65], [0, 0.14, 0.9]], 0.06, 6); parts.push(paint(neck, () => B)); }
  const hz = o.neck ? 0.98 : 0.55, head = new T.SphereGeometry(0.11, 10, 8); head.scale(1, 1, 1.2); head.translate(0, o.neck ? 0.14 : 0.06, hz); parts.push(paint(head, () => col(o.head || o.body || 0xf6f6f2)));
  const bl = o.beakLen || 0.18, beak = new T.ConeGeometry(0.03, bl, 6); beak.rotateX(Math.PI / 2); beak.translate(0, o.neck ? 0.12 : 0.04, hz + 0.1 + bl / 2); parts.push(paint(beak, () => BK));
  const tail = new T.ConeGeometry(0.12, o.tailLen || 0.3, 6); tail.rotateX(-Math.PI / 2); tail.scale(1, 0.35, 1); tail.translate(0, 0, -0.65); parts.push(paint(tail, () => col(o.tail || o.body || 0xf6f6f2)));
  if (o.legs) for (const s of [-1, 1]) { const l = new T.CylinderGeometry(0.018, 0.018, 0.8, 4); l.rotateX(Math.PI / 2); l.translate(s * 0.05, -0.05, -0.9); parts.push(paint(l, () => LG)); }
  const bodyGeo = mergeGeos(parts);
  const wing = (x0, x1, c0, c1, outer) => paint(gridGeo(6, 3, (u, v) => { const x = lerp(x0, x1, u), ch = lerp(c0, c1, u) * (outer ? 1 - 0.4 * Math.pow(u, 2) : 1); return [x - x0, 0.03 * Math.sin(v * Math.PI) - (outer ? 0.05 * u * u : 0), 0.16 - v * ch, u, v]; }), (x, y, z) => outer ? (x > (o.tipAt || 0.6) ? TP : WO) : (o.trailing && z < -0.15 ? TP : WI));
  const inner = wing(0.1, 0.75, 0.42, 0.38, false), outerG = wing(0.75, 1.75, 0.38, 0.16, true);
  const C0 = V3(...(o.center || [0, 0, 0])), list = [];
  for (let i = 0; i < (o.n || 12); i++) {
    const g = new T.Group(); g.add(new T.Mesh(bodyGeo, mat)); const Wg = [];
    for (const s of [1, -1]) { const a = new T.Group(), b = new T.Group(); a.position.set(0.1 * s, 0.06, 0.08); a.scale.x = s; a.add(new T.Mesh(inner, mat)); b.position.set(0.65, 0, 0); b.add(new T.Mesh(outerG, mat)); a.add(b); g.add(a); Wg.push([a, b, s]); }
    g.scale.setScalar(o.scale || 0.9); g.traverse(m => { if (m.isMesh) m.castShadow = true; });
    const R = o.R || [18, 80], hh = o.h || [5, 25], sp = o.speed || [0.12, 0.22];
    g.userData = { W: Wg, R: lerp(R[0], R[1], rand()), h: lerp(hh[0], hh[1], rand()), w: lerp(sp[0], sp[1], rand()) * (i % 3 ? 1 : -1), ph: rand() * 6.283, fl: (o.flap || 6.5) + rand() * 2, glide: o.glide || 0.35 };
    scene.add(g); list.push(g);
  }
  flocks.push({ list, C: C0, ry: o.ry || 0.7 });
};

/* ============================== 木船 ============================== */
const boats = []; let boatY = 0;
W.boats = function (defs, y, o) {
  o = o || {}; boatY = y;
  const hullM = new T.MeshStandardMaterial({ color: 0x4a3322, roughness: 0.8, side: T.DoubleSide, envMapIntensity: 0.4 }), deckM = new T.MeshStandardMaterial({ color: 0x7a6248, roughness: 0.9, side: T.DoubleSide });
  const sailT = canvasTex(256, 512, function (g, w, h) { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#cdbd98'); gr.addColorStop(0.5, '#e3d6b6'); gr.addColorStop(1, '#bfae88'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#5a4630'; for (let yy = 20; yy < h; yy += 58) g.fillRect(0, yy, w, 6); });
  const sailM = new T.MeshStandardMaterial({ map: sailT, roughness: 0.9, side: T.DoubleSide, envMapIntensity: 0.5 });
  const hw = u => 1.7 * (1 - 0.86 * Math.pow(Math.abs(u), 2.4)), top = u => 1.0 + 1.0 * u * u, U = u => u * 2 - 1;
  const hull = gridGeo(18, 8, (u, v) => { const t = U(u), a = Math.PI * v; return [Math.cos(a) * hw(t), top(t) - Math.sin(a) * (1.25 - 0.5 * t * t), t * 7, u, v]; });
  const deck = gridGeo(18, 1, (u, v) => { const t = U(u); return [(v - 0.5) * 2 * hw(t) * 0.94, top(t) - 0.2, t * 7, u, v]; });
  const cabin = gridGeo(6, 8, (u, v) => { const a = Math.PI * v; return [Math.cos(a) * 1.15, 0.85 + Math.sin(a) * 1.15, lerp(-4.2, -0.6, u), u * 3, v]; });
  const mast = new T.CylinderGeometry(0.09, 0.13, 11, 6); mast.translate(0, 6.2, 1.2);
  const sail = gridGeo(4, 9, (u, v) => { const b = Math.sin(v * Math.PI) * 0.9 * Math.sin(u * Math.PI * 0.9 + 0.2); return [b + 0.15, 2.2 + v * 9, 1.2 + (u - 0.3) * 6.2 * (0.82 + 0.18 * Math.sin(v * 3)), u, v]; });
  defs.forEach(function (d) {
    const g = new T.Group(); g.add(new T.Mesh(hull, hullM), new T.Mesh(deck, deckM), new T.Mesh(cabin, deckM)); if (!o.noSail) g.add(new T.Mesh(mast, hullM), new T.Mesh(sail, sailM));
    g.traverse(m => { if (m.isMesh) m.castShadow = true; }); g.rotation.y = d[2] > 0 ? Math.PI / 2 : -Math.PI / 2; g.scale.setScalar(d[3] || 1);
    g.position.set(d[0], y - 0.55, d[1]); g.userData.v = d[2]; scene.add(g); boats.push(g);
  });
  W.boatRange = o.range || 1300;
};

/* ============================== 画质与逐帧 ============================== */
function setQuality() {
  const Q = H.Q;
  if (water) water.visible = !!Q.refl; if (waterLow) waterLow.visible = !Q.refl || !water;
  forests.forEach(m => m.count = Math.max(1, Math.floor(m.userData.full * Q.trees)));
  if (grass) { grass.count = Math.floor(grass.userData.full * Q.grass); grass.visible = Q.grass > 0; }
  if (sun.shadow.mapSize.x !== Q.shadow) { sun.shadow.mapSize.set(Q.shadow, Q.shadow); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
  qualityHooks.forEach(f => f(Q));
}
function update(dt, time, inside) {
  clock = time; H.uTime.value = time; indoor = lerp(indoor, inside ? 1 : 0, 1 - Math.exp(-dt * 6));
  applyEnv(1 - Math.exp(-dt * 1.7));
  if (env.bakeAt.length && time >= env.bakeAt[0]) { env.bakeAt.shift(); bakeEnv(); }
  sky.position.copy(camera.position);
  const showWater = !inside;
  if (water) { water.visible = showWater && !!H.Q.refl; water.material.uniforms.time.value = time * waterSpeed; }
  if (waterLow) { waterLow.visible = showWater && (!H.Q.refl || !water); waterLow.userData.n.offset.set(time * 0.004, time * 0.0017); }
  if (silt) silt.visible = showWater;
  for (const f of flocks) for (const c of f.list) {
    const u = c.userData, a = u.ph + time * u.w, b = a + Math.sign(u.w) * 0.05;
    c.position.set(f.C.x + Math.cos(a) * u.R, f.C.y + u.h + Math.sin(time * 0.33 + u.ph) * 3, f.C.z + Math.sin(a) * u.R * f.ry);
    c.lookAt(f.C.x + Math.cos(b) * u.R, c.position.y + Math.cos(time * 0.33 + u.ph) * 0.2, f.C.z + Math.sin(b) * u.R * f.ry); c.rotateZ(-Math.sign(u.w) * 0.3);
    const amp = 0.25 + 0.75 * smooth(u.glide, u.glide + 0.25, vnoise(time * 0.22 + u.ph, u.ph)), fr = time * u.fl + u.ph;
    for (const w of u.W) { w[0].rotation.z = w[2] * (0.12 + Math.sin(fr) * 0.5 * amp); w[1].rotation.z = (-0.1 + Math.sin(fr - 1.0) * 0.55 * amp); }
  }
  for (const bt of boats) { bt.position.x += bt.userData.v * dt; const R = W.boatRange; if (bt.position.x > R) bt.position.x = -R; if (bt.position.x < -R) bt.position.x = R; bt.position.y = boatY - 0.55 + Math.sin(time * 0.8 + bt.position.z) * 0.1; bt.rotation.z = Math.sin(time * 0.6 + bt.position.z) * 0.02; }
  hooks.forEach(f => f(dt, time, inside));
}
W.onUpdate = f => hooks.push(f);
W.onQuality = f => qualityHooks.push(f);
W.finish = function (extra) {
  buildTrees(); buildGrass(); setQuality();
  H.world = Object.assign({ groundH: W.groundH, ENV, env, setEnv, snapEnv, update, setQuality, sun, bakeEnv, applyEnv }, extra || {});
  return H.world;
};
W.ENV = ENV; W.sun = sun;
H.wc = W;
})();
