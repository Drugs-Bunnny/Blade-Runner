/* GitHub Pages copy only: offline support and an "Install as an app" button where the browser offers it. */
(function () {
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
  var offer = null, btns = document.querySelectorAll('.install-btn');
  function show(on) { Array.prototype.forEach.call(btns, function (b) { b.hidden = !on; }); }
  addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); offer = e; show(true); });
  addEventListener('appinstalled', function () { offer = null; show(false); });
  Array.prototype.forEach.call(btns, function (b) {
    b.addEventListener('click', function () { if (!offer) return; offer.prompt(); offer.userChoice.then(function () { offer = null; show(false); }); });
  });
})();
