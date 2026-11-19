/* 登楼 · 封面交互：十四座诗楼、点楼飞过去、楼前介绍、进入 3D 参观课件、楼的列表、已登进度、地名标注、视角 */
(function () {
'use strict';
const H = window.HHL, T = THREE, M = H.map;
const { scene, camera, controls, canvas, qs, V3 } = H;
const $ = id => document.getElementById(id);

/* ============================== 十四座诗楼 ============================== */
const TOWERS = [
  { name: '鹳雀楼', prov: '山西', city: '永济', water: '黄河', lon: 110.52, lat: 34.9, shape: 'D', lab: 1, course: 'guanquelou-3d/index.html', seal: '更上一层楼', poet: '王之涣', title: '《登鹳雀楼》', lines: ['白日依山尽，', '黄河入海流。', '欲穷千里目，', '更上一层楼。'], story: '古时候楼上常有鹳雀停留，所以叫鹳雀楼。它毁于元朝初年的战火，消失了七百多年，2002 年才在黄河边照唐朝的样子重新建起来。' },
  { name: '黄鹤楼', prov: '湖北', city: '武汉', water: '长江', lon: 114.38, lat: 30.42, shape: 'A', lab: 5, course: 'huanghelou-3d/index.html', seal: '天下江山第一楼', poet: '崔颢', title: '《黄鹤楼》', lines: ['昔人已乘黄鹤去，', '此地空余黄鹤楼。'], story: '传说有仙人骑着黄鹤从这里飞走了。李白登楼想写诗，看到墙上崔颢的这一首，只好感叹：“眼前有景道不得，崔颢题诗在上头。”' },
  { name: '晴川阁', prov: '湖北', city: '武汉', water: '长江', lon: 114.0, lat: 30.45, shape: 'B', lab: 0, course: 'qingchuange-3d/index.html', seal: '楚天第一楼', poet: '崔颢', title: '《黄鹤楼》', lines: ['晴川历历汉阳树，', '芳草萋萋鹦鹉洲。'], story: '晴川阁的名字来自崔颢诗里的“晴川历历汉阳树”。它站在龟山脚下的长江边，和黄鹤楼隔江相望。' },
  { name: '滕王阁', prov: '江西', city: '南昌', water: '赣江', lon: 116.06, lat: 28.6, shape: 'B', lab: 0, course: 'tengwangge-3d/index.html', seal: '西江第一楼', poet: '王勃', title: '《滕王阁序》', lines: ['落霞与孤鹜齐飞，', '秋水共长天一色。'], story: '滕王阁是唐太宗的弟弟滕王李元婴建的。年轻的王勃路过南昌，在阁上的宴会里写下《滕王阁序》，从此滕王阁天下闻名。' },
  { name: '浔阳楼', prov: '江西', city: '九江', water: '长江', lon: 116.0, lat: 29.58, shape: 'B', lab: 2, course: 'xunyanglou-3d/index.html', seal: '九江', poet: '白居易', title: '《琵琶行》', lines: ['浔阳江头夜送客，', '枫叶荻花秋瑟瑟。'], story: '九江古时候叫浔阳。白居易在这里的江边写下了《琵琶行》。小说《水浒传》里，宋江在浔阳楼题诗，惹出一场大祸。' },
  { name: '太白楼', prov: '安徽', city: '马鞍山', water: '长江', lon: 118.62, lat: 31.6, shape: 'B', lab: 0, course: 'taibailou-3d/index.html', seal: '采石矶', poet: '李白', title: '《望天门山》', lines: ['天门中断楚江开，', '碧水东流至此回。'], story: '李白字太白，晚年常在采石矶一带游玩。民间传说他醉后跳进江里去捞月亮。人们建了太白楼来纪念他。' },
  { name: '阅江楼', prov: '江苏', city: '南京', water: '长江', lon: 118.66, lat: 31.98, shape: 'A', lab: 7, course: 'yuejianglou-3d/index.html', seal: '南京', poet: '宋濂', title: '《阅江楼记》', lines: ['金陵为帝王之州。'], story: '明朝初年，朱元璋让宋濂先写了一篇《阅江楼记》，楼却一直没建起来。直到六百多年后的 2001 年，阅江楼才终于建成。' },
  { name: '北固楼', prov: '江苏', city: '镇江', water: '长江', lon: 119.52, lat: 32.1, shape: 'B', lab: 3, course: 'beigulou-3d/index.html', seal: '镇江', poet: '辛弃疾', title: '《南乡子·登京口北固亭有怀》', lines: ['何处望神州？', '满眼风光北固楼。'], story: '北固山伸进长江里，山上的北固楼是长江下游很早的一座楼。南宋词人辛弃疾登楼远望，想起三国时的孙权，写下了“生子当如孙仲谋”。' },
  { name: '望江楼', prov: '四川', city: '成都', water: '锦江', lon: 104.1, lat: 30.63, shape: 'A', lab: 1, course: 'wangjianglou-3d/index.html', seal: '成都', poet: '薛涛', title: '《送友人》', lines: ['水国蒹葭夜有霜，', '月寒山色共苍苍。'], story: '望江楼站在锦江边，纪念唐代女诗人薛涛。她喜欢竹子，园里种满了竹；她还亲手做过一种小巧的彩色信纸，人们叫它“薛涛笺”。' },
  { name: '岳阳楼', prov: '湖南', city: '岳阳', water: '洞庭湖', lon: 113.2, lat: 29.3, shape: 'C', lab: 1, course: 'yueyanglou-3d/index.html', seal: '岳阳天下楼', poet: '杜甫', title: '《登岳阳楼》', lines: ['昔闻洞庭水，', '今上岳阳楼。'], story: '范仲淹写《岳阳楼记》的时候并不在岳阳，是看着朋友送来的洞庭湖图写的，写下了“先天下之忧而忧，后天下之乐而乐”。' },
  { name: '望湖楼', prov: '浙江', city: '杭州', water: '西湖', lon: 120.12, lat: 30.32, shape: 'B', lab: 0, course: 'wanghulou-3d/index.html', seal: '杭州', poet: '苏轼', title: '《六月二十七日望湖楼醉书》', lines: ['黑云翻墨未遮山，', '白雨跳珠乱入船。'], story: '一个夏天，苏轼在西湖边的望湖楼上喝酒。忽然乌云翻滚、大雨落下，一阵风吹过，雨又停了。他把这场雨写进了四句诗里。' },
  { name: '烟雨楼', prov: '浙江', city: '嘉兴', water: '南湖', lon: 120.76, lat: 30.78, shape: 'B', lab: 4, course: 'yanyulou-3d/index.html', seal: '嘉兴', poet: '杜牧', title: '《江南春》', lines: ['南朝四百八十寺，', '多少楼台烟雨中。'], story: '南湖上常常飘着蒙蒙细雨。人们借杜牧“多少楼台烟雨中”这句诗，给湖心岛上的小楼取名叫“烟雨楼”。' },
  { name: '蓬莱阁', prov: '山东', city: '蓬莱', water: '大海', lon: 120.72, lat: 37.74, shape: 'B', lab: 1, course: 'penglaige-3d/index.html', seal: '蓬莱', poet: '民间传说', title: '', lines: ['八仙过海，', '各显神通。'], story: '传说八位神仙在蓬莱阁上喝完酒，各自拿出宝贝渡海。站在阁上，有时还能看到海面上出现城市一样的幻影，那就是海市蜃楼。' },
  { name: '大观楼', prov: '云南', city: '昆明', water: '滇池', lon: 102.66, lat: 25.07, shape: 'D', lab: 1, course: 'daguanlou-3d/index.html', seal: '昆明', poet: '孙髯翁', title: '大观楼长联', lines: ['五百里滇池，奔来眼底，', '披襟岸帻，喜茫茫空阔无边。'], story: '清代读书人孙髯翁为大观楼写了一副对联，上下联加起来一共一百八十个字，被人们称为“天下第一长联”。' }
];

/* 已登进度：存在这台电脑的浏览器里（几座 3D 课件和这张地图共用） */
let climbed = {};
try { climbed = JSON.parse(localStorage.getItem('denglou-climbed') || '{}') || {}; } catch (e) { climbed = {}; }
function saveClimbed() { try { localStorage.setItem('denglou-climbed', JSON.stringify(climbed)); } catch (e) {} }

/* ============================== 楼的标记与标签 ============================== */
const labelRoot = $('labels'), mks = [];
TOWERS.forEach(function (t) {
  const mk = M.addTower(t); mks.push(mk);
  const el = document.createElement('div'); el.className = 'label tower' + (t.course ? ' open' : '');
  el.innerHTML = '<b>' + t.name + '</b><small>' + t.city + '</small>';
  el.addEventListener('click', e => { e.stopPropagation(); select(mk); });
  el.addEventListener('mouseenter', () => hoverMk(mk)); el.addEventListener('mouseleave', () => hoverMk(null));
  labelRoot.appendChild(el); mk.el = el;
});
function refreshMarks() {
  let n = 0;
  for (const mk of mks) {
    const on = !!climbed[mk.t.name]; if (on) n++;
    mk.el.classList.toggle('done', on);
    mk.lit = on;
  }
  $('climbedNo').textContent = n; $('openNo').textContent = TOWERS.filter(t => t.course).length;
}
/* 地名标注（江河湖海、高原盆地），点开有一句介绍 */
const GEO = [
  ['黄河', 108.3, 39.9, '黄河是中国第二长的河，全长约 5464 千米。它流过黄土高原，带走大量泥沙，河水变得浑黄，人们叫它母亲河。'],
  ['长江', 108.9, 30.9, '长江是中国第一长河，全长约 6300 千米，从青藏高原一路向东流进东海。十四座诗楼里，有好几座就站在长江边。'],
  ['东海', 124.0, 29.0, '长江在上海附近流进东海。'], ['黄海', 123.0, 35.0, '黄海因为黄河带来的泥沙，近岸的海水有点发黄，所以叫黄海。'], ['渤海', 120.0, 39.0, '渤海是被辽东半岛和山东半岛抱在中间的海，黄河就从这里入海。'],
  ['洞庭湖', 112.6, 29.25, '洞庭湖在湖南北部，岳阳楼就站在湖边。范仲淹写它“衔远山，吞长江”。'], ['鄱阳湖', 116.3, 29.3, '鄱阳湖是中国最大的淡水湖，湖水在九江附近流进长江。'], ['太湖', 120.2, 31.25, '太湖在江苏和浙江之间，是江南水乡的中心。'],
  ['青藏高原', 101.0, 31.5, '西边这片又高又大的地方是青藏高原，被称为“世界屋脊”，长江和黄河都是从那里流出来的。'], ['四川盆地', 105.6, 30.0, '四周高山围着，中间低平，像一个大盆，叫四川盆地。成都的望江楼就在盆地西边。'],
  ['黄土高原', 108.0, 37.2, '这一大片黄色的高原是黄土高原，土层又厚又松，雨水一冲就把泥沙带进了黄河。'], ['秦岭', 107.5, 34.1, '秦岭东西横卧，是中国南方和北方的分界线：岭南温暖湿润，岭北比较干冷。']
];
const geoLabels = GEO.map(function (g) {
  const el = document.createElement('div'); el.className = 'label geo'; el.textContent = g[0];
  el.addEventListener('click', e => { e.stopPropagation(); showCard(g[0], g[3]); });
  labelRoot.appendChild(el);
  const x = M.PX(g[1]), z = M.PZ(g[2]); return { el, major: ['黄河', '长江', '东海', '黄海', '渤海'].includes(g[0]), pos: V3(x, Math.max(M.groundH(x, z), 0) + 4, z) };
});
function showCard(title, desc) { const c = $('card'); c.querySelector('h3').textContent = title; c.querySelector('p').textContent = desc; c.hidden = false; }
$('card').onclick = () => { $('card').hidden = true; };

/* ============================== 视角 ============================== */
const VIEWS = {
  all: { pos: V3(30, 900, 700), target: V3(30, 0, 40) },
  north: { pos: V3(M.PX(113.5), 300, M.PZ(31.2)), target: V3(M.PX(114.5), 0, M.PZ(36.2)) },
  south: { pos: V3(M.PX(117.5), 260, M.PZ(26.0)), target: V3(M.PX(117.0), 0, M.PZ(30.4)) },
  west: { pos: V3(M.PX(107.5), 300, M.PZ(23.5)), target: V3(M.PX(104.0), 0, M.PZ(28.3)) },
  home: { pos: V3(M.PX(123.2), 210, M.PZ(25.2)), target: V3(M.PX(116.2), 0, M.PZ(30.4)) }
};
let tween = null;
function flyTo(v, dur) {
  tween = { p0: camera.position.clone(), t0: controls.target.clone(), p1: v.pos.clone(), t1: v.target.clone(), t: 0, dur: dur || 2.6 };
  tween.arc = Math.min(120, tween.p0.distanceTo(tween.p1) * 0.18); controls.enabled = false; setRotate(false);
}
function jumpTo(v) { camera.position.copy(v.pos); controls.target.copy(v.target); }
function markView(name) { document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('on', b.dataset.view === name)); }

/* ============================== 选楼：飞过去，弹出楼前介绍 ============================== */
let sel = null;
function towerView(mk) {
  const top = mk.model.userData.top * 1.7;
  return { pos: V3(mk.x + 22, mk.y + top * 0.75 + 8, mk.z + 36), target: V3(mk.x, mk.y + top * 0.42, mk.z) };
}
function select(mk) {
  begin(); sel = mk; $('card').hidden = true; showList(false);
  flyTo(towerView(mk)); markView(null);
  mks.forEach(m => m.el.classList.toggle('sel', m === mk));
  const t = mk.t, done = !!climbed[t.name];
  const poem = '<div class="poem kai"><small>' + (t.title ? t.title + '　' : '') + t.poet + '</small>' + t.lines.join('<br>') + '</div>';
  $('extraBody').innerHTML =
    '<div class="tw-head"><h2>' + t.name + '</h2><span class="sealx">' + t.seal + '</span></div>' +
    '<p class="where">' + t.prov + ' · ' + t.city + ' · ' + t.water + '边' + (done ? '<em>已登</em>' : '') + '</p>' + poem +
    '<p>' + t.story + '</p>' +
    (t.course
      ? '<button class="main go" id="btnGo">登楼参观 ▶</button><p class="tip">跟着导游，从远处一路飞到楼前，再一层一层登上去。</p>'
      : '<button class="go" disabled>3D 参观正在修建中</button><p class="tip">这座楼的 3D 课件还在制作，先读读它的诗和故事吧。</p>') +
    '<div class="row"><button id="btnPrevT">◀ 上一座</button><button id="btnBack">回到全图</button><button id="btnNextT">下一座 ▶</button></div>';
  $('extra').hidden = false; $('extra').scrollTop = 0;
  if (t.course) $('btnGo').onclick = () => enter(t);
  $('btnBack').onclick = () => { unselect(); flyTo(VIEWS.all); markView('all'); };
  const i = mks.indexOf(mk);
  $('btnPrevT').onclick = () => select(mks[(i + mks.length - 1) % mks.length]);
  $('btnNextT').onclick = () => select(mks[(i + 1) % mks.length]);
}
function unselect() { sel = null; $('extra').hidden = true; mks.forEach(m => m.el.classList.remove('sel')); }
function enter(t) {                                   // 进入这座楼的 3D 课件
  climbed[t.name] = true; saveClimbed(); refreshMarks();
  $('fade').classList.add('on'); setTimeout(() => { location.href = t.course; }, 480);
}
$('extraClose').onclick = () => unselect();

/* ============================== 楼的列表 ============================== */
function renderList() {
  $('listBody').innerHTML = mks.map((mk, i) => {
    const t = mk.t, st = climbed[t.name] ? '<i class="st done">已登</i>' : t.course ? '<i class="st open">可参观</i>' : '<i class="st">修建中</i>';
    return '<button class="tcard' + (t.course ? ' open' : '') + '" data-i="' + i + '"><b>' + t.name + '</b><span>' + t.prov + ' · ' + t.city + '</span>' + st + '</button>';
  }).join('');
  $('listBody').querySelectorAll('.tcard').forEach(b => b.onclick = () => select(mks[+b.dataset.i]));
}
let confirmReset = 0;
function showList(on) {
  if (on) { renderList(); unselect(); }
  $('list').hidden = !on; $('btnList').classList.toggle('on', on);
}
$('btnList').onclick = () => { begin(); showList($('list').hidden); };
$('listClose').onclick = () => showList(false);
$('btnReset').onclick = () => {
  if (Date.now() - confirmReset > 4000) { confirmReset = Date.now(); $('btnReset').textContent = '再点一次，清空全部进度'; setTimeout(() => { $('btnReset').textContent = '清空进度，重新开始'; }, 4000); return; }
  climbed = {}; saveClimbed(); refreshMarks(); renderList(); $('btnReset').textContent = '清空进度，重新开始'; confirmReset = 0;
};

/* ============================== 点选与悬停 ============================== */
const ray = new T.Raycaster(), ndc = new T.Vector2(), hits = mks.map(m => m.hit);
let down = null, hover = null;
function pick(e) { const r = canvas.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, camera); const h = ray.intersectObjects(hits, false)[0]; return h ? h.object.userData.mk : null; }
function hoverMk(mk) { hover = mk; mks.forEach(m => m.el.classList.toggle('hover', m === mk)); canvas.style.cursor = mk ? 'pointer' : ''; }
canvas.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; if (controls.autoRotate && document.body.classList.contains('started')) setRotate(false); });
canvas.addEventListener('pointermove', e => { if (!down) hoverMk(pick(e)); });
canvas.addEventListener('pointerup', e => {
  const moved = down ? Math.hypot(e.clientX - down[0], e.clientY - down[1]) : 99; down = null;
  if (moved < 6 && document.body.classList.contains('started')) { const mk = pick(e); if (mk) select(mk); }
});

