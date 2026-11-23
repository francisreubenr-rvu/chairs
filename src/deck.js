(function () {
  const slides = Array.from(document.querySelectorAll('.slide'));
  const total = slides.length;
  let current = 0;

  const progressFill = document.getElementById('progress-fill');
  const counter = document.querySelector('#meta-bar .current');
  const moduleChip = document.getElementById('day-chip');
  const paceChip = document.getElementById('pace-chip');
  const totalLabel = document.querySelector('#meta-bar span:last-child');
  const srStatus = document.getElementById('sr-status');
  const indexEl = document.getElementById('module-index');
  const indexList = document.getElementById('idx-list');
  const indexToggle = document.getElementById('index-toggle');
  const overviewEl = document.getElementById('overview');
  const overviewGrid = document.getElementById('ov-grid');
  const overviewToggle = document.getElementById('overview-toggle');
  const ovVisitedEl = document.getElementById('ov-visited');
  const ovTotalEl = document.getElementById('ov-total');
  const helpEl = document.getElementById('help-panel');

  const moduleLabels = {
    '0': 'Orientation',
    '1': 'Module 1 · Rules of Procedure',
    '2': 'Module 2 · Communication',
    '3': 'Module 3 · Design Thinking',
    '4': 'Module 4 · Entrepreneurship',
    '5': 'Module 5 · Major Events',
    '6': 'Module 6 · Company Portfolio',
    '7': 'Module 7 · Portfolio Library',
    '8': 'Close'
  };
  const moduleShort = {
    '0': 'Orientation',
    '1': 'Rules of Procedure',
    '2': 'Effective Communication',
    '3': 'Design Thinking',
    '4': 'Entrepreneurship & Innovation',
    '5': 'Major Events That Changed the World',
    '6': 'Company Portfolio Track',
    '7': 'Portfolio Library',
    '8': 'Close'
  };
  const moduleSources = {
    '0': 'Programme framing and how to read this deck',
    '1': 'Rules of Procedure.pdf · p.1–13 + Conference Prep p.6–9',
    '2': 'Communication.pdf · p.1–5',
    '3': 'Design Thinking.pdf · p.1–5',
    '4': 'Entrepreneurship & Innovation.pdf · p.1–6',
    '5': 'Major Events that Changes the World.pdf · p.1–3',
    '6': 'company-portfolio-prep-track.md · §1–§7 + Portfolio Prep p.1–2 + Research Sources p.1–4',
    '7': 'Research Sources p.1–4 · Portfolio Prep Guide p.1–2',
    '8': 'Synthesis and source map'
  };

  if (totalLabel) totalLabel.textContent = '/ ' + String(total).padStart(2, '0');
  if (ovTotalEl) ovTotalEl.textContent = String(total);

  function slideTitle(el) {
    const h = el.querySelector('h1');
    return h ? h.textContent.trim() : 'Slide';
  }

  /* ---- Visited-slide tracking: a bit string, one char per slide ---- */
  let visited = storageGet('dg-visited') || '';
  if (visited.length !== total) visited = '';
  function visitedAt(i) { return visited.charAt(i) === '1'; }
  function markVisited(i) {
    if (visitedAt(i)) return;
    const a = visited.split('');
    while (a.length < total) a.push('0');
    a[i] = '1';
    visited = a.join('');
    storageSet('dg-visited', visited);
  }
  function visitedRange(start, count) {
    let n = 0;
    for (let i = start; i < start + count; i++) if (visitedAt(i)) n++;
    return n;
  }
  function visitedTotal() { return visitedRange(0, total); }

  /* ---- Build the module index from the slides themselves ---- */
  const moduleStarts = [];
  slides.forEach((s, i) => {
    const m = s.dataset.module;
    if (!moduleStarts.length || moduleStarts[moduleStarts.length - 1].mod !== m) {
      moduleStarts.push({ mod: m, index: i, count: 1 });
    } else {
      moduleStarts[moduleStarts.length - 1].count++;
    }
  });

  const idxProgress = {};
  moduleStarts.forEach(function (m) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'idx-item';
    btn.innerHTML =
      '<span class="idx-n">' + (m.mod === '0' || m.mod === '8' ? moduleShort[m.mod] : 'Module ' + m.mod) +
      ' · slides ' + (m.index + 1) + '–' + (m.index + m.count) + '</span>' +
      '<span class="idx-t"></span>' +
      '<span class="idx-s"></span>' +
      '<span class="idx-p"></span>';
    btn.querySelector('.idx-t').textContent = moduleShort[m.mod] || 'Module ' + m.mod;
    btn.querySelector('.idx-s').textContent = moduleSources[m.mod] || '';
    idxProgress[m.mod] = btn.querySelector('.idx-p');
    btn.addEventListener('click', function () {
      current = m.index;
      closeIndex();
      render();
    });
    li.appendChild(btn);
    indexList.appendChild(li);
  });

  function refreshIndexProgress() {
    moduleStarts.forEach(function (m) {
      const el = idxProgress[m.mod];
      if (!el) return;
      const v = visitedRange(m.index, m.count);
      el.textContent = v + ' / ' + m.count + ' visited';
      el.classList.toggle('done', v === m.count);
    });
  }

  function openIndex() {
    refreshIndexProgress();
    indexEl.classList.add('open');
    indexEl.setAttribute('aria-hidden', 'false');
    indexToggle.setAttribute('aria-expanded', 'true');
    const first = indexList.querySelector('button');
    if (first) first.focus();
  }
  function closeIndex() {
    indexEl.classList.remove('open');
    indexEl.setAttribute('aria-hidden', 'true');
    indexToggle.setAttribute('aria-expanded', 'false');
  }
  function toggleIndex() {
    if (indexEl.classList.contains('open')) closeIndex(); else openIndex();
  }
  indexToggle.addEventListener('click', function () {
    closeOtherPanels('index');
    toggleIndex();
    sfx(indexEl.classList.contains('open') ? 'open' : 'close');
  });
  indexEl.addEventListener('click', function (e) {
    if (e.target === indexEl) closeIndex();
  });


  /* ============================================================
     OVERVIEW · GRID NAVIGATOR
     Live clones of every slide scaled down from the real canvas,
     grouped by module. Built lazily on first open, rebuilt when
     the frame aspect changes so previews always match the deck.
     ============================================================ */
  let ovBuilt = false;
  let ovDirty = false;
  let ovThumbs = [];

  function buildOverview() {
    overviewGrid.textContent = '';
    ovThumbs = new Array(total).fill(null);
    moduleStarts.forEach(function (m) {
      const sec = document.createElement('section');
      sec.className = 'ov-mod';
      const head = document.createElement('div');
      head.className = 'ov-mod-head';
      const n = document.createElement('span');
      n.className = 'ov-mod-n';
      n.textContent = (m.mod === '0' || m.mod === '8') ? moduleShort[m.mod] : 'Module ' + m.mod;
      const t = document.createElement('span');
      t.className = 'ov-mod-t';
      t.textContent = moduleShort[m.mod] || ('Module ' + m.mod);
      const p = document.createElement('span');
      p.className = 'ov-mod-p';
      p.dataset.start = String(m.index);
      p.dataset.count = String(m.count);
      head.appendChild(n);
      head.appendChild(t);
      head.appendChild(p);
      sec.appendChild(head);

      const grid = document.createElement('div');
      grid.className = 'ov-thumbs';
      for (let i = m.index; i < m.index + m.count; i++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ov-thumb';
        btn.dataset.i = String(i);
        btn.setAttribute('aria-label', 'Slide ' + (i + 1) + ': ' + slideTitle(slides[i]));

        const frame = document.createElement('span');
        frame.className = 'ov-frame';
        const canvas = document.createElement('span');
        canvas.className = 'ov-canvas';
        const clone = slides[i].cloneNode(true);
        clone.classList.remove('active');
        clone.setAttribute('aria-hidden', 'true');
        clone.querySelectorAll('[id]').forEach(function (el) { el.removeAttribute('id'); });
        canvas.appendChild(clone);
        frame.appendChild(canvas);

        const cap = document.createElement('span');
        cap.className = 'ov-cap';
        const num = document.createElement('span');
        num.className = 'ov-n';
        num.textContent = String(i + 1).padStart(2, '0');
        const ttl = document.createElement('span');
        ttl.className = 'ov-t';
        ttl.textContent = slideTitle(slides[i]);
        const dot = document.createElement('span');
        dot.className = 'ov-visit';
        cap.appendChild(num);
        cap.appendChild(ttl);
        cap.appendChild(dot);

        btn.appendChild(frame);
        btn.appendChild(cap);
        btn.addEventListener('click', function () {
          closeOverview();
          goTo(i, false);
          sfx('open');
        });
        grid.appendChild(btn);
        ovThumbs[i] = btn;
      }
      sec.appendChild(grid);
      overviewGrid.appendChild(sec);
    });
    ovBuilt = true;
    ovDirty = false;
    sizeOverview();
    refreshOverviewMarks();
  }

  function sizeOverview() {
    if (!ovBuilt) return;
    const frame = overviewGrid.querySelector('.ov-frame');
    if (!frame) return;
    const k = frame.clientWidth / CANVAS_W;
    overviewGrid.style.setProperty('--ov-k', String(Math.floor(k * 10000) / 10000));
  }

  function refreshOverviewMarks() {
    if (!ovBuilt) return;
    ovThumbs.forEach(function (btn, i) {
      if (!btn) return;
      btn.classList.toggle('visited', visitedAt(i));
      if (i === current) btn.setAttribute('aria-current', 'true');
      else btn.removeAttribute('aria-current');
    });
    overviewGrid.querySelectorAll('.ov-mod-p').forEach(function (p) {
      const s = parseInt(p.dataset.start, 10);
      const c = parseInt(p.dataset.count, 10);
      const v = visitedRange(s, c);
      p.textContent = v + ' / ' + c + ' visited';
      p.classList.toggle('done', v === c);
    });
    if (ovVisitedEl) ovVisitedEl.textContent = String(visitedTotal());
  }

  function openOverview() {
    if (!ovBuilt || ovDirty) buildOverview();
    refreshOverviewMarks();
    overviewEl.classList.add('open');
    overviewEl.setAttribute('aria-hidden', 'false');
    overviewToggle.setAttribute('aria-expanded', 'true');
    sizeOverview();
    const mark = ovThumbs[current];
    if (mark) {
      mark.focus();
      mark.scrollIntoView({ block: 'center' });
    }
  }
  function closeOverview() {
    overviewEl.classList.remove('open');
    overviewEl.setAttribute('aria-hidden', 'true');
    overviewToggle.setAttribute('aria-expanded', 'false');
  }
  function toggleOverview() {
    if (overviewEl.classList.contains('open')) closeOverview();
    else { closeOtherPanels('overview'); openOverview(); }
  }
  overviewToggle.addEventListener('click', function () {
    toggleOverview();
    sfx(overviewEl.classList.contains('open') ? 'open' : 'close');
  });
  overviewEl.addEventListener('click', function (e) {
    if (e.target === overviewEl) closeOverview();
  });

  /* Roving focus across the grid: left/right one slide, up/down one row */
  function overviewKeyNav(e) {
    const btns = ovThumbs.filter(Boolean);
    if (!btns.length) return;
    let idx = btns.indexOf(document.activeElement);
    if (idx === -1) idx = btns.findIndex(function (b) { return b.dataset.i === String(current); });
    if (idx === -1) idx = 0;
    let cols = 1;
    if (btns.length > 1) {
      const top0 = btns[0].getBoundingClientRect().top;
      while (cols < btns.length && btns[cols].getBoundingClientRect().top === top0) cols++;
    }
    let next = idx;
    if (e.key === 'ArrowRight') next = Math.min(idx + 1, btns.length - 1);
    else if (e.key === 'ArrowLeft') next = Math.max(idx - 1, 0);
    else if (e.key === 'ArrowDown') next = Math.min(idx + cols, btns.length - 1);
    else if (e.key === 'ArrowUp') next = Math.max(idx - cols, 0);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = btns.length - 1;
    else return;
    e.preventDefault();
    btns[next].focus();
    btns[next].scrollIntoView({ block: 'nearest' });
  }


  /* ============================================================
     HELP · KEYBOARD REFERENCE
     ============================================================ */
  function openHelp() {
    helpEl.classList.add('open');
    helpEl.setAttribute('aria-hidden', 'false');
  }
  function closeHelp() {
    helpEl.classList.remove('open');
    helpEl.setAttribute('aria-hidden', 'true');
  }
  function toggleHelp() {
    if (helpEl.classList.contains('open')) closeHelp();
    else { closeOtherPanels('help'); openHelp(); }
  }
  helpEl.addEventListener('click', function (e) {
    if (e.target === helpEl) closeHelp();
  });


  /* ============================================================
     PRINT · STUDY NOTES
     ============================================================ */
  function printDeck() {
    closeOtherPanels(null);
    window.setTimeout(function () { window.print(); }, 80);
  }
  const ovPrintBtn = document.getElementById('ov-print');
  if (ovPrintBtn) ovPrintBtn.addEventListener('click', printDeck);


  /* One helper keeps the five panels mutually exclusive */
  function closeOtherPanels(keep) {
    if (keep !== 'index' && indexEl.classList.contains('open')) closeIndex();
    if (keep !== 'theme' && themePanel.classList.contains('open')) closeTheme();
    if (keep !== 'search' && searchPanel.classList.contains('open')) closeSearch();
    if (keep !== 'overview' && overviewEl.classList.contains('open')) closeOverview();
    if (keep !== 'help' && helpEl.classList.contains('open')) closeHelp();
  }


  /* ============================================================
     THEMES
     ============================================================ */
  const THEMES = [
    { id:'',               name:'Editorial',      desc:'Warm paper stock, ink brown, crimson accent. The default.',
      sw:['#EEE9DD','#FBF8F2','#38271B','#8E2230'] },
    { id:'neobrutalism',   name:'Neobrutalism',   desc:'White field, hard black rules, offset shadows, vivid red and yellow.',
      sw:['#FAF7F0','#FFFFFF','#0A0A0A','#D62828'] },
    { id:'maxbrutalism',   name:'Maxbrutalism',   desc:'Raw concrete, black slabs, safety orange, uppercase headings.',
      sw:['#CFCAC0','#F0EDE6','#000000','#D93A00'] },
    { id:'claymorphism',   name:'Claymorphism',   desc:'Soft sand and terracotta, deep rounding, low-glare shadows.',
      sw:['#EFE4DA','#FBF5F0','#33241B','#C0492B'] },
    { id:'glassmorphism',  name:'Glassmorphism',  desc:'Frosted panels over an amber-to-blue wash, dark slate text.',
      sw:['#E8EEF5','#FFFFFF','#12212E','#0B5FA5'] },
    { id:'blueprint',      name:'Blueprint',      desc:'Drafting table. Deep navy field, cyan rules, technical grid.',
      sw:['#0C2233','#123049','#EAF4FB','#5CC8F5'] },
    { id:'risograph',      name:'Risograph',      desc:'Newsprint stock, fluorescent pink and riso blue, halftone dots.',
      sw:['#F4EFE2','#FBF8F0','#1A1A1A','#E8384F'] }
  ];

  const themePanel = document.getElementById('theme-panel');
  const themeList = document.getElementById('th-list');
  const themeToggle = document.getElementById('theme-toggle');
  const soundToggle = document.getElementById('sound-toggle');

  function storageGet(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }
  function storageSet(k,v){ try { localStorage.setItem(k,v); } catch(e){} }

  let currentTheme = storageGet('dg-theme') || '';
  if (!THEMES.some(t => t.id === currentTheme)) currentTheme = '';

  function applyTheme(id, announce) {
    currentTheme = id;
    const root = document.documentElement;
    root.classList.add('theming');
    if (id) root.setAttribute('data-theme', id);
    else root.removeAttribute('data-theme');
    storageSet('dg-theme', id);
    themeList.querySelectorAll('button.th-item').forEach(b =>
      b.setAttribute('aria-current', b.dataset.theme === id ? 'true' : 'false'));
    window.setTimeout(() => root.classList.remove('theming'), 450);
    if (announce && srStatus) {
      const t = THEMES.find(x => x.id === id);
      srStatus.textContent = 'Theme: ' + (t ? t.name : 'Editorial');
    }
  }

  THEMES.forEach(function (t, i) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'th-item';
    btn.dataset.theme = t.id;
    btn.innerHTML = '<span class="th-n"></span><span class="th-t"></span><span class="th-s"></span>' +
                    '<span class="th-sw">' + t.sw.map(c => '<i style="background:' + c + '"></i>').join('') + '</span>';
    btn.querySelector('.th-n').textContent = 'Theme ' + (i + 1);
    btn.querySelector('.th-t').textContent = t.name;
    btn.querySelector('.th-s').textContent = t.desc;
    btn.addEventListener('click', function () {
      applyTheme(t.id, true);
      sfx('theme');
      closeTheme();
    });
    li.appendChild(btn);
    themeList.appendChild(li);
  });

  function openTheme(){ closeOtherPanels('theme');
    themePanel.classList.add('open'); themePanel.setAttribute('aria-hidden','false');
    themeToggle.setAttribute('aria-expanded','true');
    const cur = themeList.querySelector('button[aria-current="true"]') || themeList.querySelector('button');
    if (cur) cur.focus(); }
  function closeTheme(){ themePanel.classList.remove('open'); themePanel.setAttribute('aria-hidden','true');
    themeToggle.setAttribute('aria-expanded','false'); }
  function toggleTheme(){ themePanel.classList.contains('open') ? closeTheme() : openTheme(); }
  themeToggle.addEventListener('click', toggleTheme);
  themePanel.addEventListener('click', function(e){ if (e.target === themePanel) closeTheme(); });

  applyTheme(currentTheme, false);

  /* ============================================================
     SOUND: synthesised with Web Audio, no files, off by default.
     A trainer sharing a screen should never be surprised by audio.
     ============================================================ */
  let soundOn = storageGet('dg-sound') === 'on';
  let audioCtx = null;

  function setSound(on) {
    soundOn = on;
    soundToggle.setAttribute('aria-pressed', on ? 'true' : 'false');
    soundToggle.textContent = on ? 'Sound on · S' : 'Sound · S';
    storageSet('dg-sound', on ? 'on' : 'off');
  }
  setSound(soundOn);

  function sfx(kind) {
    if (!soundOn) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const t0 = audioCtx.currentTime;
      const spec = {
        next:  [{f:520, d:0.055, g:0.030, type:'sine'}],
        prev:  [{f:390, d:0.055, g:0.026, type:'sine'}],
        open:  [{f:440, d:0.05,  g:0.024, type:'triangle'}, {f:660, d:0.07, g:0.020, type:'triangle', at:0.05}],
        close: [{f:520, d:0.05,  g:0.022, type:'triangle'}, {f:350, d:0.07, g:0.018, type:'triangle', at:0.05}],
        theme: [{f:587, d:0.07,  g:0.026, type:'sine'}, {f:880, d:0.10, g:0.022, type:'sine', at:0.07}],
        edge:  [{f:200, d:0.05,  g:0.016, type:'sine'}]
      }[kind];
      if (!spec) return;
      spec.forEach(function (n) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const start = t0 + (n.at || 0);
        osc.type = n.type;
        osc.frequency.setValueAtTime(n.f, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(n.g, start + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + n.d);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(start); osc.stop(start + n.d + 0.02);
      });
    } catch (e) { /* audio is a nicety; never let it break navigation */ }
  }

  soundToggle.addEventListener('click', function () {
    setSound(!soundOn);
    if (soundOn) sfx('open');
  });

  function render() {
    slides.forEach((s, i) => s.classList.toggle('active', i === current));
    progressFill.style.width = ((current + 1) / total * 100) + '%';
    counter.textContent = String(current + 1).padStart(2, '0');
    const s = slides[current];
    moduleChip.textContent = moduleLabels[s.dataset.module] || '';
    if (paceChip) paceChip.textContent = s.dataset.pace || '';
    if (srStatus) {
      srStatus.textContent = 'Slide ' + (current + 1) + ' of ' + total + ': ' + slideTitle(s);
    }
    markVisited(current);
    if (ovBuilt) refreshOverviewMarks();
    persistPlace();
    fitSlide(s);
  }



  /* ============================================================
     STAGE SCALING
     The canvas is a fixed 1600 x 900. Scale it to fill whatever
     screen it lands on so type is always the same proportion of
     the frame. This is what makes it legible on a shared screen
     without anyone zooming.
     ============================================================ */
  const stage = document.getElementById('stage');
  let CANVAS_W = 1600;
  const CANVAS_H = 900;
  let canvasMode = false;

  function fitStage() {
    canvasMode = window.matchMedia('(min-width: 901px) and (min-height: 481px)').matches;
    if (!canvasMode) {
      document.documentElement.style.removeProperty('--stage-scale');
      slides.forEach(function (s) { s.querySelector('.slide-inner').style.removeProperty('--fit'); });
      return;
    }
    const s = Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H);
    document.documentElement.style.setProperty('--stage-scale', String(s));
  }

  /* Auto-fit one slide: if its content is taller than the canvas
     allows, shrink just that slide enough to fit. Most slides stay
     at full size; only the densest give anything back. */
  const FIT_FLOOR = 0.72;
  function fitSlide(el) {
    if (!canvasMode || !el) return;
    const inner = el.querySelector('.slide-inner');
    if (!inner) return;
    inner.style.setProperty('--fit', '1');
    const cs = getComputedStyle(el);
    const avail = el.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const availW = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);

    /* Measure in-flow content only. Absolutely positioned children are
       decoration that is meant to bleed past the edge (the ghosted
       module numeral), and .slide-inner carries a transform, so it is
       their containing block and they would otherwise inflate
       scrollWidth/scrollHeight and shrink the slide for no reason.
       offsetTop/offsetLeft are layout values, unaffected by scale. */
    let h = 0, w = 0, counted = 0;
    for (let i = 0; i < inner.children.length; i++) {
      const c = inner.children[i];
      if (getComputedStyle(c).position === 'absolute') continue;
      h = Math.max(h, c.offsetTop + c.offsetHeight);
      w = Math.max(w, c.offsetLeft + c.offsetWidth);
      counted++;
    }
    if (!counted) { h = inner.scrollHeight; w = inner.scrollWidth; }

    if (h <= avail + 1 && w <= availW + 1) return;
    const k = Math.max(FIT_FLOOR, Math.min(avail / h, availW / w, 1));
    inner.style.setProperty('--fit', String(Math.floor(k * 1000) / 1000));
  }

  function fitAll() {
    fitStage();
    if (!canvasMode) return;
    slides.forEach(fitSlide);
  }

  let fitTimer = null;
  window.addEventListener('resize', function () {
    fitStage();
    if (overviewEl.classList.contains('open')) sizeOverview();
    clearTimeout(fitTimer);
    fitTimer = setTimeout(fitAll, 160);
  });
  document.addEventListener('fullscreenchange', function () { setTimeout(fitAll, 120); });


  /* ============================================================
     ASPECT / CINEMATIC MODE
     ============================================================ */
  const ASPECTS = [
    { id:'standard', ratio:'16:9',   w:1600, name:'Standard',  desc:'1.778:1. Matches a screen share and most displays edge to edge.', cine:false },
    { id:'scope',    ratio:'2.39:1', w:2151, name:'Scope',     desc:'Anamorphic cinematic widescreen. Letterboxed against black.', cine:true }
  ];
  const aspectToggle = document.getElementById('aspect-toggle');
  const aspectList = document.getElementById('aspect-list');
  let aspect = storageGet('dg-aspect') || 'standard';
  if (!ASPECTS.some(a => a.id === aspect)) aspect = 'standard';

  function applyAspect(id, announce) {
    const a = ASPECTS.find(x => x.id === id) || ASPECTS[0];
    aspect = a.id;
    const root = document.documentElement;
    if (a.id === 'standard') root.removeAttribute('data-aspect');
    else root.setAttribute('data-aspect', a.id);
    if (a.cine) root.setAttribute('data-cine', 'on');
    else root.removeAttribute('data-cine');
    CANVAS_W = a.w;
    storageSet('dg-aspect', a.id);
    aspectToggle.textContent = a.ratio + ' · C';
    aspectList.querySelectorAll('button').forEach(b =>
      b.setAttribute('aria-current', b.dataset.aspect === a.id ? 'true' : 'false'));
    fitAll();
    if (ovBuilt) {
      if (overviewEl.classList.contains('open')) buildOverview();
      else ovDirty = true;
    }
    if (announce && srStatus) srStatus.textContent = 'Frame: ' + a.name + ', ' + a.ratio;
  }

  ASPECTS.forEach(function (a) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.aspect = a.id;
    btn.innerHTML = '<span class="ab-ratio"></span><span class="ab-name"></span>' +
                    '<span class="ab-desc"></span><span class="ab-frame"><i></i></span>';
    btn.querySelector('.ab-ratio').textContent = a.ratio;
    btn.querySelector('.ab-name').textContent = a.name;
    btn.querySelector('.ab-desc').textContent = a.desc;
    // preview bar height is inversely proportional to the ratio
    btn.querySelector('.ab-frame i').style.height = (900 / a.w * 1600 / 900 * 100 * 0.5625).toFixed(1) + '%';
    btn.addEventListener('click', function () { applyAspect(a.id, true); sfx('theme'); });
    li.appendChild(btn);
    aspectList.appendChild(li);
  });

  function cycleAspect() {
    const i = ASPECTS.findIndex(a => a.id === aspect);
    applyAspect(ASPECTS[(i + 1) % ASPECTS.length].id, true);
    sfx('theme');
  }
  aspectToggle.addEventListener('click', cycleAspect);

  /* ============================================================
     FIRST-RUN LETTER
     ============================================================ */
  const letterEl = document.getElementById('letter');
  function closeLetter() {
    letterEl.classList.remove('open');
    letterEl.setAttribute('aria-hidden', 'true');
    storageSet('dg-letter', 'seen');
  }
  function openLetter() {
    letterEl.classList.add('open');
    letterEl.setAttribute('aria-hidden', 'false');
    const b = document.getElementById('lt-start');
    if (b) b.focus();
  }
  document.getElementById('lt-start').addEventListener('click', function () {
    closeLetter(); sfx('open');
  });
  letterEl.addEventListener('click', function (e) { if (e.target === letterEl) closeLetter(); });

  /* ============================================================
     PLACE MEMORY: resume where the student stopped.
     Position, furthest slide, theme and sound all live in
     localStorage, so closing the tab loses nothing.
     ============================================================ */
  const furthestFill = document.getElementById('progress-furthest');
  const resumeBar = document.getElementById('resume-bar');
  let furthest = parseInt(storageGet('dg-furthest') || '1', 10);
  if (!(furthest >= 1 && furthest <= total)) furthest = 1;

  function slugFor(i) { return 's' + (i + 1); }

  function persistPlace() {
    storageSet('dg-slide', String(current + 1));
    if (current + 1 > furthest) {
      furthest = current + 1;
      storageSet('dg-furthest', String(furthest));
    }
    if (furthestFill) furthestFill.style.width = (furthest / total * 100) + '%';
    const want = '#' + slugFor(current);
    if (window.location.hash !== want) {
      try { history.replaceState(null, '', want); } catch (e) {}
    }
  }

  function slideFromHash() {
    const m = (window.location.hash || '').match(/^#s(\d+)$/);
    if (!m) return null;
    const n = parseInt(m[1], 10);
    return (n >= 1 && n <= total) ? n - 1 : null;
  }

  function goTo(i, silent) {
    if (i < 0 || i >= total) return;
    current = i;
    render();
    if (!silent) sfx('next');
  }

  function showResume(n) {
    document.getElementById('rb-slide').textContent =
      'slide ' + n + ' of ' + total + ': ' + slideTitle(slides[n - 1]);
    resumeBar.classList.add('show');
  }
  function hideResume() { resumeBar.classList.remove('show'); }
  document.getElementById('rb-go').addEventListener('click', function () {
    const n = parseInt(storageGet('dg-slide') || '1', 10);
    hideResume(); goTo(n - 1, false);
  });
  document.getElementById('rb-dismiss').addEventListener('click', function () {
    storageSet('dg-slide', '1'); hideResume();
  });

  window.addEventListener('hashchange', function () {
    const h = slideFromHash();
    if (h !== null && h !== current) { goTo(h, true); }
  });

  /* ============================================================
     SEARCH: builds its index from the slides themselves.
     ============================================================ */
  const searchPanel = document.getElementById('search-panel');
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  const searchEmpty = document.getElementById('search-empty');
  const searchMeta = document.getElementById('search-meta');
  let searchSel = 0;

  const INDEX = slides.map(function (s, i) {
    const title = slideTitle(s);
    const kicker = (s.querySelector('.kicker') || {}).textContent || '';
    const body = (s.textContent || '').replace(/\s+/g, ' ').trim();
    return { i: i, title: title, mod: s.dataset.module,
             hay: (title + ' ' + kicker + ' ' + body).toLowerCase(), body: body };
  });

  function escHtml(t) {
    return t.replace(/[&<>"]/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }
  function excerpt(body, q) {
    const at = body.toLowerCase().indexOf(q);
    if (at < 0) return escHtml(body.slice(0, 130)) + '…';
    const from = Math.max(0, at - 55);
    const raw = body.slice(from, from + 165);
    const rel = at - from;
    return (from > 0 ? '…' : '') + escHtml(raw.slice(0, rel)) +
           '<mark>' + escHtml(raw.slice(rel, rel + q.length)) + '</mark>' +
           escHtml(raw.slice(rel + q.length)) + '…';
  }

  function runSearch() {
    const q = searchInput.value.trim().toLowerCase();
    searchResults.innerHTML = '';
    searchSel = 0;
    if (!q) {
      searchEmpty.hidden = true;
      searchMeta.textContent = 'Type to search · Enter opens the top hit · arrows to move · Esc to close';
      return;
    }
    const hits = INDEX.filter(function (r) { return r.hay.indexOf(q) > -1; })
      .sort(function (a, b) {
        const at = a.title.toLowerCase().indexOf(q) > -1 ? 0 : 1;
        const bt = b.title.toLowerCase().indexOf(q) > -1 ? 0 : 1;
        return at - bt || a.i - b.i;
      })
      .slice(0, 40);
    searchEmpty.hidden = hits.length > 0;
    searchMeta.textContent = hits.length
      ? hits.length + (hits.length === 40 ? '+ matches' : ' match' + (hits.length === 1 ? '' : 'es')) +
        ' · Enter opens the top hit · arrows to move'
      : 'No match';
    hits.forEach(function (r, n) {
      const li = document.createElement('li');
      if (n === 0) li.className = 'sel';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.innerHTML = '<span class="sr-n">Slide ' + (r.i + 1) + ' · ' +
                      escHtml(moduleShort[r.mod] || ('Module ' + r.mod)) +
                      '</span><span class="sr-t">' + escHtml(r.title) +
                      '</span><span class="sr-x">' + excerpt(r.body, q) + '</span>';
      btn.addEventListener('click', function () { closeSearch(); goTo(r.i, false); });
      li.appendChild(btn);
      searchResults.appendChild(li);
    });
  }
  function moveSel(d) {
    const items = searchResults.querySelectorAll('li');
    if (!items.length) return;
    items[searchSel] && items[searchSel].classList.remove('sel');
    searchSel = (searchSel + d + items.length) % items.length;
    items[searchSel].classList.add('sel');
    items[searchSel].scrollIntoView({ block: 'nearest' });
  }
  function openSearch() {
    closeOtherPanels('search');
    searchPanel.classList.add('open');
    searchPanel.setAttribute('aria-hidden', 'false');
    searchInput.value = ''; runSearch();
    searchInput.focus();
  }
  function closeSearch() {
    searchPanel.classList.remove('open');
    searchPanel.setAttribute('aria-hidden', 'true');
  }
  searchInput.addEventListener('input', runSearch);
  searchPanel.addEventListener('click', function (e) { if (e.target === searchPanel) closeSearch(); });
  searchInput.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { e.preventDefault(); closeSearch(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); moveSel(1); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); moveSel(-1); return; }
    if (e.key === 'Enter') {
      e.preventDefault();
      const b = searchResults.querySelectorAll('li')[searchSel];
      if (b) b.querySelector('button').click();
    }
    e.stopPropagation();
  });

  /* ============================================================
     FULLSCREEN
     ============================================================ */
  function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        (document.documentElement.requestFullscreen ||
         document.documentElement.webkitRequestFullscreen).call(document.documentElement);
      } else {
        (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      }
    } catch (e) {}
  }

  function next() { if (current < total - 1) { current++; render(); sfx('next'); } else { sfx('edge'); } }
  function prev() { if (current > 0) { current--; render(); sfx('prev'); } else { sfx('edge'); } }

  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (searchPanel.classList.contains('open')) return;
    if (letterEl.classList.contains('open') && e.key !== 'Escape' && e.key !== 'Enter') return;
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    /* While the overview grid is open it owns the keyboard */
    if (overviewEl.classList.contains('open')) {
      if (e.key === 'Escape') { e.preventDefault(); closeOverview(); sfx('close'); }
      else if (e.key === 'g' || e.key === 'G') { e.preventDefault(); closeOverview(); sfx('close'); }
      else if (e.key === '?') { e.preventDefault(); closeOverview(); openHelp(); }
      else overviewKeyNav(e);
      return;
    }
    if (helpEl.classList.contains('open')) {
      if (e.key === 'Escape' || e.key === '?') { e.preventDefault(); closeHelp(); }
      return;
    }

    const indexOpen = indexEl.classList.contains('open');
    const themeOpen = themePanel.classList.contains('open');
    if (e.key === '/') { e.preventDefault(); openSearch(); return; }
    if (e.key === '?') { e.preventDefault(); toggleHelp(); return; }
    if (e.key === 'Escape') {
      if (letterEl.classList.contains('open')) { e.preventDefault(); closeLetter(); return; }
      if (themeOpen) { e.preventDefault(); closeTheme(); sfx('close'); }
      else if (indexOpen) { e.preventDefault(); closeIndex(); sfx('close'); }
      return;
    }
    if (e.key === 'm' || e.key === 'M') {
      e.preventDefault(); closeOtherPanels('index');
      toggleIndex(); sfx(indexEl.classList.contains('open') ? 'open' : 'close'); return;
    }
    if (e.key === 'g' || e.key === 'G') {
      e.preventDefault(); toggleOverview();
      sfx(overviewEl.classList.contains('open') ? 'open' : 'close'); return;
    }
    if (e.key === 't' || e.key === 'T') {
      e.preventDefault(); closeOtherPanels('theme');
      toggleTheme(); sfx(themePanel.classList.contains('open') ? 'open' : 'close'); return;
    }
    if (e.key === 's' || e.key === 'S') {
      e.preventDefault(); setSound(!soundOn); if (soundOn) sfx('open'); return;
    }
    if (e.key === 'f' || e.key === 'F') { e.preventDefault(); toggleFullscreen(); return; }
    if (e.key === 'c' || e.key === 'C') { e.preventDefault(); cycleAspect(); return; }
    if (e.key === 'p' || e.key === 'P') { e.preventDefault(); printDeck(); return; }
    if (indexOpen || themeOpen) return;
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault(); next();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault(); prev();
    } else if (e.key === 'Home') {
      e.preventDefault(); current = 0; render();
    } else if (e.key === 'End') {
      e.preventDefault(); current = total - 1; render();
    }
  });

  let touchX = null;
  document.addEventListener('touchstart', function (e) {
    touchX = e.changedTouches[0].screenX;
  }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (touchX === null) return;
    const dx = e.changedTouches[0].screenX - touchX;
    touchX = null;
    if (indexEl.classList.contains('open') || themePanel.classList.contains('open') ||
        searchPanel.classList.contains('open') || overviewEl.classList.contains('open') ||
        helpEl.classList.contains('open')) return;
    if (Math.abs(dx) < 50) return;
    if (dx < 0) next(); else prev();
  }, { passive: true });

  /* Boot: an explicit #s42 link wins; otherwise offer to resume. */
  const fromHash = slideFromHash();
  if (fromHash !== null) {
    current = fromHash;
  } else {
    const saved = parseInt(storageGet('dg-slide') || '1', 10);
    if (saved > 1 && saved <= total && storageGet('dg-letter') === 'seen') {
      window.setTimeout(function () { showResume(saved); }, 700);
      window.setTimeout(hideResume, 12000);
    }
  }
  applyAspect(aspect, false);
  fitStage();
  render();
  window.requestAnimationFrame(function () { fitAll(); });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { fitAll(); });
  }
  window.setTimeout(fitAll, 900);

  /* A first-time visitor gets the letter; a returning one gets their
     place back instead. Never both at once. */
  if (storageGet('dg-letter') !== 'seen') {
    hideResume();
    window.setTimeout(openLetter, 260);
  }

  /* Offline support. Registered only over http(s); opening the file
     directly with file:// simply skips it. */
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }
})();
