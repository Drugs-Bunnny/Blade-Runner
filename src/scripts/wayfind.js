/* Finding your way around a long page: a "you are here" marker in the sub-menu, a sticky strip of entry
   numbers inside each story, a back-to-top button, and a player that can shrink out of the way. */
(function () {
  var root = document.documentElement, nav = document.querySelector('nav.bar');
  function reduced() { return !!(window.BRMotion && window.BRMotion.reduced()); }
  function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function save(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked: keep going */ } }

  // the height of the sticky top bar, so the strips can sit just under it
  function navH() { root.style.setProperty('--navh', (nav ? nav.offsetHeight : 0) + 'px'); }
  navH(); window.addEventListener('resize', navH); window.addEventListener('br:view', function () { setTimeout(navH, 0); });
  if (window.ResizeObserver && nav) new ResizeObserver(navH).observe(nav);

  // fade the edge of a sideways-scrolling row when more links lie that way
  function fade(el) {
    el.classList.toggle('more-l', el.scrollLeft > 4);
    el.classList.toggle('more-r', el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  // ---- a strip of entry numbers at the top of every story with three or more entries
  var strips = [];
  Array.prototype.forEach.call(document.querySelectorAll('.view section'), function (sec) {
    var entries = sec.querySelectorAll('article.issue[id]'), host = sec.querySelector('.issues');
    if (entries.length < 3 || !host) return;
    var s = document.createElement('nav'); s.className = 'strip'; s.setAttribute('aria-label', 'Jump to an entry');
    var links = [], lastGroup = null;
    Array.prototype.forEach.call(entries, function (a, i) {
      var no = a.querySelector('.no'), h = a.querySelector('h3'), label = no && no.firstChild ? no.firstChild.nodeValue.trim() : '';
      if (!label || label === '—') label = String(i + 1);
      // entries gathered under their own heading (the comics inside Black Lotus) are a separate run
      var group = a.parentNode, head = group.previousElementSibling;
      while (head && !head.classList.contains('arc') && head.classList.contains('prog')) head = head.previousElementSibling;   // the progress bar sits between
      var arc = head && head.classList.contains('arc') ? (head.textContent.split('·')[1] || '').trim() : '';
      if (lastGroup && group !== lastGroup) { var sep = document.createElement('i'); sep.className = 'sep'; sep.setAttribute('aria-hidden', 'true'); s.appendChild(sep); }
      lastGroup = group;
      var l = document.createElement('a'); l.href = '#' + a.id; l.textContent = label;
      var name = (arc ? arc + ': ' : '') + (h ? h.textContent : label);
      l.title = name; l.setAttribute('aria-label', arc ? arc + ' ' + label + ', ' + (h ? h.textContent : '') : label + (h ? ', ' + h.textContent : ''));
      s.appendChild(l); links.push({ el: l, target: a, id: a.id });
    });
    host.parentNode.insertBefore(s, host);
    s.addEventListener('scroll', function () { fade(s); }, { passive: true });
    strips.push({ el: s, links: links });
  });
  function visible(el) { return !!(el.offsetParent || el.getClientRects().length) && !el.closest('[hidden]'); }
  function paintStrips() {
    if (!window.BRReader) return;
    strips.forEach(function (s) { s.links.forEach(function (l) { l.el.classList.toggle('done', window.BRReader.isRead(l.id)); }); });
  }
  if (window.BRReader) { window.BRReader.onChange(paintStrips); paintStrips(); }

  // ---- "you are here": mark the sub-menu link and the strip entry nearest the top of the screen
  function mark(links, line, scroller) {
    var cur = null;
    links.forEach(function (l) {
      var t = l.target; if (!t || !visible(t)) return;
      var box = t.getBoundingClientRect(), sec = t.tagName === 'SECTION', top = box.top + (sec ? parseFloat(getComputedStyle(t).paddingTop) || 0 : 0);
      // a whole section only counts while it is still on screen; a single entry counts until the next one is reached
      if (top <= line && (!sec || box.bottom > line)) cur = l;
    });
    links.forEach(function (l) {
      var on = l === cur, was = l.el.getAttribute('aria-current') === 'location';
      if (on === was) return;
      if (on) {
        l.el.setAttribute('aria-current', 'location');
        if (scroller && scroller.scrollWidth > scroller.clientWidth + 4)
          scroller.scrollTo({ left: l.el.offsetLeft - (scroller.clientWidth - l.el.offsetWidth) / 2, behavior: reduced() ? 'auto' : 'smooth' });
      } else l.el.removeAttribute('aria-current');
    });
  }
  var subLinks = new WeakMap();
  function linksOf(el) {
    var cached = subLinks.get(el); if (cached) return cached;
    var out = Array.prototype.map.call(el.querySelectorAll('a[href^="#"]'), function (a) { return { el: a, target: document.getElementById(a.getAttribute('href').slice(1)) }; });
    subLinks.set(el, out); return out;
  }
  var pending = false;
  function spy() {
    pending = false;
    var nb = nav ? nav.getBoundingClientRect().bottom : 0, sub = nav && nav.querySelector('.sub:not([hidden])');
    if (sub) mark(linksOf(sub), nb + 40, sub);
    strips.forEach(function (s) {
      if (!visible(s.el)) return;
      mark(s.links, nb + s.el.offsetHeight + 40, s.el);
    });
    toTop.hidden = window.pageYOffset < 900;
  }
  function queue() { if (!pending) { pending = true; requestAnimationFrame(spy); } }

  // ---- back to top
  var toTop = document.createElement('button'); toTop.id = 'totop'; toTop.type = 'button'; toTop.hidden = true; toTop.setAttribute('aria-label', 'Back to top');
  toTop.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 10 L8 5 L13 10"/></svg>';
  toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' });
    var brand = nav && nav.querySelector('.brand'); if (brand) brand.focus({ preventScroll: true });
  });
  document.body.appendChild(toTop);

  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue); window.addEventListener('br:view', function () { setTimeout(queue, 0); });
  window.addEventListener('load', function () { strips.forEach(function (s) { fade(s.el); }); queue(); });
  queue();

  // ---- a player that can shrink to a single button (small screens start that way)
  var score = document.getElementById('score'), mb = document.getElementById('scoremin');
  if (score && mb) {
    var setMin = function (m, remember) {
      score.classList.toggle('min', m);
      mb.setAttribute('aria-expanded', m ? 'false' : 'true');
      mb.setAttribute('aria-label', m ? 'Show player controls' : 'Hide player controls');
      if (remember) save('br-player', m ? 'min' : 'open');
    };
    var pref = load('br-player');
    setMin(pref ? pref === 'min' : window.matchMedia('(max-width: 700px)').matches, false);
    mb.addEventListener('click', function () { setMin(!score.classList.contains('min'), true); });
  }
})();
