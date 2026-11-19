/* 岳阳楼 · 导览与界面：视角、12 站讲解、沿途面板、配音、标注、交互、主循环 */
(function () {
'use strict';
const H = window.HHL, T = THREE;
const { scene, camera, controls, canvas, renderer, qs, V3, lerp } = H;
const { AX, AZ, Y, TY, HELM_TOP, PLAQUE, colTopY, eaveEdgeY } = H.tower;
const { WATER_Y, WALLZ, JUN, GATE, groundH, ENV, env } = H.world;
const INSIDE = H.interior.INSIDE;
const $ = id => document.getElementById(id);
function setEnv(name, mist) {
  H.world.setEnv(name, mist);
  document.querySelectorAll('[data-env]').forEach(b => b.classList.toggle('on', b.dataset.env === env.name));
  $('btnMist').classList.toggle('on', env.mist);
}

/* ============================== 视角 ============================== */
function lookout(k, dx, dy, dz) {
  const p = V3(dx > 0.4 ? 2.6 : dx < -0.4 ? -2.6 : 0, TY + Y[k] + 1.65, AZ[k] + 0.4), d = V3(dx || 0, dy === undefined ? -0.06 : dy, dz === undefined ? 1 : dz).normalize();
  return { pos: p, target: p.clone().add(d) };
}
const VIEWS = {
  overview: { pos: V3(42, 20, 58), target: V3(0, 8, 0) },
  front: { pos: V3(0, 8, 46), target: V3(0, 10, 0) },
  lookup: { pos: V3(9.5, 2.0, 13), target: V3(0, 14, 0) },
  bird: { pos: V3(36, 58, 52), target: V3(0, 5, 0) },
  lake: { pos: V3(-25, WATER_Y + 4, 150), target: V3(0, 8, 0) },
  roof: { pos: V3(15, 21, 25), target: V3(0, 17, 0) },
  wall: { pos: V3(-72, WATER_Y + 4, 95), target: V3(-14, 0, 0) },
  jun: { pos: V3(-20, 5, 140), target: V3(JUN.x, 8, JUN.z) },
  mist: { pos: V3(-26, 6, 70), target: V3(0, 9, 0) },
  moon: { pos: V3(-30, 14, -12), target: V3(10, 6, 60) },
  bye: { pos: V3(30, 12, 44), target: V3(0, 13, 0) }
};
let tween = null;
function flyTo(v, dur) {
  tween = { p0: camera.position.clone(), t0: controls.target.clone(), p1: v.pos.clone(), t1: v.target.clone(), t: 0, dur: dur || 2.4 };
  tween.arc = Math.min(30, tween.p0.distanceTo(tween.p1) * 0.2);
  controls.enabled = false; setRotate(false);
}
function jumpTo(v) { camera.position.copy(v.pos); controls.target.copy(v.target); }
function markView(sel) { document.querySelectorAll('[data-view],[data-floor]').forEach(b => b.classList.toggle('on', b === sel)); }

/* ============================== 导览站点（讲解词） ============================== */
const STOPS = [
  { t: '远远望见岳阳楼', v: VIEWS.lake, e: 'day', s: '你好，我是小鸥！看，湖边城墙上那座金顶的楼，就是岳阳楼。它在湖南岳阳，脚下这一大片水就是洞庭湖。跟我飞过去看看吧！' },
  { t: '它在哪儿？', v: { pos: V3(-160, 380, -240), target: V3(-60, 0, 320) }, e: 'day', p: 'map', s: '从天上往下看，这一大片水是洞庭湖，是中国第二大的淡水湖。湖水从岳阳城边流进长江。岳阳楼就站在湖和江碰面的地方。' },
  { t: '古城墙上的楼', v: VIEWS.wall, e: 'day', p: 'life', s: '岳阳楼盖在岳阳古城西门的城墙边。相传一千八百年前，东吴大将鲁肃在这里训练水军，修了一座阅军楼，这就是岳阳楼最早的样子。' },
  { t: '将军的头盔', v: VIEWS.roof, e: 'day', p: 'facts', s: '看屋顶！它上面鼓鼓的，下面的檐口又向外翘，像不像古代将军戴的头盔？这种屋顶叫盔顶。岳阳楼是我国现存最大的盔顶古建筑。' },
  { t: '一层 · 四根大柱', k: 0, e: 'day', s: '进门啦！这四根又粗又直的大柱子是楠木做的，从一楼一直通到楼顶，撑起整座楼。柱子上的对联写着：四面湖山归眼底，万家忧乐到心头。' },
  { t: '二层 · 岳阳楼记', k: 1, e: 'day', p: 'ji', s: '这面雕屏刻着范仲淹的《岳阳楼记》。北宋时，滕子京重修岳阳楼，请好朋友范仲淹写文章。最有名的一句是：先天下之忧而忧，后天下之乐而乐。' },
  { t: '三层 · 杜甫来过', k: 2, e: 'day', p: 'du', s: '最高这一层挂着杜甫的诗《登岳阳楼》。杜甫老了，还生着病，坐小船漂到这里。他登楼一看，湖水大得好像能把天地浮起来，想起家国，忍不住流下了眼泪。' },
  { t: '登楼看洞庭', v: lookout(2, 0, -0.12, 1), e: 'day', p: 'view', s: '到外面的走廊来！湖水一眼望不到边，范仲淹说它“衔远山，吞长江”。天晴的时候，白色的水鸟成群飞过湖面。我的名字小鸥，就是从这里来的。' },
  { t: '湖里的小青螺', v: VIEWS.jun, e: 'day', p: 'jun', s: '看湖中间那座小岛，它叫君山。唐朝诗人刘禹锡远远望去，觉得洞庭湖像一个白银盘子，君山就是盘子里的一颗青螺。' },
  { t: '下雨的洞庭', v: VIEWS.mist, e: 'day', mist: true, p: 'rain', s: '起雾了，湖面变得灰蒙蒙的。范仲淹说，阴雨天登楼的人容易难过，晴天登楼的人容易开心。可他希望自己：不因为外面的事高兴，也不因为自己的事难过。' },
  { t: '月亮出来了', v: VIEWS.moon, e: 'night', p: 'moon', s: '天黑了，一轮明月照在湖上。月光在水波上跳动，像碎金子；月亮的倒影静静沉在水里，像一块玉璧。渔船上的人唱着歌，你一句我一句。' },
  { t: '再见，岳阳楼', v: VIEWS.bye, e: 'dusk', p: 'three', s: '岳阳楼和湖北的黄鹤楼、江西的滕王阁，合称江南三大名楼。人们常说：洞庭天下水，岳阳天下楼。再见啦，下次再来洞庭湖边找我玩！' }
];
const FLOOR_STOP = [4, 5, 6];

/* ============================== 沿途内容面板 ============================== */
function towerIcon(levels, fire) {
  let s = '<svg viewBox="0 0 60 70">';
  if (!levels) s += '<path d="M8 62h44" stroke="#c9b48a" stroke-width="3"/><path d="M30 60c-10-8-6-18 0-26 2 8 10 10 6 22z" fill="#e8662a"/><path d="M30 60c-4-4-3-9 0-13 1 4 5 5 3 11z" fill="#ffd978"/>';
  for (let i = 0; i < levels; i++) {
    const w = 38 - i * 5, y = 62 - i * 13;
    s += '<rect x="' + (30 - w * 0.36) + '" y="' + (y - 8) + '" width="' + w * 0.72 + '" height="8" fill="#8a2a18"/>';
    s += '<path d="M' + (30 - w * 0.64) + ' ' + (y - 8) + 'q' + w * 0.64 + ' -7 ' + w * 1.28 + ' 0z" fill="#e7b52e"/>';
  }
  if (levels) s += '<path d="M' + (30 - 9) + ' ' + (62 - levels * 13 + 5) + 'q9 -12 18 0z" fill="#e7b52e"/>';
  if (fire && levels) s += '<path d="M48 40c-5-4-3-9 0-13 1 4 5 5 3 11z" fill="#e8662a"/>';
  return s + '</svg>';
}
const sayBtn = t => '<button class="say" data-say="' + t + '">🔊 读给我听</button>';
const PANELS = {
  map: function () {
    return '<h2>岳阳楼在哪儿？</h2>' +
      '<svg viewBox="0 0 400 290"><rect width="400" height="290" fill="#dfe8c8"/>' +
      '<path d="M-10 70C80 60 170 40 250 60S360 70 410 40" stroke="#4f9fd4" stroke-width="22" fill="none"/>' +
      '<path d="M40 130C70 100 150 110 200 120C230 95 262 90 272 74L292 96C276 120 270 150 280 190C250 240 170 250 120 230C70 215 30 180 40 130Z" fill="#7fc1e6"/>' +
      '<path d="M250 290C250 260 245 230 240 205" stroke="#7fc1e6" stroke-width="8" fill="none"/>' +
      '<ellipse cx="236" cy="128" rx="11" ry="7" fill="#6f9a5a"/>' +
      '<path d="M296 92l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z" fill="#d22a1a" stroke="#fff" stroke-width="1.5"/>' +
      '<g font-family="Microsoft YaHei,sans-serif" font-weight="700" text-anchor="middle">' +
      '<text x="330" y="36" font-size="18" fill="#fff">长 江</text><text x="150" y="175" font-size="26" fill="#fff">洞 庭 湖</text>' +
      '<text x="340" y="132" font-size="22" fill="#7a3a12">岳阳</text><text x="304" y="82" font-size="15" fill="#b3261a">岳阳楼</text>' +
      '<text x="220" y="150" font-size="13" fill="#2f4f24">君山</text><text x="268" y="270" font-size="14" fill="#2a6f9a">湘江</text>' +
      '<text x="374" y="270" font-size="13" fill="#555">北↑</text></g></svg>' +
      '<p>岳阳在<b>湖南省</b>的北边。城西是一望无际的<b>洞庭湖</b>，城北就是<b>长江</b>。</p>' +
      '<p>洞庭湖是中国第二大淡水湖。湘江、资江、沅江、澧水四条河流进湖里，湖水再从岳阳城边流进长江。</p>' +
      '<p class="tip">岳阳楼（红星）就站在湖和江碰面的地方，湖中那个小绿点是<b>君山</b>。</p>';
  },
  life: function () {
    const L = [
      [towerIcon(1), '三国 · 约公元 215 年', '相传东吴大将鲁肃在这里训练水军，在城头修了一座“阅军楼”，用来看士兵操练。'],
      [towerIcon(2), '唐朝', '开始叫“岳阳楼”。李白、杜甫、孟浩然这些大诗人都登过楼，写下了好诗。'],
      [towerIcon(3), '北宋 · 1044—1046 年', '滕子京来这里做官，把楼修得更大更好，又请好朋友范仲淹写了《岳阳楼记》。从此岳阳楼名气更大了。'],
      [towerIcon(3, true), '宋、元、明、清', '木头楼怕火、怕水、怕虫蛀。坏了就修，修了又坏，据记载前前后后修过三十多次。'],
      [towerIcon(3), '清朝 · 1880 年', '重新建起一座三层木楼，就是我们今天看到的这一座，已经一百四十多岁了。'],
      [towerIcon(3), '1983—1984 年', '工人把楼一块块拆下来，换掉朽坏的木头，再按原样装回去，叫“修旧如旧”。']
    ];
    return '<h2>这座楼的一生</h2><ul class="life">' + L.map(l => '<li>' + l[0] + '<div><b>' + l[1] + '</b><span>' + l[2] + '</span></div></li>').join('') + '</ul>' +
      '<p class="tip">黄鹤楼和滕王阁今天都是新盖的楼，岳阳楼却是一百多年前留下来的老木楼。所以人们说，江南三大名楼里，只有它还保持着古时候的原貌。</p>';
  },
  facts: function () {
    return '<h2>岳阳楼小知识</h2><ul class="facts">' +
      '<li><b>它有多高？</b>大约 19 米，差不多是 6 层居民楼那么高。</li>' +
      '<li><b>它有几层？</b>三层，每层都有一圈屋檐，叫“三层三檐”。</li>' +
      '<li><b>它有多大？</b>正面宽约 17 米，进深约 15 米，是个长方形。</li>' +
      '<li><b>用什么盖的？</b>纯木头。四根楠木大柱从一楼通到楼顶，撑起全楼。据介绍，整座楼没用一颗铁钉。</li>' +
      '<li><b>屋顶有什么特别？</b>是“盔顶”，像将军的头盔。岳阳楼是我国现存最大的盔顶古建筑。</li></ul>';
  },
  ji: function () {
    return '<h2>二层的雕屏</h2><div class="poem kai"><small>《岳阳楼记》　宋 · 范仲淹（节选）</small>先天下之忧而忧，<br>后天下之乐而乐。</div>' +
      sayBtn('先天下之忧而忧，后天下之乐而乐。') +
      '<p>意思是：大家还没发愁的时候，我先替大家发愁；等大家都过上快乐的日子，我再去享受快乐。</p>' +
      '<p>写这篇文章时，范仲淹自己也被贬到了外地。可他想的不是自己，而是天下的百姓。</p>' +
      '<p class="tip">小故事：据说范仲淹并没有来过岳阳楼，是看着滕子京送来的一幅《洞庭晚秋图》，写出了这篇文章。</p>';
  },
  du: function () {
    return '<h2>在三层遇到一首诗</h2><div class="poem kai"><small>《登岳阳楼》　唐 · 杜甫</small>昔闻洞庭水，今上岳阳楼。<br>吴楚东南坼，乾坤日夜浮。<br>亲朋无一字，老病有孤舟。<br>戎马关山北，凭轩涕泗流。</div>' +
      sayBtn('登岳阳楼。唐，杜甫。昔闻洞庭水，今上岳阳楼。吴楚东南坼，乾坤日夜浮。亲朋无一字，老病有孤舟。戎马关山北，凭轩涕泗流。') +
      '<p>前四句写湖：早就听说过洞庭湖，今天终于登上岳阳楼。湖水把吴地和楚地分开，天地好像日日夜夜漂在湖面上。</p>' +
      '<p>后四句写人：亲人朋友没有来信，自己又老又病，只有一条小船。北方还在打仗，他靠着栏杆，眼泪止不住地流。</p>';
  },
  view: function () {
    return '<h2>站在楼上看洞庭</h2><div class="poem kai"><small>《岳阳楼记》（节选）</small>衔远山，吞长江，<br>浩浩汤汤，横无际涯。</div>' +
      sayBtn('衔远山，吞长江，浩浩汤汤，横无际涯。') +
      '<p>湖水像含着远处的山，又像要吞下长江。水势浩大，宽得看不到边。</p>' +
      '<div class="poem kai">沙鸥翔集，锦鳞游泳。</div>' + sayBtn('沙鸥翔集，锦鳞游泳。') +
      '<p class="tip">“沙鸥翔集”就是白色的水鸟一会儿飞、一会儿停；“锦鳞游泳”就是漂亮的鱼游来游去。找找湖面上的水鸟吧！</p>';
  },
  jun: function () {
    return '<h2>白银盘里一青螺</h2><div class="poem kai"><small>《望洞庭》　唐 · 刘禹锡</small>湖光秋月两相和，<br>潭面无风镜未磨。<br>遥望洞庭山水翠，<br>白银盘里一青螺。</div>' +
      sayBtn('望洞庭。唐，刘禹锡。湖光秋月两相和，潭面无风镜未磨。遥望洞庭山水翠，白银盘里一青螺。') +
      '<p>秋天的夜晚，月光照在平静的湖面上，湖水亮得像一个白银盘子，君山就像盘子里的一颗青螺。</p>' +
      '<p class="tip">君山岛上有斑竹，竹子上有一点一点的斑纹；岛上还出产有名的“君山银针”茶。</p>';
  },
  rain: function () {
    return '<h2>两种天气，两种心情</h2><div class="poem kai"><small>《岳阳楼记》（节选）</small>不以物喜，不以己悲。</div>' +
      sayBtn('不以物喜，不以己悲。') +
      '<p>范仲淹写了两种天气：连着几个月下雨、刮大风、浪头冲天的时候，登楼的人觉得心里难过；春光明媚、湖面平静的时候，登楼的人又觉得特别开心。</p>' +
      '<p>他说，真正了不起的人，不会因为外面的东西好坏就高兴或难过，也不会因为自己的得失就高兴或难过。</p>' +
      '<p class="tip">二层雕屏两边的两幅画，一幅叫“淫雨霏霏”，一幅叫“春和景明”，你更喜欢哪一幅？</p>';
  },
  moon: function () {
    return '<h2>月夜的洞庭湖</h2><div class="poem kai"><small>《岳阳楼记》（节选）</small>长烟一空，皓月千里，<br>浮光跃金，静影沉璧。</div>' +
      sayBtn('长烟一空，皓月千里，浮光跃金，静影沉璧。') +
      '<p>湖上的雾气一下子散了，明亮的月光照着千里湖面。水波上的月光像金子在跳，月亮的倒影像一块玉璧沉在水底。</p>' +
      '<p class="tip">看看湖面：月亮在水里的倒影，是不是一块亮亮的“璧”？</p>';
  },
  three: function () {
    return '<h2>江南三大名楼</h2><div class="three"><div><b>黄鹤楼</b>湖北 · 武汉<br>长江边</div><div class="me"><b>岳阳楼</b>湖南 · 岳阳<br>洞庭湖边</div><div><b>滕王阁</b>江西 · 南昌<br>赣江边</div></div>' +
      '<p>三座楼都站在水边，都很古老，也都因为有人为它们写下了特别好的诗和文章，才被大家记住。</p>' +
      '<p class="tip">“洞庭天下水，岳阳天下楼。”岳阳楼因为《岳阳楼记》出了名，《岳阳楼记》也让更多人记住了洞庭湖。</p>';
  }
};
const POEM_PANELS = ['ji', 'du', 'view', 'jun', 'rain', 'moon'];
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
  if (!key) {                                   // 还没合成配音（没有 audio/manifest.js）就直接用电脑自带的声音，不打扰；有配音但文字改过才提示
    if (!window.HHL_AUDIO) { browserSpeak(text); return; }
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
  renderGuide(); setEnv(s.e, !!s.mist); showPanel(s.p || null);
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
addLabel('盔顶', [0, TY + HELM_TOP + 0.8, 0], '这个屋顶叫盔顶。它上面鼓鼓的，下面的檐口又向外翘起，样子像古代将军戴的头盔。岳阳楼是我国现存最大的盔顶古建筑。', false, '盔读作 kuī');
addLabel('匾额', [2.2, TY + PLAQUE.y + 0.3, PLAQUE.z + 0.3], '屋檐下挂的大牌子叫匾额，就像楼的名牌。这块黑底金字的匾上写着“岳阳楼”三个大字，告诉大家这里是哪儿。');
addLabel('飞檐翘角', [AX[1] + 3.2, TY + eaveEdgeY[1] + 2.0, AZ[1] + 3.2], '屋檐的四个角高高翘起，像鸟儿张开翅膀。三层屋檐一共有十二个翘角。雨水顺着翘角甩得远远的，淋不到木头柱子。');
addLabel('黄色琉璃瓦', [-4, TY + eaveEdgeY[0] + 1.3, AZ[0] + 1.6], '屋顶铺的是黄色琉璃瓦，表面有一层像玻璃的釉，不怕雨淋，太阳一照金灿灿的。');
addLabel('如意斗拱', [-5, TY + colTopY[2] + 0.4, AZ[2] + 0.3], '屋檐下一层叠一层的小木块叫斗拱。岳阳楼的斗拱叫如意斗拱，横的斜的交错在一起，像一张网，把屋檐稳稳托住。', false, '斗拱读作 dǒu gǒng');
addLabel('回廊栏杆', [5.5, TY + Y[1] + 1.3, AZ[1] + 0.7], '二层、三层的外面都有一圈走廊，叫回廊。扶着栏杆绕楼走一圈，四面的风景都能看到。');
addLabel('木柱子', [-4.3, TY + 2.0, AZ[0] + 0.35], '岳阳楼是一座纯木头盖的楼。外面一圈圈的柱子，和楼里四根楠木大柱一起，把三层楼稳稳撑住。');
addLabel('古城墙', [-100, -3, WALLZ + 0.5], '脚下这道灰色的高墙，是岳阳古城的城墙。从前士兵站在墙上守城，岳阳楼就盖在城墙边的高台上。', true);
addLabel('岳阳门', [GATE.x, WATER_Y + 8.6, WALLZ + 0.5], '城墙上的这个门洞叫岳阳门，是古城的西门。从前人们从这里出城，到湖边坐船。', true);
addLabel('洞庭湖', [80, WATER_Y + 2, 260], '这就是洞庭湖，中国第二大淡水湖。湘江、资江、沅江、澧水四条河流进湖里，湖水再从岳阳流进长江。', true);
addLabel('君山', [JUN.x, 42, JUN.z], '湖中的小岛叫君山，岛上有斑竹，还出产有名的君山银针茶。从岳阳楼远远望去，它就像白银盘里的一颗青螺。', true);
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
  else if (k >= '1' && k <= '3') goStop(FLOOR_STOP[+k - 1]);
  else if (k === ' ') { e.preventDefault(); $('btnRotate').click(); }
  else if (k === 'f') $('btnFull').click();
});

/* ============================== 画质 ============================== */
const QN = { high: '高', mid: '中', low: '低' }, QORDER = ['high', 'mid', 'low'];
function showQuality() { $('btnQuality').textContent = '画质：' + QN[H.qualityName]; }
$('btnQuality').onclick = () => { autoQ.done = true; H.setQuality(QORDER[(QORDER.indexOf(H.qualityName) + 1) % 3]); showQuality(); };
const autoQ = { t: 0, n: 0, low: 0, done: !!qs.get('q') };                // 开场几秒测帧率，电脑吃力就自动降一档（地址里指定了 ?q= 则不自动调）
function autoQuality(raw) {
  if (autoQ.done || first) return;
  if ((autoQ.warm = (autoQ.warm || 0) + raw) < 5) return;          // 前 5 秒在编译着色器，不算数
  autoQ.t += raw; autoQ.n++; window.__hhlFps = autoQ.n / autoQ.t;
  if (autoQ.t < 3) return;
  const fps = autoQ.n / autoQ.t, i = QORDER.indexOf(H.qualityName);
  if (fps < 24 && i < 2 && ++autoQ.low < 2) { autoQ.t = 0; autoQ.n = 0; } else if (fps < 24 && i < 2) { autoQ.low = 0; H.setQuality(QORDER[i + 1]); showQuality(); voiceTip('这台电脑有点吃力，已自动调低画质，画面会更流畅'); setTimeout(() => { if (tipEl.textContent.indexOf('画质') > 0) voiceTip(''); }, 5000); autoQ.t = 0; autoQ.n = 0; autoQ.warm = 1.5; }
  else autoQ.done = true;
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
  POEM_PANELS.map(p => PANELS[p]()).join('').replace(/data-say="([^"]*)"/g, (m, t) => { want.push(['诗朗读「' + t.slice(0, 8) + '…」', t]); return m; });
  const missing = want.filter(w => !AUDIO_BY_TEXT[w[1]]).map(w => w[0]);
  const used = {}; want.forEach(w => used[w[1]] = 1);
  const unused = Object.keys(AUDIO_BY_TEXT).filter(t => !used[t]).map(t => AUDIO_BY_TEXT[t] + '.mp3');
  window.__hhlVoiceCheck = { total: want.length, missing, unused };
  if (missing.length && window.HHL_AUDIO) console.warn('[配音] 以下 ' + missing.length + ' 段的文字和配音对不上（文字改过或还没合成），播放时会改用浏览器朗读。请运行 node tools/gen-audio.js 重新合成：\n  ' + missing.join('\n  '));
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
