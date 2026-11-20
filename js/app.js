/*! Bone Explorer | Copyright (c) 2026 Nicolas Nowinski | MIT License */
/* Bone Explorer: app wiring (scenes, selection, info panel, regions, search, quiz, speech). */
(function (SK) {
  'use strict';

  const $ = s => document.querySelector(s);
  const svg = $('#skeleton'), root = $('#scene-root'), wrap = $('#canvas-wrap');
  const panel = $('#panel'), pbody = $('#panel-body');
  const tooltip = $('#tooltip'), selTag = $('#sel-tag'), toastEl = $('#toast');
  const mq = window.matchMedia('(max-width: 820px)');
  const isMobile = () => mq.matches;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- saved progress (per browser, optional) ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode etc. */ } }
  };
  const found = new Set(store.get('bx-found', []).filter(id => SK.BONE[id]));
  let autoRead = store.get('bx-autoread', false);

  /* ---------- scenes ---------- */
  const scenes = SK.buildScenes();
  const SCENE_ORDER = ['front', 'back', 'side', 'ear', 'palate'];
  const SCENE_LABEL = { front: '🧍 Front', back: '🔙 Back', side: '💀 Skull side', ear: '👂 Ear bones', palate: '👄 Mouth roof' };
  const SCENE_GOTO = { front: '🧍 See it from the front', back: '🔙 See it from the back', side: '💀 See the skull from the side', ear: '👂 See it inside the ear', palate: '👄 See the roof of the mouth' };
  const SCENE_ZOOM = { front: 34, back: 34, side: 9, ear: 6, palate: 7 };
  const sceneBones = {};
  for (const s of scenes.list) {
    s.html = s.render();
    sceneBones[s.id] = new Set([...s.html.matchAll(/data-bone="([^"]+)"/g)].map(m => m[1]));
  }
  const inScene = (sid, id) => sceneBones[sid].has(id);
  function homeScene(id) {
    const b = SK.BONE[id];
    if ((b.region === 'spine' || b.type === 'scapula' || b.type === 'occipital') && inScene('back', id)) return 'back';
    return SCENE_ORDER.find(s => inScene(s, id));
  }
  const REGION_VIEW = {
    head: { scene: 'front' }, ears: { scene: 'ear' }, spine: { scene: 'back' }, chest: { scene: 'front' },
    shoulders: { scene: 'back' }, arms: { scene: 'front' }, hands: { scene: 'front', sided: true },
    hips: { scene: 'front' }, legs: { scene: 'front' }, feet: { scene: 'front', sided: true }
  };

  const state = { scene: null, selected: null, hover: null, region: null, regionSide: 'r', quiz: null };
  const viewer = new SK.Viewer(svg);

  /* ---------- helpers for bone elements ---------- */
  const els = id => root.querySelectorAll(`[data-bone="${CSS.escape(id)}"]`);
  function addCls(id, c) { els(id).forEach(e => e.classList.add(c)); }
  function clearCls(c) { root.querySelectorAll('.' + c).forEach(e => e.classList.remove(c)); }
  function bbox(ids) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const id of [].concat(ids)) for (const e of els(id)) {
      const b = e.getBBox();
      x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height);
    }
    return x0 === Infinity ? null : { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  const screenSize = id => { const b = bbox(id); return b ? Math.sqrt(b.w * b.h) * viewer.scale : 0; };
  function flash(id, cls) {
    els(id).forEach(e => { e.classList.remove(cls); void e.getBBox(); e.classList.add(cls); });
    setTimeout(() => els(id).forEach(e => e.classList.remove(cls)), 1100);
  }

  /* ---------- scene switching ---------- */
  const tabs = $('#scene-tabs');
  tabs.innerHTML = SCENE_ORDER.map(s => `<button role="tab" data-scene="${s}">${SCENE_LABEL[s]}</button>`).join('');
  tabs.addEventListener('click', e => {
    const b = e.target.closest('[data-scene]');
    if (b) { showScene(b.dataset.scene); viewer.home(false); }
  });

  function showScene(id) {
    if (state.scene === id) return;
    state.scene = id;
    const sc = scenes.map[id];
    root.innerHTML = sc.html;
    viewer.setScene(sc.home, SCENE_ZOOM[id]);
    tabs.querySelectorAll('button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.scene === id)));
    if (state.selected && inScene(id, state.selected)) addCls(state.selected, 'sel');
    if (state.region) highlightRegion(state.region);
    state.hover = null;
    tooltip.hidden = true;
    updateTag();
  }

  function turnAround() {
    const from = state.scene;
    const to = from === 'back' ? 'front' : 'front' === from ? 'back' : 'front';
    if (from !== 'front' && from !== 'back') { showScene('front'); viewer.home(true); return; }
    const vb = Object.assign({}, viewer.vb);
    svg.classList.remove('flip'); void svg.getBoundingClientRect(); svg.classList.add('flip');
    setTimeout(() => {
      showScene(to);
      // mirror the view so you keep looking at the same body part
      viewer.vb = { x: 600 - vb.x - vb.w, y: vb.y, w: vb.w, h: vb.h };
      viewer._apply();
    }, 250);
    setTimeout(() => svg.classList.remove('flip'), 520);
  }

  /* ---------- insets: keep things clear of overlays ---------- */
  function updateInsets() {
    const qb = $('#quizbar');
    let top = tabs.offsetTop + tabs.offsetHeight + 4;
    if (!qb.hidden) top = qb.offsetTop + qb.offsetHeight + 6;
    let bottom = 0;
    if (isMobile()) bottom = panel.classList.contains('open') ? panel.offsetHeight : parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--peek')) || 84;
    wrap.style.setProperty('--sheet-h', bottom + 'px');
    // on phones the zoom buttons sit in a row just above the sheet
    if (isMobile()) bottom += 58;
    viewer.insets = { top, bottom, left: 0, right: isMobile() ? 0 : 64 };
  }

  /* ---------- mobile bottom sheet ---------- */
  function openSheet(open) {
    panel.classList.toggle('open', !!open);
    updateInsets();
  }
  $('#grab').addEventListener('click', () => openSheet(!panel.classList.contains('open')));
  panel.addEventListener('click', e => {
    if (isMobile() && !panel.classList.contains('open') && !e.target.closest('button')) openSheet(true);
  });
  mq.addEventListener('change', updateInsets);

  /* ---------- selection ---------- */
  function zoomToBone(id) {
    const b = bbox(id);
    if (!b) return;
    const big = state.scene === 'front' || state.scene === 'back';
    const size = Math.max(b.w, b.h);
    const ctx = Math.max(size * 2.4, big ? 70 : 40);
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    viewer.fit({ x: cx - ctx / 2, y: cy - ctx / 2, w: ctx, h: ctx }, { pad: 24 });
  }
  function wellVisible(id) {
    const b = bbox(id), v = viewer.visibleBox();
    if (!b) return false;
    const inside = b.x >= v.x && b.y >= v.y && b.x + b.w <= v.x + v.w && b.y + b.h <= v.y + v.h;
    return inside && screenSize(id) >= 30;
  }

  function selectBone(id, opts) {
    opts = opts || {};
    const b = SK.BONE[id];
    if (!b) return;
    let moved = false;
    if (!state.scene || !inScene(state.scene, id)) { showScene(homeScene(id)); viewer.home(false); moved = true; }
    clearCls('sel');
    state.selected = id;
    addCls(id, 'sel');
    markFound(id);
    renderBone(id);
    openSheet(!opts.peek);
    const zoom = opts.zoom || 'auto';
    if (zoom === 'always' || moved || (zoom === 'auto' && !wellVisible(id))) zoomToBone(id);
    updateTag();
    setHash(id);
    if (autoRead && !opts.silent) speakBone(b);
  }
  function deselect() {
    clearCls('sel');
    state.selected = null;
    updateTag();
    setHash('');
  }

  function markFound(id) {
    if (found.has(id)) return;
    found.add(id);
    store.set('bx-found', [...found]);
    renderChips();
    if (found.size === SK.BONES.length) setTimeout(() => { confetti(160); toast('🏆 WOW! You found all 206 bones!'); }, 400);
    else if (found.size % 25 === 0) { confetti(60); toast(`🎉 You have found ${found.size} bones!`); }
  }

  /* floating name tag above the selected bone */
  function updateTag() {
    const id = state.selected;
    if (!id || !inScene(state.scene, id) || state.quiz && !state.quiz.answered) { selTag.hidden = true; return; }
    const b = bbox(id);
    if (!b) { selTag.hidden = true; return; }
    const [x, y] = viewer.toScreen(b.x + b.w / 2, b.y);
    const v = viewer.visibleBox(), sc = viewer.scale;
    const top = (v.y - viewer.vb.y) * sc, bottom = top + v.h * sc;
    if (x < 0 || x > wrap.clientWidth || y < top + 30 || y > bottom) { selTag.hidden = true; return; }
    selTag.textContent = SK.fullName(SK.BONE[id]);
    selTag.style.left = x + 'px';
    selTag.style.top = y + 'px';
    selTag.hidden = false;
  }

  /* ---------- skull shortcut chips ---------- */
  const headChips = $('#head-chips');
  function updateHeadChips() {
    if (state.scene !== 'front' && state.scene !== 'back' || state.quiz) { headChips.hidden = true; return; }
    const v = viewer.visibleBox(), cx = v.x + v.w / 2, cy = v.y + v.h / 2;
    headChips.hidden = !(v.w < 420 && cy < 300 && cx > 180 && cx < 420);
  }
  headChips.addEventListener('click', e => {
    const b = e.target.closest('[data-goto]');
    if (b) { showScene(b.dataset.goto); viewer.home(false); }
  });

  let raf = 0;
  viewer.on('change', () => {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; updateTag(); updateHeadChips(); });
  });

  /* ---------- tap and hover on the drawing ---------- */
  viewer.on('tap', ({ target, x, y }) => {
    const el = target && target.closest ? target.closest('[data-bone]') : null;
    if (!el) return;
    const id = el.dataset.bone;
    const px = screenSize(id);
    if (px < 26) {
      const f = Math.min(80 / Math.max(px, 1), viewer.maxScale / viewer.scale);
      if (f > 1.25) {
        viewer.zoomAt(x, y, f, true);
        toast('🔍 Zooming in! Now tap the bone.');
        return;
      }
    }
    if (state.quiz && !state.quiz.answered) quizAnswer(id);
    else selectBone(id);
  });

  viewer.on('hover', ({ target, x, y }) => {
    const el = target && target.closest ? target.closest('[data-bone]') : null;
    const id = el ? el.dataset.bone : null;
    if (id !== state.hover) {
      clearCls('hover');
      state.hover = id;
      if (id) addCls(id, 'hover');
    }
    if (!id) { tooltip.hidden = true; return; }
    const tiny = screenSize(id) < 26;
    if (state.quiz && !state.quiz.answered) tooltip.innerHTML = tiny ? '🔍 Click to zoom in' : '❓ Is it this one?';
    else tooltip.innerHTML = esc(SK.fullName(SK.BONE[id])) + (tiny ? '<small>🔍 click to zoom in</small>' : '');
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
    tooltip.hidden = false;
  });

  $('#zoom-in').addEventListener('click', () => viewer.zoomCenter(1.8));
  $('#zoom-out').addEventListener('click', () => viewer.zoomCenter(1 / 1.8));
  $('#zoom-home').addEventListener('click', () => viewer.home(true));
  $('#btn-turn').addEventListener('click', turnAround);
  svg.addEventListener('dblclick', e => {
    if (e.target.closest('[data-bone]')) return;
    const r = svg.getBoundingClientRect();
    viewer.zoomAt(e.clientX - r.left, e.clientY - r.top, 2, true);
  });

  /* ---------- region chips ---------- */
  const chipsEl = $('#regions');
  function renderChips() {
    chipsEl.innerHTML = SK.REGIONS.map(r => {
      const all = SK.BONES.filter(b => b.region === r.id);
      const n = all.filter(b => found.has(b.id)).length;
      return `<button class="chip${state.region === r.id ? ' active' : ''}" data-region="${r.id}" style="--c:${r.color}" aria-pressed="${state.region === r.id}">
        <span aria-hidden="true">${r.emoji}</span>${esc(r.name)} <span class="n" title="bones found">${n}/${all.length}</span></button>`;
    }).join('');
  }
  chipsEl.addEventListener('click', e => {
    const b = e.target.closest('[data-region]');
    if (!b) return;
    if (state.quiz && !state.quiz.answered) { toast('🎯 Finish the quiz question first, or tap ✕ to stop the quiz.'); return; }
    const rid = b.dataset.region;
    if (state.region === rid) { clearRegion(); renderWelcome(); openSheet(false); viewer.home(true); }
    else showRegion(rid);
  });

  function regionIds(rid, side) {
    return SK.BONES.filter(b => b.region === rid && (!side || !b.side || b.side === (side === 'r' ? 'right' : 'left'))).map(b => b.id);
  }
  function highlightRegion(rid) {
    clearCls('rhl');
    svg.style.setProperty('--rc', SK.regionOf(rid).color);
    regionIds(rid).forEach(id => addCls(id, 'rhl'));
  }
  function clearRegion() {
    state.region = null;
    clearCls('rhl');
    renderChips();
  }
  function showRegion(rid, side) {
    deselect();
    state.region = rid;
    if (side) state.regionSide = side;
    const rv = REGION_VIEW[rid];
    showScene(rv.scene);
    highlightRegion(rid);
    renderChips();
    renderRegion(rid);
    openSheet(true);
    const ids = regionIds(rid, rv.sided ? state.regionSide : null).filter(id => inScene(state.scene, id));
    const b = bbox(ids);
    if (b) viewer.fit(b, { pad: 30 });
    const chip = chipsEl.querySelector(`[data-region="${rid}"]`);
    if (chip && chip.scrollIntoView) chip.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' });
  }

  /* ---------- panel cards ---------- */
  function progressHtml() {
    const pct = Math.round(found.size / SK.BONES.length * 100);
    return `<div class="progress"><div class="lbl"><span>🏅 Bones you found</span><span>${found.size} / ${SK.BONES.length}</span></div>
      <div class="bar"><i style="width:${pct}%"></i></div></div>`;
  }
  let factIdx = Math.floor(Math.random() * SK.FUN_FACTS.length);
  function renderWelcome() {
    pbody.innerHTML = `<div class="welcome">
      <h2>👋 Hi! Let’s explore your bones!</h2>
      <p>Your body has <b>206 bones</b>. Can you find them all?</p>
      <ul class="steps">
        <li><span class="i">👆</span>Tap a bone to learn all about it</li>
        <li><span class="i">🔍</span>Pinch, scroll or use ＋ to zoom in close</li>
        <li><span class="i">🔄</span>Turn the skeleton around to see its back</li>
        <li><span class="i">🎯</span>Play the quiz to test yourself!</li>
      </ul>
      ${progressHtml()}
      <div class="box fact"><h3>⭐ Did you know?</h3><p id="fact">${esc(SK.FUN_FACTS[factIdx])}</p>
        <button class="more-fact" id="more-fact">Another fact ➜</button></div>
      <div class="btn-row"><button class="big-btn orange" data-act="quiz">🎯 Start the quiz</button></div>
      <p class="copyright">© 2026 Nicolas Nowinski · MIT License</p>
    </div>`;
    pbody.scrollTop = 0;
  }
  pbody.addEventListener('click', e => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.id === 'more-fact') {
      factIdx = (factIdx + 1) % SK.FUN_FACTS.length;
      $('#fact').textContent = SK.FUN_FACTS[factIdx];
      if (autoRead) speak(SK.FUN_FACTS[factIdx]);
      return;
    }
    const act = t.dataset.act;
    if (act === 'quiz') openQuizMenu();
    else if (act === 'close') { deselect(); stopSpeaking(); renderWelcome(); openSheet(false); }
    else if (act === 'close-region') { clearRegion(); renderWelcome(); openSheet(false); }
    else if (act === 'speak') speakBone(SK.BONE[state.selected], t);
    else if (act === 'goto') { const id = state.selected; showScene(t.dataset.scene); viewer.home(false); if (id && inScene(state.scene, id)) { addCls(id, 'sel'); zoomToBone(id); } }
    else if (act === 'bone') selectBone(t.dataset.id, { zoom: 'always' });
    else if (act === 'nav') selectBone(t.dataset.id, { zoom: 'always' });
    else if (act === 'side') showRegion(state.region, t.dataset.side);
    else if (act === 'region') showRegion(t.dataset.region);
  });

  function regionOrder(rid) {
    const all = SK.BONES.filter(b => b.region === rid);
    return all.filter(b => !b.side).concat(all.filter(b => b.side === 'right'), all.filter(b => b.side === 'left')).map(b => b.id);
  }

  function renderBone(id) {
    const b = SK.BONE[id], r = SK.regionOf(b.region);
    const order = regionOrder(b.region), i = order.indexOf(id);
    const prev = order[(i - 1 + order.length) % order.length], next = order[(i + 1) % order.length];
    const gotos = SCENE_ORDER.filter(s => s !== state.scene && inScene(s, id)).map(s => `<button class="goto" data-act="goto" data-scene="${s}">${SCENE_GOTO[s]}</button>`);
    if (b.type === 'temporal' && state.scene !== 'ear') gotos.push(`<button class="goto" data-act="region" data-region="ears">👂 See the tiny bones inside</button>`);
    const sideNote = b.side ? (state.scene === 'back' ? `on your ${b.side} when you look at its back` : state.scene === 'front' ? `on your ${b.side === 'left' ? 'right' : 'left'} when it faces you` : '') : '';
    pbody.innerHTML = `<article class="bone-card">
      <div class="card-head"><h2 class="bone-title">${esc(b.name)}</h2><button class="close-x" data-act="close" aria-label="Close">✕</button></div>
      <div class="card-head">
        <button class="tag" style="--c:${r.color}" data-act="region" data-region="${r.id}">${r.emoji} ${esc(r.name)}</button>
        ${b.side ? `<span class="tag side" title="${esc(sideNote)}">${b.side === 'left' ? '⬅️' : '➡️'} ${cap(b.side)} side</span>` : ''}
        ${found.size ? `<span class="tag side">🏅 ${found.size}/206 found</span>` : ''}
      </div>
      <div class="sci">Real name: <b>${esc(b.sci)}</b> <span class="say" title="How to say it">say: ${esc(b.say)}</span></div>
      ${canSpeak ? '<button class="speak-btn" data-act="speak">🔊 Read it to me</button>' : ''}
      <div class="box what"><h3>🧐 What does it do?</h3><p>${esc(b.about)}</p></div>
      <div class="box fact"><h3>⭐ Fun fact!</h3><p>${esc(b.fact)}</p></div>
      ${b.tryit ? `<div class="box try"><h3>🙌 Try it!</h3><p>${esc(b.tryit)}</p></div>` : ''}
      ${sideNote ? `<p class="muted small">👀 This is the skeleton’s <b>${b.side}</b> ${esc(b.name.toLowerCase())}. It is ${esc(sideNote)}.</p>` : ''}
      ${gotos.length ? `<div class="goto-row">${gotos.join('')}</div>` : ''}
      <div class="nav-row">
        <button data-act="nav" data-id="${prev}" aria-label="Previous bone">◀</button>
        <span class="where">${r.emoji} ${esc(r.name)} · ${i + 1} of ${order.length}</span>
        <button data-act="nav" data-id="${next}" aria-label="Next bone">▶</button>
      </div>
    </article>`;
    pbody.scrollTop = 0;
  }

  function renderRegion(rid) {
    const r = SK.regionOf(rid), rv = REGION_VIEW[rid];
    const all = SK.BONES.filter(b => b.region === rid);
    const paired = all.some(b => b.side);
    const side = state.regionSide;
    const shown = paired ? all.filter(b => !b.side || b.side === (side === 'r' ? 'right' : 'left')) : all;
    const n = all.filter(b => found.has(b.id)).length;
    pbody.innerHTML = `<section class="region-card">
      <div class="card-head"><h2>${r.emoji} ${esc(r.name)}</h2><button class="close-x" data-act="close-region" aria-label="Close">✕</button></div>
      <p>${esc(r.blurb)}</p>
      <p><b>${all.length} bones</b> · you found <b>${n}</b> ${n === all.length ? '🏆' : ''}</p>
      ${paired ? `<div class="side-switch" role="group" aria-label="Side">
        <button data-act="side" data-side="r" aria-pressed="${side === 'r'}">Right ${rv.sided ? (rid === 'hands' ? 'hand' : 'foot') : 'side'}</button>
        <button data-act="side" data-side="l" aria-pressed="${side === 'l'}">Left ${rv.sided ? (rid === 'hands' ? 'hand' : 'foot') : 'side'}</button></div>` : ''}
      <div class="bone-grid">${shown.map(b => `<button data-act="bone" data-id="${b.id}" class="${found.has(b.id) ? 'found' : ''}">
        <span class="ck">${found.has(b.id) ? '✓' : ''}</span><span>${esc(b.name)}<small>${esc(b.sci)}</small></span></button>`).join('')}</div>
    </section>`;
    pbody.scrollTop = 0;
  }
  function cap(s) { return s[0].toUpperCase() + s.slice(1); }

  /* ---------- toast + confetti ---------- */
  let toastTimer = 0;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }
  function confetti(n) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const box = $('#confetti'), colors = ['#ff7a59', '#ffd166', '#4cc9f0', '#22b573', '#c77dff', '#f94144'];
    for (let i = 0; i < (n || 70); i++) {
      const c = document.createElement('i');
      c.style.left = Math.random() * 100 + 'vw';
      c.style.background = colors[i % colors.length];
      c.style.setProperty('--dx', (Math.random() * 200 - 100) + 'px');
      c.style.setProperty('--r', (Math.random() * 900 - 450) + 'deg');
      c.style.animationDuration = (1.4 + Math.random() * 1.6) + 's';
      c.style.animationDelay = Math.random() * 0.3 + 's';
      box.appendChild(c);
      setTimeout(() => c.remove(), 3600);
    }
  }

  /* ---------- speech ---------- */
  const canSpeak = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  let voice = null, speakingBtn = null;
  function pickVoice() {
    const vs = speechSynthesis.getVoices();
    voice = vs.find(v => /^en[-_]US/i.test(v.lang) && /Samantha|Google US English|Jenny|Aria|Ava|Zira/i.test(v.name))
      || vs.find(v => /^en[-_]US/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang)) || null;
  }
  if (canSpeak) { pickVoice(); speechSynthesis.addEventListener && speechSynthesis.addEventListener('voiceschanged', pickVoice); }
  function stopSpeaking() {
    if (!canSpeak) return;
    speechSynthesis.cancel();
    if (speakingBtn) { speakingBtn.classList.remove('speaking'); speakingBtn.textContent = '🔊 Read it to me'; speakingBtn = null; }
  }
  function speak(text, btn) {
    if (!canSpeak) return;
    stopSpeaking();
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.rate = 0.92; u.pitch = 1.08;
    if (btn) {
      speakingBtn = btn; btn.classList.add('speaking'); btn.textContent = '⏹ Stop reading';
      u.onend = u.onerror = () => { if (speakingBtn === btn) { btn.classList.remove('speaking'); btn.textContent = '🔊 Read it to me'; speakingBtn = null; } };
    }
    speechSynthesis.speak(u);
  }
  function speakBone(b, btn) {
    if (!b) return;
    if (btn && btn.classList.contains('speaking')) { stopSpeaking(); return; }
    speak(`${b.name}. Its real name is ${b.sci}. ${b.about} Fun fact! ${b.fact}${b.tryit ? ' Try it! ' + b.tryit : ''}`, btn || pbody.querySelector('.speak-btn'));
  }
  const soundBtn = $('#btn-sound');
  function renderSound() {
    soundBtn.setAttribute('aria-pressed', String(autoRead));
    soundBtn.textContent = autoRead ? '🔊' : '🔇';
    soundBtn.title = autoRead ? 'Reading out loud is ON' : 'Reading out loud is OFF';
  }
  if (!canSpeak) { soundBtn.hidden = true; $('#quiz-say').hidden = true; }
  soundBtn.addEventListener('click', () => {
    autoRead = !autoRead;
    store.set('bx-autoread', autoRead);
    renderSound();
    if (autoRead) speak('Okay! I will read things out loud for you.');
    else stopSpeaking();
    toast(autoRead ? '🔊 I will read bones out loud' : '🔇 Reading out loud is off');
  });

  /* ---------- search ---------- */
  const sInput = $('#search'), sList = $('#search-results');
  let results = [], active = 0;
  function searchBones(q) {
    const words = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    const ql = q.toLowerCase().trim();
    const out = [];
    for (const [i, b] of SK.BONES.entries()) {
      const r = SK.regionOf(b.region);
      const hay = `${b.name} ${b.sci} ${r.name} ${b.side || ''} ${b.type}`.toLowerCase();
      if (!words.every(w => hay.includes(w))) continue;
      const n = b.name.toLowerCase(), s = b.sci.toLowerCase();
      const score = n.startsWith(ql) || s.startsWith(ql) ? 0 : n.includes(ql) || s.includes(ql) ? 1 : 2;
      out.push({ b, score, i });
    }
    out.sort((a, c) => a.score - c.score || a.i - c.i);
    return out.slice(0, 10).map(o => o.b);
  }
  function renderResults() {
    const q = sInput.value;
    results = searchBones(q);
    active = 0;
    if (!q.trim()) { sList.hidden = true; sInput.setAttribute('aria-expanded', 'false'); return; }
    sList.innerHTML = results.length ? results.map((b, i) => `<li role="option" id="sr-${i}" data-id="${b.id}" aria-selected="${i === active}">
      <span class="em">${SK.regionOf(b.region).emoji}</span><span><span class="nm">${esc(SK.fullName(b))}</span><br><span class="sc">${esc(b.sci)}</span></span></li>`).join('')
      : `<li class="none">No bones called that. Try “skull”, “rib” or “toe”!</li>`;
    sList.hidden = false;
    sInput.setAttribute('aria-expanded', 'true');
  }
  function pickResult(id) {
    sList.hidden = true;
    sInput.value = '';
    sInput.blur();
    document.body.classList.remove('searching');
    if (state.quiz) stopQuiz();
    clearRegion();
    selectBone(id, { zoom: 'always' });
  }
  sInput.addEventListener('input', renderResults);
  sInput.addEventListener('focus', renderResults);
  sInput.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!results.length) return;
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length;
      sList.querySelectorAll('li').forEach((li, i) => li.setAttribute('aria-selected', String(i === active)));
      sInput.setAttribute('aria-activedescendant', 'sr-' + active);
    } else if (e.key === 'Enter') {
      if (results[active]) pickResult(results[active].id);
    } else if (e.key === 'Escape') {
      sInput.value = ''; renderResults(); sInput.blur(); document.body.classList.remove('searching');
    }
  });
  sList.addEventListener('pointerdown', e => {
    const li = e.target.closest('[data-id]');
    if (li) { e.preventDefault(); pickResult(li.dataset.id); }
  });
  sInput.addEventListener('blur', () => setTimeout(() => { sList.hidden = true; }, 150));
  $('#btn-search').addEventListener('click', () => {
    const on = !document.body.classList.contains('searching');
    document.body.classList.toggle('searching', on);
    if (on) sInput.focus();
  });

  /* ---------- quiz ---------- */
  const LEVELS = {
    easy: { emoji: '🐣', name: 'Easy', desc: 'Big, famous bones. Either side counts!', max: 1, exact: false },
    medium: { emoji: '🦊', name: 'Medium', desc: 'Skull, wrist, ankle and more. Either side counts!', max: 2, exact: false },
    expert: { emoji: '🦉', name: 'Expert', desc: 'Any of the 206 bones, and the side matters!', max: 3, exact: true }
  };
  const QUESTIONS = 10;
  const modal = $('#modal'), mcard = $('#modal-card');
  function openModal(html) { mcard.innerHTML = html; modal.hidden = false; const f = mcard.querySelector('button'); if (f) f.focus(); }
  function closeModal() { modal.hidden = true; }
  modal.addEventListener('click', e => {
    if (e.target === modal) { closeModal(); return; }
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.level) startQuiz(t.dataset.level);
    else if (t.dataset.act === 'menu') openQuizMenu();
    else if (t.dataset.act === 'explore') { closeModal(); renderWelcome(); }
    else closeModal();
  });
  function openQuizMenu() {
    openModal(`<div class="em">🎯</div><h2>Bone Quiz!</h2><p>I will name a bone. You find it and tap it on the skeleton!</p>
      <div class="levels">${Object.entries(LEVELS).map(([k, l]) => `<button data-level="${k}"><span class="e">${l.emoji}</span><span><b>${l.name}</b><small>${l.desc}</small></span></button>`).join('')}</div>
      <button class="link-btn" data-act="cancel">Maybe later</button>`);
  }
  $('#btn-quiz').addEventListener('click', () => { if (state.quiz) toast('🎯 You are already playing! Tap ✕ on the quiz to stop.'); else openQuizMenu(); });

  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function startQuiz(level) {
    closeModal();
    const L = LEVELS[level];
    let pool;
    if (L.exact) pool = SK.BONES.slice();
    else {
      const seen = new Set();
      pool = SK.BONES.filter(b => b.level <= L.max && !seen.has(b.type) && seen.add(b.type));
    }
    state.quiz = { level, L, items: shuffle(pool).slice(0, QUESTIONS), i: 0, score: 0, tries: 0, answered: false };
    deselect(); clearRegion();
    showScene('front');
    $('#quizbar').hidden = false;
    openSheet(false);
    updateInsets();
    viewer.home(true);
    askQuestion();
  }
  function questionText(q) {
    const L = state.quiz.L;
    return L.exact && q.side ? `Can you find the <u>${q.side.toUpperCase()}</u> ${esc(q.name.toLowerCase())}?` : `Can you find the ${esc(q.name.toLowerCase())}?`;
  }
  function askQuestion() {
    const z = state.quiz, q = z.items[z.i];
    z.tries = 0; z.answered = false;
    $('#quiz-count').textContent = `Question ${z.i + 1} of ${z.items.length}`;
    $('#quiz-score').textContent = `⭐ ${z.score}`;
    $('#quiz-q').innerHTML = `${questionText(q)}<small>Real name: ${esc(q.sci)}</small>`;
    setQuizMsg('', '');
    $('#quiz-next').hidden = true; $('#quiz-hint').hidden = false; $('#quiz-skip').hidden = false;
    deselect(); clearCls('rhl');
    pbody.innerHTML = `<div class="welcome"><h2>🎯 Quiz time!</h2>
      <p>Find the bone and tap it. You get <b>3 stars</b> if you find it on the first try!</p>
      <ul class="steps">
        <li><span class="i">🔍</span>Small bones? Zoom in first.</li>
        <li><span class="i">🔄</span>Some bones are easier to see from the back, or in the close-up views at the top.</li>
        ${z.L.exact ? '<li><span class="i">🪞</span>When the skeleton faces you, its LEFT side is on YOUR right!</li>' : ''}
        <li><span class="i">💡</span>Stuck? Tap Hint.</li>
      </ul></div>`;
    updateInsets();
    if (state.scene) viewer.home(true);
    if (autoRead) speak(`${questionText(q).replace(/<[^>]+>/g, '')}`);
  }
  function setQuizMsg(text, cls) { const m = $('#quiz-msg'); m.textContent = text; m.className = 'quiz-msg ' + (cls || ''); }
  function isRight(id) {
    const z = state.quiz, q = z.items[z.i], b = SK.BONE[id];
    return z.L.exact ? id === q.id : b.type === q.type;
  }
  function quizAnswer(id) {
    const z = state.quiz, b = SK.BONE[id];
    if (isRight(id)) {
      const pts = z.tries === 0 ? 3 : z.tries === 1 ? 2 : 1;
      z.score += pts;
      z.answered = true;
      $('#quiz-score').textContent = `⭐ ${z.score}`;
      setQuizMsg(`🎉 Yes! That’s the ${b.name.toLowerCase()}! +${pts} ⭐`, 'good');
      flash(id, 'good');
      confetti(50);
      if (autoRead) speak(`Yes! That's the ${b.name}!`);
      afterAnswer(id);
    } else {
      z.tries++;
      flash(id, 'bad');
      setQuizMsg(`Oops! That’s the ${SK.fullName(b).toLowerCase()}. Try again!`, 'bad');
      if (z.tries === 2) quizHint(true);
      else if (z.tries >= 4) quizReveal();
    }
  }
  function afterAnswer(id) {
    $('#quiz-next').hidden = false; $('#quiz-hint').hidden = true; $('#quiz-skip').hidden = true;
    clearCls('rhl');
    // on phones keep the sheet small so the answer stays visible under the quiz card
    selectBone(id, { zoom: 'auto', silent: true, peek: isMobile() });
    updateInsets();
  }
  function quizTarget() {
    const z = state.quiz, q = z.items[z.i];
    if (z.L.exact) return q.id;
    // any bone of this type; prefer one in the current scene
    const ids = SK.BONES.filter(b => b.type === q.type).map(b => b.id);
    return ids.find(id => inScene(state.scene, id)) || ids[0];
  }
  function quizHint(auto) {
    const z = state.quiz;
    const id = quizTarget(), b = SK.BONE[id];
    if (!inScene(state.scene, id)) { showScene(homeScene(id)); viewer.home(false); }
    // glow the body part where the bone lives
    svg.style.setProperty('--rc', SK.regionOf(b.region).color);
    clearCls('rhl');
    const sideIds = SK.BONES.filter(x => x.region === b.region && (!x.side || !b.side || x.side === b.side)).map(x => x.id).filter(x => inScene(state.scene, x));
    sideIds.forEach(x => addCls(x, 'rhl'));
    const bb = bbox(sideIds);
    if (bb) viewer.fit(bb, { pad: 30 });
    setQuizMsg(`💡 Hint: it is somewhere in the ${SK.regionOf(b.region).name.toLowerCase()}${b.side && z.L.exact ? ` on its ${b.side} side` : ''}!`, '');
    z.tries = Math.max(z.tries, 2);
  }
  function quizReveal() {
    const z = state.quiz, id = quizTarget(), b = SK.BONE[id];
    z.answered = true;
    setQuizMsg(`Here it is! This is the ${b.name.toLowerCase()}.`, '');
    afterAnswer(id);
    zoomToBone(id);
    els(id).forEach(e => e.classList.add('found-pulse'));
    setTimeout(() => els(id).forEach(e => e.classList.remove('found-pulse')), 2100);
  }
  function nextQuestion() {
    const z = state.quiz;
    z.i++;
    if (z.i >= z.items.length) endQuiz();
    else askQuestion();
  }
  function endQuiz() {
    const z = state.quiz, max = z.items.length * 3;
    const pct = z.score / max, stars = pct >= 0.8 ? 3 : pct >= 0.5 ? 2 : 1;
    const msg = stars === 3 ? 'Bone-tastic! You are a skeleton expert!' : stars === 2 ? 'Great job! You know lots of bones!' : 'Nice try! Every bone you find makes you smarter!';
    const level = z.level;
    stopQuiz();
    if (stars === 3) confetti(140);
    openModal(`<div class="em">${stars === 3 ? '🏆' : stars === 2 ? '🎉' : '💪'}</div><h2>${msg}</h2>
      <div class="stars">${'⭐'.repeat(stars)}${'<span style="opacity:.25">⭐</span>'.repeat(3 - stars)}</div>
      <p>You scored <b>${z.score}</b> out of <b>${max}</b> stars.</p>
      <div class="btn-row" style="justify-content:center"><button class="big-btn orange" data-level="${level}">🔁 Play again</button>
      <button class="big-btn" data-act="menu">Pick a level</button></div>
      <button class="link-btn" data-act="explore">Back to exploring</button>`);
    if (autoRead) speak(`${msg} You scored ${z.score} out of ${max} stars.`);
  }
  function stopQuiz() {
    state.quiz = null;
    $('#quizbar').hidden = true;
    clearCls('rhl');
    updateInsets();
    updateHeadChips();
    if (!state.selected) renderWelcome();
  }
  $('#quiz-next').addEventListener('click', nextQuestion);
  $('#quiz-skip').addEventListener('click', () => { if (state.quiz && !state.quiz.answered) { state.quiz.tries = 99; quizReveal(); setQuizMsg('Skipped! Here is where it is.', ''); } });
  $('#quiz-hint').addEventListener('click', () => { if (state.quiz && !state.quiz.answered) quizHint(false); });
  $('#quiz-stop').addEventListener('click', () => { stopQuiz(); deselect(); renderWelcome(); });
  $('#quiz-say').addEventListener('click', () => { if (state.quiz) speak(questionText(state.quiz.items[state.quiz.i]).replace(/<[^>]+>/g, '')); });

  /* ---------- keyboard ---------- */
  document.addEventListener('keydown', e => {
    if (e.target.matches('input, textarea')) return;
    if (e.key === '/') { e.preventDefault(); if (isMobile()) document.body.classList.add('searching'); sInput.focus(); }
    else if (e.key === 'Escape') { if (!modal.hidden) closeModal(); else if (state.selected) { deselect(); renderWelcome(); openSheet(false); } }
    else if (!modal.hidden) return;
    else if (e.key === '+' || e.key === '=') viewer.zoomCenter(1.5);
    else if (e.key === '-' || e.key === '_') viewer.zoomCenter(1 / 1.5);
    else if (e.key === '0') viewer.home(true);
    else if (e.key.startsWith('Arrow')) {
      e.preventDefault();
      const d = 60, m = { ArrowLeft: [d, 0], ArrowRight: [-d, 0], ArrowUp: [0, d], ArrowDown: [0, -d] }[e.key];
      viewer.panBy(m[0], m[1]);
    }
  });

  /* ---------- deep links: index.html#femur-l ---------- */
  function setHash(id) {
    try { history.replaceState(null, '', id ? '#' + id : location.pathname + location.search); } catch (e) { /* file:// in some browsers */ }
  }
  $('#brand').addEventListener('click', e => {
    e.preventDefault();
    if (state.quiz) stopQuiz();
    deselect(); clearRegion(); renderWelcome(); openSheet(false);
    showScene('front'); viewer.home(true);
  });

  /* ---------- start ---------- */
  renderChips();
  renderSound();
  renderWelcome();
  showScene('front');
  updateInsets();
  viewer.home(false);
  const start = decodeURIComponent(location.hash.slice(1));
  if (SK.BONE[start]) setTimeout(() => selectBone(start, { zoom: 'always', silent: true }), 50);
  window.addEventListener('resize', () => { updateInsets(); });
})(window.SK);
