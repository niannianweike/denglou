/* 阅江楼 · 后期：HDR 渲染 → 环境光遮蔽 → 辉光 → 电影调色（色调映射、暗角、颗粒）
 * 显卡不支持浮点渲染目标或画质设为“低”时，退回直接渲染 */
(function () {
'use strict';
const H = window.HHL, T = THREE, R = H.renderer;
const can = R.capabilities.isWebGL2 && (R.extensions.has('EXT_color_buffer_float') || R.extensions.has('EXT_color_buffer_half_float')) && !!T.FullScreenQuad && !!T.UnrealBloomPass;
const VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
let rtScene = null, rtAO = null, rtAO2 = null, bloom = null;
const quad = can ? new T.FullScreenQuad(null) : null;

const matAO = new T.ShaderMaterial({
  uniforms: { tDepth: { value: null }, uProj: { value: new T.Matrix4() }, uProjInv: { value: new T.Matrix4() }, uRes: { value: new T.Vector2() }, uRadius: { value: 1.25 }, uInt: { value: 1.25 } },
  vertexShader: VS, depthTest: false, depthWrite: false,
  fragmentShader: `
  uniform sampler2D tDepth; uniform mat4 uProj, uProjInv; uniform vec2 uRes; uniform float uRadius, uInt; varying vec2 vUv;
  vec3 vpos(vec2 uv){ float d = texture2D(tDepth, uv).x; vec4 v = uProjInv * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0); return v.xyz / v.w; }
  float ign(vec2 p){ return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
  void main(){
    float d0 = texture2D(tDepth, vUv).x; if (d0 >= 0.999995) { gl_FragColor = vec4(1.0); return; }
    vec2 px = 1.0 / uRes; vec3 p = vpos(vUv);
    vec3 pr = vpos(vUv + vec2(px.x, 0.0)), pl = vpos(vUv - vec2(px.x, 0.0)), pu = vpos(vUv + vec2(0.0, px.y)), pd = vpos(vUv - vec2(0.0, px.y));
    vec3 dx = abs(pr.z - p.z) < abs(p.z - pl.z) ? pr - p : p - pl, dy = abs(pu.z - p.z) < abs(p.z - pd.z) ? pu - p : p - pd;
    vec3 n = normalize(cross(dx, dy)); float dist = -p.z;
    float Rw = max(uRadius, dist * 0.011), sr = min(Rw * uProj[1][1] * 0.5 / dist, 0.11), bias = 0.02 + 0.0016 * dist;
    float ang = ign(gl_FragCoord.xy) * 6.2831853, occ = 0.0;
    for (int i = 0; i < 12; i++) {
      float fi = float(i), r = sqrt((fi + 0.5) / 12.0) * sr, a = ang + fi * 2.3999632;
      vec3 v = vpos(vUv + vec2(cos(a), sin(a)) * r * vec2(uRes.y / uRes.x, 1.0)) - p; float vv = dot(v, v);
      occ += max(dot(v, n) - bias, 0.0) / (vv + 0.02) * (1.0 - smoothstep(Rw * Rw * 0.6, Rw * Rw * 2.2, vv));
    }
    float ao = clamp(1.0 - occ * uInt * Rw / 12.0, 0.0, 1.0);
    ao = mix(ao, 1.0, smoothstep(260.0, 700.0, dist));
    gl_FragColor = vec4(vec3(ao), 1.0);
  }` });
const matBlur = new T.ShaderMaterial({
  uniforms: { tAO: { value: null }, tDepth: { value: null }, uRes: { value: new T.Vector2() }, uNear: { value: 0.4 }, uFar: { value: 16000 } },
  vertexShader: VS, depthTest: false, depthWrite: false,
  fragmentShader: `
  uniform sampler2D tAO, tDepth; uniform vec2 uRes; uniform float uNear, uFar; varying vec2 vUv;
  float lz(vec2 uv){ float d = texture2D(tDepth, uv).x * 2.0 - 1.0; return 2.0 * uNear * uFar / (uFar + uNear - d * (uFar - uNear)); }
  void main(){
    float z0 = lz(vUv), s = 0.0, w = 0.0; vec2 px = 1.0 / uRes;
    for (int y = -2; y <= 2; y++) for (int x = -2; x <= 2; x++) { vec2 o = vec2(float(x), float(y)) * px; float k = 1.0 / (1.0 + abs(lz(vUv + o) - z0) * 40.0 / z0); s += texture2D(tAO, vUv + o).r * k; w += k; }
    gl_FragColor = vec4(vec3(s / w), 1.0);
  }` });
const matFinal = new T.ShaderMaterial({
  uniforms: { tColor: { value: null }, tAO: { value: null }, uAO: { value: 1 }, uExposure: { value: 1 }, uTime: H.uTime, uVig: { value: 0.55 }, uGrain: { value: 0.022 }, uSat: { value: 1.06 } },
  vertexShader: VS, depthTest: false, depthWrite: false,
  fragmentShader: `
  uniform sampler2D tColor, tAO; uniform float uAO, uExposure, uTime, uVig, uGrain, uSat; varying vec2 vUv;
  vec3 fit(vec3 v){ vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081; return a / b; }
  vec3 aces(vec3 c){
    const mat3 mi = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
    const mat3 mo = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
    return clamp(mo * fit(mi * c), 0.0, 1.0);
  }
  float hash(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
  void main(){
    vec3 c = texture2D(tColor, vUv).rgb; c *= mix(1.0, texture2D(tAO, vUv).r, uAO);
    c = aces(c * uExposure / 0.6);
    float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
    c = mix(vec3(l), c, uSat);                                             // 饱和度
    c = mix(c, c * c * (3.0 - 2.0 * c), 0.16);                              // 柔和的 S 曲线
    c += vec3(0.014, 0.005, -0.014) * smoothstep(0.45, 1.0, l) + vec3(-0.010, 0.000, 0.014) * (1.0 - smoothstep(0.0, 0.45, l));   // 暖高光、冷暗部
    vec2 q = vUv - 0.5; c *= 1.0 - dot(q, q) * uVig;                        // 暗角
    c = mix(pow(max(c, 0.0), vec3(1.0 / 2.4)) * 1.055 - 0.055, c * 12.92, vec3(lessThanEqual(c, vec3(0.0031308))));
    c += (hash(gl_FragCoord.xy + fract(uTime) * 91.7) - 0.5) * uGrain;     // 胶片颗粒，也顺便消除色带
    gl_FragColor = vec4(c, 1.0);
  }` });

function build() {
  for (const t of [rtScene, rtAO, rtAO2]) if (t) t.dispose(); rtScene = rtAO = rtAO2 = null;
  if (!can || !H.Q.post) { R.toneMapping = T.ACESFilmicToneMapping; return; }
  R.toneMapping = T.NoToneMapping;
  const s = R.getDrawingBufferSize(new T.Vector2()), w = Math.max(2, s.x), h = Math.max(2, s.y);
  rtScene = new T.WebGLRenderTarget(w, h, { type: T.HalfFloatType, samples: H.Q.msaa, minFilter: T.LinearFilter, magFilter: T.LinearFilter });
  rtScene.depthTexture = new T.DepthTexture(w, h, T.UnsignedIntType); rtScene.depthTexture.format = T.DepthFormat;
  const hw = Math.max(1, w >> 1), hh = Math.max(1, h >> 1);
  rtAO = new T.WebGLRenderTarget(hw, hh, { depthBuffer: false, minFilter: T.LinearFilter, magFilter: T.LinearFilter }); rtAO2 = rtAO.clone();
  if (!bloom) bloom = new T.UnrealBloomPass(new T.Vector2(w, h), 0.55, 0.72, 3.2); bloom.setSize(w, h);
  matAO.uniforms.uRes.value.set(w, h); matBlur.uniforms.uRes.value.set(hw, hh);
}
H.resizeHooks.push(build); build();

H.exposure = 1; H.bloom = { strength: 0.55, threshold: 3.2 };
function render(scene, camera) {
  if (!rtScene) { R.toneMappingExposure = H.exposure; R.setRenderTarget(null); R.render(scene, camera); return; }
  R.setRenderTarget(rtScene); R.render(scene, camera);
  const ao = H.Q.ao;
  if (ao) {
    matAO.uniforms.tDepth.value = rtScene.depthTexture; matAO.uniforms.uProj.value.copy(camera.projectionMatrix); matAO.uniforms.uProjInv.value.copy(camera.projectionMatrixInverse);
    quad.material = matAO; R.setRenderTarget(rtAO); quad.render(R);
    matBlur.uniforms.tAO.value = rtAO.texture; matBlur.uniforms.tDepth.value = rtScene.depthTexture; matBlur.uniforms.uNear.value = camera.near; matBlur.uniforms.uFar.value = camera.far;
    quad.material = matBlur; R.setRenderTarget(rtAO2); quad.render(R);
  }
  bloom.strength = H.bloom.strength; bloom.threshold = H.bloom.threshold; bloom.render(R, null, rtScene, 0, false);
  const u = matFinal.uniforms; u.tColor.value = rtScene.texture; u.tAO.value = ao ? rtAO2.texture : null; u.uAO.value = ao ? 1 : 0; u.uExposure.value = H.exposure;
  quad.material = matFinal; R.setRenderTarget(null); quad.render(R);
}
H.setQuality = function (name) {
  if (!H.QL[name]) return; H.qualityName = name; H.Q = H.QL[name];
  H.resize(); H.world.setQuality();
};
H.post = { render, can, final: matFinal, ao: matAO };
})();
