/* One place that answers "should things move?". Motion is reduced when the device asks for it
   (prefers-reduced-motion) or when the reader switches on the "Calm" chip in the player. The choice
   is saved in this browser. Animations in scripts ask BRMotion.reduced() and listen with onChange();
   the stylesheets use the data-motion="reduced" attribute set on <html>. The chip can only add calm:
   when the device already asks for reduced motion it shows as on and can't be switched off. */
window.BRMotion = (function () {
  var KEY = 'br-motion', mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var listeners = [], user = false, last;
  try { user = localStorage.getItem(KEY) === 'reduced'; } catch (e) {}
  function system() { return !!(mq && mq.matches); }
  function reduced() { return user || system(); }
  function apply() {
    var r = reduced(), root = document.documentElement;
    if (r) root.setAttribute('data-motion', 'reduced'); else root.removeAttribute('data-motion');
    if (r !== last) { last = r; listeners.forEach(function (fn) { try { fn(r); } catch (e) {} }); }
    window.dispatchEvent(new Event('br:motion'));
  }
  function set(on) {
    user = !!on;
    try { if (user) localStorage.setItem(KEY, 'reduced'); else localStorage.removeItem(KEY); } catch (e) {}
    apply();
  }
  if (mq) { if (mq.addEventListener) mq.addEventListener('change', apply); else if (mq.addListener) mq.addListener(apply); }
  last = reduced(); apply();

  // the "Calm" chip in the player
  function wire() {
    var btn = document.getElementById('scoremotion'); if (!btn) return;
    function ui() {
      var sys = system(), on = reduced();
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.disabled = sys;
      btn.title = sys ? 'Your device is set to reduce motion' : on ? 'Motion reduced. Tap to allow motion again' : 'Reduce motion: stills the city, rain and flicker';
    }
    btn.addEventListener('click', function () { set(!user); });
    window.addEventListener('br:motion', ui); ui();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();

  return { reduced: reduced, system: system, set: set, onChange: function (fn) { listeners.push(fn); } };
})();
