/* "Copy link" buttons on every story banner and every entry, so a single issue or episode can be shared.
   The links are the page's own #anchors (the router already scrolls to them). Hidden where a link wouldn't
   work: the Claude artifact copy runs inside a frame and has no address of its own. */
(function () {
  var shareable = /^https?:$/.test(location.protocol) && window.top === window;
  if (!shareable) return;

  var live = document.createElement('div');
  live.className = 'sr-only'; live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite');
  document.body.appendChild(live);

  function urlFor(id) { return location.href.split('#')[0] + '#' + id; }

  function copy(text, done) {
    function fallback() {
      var t = document.createElement('textarea'); t.value = text; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(t); t.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(t);
      if (ok) done(true); else { try { window.prompt('Copy this link', text); } catch (e) {} done(false); }
    }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(function () { done(true); }, fallback);
    else fallback();
  }

  function button(label, id, what) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'share-btn'; b.textContent = label;
    b.setAttribute('aria-label', label + ': ' + what);
    var timer;
    b.addEventListener('click', function () {
      copy(urlFor(id), function (ok) {
        if (!ok) return;
        b.textContent = 'Link copied'; live.textContent = 'Link to ' + what + ' copied';
        clearTimeout(timer); timer = setTimeout(function () { b.textContent = label; live.textContent = ''; }, 2000);
      });
    });
    return b;
  }

  // story banners: the section id is the link
  Array.prototype.forEach.call(document.querySelectorAll('section[id] > .wrap > .vol-banner'), function (banner) {
    var sec = banner.parentElement.parentElement, h = banner.querySelector('h2');
    var row = document.createElement('div'); row.className = 'share-row';
    row.appendChild(button('Copy link', sec.id, (h ? h.textContent : 'this story')));
    banner.appendChild(row);
  });

  // entries: next to Mark read, inside the tracker's button bar
  Array.prototype.forEach.call(document.querySelectorAll('article.issue[id]'), function (a) {
    var bar = a.querySelector('.rd'); if (!bar) return;
    var h = a.querySelector('h3'), no = a.querySelector('.no');
    var what = (no ? (no.childNodes[0].nodeValue || '').trim() + ' ' : '') + (h ? h.textContent : a.id);
    bar.appendChild(button('Copy link', a.id, what.trim()));
  });
})();
