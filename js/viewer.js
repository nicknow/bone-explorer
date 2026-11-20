/*! Bone Explorer | Copyright (c) 2026 Nicolas Nowinski | MIT License */
/*
 * Pan / zoom for the SVG by animating its viewBox.
 * Handles mouse wheel, drag, two-finger pinch, taps and hover.
 */
window.SK = window.SK || {};

(function (SK) {
  'use strict';

  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  class Viewer {
    constructor(svg) {
      this.svg = svg;
      this.vb = { x: 0, y: 0, w: 100, h: 100 };
      this.bounds = { x: 0, y: 0, w: 100, h: 100 };
      this.maxZoom = 30;
      this.insets = { top: 0, right: 0, bottom: 0, left: 0 };
      this.handlers = {};
      this.pointers = new Map();
      this.anim = null;
      this._bind();
      this._size = this._measure();
      new ResizeObserver(() => this._onResize()).observe(svg);
    }

    on(name, fn) { (this.handlers[name] = this.handlers[name] || []).push(fn); }
    emit(name, data) { (this.handlers[name] || []).forEach(fn => fn(data)); }

    _measure() { const r = this.svg.getBoundingClientRect(); return { w: Math.max(r.width, 1), h: Math.max(r.height, 1), left: r.left, top: r.top }; }
    get scale() { return this._size.w / this.vb.w; }
    get homeScale() { return this._fitScale(this.bounds, 12); }
    get minScale() { return this.homeScale * 0.7; }
    get maxScale() { return this.homeScale * this.maxZoom; }

    _avail() {
      const s = this._size, i = this.insets;
      return { x: i.left, y: i.top, w: Math.max(s.w - i.left - i.right, 50), h: Math.max(s.h - i.top - i.bottom, 50) };
    }
    _fitScale(box, pad) {
      const a = this._avail();
      return Math.min((a.w - pad * 2) / box.w, (a.h - pad * 2) / box.h);
    }

    /* Viewbox that shows `box` centred in the visible (non-covered) area. */
    boxFor(box, pad, maxScale) {
      pad = pad == null ? 16 : pad;
      let sc = this._fitScale(box, pad);
      if (maxScale) sc = Math.min(sc, maxScale);
      sc = Math.max(this.minScale, Math.min(this.maxScale, sc));
      return this._vbAt(box.x + box.w / 2, box.y + box.h / 2, sc);
    }
    _vbAt(cx, cy, sc) {
      const a = this._avail(), s = this._size;
      const w = s.w / sc, h = s.h / sc;
      return { x: cx - (a.x + a.w / 2) / sc, y: cy - (a.y + a.h / 2) / sc, w, h };
    }

    setScene(bounds, maxZoom) {
      this.bounds = bounds;
      this.maxZoom = maxZoom || 30;
    }
    home(animate) { this.fit(this.bounds, { animate, pad: 12 }); this.userMoved = false; }
    fit(box, opts) {
      opts = opts || {};
      this.userMoved = true;
      const target = this.boxFor(box, opts.pad, opts.maxScale);
      if (opts.animate === false) { this._stop(); this.vb = this._clamp(target); this._apply(); }
      else this.animateTo(target, opts.duration);
    }

    _clamp(vb) {
      const sc = this._size.w / vb.w;
      const clampedSc = Math.max(this.minScale, Math.min(this.maxScale, sc));
      if (Math.abs(clampedSc - sc) > 1e-9) {
        const cx = vb.x + vb.w / 2, cy = vb.y + vb.h / 2;
        vb = { x: cx - this._size.w / clampedSc / 2, y: cy - this._size.h / clampedSc / 2, w: this._size.w / clampedSc, h: this._size.h / clampedSc };
      }
      // keep the drawing from sliding completely off screen
      const b = this.bounds, m = 0.35;
      const cx = vb.x + vb.w / 2, cy = vb.y + vb.h / 2;
      const minX = b.x - vb.w * m, maxX = b.x + b.w + vb.w * m, minY = b.y - vb.h * m, maxY = b.y + b.h + vb.h * m;
      const ncx = Math.max(minX, Math.min(maxX, cx)), ncy = Math.max(minY, Math.min(maxY, cy));
      return { x: vb.x + ncx - cx, y: vb.y + ncy - cy, w: vb.w, h: vb.h };
    }

    _apply() {
      const v = this.vb;
      this.svg.setAttribute('viewBox', `${v.x.toFixed(2)} ${v.y.toFixed(2)} ${v.w.toFixed(2)} ${v.h.toFixed(2)}`);
      this.emit('change', v);
    }

    animateTo(target, dur) {
      this._stop();
      target = this._clamp(target);
      const from = Object.assign({}, this.vb);
      const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      dur = reduce ? 0 : (dur == null ? 550 : dur);
      if (!dur) { this.vb = target; this._apply(); return; }
      const t0 = performance.now();
      const lw0 = Math.log(from.w), lw1 = Math.log(target.w);
      const step = now => {
        const t = Math.min(1, (now - t0) / dur), e = ease(t);
        const w = Math.exp(lw0 + (lw1 - lw0) * e), h = w * from.h / from.w;
        const cx = from.x + from.w / 2 + ((target.x + target.w / 2) - (from.x + from.w / 2)) * e;
        const cy = from.y + from.h / 2 + ((target.y + target.h / 2) - (from.y + from.h / 2)) * e;
        this.vb = { x: cx - w / 2, y: cy - h / 2, w, h };
        this._apply();
        if (t < 1) this.anim = requestAnimationFrame(step); else { this.anim = null; this.vb = target; this._apply(); }
      };
      this.anim = requestAnimationFrame(step);
    }
    _stop() { if (this.anim) cancelAnimationFrame(this.anim); this.anim = null; }

    /* zoom keeping the point under (px, py) fixed; px/py are relative to the svg's top-left */
    zoomAt(px, py, factor, animate) {
      const sc = this.scale;
      const nsc = Math.max(this.minScale, Math.min(this.maxScale, sc * factor));
      const ux = this.vb.x + px / sc, uy = this.vb.y + py / sc;
      const target = { x: ux - px / nsc, y: uy - py / nsc, w: this._size.w / nsc, h: this._size.h / nsc };
      if (animate) this.animateTo(target, 380);
      else { this._stop(); this.vb = this._clamp(target); this._apply(); }
    }
    zoomCenter(factor) {
      const a = this._avail();
      this.zoomAt(a.x + a.w / 2, a.y + a.h / 2, factor, true);
    }
    panBy(dx, dy) {
      const sc = this.scale;
      this.vb = this._clamp({ x: this.vb.x - dx / sc, y: this.vb.y - dy / sc, w: this.vb.w, h: this.vb.h });
      this._apply();
    }
    /* user units -> px relative to svg */
    toScreen(x, y) { const sc = this.scale; return [(x - this.vb.x) * sc, (y - this.vb.y) * sc]; }
    /* visible part of the drawing (excluding covered insets), in user units */
    visibleBox() {
      const a = this._avail(), sc = this.scale;
      return { x: this.vb.x + a.x / sc, y: this.vb.y + a.y / sc, w: a.w / sc, h: a.h / sc };
    }

    _onResize() {
      const old = this._size;
      this._size = this._measure();
      if (!old || old.w < 2 || !this.userMoved) { this.home(false); return; }
      // keep centre and scale steady when the window changes size
      const sc = old.w / this.vb.w;
      const cx = this.vb.x + this.vb.w / 2, cy = this.vb.y + this.vb.h / 2;
      this.vb = this._clamp({ x: cx - this._size.w / sc / 2, y: cy - this._size.h / sc / 2, w: this._size.w / sc, h: this._size.h / sc });
      this._apply();
    }

    _local(e) { const r = this.svg.getBoundingClientRect(); this._size.left = r.left; this._size.top = r.top; return [e.clientX - r.left, e.clientY - r.top]; }

    _bind() {
      const svg = this.svg;
      svg.addEventListener('pointerdown', e => {
        if (e.button > 0) return;
        this._stop();
        this.userMoved = true;
        const [x, y] = this._local(e);
        this.pointers.set(e.pointerId, { x, y });
        try { svg.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
        if (this.pointers.size === 1) {
          this.gesture = { x0: x, y0: y, t0: performance.now(), moved: false, target: e.target, type: e.pointerType };
        } else if (this.pointers.size === 2) {
          const [a, b] = [...this.pointers.values()];
          this.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, vb: Object.assign({}, this.vb) };
          if (this.gesture) this.gesture.moved = true;
        }
      });
      svg.addEventListener('pointermove', e => {
        const [x, y] = this._local(e);
        if (!this.pointers.has(e.pointerId)) {
          if (e.pointerType === 'mouse') this.emit('hover', { target: e.target, x, y });
          return;
        }
        const p = this.pointers.get(e.pointerId);
        const dx = x - p.x, dy = y - p.y;
        p.x = x; p.y = y;
        if (this.pointers.size === 1 && this.gesture) {
          if (!this.gesture.moved && Math.hypot(x - this.gesture.x0, y - this.gesture.y0) > 7) {
            this.gesture.moved = true;
            svg.classList.add('dragging');
          }
          if (this.gesture.moved) this.panBy(dx, dy);
        } else if (this.pointers.size === 2 && this.pinch) {
          const [a, b] = [...this.pointers.values()];
          const d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
          const pv = this.pinch.vb, sc0 = this._size.w / pv.w;
          const nsc = Math.max(this.minScale, Math.min(this.maxScale, sc0 * d / this.pinch.d));
          const ux = pv.x + this.pinch.mx / sc0, uy = pv.y + this.pinch.my / sc0;
          this.vb = this._clamp({ x: ux - mx / nsc, y: uy - my / nsc, w: this._size.w / nsc, h: this._size.h / nsc });
          this._apply();
        }
      });
      const end = e => {
        if (!this.pointers.has(e.pointerId)) return;
        const [x, y] = this._local(e);
        this.pointers.delete(e.pointerId);
        svg.classList.remove('dragging');
        if (this.pointers.size === 1) {
          // one finger left after a pinch: continue as a pan without jumping
          this.pinch = null;
        }
        if (this.pointers.size === 0) {
          const g = this.gesture;
          this.gesture = null; this.pinch = null;
          if (g && !g.moved && e.type === 'pointerup' && performance.now() - g.t0 < 700) {
            this.emit('tap', { target: g.target, x, y, pointerType: g.type });
          }
        }
      };
      svg.addEventListener('pointerup', end);
      svg.addEventListener('pointercancel', end);
      svg.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') this.emit('hover', { target: null }); });
      svg.addEventListener('wheel', e => {
        e.preventDefault();
        this._stop();
        this.userMoved = true;
        const [x, y] = this._local(e);
        const k = e.ctrlKey ? 0.012 : (e.deltaMode === 1 ? 0.05 : 0.0018);
        this.zoomAt(x, y, Math.exp(-e.deltaY * k), false);
      }, { passive: false });
    }
  }

  SK.Viewer = Viewer;
})(window.SK);
