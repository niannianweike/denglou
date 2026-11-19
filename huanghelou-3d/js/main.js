/* 黄鹤楼 · 导览与界面：视角、12 站讲解、沿途面板、配音、标注、交互、主循环
 * 画面由 engine / tower / world / interior / post 五个文件负责，这里只管“带人参观” */
(function () {
'use strict';
const H = window.HHL, T = THREE;
const { scene, camera, controls, canvas, renderer, qs, V3, lerp } = H;
const { E, PP, Y, TY, YTOP, colTopY, eaveEdgeY } = H.tower;
const { WATER_Y, groundH, ENV, env } = H.world;
const INSIDE = H.interior.INSIDE;
const $ = id => document.getElementById(id);
function setEnv(name, mist) {
  H.world.setEnv(name, mist);
  document.querySelectorAll('[data-env]').forEach(b => b.classList.toggle('on', b.dataset.env === env.name));
  $('btnMist').classList.toggle('on', env.mist);
}

/* ============================== 视角 ============================== */
function lookout(k, dx, dy, dz) {
  const p = V3(dx > 0.4 ? 2.6 : dx < -0.4 ? -2.6 : 0, TY + Y[k] + 1.65, E[k] + 0.38), d = V3(dx || 0, dy === undefined ? -0.06 : dy, dz === undefined ? 1 : dz).normalize();
  return { pos: p, target: p.clone().add(d) };
}
const VIEWS = {
  overview: { pos: V3(88, 40, 132), target: V3(0, 27, 0) },
  front: { pos: V3(0, 17, 126), target: V3(0, 27, 0) },
  lookup: { pos: V3(23, 5.2, 36), target: V3(0, 36, 0) },
  bird: { pos: V3(80, 150, 115), target: V3(0, 18, 0) },
  river: { pos: V3(-34, -17, 300), target: V3(0, 16, 0) },
  cranes: { pos: V3(66, 30, 96), target: V3(0, 54, 0) },
  clouds: { pos: V3(26, 4.8, 40), target: V3(6, 70, 0) },
  bloom: { pos: V3(40, 5.5, 62), target: V3(0, 22, 0) },
  mist: { pos: V3(-30, -19, 225), target: V3(-130, -22, 430) }
};
let tween = null;
function flyTo(v, dur) {
  tween = { p0: camera.position.clone(), t0: controls.target.clone(), p1: v.pos.clone(), t1: v.target.clone(), t: 0, dur: dur || 2.4 };
  tween.arc = Math.min(45, tween.p0.distanceTo(tween.p1) * 0.22);
  controls.enabled = false; setRotate(false);
}
function jumpTo(v) { camera.position.copy(v.pos); controls.target.copy(v.target); }
function markView(sel) { document.querySelectorAll('[data-view],[data-floor]').forEach(b => b.classList.toggle('on', b === sel)); }

/* ============================== 导览站点（讲解词） ============================== */
const STOPS = [
  { t: '远远望见黄鹤楼', v: VIEWS.river, e: 'day', s: '你好，我是小鹤！看，山顶那座金色的楼就是黄鹤楼。它在湖北武汉，站在长江边的蛇山上。跟我上去看看吧！' },
  { t: '它在哪儿？', v: { pos: V3(-70, 150, -170), target: V3(0, 0, 110) }, e: 'day', p: 'map', s: '从天上往下看，这条大河是长江，中国最长的河。江水把武汉分成武昌、汉口、汉阳三块。黄鹤楼在武昌的蛇山上。' },
  { t: '走上石台基', v: { pos: V3(30, 6.2, 50), target: V3(0, 10, 4) }, e: 'day', s: '楼下面有两层石头台子，叫台基。它把楼垫得高高的，下雨泡不着，看起来也更神气。我们顺着台阶走上去！' },
  { t: '好高的楼', v: VIEWS.front, e: 'day', p: 'facts', s: '抬头数一数，外面看有五层。它有五十一米多高，差不多是十七层居民楼！屋顶铺着十多万块金黄的琉璃瓦。' },
  { t: '会飞的屋檐', v: VIEWS.lookup, e: 'day', s: '屋檐的角为什么往上翘？这样雨水甩得远，屋里也更亮。六十个翘角一起扬起来，像不像黄鹤张开了翅膀？' },
  { t: '一层 · 白云黄鹤图', k: 0, e: 'day', s: '进门啦！这幅壁画叫《白云黄鹤图》，有三层楼那么高。相传很久以前，一位仙人在这里骑着黄鹤飞上了天，楼的名字就是这么来的。' },
  { t: '二层 · 楼的一生', k: 1, e: 'day', p: 'life', s: '石碑上刻的是唐朝人写的《黄鹤楼记》。这些小模型是不同朝代的黄鹤楼。它被大火烧掉过好多次，人们又一次次把它建起来。' },
  { t: '三层 · 诗人来过', k: 2, e: 'day', p: 'poem1', s: '墙上画的是来过这里的大诗人。崔颢写的《黄鹤楼》太有名了。相传李白读了说：眼前有景道不得，崔颢题诗在上头。意思是，他写得太好，我不敢写啦！' },
  { t: '四层 · 写字画画', k: 3, e: 'day', s: '这一层用屏风隔成小厅，挂着书画家的字和画。从古到今，好多人登楼看了风景，就想写一写、画一画。你想画什么呢？' },
  { t: '五层 · 长江万里图', k: 4, e: 'day', s: '到顶层啦！这幅长长的画叫《长江万里图》。长江从雪山出发，穿过三峡，流过武汉，最后奔向大海，有六千多公里长。' },
  { t: '登顶看长江', v: lookout(4, 0.5, -0.1, 1), e: 'day', p: 'poem2', s: '到外面的走廊来！脚下是长江，对岸是汉阳。一千多年前，李白就在这里送好朋友坐船去扬州，一直望到小船看不见。' },
  { t: '再见，黄鹤楼', v: VIEWS.cranes, e: 'dusk', p: 'three', s: '楼顶金色的葫芦叫宝顶。黄鹤楼和湖南的岳阳楼、江西的滕王阁，合称江南三大名楼。武汉人把它当作家乡的标志。再见啦！' }
];
const FLOOR_STOP = [5, 6, 7, 8, 9];

/* ============================== 沿途内容面板 ============================== */
function towerIcon(levels, fire) {
  let s = '<svg viewBox="0 0 60 70">';
  if (!levels) s += '<path d="M8 62h44" stroke="#c9b48a" stroke-width="3"/><path d="M30 60c-10-8-6-18 0-26 2 8 10 10 6 22z" fill="#e8662a"/><path d="M30 60c-4-4-3-9 0-13 1 4 5 5 3 11z" fill="#ffd978"/>';
  for (let i = 0; i < levels; i++) {
    const w = 34 - i * 5, y = 62 - i * 11;
    s += '<rect x="' + (30 - w * 0.36) + '" y="' + (y - 7) + '" width="' + w * 0.72 + '" height="7" fill="#b03a26"/>';
    s += '<path d="M' + (30 - w * 0.62) + ' ' + (y - 7) + 'q' + w * 0.62 + ' -7 ' + w * 1.24 + ' 0z" fill="#e7b52e"/>';
  }
  if (levels) s += '<path d="M24 ' + (62 - levels * 11 + 1) + 'l6 -8 6 8z" fill="#e7b52e"/>';
  if (fire && levels) s += '<path d="M48 40c-5-4-3-9 0-13 1 4 5 5 3 11z" fill="#e8662a"/>';
  return s + '</svg>';
}
const sayBtn = t => '<button class="say" data-say="' + t + '">🔊 读给我听</button>';
const PANELS = {
  map: function () {
    return '<h2>黄鹤楼在哪儿？</h2>' +
      '<svg viewBox="0 0 400 290"><rect width="400" height="290" fill="#dfe8c8"/>' +
      '<path d="M0 108C80 118 140 148 205 166" stroke="#7fc1e6" stroke-width="13" fill="none"/>' +
      '<path d="M60 300C110 225 165 192 215 160S335 88 410 44" stroke="#4f9fd4" stroke-width="34" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="150" cy="200" rx="30" ry="13" fill="#6f9a5a"/><ellipse cx="282" cy="186" rx="40" ry="11" fill="#6f9a5a" transform="rotate(8 282 186)"/>' +
      '<path d="M176 196L248 176" stroke="#555" stroke-width="4"/>' +
      '<path d="M252 160l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z" fill="#d22a1a" stroke="#fff" stroke-width="1.5"/>' +
      '<g font-family="Microsoft YaHei,sans-serif" font-weight="700" text-anchor="middle">' +
      '<text x="110" y="62" font-size="24" fill="#7a3a12">汉口</text><text x="70" y="180" font-size="24" fill="#7a3a12">汉阳</text><text x="320" y="246" font-size="24" fill="#7a3a12">武昌</text>' +
      '<text x="345" y="60" font-size="18" fill="#fff" transform="rotate(-30 345 60)">长 江</text><text x="60" y="100" font-size="14" fill="#2a6f9a">汉江</text>' +
      '<text x="150" y="228" font-size="13" fill="#2f4f24">龟山</text><text x="300" y="212" font-size="13" fill="#2f4f24">蛇山</text>' +
      '<text x="262" y="150" font-size="16" fill="#b3261a">黄鹤楼</text><text x="208" y="204" font-size="11" fill="#333">长江大桥</text>' +
      '<text x="374" y="270" font-size="13" fill="#555">北↑</text></g></svg>' +
      '<p>长江和汉江在这里碰面，把武汉分成了三块：<b>武昌、汉口、汉阳</b>，大家叫它们“武汉三镇”。</p>' +
      '<p>黄鹤楼（红星）在武昌的<b>蛇山</b>顶上，紧挨着长江。江对面是<b>龟山</b>，一座大桥把两座山连了起来。</p>' +
      '<p class="tip">站在山顶的楼上，三镇和大江都能看见——所以最早这里是一座放哨的瞭望楼。</p>';
  },
  life: function () {
    const L = [
      [towerIcon(2), '三国 · 公元 223 年', '相传孙权在江边筑城，山头上盖了一座瞭望楼，士兵在上面放哨。这就是最早的黄鹤楼。'],
      [towerIcon(2), '唐朝', '仗打得少了，这里变成看风景的好地方。崔颢、李白这些大诗人都来过，楼也出了名。'],
      [towerIcon(3, true), '宋、元、明、清', '木头盖的楼最怕火。光是明朝和清朝，它就毁了 7 次，人们又修又建了 10 次。每个朝代的样子都不太一样。'],
      [towerIcon(3), '清朝同治年间', '又盖起一座三层的楼，叫“同治楼”。它留下了照片，所以我们知道它长什么样。'],
      [towerIcon(0), '1884 年', '一场大火把同治楼烧没了。之后大约一百年，武汉没有黄鹤楼。'],
      [towerIcon(5), '1981—1985 年', '新楼在蛇山顶上建成了，离老地方大约一千米。样子照着同治楼设计，但更高更大，用钢筋水泥建造，不怕火了。']
    ];
    return '<h2>这座楼的一生</h2><ul class="life">' + L.map(l => '<li>' + l[0] + '<div><b>' + l[1] + '</b><span>' + l[2] + '</span></div></li>').join('') + '</ul>' +
      '<p class="tip">今天的楼不是三国那一座，可它还在长江边、蛇山上，样子也是照着老楼来的。为什么烧了还要建？因为大家舍不得它——有黄鹤楼，才像武汉。</p>';
  },
  poem1: function () {
    return '<h2>在三层遇到一首诗</h2><div class="poem kai"><small>《黄鹤楼》　唐 · 崔颢</small>昔人已乘黄鹤去，<br>此地空余黄鹤楼。<br>黄鹤一去不复返，<br>白云千载空悠悠。<br>晴川历历汉阳树，<br>芳草萋萋鹦鹉洲。<br>日暮乡关何处是？<br>烟波江上使人愁。</div>' +
      sayBtn('黄鹤楼。唐，崔颢。昔人已乘黄鹤去，此地空余黄鹤楼。黄鹤一去不复返，白云千载空悠悠。晴川历历汉阳树，芳草萋萋鹦鹉洲。日暮乡关何处是？烟波江上使人愁。') +
      '<p>诗里说：仙人骑着黄鹤飞走了，只留下这座楼和天上的白云。诗人站在楼上看长江，看着看着，就想家了。</p>' +
      '<p class="tip">小故事：李白还写过一句“黄鹤楼中吹玉笛，江城五月落梅花”。后来，人们就把武汉叫作“江城”。</p>';
  },
  poem2: function () {
    return '<h2>李白在这里送朋友</h2><div class="poem kai"><small>《黄鹤楼送孟浩然之广陵》　唐 · 李白</small>故人西辞黄鹤楼，<br>烟花三月下扬州。<br>孤帆远影碧空尽，<br>唯见长江天际流。</div>' +
      sayBtn('黄鹤楼送孟浩然之广陵。唐，李白。故人西辞黄鹤楼，烟花三月下扬州。孤帆远影碧空尽，唯见长江天际流。') +
      '<p>春天，李白在黄鹤楼送好朋友孟浩然坐船去扬州。船越走越远，最后看不见了，只剩长江水流向天边。</p>' +
      '<p class="tip">你看江上那几只小帆船——李白当年望着的，大概就是这样的帆。</p>';
  },
  three: function () {
    return '<h2>江南三大名楼</h2><div class="three"><div class="me"><b>黄鹤楼</b>湖北 · 武汉<br>长江边</div><div><b>岳阳楼</b>湖南 · 岳阳<br>洞庭湖边</div><div><b>滕王阁</b>江西 · 南昌<br>赣江边</div></div>' +
      '<p>三座楼都站在水边，都很古老，也都因为有人为它们写下了特别好的诗和文章，才被大家记住。</p>' +
      '<p class="tip">黄鹤楼还有个响亮的外号，叫“天下江山第一楼”。武汉人出远门回来，看见它，就知道到家了。</p>';
  },
  facts: function () {
    return '<h2>黄鹤楼小知识</h2><ul class="facts">' +
      '<li><b>它有多高？</b>51.4 米，差不多是 17 层居民楼。</li>' +
      '<li><b>它有几层？</b>从外面数是 5 层。据介绍，走进去其实有 9 层，有几层夹在屋檐后面，外面看不出来。</li>' +
      '<li><b>它多大年纪？</b>最早的黄鹤楼相传建于三国时期，到现在大约 1800 年。今天这一座是 1985 年建好的。</li>' +
      '<li><b>用了多少东西？</b>据介绍有 72 根大柱子、60 个翘角、十多万块金黄的琉璃瓦。</li>' +
      '<li><b>有多宽？</b>最下面一层每边约 30 米，往上一层比一层小，顶层每边约 18 米。</li></ul>';
  }
};
function showPanel(name) {
  const ex = $('extra');
  if (!name) { ex.hidden = true; } else { $('extraBody').innerHTML = PANELS[name](); ex.hidden = false; ex.scrollTop = 0; }
  document.querySelectorAll('[data-panel]').forEach(b => b.classList.toggle('on', !ex.hidden && b.dataset.panel === name));
}

/* ============================== 讲解与行进 ============================== */
let voiceOn = true, stopIdx = -1, inside = -1, lastIn = 0, travelId = 0;
/* 讲解声音：优先播放 audio/ 里预先用豆包语音合成的 mp3；没有对应音频时退回浏览器自带朗读 */
const AUDIO_BY_TEXT = {}; if (window.HHL_AUDIO) for (const k in window.HHL_AUDIO) AUDIO_BY_TEXT[window.HHL_AUDIO[k]] = k;
const WARM = {};                               // 已预取的音频元素，播放时直接复用，点了就出声
let player = new Audio(), speakId = 0;
Object.defineProperty(window, '__hhlPlayer', { get: () => player });   // 仅供自动化测试查看播放状态
function getAudio(key) { if (!WARM[key]) { const a = new Audio(); a.preload = 'auto'; a.src = 'audio/' + key + '.mp3'; WARM[key] = a; } return WARM[key]; }
function preloadVoice(text) { const key = AUDIO_BY_TEXT[text]; if (key) getAudio(key); }
/* 顶部小提示：声音还在加载，或配音与文字对不上时，让人看得见，而不是悄悄换声音 */
const tipEl = document.createElement('div'); tipEl.id = 'voiceTip';
tipEl.style.cssText = 'position:fixed;z-index:9;left:50%;top:14px;transform:translateX(-50%);padding:8px 18px;border-radius:20px;font-size:16px;white-space:nowrap;background:rgba(28,14,8,.9);border:1px solid #ffd978;color:#ffeebe;box-shadow:0 4px 14px rgba(0,0,0,.5);pointer-events:none;display:none';
document.body.appendChild(tipEl);
function voiceTip(msg, warn) { tipEl.textContent = msg || ''; tipEl.style.display = msg ? '' : 'none'; tipEl.style.borderColor = warn ? '#ff8a5a' : '#ffd978'; tipEl.dataset.kind = msg ? (warn ? 'warn' : 'wait') : ''; }
function browserSpeak(text) {
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text); u.lang = 'zh-CN'; u.rate = 1; speechSynthesis.speak(u);
}
function speak(text) {
  hush(); const id = ++speakId, key = AUDIO_BY_TEXT[text];
  if (!key) {                                   // 文字改过、配音没重新合成
    console.warn('[配音] 这段文字没有对应的豆包音频，改用浏览器朗读：' + text.slice(0, 20) + '…');
    voiceTip('⚠ 这段讲解的配音还没更新，先用电脑自带的声音朗读', true); browserSpeak(text); return;
  }
  const a = player = getAudio(key); let started = false, failed = false;
  const fail = () => {
    if (failed || id !== speakId) return; failed = true; delete WARM[key];
    console.warn('[配音] 音频 audio/' + key + '.mp3 打不开，改用浏览器朗读');
    voiceTip('⚠ 这段配音文件打不开，先用电脑自带的声音朗读', true); browserSpeak(text);
  };
  a.onerror = fail;
  a.onplaying = () => { started = true; if (id === speakId) voiceTip(''); };
  if (a.error) { fail(); return; }
  try { a.currentTime = 0; } catch (e) {}
  const p = a.play(); if (p && p.catch) p.catch(() => { if (a.error) fail(); });
  setTimeout(() => { if (id === speakId && !started && !failed) voiceTip('正在准备声音…'); }, 300);
}
function hush() {
  speakId++; voiceTip('');
  player.onerror = player.onplaying = null; try { player.pause(); } catch (e) {}
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}
function setLimits(k) {
  if (k >= 0) {
    const d = camera.position.distanceTo(controls.target);
    controls.minDistance = Math.min(3, d); controls.maxDistance = d + 0.2;
    controls.minAzimuthAngle = -0.85; controls.maxAzimuthAngle = 0.85; controls.minPolarAngle = 1.25; controls.maxPolarAngle = 1.95; controls.enablePan = false;
  } else {
    controls.minDistance = 0.5; controls.maxDistance = 900; controls.minAzimuthAngle = -Infinity; controls.maxAzimuthAngle = Infinity;
    controls.minPolarAngle = 0; controls.maxPolarAngle = Math.PI * 0.96; controls.enablePan = true;
  }
}
function arrive(k) {
  inside = k; if (k >= 0) lastIn = k;
  H.interior.enter(k);
  camera.fov = k >= 0 ? 58 : 45; camera.updateProjectionMatrix();
  $('btnOut').textContent = k >= 0 ? '走到外面走廊看风景' : '回到楼里';
}
function travel(v, k) {                       // k>=0 表示进入第 k 层室内
  k = k === undefined ? -1 : k; const id = ++travelId; setRotate(false);
  if (inside >= 0 || k >= 0) {                // 进出楼：淡入淡出
    tween = null; controls.enabled = true; $('fade').classList.add('on');
    setTimeout(function () {
      if (id !== travelId) return;
      setLimits(-1); jumpTo(v); arrive(k); controls.update(); setLimits(k); $('fade').classList.remove('on');
    }, 440);
  } else { setLimits(-1); arrive(-1); if (qs.get('instant')) jumpTo(v); else flyTo(v); }
}
function renderGuide() {
  const s = STOPS[stopIdx];
  $('stopNo').textContent = '第 ' + (stopIdx + 1) + ' 站 / 共 ' + STOPS.length + ' 站';
  $('stopTitle').textContent = s.t; $('stopText').textContent = s.s;
  $('btnOut').hidden = s.k === undefined;
  $('btnPrev').disabled = stopIdx === 0; $('btnPrev').style.opacity = stopIdx === 0 ? 0.4 : 1;
  $('btnNext').textContent = stopIdx === STOPS.length - 1 ? '从头再逛 ↺' : '下一站 ▶';
  [...$('dots').children].forEach((d, i) => { d.classList.toggle('on', i === stopIdx); d.classList.toggle('done', i < stopIdx); });
  document.querySelectorAll('[data-floor]').forEach(b => b.classList.toggle('on', +b.dataset.floor === s.k));
  document.querySelectorAll('[data-view]').forEach(b => b.classList.remove('on'));
}
function goStop(i, quiet) {
  stopIdx = (i + STOPS.length) % STOPS.length; const s = STOPS[stopIdx];
  document.body.classList.add('started'); $('guide').hidden = false; $('btnTour').classList.add('on'); $('card').hidden = true;
  renderGuide(); setEnv(s.e, false); showPanel(s.p || null);
  travel(s.k !== undefined ? INSIDE[s.k].view : s.v, s.k);
  if (voiceOn && !quiet) speak(s.s); else hush();
  preloadVoice(STOPS[(stopIdx + 1) % STOPS.length].s);          // 提前取好下一站的声音
}
function quitTour() {
  hush(); $('guide').hidden = true; $('btnTour').classList.remove('on'); showPanel(null);
  document.querySelectorAll('[data-floor]').forEach(b => b.classList.remove('on'));
  if (inside >= 0) travel(VIEWS.overview);
}
STOPS.forEach((s, i) => { const d = document.createElement('i'); d.textContent = i + 1; d.title = s.t; d.onclick = () => goStop(i); $('dots').appendChild(d); });

/* ============================== 构件标注（点开有讲解） ============================== */
const labels = [], labelRoot = $('labels');
function showCard(title, desc, note) { const c = $('card'); c.querySelector('h3').textContent = title; c.querySelector('p').textContent = desc; c.querySelector('small').textContent = (note ? note + '　·　' : '') + '点一下关闭'; c.hidden = false; if (voiceOn) speak(desc); }
function addLabel(text, pos, desc, geo, note) {
  const el = document.createElement('div'); el.className = 'label' + (geo ? ' geo' : ''); el.textContent = text;
  el.addEventListener('click', function (e) { e.stopPropagation(); showCard(text, desc, note); });
  labelRoot.appendChild(el); labels.push({ el, pos: V3(pos[0], pos[1], pos[2]), text, desc });
}
const a2 = E[2] - PP[2];
addLabel('葫芦宝顶', [0, TY + 49.5, 0], '楼顶最高处这个金色的“葫芦”，叫宝顶，大约有两层楼那么高。它正好盖在屋顶最尖的地方，把缝压牢，雨水就漏不进去。“葫芦”听起来像“福禄”，人们觉得它能带来好运。');
addLabel('尖尖的屋顶', [5, TY + 42.5, 5], '屋顶为什么是尖的？四面的屋顶都往中间靠，最后聚成一个尖，这种屋顶叫“攒尖顶”。屋顶又尖又陡，下雨时水一下就流走，不会积在上面把木头泡坏。', false, '攒尖顶读作 cuán jiān dǐng');
addLabel('匾额', [3.2, TY + colTopY[4] + 0.2, E[4] + 1.2], '屋檐下挂的大牌子叫匾额，就像楼的“名牌”。最上面这块写着“黄鹤楼”三个金色大字。古时候的楼和大房子，都喜欢在门上挂一块匾，告诉大家这是哪儿。');
addLabel('翘起来的屋角', [a2 + 4, TY + eaveEdgeY[2] + 2.2, a2 + 4], '屋檐的角为什么往上翘？第一，雨水顺着它能甩得更远，淋不到柱子和墙；第二，屋檐抬高了，阳光更容易照进屋里。黄鹤楼一共有 60 个翘角，像鸟儿张开的翅膀。');
addLabel('金色琉璃瓦', [-5, TY + eaveEdgeY[1] + 1.4, E[1] + 1.6], '这些亮闪闪的瓦叫琉璃瓦，外面有一层像玻璃的壳，不怕雨淋。为什么是黄色？在古代，黄色琉璃瓦不是谁家都能用的，只有皇宫、大庙这样最重要的房子才用。');
addLabel('斗拱和彩画', [-7.5, TY + colTopY[3] + 0.3, a2 - 0.5], '屋檐下面像积木一样的小木块，叫斗拱。它们一块托着一块，把又大又重的屋檐稳稳撑住。古时候搭斗拱不用钉子，全靠木头互相咬紧。蓝蓝绿绿的图案叫彩画。', false, '斗拱读作 dǒu gǒng');
addLabel('红色大柱子', [-(E[0] - PP[0]) * 0.5, TY + 3.6, E[0] + 0.4], '这些红柱子是楼的“腿”，据介绍全楼有 72 根。中国的老房子靠柱子撑着屋顶，墙不用出力，所以能开很多门窗。今天这些柱子是钢筋水泥做的，不怕火烧。');
addLabel('石头台基', [17, 3.4, 22.5], '楼下面这两层石头平台叫台基。它把楼垫高，地上的水泡不到；也让这么高的楼站得更稳。四周的石栏杆是保护人的，顺着台阶就能走上去。');
addLabel('长江', [60, WATER_Y + 2, 300], '这就是长江，中国最长的河，有六千多公里。它从西边的雪山流过来，经过武汉，再往东流进大海。古时候没有火车和汽车，人们出远门常常坐船走长江。', true);
addLabel('鹦鹉洲', [-170, WATER_Y + 8, 330], '江中间这片长满草的沙地叫鹦鹉洲，崔颢的诗里写过它。古时候的鹦鹉洲后来被江水冲没了，这里是照着诗里的样子摆出来的。', true);
addLabel('对岸是汉阳', [40, -2, 640], '江对面就是汉阳，武汉三镇里的一个。天气好的时候，站在黄鹤楼上，连对岸的树都看得清清楚楚。', true);
addLabel('蛇山', [-95, -6, -20], '黄鹤楼站在蛇山顶上。这座山又长又弯，像一条大蛇趴在江边，所以叫蛇山。楼为什么建在山顶？站得高才看得远——最早它就是一座放哨的瞭望楼。', true);
const tmpV = V3(0, 0, 0);
function updateLabels() {
  const w = window.innerWidth, h = window.innerHeight;
  for (const l of labels) {
    tmpV.copy(l.pos).project(camera);
    const ok = inside < 0 && tmpV.z < 1 && Math.abs(tmpV.x) < 1 && Math.abs(tmpV.y) < 1 && camera.position.distanceTo(l.pos) > 6;
    l.el.style.display = ok ? '' : 'none';
    if (ok) l.el.style.transform = 'translate(' + ((tmpV.x * 0.5 + 0.5) * w + 10 | 0) + 'px,' + ((-tmpV.y * 0.5 + 0.5) * h - 14 | 0) + 'px)';
  }
}

/* ============================== 交互 ============================== */
function setRotate(on) { controls.autoRotate = on; $('btnRotate').classList.toggle('on', on); }
$('btnStart').onclick = () => goStop(0);
$('btnFree').onclick = () => { document.body.classList.add('started'); travel(VIEWS.overview); };
$('btnTour').onclick = () => $('guide').hidden ? goStop(Math.max(stopIdx, 0)) : quitTour();
$('btnQuit').onclick = quitTour;
$('btnNext').onclick = () => goStop(stopIdx + 1);
$('btnPrev').onclick = () => { if (stopIdx > 0) goStop(stopIdx - 1); };
$('btnSay').onclick = () => speak(STOPS[stopIdx].s);
$('btnVoice').onclick = e => { voiceOn = !voiceOn; e.currentTarget.classList.toggle('on', voiceOn); e.currentTarget.textContent = voiceOn ? '🔊 声音' : '🔇 静音'; if (!voiceOn) hush(); };
$('btnOut').onclick = () => { if (inside >= 0) travel(lookout(inside)); else travel(INSIDE[lastIn].view, lastIn); };
$('extraClose').onclick = () => showPanel(null);
$('extraBody').addEventListener('click', e => { const b = e.target.closest('[data-say]'); if (b) speak(b.dataset.say); });
document.querySelectorAll('[data-panel]').forEach(b => b.onclick = () => showPanel(b.classList.contains('on') ? null : b.dataset.panel));
document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => { travel(VIEWS[b.dataset.view]); markView(b); });
document.querySelectorAll('[data-floor]').forEach(b => b.onclick = () => goStop(FLOOR_STOP[+b.dataset.floor]));
document.querySelectorAll('[data-env]').forEach(b => b.onclick = () => setEnv(b.dataset.env));
$('btnMist').onclick = () => setEnv(null, !env.mist);
$('btnRotate').onclick = () => {
  const on = !controls.autoRotate;
  if (on && (inside >= 0 || controls.target.distanceTo(camera.position) < 5)) { travel(VIEWS.overview); setTimeout(() => setRotate(true), 2600); return; }
  setRotate(on);
};
$('btnLabels').onclick = e => { labelRoot.classList.toggle('off'); e.currentTarget.classList.toggle('on'); };
$('btnFull').onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); };
$('btnHide').onclick = () => document.body.classList.add('immersive');
$('card').onclick = () => { $('card').hidden = true; hush(); };
canvas.addEventListener('pointerdown', () => { if (controls.autoRotate && document.body.classList.contains('started')) setRotate(false); });
window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k === 'h') document.body.classList.toggle('immersive');
  else if (k === 'escape') { document.body.classList.remove('immersive'); $('card').hidden = true; }
  else if (!document.body.classList.contains('started')) { if (k === 'enter' || k === ' ') goStop(0); }
  else if (k === 'arrowright') goStop(stopIdx + 1);
  else if (k === 'arrowleft') { if (stopIdx > 0) goStop(stopIdx - 1); }
  else if (k >= '1' && k <= '5') goStop(FLOOR_STOP[+k - 1]);
  else if (k === ' ') { e.preventDefault(); $('btnRotate').click(); }
  else if (k === 'f') $('btnFull').click();
});

