/* Interface sounds: off by default, switched on with the "Sounds" chip in the player.
   A Voight-Kampff style chirp when an entry is marked, a spinner pass on changing era,
   and soft ESPER ticks. Other scripts ask for a sound with the "br:sfx" event. */
(function () {
  var btn = document.getElementById('scorefx'); if (!btn) return;
  var on = false, ctx = null, out = null, noise = null;
  try { on = localStorage.getItem('br-sfx') === '1'; } catch (e) {}
  function ui() { btn.setAttribute('aria-pressed', on ? 'true' : 'false'); btn.title = on ? 'Interface sounds on' : 'Interface sounds off'; }
  function init() {
    if (ctx) return ctx.state === 'suspended' ? ctx.resume() : null;
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); out = ctx.createGain(); out.gain.value = 0.5; out.connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    var d = noise.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  function tone(f, t, len, type, vol, f2) {
    var o = ctx.createOscillator(), g = ctx.createGain(); o.type = type || 'sine';
    o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + len);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.12, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + len + 0.02);
  }
  var SOUNDS = {
    mark: function (t) { tone(1320, t, 0.07, 'sine', 0.1); tone(1760, t + 0.09, 0.07, 'sine', 0.1); tone(2640, t + 0.18, 0.12, 'sine', 0.07); },
    unmark: function (t) { tone(880, t, 0.09, 'sine', 0.08, 660); },
    complete: function (t) { [660, 880, 1320].forEach(function (f, i) { tone(f, t + 0.25 + i * 0.11, 0.35, 'triangle', 0.07); }); },
    esper: function (t) { tone(2200, t, 0.03, 'square', 0.025); tone(1600, t + 0.05, 0.03, 'square', 0.02); },
    print: function (t) { for (var i = 0; i < 6; i++) tone(300 + i * 40, t + i * 0.05, 0.04, 'square', 0.02); },
    whoosh: function (t) {
      var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      s.buffer = noise; f.type = 'bandpass'; f.Q.value = 1.4;
      f.frequency.setValueAtTime(260, t); f.frequency.exponentialRampToValueAtTime(1500, t + 0.45); f.frequency.exponentialRampToValueAtTime(320, t + 1.1);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.45); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.15);
      s.connect(f); f.connect(g);
      if (p) { p.pan.setValueAtTime(-0.8, t); p.pan.linearRampToValueAtTime(0.8, t + 1.1); g.connect(p); p.connect(out); } else g.connect(out);
      s.start(t); s.stop(t + 1.2);
      tone(90, t + 0.1, 0.9, 'sine', 0.05, 60); // low engine hum under the pass
    }
  };
  function play(name) { if (!on || !ctx || ctx.state !== 'running' || !SOUNDS[name]) return; SOUNDS[name](ctx.currentTime + 0.01); }
  btn.addEventListener('click', function () {
    on = !on; try { localStorage.setItem('br-sfx', on ? '1' : '0'); } catch (e) {}
    ui(); if (on) { init(); setTimeout(function () { play('mark'); }, 60); }
  });
  // browsers only start audio after a tap, so wake the context on the first one
  document.addEventListener('pointerdown', function () { if (on) init(); }, true);
  document.addEventListener('keydown', function () { if (on) init(); }, true);
  window.addEventListener('br:sfx', function (e) { play(e.detail); });
  window.addEventListener('br:view', function (e) { if (e.detail && e.detail.changed) play('whoosh'); });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.rd-mark'); if (!b) return;
    setTimeout(function () { play(b.getAttribute('aria-pressed') === 'true' ? 'mark' : 'unmark'); }, 0);
  });
  ui();
})();
