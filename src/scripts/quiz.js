/* Voight-Kampff quizzes: finishing a story unlocks a short test on what happened in it.
   Best scores are kept in this browser (localStorage "br-vk"). */
(function () {
  var L = window.BR_LORE, R = window.BRReader; if (!L || !L.quiz || !R) return;
  var Q = L.quiz, KEY = 'br-vk', best = {};
  try { best = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(best)); } catch (e) {} window.dispatchEvent(new Event('br:scores')); }
  function sfx(n) { window.dispatchEvent(new CustomEvent('br:sfx', { detail: n })); }
  var ANCHOR = { i: '#origins', tn: '#tokyo', tw: '#tokyo2', f: '#film82', gm: '#game97', b: '#br2019', bo: '#blackout', c: '#br2029', l: '#lotus',
    ll: '#ll1', lv: '#lv1', dawn: '#dawn', d: '#br2039', run: '#nowhere', g: '#film49' };
  var NAME = { i: 'Origins', tn: 'Tokyo Nexus', tw: 'To Lose Is to Win', f: 'Blade Runner', gm: 'Blade Runner (game)', b: 'Blade Runner 2019', bo: 'Black Out 2022', c: 'Blade Runner 2029',
    l: 'Black Lotus', ll: 'Leaving L.A.', lv: 'Las Vegas', dawn: 'Nexus Dawn', d: 'Blade Runner 2039', run: 'Nowhere to Run', g: 'Blade Runner 2049' };
  var VERB = { f: 'watching', bo: 'watching', l: 'watching', dawn: 'watching', run: 'watching', g: 'watching', gm: 'playing' };

  // one button per story, next to its progress meter
  var buttons = {};
  Object.keys(Q).forEach(function (k) {
    var anchor = document.querySelector(ANCHOR[k]); if (!anchor) return;
    var host = null;
    if (k === 'll' || k === 'lv') { var grp = anchor.parentElement, prev = grp && grp.previousElementSibling; host = prev && prev.classList.contains('arcprog') ? prev : null; }
    else { var b = anchor.querySelector('.vol-banner'); host = b && (b.querySelector('.bt') || b); }
    if (!host) return;
    var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'vk-btn'; btn.setAttribute('data-story', k);
    host.appendChild(btn); buttons[k] = btn;
    btn.addEventListener('click', function () { if (R.storyDone(k)) open(k); });
  });
  function paintButtons() {
    Object.keys(buttons).forEach(function (k) {
      var b = buttons[k], done = R.storyDone(k), n = Q[k].length, sc = best[k];
      b.disabled = !done; b.classList.toggle('passed', sc !== undefined && sc >= pass(n));
      b.innerHTML = '<span class="vk-eye" aria-hidden="true"></span>' + (!done ? 'Voight-Kampff test · unlocks after ' + (VERB[k] || 'reading') + ' all of it'
        : sc === undefined ? 'Take the Voight-Kampff test' : (sc >= pass(n) ? '✓ Passed' : 'Inconclusive') + ' · ' + sc + ' / ' + n + ' · retake');
    });
  }
  function pass(n) { return Math.ceil(n * .8); }
  R.onChange(function () { setTimeout(paintButtons, 0); }); paintButtons();

  // ---------- the test ----------
  var dlg = document.createElement('div'); dlg.id = 'vk'; dlg.className = 'vk'; dlg.hidden = true;
  dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true'); dlg.setAttribute('aria-label', 'Voight-Kampff test');
  dlg.innerHTML = '<div class="vk-box"><div class="vk-top"><span class="vk-title"></span><button type="button" class="vk-x" aria-label="Close">✕</button></div>' +
    '<div class="vk-scope" aria-hidden="true"><div class="vk-iris"><i></i></div><div class="vk-meters"><div><span>Pupil</span><b><i></i></b></div><div><span>Blush</span><b><i></i></b></div></div></div>' +
    '<div class="vk-body" aria-live="polite"></div></div>';
  document.body.appendChild(dlg);
  var body = dlg.querySelector('.vk-body'), title = dlg.querySelector('.vk-title'), meters = dlg.querySelectorAll('.vk-meters b i'), iris = dlg.querySelector('.vk-iris');
  var story = null, qs = [], at = 0, score = 0, opener = null;
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function needle(a, b) { meters[0].style.width = a + '%'; meters[1].style.width = b + '%'; iris.style.setProperty('--p', (0.32 + a / 300).toFixed(2)); }
  function open(k) {
    story = k; at = 0; score = 0; opener = document.activeElement;
    qs = shuffle(Q[k]).map(function (q) { return { q: q[0], right: q[1], opts: shuffle(q.slice(1)) }; });
    title.textContent = 'V-K · ' + NAME[k].toUpperCase();
    dlg.hidden = false; document.documentElement.classList.add('searching'); ask();
  }
  function close() { dlg.hidden = true; document.documentElement.classList.remove('searching'); if (opener && opener.focus) opener.focus(); }
  function ask() {
    var q = qs[at]; needle(20 + Math.random() * 20, 15 + Math.random() * 15);
    body.innerHTML = '<div class="vk-n">Question ' + (at + 1) + ' of ' + qs.length + '</div><p class="vk-q">' + q.q + '</p><div class="vk-opts">' +
      q.opts.map(function (o, i) { return '<button type="button" class="vk-o" data-i="' + i + '">' + o + '</button>'; }).join('') + '</div>';
    body.querySelector('.vk-o').focus();
    sfx('esper');
  }
  function answer(i) {
    var q = qs[at], ok = q.opts[i] === q.right;
    if (ok) score++;
    needle(ok ? 25 + Math.random() * 10 : 70 + Math.random() * 25, ok ? 20 : 60 + Math.random() * 30);
    Array.prototype.forEach.call(body.querySelectorAll('.vk-o'), function (b, n) {
      b.disabled = true; if (q.opts[n] === q.right) b.classList.add('right'); else if (n === i) b.classList.add('wrong');
    });
    sfx(ok ? 'mark' : 'unmark');
    var next = document.createElement('button'); next.type = 'button'; next.className = 'vk-next';
    next.textContent = at + 1 < qs.length ? 'Next question' : 'See the result';
    body.appendChild(next); next.focus();
  }
  function result() {
    var n = qs.length, passed = score >= pass(n);
    if (best[story] === undefined || score > best[story]) { best[story] = score; save(); }
    needle(passed ? 22 : 88, passed ? 18 : 80);
    body.innerHTML = '<div class="vk-res ' + (passed ? 'ok' : 'no') + '"><div class="vk-verdict">' + (passed ? 'HUMAN' : 'INCONCLUSIVE') + '</div>' +
      '<p>' + score + ' of ' + n + ' correct. ' + (passed ? 'Empathic response within normal limits.' : 'Subject requires further testing. ' + pass(n) + ' of ' + n + ' passes.') + '</p>' +
      '<div class="vk-acts"><button type="button" class="vk-again">Retest</button><button type="button" class="vk-done">Close</button></div></div>';
    body.querySelector(passed ? '.vk-done' : '.vk-again').focus();
    sfx(passed ? 'complete' : 'unmark'); paintButtons();
  }
  body.addEventListener('click', function (e) {
    var o = e.target.closest('.vk-o'); if (o && !o.disabled) { answer(+o.getAttribute('data-i')); return; }
    if (e.target.closest('.vk-next')) { at++; if (at < qs.length) ask(); else result(); return; }
    if (e.target.closest('.vk-again')) { open(story); return; }
    if (e.target.closest('.vk-done')) close();
  });
  dlg.querySelector('.vk-x').addEventListener('click', close);
  dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !dlg.hidden) close(); });
  window.BRQuiz = {
    open: open,
    scores: function () { return JSON.parse(JSON.stringify(best)); },
    // keep the better of two scores for each story (used by sync)
    merge: function (other) {
      var changed = false;
      Object.keys(other || {}).forEach(function (k) { var v = +other[k]; if (Q[k] && v >= 0 && v <= Q[k].length && (best[k] === undefined || v > best[k])) { best[k] = v; changed = true; } });
      if (changed) { try { localStorage.setItem(KEY, JSON.stringify(best)); } catch (e) {} paintButtons(); }
      return changed;
    }
  };
})();
