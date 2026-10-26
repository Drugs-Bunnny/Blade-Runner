/* Reading tracker and spoiler shield.
   Progress is kept in this browser only (localStorage), and the page works without it. */
(function () {
  var STORIES = {
    i:    { name: 'Origins',            anchor: '#origins',  verb: 'read' },
    tn:   { name: 'Tokyo Nexus',        anchor: '#tokyo',    verb: 'read' },
    tw:   { name: 'To Lose Is to Win',  anchor: '#tokyo2',   verb: 'read' },
    f:    { name: 'Blade Runner',       anchor: '#film82',   verb: 'watched' },
    gm:   { name: 'Blade Runner (game)', anchor: '#game97',  verb: 'played' },
    b:    { name: 'Blade Runner 2019',  anchor: '#br2019',   verb: 'read' },
    bo:   { name: 'Black Out 2022',     anchor: '#blackout', verb: 'watched' },
    c:    { name: 'Blade Runner 2029',  anchor: '#br2029',   verb: 'read' },
    l:    { name: 'Black Lotus',        anchor: '#lotus',    verb: 'watched' },
    ll:   { name: 'Leaving L.A.',       anchor: '#ll1',      verb: 'read', arc: true },
    lv:   { name: 'Las Vegas',          anchor: '#lv1',      verb: 'read', arc: true },
    dawn: { name: 'Nexus Dawn',         anchor: '#dawn',     verb: 'watched' },
    d:    { name: 'Blade Runner 2039',  anchor: '#br2039',   verb: 'read' },
    run:  { name: 'Nowhere to Run',     anchor: '#nowhere',  verb: 'watched' },
    g:    { name: 'Blade Runner 2049',  anchor: '#film49',   verb: 'watched' }
  };
  // story-wide panels that give away an ending, unlocked when that story is finished
  var PANELS = [['#board', 'i'], ['#files', 'i'], ['.broadcast', 'i'], ['#empathy', 'i']];

  var WORDS = { read: ['Mark read', '✓ Read', 'Read up to here', 'Read'], watched: ['Mark watched', '✓ Watched', 'Watched up to here', 'Watched'], played: ['Mark played', '✓ Played', 'Played up to here', 'Played'] };
  var KEY = 'br-read', SKEY = 'br-shield';
  function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function save(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked: keep going in memory */ } }
  var read = {};
  try { (JSON.parse(load(KEY) || '[]') || []).forEach(function (id) { read[id] = true; }); } catch (e) { read = {}; }
  var shield = load(SKEY) === '1';
  var revealed = {};

  var cards = Array.prototype.slice.call(document.querySelectorAll('article.issue[id]'));
  var byStory = {};
  cards.forEach(function (a) {
    var key = (a.id.match(/^[a-z]+/) || [''])[0];
    if (!STORIES[key]) return;
    a._story = key; (byStory[key] = byStory[key] || []).push(a);
    var body = a.querySelector(':scope > div:not(.no)'); if (body) body.classList.add('ib'); a._body = body;
    var verb = STORIES[key].verb;
    var bar = document.createElement('div'); bar.className = 'rd';
    bar.innerHTML = '<button type="button" class="rd-mark" aria-pressed="false"></button>' +
      '<button type="button" class="rd-upto">' + WORDS[verb][2] + '</button>';
    a.appendChild(bar);
    bar.querySelector('.rd-mark').addEventListener('click', function () { set([a.id], !read[a.id]); });
    bar.querySelector('.rd-upto').addEventListener('click', function () {
      var list = byStory[key], ids = [], on = true;
      for (var i = 0; i < list.length; i++) { ids.push(list[i].id); if (list[i] === a) break; }
      set(ids, on);
    });
    var rv = document.createElement('button'); rv.type = 'button'; rv.className = 'rd-reveal';
    rv.innerHTML = '<span>Spoilers hidden</span><small>Tap to reveal</small>';
    rv.addEventListener('click', function () { revealed[a.id] = true; paint(); });
    a.appendChild(rv);
  });

  // spoiler panels
  PANELS.forEach(function (p) {
    var el = document.querySelector(p[0]); if (!el) return;
    var inner = el.querySelector(':scope > .wrap') || el; inner.classList.add('sp-panel'); inner._story = p[1];
    var rv = document.createElement('button'); rv.type = 'button'; rv.className = 'rd-reveal';
    rv.innerHTML = '<span>Ending spoilers</span><small>Finish ' + STORIES[p[1]].name + ' or tap to reveal</small>';
    rv.addEventListener('click', function () { revealed['panel:' + p[0]] = true; paint(); });
    inner.appendChild(rv); inner._key = 'panel:' + p[0];
  });

  // character files: blurred until every appearance has been read
  var dossiers = Array.prototype.slice.call(document.querySelectorAll('[data-spoils]'));
  dossiers.forEach(function (d) {
    d._ids = d.getAttribute('data-spoils').split(/\s+/).filter(Boolean); d._body = d.querySelector('.dzb');
    var rv = document.createElement('button'); rv.type = 'button'; rv.className = 'rd-reveal';
    rv.innerHTML = '<span>Spoilers hidden</span><small>Tap to reveal</small>';
    rv.addEventListener('click', function () { revealed['file:' + d.id] = true; paint(); });
    d.appendChild(rv);
  });

  // progress meters on each story header
  function meter(cls) { var m = document.createElement('div'); m.className = 'prog ' + (cls || ''); m.innerHTML = '<div class="prog-row"><span class="prog-l"></span><span class="prog-n"></span></div><div class="prog-bar"><i></i></div>'; return m; }
  var meters = [];
  Object.keys(STORIES).forEach(function (k) {
    if (!byStory[k]) return;
    var s = STORIES[k], host = null, m = meter();
    if (s.arc) { var first = document.querySelector(s.anchor), group = first && first.parentElement, h = group && group.previousElementSibling;
      if (h && h.classList.contains('arc')) { m.classList.add('arcprog'); h.parentNode.insertBefore(m, group); host = m; } }
    else { var b = document.querySelector(s.anchor + ' .vol-banner'); if (b) { (b.querySelector('.bt') || b).appendChild(m); host = m; } }
    if (host) meters.push({ el: m, ids: byStory[k].map(function (a) { return a.id; }), label: WORDS[s.verb][3] });
  });

  // era cards and the reading-order list on the hub
  Array.prototype.forEach.call(document.querySelectorAll('a.era-card[href^="#"]'), function (card) {
    var view = document.getElementById(card.getAttribute('href').slice(1)); if (!view) return;
    var m = meter('on-card'); var go = card.querySelector('.go'); card.insertBefore(m, go);
    meters.push({ el: m, ids: cards.filter(function (a) { return view.contains(a); }).map(function (a) { return a.id; }), label: 'Progress' });
  });
  var seen = {};
  Array.prototype.forEach.call(document.querySelectorAll('.chrono li'), function (li) {
    var a = li.querySelector('h3 a'); if (!a) return;
    var target = a.getAttribute('href').slice(1), key = null;
    Object.keys(STORIES).forEach(function (k) { if (STORIES[k].anchor === '#' + target) key = k; });
    if (!key || seen[key]) return; seen[key] = true;
    var tag = document.createElement('span'); tag.className = 'chip-prog'; li.querySelector('h3').appendChild(tag);
    meters.push({ el: tag, ids: (byStory[key] || []).map(function (x) { return x.id; }), chip: true });
  });
  var posters = Array.prototype.map.call(document.querySelectorAll('a.poster[href^="#"]'), function (p) {
    var target = p.getAttribute('href').slice(1), key = null;
    Object.keys(STORIES).forEach(function (k) { if (STORIES[k].anchor === '#' + target) key = k; });
    return { el: p, ids: key && byStory[key] ? byStory[key].map(function (x) { return x.id; }) : [] };
  });

  // reader bar at the top of each view
  var bars = [];
  Array.prototype.forEach.call(document.querySelectorAll('.view'), function (view) {
    var scope = cards.filter(function (a) { return view.contains(a); });
    var all = view.id === 'archive', whole = all || !scope.length; if (whole) scope = cards; // Files and Lore have no entries of their own
    var bar = document.createElement('section'); bar.className = 'readerbar';
    bar.innerHTML = '<div class="wrap"><div class="rb">' +
      '<div class="rb-prog"></div>' +
      '<a class="rb-next" href="#">Continue</a>' +
      '<button type="button" class="rb-shield" aria-pressed="false"><span class="sw" aria-hidden="true"><i></i></span>Spoiler shield</button>' +
      (all ? '<button type="button" class="rb-reset">Reset progress</button>' : '') +
      '</div><p class="rb-note"></p></div>';
    view.insertBefore(bar, view.firstChild);
    var m = meter('rb-meter'); bar.querySelector('.rb-prog').appendChild(m);
    meters.push({ el: m, ids: scope.map(function (a) { return a.id; }), label: whole ? 'Whole archive' : 'This era' });
    bars.push({ el: bar, scope: scope, all: all });
    bar.querySelector('.rb-shield').addEventListener('click', function () { shield = !shield; save(SKEY, shield ? '1' : '0'); revealed = {}; paint(); });
    var reset = bar.querySelector('.rb-reset');
    if (reset) { var armed = null;
      reset.addEventListener('click', function () {
        if (!armed) { reset.textContent = 'Tap again to clear'; reset.classList.add('armed'); armed = setTimeout(function () { reset.textContent = 'Reset progress'; reset.classList.remove('armed'); armed = null; }, 4000); return; }
        clearTimeout(armed); armed = null; read = {}; revealed = {}; save(KEY, '[]'); reset.textContent = 'Progress cleared'; reset.classList.remove('armed');
        setTimeout(function () { reset.textContent = 'Reset progress'; }, 2000); paint(); });
    }
  });

  function set(ids, on) {
    ids.forEach(function (id) { if (on) read[id] = true; else delete read[id]; });
    save(KEY, JSON.stringify(Object.keys(read))); paint();
  }
  function count(ids) { var n = 0; ids.forEach(function (id) { if (read[id]) n++; }); return n; }
  function storyDone(key) { var l = byStory[key] || []; return l.length && count(l.map(function (a) { return a.id; })) === l.length; }

  var listeners = [];
  function paint() {
    listeners.forEach(function (fn) { try { fn(); } catch (e) {} });
    document.documentElement.classList.toggle('shield-on', shield);
    cards.forEach(function (a) {
      var r = !!read[a.id], verb = STORIES[a._story].verb, btn = a.querySelector('.rd-mark');
      a.classList.toggle('is-read', r);
      btn.setAttribute('aria-pressed', r ? 'true' : 'false');
      btn.textContent = r ? WORDS[verb][1] : WORDS[verb][0];
      var veiled = shield && !r && !revealed[a.id];
      a.classList.toggle('veiled', veiled);
      if (a._body) { if (veiled) a._body.setAttribute('inert', ''); else a._body.removeAttribute('inert'); }
    });
    Array.prototype.forEach.call(document.querySelectorAll('.sp-panel'), function (p) {
      var veiled = shield && !storyDone(p._story) && !revealed[p._key];
      p.classList.toggle('veiled', veiled);
      Array.prototype.forEach.call(p.children, function (ch) { if (ch.classList.contains('rd-reveal')) return; if (veiled) ch.setAttribute('inert', ''); else ch.removeAttribute('inert'); });
    });
    dossiers.forEach(function (d) {
      var veiled = shield && count(d._ids) < d._ids.length && !revealed['file:' + d.id];
      d.classList.toggle('veiled', veiled);
      if (d._body) { if (veiled) d._body.setAttribute('inert', ''); else d._body.removeAttribute('inert'); }
    });
    meters.forEach(function (m) {
      var n = count(m.ids), t = m.ids.length;
      if (m.chip) { m.el.textContent = t ? (n === t ? '✓ Done' : n + ' / ' + t) : ''; m.el.classList.toggle('done', t > 0 && n === t); m.el.hidden = !t || n === 0; return; }
      m.el.querySelector('.prog-l').textContent = m.label;
      m.el.querySelector('.prog-n').textContent = n + ' / ' + t + (n === t && t ? ' · complete' : '');
      m.el.querySelector('.prog-bar i').style.width = (t ? (n / t * 100) : 0) + '%';
      m.el.classList.toggle('done', t > 0 && n === t);
    });
    posters.forEach(function (p) { var t = p.ids.length; p.el.classList.toggle('done', t > 0 && count(p.ids) === t); });
    bars.forEach(function (b) {
      var next = null; for (var i = 0; i < b.scope.length; i++) if (!read[b.scope[i].id]) { next = b.scope[i]; break; }
      var link = b.el.querySelector('.rb-next'), note = b.el.querySelector('.rb-note');
      if (next) { link.hidden = false; link.setAttribute('href', '#' + next.id);
        var s = STORIES[next._story], no = next.querySelector('.no');
        var label = no ? no.childNodes[0].nodeValue.trim() : '';
        link.textContent = (count(b.scope.map(function (a) { return a.id; })) ? 'Continue: ' : 'Start: ') + s.name + (label && label !== '—' ? ' ' + label : '');
      } else { link.hidden = true; }
      b.el.querySelector('.rb-shield').setAttribute('aria-pressed', shield ? 'true' : 'false');
      note.textContent = shield ? 'Shield is on: anything you haven’t marked as read is blurred.' : 'Mark issues as you read them. Saved in this browser.';
    });
  }
  paint();
  // the tracker's API, used by search, lore, quizzes and sync
  window.BRReader = {
    isRead: function (id) { return !!read[id]; },
    allRead: function (ids) { return ids.every(function (id) { return read[id]; }); },
    storyDone: function (key) { return !!storyDone(key); },
    shield: function () { return shield; },
    onChange: function (fn) { listeners.push(fn); },
    // used by sync: every read entry id, and replacing the whole set at once
    readIds: function () { return Object.keys(read); },
    replace: function (ids) {
      var known = {}; cards.forEach(function (a) { known[a.id] = true; });
      read = {}; ids.forEach(function (id) { if (known[id]) read[id] = true; });
      save(KEY, JSON.stringify(Object.keys(read))); paint();
    }
  };
})();
