(function () {
  var HEROES = __HEROES__;
  var views = document.querySelectorAll('.view'), hero = document.querySelector('.hero');
  function show(v) {
    Array.prototype.forEach.call(views, function (el) { el.hidden = el.id !== v; });
    Array.prototype.forEach.call(document.querySelectorAll('nav.bar .sub'), function (el) { el.hidden = el.getAttribute('data-for') !== v; });
    Array.prototype.forEach.call(document.querySelectorAll('nav.bar [data-nav]'), function (a) { if (a.getAttribute('data-nav') === v) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    var h = HEROES[v];
    hero.querySelector('.kicker').textContent = h[0];
    var h1 = hero.querySelector('h1'); h1.firstChild.nodeValue = h[1]; h1.querySelector('span').textContent = h[2];
    h1.classList.remove('flicker'); void h1.offsetWidth; h1.classList.add('flicker');
    hero.querySelector('.lede').textContent = h[3];
    var signs = hero.querySelectorAll('.sign'); signs[0].textContent = h[4][0]; signs[1].textContent = h[4][1];
    var prev = document.documentElement.getAttribute('data-mood');
    document.documentElement.setAttribute('data-mood', v);
    // the city, sounds and badges listen for this to change their look
    window.dispatchEvent(new CustomEvent('br:view', { detail: { view: v, changed: prev !== v && prev !== null } }));
    window.dispatchEvent(new Event('resize'));
  }
  function route(id, smooth) {
    var el = id && document.getElementById(id), view = el && (el.classList.contains('view') ? el : el.closest('.view'));
    if (!view) { view = document.getElementById('archive'); el = view; }
    var changed = view.hidden; show(view.id);
    if (el === view) { if (changed || !smooth) window.scrollTo(0, 0); else window.scrollTo({ top: 0, behavior: 'smooth' }); }
    else { var nav = document.querySelector('nav.bar'), pt = el.tagName === 'SECTION' ? parseFloat(getComputedStyle(el).paddingTop) || 0 : 0, y = el.getBoundingClientRect().top + window.pageYOffset + pt - nav.offsetHeight - 16;
      window.scrollTo({ top: y, behavior: changed ? 'auto' : 'smooth' }); }
  }
  // every jump inside the page becomes a history entry, so the phone's back button steps back through them
  function remember() { try { history.replaceState({ y: window.pageYOffset }, '', location.href); } catch (e) {} }
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey) return;
    var a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a) return;
    var id = a.getAttribute('href').slice(1); e.preventDefault();
    if (id && id !== location.hash.slice(1)) { remember(); try { history.pushState({}, '', '#' + id); } catch (er) {} }
    route(id, true);
  });
  window.addEventListener('popstate', function (e) {
    var id = location.hash.slice(1), y = e.state && typeof e.state.y === 'number' ? e.state.y : null;
    if (y === null) { route(id, false); return; }
    var el = id && document.getElementById(id), view = el && (el.classList.contains('view') ? el : el.closest('.view'));
    show(view ? view.id : 'archive'); window.scrollTo(0, y);
  });
  // fade the edge of a sideways-scrolling sub-menu when there are more links that way
  function edges() {
    Array.prototype.forEach.call(document.querySelectorAll('nav.bar .sub'), function (el) {
      el.classList.toggle('more-l', el.scrollLeft > 4);
      el.classList.toggle('more-r', el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll('nav.bar .sub'), function (el) { el.addEventListener('scroll', edges, { passive: true }); });
  window.addEventListener('resize', edges); window.addEventListener('br:view', function () { setTimeout(edges, 0); });
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  route(location.hash.slice(1), false);
  window.addEventListener('load', function () { if (location.hash) route(location.hash.slice(1), false); });
})();
