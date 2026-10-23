/* Film touches for the interface:
   - ESPER: tap a poster and it is "enhanced" like the photo-analysis scene
   - Origami: finishing a story leaves a folded paper figure on its banner
   - Boot screen: a short LAPD terminal start-up, once per session
   - Neon: headings now and then buzz like a failing tube
   Interface sounds are requested with a "br:sfx" event; sfx.js plays them if switched on. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function sfx(name) { window.dispatchEvent(new CustomEvent('br:sfx', { detail: name })); }
  function store(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---------------- boot screen ---------------- */
  (function boot() {
    var el = document.getElementById('boot');
    if (!el) return;
    if (store('br-booted') || location.hash || document.hidden || navigator.webdriver) { el.remove(); return; }
    store('br-booted', '1');
    var issues = document.querySelectorAll('article.issue[id]').length, files = document.querySelectorAll('.dossier').length;
    var lines = ['LAPD · BLADE RUNNER UNIT', 'RECORDS TERMINAL · LOS ANGELES', 'CONNECTING TO ARCHIVE ............ OK',
      'INDEXING ' + issues + ' ENTRIES · ' + files + ' CASE FILES', 'VOIGHT-KAMPFF CALIBRATION ........ OK', 'ACCESS GRANTED'];
    var out = el.querySelector('.boot-lines'), done = false, timers = [];
    function finish() { if (done) return; done = true; timers.forEach(clearTimeout); el.classList.add('out'); setTimeout(function () { el.remove(); }, 450); }
    el.hidden = false; el.addEventListener('click', finish); document.addEventListener('keydown', finish, { once: true });
    if (reduce) { out.textContent = lines.join('\n'); timers.push(setTimeout(finish, 900)); return; }
    var at = 120;
    lines.forEach(function (line, n) {
      timers.push(setTimeout(function () {
        var row = document.createElement('div'); if (n === lines.length - 1) row.className = 'ok'; out.appendChild(row);
        var i = 0; (function type() { row.textContent = line.slice(0, i += 3); if (i < line.length) timers.push(setTimeout(type, 12)); })();
      }, at));
      at += n === lines.length - 2 ? 360 : 230;
    });
    timers.push(setTimeout(finish, at + 650));
  })();

  /* ---------------- neon buzz ---------------- */
  if (!reduce) {
    (function buzz() {
      setTimeout(function () {
        if (!document.hidden) {
          var pool = Array.prototype.filter.call(document.querySelectorAll('.hero h1, .view:not([hidden]) .vol-banner .num, .view:not([hidden]) .arc, .sign'), function (e) {
            var r = e.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight;
          });
          if (pool.length) { var e = pool[Math.floor(Math.random() * pool.length)]; e.classList.remove('buzz'); void e.offsetWidth; e.classList.add('buzz'); setTimeout(function () { e.classList.remove('buzz'); }, 1200); }
        }
        buzz();
      }, 7000 + Math.random() * 9000);
    })();
  }

  /* ---------------- origami badges ---------------- */
  var FOLD = { // simple folded-paper figures, 48 x 48, as lists of polygons
    unicorn: ['10,30 26,26 34,32 18,36', '26,26 32,14 38,16 34,25', '35,15 43,5 37,16', '14,35 12,44 16,44 19,36', '28,33 28,44 31,44 32,32', '10,30 3,35 9,32'],
    horse:   ['10,30 26,26 34,32 18,36', '26,26 32,14 39,17 34,25', '14,35 12,44 16,44 19,36', '28,33 28,44 31,44 32,32', '10,30 4,38 9,32'],
    frog:    ['8,34 24,18 40,34 24,40', '8,34 3,43 15,38', '40,34 45,43 33,38', '17,23 20,15 24,21', '24,21 28,15 31,23'],
    chicken: ['10,30 30,24 36,34 16,38', '30,24 33,13 40,19 34,26', '40,17 46,19 40,21', '10,30 5,18 15,27', '20,37 19,45 22,45 23,37', '27,36 27,45 30,45 30,35'],
    stick:   ['24,6 28,11 24,16 20,11', '22,16 26,16 27,32 21,32', '13,21 35,21 35,24 13,24', '21,32 15,45 18,45 24,34', '27,32 33,45 30,45 24,34'],
    crane:   ['4,27 24,21 44,27 24,31', '24,21 13,5 27,23', '24,21 35,5 21,23', '40,27 46,13 42,28', '8,27 2,17 11,27'],
    lotus:   ['24,40 14,22 24,8 34,22', '24,40 4,24 18,24', '24,40 44,24 30,24', '24,40 10,36 38,36']
  };
  var STORIES = { i: ['#origins', 'crane'], tn: ['#tokyo', 'crane'], f: ['#film82', 'unicorn'], gm: ['#game97', 'stick'], b: ['#br2019', 'chicken'],
    bo: ['#blackout', 'crane'], c: ['#br2029', 'stick'], l: ['#lotus', 'lotus'], ll: ['#ll1', 'lotus'], lv: ['#lv1', 'lotus'], dawn: ['#dawn', 'crane'],
    d: ['#br2039', 'frog'], run: ['#nowhere', 'crane'], g: ['#film49', 'horse'] };
  function svg(name) {
    return '<svg viewBox="0 0 48 48" aria-hidden="true">' + FOLD[name].map(function (p, n) { return '<polygon points="' + p + '" class="f' + (n % 2) + '"/>'; }).join('') + '</svg>';
  }
  var badges = {};
  Object.keys(STORIES).forEach(function (k) {
    var anchor = document.querySelector(STORIES[k][0]); if (!anchor) return;
    var host = null;
    if (k === 'll' || k === 'lv') { var grp = anchor.parentElement; host = grp && grp.previousElementSibling && grp.previousElementSibling.classList.contains('arcprog') ? grp.previousElementSibling : null; }
    else { var b = anchor.querySelector('.vol-banner'); host = b && (b.querySelector('.bt') || b); }
    if (!host) return;
    var badge = document.createElement('div'); badge.className = 'origami'; badge.hidden = true;
    badge.innerHTML = svg(STORIES[k][1]) + '<span>Case closed</span>';
    badge.title = 'You finished this story';
    host.appendChild(badge); badges[k] = { el: badge, was: null };
  });
  function paintBadges() {
    var R = window.BRReader; if (!R) return;
    Object.keys(badges).forEach(function (k) {
      var b = badges[k], done = R.storyDone(k);
      if (done && b.was === false) { b.el.classList.remove('fold'); void b.el.offsetWidth; b.el.classList.add('fold'); sfx('complete'); }
      b.el.hidden = !done; b.was = done;
    });
  }
  if (window.BRReader) { window.BRReader.onChange(function () { setTimeout(paintBadges, 0); }); paintBadges(); }

  /* ---------------- ESPER enhance ---------------- */
  var dlg = document.getElementById('esper'); if (!dlg) return;
  var cv = dlg.querySelector('canvas'), g = cv.getContext('2d'), read = dlg.querySelector('.esper-read'), go = dlg.querySelector('.esper-go'), shut = dlg.querySelector('.esper-close');
  var src = null, raf = 0, t0 = 0, opener = null, steps = [];
  function size() {
    var maxW = Math.min(520, innerWidth - 32), maxH = Math.min(693, innerHeight - 190), w = Math.min(maxW, maxH * .75), h = w / .75, dpr = Math.min(devicePixelRatio || 1, 2);
    cv.style.width = w + 'px'; cv.style.height = h + 'px'; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  }
  function plan() {
    // a focus near the poster's main motif, then the classic sequence of commands
    var fx = .5 + (Math.random() - .5) * .2, fy = .32 + Math.random() * .12;
    return [
      { d: 700,  say: 'ESPER · IMAGE LOADED',              z: 1,   x: .5,       y: .5 },
      { d: 1100, say: 'ENHANCE 224 TO 176',                z: 2,   x: fx,       y: fy, box: true },
      { d: 900,  say: 'TRACK 45 RIGHT',                    z: 2,   x: fx + .12, y: fy },
      { d: 600,  say: 'STOP',                              z: 2,   x: fx + .12, y: fy },
      { d: 1100, say: 'ENHANCE 34 TO 36',                  z: 3.4, x: fx + .1,  y: fy + .04, box: true },
      { d: 900,  say: 'PULL BACK',                         z: 1,   x: .5,       y: .5 },
      { d: 99999, say: 'PRINT · HARD COPY READY',          z: 1,   x: .5,       y: .5, end: true }
    ];
  }
  function draw(now) {
    var W = cv.width, H = cv.height, el = now - t0, acc = 0, i = 0;
    while (i < steps.length - 1 && el > acc + steps[i].d) { acc += steps[i].d; i++; }
    var s = steps[i], p = steps[Math.max(0, i - 1)], k = Math.min(1, (el - acc) / Math.min(500, s.d)), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    if (reduce) { s = steps[steps.length - 1]; p = s; e = 1; }
    var z = p.z + (s.z - p.z) * e, x = p.x + (s.x - p.x) * e, y = p.y + (s.y - p.y) * e;
    var sw = src.width / z, sh = src.height / z, sx = Math.max(0, Math.min(src.width - sw, x * src.width - sw / 2)), sy = Math.max(0, Math.min(src.height - sh, y * src.height - sh / 2));
    g.imageSmoothingEnabled = z < 1.5; g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    g.drawImage(src, sx, sy, sw, sh, 0, 0, W, H);
    if (!s.end || k < 1) { // grain and a scan bar while working
      g.fillStyle = 'rgba(160,255,230,.05)'; for (var n = 0; n < 220; n++) g.fillRect(Math.random() * W, Math.random() * H, 2, 2);
      var bar = (el / 4) % H; g.fillStyle = 'rgba(120,255,220,.08)'; g.fillRect(0, bar, W, 18);
    }
    g.strokeStyle = 'rgba(120,255,220,.22)'; g.lineWidth = 1;
    for (var gx = 0; gx <= 8; gx++) { g.beginPath(); g.moveTo(gx * W / 8, 0); g.lineTo(gx * W / 8, H); g.stroke(); }
    for (var gy = 0; gy <= 8; gy++) { g.beginPath(); g.moveTo(0, gy * H / 8); g.lineTo(W, gy * H / 8); g.stroke(); }
    var nx = steps[Math.min(steps.length - 1, i + 1)];
    if (nx && nx.box && !s.end) { // show the region about to be enhanced
      var bw = W / (nx.z / z), bh = H / (nx.z / z), cx2 = (nx.x * src.width - sx) / sw * W, cy2 = (nx.y * src.height - sy) / sh * H;
      g.strokeStyle = 'rgba(120,255,220,.9)'; g.lineWidth = 2; g.strokeRect(cx2 - bw / 2, cy2 - bh / 2, bw, bh);
      g.beginPath(); g.moveTo(cx2, 0); g.lineTo(cx2, cy2 - bh / 2); g.moveTo(cx2, cy2 + bh / 2); g.lineTo(cx2, H); g.moveTo(0, cy2); g.lineTo(cx2 - bw / 2, cy2); g.moveTo(cx2 + bw / 2, cy2); g.lineTo(W, cy2); g.lineWidth = 1; g.stroke();
    }
    if (read.getAttribute('data-step') !== String(i)) {
      read.setAttribute('data-step', String(i)); read.textContent = s.say + '   ·   ZOOM ' + s.z.toFixed(1);
      sfx(s.end ? 'print' : 'esper');
      if (s.end) go.hidden = !go.getAttribute('href');
    }
    if (!(s.end && k >= 1) && !reduce) raf = requestAnimationFrame(draw);
  }
  function open(canvas, href, label) {
    if (!canvas || !canvas.width) return;
    src = canvas; opener = document.activeElement; steps = plan(); size();
    go.hidden = true; if (href) { go.setAttribute('href', href); go.textContent = 'Open ' + label + ' →'; } else go.removeAttribute('href');
    dlg.hidden = false; read.removeAttribute('data-step'); document.documentElement.classList.add('searching');
    shut.focus(); t0 = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(draw);
  }
  function close() { cancelAnimationFrame(raf); dlg.hidden = true; document.documentElement.classList.remove('searching'); if (opener && opener.focus) opener.focus(); }
  document.addEventListener('click', function (e) {
    var t = e.target; if (!t.closest) return;
    var poster = t.closest('a.poster'), cover = t.closest('canvas.cover');
    if (poster && !t.closest('#esper')) { e.preventDefault(); e.stopPropagation(); open(poster.querySelector('canvas'), poster.getAttribute('href'), poster.querySelector('span') ? poster.querySelector('span').textContent.replace(/\s*✓$/, '').replace(/\s·\s\d{4}$/, '') : 'story'); }
    else if (cover) { e.preventDefault(); e.stopPropagation(); open(cover, null, ''); }
  }, true);
  Array.prototype.forEach.call(document.querySelectorAll('canvas.cover'), function (c) { c.setAttribute('tabindex', '0'); c.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(c, null, ''); } }); });
  shut.addEventListener('click', close);
  go.addEventListener('click', function () { close(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !dlg.hidden) close(); });
  addEventListener('resize', function () { if (!dlg.hidden) { size(); cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); } });
})();
