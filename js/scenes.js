/*! Bone Explorer | Copyright (c) 2026 Nicolas Nowinski | MIT License */
/*
 * Scene drawings. Each scene is built from bone "instances" (a bone id + smooth shapes)
 * plus non-clickable decoration (eye sockets, teeth, cartilage, notes).
 * The same bone can appear in several scenes (e.g. the jaw in front, back and side views).
 */
window.SK = window.SK || {};

(function (SK) {
  'use strict';
  const G = SK.geo;
  const CX = 300;

  /* ---------- scene builder ---------- */
  class Scene {
    constructor(meta) {
      Object.assign(this, meta);
      this.layers = { far: [], mid: [], near: [], top: [] };
    }
    bone(id, parts, opts) {
      opts = opts || {};
      parts = parts.filter(Boolean);
      const layer = opts.layer || 'mid';
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const p of parts) {
        x0 = Math.min(x0, p.bb.x); y0 = Math.min(y0, p.bb.y);
        x1 = Math.max(x1, p.bb.x + p.bb.w); y1 = Math.max(y1, p.bb.y + p.bb.h);
      }
      const m = Math.min(x1 - x0, y1 - y0);
      const sw = Math.max(0.22, Math.min(1.3, m * 0.075));
      const o = parts.map(p => `<path class="o" d="${p.d}" stroke-width="${(sw * 2).toFixed(2)}"/>`).join('');
      const f = parts.map(p => `<path class="f" d="${p.d}"/>`).join('');
      const s = parts.filter(p => p.sheen).map(p => `<path class="s" d="${p.sheen}"/>`).join('');
      const dl = (opts.details || []).map(d => `<path class="dl" d="${d}" stroke-width="${(sw * 0.8).toFixed(2)}"/>`).join('');
      const cls = 'bone' + (layer === 'far' ? ' far' : '') + (opts.deep ? ' deep' : '');
      this.layers[layer].push(`<g class="${cls}" data-bone="${id}">${o}${f}${s}${dl}</g>`);
    }
    /* Non-interactive shape. kind: 'hole' (dark opening), 'cart' (cartilage), 'tooth', 'soft' */
    decor(parts, kind, layer) {
      layer = layer || 'mid';
      if (!Array.isArray(parts)) parts = [parts];
      const sw = kind === 'tooth' ? 0.35 : 0.6;
      let out = '';
      if (kind === 'cart' || kind === 'tooth') {
        out += parts.map(p => `<path class="o" d="${p.d}" stroke-width="${sw * 2}"/>`).join('');
        out += parts.map(p => `<path class="f" d="${p.d}"/>`).join('');
        out += parts.filter(p => p.sheen).map(p => `<path class="s" d="${p.sheen}"/>`).join('');
      } else {
        out += parts.map(p => `<path class="f" d="${p.d}"/>`).join('');
      }
      this.layers[layer].push(`<g class="decor ${kind}">${out}</g>`);
    }
    raw(svg, layer) { this.layers[layer || 'top'].push(svg); }
    render() {
      return ['far', 'mid', 'near', 'top'].map(l => `<g class="layer-${l}">${this.layers[l].join('')}</g>`).join('');
    }
  }

  /* side helpers: s = +1 draws on the viewer's right, -1 on the viewer's left */
  const mapS = (s, cx) => p => [(cx == null ? CX : cx) + s * p[0], p[1]];
  const T = (s, pts, prof, opts) => G.tube(pts.map(mapS(s)), prof, opts);
  const B = (s, pts, opts) => G.blob(pts.map(mapS(s)), opts);
  const E = (s, cx, cy, rx, ry, rot, opts) => G.ell(CX + s * cx, cy, rx, ry, (rot || 0) * s, opts);
  const SYM = (half, opts) => G.blob(G.sym(half, CX), opts);
  const L = (s, pts) => G.openPath(pts.map(mapS(s)));

  /* ---------- vertebra positions ---------- */
  const VY = { c: [], t: [], l: [] };
  for (let i = 1; i <= 7; i++) VY.c[i] = 242 + 12 * (i - 1);
  for (let i = 1; i <= 12; i++) VY.t[i] = 328 + 24 * (i - 1);
  for (let i = 1; i <= 5; i++) VY.l[i] = 620 + 30 * (i - 1);

  function vertBody(hw, hh, yv) {
    return G.blob([[CX - hw, yv - hh], [CX, yv - hh - 0.8], [CX + hw, yv - hh], [CX + hw * 0.9, yv],
      [CX + hw, yv + hh], [CX, yv + hh + 0.8], [CX - hw, yv + hh], [CX - hw * 0.9, yv]], { k: 0.55 });
  }
  const both = fn => [fn(-1), fn(1)];

  /* ---------- ribs ---------- */
  const RIB = {
    2: [84, 42, 394], 3: [98, 52, 420], 4: [108, 60, 448], 5: [115, 66, 476], 6: [119, 72, 506],
    7: [120, 78, 538], 8: [118, 86, 566], 9: [114, 94, 590], 10: [108, 100, 610]
  };
  const CART = { 1: [20, 354], 2: [17, 389], 3: [16, 408], 4: [16, 428], 5: [16, 448], 6: [15, 470], 7: [13, 492] };
  function ribControl(i) {
    if (i === 1) return [[14, 328], [34, 321], [56, 327], [63, 340], [50, 352], [30, 356]];
    if (i === 11) return [[14, 568], [50, 561], [86, 573], [98, 598], [96, 622]];
    if (i === 12) return [[14, 592], [40, 591], [66, 604], [78, 626]];
    const [W, ax, ya] = RIB[i], yv = VY.t[i];
    const apex = [W, yv + 26];
    const mid = [W * 0.55 + ax * 0.45 + 5, apex[1] * 0.35 + ya * 0.65];
    return [[14, yv], [0.5 * W, yv - 8], [0.88 * W, yv + 4], apex, mid, [ax, ya]];
  }
  function ribParts(i, s) {
    const S = G.sample(ribControl(i), 44);
    let apex = 0;
    S.forEach((p, k) => { if (p[0] > S[apex][0]) apex = k; });
    const m = mapS(s);
    const post = S.slice(0, apex + 1).map(m), ant = S.slice(apex).map(m);
    const hw = i === 1 ? 3.6 : 3.1;
    return {
      post: G.tube(post, [[0, hw * 0.95], [1, hw]], { dense: true }),
      ant: ant.length > 2 ? G.tube(ant, [[0, hw], [1, hw * 1.2]], { dense: true }) : null
    };
  }
  function cartilage(sc, s, layer) {
    const pts = {};
    for (let i = 1; i <= 10; i++) {
      const c = ribControl(i), end = c[c.length - 1];
      let tgt;
      if (i <= 7) tgt = CART[i];
      else { const prev = pts[i - 1]; tgt = prev[Math.round(prev.length * 0.42)]; }
      const ctrl = [end, [(end[0] + tgt[0]) / 2 + 2, (end[1] + tgt[1]) / 2 + (i > 2 ? 7 : 2)], tgt];
      const S = G.sample(ctrl, 16);
      pts[i] = S;
      sc.decor(G.tube(S.map(mapS(s)), i === 1 ? 3.4 : 2.7, { dense: true }), 'cart', layer);
    }
  }

  /* ---------- arm, hand, leg, foot (shared by front and back views) ---------- */
  function arm(sc, s, sd, view) {
    // humerus
    sc.bone('humerus-' + sd, [
      E(s, 125, 356, 15.5, 15),
      B(s, [[136, 344], [146, 346], [149, 358], [144, 370], [136, 368]]),
      T(s, [[134, 362], [139, 480], [150, 600]], [[0, 13], [0.07, 10.5], [0.2, 8], [0.6, 7], [0.88, 9], [0.97, 13], [1, 13]]),
      B(s, [[133, 596], [150, 591], [167, 597], [169, 610], [158, 619], [147, 614], [137, 617], [129, 608]])
    ], { details: view === 'front' ? [L(s, [[146, 612], [150, 606], [155, 612]])] : [L(s, [[144, 600], [150, 594], [156, 600]])] });
    // ulna (pinky side) and radius (thumb side)
    sc.bone('ulna-' + sd, [
      T(s, [[143, 603], [146, 700], [149, 849]], [[0, 8.5], [0.07, 6], [0.3, 4.6], [0.9, 3.5], [1, 4.8]]),
      view === 'back' ? E(s, 143, 602, 8, 7) : null
    ], { layer: view === 'front' ? 'far' : 'mid' });
    sc.bone('radius-' + sd, [
      E(s, 160, 623, 6.8, 4.2),
      T(s, [[160, 626], [163, 720], [172, 847]], [[0, 4.4], [0.1, 3.8], [0.3, 4.2], [0.75, 5.6], [0.95, 10], [1, 10.5]])
    ], { layer: view === 'front' ? 'mid' : 'far' });
    hand(sc, s, sd, view);
  }

  function hand(sc, s, sd, view) {
    const HX = 163, HY = 855;
    const hm = p => [CX + s * (HX + p[0]), HY + p[1]];
    const hb = (pts, o) => G.blob(pts.map(hm), o);
    const ht = (pts, prof) => G.tube(pts.map(hm), prof);
    const C = (id, pts, opts) => sc.bone(id + '-' + sd, [hb(pts)], opts);
    C('scaphoid', [[8, 2], [16, 0], [22, 4], [22, 11], [16, 14], [9, 10]]);
    C('lunate', [[-3, 1], [6, 0], [8, 6], [6, 12], [-2, 12], [-4, 6]]);
    C('triquetrum', [[-14, 3], [-5, 2], [-3, 8], [-5, 13], [-12, 12], [-15, 8]]);
    C('trapezium', [[16, 14.5], [24, 13], [28, 20], [25, 27], [18, 27], [15, 21]]);
    C('trapezoid', [[8.5, 14.5], [15, 15], [14.5, 26], [9, 27], [7.5, 21]]);
    C('capitate', [[-2, 13.5], [6, 13.5], [7.5, 20], [6, 29], [-1, 29], [-3, 21]]);
    sc.bone('hamate-' + sd, [hb([[-15, 13.5], [-4, 13.5], [-3.5, 22], [-5, 28], [-13, 27], [-17, 20]])],
      { details: [G.openPath([[-11, 18], [-8, 21], [-10, 24]].map(hm))] });
    if (view === 'front') sc.bone('pisiform-' + sd, [G.ell(...hm([-13, 10]), 3.4, 3.8, 0)], { layer: 'near' });

    const mcProf = [[0, 4], [0.15, 3.1], [0.5, 2.7], [0.88, 3.4], [1, 3.9]];
    sc.bone('mc1-' + sd, [ht([[24, 27], [35, 52]], [[0, 4.2], [0.5, 3], [1, 3.9]])]);
    sc.bone('mc2-' + sd, [ht([[11.5, 29], [14, 75]], mcProf)]);
    sc.bone('mc3-' + sd, [ht([[2, 30], [2, 77]], mcProf)]);
    sc.bone('mc4-' + sd, [ht([[-7.5, 29], [-9, 73]], mcProf)]);
    sc.bone('mc5-' + sd, [ht([[-14.5, 28], [-19, 67]], mcProf)]);

    const pp = [[0, 3.2], [0.5, 2.4], [1, 2.9]], ip = [[0, 2.8], [0.5, 2.1], [1, 2.5]], dp = [[0, 2.5], [0.6, 1.7], [1, 2.2]];
    sc.bone('pp1-' + sd, [ht([[36, 56], [43, 77]], [[0, 3.6], [0.5, 2.7], [1, 3.2]])]);
    sc.bone('dp1-' + sd, [ht([[44, 81], [47, 95]], [[0, 3.1], [0.6, 2.2], [1, 2.7]])]);
    const F = {
      2: [[[14.5, 79], [16.5, 104]], [[16.7, 108], [17.7, 122]], [[17.9, 126], [18.5, 137]]],
      3: [[[2, 81], [2, 108]], [[2, 112], [2, 128]], [[2, 132], [2, 143]]],
      4: [[[-9.2, 77], [-11, 102]], [[-11.2, 106], [-12.2, 120]], [[-12.4, 124], [-13, 134]]],
      5: [[[-19.5, 71], [-23, 91]], [[-23.3, 95], [-25, 106]], [[-25.2, 110], [-26, 119]]]
    };
    for (const f of [2, 3, 4, 5]) {
      const k = f === 5 ? 0.85 : 1;
      const sc2 = pr => pr.map(([t, w]) => [t, w * k]);
      sc.bone('pp' + f + '-' + sd, [ht(F[f][0], sc2(pp))]);
      sc.bone('ip' + f + '-' + sd, [ht(F[f][1], sc2(ip))]);
      sc.bone('dp' + f + '-' + sd, [ht(F[f][2], sc2(dp))]);
    }
  }

  function leg(sc, s, sd, view) {
    // foot first so the shin bones overlap the ankle
    if (view === 'front') footFront(sc, s, sd); else footBack(sc, s, sd);
    sc.bone('femur-' + sd, [
      T(s, [[89, 843], [108, 857]], [[0, 9], [1, 10]]),
      E(s, 87, 841, 14.5, 14),
      B(s, [[103, 838], [113, 836], [120, 848], [119, 868], [109, 874], [102, 860]]),
      B(s, [[92, 878], [99, 872], [103, 886], [95, 890]]),
      T(s, [[110, 858], [100, 960], [84, 1080], [70, 1158]], [[0, 12], [0.1, 10], [0.4, 8.5], [0.8, 10], [0.93, 15], [1, 18]]),
      B(s, [[48, 1150], [64, 1146], [88, 1150], [93, 1167], [87, 1185], [73, 1181], [66, 1187], [53, 1187], [45, 1176]])
    ], { details: view === 'back' ? [L(s, [[68, 1170], [68, 1186]])] : [] });
    sc.bone('fibula-' + sd, [
      B(s, [[87, 1205], [98, 1204], [101, 1216], [93, 1222], [86, 1214]]),
      T(s, [[94, 1214], [92, 1350], [88, 1480], [86, 1510]], [[0, 5.5], [0.1, 3.8], [0.5, 3.5], [0.9, 4.5], [1, 6.5]])
    ], { layer: view === 'front' ? 'far' : 'mid' });
    sc.bone('tibia-' + sd, [
      B(s, [[43, 1191], [70, 1187], [92, 1191], [94, 1201], [84, 1214], [50, 1214], [41, 1203]]),
      T(s, [[66, 1205], [62, 1330], [58, 1484]], [[0, 14], [0.12, 9.5], [0.5, 7.5], [0.9, 9], [1, 12]]),
      B(s, [[45, 1478], [60, 1476], [62, 1500], [52, 1517], [45, 1504]])
    ], { details: view === 'front' ? [L(s, [[64, 1214], [63, 1226]])] : [] });
    if (view === 'front') sc.bone('patella-' + sd, [E(s, 70, 1168, 11, 13.5)], { layer: 'near' });
  }

  function footFront(sc, s, sd) {
    const F = (id, pts, o) => sc.bone(id + '-' + sd, [B(s, pts)], o);
    F('calcaneus', [[70, 1510], [90, 1508], [98, 1525], [95, 1548], [81, 1552], [72, 1535]], { layer: 'far' });
    F('talus', [[52, 1500], [74, 1498], [82, 1510], [77, 1530], [58, 1533], [48, 1520]]);
    F('navicular', [[43, 1530], [60, 1532], [62, 1542], [50, 1548], [41, 1542]]);
    F('cuboid', [[76, 1536], [92, 1540], [94, 1558], [85, 1566], [74, 1556], [72, 1544]]);
    F('cuneiform-med', [[38, 1546], [49, 1549], [50, 1566], [42, 1570], [36, 1560]]);
    F('cuneiform-int', [[51.5, 1550], [60, 1549], [61, 1564], [52, 1566]]);
    F('cuneiform-lat', [[62.5, 1547], [72, 1547], [73, 1562], [63, 1564]]);
    const mt = [[0, 3.6], [0.15, 2.7], [0.5, 2.3], [0.85, 2.9], [1, 3.4]];
    sc.bone('mt1-' + sd, [T(s, [[43, 1572], [38, 1619]], [[0, 5.6], [0.5, 4], [1, 6]])]);
    sc.bone('mt2-' + sd, [T(s, [[56, 1569], [53, 1626]], mt)]);
    sc.bone('mt3-' + sd, [T(s, [[67, 1567], [67, 1624]], mt)]);
    sc.bone('mt4-' + sd, [T(s, [[78, 1564], [80, 1618]], mt)]);
    sc.bone('mt5-' + sd, [T(s, [[88, 1562], [94, 1610]], [[0, 4.5], [0.2, 2.6], [0.5, 2.2], [0.85, 2.8], [1, 3.2]])]);
    sc.bone('tpp1-' + sd, [T(s, [[37.5, 1625], [35.5, 1646]], [[0, 5], [0.5, 3.9], [1, 4.5]])]);
    sc.bone('tdp1-' + sd, [T(s, [[35.3, 1650], [34.3, 1666]], [[0, 4.4], [0.6, 3.4], [1, 3.8]])]);
    const toes = {
      2: [[[53, 1631], [52, 1648]], [[51.8, 1651.5], [51.5, 1659]], [[51.4, 1662.5], [51, 1669]]],
      3: [[[67, 1629], [67, 1645]], [[67, 1648.5], [67, 1655.5]], [[67, 1659], [67, 1665]]],
      4: [[[80.2, 1623], [81, 1638]], [[81.1, 1641.5], [81.5, 1648]], [[81.6, 1651.5], [82, 1657]]],
      5: [[[94.5, 1615], [96, 1628]], [[96.2, 1631.5], [97, 1637]], [[97.1, 1640.3], [97.6, 1645]]]
    };
    for (const t of [2, 3, 4, 5]) {
      const k = t === 5 ? 0.85 : t === 4 ? 0.92 : 1;
      sc.bone('tpp' + t + '-' + sd, [T(s, toes[t][0], [[0, 2.8 * k], [0.5, 2.1 * k], [1, 2.5 * k]])]);
      sc.bone('tip' + t + '-' + sd, [T(s, toes[t][1], [[0, 2.5 * k], [0.5, 2 * k], [1, 2.3 * k]])]);
      sc.bone('tdp' + t + '-' + sd, [T(s, toes[t][2], [[0, 2.3 * k], [0.6, 1.8 * k], [1, 2.1 * k]])]);
    }
  }

  function footBack(sc, s, sd) {
    sc.bone('talus-' + sd, [B(s, [[52, 1496], [76, 1496], [82, 1508], [74, 1518], [54, 1518], [48, 1508]])]);
    sc.bone('calcaneus-' + sd, [B(s, [[51, 1512], [78, 1510], [87, 1530], [83, 1556], [67, 1564], [52, 1554], [47, 1532]])],
      { layer: 'near', details: [L(s, [[56, 1550], [67, 1556], [78, 1550]])] });
  }

  function hips(sc, s, sd, view) {
    const pts = [[44, 756], [48, 734], [62, 712], [88, 700], [112, 705], [128, 721], [134, 742], [133, 760], [124, 772],
      [120, 790], [110, 812], [106, 826], [104, 858], [98, 874], [92, 890], [82, 902], [68, 902], [56, 892], [44, 886],
      [24, 889], [6, 889], [4, 876], [5, 866], [22, 860], [44, 854], [64, 846], [70, 834], [62, 816], [52, 796], [44, 778]];
    const hole = G.ellPts(CX + s * 60, 875, 15, 10.5, 12 * s);
    const det = view === 'front'
      ? [L(s, [[56, 770], [80, 735], [112, 725]]), L(s, [[48, 800], [60, 820], [70, 834]])]
      : [L(s, [[58, 748], [70, 726], [100, 716]]), L(s, [[50, 790], [80, 780], [110, 790]])];
    sc.bone('hip-' + sd, [G.blob(pts.map(mapS(s)), { holes: [hole] })], { details: det });
    sc.decor(E(s, 88, 842, 17, 16), 'hole');
  }

  function sacrum(sc, view) {
    const half = [[0, 753], [22, 751], [44, 757], [42, 780], [36, 804], [26, 828], [14, 846], [0, 850]];
    const det = [];
    for (const y of [770, 789, 808, 826]) det.push(G.openPath([[CX - 16 + (y - 770) * 0.12, y + 8], [CX, y + 9.5], [CX + 16 - (y - 770) * 0.12, y + 8]]));
    if (view === 'back') det.push(G.openPath([[CX, 760], [CX, 840]]));
    sc.bone('sacrum', [SYM(half)], { layer: view === 'front' ? 'far' : 'mid', details: det });
    const holes = [];
    for (const [i, y] of [770, 789, 808, 826].entries()) for (const s of [-1, 1]) holes.push(G.ell(CX + s * (17 - i * 1.6), y, 3, 2.4, 0, { noSheen: true }));
    sc.decor(holes, 'hole', view === 'front' ? 'far' : 'mid');
    sc.bone('coccyx', [G.tube([[CX, 851], [CX, 864], [CX + 1, 880]], [[0, 7.5], [0.5, 4.5], [1, 2.4]])],
      { layer: view === 'front' ? 'far' : 'mid', details: [G.openPath([[CX - 5, 858], [CX + 5, 858]]), G.openPath([[CX - 3.6, 866], [CX + 3.6, 866]]), G.openPath([[CX - 2.6, 873], [CX + 2.6, 873]])] });
  }

  function teeth(sc, layer, cx, yUp, opts) {
    opts = opts || {};
    const xs = [4, 11.4, 18, 24, 29.2, 33.6, 37.4, 40.8], ws = [3.4, 3.1, 2.9, 2.7, 2.5, 2.2, 2, 1.8];
    const parts = [];
    for (const s of [-1, 1]) xs.forEach((x, i) => {
      const occ = yUp - i * (opts.rise == null ? 1.3 : opts.rise);
      const h = 12 - i * 0.7;
      parts.push(G.blob(G.rrect(cx + s * x, occ - h / 2, ws[i], h / 2, 0.5)));
      parts.push(G.blob(G.rrect(cx + s * x, occ + 0.6 + h * 0.4, ws[i] * 0.95, h * 0.4, 0.5)));
    });
    sc.decor(parts, 'tooth', layer);
  }

  function sideLabels(sc, onLeft, onRight) {
    sc.raw(`<text class="side-label" x="${CX - 200}" y="1250" text-anchor="middle">${onLeft} side</text>`, 'far');
    sc.raw(`<text class="side-label" x="${CX + 200}" y="1250" text-anchor="middle">${onRight} side</text>`, 'far');
  }

  /* ---------- FRONT VIEW ---------- */
  function buildFront() {
    const sc = new Scene({ id: 'front', title: 'Front', viewBox: [40, 0, 520, 1700], home: { x: 70, y: 10, w: 460, h: 1670 } });
    const sides = [['r', -1], ['l', 1]];

    // far: shoulder blades, back halves of ribs, spine
    for (const [sd, s] of sides) {
      sc.bone('scapula-' + sd, [
        B(s, [[62, 332], [80, 326], [100, 328], [114, 322], [126, 316], [133, 318], [135, 328], [122, 334], [118, 345],
          [116, 362], [108, 380], [96, 420], [86, 466], [78, 470], [72, 450], [64, 400], [60, 360]]),
        T(s, [[104, 336], [112, 342], [117, 351]], [[0, 3.6], [1, 2.8]])
      ], { layer: 'far' });
    }
    for (let i = 12; i >= 1; i--) for (const [sd, s] of sides) {
      const r = ribParts(i, s);
      sc.bone(`rib${i}-${sd}`, [r.post], { layer: 'far' });
    }
    // vertebrae (front: bodies + side wings)
    for (let i = 1; i <= 7; i++) {
      const yv = VY.c[i];
      if (i === 1) {
        sc.bone('c1', [G.tube([[CX - 11, yv], [CX + 11, yv]], 3.2), E(-1, 15, yv, 5, 4.2), E(1, 15, yv, 5, 4.2), E(-1, 23, yv, 4, 3), E(1, 23, yv, 4, 3)], { layer: 'far' });
      } else {
        const hw = 8.6 + i * 0.4;
        const parts = [vertBody(hw, i === 2 ? 5.5 : 4.4, yv)].concat(both(s => T(s, [[hw - 1, yv], [hw + 6, yv - 1]], 2)));
        if (i === 2) parts.push(G.tube([[CX, yv - 4], [CX, yv - 13]], [[0, 3.6], [1, 2.8]]));
        sc.bone('c' + i, parts, { layer: 'far' });
      }
    }
    for (let i = 1; i <= 12; i++) {
      const yv = VY.t[i], hw = 11 + i * 0.55, hh = 8.6 + i * 0.15;
      sc.bone('t' + i, [vertBody(hw, hh, yv)].concat(both(s => T(s, [[hw * 0.8, yv - 2], [hw + 9, yv - 5]], [[0, 3], [1, 3.5]]))), { layer: 'far' });
    }
    for (let i = 1; i <= 5; i++) {
      const yv = VY.l[i], hw = 19 + i * 0.9;
      const len = hw + 12 - (i === 5 ? 3 : 0) + (i === 3 ? 2 : 0);
      sc.bone('l' + i, [vertBody(hw, 11.5, yv)].concat(both(s => T(s, [[hw - 3, yv - 1], [len, yv - 3]], [[0, 4], [1, 3.2]]))), { layer: 'far' });
    }
    sacrum(sc, 'front');

    // mid: skull
    skullFront(sc);
    // rib fronts + cartilage + breastbone
    for (let i = 1; i <= 12; i++) for (const [sd, s] of sides) {
      const r = ribParts(i, s);
      if (r.ant) sc.bone(`rib${i}-${sd}`, [r.ant]);
    }
    for (const [, s] of sides) cartilage(sc, s, 'mid');
    sc.bone('sternum', [
      G.blob([[CX - 22, 332], [CX - 8, 333], [CX, 338], [CX + 8, 333], [CX + 22, 332], [CX + 25, 342], [CX + 20, 364], [CX + 15, 384], [CX - 15, 384], [CX - 20, 364], [CX - 25, 342]]),
      G.blob([[CX - 15, 387], [CX + 15, 387], [CX + 17, 420], [CX + 18, 456], [CX + 14, 498], [CX - 14, 498], [CX - 18, 456], [CX - 17, 420]]),
      G.blob([[CX - 7, 499], [CX + 7, 499], [CX + 4, 515], [CX, 524], [CX - 4, 515]])
    ], { details: [G.openPath([[CX - 15, 385.5], [CX + 15, 385.5]]), G.openPath([[CX - 13, 420], [CX + 13, 420]]), G.openPath([[CX - 14, 448], [CX + 14, 448]]), G.openPath([[CX - 13, 474], [CX + 13, 474]])] });

    for (const [sd, s] of sides) { hips(sc, s, sd, 'front'); }
    for (const [sd, s] of sides) { arm(sc, s, sd, 'front'); leg(sc, s, sd, 'front'); }
    for (const [sd, s] of sides) {
      sc.bone('clavicle-' + sd, [T(s, [[20, 334], [50, 338], [84, 328], [108, 324], [129, 321]], [[0, 5.2], [0.15, 4], [0.5, 3.2], [0.85, 3.4], [1, 4.6]])], { layer: 'near' });
    }
    sideLabels(sc, 'RIGHT', 'LEFT');
    return sc;
  }

  function skullFront(sc) {
    const P = { r: -1, l: 1 };
    for (const sd of ['r', 'l']) {
      const s = P[sd];
      sc.bone('parietal-' + sd, [B(s, [[1, 20], [30, 22], [56, 34], [72, 56], [79, 82], [79, 100], [72, 99], [66, 94], [63, 72], [53, 50], [30, 36], [1, 33]])]);
    }
    sc.bone('frontal', [SYM([[0, 32], [30, 35], [52, 48], [62, 70], [65, 96], [63, 116], [62, 134], [56, 132], [52, 127], [40, 126], [28, 127], [16, 129], [9, 134], [4, 139], [0, 140]])],
      { details: [G.openPath([[CX - 40, 118], [CX - 26, 114], [CX - 12, 118]]), G.openPath([[CX + 12, 118], [CX + 26, 114], [CX + 40, 118]])] });
    for (const sd of ['r', 'l']) {
      const s = P[sd];
      sc.bone('temporal-' + sd, [B(s, [[70, 100], [79, 104], [82, 122], [81, 142], [76, 160], [70, 168], [67, 160], [68, 140], [68, 112]])]);
    }
    sc.bone('sphenoid', [B(-1, [[64, 102], [67, 108], [68, 136], [64, 141], [61, 134], [62, 116]]), B(1, [[64, 102], [67, 108], [68, 136], [64, 141], [61, 134], [62, 116]])]);
    sc.bone('mandible', [SYM([[0, 234], [14, 233], [28, 229], [40, 222], [46, 212], [49, 196], [53, 178], [57, 184], [61, 170], [67, 172], [66, 192], [63, 214], [59, 232], [52, 246], [40, 256], [26, 263], [12, 267], [0, 268]])],
      { details: [G.openPath([[CX - 8, 262], [CX, 258], [CX + 8, 262]])] });
    for (const sd of ['r', 'l']) {
      const s = P[sd];
      sc.bone('zygomatic-' + sd, [B(s, [[62, 136], [67, 140], [70, 152], [76, 162], [74, 170], [64, 176], [54, 181], [42, 180], [38, 173], [46, 168], [53, 160], [56, 148]])]);
      sc.bone('maxilla-' + sd, [B(s, [[7, 141], [11, 141], [14, 152], [17, 166], [26, 172], [38, 173], [46, 180], [52, 190], [51, 203], [44, 213], [30, 219], [14, 222], [2, 223], [2, 208], [10, 206], [17, 198], [18, 186], [13, 176], [10, 166], [8, 152]])]);
      sc.bone('nasal-' + sd, [B(s, [[1, 139], [6, 140], [8, 152], [10, 167], [6, 171], [1, 170]])]);
    }
    // eye sockets and the nose hole
    sc.decor([E(-1, 31, 150, 23, 21), E(1, 31, 150, 23, 21)], 'hole');
    sc.decor(SYM([[0, 168], [8, 170], [14, 178], [17, 190], [15, 200], [9, 206], [0, 207]]), 'hole');
    // bones seen inside the eye sockets and nose
    sc.bone('sphenoid', [B(-1, [[24, 140], [34, 137], [40, 147], [35, 154], [28, 150]]), B(1, [[24, 140], [34, 137], [40, 147], [35, 154], [28, 150]])], { layer: 'near', deep: true });
    sc.bone('ethmoid', [B(-1, [[13, 140], [19, 139], [21, 151], [16, 155], [12, 150]]), B(1, [[13, 140], [19, 139], [21, 151], [16, 155], [12, 150]]),
      G.blob([[CX - 1.6, 171], [CX + 1.6, 171], [CX + 2, 187], [CX - 2, 187]], { k: 0.5 })], { layer: 'near', deep: true });
    for (const sd of ['r', 'l']) {
      const s = P[sd];
      sc.bone('lacrimal-' + sd, [B(s, [[9, 146], [13, 145], [15, 155], [11, 160], [8, 156]])], { layer: 'near', deep: true });
      sc.bone('concha-' + sd, [B(s, [[8.5, 187], [15, 185], [16.5, 194], [13, 199], [8.5, 196]])], { layer: 'near', deep: true });
    }
    sc.bone('vomer', [G.blob([[CX - 1.8, 188], [CX + 1.8, 188], [CX + 2.2, 205], [CX - 2.2, 205]], { k: 0.5 })], { layer: 'near', deep: true });
    teeth(sc, 'near', CX, 229);
    sc.bone('hyoid', [G.tube([[CX - 17, 275], [CX - 10, 281.5], [CX, 283], [CX + 10, 281.5], [CX + 17, 275]], [[0, 1.6], [0.3, 2.4], [0.5, 3], [0.7, 2.4], [1, 1.6]])], { layer: 'near' });
  }

  /* ---------- BACK VIEW ---------- */
  function buildBack() {
    const sc = new Scene({ id: 'back', title: 'Back', viewBox: [40, 0, 520, 1700], home: { x: 70, y: 10, w: 460, h: 1670 } });
    const sides = [['r', 1], ['l', -1]]; // seen from behind, the skeleton's right is on your right

    for (let i = 1; i <= 12; i++) for (const [sd, s] of sides) {
      const r = ribParts(i, s);
      if (r.ant) sc.bone(`rib${i}-${sd}`, [r.ant], { layer: 'far' });
    }
    for (const [, s] of sides) cartilage(sc, s, 'far');
    for (const [sd, s] of sides) sc.bone('clavicle-' + sd, [T(s, [[20, 334], [50, 338], [84, 328], [108, 324], [129, 321]], [[0, 5.2], [0.15, 4], [0.5, 3.2], [0.85, 3.4], [1, 4.6]])], { layer: 'far' });

    // skull from behind
    for (const [sd, s] of sides) sc.bone('parietal-' + sd, [B(s, [[1, 20], [34, 24], [62, 44], [78, 74], [82, 104], [78, 124], [60, 118], [38, 104], [16, 88], [1, 82]])]);
    sc.bone('occipital', [SYM([[0, 84], [16, 90], [38, 106], [60, 120], [76, 128], [74, 150], [66, 176], [54, 200], [40, 216], [22, 226], [0, 230]])],
      { details: [G.openPath([[CX - 44, 178], [CX - 20, 166], [CX, 164], [CX + 20, 166], [CX + 44, 178]]), G.openPath([[CX, 164], [CX, 220]])] });
    for (const [sd, s] of sides) sc.bone('temporal-' + sd, [B(s, [[76, 128], [82, 140], [80, 164], [73, 182], [66, 188], [65, 172], [70, 152], [73, 138]])]);

    for (let i = 12; i >= 1; i--) for (const [sd, s] of sides) sc.bone(`rib${i}-${sd}`, [ribParts(i, s).post]);
    for (const [sd, s] of sides) hips(sc, s, sd, 'back');
    sacrum(sc, 'back');

    // spine from behind (bottom first so each bump overlaps the one below)
    for (let i = 5; i >= 1; i--) {
      const yv = VY.l[i], hw = 12 + i * 0.4;
      const len = 28 + (i === 3 ? 2 : 0) - (i === 5 ? 4 : 0);
      sc.bone('l' + i, [G.blob(G.rrect(CX, yv, hw, 9)), G.blob(G.rrect(CX, yv + 6, 4.4, 8.5, 0.45))]
        .concat(both(s => T(s, [[10, yv - 2], [len, yv - 4]], [[0, 4], [1, 3.2]])))
        .concat(both(s => E(s, 9, yv - 10, 3.4, 3.2))));
    }
    for (let i = 12; i >= 1; i--) {
      const yv = VY.t[i];
      const tlen = 19 + i * 0.25 - (i > 10 ? (i - 10) * 4 : 0);
      const slen = i > 10 ? 16 : 23;
      sc.bone('t' + i, [G.blob(G.rrect(CX, yv - 2, 9 + i * 0.25, 7.5))]
        .concat(both(s => T(s, [[7, yv - 4], [tlen, yv - 7]], [[0, 3.2], [0.8, 3], [1, 3.8]])))
        .concat([G.tube([[CX, yv - 2], [CX, yv + slen * 0.5], [CX, yv + slen]], [[0, 3.1], [0.6, 2.4], [1, 2.9]])]));
    }
    for (let i = 7; i >= 1; i--) {
      const yv = VY.c[i];
      if (i === 1) {
        sc.bone('c1', [G.tube([[CX - 15, yv], [CX - 8, yv + 3], [CX, yv + 4], [CX + 8, yv + 3], [CX + 15, yv]], 2.6),
          E(-1, 15, yv - 1, 5, 4), E(1, 15, yv - 1, 5, 4), E(-1, 23, yv, 4, 3), E(1, 23, yv, 4, 3), E(1, 0, yv + 4, 3, 2.5)]);
        continue;
      }
      const parts = [G.blob(G.rrect(CX, yv, 10 + i * 0.4, 4.4))].concat(both(s => T(s, [[8, yv], [15 + i * 0.3, yv + 1]], 2)));
      if (i === 2) parts.push(G.tube([[CX, yv + 1], [CX, yv + 10]], [[0, 4], [1, 3]]));
      else if (i === 7) parts.push(G.tube([[CX, yv], [CX, yv + 14]], [[0, 3], [1, 3.4]]));
      else parts.push(G.tube([[CX, yv + 1], [CX, yv + 7]], 2.2), ...both(s => T(s, [[0, yv + 6], [2.4, yv + 9]], 1.5)));
      sc.bone('c' + i, parts);
    }

    for (const [sd, s] of sides) { arm(sc, s, sd, 'back'); leg(sc, s, sd, 'back'); }
    for (const [sd, s] of sides) {
      sc.bone('scapula-' + sd, [
        B(s, [[58, 336], [80, 330], [104, 330], [120, 322], [132, 315], [139, 321], [135, 332], [122, 338], [118, 350],
          [114, 370], [104, 400], [92, 440], [84, 470], [76, 470], [70, 446], [62, 396], [56, 356]]),
        T(s, [[60, 372], [90, 356], [116, 338], [134, 322]], [[0, 2.4], [0.5, 4], [1, 5]])
      ], { layer: 'near', details: [L(s, [[62, 376], [92, 361], [118, 344]])] });
    }
    sideLabels(sc, 'LEFT', 'RIGHT');
    return sc;
  }

  /* ---------- SKULL SIDE VIEW (left side, face pointing left) ---------- */
  function buildSide() {
    const sc = new Scene({ id: 'side', title: 'Skull side', viewBox: [20, 0, 360, 340], home: { x: 40, y: 10, w: 300, h: 310 } });
    const b = (id, pts, o) => sc.bone(id, [G.blob(pts)], o);
    b('mandible', [[64, 232], [84, 230], [116, 228], [138, 224], [150, 210], [154, 192], [157, 177], [165, 186], [174, 194], [182, 184],
      [190, 171], [203, 173], [200, 196], [194, 226], [188, 250], [172, 263], [136, 269], [100, 275], [74, 277], [62, 267], [58, 248]],
    { details: [G.openPath([[160, 244], [130, 252], [96, 258]])] });
    b('occipital', [[292, 60], [312, 82], [326, 114], [327, 150], [315, 180], [297, 198], [275, 205], [262, 197], [270, 184], [280, 168], [285, 138], [289, 98]]);
    b('parietal-l', [[178, 25], [220, 21], [260, 31], [288, 58], [286, 96], [279, 132], [258, 120], [230, 110], [200, 110], [176, 118], [161, 128], [170, 100], [181, 62]],
      { details: [G.openPath([[176, 76], [220, 58], [262, 70], [280, 100]])] });
    b('frontal', [[92, 134], [90, 100], [100, 68], [120, 44], [148, 30], [175, 25], [179, 60], [168, 100], [156, 126], [146, 132], [134, 140], [120, 138], [108, 133], [98, 135]],
      { details: [G.openPath([[96, 120], [112, 116], [128, 122]])] });
    sc.bone('temporal-l', [
      G.blob([[162, 132], [178, 120], [200, 113], [230, 113], [258, 123], [278, 140], [282, 166], [272, 184], [263, 200], [253, 207], [246, 193], [236, 183],
        [222, 181], [206, 178], [192, 172], [178, 168], [166, 162], [160, 148]]),
      G.tube([[196, 168], [172, 165], [146, 166]], [[0, 5], [1, 4.2]]),
      G.tube([[236, 186], [226, 214]], [[0, 2], [1, 0.9]])
    ]);
    b('sphenoid', [[146, 135], [160, 129], [167, 140], [165, 158], [152, 163], [140, 159], [137, 147]]);
    b('zygomatic-l', [[104, 140], [114, 140], [118, 152], [128, 160], [146, 161], [148, 172], [128, 176], [116, 188], [102, 190], [92, 180], [94, 164], [100, 152]]);
    b('maxilla-l', [[88, 140], [98, 158], [100, 180], [114, 188], [120, 202], [116, 214], [100, 222], [78, 224], [66, 220], [62, 204], [60, 186], [66, 174], [76, 160], [84, 150]]);
    b('nasal-l', [[82, 134], [90, 134], [86, 150], [70, 172], [63, 170], [70, 154]]);
    sc.decor(G.blob([[86, 138], [100, 137], [103, 150], [97, 162], [87, 160]]), 'hole');
    sc.decor(G.ell(222, 168, 7.5, 6.5, 0), 'hole');
    b('ethmoid', [[92, 143], [98, 143], [99, 153], [93, 155]], { layer: 'near', deep: true });
    b('lacrimal-l', [[87, 145], [91.5, 145], [91.5, 154], [87.5, 155]], { layer: 'near', deep: true });
    const tparts = [];
    for (let i = 0; i < 8; i++) {
      const x = 68 + i * 6.6, w = i < 2 ? 2.4 : i < 3 ? 2.6 : 3.1;
      tparts.push(G.blob(G.rrect(x, 222 - 0.2 * i, w, 6, 0.5)), G.blob(G.rrect(x + 0.6, 234 - 0.2 * i, w, 5.4, 0.5)));
    }
    sc.decor(tparts, 'tooth', 'near');
    sc.bone('hyoid', [G.tube([[124, 300], [140, 302], [156, 295]], [[0, 2], [0.5, 3.4], [1, 2]])]);
    sc.raw(`<text class="note" x="60" y="322">← Face looks this way</text>`);
    sc.raw(`<text class="note small" x="222" y="152" text-anchor="middle">ear hole</text>`);
    return sc;
  }

  /* ---------- EAR CLOSE-UP ---------- */
  function buildEar() {
    const sc = new Scene({ id: 'ear', title: 'Ear bones', viewBox: [0, 0, 540, 300], home: { x: 10, y: 20, w: 520, h: 270 } });
    const k = 1.15;
    function ossicles(cx, s, sd) {
      // s = +1: outside of the head is on the left (your right ear seen from the front)
      const m = p => [cx + s * p[0] * k, 150 + p[1] * k];
      const bl = (pts, o) => G.blob(pts.map(m), o), tb = (pts, pr) => G.tube(pts.map(m), pr.map(([t, w]) => [t, w * k]));
      const el = (p, rx, ry) => G.ell(...m(p), rx * k, ry * k, 0);
      sc.decor(G.blob([[-110, -26], [-46, -28], [-40, 28], [-110, 32]].map(m)), 'soft', 'far');
      sc.decor(el([-40, 2], 6, 36), 'drum', 'far');
      sc.decor(el([90, 18], 24, 22), 'soft', 'far');
      sc.raw(`<path class="spiral" d="${G.openPath([[90, 18], [96, 14], [100, 22], [90, 32], [76, 20], [86, 2], [108, 6], [113, 26]].map(m))}"/>`, 'far');
      sc.bone('malleus-' + sd, [el([-20, -36], 12, 13), tb([[-18, -26], [-24, 8], [-32, 34]], [[0, 5], [0.5, 3.6], [1, 2.6]]), tb([[-20, -16], [-32, -18]], [[0, 2.6], [1, 1.8]])]);
      sc.bone('incus-' + sd, [bl([[-6, -52], [12, -54], [22, -40], [14, -26], [-2, -24], [-8, -36]]), tb([[12, -48], [38, -54]], [[0, 5], [1, 2.4]]), tb([[8, -30], [14, 0], [20, 18]], [[0, 5], [0.6, 3], [1, 3]])]);
      sc.bone('stapes-' + sd, [el([24, 22], 5, 4.4), tb([[27, 18], [42, 8], [58, 10]], [[0, 2.4], [1, 2]]), tb([[27, 26], [42, 36], [58, 34]], [[0, 2.4], [1, 2]]), bl([[56, 4], [63, 4], [65, 40], [57, 40]], { k: 0.6 })]);
      sc.raw(`<text class="note" x="${cx}" y="268" text-anchor="middle">${sd === 'r' ? 'Right ear' : 'Left ear'}</text>`);
      sc.raw(`<text class="note small" x="${m([-40, 0])[0]}" y="${m([0, 52])[1]}" text-anchor="middle">ear drum</text>`);
      sc.raw(`<text class="note small" x="${m([-82, 0])[0]}" y="${m([0, -34])[1]}" text-anchor="middle">ear hole</text>`);
      sc.raw(`<text class="note small" x="${m([90, 0])[0]}" y="${m([0, 56])[1]}" text-anchor="middle"><tspan>hearing</tspan><tspan x="${m([90, 0])[0]}" dy="12">snail</tspan></text>`);
    }
    ossicles(128, 1, 'r');
    ossicles(412, -1, 'l');
    sc.raw(`<text class="note big" x="270" y="34" text-anchor="middle">Inside your ears (shown much bigger!)</text>`);
    return sc;
  }

  /* ---------- ROOF OF THE MOUTH (skull from below, jaw removed) ---------- */
  function buildPalate() {
    const sc = new Scene({ id: 'palate', title: 'Mouth roof', viewBox: [0, 0, 400, 420], home: { x: 30, y: 30, w: 340, h: 380 } });
    const C = 200;
    const M = (s, pts, o) => G.blob(pts.map(p => [C + s * p[0], p[1]]), o);
    // looking up from below: the skeleton's right is on your left
    for (const [sd, s] of [['r', -1], ['l', 1]]) {
      sc.bone('zygomatic-' + sd, [M(s, [[96, 136], [118, 146], [128, 196], [118, 230], [106, 226], [108, 190], [100, 160]])]);
      sc.bone('temporal-' + sd, [M(s, [[80, 252], [120, 240], [140, 270], [132, 300], [98, 302], [78, 282]])]);
    }
    sc.bone('occipital', [G.blob([[C - 70, 310], [C - 40, 300], [C + 40, 300], [C + 70, 310], [C + 80, 350], [C + 50, 395], [C, 408], [C - 50, 395], [C - 80, 350]], { holes: [G.ellPts(C, 346, 22, 28, 0)] })]);
    sc.bone('sphenoid', [G.blob([[C - 64, 262], [C - 30, 256], [C + 30, 256], [C + 64, 262], [C + 74, 280], [C + 50, 298], [C - 50, 298], [C - 74, 280]]),
      G.tube([[C - 40, 238], [C - 44, 262]], 3.4), G.tube([[C + 40, 238], [C + 44, 262]], 3.4)]);
    sc.decor([G.ell(C - 22, 248, 15, 16, 0), G.ell(C + 22, 248, 15, 16, 0)], 'hole');
    sc.bone('vomer', [G.blob([[C - 3.2, 230], [C + 3.2, 230], [C + 4, 268], [C - 4, 268]], { k: 0.5 })], { layer: 'near' });
    for (const [sd, s] of [['r', -1], ['l', 1]]) {
      sc.bone('maxilla-' + sd, [M(s, [[1, 72], [30, 66], [60, 76], [80, 98], [90, 128], [92, 160], [88, 190], [70, 197], [40, 197], [20, 198], [1, 199]])],
        { details: [G.openPath([[C + s * 1, 100], [C + s * 1, 196]])] });
      sc.bone('palatine-' + sd, [M(s, [[1, 202], [22, 200], [44, 200], [66, 198], [68, 214], [62, 232], [46, 238], [30, 236], [18, 226], [1, 226]])]);
    }
    // teeth around the upper jaw, seen from below
    const tp = [];
    for (const s of [-1, 1]) for (let i = 0; i < 8; i++) {
      const a = (0.06 + i * 0.075) * Math.PI;
      const x = C + s * Math.sin(a) * 84, y = 170 - Math.cos(a) * 92 + i * 6;
      const r = i < 2 ? 6 : i < 3 ? 6.5 : i < 5 ? 7 : 8.5;
      tp.push(G.ell(x, y, r, i < 2 ? 4.5 : r * 0.9, s * a * 57));
    }
    sc.decor(tp, 'tooth', 'near');
    sc.raw(`<text class="note" x="${C}" y="28" text-anchor="middle">Front teeth ↑</text>`);
    sc.raw(`<text class="note small" x="${C}" y="352" text-anchor="middle">spinal cord hole</text>`);
    return sc;
  }

  SK.buildScenes = function () {
    const list = [buildFront(), buildBack(), buildSide(), buildEar(), buildPalate()];
    const map = {};
    for (const s of list) map[s.id] = s;
    return { list, map };
  };
})(window.SK);