/* ============================== 开始、工具栏 ============================== */
function setRotate(on) { controls.autoRotate = on; $('btnRotate').classList.toggle('on', on); }
function begin() { if (document.body.classList.contains('started')) return; document.body.classList.add('started'); setRotate(false); }
$('btnStart').onclick = () => { begin(); flyTo(VIEWS.all, 3); markView('all'); };
$('btnFree').onclick = () => { begin(); flyTo(VIEWS.all, 3); markView('all'); showList(true); };
document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => { unselect(); flyTo(VIEWS[b.dataset.view]); markView(b.dataset.view); });
$('btnLabels').onclick = e => { labelRoot.classList.toggle('off'); e.currentTarget.classList.toggle('on'); };
$('btnRotate').onclick = () => setRotate(!controls.autoRotate);
$('btnFull').onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); };
$('btnHide').onclick = () => document.body.classList.add('immersive');
window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k === 'h') document.body.classList.toggle('immersive');
  else if (k === 'escape') { document.body.classList.remove('immersive'); $('card').hidden = true; showList(false); }
  else if (!document.body.classList.contains('started')) { if (k === 'enter' || k === ' ') $('btnStart').click(); }
  else if (k === 'arrowright' || k === 'pagedown') select(mks[sel ? (mks.indexOf(sel) + 1) % mks.length : 0]);
  else if (k === 'arrowleft' || k === 'pageup') select(mks[sel ? (mks.indexOf(sel) + mks.length - 1) % mks.length : mks.length - 1]);
  else if (k === 'f') $('btnFull').click();
});
const QN = { high: '高', mid: '中', low: '低' }, QORDER = ['high', 'mid', 'low'];
function showQuality() { $('btnQuality').textContent = '画质：' + QN[H.qualityName]; }
$('btnQuality').onclick = () => { autoQ.done = true; H.setQuality(QORDER[(QORDER.indexOf(H.qualityName) + 1) % 3]); showQuality(); };
const autoQ = { t: 0, n: 0, done: !!qs.get('q') };
function autoQuality(raw) {
  if (autoQ.done || first) return;
  if ((autoQ.warm = (autoQ.warm || 0) + raw) < 5) return;
  autoQ.t += raw; autoQ.n++; window.__hhlFps = autoQ.n / autoQ.t;
  if (autoQ.t < 3) return;
  const i = QORDER.indexOf(H.qualityName);
  if (autoQ.n / autoQ.t < 24 && i < 2) { H.setQuality(QORDER[i + 1]); showQuality(); autoQ.t = 0; autoQ.n = 0; autoQ.warm = 1.5; } else autoQ.done = true;
}
showQuality();

