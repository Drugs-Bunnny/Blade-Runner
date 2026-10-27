/* Progress sync across devices (GitHub Pages copy only).
   Reading progress and Voight-Kampff scores are kept in a private gist in the reader's own GitHub account,
   using a token they paste in once per device. Each read/unread change is timestamped, so two devices that
   changed different things merge cleanly, and the most recent change to the same entry wins. */
(function () {
  var R = window.BRReader; if (!R || !window.fetch) return;
  var TK = 'br-sync-token', GK = 'br-sync-gist', SK = 'br-sync-stamps', LK = 'br-sync-last';
  var FILE = 'blade-runner-archive-progress.json', DESC = 'Blade Runner Archive: reading progress (kept in step by the site)';
  var TOKEN_URL = 'https://github.com/settings/tokens/new?scopes=gist&description=Blade%20Runner%20Archive%20sync';
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function put(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }

  var token = get(TK), gist = get(GK), last = +get(LK) || 0;
  var stamps = {}; try { stamps = JSON.parse(get(SK) || '{}') || {}; } catch (e) { stamps = {}; }
  var applying = false, busy = false, again = false, timer = null, followUp = null, state = token ? 'idle' : 'off', message = '';

  // ---------- change log ----------
  function setOf(ids) { var o = {}; ids.forEach(function (id) { o[id] = true; }); return o; }
  var prev = setOf(R.readIds());
  // entries read before sync was set up count as "read, a long time ago", so they merge as a union
  Object.keys(prev).forEach(function (id) { if (!stamps[id]) stamps[id] = [1, 1]; });
  function saveStamps() { put(SK, JSON.stringify(stamps)); }
  saveStamps();
  function noteChanges() {
    if (applying) return;
    var cur = setOf(R.readIds()), now = Date.now(), changed = false;
    Object.keys(cur).forEach(function (id) { if (!prev[id]) { stamps[id] = [1, now]; changed = true; } });
    Object.keys(prev).forEach(function (id) { if (!cur[id]) { stamps[id] = [0, now]; changed = true; } });
    prev = cur;
    if (changed) { saveStamps(); soon(); }
  }
  R.onChange(function () { setTimeout(noteChanges, 0); });
  window.addEventListener('br:scores', function () { soon(); });

  // ---------- state in the gist ----------
  function snapshot() {
    var read = {}; Object.keys(stamps).sort().forEach(function (id) { read[id] = stamps[id]; });
    var vk = window.BRQuiz ? window.BRQuiz.scores() : {}, vks = {}; Object.keys(vk).sort().forEach(function (k) { vks[k] = vk[k]; });
    return { v: 1, read: read, vk: vks };
  }
  function merge(remote) {
    if (!remote || remote.v !== 1) return;
    Object.keys(remote.read || {}).forEach(function (id) {
      var r = remote.read[id]; if (!Array.isArray(r) || r.length !== 2) return;
      if (!stamps[id] || r[1] > stamps[id][1]) stamps[id] = [r[0] ? 1 : 0, +r[1] || 0];
    });
    saveStamps();
    var want = Object.keys(stamps).filter(function (id) { return stamps[id][0] === 1; }).sort(), have = R.readIds().sort();
    if (want.join() !== have.join()) { applying = true; try { R.replace(want); } finally { applying = false; } prev = setOf(R.readIds()); }
    if (window.BRQuiz && remote.vk) window.BRQuiz.merge(remote.vk);
  }

  // ---------- GitHub ----------
  function api(method, path, body, tok) {
    return fetch('https://api.github.com' + path, {
      method: method, cache: 'no-store',
      headers: { Authorization: 'Bearer ' + (tok || token), Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
      body: body ? JSON.stringify(body) : undefined
    }).then(function (res) {
      if (!res.ok) { var e = new Error('github ' + res.status); e.status = res.status; throw e; }
      return res.status === 204 ? null : res.json();
    });
  }
  function content(obj) { var f = {}; f[FILE] = { content: JSON.stringify(obj, null, 1) }; return f; }
  function findGist(tok) {
    if (gist) return Promise.resolve(gist);
    return api('GET', '/gists?per_page=100', null, tok).then(function (list) {
      var hit = (list || []).filter(function (g) { return g.files && g.files[FILE]; })[0];
      if (hit) return hit.id;
      return api('POST', '/gists', { description: DESC, public: false, files: content(snapshot()) }, tok).then(function (g) { return g.id; });
    }).then(function (id) { gist = id; put(GK, id); return id; });
  }
  function readGist() {
    return api('GET', '/gists/' + gist).then(function (g) {
      var f = g.files && g.files[FILE];
      if (!f) return null;
      if (f.truncated && f.raw_url) return fetch(f.raw_url, { cache: 'no-store' }).then(function (r) { return r.json(); });
      try { return JSON.parse(f.content); } catch (e) { return null; }
    });
  }
  function sync() {
    if (!token) return Promise.resolve();
    if (busy) { again = true; return Promise.resolve(); }
    busy = true; clearTimeout(timer); timer = null; clearTimeout(followUp); show('busy');
    var pushed = false;
    return findGist().then(readGist).then(function (remote) {
      merge(remote);
      var mine = snapshot();
      if (!remote || JSON.stringify({ v: remote.v, read: sortKeys(remote.read), vk: sortKeys(remote.vk) }) !== JSON.stringify(mine)) {
        pushed = true; return api('PATCH', '/gists/' + gist, { files: content(mine) });
      }
    }).then(function () {
      last = Date.now(); put(LK, String(last)); show('idle');
      // if another device saved at the same moment, its upload may have replaced ours:
      // look again shortly and put back anything that went missing
      if (pushed) { clearTimeout(followUp); followUp = setTimeout(sync, 6000); }
    }).catch(function (e) {
      if (e.status === 404) { gist = null; put(GK, null); }   // gist deleted on GitHub: make a new one next time
      if (e.status === 401) show('error', 'GitHub didn’t accept the token. It may have expired or been revoked. Connect again with a new one.');
      else if (e.status === 403 || e.status === 404) show('error', 'GitHub refused access to the gist. Check that the token has the “gist” permission.');
      else show('error', navigator.onLine === false ? 'You’re offline. Progress will sync when you’re back online.' : 'Couldn’t reach GitHub. Will try again shortly.');
      if (!e.status) timer = setTimeout(sync, 60000);
    }).then(function () { busy = false; if (again) { again = false; sync(); } });
  }
  function sortKeys(o) { var r = {}; Object.keys(o || {}).sort().forEach(function (k) { r[k] = o[k]; }); return r; }
  function soon() { if (!token) return; clearTimeout(timer); timer = setTimeout(sync, 2500); }

  if (token) setTimeout(sync, 800);
  document.addEventListener('visibilitychange', function () {
    if (!token) return;
    if (document.visibilityState === 'visible' && Date.now() - last > 20000) sync();
    if (document.visibilityState === 'hidden' && timer) { clearTimeout(timer); sync(); }
  });
  window.addEventListener('online', function () { if (token) sync(); });

  // ---------- interface ----------
  var buttons = [];
  Array.prototype.forEach.call(document.querySelectorAll('.readerbar .rb'), function (rb) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'rb-sync';
    b.innerHTML = '<span class="dot" aria-hidden="true"></span><span class="t"></span>';
    b.addEventListener('click', openDialog);
    var shieldBtn = rb.querySelector('.rb-shield'); rb.insertBefore(b, shieldBtn ? shieldBtn.nextSibling : null);
    buttons.push(b);
  });
  function time(t) { var d = new Date(t); return (d.toDateString() === new Date().toDateString() ? '' : d.toLocaleDateString([], { day: 'numeric', month: 'short' }) + ' ') + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  function show(s, msg) {
    state = s; message = msg || '';
    var label = !token ? 'Sync' : s === 'busy' ? 'Syncing…' : s === 'error' ? 'Sync problem' : last ? 'Synced ' + time(last) : 'Sync on';
    buttons.forEach(function (b) { b.querySelector('.t').textContent = label; b.setAttribute('data-state', token ? s : 'off'); });
    if (!dlg.hidden) paintDialog();
  }

  var dlg = document.createElement('div'); dlg.className = 'syncdlg'; dlg.hidden = true;
  dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true'); dlg.setAttribute('aria-labelledby', 'sync-h');
  dlg.innerHTML = '<div class="sd-box"><div class="sd-top"><h2 id="sync-h">Sync across devices</h2><button type="button" class="sd-x" aria-label="Close">✕</button></div><div class="sd-body"></div></div>';
  document.body.appendChild(dlg);
  var body = dlg.querySelector('.sd-body'), opener = null;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function setupCode() { return 'BRSYNC1.' + btoa(JSON.stringify({ t: token, g: gist })); }
  function paintDialog() {
    if (!token) {
      body.innerHTML =
        '<p>Keep your reading progress and Voight-Kampff scores in step on your phone, tablet and computer. They’re saved in a private gist in your own GitHub account, and nowhere else.</p>' +
        '<ol class="sd-steps"><li><a href="' + TOKEN_URL + '" target="_blank" rel="noopener">Create a token on GitHub ↗</a><span>Leave only <b>gist</b> ticked, pick an expiry date, then tap <b>Generate token</b> and copy it.</span></li>' +
        '<li><span>Paste the token here. On your other devices, paste a setup code from a device that’s already connected, or the same token.</span>' +
        '<form class="sd-form"><input class="sd-in" type="password" autocomplete="off" spellcheck="false" placeholder="ghp_… or BRSYNC1.…" aria-label="Token or setup code"><button type="submit" class="sd-go">Connect</button></form></li></ol>' +
        (message ? '<p class="sd-err" role="alert">' + esc(message) + '</p>' : '') +
        '<p class="sd-small">The token stays in this browser. With only “gist” ticked it can read and write your gists, and nothing else in your account. You can revoke it on GitHub at any time.</p>';
      body.querySelector('.sd-form').addEventListener('submit', function (e) { e.preventDefault(); connect(body.querySelector('.sd-in').value.trim()); });
      return;
    }
    body.innerHTML =
      '<p class="sd-state" data-state="' + state + '"><span class="dot" aria-hidden="true"></span>' +
      (state === 'busy' ? 'Syncing…' : state === 'error' ? esc(message) : last ? 'Synced at ' + time(last) + '. Changes sync a few seconds after you make them.' : 'Connected.') + '</p>' +
      '<div class="sd-acts"><button type="button" class="sd-now">Sync now</button>' + (gist ? '<a href="https://gist.github.com/' + esc(gist) + '" target="_blank" rel="noopener">View the gist ↗</a>' : '') + '</div>' +
      '<h3>Set up another device</h3><p>Open the archive there, tap <b>Sync</b>, and paste this setup code. Treat it like a password: it contains your token.</p>' +
      '<div class="sd-code"><input class="sd-in" type="password" readonly value="' + esc(setupCode()) + '" aria-label="Setup code"><button type="button" class="sd-copy">Copy</button><button type="button" class="sd-reveal" aria-pressed="false">Show</button></div>' +
      '<p class="sd-small">Reset progress on a synced device clears it on all of them.</p>' +
      '<button type="button" class="sd-off">Disconnect this device</button>' +
      '<p class="sd-small">Disconnecting removes the token from this browser only. To stop it working everywhere, including on devices you set up from a code, <a href="https://github.com/settings/tokens" target="_blank" rel="noopener">revoke it on GitHub ↗</a>.</p>';
    body.querySelector('.sd-now').addEventListener('click', function () { sync(); });
    body.querySelector('.sd-copy').addEventListener('click', function (e) {
      var b = e.currentTarget, done = function (ok) { b.textContent = ok ? 'Copied' : 'Select and copy'; setTimeout(function () { b.textContent = 'Copy'; }, 2000); };
      if (navigator.clipboard) navigator.clipboard.writeText(setupCode()).then(function () { done(true); }, function () { done(false); }); else done(false);
    });
    body.querySelector('.sd-reveal').addEventListener('click', function (e) {
      var inp = body.querySelector('.sd-code .sd-in'), on = inp.type === 'password'; inp.type = on ? 'text' : 'password';
      e.currentTarget.textContent = on ? 'Hide' : 'Show'; e.currentTarget.setAttribute('aria-pressed', on ? 'true' : 'false'); if (on) inp.select();
    });
    body.querySelector('.sd-off').addEventListener('click', function () {
      token = null; gist = null; put(TK, null); put(GK, null); put(LK, null); last = 0; show('off'); paintDialog();
    });
  }
  function connect(input) {
    var tok = input, g = null;
    if (/^BRSYNC1\./.test(input)) { try { var o = JSON.parse(atob(input.slice(8))); tok = o.t; g = o.g || null; } catch (e) { tok = ''; } }
    if (g && !/^[0-9a-f]{8,64}$/i.test(g)) tok = '';   // a gist id is plain hex; anything else is a damaged or made-up setup code
    if (!tok) { message = 'That doesn’t look like a token or a setup code.'; paintDialog(); return; }
    var btn = body.querySelector('.sd-go'); if (btn) { btn.disabled = true; btn.textContent = 'Connecting…'; }
    gist = g;
    (g ? Promise.resolve(g) : findGist(tok)).then(function (id) {
      gist = id; token = tok; put(TK, tok); put(GK, id); message = ''; return sync();
    }).catch(function (e) {
      gist = null; message = e.status === 401 ? 'GitHub didn’t accept that token. Check you copied all of it.' : e.status === 403 || e.status === 404 ? 'That token can’t use gists. Make a new one with “gist” ticked.' : 'Couldn’t reach GitHub. Check your connection and try again.';
      paintDialog();
    });
  }
  function openDialog() { opener = document.activeElement; dlg.hidden = false; document.documentElement.classList.add('searching'); paintDialog(); var f = dlg.querySelector('.sd-in, .sd-now'); if (f) f.focus(); if (window.BROverlay) window.BROverlay.push('sync', closeDialog); }
  function closeDialog() { if (dlg.hidden) return; if (window.BROverlay) window.BROverlay.pop('sync'); dlg.hidden = true; document.documentElement.classList.remove('searching'); if (opener && opener.focus) opener.focus(); }
  dlg.querySelector('.sd-x').addEventListener('click', closeDialog);
  dlg.addEventListener('click', function (e) { if (e.target === dlg) closeDialog(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !dlg.hidden) closeDialog(); });
  show(state);
})();
