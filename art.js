/* ARCHIPEL — graphismes originaux dessinés en Canvas 2D (aucune image externe)
   Personnages chibi, animaux, poissons, icônes d'objets et de ressources, végétation. */

G.Art = (() => {
  const TAU = Math.PI * 2;

  function hex2rgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function shade(h, f) { const [r, g, b] = hex2rgb(h); const t = f < 0 ? 0 : 255, p = Math.abs(f); return 'rgb(' + Math.round((t - r) * p + r) + ',' + Math.round((t - g) * p + g) + ',' + Math.round((t - b) * p + b) + ')'; }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function ell(c, x, y, rx, ry, fill, rot = 0) { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU); if (fill) { c.fillStyle = fill; c.fill(); } }
  function circ(c, x, y, r, fill) { c.beginPath(); c.arc(x, y, r, 0, TAU); if (fill) { c.fillStyle = fill; c.fill(); } }
  function poly(c, pts, fill, stroke, lw) { c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 1; c.stroke(); } }
  function shadow(c, x, y, rx, ry, a = 0.18) { ell(c, x, y, rx, ry, 'rgba(20,30,20,' + a + ')'); }

  /* ================= PERSONNAGES ================= */
  function drawChar(c, look, x, y, s = 1, t = 0, moving = false, facing = 1, opts = {}) {
    c.save(); c.translate(x, y); c.scale(s, s);
    if (!opts.noShadow) shadow(c, 0, 0, 9, 3.4);
    const bob = moving ? Math.sin(t * 13) : 0;
    const breathe = moving ? Math.abs(bob) * 1.2 : Math.sin(t * 2.2) * 0.4;
    const legC = shade(look.bottom, -0.15);
    // jambes
    c.fillStyle = legC;
    rr(c, -4.6, -10 - Math.max(0, bob) * 2.2, 3.6, 10, 1.5); c.fill();
    rr(c, 1, -10 - Math.max(0, -bob) * 2.2, 3.6, 10, 1.5); c.fill();
    c.fillStyle = '#3b2b22'; rr(c, -5, -2 - Math.max(0, bob) * 2.2, 4.4, 2.4, 1); c.fill(); rr(c, 0.6, -2 - Math.max(0, -bob) * 2.2, 4.4, 2.4, 1); c.fill();
    c.translate(0, -breathe);
    // bras
    c.fillStyle = shade(look.top, -0.12);
    c.save(); c.translate(-6.5, -18); c.rotate(bob * 0.5); rr(c, -1.8, 0, 3.4, 9, 1.6); c.fill(); circ(c, 0, 9, 1.9, look.skin); c.restore();
    c.save(); c.translate(6.5, -18); c.rotate(-bob * 0.5); c.fillStyle = shade(look.top, -0.12); rr(c, -1.6, 0, 3.4, 9, 1.6); c.fill(); circ(c, 0, 9, 1.9, look.skin); c.restore();
    // corps
    c.fillStyle = look.top; rr(c, -6.8, -21, 13.6, 13, 4.5); c.fill();
    c.fillStyle = shade(look.top, 0.18); rr(c, -5, -20, 4, 5, 2); c.fill();
    c.fillStyle = look.bottom; rr(c, -6.8, -10.5, 13.6, 3, 1.4); c.fill();
    // cou + tête
    const hy = -28.5;
    if (look.acc === 'scarf') { c.fillStyle = '#c94f4f'; rr(c, -6, -23, 12, 4, 2); c.fill(); }
    circ(c, 0, hy, 8, look.skin);
    // cheveux
    hair(c, look, hy, facing);
    // visage
    const ex = facing * 1.4;
    circ(c, -2.8 + ex, hy + 0.6, 1.15, '#2a2020'); circ(c, 2.8 + ex, hy + 0.6, 1.15, '#2a2020');
    c.fillStyle = 'rgba(255,255,255,.8)'; circ(c, -2.4 + ex, hy + 0.2, 0.4, '#fff'); circ(c, 3.2 + ex, hy + 0.2, 0.4, '#fff');
    ell(c, -4.6 + ex, hy + 3, 1.5, 0.9, 'rgba(232,110,110,.35)'); ell(c, 4.6 + ex, hy + 3, 1.5, 0.9, 'rgba(232,110,110,.35)');
    c.strokeStyle = '#6b3a2a'; c.lineWidth = 0.8; c.beginPath(); c.arc(ex, hy + 3, 1.6, 0.2, Math.PI - 0.2); c.stroke();
    acc(c, look, hy, ex);
    c.restore();
  }
  function hair(c, look, hy, facing) {
    const h = look.hair; c.fillStyle = h;
    switch (look.style) {
      case 'bald': ell(c, -7, hy - 1, 1.8, 3.5, h); ell(c, 7, hy - 1, 1.8, 3.5, h); break;
      case 'long': c.beginPath(); c.arc(0, hy - 0.5, 8.6, Math.PI, 0); c.fill(); rr(c, -8.6, hy - 1, 3.6, 13, 1.8); c.fill(); rr(c, 5, hy - 1, 3.6, 13, 1.8); c.fill(); fringe(c, hy, h); break;
      case 'bun': c.beginPath(); c.arc(0, hy - 0.5, 8.5, Math.PI, 0); c.fill(); circ(c, 0, hy - 9.5, 4, h); fringe(c, hy, h); break;
      case 'spiky': poly(c, [-8.5, hy, -7, hy - 9, -4, hy - 6, -2, hy - 11, 1, hy - 6.5, 4, hy - 10.5, 5.5, hy - 5.5, 8.5, hy - 7, 8.5, hy], h); break;
      case 'wild': for (const [dx, dy, r] of [[-6, -4, 4.4], [-2, -7.5, 4.6], [3, -7, 4.6], [6.5, -3.5, 4.2], [0, -5, 5]]) circ(c, dx, hy + dy, r, h); break;
      case 'cap': c.beginPath(); c.arc(0, hy - 0.5, 8.3, Math.PI, 0); c.fill();
        c.fillStyle = '#1f2f4a'; rr(c, -8.5, hy - 9.5, 17, 6.5, 3); c.fill(); rr(c, facing > 0 ? 2 : -12, hy - 4.5, 10, 2.2, 1); c.fill();
        c.fillStyle = '#e8c14a'; circ(c, 0, hy - 6.5, 1.4, '#e8c14a'); break;
      default: c.beginPath(); c.arc(0, hy - 0.5, 8.5, Math.PI, 0); c.fill(); fringe(c, hy, h);
    }
  }
  function fringe(c, hy, h) { poly(c, [-8.3, hy - 1, -5, hy - 4, -2, hy - 2.5, 1, hy - 4.5, 4.5, hy - 2.6, 8.3, hy - 1, 8, hy - 6, -8, hy - 6], h); }
  function acc(c, look, hy, ex) {
    switch (look.acc) {
      case 'glasses': c.strokeStyle = '#2b2b2b'; c.lineWidth = 0.9; c.beginPath(); c.arc(-2.8 + ex, hy + 0.6, 2.4, 0, TAU); c.moveTo(5.2 + ex, hy + 0.6); c.arc(2.8 + ex, hy + 0.6, 2.4, 0, TAU); c.moveTo(-0.4 + ex, hy + 0.4); c.lineTo(0.4 + ex, hy + 0.4); c.stroke(); break;
      case 'beard': ell(c, ex, hy + 5, 6, 4.2, look.hair); break;
      case 'beard_grey': ell(c, ex, hy + 5, 6.2, 4.5, '#8d8d8d'); break;
      case 'beard_white': ell(c, ex, hy + 5, 6.5, 4.6, '#f4f4f4'); break;
      case 'necklace': for (let i = -3; i <= 3; i++) circ(c, i * 1.7, -20 + Math.abs(i) * -0.3 + 1.5, 0.9, i % 2 ? '#f2e2b8' : '#e48b5e'); break;
      case 'flower': circ(c, 6.5, hy - 5, 2.4, '#f6a6c1'); circ(c, 6.5, hy - 5, 1, '#f7e06b'); break;
      case 'paint': circ(c, -5, -15, 1.4, '#c4462c'); circ(c, 3, -17, 1.1, '#e0a63a'); break;
      case 'headband': c.fillStyle = '#e04b3a'; rr(c, -8.4, hy - 4.6, 16.8, 2.4, 1); c.fill(); break;
    }
  }

  /* ================= ANIMAUX ================= */
  function drawAnimal(c, sp, x, y, s = 1, t = 0, facing = 1, state = 'idle') {
    const d = G.D.animals[sp]; if (!d) return; const a = d.art; s *= a.s || 1;
    c.save(); c.translate(x, y); c.scale(s * facing, s);
    const walk = state === 'walk' ? Math.sin(t * 9) : 0;
    if (a.shape === 'flyer' && state === 'walk') { flyer(c, a, t, true); c.restore(); return; }
    shadow(c, 0, 0, a.big ? 20 : 15, 4);
    if (a.shape === 'biped') biped(c, a, t, walk, state);
    else if (a.shape === 'flyer') flyer(c, a, t, false);
    else quad(c, a, t, walk, state);
    c.restore();
  }
  function legs(c, col, xs, top, len, walk, w = 4.2) {
    xs.forEach((lx, i) => { const off = (i % 2 ? 1 : -1) * walk * 1.8; c.fillStyle = col; rr(c, lx - w / 2 + off * 0.4, top, w, len - Math.max(0, off) * 0.6, 1.8); c.fill(); });
  }
  function quad(c, a, t, walk, state) {
    const k = a.big ? 1.25 : 1; const low = a.low ? 0.75 : 1;
    const bodyY = -14 * k * low; const legTop = bodyY + 3; const legLen = -legTop;
    const dark = shade(a.body, -0.2);
    const sleep = state === 'rest';
    // queue
    poly(c, [-14 * k, bodyY - 1, -26 * k, bodyY + 3 + Math.sin(t * 3) * 1.5, -14 * k, bodyY + 5], dark);
    if (!sleep) legs(c, dark, [-9 * k, -4 * k, 5 * k, 10 * k], legTop, legLen, walk, a.big ? 5.5 : 4.2);
    if (a.sail) { c.fillStyle = a.accent; c.beginPath(); c.moveTo(-11, bodyY - 4); c.quadraticCurveTo(0, bodyY - 26, 11, bodyY - 4); c.fill(); c.strokeStyle = shade(a.accent, -0.3); c.lineWidth = 0.8; for (let i = -8; i <= 8; i += 3.2) { c.beginPath(); c.moveTo(i, bodyY - 4); c.lineTo(i * 0.9, bodyY - 4 - (18 - Math.abs(i) * 1.2)); c.stroke(); } }
    if (a.shell) {
      ell(c, 0, bodyY + 2, 17, 12, a.body); c.fillStyle = a.body; c.beginPath(); c.ellipse(0, bodyY + 2, 17, 13, 0, Math.PI, 0); c.fill();
      c.fillStyle = shade(a.body, 0.15); for (let i = -12; i <= 12; i += 5) for (let j = -7; j <= 1; j += 4.5) circ(c, i + (j % 2 ? 2 : 0), bodyY + 2 + j, 1.5, shade(a.body, 0.18));
      ell(c, 0, bodyY + 10, 17, 2.5, a.accent);
      circ(c, -21, bodyY + 4, 3.5, a.accent);
    } else {
      ell(c, 0, bodyY, 15 * k, 10 * k * (a.low ? 0.8 : 1), a.body);
      ell(c, 2, bodyY + 4 * k, 10 * k, 5 * k, a.belly);
      ell(c, -3, bodyY - 5 * k, 8 * k, 3 * k, shade(a.body, 0.12));
    }
    if (a.fur) { c.strokeStyle = shade(a.body, -0.3); c.lineWidth = 1; c.beginPath(); for (let i = -16; i <= 16; i += 3) { c.moveTo(i * k, bodyY + 8 * k); c.lineTo(i * k + 1.5, bodyY + 11.5 * k); } c.stroke(); }
    // tête
    const hx = (a.shell ? 18 : 15 * k), hy = bodyY - (a.big ? 2 : 3) + (sleep ? 6 : Math.sin(t * 1.6) * 0.6);
    if (a.frill) { c.fillStyle = a.accent; c.beginPath(); c.arc(hx - 3, hy - 3, 10, Math.PI * 0.75, Math.PI * 1.85); c.lineTo(hx - 3, hy - 3); c.fill(); circ(c, hx - 3, hy - 3, 2, shade(a.accent, 0.3)); }
    if (a.cat) { poly(c, [hx - 4, hy - 6, hx - 2, hy - 11, hx + 1, hy - 6], a.body); poly(c, [hx + 1, hy - 6, hx + 4, hy - 11, hx + 5, hy - 5], a.body); }
    ell(c, hx, hy, a.big ? 9 : 7.5, a.big ? 8.5 : 6, a.body);
    ell(c, hx + 4, hy + 2, 4.5, 3.4, a.belly);
    if (a.horns) { poly(c, [hx - 1, hy - 4, hx + 12, hy - 9, hx + 1, hy - 1.5], '#f3ead6'); poly(c, [hx + 5, hy, hx + 10, hy - 2, hx + 6, hy + 1.5], '#f3ead6'); }
    if (a.tusks) { c.strokeStyle = a.accent; c.lineWidth = 2.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(hx + 4, hy + 4); c.quadraticCurveTo(hx + 14, hy + 9, hx + 15, hy + 1); c.stroke();
      c.strokeStyle = a.body; c.lineWidth = 4; c.beginPath(); c.moveTo(hx + 7, hy + 2); c.quadraticCurveTo(hx + 10, hy + 14, hx + 6 + Math.sin(t * 2) * 1.5, hy + 18); c.stroke(); c.lineCap = 'butt'; }
    if (a.fangs) { poly(c, [hx + 4, hy + 4, hx + 5.2, hy + 10, hx + 6.2, hy + 4], '#fffbe8'); poly(c, [hx + 7, hy + 4, hx + 8, hy + 9, hx + 9, hy + 4], '#fffbe8'); c.strokeStyle = a.accent; c.lineWidth = 1.2; for (let i = -8; i < 8; i += 4) { c.beginPath(); c.moveTo(i, bodyY - 8); c.lineTo(i + 2, bodyY - 2); c.stroke(); } }
    if (sleep) { c.strokeStyle = '#2a2020'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(hx + 1, hy - 1); c.lineTo(hx + 4, hy - 1); c.stroke(); }
    else { circ(c, hx + 2.5, hy - 1.6, 1.4, '#1d1714'); circ(c, hx + 3, hy - 2, 0.45, '#fff'); }
  }
  function biped(c, a, t, walk, state) {
    const dark = shade(a.body, -0.2);
    const by = -13;
    poly(c, [-6, by - 1, -22, by - 4 + Math.sin(t * 4) * 2, -6, by + 3], dark);
    c.fillStyle = dark; rr(c, -3 + walk * 1.5, by + 3, 2.8, 10 - Math.max(0, walk) * 1.5, 1.2); c.fill(); rr(c, 1 - walk * 1.5, by + 3, 2.8, 10 - Math.max(0, -walk) * 1.5, 1.2); c.fill();
    ell(c, 0, by, 8, 5.5, a.body, -0.15); ell(c, 1.5, by + 2, 5, 2.6, a.belly);
    c.strokeStyle = a.body; c.lineWidth = 3.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(5, by - 2); c.lineTo(9, by - 9 + (state === 'eat' ? 8 : 0)); c.stroke(); c.lineCap = 'butt';
    const hy = by - 11 + (state === 'eat' ? 8 : Math.sin(t * 5) * 0.8);
    ell(c, 11, hy, 5, 3.4, a.body); ell(c, 13, hy + 1, 2.8, 1.6, a.belly);
    circ(c, 12, hy - 1, 0.9, '#1d1714');
    for (let i = -4; i <= 2; i += 2.5) poly(c, [i, by - 5, i + 1.2, by - 7.5, i + 2.4, by - 5], a.accent);
  }
  function flyer(c, a, t, flying) {
    const flap = flying ? Math.sin(t * 7) : 0.15;
    const yOff = flying ? -26 + Math.sin(t * 2) * 3 : -8;
    if (flying) shadow(c, 0, 0, 10, 3, 0.1);
    c.save(); c.translate(0, yOff);
    poly(c, [-2, -2, -24, -6 - flap * 12, -16, 3], shade(a.body, -0.15));
    poly(c, [2, -2, 22, -6 - flap * 12, 14, 3], a.body);
    ell(c, 0, 0, 8, 4, a.body); ell(c, 1, 1.4, 5, 2, a.belly);
    if (!flying) { c.fillStyle = shade(a.body, -0.25); rr(c, -3, 3, 2, 6, 1); c.fill(); rr(c, 2, 3, 2, 6, 1); c.fill(); }
    ell(c, 8, -3, 4, 3, a.body);
    poly(c, [10, -3.5, 22, -1.5, 10, -1], '#e9d28c');
    poly(c, [6, -4, -4, -10, 7, -6], a.accent);
    circ(c, 9, -4, 0.9, '#1d1714');
    c.restore();
  }

  /* ================= POISSONS ================= */
  function drawFish(c, sp, x, y, s = 1, t = 0, facing = 1) {
    const d = G.D.fish[sp]; if (!d) return; const a = d.art; s *= a.s || 1;
    c.save(); c.translate(x, y); c.scale(s * facing, s);
    const w = Math.sin(t * 6);
    switch (a.shape) {
      case 'eel': {
        c.strokeStyle = a.body; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath();
        for (let i = 0; i <= 10; i++) { const px = 10 - i * 2.6; const py = Math.sin(t * 5 + i * 0.7) * 1.8 * (i / 10); i ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); c.lineCap = 'butt';
        poly(c, [-6, -2, -2, -5, 2, -2], a.fin); circ(c, 9, -0.8, 0.9, '#111'); break;
      }
      case 'gar': {
        ell(c, 0, 0, 12, 3.4, a.body); poly(c, [10, -1, 21, 0, 10, 1.6], shade(a.body, -0.1));
        poly(c, [-11, 0, -17, -4 + w, -17, 4 + w], a.fin); poly(c, [-6, -3, -3, -6, 0, -3], a.fin);
        c.fillStyle = shade(a.body, 0.25); for (let i = -8; i < 8; i += 3) circ(c, i, -0.5, 0.7, shade(a.body, 0.25)); circ(c, 8, -1, 0.9, '#111'); break;
      }
      case 'ammonite': {
        for (let i = 0; i < 5; i++) { c.strokeStyle = a.fin; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-5, 2); c.quadraticCurveTo(-10, 3 + i, -14 + Math.sin(t * 4 + i) * 1.5, 4 + i * 1.5); c.stroke(); }
        circ(c, 2, 0, 8, a.body); c.strokeStyle = shade(a.body, -0.3); c.lineWidth = 1;
        c.beginPath(); for (let k = 0; k < 40; k++) { const ang = k * 0.32; const r = 7.5 - k * 0.17; const px = 2 + Math.cos(ang) * r, py = Math.sin(ang) * r; k ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke();
        for (let i = 0; i < 8; i++) { const ang = i * 0.8; c.beginPath(); c.moveTo(2 + Math.cos(ang) * 3.5, Math.sin(ang) * 3.5); c.lineTo(2 + Math.cos(ang) * 8, Math.sin(ang) * 8); c.stroke(); }
        circ(c, -5, -1, 1, '#111'); break;
      }
      case 'trilobite': {
        ell(c, 0, 0, 10, 6, a.body); ell(c, 7, 0, 4, 5.4, shade(a.body, 0.1));
        c.strokeStyle = a.fin; c.lineWidth = 0.9; for (let i = -7; i < 5; i += 2.2) { c.beginPath(); c.moveTo(i, -5.2); c.lineTo(i, 5.2); c.stroke(); }
        ell(c, 0, 0, 10, 1.6, shade(a.body, -0.15));
        for (let i = -6; i < 5; i += 2.5) { c.beginPath(); c.moveTo(i, 6); c.lineTo(i - 1 + Math.sin(t * 9 + i) * 0.8, 8); c.stroke(); }
        c.beginPath(); c.moveTo(10, -2); c.quadraticCurveTo(15, -6, 17, -4); c.moveTo(10, 2); c.quadraticCurveTo(15, 6, 17, 4); c.stroke();
        circ(c, 8, -2.2, 0.9, '#111'); break;
      }
      case 'armored': {
        poly(c, [-12, 0, -20, -6 + w, -20, 6 + w], a.fin);
        ell(c, -2, 0, 12, 6.5, a.body); rr(c, 2, -7, 12, 12.5, 4); c.fillStyle = shade(a.body, -0.25); c.fill();
        c.strokeStyle = shade(a.body, 0.3); c.lineWidth = 0.8; c.beginPath(); c.moveTo(5, -6); c.lineTo(5, 5); c.moveTo(9, -6); c.lineTo(9, 5); c.stroke();
        poly(c, [10, 2, 15, 3.5, 10, 5], '#f0eadb'); circ(c, 10, -2, 1.3, '#f6d34a'); circ(c, 10.3, -2, 0.6, '#111');
        poly(c, [-4, -6, 0, -11, 3, -6], a.fin); break;
      }
      case 'anomalo': {
        for (let i = 0; i < 6; i++) { const px = 8 - i * 3.4; const fl = Math.sin(t * 6 - i * 0.9) * 3; ell(c, px, -4 - fl * 0.4, 2.4, 2.8 + fl * 0.3, a.fin); ell(c, px, 4 + fl * 0.4, 2.4, 2.8 - fl * 0.3, a.fin); }
        ell(c, -1, 0, 12, 4, a.body); poly(c, [-12, 0, -18, -3, -16, 0, -18, 3], a.fin);
        c.strokeStyle = shade(a.body, -0.2); c.lineWidth = 1.8; c.beginPath(); c.moveTo(10, -1); c.quadraticCurveTo(17, -4, 15, 3 + w); c.moveTo(10, 1); c.quadraticCurveTo(16, 6, 13, 7 + w); c.stroke();
        circ(c, 9, -3, 1.4, '#222'); break;
      }
      default: {
        poly(c, [-10, 0, -18, -6 + w * 1.5, -18, 6 + w * 1.5], a.fin);
        ell(c, 0, 0, 11, 6.5, a.body); ell(c, 2, 2.2, 7, 2.8, shade(a.body, 0.25));
        poly(c, [-4, -5.5, 0, -11, 4, -5.5], a.fin); ell(c, -1, 5.8, 3, 2, a.fin, 0.4); ell(c, 3, 5.5, 2.6, 1.8, a.fin, -0.3);
        if (a.spots) for (const [sx, sy] of [[-5, -2], [-1, -3], [3, -1], [-3, 1.5]]) circ(c, sx, sy, 0.9, a.spots);
        circ(c, 7, -1.5, 1.3, '#fff'); circ(c, 7.3, -1.5, 0.7, '#111');
      }
    }
    c.restore();
  }

  /* ================= VÉGÉTATION / DÉCOR ================= */
  function tree(c, x, y, s = 1, col = '#4f9a46', t = 0) {
    c.save(); c.translate(x, y); c.scale(s, s);
    shadow(c, 0, 0, 13, 4.5, 0.2);
    c.fillStyle = '#8a5a35'; rr(c, -3, -16, 6, 16, 2); c.fill();
    const sw = Math.sin(t * 1.3 + x) * 0.6;
    circ(c, -7 + sw, -22, 9, shade(col, -0.12)); circ(c, 7 + sw, -22, 9, shade(col, -0.12)); circ(c, sw, -30, 11, col);
    circ(c, -3 + sw, -33, 5, shade(col, 0.2));
    c.restore();
  }
  function fruitTree(c, x, y, s, t) { tree(c, x, y, s, '#5fae4a', t); c.save(); c.translate(x, y); c.scale(s, s); for (const [fx, fy] of [[-6, -24], [5, -28], [2, -20], [-2, -34], [8, -20]]) circ(c, fx, fy, 2.2, '#e6533c'); c.restore(); }
  function fern(c, x, y, s = 1, col = '#3f8a3a', t = 0) {
    c.save(); c.translate(x, y); c.scale(s, s); shadow(c, 0, 0, 12, 3.5, 0.15);
    c.strokeStyle = col; c.lineWidth = 2.6; c.lineCap = 'round';
    for (let i = -3; i <= 3; i++) { const ang = -Math.PI / 2 + i * 0.38 + Math.sin(t + x * 0.1) * 0.04; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(Math.cos(ang) * 10, Math.sin(ang) * 14, Math.cos(ang) * 17, Math.sin(ang) * 18 + Math.abs(i) * 3); c.stroke(); }
    c.strokeStyle = shade(col, 0.25); c.lineWidth = 1; for (let i = -2; i <= 2; i++) { const ang = -Math.PI / 2 + i * 0.4; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(ang) * 13, Math.sin(ang) * 15); c.stroke(); }
    c.lineCap = 'butt'; c.restore();
  }
  function palm(c, x, y, s = 1, t = 0) {
    c.save(); c.translate(x, y); c.scale(s, s); shadow(c, 4, 0, 12, 4, 0.18);
    c.strokeStyle = '#9a6b3e'; c.lineWidth = 5; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(5, -18, 2, -34); c.stroke();
    const sw = Math.sin(t * 1.4 + x) * 0.08;
    c.fillStyle = '#4c9b48'; for (let i = 0; i < 6; i++) { const ang = i * 1.05 + sw; c.save(); c.translate(2, -34); c.rotate(ang); c.beginPath(); c.ellipse(11, 0, 12, 3.2, 0.25, 0, TAU); c.fill(); c.restore(); }
    circ(c, 2, -33, 2.6, '#7a5a2a'); c.restore();
  }
  function rock(c, x, y, s = 1, col = '#8f8a85') { c.save(); c.translate(x, y); c.scale(s, s); shadow(c, 0, 0, 12, 4, 0.2); poly(c, [-12, 0, -9, -10, -2, -14, 7, -11, 12, -3, 10, 0], col); poly(c, [-9, -10, -2, -14, 1, -8, -6, -6], shade(col, 0.25)); c.restore(); }
  function bush(c, x, y, s = 1, col = '#5a9e45', berries) { c.save(); c.translate(x, y); c.scale(s, s); shadow(c, 0, 0, 11, 3.5, 0.18); circ(c, -6, -6, 6.5, shade(col, -0.1)); circ(c, 6, -6, 6.5, shade(col, -0.1)); circ(c, 0, -10, 8, col); if (berries) for (const [bx, by] of [[-5, -8], [3, -12], [6, -5], [-1, -4], [0, -9]]) circ(c, bx, by, 1.8, berries); c.restore(); }
  function flowers(c, x, y, s = 1) { c.save(); c.translate(x, y); c.scale(s, s); ell(c, 0, 0, 16, 7, '#6a4a32'); ell(c, 0, -1, 15, 6, '#4f8f3e'); const cols = ['#f28ab2', '#f6d14a', '#fff', '#b98af0', '#f2795a']; for (let i = 0; i < 9; i++) { const fx = -11 + (i * 7) % 22, fy = -3 + ((i * 5) % 6) - 2; circ(c, fx, fy, 2.2, cols[i % 5]); circ(c, fx, fy, 0.8, '#f6d14a'); } c.restore(); }

  /* ================= ICÔNES (dataURL en cache) ================= */
  const cache = {};
  function makeCanvas(n) { const cv = document.createElement('canvas'); cv.width = cv.height = n; return cv; }
  function icon(kind, id, n = 72) {
    const key = kind + ':' + id + ':' + n; if (cache[key]) return cache[key];
    const cv = makeCanvas(n); const c = cv.getContext('2d');
    c.save(); c.scale(n / 64, n / 64);
    try {
      if (kind === 'item') drawItem(c, id);
      else if (kind === 'res') drawRes(c, id);
      else if (kind === 'animal') { drawAnimal(c, id, 30, 50, 1.1, 0.5, 1, 'idle'); }
      else if (kind === 'fish') { drawFish(c, id, 32, 32, 1.5, 0.3, 1); }
      else if (kind === 'char') portrait(c, id);
      else if (kind === 'silhouette') { c.globalAlpha = 1; drawSil(c, id); }
    } catch (e) { console.warn(e); }
    c.restore();
    return (cache[key] = cv.toDataURL());
  }
  function drawSil(c, ref) { const [k, id] = ref.split('|'); const off = makeCanvas(64); const o = off.getContext('2d'); if (k === 'animal') drawAnimal(o, id, 30, 50, 1.1, 0.5, 1); else if (k === 'fish') drawFish(o, id, 32, 32, 1.5, 0.3, 1); else drawItem(o, id); o.globalCompositeOperation = 'source-in'; o.fillStyle = '#6d7a86'; o.fillRect(0, 0, 64, 64); c.globalAlpha = 0.55; c.drawImage(off, 0, 0); }
  function portrait(c, id) {
    const d = G.D.characters[id]; c.fillStyle = shade(d.look.top, 0.55); circ(c, 32, 32, 31, shade(d.look.top, 0.6));
    c.save(); c.beginPath(); c.arc(32, 32, 31, 0, TAU); c.clip(); drawChar(c, d.look, 32, 104, 2.4, 0, false, 1, { noShadow: true }); c.restore();
  }

  function stone(c, col = '#b9ab95') { poly(c, [8, 46, 14, 20, 34, 12, 54, 18, 58, 42, 44, 54, 18, 54], col); poly(c, [14, 20, 34, 12, 54, 18, 40, 24, 20, 26], shade(col, 0.2)); }
  function drawItem(c, id) {
    c.lineCap = 'round'; c.lineJoin = 'round';
    switch (id) {
      case 'ammonite': { circ(c, 32, 34, 22, '#c9a477'); c.strokeStyle = '#7d5b39'; c.lineWidth = 2.2; c.beginPath(); for (let k = 0; k < 60; k++) { const a = k * 0.3; const r = 20 - k * 0.32; const x = 32 + Math.cos(a) * r, y = 34 + Math.sin(a) * r; k ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); c.lineWidth = 1.2; for (let i = 0; i < 16; i++) { const a = i * 0.39; c.beginPath(); c.moveTo(32 + Math.cos(a) * 10, 34 + Math.sin(a) * 10); c.lineTo(32 + Math.cos(a) * 21, 34 + Math.sin(a) * 21); c.stroke(); } break; }
      case 'fougere_fossile': { stone(c, '#a9a39a'); c.strokeStyle = '#5f5a52'; c.lineWidth = 2; c.beginPath(); c.moveTo(18, 48); c.quadraticCurveTo(30, 30, 46, 18); c.stroke(); c.lineWidth = 1.4; for (let i = 0; i < 9; i++) { const t = i / 9; const x = 18 + 28 * t, y = 48 - 30 * t; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 6 + t * 2, y - 7); c.moveTo(x, y); c.lineTo(x + 7, y + 4 - t * 2); c.stroke(); } break; }
      case 'empreinte_theropode': { stone(c, '#b8a07c'); c.fillStyle = '#6e5639'; ell(c, 32, 40, 7, 6, '#6e5639'); for (const [dx, dy, r] of [[-12, -16, -0.5], [0, -20, 0], [12, -16, 0.5]]) { c.save(); c.translate(32, 38); c.rotate(r); ell(c, 0, -10, 3.5, 10, '#6e5639'); poly(c, [-2, -19, 0, -25, 2, -19], '#4d3b25'); c.restore(); } break; }
      case 'dent_smilodon': { c.fillStyle = '#f3ead2'; c.beginPath(); c.moveTo(22, 10); c.quadraticCurveTo(46, 14, 44, 30); c.quadraticCurveTo(42, 46, 30, 58); c.quadraticCurveTo(34, 40, 28, 26); c.quadraticCurveTo(24, 18, 22, 10); c.fill(); c.strokeStyle = '#b9a986'; c.lineWidth = 1.5; c.stroke(); c.fillStyle = '#d9c8a2'; rr(c, 18, 6, 14, 8, 3); c.fill(); break; }
      case 'squelette_compso': { c.strokeStyle = '#efe6cf'; c.lineWidth = 3; c.beginPath(); c.moveTo(8, 30); c.quadraticCurveTo(28, 22, 44, 26); c.lineTo(52, 16); c.stroke(); c.lineWidth = 1.6; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(22 + i * 3.5, 25); c.lineTo(22 + i * 3.5, 33); c.stroke(); } c.beginPath(); c.moveTo(34, 28); c.lineTo(32, 44); c.lineTo(36, 50); c.moveTo(40, 28); c.lineTo(42, 44); c.lineTo(46, 50); c.stroke(); ell(c, 54, 14, 6, 4, '#efe6cf'); circ(c, 55, 13, 1.2, '#7d6b50'); break; }
      case 'crane_triceratops': { c.fillStyle = '#e9dcbc'; c.beginPath(); c.arc(24, 30, 20, Math.PI * 0.6, Math.PI * 1.9); c.lineTo(30, 30); c.fill(); c.strokeStyle = '#b5a37c'; c.lineWidth = 2; c.stroke(); for (let i = 0; i < 6; i++) { const a = Math.PI * 0.7 + i * 0.22; circ(c, 24 + Math.cos(a) * 19, 30 + Math.sin(a) * 19, 2.4, '#d3c29a'); } ell(c, 38, 36, 14, 11, '#efe4c8'); poly(c, [36, 26, 58, 12, 40, 31], '#f7f0de', '#b5a37c', 1); poly(c, [44, 30, 62, 22, 46, 34], '#f7f0de', '#b5a37c', 1); poly(c, [48, 38, 56, 34, 50, 42], '#f7f0de'); circ(c, 40, 33, 3, '#6e5b3e'); break; }
      case 'biface': { poly(c, [32, 6, 48, 30, 42, 52, 32, 58, 22, 52, 16, 30], '#8f8f99', '#5e5e66', 1.5); for (const p of [[32, 6, 34, 30], [48, 30, 34, 30], [16, 30, 30, 32], [22, 52, 32, 36], [42, 52, 34, 36]]) { c.strokeStyle = '#6f6f78'; c.lineWidth = 1; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[2], p[3]); c.stroke(); } poly(c, [32, 10, 40, 26, 30, 28], '#b1b1bb'); break; }
      case 'propulseur': { c.strokeStyle = '#a4774a'; c.lineWidth = 6; c.beginPath(); c.moveTo(8, 54); c.lineTo(50, 14); c.stroke(); c.strokeStyle = '#6e4a2a'; c.lineWidth = 1.2; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(16 + i * 6, 46 - i * 6); c.lineTo(20 + i * 6, 48 - i * 6); c.stroke(); } circ(c, 52, 12, 6, '#c69a63'); poly(c, [50, 6, 46, 0, 54, 4], '#c69a63'); circ(c, 54, 11, 1, '#3a2a1a'); break; }
      case 'aiguille_os': { c.strokeStyle = '#efe6cf'; c.lineWidth = 3.4; c.beginPath(); c.moveTo(10, 54); c.lineTo(54, 10); c.stroke(); c.strokeStyle = '#a8977a'; c.lineWidth = 1; c.beginPath(); c.arc(50, 14, 2, 0, TAU); c.stroke(); c.strokeStyle = '#c2584a'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(50, 14); c.quadraticCurveTo(58, 30, 44, 40); c.stroke(); break; }
      case 'lampe_graisse': { ell(c, 32, 46, 22, 9, '#8a7d70'); ell(c, 32, 42, 20, 7, '#a69888'); ell(c, 32, 41, 15, 4.5, '#e4c46a'); c.fillStyle = '#f6a21a'; c.beginPath(); c.moveTo(32, 14); c.quadraticCurveTo(42, 30, 32, 38); c.quadraticCurveTo(22, 30, 32, 14); c.fill(); c.fillStyle = '#fde67a'; c.beginPath(); c.moveTo(32, 22); c.quadraticCurveTo(37, 31, 32, 37); c.quadraticCurveTo(27, 31, 32, 22); c.fill(); break; }
      case 'hamecon_os': { c.strokeStyle = '#efe6cf'; c.lineWidth = 4; c.beginPath(); c.moveTo(34, 8); c.lineTo(34, 38); c.arc(26, 38, 8, 0, Math.PI); c.lineTo(18, 30); c.stroke(); poly(c, [16, 26, 18, 32, 22, 30], '#efe6cf'); c.strokeStyle = '#8a6a3a'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(34, 8); c.lineTo(46, 4); c.stroke(); break; }
      case 'peinture_rupestre': { poly(c, [4, 12, 58, 6, 60, 54, 6, 58], '#d8c09a', '#a88e66', 1.5); c.fillStyle = '#b5432c'; ell(c, 24, 32, 10, 6, '#b5432c'); circ(c, 34, 28, 4.5, '#b5432c'); c.strokeStyle = '#b5432c'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(36, 31); c.quadraticCurveTo(39, 40, 36, 44); for (const lx of [18, 22, 27, 31]) { c.moveTo(lx, 36); c.lineTo(lx, 44); } c.stroke(); c.fillStyle = '#3a2a20'; ell(c, 46, 46, 5, 3, '#3a2a20'); c.strokeStyle = '#3a2a20'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(44, 48); c.lineTo(43, 52); c.moveTo(48, 48); c.lineTo(49, 52); c.stroke(); for (const [hx, hy] of [[12, 18], [50, 16]]) { c.fillStyle = 'rgba(181,67,44,.6)'; circ(c, hx, hy, 4, 'rgba(181,67,44,.55)'); } break; }
      case 'statuette_mammouth': { ell(c, 30, 36, 16, 12, '#f1e6cc'); circ(c, 44, 30, 8, '#f1e6cc'); c.strokeStyle = '#f1e6cc'; c.lineWidth = 4; c.beginPath(); c.moveTo(48, 34); c.quadraticCurveTo(52, 44, 48, 50); c.stroke(); c.fillStyle = '#e6d8b8'; for (const lx of [20, 27, 34, 40]) { rr(c, lx - 2.5, 42, 5, 10, 2); c.fill(); } c.strokeStyle = '#bfae88'; c.lineWidth = 1; c.beginPath(); c.moveTo(20, 30); c.lineTo(36, 28); c.moveTo(18, 36); c.lineTo(38, 36); c.stroke(); circ(c, 46, 28, 1, '#7d6b50'); break; }
      case 'collier_coquillages': { c.strokeStyle = '#7a5532'; c.lineWidth = 1.6; c.beginPath(); c.arc(32, 22, 20, 0.15, Math.PI - 0.15); c.stroke(); const cols = ['#f4e3c3', '#f2b9a0', '#efe9dd', '#e9c48f']; for (let i = 0; i < 7; i++) { const a = 0.35 + i * 0.4; const x = 32 + Math.cos(a) * 20, y = 22 + Math.sin(a) * 20; c.save(); c.translate(x, y); c.rotate(a); ell(c, 0, 4, 3.4, 5, cols[i % 4]); c.strokeStyle = '#b48a62'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 8); c.stroke(); c.restore(); } break; }
      case 'ambre_moustique': { c.fillStyle = '#e8961c'; c.beginPath(); c.moveTo(32, 6); c.bezierCurveTo(54, 20, 52, 54, 32, 58); c.bezierCurveTo(12, 54, 10, 22, 32, 6); c.fill(); c.fillStyle = 'rgba(255,220,120,.6)'; ell(c, 26, 22, 5, 9, 'rgba(255,230,150,.55)', -0.4); c.strokeStyle = '#4a2a10'; c.lineWidth = 1; ell(c, 33, 38, 4, 1.8, '#4a2a10'); c.beginPath(); c.moveTo(37, 38); c.lineTo(42, 36); c.moveTo(31, 37); c.lineTo(27, 31); c.moveTo(34, 37); c.lineTo(38, 30); c.moveTo(30, 39); c.lineTo(27, 44); c.moveTo(34, 39); c.lineTo(36, 45); c.stroke(); ell(c, 29, 33, 4, 2, 'rgba(255,255,255,.5)', -0.6); break; }
      case 'oeuf_petrifie': { ell(c, 32, 36, 17, 21, '#9c8b74'); ell(c, 27, 28, 6, 9, '#b4a48c', -0.3); c.strokeStyle = '#5c4f40'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(20, 34); c.lineTo(27, 38); c.lineTo(24, 44); c.moveTo(38, 22); c.lineTo(42, 30); c.lineTo(46, 32); c.stroke(); break; }
      case 'medaille_gazette': { poly(c, [22, 4, 30, 4, 34, 26, 26, 26], '#3d7dd8'); poly(c, [34, 4, 42, 4, 38, 26, 30, 26], '#e04b3a'); circ(c, 32, 40, 16, '#e3b23c'); circ(c, 32, 40, 12, '#f2cf62'); c.fillStyle = '#9a7417'; c.font = 'bold 14px Georgia'; c.textAlign = 'center'; c.fillText('G', 32, 45); break; }
      case 'maquette_bateau': { poly(c, [8, 40, 56, 40, 48, 52, 14, 52], '#9a6b3e', '#6a4520', 1.2); c.strokeStyle = '#5a3b20'; c.lineWidth = 2; c.beginPath(); c.moveTo(32, 40); c.lineTo(32, 8); c.stroke(); poly(c, [33, 10, 52, 34, 33, 34], '#f3ead6', '#c9b896', 1); poly(c, [31, 14, 16, 34, 31, 34], '#e9dcbc'); poly(c, [32, 8, 42, 11, 32, 14], '#e04b3a'); break; }
      default: { circ(c, 32, 32, 20, '#c8b89a'); c.fillStyle = '#6b5a40'; c.font = 'bold 24px sans-serif'; c.textAlign = 'center'; c.fillText('?', 32, 41); }
    }
  }
  function drawRes(c, id) {
    c.lineCap = 'round';
    switch (id) {
      case 'bois': for (const [y, l] of [[44, 0], [34, 4], [24, 2]]) { rr(c, 10 + l, y - 6, 42 - l, 12, 6); c.fillStyle = '#9a6b3e'; c.fill(); ell(c, 50, y, 5, 6, '#d9b07a'); c.strokeStyle = '#a3794a'; c.lineWidth = 0.8; c.beginPath(); c.arc(50, y, 2.5, 0, TAU); c.stroke(); } break;
      case 'pierre': rock(c, 32, 50, 2, '#9b968f'); break;
      case 'baies': { c.fillStyle = '#4f8f3e'; ell(c, 30, 16, 10, 4, '#4f8f3e', -0.4); for (const [x, y] of [[24, 30], [36, 28], [30, 40], [42, 40], [20, 42], [32, 50]]) { circ(c, x, y, 7, '#5b4bb5'); circ(c, x - 2, y - 2, 2, 'rgba(255,255,255,.5)'); } break; }
      case 'herbes': { c.strokeStyle = '#3f8a3a'; c.lineWidth = 3; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(32, 58); c.quadraticCurveTo(32 + i * 8, 30, 32 + i * 12, 10); c.stroke(); ell(c, 32 + i * 11, 16, 4, 8, '#6fb85a', i * 0.3); } c.fillStyle = '#c8a46a'; rr(c, 26, 46, 12, 6, 2); c.fill(); break; }
      case 'ocre': { rock(c, 32, 52, 2, '#b5432c'); circ(c, 22, 30, 3, '#d9643f'); circ(c, 40, 34, 2.4, '#e07f4c'); break; }
      case 'resine': { c.fillStyle = '#f0a020'; c.beginPath(); c.moveTo(32, 8); c.bezierCurveTo(50, 30, 48, 56, 32, 56); c.bezierCurveTo(16, 56, 14, 30, 32, 8); c.fill(); ell(c, 27, 34, 4, 8, 'rgba(255,240,180,.6)', -0.3); break; }
      case 'frag_crane': { poly(c, [10, 40, 18, 18, 38, 12, 54, 26, 46, 50, 24, 54], '#e9dcbc', '#b5a37c', 2); c.strokeStyle = '#b5a37c'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(20, 30); c.lineTo(30, 36); c.lineTo(28, 46); c.moveTo(40, 22); c.lineTo(44, 34); c.stroke(); break; }
      case 'petits_os': { c.strokeStyle = '#efe6cf'; c.lineWidth = 4.5; for (const [x1, y1, x2, y2] of [[12, 48, 36, 20], [26, 54, 52, 36], [18, 30, 46, 52]]) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); circ(c, x1, y1, 3.6, '#efe6cf'); circ(c, x2, y2, 3.6, '#efe6cf'); } break; }
      default: circ(c, 32, 32, 18, '#bbb');
    }
  }

  return { shade, rr, ell, circ, poly, shadow, drawChar, drawAnimal, drawFish, tree, fruitTree, fern, palm, rock, bush, flowers, icon, drawItem, drawRes };
})();