/* ============================== 地图式操作：左键拖地图、右键转、滚轮缩放 ============================== */
controls.mouseButtons = { LEFT: T.MOUSE.PAN, MIDDLE: T.MOUSE.DOLLY, RIGHT: T.MOUSE.ROTATE };
controls.touches = { ONE: T.TOUCH.PAN, TWO: T.TOUCH.DOLLY_ROTATE };
controls.screenSpacePanning = false; controls.panSpeed = 1.1;
controls.minDistance = 30; controls.maxDistance = 1500; controls.maxPolarAngle = 1.3; controls.autoRotateSpeed = 0.35;

/* ============================== 主循环 ============================== */
const clock = new T.Clock(), tmpV = V3(0, 0, 0); let time = 0, first = true;
function placeLabel(el, pos, w, h, center, hideFar) {
  tmpV.copy(pos).project(camera);
  const ok = tmpV.z < 1 && Math.abs(tmpV.x) < 1.05 && Math.abs(tmpV.y) < 1.05 && !(hideFar && camera.position.distanceTo(pos) > hideFar);
  el.style.display = ok ? '' : 'none';
  if (ok) { const ox = center ? (el._w || (el._w = el.offsetWidth)) / 2 : 0; el.style.transform = 'translate(' + ((tmpV.x * 0.5 + 0.5) * w - ox | 0) + 'px,' + ((-tmpV.y * 0.5 + 0.5) * h | 0) + 'px)'; }
  return ok;
}
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
  controls.target.x = Math.max(-560, Math.min(620, controls.target.x)); controls.target.z = Math.max(-520, Math.min(560, controls.target.z));
  const minY = Math.max(M.groundH(camera.position.x, camera.position.z), 0) + 6; if (camera.position.y < minY) camera.position.y = minY;
  M.update(dt, time);
  const w = window.innerWidth, h = window.innerHeight;
  for (const mk of mks) {                                    // 远看时把小楼放大一些，近看时恢复原样
    const d = camera.position.distanceTo(mk.root.position), s = Math.max(1, Math.min(4.2, d / 150)), lit = mk.lit, isSel = mk === sel, isHov = mk === hover;
    mk.model.scale.setScalar(1.7 * s * (isHov ? 1.12 : 1));
    const pulse = 0.5 + 0.5 * Math.sin(time * 2.2 + mk.ph);
    mk.pillar.scale.set(1.3 * s, (mk.t.course ? 70 : 46) * Math.max(1, s * 0.7), 1.3 * s);
    mk.pillar.material.opacity = (mk.t.course ? 0.55 + 0.3 * pulse : 0.26 + 0.14 * pulse) * (isSel ? 1.3 : 1);
    const cyc = ((time * 0.45 + mk.ph) % 3) / 3; mk.ring.scale.setScalar((8 + 16 * cyc) * s); mk.ring.material.opacity = 0.8 * (1 - cyc) * (mk.t.course ? 1 : 0.5);
    mk.hit.scale.setScalar(1.7 * s);
    const top = mk.model.userData.top * 1.7 * s;
    tmpV.set(mk.x, mk.y + top + (6 + mk.t.lab * 4.5) * Math.max(1, s * 0.75), mk.z);
    placeLabel(mk.el, tmpV, w, h, true);
  }
  M.MT.gold.emissiveIntensity = 0.12; M.MT.red.emissiveIntensity = 0.04;
  for (const g of geoLabels) placeLabel(g.el, g.pos, w, h, false, g.major ? 0 : 620);
  H.post.render(scene, camera);
  autoQuality(raw);
  if (first) { first = false; $('loading').classList.add('done'); }
}

/* 启动。调试用地址参数：?go=1 直接进入 ?view=名 ?tower=楼名 */
refreshMarks();
jumpTo(VIEWS.home); setRotate(true);
M.bakeEnv();
if (qs.get('go') || qs.get('view') || qs.get('tower')) { begin(); jumpTo(VIEWS[qs.get('view')] || VIEWS.all); }
if (qs.get('tower')) { const mk = mks.find(m => m.t.name === qs.get('tower')); if (mk) { select(mk); tween = null; jumpTo(towerView(mk)); controls.enabled = true; } }
if (qs.get('list')) { begin(); showList(true); }
frame();
})();
