/* 鹳雀楼 · 导览与界面：视角、12 站讲解、沿途面板、配音、标注、交互、主循环 */
(function () {
'use strict';
const H = window.HHL, T = THREE;
const { scene, camera, controls, canvas, renderer, qs, V3, lerp } = H;
const { AX, AZ, Y, TY, ROOF, PLAQUE, FUJIE, BASE, VW, colTopY } = H.tower;
const { WATER_Y, RIVER, OXEN, ZT, groundH, ENV, env } = H.world;
const INSIDE = H.interior.INSIDE;
const $ = id => document.getElementById(id);
function setEnv(name, mist) {
  H.world.setEnv(name, mist);
  document.querySelectorAll('[data-env]').forEach(b => b.classList.toggle('on', b.dataset.env === env.name));
  $('btnMist').classList.toggle('on', env.mist);
}

/* ============================== 视角 ============================== */
function lookout(k, dx, dy, dz) {
  const p = V3(dx > 0.4 ? 4 : dx < -0.4 ? -4 : 0, TY + Y[k] + 1.65, AZ[k] + 0.6), d = V3(dx || 0, dy === undefined ? -0.08 : dy, dz === undefined ? 1 : dz).normalize();
  return { pos: p, target: p.clone().add(d) };
}
const VIEWS = {
  overview: { pos: V3(120, 58, 160), target: V3(0, 32, 0) },
  front: { pos: V3(0, 24, 128), target: V3(0, 34, 0) },
  lookup: { pos: V3(14, 1.8, 46), target: V3(0, 50, 0) },
  bird: { pos: V3(130, 180, 190), target: V3(0, 18, 40) },
  river: { pos: V3(-70, WATER_Y + 7, 560), target: V3(0, 34, 0) },
  roof: { pos: V3(42, TY + 56, 64), target: V3(0, TY + 45, 0) },
  storks: { pos: V3(-60, TY + 40, 90), target: V3(0, TY + 52, 0) },
  oxen: { pos: V3(OXEN.x + 6, 10, OXEN.z + 17), target: V3(OXEN.x - 1, 1.2, OXEN.z - 1) },
  sunset: { pos: V3(-46, 42, -170), target: V3(10, 36, 200) },
  mount: { pos: V3(40, 60, 190), target: V3(-80, 120, -900) },
  night: { pos: V3(96, 32, 150), target: V3(0, 36, 0) }
};
let tween = null;
function flyTo(v, dur) {
  tween = { p0: camera.position.clone(), t0: controls.target.clone(), p1: v.pos.clone(), t1: v.target.clone(), t: 0, dur: dur || 2.6 };
  tween.arc = Math.min(40, tween.p0.distanceTo(tween.p1) * 0.2);
  controls.enabled = false; setRotate(false);
}
function jumpTo(v) { camera.position.copy(v.pos); controls.target.copy(v.target); }
function markView(sel) { document.querySelectorAll('[data-view],[data-floor]').forEach(b => b.classList.toggle('on', b === sel)); }

/* ============================== 导览站点（讲解词） ============================== */
const STOPS = [
  { t: '远远望见鹳雀楼', v: VIEWS.river, e: 'day', s: '你好，我是小鹳！看，黄河岸边那座高高的楼，就是鹳雀楼。它在山西永济，脚下这条浑黄的大河，就是黄河。跟我飞过去看看吧！' },
  { t: '它在哪儿？', v: { pos: V3(-420, 900, -900), target: V3(0, 0, 520) }, e: 'day', p: 'map', s: '从天上往下看，黄河从北往南流过这里，往下不远就拐一个大弯，向东流去。鹳雀楼站在黄河东岸，背后是中条山，河对面就是陕西。' },
  { t: '鹳雀落脚的地方', v: VIEWS.storks, e: 'day', p: 'name', s: '古时候，这座楼高高地立在黄河边，常有鹳雀飞来，落在楼上歇脚，人们就叫它鹳雀楼。看，我的白鹳伙伴们又飞回来啦！' },
  { t: '消失了七百年', v: VIEWS.front, e: 'day', p: 'life', s: '鹳雀楼最早建于一千四百多年前的北周。元朝初年，它毁于战火，后来连旧址都被黄河的泥沙埋住了。七百多年后，人们才在黄河边把它重新建了起来。' },
  { t: '唐朝的样子', v: VIEWS.roof, e: 'day', p: 'facts', s: '今天的鹳雀楼是照着唐朝的样子盖的。从外面看是三层，屋檐却有四重，叫三层四檐；走进去，里面其实有六层。连台基一起，有七十多米高。' },
  { t: '底层 · 二十个字的诗', k: 0, e: 'day', p: 'wang', s: '进楼啦！正面的诗屏上，写着王之涣的《登鹳雀楼》。整首诗只有二十个字，却写出了太阳、高山、黄河和大海，一千多年来人人会背。' },
  { t: '中层 · 三首好诗', k: 1, e: 'day', p: 'three', s: '这八扇屏上，是宋朝沈括写的一段话：唐朝人在鹳雀楼留下的诗很多，只有李益、王之涣、畅当三个人的诗，真正把这里的风景写活了。' },
  { t: '顶层 · 更上一层楼', k: 2, e: 'day', p: 'ceng', s: '我们一层一层往上走，终于到了顶层！站得越高，看得越远。这就是王之涣说的：欲穷千里目，更上一层楼。' },
  { t: '登楼看黄河', v: lookout(2, 0, -0.1, 1), e: 'day', p: 'view', s: '到外面的平坐上来！脚下就是黄河，它是中国第二长的河。河水带着黄土高原的泥沙，所以是黄色的。人们亲切地叫它母亲河。' },
  { t: '白日依山尽', v: VIEWS.sunset, e: 'dusk', p: 'sunset', s: '太阳慢慢落到对岸的山后面去了，黄河还在滚滚向前，奔向远方的大海。王之涣看到的，就是这样的傍晚：白日依山尽，黄河入海流。' },
  { t: '河边的大铁牛', v: VIEWS.oxen, e: 'dusk', p: 'niu', s: '河边这几头大铁牛，是一千三百年前唐朝铸的。它们用铁链拴住黄河上的浮桥，让人们能走过黄河。后来它们被泥沙埋住，直到上世纪八十年代末才被挖出来。' },
  { t: '再见，鹳雀楼', v: VIEWS.night, e: 'night', p: 'four', s: '天黑了，鹳雀楼亮起了灯。它和黄鹤楼、岳阳楼、滕王阁，并称中国古代四大名楼。下次登高的时候，别忘了：欲穷千里目，更上一层楼！' }
];
const FLOOR_STOP = [5, 6, 7];

/* ============================== 沿途内容面板 ============================== */
function towerIcon(levels, ruin) {
  let s = '<svg viewBox="0 0 60 70">';
  if (ruin) s += '<path d="M8 62h44" stroke="#c9b48a" stroke-width="3"/><path d="M14 62l4-10 6 4 5-9 7 6 6-5 4 14z" fill="#8a7a5a"/><path d="M6 66c10-3 38-3 48 0" stroke="#c9a46a" stroke-width="3" fill="none"/>';
  for (let i = 0; i < levels; i++) {
    const w = 40 - i * 5, y = 62 - i * 13;
    s += '<rect x="' + (30 - w * 0.34) + '" y="' + (y - 8) + '" width="' + w * 0.68 + '" height="8" fill="#9a3220"/>';
    s += '<path d="M' + (30 - w * 0.7) + ' ' + (y - 7) + 'q' + w * 0.7 + ' -6 ' + w * 1.4 + ' 0z" fill="#6a6e74"/>';
  }
  if (levels) s += '<path d="M' + (30 - 11) + ' ' + (62 - levels * 13 + 6) + 'l11 -10 11 10z" fill="#6a6e74"/>';
  return s + '</svg>';
}
const sayBtn = t => '<button class="say" data-say="' + t + '">🔊 读给我听</button>';
const PANELS = {
  map: function () {
    return '<h2>鹳雀楼在哪儿？</h2>' +
      '<svg viewBox="0 0 400 290"><rect width="400" height="290" fill="#e8dcb8"/>' +
      '<path d="M150 -10C160 40 140 90 150 140S150 200 160 230C200 236 260 230 410 238" stroke="#c99a4a" stroke-width="16" fill="none"/>' +
      '<path d="M250 150C290 130 330 120 390 110" stroke="#8a7a5a" stroke-width="22" stroke-linecap="round" fill="none" opacity=".7"/>' +
      '<path d="M176 168l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z" fill="#d22a1a" stroke="#fff" stroke-width="1.5"/>' +
      '<g font-family="Microsoft YaHei,sans-serif" font-weight="700" text-anchor="middle">' +
      '<text x="120" y="60" font-size="18" fill="#7a5a22">黄 河</text><text x="320" y="262" font-size="16" fill="#7a5a22">黄河向东流</text>' +
      '<text x="70" y="160" font-size="24" fill="#6a5a3a">陕西</text><text x="290" y="70" font-size="24" fill="#6a5a3a">山西</text><text x="330" y="186" font-size="20" fill="#6a5a3a">河南</text>' +
      '<text x="318" y="140" font-size="15" fill="#4a4a3a">中条山</text><text x="222" y="190" font-size="16" fill="#b3261a">鹳雀楼</text><text x="222" y="208" font-size="13" fill="#555">（永济）</text>' +
      '<text x="374" y="24" font-size="13" fill="#555">北↑</text></g></svg>' +
      '<p>鹳雀楼在<b>山西省</b>西南角的<b>永济市</b>，古时候这里叫蒲州。</p>' +
      '<p><b>黄河</b>从北往南流过楼前，往下不远就拐一个大弯，掉头向东流去。河对面是<b>陕西</b>，楼的东南方是连绵的<b>中条山</b>。</p>' +
      '<p class="tip">山西、陕西、河南三个省在这一带碰头，所以古时候这里是黄河上重要的渡口。</p>';
  },
  name: function () {
    return '<h2>鹳雀是什么鸟？</h2>' +
      '<p>“鹳雀”就是<b>鹳</b>，一种大型的水鸟：腿长长的，嘴又长又直，喜欢在河边的浅水里捉鱼和小虾，常常在高高的地方歇脚、筑巢。</p>' +
      '<p>古时候这座楼建在黄河边的高处，四周开阔，鹳雀常常飞来停在楼上，于是人们就叫它<b>鹳雀楼</b>。</p>' +
      '<p class="tip">绕着楼顶飞的是东方白鹳：白身子、黑翅膀尖、红嘴巴、红腿。它现在是国家一级保护动物，飞得高的时候能借着热气流盘旋好久，很少扇翅膀。</p>';
  },
  life: function () {
    const L = [
      [towerIcon(1), '北周 · 一千四百多年前', '鹳雀楼建在蒲州城外的黄河岸边，起初是用来瞭望、守卫的高楼。'],
      [towerIcon(3), '唐朝', '王之涣、李益、畅当等诗人登上鹳雀楼写诗，鹳雀楼从此名扬天下。'],
      [towerIcon(0, true), '元朝初年', '鹳雀楼毁于战火，只剩下一片废墟。'],
      [towerIcon(0, true), '之后的七百多年', '黄河多次泛滥改道，泥沙把旧址埋得严严实实，连楼原来在哪儿都说不清了。人们只能在诗里想象它。'],
      [towerIcon(2), '1997 年', '人们在黄河边按照唐朝的建筑风格，重新动工建楼。'],
      [towerIcon(3), '2002 年', '新的鹳雀楼建成开放，大家又可以“更上一层楼”了。']
    ];
    return '<h2>这座楼的一生</h2><ul class="life">' + L.map(l => '<li>' + l[0] + '<div><b>' + l[1] + '</b><span>' + l[2] + '</span></div></li>').join('') + '</ul>' +
      '<p class="tip">一座楼没了七百多年，人们却一直记得它，是因为王之涣的那二十个字。诗比楼活得还长。</p>';
  },
  facts: function () {
    return '<h2>鹳雀楼小知识</h2><ul class="facts">' +
      '<li><b>它有多高？</b>连台基大约 73.9 米，差不多是二十多层的居民楼那么高。</li>' +
      '<li><b>它有几层？</b>外面看是三层，加上底层外面一圈副阶，一共有四重屋檐，叫“三层四檐”；走进去，里面有六层。</li>' +
      '<li><b>什么样子？</b>照唐朝的风格建造：屋檐挑得很深，斗拱又大又简洁，顶上是歇山顶，屋脊两头立着鸱尾。</li>' +
      '<li><b>什么颜色？</b>红柱子、白墙壁、青灰色的瓦，横木上画着“七朱八白”，看起来朴素大方。</li>' +
      '<li><b>和谁齐名？</b>它和黄鹤楼、岳阳楼、滕王阁，并称中国古代四大名楼。</li></ul>';
  },
  wang: function () {
    return '<h2>底层的诗屏</h2><div class="poem kai"><small>《登鹳雀楼》　唐 · 王之涣</small>白日依山尽，<br>黄河入海流。<br>欲穷千里目，<br>更上一层楼。</div>' +
      sayBtn('登鹳雀楼。唐，王之涣。白日依山尽，黄河入海流。欲穷千里目，更上一层楼。') +
      '<p>前两句写看到的：太阳靠着西边的山慢慢落下去，黄河向着东边的大海奔流。</p>' +
      '<p>后两句写想到的：要想看到千里之外的风景，就得再登上一层楼。</p>' +
      '<p class="tip">二十个字里，有太阳、有山、有河、有海，还有登楼的人。字很少，天地却很大。</p>';
  },
  three: function () {
    return '<h2>沈括说：三首最好</h2><div class="poem kai"><small>《梦溪笔谈》　宋 · 沈括（节选）</small>唐人留诗者甚多，<br>唯李益、王之涣、畅当三篇能状其景。</div>' +
      '<p>意思是：唐朝人在鹳雀楼题的诗很多，只有这三位诗人的诗，把这里的景色写出来了。</p>' +
      '<div class="poem kai"><small>《登鹳雀楼》　唐 · 畅当</small>迥临飞鸟上，高出世尘间。<br>天势围平野，河流入断山。</div>' +
      sayBtn('登鹳雀楼。唐，畅当。迥临飞鸟上，高出世尘间。天势围平野，河流入断山。') +
      '<p>楼太高了，飞鸟都在脚下；天空像一口大锅罩着原野，黄河从断开的山间流进去。</p>' +
      '<div class="poem kai"><small>《同崔邠登鹳雀楼》　唐 · 李益（节选）</small>鹳雀楼西百尺樯，汀洲云树共茫茫。<br>汉家箫鼓随流水，魏国山河半夕阳。</div>' +
      sayBtn('鹳雀楼西百尺樯，汀洲云树共茫茫。汉家箫鼓随流水，魏国山河半夕阳。') +
      '<p class="tip">李益看着夕阳下的黄河，想起了很久以前的朝代，那些热闹都像流水一样过去了。</p>';
  },
  ceng: function () {
    return '<h2>更上一层楼</h2><div class="poem kai">欲穷千里目，<br>更上一层楼。</div>' + sayBtn('欲穷千里目，更上一层楼。') +
      '<p>“穷”在这里是“看尽”的意思。想把千里之外都看个够，就要再往上登一层。</p>' +
      '<p>今天人们常用“更上一层楼”鼓励别人：已经做得很好了，还可以做得更好。</p>' +
      '<p class="tip">你刚刚从底层一层层走到了顶层。往窗外看看，是不是比在楼下看得远多了？</p>';
  },
  view: function () {
    return '<h2>站在楼上看黄河</h2><ul class="facts">' +
      '<li><b>有多长？</b>全长约 5464 千米，是中国第二长的河，仅次于长江。</li>' +
      '<li><b>从哪来，到哪去？</b>发源于青海的巴颜喀拉山，流过九个省区，最后流进渤海。</li>' +
      '<li><b>为什么是黄的？</b>黄河流过黄土高原，冲走了大量泥沙，河水就变得浑黄。</li></ul>' +
      '<div class="poem kai"><small>《浪淘沙》　唐 · 刘禹锡（节选）</small>九曲黄河万里沙，<br>浪淘风簸自天涯。</div>' + sayBtn('九曲黄河万里沙，浪淘风簸自天涯。') +
      '<p class="tip">黄河弯弯曲曲，带着万里黄沙，从天边奔流而来。中华民族很早就在黄河两岸生活，所以人们叫它“母亲河”。</p>';
  },
  sunset: function () {
    return '<h2>白日依山尽，黄河入海流</h2><div class="poem kai">白日依山尽，<br>黄河入海流。</div>' + sayBtn('白日依山尽，黄河入海流。') +
      '<p>“依”是靠着，“尽”是落下去、看不见了。太阳靠着远山，一点点落了下去。</p>' +
      '<p>“入海流”是流进大海。其实站在鹳雀楼上，是看不到大海的。诗人顺着黄河奔流的方向往远处想：它会一直流，一直流，流进大海。</p>' +
      '<p class="tip">一句写眼前的山，一句写想象中的海，诗一下子就从楼前铺到了天边。</p>';
  },
  niu: function () {
    return '<h2>蒲津渡的大铁牛</h2><ul class="facts">' +
      '<li><b>什么时候铸的？</b>唐朝开元年间，距今大约一千三百年。</li>' +
      '<li><b>做什么用？</b>古时候黄河上没有大桥，人们把许多船连起来，铺上木板做成浮桥。铁牛和铁柱埋在岸边，用铁链拴住浮桥，不让河水冲走。</li>' +
      '<li><b>有几头？</b>这一岸发现了四头铁牛，每头铁牛旁边都站着一个铁人，像在牵着牛。</li>' +
      '<li><b>怎么又见到它们？</b>后来黄河改道，铁牛被埋进泥沙里。上世纪八十年代末，人们才把它们重新挖了出来。</li></ul>' +
      '<p class="tip">每头铁牛都有好几十吨重。一千多年前就能铸出这么大的铁器，古人真了不起！</p>';
  },
  four: function () {
    return '<h2>中国古代四大名楼</h2><div class="three"><div class="me"><b>鹳雀楼</b>山西 · 永济<br>黄河边</div><div><b>黄鹤楼</b>湖北 · 武汉<br>长江边</div><div><b>岳阳楼</b>湖南 · 岳阳<br>洞庭湖边</div><div><b>滕王阁</b>江西 · 南昌<br>赣江边</div></div>' +
      '<p>四座楼都站在水边，也都因为有人为它们写下了特别好的诗和文章，才被一代代人记住。</p>' +
      '<p class="tip">鹳雀楼是四座楼里最靠北的一座，也是唯一站在黄河边的一座。</p>';
  }
};
const POEM_PANELS = ['wang', 'three', 'ceng', 'view', 'sunset'];
function showPanel(name) {
  const ex = $('extra');
  if (!name) { ex.hidden = true; } else { $('extraBody').innerHTML = PANELS[name](); ex.hidden = false; ex.scrollTop = 0; }
  document.querySelectorAll('[data-panel]').forEach(b => b.classList.toggle('on', !ex.hidden && b.dataset.panel === name));
}
/* ============================== 讲解与行进 ============================== */
let voiceOn = true, stopIdx = -1, inside = -1, lastIn = 0, travelId = 0;
/* 讲解声音：优先播放 audio/ 里预先用豆包语音合成的 mp3；没有对应音频时退回浏览器自带朗读 */
const AUDIO_BY_TEXT = {}; if (window.HHL_AUDIO) for (const k in window.HHL_AUDIO) AUDIO_BY_TEXT[window.HHL_AUDIO[k]] = k;
const WARM = {};
let player = new Audio(), speakId = 0;
Object.defineProperty(window, '__hhlPlayer', { get: () => player });
function getAudio(key) { if (!WARM[key]) { const a = new Audio(); a.preload = 'auto'; a.src = 'audio/' + key + '.mp3'; WARM[key] = a; } return WARM[key]; }
function preloadVoice(text) { const key = AUDIO_BY_TEXT[text]; if (key) getAudio(key); }
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
  if (!key) {
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
    controls.minAzimuthAngle = -0.85; controls.maxAzimuthAngle = 0.85; controls.minPolarAngle = 1.2; controls.maxPolarAngle = 1.95; controls.enablePan = false;
  } else {
    controls.minDistance = 0.5; controls.maxDistance = 1400; controls.minAzimuthAngle = -Infinity; controls.maxAzimuthAngle = Infinity;
    controls.minPolarAngle = 0; controls.maxPolarAngle = Math.PI * 0.96; controls.enablePan = true;
  }
}
function arrive(k) {
  inside = k; if (k >= 0) lastIn = k;
  H.interior.enter(k);
  camera.fov = k >= 0 ? 58 : 45; camera.updateProjectionMatrix();
  $('btnOut').textContent = k >= 0 ? (k > 0 ? '走到外面平坐看风景' : '走到楼外看看') : '回到楼里';
}
function travel(v, k) {
  k = k === undefined ? -1 : k; const id = ++travelId; setRotate(false);
  if (inside >= 0 || k >= 0) {
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
  preloadVoice(STOPS[(stopIdx + 1) % STOPS.length].s);
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
  labelRoot.appendChild(el); labels.push({ el, pos: V3(pos[0], pos[1], pos[2]), text, desc, geo: !!geo });
}
addLabel('鸱尾', [ROOF.E - 0.6, TY + ROOF.yt + 4.2, 0], '屋脊两头高高翘起的装饰叫鸱尾，样子像一条卷起来的鱼尾巴。古人传说鸱是能喷水的神兽，放在屋顶上，盼着房子不着火。唐朝的楼阁屋顶上最常见的就是它。', false, '鸱读作 chī');
addLabel('歇山顶', [0, TY + ROOF.yt - 1.2, ROOF.rz * 0.45], '最上面的屋顶叫歇山顶：前后两面大坡，左右两边各有一个小坡，小坡上面立着三角形的山花。它看起来既稳重又舒展，是古代很高级的屋顶样式。');
addLabel('唐式斗拱', [-AX[2] + 1.5, TY + colTopY[2] + 1.6, AZ[2] + 1.6], '屋檐下一层叠一层的木构件叫斗拱。唐朝的斗拱个头大、伸出去远，把屋檐挑得又深又远，像大鸟张开了翅膀。', false, '斗拱读作 dǒu gǒng');
addLabel('匾额', [1.8, TY + PLAQUE.y + 2.4, PLAQUE.z + 0.3], '这块蓝底金字的竖匾上，写着鹳雀楼三个大字。唐宋时候，楼阁上的匾常常是竖着写的。');
addLabel('平坐', [AX[1] + 1.2, TY + Y[1] + 1.4, AZ[1] + 1.5], '二层、三层外面伸出一圈带栏杆的平台，叫平坐。人可以从楼里走出来，扶着栏杆远望黄河。');
addLabel('七朱八白', [-AX[0] + 3, TY + colTopY[0] - 0.7, AZ[0] + 0.5], '柱子顶上这根长长的横木叫阑额。它涂成土红色，上面隔开一段段白色的长方块，叫七朱八白，是唐朝和宋朝建筑上常见的彩画。');
addLabel('直棂窗', [AX[0] - VW[0] - 3, TY + 6, AZ[0] - VW[0] + 0.3], '墙上一根根竖着的木条排成的窗户，叫直棂窗。它样子简单大方，是唐朝房屋最常用的窗户。', false, '棂读作 líng');
addLabel('副阶', [AX[0] + FUJIE.off + 0.5, TY + FUJIE.edge + 1, AZ[0] + FUJIE.off + 0.5], '底层外面又绕了一圈矮柱子和一圈屋檐，叫副阶。所以鹳雀楼从外面看只有三层，却有四重屋檐，叫三层四檐。');
addLabel('高台基', [BASE.hx - 3, 7, BASE.hz + 0.5], '整座楼建在一个高大的台基上，要先登上几十级台阶，才能走到楼门口。楼本来就高，站在台基上，看得就更远了。');
addLabel('黄河', [260, WATER_Y + 4, 560], '这就是黄河，中国第二长的河，全长五千四百多千米。它流过黄土高原，带走了大量泥沙，河水就变得浑黄。', true);
addLabel('中条山', [ZT.x, 340, ZT.z], '远处连绵的大山是中条山。宋朝的沈括说，站在鹳雀楼上，往前能望见中条山，往下能看到黄河。', true);
addLabel('唐代铁牛', [OXEN.x, 5, OXEN.z], '这是蒲津渡的唐代铁牛，一共四头，每头旁边还站着一个铁人。它们是用来拴住黄河浮桥的。', true);
const tmpV = V3(0, 0, 0);
function updateLabels() {
  const w = window.innerWidth, h = window.innerHeight;
  for (const l of labels) {
    tmpV.copy(l.pos).project(camera);
    const ok = inside < 0 && tmpV.z < 1 && Math.abs(tmpV.x) < 1 && Math.abs(tmpV.y) < 1 && camera.position.distanceTo(l.pos) > 8 && (l.geo || camera.position.distanceTo(l.pos) < 190);   // 离得太远时只留地名标注，免得挤成一团
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
  if (on && (inside >= 0 || controls.target.distanceTo(camera.position) < 5)) { travel(VIEWS.overview); setTimeout(() => setRotate(true), 2800); return; }
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
  else if (k === 'arrowright' || k === 'pagedown') goStop(stopIdx + 1);
  else if (k === 'arrowleft' || k === 'pageup') { if (stopIdx > 0) goStop(stopIdx - 1); }
  else if (k >= '1' && k <= '3') goStop(FLOOR_STOP[+k - 1]);
  else if (k === ' ') { e.preventDefault(); $('btnRotate').click(); }
  else if (k === 'f') $('btnFull').click();
});

/* ============================== 画质 ============================== */
const QN = { high: '高', mid: '中', low: '低' }, QORDER = ['high', 'mid', 'low'];
function showQuality() { $('btnQuality').textContent = '画质：' + QN[H.qualityName]; }
$('btnQuality').onclick = () => { autoQ.done = true; H.setQuality(QORDER[(QORDER.indexOf(H.qualityName) + 1) % 3]); showQuality(); };
const autoQ = { t: 0, n: 0, low: 0, done: !!qs.get('q') };
function autoQuality(raw) {
  if (autoQ.done || first) return;
  if ((autoQ.warm = (autoQ.warm || 0) + raw) < 5) return;
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
    tween.t = Math.min(1, tween.t + Math.min(raw, 0.6) / tween.dur);
    const e = tween.t * tween.t * (3 - 2 * tween.t);
    camera.position.lerpVectors(tween.p0, tween.p1, e); camera.position.y += Math.sin(Math.PI * e) * tween.arc;
    controls.target.lerpVectors(tween.t0, tween.t1, e);
    if (tween.t >= 1) { tween = null; controls.enabled = true; }
  }
  controls.update();
  if (inside < 0) {
    const onBase = Math.abs(camera.position.x) < BASE.hx && Math.abs(camera.position.z) < BASE.hz ? TY : 0;
    const minY = Math.max(groundH(camera.position.x, camera.position.z), WATER_Y, onBase) + 1.3;
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
preloadVoice(STOPS[0].s);
(function checkVoices() {
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
