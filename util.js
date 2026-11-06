/* ARCHIPEL — utilitaires communs (espace de noms global G) */
window.G = window.G || {};
G.D = G.D || {};      // données
G.Sys = G.Sys || {};  // systèmes
G.Screens = G.Screens || {};

G.U = (() => {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  const rand = (a, b) => a + Math.random() * (b - a);
  const randi = (a, b) => Math.floor(rand(a, b + 1));
  const pick = (arr, r = Math.random) => arr[Math.floor(r() * arr.length)];
  function weighted(list, wf, r = Math.random) {
    let tot = 0; for (const x of list) tot += Math.max(0, wf(x));
    if (tot <= 0) return null;
    let v = r() * tot;
    for (const x of list) { v -= Math.max(0, wf(x)); if (v <= 0) return x; }
    return list[list.length - 1];
  }
  function shuffle(arr, r = Math.random) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const uid = (p = 'u') => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => Math.floor(n).toLocaleString('fr-FR');
  const pct = v => Math.round(v * 100) + ' %';

  /* Bus d'événements : relie les systèmes entre eux */
  const listeners = {};
  const on = (ev, fn) => { (listeners[ev] = listeners[ev] || []).push(fn); };
  const emit = (ev, data) => { (listeners[ev] || []).forEach(fn => { try { fn(data); } catch (e) { console.error('[evt ' + ev + ']', e); } }); };

  /* Dates & semaines (Gazette) — la semaine commence le lundi, heure locale */
  function mondayOf(d) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); return x; }
  function weekIndex(d = new Date()) { const m = mondayOf(d); return Math.round((Date.UTC(m.getFullYear(), m.getMonth(), m.getDate()) - Date.UTC(2024, 0, 1)) / (7 * 864e5)); }
  function weekDate(i) { const t = new Date(Date.UTC(2024, 0, 1) + i * 7 * 864e5); return new Date(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()); }
  const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const dateFr = d => d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  function seasonOf(d = new Date()) { const m = d.getMonth(); if (m >= 2 && m <= 4) return 'printemps'; if (m >= 5 && m <= 7) return 'ete'; if (m >= 8 && m <= 10) return 'automne'; return 'hiver'; }

  /* A* sur grille (exploration) */
  function astar(grid, w, h, sx, sy, tx, ty, maxIter = 6000) {
    const key = (x, y) => y * w + x;
    if (sx === tx && sy === ty) return [];
    const open = [{ x: sx, y: sy, g: 0, f: 0 }];
    const came = new Map(); const gScore = new Map([[key(sx, sy), 0]]);
    const closed = new Set(); let it = 0;
    while (open.length && it++ < maxIter) {
      let bi = 0; for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
      const cur = open.splice(bi, 1)[0]; const ck = key(cur.x, cur.y);
      if (cur.x === tx && cur.y === ty) {
        const path = []; let k = ck;
        while (came.has(k)) { path.push({ x: k % w, y: Math.floor(k / w) }); k = came.get(k); }
        return path.reverse();
      }
      closed.add(ck);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const nx = cur.x + dx, ny = cur.y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        if (!grid(nx, ny) && !(nx === tx && ny === ty && false)) continue;
        if (dx && dy && (!grid(cur.x + dx, cur.y) || !grid(cur.x, cur.y + dy))) continue;
        const nk = key(nx, ny); if (closed.has(nk)) continue;
        const g = cur.g + (dx && dy ? 1.414 : 1);
        if (g < (gScore.get(nk) ?? Infinity)) {
          gScore.set(nk, g); came.set(nk, ck);
          open.push({ x: nx, y: ny, g, f: g + Math.hypot(tx - nx, ty - ny) });
        }
      }
    }
    return null;
  }

  function deepFill(target, def) {
    // complète target avec les clés manquantes de def (migration de sauvegarde)
    for (const k in def) {
      if (target[k] === undefined) target[k] = JSON.parse(JSON.stringify(def[k]));
      else if (def[k] && typeof def[k] === 'object' && !Array.isArray(def[k]) && target[k] && typeof target[k] === 'object' && !Array.isArray(target[k])) deepFill(target[k], def[k]);
    }
    return target;
  }

  function throttle(fn, ms) { let last = 0, t = null; return (...a) => { const now = Date.now(); if (now - last >= ms) { last = now; fn(...a); } else if (!t) { t = setTimeout(() => { t = null; last = Date.now(); fn(...a); }, ms - (now - last)); } }; }

  return { clamp, lerp, dist, mulberry32, hashStr, rand, randi, pick, weighted, shuffle, uid, esc, fmt, pct, on, emit, mondayOf, weekIndex, weekDate, dateFr, seasonOf, astar, deepFill, throttle };
})();
