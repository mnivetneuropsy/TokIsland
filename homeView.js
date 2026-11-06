/* ARCHIPEL — vue de l'île principale (Canvas 2D, vue 2D trois-quarts)
   Couche statique pré-rendue (terrain, chemins, végétation) + éléments animés triés par profondeur. */

G.Home = (() => {
  const U = G.U, A = G.Art, L = () => G.D.home;
  let cv, c, dpr = 1, vw = 0, vh = 0;
  const cam = { x: 700, y: 560, z: 0.8 };
  let bg = null, bgScale = 1.5, bgDirty = true;
  let running = false, raf = 0, lastT = 0, t = 0, frameSkip = false;
  let placing = null, ghost = null;
  const pen = [], tank = new G.Life.Tank();
  let treesList = [];

  /* ---------- Géométrie ---------- */
  function wobble(th) { return 1 + 0.045 * Math.sin(3 * th + 1) + 0.03 * Math.sin(5 * th + 2) + 0.018 * Math.sin(9 * th + 0.5); }
  function islandPts(scale) {
    const I = L().island, pts = [];
    for (let i = 0; i < 120; i++) { const th = i / 120 * Math.PI * 2; const r = wobble(th) * scale; pts.push([I.cx + Math.cos(th) * I.rx * r, I.cy + Math.sin(th) * I.ry * r]); }
    return pts;
  }
  function normR(x, y) { const I = L().island; const dx = (x - I.cx) / I.rx, dy = (y - I.cy) / I.ry; const th = Math.atan2(dy, dx); return Math.hypot(dx, dy) / wobble(th); }
  function segDist(p, a, b) { const dx = b.x - a.x, dy = b.y - a.y; const l = dx * dx + dy * dy; let k = ((p.x - a.x) * dx + (p.y - a.y) * dy) / l; k = U.clamp(k, 0, 1); return Math.hypot(p.x - (a.x + k * dx), p.y - (a.y + k * dy)); }
  function pathDist(p) { const n = L().nodes; let d = 1e9; for (const [a, b] of L().edges) d = Math.min(d, segDist(p, n[a], n[b])); d = Math.min(d, Math.hypot(p.x - L().plaza.x, p.y - L().plaza.y) - 70); if (p.y > 820 && Math.abs(p.x - 700) < 40) d = 0; return d; }
  function bRect(k, pad = 0) { const b = L().buildings[k]; if (k === 'zoo') { const p = b.pen; return { x0: p.x0 - pad, y0: p.y0 - pad, x1: p.x1 + pad, y1: b.y + pad }; } return { x0: b.x - b.w / 2 - pad, y0: b.y - b.h - pad, x1: b.x + b.w / 2 + pad, y1: b.y + pad }; }
  function inRect(p, r) { return p.x >= r.x0 && p.x <= r.x1 && p.y >= r.y0 && p.y <= r.y1; }
  function inAnyBuilding(p, pad) { for (const k in L().buildings) if (inRect(p, bRect(k, pad))) return k; return null; }
  function validDecorSpot(p) {
    if (normR(p.x, p.y) > 0.9) return 'Trop près du rivage.';
    if (inAnyBuilding(p, 18)) return 'Trop près d\'un bâtiment.';
    if (pathDist(p) < 26) return 'Pas sur un chemin.';
    for (const d of G.state.decor) if (Math.hypot(d.x - p.x, d.y - p.y) < 26) return 'Trop près d\'une autre décoration.';
    return null;
  }

  /* ---------- Couche statique ---------- */
  function buildStatic() {
    const W = L().W, H = L().H;
    bg = document.createElement('canvas'); bg.width = W * bgScale; bg.height = H * bgScale;
    const g = bg.getContext('2d'); g.scale(bgScale, bgScale);
    const fillPts = (pts, col) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fillStyle = col; g.fill(); };
    fillPts(islandPts(1.09), 'rgba(120,210,225,.55)');
    fillPts(islandPts(1.045), 'rgba(150,225,232,.7)');
    fillPts(islandPts(1.0), '#efdba6');
    fillPts(islandPts(0.955), '#a8cf6a');
    fillPts(islandPts(0.94), '#8cc663');
    const rnd = U.mulberry32(L().island.seed);
    // touffes d'herbe
    for (let i = 0; i < 900; i++) { const x = rnd() * W, y = rnd() * H; if (normR(x, y) > 0.92) continue; g.fillStyle = rnd() < 0.5 ? 'rgba(70,130,50,.25)' : 'rgba(190,230,120,.3)'; g.beginPath(); g.ellipse(x, y, 3 + rnd() * 4, 1.5 + rnd() * 1.5, 0, 0, 6.28); g.fill(); }
    // galets sur la plage
    for (let i = 0; i < 160; i++) { const th = rnd() * 6.28; const I = L().island; const r = wobble(th) * (0.965 + rnd() * 0.03); const x = I.cx + Math.cos(th) * I.rx * r, y = I.cy + Math.sin(th) * I.ry * r; g.fillStyle = rnd() < 0.5 ? '#d8c28a' : '#f6ead0'; g.beginPath(); g.arc(x, y, 1 + rnd() * 2, 0, 6.28); g.fill(); }
    // chemins
    const n = L().nodes;
    const strokeEdges = (w, col) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; for (const [a, b] of L().edges) { g.beginPath(); g.moveTo(n[a].x, n[a].y); g.lineTo(n[b].x, n[b].y); g.stroke(); } };
    strokeEdges(38, '#c9ad78'); strokeEdges(32, '#e6d3a2');
    g.fillStyle = '#c9ad78'; g.beginPath(); g.arc(L().plaza.x, L().plaza.y, 74, 0, 6.28); g.fill();
    g.fillStyle = '#ece0c0'; g.beginPath(); g.arc(L().plaza.x, L().plaza.y, 70, 0, 6.28); g.fill();
    g.strokeStyle = 'rgba(180,150,100,.4)'; g.lineWidth = 1; for (let r = 20; r < 70; r += 16) { g.beginPath(); g.arc(L().plaza.x, L().plaza.y, r, 0, 6.28); g.stroke(); }
    // pavés
    for (let i = 0; i < 260; i++) { const e = L().edges[Math.floor(rnd() * L().edges.length)]; const k = rnd(); const x = n[e[0]].x + (n[e[1]].x - n[e[0]].x) * k + (rnd() - 0.5) * 22, y = n[e[0]].y + (n[e[1]].y - n[e[0]].y) * k + (rnd() - 0.5) * 22; g.fillStyle = 'rgba(190,160,110,.35)'; g.beginPath(); g.ellipse(x, y, 3, 2, 0, 0, 6.28); g.fill(); }
    // ponton
    g.fillStyle = '#7a5434'; g.fillRect(676, 830, 48, 150); g.fillRect(640, 950, 170, 30);
    g.fillStyle = '#a77a4c'; for (let y = 832; y < 978; y += 9) g.fillRect(678, y, 44, 7); for (let x = 642; x < 808; x += 9) g.fillRect(x, 952, 7, 26);
    g.fillStyle = '#5a3b22'; for (const [px, py] of [[674, 870], [722, 870], [674, 930], [722, 930], [640, 978], [806, 978]]) { g.beginPath(); g.arc(px, py, 4, 0, 6.28); g.fill(); }
    if (G.Game.bLevel('port') >= 2) { g.fillStyle = '#7a5434'; g.fillRect(540, 900, 110, 22); g.fillStyle = '#a77a4c'; for (let x = 542; x < 648; x += 9) g.fillRect(x, 902, 7, 18); }
    // arbres (anneau côtier, hors bâtiments et chemins)
    treesList = [];
    for (let i = 0; i < 400 && treesList.length < 70; i++) {
      const x = 80 + rnd() * (W - 160), y = 120 + rnd() * (H - 200); const nr = normR(x, y);
      if (nr > 0.9 || nr < 0.55) continue;
      const p = { x, y };
      if (inAnyBuilding(p, 40) || pathDist(p) < 34) continue;
      if (L().barSeats.some(q => Math.hypot(q.x - x, q.y - y) < 60) || L().zooSpots.some(q => Math.hypot(q.x - x, q.y - y) < 40)) continue;
      if (treesList.some(q => Math.hypot(q.x - x, q.y - y) < 28)) continue;
      treesList.push({ x, y, kind: nr > 0.82 ? 'palm' : (rnd() < 0.5 ? 'tree' : 'bush'), s: 0.9 + rnd() * 0.5 });
    }
    treesList.sort((a, b) => a.y - b.y);
    for (const tr of treesList) { if (tr.kind === 'bush') A.bush(g, tr.x, tr.y, tr.s, '#5a9e45', rnd() < 0.3 ? '#e6533c' : null); }
    bgDirty = false;
  }

  /* ---------- Bâtiments ---------- */
  function label(text, x, y) {
    if (!G.state.settings.names) return;
    c.font = '600 12px system-ui, sans-serif'; const w = c.measureText(text).width + 14;
    c.fillStyle = 'rgba(255,255,255,.88)'; A.rr(c, x - w / 2, y - 10, w, 19, 9); c.fill();
    c.fillStyle = '#3a3226'; c.textAlign = 'center'; c.fillText(text, x, y + 4); c.textAlign = 'left';
  }
  function drawMuseum(b) {
    const lv = G.Game.bLevel('museum'); const x = b.x, y = b.y;
    if (lv >= 3) { c.fillStyle = '#5fa89a'; c.beginPath(); c.arc(x, y - 146, 46, Math.PI, 0); c.fill(); c.strokeStyle = '#3f7f72'; c.lineWidth = 1.5; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(x + i * 13, y - 146); c.quadraticCurveTo(x + i * 6, y - 182, x, y - 192); c.stroke(); } c.fillStyle = '#e8d9a8'; c.fillRect(x - 6, y - 204, 12, 14); A.circ(c, x, y - 208, 5, '#d9b34a'); }
    if (lv >= 2) for (const s of [-1, 1]) { const wx = x + s * 128; c.fillStyle = '#e7dcc4'; c.fillRect(wx - 34, y - 78, 68, 66); c.fillStyle = '#b5533c'; A.poly(c, [wx - 40, y - 78, wx, y - 98, wx + 40, y - 78], '#c26a4e'); c.fillStyle = '#7fb0d8'; for (const k of [-16, 4]) { A.rr(c, wx + k, y - 62, 12, 22, 5); c.fill(); } }
    c.fillStyle = '#d8cfbd'; c.fillRect(x - 104, y - 16, 208, 16); c.fillStyle = '#e6dfcf'; c.fillRect(x - 94, y - 24, 188, 9);
    c.fillStyle = '#f2ead8'; c.fillRect(x - 88, y - 102, 176, 80);
    c.fillStyle = '#5a3f2e'; c.beginPath(); c.moveTo(x - 14, y - 24); c.lineTo(x - 14, y - 52); c.arc(x, y - 52, 14, Math.PI, 0); c.lineTo(x + 14, y - 24); c.fill();
    c.fillStyle = 'rgba(255,220,140,.25)'; c.fillRect(x - 10, y - 50, 20, 26);
    for (let i = 0; i < 6; i++) { if (i === 2 || i === 3) continue; const cx = x - 78 + i * 31.2; c.fillStyle = '#fffaf0'; c.fillRect(cx - 6, y - 102, 12, 78); c.fillStyle = 'rgba(0,0,0,.08)'; c.fillRect(cx + 2, y - 102, 4, 78); c.fillStyle = '#e9dfc8'; c.fillRect(cx - 8, y - 104, 16, 5); c.fillRect(cx - 8, y - 28, 16, 5); }
    if (lv >= 2) for (const bx of [x - 47, x + 47]) { c.fillStyle = '#b5433c'; c.fillRect(bx - 5, y - 96, 10, 34); A.poly(c, [bx - 5, y - 62, bx, y - 56, bx + 5, y - 62], '#b5433c'); A.circ(c, bx, y - 82, 2.5, '#f2cf62'); }
    c.fillStyle = '#e9dfc8'; c.fillRect(x - 98, y - 118, 196, 16);
    c.fillStyle = '#8a6a48'; c.font = 'bold 11px Georgia, serif'; c.textAlign = 'center'; c.fillText('M U S É E', x, y - 106); c.textAlign = 'left';
    A.poly(c, [x - 104, y - 118, x, y - 156, x + 104, y - 118], '#efe5cf');
    A.poly(c, [x - 86, y - 121, x, y - 150, x + 86, y - 121], '#e2d6ba');
    c.strokeStyle = '#b5533c'; c.lineWidth = 4; c.beginPath(); c.moveTo(x - 106, y - 117); c.lineTo(x, y - 157); c.lineTo(x + 106, y - 117); c.stroke();
    A.circ(c, x, y - 134, 7, '#d9b34a');
    label(G.D.buildings.museum.name, x, y - (lv >= 3 ? 222 : 172));
  }
  function drawOffice(b) {
    const lv = G.Game.bLevel('office'); const x = b.x, y = b.y; const fl = lv; const hgt = 50 + fl * 22;
    c.fillStyle = '#c97a5a'; c.fillRect(x - 60, y - hgt, 120, hgt);
    c.strokeStyle = 'rgba(120,60,40,.25)'; c.lineWidth = 1; for (let yy = y - hgt + 6; yy < y; yy += 7) { c.beginPath(); c.moveTo(x - 60, yy); c.lineTo(x + 60, yy); c.stroke(); }
    c.fillStyle = '#e8dcc4'; c.fillRect(x - 64, y - 6, 128, 6);
    for (let f = 0; f < fl; f++) for (const wx of [-40, 22]) { c.fillStyle = '#fff3d0'; c.fillRect(x + wx, y - 40 - f * 22, 18, 14); c.fillStyle = '#6a8fb8'; c.fillRect(x + wx + 2, y - 38 - f * 22, 14, 10); }
    c.fillStyle = '#5a3f2e'; A.rr(c, x - 11, y - 34, 22, 34, 4); c.fill(); A.circ(c, x + 6, y - 16, 1.5, '#e8c14a');
    A.poly(c, [x - 70, y - hgt, x - 50, y - hgt - 26, x + 50, y - hgt - 26, x + 70, y - hgt], '#4f6d8f');
    A.circ(c, x, y - hgt - 6, 11, '#f6f0e0'); c.strokeStyle = '#333'; c.lineWidth = 1.3; const now = new Date(); const ha = (now.getHours() % 12 + now.getMinutes() / 60) / 12 * 6.28 - 1.57, ma = now.getMinutes() / 60 * 6.28 - 1.57;
    c.beginPath(); c.moveTo(x, y - hgt - 6); c.lineTo(x + Math.cos(ha) * 6, y - hgt - 6 + Math.sin(ha) * 6); c.moveTo(x, y - hgt - 6); c.lineTo(x + Math.cos(ma) * 8.5, y - hgt - 6 + Math.sin(ma) * 8.5); c.stroke();
    c.strokeStyle = '#555'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 40, y - hgt - 26); c.lineTo(x + 40, y - hgt - 62); c.stroke();
    c.fillStyle = '#e04b3a'; c.beginPath(); c.moveTo(x + 41, y - hgt - 61); for (let i = 0; i <= 10; i++) c.lineTo(x + 41 + i * 2.4, y - hgt - 61 + Math.sin(t * 4 + i * 0.6) * 1.6); for (let i = 10; i >= 0; i--) c.lineTo(x + 41 + i * 2.4, y - hgt - 49 + Math.sin(t * 4 + i * 0.6) * 1.6); c.fill();
    if (lv >= 3) { c.fillStyle = '#f2ead8'; for (const px of [-52, -30, 30, 52]) c.fillRect(x + px - 3, y - 40, 6, 40); }
    label(G.D.buildings.office.name, x, y - hgt - 76);
  }
  function drawAquarium(b) {
    const lv = G.Game.bLevel('aquarium'); const x = b.x, y = b.y;
    if (lv >= 3) { domeShape(x + 92, y - 40, 34, 1); }
    if (lv >= 2) { c.fillStyle = '#d7e8ef'; c.fillRect(x - 128, y - 70, 40, 70); A.poly(c, [x - 132, y - 70, x - 108, y - 92, x - 84, y - 70], '#3f8fc4'); A.circ(c, x - 108, y - 50, 8, '#7fc6e8'); }
    c.fillStyle = '#e8f1f5'; c.fillRect(x - 92, y - 58, 184, 58); c.fillStyle = '#3f8fc4'; c.fillRect(x - 92, y - 18, 184, 7);
    c.fillStyle = '#ffffff'; for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(x - 84 + i * 21, y - 58, 10.5, Math.PI, 0); c.fill(); }
    domeShape(x, y - 58, 72, 0);
    c.fillStyle = '#2f5f80'; A.rr(c, x - 13, y - 40, 26, 40, 12); c.fill(); c.fillStyle = 'rgba(160,220,255,.35)'; A.rr(c, x - 9, y - 36, 18, 34, 9); c.fill();
    c.fillStyle = '#fff'; c.font = 'bold 10px system-ui'; c.textAlign = 'center'; c.fillText('AQUARIUM', x - 54, y - 26); c.textAlign = 'left';
    label(G.D.buildings.aquarium.name, x, y - 146);
  }
  function domeShape(x, y, r, idx) {
    const gr = c.createLinearGradient(0, y - r, 0, y); gr.addColorStop(0, '#7fd0ef'); gr.addColorStop(1, '#2b7fb5');
    c.save(); c.beginPath(); c.arc(x, y, r, Math.PI, 0); c.closePath(); c.fillStyle = gr; c.fill(); c.clip();
    if (idx === 0) {
      const fish = G.Sys.Aquarium.placed().slice(0, 8);
      const rect = { x0: x - r + 6, y0: y - r + 8, x1: x + r - 6, y1: y - 6 };
      tank.update(frameDt, fish, rect, 1.1); tank.draw(c, fish, rect, 1.1);
      c.fillStyle = '#d8c48a'; c.beginPath(); c.ellipse(x, y, r, 10, 0, Math.PI, 0); c.fill();
      for (let i = -3; i <= 3; i++) { c.strokeStyle = '#3f9a5a'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + i * 15, y); c.quadraticCurveTo(x + i * 15 + Math.sin(t * 2 + i) * 4, y - 12, x + i * 15, y - 22 - Math.abs(i) * 2); c.stroke(); }
    }
    c.restore();
    c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, r, Math.PI, 0); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 1.2; for (let i = 1; i < 4; i++) { c.beginPath(); c.ellipse(x, y, r * i / 4, r, 0, Math.PI, 0); c.stroke(); }
    c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 4; c.beginPath(); c.arc(x, y, r - 10, Math.PI * 1.15, Math.PI * 1.4); c.stroke();
  }
  function drawBar(b) {
    const lv = G.Game.bLevel('bar'); const x = b.x, y = b.y;
    if (lv >= 3) { c.fillStyle = '#b77b4c'; c.fillRect(x - 60, y - 130, 120, 46); A.poly(c, [x - 68, y - 130, x, y - 160, x + 68, y - 130], '#8a4f32'); c.fillStyle = '#ffe7a0'; c.fillRect(x - 40, y - 118, 18, 16); c.fillRect(x + 22, y - 118, 18, 16); }
    c.fillStyle = '#c98d5a'; c.fillRect(x - 76, y - 84, 152, 84);
    c.strokeStyle = 'rgba(110,60,30,.35)'; c.lineWidth = 1; for (let yy = y - 80; yy < y; yy += 8) { c.beginPath(); c.moveTo(x - 76, yy); c.lineTo(x + 76, yy); c.stroke(); }
    A.poly(c, [x - 86, y - 84, x, y - 118, x + 86, y - 84], '#9b5a37');
    c.fillStyle = '#ffe7a0'; c.fillRect(x - 60, y - 60, 36, 26); c.fillRect(x + 24, y - 60, 36, 26); c.fillStyle = '#c98d5a'; c.fillRect(x - 43, y - 60, 2, 26); c.fillRect(x + 41, y - 60, 2, 26);
    c.fillStyle = '#5a3f2e'; c.fillRect(x - 14, y - 46, 28, 46);
    for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#fff6ea' : '#e04b3a'; c.fillRect(x - 80 + i * 20, y - 82, 20, 14); c.beginPath(); c.arc(x - 70 + i * 20, y - 68, 10, 0, Math.PI); c.fill(); }
    c.fillStyle = '#6b4226'; A.rr(c, x - 34, y - 112, 68, 20, 4); c.fill(); c.fillStyle = '#ffe7a0'; c.font = 'bold 13px Georgia, serif'; c.textAlign = 'center'; c.fillText('CAFÉ', x, y - 97); c.textAlign = 'left';
    if (lv >= 2) { for (let i = 0; i < 9; i++) { const lx = x - 80 + i * 20; const ly = y - 88 + Math.sin(i * 1.3) * 2; A.circ(c, lx, ly, 2.4, ['#ffd65a', '#ff8a5a', '#8ad0ff'][i % 3]); } A.flowers(c, x - 92, y - 2, 0.7); A.flowers(c, x + 92, y - 2, 0.7); }
    label(G.D.buildings.bar.name, x, y - (lv >= 3 ? 174 : 132));
  }
  function drawTable(i) {
    const s = L().barSeats[i]; const tx = s.x + 14, ty = s.y - 4;
    A.shadow(c, tx, ty + 2, 13, 4); c.fillStyle = '#7a5434'; c.fillRect(tx - 1.5, ty - 14, 3, 14); A.ell(c, tx, ty - 14, 11, 4.5, '#f2e6cc');
    c.strokeStyle = '#7a5434'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(tx, ty - 14); c.lineTo(tx, ty - 40); c.stroke();
    const col = ['#e04b3a', '#2a9d8f', '#e9c46a', '#3d7dd8'][i % 4];
    for (let k = 0; k < 6; k++) { c.fillStyle = k % 2 ? '#fff' : col; c.beginPath(); c.moveTo(tx, ty - 46); c.lineTo(tx - 20 + k * 6.6, ty - 34); c.lineTo(tx - 13.4 + k * 6.6, ty - 34); c.fill(); }
    // chaise
    c.fillStyle = '#9a6b3e'; c.fillRect(s.x - 5, s.y - 8, 10, 3); c.fillRect(s.x - 5, s.y - 18, 2, 12);
  }
  function drawZoo(b) {
    const P = b.pen; const habs = G.Sys.Zoo.habitats(); const n = habs.length; const w = (P.x1 - P.x0) / n;
    // sol
    habs.forEach((h, i) => {
      const r = { x0: P.x0 + i * w, y0: P.y0, x1: P.x0 + (i + 1) * w, y1: P.y1 };
      c.fillStyle = G.D.biomes[h.biome].ground; c.fillRect(r.x0, r.y0, w, P.y1 - P.y0);
      c.fillStyle = 'rgba(0,0,0,.05)'; for (let k = 0; k < 12; k++) A.ell(c, r.x0 + ((k * 37) % w), r.y0 + ((k * 53) % (P.y1 - P.y0)), 6, 2, 'rgba(0,0,0,.06)');
      if (h.eau > 0) { A.ell(c, r.x1 - 30, r.y0 + 40, 12 + h.eau * 5, 7 + h.eau * 2.5, '#5bb6d6'); A.ell(c, r.x1 - 33, r.y0 + 38, 6 + h.eau * 2, 2.5, 'rgba(255,255,255,.4)'); }
      for (let k = 0; k < h.vegetation; k++) { const fx = r.x0 + 16 + ((k * 61) % (w - 40)), fy = r.y0 + 24 + ((k * 29) % 40); h.biome === 'jungle' ? A.fern(c, fx, fy, 0.9, G.D.biomes[h.biome].deco, t) : A.bush(c, fx, fy, 0.8, G.D.biomes[h.biome].deco); }
      if (h.abris > 0) { const hx = r.x0 + w / 2 + 10, hy = r.y0 + 48; c.fillStyle = '#8a6a48'; c.fillRect(hx - 14, hy - 16, 28, 16); A.poly(c, [hx - 19, hy - 16, hx, hy - 30 - h.abris * 2, hx + 19, hy - 16], '#c9a86a'); c.fillStyle = '#3a2a1a'; c.fillRect(hx - 5, hy - 10, 10, 10); }
      if (h.enrichissement > 0) { A.rock(c, r.x0 + w - 24, r.y1 - 26, 0.8); if (h.enrichissement > 1) { c.strokeStyle = '#8a5a35'; c.lineWidth = 5; c.beginPath(); c.moveTo(r.x0 + 40, r.y1 - 40); c.lineTo(r.x0 + 70, r.y1 - 46); c.stroke(); } if (h.enrichissement > 2) A.circ(c, r.x0 + w / 2 - 20, r.y1 - 20, 5, '#e04b3a'); }
      const animals = G.Sys.Zoo.inHabitat(i);
      pen[i] = pen[i] || new G.Life.Pen();
      const rr = { x0: r.x0 + 4, y0: r.y0 + 30, x1: r.x1 - 4, y1: r.y1 - 6 };
      pen[i].update(frameDt, animals, rr, h.food, 1);
      pen[i].draw(c, animals, rr, h.food, 1);
      if (i > 0) { c.strokeStyle = '#8a6a48'; c.lineWidth = 3; c.beginPath(); c.moveTo(r.x0, P.y0); c.lineTo(r.x0, P.y1); c.stroke(); }
    });
    // clôture
    c.strokeStyle = '#8a6a48'; c.lineWidth = 2.5;
    const rails = (x0, y0, x1, y1) => { for (const o of [6, 13]) { c.beginPath(); c.moveTo(x0, y0 - o); c.lineTo(x1, y1 - o); c.stroke(); } };
    rails(P.x0, P.y0, P.x1, P.y0); rails(P.x0, P.y1, b.x - 70, P.y1); rails(b.x - 36, P.y1, P.x1, P.y1);
    c.beginPath(); c.moveTo(P.x0, P.y0 - 10); c.lineTo(P.x0, P.y1 - 10); c.moveTo(P.x1, P.y0 - 10); c.lineTo(P.x1, P.y1 - 10); c.stroke();
    c.fillStyle = '#6e5236'; for (let x = P.x0; x <= P.x1; x += 18) { c.fillRect(x - 1.5, P.y0 - 16, 3, 16); if (x < b.x - 70 || x > b.x - 36) c.fillRect(x - 1.5, P.y1 - 16, 3, 16); }
    // arche d'entrée
    const gx = b.x - 53; c.fillStyle = '#7a5434'; c.fillRect(gx - 22, P.y1 - 46, 6, 46); c.fillRect(gx + 16, P.y1 - 46, 6, 46);
    c.fillStyle = '#5f9e45'; A.rr(c, gx - 30, P.y1 - 62, 60, 18, 6); c.fill(); c.fillStyle = '#fff'; c.font = 'bold 12px Georgia, serif'; c.textAlign = 'center'; c.fillText('ZOO', gx, P.y1 - 49); c.textAlign = 'left';
    label(G.D.buildings.zoo.name + (n > 1 ? ' · ' + n + ' habitats' : ''), (P.x0 + P.x1) / 2, P.y0 - 28);
  }
  function drawPort(b) {
    const x = 610, y = 905; const lv = G.Game.bLevel('port');
    A.shadow(c, x, y, 18, 6);
    for (let i = 0; i < 5; i++) { c.fillStyle = i % 2 ? '#fff' : '#d9473a'; c.beginPath(); c.moveTo(x - 13 + i * 1.2, y - i * 14); c.lineTo(x + 13 - i * 1.2, y - i * 14); c.lineTo(x + 12 - (i + 1) * 1.2, y - (i + 1) * 14); c.lineTo(x - 12 + (i + 1) * 1.2, y - (i + 1) * 14); c.fill(); }
    c.fillStyle = '#333'; c.fillRect(x - 9, y - 84, 18, 14); c.fillStyle = night > 0.2 ? '#ffe680' : '#cfe8f0'; c.fillRect(x - 6, y - 82, 12, 10);
    A.poly(c, [x - 12, y - 84, x, y - 96, x + 12, y - 84], '#d9473a');
    if (night > 0.2) { c.save(); c.globalCompositeOperation = 'lighter'; const a = t * 0.8; const gr = c.createRadialGradient(x, y - 77, 2, x, y - 77, 160); gr.addColorStop(0, 'rgba(255,230,140,.45)'); gr.addColorStop(1, 'rgba(255,230,140,0)'); c.fillStyle = gr; c.beginPath(); c.moveTo(x, y - 77); c.arc(x, y - 77, 160, a, a + 0.35); c.fill(); c.restore(); }
    for (const [cx, cy] of [[752, 860], [766, 872], [742, 878]]) { c.fillStyle = '#b07c48'; c.fillRect(cx - 8, cy - 14, 16, 14); c.strokeStyle = '#7a5434'; c.lineWidth = 1; c.strokeRect(cx - 8, cy - 14, 16, 14); c.beginPath(); c.moveTo(cx - 8, cy - 14); c.lineTo(cx + 8, cy); c.stroke(); }
    if (lv >= 3) { A.ell(c, 650, 868, 8, 4, '#5a3b22'); c.fillStyle = '#8a5a35'; c.fillRect(642, 850, 16, 18); }
    label(G.D.buildings.port.name, 700, 822);
  }
  function drawBoat() {
    const bt = G.Sys.Sim.boat; if (!bt.vis) return;
    const x = bt.x, y = bt.y + Math.sin(t * 2) * 1.5;
    c.save(); c.translate(x, y); c.rotate(Math.sin(t * 1.6) * 0.03);
    A.ell(c, 0, 4, 48, 8, 'rgba(255,255,255,.35)');
    A.poly(c, [-46, -10, 46, -10, 34, 8, -38, 8], '#8a4f2e'); c.fillStyle = '#fff'; c.fillRect(-42, -8, 84, 4); c.fillStyle = '#3d7dd8'; c.fillRect(-40, -3, 78, 2);
    c.fillStyle = '#efe4c8'; c.fillRect(-26, -22, 30, 12); c.fillStyle = '#7fb0d8'; c.fillRect(-22, -19, 6, 5); c.fillRect(-12, -19, 6, 5);
    c.strokeStyle = '#5a3b20'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(12, -10); c.lineTo(12, -70); c.stroke();
    A.poly(c, [14, -66, 44, -18, 14, -18], '#fbf6e9', '#d8ccb0', 1); A.poly(c, [10, -62, -14, -24, 10, -24], '#f0e4c8');
    c.fillStyle = '#e04b3a'; c.beginPath(); c.moveTo(12, -70); for (let i = 0; i <= 6; i++) c.lineTo(12 + i * 2.6, -70 + Math.sin(t * 5 + i) * 1.2); c.lineTo(12 + 15.6, -64); c.lineTo(12, -64); c.fill();
    c.fillStyle = '#2f4f7a'; c.font = 'bold 8px system-ui'; c.fillText('BIGORNEAU', -36, 4);
    c.restore();
  }
  function drawDecor(d) {
    switch (d.type) {
      case 'arbre': A.fruitTree(c, d.x, d.y, 1, t); break;
      case 'fleurs': A.flowers(c, d.x, d.y, 1); break;
      case 'banc': A.shadow(c, d.x, d.y, 18, 4); c.fillStyle = '#6e4a2a'; c.fillRect(d.x - 16, d.y - 8, 3, 8); c.fillRect(d.x + 13, d.y - 8, 3, 8); c.fillStyle = '#b07c48'; c.fillRect(d.x - 18, d.y - 11, 36, 4); c.fillRect(d.x - 18, d.y - 20, 36, 4); c.fillRect(d.x - 18, d.y - 15, 36, 2); break;
      case 'lampadaire': A.shadow(c, d.x, d.y, 6, 2.5); c.fillStyle = '#3c4a5a'; c.fillRect(d.x - 2, d.y - 44, 4, 44); A.rr(c, d.x - 6, d.y - 54, 12, 12, 3); c.fill(); A.circ(c, d.x, d.y - 48, 4, night > 0.2 ? '#ffe680' : '#e6eef2'); break;
      case 'fontaine': A.shadow(c, d.x, d.y, 34, 9); A.ell(c, d.x, d.y - 6, 32, 12, '#b9b2a4'); A.ell(c, d.x, d.y - 9, 27, 9, '#5fb6d6'); c.fillStyle = '#cfc8b8'; c.fillRect(d.x - 4, d.y - 32, 8, 24); A.ell(c, d.x, d.y - 32, 12, 4, '#b9b2a4');
        c.strokeStyle = 'rgba(200,240,255,.9)'; c.lineWidth = 1.6; for (let i = -1; i <= 1; i += 2) { c.beginPath(); c.moveTo(d.x, d.y - 36); c.quadraticCurveTo(d.x + i * 14, d.y - 50 - Math.sin(t * 6) * 2, d.x + i * 20, d.y - 12); c.stroke(); } break;
      case 'statue_dino': A.shadow(c, d.x, d.y, 26, 6); c.fillStyle = '#b9b2a4'; c.fillRect(d.x - 22, d.y - 16, 44, 16); c.fillStyle = '#cfc8b8'; c.fillRect(d.x - 24, d.y - 19, 48, 5); c.save(); c.globalAlpha = 0.95; if ('filter' in c) c.filter = 'grayscale(1) brightness(1.15)'; A.drawAnimal(c, 'triceratops', d.x - 2, d.y - 18, 1.1, 0, 1, 'idle'); c.restore(); break;
    }
  }
  function drawAgent(a) {
    const sit = (a.state === 'wait' || (a.state === 'act' && a.act === 'drink'));
    A.drawChar(c, a.look, a.x, a.y + (sit ? 2 : 0), 1, a.t, a.moving, a.facing);
    if (a.state === 'act' && a.act === 'drink') { c.fillStyle = '#fff'; c.fillRect(a.x + 7, a.y - 16, 5, 6); c.fillStyle = '#8a5532'; c.fillRect(a.x + 8, a.y - 15, 3, 2); }
    if (a.charId && G.state.settings.names) { c.font = '600 9px system-ui'; c.textAlign = 'center'; c.fillStyle = 'rgba(255,255,255,.85)'; const w = c.measureText(a.name).width + 8; A.rr(c, a.x - w / 2, a.y + 3, w, 12, 5); c.fill(); c.fillStyle = a.staff ? '#2a6b3a' : '#4a3b6a'; c.fillText(a.name, a.x, a.y + 12); c.textAlign = 'left'; }
  }
  function drawBubble(a) {
    if (!a.bubble || a.hidden) return;
    c.font = '11px system-ui, sans-serif'; const text = a.bubble.text.length > 34 ? a.bubble.text.slice(0, 32) + '…' : a.bubble.text;
    const w = c.measureText(text).width + 12; const bx = a.x - w / 2, by = a.y - 56;
    c.fillStyle = 'rgba(255,255,255,.95)'; A.rr(c, bx, by, w, 18, 8); c.fill(); A.poly(c, [a.x - 4, by + 17, a.x + 4, by + 17, a.x, by + 23], 'rgba(255,255,255,.95)');
    c.fillStyle = '#333'; c.fillText(text, bx + 6, by + 13);
  }

  /* ---------- Rendu ---------- */
  let frameDt = 0.016, night = 0;
  function nightLevel() { const d = new Date(); const h = d.getHours() + d.getMinutes() / 60; if (h >= 21 || h < 6) return 1; if (h >= 19) return (h - 19) / 2; if (h < 7.5) return 1 - (h - 6) / 1.5; return 0; }
  function render() {
    if (bgDirty || !bg) buildStatic();
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = '#3f9fd0'; c.fillRect(0, 0, vw, vh);
    c.save(); c.translate(vw / 2, vh / 2); c.scale(cam.z, cam.z); c.translate(-cam.x, -cam.y);
    // vagues
    const x0 = cam.x - vw / 2 / cam.z, y0 = cam.y - vh / 2 / cam.z, x1 = cam.x + vw / 2 / cam.z, y1 = cam.y + vh / 2 / cam.z;
    c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 2;
    for (let y = Math.floor(y0 / 46) * 46; y < y1; y += 46) for (let x = Math.floor(x0 / 90) * 90; x < x1; x += 90) { const ox = ((y / 46) % 2) * 45 + Math.sin(t * 0.8 + y * 0.05) * 10; c.beginPath(); c.arc(x + ox, y, 12, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); }
    c.drawImage(bg, 0, 0, L().W, L().H);
    // écume animée
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 3; c.setLineDash([14, 10]); c.lineDashOffset = -t * 8;
    c.beginPath(); islandPts(1.012 + Math.sin(t * 1.2) * 0.006).forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.stroke(); c.setLineDash([]);
    // éléments triés
    const items = [];
    for (const tr of treesList) if (tr.kind !== 'bush') items.push({ y: tr.y, f: () => tr.kind === 'palm' ? A.palm(c, tr.x, tr.y, tr.s, t) : A.tree(c, tr.x, tr.y, tr.s, '#4f9a46', t) });
    const B = L().buildings;
    items.push({ y: B.museum.y, f: () => drawMuseum(B.museum) }, { y: B.office.y, f: () => drawOffice(B.office) }, { y: B.aquarium.y, f: () => drawAquarium(B.aquarium) },
      { y: B.bar.y, f: () => drawBar(B.bar) }, { y: B.zoo.pen.y1, f: () => drawZoo(B.zoo) }, { y: 900, f: () => drawPort(B.port) }, { y: 960, f: drawBoat });
    for (let i = 0; i < G.Sys.Bar.tables(); i++) items.push({ y: L().barSeats[i].y - 3, f: () => drawTable(i) });
    for (const d of G.state.decor) items.push({ y: d.y, f: () => drawDecor(d) });
    for (const a of G.Sys.Sim.agents) if (!a.hidden) items.push({ y: a.y, f: () => drawAgent(a) });
    items.sort((p, q) => p.y - q.y); for (const it of items) it.f();
    for (const a of G.Sys.Sim.agents) drawBubble(a);
    // fantôme de placement
    if (placing && ghost) { c.globalAlpha = 0.6; drawDecor({ type: placing, x: ghost.x, y: ghost.y }); c.globalAlpha = 1; const bad = validDecorSpot(ghost); A.ell(c, ghost.x, ghost.y, 22, 8, bad ? 'rgba(220,60,60,.35)' : 'rgba(60,200,90,.35)'); }
    c.restore();
    // nuit
    if (night > 0) {
      c.fillStyle = 'rgba(18,24,70,' + (0.32 * night) + ')'; c.fillRect(0, 0, vw, vh);
      c.save(); c.globalCompositeOperation = 'lighter'; c.translate(vw / 2, vh / 2); c.scale(cam.z, cam.z); c.translate(-cam.x, -cam.y);
      const glow = (x, y, r, a) => { const gr = c.createRadialGradient(x, y, 1, x, y, r); gr.addColorStop(0, 'rgba(255,210,120,' + a + ')'); gr.addColorStop(1, 'rgba(255,210,120,0)'); c.fillStyle = gr; c.fillRect(x - r, y - r, r * 2, r * 2); };
      for (const d of G.state.decor) if (d.type === 'lampadaire') glow(d.x, d.y - 48, 70, 0.35 * night);
      glow(B.bar.x, B.bar.y - 50, 110, 0.25 * night); glow(B.office.x, B.office.y - 40, 70, 0.2 * night); glow(B.museum.x, B.museum.y - 40, 80, 0.15 * night);
      c.restore();
    }
  }
  function loop(ts) {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    const lp = G.state.settings.lowPower;
    if (lp) { frameSkip = !frameSkip; if (frameSkip) return; }
    const dt = Math.min(0.1, (ts - (lastT || ts)) / 1000); lastT = ts; t += dt; frameDt = dt;
    if (Math.floor(t) !== Math.floor(t - dt)) night = nightLevel();
    keyPan(dt);
    G.Sys.Sim.update(dt);
    render();
  }

  /* ---------- Caméra & entrées ---------- */
  function clampCam() {
    const minZ = Math.max(vw / L().W, vh / L().H) * 0.9; cam.z = U.clamp(cam.z, Math.min(0.45, minZ), 2.2);
    const hw = vw / 2 / cam.z, hh = vh / 2 / cam.z;
    cam.x = U.clamp(cam.x, Math.min(hw, L().W / 2), Math.max(L().W - hw, L().W / 2));
    cam.y = U.clamp(cam.y, Math.min(hh, L().H / 2), Math.max(L().H - hh, L().H / 2));
  }
  function toWorld(sx, sy) { return { x: (sx - vw / 2) / cam.z + cam.x, y: (sy - vh / 2) / cam.z + cam.y }; }
  function resize() {
    const r = cv.getBoundingClientRect(); dpr = Math.min(window.devicePixelRatio || 1, G.state && G.state.settings.lowPower ? 1 : 2);
    vw = r.width; vh = r.height; cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr); clampCam();
  }
  const keys = {};
  function keyPan(dt) {
    let dx = 0, dy = 0; if (keys.ArrowLeft || keys.q || keys.a) dx--; if (keys.ArrowRight || keys.d) dx++; if (keys.ArrowUp || keys.z || keys.w) dy--; if (keys.ArrowDown || keys.s) dy++;
    if (dx || dy) { cam.x += dx * 420 * dt / cam.z; cam.y += dy * 420 * dt / cam.z; clampCam(); }
  }
  const ptrs = new Map(); let downInfo = null, pinch0 = null;
  function onDown(e) {
    cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 1) downInfo = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y, t: Date.now(), moved: false };
    if (ptrs.size === 2) { const [p, q] = [...ptrs.values()]; pinch0 = { d: Math.hypot(p.x - q.x, p.y - q.y), z: cam.z }; downInfo && (downInfo.moved = true); }
  }
  function onMove(e) {
    const r = cv.getBoundingClientRect();
    if (placing) ghost = toWorld(e.clientX - r.left, e.clientY - r.top);
    if (!ptrs.has(e.pointerId)) return;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2 && pinch0) { const [p, q] = [...ptrs.values()]; cam.z = pinch0.z * Math.hypot(p.x - q.x, p.y - q.y) / pinch0.d; clampCam(); return; }
    if (downInfo) { const dx = e.clientX - downInfo.x, dy = e.clientY - downInfo.y; if (Math.hypot(dx, dy) > 7) downInfo.moved = true; if (downInfo.moved) { cam.x = downInfo.cx - dx / cam.z; cam.y = downInfo.cy - dy / cam.z; clampCam(); } }
  }
  function onUp(e) {
    ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch0 = null;
    if (downInfo && !downInfo.moved && ptrs.size === 0) { const r = cv.getBoundingClientRect(); tap(toWorld(e.clientX - r.left, e.clientY - r.top)); }
    if (ptrs.size === 0) downInfo = null;
  }
  function onWheel(e) { e.preventDefault(); const r = cv.getBoundingClientRect(); const before = toWorld(e.clientX - r.left, e.clientY - r.top); cam.z *= e.deltaY < 0 ? 1.1 : 0.9; clampCam(); const after = toWorld(e.clientX - r.left, e.clientY - r.top); cam.x += before.x - after.x; cam.y += before.y - after.y; clampCam(); }

  function tap(p) {
    if (placing) {
      const bad = validDecorSpot(p); if (bad) { G.UI.toast(bad, '🚫', 'bad'); return; }
      const type = placing; const d = G.D.decorations[type];
      if (!G.Game.spend(d.cost, 'office')) return;
      G.state.decor.push({ type, x: Math.round(p.x), y: Math.round(p.y) });
      G.Game.addRep(0.5); G.Game.log('Décoration installée : ' + d.name, '🌳'); G.UI.toast(d.name + ' installé(e) !', '🌳', 'good');
      G.State.save(true);
      if (!G.Game.hasRes || G.state.coins < d.cost) stopPlacing(); return;
    }
    // personnages
    let best = null, bd = 22;
    for (const a of G.Sys.Sim.agents) { if (a.hidden) continue; const d = Math.hypot(a.x - p.x, (a.y - 14) - p.y); if (d < bd) { bd = d; best = a; } }
    if (best) { if (best.charId) G.UI.openChar(best.charId); else G.UI.toast(best.name + ' · touriste de passage' + (best.act ? ' (' + ({ museum: 'va au musée', zoo: 'va au zoo', aquarium: 'va à l\'aquarium', bar: 'va au bar', rest: 'se promène', drink: 'boit un verre' }[best.act] || '') + ')' : ''), '🧳'); return; }
    // décorations
    for (const d of G.state.decor) if (Math.hypot(d.x - p.x, d.y - 8 - p.y) < 20) { G.UI.decorMenu(d); return; }
    // bâtiments
    const B = L().buildings;
    for (const k of ['zoo', 'museum', 'aquarium', 'bar', 'office']) { const r = bRect(k, 0); r.y0 -= k === 'museum' ? 60 : 30; if (inRect(p, r)) { G.UI.openBuilding(k); return; } }
    if ((p.y > 820 && Math.abs(p.x - 700) < 120) || (Math.abs(p.x - 610) < 25 && p.y > 800 && p.y < 910) || (Math.hypot(p.x - G.Sys.Sim.boat.x, p.y - G.Sys.Sim.boat.y) < 50)) { G.UI.openBuilding('port'); return; }
  }

  function startPlacing(type) { placing = type; ghost = { x: cam.x, y: cam.y }; G.UI.placingBanner(type); }
  function stopPlacing() { placing = null; ghost = null; G.UI.placingBanner(null); }

  function init(canvas) {
    cv = canvas; c = cv.getContext('2d');
    cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove); cv.addEventListener('pointerup', onUp); cv.addEventListener('pointercancel', onUp);
    cv.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', e => { if (!running || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return; keys[e.key.length === 1 ? e.key.toLowerCase() : e.key] = true; if (e.key === 'Escape' && placing) stopPlacing(); });
    window.addEventListener('keyup', e => { keys[e.key.length === 1 ? e.key.toLowerCase() : e.key] = false; });
    window.addEventListener('resize', () => running && resize());
    U.on('buildings', () => { bgDirty = true; });
    night = nightLevel();
  }
  function start() { if (running) return; running = true; cv.style.display = 'block'; resize(); if (!G.Home._centered) { cam.z = vw < 700 ? 0.62 : 0.8; G.Home._centered = true; clampCam(); } lastT = 0; raf = requestAnimationFrame(loop); }
  function stop() { running = false; cancelAnimationFrame(raf); cv.style.display = 'none'; G.Sys.Sim.reset(); }
  function focus(k) { const b = L().buildings[k]; if (b) { cam.x = b.x; cam.y = b.y - 60; clampCam(); } }

  return { init, start, stop, startPlacing, stopPlacing, focus, isRunning: () => running, cam, rebuild: () => { bgDirty = true; }, validDecorSpot };
})();
