/* 蓬莱阁 · 讲解内容：视角、12 站讲解词、沿途面板、构件标注（界面逻辑在 tour.js） */
(function () {
'use strict';
const H = window.HHL, TR = H.tour, V3 = H.V3;
const { AX, AZ, Y, TY, ROOF, PLAQUE, colTopY, TH, GROUND } = H.tower;
const { WATER_Y, SC } = H.world;
const addLabel = TR.addLabel, sayBtn = TR.sayBtn, lookout = TR.lookout, poem = TR.poem, towerIcon = TR.towerIcon;

const VIEWS = {
  overview: { pos: V3(50, GROUND + 22, 64), target: V3(0, TY + 4, -6) },
  front: { pos: V3(10, GROUND + 6, 34), target: V3(0, TY + 6, 0) },
  lookup: { pos: V3(6, TY + 1.7, 13), target: V3(0, TY + 12, 0) },
  bird: { pos: V3(140, 160, 240), target: V3(40, 10, 0) },
  sea: { pos: V3(-80, WATER_Y + 6, 300), target: V3(0, GROUND, 0) },
  shuicheng: { pos: V3(SC.x - 40, 40, SC.z + 150), target: V3(SC.x, 2, SC.z + 30) },
  roof: { pos: V3(18, TY + 17, 22), target: V3(0, TY + 11, 0) },
  map: { pos: V3(-700, 1600, -900), target: V3(0, 0, 700) },
  cliff: { pos: V3(-90, WATER_Y + 8, 120), target: V3(0, GROUND - 10, 20) },
  mirage: { pos: V3(0, TY + 9, 12), target: V3(300, 130, 2400) },
  th: { pos: V3(TH.x + 14, TH.y + 6, TH.z + 26), target: V3(TH.x, TH.y + 3, TH.z) },
  night: { pos: V3(54, GROUND + 18, 76), target: V3(0, TY + 4, 0) }
};

const STOPS = [
  { t: '远远望见蓬莱阁', v: VIEWS.sea, e: 'day', s: '你好，我是小青！看，大海边那座红色悬崖上的楼阁，就是蓬莱阁。它在山东蓬莱，古人相信海上有一座仙山叫蓬莱，神仙就住在那里。跟我飞过去吧！' },
  { t: '它在哪儿？', v: VIEWS.map, e: 'day', p: 'map', s: '从天上往下看，蓬莱在山东半岛的最北边。往北是大海，渤海和黄海就在这里分界。海上一串小岛，叫长山列岛，一直排到辽东半岛那边。' },
  { t: '红色的丹崖山', v: VIEWS.cliff, e: 'day', p: 'danya', s: '蓬莱阁建在丹崖山上。丹，就是红色。看，这座山伸进海里，临海的一面是陡峭的红色悬崖，海浪一直拍打着崖脚。' },
  { t: '楼的一生', v: VIEWS.front, e: 'day', p: 'life', s: '蓬莱阁建于九百多年前的北宋，那时登州的知州在丹崖山上建了这座阁。后来又陆续修了天后宫、龙王宫这些建筑，成了一大片古建筑群。' },
  { t: '重檐歇山顶', v: VIEWS.roof, e: 'day', p: 'facts', s: '蓬莱阁有两层，二层外面一圈回廊，站在上面四面都能看海。屋顶是两重屋檐的歇山顶，屋脊两头立着正吻。' },
  { t: '一层 · 八仙过海', k: 0, e: 'day', p: 'baxian', s: '进阁啦！一层挂着八仙过海图。传说八位神仙在蓬莱阁喝醉了酒，要到海上去玩，他们不坐船，各自把宝贝扔进海里，踩着宝贝渡过大海。' },
  { t: '二层 · 苏轼看海市', k: 1, e: 'day', p: 'haishi', s: '二层讲的是苏轼。他到登州当知州，才五天就被调走了。他一直想看海市蜃楼，临走前去海神庙祈祷，没想到真的看到了，高兴地写下了《海市》诗。' },
  { t: '海市蜃楼', v: VIEWS.mirage, e: 'day', p: 'mirage', s: '到外面的回廊来，看远处的海面！有时候，海上会出现城墙、楼台的影子，过一会儿又慢慢消失了，这就是海市蜃楼。古人以为是神仙住的地方。' },
  { t: '蓬莱水城', v: VIEWS.shuicheng, e: 'day', p: 'shuicheng', s: '丹崖山东边，城墙围着一个小海湾，这是明朝的海军港口，叫蓬莱水城。明朝的抗倭英雄戚继光，就是在蓬莱长大的。' },
  { t: '天后宫 · 但愿海波平', k: 2, e: 'dusk', p: 'qi', s: '阁后的天后宫，供奉保佑渔民出海平安的妈祖。墙上挂着戚继光年轻时写的诗：封侯非我意，但愿海波平。当大官不是我的心愿，我只希望海上太平。' },
  { t: '青鸟殷勤为探看', v: lookout(1, 0, -0.05, 1), e: 'dusk', p: 'qingniao', s: '太阳落进海里了。唐朝诗人李商隐写：蓬山此去无多路，青鸟殷勤为探看。传说青鸟是给神仙送信的鸟，我的名字小青，就是从这里来的。' },
  { t: '再见，蓬莱阁', v: VIEWS.night, e: 'night', p: 'bye', s: '夜里，蓬莱阁的灯亮了，海浪轻轻拍着悬崖。八仙过海，各显神通。每个人都有自己的本领。再见啦，下次来蓬莱，说不定能看到海市蜃楼！' }
];
const FLOOR_STOP = [5, 6, 9];

const PANELS = {
  map: function () {
    return '<h2>蓬莱阁在哪儿？</h2>' +
      '<svg viewBox="0 0 400 290"><rect width="400" height="290" fill="#7fb4d2"/>' +
      '<path d="M0 290L0 200C60 190 120 170 180 168S300 180 340 200 400 220 400 230L400 290Z" fill="#dfe8c8"/>' +
      '<path d="M0 0L0 60C40 70 90 50 130 40 160 30 170 0 170 0Z" fill="#dfe8c8"/>' +
      '<circle cx="170" cy="120" r="5" fill="#6f8a5a"/><circle cx="160" cy="100" r="4" fill="#6f8a5a"/><circle cx="150" cy="80" r="5" fill="#6f8a5a"/><circle cx="145" cy="60" r="4" fill="#6f8a5a"/>' +
      '<path d="M180 152l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z" fill="#d22a1a" stroke="#fff" stroke-width="1.5"/>' +
      '<g font-family="Microsoft YaHei,sans-serif" font-weight="700" text-anchor="middle">' +
      '<text x="80" y="130" font-size="22" fill="#fff">渤 海</text><text x="320" y="120" font-size="22" fill="#fff">黄 海</text><text x="200" y="240" font-size="20" fill="#7a3a12">山东半岛</text>' +
      '<text x="70" y="30" font-size="15" fill="#7a3a12">辽东半岛</text><text x="220" y="90" font-size="13" fill="#2f4f24">长山列岛</text><text x="230" y="170" font-size="14" fill="#b3261a">蓬莱阁</text></g></svg>' +
      '<p>蓬莱阁在<b>山东省烟台市蓬莱区</b>，山东半岛的最北边，面对大海。</p><p>渤海和黄海就在这附近分界，海上那一串小岛叫<b>长山列岛</b>，像一条锁链连向辽东半岛。</p>';
  },
  danya: TR.facts.bind(null, '丹崖山', [
    ['名字', '“丹”是红色。山临海的一面是红褐色的岩石，所以叫丹崖山。'],
    ['悬崖', '山伸进海里，北面是陡峭的悬崖，海浪常年拍打着崖脚。'],
    ['仙境', '古人说海上有蓬莱、方丈、瀛洲三座仙山，这里就被看作人间的“蓬莱仙境”。']]),
  life: function () {
    return TR.life([
      [towerIcon(2, { roof: '#6a6e74' }), '北宋 · 1061 年', '登州知州朱处约在丹崖山上建起蓬莱阁。'],
      [towerIcon(2, { roof: '#6a6e74' }), '北宋 · 1085 年', '苏轼到登州任知州，五天后被调走，临走前看到了海市，写下《海市》诗。'],
      [towerIcon(2, { roof: '#6a6e74' }), '明朝', '修建蓬莱水城，戚继光在这一带抗击倭寇。'],
      [towerIcon(2, { roof: '#6a6e74' }), '今天', '蓬莱阁和天后宫、龙王宫、吕祖殿等组成古建筑群，人称“人间仙境”。']
    ]);
  },
  facts: TR.facts.bind(null, '蓬莱阁小知识', [
    ['它有几层？', '两层，二层外面有一圈回廊，叫平坐。'],
    ['屋顶什么样？', '重檐歇山顶，屋脊两头立着正吻。'],
    ['和谁齐名？', '人们常把它和黄鹤楼、岳阳楼、滕王阁一起，称为“中国四大名楼”。'],
    ['有什么别名？', '“人间仙境”。']]),
  baxian: function () {
    return '<h2>八仙过海</h2><div class="three"><div>铁拐李<br>葫芦</div><div>何仙姑<br>荷花</div><div>韩湘子<br>笛子</div><div>汉钟离<br>扇子</div></div><div class="three"><div>张果老<br>纸驴</div><div>吕洞宾<br>宝剑</div><div>曹国舅<br>玉板</div><div>蓝采和<br>花篮</div></div>' +
      '<p>传说八位神仙在蓬莱阁上喝醉了酒，要到海上游玩。他们不坐船，各自拿出随身的宝贝扔进海里，踩着宝贝渡海。</p><p class="tip">后来人们用“<b>八仙过海，各显神通</b>”比喻每个人都拿出自己的本领。</p>';
  },
  haishi: function () {
    return '<h2>二层：苏轼的《海市》</h2>' + poem('《海市》　宋 · 苏轼（节选）', ['东方云海空复空，', '群仙出没空明中。', '荡摇浮世生万象，', '岂有贝阙藏珠宫？']) +
      sayBtn('东方云海空复空，群仙出没空明中。荡摇浮世生万象，岂有贝阙藏珠宫？') +
      '<p>苏轼在登州只当了五天知州。他听说这里能看到海市，可那时是冬天，很难看到。临走前他去海神庙祈祷，第二天竟然真的看到了。</p>' +
      '<p class="tip">他在诗里说：海上那些宫殿楼台，难道真的是神仙住的贝阙珠宫吗？他已经怀疑那不是真的了。</p>';
  },
  mirage: function () {
    return '<h2>海市蜃楼是怎么回事？</h2><p>海面上的空气，下面冷、上面热，冷热空气的密度不一样。远处的光线穿过它们时会<b>拐弯</b>，就把远处的岛屿、城市“搬”到了海面上空，让人看到一座悬在海上的城。</p>' +
      '<p>古人不明白这个道理，以为是一种叫“蜃”的大蛤蜊吐气变出来的楼台，所以叫“<b>海市蜃楼</b>”。</p><p class="tip">远处海面上那片淡淡的城影，就是我们模拟的海市蜃楼。</p>';
  },
  shuicheng: TR.facts.bind(null, '蓬莱水城', [
    ['是什么？', '明朝修建的海军港口，城墙把一个小海湾围起来，战船可以停在里面。'],
    ['戚继光', '明朝抗倭名将，在蓬莱长大，后来带领“戚家军”打败了来海上抢掠的倭寇。'],
    ['今天', '水城还保留着城墙、水门和炮台，是中国现存最完整的古代海军基地之一。']]),
  qi: function () {
    return '<h2>但愿海波平</h2>' + poem('《韬钤深处》　明 · 戚继光（节选）', ['封侯非我意，', '但愿海波平。']) + sayBtn('封侯非我意，但愿海波平。') +
      '<p>戚继光年轻时就写下了这两句诗：当大官、封侯爵不是我的心愿，我只希望大海上风平浪静，百姓平平安安。</p>' +
      '<p class="tip">天后宫里供奉的妈祖，是沿海渔民心中保佑出海平安的女神。</p>';
  },
  qingniao: function () {
    return '<h2>青鸟殷勤为探看</h2>' + poem('《无题》　唐 · 李商隐（节选）', ['蓬山此去无多路，', '青鸟殷勤为探看。']) + sayBtn('蓬山此去无多路，青鸟殷勤为探看。') +
      '<p>“蓬山”就是传说中的蓬莱仙山。“青鸟”是神话里给西王母送信的神鸟。诗人说：去蓬莱仙山的路不远了，请青鸟替我殷勤地去看一看吧。</p>';
  },
  bye: function () {
    return '<h2>人间仙境</h2><div class="three"><div class="me"><b>蓬莱阁</b>山东 · 蓬莱<br>海边</div><div><b>黄鹤楼</b>湖北 · 武汉</div><div><b>岳阳楼</b>湖南 · 岳阳</div><div><b>滕王阁</b>江西 · 南昌</div></div>' +
      '<p>蓬莱阁是名楼里唯一面对大海的一座。其他的楼看江、看湖，它看的是海和传说中的仙山。</p>';
  }
};
const POEM_PANELS = ['haishi', 'qi', 'qingniao'];

addLabel('重檐歇山顶', [0, TY + ROOF.yt - 1.0, 2.4], '蓬莱阁有两重屋檐，最上面是歇山顶，屋脊两头立着正吻。');
addLabel('匾额', [2, TY + PLAQUE.y + 0.4, PLAQUE.z + 0.3], '二层屋檐下的匾上写着蓬莱阁三个字。');
addLabel('回廊', [AX[1] + 0.6, TY + Y[1] + 1.3, AZ[1] + 1.0], '二层外面一圈回廊，站在上面四面都能看到大海。');
addLabel('斗拱', [-AX[0] + 1.4, TY + colTopY[0] + 0.5, AZ[0] + 0.4], '屋檐下一层叠一层的木构件叫斗拱，把屋檐托起来。', false, '斗拱读作 dǒu gǒng');
addLabel('天后宫', [TH.x, TH.top + 0.6, TH.z], '阁后的殿宇叫天后宫，供奉保佑渔民出海平安的妈祖。');
addLabel('丹崖山', [-60, GROUND - 14, 38], '蓬莱阁脚下这座伸进海里的山叫丹崖山，临海一面是红色的悬崖。', true);
addLabel('蓬莱水城', [SC.x, 14, SC.z + 30], '城墙围着的小海湾叫蓬莱水城，是明朝的海军港口。', true);
addLabel('大海', [-200, WATER_Y + 4, 500], '蓬莱阁北边就是大海，渤海和黄海在这附近分界。', true);
addLabel('长山列岛', [-200, 60, 3000], '远处海上的一串小岛叫长山列岛。', true);

TR.run({ VIEWS, STOPS, FLOOR_STOP, PANELS, POEM_PANELS, labelFar: 160, maxDist: 2200, arcMax: 50,
  outText: k => k === 2 ? '走出天后宫看看' : k === 1 ? '走到外面回廊看海' : '走到阁外看看', outView: k => k === 2 ? VIEWS.th : k === 0 ? VIEWS.front : lookout(1) });
/* 海市蜃楼：只在第 8 站出现 */
setInterval(() => { const t = document.getElementById('stopTitle').textContent; H.mirage(t === '海市蜃楼'); }, 400);
})();
