/* ============================================================
   UniForget — project page interactions
   One control (β) drives the mask grid, the readouts, and the
   highlighted rows in the results tables.
   ============================================================ */

(function () {
  'use strict';

  /* Numbers below are taken directly from the paper:
     deactivation ratios from the masking-level table,
     Acc_g from the main quantitative table (GPT-4o judge),
     FID / CLIP from COCO 5K. */
  var LEVELS = {
    off:    { mask: 0,    ffn: 0,    norm: 0,    anime: 68.7, comic: 42.6, movie: 37.1, celeb: 43.2, fid: 32.0, clip: 0.29 },
    weak:   { mask: 6.7,  ffn: 24.2, norm: 5.6,  anime: 36.5, comic: 28.9, movie: 31.7, celeb: 32.1, fid: 32.1, clip: 0.29 },
    medium: { mask: 9.5,  ffn: 35.0, norm: 12.3, anime: 30.3, comic: 10.2, movie: 23.3, celeb: 17.4, fid: 32.4, clip: 0.28 },
    strong: { mask: 16.3, ffn: 45.3, norm: 19.1, anime: 16.3, comic: 9.1,  movie: 16.6, celeb: 5.3,  fid: 38.9, clip: 0.25 }
  };

  var grid = document.getElementById('mask-grid');
  if (!grid) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var current = 'medium';
  var cells = [];
  var order = [];   /* cell indices sorted by mask rank, lowest first */
  var cols = 0;

  /* Deterministic PRNG so the mask pattern is stable across reloads and
     so each level's deactivated set nests inside the next one up. */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function colCount() {
    var w = window.innerWidth;
    if (w < 560) return 32;
    if (w < 900) return 44;
    return 64;
  }

  function build() {
    cols = colCount();
    var rows = cols < 40 ? 16 : cols < 56 ? 14 : 13;
    var total = cols * rows;
    var rand = mulberry32(48661);

    grid.style.setProperty('--cols', cols);
    grid.textContent = '';
    cells = [];

    var ranks = [];
    var frag = document.createDocumentFragment();
    for (var i = 0; i < total; i++) {
      var c = document.createElement('span');
      c.className = 'cell';
      ranks.push(rand());
      cells.push(c);
      frag.appendChild(c);
    }
    grid.appendChild(frag);

    /* Deactivating a prefix of this order — rather than thresholding on the
       raw ranks — makes the visible fraction match the quoted percentage
       exactly, and makes each level's set nest inside the next one up. */
    order = cells.map(function (_, i) { return i; })
                 .sort(function (a, b) { return ranks[a] - ranks[b]; });
  }

  function paint(level, animate) {
    var cut = Math.round(LEVELS[level].mask / 100 * cells.length);
    for (var rank = 0; rank < order.length; rank++) {
      var cell = cells[order[rank]];
      var shouldBeOff = rank < cut;
      if (shouldBeOff === cell.classList.contains('off')) continue;

      cell.classList.toggle('off', shouldBeOff);

      /* Newly deactivated cells flash gold on their way to red —
         the paper's colormap read as a transition. */
      if (shouldBeOff && animate) {
        flash(cell, (rank / Math.max(cut, 1) * 320) | 0);
      }
    }
  }

  function flash(cell, delay) {
    window.setTimeout(function () {
      cell.classList.add('flash');
      window.setTimeout(function () { cell.classList.remove('flash'); }, 260);
    }, delay);
  }

  /* ── readouts ──────────────────────────────────────────── */

  var out = {
    mask:  document.getElementById('ro-mask'),
    ffn:   document.getElementById('ro-ffn'),
    norm:  document.getElementById('ro-norm'),
    anime: document.getElementById('ro-anime'),
    comic: document.getElementById('ro-comic'),
    movie: document.getElementById('ro-movie'),
    celeb: document.getElementById('ro-celeb'),
    fid:   document.getElementById('ro-fid'),
    clip:  document.getElementById('ro-clip')
  };

  function pct(v) { return v.toFixed(1) + '<i>%</i>'; }

  function readout(level) {
    var d = LEVELS[level];
    out.mask.innerHTML  = pct(d.mask);
    out.ffn.textContent  = d.ffn.toFixed(1) + '%';
    out.norm.textContent = d.norm.toFixed(1) + '%';
    out.anime.innerHTML = pct(d.anime);
    out.comic.innerHTML = pct(d.comic);
    out.movie.innerHTML = pct(d.movie);
    out.celeb.innerHTML = pct(d.celeb);
    out.fid.textContent  = d.fid.toFixed(1);
    out.clip.textContent = d.clip.toFixed(2);
  }

  function highlightRows(level) {
    var rows = document.querySelectorAll('tr[data-row]');
    for (var i = 0; i < rows.length; i++) {
      rows[i].classList.toggle('is-active', rows[i].getAttribute('data-row') === level);
    }
  }

  /* ── controls ──────────────────────────────────────────── */

  var buttons = Array.prototype.slice.call(document.querySelectorAll('.lvl'));

  function select(level, animate) {
    current = level;
    buttons.forEach(function (b) {
      var on = b.getAttribute('data-level') === level;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    paint(level, animate && !reduced);
    readout(level);
    highlightRows(level);
  }

  buttons.forEach(function (b, idx) {
    b.addEventListener('click', function () {
      select(b.getAttribute('data-level'), true);
    });
    /* Arrow-key traversal, as a radiogroup should behave. */
    b.addEventListener('keydown', function (e) {
      var step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1
               : e.key === 'ArrowLeft'  || e.key === 'ArrowUp'   ? -1 : 0;
      if (!step) return;
      e.preventDefault();
      var next = buttons[(idx + step + buttons.length) % buttons.length];
      next.focus();
      select(next.getAttribute('data-level'), true);
    });
  });

  /* ── init ──────────────────────────────────────────────── */

  build();
  readout(current);
  highlightRows(current);

  if (reduced) {
    paint(current, false);
  } else {
    /* Open on an intact model, then let the mask take hold. */
    window.setTimeout(function () { paint(current, true); }, 550);
  }

  var resizeTimer;
  window.addEventListener('resize', function () {
    if (colCount() === cols) return;
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(function () {
      build();
      paint(current, false);
    }, 180);
  });

  /* ── equations ─────────────────────────────────────────── */

  function renderMath() {
    if (typeof katex === 'undefined') return;
    document.querySelectorAll('.eq[data-tex]').forEach(function (el) {
      try {
        katex.render(el.getAttribute('data-tex'), el, {
          displayMode: true, throwOnError: false
        });
      } catch (err) { el.textContent = el.getAttribute('data-tex'); }
    });
    document.querySelectorAll('.tex').forEach(function (el) {
      try {
        katex.render(el.textContent, el, { displayMode: false, throwOnError: false });
      } catch (err) { /* leave the source visible */ }
    });
  }
  if (document.readyState === 'complete') renderMath();
  else window.addEventListener('load', renderMath);

  /* ── copy BibTeX ───────────────────────────────────────── */

  document.querySelectorAll('.copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = document.querySelector(btn.getAttribute('data-copy'));
      if (!target) return;
      navigator.clipboard.writeText(target.textContent.trim()).then(function () {
        var was = btn.textContent;
        btn.textContent = 'Copied';
        btn.classList.add('done');
        window.setTimeout(function () {
          btn.textContent = was;
          btn.classList.remove('done');
        }, 1600);
      }).catch(function () {
        btn.textContent = 'Select and copy';
      });
    });
  });
})();
