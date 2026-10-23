
/* Original generative score: five tracks built from synth voices, plus a layered rain engine. */
(function () {
  var box = document.getElementById('score');
  if (!box) return;
  var btn = document.getElementById('scorebtn'), prevB = document.getElementById('scoreprev'), nextB = document.getElementById('scorenext'),
      rainB = document.getElementById('scorerain'), vol = document.getElementById('scorevol'), title = document.getElementById('scoretitle'), hint = document.getElementById('scorehint');
  var direct = null, mediaEl = null, viaElement = false;
  var ctx = null, master, musicBus, verb, delayIn, rainGain, timer = null, on = false, rainOn = true;
  var cur = 0, tg = null, padF = null, next = 0, step = 0, rainNext = 0, thunderAt = 0;

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  /* ---------- instruments (all connect to the current track's input) ---------- */
  function pad(m, t, dur, peak, dest) {
    [-8, 8].forEach(function (c) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = hz(m); o.detune.value = c;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + 2.6);
      g.gain.setValueAtTime(peak, t + dur - 0.4); g.gain.linearRampToValueAtTime(0, t + dur + 3.4);
      o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 3.6);
    });
  }
  function brass(m, t, dest) {
    var f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = 'lowpass'; f.Q.value = 2.2;
    f.frequency.setValueAtTime(240, t); f.frequency.linearRampToValueAtTime(2300, t + 1.5); f.frequency.exponentialRampToValueAtTime(560, t + 6.5);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.045, t + 1.3); g.gain.linearRampToValueAtTime(0, t + 7.2);
    [1, 1.004].forEach(function (r) { var o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(m) * r; o.connect(f); o.start(t); o.stop(t + 7.4); });
    f.connect(g); g.connect(dest);
  }
  function bell(m, t, peak, type, dest, decay) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.value = hz(m);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + (decay || 4));
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + (decay || 4) + 0.2);
  }
  function ping(m, t, dest) {
    [[1, 0.03], [2.76, 0.012], [5.4, 0.006]].forEach(function (p) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = hz(m) * p[0];
      g.gain.setValueAtTime(p[1], t); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.5 / p[0] + 0.3);
      o.connect(g); g.connect(dest); o.start(t); o.stop(t + 3);
    });
  }
  function arpNote(m, t, dest) {
    var o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = hz(m);
    f.type = 'lowpass'; f.Q.value = 6; f.frequency.setValueAtTime(2600, t); f.frequency.exponentialRampToValueAtTime(420, t + 0.22);
    g.gain.setValueAtTime(0.028, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    o.connect(f); f.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.35);
  }
  function lead(m, t, dur, dest) {
    var o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), vib = ctx.createOscillator(), vg = ctx.createGain();
    o.type = 'triangle'; o2.type = 'sine'; o.frequency.value = hz(m); o2.frequency.value = hz(m) * 2;
    vib.frequency.value = 5.2; vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(hz(m) * 0.012, t + dur * 0.6);
    vib.connect(vg); vg.connect(o.frequency); vg.connect(o2.frequency);
    var g2 = ctx.createGain(); g2.gain.value = 0.25; o2.connect(g2); g2.connect(g);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 0.35); g.gain.setValueAtTime(0.05, t + dur * 0.7); g.gain.linearRampToValueAtTime(0, t + dur + 0.8);
    o.connect(g); g.connect(dest); [o, o2, vib].forEach(function (x) { x.start(t); x.stop(t + dur + 1); });
  }
  function drone(m, t, dur, dest) {
    var o = ctx.createOscillator(), s = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = hz(m); s.type = 'sawtooth'; s.frequency.value = hz(m) * 1.002;
    f.type = 'lowpass'; f.frequency.value = 220;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.09, t + 3); g.gain.setValueAtTime(0.09, t + dur - 1); g.gain.linearRampToValueAtTime(0, t + dur + 3);
    o.connect(g); s.connect(f); f.connect(g); g.connect(dest);
    [o, s].forEach(function (x) { x.start(t); x.stop(t + dur + 3.2); });
  }

  /* ---------- tracks ---------- */
  var TRACKS = [
    { name: 'Rain on Sector 6B', chords: [[50, 57, 60, 64, 69], [46, 53, 57, 62, 69], [43, 50, 53, 58, 62], [45, 52, 57, 62, 64], [45, 52, 57, 61, 64]], len: [9, 9, 9, 5, 5], cut: 850,
      play: function (k, c, t, d, T) {
        c.forEach(function (m) { pad(m, t, d, 0.032, T.pad); });
        if (k === 0 || k === 2) brass(c[c.length - 1] - (k === 0 ? 12 : 0), t + 0.4, T.dry);
        for (var b = 1; b < d; b += 1.5) if (Math.random() < 0.28) bell(pick([62, 65, 67, 69, 72, 74, 77, 81]), t + b + rnd(0, 0.3), 0.05, 'sine', T.dry);
      } },
    { name: 'Spinner Lights', chords: [[41, 48, 56, 60, 63], [44, 51, 55, 60, 63], [39, 46, 55, 58, 63], [46, 53, 58, 62, 65]], len: [6.4, 6.4, 6.4, 6.4], cut: 700,
      play: function (k, c, t, d, T) {
        c.forEach(function (m) { pad(m, t, d, 0.024, T.pad); });
        var pat = [0, 2, 3, 4, 3, 2], up = c.map(function (m) { return m + 12; });
        for (var i = 0; i * 0.2 < d - 0.05; i++) arpNote(up[pat[i % pat.length]] + (i % 12 > 5 ? 12 : 0), t + i * 0.2, T.dry);
        drone(c[0] - 12, t, d, T.dry);
      } },
    { name: 'Off-World Lament', chords: [[40, 47, 55, 59, 62], [36, 43, 52, 55, 59], [43, 50, 55, 59, 62], [38, 45, 54, 57, 62]], len: [8, 8, 8, 8], cut: 1100,
      play: function (k, c, t, d, T) {
        c.forEach(function (m) { pad(m, t, d, 0.028, T.pad); });
        var sc = [64, 66, 67, 69, 71, 74, 76, 79], x = t + 0.8, n = Math.floor(rnd(3, 6)), idx = Math.floor(rnd(1, 5));
        for (var i = 0; i < n && x < t + d - 1; i++) { var du = pick([1, 1.5, 2, 2.5]); lead(sc[idx], x, du, T.dry); x += du; idx = Math.max(0, Math.min(sc.length - 1, idx + pick([-2, -1, -1, 1, 1, 2]))); }
      } },
    { name: 'Tyrell Pyramid', chords: [[36, 43], [36, 44], [34, 41], [36, 43]], len: [10, 10, 10, 10], cut: 600,
      play: function (k, c, t, d, T) {
        drone(c[0], t, d, T.dry); pad(c[1] + 12, t, d, 0.022, T.pad); pad(c[1] + 15, t + 2, d - 2, 0.016, T.pad);
        for (var b = 0.5; b < d; b += rnd(1.5, 3.2)) ping(pick([72, 75, 79, 80, 84, 87]), t + b, T.dry);
        if (k === 1) brass(c[1] + 12, t + 3, T.dry);
      } },
    { name: 'Nexus Lullaby', chords: [[43, 50, 54, 59, 62], [40, 47, 54, 55, 62], [36, 43, 52, 55, 59], [38, 45, 54, 57, 60]], len: [7, 7, 7, 7], cut: 1300,
      play: function (k, c, t, d, T) {
        c.forEach(function (m) { pad(m, t, d, 0.022, T.pad); });
        var tones = c.slice(2).map(function (m) { return m + 24; }).concat([86, 83]);
        for (var i = 0; i < 10; i++) if (Math.random() < 0.75) bell(pick(tones), t + 0.3 + i * 0.66, 0.035, 'triangle', T.dry, 2.5);
      } }
  ];

  /* ---------- engine ---------- */
  function build() {
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0;
    var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3;
    master.connect(comp);
    // Two outputs: straight to the speakers, and through an <audio> element. The
    // <audio> route lets the phone show lock-screen controls and keep playing when
    // the screen is off. If it works, the direct route is muted so nothing doubles.
    direct = ctx.createGain(); comp.connect(direct); direct.connect(ctx.destination);
    if (ctx.createMediaStreamDestination) {
      try { var dest = ctx.createMediaStreamDestination(); comp.connect(dest);
        mediaEl = document.createElement('audio'); mediaEl.srcObject = dest.stream; mediaEl.setAttribute('playsinline', '');
      } catch (e) { mediaEl = null; } }
    var len = Math.floor(ctx.sampleRate * 5.5), ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var c = 0; c < 2; c++) { var dd = ir.getChannelData(c); for (var i = 0; i < len; i++) dd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    verb = ctx.createConvolver(); verb.buffer = ir;
    var wet = ctx.createGain(); wet.gain.value = 0.6; verb.connect(wet); wet.connect(master);
    var dl = ctx.createDelay(2); dl.delayTime.value = 0.72;
    var fb = ctx.createGain(); fb.gain.value = 0.4;
    var dlf = ctx.createBiquadFilter(); dlf.type = 'lowpass'; dlf.frequency.value = 1600;
    dl.connect(dlf); dlf.connect(fb); fb.connect(dl); dlf.connect(verb);
    musicBus = ctx.createGain(); musicBus.gain.value = 1;
    musicBus.connect(master); musicBus.connect(verb); musicBus.connect(dl);
    buildRain();
    return true;
  }
  function noiseBuf(sec, brown) {
    var b = ctx.createBuffer(2, Math.floor(ctx.sampleRate * sec), ctx.sampleRate);
    for (var c = 0; c < 2; c++) { var d = b.getChannelData(c), last = 0;
      for (var i = 0; i < d.length; i++) { var w = Math.random() * 2 - 1; if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; } }
    return b;
  }
  function loop(buf, rate) { var s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.playbackRate.value = rate || 1; s.start(); return s; }
  /* Rain: the "city street" style. Rain on pavement and a low rumble.
     Rendered once into a 20-second seamless loop. */
  function renderStreet() {
    var SR = ctx.sampleRate, n = Math.floor(SR * 20), L = new Float32Array(n), Rr = new Float32Array(n), R = Math.random;
    var ch, i, out;
    for (ch = 0; ch < 2; ch++) {   // soft pink-noise wash of rain across the street
      out = ch ? Rr : L; var b = [0, 0, 0, 0, 0], lp = 0, hp = 0;
      for (i = 0; i < n; i++) { var w = R() * 2 - 1;
        b[0] = 0.99886 * b[0] + w * 0.0555179; b[1] = 0.99332 * b[1] + w * 0.0750759; b[2] = 0.969 * b[2] + w * 0.153852; b[3] = 0.8665 * b[3] + w * 0.3104856; b[4] = 0.55 * b[4] + w * 0.5329522;
        var pk = (b[0] + b[1] + b[2] + b[3] + b[4] + w * 0.5362) * 0.11; lp += 0.25 * (pk - lp); hp += 0.02 * (lp - hp);
        var g = 1 - 0.15 * (0.5 + 0.5 * Math.sin(2 * Math.PI * i / n + ch * 0.6) * Math.sin(4 * Math.PI * i / n + 1.1));
        out[i] += (lp - hp) * 0.6 * g; }
      var last = 0, l2 = 0;            // distant low rumble
      for (i = 0; i < n; i++) { last = (last + 0.02 * (R() * 2 - 1)) / 1.02; l2 += 0.01 * (last * 3.5 - l2); out[i] += l2 * 0.25; }
    }
    function burst(at, len, decay, amp, pan, fc, q) {   // one drop hitting the pavement
      var f = 2 * Math.sin(Math.PI * Math.min(fc, SR / 6) / SR), low = 0, band = 0, damp = 1 / q;
      var gl = amp * Math.sqrt((1 - pan) / 2), gr = amp * Math.sqrt((1 + pan) / 2), m = Math.floor(len * SR);
      for (var k = 0; k < m && at + k < n; k++) { var x = (R() * 2 - 1) * Math.exp(-k / (decay * SR)); low += f * band; var hi = x - low - damp * band; band += f * hi; L[at + k] += band * gl; Rr[at + k] += band * gr; }
    }
    for (var c = 0; c < 20 * 600; c++) burst(Math.floor(R() * n), 0.004, rnd(0.0005, 0.0015), rnd(0.03, 0.15), rnd(-1, 1), rnd(1200, 5000), 1.5);
    var x = Math.floor(SR * 0.5), end = n - x, peak = 0;   // seamless loop + level
    for (i = 0; i < x; i++) { var a = i / x; L[i] = L[i] * a + L[end + i] * (1 - a); Rr[i] = Rr[i] * a + Rr[end + i] * (1 - a); }
    for (i = 0; i < end; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(Rr[i]));
    var gain = 0.8 / (peak || 1), buf = ctx.createBuffer(2, end, SR), dl = buf.getChannelData(0), dr = buf.getChannelData(1);
    for (i = 0; i < end; i++) { dl[i] = L[i] * gain; dr[i] = Rr[i] * gain; }
    return buf;
  }
  function buildRain() {
    rainGain = ctx.createGain(); rainGain.gain.value = 0; rainGain.connect(master);
    setTimeout(function () {   // render after the music has started, then fade the rain in
      var s = ctx.createBufferSource(); s.buffer = renderStreet(); s.loop = true; s.connect(rainGain); s.start();
      rainGain.gain.setTargetAtTime(rainOn ? 0.18 : 0, ctx.currentTime, 0.8);
    }, 60);
  }
  function scheduleRain() {}
  function newTrack(i, t) {
    if (tg) { var old = tg; old.gain.cancelScheduledValues(t); old.gain.setValueAtTime(old.gain.value, t); old.gain.linearRampToValueAtTime(0, t + 2.5); setTimeout(function () { old.disconnect(); }, 12000); }
    tg = ctx.createGain(); tg.gain.setValueAtTime(0, t); tg.gain.linearRampToValueAtTime(1, t + 3); tg.connect(musicBus);
    padF = ctx.createBiquadFilter(); padF.type = 'lowpass'; padF.frequency.value = TRACKS[i].cut; padF.Q.value = 0.8; padF.connect(tg);
    var lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.045; lg.gain.value = TRACKS[i].cut * 0.5; lfo.connect(lg); lg.connect(padF.frequency); lfo.start(t); lfo.stop(t + 3600);
    next = t + 0.2; step = 0;
  }
  function schedule() {
    var T = TRACKS[cur], io = { pad: padF, dry: tg };
    while (next < ctx.currentTime + 2.5) {
      var k = step % T.chords.length, d = T.len[k];
      T.play(k, T.chords[k], next, d, io);
      next += d; step++;
    }
    scheduleRain();
  }
  function level() { return (vol ? parseFloat(vol.value) : 0.6); }
  function start() {
    if (!ctx && !build()) { hint.textContent = 'Audio is not supported in this browser'; return; }
    ctx.resume();
    if (!timer) { newTrack(cur, ctx.currentTime); rainNext = ctx.currentTime; thunderAt = ctx.currentTime + rnd(20, 40); schedule(); timer = setInterval(schedule, 300); }
    master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(level(), ctx.currentTime + 3);
    if (mediaEl && !viaElement) {
      var pr = mediaEl.play();
      if (pr && pr.then) pr.then(function () { viaElement = true; direct.gain.setValueAtTime(0, ctx.currentTime); }, function () { viaElement = false; });
    } else if (mediaEl) { mediaEl.play().catch(function () {}); }
    on = true; store('br-score', 'on'); paint(); session();
  }
  function stop() {
    if (ctx) {
      master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);
      setTimeout(function () { if (!on) { clearInterval(timer); timer = null; tg = null; ctx.suspend(); } }, 1400);
    }
    on = false; store('br-score', 'off'); paint(); session();
    if (mediaEl) setTimeout(function () { if (!on) mediaEl.pause(); }, 1300);
  }
  function session() {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({ title: TRACKS[cur].name, artist: 'Blade Runner Archive', album: 'Original score',
        artwork: [{ src: 'img/icon-180.png', sizes: '180x180', type: 'image/png' }] });
      navigator.mediaSession.playbackState = on ? 'playing' : 'paused';
    } catch (e) { /* older browsers */ }
  }
  if ('mediaSession' in navigator) {
    var acts = { play: function () { if (!on) start(); }, pause: function () { if (on) stop(); },
      previoustrack: function () { skip(-1); }, nexttrack: function () { skip(1); } };
    Object.keys(acts).forEach(function (k) { try { navigator.mediaSession.setActionHandler(k, acts[k]); } catch (e) {} });
  }
  function skip(dir) {
    cur = (cur + dir + TRACKS.length) % TRACKS.length; store('br-track', String(cur));
    if (on && ctx) newTrack(cur, ctx.currentTime);
    paint(); session();
  }
  function paint() {
    box.classList.toggle('playing', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute('aria-label', on ? 'Pause score' : 'Play score');
    btn.querySelector('.t').textContent = on ? '❚❚' : '▶';
    title.textContent = String(cur + 1).padStart(2, '0') + ' / ' + String(TRACKS.length).padStart(2, '0') + ' · ' + TRACKS[cur].name;
    rainB.setAttribute('aria-pressed', rainOn ? 'true' : 'false');
    hint.textContent = on ? 'Original score' : (store('br-score') === 'on' ? 'Tap anywhere to resume' : 'Original score');
  }
  var saved = parseInt(store('br-track'), 10); if (saved >= 0 && saved < TRACKS.length) cur = saved;
  if (store('br-rain') === 'off') rainOn = false;
  btn.addEventListener('click', function () { on ? stop() : start(); });
  prevB.addEventListener('click', function () { skip(-1); });
  nextB.addEventListener('click', function () { skip(1); });
  rainB.addEventListener('click', function () {
    rainOn = !rainOn; store('br-rain', rainOn ? 'on' : 'off');
    if (rainGain) rainGain.gain.setTargetAtTime(rainOn ? 0.18 : 0, ctx.currentTime, 0.4);
    paint();
  });
  if (vol) vol.addEventListener('input', function () { if (on && ctx) master.gain.setTargetAtTime(level(), ctx.currentTime, 0.2); });
  if (store('br-score') === 'on') {
    var resume = function (e) { if (box.contains(e.target)) return; document.removeEventListener('pointerdown', resume); document.removeEventListener('keydown', resume); if (!on) start(); };
    document.addEventListener('pointerdown', resume); document.addEventListener('keydown', resume);
  }
  paint();
})();
