
/* Original poster art for each work, painted on canvas. */
(function () {
  var C = { amber: '#ffb347', cyan: '#22e5ff', pink: '#ff2e88', rust: '#ff5a4d', ink: '#e6eaf4', dim: '#95a2c4', night: '#070910', mass: '#0a0e1a' };
  function seeded(s) { var x = 0; for (var i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) >>> 0; return function () { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; }; }
  function rgba(hex, a) { var n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }

  function sky(g, w, h, top, bottom) { var gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, top); gr.addColorStop(1, bottom); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
  function glow(g, x, y, r, col, a) { var gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, rgba(col, a)); gr.addColorStop(1, rgba(col, 0)); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  function skyline(g, w, h, R, base, minH, maxH, col, lit, fill) {
    var x = -4;
    while (x < w) { var bw = 10 + R() * 26, bh = minH + R() * (maxH - minH);
      g.fillStyle = fill || C.mass; g.fillRect(x, base - bh, bw, bh + h);
      if (lit) for (var yy = base - bh + 5; yy < base - 4; yy += 6) for (var xx = x + 3; xx < x + bw - 3; xx += 5) if (R() < lit) { g.fillStyle = rgba(R() < 0.8 ? col : C.ink, 0.35 + R() * 0.5); g.fillRect(xx, yy, 2, 3); }
      x += bw + 1 + R() * 3; }
  }
  function rain(g, w, h, R, n, a) { g.strokeStyle = 'rgba(160,190,255,' + a + ')'; g.lineWidth = 1; g.beginPath(); for (var i = 0; i < n; i++) { var x = R() * w, y = R() * h, l = 6 + R() * 12; g.moveTo(x, y); g.lineTo(x - 2, y + l); } g.stroke(); }
  function scan(g, w, h) { g.fillStyle = 'rgba(255,255,255,0.025)'; for (var y = 0; y < h; y += 3) g.fillRect(0, y, w, 1); }
  function frame(g, w, h, col, title, sub, year) {
    var grd = g.createLinearGradient(0, h * 0.62, 0, h); grd.addColorStop(0, 'rgba(7,9,16,0)'); grd.addColorStop(1, 'rgba(7,9,16,0.92)'); g.fillStyle = grd; g.fillRect(0, h * 0.6, w, h * 0.4);
    g.strokeStyle = col; g.lineWidth = 2; g.shadowColor = col; g.shadowBlur = 12; g.strokeRect(7, 7, w - 14, h - 14); g.shadowBlur = 0;
    g.fillStyle = col; g.font = '400 11px "Share Tech Mono", monospace'; g.textAlign = 'left'; g.fillText(year, 18, 28);
    g.textAlign = 'right'; g.fillStyle = C.ink; g.globalAlpha = 0.7; g.fillText('BLADE RUNNER', w - 18, 28); g.globalAlpha = 1;
    g.textAlign = 'left'; g.shadowColor = col; g.shadowBlur = 16; g.fillStyle = col;
    var size = title.length > 13 ? 22 : 28; g.font = '700 ' + size + 'px "Jost", sans-serif';
    var lines = title.split('\n'); for (var i = 0; i < lines.length; i++) g.fillText(lines[i], 18, h - 40 - (lines.length - 1 - i) * (size + 2));
    g.shadowBlur = 0; g.fillStyle = C.dim; g.font = '400 11px "Share Tech Mono", monospace'; g.fillText(sub, 18, h - 20);
  }

  var ART = {
    origins: { col: C.amber, title: 'ORIGINS', sub: 'COMIC · 2009', year: '2009', draw: function (g, w, h, R) {
      sky(g, w, h, '#0b0d1c', '#2a1410'); glow(g, w * 0.5, h * 0.3, w * 0.5, C.amber, 0.25);
      g.strokeStyle = rgba(C.cyan, 0.8); g.lineWidth = 2; g.beginPath(); g.ellipse(w / 2, h * 0.3, w * 0.3, w * 0.16, 0, 0, 7); g.stroke();
      g.strokeStyle = rgba(C.pink, 0.8); g.beginPath(); g.arc(w / 2, h * 0.3, w * 0.12, 0, 7); g.stroke();
      for (var i = 0; i < 40; i++) { var t = i / 40 * Math.PI * 2; g.strokeStyle = rgba(C.pink, 0.35); g.beginPath(); g.moveTo(w / 2 + Math.cos(t) * w * 0.05, h * 0.3 + Math.sin(t) * w * 0.05); g.lineTo(w / 2 + Math.cos(t) * w * 0.115, h * 0.3 + Math.sin(t) * w * 0.115); g.stroke(); }
      g.fillStyle = C.night; g.beginPath(); g.arc(w / 2, h * 0.3, w * 0.045, 0, 7); g.fill(); g.strokeStyle = C.amber; g.stroke();
      skyline(g, w, h, R, h * 0.98, h * 0.18, h * 0.42, C.amber, 0.22); rain(g, w, h, R, 140, 0.25); } },
    tokyo: { col: C.pink, title: 'TOKYO\nNEXUS', sub: 'COMIC · 2015', year: '2015', draw: function (g, w, h, R) {
      sky(g, w, h, '#120818', '#2a0b1c'); var cy = h * 0.42;
      g.fillStyle = C.rust; g.beginPath(); g.arc(w / 2, cy, w * 0.32, 0, 7); g.fill(); glow(g, w / 2, cy, w * 0.6, C.pink, 0.3);
      g.fillStyle = '#120818'; for (var k = 0; k < 6; k++) g.fillRect(0, cy + 6 + k * 11, w, 3 + k);
      skyline(g, w, h, R, h, h * 0.2, h * 0.5, C.pink, 0.25);
      g.font = '700 15px "Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans JP",sans-serif'; ['東', '京', '連', '結'].forEach(function (ch, i) { g.fillStyle = C.cyan; g.shadowColor = C.cyan; g.shadowBlur = 10; g.fillText(ch, w - 30, 60 + i * 18); }); g.shadowBlur = 0;
      for (var l = 0; l < 7; l++) { var lx = 24 + l * (w - 48) / 6, ly = h * 0.16 + Math.sin(l) * 6; g.fillStyle = C.rust; g.beginPath(); g.ellipse(lx, ly, 6, 8, 0, 0, 7); g.fill(); glow(g, lx, ly, 16, C.rust, 0.4); }
      rain(g, w, h, R, 120, 0.22); } },
    tokyo2: { col: C.pink, title: 'TO LOSE\nIS TO WIN', sub: 'COMIC · 2026', year: '2015', draw: function (g, w, h, R) {
      sky(g, w, h, '#0c0a16', '#2a1020'); glow(g, w * 0.5, h * 0.2, w * 0.55, C.pink, 0.22);
      var vx = w / 2, ground = function (k) { return h * 0.4 + (h * 0.98 - h * 0.4) * k; };
      g.fillStyle = rgba('#dfe6f5', 0.1); g.beginPath(); g.moveTo(vx - 6, h * 0.4); g.lineTo(vx + 6, h * 0.4); g.lineTo(w * 0.95, h); g.lineTo(w * 0.05, h); g.fill();
      [0.08, 0.22, 0.42, 0.7].forEach(function (k) {   // far to near
        var gy = ground(k), sc = 0.25 + k, half = w * 0.36 * sc, tall = h * 0.34 * sc, top = gy - tall, post = Math.max(2, 7 * sc), a = 0.35 + k * 0.8;
        g.fillStyle = rgba(C.rust, Math.min(1, a));
        g.fillRect(vx - half * 0.66, top, post, tall); g.fillRect(vx + half * 0.66 - post, top, post, tall);
        g.fillRect(vx - half * 0.8, top + tall * 0.2, half * 1.6, Math.max(1.5, 4 * sc));
        g.beginPath(); g.moveTo(vx - half, top - 3 * sc); g.quadraticCurveTo(vx, top + 4 * sc, vx + half, top - 3 * sc); g.lineTo(vx + half * 0.95, top + 5 * sc); g.quadraticCurveTo(vx, top + 11 * sc, vx - half * 0.95, top + 5 * sc); g.fill();
        if (k > 0.3) glow(g, vx, top, half, C.rust, 0.12);
      });
      g.strokeStyle = rgba(C.cyan, 0.9); g.lineWidth = 2; g.shadowColor = C.cyan; g.shadowBlur = 12; g.beginPath(); g.moveTo(w * 0.22, h * 0.9); g.lineTo(w * 0.78, h * 0.62); g.stroke(); g.shadowBlur = 0;
      g.font = '700 15px "Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans JP",sans-serif'; ['負', 'け', 'る', 'が', '勝', 'ち'].forEach(function (ch, i) { g.fillStyle = C.pink; g.shadowColor = C.pink; g.shadowBlur = 10; g.fillText(ch, w - 30, 52 + i * 18); }); g.shadowBlur = 0;
      for (var n = 0; n < 160; n++) { g.fillStyle = rgba('#ffffff', 0.25 + R() * 0.5); g.beginPath(); g.arc(R() * w, R() * h, R() * 1.6 + 0.4, 0, 7); g.fill(); } } },
    film82: { col: C.amber, title: 'BLADE\nRUNNER', sub: 'FILM · 1982', year: '2019', draw: function (g, w, h, R) {
      sky(g, w, h, '#06070e', '#3a1a08'); var base = h * 0.78;
      for (var y = base; y < h; y += 6) { g.fillStyle = rgba(C.amber, 0.06 + (y - base) / (h - base) * 0.2); g.fillRect(0, y, w, 1); }
      for (var x = 0; x < w; x += 3) if (R() < 0.5) { g.fillStyle = rgba(C.amber, 0.2 + R() * 0.6); g.fillRect(x, base - R() * 30, 1.5, 1.5); }
      [[0.2, 0.42], [0.62, 0.35], [0.84, 0.5]].forEach(function (s) { var sx = w * s[0], sy = h * s[1];
        g.fillStyle = C.mass; g.fillRect(sx - 4, sy, 8, base - sy + 40); glow(g, sx, sy - 14, 46, C.amber, 0.7); glow(g, sx, sy - 18, 18, '#fff1c4', 0.9);
        g.fillStyle = rgba('#ffd27a', 0.9); g.beginPath(); g.moveTo(sx - 6, sy); g.quadraticCurveTo(sx - 2 + R() * 4, sy - 40, sx, sy - 34); g.quadraticCurveTo(sx + 4, sy - 20, sx + 6, sy); g.fill(); });
      skyline(g, w, h, R, h, h * 0.05, h * 0.2, C.amber, 0.12);
      for (var i = 0; i < 4; i++) { var px = R() * w, py = h * 0.15 + R() * h * 0.25; g.fillStyle = C.rust; g.fillRect(px, py, 3, 2); g.fillStyle = C.cyan; g.fillRect(px + 10, py, 3, 2); }
      rain(g, w, h, R, 100, 0.18); } },
    game97: { col: C.cyan, title: 'THE GAME', sub: 'PC GAME · 1997', year: '2019', draw: function (g, w, h, R) {
      sky(g, w, h, '#03110f', '#06201c');
      var x0 = 30, y0 = 58, pw = w - 60, ph = h * 0.5;
      g.fillStyle = '#1a0d06'; g.fillRect(x0, y0, pw, ph);
      var gr = g.createLinearGradient(0, y0, 0, y0 + ph); gr.addColorStop(0, '#2a1608'); gr.addColorStop(1, '#5a2a0c'); g.fillStyle = gr; g.fillRect(x0, y0, pw, ph);
      g.save(); g.beginPath(); g.rect(x0, y0, pw, ph); g.clip();
      skyline(g, w, h, R, y0 + ph, ph * 0.25, ph * 0.75, C.amber, 0.3, '#120904');
      g.fillStyle = 'rgba(34,229,255,0.06)'; for (var y = y0; y < y0 + ph; y += 3) g.fillRect(x0, y, pw, 1);
      g.restore();
      g.strokeStyle = rgba(C.cyan, 0.25); g.lineWidth = 1;
      for (var gx = x0; gx <= x0 + pw; gx += pw / 8) { g.beginPath(); g.moveTo(gx, y0); g.lineTo(gx, y0 + ph); g.stroke(); }
      for (var gy = y0; gy <= y0 + ph; gy += ph / 6) { g.beginPath(); g.moveTo(x0, gy); g.lineTo(x0 + pw, gy); g.stroke(); }
      var bx = x0 + pw * 0.56, by = y0 + ph * 0.28, bw = pw * 0.26, bh = ph * 0.3;
      g.strokeStyle = C.cyan; g.lineWidth = 2; g.shadowColor = C.cyan; g.shadowBlur = 10; g.strokeRect(bx, by, bw, bh); g.shadowBlur = 0;
      g.beginPath(); g.moveTo(bx + bw / 2, y0); g.lineTo(bx + bw / 2, by); g.moveTo(bx + bw / 2, by + bh); g.lineTo(bx + bw / 2, y0 + ph);
      g.moveTo(x0, by + bh / 2); g.lineTo(bx, by + bh / 2); g.moveTo(bx + bw, by + bh / 2); g.lineTo(x0 + pw, by + bh / 2); g.lineWidth = 1; g.strokeStyle = rgba(C.cyan, 0.6); g.stroke();
      g.strokeStyle = C.cyan; g.lineWidth = 1.5; g.strokeRect(x0, y0, pw, ph);
      g.font = '400 10px "Share Tech Mono", monospace'; g.fillStyle = C.cyan; g.textAlign = 'left';
      g.fillText('ENHANCE 224 TO 176', x0, y0 + ph + 18); g.fillText('TRACK 45 RIGHT', x0, y0 + ph + 32);
      g.textAlign = 'right'; g.fillText('ZOOM 4.2', x0 + pw, y0 + ph + 18);
      for (var k = 0; k < 18; k++) { g.fillStyle = rgba(C.cyan, 0.15 + R() * 0.5); g.fillRect(x0 + k * (pw / 18), y0 + ph + 42, pw / 18 - 3, 3 + R() * 10); }
    } },
    br2019: { col: C.cyan, title: '2019', sub: 'COMIC · 12 ISSUES', year: '2019', draw: function (g, w, h, R) {
      sky(g, w, h, '#050912', '#0b2030'); var hz = h * 0.5;
      g.fillStyle = '#d8f6ff'; g.beginPath(); g.arc(w * 0.7, h * 0.22, 22, 0, 7); g.fill(); glow(g, w * 0.7, h * 0.22, 90, C.cyan, 0.35);
      g.fillStyle = '#071420'; g.beginPath(); g.moveTo(w * 0.1, hz); g.quadraticCurveTo(w * 0.25, hz - 34, w * 0.42, hz); g.fill();
      for (var y = hz; y < h; y += 4) { var a = 0.05 + (y - hz) / h * 0.3; g.fillStyle = rgba(C.cyan, a * (0.4 + R())); g.fillRect(w * 0.7 - (y - hz) * 0.6 * R(), y, (y - hz) * 1.2 * R() + 4, 1); }
      g.fillStyle = '#0a1a28'; g.fillRect(0, hz, w, 2); rain(g, w, h, R, 90, 0.15);
      for (var i = 0; i < 10; i++) { g.fillStyle = rgba(C.amber, 0.8); g.fillRect(w * 0.12 + i * 6, hz - 2, 2, 2); } } },
    blackout: { col: C.dim, title: 'BLACK OUT\n2022', sub: 'ANIME SHORT', year: '2022', draw: function (g, w, h, R) {
      sky(g, w, h, '#0c0f18', '#05060a'); var cx = w * 0.55, cy = h * 0.2;
      glow(g, cx, cy, w * 0.7, '#ffffff', 0.35); g.fillStyle = '#fff'; g.beginPath(); g.arc(cx, cy, 8, 0, 7); g.fill();
      for (var r = 30; r < w; r += 26) { g.strokeStyle = 'rgba(255,255,255,' + (0.35 - r / w * 0.3) + ')'; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke(); }
      var base = h; var x = -4; while (x < w) { var bw = 10 + R() * 24, bh = h * 0.15 + R() * h * 0.4; g.fillStyle = C.mass; g.fillRect(x, base - bh, bw, bh);
        for (var yy = base - bh + 5; yy < base - 4; yy += 6) for (var xx = x + 3; xx < x + bw - 3; xx += 5) if (R() < 0.3 && xx < w * 0.35) { g.fillStyle = rgba(C.amber, 0.6); g.fillRect(xx, yy, 2, 3); }
        x += bw + 2; } rain(g, w, h, R, 60, 0.12); } },
    br2029: { col: C.cyan, title: '2029', sub: 'COMIC · 12 ISSUES', year: '2029', draw: function (g, w, h, R) {
      sky(g, w, h, '#060a14', '#122336'); glow(g, w * 0.3, h * 0.55, w * 0.6, C.rust, 0.35);
      g.fillStyle = '#0b1220'; g.beginPath(); g.moveTo(0, h * 0.55); g.lineTo(w, h * 0.42); g.lineTo(w, h); g.lineTo(0, h); g.fill();
      for (var i = 0; i < 26; i++) { g.strokeStyle = rgba(C.cyan, 0.3); g.beginPath(); var yy = h * 0.55 - i * 0.5 + i * 0; g.moveTo(i * w / 26, h * 0.55 - (h * 0.13) * i / 26); g.lineTo(i * w / 26, h * 0.62 - (h * 0.13) * i / 26); g.stroke(); }
      for (var s = 0; s < 40; s++) { glow(g, R() * w * 0.5, h * 0.52 + R() * 20, 10 + R() * 14, '#ffffff', 0.25); }
      g.fillStyle = '#18233a'; g.beginPath(); g.ellipse(w * 0.62, h * 0.2, w * 0.22, 14, -0.05, 0, 7); g.fill();
      for (var l = 0; l < 9; l++) { g.fillStyle = l % 3 ? C.amber : C.rust; g.fillRect(w * 0.45 + l * 8, h * 0.205, 3, 2); }
      glow(g, w * 0.3, h * 0.5, 40, C.amber, 0.7); rain(g, w, h, R, 120, 0.2); } },
    lotus: { col: C.pink, title: 'BLACK\nLOTUS', sub: 'ANIME · 13 EPISODES', year: '2032', draw: function (g, w, h, R) {
      sky(g, w, h, '#0e0614', '#2b1020'); g.fillStyle = '#f6d7e6'; g.beginPath(); g.arc(w * 0.5, h * 0.27, 40, 0, 7); g.fill(); glow(g, w * 0.5, h * 0.27, 120, C.pink, 0.35);
      var cx = w / 2, cy = h * 0.5; g.lineWidth = 2;
      [[-1.25, 46], [-0.7, 54], [-0.25, 58], [0.25, 58], [0.7, 54], [1.25, 46], [0, 64]].forEach(function (p) {
        g.save(); g.translate(cx, cy); g.rotate(p[0]); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-16, -p[1] * 0.55, 0, -p[1]); g.quadraticCurveTo(16, -p[1] * 0.55, 0, 0);
        g.fillStyle = '#0b0710'; g.fill(); g.strokeStyle = C.pink; g.shadowColor = C.pink; g.shadowBlur = 10; g.stroke(); g.restore(); });
      g.shadowBlur = 0; g.fillStyle = '#1c0d16'; for (var d = 0; d < 3; d++) { g.beginPath(); g.moveTo(0, h * (0.62 + d * 0.07)); g.quadraticCurveTo(w * (0.3 + d * 0.2), h * (0.56 + d * 0.07), w, h * (0.63 + d * 0.06)); g.lineTo(w, h); g.lineTo(0, h); g.fill(); }
      rain(g, w, h, R, 40, 0.12); } },
    dawn: { col: C.dim, title: 'NEXUS\nDAWN', sub: 'SHORT FILM · 2036', year: '2036', draw: function (g, w, h, R) {
      sky(g, w, h, '#151821', '#4a3a2e'); var sy = h * 0.58; glow(g, w / 2, sy, w * 0.8, '#ffd8a0', 0.4);
      g.fillStyle = '#ffe9c8'; g.beginPath(); g.arc(w / 2, sy, 30, Math.PI, 0); g.fill();
      for (var a = 0; a < 14; a++) { var t = Math.PI + a / 13 * Math.PI; g.strokeStyle = 'rgba(255,230,190,0.18)'; g.beginPath(); g.moveTo(w / 2, sy); g.lineTo(w / 2 + Math.cos(t) * w, sy + Math.sin(t) * w); g.stroke(); }
      g.fillStyle = '#20222a'; g.fillRect(0, sy, w, h - sy); skyline(g, w, h, R, h, h * 0.05, h * 0.28, C.dim, 0.05, '#1a1c24'); } },
    br2039: { col: C.amber, title: '2039', sub: 'COMIC · 12 ISSUES', year: '2039', draw: function (g, w, h, R) {
      sky(g, w, h, '#0a0b14', '#1c1410'); var cx = w / 2;
      for (var i = 0; i < 44; i++) { var y = 50 + i * (h * 0.55 / 44), ph = i * 0.42, x1 = cx + Math.sin(ph) * 46, x2 = cx - Math.sin(ph) * 46, front = Math.cos(ph) > 0;
        g.strokeStyle = 'rgba(230,234,244,0.15)'; g.beginPath(); g.moveTo(x1, y); g.lineTo(x2, y); g.stroke();
        g.fillStyle = front ? C.amber : rgba(C.amber, 0.35); g.beginPath(); g.arc(x1, y, 3, 0, 7); g.fill(); glow(g, x1, y, 10, C.amber, front ? 0.4 : 0.1);
        g.fillStyle = !front ? C.cyan : rgba(C.cyan, 0.35); g.beginPath(); g.arc(x2, y, 3, 0, 7); g.fill(); glow(g, x2, y, 10, C.cyan, !front ? 0.4 : 0.1); }
      skyline(g, w, h, R, h, h * 0.12, h * 0.34, C.amber, 0.18); rain(g, w, h, R, 90, 0.18); } },
    nowhere: { col: C.dim, title: 'NOWHERE\nTO RUN', sub: 'SHORT FILM · 2048', year: '2048', draw: function (g, w, h, R) {
      sky(g, w, h, '#1a1d1f', '#8a8e86'); var base = h * 0.62;
      for (var row = 0; row < 4; row++) { var y = base + row * 22, s = 1 + row * 0.25;
        for (var x = -20 + row * 9; x < w; x += 40 * s) { g.fillStyle = 'rgba(40,44,46,' + (0.5 + row * 0.15) + ')'; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 18 * s, y - 22 * s, x + 36 * s, y); g.fill(); } }
      g.fillStyle = 'rgba(200,205,195,0.25)'; g.fillRect(0, base - 40, w, 40); glow(g, w * 0.72, base - 8, 18, C.amber, 0.8); } },
    film49: { col: C.amber, title: '2049', sub: 'FILM · 2017', year: '2049', draw: function (g, w, h, R) {
      sky(g, w, h, '#2e1708', '#c46a1c'); glow(g, w * 0.4, h * 0.42, w * 0.7, '#ffb060', 0.45); g.fillStyle = 'rgba(255,220,170,0.85)'; g.beginPath(); g.arc(w * 0.4, h * 0.42, 26, 0, 7); g.fill();
      g.fillStyle = 'rgba(60,30,12,0.55)'; for (var i = 0; i < 6; i++) g.fillRect(w * (0.05 + R() * 0.8), h * 0.6 - R() * h * 0.3, 14 + R() * 30, h);
      g.fillStyle = 'rgba(40,22,10,0.9)'; for (var s = 0; s < 6; s++) g.fillRect(0, h * 0.72 + s * 14, w - s * 18, 12);
      g.fillStyle = 'rgba(255,255,255,0.75)'; for (var f = 0; f < 140; f++) { g.beginPath(); g.arc(R() * w, R() * h, R() * 1.6 + 0.4, 0, 7); g.fill(); } } },
    br2099: { col: C.rust, title: '2099', sub: 'SERIES · 8 EPISODES', year: '2099', draw: function (g, w, h, R) {
      sky(g, w, h, '#14050a', '#5a1410'); glow(g, w / 2, h * 0.9, w, C.rust, 0.4);
      for (var i = 0; i < 9; i++) { var tx = 10 + R() * (w - 30), tw = 6 + R() * 14, th = h * (0.5 + R() * 0.45); g.fillStyle = '#0d0508'; g.fillRect(tx, h - th, tw, th);
        for (var y = h - th + 4; y < h; y += 7) if (R() < 0.4) { g.fillStyle = rgba(C.rust, 0.7); g.fillRect(tx + 2, y, tw - 4, 1); } glow(g, tx + tw / 2, h - th, 8, C.rust, 0.7); }
      for (var t = 0; t < 7; t++) { var ty = h * (0.3 + R() * 0.45); var gr = g.createLinearGradient(0, ty, w, ty); gr.addColorStop(0, rgba(C.cyan, 0)); gr.addColorStop(0.5, rgba(C.cyan, 0.7)); gr.addColorStop(1, rgba(C.cyan, 0)); g.fillStyle = gr; g.fillRect(0, ty, w, 1.2); }
      rain(g, w, h, R, 100, 0.18); } }
  };

  function paint(cv) {
    var key = cv.getAttribute('data-art'), a = ART[key]; if (!a) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2), w = 300, h = 400; cv.width = w * dpr; cv.height = h * dpr;
    var g = cv.getContext('2d'); g.scale(dpr, dpr); var R = seeded(key);
    g.fillStyle = C.night; g.fillRect(0, 0, w, h); g.save(); g.beginPath(); g.rect(8, 8, w - 16, h - 16); g.clip(); a.draw(g, w, h, R); scan(g, w, h); g.restore(); frame(g, w, h, a.col, a.title, a.sub, a.year);
    cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', 'Original poster art for ' + a.title.replace('\n', ' ')); cv.setAttribute('data-painted', '1');
  }
  // put a poster beside each work's banner
  Object.keys(ART).forEach(function (id) {
    var sec = document.getElementById(id); if (!sec) return; var b = sec.querySelector('.vol-banner'); if (!b || b.querySelector('canvas.cover')) return;
    var text = document.createElement('div'); text.className = 'bt';
    Array.prototype.slice.call(b.children).forEach(function (ch) { if (!ch.classList.contains('jp')) text.appendChild(ch); });
    var cv = document.createElement('canvas'); cv.className = 'cover'; cv.setAttribute('data-art', id);
    b.classList.add('has-cover'); b.appendChild(text); b.appendChild(cv);
  });
  // paint each poster only when it comes near the screen; until then it is a blank canvas of the right size
  var dpr = Math.min(window.devicePixelRatio || 1, 2), canvases = Array.prototype.slice.call(document.querySelectorAll('canvas[data-art]'));
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); paint(e.target); } });
  }, { rootMargin: '600px 0px' }) : null;
  canvases.forEach(function (cv) {
    cv.width = 300 * dpr; cv.height = 400 * dpr;
    var a = ART[cv.getAttribute('data-art')]; if (a) { cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', 'Original poster art for ' + a.title.replace('\n', ' ')); }
    if (io) io.observe(cv); else paint(cv);
  });
  // repaint the ones already drawn once the web fonts arrive
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { canvases.forEach(function (cv) { if (cv.getAttribute('data-painted')) paint(cv); }); });
  window.BRArt = { paint: function (cv) { if (!cv.getAttribute('data-painted')) paint(cv); } };
})();
