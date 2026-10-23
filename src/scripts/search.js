/* Search across synopses, character files and story intros.
   The index is built from the page itself, so it never goes out of date. */
(function () {
  var btn = document.getElementById('searchbtn');
  if (!btn) return;

  // story prefix -> label used in results (issue ids look like "b12", "l3", "gm2")
  var STORY = { i: 'Origins', tn: 'Tokyo Nexus', f: 'Blade Runner', gm: 'The game', b: '2019', bo: 'Black Out 2022',
    c: '2029', l: 'Black Lotus', ll: 'Leaving L.A.', lv: 'Las Vegas', dawn: 'Nexus Dawn', d: '2039', run: 'Nowhere to Run', g: '2049' };
  var ERA = { era1: 'Era I', era2: 'Era II', era3: 'Era III', people: 'Files', archive: 'Archive' };

  function norm(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\u2018\u2019]/g, "'"); }
  // match terms only at the start of a word: "isob" finds Isobel, "nia" doesn't find Niander's middle
  function words(s) { return ' ' + norm(s).replace(/[^a-z0-9']+/g, ' ') + ' '; }
  function splitTerms(q) { return words(q).trim().split(/\s+/).filter(Boolean); }
  function isWordStart(src, i) { return i === 0 || !/[a-z0-9]/.test(src.charAt(i - 1)); }
  function text(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // ---------- build the index ----------
  var items = [];
  function viewOf(el) { var v = el.closest('.view'); return v ? v.id : ''; }
  Array.prototype.forEach.call(document.querySelectorAll('article.issue[id]'), function (a) {
    var pre = (a.id.match(/^[a-z]+/) || [''])[0], no = a.querySelector('.no'), body = a.querySelector('.ib') || a;
    var label = no ? (no.childNodes[0].nodeValue || '').trim() : '';
    var cap = no && no.querySelector('small') ? text(no.querySelector('small')) : '';
    var title = text(a.querySelector('h3'));
    items.push({ id: a.id, kind: 'entry', where: (STORY[pre] || '') + (label && label !== '—' ? ' ' + label : ''), title: title,
      sub: cap, text: Array.prototype.map.call(body.querySelectorAll('p'), text).join(' '), lock: [a.id], view: viewOf(a) });
  });
  Array.prototype.forEach.call(document.querySelectorAll('.dossier[id]'), function (d) {
    items.push({ id: d.id, kind: 'file', where: 'Character file', title: text(d.querySelector('h3')), sub: text(d.querySelector('.kind')),
      text: text(d.querySelector('.dzb p')), lock: (d.getAttribute('data-spoils') || '').split(/\s+/).filter(Boolean), view: 'people' });
  });
  Array.prototype.forEach.call(document.querySelectorAll('section[id] > .wrap > .vol-banner'), function (b) {
    var sec = b.parentElement.parentElement, h = b.querySelector('h2'), num = text(b.querySelector('.num'));
    items.push({ id: sec.id, kind: 'story', where: /^VOL/i.test(num) ? 'Origins · Vol. ' + num.replace(/\D+/g, '') : 'Story · ' + num, title: text(h),
      sub: Array.prototype.map.call(b.querySelectorAll('.chips span'), text).join(' · '), text: text(b.querySelector('p')), lock: [], view: viewOf(b) });
  });
  // Origins case files: these describe the ending, so they unlock with the whole story
  Array.prototype.forEach.call(document.querySelectorAll('#files .file:not(.dossier)'), function (f, n) {
    if (!f.id) f.id = 'case-' + (n + 1);
    items.push({ id: f.id, kind: 'file', where: 'Origins case file', title: text(f.querySelector('h3')), sub: text(f.querySelector('.kind')),
      text: text(f.querySelector('p')), lock: ['story:i'], view: 'era1' });
  });
  items.forEach(function (it) { it.nTitle = words(it.title); it.nWhere = words(it.where); it.nAll = words(it.where + ' ' + it.title + ' ' + it.sub + ' ' + it.text); it.nText = words(it.text); });

  function locked(it) {
    var R = window.BRReader; if (!R || !R.shield() || !it.lock.length) return false;
    return !it.lock.every(function (k) { return k.indexOf('story:') === 0 ? R.storyDone(k.slice(6)) : R.isRead(k); });
  }

  // ---------- search ----------
  function search(q) {
    var terms = splitTerms(q);
    if (!terms.length) return [];
    var phrase = ' ' + terms.join(' '), out = [];
    items.forEach(function (it) {
      for (var i = 0; i < terms.length; i++) if (it.nAll.indexOf(' ' + terms[i]) < 0) return;
      var score = 0;
      terms.forEach(function (t) { if (it.nTitle.indexOf(' ' + t) >= 0) score += 6; if (it.nWhere.indexOf(' ' + t) >= 0) score += 3; score += Math.min(4, it.nText.split(' ' + t).length - 1); });
      if (terms.length > 1 && it.nAll.indexOf(phrase) >= 0) score += 8;
      // a whole-word hit beats a prefix hit: "nia" ranks Nia above Niander
      terms.forEach(function (t) { if (it.nTitle.indexOf(' ' + t + ' ') >= 0) score += 5; else if (it.nAll.indexOf(' ' + t + ' ') >= 0) score += 2; });
      if (it.kind === 'file') score += 2;
      if (it.kind === 'story') score += 1;
      out.push({ it: it, score: score, order: items.indexOf(it) });
    });
    out.sort(function (a, b) { return b.score - a.score || a.order - b.order; });
    return out;
  }
  function snippet(it, terms) {
    var src = it.text || it.sub, n = norm(src), at = -1;
    for (var i = 0; i < terms.length && at < 0; i++) { var p0 = -1; while ((p0 = n.indexOf(terms[i], p0 + 1)) >= 0) if (isWordStart(n, p0)) { at = p0; break; } }
    var start = Math.max(0, (at < 0 ? 0 : at) - 60), end = Math.min(src.length, start + 170);
    if (start > 0) { var sp = src.indexOf(' ', start); if (sp > 0 && sp < start + 20) start = sp + 1; }
    var cut = src.slice(start, end), ncut = norm(cut), marks = [];
    terms.forEach(function (t) { var p = 0; while ((p = ncut.indexOf(t, p)) >= 0) { if (isWordStart(ncut, p)) marks.push([p, p + t.length]); p += t.length; } });
    marks.sort(function (a, b) { return a[0] - b[0]; });
    var html = '', pos = 0;
    marks.forEach(function (m) { if (m[0] < pos) return; html += esc(cut.slice(pos, m[0])) + '<mark>' + esc(cut.slice(m[0], m[1])) + '</mark>'; pos = m[1]; });
    html += esc(cut.slice(pos));
    return (start > 0 ? '… ' : '') + html + (end < src.length ? ' …' : '');
  }

  // ---------- panel ----------
  var panel = document.getElementById('searchpanel'), input = document.getElementById('searchinput'),
      list = document.getElementById('searchresults'), status = document.getElementById('searchstatus'), closeB = document.getElementById('searchclose');
  var active = -1, opener = null;
  function open() {
    opener = document.activeElement; panel.hidden = false; btn.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('searching'); input.focus(); input.select(); run();
  }
  function close(restore) {
    panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); document.documentElement.classList.remove('searching');
    if (restore && opener && opener.focus) opener.focus();
  }
  function run() {
    var q = input.value, terms = splitTerms(q), res = search(q);
    active = -1; list.innerHTML = '';
    if (!terms.length) { status.textContent = 'Search ' + items.length + ' entries, files and stories. Try a name, a place or a line you remember.'; return; }
    var shown = res.filter(function (r) { return !locked(r.it); }), hidden = res.length - shown.length;
    shown.slice(0, 40).forEach(function (r, n) {
      var it = r.it, li = document.createElement('li'), a = document.createElement('a');
      a.href = '#' + it.id; a.className = 'sr'; a.id = 'sr-' + n; a.setAttribute('role', 'option');
      a.innerHTML = '<span class="sr-top"><span class="sr-where">' + esc(it.where) + '</span><span class="sr-era">' + esc(ERA[it.view] || '') + '</span></span>' +
        '<span class="sr-title">' + esc(it.title) + (it.sub && it.kind !== 'story' ? ' <small>' + esc(it.sub) + '</small>' : '') + '</span>' +
        '<span class="sr-snip">' + snippet(it, terms) + '</span>';
      li.appendChild(a); list.appendChild(li);
    });
    var msg = shown.length ? shown.length + (shown.length === 1 ? ' match' : ' matches') + (shown.length > 40 ? ', showing the best 40' : '') : 'No matches';
    if (hidden) msg += ' · ' + hidden + ' more in entries you haven’t read (spoiler shield is on)';
    status.textContent = msg + '.';
  }
  function move(d) {
    var links = list.querySelectorAll('a.sr'); if (!links.length) return;
    active = (active + d + links.length) % links.length;
    Array.prototype.forEach.call(links, function (l, i) { l.classList.toggle('on', i === active); });
    links[active].scrollIntoView({ block: 'nearest' }); input.setAttribute('aria-activedescendant', links[active].id);
  }
  function flash(id) {
    var el = document.getElementById(id); if (!el) return;
    el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit');
    setTimeout(function () { el.classList.remove('hit'); }, 2400);
  }

  var timer = null;
  input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(run, 90); });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter') { var l = list.querySelectorAll('a.sr'); var t = l[active >= 0 ? active : 0]; if (t) { e.preventDefault(); t.click(); } }
    else if (e.key === 'Escape') { e.preventDefault(); close(true); }
  });
  // results are ordinary #links, so the page's router does the jump; this just closes the panel
  list.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a.sr'); if (!a) return;
    var id = a.getAttribute('href').slice(1); close(false); setTimeout(function () { flash(id); }, 350);
  });
  btn.addEventListener('click', function () { panel.hidden ? open() : close(true); });
  closeB.addEventListener('click', function () { close(true); });
  panel.addEventListener('click', function (e) { if (e.target === panel) close(true); });
  document.addEventListener('keydown', function (e) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target && e.target.tagName) || '') || (e.target && e.target.isContentEditable);
    if (((e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) && panel.hidden) { e.preventDefault(); open(); }
    else if (e.key === 'Escape' && !panel.hidden) close(true);
  });
  if (window.BRReader) window.BRReader.onChange(function () { if (!panel.hidden) run(); });
})();
