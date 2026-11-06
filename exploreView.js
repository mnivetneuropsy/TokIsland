/* ARCHIPEL — exploration d'une île (vue de dessus 3/4 sur grille de tuiles)
   Déplacement clavier (ZQSD / WASD / flèches) ou toucher/clic (A*), interaction contextuelle. */

G.Explore = (() => {
  const U = G.U, A = G.Art;
  const TS = 32;
  const T = { DEEP: 0, SHALLOW: 1, SAND: 2, GRASS: 3, JUNGLE: 4, TREE: 5, ROCK: 6, PATH: 7, DIRT: 8, LAVAROCK: 9, LAVA: 10, CAVEFLOOR: 11, CAVEWALL: 12, GATE: 13, LAGOON: 14, HUT: 15, DOCK: 16, VILLAGE: 17, JTREE: 18 };
  const WALK = new Set([T.SAND, T.GRASS, T.JUNGLE, T.PATH, T.DIRT, T.LAVAROCK, T.CAVEFLOOR, T.DOCK, T.VILLAGE]);
  const PLAYER_LOOK = { skin: '#f0c7a0', hair: '#5a3a22', style: 'short', top: '#2a9d8f', bottom: '#264653', acc: 'scarf' };
  const COOLDOWN = { dig: 8, res: 4, animal: 10, fishRest: 5 }; // minutes

  let cv, c, dpr = 1, vw = 0, vh = 0, running = false, raf = 0, lastT = 0, t = 0;
  let isl = null, def = null, map = null; // carte générée
  const cam = { x: 0, y: 0, z: 1 };
  const player = { x: 0, y: 0, path: [], facing: 1, moving: false, pending: null };
  const keys = {};
  let nearTarget = null, currentZone = null, lavaTiles = [], waterSparkles = [];
  const cacheMaps = {};

  /* ================= GÉNÉRATION ================= */
  function generate(islandId) {
    if (cacheMaps[islandId]) return cacheMaps[islandId];
    const D = G.D.islands[islandId].map; const W = D.w, H = D.h;
    const tiles = new Uint8Array(W * H), base = new Uint8Array(W * H);
    const rnd = U.mulberry32(D.seed);
    const wob = th => 1 + 0.07 * Math.sin(3 * th + 0.7) + 0.05 * Math.sin(5 * th + 2.1) + 0.03 * Math.sin(11 * th);
    const idx = (x, y) => y * W + x;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const dx = (x + 0.5 - D.center[0]) / D.radii[0], dy = (y + 0.5 - D.center[1]) / D.radii[1];
      const nr = Math.hypot(dx, dy) / wob(Math.atan2(dy, dx));
      tiles[idx(x, y)] = nr < 0.92 ? T.GRASS : nr < 1 ? T.SAND : nr < 1.13 ? T.SHALLOW : T.DEEP;
    }
    const TMAP = { lavarock: T.LAVAROCK, lava: T.LAVA, village: T.VILLAGE, jungle: T.JUNGLE, dirt: T.DIRT, lagoon: T.LAGOON };
    let cave = null;
    for (const s of D.stamps) {
      if (s.type === 'circle') { for (let y = Math.floor(s.cy - s.r); y <= s.cy + s.r; y++) for (let x = Math.floor(s.cx - s.r); x <= s.cx + s.r; x++) if (x >= 0 && y >= 0 && x < W && y < H && Math.hypot(x + 0.5 - s.cx, y + 0.5 - s.cy) <= s.r) tiles[idx(x, y)] = TMAP[s.tile]; }
      else if (s.type === 'rect') { for (let y = s.y0; y <= s.y1; y++) for (let x = s.x0; x <= s.x1; x++) { const cur = tiles[idx(x, y)]; if (cur === T.DEEP || cur === T.SHALLOW) { if (s.tile !== 'lagoon') tiles[idx(x, y)] = TMAP[s.tile]; } else if (cur !== T.LAGOON && cur !== T.LAVA && cur !== T.LAVAROCK) tiles[idx(x, y)] = TMAP[s.tile]; } }
      else if (s.type === 'cave') {
        cave = s;
        for (let y = s.y0; y <= s.y1; y++) for (let x = s.x0; x <= s.x1; x++) tiles[idx(x, y)] = (x === s.x0 || x === s.x1 || y === s.y0 || y === s.y1) ? T.CAVEWALL : T.CAVEFLOOR;
        for (let y = s.y0 + 1; y < s.y1; y++) for (let x = s.x0 + 1; x < s.x1; x++) if (rnd() < 0.06 && Math.abs(x - (s.x0 + s.x1) / 2) > 2) tiles[idx(x, y)] = T.CAVEWALL;
        for (let x = s.gate[0]; x <= s.gate[2]; x++) tiles[idx(x, s.gate[1])] = T.GATE;
      }
    }
    // la côte devient plage
    const land = v => v === T.GRASS || v === T.JUNGLE || v === T.VILLAGE || v === T.DIRT;
    const copy = tiles.slice();
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (land(copy[idx(x, y)])) {
      for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = copy[idx(x + ox, y + oy)]; if (n === T.SHALLOW || n === T.DEEP) { tiles[idx(x, y)] = T.SAND; break; } }
    }
    // chemins (en L), quai
    for (const [x0, y0, x1, y1] of D.paths) {
      const pts = [];
      for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) pts.push([x, y0]);
      for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) pts.push([x1, y]);
      for (const [px, py] of pts) for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const x = px + ox, y = py + oy; if (x >= W || y >= H) continue; const v = tiles[idx(x, y)]; if ([T.LAGOON, T.LAVA, T.CAVEWALL, T.CAVEFLOOR, T.GATE, T.DEEP].includes(v)) continue; tiles[idx(x, y)] = T.PATH; }
    }
    for (let y = D.dock.y0; y <= D.dock.y1; y++) for (let x = D.dock.x; x <= D.dock.x + 1; x++) tiles[idx(x, y)] = T.DOCK;
    base.set(tiles);
    // végétation et rochers
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const v = tiles[idx(x, y)]; const r = rnd();
      if (v === T.GRASS && r < 0.075) tiles[idx(x, y)] = T.TREE;
      else if (v === T.JUNGLE && r < 0.2) tiles[idx(x, y)] = T.JTREE;
      else if (v === T.LAVAROCK && r < 0.06) tiles[idx(x, y)] = T.ROCK;
      else if (v === T.SAND && r < 0.025) tiles[idx(x, y)] = T.TREE;
      else if (v === T.GRASS && r < 0.085) tiles[idx(x, y)] = T.ROCK;
    }
    for (const [hx, hy] of D.huts) for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) tiles[idx(hx + ox, hy + oy)] = T.HUT;

    const isWater = (x, y, kind) => { const v = tiles[idx(x, y)]; return kind === 'lagoon' ? v === T.LAGOON : (v === T.SHALLOW || v === T.DEEP); };
    const walk = (x, y) => x >= 0 && y >= 0 && x < W && y < H && WALK.has(tiles[idx(x, y)]);
    const clearAround = (ex, ey, r) => { for (let y = ey - r; y <= ey + r; y++) for (let x = ex - r; x <= ex + r; x++) if (x >= 0 && y >= 0 && x < W && y < H && [T.TREE, T.JTREE, T.ROCK].includes(tiles[idx(x, y)])) tiles[idx(x, y)] = base[idx(x, y)]; };
    const nearest = (ex, ey, ok) => { for (let r = 0; r < 10; r++) for (let y = ey - r; y <= ey + r; y++) for (let x = ex - r; x <= ex + r; x++) if (Math.max(Math.abs(x - ex), Math.abs(y - ey)) === r && x > 0 && y > 0 && x < W - 1 && y < H - 1 && ok(x, y)) return [x, y]; return [ex, ey]; };

    const ents = [];
    for (const n of D.npcs) ents.push(Object.assign({ kind: 'npc' }, n));
    for (const s of D.spots) ents.push(Object.assign({ kind: s.type }, s));
    for (const e of ents) {
      clearAround(e.x, e.y, 1);
      if (e.kind === 'fish') { const [nx, ny] = nearest(e.x, e.y, (x, y) => walk(x, y) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([ox, oy]) => isWater(x + ox, y + oy, e.water))); e.x = nx; e.y = ny; e.waterDir = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([ox, oy]) => isWater(nx + ox, ny + oy, e.water)) || [0, 1]; }
      else if (!walk(e.x, e.y)) { const [nx, ny] = nearest(e.x, e.y, walk); e.x = nx; e.y = ny; }
    }
    // connexité : on ouvre un passage vers chaque entité isolée (grille avec la porte ouverte)
    const reach = () => { const seen = new Uint8Array(W * H); const q = [[D.start.x, D.start.y]]; seen[idx(D.start.x, D.start.y)] = 1; while (q.length) { const [x, y] = q.pop(); for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + ox, ny = y + oy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const k = idx(nx, ny); if (seen[k]) continue; if (WALK.has(tiles[k]) || tiles[k] === T.GATE) { seen[k] = 1; q.push([nx, ny]); } } } return seen; };
    for (let pass = 0; pass < 3; pass++) {
      const seen = reach(); let changed = false;
      for (const e of ents) {
        if (seen[idx(e.x, e.y)]) continue;
        let best = null, bd = 1e9; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (seen[idx(x, y)]) { const d = Math.hypot(x - e.x, y - e.y); if (d < bd) { bd = d; best = [x, y]; } }
        if (!best) continue;
        const steps = Math.ceil(bd) * 2; for (let i = 0; i <= steps; i++) { const x = Math.round(e.x + (best[0] - e.x) * i / steps), y = Math.round(e.y + (best[1] - e.y) * i / steps); const k = idx(x, y); if (!WALK.has(tiles[k]) && tiles[k] !== T.GATE && tiles[k] !== T.CAVEWALL) { tiles[k] = [T.TREE, T.JTREE, T.ROCK, T.HUT].includes(tiles[k]) ? (WALK.has(base[k]) ? base[k] : T.PATH) : T.PATH; changed = true; } }
      }
      if (!changed) break;
    }
    const m = { id: islandId, W, H, tiles, base, ents, cave, D, zones: D.zones };
    cacheMaps[islandId] = m; return m;
  }

  const tileAt = (x, y) => (x < 0 || y < 0 || x >= map.W || y >= map.H) ? T.DEEP : map.tiles[y * map.W + x];
  function walkable(x, y) {
    const v = tileAt(x, y);
    if (v === T.GATE) return !!G.state.flags[map.cave.flag];
    if (!WALK.has(v)) return false;
    for (const e of map.ents) if (e.kind === 'npc' && e.x === x && e.y === y && visible(e)) return false;
    return true;
  }

  /* ================= RENDU STATIQUE ================= */
  let bg = null;
  function buildStatic() {
    const P = def.palette; bg = document.createElement('canvas'); bg.width = map.W * TS; bg.height = map.H * TS;
    const g = bg.getContext('2d'); const rnd = U.mulberry32(map.D.seed + 1);
    const col = v => ({ [T.DEEP]: P.deep, [T.SHALLOW]: P.shallow, [T.SAND]: P.sand, [T.GRASS]: P.grass, [T.JUNGLE]: P.jungle, [T.PATH]: P.path, [T.DIRT]: P.dirt, [T.LAVAROCK]: P.lavarock, [T.LAVA]: P.lava, [T.CAVEFLOOR]: P.cavefloor, [T.CAVEWALL]: P.cavewall, [T.GATE]: P.cavefloor, [T.LAGOON]: P.lagoon, [T.DOCK]: P.shallow, [T.VILLAGE]: P.village }[v]);
    lavaTiles = []; waterSparkles = [];
    for (let y = 0; y < map.H; y++) for (let x = 0; x < map.W; x++) {
      const k = y * map.W + x; let v = map.tiles[k];
      const ground = [T.TREE, T.ROCK, T.JTREE, T.HUT].includes(v) ? map.base[k] : v;
      g.fillStyle = col(ground) || P.grass; g.fillRect(x * TS, y * TS, TS, TS);
      const px = x * TS, py = y * TS;
      if (ground === T.GRASS || ground === T.JUNGLE || ground === T.VILLAGE) for (let i = 0; i < 3; i++) { g.fillStyle = rnd() < 0.5 ? 'rgba(0,60,0,.09)' : 'rgba(255,255,200,.1)'; g.beginPath(); g.ellipse(px + rnd() * TS, py + rnd() * TS, 3 + rnd() * 5, 2 + rnd() * 2, 0, 0, 6.28); g.fill(); }
      if (ground === T.SAND) for (let i = 0; i < 3; i++) { g.fillStyle = 'rgba(160,130,80,.18)'; g.fillRect(px + rnd() * TS, py + rnd() * TS, 2, 2); }
      if (ground === T.PATH) { g.fillStyle = 'rgba(150,120,80,.25)'; for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(px + rnd() * TS, py + rnd() * TS, 3, 2, 0, 0, 6.28); g.fill(); } }
      if (ground === T.DIRT) { g.strokeStyle = 'rgba(90,60,30,.25)'; g.lineWidth = 1; g.beginPath(); g.moveTo(px + rnd() * TS, py + rnd() * TS); g.lineTo(px + rnd() * TS, py + rnd() * TS); g.stroke(); if (rnd() < 0.15) { g.fillStyle = '#d6c6a6'; g.fillRect(px + rnd() * 26, py + rnd() * 26, 4, 2); } }
      if (ground === T.LAVAROCK) { g.fillStyle = 'rgba(40,30,25,.2)'; for (let i = 0; i < 3; i++) g.fillRect(px + rnd() * TS, py + rnd() * TS, 3, 3); }
      if (ground === T.CAVEWALL) { g.fillStyle = '#463a35'; g.beginPath(); g.ellipse(px + 16, py + 14, 15, 13, 0, 0, 6.28); g.fill(); g.fillStyle = 'rgba(255,255,255,.06)'; g.beginPath(); g.ellipse(px + 11, py + 9, 6, 4, 0, 0, 6.28); g.fill(); }
      if (ground === T.CAVEFLOOR) { g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(px + rnd() * 28, py + rnd() * 28, 4, 3); }
      if (ground === T.LAVA) lavaTiles.push([x, y]);
      if (ground === T.DOCK) { g.fillStyle = '#7a5434'; g.fillRect(px, py, TS, TS); g.fillStyle = '#a77a4c'; for (let i = 0; i < 4; i++) g.fillRect(px + 1, py + 1 + i * 8, TS - 2, 6); }
      if ((ground === T.SHALLOW || ground === T.LAGOON) && rnd() < 0.25) waterSparkles.push([x, y, rnd() * 6]);
      // adoucissement des bords
      if (ground === T.SAND || ground === T.GRASS) {
        for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = tileAt(x + ox, y + oy); if (n === T.SHALLOW || n === T.LAGOON) { g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(px + (ox > 0 ? TS - 3 : 0), py + (oy > 0 ? TS - 3 : 0), ox ? 3 : TS, oy ? 3 : TS); } }
      }
    }
    // grotte : peinture murale
    if (map.cave) { const cx = (map.cave.x0 + 2) * TS, cy = (map.cave.y0 + 1) * TS; g.fillStyle = 'rgba(181,67,44,.7)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(cx + 20 + i * 34, cy + 10 + (i % 2) * 4, 9, 5, 0, 0, 6.28); g.fill(); } }
  }

  /* ================= ÉTATS DES POINTS ================= */
  function nodes() { return G.state.islands[map.id].nodes; }
  function cooldownLeft(e) {
    const n = nodes()[e.id]; if (!n) return 0;
    return Math.max(0, (n.until || 0) - Date.now());
  }
  function setCooldown(e, minutes) { nodes()[e.id] = Object.assign(nodes()[e.id] || {}, { until: Date.now() + minutes * 60000 }); }
  function visible(e) {
    if (e.cave && !G.state.flags[map.cave.flag]) return false;
    if (e.kind === 'hidden') return !G.state.islands[map.id].done[e.id];
    if (e.kind === 'animal' || e.kind === 'res') return cooldownLeft(e) <= 0;
    return true;
  }
  function inZone(x, y) { for (const z of map.zones) { const [x0, y0, x1, y1] = z.rect; if (x >= x0 && x <= x1 && y >= y0 && y <= y1) return z; } return null; }
  function inCave(x, y) { const c0 = map.cave; return c0 && x > c0.x0 && x < c0.x1 && y > c0.y0 && y < c0.y1; }

  /* ================= INTERACTIONS ================= */
  const LABELS = { npc: 'Parler', dig: 'Fouiller', fish: 'Pêcher', animal: 'Observer', res: 'Récolter', hidden: 'Examiner', lore: 'Examiner', boat: 'Embarquer' };
  function interactables() {
    const list = map.ents.filter(e => visible(e) && (e.kind !== 'hidden' || Math.hypot(e.x - player.x, e.y - player.y) < 3.2));
    list.push({ kind: 'boat', id: 'boat', x: map.D.boat.x, y: map.D.boat.y - 1.3 });
    return list;
  }
  function findNear() {
    let best = null, bd = 1.75;
    for (const e of interactables()) { const d = Math.hypot(e.x + 0.5 - player.x, e.y + 0.5 - player.y); if (d < bd) { bd = d; best = e; } }
    return best;
  }
  function labelFor(e) {
    if (e.kind === 'npc') return 'Parler à ' + G.D.characters[e.id].name.split(' ')[0];
    if (e.kind === 'res') return 'Récolter : ' + G.D.resources[e.res].name;
    if (e.kind === 'animal') return 'Observer : ' + (G.state.codex.animals[e.species] ? G.D.animals[e.species].name : 'animal inconnu');
    if (e.kind === 'dig' && cooldownLeft(e) > 0) return 'Fouillé (' + Math.ceil(cooldownLeft(e) / 60000) + ' min)';
    if (e.kind === 'fish' && cooldownLeft(e) > 0) return 'Les poissons se cachent (' + Math.ceil(cooldownLeft(e) / 60000) + ' min)';
    if (e.kind === 'fish') return e.table === 'mer' ? 'Pêcher en mer' : 'Pêcher dans la lagune';
    return LABELS[e.kind];
  }
  function interact(e) {
    if (!e) return;
    player.path = []; player.pending = null;
    const S = G.state, isl = S.islands[map.id];
    switch (e.kind) {
      case 'npc': G.UI.npcDialog(e.id); break;
      case 'boat': G.UI.confirm('Rentrer sur votre île ?', 'Le Capitaine Mérou vous ramène au port. Vous pourrez revenir quand vous voulez.', 'Rentrer', () => G.UI.goHome()); break;
      case 'dig':
        if (cooldownLeft(e) > 0) { G.UI.toast('Ce carré a déjà été fouillé. Revenez dans ' + Math.ceil(cooldownLeft(e) / 60000) + ' min.', '⛏️'); return; }
        G.Mini.dig(e.table, () => { setCooldown(e, COOLDOWN.dig); G.Game.counter('dig'); G.State.save(true); });
        break;
      case 'fish': {
        if (cooldownLeft(e) > 0) { G.UI.toast('Les poissons se sont cachés. Revenez dans ' + Math.ceil(cooldownLeft(e) / 60000) + ' min.', '🎣'); return; }
        G.Mini.fish(e.table, caught => {
          const n = nodes()[e.id] = nodes()[e.id] || {}; n.casts = (n.casts || 0) + 1;
          if (n.casts >= 3) { n.casts = 0; n.until = Date.now() + COOLDOWN.fishRest * 60000; }
          G.State.save();
        });
        break;
      }
      case 'animal':
        G.Mini.approach(e.species, ok => {
          if (!ok) { setCooldown(e, 1); return; }
          const sp = G.D.animals[e.species]; const isNew = G.Game.discover('animals', e.species);
          if (isNew) { const d = G.Game.addDisc(15, true); G.Game.counter('identified'); G.Game.notify('Espèce identifiée : ' + sp.name + ' (+' + d + ' découverte)', '🔍', 'good'); G.Sys.Missions.checkIsland(map.id); }
          G.UI.adoptDialog(e.species, adopted => { if (adopted) setCooldown(e, COOLDOWN.animal); });
        });
        break;
      case 'res': {
        const n = U.randi(1, 2); G.Game.addRes(e.res, n); G.Game.counter('harvest', n);
        G.UI.toast('+' + n + ' ' + G.D.resources[e.res].name, '🧺', 'good'); floatText('+' + n, e);
        setCooldown(e, COOLDOWN.res); G.State.save(); break;
      }
      case 'hidden': {
        isl.done[e.id] = Date.now(); const isNew = G.Game.addItem(e.item); const d = G.Game.addDisc(10, true);
        G.UI.itemFound(e.item, 'Objet caché découvert !', '+' + d + ' découverte'); G.State.save(true); break;
      }
      case 'lore': {
        const first = !isl.done[e.id]; isl.done[e.id] = isl.done[e.id] || Date.now();
        let rw = '';
        if (first && e.reward) { const r = Object.assign({}, e.reward); if (r.disc) { G.Game.addDisc(r.disc, true); delete r.disc; rw = '🔍 +' + e.reward.disc + ' découverte '; } rw += G.Game.grant(r, true); G.Game.discover('lore', e.id); }
        G.UI.loreDialog(e.title, e.text, first ? rw : '(déjà consigné dans votre carnet)'); G.State.save(); break;
      }
    }
  }
  const floats = [];
  function floatText(txt, e) { floats.push({ txt, x: (e.x + 0.5) * TS, y: e.y * TS, t: 1.2 }); }

  /* ================= BOUCLE ================= */
  function step(dt) {
    let dx = 0, dy = 0;
    if (keys.ArrowLeft || keys.q || keys.a) dx--; if (keys.ArrowRight || keys.d) dx++; if (keys.ArrowUp || keys.z || keys.w) dy--; if (keys.ArrowDown || keys.s) dy++;
    const speed = 4.2;
    player.moving = false;
    if (dx || dy) {
      player.path = []; player.pending = null;
      const l = Math.hypot(dx, dy); const nx = player.x + dx / l * speed * dt, ny = player.y + dy / l * speed * dt;
      const r = 0.28; const okAt = (x, y) => walkable(Math.floor(x - r), Math.floor(y)) && walkable(Math.floor(x + r), Math.floor(y)) && walkable(Math.floor(x), Math.floor(y - r * 0.6)) && walkable(Math.floor(x), Math.floor(y + r * 0.4));
      if (okAt(nx, player.y)) player.x = nx; if (okAt(player.x, ny)) player.y = ny;
      if (dx) player.facing = dx > 0 ? 1 : -1; player.moving = true;
    } else if (player.path.length) {
      const p = player.path[0]; const tx = p.x + 0.5, ty = p.y + 0.6; const ddx = tx - player.x, ddy = ty - player.y; const d = Math.hypot(ddx, ddy);
      if (d < speed * dt) { player.x = tx; player.y = ty; player.path.shift(); if (!player.path.length && player.pending) { const e = player.pending; player.pending = null; if (Math.hypot(e.x + 0.5 - player.x, e.y + 0.5 - player.y) < 2) interact(e); } }
      else { player.x += ddx / d * speed * dt; player.y += ddy / d * speed * dt; if (Math.abs(ddx) > 0.05) player.facing = ddx > 0 ? 1 : -1; }
      player.moving = true;
    }
    // zones
    const z = inZone(Math.floor(player.x), Math.floor(player.y));
    if (z && (!currentZone || currentZone.id !== z.id)) {
      currentZone = z; G.UI.exploreZone(def.name, z.name);
      const isl = G.state.islands[map.id];
      if (!isl.zones[z.id] && (z.id !== 'grotte' || inCave(player.x, player.y))) {
        isl.zones[z.id] = Date.now(); G.Game.discover('zones', map.id + ':' + z.id);
        const d = G.Game.addDisc(5, true); G.Game.notify('Zone découverte : ' + z.name + ' (+' + d + ')', '🗺️', 'good');
        G.Sys.Missions.checkIsland(map.id); G.State.save();
      }
    }
    if (z && z.id === 'grotte' && !G.state.islands[map.id].zones.grotte && inCave(player.x, player.y)) currentZone = null;
    nearTarget = findNear();
    G.UI.exploreAction(nearTarget ? labelFor(nearTarget) : null);
    for (const f of floats) { f.t -= dt; f.y -= 20 * dt; }
    while (floats.length && floats[0].t <= 0) floats.shift();
  }

  function render() {
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = def.palette.deep; c.fillRect(0, 0, vw, vh);
    cam.x += ((player.x * TS) - cam.x) * 0.15; cam.y += ((player.y * TS) - cam.y) * 0.15;
    const hw = vw / 2 / cam.z, hh = vh / 2 / cam.z;
    cam.x = U.clamp(cam.x, hw, map.W * TS - hw); cam.y = U.clamp(cam.y, hh, map.H * TS - hh);
    c.save(); c.translate(vw / 2, vh / 2); c.scale(cam.z, cam.z); c.translate(-Math.round(cam.x), -Math.round(cam.y));
    c.drawImage(bg, 0, 0);
    const x0 = Math.max(0, Math.floor((cam.x - hw) / TS) - 1), x1 = Math.min(map.W - 1, Math.ceil((cam.x + hw) / TS) + 1);
    const y0 = Math.max(0, Math.floor((cam.y - hh) / TS) - 1), y1 = Math.min(map.H - 1, Math.ceil((cam.y + hh) / TS) + 2);
    // eau et lave animées
    c.fillStyle = 'rgba(255,255,255,.45)';
    for (const [x, y, ph] of waterSparkles) { if (x < x0 || x > x1 || y < y0 || y > y1) continue; const a = (Math.sin(t * 2 + ph) + 1) / 2; c.globalAlpha = a * 0.6; c.fillRect(x * TS + 8 + Math.sin(t + ph) * 4, y * TS + 14, 10, 2); }
    c.globalAlpha = 1;
    for (const [x, y] of lavaTiles) { if (x < x0 || x > x1 || y < y0 || y > y1) continue; c.fillStyle = 'rgba(255,220,90,' + (0.25 + 0.2 * Math.sin(t * 3 + x * 1.7 + y)) + ')'; c.beginPath(); c.arc(x * TS + 16, y * TS + 16, 9, 0, 6.28); c.fill(); }
    // porte de la grotte
    if (map.cave && !G.state.flags[map.cave.flag]) { const gx = map.cave.gate[0] * TS, gy = map.cave.gate[1] * TS; A.rock(c, gx + 16, gy + 30, 1.4, '#6d625a'); A.rock(c, gx + 44, gy + 28, 1.2, '#7d726a'); }
    // objets triés
    const items = [];
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const v = map.tiles[y * map.W + x]; const px = x * TS + 16, py = y * TS + 28;
      if (v === T.TREE) items.push({ y: py, f: () => map.base[y * map.W + x] === T.SAND ? A.palm(c, px, py, 0.95, t) : A.tree(c, px, py, 1, '#4f9a46', t) });
      else if (v === T.JTREE) items.push({ y: py, f: () => ((x * 7 + y * 3) % 3 === 0 ? A.tree(c, px, py, 1.15, '#2f7a3a', t) : A.fern(c, px, py, 1.5, '#3c8a3a', t)) });
      else if (v === T.ROCK) items.push({ y: py, f: () => A.rock(c, px, py, 1.1, map.base[y * map.W + x] === T.LAVAROCK ? '#5a4c46' : '#9a948d') });
    }
    for (const [hx, hy] of map.D.huts) if (hx >= x0 - 2 && hx <= x1 && hy >= y0 - 2 && hy <= y1) items.push({ y: (hy + 2) * TS, f: () => drawHut((hx + 1) * TS, (hy + 2) * TS - 4) });
    for (const e of map.ents) { if (!visible(e) || e.x < x0 - 1 || e.x > x1 + 1 || e.y < y0 - 1 || e.y > y1 + 1) continue; items.push({ y: e.y * TS + 26, f: () => drawEnt(e) }); }
    const B = map.D.boat; items.push({ y: B.y * TS, f: () => drawBoat(B.x * TS, B.y * TS) });
    items.push({ y: player.y * TS, f: () => A.drawChar(c, PLAYER_LOOK, player.x * TS, player.y * TS, 1, t, player.moving, player.facing) });
    items.sort((p, q) => p.y - q.y); for (const it of items) it.f();
    // toit de la grotte quand on est dehors
    const insideCave = inCave(player.x, player.y);
    if (map.cave && !insideCave) { const cv0 = map.cave; c.fillStyle = '#3a2f2b'; c.fillRect((cv0.x0 + 1) * TS, (cv0.y0 + 1) * TS, (cv0.x1 - cv0.x0 - 1) * TS, (cv0.y1 - cv0.y0 - 1) * TS); c.fillStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i < 20; i++) { c.beginPath(); c.ellipse((cv0.x0 + 1.5 + (i * 7) % (cv0.x1 - cv0.x0 - 2)) * TS, (cv0.y0 + 1.5 + (i * 3) % (cv0.y1 - cv0.y0 - 2)) * TS, 18, 10, 0, 0, 6.28); c.fill(); } c.fillStyle = '#f2e6cc'; c.font = 'bold 14px Georgia, serif'; c.textAlign = 'center'; c.fillText(G.state.flags[cv0.flag] ? 'Grotte aux Échos' : 'Grotte aux Échos (fermée)', (cv0.x0 + cv0.x1) / 2 * TS + 16, (cv0.y0 + cv0.y1) / 2 * TS); c.textAlign = 'left'; }
    // indicateur de cible
    if (nearTarget) { const e = nearTarget; c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 2; c.setLineDash([4, 4]); c.lineDashOffset = -t * 10; c.beginPath(); c.ellipse(e.x * TS + 16, e.y * TS + 26, 18, 7, 0, 0, 6.28); c.stroke(); c.setLineDash([]); }
    for (const f of floats) { c.globalAlpha = Math.min(1, f.t); c.fillStyle = '#fff'; c.font = 'bold 14px system-ui'; c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 3; c.strokeText(f.txt, f.x, f.y); c.fillText(f.txt, f.x, f.y); c.globalAlpha = 1; }
    c.restore();
    if (insideCave) {
      const sx = vw / 2 + (player.x * TS - cam.x) * cam.z, sy = vh / 2 + (player.y * TS - 14 - cam.y) * cam.z;
      const gr = c.createRadialGradient(sx, sy, 30 * cam.z, sx, sy, 190 * cam.z); gr.addColorStop(0, 'rgba(10,5,0,0)'); gr.addColorStop(1, 'rgba(10,5,0,.82)');
      c.fillStyle = gr; c.fillRect(0, 0, vw, vh);
    }
  }
  function drawHut(x, y) {
    A.shadow(c, x, y, 32, 8); c.fillStyle = '#a5784c'; c.fillRect(x - 26, y - 26, 52, 26);
    c.fillStyle = '#4a3020'; A.rr(c, x - 8, y - 20, 16, 20, 6); c.fill();
    A.poly(c, [x - 34, y - 24, x, y - 60, x + 34, y - 24], '#c9a45a'); c.strokeStyle = 'rgba(120,90,40,.5)'; c.lineWidth = 1; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(x, y - 60); c.lineTo(x + i * 10, y - 24); c.stroke(); }
  }
  function drawBoat(x, y) {
    const by = y + Math.sin(t * 2) * 1.5; c.save(); c.translate(x, by);
    A.poly(c, [-40, -8, 40, -8, 30, 8, -32, 8], '#8a4f2e'); c.fillStyle = '#fff'; c.fillRect(-36, -6, 72, 3);
    c.strokeStyle = '#5a3b20'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(8, -8); c.lineTo(8, -60); c.stroke();
    A.poly(c, [10, -56, 36, -14, 10, -14], '#fbf6e9'); A.poly(c, [6, -52, -14, -18, 6, -18], '#f0e4c8');
    c.restore();
  }
  function drawEnt(e) {
    const px = e.x * TS + 16, py = e.y * TS + 26;
    switch (e.kind) {
      case 'npc': {
        const d = G.D.characters[e.id]; A.drawChar(c, d.look, px, py, 1.05, t + e.x, false, player.x < e.x + 0.5 ? -1 : 1);
        const dlg = G.Sys.Missions.dialogue(e.id); const mark = dlg.mode === 'turnin' ? ['?', '#f2b632'] : dlg.mode === 'offer' ? ['!', '#f2b632'] : dlg.mode === 'waiting' ? ['…', '#9ab'] : null;
        if (mark) { const my = py - 50 + Math.sin(t * 4) * 2; A.circ(c, px, my, 9, mark[1]); c.fillStyle = '#fff'; c.font = 'bold 13px system-ui'; c.textAlign = 'center'; c.fillText(mark[0], px, my + 4.5); c.textAlign = 'left'; }
        c.font = '600 10px system-ui'; c.textAlign = 'center'; const nm = d.name; const w = c.measureText(nm).width + 8; c.fillStyle = 'rgba(255,255,255,.85)'; A.rr(c, px - w / 2, py + 4, w, 13, 6); c.fill(); c.fillStyle = '#3a2f4a'; c.fillText(nm, px, py + 14); c.textAlign = 'left';
        break;
      }
      case 'dig': {
        const used = cooldownLeft(e) > 0; A.ell(c, px, py - 4, 15, 6, used ? 'rgba(90,60,30,.35)' : '#9a6f45');
        if (!used) { c.strokeStyle = '#5a3b20'; c.lineWidth = 3; c.beginPath(); c.moveTo(px - 7, py - 10); c.lineTo(px + 7, py + 1); c.moveTo(px + 7, py - 10); c.lineTo(px - 7, py + 1); c.stroke(); for (const [sx, sy] of [[-14, -6], [14, -6]]) { c.fillStyle = '#e8d9b8'; c.fillRect(px + sx - 1, py + sy - 14, 2, 14); c.fillStyle = '#e04b3a'; c.fillRect(px + sx, py + sy - 14, 6, 4); } }
        break;
      }
      case 'fish': {
        const [ox, oy] = e.waterDir; const wx = px + ox * 26, wy = py - 6 + oy * 22;
        if (cooldownLeft(e) <= 0) { c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 1.5; for (let i = 0; i < 2; i++) { const r = ((t * 12 + i * 9) % 18); c.globalAlpha = 1 - r / 18; c.beginPath(); c.ellipse(wx, wy, r, r * 0.45, 0, 0, 6.28); c.stroke(); } c.globalAlpha = 1; }
        c.fillStyle = '#7a5434'; c.fillRect(px - 2, py - 26, 4, 24); c.fillStyle = '#e8d9b8'; A.rr(c, px - 12, py - 34, 24, 12, 3); c.fill(); A.drawFish(c, 'poisson_poumon', px, py - 28, 0.45, 0, 1);
        break;
      }
      case 'animal': {
        const ox = Math.sin(t * 0.4 + e.x) * 10, st = Math.sin(t * 0.4 + e.x) > 0.95 ? 'walk' : 'idle';
        A.drawAnimal(c, e.species, px + ox, py, 0.9, t + e.x, Math.cos(t * 0.4 + e.x) > 0 ? 1 : -1, st);
        if (!G.state.codex.animals[e.species]) { c.fillStyle = '#fff'; c.font = 'bold 12px system-ui'; c.textAlign = 'center'; c.fillText('?', px + ox, py - 44); c.textAlign = 'left'; }
        break;
      }
      case 'res': {
        const r = e.res;
        if (r === 'baies') A.bush(c, px, py, 1, '#4f8f3e', '#5b4bb5');
        else if (r === 'herbes') { A.fern(c, px, py, 0.9, '#6fb85a', t); A.circ(c, px, py - 14, 2.5, '#f6e27a'); }
        else if (r === 'bois') { A.shadow(c, px, py, 14, 4); c.fillStyle = '#8a5a35'; A.rr(c, px - 14, py - 9, 28, 7, 3); c.fill(); A.rr(c, px - 10, py - 15, 22, 7, 3); c.fill(); A.ell(c, px + 13, py - 6, 3, 3.5, '#d9b07a'); }
        else if (r === 'pierre') { A.rock(c, px - 5, py, 0.7, '#a7a19a'); A.rock(c, px + 6, py, 0.6, '#8f8a85'); }
        else if (r === 'resine') { c.fillStyle = '#6e4a2a'; A.rr(c, px - 8, py - 26, 16, 26, 4); c.fill(); c.fillStyle = '#f0a020'; A.ell(c, px + 3, py - 14, 3.5, 5 + Math.sin(t * 2), '#f0a020'); }
        else if (r === 'ocre') { A.rock(c, px, py, 0.9, '#b5432c'); }
        break;
      }
      case 'hidden': { const a = (Math.sin(t * 5) + 1) / 2; c.fillStyle = 'rgba(255,250,200,' + (0.5 + a * 0.5) + ')'; c.save(); c.translate(px, py - 10); c.rotate(t); for (let i = 0; i < 4; i++) { c.rotate(Math.PI / 2); c.beginPath(); c.moveTo(0, 0); c.lineTo(2, 8 + a * 3); c.lineTo(-2, 8 + a * 3); c.fill(); } c.restore(); break; }
      case 'lore': { const seen = G.state.islands[map.id].done[e.id]; c.fillStyle = '#7a5434'; c.fillRect(px - 2, py - 26, 4, 26); c.fillStyle = seen ? '#cdbb98' : '#f2e2b8'; A.rr(c, px - 12, py - 36, 24, 14, 3); c.fill(); c.fillStyle = '#5a3b20'; c.font = 'bold 10px Georgia'; c.textAlign = 'center'; c.fillText(seen ? '✓' : '?', px, py - 25); c.textAlign = 'left'; break; }
    }
  }
  function loop(ts) {
    if (!running) return; raf = requestAnimationFrame(loop);
    const dt = Math.min(0.1, (ts - (lastT || ts)) / 1000); lastT = ts; t += dt;
    if (!G.UI.modalOpen()) step(dt); else { player.moving = false; }
    render();
  }

  /* ================= ENTRÉES ================= */
  function resize() { const r = cv.getBoundingClientRect(); dpr = Math.min(window.devicePixelRatio || 1, G.state.settings.lowPower ? 1 : 2); vw = r.width; vh = r.height; cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr); cam.z = vw < 700 ? 1.05 : 1.35; }
  function onTap(e) {
    if (G.UI.modalOpen()) return;
    const r = cv.getBoundingClientRect(); const wx = (e.clientX - r.left - vw / 2) / cam.z + cam.x, wy = (e.clientY - r.top - vh / 2) / cam.z + cam.y;
    const tx = Math.floor(wx / TS), ty = Math.floor(wy / TS);
    // clic sur une entité ?
    let target = null, bd = 1.3;
    for (const en of interactables()) { const d = Math.hypot(en.x + 0.5 - wx / TS, en.y + 0.5 - (wy + 10) / TS); if (d < bd) { bd = d; target = en; } }
    if (target && Math.hypot(target.x + 0.5 - player.x, target.y + 0.5 - player.y) < 1.8) { interact(target); return; }
    let gx = tx, gy = ty;
    if (target) { // aller sur une case voisine accessible
      const cands = [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]].map(([ox, oy]) => [target.x + ox, target.y + oy]).filter(([x, y]) => walkable(x, y));
      cands.sort((a, b) => Math.hypot(a[0] - player.x, a[1] - player.y) - Math.hypot(b[0] - player.x, b[1] - player.y));
      if (!cands.length) return; [gx, gy] = cands[0];
    }
    if (!walkable(gx, gy)) return;
    const path = U.astar(walkable, map.W, map.H, Math.floor(player.x), Math.floor(player.y), gx, gy);
    if (path) { player.path = path; player.pending = target; }
  }
  function goToBoat() {
    const B = map.D.dock; const gx = B.x, gy = B.y1 - 1;
    const path = U.astar(walkable, map.W, map.H, Math.floor(player.x), Math.floor(player.y), gx, gy, 20000);
    if (path) { player.path = path; player.pending = { kind: 'boat', id: 'boat', x: map.D.boat.x, y: map.D.boat.y - 1.3 }; } else interact({ kind: 'boat' });
  }

  function init(canvas) {
    cv = canvas; c = cv.getContext('2d');
    cv.addEventListener('pointerup', onTap);
    window.addEventListener('keydown', e => {
      if (!running || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; keys[k] = true;
      if ((k === ' ' || k === 'e' || k === 'Enter') && !G.UI.modalOpen() && nearTarget) { e.preventDefault(); interact(nearTarget); }
      if (k.startsWith('Arrow') || k === ' ') e.preventDefault();
    });
    window.addEventListener('keyup', e => { keys[e.key.length === 1 ? e.key.toLowerCase() : e.key] = false; });
    window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
    window.addEventListener('resize', () => running && resize());
  }
  function start(islandId) {
    def = G.D.islands[islandId]; map = generate(islandId); buildStatic();
    const ex = G.state.explore;
    if (ex.island === islandId && ex.x != null && walkable(Math.floor(ex.x), Math.floor(ex.y))) { player.x = ex.x; player.y = ex.y; }
    else { player.x = map.D.start.x + 0.5; player.y = map.D.start.y + 0.6; }
    player.path = []; currentZone = null; G.state.islands[islandId].visits++;
    running = true; cv.style.display = 'block'; resize(); cam.x = player.x * TS; cam.y = player.y * TS; lastT = 0;
    raf = requestAnimationFrame(loop);
  }
  function stop() {
    if (map) { G.state.explore = { island: map.id, x: player.x, y: player.y }; }
    running = false; cancelAnimationFrame(raf); cv.style.display = 'none'; for (const k in keys) keys[k] = false;
  }
  function act() { if (nearTarget) interact(nearTarget); }

  return { init, start, stop, act, goToBoat, isRunning: () => running, generate, _player: player, _interact: interact, _ents: () => map && map.ents, _walkable: (x, y) => walkable(x, y) };
})();
