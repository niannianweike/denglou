/* 登楼课件 · 导览：视角飞行、12 站讲解、沿途面板、配音（豆包音频优先，没有时用浏览器朗读）、构件标注、工具栏、翻页笔、画质、主循环
 * 每座楼的 main.js 先用 addLabel 加标注，再调 H.tour.run({ VIEWS, STOPS, FLOOR_STOP, PANELS, POEM_PANELS, ... }) */
(function () {
'use strict';
const H = window.HHL, T = THREE;
const { scene, camera, controls, canvas, qs, V3 } = H;
const $ = id => document.getElementById(id);
const TR = H.tour = {};
const labels = [];
TR.lookout = function (k, dx, dy, dz) {
  const tw = H.tower, side = tw.lookoutX || 2.6, z = tw.LZ ? tw.LZ[k] : tw.AZ[k] + 0.6;
  const p = V3(dx > 0.4 ? side : dx < -0.4 ? -side : 0, tw.TY + tw.Y[k] + 1.65, z), d = V3(dx || 0, dy === undefined ? -0.06 : dy, dz === undefined ? 1 : dz).normalize();
  return { pos: p, target: p.clone().add(d) };
};
TR.sayBtn = t => '<button class="say" data-say="' + t + '">🔊 读给我听</button>';
TR.addLabel = function (text, pos, desc, geo, note) {
  const el = document.createElement('div'); el.className = 'label' + (geo ? ' geo' : ''); el.textContent = text;
  el.addEventListener('click', function (e) { e.stopPropagation(); TR.showCard(text, desc, note); });
  $('labels').appendChild(el); labels.push({ el, pos: V3(pos[0], pos[1], pos[2]), text, desc, geo: !!geo });
};
TR.towerIcon = function (levels, opt) {               // “楼的一生”里的小图标：opt = { fire, ruin, roof:颜色 }
  opt = opt || {}; let s = '<svg viewBox="0 0 60 70">';
  if (!levels) s += opt.ruin ? '<path d="M8 62h44" stroke="#c9b48a" stroke-width="3"/><path d="M14 62l4-10 6 4 5-9 7 6 6-5 4 14z" fill="#8a7a5a"/>' : '<path d="M8 62h44" stroke="#c9b48a" stroke-width="3"/><path d="M30 60c-10-8-6-18 0-26 2 8 10 10 6 22z" fill="#e8662a"/><path d="M30 60c-4-4-3-9 0-13 1 4 5 5 3 11z" fill="#ffd978"/>';
  for (let i = 0; i < levels; i++) { const w = 38 - i * 5, y = 62 - i * 13; s += '<rect x="' + (30 - w * 0.36) + '" y="' + (y - 8) + '" width="' + w * 0.72 + '" height="8" fill="#8a2a18"/><path d="M' + (30 - w * 0.64) + ' ' + (y - 8) + 'q' + w * 0.64 + ' -7 ' + w * 1.28 + ' 0z" fill="' + (opt.roof || '#e7b52e') + '"/>'; }
  if (levels) s += '<path d="M' + (30 - 9) + ' ' + (62 - levels * 13 + 5) + 'q9 -12 18 0z" fill="' + (opt.roof || '#e7b52e') + '"/>';
  if (opt.fire && levels) s += '<path d="M48 40c-5-4-3-9 0-13 1 4 5 5 3 11z" fill="#e8662a"/>';
  return s + '</svg>';
};
TR.life = (L, tip) => '<h2>这座楼的一生</h2><ul class="life">' + L.map(l => '<li>' + l[0] + '<div><b>' + l[1] + '</b><span>' + l[2] + '</span></div></li>').join('') + '</ul>' + (tip ? '<p class="tip">' + tip + '</p>' : '');
TR.facts = (title, L) => '<h2>' + title + '</h2><ul class="facts">' + L.map(l => '<li><b>' + l[0] + '</b>' + l[1] + '</li>').join('') + '</ul>';
TR.poem = (title, lines) => '<div class="poem kai"><small>' + title + '</small>' + lines.join('<br>') + '</div>';

TR.run = function (cfg) {
  const { VIEWS, STOPS, FLOOR_STOP, PANELS, POEM_PANELS } = cfg;
  const INSIDE = H.interior.INSIDE, env = H.world.env, ENV = H.world.ENV, groundH = H.world.groundH, WATER_Y = H.world.WATER_Y === undefined ? -1e9 : H.world.WATER_Y;
  const TY = H.tower.TY, BASE = H.tower.BASE;
  function setEnv(name, mist) { H.world.setEnv(name, mist); document.querySelectorAll('[data-env]').forEach(b => b.classList.toggle('on', b.dataset.env === env.name)); $('btnMist').classList.toggle('on', env.mist); }
  let tween = null;
  function flyTo(v, dur) { tween = { p0: camera.position.clone(), t0: controls.target.clone(), p1: v.pos.clone(), t1: v.target.clone(), t: 0, dur: dur || 2.4 }; tween.arc = Math.min(cfg.arcMax || 30, tween.p0.distanceTo(tween.p1) * 0.2); controls.enabled = false; setRotate(false); }
  function jumpTo(v) { camera.position.copy(v.pos); controls.target.copy(v.target); }
  function markView(sel) { document.querySelectorAll('[data-view],[data-floor]').forEach(b => b.classList.toggle('on', b === sel)); }
  function showPanel(name) {
    const ex = $('extra');
    if (!name) ex.hidden = true; else { $('extraBody').innerHTML = PANELS[name](); ex.hidden = false; ex.scrollTop = 0; }
    document.querySelectorAll('[data-panel]').forEach(b => b.classList.toggle('on', !ex.hidden && b.dataset.panel === name));
  }
  /* ---- 声音 ---- */
  let voiceOn = true, stopIdx = -1, inside = -1, lastIn = 0, travelId = 0;
  const AUDIO_BY_TEXT = {}; if (window.HHL_AUDIO) for (const k in window.HHL_AUDIO) AUDIO_BY_TEXT[window.HHL_AUDIO[k]] = k;
  const WARM = {}; let player = new Audio(), speakId = 0;
  Object.defineProperty(window, '__hhlPlayer', { get: () => player });
  function getAudio(key) { if (!WARM[key]) { const a = new Audio(); a.preload = 'auto'; a.src = 'audio/' + key + '.mp3'; WARM[key] = a; } return WARM[key]; }
  function preloadVoice(text) { const key = AUDIO_BY_TEXT[text]; if (key) getAudio(key); }
  const tipEl = document.createElement('div'); tipEl.id = 'voiceTip';
  tipEl.style.cssText = 'position:fixed;z-index:9;left:50%;top:14px;transform:translateX(-50%);padding:8px 18px;border-radius:20px;font-size:16px;white-space:nowrap;background:rgba(28,14,8,.9);border:1px solid #ffd978;color:#ffeebe;box-shadow:0 4px 14px rgba(0,0,0,.5);pointer-events:none;display:none';
  document.body.appendChild(tipEl);
  function voiceTip(msg, warn) { tipEl.textContent = msg || ''; tipEl.style.display = msg ? '' : 'none'; tipEl.style.borderColor = warn ? '#ff8a5a' : '#ffd978'; }
  function browserSpeak(text) { if (!('speechSynthesis' in window)) return; const u = new SpeechSynthesisUtterance(text); u.lang = 'zh-CN'; u.rate = 1; speechSynthesis.speak(u); }
  function speak(text) {
    hush(); const id = ++speakId, key = AUDIO_BY_TEXT[text];
    if (!key) { if (!window.HHL_AUDIO) { browserSpeak(text); return; } console.warn('[配音] 这段文字没有对应的豆包音频，改用浏览器朗读：' + text.slice(0, 20) + '…'); voiceTip('⚠ 这段讲解的配音还没更新，先用电脑自带的声音朗读', true); browserSpeak(text); return; }
    const a = player = getAudio(key); let started = false, failed = false;
    const fail = () => { if (failed || id !== speakId) return; failed = true; delete WARM[key]; voiceTip('⚠ 这段配音文件打不开，先用电脑自带的声音朗读', true); browserSpeak(text); };
    a.onerror = fail; a.onplaying = () => { started = true; if (id === speakId) voiceTip(''); };
    if (a.error) { fail(); return; }
    try { a.currentTime = 0; } catch (e) {}
    const p = a.play(); if (p && p.catch) p.catch(() => { if (a.error) fail(); });
    setTimeout(() => { if (id === speakId && !started && !failed) voiceTip('正在准备声音…'); }, 300);
  }
  function hush() { speakId++; voiceTip(''); player.onerror = player.onplaying = null; try { player.pause(); } catch (e) {} if ('speechSynthesis' in window) speechSynthesis.cancel(); }
  TR.showCard = function (title, desc, note) { const c = $('card'); c.querySelector('h3').textContent = title; c.querySelector('p').textContent = desc; c.querySelector('small').textContent = (note ? note + '　·　' : '') + '点一下关闭'; c.hidden = false; if (voiceOn) speak(desc); };
  /* ---- 行进 ---- */
  function setLimits(k) {
    if (k >= 0) { const d = camera.position.distanceTo(controls.target); controls.minDistance = Math.min(3, d); controls.maxDistance = d + 0.2; controls.minAzimuthAngle = -0.85; controls.maxAzimuthAngle = 0.85; controls.minPolarAngle = 1.25; controls.maxPolarAngle = 1.95; controls.enablePan = false; }
    else { controls.minDistance = 0.5; controls.maxDistance = cfg.maxDist || 900; controls.minAzimuthAngle = -Infinity; controls.maxAzimuthAngle = Infinity; controls.minPolarAngle = 0; controls.maxPolarAngle = Math.PI * 0.96; controls.enablePan = true; }
  }
  function arrive(k) { inside = k; if (k >= 0) lastIn = k; H.interior.enter(k); camera.fov = k >= 0 ? 58 : 45; camera.updateProjectionMatrix(); $('btnOut').textContent = k >= 0 ? (cfg.outText ? cfg.outText(k) : '走到外面走廊看风景') : '回到楼里'; }
  function travel(v, k) {
    k = k === undefined ? -1 : k; const id = ++travelId; setRotate(false);
    if (inside >= 0 || k >= 0) { tween = null; controls.enabled = true; $('fade').classList.add('on'); setTimeout(function () { if (id !== travelId) return; setLimits(-1); jumpTo(v); arrive(k); controls.update(); setLimits(k); $('fade').classList.remove('on'); }, 440); }
    else { setLimits(-1); arrive(-1); if (qs.get('instant')) jumpTo(v); else flyTo(v); }
  }
  function renderGuide() {
    const s = STOPS[stopIdx];
    $('stopNo').textContent = '第 ' + (stopIdx + 1) + ' 站 / 共 ' + STOPS.length + ' 站'; $('stopTitle').textContent = s.t; $('stopText').textContent = s.s;
    $('btnOut').hidden = s.k === undefined || (cfg.noOut && cfg.noOut.includes(s.k));
    $('btnPrev').disabled = stopIdx === 0; $('btnPrev').style.opacity = stopIdx === 0 ? 0.4 : 1;
    $('btnNext').textContent = stopIdx === STOPS.length - 1 ? '从头再逛 ↺' : '下一站 ▶';
    [...$('dots').children].forEach((d, i) => { d.classList.toggle('on', i === stopIdx); d.classList.toggle('done', i < stopIdx); });
    document.querySelectorAll('[data-floor]').forEach(b => b.classList.toggle('on', +b.dataset.floor === s.k));
    document.querySelectorAll('[data-view]').forEach(b => b.classList.remove('on'));
  }
  function goStop(i, quiet) {
    stopIdx = (i + STOPS.length) % STOPS.length; const s = STOPS[stopIdx];
    document.body.classList.add('started'); $('guide').hidden = false; $('btnTour').classList.add('on'); $('card').hidden = true;
    renderGuide(); setEnv(s.e, !!s.mist); showPanel(s.p || null);
    travel(s.k !== undefined ? INSIDE[s.k].view : s.v, s.k);
    if (voiceOn && !quiet) speak(s.s); else hush();
    preloadVoice(STOPS[(stopIdx + 1) % STOPS.length].s);
  }
  function quitTour() { hush(); $('guide').hidden = true; $('btnTour').classList.remove('on'); showPanel(null); document.querySelectorAll('[data-floor]').forEach(b => b.classList.remove('on')); if (inside >= 0) travel(VIEWS.overview); }
  STOPS.forEach((s, i) => { const d = document.createElement('i'); d.textContent = i + 1; d.title = s.t; d.onclick = () => goStop(i); $('dots').appendChild(d); });
  /* ---- 标注 ---- */
  const tmpV = V3(0, 0, 0), far = cfg.labelFar || 190;
  function updateLabels() {
    const w = window.innerWidth, h = window.innerHeight;
    for (const l of labels) {
      tmpV.copy(l.pos).project(camera); const d = camera.position.distanceTo(l.pos);
      const ok = inside < 0 && tmpV.z < 1 && Math.abs(tmpV.x) < 1 && Math.abs(tmpV.y) < 1 && d > 6 && (l.geo || d < far);
      l.el.style.display = ok ? '' : 'none';
      if (ok) l.el.style.transform = 'translate(' + ((tmpV.x * 0.5 + 0.5) * w + 10 | 0) + 'px,' + ((-tmpV.y * 0.5 + 0.5) * h - 14 | 0) + 'px)';
    }
  }
  /* ---- 交互 ---- */
  function setRotate(on) { controls.autoRotate = on; $('btnRotate').classList.toggle('on', on); }
  $('btnStart').onclick = () => goStop(0);
  $('btnFree').onclick = () => { document.body.classList.add('started'); travel(VIEWS.overview); };
  $('btnTour').onclick = () => $('guide').hidden ? goStop(Math.max(stopIdx, 0)) : quitTour();
  $('btnQuit').onclick = quitTour;
  $('btnNext').onclick = () => goStop(stopIdx + 1);
  $('btnPrev').onclick = () => { if (stopIdx > 0) goStop(stopIdx - 1); };
  $('btnSay').onclick = () => speak(STOPS[stopIdx].s);
  $('btnVoice').onclick = e => { voiceOn = !voiceOn; e.currentTarget.classList.toggle('on', voiceOn); e.currentTarget.textContent = voiceOn ? '🔊 声音' : '🔇 静音'; if (!voiceOn) hush(); };
  $('btnOut').onclick = () => { if (inside >= 0) travel(cfg.outView ? cfg.outView(inside) : TR.lookout(inside)); else travel(INSIDE[lastIn].view, lastIn); };
  $('extraClose').onclick = () => showPanel(null);
  $('extraBody').addEventListener('click', e => { const b = e.target.closest('[data-say]'); if (b) speak(b.dataset.say); });
  document.querySelectorAll('[data-panel]').forEach(b => b.onclick = () => showPanel(b.classList.contains('on') ? null : b.dataset.panel));
  document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => { travel(VIEWS[b.dataset.view]); markView(b); });
  document.querySelectorAll('[data-floor]').forEach(b => b.onclick = () => goStop(FLOOR_STOP[+b.dataset.floor]));
  document.querySelectorAll('[data-env]').forEach(b => b.onclick = () => setEnv(b.dataset.env));
  $('btnMist').onclick = () => setEnv(null, !env.mist);
  $('btnRotate').onclick = () => { const on = !controls.autoRotate; if (on && (inside >= 0 || controls.target.distanceTo(camera.position) < 5)) { travel(VIEWS.overview); setTimeout(() => setRotate(true), 2600); return; } setRotate(on); };
  $('btnLabels').onclick = e => { $('labels').classList.toggle('off'); e.currentTarget.classList.toggle('on'); };
  $('btnFull').onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); };
  $('btnHide').onclick = () => document.body.classList.add('immersive');
  $('card').onclick = () => { $('card').hidden = true; hush(); };
  canvas.addEventListener('pointerdown', () => { if (controls.autoRotate && document.body.classList.contains('started')) setRotate(false); });
  window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (k === 'h') document.body.classList.toggle('immersive');
    else if (k === 'escape') { document.body.classList.remove('immersive'); $('card').hidden = true; }
    else if (!document.body.classList.contains('started')) { if (k === 'enter' || k === ' ') goStop(0); }
    else if (k === 'arrowright' || k === 'pagedown') goStop(stopIdx + 1);
    else if (k === 'arrowleft' || k === 'pageup') { if (stopIdx > 0) goStop(stopIdx - 1); }
    else if (k >= '1' && k <= String(FLOOR_STOP.length)) goStop(FLOOR_STOP[+k - 1]);
    else if (k === ' ') { e.preventDefault(); $('btnRotate').click(); }
    else if (k === 'f') $('btnFull').click();
  });
  /* ---- 画质 ---- */
  const QN = { high: '高', mid: '中', low: '低' }, QORDER = ['high', 'mid', 'low'];
  function showQuality() { $('btnQuality').textContent = '画质：' + QN[H.qualityName]; }
  $('btnQuality').onclick = () => { autoQ.done = true; H.setQuality(QORDER[(QORDER.indexOf(H.qualityName) + 1) % 3]); showQuality(); };
  const autoQ = { t: 0, n: 0, low: 0, done: !!qs.get('q') };
  function autoQuality(raw) {
    if (autoQ.done || first) return;
    if ((autoQ.warm = (autoQ.warm || 0) + raw) < 5) return;
    autoQ.t += raw; autoQ.n++; window.__hhlFps = autoQ.n / autoQ.t; if (autoQ.t < 3) return;
    const fps = autoQ.n / autoQ.t, i = QORDER.indexOf(H.qualityName);
    if (fps < 24 && i < 2 && ++autoQ.low < 2) { autoQ.t = 0; autoQ.n = 0; } else if (fps < 24 && i < 2) { autoQ.low = 0; H.setQuality(QORDER[i + 1]); showQuality(); voiceTip('这台电脑有点吃力，已自动调低画质，画面会更流畅'); setTimeout(() => { if (tipEl.textContent.indexOf('画质') > 0) voiceTip(''); }, 5000); autoQ.t = 0; autoQ.n = 0; autoQ.warm = 1.5; } else autoQ.done = true;
  }
  showQuality();
  /* ---- 主循环 ---- */
  const clock = new T.Clock(); let time = 0, first = true;
  function frame() {
    requestAnimationFrame(frame);
    const raw = clock.getDelta(), dt = Math.min(raw, 0.1); time += dt;
    if (tween) { tween.t = Math.min(1, tween.t + Math.min(raw, 0.6) / tween.dur); const e = tween.t * tween.t * (3 - 2 * tween.t); camera.position.lerpVectors(tween.p0, tween.p1, e); camera.position.y += Math.sin(Math.PI * e) * tween.arc; controls.target.lerpVectors(tween.t0, tween.t1, e); if (tween.t >= 1) { tween = null; controls.enabled = true; } }
    controls.update();
    if (inside < 0) {
      const p = camera.position, onBase = BASE && Math.abs(p.x - (BASE.cx || 0)) < BASE.hx && Math.abs(p.z - (BASE.cz || 0)) < BASE.hz ? (BASE.top === undefined ? TY : BASE.top) : -1e9;
      const minY = Math.max(groundH(p.x, p.z), WATER_Y, onBase) + 1.3; if (p.y < minY) p.y = minY;
    }
    H.world.update(dt, time, inside >= 0);
    H.post.render(scene, camera);
    autoQuality(raw); updateLabels();
    if (first) { first = false; $('loading').classList.add('done'); }
  }
  setEnv('day', false); jumpTo(cfg.start || VIEWS.front); setRotate(true);
  preloadVoice(STOPS[0].s);
  (function checkVoices() {
    const want = STOPS.map((s, i) => ['第 ' + (i + 1) + ' 站「' + s.t + '」', s.s]).concat(labels.map(l => ['标注「' + l.text + '」', l.desc]));
    (POEM_PANELS || []).map(p => PANELS[p]()).join('').replace(/data-say="([^"]*)"/g, (m, t) => { want.push(['诗朗读「' + t.slice(0, 8) + '…」', t]); return m; });
    const missing = want.filter(w => !AUDIO_BY_TEXT[w[1]]).map(w => w[0]);
    window.__hhlVoiceCheck = { total: want.length, missing };
    if (missing.length && window.HHL_AUDIO) console.warn('[配音] 以下 ' + missing.length + ' 段的文字和配音对不上，请运行 node tools/gen-audio.js 重新合成：\n  ' + missing.join('\n  '));
  })();
  if (qs.get('view') && VIEWS[qs.get('view')]) { document.body.classList.add('started'); setRotate(false); jumpTo(VIEWS[qs.get('view')]); }
  if (qs.get('stop')) { voiceOn = false; goStop(+qs.get('stop') - 1, true); if (qs.get('out') && inside < 0 && STOPS[stopIdx].k !== undefined) setTimeout(() => $('btnOut').click(), 600); }
  if (qs.get('env') && ENV[qs.get('env')]) setEnv(qs.get('env'), qs.get('mist') === '1');
  if (qs.get('panel') && PANELS[qs.get('panel')]) { document.body.classList.add('started'); showPanel(qs.get('panel')); }
  if (qs.get('label')) { document.body.classList.add('started'); voiceOn = false; setRotate(false); const l = labels[+qs.get('label')]; if (l) l.el.click(); }
  if (qs.get('ui') === '0') document.body.classList.add('immersive');
  H.world.snapEnv();
  frame();
};
})();