/* ============================== 画质 ============================== */
const QN = { high: '高', mid: '中', low: '低' }, QORDER = ['high', 'mid', 'low'];
function showQuality() { $('btnQuality').textContent = '画质：' + QN[H.qualityName]; }
$('btnQuality').onclick = () => { autoQ.done = true; H.setQuality(QORDER[(QORDER.indexOf(H.qualityName) + 1) % 3]); showQuality(); };
const autoQ = { t: 0, n: 0, low: 0, done: !!qs.get('q') };        // 开场测帧率，电脑吃力就自动降一档（地址里指定了 ?q= 则不自动调）
function autoQuality(raw) {
  if (autoQ.done || first) return;
  if ((autoQ.warm = (autoQ.warm || 0) + raw) < 5) return;          // 前 5 秒在编译着色器、上传贴图，帧率天然偏低，不算数
  autoQ.t += raw; autoQ.n++; window.__hhlFps = autoQ.n / autoQ.t;
  if (autoQ.t < 3) return;                                          // 每 3 秒算一个采样周期
  const fps = autoQ.n / autoQ.t, i = QORDER.indexOf(H.qualityName);
  (window.__hhlFpsLog = window.__hhlFpsLog || []).push({ q: H.qualityName, fps: +fps.toFixed(1) });   // 每个周期的结果，供测试查看
  autoQ.t = 0; autoQ.n = 0;
  if (fps >= 24 || i >= 2) { autoQ.done = true; return; }          // 够流畅（或已经是最低档）：不再调整
  if (++autoQ.low < 2) return;                                      // 只低了一次：可能还在热身，只重置计数、不降档，再测一个周期
  autoQ.low = 0; autoQ.warm = 1.5;                                  // 连续两个周期都低于 24 才算吃力：降一档，换档后再热身一会儿重新测
  H.setQuality(QORDER[i + 1]); showQuality(); voiceTip('这台电脑有点吃力，已自动调低画质，画面会更流畅');
  setTimeout(() => { if (tipEl.textContent.indexOf('画质') > 0) voiceTip(''); }, 5000);
}
showQuality();

