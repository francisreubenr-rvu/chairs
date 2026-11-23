/* Chairs · site interactions. No dependencies. */
(function () {
  'use strict';

  /* ---- mobile navigation ---- */
  var nav = document.getElementById('site-nav');
  var navToggle = document.querySelector('.nav-toggle');
  if (nav && navToggle) {
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---- reading theme ---- */
  var THEME_META = {
    paper: '#F1EBDD',
    neobrutalism: '#FAF7F0',
    maxbrutalism: '#CFCAC0',
    claymorphism: '#EFE4DA',
    glassmorphism: '#E8EEF5',
    blueprint: '#0C2233',
    risograph: '#F4EFE2'
  };
  var themePicker = document.querySelector('.theme-picker');
  var themeButtons = Array.prototype.slice.call(document.querySelectorAll('[data-theme-choice]'));
  var themeMeta = document.querySelector('meta[name="theme-color"]');

  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'paper';
  }

  function applyTheme(id, persist) {
    if (id === 'paper') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', id);
    if (persist) {
      try { localStorage.setItem('chairs-theme', id); } catch (e) {}
    }
    themeButtons.forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-theme-choice') === id ? 'true' : 'false');
    });
    if (themeMeta && THEME_META[id]) themeMeta.setAttribute('content', THEME_META[id]);
  }

  if (themeButtons.length) {
    applyTheme(currentTheme(), false);
    themeButtons.forEach(function (b) {
      b.addEventListener('click', function () {
        applyTheme(b.getAttribute('data-theme-choice'), true);
        if (themePicker) {
          themePicker.open = false;
          var summary = themePicker.querySelector('summary');
          if (summary) summary.focus();
        }
      });
    });
    document.addEventListener('click', function (e) {
      if (themePicker && themePicker.open && !themePicker.contains(e.target)) themePicker.open = false;
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && themePicker && themePicker.open) {
        themePicker.open = false;
        var summary = themePicker.querySelector('summary');
        if (summary) summary.focus();
      }
    });
  }

  /* ---- search ---- */
  var dialog = document.getElementById('search');
  var input = document.getElementById('search-input');
  var results = document.getElementById('search-results');
  var index = null;
  var loading = false;

  function openSearch() {
    if (!dialog) return;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    setTimeout(function () { if (input) input.focus(); }, 20);
    loadIndex();
  }

  function closeSearch() {
    if (!dialog) return;
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }

  function loadIndex() {
    if (index || loading) return;
    loading = true;
    fetch('/search.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        index = data.entries || [];
        render(input.value);
      })
      .catch(function () {
        results.innerHTML = '<li><a href="/">Search is unavailable. Return to the contents.</a></li>';
      })
      .finally(function () { loading = false; });
  }

  function render(query) {
    if (!results) return;
    var q = String(query || '').trim().toLowerCase();
    if (!index) return;
    if (!q) {
      results.innerHTML = '<li><a href="/#contents"><span class="sr-mod">Start</span><span class="sr-t">Browse the six modules</span><span class="sr-x">Or type a company, motion, clause or event.</span></a></li>';
      return;
    }
    var terms = q.split(/\s+/).filter(Boolean).map(function (t) {
      var safe = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return t.length <= 3
        ? new RegExp('(^|[^a-z0-9])' + safe + '($|[^a-z0-9])')
        : new RegExp('(^|[^a-z0-9])' + safe);
    });
    var hits = index.filter(function (e) {
      var hay = (e.t + ' ' + e.m + ' ' + e.x).toLowerCase();
      return terms.every(function (re) { return re.test(hay); });
    }).sort(function (a, b) {
      var at = a.t.toLowerCase().indexOf(q) !== -1 ? 1 : 0;
      var bt = b.t.toLowerCase().indexOf(q) !== -1 ? 1 : 0;
      return bt - at;
    }).slice(0, 20);
    if (!hits.length) {
      results.innerHTML = '<li><a href="/library/"><span class="sr-mod">No match</span><span class="sr-t">Nothing found for "' + escapeText(q) + '"</span><span class="sr-x">Try a shorter phrase, or browse the library.</span></a></li>';
      return;
    }
    results.innerHTML = hits.map(function (e) {
      return '<li><a href="' + e.u + '"><span class="sr-mod">' + escapeText(e.m) + '</span><span class="sr-t">' + escapeText(e.t) + '</span><span class="sr-x">' + escapeText(e.x.slice(0, 120)) + '</span></a></li>';
    }).join('');
  }

  function escapeText(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  Array.prototype.forEach.call(document.querySelectorAll('.search-open'), function (b) {
    b.addEventListener('click', openSearch);
  });
  var closeBtn = document.querySelector('.search-close');
  if (closeBtn) closeBtn.addEventListener('click', closeSearch);
  if (dialog) {
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) closeSearch();
    });
    dialog.addEventListener('close', function () { if (input) input.value = ''; });
  }
  if (input) {
    input.addEventListener('input', function () { render(input.value); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var first = results && results.querySelector('a');
        if (first) { e.preventDefault(); window.location.href = first.href; }
      }
    });
  }
  document.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase();
    var typing = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;
    if ((e.key === '/' && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
      e.preventDefault();
      openSearch();
    }
    if (e.key === 'Escape' && dialog && dialog.hasAttribute('open')) closeSearch();
  });

  /* ---- library filter ---- */
  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip[data-filter]'));
  if (chips.length) {
    var cards = Array.prototype.slice.call(document.querySelectorAll('.folio'));
    var groups = Array.prototype.slice.call(document.querySelectorAll('.committee-group'));
    var count = document.getElementById('filter-count');

    function applyFilter(value) {
      var shown = 0;
      cards.forEach(function (card) {
        var match = value === 'all' || card.getAttribute('data-committee') === value;
        card.hidden = !match;
        if (match) shown++;
      });
      groups.forEach(function (g) {
        var any = g.querySelector('.folio:not([hidden])');
        g.hidden = !any;
      });
      if (count) count.textContent = shown + (shown === 1 ? ' portfolio' : ' portfolios');
      chips.forEach(function (c) {
        c.setAttribute('aria-pressed', c.getAttribute('data-filter') === value ? 'true' : 'false');
      });
      if (value !== 'all' && window.history.replaceState) {
        window.history.replaceState(null, '', '/library/?committee=' + encodeURIComponent(value));
      }
    }

    chips.forEach(function (c) {
      c.addEventListener('click', function () { applyFilter(c.getAttribute('data-filter')); });
    });
    var preset = new URLSearchParams(window.location.search).get('committee');
    if (preset) applyFilter(preset);
  }
})();
