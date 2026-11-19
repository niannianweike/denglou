/* 烟雨楼 · 室内：一层杜牧《江南春》与“南湖烟雨图”；二层乾隆与承德烟雨楼、志南咏雨；清晖堂里的红船故事
 * 字画都是用代码画出来的示意，不是实物照片 */
(function () {
'use strict';
const H = window.HHL, IC = H.ic, P = IC.paint;
const { offsetPoly } = H;
const { AX, AZ, Y, VW, MZ, TY, QH, rect } = H.tower;
IC.init({ ceil: 'ming' });
const PIC = {};

PIC.jiangnan = IC.poemSheet('江南春', '唐 杜牧', ['千里莺啼绿映红', '水村山郭酒旗风', '南朝四百八十寺', '多少楼台烟雨中'], { seal: '牧之', seed: 41 });
PIC.yanyu = IC.landscapeTex({ title: '南湖烟雨图', seal: '烟雨', seed: 15, hy: 440, c1: '#dcdad0', c2: '#c4c0b2', boats: [[460, 700, 1.2], [1040, 740, 1]],
  extra: function (g, w, h) {
    g.fillStyle = 'rgba(80,110,70,.7)'; g.beginPath(); g.ellipse(760, 600, 300, 60, 0, 0, 7); g.fill();
    P.drawTower(g, 760, 580, 80, 2, '#6a6e74');
    for (let i = 0; i < 12; i++) { const x = 480 + i * 50; g.strokeStyle = 'rgba(80,110,60,.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, 470); g.quadraticCurveTo(x + 8, 520, x + 2, 580); g.stroke(); }
    P.mist(g, 760, 520, 600, 90, 0.75, 24); P.mist(g, 400, 640, 400, 40, 0.6, 20);
    const r = H.rng(2); g.strokeStyle = 'rgba(250,250,245,.4)'; g.lineWidth = 1.2; for (let i = 0; i < 400; i++) { const x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 5, y + 24); g.stroke(); }
  } });
PIC.dumu = IC.poetScroll('牧之', ['#5a6a7a', '#3a4654'], '千里莺啼绿映红', '多少楼台烟雨中', 31, { beard: true });

PIC.zhinan = IC.poemSheet('绝句', '宋 志南', ['古木阴中系短篷', '杖藜扶我过桥东', '沾衣欲湿杏花雨', '吹面不寒杨柳风'], { seal: '志南', seed: 43 });
PIC.qianlong = IC.landscapeTex({ title: '避暑山庄烟雨楼', seal: '承德', seed: 19, hy: 400, extra: function (g, w, h) { P.ridge(g, w, { y: 520, amp: 260, freq: 0.004, seed: 9, col: P.LV, a: 0.5, fade: 40, blur: 2, rough: 140, trees: 30 }); g.fillStyle = 'rgba(80,110,70,.7)'; g.beginPath(); g.ellipse(700, 640, 220, 40, 0, 0, 7); g.fill(); P.drawTower(g, 700, 625, 70, 2, '#6a6e74'); } });
PIC.qlScroll = IC.picScroll(function (g, w, h) { P.vtext(g, '烟雨楼', w / 2 + 40, 160, 120, '#1e1a16', 1.12); P.vtext(g, '乾隆御笔', 90, 700, 36, '#8a1c12', 1.2); P.seal(g, 60, 880, 44, '乾隆'); }, 51);

PIC.hongchuan = IC.landscapeTex({ title: '南湖红船', seal: '一九二一', seed: 23, hy: 420, c1: '#e8e2d0', c2: '#d4c8aa',
  extra: function (g, w, h) {
    g.fillStyle = 'rgba(40,30,22,.9)'; g.beginPath(); g.moveTo(420, 640); g.quadraticCurveTo(760, 700, 1100, 640); g.lineTo(1080, 610); g.lineTo(440, 610); g.fill();
    g.fillStyle = '#b02a1a'; g.fillRect(520, 520, 460, 92); g.fillStyle = 'rgba(240,226,184,.95)'; for (let i = 0; i < 7; i++) g.fillRect(540 + i * 64, 540, 40, 40);
    g.fillStyle = '#2a2a2c'; g.beginPath(); g.moveTo(500, 520); g.quadraticCurveTo(750, 470, 1000, 520); g.fill();
    P.mist(g, 760, 470, 600, 60, 0.5, 20);
  } });
PIC.hcScreen = IC.textScreen([['南湖红船', '一九二一'], ['一九二一年七月'], ['中共一大在上海召开'], ['会议受到干扰'], ['转移到嘉兴南湖'], ['在一条游船上'], ['完成了最后的议程']]);

const lantern4 = (ax, az) => [[-ax * 0.5, az * 0.35], [ax * 0.5, az * 0.35], [-ax * 0.5, -az * 0.5], [ax * 0.5, -az * 0.5]];
function room(k, H0, cols) {
  const ax = AX[k] - VW[k], az = AZ[k] - VW[k], f = IC.floor({ P: offsetPoly(rect(AX[k], AZ[k]), -VW[k] - 0.07), y0: Y[k], H: H0, cols, colR: 0.3, lanterns: lantern4(ax, az), drop: 0.6, eye: { pos: [0, Y[k] + 1.7, MZ + az * 0.78], target: [0, Y[k] + 2.3, MZ - az + 0.45] } });
  return Object.assign(f, { ax, az });
}
(function () {
  const f = room(0, 4.1, [[-3.4, -1.6], [3.4, -1.6], [-3.4, 1.6], [3.4, 1.6]]);
  IC.framed(f.grp, PIC.jiangnan, 4.6, 2.73, 0, 2.3, f.zb, 0, { glow: 0.55 });
  IC.framed(f.grp, PIC.yanyu, 3.2, 1.88, -f.ax + 0.25, 2.3, 0, Math.PI / 2, { glow: 0.5 });
  IC.hangScroll(f.grp, PIC.dumu, 0.95, 1.9, f.ax - 0.25, 2.3, 0, -Math.PI / 2);
  IC.couplets(f.grp, '千里莺啼绿映红', '多少楼台烟雨中', 3.0, -3.4, 3.4, 2.2, 1.6 + 0.4);
})();
(function () {
  const f = room(1, 3.9, [[-2.8, -1.3], [2.8, -1.3], [-2.8, 1.3], [2.8, 1.3]]), y0 = Y[1];
  IC.framed(f.grp, PIC.qianlong, 4.2, 2.46, 0, y0 + 2.15, f.zb, 0, { glow: 0.55 });
  IC.framed(f.grp, PIC.zhinan, 2.8, 1.65, -f.ax + 0.25, y0 + 2.0, 0, Math.PI / 2, { glow: 0.55 });
  IC.hangScroll(f.grp, PIC.qlScroll, 0.85, 1.7, f.ax - 0.25, y0 + 2.0, 0, -Math.PI / 2);
})();
(function () {
  const ox = QH.x, oz = QH.z - MZ, y0 = QH.y - TY;
  const Pw = offsetPoly(rect(QH.ax, QH.az), -0.97).map(p => [p[0] + ox, p[1] + oz]);
  const ax = QH.ax - 0.9, az = QH.az - 0.9;
  const f = IC.floor({ P: Pw, y0, H: 3.6, cols: [], lanterns: [[ox - 2.5, oz], [ox + 2.5, oz]], drop: 0.5, lanternS: 0.9, eye: { pos: [ox, y0 + 1.7, QH.z + az * 0.7], target: [ox, y0 + 2.0, QH.z - az] } });
  IC.framed(f.grp, PIC.hongchuan, 4.4, 2.58, ox, y0 + 2.0, f.zb, 0, { glow: 0.55 });
  IC.panelScreen(f.grp, PIC.hcScreen, 7, 0.55, 2.0, ox - ax + 0.4, y0 + 1.6, oz, Math.PI / 2);
})();
IC.finish(PIC);
})();
