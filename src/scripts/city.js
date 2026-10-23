(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var css = getComputedStyle(document.documentElement);
  var C = { cyan: css.getPropertyValue('--cyan').trim(), pink: css.getPropertyValue('--pink').trim(), amber: css.getPropertyValue('--amber').trim(), rust: css.getPropertyValue('--rust').trim() };

  // Eye fibres
  var g = document.getElementById('fibres'), ns = 'http://www.w3.org/2000/svg';
  for (var i = 0; g && i < 48; i++) {
    var t = i / 48 * Math.PI * 2, r2 = i % 2 ? 48 : 55, l = document.createElementNS(ns, 'line');
    l.setAttribute('x1', 170 + Math.cos(t) * 24); l.setAttribute('y1', 110 + Math.sin(t) * 24);
    l.setAttribute('x2', 170 + Math.cos(t) * r2); l.setAttribute('y2', 110 + Math.sin(t) * r2);
    l.setAttribute('class', 'fibre'); g.appendChild(l);
  }

  // Rain
  var rc = document.getElementById('rain'), rx = rc.getContext('2d'), drops = [];
  function sizeRain() { rc.width = innerWidth; rc.height = innerHeight; drops = [];
    var n = Math.floor(innerWidth * innerHeight / 9000);
    for (var i = 0; i < n; i++) drops.push({ x: Math.random() * rc.width, y: Math.random() * rc.height, v: 9 + Math.random() * 9, l: 10 + Math.random() * 16 }); }
  function drawRain() { rx.clearRect(0, 0, rc.width, rc.height); rx.strokeStyle = 'rgba(150,185,255,.28)'; rx.lineWidth = 1; rx.beginPath();
    drops.forEach(function (d) { rx.moveTo(d.x, d.y); rx.lineTo(d.x - 2, d.y + d.l);
      if (!reduce) { d.y += d.v; d.x -= 1.1; if (d.y > rc.height) { d.y = -20; d.x = Math.random() * rc.width + 40; } } });
    rx.stroke(); }

  // City
  var cc = document.getElementById('city'), cx = cc.getContext('2d'), towers = [], spinners = [];
  function rnd(s) { var x = Math.sin(s) * 10000; return x - Math.floor(x); }
  function sizeCity() { var r = cc.getBoundingClientRect(); cc.width = r.width; cc.height = r.height; towers = []; var x = 0, k = 0;
    while (x < cc.width) { var w = 30 + rnd(k + 1) * 60, h = cc.height * (0.18 + rnd(k + 7) * 0.42); towers.push({ x: x, w: w, h: h, k: k, far: rnd(k + 3) > .55 }); x += w + 2 + rnd(k + 5) * 8; k++; }
    spinners = [{ x: cc.width * .2, y: cc.height * .3, v: .6 }, { x: cc.width * .75, y: cc.height * .45, v: -.45 }, { x: cc.width * .5, y: cc.height * .2, v: .3 }]; }
  var flame = 0;
  function drawCity(t) { var H = cc.height; cx.clearRect(0, 0, cc.width, H);
    var gr = cx.createRadialGradient(cc.width * .85, H, 10, cc.width * .85, H, H * .9); gr.addColorStop(0, 'rgba(255,120,30,.35)'); gr.addColorStop(1, 'rgba(255,120,30,0)');
    cx.fillStyle = gr; cx.fillRect(0, 0, cc.width, H);
    // flare stacks
    [[.88, .62], [.94, .7]].forEach(function (f, i) { var fx = cc.width * f[0], fy = H * f[1];
      cx.fillStyle = '#0b0f1c'; cx.fillRect(fx - 4, fy, 8, H - fy);
      var fl = 14 + Math.sin(t / 180 + i) * 5 + (reduce ? 0 : Math.random() * 4); var fg = cx.createRadialGradient(fx, fy - 8, 1, fx, fy - 8, fl * 2.2);
      fg.addColorStop(0, 'rgba(255,230,160,.95)'); fg.addColorStop(.35, 'rgba(255,140,40,.7)'); fg.addColorStop(1, 'rgba(255,90,20,0)'); cx.fillStyle = fg; cx.beginPath(); cx.arc(fx, fy - 8, fl * 2.2, 0, 7); cx.fill(); });
    towers.forEach(function (b) { var y = H - b.h * (b.far ? 1.15 : 1); cx.fillStyle = b.far ? '#141b2e' : '#0a0e1a'; cx.fillRect(b.x, y, b.w, H - y);
      if (b.far) return;
      for (var r = 0; r * 11 + 10 < b.h; r++) for (var c = 0; c * 8 + 8 < b.w; c++) { var s = rnd(b.k * 131 + r * 17 + c * 7);
        if (s > .78) { var flick = reduce ? 1 : (rnd(s * 99 + Math.floor(t / 1500)) > .04 ? 1 : 0); cx.fillStyle = s > .93 ? C.cyan : s > .9 ? C.pink : C.amber; cx.globalAlpha = .55 * flick; cx.fillRect(b.x + 4 + c * 8, y + 6 + r * 11, 3, 5); } }
      cx.globalAlpha = 1;
      if (b.h > H * .5) { cx.fillStyle = 'rgba(255,60,60,' + (reduce ? .9 : (Math.sin(t / 400 + b.k) > 0 ? .95 : .25)) + ')'; cx.beginPath(); cx.arc(b.x + b.w / 2, y - 3, 2, 0, 7); cx.fill(); } });
    spinners.forEach(function (s, i) { if (!reduce) { s.x += s.v; if (s.x > cc.width + 40) s.x = -40; if (s.x < -40) s.x = cc.width + 40; }
      var sy = s.y + Math.sin(t / 900 + i) * 4;
      var bg = cx.createLinearGradient(0, sy, 0, sy + 120); bg.addColorStop(0, 'rgba(255,200,120,.16)'); bg.addColorStop(1, 'rgba(255,200,120,0)');
      cx.fillStyle = bg; cx.beginPath(); cx.moveTo(s.x - 10, sy + 4); cx.lineTo(s.x - 46, sy + 120); cx.lineTo(s.x + 46, sy + 120); cx.lineTo(s.x + 10, sy + 4); cx.fill();
      cx.fillStyle = '#1a2233'; cx.beginPath(); cx.moveTo(s.x - 16, sy); cx.lineTo(s.x + 16, sy); cx.lineTo(s.x + 11, sy + 6); cx.lineTo(s.x - 11, sy + 6); cx.fill();
      cx.fillStyle = (Math.floor(t / 300) + i) % 2 ? C.rust : C.cyan; cx.fillRect(s.x + (s.v > 0 ? 13 : -15), sy + 1, 2, 2); });
  }
  // Battery: draw the skyline only while the hero is on screen, cap the rain at
  // about 30 frames a second, and stop everything while the page is hidden.
  var heroVisible = true, last = 0, running = false;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { heroVisible = es[0].isIntersecting; }).observe(cc);
  }
  function frame(t) {
    running = false;
    if (document.hidden) return;
    if (!reduce && t && t - last < 32) { running = true; requestAnimationFrame(frame); return; }
    last = t || 0;
    drawRain(); if (heroVisible || reduce) drawCity(t || 0);
    if (!reduce) { running = true; requestAnimationFrame(frame); }
  }
  function kick() { if (!running && !document.hidden) frame(performance.now()); }
  function resize() { sizeRain(); sizeCity(); if (reduce) frame(0); }
  addEventListener('resize', resize); resize(); frame(0);
  document.addEventListener('visibilitychange', kick);
})();
