/* 烟雨楼 · 讲解内容：视角、12 站讲解词、沿途面板、构件标注（界面逻辑在 tour.js） */
(function () {
'use strict';
const H = window.HHL, TR = H.tour, V3 = H.V3;
const { AX, AZ, Y, TY, MZ, ROOF, PLAQUE, colTopY, QH, GROUND } = H.tower;
const { WATER_Y, ISL, RB } = H.world;
const addLabel = TR.addLabel, sayBtn = TR.sayBtn, lookout = TR.lookout, poem = TR.poem, towerIcon = TR.towerIcon;

const VIEWS = {
  overview: { pos: V3(46, 26, 66), target: V3(0, TY + 4, -2) },
  front: { pos: V3(26, TY + 9, 58), target: V3(0, TY + 6, 0) },
  lookup: { pos: V3(5, GROUND + 1.7, MZ + 13), target: V3(0, TY + 12, MZ) },
  bird: { pos: V3(90, 110, 140), target: V3(0, 0, 4) },
  lake: { pos: V3(-120, WATER_Y + 4, 260), target: V3(0, TY + 5, 0) },
  boat: { pos: V3(RB.x + 18, 5, RB.z + 18), target: V3(RB.x, 1.6, RB.z) },
  roof: { pos: V3(18, TY + 16, MZ + 22), target: V3(0, TY + 11, MZ) },
  map: { pos: V3(-500, 1200, -600), target: V3(0, 0, 300) },
  court: { pos: V3(14, GROUND + 13, 32), target: V3(0, TY + 4, MZ) },
  mist: { pos: V3(-60, 10, 160), target: V3(0, TY + 5, 0) },
  willow: { pos: V3(-40, GROUND + 2.2, 44), target: V3(-60, GROUND + 3, 20) },
  night: { pos: V3(52, 20, 80), target: V3(0, TY + 4, 0) }
};

const STOPS = [
  { t: '远远望见烟雨楼', v: VIEWS.lake, e: 'day', s: '你好，我是小莺！看，南湖中间有一座小岛，岛上垂柳环绕，露出一座红柱青瓦的楼，那就是烟雨楼。它在浙江嘉兴。只能坐船过去哦，跟我飞过去吧！' },
  { t: '它在哪儿？', v: VIEWS.map, e: 'day', p: 'map', s: '从天上往下看，嘉兴在上海和杭州中间，到处是河湖，是典型的江南水乡。南湖就在嘉兴城的东南边，烟雨楼站在湖心岛上。' },
  { t: '多少楼台烟雨中', v: VIEWS.mist, e: 'day', mist: true, p: 'name', s: '下雨了，湖上起了雾，小楼若隐若现，好像浮在烟雨里。唐朝诗人杜牧写过：多少楼台烟雨中。人们就借这句诗，给它取名烟雨楼。' },
  { t: '一座搬了家的楼', v: VIEWS.front, e: 'day', p: 'life', s: '烟雨楼最早建在五代时的南湖岸边。明朝时，嘉兴的知府带人疏浚河道，把挖出来的泥堆在湖中间，堆成了这座湖心岛，后来就把烟雨楼建到了岛上。' },
  { t: '楼前的小院', v: VIEWS.court, e: 'day', p: 'facts', s: '烟雨楼前有一个小院，前面是清晖堂，两边是游廊。烟雨楼有两层，重檐歇山顶，它不高，却和湖光柳色配得刚刚好。' },
  { t: '一层 · 千里莺啼', k: 0, e: 'day', p: 'jiangnan', s: '进楼啦！一层挂着杜牧的《江南春》。千里江南，黄莺在绿树红花间啼叫，水边的村子、山边的城郭都飘着酒旗。我的名字小莺，就是从这里来的。' },
  { t: '二层 · 乾隆也爱它', k: 1, e: 'day', p: 'qianlong', s: '二层讲的是乾隆皇帝。他六次下江南，多次登上烟雨楼。他太喜欢这里了，回去以后在承德避暑山庄里照着样子也建了一座烟雨楼。' },
  { t: '凭栏看南湖', v: lookout(1, 0, -0.08, 1), e: 'day', p: 'nanhu', s: '到外面的回廊来！四面都是湖水，湖上一片片绿色的是菱叶，南湖的菱角没有角，圆圆的，叫无角菱，是嘉兴的特产。' },
  { t: '沾衣欲湿杏花雨', v: VIEWS.willow, e: 'day', mist: true, p: 'yu', s: '江南的春雨细细密密，打在身上衣服似湿非湿。宋朝的志南和尚写：沾衣欲湿杏花雨，吹面不寒杨柳风。南湖的烟雨，就是这样轻轻柔柔的。' },
  { t: '岸边的红船', v: VIEWS.boat, e: 'day', p: 'hongchuan', s: '湖心岛边停着一条红色的游船。一九二一年，中国共产党第一次全国代表大会在上海召开，后来转移到嘉兴南湖的一条游船上，完成了最后的议程。这条红船就是照原样仿制的纪念船。' },
  { t: '清晖堂', k: 2, e: 'dusk', p: 'qinghui', s: '天快黑了，我们到楼前的清晖堂看看。这里讲的就是南湖红船的故事。' },
  { t: '再见，烟雨楼', v: VIEWS.night, e: 'night', p: 'bye', s: '夜里的南湖静悄悄的，烟雨楼的灯光倒映在水里。再见啦，下次下雨的时候来嘉兴，坐船去看烟雨楼！' }
];
const FLOOR_STOP = [5, 6, 10];

const PANELS = {
  map: function () {
    return '<h2>烟雨楼在哪儿？</h2>' +
      '<svg viewBox="0 0 400 290"><rect width="400" height="290" fill="#dfe8c8"/>' +
      '<path d="M0 260C120 200 240 180 410 150" stroke="#4f9fd4" stroke-width="40" fill="none" opacity=".5"/>' +
      '<ellipse cx="210" cy="140" rx="60" ry="40" fill="#8fc6d8"/><ellipse cx="210" cy="140" rx="12" ry="9" fill="#6f8a5a"/>' +
      '<path d="M210 120l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z" fill="#d22a1a" stroke="#fff" stroke-width="1.5"/>' +
      '<g font-family="Microsoft YaHei,sans-serif" font-weight="700" text-anchor="middle">' +
      '<text x="350" y="60" font-size="20" fill="#7a3a12">上海 →</text><text x="60" y="250" font-size="20" fill="#7a3a12">← 杭州</text><text x="150" y="90" font-size="20" fill="#7a3a12">嘉兴</text>' +
      '<text x="210" y="200" font-size="16" fill="#2a6f9a">南湖</text><text x="374" y="270" font-size="13" fill="#555">北↑</text></g></svg>' +
      '<p>烟雨楼在<b>浙江省嘉兴市</b>的<b>南湖</b>湖心岛上。嘉兴在上海和杭州之间，河道纵横，是有名的江南水乡。</p>';
  },
  name: function () {
    return '<h2>烟雨楼的名字</h2>' + poem('《江南春》　唐 · 杜牧（节选）', ['南朝四百八十寺，', '多少楼台烟雨中。']) + sayBtn('南朝四百八十寺，多少楼台烟雨中。') +
      '<p>南湖上常常飘着蒙蒙细雨，雨中的楼台若隐若现。人们借杜牧这句诗，给它取名“<b>烟雨楼</b>”。</p><p class="tip">（这一站打开了“起雾”，可以再点一次“起雾”看看晴天的样子。）</p>';
  },
  life: function () {
    return TR.life([
      [towerIcon(2, { roof: '#6a6e74' }), '五代', '吴越国的广陵王在南湖岸边建了一座楼。'],
      [towerIcon(0), '明朝 · 嘉靖年间', '嘉兴知府赵瀛疏浚河道，用挖出来的泥堆成湖心岛，第二年把烟雨楼建到岛上。'],
      [towerIcon(2, { roof: '#6a6e74' }), '清朝 · 乾隆年间', '乾隆六下江南，多次登楼，还在承德避暑山庄仿建了一座烟雨楼。'],
      [towerIcon(2, { roof: '#6a6e74' }), '今天', '湖心岛上有烟雨楼、清晖堂等建筑，岛边停着南湖红船。']
    ]);
  },
  facts: TR.facts.bind(null, '烟雨楼小知识', [
    ['它有几层？', '两层，重檐歇山顶，青瓦朱柱。'],
    ['它在哪儿？', '南湖湖心岛上，四面环水，只能坐船去。'],
    ['岛是怎么来的？', '明朝疏浚河道时，用挖出来的泥堆成的。'],
    ['它的“分身”', '承德避暑山庄里也有一座烟雨楼，是乾隆照着它建的。']]),
  jiangnan: function () {
    return '<h2>一层：江南春</h2>' + poem('《江南春》　唐 · 杜牧', ['千里莺啼绿映红，', '水村山郭酒旗风。', '南朝四百八十寺，', '多少楼台烟雨中。']) +
      sayBtn('江南春。唐，杜牧。千里莺啼绿映红，水村山郭酒旗风。南朝四百八十寺，多少楼台烟雨中。') +
      '<p>千里江南，到处是黄莺啼叫，绿树映着红花；水边的村庄、山边的城郭，酒旗迎风飘动。南朝留下的那么多寺庙楼台，都笼罩在蒙蒙烟雨里。</p>';
  },
  qianlong: function () {
    return '<h2>二层：乾隆与烟雨楼</h2><p>清朝的乾隆皇帝六次下江南，多次来到嘉兴，登上烟雨楼，写了不少诗。</p>' +
      '<p>他回到北方以后，在<b>承德避暑山庄</b>的湖中小岛上，照着嘉兴烟雨楼的样子又建了一座，也叫烟雨楼。</p><p class="tip">一座楼有了“分身”，可见它有多讨人喜欢。</p>';
  },
  nanhu: TR.facts.bind(null, '站在楼上看南湖', [
    ['南湖', '嘉兴城东南的一个湖，和西南湖相连，像一对鸳鸯，所以又叫鸳鸯湖。'],
    ['菱', '湖上漂着的绿叶是菱叶。南湖的菱角没有尖尖的角，叫“无角菱”，又叫“南湖菱”。'],
    ['垂柳', '湖心岛四周种满了垂柳，柳枝垂到水面上。']]),
  yu: function () {
    return '<h2>江南的雨</h2>' + poem('《绝句》　宋 · 志南', ['古木阴中系短篷，', '杖藜扶我过桥东。', '沾衣欲湿杏花雨，', '吹面不寒杨柳风。']) +
      sayBtn('绝句。宋，志南。古木阴中系短篷，杖藜扶我过桥东。沾衣欲湿杏花雨，吹面不寒杨柳风。') +
      '<p>杏花开的时候下的雨，细得好像要把衣服打湿又没打湿；杨柳吹来的风，拂在脸上一点也不冷。</p>';
  },
  hongchuan: function () {
    return '<h2>南湖红船</h2><p>1921 年 7 月，中国共产党第一次全国代表大会在<b>上海</b>召开。会议受到干扰后，代表们转移到嘉兴<b>南湖</b>，在一条游船上完成了最后的议程。</p>' +
      '<p>这条船后来被称为“<b>红船</b>”。今天停在湖心岛边的，是照原来的样子仿制的纪念船。</p>';
  },
  qinghui: function () {
    return '<h2>清晖堂</h2><p>清晖堂在烟雨楼前，中间隔着一个小院，两边有游廊相连。</p><p>“清晖”是清亮的光，取自谢灵运的诗句“山水含清晖”。</p>' +
      '<p class="tip">堂里讲的是南湖红船的故事。走出去，就能看到岸边那条红色的船。</p>';
  },
  bye: function () {
    return '<h2>再见，南湖</h2>' + poem('《江南春》（节选）', ['千里莺啼绿映红，', '水村山郭酒旗风。']) + sayBtn('千里莺啼绿映红，水村山郭酒旗风。') +
      '<p class="tip">晴天的烟雨楼清清爽爽，雨天的烟雨楼朦朦胧胧。你更喜欢哪一种？</p>';
  }
};
const POEM_PANELS = ['name', 'jiangnan', 'yu', 'bye'];

addLabel('重檐歇山顶', [0, TY + ROOF.yt - 1.0, MZ + 2.6], '烟雨楼有两重屋檐，最上面是歇山顶，铺着青灰色的瓦。');
addLabel('匾额', [2, TY + PLAQUE.y + 0.4, MZ + PLAQUE.z + 0.3], '二层屋檐下的匾上写着烟雨楼三个字。');
addLabel('回廊栏杆', [AX[1] + 0.5, TY + Y[1] + 1.3, MZ + AZ[1] + 0.6], '二层外面有一圈回廊，扶着栏杆就能看到四面的湖水。');
addLabel('清晖堂', [QH.x + 2, QH.top + 0.6, QH.z], '楼前的厅堂叫清晖堂，中间隔着一个小院。');
addLabel('游廊', [10.5, GROUND + 4, 6], '小院两边有带顶的走廊，叫游廊，下雨天走在里面也淋不到雨。');
addLabel('湖心岛', [-50, GROUND + 3, 40], '这座小岛是明朝时用疏浚河道挖出来的泥堆成的，四周种满了垂柳。', true);
addLabel('南湖', [-150, WATER_Y + 3, 220], '这就是南湖，湖上漂着一片片菱叶。', true);
addLabel('红船', [RB.x, 6, RB.z], '岛边停着的红色游船，是照 1921 年中共一大用过的游船仿制的纪念船。', true);

TR.run({ start: { pos: V3(-30, 10, 110), target: V3(0, TY + 7, -6) }, VIEWS, STOPS, FLOOR_STOP, PANELS, POEM_PANELS, labelFar: 160, maxDist: 1600, arcMax: 40,
  outText: k => k === 2 ? '走出清晖堂看看' : k === 1 ? '走到外面回廊看风景' : '走到楼外看看', outView: k => k === 2 ? VIEWS.boat : k === 0 ? VIEWS.court : lookout(1) });
})();
