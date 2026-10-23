/* The city behind the page: weather on the full-screen overlay, and the skyline in
   the hero. Each view has its own mood:
     archive  the opening eye, with the burning city reflected in it
     era1     amber smog and flare stacks bursting
     era2     wet neon, heavy rain and big billboards
     era3     orange haze with falling snow
     people   cold teal light, searchlights over the records office
   Everything is drawn on canvas; nothing is loaded. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var css = getComputedStyle(document.documentElement);
  var C = { cyan: css.getPropertyValue('--cyan').trim(), pink: css.getPropertyValue('--pink').trim(), amber: css.getPropertyValue('--amber').trim(), rust: css.getPropertyValue('--rust').trim() };

  // Eye fibres in the Origins themes section (SVG)
  var g = document.getElementById('fibres'), ns = 'http://www.w3.org/2000/svg';
  for (var i = 0; g && i < 48; i++) {
    var t = i / 48 * Math.PI * 2, r2 = i % 2 ? 48 : 55, l = document.createElementNS(ns, 'line');
    l.setAttribute('x1', 170 + Math.cos(t) * 24); l.setAttribute('y1', 110 + Math.sin(t) * 24);
    l.setAttribute('x2', 170 + Math.cos(t) * r2); l.setAttribute('y2', 110 + Math.sin(t) * r2);
    l.setAttribute('class', 'fibre'); g.appendChild(l);
  }

  var MOODS = {
    archive: { sky: ['#07091a', '#120f1f', '#2a1208'], glow: '255,120,30', glowA: .38, haze: '120,60,40', beams: '255,214,160', flares: 2, burst: .15, boards: 1, rain: 1, drop: '150,185,255', eye: true, lit: .2 },
    era1:    { sky: ['#0d0906', '#2a1308', '#6a2e0a'], glow: '255,120,30', glowA: .55, haze: '150,80,30', beams: '255,200,140', flares: 6, burst: .7, boards: .6, rain: .6, drop: '255,200,150', lit: .2 },
    era2:    { sky: ['#04061a', '#0f0a2a', '#2c0a2e'], glow: '255,46,136', glowA: .32, haze: '70,40,140', beams: '120,230,255', flares: 1, burst: .1, boards: 1.8, rain: 1.5, drop: '140,190,255', lit: .26 },
    era3:    { sky: ['#2b1406', '#7a3810', '#d0701e'], glow: '255,170,80', glowA: .6, haze: '235,150,70', beams: '', flares: 0, burst: 0, boards: .35, rain: 0, snow: true, lit: .08, dust: true },
    people:  { sky: ['#03080b', '#08161b', '#0f2a30'], glow: '34,229,255', glowA: .22, haze: '40,110,130', beams: '160,240,255', flares: 0, burst: 0, boards: .8, rain: 1, drop: '150,200,220', lit: .18 }
  };
  var mood = MOODS.archive, moodName = 'archive';

  // ---------- weather overlay (fixed, full screen) ----------
  var rc = document.getElementById('rain'), rx = rc.getContext('2d'), drops = [], flakes = [];
  function sizeRain() {
    rc.width = innerWidth; rc.height = innerHeight; drops = []; flakes = [];
    var n = Math.floor(innerWidth * innerHeight / 9000 * 1.5);
    for (var i = 0; i < n; i++) drops.push({ x: Math.random() * rc.width, y: Math.random() * rc.height, v: 9 + Math.random() * 9, l: 10 + Math.random() * 16, k: Math.random() });
    var m = Math.floor(innerWidth * innerHeight / 7000);
    for (var j = 0; j < m; j++) flakes.push({ x: Math.random() * rc.width, y: Math.random() * rc.height, r: .6 + Math.random() * 2.2, v: .3 + Math.random() * .9, p: Math.random() * 6.28 });
  }
  function drawRain(t) {
    rx.clearRect(0, 0, rc.width, rc.height);
    if (mood.snow) {
      rx.fillStyle = 'rgba(255,240,225,.75)';
      flakes.forEach(function (f) {
        rx.globalAlpha = .35 + f.r / 4; rx.beginPath(); rx.arc(f.x, f.y, f.r, 0, 6.28); rx.fill();
        if (!reduce) { f.y += f.v; f.x += Math.sin(t / 1400 + f.p) * .4 - .15; if (f.y > rc.height + 4) { f.y = -4; f.x = Math.random() * rc.width; } }
      });
      rx.globalAlpha = 1; return;
    }
    var limit = Math.floor(drops.length * Math.min(1, mood.rain / 1.5));
    rx.strokeStyle = 'rgba(' + mood.drop + ',.28)'; rx.lineWidth = 1; rx.beginPath();
    for (var i = 0; i < limit; i++) { var d = drops[i]; rx.moveTo(d.x, d.y); rx.lineTo(d.x - 2, d.y + d.l);
      if (!reduce) { d.y += d.v * (.8 + mood.rain * .2); d.x -= 1.1; if (d.y > rc.height) { d.y = -20; d.x = Math.random() * rc.width + 40; } } }
    rx.stroke();
  }

  // ---------- hero city ----------
  var cc = document.getElementById('city'), cx = cc.getContext('2d'), towers = [], spinners = [], boards = [], beams = [], hazes = [], stacks = [];
  var W = 0, H = 0, seed = 0;
  function rnd(s) { var x = Math.sin(s + seed * 97.13) * 10000; return x - Math.floor(x); }
  function rgba(c, a) { return 'rgba(' + c + ',' + a + ')'; }
  var ADS = [
    { bg: '#ff2e88', fg: '#ffffff', a: 'ネオン', b: 'NEO-SAKURA' }, { bg: '#22e5ff', fg: '#05202a', a: '月', b: 'LUNA LINES' },
    { bg: '#ffb347', fg: '#2a1206', a: '太陽', b: 'TAIYO SODA' }, { bg: '#7a2cff', fg: '#ffffff', a: 'ARCADIA', b: 'OFF-WORLD · BOOK NOW' },
    { bg: '#0c111e', fg: '#ff5a4d', a: '人造', b: 'SYNTH LEATHER' }, { bg: '#e6eaf4', fg: '#070910', a: '麺', b: 'MOKU NOODLE BAR' },
    { bg: '#ff5a4d', fg: '#ffffff', a: '夢', b: 'DREAM CLINIC' }, { bg: '#1aa37a', fg: '#04140f', a: '緑', b: 'REAL TREES · REAL AIR' }
  ];

  function layout() {
    var r = cc.getBoundingClientRect(); W = cc.width = Math.max(1, Math.round(r.width)); H = cc.height = Math.max(1, Math.round(r.height));
    seed = ['archive', 'era1', 'era2', 'era3', 'people'].indexOf(moodName) + 1;
    towers = []; boards = []; var x = -6, k = 0, slab = mood.snow;
    while (x < W) {
      var w = (slab ? 60 : 30) + rnd(k + 1) * (slab ? 90 : 60), h = H * (0.18 + rnd(k + 7) * (slab ? .32 : mood.eye ? .24 : 0.46));
      var tw = { x: x, w: w, h: h, k: k, far: rnd(k + 3) > .55 }; towers.push(tw);
      if (!tw.far && w > 48 && h > H * .3 && (W < 760 || x > W * .58) && rnd(k + 11) < .45 * mood.boards) boards.push({ t: tw, ad: Math.floor(rnd(k + 13) * ADS.length), next: 2000 + rnd(k) * 4000, last: 0, flick: 0 });
      x += w + 2 + rnd(k + 5) * 8; k++;
    }
    spinners = [{ x: W * .2, y: H * .3, v: .6 }, { x: W * .75, y: H * .45, v: -.45 }, { x: W * .5, y: H * .2, v: .3 }];
    beams = mood.beams ? [{ x: .12, a: -.35, s: .00021, p: 0 }, { x: .5, a: .1, s: .00016, p: 2 }, { x: .86, a: .3, s: .00025, p: 4 }] : [];
    hazes = [0, 1, 2, 3].map(function (i) { return { x: rnd(i + 40) * W, y: H * (.35 + rnd(i + 50) * .5), r: H * (.5 + rnd(i + 60) * .5), v: (.08 + rnd(i + 70) * .12) * (i % 2 ? 1 : -1) }; });
    stacks = [];
    for (var s = 0; s < mood.flares; s++) stacks.push({ x: W * (.55 + rnd(s + 80) * .42), y: H * (.55 + rnd(s + 90) * .2), next: rnd(s + 100) * 6000, burst: -1 });
    if (moodName === 'archive' || !mood.flares) { /* keep the two classic stacks on the right */ }
    if (moodName === 'archive') stacks = [{ x: W * .88, y: H * .62, next: 3000, burst: -1 }, { x: W * .94, y: H * .7, next: 7000, burst: -1 }];
    patrol = { at: 4000, x: -200, y: H * .28, dir: 1, active: false };
  }
  var patrol = null;

  function sky() {
    var gr = cx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, mood.sky[0]); gr.addColorStop(.55, mood.sky[1]); gr.addColorStop(1, mood.sky[2]);
    cx.fillStyle = gr; cx.fillRect(0, 0, W, H);
    var gl = cx.createRadialGradient(W * .8, H, 10, W * .8, H, H * 1.1); gl.addColorStop(0, rgba(mood.glow, mood.glowA)); gl.addColorStop(1, rgba(mood.glow, 0));
    cx.fillStyle = gl; cx.fillRect(0, 0, W, H);
    if (mood.dust) { // 2049 haze: a big pale sun behind the dust
      var sun = cx.createRadialGradient(W * .7, H * .38, 0, W * .7, H * .38, H * .9); sun.addColorStop(0, 'rgba(255,230,190,.55)'); sun.addColorStop(.15, 'rgba(255,200,140,.25)'); sun.addColorStop(1, 'rgba(255,170,90,0)');
      cx.fillStyle = sun; cx.fillRect(0, 0, W, H);
    }
  }
  function drawHaze(t) {
    hazes.forEach(function (h) {
      if (!reduce) { h.x += h.v; if (h.x > W + h.r) h.x = -h.r; if (h.x < -h.r) h.x = W + h.r; }
      var gr = cx.createRadialGradient(h.x, h.y, 0, h.x, h.y, h.r); gr.addColorStop(0, rgba(mood.haze, mood.dust ? .32 : .16)); gr.addColorStop(1, rgba(mood.haze, 0));
      cx.fillStyle = gr; cx.fillRect(h.x - h.r, h.y - h.r, h.r * 2, h.r * 2);
    });
  }
  function drawBeams(t) {
    if (!beams.length) return;
    cx.save(); cx.globalCompositeOperation = 'lighter';
    beams.forEach(function (b) {
      var ang = b.a + Math.sin(t * b.s + b.p) * .55 - Math.PI / 2, ox = W * b.x, oy = H, len = H * 1.6, spread = .07;
      var gr = cx.createLinearGradient(ox, oy, ox + Math.cos(ang) * len, oy + Math.sin(ang) * len);
      gr.addColorStop(0, rgba(mood.beams, .16)); gr.addColorStop(1, rgba(mood.beams, 0));
      cx.fillStyle = gr; cx.beginPath(); cx.moveTo(ox, oy);
      cx.lineTo(ox + Math.cos(ang - spread) * len, oy + Math.sin(ang - spread) * len);
      cx.lineTo(ox + Math.cos(ang + spread) * len, oy + Math.sin(ang + spread) * len); cx.closePath(); cx.fill();
    });
    cx.restore();
  }
  function drawStacks(t) {
    stacks.forEach(function (s, i) {
      cx.fillStyle = '#0b0f1c'; cx.fillRect(s.x - 4, s.y, 8, H - s.y);
      var fl = 14 + Math.sin(t / 180 + i) * 5 + (reduce ? 0 : Math.random() * 4);
      var fg = cx.createRadialGradient(s.x, s.y - 8, 1, s.x, s.y - 8, fl * 2.2);
      fg.addColorStop(0, 'rgba(255,230,160,.95)'); fg.addColorStop(.35, 'rgba(255,140,40,.7)'); fg.addColorStop(1, 'rgba(255,90,20,0)');
      cx.fillStyle = fg; cx.beginPath(); cx.arc(s.x, s.y - 8, fl * 2.2, 0, 7); cx.fill();
      // now and then a stack bursts into a fireball
      if (!reduce && mood.burst) {
        if (s.burst < 0 && t > s.next) { s.burst = t; }
        if (s.burst >= 0) {
          var k = (t - s.burst) / 1600;
          if (k > 1) { s.burst = -1; s.next = t + (4000 + Math.random() * 9000) / mood.burst; }
          else { var R = 18 + k * 90, a = (1 - k) * .85, by = s.y - 20 - k * 70;
            var bg = cx.createRadialGradient(s.x, by, 0, s.x, by, R); bg.addColorStop(0, 'rgba(255,240,200,' + a + ')'); bg.addColorStop(.3, 'rgba(255,150,50,' + a * .8 + ')'); bg.addColorStop(1, 'rgba(255,80,20,0)');
            cx.fillStyle = bg; cx.beginPath(); cx.arc(s.x, by, R, 0, 7); cx.fill();
            var lit = cx.createRadialGradient(s.x, H, 0, s.x, H, H * .8); lit.addColorStop(0, 'rgba(255,140,50,' + a * .25 + ')'); lit.addColorStop(1, 'rgba(255,140,50,0)'); cx.fillStyle = lit; cx.fillRect(0, 0, W, H); }
        }
      }
    });
  }
  function drawTowers(t) {
    towers.forEach(function (b) {
      var y = H - b.h * (b.far ? 1.15 : 1);
      cx.fillStyle = mood.dust ? (b.far ? 'rgba(120,60,25,.55)' : 'rgba(40,18,8,.92)') : (b.far ? '#141b2e' : '#0a0e1a');
      cx.fillRect(b.x, y, b.w, H - y);
      if (b.far) return;
      for (var r = 0; r * 11 + 10 < b.h; r++) for (var c = 0; c * 8 + 8 < b.w; c++) { var s = rnd(b.k * 131 + r * 17 + c * 7);
        if (s > 1 - mood.lit) { var flick = reduce ? 1 : (rnd(s * 99 + Math.floor(t / 1500)) > .04 ? 1 : 0);
          cx.fillStyle = mood.dust ? '#ffb070' : s > .95 ? C.cyan : s > .92 ? C.pink : C.amber; cx.globalAlpha = .55 * flick; cx.fillRect(b.x + 4 + c * 8, y + 6 + r * 11, 3, 5); } }
      cx.globalAlpha = 1;
      if (b.h > H * .5 && !mood.dust) { cx.fillStyle = 'rgba(255,60,60,' + (reduce ? .9 : (Math.sin(t / 400 + b.k) > 0 ? .95 : .25)) + ')'; cx.beginPath(); cx.arc(b.x + b.w / 2, y - 3, 2, 0, 7); cx.fill(); }
    });
  }
  function drawBoards(t) {
    boards.forEach(function (bd) {
      var tw = bd.t, y = H - tw.h, bw = tw.w - 10, bh = Math.min(tw.h * .45, bw * 1.25), bx = tw.x + 5, by = y + 12;
      if (!reduce && t - bd.last > bd.next) { bd.ad = (bd.ad + 1) % ADS.length; bd.last = t; bd.next = 3500 + Math.random() * 3000; bd.flick = t; }
      var ad = ADS[bd.ad], on = reduce || t - bd.flick > 260 || Math.floor((t - bd.flick) / 50) % 2;
      cx.save(); cx.globalAlpha = (on ? .85 : .25) * (W < 760 ? .5 : 1);
      cx.fillStyle = ad.bg; cx.fillRect(bx, by, bw, bh);
      cx.shadowColor = ad.bg; cx.shadowBlur = 18; cx.fillRect(bx, by, bw, 1); cx.shadowBlur = 0;
      cx.fillStyle = ad.fg; cx.textAlign = 'center';
      var JP = '"Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans JP",sans-serif', big = Math.min(bw * .55, bh * .42);
      cx.font = '700 ' + big + 'px ' + JP; var mw = cx.measureText(ad.a).width; if (mw > bw * .86) { big *= bw * .86 / mw; cx.font = '700 ' + big + 'px ' + JP; }
      cx.fillText(ad.a, bx + bw / 2, by + bh * .55);
      var small = 11; cx.font = '600 ' + small + 'px "Chakra Petch", sans-serif'; var sw2 = cx.measureText(ad.b).width; if (sw2 > bw * .9) { small = Math.max(6, small * bw * .9 / sw2); cx.font = '600 ' + small + 'px "Chakra Petch", sans-serif'; }
      cx.fillText(ad.b, bx + bw / 2, by + bh * .86);
      cx.fillStyle = 'rgba(0,0,0,.18)'; for (var sy = by; sy < by + bh; sy += 3) cx.fillRect(bx, sy, bw, 1);
      cx.restore();
      // light spill onto the haze below the screen
      var sp = cx.createRadialGradient(bx + bw / 2, by + bh, 0, bx + bw / 2, by + bh, bw * 1.4); sp.addColorStop(0, ad.bg + '33'); sp.addColorStop(1, ad.bg + '00');
      cx.fillStyle = sp; cx.fillRect(bx - bw, by, bw * 3, bh * 2);
    });
  }
  function drawSpinners(t) {
    spinners.forEach(function (s, i) {
      if (!reduce) { s.x += s.v; if (s.x > W + 40) s.x = -40; if (s.x < -40) s.x = W + 40; }
      var sy = s.y + Math.sin(t / 900 + i) * 4;
      var bg = cx.createLinearGradient(0, sy, 0, sy + 120); bg.addColorStop(0, 'rgba(255,200,120,.16)'); bg.addColorStop(1, 'rgba(255,200,120,0)');
      cx.fillStyle = bg; cx.beginPath(); cx.moveTo(s.x - 10, sy + 4); cx.lineTo(s.x - 46, sy + 120); cx.lineTo(s.x + 46, sy + 120); cx.lineTo(s.x + 10, sy + 4); cx.fill();
      cx.fillStyle = '#1a2233'; cx.beginPath(); cx.moveTo(s.x - 16, sy); cx.lineTo(s.x + 16, sy); cx.lineTo(s.x + 11, sy + 6); cx.lineTo(s.x - 11, sy + 6); cx.fill();
      cx.fillStyle = (Math.floor(t / 300) + i) % 2 ? C.rust : C.cyan; cx.fillRect(s.x + (s.v > 0 ? 13 : -15), sy + 1, 2, 2);
    });
    // a police spinner passes close every so often, sweeping its spotlight over the street
    if (reduce || !patrol) return;
    if (!patrol.active && t > patrol.at) { patrol.active = true; patrol.dir = Math.random() < .5 ? 1 : -1; patrol.x = patrol.dir > 0 ? -160 : W + 160; patrol.y = H * (.2 + Math.random() * .2); }
    if (!patrol.active) return;
    patrol.x += patrol.dir * Math.max(2.2, W / 420);
    var px = patrol.x, py = patrol.y + Math.sin(t / 700) * 6, sw = Math.sin(t / 600) * .5;
    cx.save(); cx.globalCompositeOperation = 'lighter';
    var cone = cx.createLinearGradient(px, py, px + sw * 200, H); cone.addColorStop(0, 'rgba(230,240,255,.32)'); cone.addColorStop(1, 'rgba(230,240,255,0)');
    cx.fillStyle = cone; cx.beginPath(); cx.moveTo(px - 6, py + 8); cx.lineTo(px + sw * H * .9 - H * .22, H); cx.lineTo(px + sw * H * .9 + H * .22, H); cx.lineTo(px + 6, py + 8); cx.fill();
    cx.restore();
    cx.fillStyle = '#121a2a'; cx.beginPath(); cx.moveTo(px - 40, py); cx.lineTo(px + 40, py); cx.lineTo(px + 28, py + 14); cx.lineTo(px - 28, py + 14); cx.fill();
    cx.fillStyle = '#1e2a40'; cx.fillRect(px - 18, py - 8, 36, 9);
    var blink = Math.floor(t / 180) % 2;
    cx.fillStyle = blink ? '#ff3b3b' : '#3b7bff'; cx.shadowColor = cx.fillStyle; cx.shadowBlur = 14; cx.fillRect(px - 16, py - 11, 10, 3);
    cx.fillStyle = blink ? '#3b7bff' : '#ff3b3b'; cx.shadowColor = cx.fillStyle; cx.fillRect(px + 6, py - 11, 10, 3); cx.shadowBlur = 0;
    if ((patrol.dir > 0 && px > W + 200) || (patrol.dir < 0 && px < -200)) { patrol.active = false; patrol.at = t + 14000 + Math.random() * 12000; }
  }

  // ---------- the opening eye (front page) ----------
  var blinkAt = 5000, blinkStart = -1;
  function drawEye(t) {
    var narrow = W < 760, R = Math.min(narrow ? W * .62 : W * .27, H * (narrow ? .55 : .62)), ex = narrow ? W * .62 : W * .69, ey = H * (narrow ? .36 : .44);
    cx.save();
    if (narrow) cx.globalAlpha = .38;
    // skin and shadow around the eye
    var skin = cx.createRadialGradient(ex, ey, R * .2, ex, ey, R * 1.5); skin.addColorStop(0, 'rgba(60,32,24,.9)'); skin.addColorStop(.6, 'rgba(26,14,12,.75)'); skin.addColorStop(1, 'rgba(7,9,16,0)');
    cx.fillStyle = skin; cx.beginPath(); cx.ellipse(ex, ey, R * 1.5, R * 1.05, 0, 0, 7); cx.fill();
    // blink
    var open = 1;
    if (!reduce) { if (blinkStart < 0 && t > blinkAt) blinkStart = t;
      if (blinkStart >= 0) { var k = (t - blinkStart) / 260; open = k < .5 ? 1 - k * 2 : (k - .5) * 2; if (k >= 1) { blinkStart = -1; blinkAt = t + 4000 + Math.random() * 6000; open = 1; } } }
    open = Math.max(.04, Math.min(1, open));
    var top = R * .62 * open, bot = R * .5 * open;
    cx.save(); cx.beginPath(); cx.moveTo(ex - R, ey); cx.bezierCurveTo(ex - R * .45, ey - top * 1.25, ex + R * .45, ey - top * 1.25, ex + R, ey);
    cx.bezierCurveTo(ex + R * .45, ey + bot * 1.25, ex - R * .45, ey + bot * 1.25, ex - R, ey); cx.closePath(); cx.clip();
    var scl = cx.createRadialGradient(ex - R * .1, ey - R * .1, R * .1, ex, ey, R); scl.addColorStop(0, '#8d817a'); scl.addColorStop(.55, '#5a4a44'); scl.addColorStop(1, '#1e1210');
    cx.fillStyle = scl; cx.fillRect(ex - R, ey - R, R * 2, R * 2);
    cx.strokeStyle = 'rgba(150,40,35,.35)'; cx.lineWidth = 1;
    for (var vv = 0; vv < 14; vv++) { var va = rnd(vv + 300) * 6.283, vr = R * (.55 + rnd(vv + 310) * .4);
      cx.beginPath(); cx.moveTo(ex + Math.cos(va) * R, ey + Math.sin(va) * R * .6);
      cx.quadraticCurveTo(ex + Math.cos(va + .2) * vr * .8, ey + Math.sin(va - .2) * vr * .45, ex + Math.cos(va) * R * .5, ey + Math.sin(va) * R * .3); cx.stroke(); }
    var ir = R * .44, ix = ex - R * .03, iy = ey;
    var iris = cx.createRadialGradient(ix, iy, ir * .25, ix, iy, ir); iris.addColorStop(0, '#3f8f86'); iris.addColorStop(.5, '#1f5560'); iris.addColorStop(.88, '#0e2a32'); iris.addColorStop(1, '#061218');
    cx.fillStyle = iris; cx.beginPath(); cx.arc(ix, iy, ir, 0, 7); cx.fill();
    cx.strokeStyle = 'rgba(200,240,230,.09)'; cx.lineWidth = 1;
    for (var f = 0; f < 72; f++) { var a = f / 72 * 6.283; cx.beginPath(); cx.moveTo(ix + Math.cos(a) * ir * .3, iy + Math.sin(a) * ir * .3); cx.lineTo(ix + Math.cos(a + .05) * ir * .95, iy + Math.sin(a + .05) * ir * .95); cx.stroke(); }
    // the city reflected in the eye: skyline and fire, curved across the iris
    cx.save(); cx.beginPath(); cx.arc(ix, iy, ir * .98, 0, 7); cx.clip();
    var hz = iy + ir * .15, fire = 0;
    stacks.forEach(function (s) { if (s.burst >= 0) fire = Math.max(fire, 1 - (t - s.burst) / 1600); });
    var refl = cx.createLinearGradient(0, iy - ir, 0, iy + ir); refl.addColorStop(0, 'rgba(255,120,40,0)'); refl.addColorStop(.55, 'rgba(255,130,40,' + (.55 + fire * .4) + ')'); refl.addColorStop(1, 'rgba(255,90,20,.1)');
    cx.globalAlpha = .75; cx.fillStyle = refl; cx.fillRect(ix - ir, iy - ir, ir * 2, ir * 2); cx.globalAlpha = 1;
    for (var q = 0; q < 26; q++) { var qx = ix - ir + q * (ir * 2 / 26), qh = ir * (.08 + rnd(q + 200) * .32);
      cx.fillStyle = 'rgba(10,6,4,.75)'; cx.fillRect(qx, hz - qh, ir * 2 / 26 - 1, qh + ir);
      if (rnd(q + 210) > .5) { cx.fillStyle = 'rgba(255,190,110,.6)'; cx.fillRect(qx + 2, hz - qh + 3, 2, 2); } }
    [.55, .78].forEach(function (p, n) { var fx = ix - ir + ir * 2 * p, fy = hz - ir * .25, fr = ir * (.1 + (reduce ? 0 : Math.sin(t / 150 + n) * .02) + fire * .25);
      var fg2 = cx.createRadialGradient(fx, fy, 0, fx, fy, fr); fg2.addColorStop(0, 'rgba(255,240,200,.95)'); fg2.addColorStop(.4, 'rgba(255,150,50,.7)'); fg2.addColorStop(1, 'rgba(255,80,20,0)');
      cx.fillStyle = fg2; cx.beginPath(); cx.arc(fx, fy, fr, 0, 7); cx.fill(); });
    cx.restore();
    var pr = ir * (.24 + (reduce ? 0 : Math.sin(t / 3000) * .03) - fire * .05);
    cx.fillStyle = '#050403'; cx.beginPath(); cx.arc(ix, iy, pr, 0, 7); cx.fill();
    cx.fillStyle = 'rgba(255,255,255,.55)'; cx.beginPath(); cx.ellipse(ix - ir * .34, iy - ir * .36, ir * .1, ir * .06, -.5, 0, 7); cx.fill();
    cx.fillStyle = 'rgba(255,255,255,.35)'; cx.beginPath(); cx.arc(ix + ir * .28, iy + ir * .3, ir * .04, 0, 7); cx.fill();
    var lidShade = cx.createLinearGradient(0, ey - top, 0, ey); lidShade.addColorStop(0, 'rgba(20,10,8,.75)'); lidShade.addColorStop(1, 'rgba(20,10,8,0)');
    cx.fillStyle = lidShade; cx.fillRect(ex - R, ey - top * 1.3, R * 2, top * .9);
    cx.restore();
    cx.strokeStyle = 'rgba(10,5,4,.85)'; cx.lineWidth = Math.max(2, R * .03);
    cx.beginPath(); cx.moveTo(ex - R, ey); cx.bezierCurveTo(ex - R * .45, ey - top * 1.25, ex + R * .45, ey - top * 1.25, ex + R, ey); cx.stroke();
    cx.restore();
  }

  function drawCity(t) {
    cx.clearRect(0, 0, W, H);
    sky(); drawHaze(t); drawBeams(t); drawStacks(t);
    if (mood.eye) drawEye(t);
    drawTowers(t); drawBoards(t); drawSpinners(t);
    if (mood.dust) { cx.fillStyle = 'rgba(230,140,60,.12)'; cx.fillRect(0, 0, W, H); }
    // keep the hero text readable: darken the left side
    var v = cx.createLinearGradient(0, 0, W * .7, 0); v.addColorStop(0, 'rgba(7,9,16,' + (mood.dust ? .62 : .42) + ')'); v.addColorStop(1, 'rgba(7,9,16,0)');
    cx.fillStyle = v; cx.fillRect(0, 0, W, H);
  }

  // ---------- loop ----------
  // Battery: draw the skyline only while the hero is on screen, cap at about
  // 30 frames a second, and stop everything while the page is hidden.
  var heroVisible = true, last = 0, running = false;
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { heroVisible = es[0].isIntersecting; }).observe(cc);
  function frame(t) {
    running = false;
    if (document.hidden) return;
    if (!reduce && t && t - last < 32) { running = true; requestAnimationFrame(frame); return; }
    last = t || 0;
    drawRain(t || 0); if (heroVisible || reduce) drawCity(t || 0);
    if (!reduce) { running = true; requestAnimationFrame(frame); }
  }
  function kick() { if (!running && !document.hidden) frame(performance.now()); }
  function resize() { sizeRain(); layout(); if (reduce) frame(0); }
  window.addEventListener('br:view', function (e) {
    var v = e.detail && e.detail.view; if (!MOODS[v]) return;
    moodName = v; mood = MOODS[v]; layout(); if (reduce) frame(0);
  });
  addEventListener('resize', resize); resize(); frame(0);
  document.addEventListener('visibilitychange', kick);
})();
