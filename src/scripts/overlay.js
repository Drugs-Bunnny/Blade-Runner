/* Pop-ups (search, ESPER, quiz, sync, term definitions) each get a history entry while open,
   so the phone's back button closes the pop-up instead of leaving the page.
   Loaded first, so its popstate listener runs before the router's.
   It also keeps Tab inside whichever modal dialog is open (search, ESPER, quiz, sync), so the keyboard
   can't wander into the page behind it. The term pop-up isn't modal, so Tab can leave it. */
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

// Focus trap: while a modal dialog is open, Tab and Shift+Tab cycle through its own controls.
(function () {
  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  function openModal() {
    var all = document.querySelectorAll('[role="dialog"][aria-modal="true"]'), top = null;
    Array.prototype.forEach.call(all, function (d) { if (!d.hidden && d.getClientRects().length) top = d; });
    return top;
  }
  function controls(box) {
    return Array.prototype.filter.call(box.querySelectorAll(FOCUSABLE), function (el) {
      return !el.hidden && !el.closest('[hidden]') && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden';
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    var box = openModal(); if (!box) return;
    var list = controls(box), active = document.activeElement;
    if (!list.length) { e.preventDefault(); return; }
    var first = list[0], last = list[list.length - 1];
    if (!box.contains(active)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
    else if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
  }, true);
})();
