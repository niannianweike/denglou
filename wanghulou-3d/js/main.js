/* 望湖楼 · 讲解内容：视角、12 站讲解词、沿途面板、构件标注（界面逻辑在 tour.js） */
(function () {
'use strict';
const H = window.HHL, TR = H.tour, V3 = H.V3;
const { AX, AZ, Y, TY, ROOF, PLAQUE, colTopY, PH2, GROUND } = H.tower;
const { WATER_Y, DQ, GS, BS, LF, SHORE } = H.world;
const addLabel = TR.addLabel, sayBtn = TR.sayBtn, lookout = TR.lookout, poem = TR.poem, towerIcon = TR.towerIcon;

const VIEWS = {
  overview: { pos: V3(40, 24, 54), target: V3(0, TY + 5, 0) },
  front: { pos: V3(0, TY + 4, 40), target: V3(0, TY + 6, 0) },
  lookup: { pos: V3(6, TY + 1.7, 13), target: V3(0, TY + 12, 0) },
  bird: { pos: V3(120, 140, 260), target: V3(-60, 0, 60) },
  lake: { pos: V3(-60, WATER_Y + 4, 260), target: V3(0, TY + 6, 0) },
  duanqiao: { pos: V3(DQ.x + 30, 8, DQ.z + 40), target: V3(DQ.x, 2, DQ.z) },
  roof: { pos: V3(18, TY + 16, 22), target: V3(0, TY + 11, 0) },
  map: { pos: V3(-600, 1300, -500), target: V3(0, 0, 700) },
  rain: { pos: V3(-10, TY + 8, 18), target: V3(-30, 4, 220) },
  baidi: { pos: V3(-120, 6, 160), target: V3(-200, 3, 128) },
  ph: { pos: V3(PH2.x + 14, PH2.y + 4, PH2.z + 36), target: V3(PH2.x, PH2.y + 3, PH2.z) },
  leifeng: { pos: V3(-20, TY + 18, 40), target: V3(LF.x, LF.top - 20, LF.z) },
  night: { pos: V3(44, 18, 70), target: V3(0, TY + 5, 0) }
};

const STOPS = [
  { t: '远远望见望湖楼', v: VIEWS.lake, e: 'day', s: '你好，我是小燕！看，西湖北岸那座红柱青瓦的两层楼，就是望湖楼。它在浙江杭州，站在楼上，整个西湖都在眼前。跟我飞过去吧！' },
  { t: '它在哪儿？', v: VIEWS.map, e: 'day', p: 'map', s: '从天上往下看，西湖在杭州城的西边，三面是青山，一面是城。望湖楼在西湖北岸，背后是宝石山，东边不远就是断桥。' },
  { t: '吴越王建的楼', v: VIEWS.front, e: 'day', p: 'life', s: '一千多年前的五代，杭州是吴越国的都城。吴越王在湖边建了一座楼，起初叫看经楼，后来因为站在楼上正好望着西湖，改名叫望湖楼。' },
  { t: '两层的小楼', v: VIEWS.roof, e: 'day', p: 'facts', s: '望湖楼不算高，只有两层，屋顶是两重屋檐的歇山顶。它不靠高大出名，而是靠苏轼的一首诗出了名。' },
  { t: '一层 · 白雨跳珠', k: 0, e: 'day', p: 'zuishu', s: '进楼啦！一层挂着苏轼的诗。一个夏天，苏轼在望湖楼上喝酒，忽然乌云翻滚，大雨点噼里啪啦跳进船里，一阵风吹过，雨又停了。' },
  { t: '黑云翻墨', v: VIEWS.rain, e: 'day', mist: true, p: 'rain', s: '看，乌云压过来了，就像打翻了墨汁！雨点又大又急，打在湖面上溅起一颗颗水珠，苏轼说这是白雨跳珠。夏天的西湖，常有这样来得快、去得也快的雷阵雨。' },
  { t: '水如天', v: lookout(1, 0, -0.08, 1), e: 'day', p: 'shuirutian', s: '风来了，雨停了。到外面的回廊来！湖面又平又静，映着蓝天白云，分不清哪是水、哪是天。苏轼说：望湖楼下水如天。' },
  { t: '二层 · 淡妆浓抹', k: 1, e: 'day', p: 'yinhu', s: '二层挂着苏轼的另一首诗。他说西湖晴天波光闪闪，雨天山色朦胧，怎么看都美，就像古代美女西施，淡妆浓妆都好看。从此西湖又叫西子湖。' },
  { t: '断桥', v: VIEWS.duanqiao, e: 'day', p: 'duanqiao', s: '东边这座石拱桥叫断桥。桥不断，为什么叫断桥？冬天下雪后，桥面向阳的一边雪先化了，远看桥像断开了一样，这就是西湖十景里的断桥残雪。' },
  { t: '白沙堤上', v: VIEWS.baidi, e: 'day', p: 'baidi', s: '从断桥往西，是一条长长的白堤，堤上一株杨柳一株桃。白居易在杭州做官时最爱这里：最爱湖东行不足，绿杨阴里白沙堤。我们燕子春天也最爱来，谁家新燕啄春泥，说的就是我们！' },
  { t: '平湖秋月 · 西湖十景', k: 2, e: 'dusk', p: 'shijing', s: '白堤的西头，孤山脚下，有一座临水的厅堂，叫平湖秋月。秋天的夜晚，在这里看湖上的月亮最美。它也是西湖十景之一。' },
  { t: '再见，望湖楼', v: VIEWS.night, e: 'night', p: 'bye', s: '夜里的西湖，南岸的雷峰塔亮起了灯。再见啦！下次来杭州，记得在望湖楼上等一场夏天的雨。' }
];
const FLOOR_STOP = [4, 7, 10];

const PANELS = {
  map: function () {
    return '<h2>望湖楼在哪儿？</h2>' +
      '<svg viewBox="0 0 400 290"><rect width="400" height="290" fill="#dfe8c8"/>' +
      '<path d="M60 80C120 50 260 50 320 90S340 230 260 250 80 240 60 170Z" fill="#8fc6d8"/>' +
      '<path d="M150 60L140 250" stroke="#6a8a4a" stroke-width="6"/><path d="M290 80L200 110" stroke="#6a8a4a" stroke-width="6"/><ellipse cx="190" cy="110" rx="18" ry="11" fill="#6f8a5a"/>' +
      '<path d="M300 48l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z" fill="#d22a1a" stroke="#fff" stroke-width="1.5"/>' +
      '<g font-family="Microsoft YaHei,sans-serif" font-weight="700" text-anchor="middle">' +
      '<text x="200" y="180" font-size="26" fill="#fff">西 湖</text><text x="360" y="150" font-size="20" fill="#7a3a12">杭州城</text><text x="310" y="40" font-size="14" fill="#b3261a">望湖楼</text>' +
      '<text x="120" y="160" font-size="13" fill="#3a5a2a">苏堤</text><text x="240" y="90" font-size="13" fill="#3a5a2a">白堤</text><text x="190" y="135" font-size="12" fill="#3a5a2a">孤山</text><text x="374" y="270" font-size="13" fill="#555">北↑</text></g></svg>' +
      '<p>望湖楼在<b>浙江省杭州市</b>的<b>西湖</b>北岸，背靠宝石山，东边是断桥。</p><p>西湖三面环山，湖里有<b>苏堤、白堤</b>两条长堤，还有一座小岛叫<b>孤山</b>。</p>';
  },
  life: function () {
    return TR.life([
      [towerIcon(1, { roof: '#6a6e74' }), '五代 · 吴越国', '吴越王在西湖边建楼，起初叫“看经楼”，后来改叫望湖楼，又叫先得楼。'],
      [towerIcon(2, { roof: '#6a6e74' }), '宋朝 · 1072 年', '苏轼在杭州做官，在楼上喝酒，写下《六月二十七日望湖楼醉书》，望湖楼从此出名。'],
      [towerIcon(0), '后来', '楼几次毁坏，又几次重建。'],
      [towerIcon(2, { roof: '#6a6e74' }), '今天', '重建后的望湖楼站在北山路边，二层可以凭栏看西湖。']
    ]);
  },
  facts: TR.facts.bind(null, '望湖楼小知识', [
    ['它有几层？', '两层，不算高大，但位置极好，正对着西湖。'],
    ['屋顶什么样？', '重檐歇山顶：两重屋檐，最上面前后两大坡、左右两小坡。'],
    ['别名是什么？', '最早叫看经楼，也叫先得楼。'],
    ['为什么出名？', '因为苏轼在这里写了一首写雨的好诗。']]),
  zuishu: function () {
    return '<h2>一层：望湖楼醉书</h2>' + poem('《六月二十七日望湖楼醉书》　宋 · 苏轼', ['黑云翻墨未遮山，', '白雨跳珠乱入船。', '卷地风来忽吹散，', '望湖楼下水如天。']) +
      sayBtn('六月二十七日望湖楼醉书。宋，苏轼。黑云翻墨未遮山，白雨跳珠乱入船。卷地风来忽吹散，望湖楼下水如天。') +
      '<p>乌云像打翻的墨汁，还没把山遮住；白亮亮的雨点像珍珠一样乱蹦，跳进船里。一阵狂风卷地而来，把雨吹散了；楼下的湖面又平又静，像天空一样。</p>' +
      '<p class="tip">四句诗正好是：雨来、雨大、雨停、雨后。数一数，苏轼用了哪些颜色？</p>';
  },
  rain: function () {
    return '<h2>黑云翻墨，白雨跳珠</h2><p>“<b>翻墨</b>”：乌云又黑又浓，翻滚着涌过来，像打翻了一砚台墨汁。</p><p>“<b>跳珠</b>”：雨点又大又密，打在船上、湖面上，一颗颗跳起来，像白色的珍珠。</p>' +
      '<p class="tip">夏天的雷阵雨就是这样：来得快，下得大，停得也快。（这一站打开了“起雾”，雨停后可以点“起雾”关掉。）</p>';
  },
  shuirutian: function () {
    return '<h2>望湖楼下水如天</h2>' + poem('《六月二十七日望湖楼醉书》（节选）', ['卷地风来忽吹散，', '望湖楼下水如天。']) + sayBtn('卷地风来忽吹散，望湖楼下水如天。') +
      '<p>雨一停，湖面平静得像一面大镜子，蓝天白云都倒映在水里，水和天连成了一片。</p><p class="tip">往下看，能在湖里找到天上的云吗？</p>';
  },
  yinhu: function () {
    return '<h2>二层：饮湖上初晴后雨</h2>' + poem('《饮湖上初晴后雨》　宋 · 苏轼', ['水光潋滟晴方好，', '山色空蒙雨亦奇。', '欲把西湖比西子，', '淡妆浓抹总相宜。']) +
      sayBtn('饮湖上初晴后雨。宋，苏轼。水光潋滟晴方好，山色空蒙雨亦奇。欲把西湖比西子，淡妆浓抹总相宜。') +
      '<p>晴天，湖面波光闪闪；下雨，山色朦朦胧胧，也很奇妙。西湖就像美女西施，不管淡妆还是浓妆，都那么好看。</p><p class="tip">“潋滟”读 liàn yàn，是水波闪动的样子。</p>';
  },
  duanqiao: function () {
    return '<h2>断桥残雪</h2><p>断桥在白堤的东头。冬天大雪过后，桥面向着太阳的一侧雪先化了，背阴的一侧还留着雪，远远看去，桥好像从中间<b>断开</b>了。</p>' +
      '<p>民间故事《白蛇传》里，白娘子和许仙就是在断桥边相遇的。</p><p class="tip">“断桥残雪”是西湖十景之一。</p>';
  },
  baidi: function () {
    return '<h2>白沙堤</h2>' + poem('《钱塘湖春行》　唐 · 白居易（节选）', ['几处早莺争暖树，', '谁家新燕啄春泥。', '最爱湖东行不足，', '绿杨阴里白沙堤。']) +
      sayBtn('几处早莺争暖树，谁家新燕啄春泥。最爱湖东行不足，绿杨阴里白沙堤。') +
      '<p>早春，黄莺抢着飞上向阳的树，燕子衔着春泥筑巢。白居易最爱在湖东边走，怎么也走不够。</p>' +
      '<p class="tip">白堤上种着“一株杨柳一株桃”，春天桃红柳绿。白居易和苏轼都在杭州做过官，也都在西湖修过堤，所以有白堤和苏堤。</p>';
  },
  shijing: function () {
    return '<h2>西湖十景</h2><div class="three"><div>苏堤春晓</div><div>曲院风荷</div><div class="me">平湖秋月</div><div>断桥残雪</div><div>柳浪闻莺</div></div><div class="three"><div>花港观鱼</div><div>雷峰夕照</div><div>双峰插云</div><div>南屏晚钟</div><div>三潭印月</div></div>' +
      '<p>南宋时，画家们画西湖，挑出了十处最美的风景，叫“西湖十景”。每一处都是四个字，有春夏秋冬，有早晨傍晚。</p>' +
      poem('《钱塘湖春行》　唐 · 白居易（开头）', ['孤山寺北贾亭西，', '水面初平云脚低。']) + sayBtn('孤山寺北贾亭西，水面初平云脚低。');
  },
  bye: function () {
    return '<h2>再见，西子湖</h2><p>西湖南岸那座塔是<b>雷峰塔</b>，北边宝石山上瘦瘦高高的是<b>保俶塔</b>。人们说：雷峰如老衲，保俶如美人。</p>' +
      '<p class="tip">“老衲”是老和尚。雷峰塔胖胖的，像个老和尚；保俶塔细细高高，像个美人。你觉得像吗？</p>';
  }
};
const POEM_PANELS = ['zuishu', 'shuirutian', 'yinhu', 'baidi', 'shijing'];

addLabel('重檐歇山顶', [0, TY + ROOF.yt - 1.0, 2.6], '望湖楼有两重屋檐，最上面是歇山顶，铺着青灰色的瓦。');
addLabel('匾额', [2, TY + PLAQUE.y + 0.4, PLAQUE.z + 0.3], '二层屋檐下的匾上写着望湖楼三个字。');
addLabel('回廊栏杆', [AX[1] + 0.5, TY + Y[1] + 1.3, AZ[1] + 0.6], '二层外面有一圈回廊，扶着栏杆，整个西湖都在眼前。');
addLabel('斗拱', [-AX[0] + 1.2, TY + colTopY[0] + 0.5, AZ[0] + 0.4], '屋檐下一层叠一层的木构件叫斗拱，把屋檐托起来。', false, '斗拱读作 dǒu gǒng');
addLabel('西湖', [-60, WATER_Y + 3, 400], '这就是西湖，三面环山，一面是城。湖水不深，只有两三米。', true);
addLabel('断桥', [DQ.x, 7, DQ.z], '白堤东头的石拱桥叫断桥，“断桥残雪”是西湖十景之一。', true);
addLabel('白堤', [-150, 4, 115], '从断桥通到孤山的长堤叫白堤，堤上一株杨柳一株桃。', true);
addLabel('孤山', [GS.x, 44, GS.z], '湖中的这座小山叫孤山，山上梅花很多。', true);
addLabel('平湖秋月', [PH2.x, PH2.top + 0.6, PH2.z], '孤山脚下临水的厅堂叫平湖秋月，秋夜赏月最好。', true);
addLabel('保俶塔', [BS.tx, BS.top + 2, BS.tz], '宝石山上瘦高的塔叫保俶塔，人们说它“如美人”。', true, '俶读作 chù');
addLabel('雷峰塔', [LF.x, LF.top + 6, LF.z], '南岸夕照山上的塔叫雷峰塔，《白蛇传》里白娘子就被压在塔下。', true);

TR.run({ VIEWS, STOPS, FLOOR_STOP, PANELS, POEM_PANELS, labelFar: 160, maxDist: 2200, arcMax: 40,
  outText: k => k === 2 ? '走到湖边平台' : k === 1 ? '走到外面回廊看风景' : '走到楼外看看', outView: k => k === 2 ? VIEWS.ph : k === 0 ? VIEWS.front : lookout(1) });
})();
