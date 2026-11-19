/* 黄鹤楼 · 山水世界：天空与时辰、蛇山地形、长江、林木芳草、黄鹤、帆船 */
(function () {
'use strict';
const H = window.HHL, T = THREE;
const { lerp, clamp, smooth, rng, V3, fbm, ridged, vnoise, canvasTex, makeCanvas, pixelCanvas, texFrom, normalFromCanvas, gridGeo, tubeGeo, mergeGeos, tint } = H;
const scene = H.scene, camera = H.camera, renderer = H.renderer, TY = H.tower.TY;
const rand = rng(20261111), WATER_Y = -24.5;

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
  col = mix(col, uHorizon, exp(-h * 9.0) * 0.6);                         // 地平线的霭
  if (d.y < 0.0) col = mix(uHorizon, uHorizon * 0.55, clamp(-d.y * 5.0, 0.0, 1.0));
  col += uSunCol * (pow(sd, 5.0) * 0.10 + pow(sd, 40.0) * 0.30) * uGlow * (0.4 + 0.6 * exp(-h * 3.0));   // 日晕
  float occ = 0.0;
  if (d.y > 0.012) {
    vec2 p = d.xz / (d.y + 0.14) * 1.25 + vec2(uTime * 0.0045, uTime * 0.0016);
    float n = cloud(p), dens = smoothstep(uCover, uCover + 0.3, n);
    float n2 = cloud(p + normalize(uSun.xz + 0.0001) * 0.16);               // 朝太阳方向再取一次，估计受光
    float lit = clamp(0.5 + (n - n2) * 3.2, 0.0, 1.0);
    vec3 cc = mix(uCloudDark, uCloudLit, lit * (0.55 + 0.45 * (1.0 - dens)));
    cc += uSunCol * pow(sd, 8.0) * 0.45 * uGlow * (1.0 - dens * 0.6);       // 云缘的金边
    float wisp = smoothstep(0.52, 0.9, fbm(p * vec2(0.35, 1.6) + 11.0)) * 0.35;   // 高空卷云
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
scene.fog = new T.FogExp2(0xc2d2dc, 0.00042);
const hemi = new T.HemisphereLight(0xffffff, 0x445533, 0.3); scene.add(hemi);
const sun = new T.DirectionalLight(0xffffff, 3); sun.castShadow = true;
Object.assign(sun.shadow.camera, { left: -140, right: 140, top: 140, bottom: -140, near: 60, far: 900 });
sun.shadow.camera.updateProjectionMatrix(); sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.08; sun.target.position.set(0, 14, 28); scene.add(sun, sun.target);
const bounce = new T.DirectionalLight(0xffe6c0, 0.6); bounce.position.set(0, -300, 60); bounce.target.position.set(0, 20, 0); scene.add(bounce, bounce.target);   // 地面反射光：从下往上照亮檐下和树冠底面
let indoor = 0;
const C = h => new T.Color(h), D = (x, y, z) => V3(x, y, z).normalize();
const ENV = {
  day: { zenith: C(0x2a62b8), horizon: C(0xc6d8e4), sunCol: C(0xfff0d4), cloudLit: C(0xffffff), cloudDark: C(0x8a98ac), cover: 0.5, stars: 0, disc: 26, glowSky: 1, moon: 0,
    dir: D(-0.55, 0.62, 0.56), light: C(0xfff1dc), lightI: 3.3, hemiSky: C(0xcfe2ff), hemiGround: C(0x5a5a40), hemiI: 0.32, fog: C(0xbccdd8), fogD: 0.00062, water: C(0x21423f), glow: 0, exposure: 0.8 },
  dusk: { zenith: C(0x232c63), horizon: C(0xf0934e), sunCol: C(0xff8136), cloudLit: C(0xffb07a), cloudDark: C(0x574966), cover: 0.47, stars: 0.04, disc: 22, glowSky: 2.2, moon: 0,
    dir: D(-0.5, 0.115, 0.86), light: C(0xff9450), lightI: 3.0, hemiSky: C(0xc9a0c0), hemiGround: C(0x3a2a30), hemiI: 0.42, fog: C(0xd8946a), fogD: 0.00075, water: C(0x2c3040), glow: 0.4, exposure: 0.9 },
  night: { zenith: C(0x02050d), horizon: C(0x0d1832), sunCol: C(0xbccaff), cloudLit: C(0x27325a), cloudDark: C(0x080c1c), cover: 0.56, stars: 1, disc: 5, glowSky: 0.5, moon: 1,
    dir: D(0.42, 0.52, 0.74), light: C(0x9db2f0), lightI: 0.85, hemiSky: C(0x3a4c82), hemiGround: C(0x10131e), hemiI: 0.7, fog: C(0x0a1124), fogD: 0.00055, water: C(0x070d18), glow: 1, exposure: 1.05 }
};
const COLK = ['zenith', 'horizon', 'sunCol', 'cloudLit', 'cloudDark', 'light', 'hemiSky', 'hemiGround', 'fog', 'water'];
const NUMK = ['cover', 'stars', 'disc', 'glowSky', 'lightI', 'hemiI', 'fogD', 'glow', 'exposure'];
const cloneEnv = e => { const o = {}; COLK.forEach(k => o[k] = e[k].clone()); NUMK.forEach(k => o[k] = e[k]); o.dir = e.dir.clone(); o.moon = e.moon; return o; };
const env = { name: 'day', mist: false, cur: cloneEnv(ENV.day), tgt: cloneEnv(ENV.day), bakeAt: [] };
let clock = 0, water = null, waterLow = null;
function setEnv(name, mist) {
  if (name && ENV[name]) env.name = name; if (mist !== undefined) env.mist = !!mist;
  env.tgt = cloneEnv(ENV[env.name]);
  if (env.mist) { env.tgt.horizon.lerp(env.tgt.fog, 1); env.tgt.cloudLit.lerp(env.tgt.fog, 0.55); env.tgt.zenith.lerp(env.tgt.fog, 0.6); env.tgt.cloudDark.lerp(env.tgt.fog, 0.6); env.tgt.fogD = env.name === 'day' ? 0.0042 : 0.005; env.tgt.cover = Math.min(env.tgt.cover, 0.44); env.tgt.lightI *= 0.7; env.tgt.hemiI *= 1.6; }
  env.bakeAt = [clock + 0.5, clock + 1.3, clock + 2.6, clock + 4.2];
}
function applyEnv(k) {
  const c = env.cur, t = env.tgt;
  COLK.forEach(n => c[n].lerp(t[n], k)); NUMK.forEach(n => c[n] = lerp(c[n], t[n], k)); c.dir.lerp(t.dir, k).normalize(); c.moon = t.moon;
  SU.uSun.value.copy(c.dir); SU.uZenith.value.copy(c.zenith); SU.uHorizon.value.copy(c.horizon); SU.uSunCol.value.copy(c.sunCol);
  SU.uCloudLit.value.copy(c.cloudLit); SU.uCloudDark.value.copy(c.cloudDark); SU.uCover.value = c.cover; SU.uStars.value = c.stars; SU.uDisc.value = c.disc; SU.uGlow.value = c.glowSky; SU.uMoon.value = c.moon;
  scene.fog.color.copy(c.fog); scene.fog.density = c.fogD;
  sun.color.copy(c.light); sun.intensity = c.lightI; sun.position.copy(c.dir).multiplyScalar(420).add(sun.target.position);
  hemi.color.copy(c.hemiSky); hemi.groundColor.copy(c.hemiGround); hemi.intensity = c.hemiI * (1 - 0.72 * indoor);
  bounce.color.copy(c.light).lerp(c.hemiGround, 0.35); bounce.intensity = c.lightI * 0.2 * (1 - 0.85 * indoor);
  if (H.bloom) { H.bloom.threshold = lerp(lerp(3.4, 1.3, c.glow), 2.3, indoor); H.bloom.strength = lerp(lerp(0.5, 0.55, c.glow), 0.6, indoor); }
  if (water) { const u = water.material.uniforms; u.sunDirection.value.copy(c.dir); u.sunColor.value.copy(c.light).multiplyScalar(Math.min(1.5, c.lightI * 0.45)); u.waterColor.value.copy(c.water); }
  if (waterLow) waterLow.material.color.copy(c.water).multiplyScalar(2.2);
  H.tower.setGlow(c.glow); if (H.interior) H.interior.setTime(c.glow);
  H.exposure = c.exposure;
}
function snapEnv() { env.cur = cloneEnv(env.tgt); applyEnv(1); bakeEnv(); env.bakeAt = []; }

/* ============================== 地形 ============================== */
function groundH(x, z) {
  const s = (x / 170) * (x / 170) + (z / 80) * (z / 80);
  let h = -22 * (1 - Math.exp(-s * s * s));
  h += (fbm(x * 0.011 + 7, z * 0.011 + 3, 4) - 0.5) * 9 * smooth(0.5, 2.2, s);
  const dx = (x + 170) / 120, dz = (z - 330) / 40, q = dx * dx + dz * dz;
  const river = smooth(150, 205, z) * (1 - smooth(545, 610, z));
  h = lerp(h, -33.5 + Math.exp(-q * q) * 11.6, river);                         // 江床与鹦鹉洲
  h += smooth(545, 610, z) * 13;                                                // 对岸汉阳
  const mf = smooth(820, 2300, z), mb = smooth(520, 1900, -z), ms = smooth(700, 2200, Math.abs(x)) * smooth(250, 110, z), m = Math.max(mf, mb, ms);
  if (m > 0) {                                                                  // 远山：大形 + 嶙峋的细节
    const big = ridged(x * 0.00075 + 5, z * 0.00075 + 2, 4), mid = ridged(x * 0.0031 + 40, z * 0.0031 + 9, 4), fine = ridged(x * 0.011, z * 0.011 + 70, 3);
    h += m * (30 + 520 * big * big + 150 * mid * (0.3 + big) + 26 * fine * (0.2 + big));
  }
  return h;
}
(function () {
  const N = 330, S = 1500, a = 0.22, warp = u => S * (a * u + (1 - a) * u * u * u * u * u);
  const g = new T.PlaneGeometry(2, 2, N, N); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, uv = g.attributes.uv, col = new Float32Array(p.count * 3), c = new T.Color(), c2 = new T.Color();
  const PAL = { floor: 0x2a3620, meadow: 0x46562e, dry: 0x6a6a40, sand: 0x7a715c, wet: 0x4a4336, rock: 0x625e55, far: 0x35483f, farHi: 0x5a6670 };
  for (let i = 0; i < p.count; i++) {
    const x = warp(p.getX(i)), z = warp(p.getZ(i)) + 70, h = groundH(x, z); p.setXYZ(i, x, h, z); uv.setXY(i, x / 7, z / 7);
    const e = 3, sl = Math.hypot(groundH(x + e, z) - h, groundH(x, z + e) - h) / e, n = fbm(x * 0.02 + 40, z * 0.02, 4), n2 = fbm(x * 0.09, z * 0.09 + 20, 3);
    c.set(PAL.floor).lerp(c2.set(PAL.meadow), smooth(0.4, 0.62, n)).lerp(c2.set(PAL.dry), smooth(0.62, 0.85, n2) * 0.3);
    c.lerp(c2.set(PAL.rock), smooth(0.55, 1.1, sl));
    if (h < WATER_Y + 3) c.lerp(c2.set(PAL.sand), smooth(WATER_Y + 3, WATER_Y + 0.9, h));
    if (h < WATER_Y + 0.7) c.lerp(c2.set(PAL.wet), smooth(WATER_Y + 0.7, WATER_Y - 0.2, h));
    if (h > 30) c.lerp(c2.set(PAL.far).lerp(new T.Color(PAL.farHi), smooth(120, 330, h)), smooth(30, 90, h));
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new T.BufferAttribute(col, 3)); g.computeVertexNormals();
  const dh = pixelCanvas(256, 256, (u, v) => { const k = 255 * fbm(u * 24, v * 24, 4, 24); return [k, k, k]; });
  const dc = pixelCanvas(256, 256, (u, v) => { const k = 190 + 65 * fbm(u * 32 + 5, v * 32, 4, 32), m = fbm(u * 8, v * 8 + 3, 3, 8); return [k * (0.95 + 0.1 * m), k, k * (0.9 - 0.1 * m)]; });
  const mat = new T.MeshStandardMaterial({ vertexColors: true, map: texFrom(dc), normalMap: normalFromCanvas(dh, 2.2), roughness: 0.96, envMapIntensity: 0.45 });
  const m = new T.Mesh(g, mat); m.receiveShadow = true; m.frustumCulled = false; scene.add(m);
  // 远山环：极坐标网格，沿圆周细分，山脊线才不会是一段段折线
  const NR = 54, NA = 720, R0 = 1380, R1 = 11000, rp = [], rc = [], ri = [], ruv = [];
  for (let j = 0; j <= NR; j++) { const rr = R0 * Math.pow(R1 / R0, j / NR);
    for (let i = 0; i <= NA; i++) { const an = i / NA * Math.PI * 2, x = Math.cos(an) * rr, z = Math.sin(an) * rr + 70, h = groundH(x, z) - 2.5 * (1 - smooth(1500, 2100, rr));
      rp.push(x, h, z); ruv.push(x / 60, z / 60);
      const sl = Math.abs(groundH(x + 12, z) - groundH(x, z)) / 12 + Math.abs(groundH(x, z + 12) - groundH(x, z)) / 12, n = fbm(x * 0.004, z * 0.004, 3);
      c.set(PAL.floor).lerp(c2.set(PAL.meadow), n * 0.6).lerp(c2.set(PAL.far), smooth(20, 90, h)).lerp(c2.set(PAL.rock), smooth(0.5, 1.2, sl) * 0.8).lerp(c2.set(PAL.farHi), smooth(200, 620, h));
      if (h < WATER_Y + 3) c.lerp(c2.set(PAL.sand), smooth(WATER_Y + 3, WATER_Y + 0.9, h));
      rc.push(c.r, c.g, c.b); } }
  for (let j = 0; j < NR; j++) for (let i = 0; i < NA; i++) { const a0 = j * (NA + 1) + i, b0 = a0 + 1, c0 = a0 + NA + 1, d0 = c0 + 1; ri.push(a0, c0, b0, b0, c0, d0); }
  const rg = new T.BufferGeometry(); rg.setAttribute('position', new T.Float32BufferAttribute(rp, 3)); rg.setAttribute('color', new T.Float32BufferAttribute(rc, 3)); rg.setAttribute('uv', new T.Float32BufferAttribute(ruv, 2)); rg.setIndex(ri); rg.computeVertexNormals();
  const ring = new T.Mesh(rg, new T.MeshStandardMaterial({ vertexColors: true, normalMap: mat.normalMap, normalScale: new T.Vector2(1.6, 1.6), roughness: 1, envMapIntensity: 0.4, side: T.DoubleSide })); ring.frustumCulled = false; scene.add(ring);

  // 楼前广场与下山石径
  const pc = makeCanvas(512, 512, function (cx, w, h) {
    cx.fillStyle = '#7d786c'; cx.fillRect(0, 0, w, h); const r = rng(4);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const k = 118 + r() * 34 | 0; cx.fillStyle = 'rgb(' + k + ',' + (k - 3) + ',' + (k - 12) + ')'; cx.fillRect(x * 64 + (y % 2) * 32 - 32, y * 64, 62, 62); cx.fillRect(x * 64 + (y % 2) * 32 + 480, y * 64, 62, 62); }
    for (let i = 0; i < 2600; i++) { cx.fillStyle = 'rgba(60,55,45,' + r() * 0.12 + ')'; cx.fillRect(r() * w, r() * h, 2 + r() * 3, 2 + r() * 3); }
  });
  const pmat = new T.MeshStandardMaterial({ map: texFrom(pc, true, [12, 12]), roughness: 0.86, envMapIntensity: 0.5 });
  const pl = new T.Mesh(new T.CylinderGeometry(41, 43, 1.6, 72), pmat); pl.position.y = -0.78; pl.receiveShadow = true; scene.add(pl);
  const path = gridGeo(2, 60, (u, v) => { const z = lerp(39, 172, v), x = (u - 0.5) * 6 + Math.sin(z * 0.045) * 5 * smooth(50, 90, z); return [x, groundH(x, z) + 0.12, z, u * 1.5, v * 34]; });
  const pm = new T.Mesh(path, new T.MeshStandardMaterial({ map: texFrom(pc, true, [1, 1]), roughness: 0.9, envMapIntensity: 0.4 })); pm.receiveShadow = true; scene.add(pm);
})();

/* ============================== 长江 ============================== */
const waterN = normalFromCanvas(pixelCanvas(512, 512, (u, v) => { const k = 255 * (0.6 * fbm(u * 6, v * 6, 5, 6) + 0.4 * fbm(u * 14 + 3, v * 14, 4, 14)); return [k, k, k]; }), 5);
(function () {
  const geo = new T.PlaneGeometry(30000, 30000);
  if (T.Water) {
    water = new T.Water(geo, { textureWidth: H.Q.refl || 256, textureHeight: H.Q.refl || 256, waterNormals: waterN, sunDirection: V3(0, 1, 0), sunColor: 0xffffff, waterColor: 0x21423f, distortionScale: 2.4, fog: true });
    water.rotation.x = -Math.PI / 2; water.position.y = WATER_Y; water.material.uniforms.size.value = 3.2; scene.add(water);
  }
  const ln = waterN.clone(); ln.needsUpdate = true; ln.repeat.set(700, 700);
  waterLow = new T.Mesh(geo, new T.MeshStandardMaterial({ color: 0x2a5450, roughness: 0.16, metalness: 0.35, normalMap: ln, normalScale: new T.Vector2(0.5, 0.5), envMapIntensity: 1.4 }));
  waterLow.rotation.x = -Math.PI / 2; waterLow.position.y = WATER_Y; waterLow.userData.n = ln; scene.add(waterLow);
})();

/* ============================== 林木 ============================== */
const leafTex = canvasTex(512, 512, function (g, w, h) {         // 2×2 图集：上排阔叶簇，下排松针簇（灰度，颜色由实例着色）
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
function swayPatch(mat, amp) {                                     // 给实例化植被加上风的摆动，并让双面叶片用统一的“球形”法线
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
const barkMat = new T.MeshStandardMaterial({ color: 0x2c251f, roughness: 0.95, envMapIntensity: 0.3 });
function makeTree(seed, kind) {                                    // 单位高度（树高 = 1）的一棵树：树干 + 若干叶簇片
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
  } else {
    const th = new T.CylinderGeometry(0.011, 0.024, 0.46, 7); th.translate(0, 0.23, 0); trunk.push(th);
    const blobs = []; const nb = 5 + (r() * 3 | 0);
    for (let i = 0; i < nb; i++) { const a = r() * 6.283, d = i ? 0.14 + r() * 0.16 : 0; blobs.push([Math.cos(a) * d, 0.48 + r() * 0.3, Math.sin(a) * d, 0.2 + r() * 0.1]);
      const br = new T.CylinderGeometry(0.004, 0.009, 0.34, 4), bb = blobs[i]; br.translate(0, 0.17, 0); br.rotateZ(-Math.atan2(Math.hypot(bb[0], bb[2]), 0.3) * Math.cos(a)); br.rotateX(Math.atan2(Math.hypot(bb[0], bb[2]), 0.3) * Math.sin(a)); br.translate(0, 0.34, 0); trunk.push(br); }
    const N = kind === 'bloom' ? 52 : 78;
    for (let i = 0; i < N; i++) {
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
  const kinds = { leafA: makeTree(1, 'leaf'), leafB: makeTree(2, 'leaf'), leafC: makeTree(3, 'leaf'), pine: makeTree(4, 'pine'), bloom: makeTree(5, 'bloom') }, lists = {}; Object.keys(kinds).forEach(k => lists[k] = []);
  const c = new T.Color(), c2 = new T.Color(), CAMS = [[32, 52, 13], [40, 62, 11], [26, 40, 9], [88, 132, 14], [66, 96, 12], [0, 126, 16]];
  function plant(x, z, kind, scale) {
    const y = groundH(x, z); if (y < WATER_Y + 1.0 || y > 60) return;
    for (const q of CAMS) if (Math.hypot(x - q[0], z - q[1]) < q[2]) return;      // 机位附近不种树，免得镜头扎进树冠
    let k = kind; if (k === 'leaf') k = ['leafA', 'leafB', 'leafC'][rand() * 3 | 0];
    if (k === 'pine') c.set(0x2b4a3a).lerp(c2.set(0x3f5f42), rand());
    else if (k === 'bloom') c.set(0xf2c6d2).lerp(c2.set(0xfbeef0), rand());
    else c.set(0x4a6a2e).lerp(c2.set(0x7f9a44), rand()).lerp(c2.set(0x35542f), rand() * 0.55);
    const s = (k === 'pine' ? 12 + rand() * 7 : k === 'bloom' ? 6 + rand() * 2.5 : 10 + rand() * 6) * (scale || 1);
    lists[k].push([x, y - 0.15, z, s * (0.95 + rand() * 0.3), s, rand() * 6.283, c.getHex()]);
  }
  for (let i = 0; i < 6600; i++) {                                 // 蛇山
    const x = (rand() - 0.5) * 1100, z = -330 + rand() * 480, r = Math.hypot(x, z);
    if (r < 47 || (Math.abs(x - Math.sin(z * 0.045) * 5 * smooth(50, 90, z)) < 6 && z > 30 && z < 175)) continue;
    const dens = fbm(x * 0.013 + 3, z * 0.013 + 8, 3); if (dens < 0.34 + 0.2 * smooth(60, 30, r)) continue;
    if (Math.abs(x) < 20 && z > 0 && z < 110 && rand() < 0.75) continue;      // 正面留出看楼的视线
    plant(x, z, rand() < 0.16 ? 'pine' : 'leaf');
  }
  for (let i = 0; i < 30; i++) { const a = i / 30 * 6.283 + 0.1, rr = 48 + rand() * 7; if (Math.sin(a) > 0.25 && Math.abs(Math.cos(a)) < 0.62) continue; plant(Math.cos(a) * rr, Math.sin(a) * rr, i % 3 === 0 ? 'pine' : i % 3 === 1 ? 'bloom' : 'leaf', 0.9); }
  for (const p of [[-27, 52], [25, 56], [-34, 78], [31, 86], [-15, 118], [17, 128]]) plant(p[0], p[1], 'bloom');
  for (const p of [[-46, 30], [47, 26], [-52, -18], [54, -22]]) plant(p[0], p[1], 'pine', 1.25);
  for (let i = 0; i < 2600; i++) { const x = (rand() - 0.5) * 2600, z = 592 + rand() * 260; if (fbm(x * 0.01, z * 0.01 + 5, 3) < 0.4) continue; plant(x, z, rand() < 0.2 ? 'pine' : 'leaf'); }   // 汉阳树
  for (let i = 0; i < 34; i++) { const a = rand() * 6.283, r = Math.sqrt(rand()); plant(-170 + Math.cos(a) * r * 92, 330 + Math.sin(a) * r * 24, rand() < 0.25 ? 'bloom' : 'leaf', 0.7); }
  const d = new T.Object3D(), col = new T.Color();
  Object.keys(kinds).forEach(function (k) {
    const L = lists[k]; if (!L.length) return;
    const leaf = new T.InstancedMesh(kinds[k].leaf, leafMat, L.length), trunk = new T.InstancedMesh(kinds[k].trunk, barkMat, L.length);
    L.forEach((t, i) => { d.position.set(t[0], t[1], t[2]); d.scale.set(t[3], t[4], t[3]); d.rotation.set(0, t[5], 0); d.updateMatrix(); leaf.setMatrixAt(i, d.matrix); trunk.setMatrixAt(i, d.matrix); leaf.setColorAt(i, col.set(t[6])); });
    leaf.customDepthMaterial = leafDepth; leaf.castShadow = trunk.castShadow = true; leaf.receiveShadow = true; leaf.frustumCulled = trunk.frustumCulled = false;
    leaf.userData.full = trunk.userData.full = L.length; scene.add(leaf, trunk); forests.push(leaf, trunk);
  });
})();

/* ============================== 芳草 ============================== */
let grass = null;
(function () {
  const gt = canvasTex(256, 128, function (g, w, h) { g.clearRect(0, 0, w, h); const r = rng(8); for (let i = 0; i < 90; i++) { const x = 8 + r() * (w - 16), hh = (36 + r() * 88) * (1 - 0.7 * Math.pow(x / w * 2 - 1, 2)), k = 130 + r() * 125 | 0, b = (r() - 0.5) * 30; g.strokeStyle = 'rgb(' + k + ',' + k + ',' + k + ')'; g.lineWidth = 1.5 + r() * 2; g.beginPath(); g.moveTo(x, h); g.quadraticCurveTo(x + b * 0.3, h - hh * 0.6, x + b, h - hh); g.stroke(); } });
  const q = (ry) => { const p = new T.PlaneGeometry(1, 1, 1, 2); p.translate(0, 0.5, 0); p.rotateY(ry); return p; };
  const geo = mergeGeos([q(0), q(Math.PI / 2.6), q(-Math.PI / 2.6)]), n = geo.attributes.position.count, col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const k = 0.35 + 0.65 * geo.attributes.position.getY(i); col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = k; geo.attributes.normal.setXYZ(i, 0, 1, 0); }
  geo.setAttribute('color', new T.BufferAttribute(col, 3));
  const mat = swayPatch(new T.MeshStandardMaterial({ map: gt, alphaTest: 0.3, alphaToCoverage: true, side: T.DoubleSide, vertexColors: true, roughness: 0.95, envMapIntensity: 0.4 }), 0.16);
  const L = [], c = new T.Color(), c2 = new T.Color();
  const put = (x, z, s) => { const y = groundH(x, z); if (y < WATER_Y + 0.25) return; c.set(0x4a6a2c).lerp(c2.set(0x8a9a48), rand() * rand()); L.push([x, y - 0.05, z, s, c.getHex()]); };
  for (let i = 0; i < 16000; i++) { const a = rand() * 6.283, r = Math.sqrt(rand()); put(-170 + Math.cos(a) * r * 118, 330 + Math.sin(a) * r * 36, 0.7 + rand() * 0.9); }    // 鹦鹉洲
  for (let i = 0; i < 6000; i++) { const x = (rand() - 0.5) * 420, z = 122 + rand() * 40; put(x, z, 0.45 + rand() * 0.7); }                                              // 江岸
  grass = new T.InstancedMesh(geo, mat, L.length); const d = new T.Object3D();
  L.forEach((t, i) => { d.position.set(t[0], t[1], t[2]); d.scale.set(t[3] * 2.0, t[3], t[3] * 2.0); d.rotation.set(0, rand() * 6.283, 0); d.updateMatrix(); grass.setMatrixAt(i, d.matrix); grass.setColorAt(i, c.set(t[4])); });
  grass.receiveShadow = true; grass.frustumCulled = false; grass.userData.full = L.length; scene.add(grass);
})();

/* ============================== 黄鹤 ============================== */
const cranes = [];
(function () {
  const mat = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, side: T.DoubleSide, envMapIntensity: 0.6 });
  const IV = [0.98, 0.93, 0.78], GD = [0.93, 0.74, 0.3], BK = [0.05, 0.05, 0.06], RD = [0.75, 0.08, 0.05];
  const paint = (g, f) => { const n = g.attributes.position.count, a = new Float32Array(n * 3), p = g.attributes.position; for (let i = 0; i < n; i++) { const c = f(p.getX(i), p.getY(i), p.getZ(i)); a[i * 3] = c[0]; a[i * 3 + 1] = c[1]; a[i * 3 + 2] = c[2]; } g.setAttribute('color', new T.BufferAttribute(a, 3)); return g; };
  const body = new T.LatheGeometry([[0.001, -0.75], [0.07, -0.6], [0.17, -0.3], [0.2, 0], [0.17, 0.3], [0.09, 0.55], [0.05, 0.7]].map(p => new T.Vector2(p[0], p[1])), 12); body.rotateX(Math.PI / 2); body.scale(1, 0.9, 1);
  const neck = tubeGeo([[0, 0.02, 0.62], [0, 0.07, 1.0], [0, 0.1, 1.4], [0, 0.1, 1.62]], 0.04, 6), head = new T.SphereGeometry(0.07, 8, 6); head.scale(1, 1, 1.3); head.translate(0, 0.1, 1.68);
  const beak = new T.ConeGeometry(0.028, 0.3, 6); beak.rotateX(Math.PI / 2); beak.translate(0, 0.09, 1.9);
  const legs = tubeGeo([[0, -0.08, -0.6], [0, -0.1, -1.2], [0, -0.08, -1.7]], 0.02, 4), tail = new T.ConeGeometry(0.11, 0.42, 6); tail.rotateX(-Math.PI / 2); tail.scale(1, 0.4, 1); tail.translate(0, 0, -0.85);
  const bodyGeo = mergeGeos([paint(body, (x, y, z) => z > 0.2 ? IV : GD.map((v, i) => lerp(v, IV[i], 0.55))), paint(neck, (x, y, z) => z > 1.05 ? BK : IV), paint(head, (x, y, z) => y > 0.14 ? RD : IV), paint(beak, () => [0.5, 0.45, 0.25]), paint(legs, () => BK), paint(tail, () => BK)]);
  const wing = (x0, x1, c0, c1, outer) => paint(gridGeo(6, 3, (u, v) => { const x = lerp(x0, x1, u), ch = lerp(c0, c1, u) * (outer ? 1 - 0.25 * Math.pow(u, 3) : 1); return [x - x0, 0.03 * Math.sin(v * Math.PI) - (outer ? 0.04 * u * u : 0), 0.22 - v * ch, u, v]; }),
    (x, y, z) => { const tr = z < (outer ? 0.02 : -0.08); return outer ? (x > 0.55 || tr ? BK : IV) : (tr ? BK : IV.map((v, i) => lerp(v, GD[i], 0.25))); });
  const inner = wing(0.12, 0.95, 0.56, 0.5, false), outerG = wing(0.95, 2.05, 0.5, 0.2, true);
  for (let i = 0; i < 9; i++) {
    const g = new T.Group(); g.add(new T.Mesh(bodyGeo, mat)); const W = [];
    for (const s of [1, -1]) { const a = new T.Group(), b = new T.Group(); a.position.set(0.12 * s, 0.08, 0.12); a.scale.x = s; a.add(new T.Mesh(inner, mat)); b.position.set(0.83, 0, 0); b.add(new T.Mesh(outerG, mat)); a.add(b); g.add(a); W.push([a, b, s]); }
    g.scale.setScalar(1.55); g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    g.userData = { W, R: 36 + rand() * 46, h: TY + 28 + rand() * 30, w: (0.075 + rand() * 0.05) * (i % 3 ? 1 : -1), ph: rand() * 6.283, fl: 4.6 + rand() * 1.4 };
    scene.add(g); cranes.push(g);
  }
})();

/* ============================== 帆船 ============================== */
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
  const defs = [[-260, 250, 2.0], [140, 300, -1.5], [-60, 430, 1.1], [360, 470, 0.9], [560, 380, 0.5], [-430, 500, -1.0]];
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
let seeWater = true;
function update(dt, time, inside) {
  clock = time; H.uTime.value = time; indoor = lerp(indoor, inside ? 1 : 0, 1 - Math.exp(-dt * 6));
  applyEnv(1 - Math.exp(-dt * 1.7));
  if (env.bakeAt.length && time >= env.bakeAt[0]) { env.bakeAt.shift(); bakeEnv(); }
  sky.position.copy(camera.position);
  const showWater = !inside;
  if (water) { water.visible = showWater && !!H.Q.refl; water.material.uniforms.time.value = time * 0.32; }
  waterLow.visible = showWater && (!H.Q.refl || !water); waterLow.userData.n.offset.set(time * 0.004, time * 0.0017);
  for (const c of cranes) {
    const u = c.userData, a = u.ph + time * u.w, b = a + Math.sign(u.w) * 0.05;
    c.position.set(Math.cos(a) * u.R, u.h + Math.sin(time * 0.33 + u.ph) * 5, Math.sin(a) * u.R);
    c.lookAt(Math.cos(b) * u.R, c.position.y + Math.cos(time * 0.33 + u.ph) * 0.35, Math.sin(b) * u.R); c.rotateZ(-Math.sign(u.w) * 0.22);
    const amp = 0.25 + 0.75 * smooth(0.35, 0.6, vnoise(time * 0.22 + u.ph, u.ph)), f = time * u.fl + u.ph;           // 时而振翅、时而滑翔
    for (const w of u.W) { w[0].rotation.z = w[2] * (0.12 + Math.sin(f) * 0.5 * amp); w[1].rotation.z = (-0.1 + Math.sin(f - 1.0) * 0.55 * amp); }
  }
  for (const b of boats) {
    b.position.x += b.userData.v * dt; if (b.position.x > 1300) b.position.x = -1300; if (b.position.x < -1300) b.position.x = 1300;
    b.position.y = WATER_Y - 0.55 + Math.sin(time * 0.8 + b.position.z) * 0.1; b.rotation.z = Math.sin(time * 0.6 + b.position.z) * 0.02;
  }
}
setQuality();
H.world = { WATER_Y, groundH, ENV, env, setEnv, snapEnv, update, setQuality, sun, bakeEnv };
})();
