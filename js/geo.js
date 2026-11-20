/*! Bone Explorer | Copyright (c) 2026 Nicolas Nowinski | MIT License */
/* Geometry helpers: turn a few control points into smooth, bone-like SVG paths. */
window.SK = window.SK || {};

(function (SK) {
  'use strict';

  const LIGHT = norm([-0.6, -0.8]); // light comes from the top-left

  function r(n) { return Math.round(n * 100) / 100; }
  function pt(p) { return r(p[0]) + ',' + r(p[1]); }
  function norm(v) { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; }
  function dist(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); }

  function bboxOf(pts) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of pts) {
      if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0];
      if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1];
    }
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  /* Closed Catmull-Rom spline through points, as cubic Beziers. */
  function closedPath(pts, k) {
    k = k == null ? 1 : k;
    const n = pts.length;
    let d = 'M' + pt(pts[0]);
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6 * k, p1[1] + (p2[1] - p0[1]) / 6 * k];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6 * k, p2[1] - (p3[1] - p1[1]) / 6 * k];
      d += 'C' + pt(c1) + ' ' + pt(c2) + ' ' + pt(p2);
    }
    return d + 'Z';
  }

  /* Open Catmull-Rom spline (for detail lines). */
  function openPath(pts) {
    const n = pts.length;
    if (n === 2) return 'M' + pt(pts[0]) + 'L' + pt(pts[1]);
    let d = 'M' + pt(pts[0]);
    for (let i = 0; i < n - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, n - 1)];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += 'C' + pt(c1) + ' ' + pt(c2) + ' ' + pt(p2);
    }
    return d;
  }

  /* Sample an open Catmull-Rom curve into n+1 points. */
  function sample(pts, n) {
    if (pts.length === 2) {
      const out = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        out.push([pts[0][0] + (pts[1][0] - pts[0][0]) * t, pts[0][1] + (pts[1][1] - pts[0][1]) * t]);
      }
      return out;
    }
    const segs = pts.length - 1, out = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n * segs;
      const s = Math.min(Math.floor(u), segs - 1), t = u - s;
      const p0 = pts[Math.max(s - 1, 0)], p1 = pts[s], p2 = pts[s + 1], p3 = pts[Math.min(s + 2, segs)];
      const t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(j => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t +
        (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
    return out;
  }

  function profileAt(profile, t) {
    if (typeof profile === 'number') return profile;
    if (t <= profile[0][0]) return profile[0][1];
    for (let i = 1; i < profile.length; i++) {
      if (t <= profile[i][0]) {
        const a = profile[i - 1], b = profile[i];
        const u = (t - a[0]) / (b[0] - a[0] || 1);
        const s = u * u * (3 - 2 * u); // smoothstep for organic swelling
        return a[1] + (b[1] - a[1]) * s;
      }
    }
    return profile[profile.length - 1][1];
  }

  /* Outline points of a "tube" around a centerline with a width profile. */
  function tubeOutline(S, widthAt, offsetAt, cap) {
    const N = S.length - 1;
    const L = [0];
    for (let i = 1; i <= N; i++) L[i] = L[i - 1] + dist(S[i], S[i - 1]);
    const total = L[N] || 1;
    const left = [], right = [], tans = [], ws = [];
    for (let i = 0; i <= N; i++) {
      const a = S[Math.max(i - 1, 0)], b = S[Math.min(i + 1, N)];
      const tan = norm([b[0] - a[0], b[1] - a[1]]);
      const nrm = [-tan[1], tan[0]];
      const t = L[i] / total;
      const w = widthAt(t);
      const off = offsetAt ? offsetAt(t, nrm, w) : [0, 0];
      const c = [S[i][0] + off[0], S[i][1] + off[1]];
      left.push([c[0] + nrm[0] * w, c[1] + nrm[1] * w]);
      right.push([c[0] - nrm[0] * w, c[1] - nrm[1] * w]);
      tans.push(tan); ws.push(w);
    }
    const out = left.slice();
    const capPts = (i, dir) => {
      const c = [(left[i][0] + right[i][0]) / 2, (left[i][1] + right[i][1]) / 2];
      const tan = tans[i], nrm = [-tan[1], tan[0]], w = ws[i];
      const res = [];
      for (const deg of [40, 90, 140]) {
        const a = deg * Math.PI / 180;
        res.push([c[0] + nrm[0] * w * Math.cos(a) * dir + tan[0] * w * cap * Math.sin(a) * dir,
                  c[1] + nrm[1] * w * Math.cos(a) * dir + tan[1] * w * cap * Math.sin(a) * dir]);
      }
      return res;
    };
    out.push(...capPts(N, 1));
    for (let i = N; i >= 0; i--) out.push(right[i]);
    out.push(...capPts(0, -1));
    return out;
  }

  /*
   * tube(centerline, profile, opts) -> part
   * profile: number, or [[t, halfWidth], ...] along the length (t from 0 to 1).
   */
  function tube(center, profile, opts) {
    opts = opts || {};
    const S = opts.dense ? center : sample(center, opts.n || (center.length > 2 ? 30 : 18));
    const cap = opts.cap == null ? 0.75 : opts.cap;
    const wAt = t => profileAt(profile, t);
    const outline = tubeOutline(S, wAt, null, cap);
    const sheen = tubeOutline(S, t => wAt(t) * 0.3, (t, nrm, w) => {
      const d = nrm[0] * LIGHT[0] + nrm[1] * LIGHT[1];
      const k = Math.max(-1, Math.min(1, d * 2.5)) * w * 0.4;
      return [nrm[0] * k, nrm[1] * k];
    }, cap * 0.8);
    return { d: closedPath(outline), sheen: closedPath(sheen), bb: bboxOf(outline) };
  }

  /* Smooth closed shape through control points. opts.holes: list of point lists. */
  function blob(pts, opts) {
    opts = opts || {};
    let d = closedPath(pts, opts.k);
    if (opts.holes) for (const h of opts.holes) d += closedPath(h.slice().reverse(), opts.k);
    const bb = bboxOf(pts);
    let cx = 0, cy = 0;
    for (const p of pts) { cx += p[0]; cy += p[1]; }
    cx /= pts.length; cy /= pts.length;
    // Highlight: a shrunken copy nudged toward the light. For concave shapes it can poke
    // outside the bone, so shrink it until every point is inside (or drop it).
    let sheen = null;
    if (!opts.noSheen) {
      const sz = Math.hypot(bb.w, bb.h) * 0.12;
      const poly = sampleClosed(pts);
      for (const sc of [0.55, 0.45, 0.35]) {
        const sh = pts.map(p => [cx + (p[0] - cx) * sc + LIGHT[0] * sz * sc / 0.55, cy + (p[1] - cy) * sc + LIGHT[1] * sz * sc / 0.55]);
        if (sampleClosed(sh).every(q => inside(q, poly))) { sheen = closedPath(sh, opts.k); break; }
      }
    }
    return { d, sheen, bb };
  }

  function sampleClosed(pts) {
    const n = pts.length, out = [];
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      for (let k = 0; k < 4; k++) {
        const t = k / 4, t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map(j => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t +
          (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
      }
    }
    return out;
  }
  function inside(q, poly) {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[i], b = poly[j];
      if ((a[1] > q[1]) !== (b[1] > q[1]) && q[0] < (b[0] - a[0]) * (q[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
    }
    return c;
  }

  function ellPts(cx, cy, rx, ry, rot, n) {
    n = n || 12; rot = (rot || 0) * Math.PI / 180;
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2;
      const x = Math.cos(a) * rx, y = Math.sin(a) * ry;
      out.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
    }
    return out;
  }
  function ell(cx, cy, rx, ry, rot, opts) { return blob(ellPts(cx, cy, rx, ry, rot), opts); }

  /* Mirror a half outline (from top midline down the right side to bottom midline) into a full symmetric one. */
  function sym(half, cx) {
    cx = cx || 0;
    const right = half.map(p => [cx + p[0], p[1]]);
    const left = half.slice(1, -1).reverse().map(p => [cx - p[0], p[1]]);
    return right.concat(left);
  }

  /* Rounded rectangle as control points (centered). */
  function rrect(cx, cy, hw, hh, round) {
    const rx = hw * (round || 0.35), ry = hh * (round || 0.35);
    return [[cx - hw + rx, cy - hh], [cx + hw - rx, cy - hh], [cx + hw, cy - hh + ry], [cx + hw, cy + hh - ry],
      [cx + hw - rx, cy + hh], [cx - hw + rx, cy + hh], [cx - hw, cy + hh - ry], [cx - hw, cy - hh + ry]];
  }

  SK.geo = { tube, blob, ell, ellPts, sym, rrect, sample, closedPath, openPath, bboxOf, profileAt };
})(window.SK);
