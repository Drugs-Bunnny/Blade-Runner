/* The Lore view: timeline, glossary (with tap-to-define terms in the synopses), connections web and map.
   Everything is drawn from window.BR_LORE. Lines that spoil a story respect the reader's spoiler shield. */
(function () {
  var L = window.BR_LORE; if (!L) return;
  var R = window.BRReader;
  var NAMES = { i: 'Origins', tn: 'Tokyo Nexus', tw: 'To Lose Is to Win', dh: 'Die With Honor', f: 'Blade Runner', gm: 'the game', b: 'Blade Runner 2019', bo: 'Black Out 2022', c: 'Blade Runner 2029',
    l: 'Black Lotus', ll: 'Leaving L.A.', lv: 'Las Vegas', dawn: 'Nexus Dawn', d: 'Blade Runner 2039', run: 'Nowhere to Run', g: 'Blade Runner 2049' };
  var revealed = {};
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function locked(s, key) {
    if (!s || !s.length || !R || !R.shield() || revealed[key]) return false;
    return s.some(function (k) { return !R.storyDone(k); });
  }
  function needs(s) { return s.filter(function (k) { return !R.storyDone(k); }).map(function (k) { return NAMES[k] || k; }).join(' and '); }
  function veil(s, key) {
    return '<div class="lv"><span>Hidden by the spoiler shield until you finish ' + esc(needs(s)) + '.</span> <button type="button" class="lv-show" data-key="' + esc(key) + '">Show anyway</button></div>';
  }
  function links(list) { return list.map(function (g) { return '<a class="app" href="' + g[0] + '">' + esc(g[1]) + '</a>'; }).join(''); }
  var view = document.getElementById('lore'); if (!view) return;
  view.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.lv-show'); if (!b) return;
    revealed[b.getAttribute('data-key')] = true; paintAll();
  });

  /* ================= glossary ================= */
  var TERMS = {}; L.terms.forEach(function (t) { TERMS[t.id] = t; });
  var sorted = L.terms.slice().sort(function (a, b) { var k = function (t) { return t.t.replace(/^[^A-Za-z]+|^The /g, ''); }; return k(a).localeCompare(k(b)); });
  var glList = view.querySelector('.gl-list'), glFind = view.querySelector('.gl-find');
  function termBody(t) {
    if (locked(t.s, 'gl:' + t.id)) return veil(t.s, 'gl:' + t.id);
    var h = '<p>' + esc(t.d) + '</p>';
    if (t.list) h += '<dl class="gl-dl">' + t.list.map(function (r) { return '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join('') + '</dl>';
    return h;
  }
  function paintGlossary() {
    var q = (glFind.value || '').trim().toLowerCase();
    glList.innerHTML = sorted.map(function (t) {
      var hay = (t.t + ' ' + t.d + ' ' + (t.a || []).join(' ')).toLowerCase();
      return '<article class="gl" id="gl-' + t.id + '"' + (q && hay.indexOf(q) < 0 ? ' hidden' : '') + '><h3>' + esc(t.t) + '</h3>' + termBody(t) +
        (t.see && t.see.length ? '<div class="apps"><span class="apps-l">See</span>' + links(t.see) + '</div>' : '') + '</article>';
    }).join('');
  }
  glFind.addEventListener('input', function () {
    var q = glFind.value.trim().toLowerCase();
    Array.prototype.forEach.call(glList.children, function (el) { el.hidden = !!q && el.textContent.toLowerCase().indexOf(q) < 0; });
  });

  /* ---- underline terms in the synopses: the first use of each term in each entry ---- */
  var matchers = [];
  L.terms.forEach(function (t) {
    if (t.auto === false) return;
    t.a.slice().sort(function (x, y) { return y.length - x.length; }).forEach(function (a) {
      var pre = '', m0 = /^\(([^)]*)\)(.*)$/.exec(a); if (m0) { pre = m0[1]; a = m0[2]; }
      var q = function (x) { return x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }, src = q(a), ps = q(pre);
      if (/^[a-z]/.test(a)) src = '[' + a[0] + a[0].toUpperCase() + ']' + src.slice(1);
      if (/^[a-z]/.test(pre)) ps = '[' + pre[0] + pre[0].toUpperCase() + ']' + ps.slice(1);
      matchers.push({ id: t.id, re: new RegExp('(^|[^A-Za-z0-9-])(' + ps + ')(' + src + ')(?![A-Za-z0-9])') });
    });
  });
  function underline() {
  Array.prototype.forEach.call(document.querySelectorAll('article.issue'), function (art) {
    var used = {}, paras = art.querySelectorAll('.ib p, .ib .quote');
    Array.prototype.forEach.call(paras, function (p) {
      var walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT, null), nodes = [], n;
      while ((n = walker.nextNode())) if (!n.parentNode.closest('a, button, .term')) nodes.push(n);
      nodes.forEach(function (node) {
        var guard = 0;
        while (node && guard++ < 6) {
          var best = null;
          matchers.forEach(function (m) {
            if (used[m.id]) return;
            var r = m.re.exec(node.nodeValue); if (!r) return;
            var at = r.index + r[1].length + r[2].length;
            if (!best || at < best.at) best = { at: at, len: r[3].length, id: m.id };
          });
          if (!best) break;
          used[best.id] = true;
          var mid = node.splitText(best.at), rest = mid.splitText(best.len);
          var b = document.createElement('button'); b.type = 'button'; b.className = 'term'; b.setAttribute('data-term', best.id);
          b.setAttribute('aria-expanded', 'false'); b.textContent = mid.nodeValue;
          mid.parentNode.replaceChild(b, mid); node = rest;
        }
      });
    });
  });
  }
  (window.requestIdleCallback || function (f) { setTimeout(f, 200); })(underline, { timeout: 1500 });
  // the definition pop-up
  var pop = document.createElement('div'); pop.className = 'termpop'; pop.hidden = true; pop.setAttribute('role', 'dialog'); document.body.appendChild(pop);
  var popFor = null;
  function closePop() { if (pop.hidden) return; if (window.BROverlay) window.BROverlay.pop('term'); if (popFor) popFor.setAttribute('aria-expanded', 'false'); pop.hidden = true; popFor = null; }
  function openPop(btn) {
    var t = TERMS[btn.getAttribute('data-term')]; if (!t) return;
    if (popFor === btn) { closePop(); return; }
    closePop(); popFor = btn; btn.setAttribute('aria-expanded', 'true');
    pop.setAttribute('aria-label', t.t);
    pop.innerHTML = '<div class="tp-h"><span>' + esc(t.t) + '</span><button type="button" class="tp-x" aria-label="Close">✕</button></div>' + termBody(t).replace('<dl class="gl-dl">', '<dl class="gl-dl sm">') +
      '<a class="tp-more" href="#gl-' + t.id + '">Glossary →</a>';
    pop.hidden = false;
    var r = btn.getBoundingClientRect(), w = Math.min(340, innerWidth - 24);
    pop.style.width = w + 'px';
    pop.style.left = Math.max(12, Math.min(innerWidth - w - 12, r.left + r.width / 2 - w / 2)) + 'px';
    var below = r.bottom + 10, h = pop.offsetHeight;
    pop.style.top = (below + h > innerHeight - 90 && r.top - h - 10 > 50 ? r.top - h - 10 : below) + window.pageYOffset + 'px';
    pop.querySelector('.tp-x').focus({ preventScroll: true });
    if (window.BROverlay) window.BROverlay.push('term', closePop);
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('button.term');
    if (t) { e.preventDefault(); openPop(t); return; }
    if (pop.hidden) return;
    var show = e.target.closest && e.target.closest('.termpop .lv-show');
    if (show) { revealed[show.getAttribute('data-key')] = true; var b = popFor; closePop(); openPop(b); paintAll(); return; }
    if (e.target.closest && (e.target.closest('.tp-x') || e.target.closest('.tp-more'))) { var back = popFor; closePop(); if (back && e.target.closest('.tp-x')) back.focus(); return; }
    if (!pop.contains(e.target)) closePop();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pop.hidden) { var b = popFor; closePop(); if (b) b.focus(); } });
  window.addEventListener('br:view', closePop);
  window.addEventListener('resize', function () { if (!pop.hidden && popFor && !popFor.getClientRects().length) closePop(); });

  /* ================= timeline ================= */
  var tl = view.querySelector('.tl'), scale = view.querySelector('.tl-scale'), filter = 'all';
  function era(y) { return y <= 2019 ? 'e1' : y <= 2039 ? 'e2' : 'e3'; }
  function paintTimeline() {
    var ev = L.events.slice().sort(function (a, b) { return a.y - b.y; }), years = [], by = {};
    ev.forEach(function (e) { if (!by[e.y]) { by[e.y] = []; years.push(e.y); } by[e.y].push(e); });
    var html = '';
    years.forEach(function (y, i) {
      if (i && y - years[i - 1] >= 5) html += '<li class="tl-gap" aria-hidden="true"><span>' + (y - years[i - 1]) + ' years</span></li>';
      var items = by[y].filter(function (e) { return filter === 'all' || e.k === filter; });
      html += '<li class="tl-year ' + era(y) + '" id="tl-' + y + '"' + (items.length ? '' : ' hidden') + '><div class="tl-y">' + esc(by[y][0].when || y) + '</div><div class="tl-evs">' +
        items.map(function (e, n) {
          var key = 'tl:' + y + ':' + n, lock = locked(e.s, key);
          return '<div class="tl-ev k-' + e.k + '"><div class="tl-k">' + (e.k === 'world' ? 'The world' : 'Story') + '</div><h3><a href="' + e.go + '">' + esc(e.t) + '</a></h3>' +
            (lock ? veil(e.s, key) : '<p>' + esc(e.d) + '</p>') + '</div>';
        }).join('') + '</div></li>';
    });
    tl.innerHTML = html;
    // the scale: 2005-2050 takes most of the width, then a break to 2099
    function pos(y) { return y <= 2050 ? (y - 2005) / 45 * 84 : 90 + (y - 2090) / 10 * 8; }
    var s = '<div class="tls-line"></div><div class="tls-break" style="left:87%"></div>';
    [2010, 2020, 2030, 2040, 2050].forEach(function (d) { s += '<span class="tls-tick" style="left:' + pos(d) + '%">' + d + '</span>'; });
    s += '<span class="tls-tick" style="left:' + pos(2099) + '%">2099</span>';
    years.forEach(function (y) { s += '<a class="tls-dot ' + era(y) + '" href="#tl-' + y + '" style="left:' + pos(y) + '%" aria-label="' + y + '" title="' + y + '"></a>'; });
    scale.innerHTML = s;
  }
  view.querySelector('.tl-filter').addEventListener('click', function (e) {
    var b = e.target.closest('[data-tl]'); if (!b) return;
    filter = b.getAttribute('data-tl');
    Array.prototype.forEach.call(this.querySelectorAll('[data-tl]'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    paintTimeline();
  });

  /* ================= connections ================= */
  var cxSvg = view.querySelector('.cx-svg'), cxPanel = view.querySelector('.cx-panel'), cxHidden = view.querySelector('.cx-hidden');
  var PEOPLE = {}; L.people.forEach(function (p) { PEOPLE[p.id] = p; });
  var KIND = { h: 'Human', r: 'Replicant', m: 'Somewhere in between' };
  var sel = null, layoutKey = '', pos = {};
  function visibleGraph() {
    var nodes = L.people.filter(function (p) { return !locked(p.s, 'cx:' + p.id); }), ok = {};
    nodes.forEach(function (p) { ok[p.id] = true; });
    var shown = [], hidden = 0;
    L.links.forEach(function (l, i) {
      if (!ok[l[0]] || !ok[l[1]]) { hidden++; return; }
      if (locked(l[3], 'cx:l' + i)) { hidden++; return; }
      shown.push(l);
    });
    return { nodes: nodes, links: shown, hidden: hidden };
  }
  function layout(nodes, links, W, H) {
    // a small, seeded force layout so the picture is the same on every visit
    var P = {}, seed = 7; function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    nodes.forEach(function (n, i) { var a = i / nodes.length * Math.PI * 2; P[n.id] = { x: W / 2 + Math.cos(a) * W * .3 + rnd() * 10, y: H / 2 + Math.sin(a) * H * .3 + rnd() * 10, vx: 0, vy: 0 }; });
    var ideal = Math.sqrt(W * H / nodes.length) * .8;
    for (var it = 0; it < 420; it++) {
      var cool = 1 - it / 420;
      nodes.forEach(function (a) {
        var pa = P[a.id];
        nodes.forEach(function (b) {
          if (a === b) return; var pb = P[b.id], dx = pa.x - pb.x, dy = pa.y - pb.y, d2 = dx * dx + dy * dy + .01, d = Math.sqrt(d2);
          var f = ideal * ideal / d2 * .9; pa.vx += dx / d * f; pa.vy += dy / d * f;
        });
        pa.vx += (W / 2 - pa.x) * .006; pa.vy += (H / 2 - pa.y) * .007;
      });
      links.forEach(function (l) {
        var a = P[l[0]], b = P[l[1]], dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) + .01, f = (d - ideal) * .06;
        a.vx += dx / d * f; a.vy += dy / d * f; b.vx -= dx / d * f; b.vy -= dy / d * f;
      });
      nodes.forEach(function (n) {
        var p = P[n.id], lim = 18 * cool + 1, v = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (v > lim) { p.vx *= lim / v; p.vy *= lim / v; }
        p.x = Math.max(56, Math.min(W - 56, p.x + p.vx)); p.y = Math.max(24, Math.min(H - 30, p.y + p.vy)); p.vx *= .5; p.vy *= .5;
      });
    }
    // nudge apart any names whose labels would overlap (label sits under the dot)
    var box = function (n) { var p = P[n.id], w = n.n.length * 7.4 + 6; return { l: p.x - w / 2, r: p.x + w / 2, t: p.y - 9, b: p.y + 27 }; };
    for (var pass = 0; pass < 160; pass++) {
      var moved = false;
      for (var i = 0; i < nodes.length; i++) for (var j = i + 1; j < nodes.length; j++) {
        var A = box(nodes[i]), B = box(nodes[j]), ox = Math.min(A.r, B.r) - Math.max(A.l, B.l), oy = Math.min(A.b, B.b) - Math.max(A.t, B.t);
        if (ox <= 0 || oy <= 0) continue;
        var pa = P[nodes[i].id], pb = P[nodes[j].id]; moved = true;
        if (oy < ox) { var dy = (oy / 2 + 1) * (pa.y < pb.y ? -1 : 1); pa.y += dy; pb.y -= dy; }
        else { var dx = (ox / 2 + 1) * (pa.x < pb.x ? -1 : 1); pa.x += dx; pb.x -= dx; }
      }
      nodes.forEach(function (n) { var p = P[n.id], w = n.n.length * 3.7 + 4; p.x = Math.max(w, Math.min(W - w, p.x)); p.y = Math.max(16, Math.min(H - 30, p.y)); });
      if (!moved) break;
    }
    return P;
  }
  function paintConnections() {
    if (view.hidden) return;   // laid out the first time Lore is opened
    var g = visibleGraph(), narrow = cxSvg.parentNode.clientWidth < 560, W = narrow ? 380 : 760, H = narrow ? 640 : 560;
    var key = g.nodes.map(function (n) { return n.id; }).join() + '|' + g.links.length + '|' + W;
    if (key !== layoutKey) { pos = layout(g.nodes, g.links, W, H); layoutKey = key; }
    if (sel && !g.nodes.some(function (n) { return n.id === sel; })) sel = null;
    var near = {}; if (sel) { near[sel] = true; g.links.forEach(function (l) { if (l[0] === sel) near[l[1]] = true; if (l[1] === sel) near[l[0]] = true; }); }
    cxSvg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var s = '<g class="cx-links">' + g.links.map(function (l) {
      var a = pos[l[0]], b = pos[l[1]], on = sel && (l[0] === sel || l[1] === sel);
      return '<line x1="' + a.x.toFixed(1) + '" y1="' + a.y.toFixed(1) + '" x2="' + b.x.toFixed(1) + '" y2="' + b.y.toFixed(1) + '" class="' + (on ? 'on' : sel ? 'dim' : '') + '"/>';
    }).join('') + '</g><g class="cx-nodes">';
    s += g.nodes.map(function (n) {
      var p = pos[n.id], cls = 'cx-n k-' + n.k + (sel ? (n.id === sel ? ' sel' : near[n.id] ? ' near' : ' dim') : '');
      return '<g class="' + cls + '" data-id="' + n.id + '" tabindex="0" role="button" aria-label="' + esc(n.n) + '" transform="translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ')">' +
        '<circle r="14" class="hit"/><circle r="' + (n.f ? 7 : 5.5) + '"/><text y="22">' + esc(n.n) + '</text></g>';
    }).join('') + '</g>';
    cxSvg.innerHTML = s;
    cxHidden.textContent = g.hidden ? g.hidden + (g.hidden === 1 ? ' connection is' : ' connections are') + ' hidden by the spoiler shield.' : '';
    // the side panel
    if (!sel) { cxPanel.innerHTML = '<p class="dimline">Tap a name to see how they are connected.</p>'; return; }
    var p = PEOPLE[sel], mine = g.links.filter(function (l) { return l[0] === sel || l[1] === sel; });
    var hiddenMine = L.links.filter(function (l) { return (l[0] === sel || l[1] === sel); }).length - mine.length;
    cxPanel.innerHTML = '<div class="cx-h k-' + p.k + '"><h3>' + esc(p.n) + '</h3><span>' + KIND[p.k] + '</span></div>' + (p.note ? '<p class="dimline">' + esc(p.note) + '</p>' : '') +
      '<ul class="cx-list">' + mine.map(function (l) { var o = PEOPLE[l[0] === sel ? l[1] : l[0]];
        return '<li><button type="button" data-go="' + o.id + '">' + esc(o.n) + '</button><span>' + esc(l[2]) + '</span></li>'; }).join('') + '</ul>' +
      (hiddenMine > 0 ? '<p class="dimline">' + hiddenMine + ' more hidden by the spoiler shield.</p>' : '') +
      (p.f ? '<a class="cx-file" href="#' + p.f + '">Open character file →</a>' : '');
  }
  function pick(id) { sel = sel === id ? null : id; paintConnections(); }
  cxSvg.addEventListener('click', function (e) { var n = e.target.closest('.cx-n'); pick(n ? n.getAttribute('data-id') : null); });
  cxSvg.addEventListener('keydown', function (e) { var n = e.target.closest('.cx-n'); if (n && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pick(n.getAttribute('data-id')); var f = cxSvg.querySelector('.cx-n[data-id="' + sel + '"]'); if (f) f.focus(); } });
  cxPanel.addEventListener('click', function (e) { var b = e.target.closest('[data-go]'); if (b) { sel = b.getAttribute('data-go'); paintConnections(); } });

  /* ================= map ================= */
  var mpStage = view.querySelector('.mp-stage'), mpPanel = view.querySelector('.mp-panel'), place = null;
  var COAST = '45,0 40,40 58,70 82,118 108,170 136,224 160,262 196,276 232,306 252,330 272,362 296,400 312,436 330,480 340,530 362,580 384,620';
  function mapSvg(narrow) {
    var fs = narrow ? 26 : 14, fsBig = narrow ? 30 : 17, iw = narrow ? 220 : 150, ih = narrow ? 84 : 66;
    var s = '<svg viewBox="0 0 700 620" class="mp-svg" role="group" aria-label="Map of California, Nevada and Baja, with insets for Tokyo and the off-world colonies">' +
      '<defs><pattern id="mpgrid" width="35" height="35" patternUnits="userSpaceOnUse"><path d="M35 0H0V35" fill="none" class="mp-grid"/></pattern>' +
      '<radialGradient id="mpglow"><stop offset="0" stop-color="#ffb347" stop-opacity=".55"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient></defs>' +
      '<rect width="700" height="620" class="mp-sea"/><rect width="700" height="620" fill="url(#mpgrid)"/>' +
      '<polygon points="' + COAST + ' 700,620 700,0" class="mp-land"/>' +
      '<polyline points="' + COAST + '" class="mp-coast"/>' +
      '<ellipse cx="220" cy="398" rx="13" ry="5" class="mp-land mp-isle"/><ellipse cx="318" cy="548" rx="9" ry="4" class="mp-land mp-isle"/>' +
      '<circle cx="252" cy="332" r="46" fill="url(#mpglow)"/>' +
      '<text x="60" y="300" class="mp-sea-l" transform="rotate(-62 60 300)">PACIFIC OCEAN</text>' +
      '<text x="470" y="120" class="mp-area">NEVADA</text><text x="300" y="150" class="mp-area">CALIFORNIA</text><text x="470" y="560" class="mp-area">MEXICO</text>' +
      '<text x="520" y="250" class="mp-area sm">MOJAVE</text>' +
      '<g class="mp-rose" transform="translate(640 560)"><circle r="22"/><path d="M0 -28 L5 0 L0 28 L-5 0Z"/><text y="-32">N</text></g>' +
      '<text x="690" y="612" class="mp-note">NOT TO SCALE</text>';
    // insets for places off this map
    L.insets.forEach(function (ins, i) {
      var y = (narrow ? 420 : 450) + i * (ih + 14);
      s += '<g class="mp-inset" data-id="' + ins.id + '" tabindex="0" role="button" aria-label="' + esc(ins.n) + '"><rect x="12" y="' + y + '" width="' + iw + '" height="' + ih + '" rx="3"/>' +
        '<text x="26" y="' + (y + ih * .4) + '" class="mp-in-h" style="font-size:' + (narrow ? 26 : 16) + 'px">' + esc(ins.n.toUpperCase()) + '</text><text x="26" y="' + (y + ih * .76) + '" class="mp-in-s" style="font-size:' + (narrow ? 19 : 11) + 'px">' + (ins.id === 'tokyo' ? '9,000 km west' : 'Beyond Earth') + ' ›</text></g>';
    });
    L.places.forEach(function (p) {
      var left = p.x > (narrow ? 420 : 520), tx = left ? -(narrow ? 18 : 14) : (narrow ? 18 : 14);
      s += '<g class="mp-pin' + (p.big ? ' big' : '') + '" data-id="' + p.id + '" tabindex="0" role="button" aria-label="' + esc(p.n) + '" transform="translate(' + p.x + ' ' + p.y + ')">' +
        '<circle r="' + (narrow ? 30 : 20) + '" class="hit"/><circle r="' + (p.big ? 9 : 6) * (narrow ? 1.5 : 1) + '" class="ring"/><circle r="' + (p.big ? 4 : 3) * (narrow ? 1.5 : 1) + '" class="dot"/>' +
        '<text x="' + tx + '" y="' + (narrow ? 9 : 5) + '" text-anchor="' + (left ? 'end' : 'start') + '" style="font-size:' + (p.big ? fsBig : fs) + 'px">' + esc(narrow ? p.sn || p.n : p.n) + '</text></g>';
    });
    return s + '</svg>';
  }
  var mapNarrow = null;
  function paintMap() {
    var narrow = (mpStage.clientWidth || innerWidth) < 560;
    if (narrow !== mapNarrow) { mpStage.innerHTML = mapSvg(narrow); mapNarrow = narrow; }
    Array.prototype.forEach.call(mpStage.querySelectorAll('[data-id]'), function (g) { g.classList.toggle('sel', g.getAttribute('data-id') === place); });
    var all = L.places.concat(L.insets), p = null; all.forEach(function (x) { if (x.id === place) p = x; });
    if (!p) {
      mpPanel.innerHTML = '<p class="dimline">Tap a marker, or pick a place:</p><div class="mp-picks">' + all.map(function (x) { return '<button type="button" data-pick="' + x.id + '">' + esc(x.n) + '</button>'; }).join('') + '</div>' +
        '<h3 class="mp-sub">Not on the map</h3><ul class="mp-un">' + L.unmapped.map(function (u, i) {
          var key = 'mp:u' + i; return '<li><strong>' + esc(u.n) + '</strong> ' + (locked(u.s, key) ? veil(u.s, key) : esc(u.d) + ' <span class="apps">' + links(u.go) + '</span>') + '</li>';
        }).join('') + '</ul>';
      return;
    }
    var body = '<div class="mp-h"><h3>' + esc(p.n) + '</h3><button type="button" class="mp-back">All places</button></div><p>' + esc(p.d) + '</p>';
    if (p.spots) body += '<ul class="mp-spots">' + p.spots.map(function (sp) { return '<li><strong>' + esc(sp[0]) + '</strong><span class="apps">' + links(sp[1]) + '</span></li>'; }).join('') + '</ul>';
    else body += '<div class="apps">' + links(p.go) + '</div>';
    mpPanel.innerHTML = body;
  }
  function pickPlace(id) { place = place === id ? null : id; paintMap(); }
  mpStage.addEventListener('click', function (e) { var g = e.target.closest('[data-id]'); pickPlace(g ? g.getAttribute('data-id') : null); });
  mpStage.addEventListener('keydown', function (e) { var g = e.target.closest('[data-id]'); if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pickPlace(g.getAttribute('data-id')); } });
  mpPanel.addEventListener('click', function (e) {
    var b = e.target.closest('[data-pick]'); if (b) { place = b.getAttribute('data-pick'); paintMap(); return; }
    if (e.target.closest('.mp-back')) { place = null; paintMap(); }
  });

  /* ================= wiring ================= */
  function paintAll() { paintGlossary(); paintTimeline(); paintConnections(); paintMap(); }
  paintAll();
  if (R) R.onChange(function () { setTimeout(paintAll, 0); });
  var lastNarrow = null;
  window.addEventListener('resize', function () { var n = cxSvg.parentNode.clientWidth < 560; if (n !== lastNarrow) { lastNarrow = n; if (!view.hidden) { paintConnections(); paintMap(); } } });
  window.addEventListener('br:view', function (e) { if (e.detail && e.detail.view === 'lore') { lastNarrow = null; setTimeout(function () { paintConnections(); paintMap(); }, 0); } });
})();
