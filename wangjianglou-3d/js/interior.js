/* 望江楼 · 室内：崇丽阁一层薛涛像与《送友人》；三层薛涛笺与咏竹诗；吟诗楼里杜甫在成都写的诗
 * 字画都是用代码画出来的示意，不是实物照片 */
(function () {
'use strict';
const H = window.HHL, IC = H.ic, P = IC.paint;
const { offsetPoly, canvasTex } = H;
const { PL, Y, TY, YS, rect } = H.tower;
IC.init({ ceil: 'ming' });
const PIC = {};

PIC.xuetao = IC.poetScroll('洪度', ['#c87a8a', '#8a4a5a'], '水国蒹葭夜有霜', '月寒山色共苍苍', 31, { woman: true });
PIC.songyou = IC.poemSheet('送友人', '唐 薛涛', ['水国蒹葭夜有霜', '月寒山色共苍苍', '谁言千里自今夕', '离梦杳如关塞长'], { seal: '薛涛', seed: 41 });
PIC.bamboo = IC.picScroll(function (g, w, h) {                     // 墨竹
  g.lineCap = 'round';
  for (const [x, s] of [[170, 1], [300, 0.8], [380, 0.6]]) { g.strokeStyle = 'rgba(40,52,40,.85)'; g.lineWidth = 16 * s; g.beginPath(); g.moveTo(x, 1000); g.lineTo(x + 10, 80); g.stroke(); g.strokeStyle = 'rgba(240,236,220,.9)'; g.lineWidth = 3; for (let y = 160; y < 1000; y += 120 * s) { g.beginPath(); g.moveTo(x - 8 * s, y); g.lineTo(x + 8 * s, y); g.stroke(); } }
  const r = H.rng(3); g.fillStyle = 'rgba(30,44,32,.85)';
  for (let i = 0; i < 70; i++) { const x = 120 + r() * 300, y = 80 + r() * 600, a = (r() - 0.5) * 1.6 + 0.3; g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(30, -8, 70, 0); g.quadraticCurveTo(30, 8, 0, 0); g.fill(); g.restore(); }
  P.vtext(g, '虚心宁自持', 470, 640, 48, '#221e1a', 1.12); P.seal(g, 50, 70, 40, '竹');
}, 51);

PIC.jian = canvasTex(1536, 900, function (g, w, h) {              // 薛涛笺：一张张桃红色的小信笺
  P.paper(g, w, h, '#efe5c8', '#ddca9e', 21);
  const r = H.rng(7);
  for (let i = 0; i < 6; i++) {
    const x = 180 + i * 200, y = 200 + (i % 2) * 90, a = (r() - 0.5) * 0.2;
    g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = ['#e8a0a8', '#f0b8b0', '#dc8c98', '#f2c4b8', '#e6a4a0', '#ecb0b4'][i]; g.fillRect(0, 0, 150, 420);
    g.strokeStyle = 'rgba(160,60,70,.6)'; g.lineWidth = 2; for (let k = 1; k < 5; k++) { g.beginPath(); g.moveTo(k * 30, 20); g.lineTo(k * 30, 400); g.stroke(); }
    if (i === 2) P.vtext(g, '月寒山色', 105, 70, 34, '#3a1a1a', 1.1); g.restore();
  }
  P.vtext(g, '薛涛笺', w - 80, 120, 64, '#2a2420', 1.2); P.seal(g, w - 104, 360, 44, '浣花'); P.frame(g, w, h);
});
PIC.chou = IC.poemSheet('酬人雨后玩竹', '唐 薛涛', ['南天春雨时', '那鉴雪霜姿', '众类亦云茂', '虚心宁自持'], { seal: '薛涛', seed: 43 });

PIC.denglou = IC.poemSheet('登楼', '唐 杜甫', ['花近高楼伤客心', '万方多难此登临', '锦江春色来天地', '玉垒浮云变古今'], { seal: '子美', seed: 53 });
PIC.jueju = IC.landscapeTex({ title: '绝句', seal: '草堂', seed: 29, hy: 360, boats: [[980, 620, 1.4]],
  extra: function (g, w, h) {
    g.strokeStyle = 'rgba(70,90,50,.85)'; g.lineWidth = 6; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(200 + i * 18, 120); g.quadraticCurveTo(220 + i * 18, 300, 200 + i * 25, 500); g.stroke(); }
    for (const [x, y] of [[260, 260], [330, 300]]) { g.fillStyle = '#e6b82e'; g.beginPath(); g.ellipse(x, y, 22, 14, 0.2, 0, 7); g.fill(); g.fillStyle = '#222'; g.beginPath(); g.moveTo(x + 18, y - 4); g.lineTo(x + 32, y - 6); g.lineTo(x + 18, y); g.fill(); }
    P.birdsV(g, [[600, 170], [640, 150], [680, 135], [720, 122], [760, 112], [800, 104]], 1.1);
    g.fillStyle = 'rgba(250,250,250,.95)'; g.beginPath(); g.moveTo(1040, 330); g.lineTo(1120, 240); g.lineTo(1200, 330); g.fill();
    ['两个黄鹂鸣翠柳', '一行白鹭上青天', '窗含西岭千秋雪', '门泊东吴万里船'].forEach((s, i) => P.vtext(g, s, 1360 - i * 60, 420, 40, '#221e1a', 1.08));
  } });
PIC.dufu = IC.poetScroll('子美', ['#6e6a58', '#4a463a'], '晓看红湿处', '花重锦官城', 61, { beard: true });

/* ============================== 搭三处：崇丽阁一层、三层，吟诗楼 ============================== */
(function () {
  const Pw = offsetPoly(PL[0], -1.17), f = IC.floor({ P: Pw, y0: 0, H: 4.4, cols: [[-2.6, -2.6], [2.6, -2.6], [-2.6, 2.6], [2.6, 2.6]], colR: 0.32, lanterns: [[-2, 2], [2, 2], [-2, -2], [2, -2]], drop: 0.7, ty: 2.5 });
  IC.hangScroll(f.grp, PIC.xuetao, 1.15, 2.3, 0, 2.5, f.zb, 0);
  IC.framed(f.grp, PIC.songyou, 3.4, 2.02, f.x0 + 0.25, 2.4, 0, Math.PI / 2, { glow: 0.55 });
  IC.hangScroll(f.grp, PIC.bamboo, 0.95, 1.9, f.x1 - 0.25, 2.4, 0, -Math.PI / 2);
  IC.couplets(f.grp, '古井冷斜阳', '问几树枇杷', 3.0, -2.6, 2.6, 2.3, 2.6 + 0.42);
  IC.table(f.grp, 2.4, 0.9, 0, 0, f.zb + 1.3);
})();
(function () {
  const y0 = Y[2], Pw = offsetPoly(PL[2], -1.17), f = IC.floor({ P: Pw, y0, H: 4.0, cols: [[-2.0, -2.0], [2.0, -2.0], [-2.0, 2.0], [2.0, 2.0]], colR: 0.28, lanterns: [[-1.6, 1.6], [1.6, 1.6]], drop: 0.6, ty: 2.3 });
  IC.framed(f.grp, PIC.jian, 3.6, 2.11, 0, y0 + 2.2, f.zb + 0.3, 0, { glow: 0.55 });
  IC.framed(f.grp, PIC.chou, 2.6, 1.55, f.x0 + 0.6, y0 + 2.1, 0, Math.PI / 2, { glow: 0.55 });
  IC.table(f.grp, 2.0, 0.8, 0, y0, f.zb + 1.6);
})();
(function () {
  const ox = YS.x, oz = YS.z, y0 = YS.y - TY, Pw = offsetPoly(rect(YS.ax, YS.az), -0.87).map(p => [p[0] + ox, p[1] + oz]), az = YS.az - 0.8, ax = YS.ax - 0.8;
  const f = IC.floor({ P: Pw, y0, H: 3.4, cols: [], lanterns: [[ox - 2, oz], [ox + 2, oz]], drop: 0.5, lanternS: 0.8, eye: { pos: [ox, y0 + 1.6, oz + az * 0.7], target: [ox, y0 + 2.0, oz - az] } });
  IC.framed(f.grp, PIC.jueju, 3.6, 2.11, ox, y0 + 1.95, f.zb, 0, { glow: 0.55 });
  IC.framed(f.grp, PIC.denglou, 2.6, 1.55, ox - ax + 0.25, y0 + 1.9, oz, Math.PI / 2, { glow: 0.55 });
  IC.hangScroll(f.grp, PIC.dufu, 0.8, 1.6, ox + ax - 0.25, y0 + 1.9, oz, -Math.PI / 2);
})();
IC.finish(PIC);
})();