/* ============================== 主循环 ============================== */
const clock = new T.Clock(); let time = 0, first = true;
function frame() {
  requestAnimationFrame(frame);
  const raw = clock.getDelta(), dt = Math.min(raw, 0.1); time += dt;

  if (tween) {
    tween.t = Math.min(1, tween.t + Math.min(raw, 0.6) / tween.dur);   // 按真实时间推进，慢电脑上也不拖沓
    const e = tween.t * tween.t * (3 - 2 * tween.t);
    camera.position.lerpVectors(tween.p0, tween.p1, e); camera.position.y += Math.sin(Math.PI * e) * tween.arc;
    controls.target.lerpVectors(tween.t0, tween.t1, e);
    if (tween.t >= 1) { tween = null; controls.enabled = true; }
  }
  controls.update();
  if (inside < 0) {
    const minY = Math.max(groundH(camera.position.x, camera.position.z), WATER_Y) + 1.3;
    if (camera.position.y < minY) camera.position.y = minY;
  }
  H.world.update(dt, time, inside >= 0);
  H.post.render(scene, camera);
  autoQuality(raw);
  updateLabels();
  if (first) { first = false; $('loading').classList.add('done'); }
}

/* 启动。调试用地址参数：?stop=N ?label=N ?panel=名 ?view=名 ?env=名 ?ui=0 */
setEnv('day', false); jumpTo(VIEWS.front); setRotate(true);
preloadVoice(STOPS[0].s);                                       // 首屏就把第 1 站的声音取好，点“开始参观”立刻出声
(function checkVoices() {                                       // 启动自检：文字和配音对不上的，在控制台列出来
  const want = STOPS.map((s, i) => ['第 ' + (i + 1) + ' 站「' + s.t + '」', s.s]).concat(labels.map(l => ['标注「' + l.text + '」', l.desc]));
  (PANELS.poem1() + PANELS.poem2()).replace(/data-say="([^"]*)"/g, (m, t) => { want.push(['诗朗读「' + t.slice(0, 8) + '…」', t]); return m; });
  const missing = want.filter(w => !AUDIO_BY_TEXT[w[1]]).map(w => w[0]);
  const used = {}; want.forEach(w => used[w[1]] = 1);
  const unused = Object.keys(AUDIO_BY_TEXT).filter(t => !used[t]).map(t => AUDIO_BY_TEXT[t] + '.mp3');
  window.__hhlVoiceCheck = { total: want.length, missing, unused };
  if (missing.length) console.warn('[配音] 以下 ' + missing.length + ' 段的文字和配音对不上（文字改过或还没合成），播放时会改用浏览器朗读。请运行 node tools/gen-audio.js 重新合成：\n  ' + missing.join('\n  '));
  if (unused.length) console.warn('[配音] 以下音频已经没有对应的文字（是旧版本留下的）：' + unused.join('、'));
})();
if (qs.get('view') && VIEWS[qs.get('view')]) { document.body.classList.add('started'); setRotate(false); jumpTo(VIEWS[qs.get('view')]); }
if (qs.get('stop')) {
  voiceOn = false; goStop(+qs.get('stop') - 1, true);
  if (qs.get('out') && inside < 0 && STOPS[stopIdx].k !== undefined) setTimeout(() => $('btnOut').click(), 600);
}
if (qs.get('env') && ENV[qs.get('env')]) setEnv(qs.get('env'), qs.get('mist') === '1');
if (qs.get('panel') && PANELS[qs.get('panel')]) { document.body.classList.add('started'); showPanel(qs.get('panel')); }
if (qs.get('label')) { document.body.classList.add('started'); voiceOn = false; setRotate(false); const l = labels[+qs.get('label')]; if (l) l.el.click(); }
if (qs.get('ui') === '0') document.body.classList.add('immersive');
H.world.snapEnv();
frame();
})();
