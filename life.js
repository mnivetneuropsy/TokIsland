/* ARCHIPEL — vie autonome des animaux (enclos) et des poissons (bassins)
   Réutilisé par la vue de l'île et par les panneaux de gestion. */

G.Life = (() => {
  const U = G.U, A = () => G.Art;

  /* ---------- Enclos ---------- */
  function Pen() { this.st = {}; }
  Pen.prototype.sync = function (animals, rect) {
    const keep = {};
    for (const a of animals) {
      let s = this.st[a.uid];
      if (!s) s = this.st[a.uid] = { x: U.rand(rect.x0 + 20, rect.x1 - 20), y: U.rand(rect.y0 + 25, rect.y1 - 10), mode: 'idle', timer: U.rand(0.5, 3), facing: Math.random() < 0.5 ? 1 : -1, tx: 0, ty: 0, t: Math.random() * 10, fx: null };
      keep[a.uid] = s;
    }
    this.st = keep;
  };
  Pen.prototype.update = function (dt, animals, rect, food, scale = 1) {
    this.sync(animals, rect);
    const bowl = { x: rect.x0 + 26 * scale, y: rect.y1 - 14 * scale };
    for (const a of animals) {
      const s = this.st[a.uid]; s.t += dt; s.timer -= dt;
      if (s.heart) s.heart -= dt;
      if (s.timer <= 0) {
        const mates = animals.filter(o => o.uid !== a.uid && o.sp === a.sp);
        const opts = [['walk', 4], ['idle', 2.5], ['rest', 1.5], ['eat', food > 25 ? 1.6 : 0.2], ['play', mates.length ? 1.2 : 0]];
        const m = U.weighted(opts, o => o[1])[0];
        s.mode = m; s.timer = U.rand(3, 7);
        if (m === 'walk') { s.tx = U.rand(rect.x0 + 18 * scale, rect.x1 - 18 * scale); s.ty = U.rand(rect.y0 + 28 * scale, rect.y1 - 8 * scale); }
        if (m === 'eat') { s.tx = bowl.x + U.rand(-8, 8) * scale; s.ty = bowl.y; }
        if (m === 'play') { const o = this.st[U.pick(mates).uid]; s.tx = o.x + 14 * scale; s.ty = o.y; s.heart = 0; }
        if (m === 'rest') s.timer = U.rand(5, 9);
      }
      if (s.mode === 'walk' || s.mode === 'eat' || s.mode === 'play') {
        const dx = s.tx - s.x, dy = s.ty - s.y, d = Math.hypot(dx, dy);
        const sp = 16 * scale * dt;
        if (d > sp + 1) { s.x += dx / d * sp; s.y += dy / d * sp; if (Math.abs(dx) > 0.5) s.facing = dx > 0 ? 1 : -1; s.moving = true; }
        else { s.moving = false; if (s.mode === 'walk') { s.mode = 'idle'; } if (s.mode === 'play' && !s.heart) s.heart = 2; }
      } else s.moving = false;
    }
  };
  Pen.prototype.draw = function (c, animals, rect, food, scale = 1, opts = {}) {
    if (food !== null && animals.length) {
      // gamelle
      const bx = rect.x0 + 26 * scale, by = rect.y1 - 14 * scale;
      A().ell(c, bx, by, 13 * scale, 5 * scale, '#7a5636'); A().ell(c, bx, by - 1.5 * scale, 11 * scale, 3.6 * scale, food > 25 ? '#9cc45a' : '#5a4430');
      if (food > 25) for (let i = 0; i < 4; i++) A().circ(c, bx - 6 * scale + i * 4 * scale, by - 2.5 * scale, 1.6 * scale, i % 2 ? '#e6533c' : '#f0c040');
    }
    const list = animals.map(a => ({ a, s: this.st[a.uid] })).filter(o => o.s).sort((p, q) => p.s.y - q.s.y);
    for (const { a, s } of list) {
      const state = s.mode === 'rest' ? 'rest' : s.moving ? 'walk' : (s.mode === 'eat' ? 'eat' : 'idle');
      A().drawAnimal(c, a.sp, s.x, s.y, 0.75 * scale * (opts.size || 1), s.t, s.facing, state);
      if (s.mode === 'rest') { c.fillStyle = 'rgba(40,40,80,.7)'; c.font = (9 * scale) + 'px sans-serif'; c.fillText('z', s.x + 8 * scale, s.y - 22 * scale - (s.t * 6 % 6)); }
      if (s.heart > 0) { c.fillStyle = '#e8507a'; c.font = (11 * scale) + 'px sans-serif'; c.fillText('♥', s.x - 4 * scale, s.y - 30 * scale - (2 - s.heart) * 6); }
      if (opts.names && a.name) { c.fillStyle = 'rgba(0,0,0,.55)'; c.font = (9 * scale) + 'px sans-serif'; c.textAlign = 'center'; c.fillText(a.name, s.x, s.y + 11 * scale); c.textAlign = 'left'; }
    }
  };

  /* ---------- Bassin ---------- */
  function Tank() { this.st = {}; this.bubbles = []; }
  Tank.prototype.update = function (dt, fish, rect, scale = 1) {
    const keep = {};
    for (const f of fish) {
      let s = this.st[f.uid];
      const bottom = G.D.fish[f.sp].art.shape === 'trilobite';
      if (!s) s = { x: U.rand(rect.x0 + 15, rect.x1 - 15), y: bottom ? rect.y1 - 8 * scale : U.rand(rect.y0 + 10, rect.y1 - 12), vx: U.rand(-1, 1), vy: 0, tx: 0, ty: 0, timer: 0, t: Math.random() * 10, bottom };
      keep[f.uid] = s;
      s.t += dt; s.timer -= dt;
      if (s.timer <= 0) { s.timer = U.rand(2, 5); s.tx = U.rand(rect.x0 + 14 * scale, rect.x1 - 14 * scale); s.ty = s.bottom ? rect.y1 - 8 * scale : U.rand(rect.y0 + 10 * scale, rect.y1 - 14 * scale); }
      const ax = (s.tx - s.x) * 0.6, ay = (s.ty - s.y) * 0.6;
      s.vx += ax * dt; s.vy += ay * dt; const sp = Math.hypot(s.vx, s.vy), max = (s.bottom ? 6 : 16) * scale;
      if (sp > max) { s.vx *= max / sp; s.vy *= max / sp; }
      s.vx *= 0.99; s.vy *= 0.97;
      s.x += s.vx * dt; s.y += s.vy * dt;
    }
    this.st = keep;
    if (Math.random() < dt * 2.5) this.bubbles.push({ x: U.rand(rect.x0 + 10, rect.x1 - 10), y: rect.y1, r: U.rand(1, 2.6) * scale, vy: U.rand(10, 22) * scale });
    for (const b of this.bubbles) b.y -= b.vy * dt;
    this.bubbles = this.bubbles.filter(b => b.y > rect.y0);
  };
  Tank.prototype.draw = function (c, fish, rect, scale = 1) {
    c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 0.8;
    for (const b of this.bubbles) { c.beginPath(); c.arc(b.x, b.y, b.r, 0, Math.PI * 2); c.stroke(); }
    for (const f of fish) { const s = this.st[f.uid]; if (!s) continue; A().drawFish(c, f.sp, s.x, s.y, 0.75 * scale, s.t, s.vx >= 0 ? 1 : -1); }
  };

  return { Pen, Tank };
})();
