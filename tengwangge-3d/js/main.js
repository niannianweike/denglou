/* 滕王阁 · 导览与界面：视角、12 站讲解、沿途面板、配音、标注、交互、主循环 */
(function () {
'use strict';
const H = window.HHL, T = THREE;
const { scene, camera, controls, canvas, renderer, qs, V3, lerp } = H;
const { AX, AZ, Y, TY, HELM_TOP, PLAQUE, BASE, PAV, colTopY, eaveEdgeY } = H.tower;
const { WATER_Y, LAND, RIVZ, groundH, ENV, env } = H.world;
const INSIDE = H.interior.INSIDE;
const $ = id => document.getElementById(id);
function setEnv(name, mist) {
  H.world.setEnv(name, mist);
  document.querySelectorAll('[data-env]').forEach(b => b.classList.toggle('on', b.dataset.env === env.name));
  $('btnMist').classList.toggle('on', env.mist);
}

/* ============================== 视角 ============================== */
function lookout(k, dx, dy, dz) {
  const p = V3(dx > 0.4 ? 4 : dx < -0.4 ? -4 : 0, TY + Y[k] + 1.65, AZ[k] + 0.4), d = V3(dx || 0, dy === undefined ? -0.06 : dy, dz === undefined ? 1 : dz).normalize();
  return { pos: p, target: p.clone().add(d) };
}
const VIEWS = {
  overview: { pos: V3(95, 32, 150), target: V3(0, 14, 0) },
  front: { pos: V3(0, 4, 135), target: V3(0, 18, 0) },
  lookup: { pos: V3(16, 1.9, 20), target: V3(0, 30, 0) },
  bird: { pos: V3(100, 150, 150), target: V3(0, 0, 10) },
  river: { pos: V3(-45, WATER_Y + 5, 250), target: V3(0, 18, 0) },
  roof: { pos: V3(34, 44, 50), target: V3(0, 37, 0) },
  base: { pos: V3(40, LAND + 2.5, 74), target: V3(0, -2, 0) },
  pav: { pos: V3(62, 9, 34), target: V3(PAV.x, 6, 0) },
  xia: { pos: V3(-30, 9, 20), target: V3(30, 4, 400) },
  night: { pos: V3(70, 20, 120), target: V3(0, 16, 0) },
  bye: { pos: V3(60, 26, 95), target: V3(0, 24, 0) }
};
let tween = null;
function flyTo(v, dur) {
  tween = { p0: camera.position.clone(), t0: controls.target.clone(), p1: v.pos.clone(), t1: v.target.clone(), t: 0, dur: dur || 2.4 };
  tween.arc = Math.min(40, tween.p0.distanceTo(tween.p1) * 0.2);
  controls.enabled = false; setRotate(false);
}
function jumpTo(v) { camera.position.copy(v.pos); controls.target.copy(v.target); }
function markView(sel) { document.querySelectorAll('[data-view],[data-floor]').forEach(b => b.classList.toggle('on', b === sel)); }

/* ============================== 导览站点（讲解词） ============================== */
const STOPS = [
  { t: '远远望见滕王阁', v: VIEWS.river, e: 'day', s: '你好，我是小鹜！看，江边高台上那座绿瓦红柱的楼阁，就是滕王阁。它在江西南昌，脚下这条大江叫赣江。跟我飞过去看看吧！' },
  { t: '它在哪儿？', v: { pos: V3(-260, 640, -420), target: V3(0, 0, 420) }, e: 'day', p: 'map', s: '从天上往下看，这条大江是赣江，江西最大的河。它一路向北流，最后流进鄱阳湖。滕王阁就站在南昌城西边的赣江岸上。' },
  { t: '高高的台座', v: VIEWS.base, e: 'day', p: 'life', s: '滕王阁站在一座十二米高的石头台座上，像古时候的城墙。一千三百多年前，唐太宗的弟弟滕王李元婴在这里盖了一座楼阁，就用他的封号起名叫滕王阁。' },
  { t: '碧瓦飞檐', v: VIEWS.roof, e: 'day', p: 'facts', s: '抬头看！屋顶铺的是碧绿的琉璃瓦，屋角高高翘起。从外面数是三层，走进去其实有七层，有几层藏在屋檐后面，这叫明三暗七。' },
  { t: '一层 · 王勃作序', k: 0, e: 'day', p: 'xu', s: '进门啦！这幅画讲的是一个故事：年轻的诗人王勃路过南昌，在滕王阁的宴会上写下了《滕王阁序》。柱子上的对联，就是序里最有名的一句。' },
  { t: '二层 · 人杰地灵', k: 1, e: 'day', p: 'renjie', s: '这一层的画上，是江西历史上的名人。“人杰地灵”这个成语，就出自《滕王阁序》，意思是这里出了不起的人，这片土地也很灵秀。' },
  { t: '三层 · 滕王阁诗', k: 2, e: 'day', p: 'shi', s: '这一层挂着王勃写的《滕王阁诗》。他写序的时候，还在文章最后附了这首诗。两边的画，画的就是诗里的南浦云和西山雨。' },
  { t: '凭栏看赣江', v: lookout(2, 0, -0.1, 1), e: 'day', p: 'view', s: '到外面的走廊来！脚下是滚滚的赣江，对面远远的是西山。王勃写过：画栋朝飞南浦云，珠帘暮卷西山雨。早上看云，傍晚看雨，都在这栏杆边。' },
  { t: '南北两座亭', v: VIEWS.pav, e: 'day', s: '主阁的南北两边各有一座小阁，南边叫压江亭，北边叫挹翠亭。它们像主阁张开的两只手臂，一起守着赣江。' },
  { t: '落霞与孤鹜齐飞', v: VIEWS.xia, e: 'dusk', p: 'xia', s: '太阳落山了，满天红霞。看，一只野鸭正飞过霞光；秋天的江水，和天连成了一样的颜色。这就是王勃写的：落霞与孤鹜齐飞，秋水共长天一色。' },
  { t: '灯火滕王阁', v: VIEWS.night, e: 'night', p: 'night', s: '天黑了，滕王阁亮起了灯。王勃在诗里问：当年的滕王现在在哪里呢？只有栏杆外的江水，还在静静地流。' },
  { t: '再见，滕王阁', v: VIEWS.bye, e: 'dusk', p: 'three', s: '滕王阁和湖北的黄鹤楼、湖南的岳阳楼，合称江南三大名楼。滕王阁还有个称号，叫西江第一楼。再见啦，下次再来赣江边找我玩！' }
];
const FLOOR_STOP = [4, 5, 6];

/* ============================== 沿途内容面板 ============================== */
function towerIcon(levels, fire) {
  let s = '<svg viewBox="0 0 60 70">';
  if (!levels) s += '<path d="M8 62h44" stroke="#c9b48a" stroke-width="3"/><path d="M30 60c-10-8-6-18 0-26 2 8 10 10 6 22z" fill="#e8662a"/><path d="M30 60c-4-4-3-9 0-13 1 4 5 5 3 11z" fill="#ffd978"/>';
  for (let i = 0; i < levels; i++) {
    const w = 40 - i * 6, y = 62 - i * 13;
    s += '<rect x="' + (30 - w * 0.36) + '" y="' + (y - 8) + '" width="' + w * 0.72 + '" height="8" fill="#8a2a18"/>';
    s += '<path d="M' + (30 - w * 0.66) + ' ' + (y - 8) + 'q' + w * 0.66 + ' -7 ' + w * 1.32 + ' 0z" fill="#3a9a84"/>';
  }
  if (levels) s += '<path d="M21 ' + (62 - levels * 13 + 5) + 'l9 -9 9 9z" fill="#3a9a84"/>';
  if (fire && levels) s += '<path d="M48 40c-5-4-3-9 0-13 1 4 5 5 3 11z" fill="#e8662a"/>';
  return s + '</svg>';
}
const sayBtn = t => '<button class="say" data-say="' + t + '">🔊 读给我听</button>';
const PANELS = {
  map: function () {
    return '<h2>滕王阁在哪儿？</h2>' +
      '<svg viewBox="0 0 400 290"><rect width="400" height="290" fill="#dfe8c8"/>' +
      '<path d="M250 0C260 30 300 40 320 30L340 60C320 80 280 70 262 90C250 70 240 40 236 20Z" fill="#7fc1e6"/>' +
      '<path d="M180 300C190 240 170 200 200 160S240 110 255 85" stroke="#4f9fd4" stroke-width="16" fill="none"/>' +
      '<path d="M300 300C280 250 250 230 225 200" stroke="#7fc1e6" stroke-width="7" fill="none"/>' +
      '<rect x="212" y="140" width="70" height="44" rx="6" fill="#d9c9a0" opacity=".8"/>' +
      '<path d="M206 146l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z" fill="#d22a1a" stroke="#fff" stroke-width="1.5"/>' +
      '<g font-family="Microsoft YaHei,sans-serif" font-weight="700" text-anchor="middle">' +
      '<text x="296" y="54" font-size="17" fill="#fff">鄱阳湖</text><text x="150" y="230" font-size="18" fill="#2a6f9a">赣 江</text>' +
      '<text x="256" y="170" font-size="22" fill="#7a3a12">南昌</text><text x="170" y="140" font-size="15" fill="#b3261a">滕王阁</text>' +
      '<text x="80" y="120" font-size="14" fill="#2f4f24">西山</text><text x="300" y="250" font-size="13" fill="#2a6f9a">抚河</text>' +
      '<text x="374" y="275" font-size="13" fill="#555">北↑</text></g></svg>' +
      '<p>滕王阁在<b>江西省南昌市</b>，站在<b>赣江</b>东岸。赣江从南往北流，流进中国最大的淡水湖<b>鄱阳湖</b>。</p>' +
      '<p>阁的正面朝西，对着赣江。江对岸远处的山叫<b>西山</b>，王勃的诗里写过它。</p>' +
      '<p class="tip">太阳从西边落下，正好落在江的那一边——所以傍晚站在滕王阁上，能看到“落霞”。</p>';
  },
  life: function () {
    const L = [
      [towerIcon(2), '唐朝 · 公元 653 年', '唐太宗的弟弟李元婴被封为“滕王”，他在赣江边盖了这座楼阁，所以叫滕王阁。'],
      [towerIcon(2), '唐朝 · 王勃作序', '年轻的诗人王勃在阁上的宴会里写下《滕王阁序》，滕王阁从此天下闻名。'],
      [towerIcon(3, true), '唐朝到清朝', '木头楼阁最怕火和战乱。一千多年里，它毁了又建、建了又毁，前后重建了二十多次。'],
      [towerIcon(0), '1926 年', '滕王阁在战火中被烧毁，据说只留下一块刻着“滕王阁”的石匾。'],
      [towerIcon(3), '1942 年', '建筑学家梁思成画出了重建滕王阁的草图，照着宋代的楼阁样式来设计。'],
      [towerIcon(3), '1989 年', '新的滕王阁建成了，这是它的第 29 次重建。新阁用钢筋水泥建造，样子参考了梁思成的草图。']
    ];
    return '<h2>这座阁的一生</h2><ul class="life">' + L.map(l => '<li>' + l[0] + '<div><b>' + l[1] + '</b><span>' + l[2] + '</span></div></li>').join('') + '</ul>' +
      '<p class="tip">楼阁烧了一次又一次，人们却一次又一次把它建起来。因为有王勃的文章，大家都舍不得让滕王阁消失。</p>';
  },
  facts: function () {
    return '<h2>滕王阁小知识</h2><ul class="facts">' +
      '<li><b>它有多高？</b>连台座一共约 57.5 米，差不多是 19 层居民楼那么高。</li>' +
      '<li><b>它有几层？</b>外面看三层，里面有七层，叫“明三暗七”。</li>' +
      '<li><b>台座有多高？</b>约 12 米，样子像古时候的城墙。</li>' +
      '<li><b>屋顶是什么颜色？</b>碧绿的琉璃瓦，配上朱红的柱子，看上去是宋代楼阁的风格。</li>' +
      '<li><b>两边的小阁叫什么？</b>南边叫压江亭，北边叫挹翠亭。</li></ul>';
  },
  xu: function () {
    return '<h2>王勃作序</h2><div class="poem kai"><small>《滕王阁序》　唐 · 王勃（节选）</small>落霞与孤鹜齐飞，<br>秋水共长天一色。</div>' +
      sayBtn('落霞与孤鹜齐飞，秋水共长天一色。') +
      '<p>相传那天，洪州的阎都督在滕王阁大摆宴席，请客人写文章。别人都推辞，年轻的王勃却提起笔就写。</p>' +
      '<p>写到“落霞与孤鹜齐飞，秋水共长天一色”这一句，阎都督忍不住拍手叫好。</p>' +
      '<p class="tip">“孤鹜”就是一只野鸭。傍晚的红霞和野鸭一起在天上飞，秋天的江水和天连成一片——你能想象出这幅画吗？</p>';
  },
  renjie: function () {
    return '<h2>从《滕王阁序》里来的成语</h2><ul class="facts">' +
      '<li><b>人杰地灵</b>出了杰出的人物，这个地方也就显得灵秀。</li>' +
      '<li><b>物华天宝</b>这里出产的东西都是天下的珍宝。</li>' +
      '<li><b>高朋满座</b>来了很多尊贵的客人，座位都坐满了。</li>' +
      '<li><b>老当益壮</b>年纪大了，志气反而更旺盛。</li></ul>' +
      sayBtn('人杰地灵，物华天宝，高朋满座，老当益壮。') +
      '<p class="tip">一篇文章留下了这么多成语，一千多年后我们还在用。</p>';
  },
  shi: function () {
    return '<h2>在三层读一首诗</h2><div class="poem kai"><small>《滕王阁诗》　唐 · 王勃</small>滕王高阁临江渚，<br>佩玉鸣鸾罢歌舞。<br>画栋朝飞南浦云，<br>珠帘暮卷西山雨。<br>闲云潭影日悠悠，<br>物换星移几度秋。<br>阁中帝子今何在？<br>槛外长江空自流。</div>' +
      sayBtn('滕王阁诗。唐，王勃。滕王高阁临江渚，佩玉鸣鸾罢歌舞。画栋朝飞南浦云，珠帘暮卷西山雨。闲云潭影日悠悠，物换星移几度秋。阁中帝子今何在？槛外长江空自流。') +
      '<p>高高的滕王阁对着江边，当年热闹的歌舞早就停了。早上，南浦的云飘过画栋；傍晚，卷起珠帘看西山的雨。</p>' +
      '<p>白云和江水的影子悠悠地过了一年又一年。当年的滕王在哪里呢？只有栏杆外的江水，还在流。</p>';
  },
  view: function () {
    return '<h2>凭栏看赣江</h2><div class="poem kai">画栋朝飞南浦云，<br>珠帘暮卷西山雨。</div>' +
      sayBtn('画栋朝飞南浦云，珠帘暮卷西山雨。') +
      '<p>早上，彩绘的屋梁边飘着南浦的白云；傍晚，卷起珠帘，能看见西山下起了雨。</p>' +
      '<p class="tip">找一找：江对面远远的那一排山，就是诗里的“西山”。</p>';
  },
  xia: function () {
    return '<h2>落霞与孤鹜齐飞</h2><div class="poem kai"><small>《滕王阁序》（节选）</small>落霞与孤鹜齐飞，<br>秋水共长天一色。</div>' +
      sayBtn('落霞与孤鹜齐飞，秋水共长天一色。') +
      '<p>上一句写天上：彩霞在飘，野鸭在飞，一高一低，好像在一起飞。下一句写地上：秋天的江水清清的，和天空连成一样的颜色。</p>' +
      '<p class="tip">看看江面上飞过的鸟，再看看远处天和水相接的地方。</p>';
  },
  night: function () {
    return '<h2>槛外长江空自流</h2><div class="poem kai"><small>《滕王阁诗》（节选）</small>阁中帝子今何在？<br>槛外长江空自流。</div>' +
      sayBtn('阁中帝子今何在？槛外长江空自流。') +
      '<p>“帝子”说的是滕王。盖楼的人早已不在了，楼阁也换了一座又一座，只有江水一直在流。</p>' +
      '<p class="tip">这里的“长江”指的是眼前的赣江。</p>';
  },
  three: function () {
    return '<h2>江南三大名楼</h2><div class="three"><div><b>黄鹤楼</b>湖北 · 武汉<br>长江边</div><div><b>岳阳楼</b>湖南 · 岳阳<br>洞庭湖边</div><div class="me"><b>滕王阁</b>江西 · 南昌<br>赣江边</div></div>' +
      '<p>三座楼都站在水边，都很古老，也都因为有人为它们写下了特别好的诗和文章，才被大家记住。</p>' +
      '<p class="tip">黄鹤楼有崔颢的诗，岳阳楼有范仲淹的记，滕王阁有王勃的序。三座楼、三篇好文章，你都记住了吗？</p>';
  }
};
const POEM_PANELS = ['xu', 'renjie', 'shi', 'view', 'xia', 'night'];
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
addLabel('歇山顶', [0, TY + HELM_TOP + 1.2, 0], '最上面的屋顶叫歇山顶：前后两面坡一直通到屋脊，左右两边的坡只到一半，上面是一面竖着的三角墙，叫山花。这是古代很高级的屋顶样式。', false, '歇读作 xiē');
addLabel('匾额', [3.5, TY + PLAQUE.y + 0.6, PLAQUE.z + 0.4], '屋檐下这块黑底金字的大匾，写着“滕王阁”三个字。匾就像楼阁的名牌，告诉大家这里是哪儿。');
addLabel('碧色琉璃瓦', [-8, TY + eaveEdgeY[0] + 1.6, AZ[0] + 2.0], '滕王阁的屋顶铺的是碧绿色的琉璃瓦，表面有一层像玻璃的釉，不怕雨淋，配上朱红的柱子特别好看。');
addLabel('飞檐翘角', [AX[1] + 4.0, TY + eaveEdgeY[1] + 2.4, AZ[1] + 4.0], '屋檐的角高高翘起，像鸟儿张开翅膀。翘起的屋檐让雨水甩得更远，也让高大的楼阁看起来轻盈。');
addLabel('暗层', [AX[1] - 2, TY + Y[1] - 2.2, AZ[1] + 0.6], '屋檐后面这一圈矮矮的墙里，藏着一层“暗层”。从外面数滕王阁是三层，走进去却有七层，这就叫“明三暗七”。');
addLabel('平座栏杆', [-6, TY + Y[2] + 1.3, AZ[2] + 0.8], '每一层外面都有一圈带栏杆的走廊，叫平座。王勃诗里说的“槛外长江空自流”，“槛”就是栏杆。', false, '槛读作 jiàn');
addLabel('高台座', [-30, -5, BASE.hz + 0.5], '滕王阁站在一座约十二米高的石头台座上，样子像古时候的城墙。站得高，才能把赣江和西山都看在眼里。', true);
addLabel('压江亭', [PAV.x, TY + 14, 0], '主阁南边的小阁叫压江亭，北边那座叫挹翠亭。两座亭像主阁伸出的两只手臂，一起守着赣江。');
addLabel('赣江', [80, WATER_Y + 2, 340], '这就是赣江，江西最大的河。它从南往北流，经过南昌，最后流进鄱阳湖，再汇入长江。', true);
addLabel('西山', [-200, 140, 2600], '江对岸远处这排山叫西山。王勃在诗里写过“珠帘暮卷西山雨”，傍晚卷起帘子，就能看见西山下雨。', true);
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
