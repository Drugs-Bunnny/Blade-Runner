/* Pop-ups (search, ESPER, quiz, sync, term definitions) each get a history entry while open,
   so the phone's back button closes the pop-up instead of leaving the page.
   Loaded first, so its popstate listener runs before the router's. */
window.BROverlay = (function () {
  var stack = [], swallow = 0, pendingBack = null;
  function push(key, closeFn) {
    if (stack.some(function (s) { return s.key === key; })) return;
    stack.push({ key: key, close: closeFn });
    // closed and reopened in the same moment (another term tapped): keep the entry it already has
    if (pendingBack && history.state && history.state.ov === key) { clearTimeout(pendingBack); pendingBack = null; return; }
    try {
      var cur = history.state || {}, keep = {}; Object.keys(cur).forEach(function (k) { keep[k] = cur[k]; }); keep.y = window.pageYOffset;
      history.replaceState(keep, '', location.href);
      history.pushState({ ov: key, y: window.pageYOffset }, '', location.href);
    } catch (e) {}
  }
  // closed from its own button, Escape or the backdrop: step back over its history entry
  function pop(key) {
    var i = -1; stack.forEach(function (s, n) { if (s.key === key) i = n; }); if (i < 0) return;
    stack.splice(i, 1);
    if (history.state && history.state.ov === key) {
      clearTimeout(pendingBack);
      pendingBack = setTimeout(function () { pendingBack = null; swallow++; history.back(); }, 0);
    }
  }
  // a link inside a pop-up is navigating: the router replaces the pop-up's entry instead of adding one
  function navigating() {
    var was = !!pendingBack || !!(history.state && history.state.ov);
    clearTimeout(pendingBack); pendingBack = null; return was;
  }
  window.addEventListener('popstate', function (e) {
    if (swallow) { swallow--; e.stopImmediatePropagation(); return; }
    if (stack.length) { var s = stack.pop(); e.stopImmediatePropagation(); s.close(); }
  });
  return { push: push, pop: pop, navigating: navigating };
})();
