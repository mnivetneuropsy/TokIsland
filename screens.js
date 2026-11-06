/* ARCHIPEL — contenus des menus (Explorer, Gestion, Collections, Gazette, Paramètres) */

G.Screens = (() => {
  const U = G.U, E = U.esc, S = () => G.state, Art = () => G.Art;
  let live = [];
  let selIsland = 'prehistorique', selHab = 0, selTank = 0;
  const adForm = { kind: 'affiches', type: 'recette', target: '' };
  const panelPens = {}, panelTanks = {};

  function unmount() { live.forEach(l => cancelAnimationFrame(l.raf)); live = []; }
  function loopCanvas(cv, draw) {
    const l = { raf: 0 }; let last = 0, t = 0;
    const ctx = cv.getContext('2d');
    const fit = () => { const r = cv.getBoundingClientRect(); const d = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.max(1, r.width * d); cv.height = Math.max(1, r.height * d); ctx.setTransform(d, 0, 0, d, 0, 0); return r; };
    let r = fit();
    const f = ts => { if (!document.body.contains(cv)) return; const dt = Math.min(0.1, (ts - (last || ts)) / 1000); last = ts; t += dt; if (cv.width < 2) r = fit(); draw(ctx, r.width, r.height, dt, t); l.raf = requestAnimationFrame(f); };
    l.raf = requestAnimationFrame(f); live.push(l);
  }
  const img = (kind, id, n = 56) => '<img src="' + Art().icon(kind, id, n) + '" alt="">';
  const bar = (v, cls = '') => '<div class="bar ' + (cls || (v > 0.7 ? 'good' : v > 0.4 ? 'warn' : 'bad')) + '"><i style="width:' + Math.round(U.clamp(v, 0, 1) * 100) + '%"></i></div>';
  const lv = (n, max = 3) => '<span class="lv">' + Array.from({ length: max }, (_, i) => '<i class="' + (i < n ? 'on' : '') + '"></i>').join('') + '</span>';
  const stat = (v, l) => '<div class="stat"><b>' + v + '</b><span>' + l + '</span></div>';
  const rarDot = r => '<span class="rar" style="background:' + G.D.rarities[r].color + '"></span>';

  /* ================= EXPLORER ================= */
  function chartSvg() {
    const s = S(); let h = '<svg class="chart" viewBox="0 0 1000 560" role="img" aria-label="Carte maritime de l\'archipel">';
    h += '<defs><pattern id="wv" width="60" height="30" patternUnits="userSpaceOnUse"><path d="M0 15 q15 -8 30 0 t30 0" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="2"/></pattern></defs><rect width="1000" height="560" fill="#4f9fd0"/><rect width="1000" height="560" fill="url(#wv)"/>';
    h += '<g font-family="Georgia,serif" fill="#e9f4fb" opacity=".5" font-size="22"><text x="30" y="545">Mer des Brumes</text><text x="720" y="545">Océan d\'Azur</text></g>';
    const home = { x: 520, y: 300 }; const order = G.D.islandOrder;
    const pt = id => G.D.islands[id].chart;
    let prev = home;
    order.forEach(id => { const p = pt(id); const on = s.islands[id].unlocked; h += '<path d="M' + prev.x + ' ' + prev.y + ' Q ' + ((prev.x + p.x) / 2 + 40) + ' ' + ((prev.y + p.y) / 2 - 40) + ' ' + p.x + ' ' + p.y + '" fill="none" stroke="' + (on ? '#fff8ec' : 'rgba(255,255,255,.35)') + '" stroke-width="4" stroke-dasharray="10 10"/>'; prev = p; });
    const blob = (x, y, r, col, sand) => '<ellipse cx="' + x + '" cy="' + (y + 6) + '" rx="' + (r + 10) + '" ry="' + (r * 0.7 + 8) + '" fill="rgba(255,255,255,.25)"/><ellipse cx="' + x + '" cy="' + y + '" rx="' + (r + 4) + '" ry="' + (r * 0.7 + 3) + '" fill="' + sand + '"/><ellipse cx="' + x + '" cy="' + (y - 2) + '" rx="' + r + '" ry="' + (r * 0.68) + '" fill="' + col + '"/>';
    h += '<g class="isl" data-act="home">' + blob(home.x, home.y, 62, '#8cc663', '#efdba6') + '<text x="' + home.x + '" y="' + (home.y + 8) + '" font-size="34" text-anchor="middle">🏛️</text><text x="' + home.x + '" y="' + (home.y + 72) + '" font-size="18" font-weight="700" text-anchor="middle" fill="#fff">Votre île</text></g>';
    order.forEach(id => {
      const d = G.D.islands[id], p = d.chart, st = s.islands[id];
      const col = st.unlocked ? (d.palette.grass || '#8cc663') : '#9aa6ad';
      h += '<g class="isl" data-act="island" data-id="' + id + '" style="cursor:pointer">' + blob(p.x, p.y, 48, col, st.unlocked ? (d.palette.sand || '#efdba6') : '#c3c9cc');
      h += '<text x="' + p.x + '" y="' + (p.y + 10) + '" font-size="32" text-anchor="middle" opacity="' + (st.unlocked ? 1 : 0.6) + '">' + (st.unlocked ? d.icon : '🔒') + '</text>';
      h += '<text x="' + p.x + '" y="' + (p.y + 62) + '" font-size="17" font-weight="700" text-anchor="middle" fill="#fff" stroke="rgba(0,0,0,.35)" stroke-width="3" paint-order="stroke">' + E(d.short) + '</text>';
      if (id === selIsland) h += '<ellipse cx="' + p.x + '" cy="' + p.y + '" rx="66" ry="48" fill="none" stroke="#e9b949" stroke-width="4" stroke-dasharray="8 6"/>';
      if (st.completed) h += '<text x="' + (p.x + 40) + '" y="' + (p.y - 26) + '" font-size="22">⭐</text>';
      h += '</g>';
    });
    return h + '</svg>';
  }
  function passportHtml(island) {
    const pp = G.Sys.Missions.passport(island);
    return pp.rows.map(r => '<div style="margin:6px 0"><div class="row between small"><span>' + (r.cur >= r.n ? '✅' : '🔸') + ' ' + r.label + '</span><b>' + r.cur + ' / ' + r.n + '</b></div>' + bar(r.cur / r.n, r.cur >= r.n ? 'good' : '') + (r.detail ? '<div class="muted small">' + r.detail.map(E).join(' · ') + '</div>' : '') + '</div>').join('')
      + (pp.complete ? '<p class="tag good">Passeport complet ! Carte maritime obtenue.</p>' : '<p class="muted small">Terminez ces objectifs pour obtenir la carte maritime vers l\'île suivante. Les objets rares ne sont pas obligatoires.</p>');
  }
  function missionsHtml(island) {
    const M = G.Sys.Missions; const ids = Object.keys(G.D.missions).filter(id => M.M(id).island === island);
    const block = (title, list, fn) => list.length ? '<h4>' + title + '</h4>' + list.map(fn).join('') : '';
    const giver = id => E(G.D.characters[M.M(id).giver].name);
    return block('En cours', ids.filter(M.isActive), id => '<div class="card"><b>' + E(M.M(id).title) + '</b>' + (M.ready(id) ? ' <span class="tag good">Prête à rendre</span>' : '') + '<div class="small muted">Donnée par ' + giver(id) + '</div>' + G.UI.objectivesHtml(id) + '<div class="small muted">Récompense : ' + G.UI.rewardText(M.M(id).reward) + '</div></div>')
      + block('Disponibles', ids.filter(M.isAvailable), id => '<div class="list-item"><span style="font-size:22px">❗</span><div class="grow small"><b>' + E(M.M(id).title) + '</b><br>Parlez à ' + giver(id) + '</div></div>')
      + block('Accomplies', ids.filter(M.isDone), id => '<div class="list-item"><span style="font-size:22px">🏆</span><div class="grow small"><b>' + E(M.M(id).title) + '</b></div></div>')
      + block('Verrouillées', ids.filter(id => !M.st(id) && !M.isAvailable(id)), id => '<div class="list-item" style="opacity:.6"><span style="font-size:22px">🔒</span><div class="grow small"><b>' + E(M.M(id).title) + '</b><br>Après : ' + M.M(id).requires.map(r => E(M.M(r).title)).join(', ') + '</div></div>');
  }
  function explorer() {
    const d = G.D.islands[selIsland], st = S().islands[selIsland];
    let det = '<div class="card"><h3>' + d.icon + ' ' + E(d.name) + '</h3><p class="muted">' + E(d.desc) + '</p>';
    if (st.unlocked && d.playable) {
      det += '<button class="btn block warn" data-act="embark" data-id="' + selIsland + '">⛵ Embarquer avec le Capitaine Mérou</button><h4>📘 Passeport</h4>' + passportHtml(selIsland) + '</div><div class="card"><h3>📜 Missions</h3>' + missionsHtml(selIsland) + '</div>';
    } else if (st.unlocked) {
      det += '<p class="tag good">🗺️ Carte maritime obtenue !</p><p>Cette île est débloquée : son contenu explorable arrive dans une prochaine mise à jour.</p>' + planned(d) + '</div>';
    } else {
      const prevId = G.D.islandOrder[G.D.islandOrder.indexOf(selIsland) - 1];
      det += '<p><span class="tag bad">🔒 Verrouillée</span> Terminez le passeport de l\'' + E(G.D.islands[prevId].name) + ' pour obtenir la carte maritime.</p>' + planned(d) + '</div>';
    }
    return { html: chartSvg() + '<p class="muted small">Touchez une île sur la carte pour voir ses informations.</p>' + det, bind: { island: x => { selIsland = x.id; G.UI.renderPanel(); }, home: () => G.UI.closePanel(), embark: x => G.UI.embark(x.id) } };
  }
  function planned(d) {
    if (!d.planned) return '';
    const p = d.planned;
    return '<h4>Contenu prévu</h4><div class="small"><b>Zones :</b> ' + p.zones.map(E).join(' · ') + '<br><b>À découvrir :</b> ' + p.content.map(E).join(' · ') + '<br><b>Activités :</b> ' + p.activities.map(E).join(' · ') + '<br><b>Habitants :</b> ' + p.characters.map(E).join(' · ') + (p.note ? '<br><i>' + E(p.note) + '</i>' : '') + '</div>';
  }

  /* ================= GESTION ================= */
  function gestion(sub) { unmount(); return ({ museum, zoo, aquarium, bar: barPanel, ads, finances, staff, build })[sub](); }
  function bstats(k) { const b = S().bstats[k]; return stat(U.fmt(b.visits), 'Visites') + stat(Math.round(b.sat * 100) + ' %', 'Satisfaction') + stat(U.fmt(b.rev), 'Recettes 🪙') + stat(Math.floor(b.rep), 'Réputation'); }

  /* ---- Musée ---- */
  function museum() {
    const M = G.Sys.Museum; const rooms = M.rooms(); const lvl = G.Game.bLevel('museum');
    let h = '<div class="card"><div class="row between"><h3>🏛️ ' + E(G.Game.bLevelData('museum').label) + '</h3>' + lv(lvl) + '</div><div class="stats">' + stat(M.score(), 'Score d\'exposition') + bstats('museum') + '</div><p class="muted small">Exposez des objets fidèles au thème de chaque salle : la cohérence et les salles complètes augmentent la satisfaction. Les doublons lassent les visiteurs.</p></div>';
    // atelier
    h += '<div class="card"><h3>🦴 Atelier de restauration</h3>' + Object.keys(G.D.restorations).map(id => { const r = G.D.restorations[id]; const need = Object.keys(r.needs).map(k => (S().res[k] || 0) + '/' + r.needs[k] + ' ' + E(G.D.resources[k].name)).join(', '); const ok = M.canRestore(id); return '<div class="list-item">' + (S().codex.items[id] ? img('item', id, 44) : img('silhouette', 'item|' + id, 44)) + '<div class="grow small"><b>' + E(G.D.items[id].name) + '</b> ' + (G.Game.itemCount(id) ? '<span class="tag good">possédé ×' + G.Game.itemCount(id) + '</span>' : '') + '<br>Fragments : ' + need + '</div><button class="btn small ' + (ok ? '' : 'disabled') + '" data-act="restore" data-id="' + id + '">Restaurer</button></div>'; }).join('') + '<p class="muted small">Les fragments se trouvent en fouillant (site de fouilles, pied du volcan). Moins de coups au puzzle = meilleure qualité (★).</p></div>';
    for (let i = 0; i < 3; i++) {
      if (i >= rooms.length) { h += '<div class="card" style="opacity:.6"><h3>🔒 ' + M.ROOM_NAMES[i] + '</h3><p class="muted small">Débloquée au niveau ' + (i + 1) + ' du musée (Gestion › Bâtiments).</p></div>'; continue; }
      const r = rooms[i], sc = M.roomScore(i);
      h += '<div class="card"><div class="row between"><h3>' + M.ROOM_NAMES[i] + '</h3><span class="tag gold">Score ' + sc.score + '</span></div><div class="row small">Thème : <select class="inp" data-act="theme" data-r="' + i + '">' + Object.keys(G.D.categories).map(k => '<option value="' + k + '"' + (k === r.theme ? ' selected' : '') + '>' + G.D.categories[k].icon + ' ' + G.D.categories[k].name + '</option>').join('') + '</select><span class="grow"></span><button class="btn small alt" data-act="auto" data-r="' + i + '">✨ Arranger</button></div><div class="small" style="margin:6px 0">Cohérence ' + Math.round(sc.coherence * 100) + ' % ' + bar(sc.coherence) + '</div><div class="grid">';
      r.slots.forEach((id, si) => { h += id ? '<button class="tile ' + (G.D.items[id].cat === r.theme ? 'theme' : '') + '" data-act="slot" data-r="' + i + '" data-s="' + si + '">' + rarDot(G.D.items[id].rarity) + img('item', id) + E(G.D.items[id].name) + '</button>' : '<button class="tile empty" data-act="slot" data-r="' + i + '" data-s="' + si + '">＋<br>Vitrine libre</button>'; });
      h += '</div></div>';
    }
    const reserve = M.ownedIds();
    h += '<div class="card"><h3>📦 Réserve du musée</h3>' + (reserve.length ? '<div class="grid">' + reserve.map(id => '<button class="tile" data-act="res" data-id="' + id + '">' + rarDot(G.D.items[id].rarity) + '<span class="qty">' + M.available(id) + '/' + G.Game.itemCount(id) + '</span>' + img('item', id) + E(G.D.items[id].name) + '</button>').join('') + '</div><p class="muted small">x/y = disponibles / possédés. Les doublons peuvent être vendus.</p>' : '<p class="muted">Aucun objet. Partez en exploration !</p>') + '</div>';
    return { html: h, bind: {
      theme: (d, el) => M.setTheme(+d.r, el.value), auto: d => M.autoArrange(+d.r),
      restore: d => G.Mini.restore(d.id),
      slot: d => { const id = M.rooms()[d.r].slots[d.s]; if (id) G.UI.modal({ title: 'Vitrine', html: G.UI.itemCard(id), buttons: [{ label: 'Fermer' }, { label: 'Retirer de la vitrine', cls: 'warn', onClick: () => M.remove(+d.r, +d.s) }] }); else chooseItem(+d.r, +d.s); },
      res: d => { const id = d.id; const can = M.available(id) > 0 && G.Game.itemCount(id) > 1; G.UI.modal({ title: 'Réserve', html: G.UI.itemCard(id), buttons: [{ label: 'Fermer' }].concat(can ? [{ label: 'Vendre un doublon (+' + M.sellValue(id) + ' 🪙)', cls: 'gold', onClick: () => M.sell(id) }] : []) }); },
    } };
  }
  function chooseItem(ri, si) {
    const M = G.Sys.Museum; const theme = M.rooms()[ri].theme; const list = M.availableList().sort((a, b) => (G.D.items[b].cat === theme) - (G.D.items[a].cat === theme) || M.itemValue(b) - M.itemValue(a));
    G.UI.modal({ title: 'Choisir un objet à exposer', wide: true, html: list.length ? '<p class="muted small">Le liseré vert indique un objet fidèle au thème « ' + G.D.categories[theme].name + ' ».</p><div class="grid">' + list.map(id => '<button class="tile ' + (G.D.items[id].cat === theme ? 'theme' : '') + '" data-act="pick" data-id="' + id + '">' + rarDot(G.D.items[id].rarity) + img('item', id) + E(G.D.items[id].name) + '<span class="muted">Valeur ' + Math.round(M.itemValue(id)) + '</span></button>').join('') + '</div>' : '<p>Aucun objet disponible. Explorez l\'île préhistorique pour en trouver !</p>',
      onMount: (el, m) => G.UI.bind(el, { pick: d => { if (M.place(ri, si, d.id)) { m.close(); G.UI.toast(G.D.items[d.id].name + ' exposé(e) !', '🏛️', 'good'); } } }) });
  }

  /* ---- Zoo ---- */
  function zoo() {
    const Z = G.Sys.Zoo; const habs = Z.habitats(); selHab = Math.min(selHab, habs.length - 1);
    const h0 = habs[selHab]; const animals = Z.inHabitat(selHab); const w = Z.avgWelfare();
    let h = '<div class="card"><div class="row between"><h3>🦕 ' + E(G.Game.bLevelData('zoo').label) + '</h3>' + lv(G.Game.bLevel('zoo')) + '</div><div class="stats">' + stat(w === null ? '—' : Math.round(w * 100) + ' %', 'Bien-être moyen') + stat(Z.placed().length, 'Animaux exposés') + bstats('zoo') + '</div></div>';
    h += '<div class="subtabs" style="padding:0">' + habs.map((x, i) => '<button class="' + (i === selHab ? 'on' : '') + '" data-act="hab" data-i="' + i + '">' + E(x.name) + '</button>').join('') + (habs.length < 3 ? '<button disabled style="opacity:.5">🔒 Habitat ' + (habs.length + 1) + ' (niv. ' + (habs.length + 1) + ')</button>' : '') + '</div>';
    h += '<div class="card"><div class="row between"><h3>' + E(h0.name) + '</h3><select class="inp" data-act="biome">' + Object.keys(G.D.biomes).map(b => '<option value="' + b + '"' + (b === h0.biome ? ' selected' : '') + '>' + G.D.biomes[b].name + '</option>').join('') + '</select></div><canvas class="live-canvas" id="penCv"></canvas>';
    h += '<div class="row small" style="margin-top:8px"><span>🥕 Nourriture</span><div class="grow">' + bar(h0.food / 100) + '</div><button class="btn small" data-act="feed">Nourrir (' + Z.feedCost(selHab) + ' 🪙)</button></div>';
    h += '<div class="small muted">Capacité : ' + Z.used(selHab) + ' / ' + Z.capacity(h0) + ' (taille des animaux)</div>';
    h += Z.PARAMS.map(p => { const c = Z.upgradeCost(h0, p); const P = G.D.habitatParams[p]; return '<div class="row small" style="margin:6px 0"><span style="width:130px">' + P.icon + ' ' + P.name + '</span>' + lv(h0[p], 5) + '<span class="grow"></span>' + (h0[p] < 5 ? '<button class="btn small alt" data-act="up" data-p="' + p + '">+1 · ' + c.coins + ' 🪙' + (c.res ? ' + ' + Object.keys(c.res).map(k => c.res[k] + ' ' + G.D.resources[k].name.toLowerCase()).join('') : '') + '</button>' : '<span class="tag good">Max</span>') + '</div>'; }).join('');
    h += '</div><div class="card"><h3>Pensionnaires</h3>' + (animals.length ? animals.map(a => animalRow(a, true)).join('') : '<p class="muted">Aucun animal ici pour l\'instant.</p>') + '</div>';
    const res = Z.reserve();
    h += '<div class="card"><h3>📦 Réserve (' + res.length + ')</h3>' + (res.length ? res.map(a => animalRow(a, false)).join('') : '<p class="muted small">Observez des animaux pendant vos explorations pour les accueillir.</p>') + '</div>';
    return { html: h, bind: {
      hab: d => { selHab = +d.i; G.UI.renderPanel(); }, biome: (d, el) => { if (!Z.setBiome(selHab, el.value)) G.UI.renderPanel(); }, feed: () => Z.feed(selHab), up: d => Z.upgradeParam(selHab, d.p),
      place: d => Z.place(d.uid, selHab), remove: d => Z.remove(d.uid), release: d => G.UI.confirm('Relâcher cet animal ?', 'Il retournera vivre en liberté sur son île d\'origine.', 'Relâcher', () => Z.release(d.uid)),
      rename: d => { const a = Z.animal(d.uid); G.UI.modal({ title: 'Nommer ' + G.D.animals[a.sp].name, html: '<input class="inp" id="nm" maxlength="20" value="' + E(a.name || '') + '" placeholder="Nom">', buttons: [{ label: 'Annuler' }, { label: 'Valider', primary: true, onClick: () => Z.rename(d.uid, document.getElementById('nm').value.trim()) }] }); },
      info: d => showSpecies('animal', d.sp),
    }, mount: body => {
      const cv = body.querySelector('#penCv'); if (!cv) return;
      const pen = panelPens[selHab] = panelPens[selHab] || new G.Life.Pen();
      loopCanvas(cv, (c, W, H, dt, t) => {
        const hb = Z.habitats()[selHab]; if (!hb) return; const bi = G.D.biomes[hb.biome];
        c.fillStyle = bi.ground; c.fillRect(0, 0, W, H);
        c.fillStyle = 'rgba(0,0,0,.05)'; for (let i = 0; i < 30; i++) c.fillRect((i * 97) % W, (i * 41) % H, 8, 3);
        if (hb.eau > 0) { Art().ell(c, W - 60, 50, 20 + hb.eau * 8, 10 + hb.eau * 3, '#5bb6d6'); }
        for (let k = 0; k < hb.vegetation; k++) { const fx = 30 + (k * 83) % (W - 120), fy = 40 + (k * 31) % 40; hb.biome === 'jungle' ? Art().fern(c, fx, fy, 1.2, bi.deco, t) : Art().bush(c, fx, fy, 1, bi.deco); }
        if (hb.abris > 0) { const hx = W / 2, hy = 58; c.fillStyle = '#8a6a48'; c.fillRect(hx - 18, hy - 20, 36, 20); Art().poly(c, [hx - 24, hy - 20, hx, hy - 38, hx + 24, hy - 20], '#c9a86a'); }
        for (let k = 0; k < hb.enrichissement; k++) Art().rock(c, W - 40 - k * 40, H - 20, 0.9);
        const as = Z.inHabitat(selHab); const rect = { x0: 10, y0: 60, x1: W - 10, y1: H - 10 };
        pen.update(dt, as, rect, hb.food, 1.4); pen.draw(c, as, rect, hb.food, 1.4, { names: true });
      });
    } };
  }
  function animalRow(a, placed) {
    const Z = G.Sys.Zoo, sp = G.D.animals[a.sp], w = Z.welfare(a);
    return '<div class="list-item">' + img('animal', a.sp, 48) + '<div class="grow small"><b>' + E(a.name || sp.name) + '</b>' + (a.name ? ' <span class="muted">(' + E(sp.name) + ')</span>' : '') + ' <span class="tag">' + G.D.biomes[sp.biome].name + '</span>'
      + (placed ? '<div class="row">Bien-être ' + Math.round(w.value * 100) + ' %<div class="grow">' + bar(w.value) + '</div></div><div class="muted">' + w.reasons.map(E).join(' · ') + '</div>' : '<div class="muted">Besoins : ' + Object.keys(sp.needs).map(k => G.D.habitatParams[k].icon + sp.needs[k]).join(' ') + '</div>')
      + '</div><div class="row" style="flex-direction:column;gap:4px">' + (placed ? '<button class="btn small alt" data-act="remove" data-uid="' + a.uid + '">Réserve</button><button class="btn small alt" data-act="rename" data-uid="' + a.uid + '">Nommer</button>' : '<button class="btn small" data-act="place" data-uid="' + a.uid + '">Placer ici</button><button class="btn small alt" data-act="release" data-uid="' + a.uid + '">Relâcher</button>') + '<button class="btn small alt" data-act="info" data-sp="' + a.sp + '">Fiche</button></div></div>';
  }

  /* ---- Aquarium ---- */
  function aquarium() {
    const Q = G.Sys.Aquarium; const tanks = Q.tanks(); selTank = Math.min(selTank, tanks.length - 1);
    const t0 = tanks[selTank]; const fish = Q.fishIn(selTank); const avg = Q.avgHappiness();
    let h = '<div class="card"><div class="row between"><h3>🐠 ' + E(G.Game.bLevelData('aquarium').label) + '</h3>' + lv(G.Game.bLevel('aquarium')) + '</div><div class="stats">' + stat(avg === null ? '—' : Math.round(avg * 100) + ' %', 'Bonheur moyen') + stat(Q.placed().length, 'Poissons exposés') + bstats('aquarium') + '</div></div>';
    h += '<div class="subtabs" style="padding:0">' + tanks.map((x, i) => '<button class="' + (i === selTank ? 'on' : '') + '" data-act="tank" data-i="' + i + '">' + E(x.name) + '</button>').join('') + (tanks.length < 3 ? '<button disabled style="opacity:.5">🔒 Bassin ' + (tanks.length + 1) + ' (niv. ' + (tanks.length + 1) + ')</button>' : '') + '</div>';
    h += '<div class="card"><div class="row between"><h3>' + E(t0.name) + '</h3><select class="inp" data-act="env">' + Object.keys(G.D.waterEnvs).map(k => '<option value="' + k + '"' + (k === t0.env ? ' selected' : '') + '>' + G.D.waterEnvs[k].name + '</option>').join('') + '</select></div><canvas class="live-canvas" id="tankCv"></canvas>';
    h += '<div class="row small" style="margin:8px 0"><span style="width:120px">🌡️ Température</span><button class="btn small alt" data-act="temp" data-d="-1">−</button><b style="min-width:52px;text-align:center">' + t0.temp + ' °C</b><button class="btn small alt" data-act="temp" data-d="1">＋</button></div>';
    h += '<div class="row small" style="margin:8px 0"><span style="width:120px">💧 Qualité de l\'eau</span><div class="grow">' + bar(t0.quality / 100) + '</div><b>' + Math.round(t0.quality) + ' %</b><button class="btn small" data-act="clean">Nettoyer (6 🪙)</button></div>';
    h += '<div class="row small" style="margin:8px 0"><span style="width:120px">🪸 Décor</span>' + lv(t0.decor, 3) + '<span class="grow"></span>' + (t0.decor < 3 ? '<button class="btn small alt" data-act="decor">Améliorer · ' + Q.decorCost(t0) + ' 🪙 + ' + (t0.decor + 1) + ' pierre</button>' : '<span class="tag good">Max</span>') + '</div>';
    h += '<div class="small muted">Capacité : ' + fish.length + ' / ' + Q.capacity() + ' poissons. Chaque espèce a sa plage de température, son type d\'eau et un niveau de décor souhaité.</div></div>';
    h += '<div class="card"><h3>Habitants du bassin</h3>' + (fish.length ? fish.map(f => fishRow(f, true)).join('') : '<p class="muted">Bassin vide.</p>') + '</div>';
    const res = Q.reserve();
    h += '<div class="card"><h3>📦 Viviers de réserve (' + res.length + ')</h3>' + (res.length ? res.map(f => fishRow(f, false)).join('') : '<p class="muted small">Pêchez pendant vos explorations pour remplir l\'aquarium.</p>') + '</div>';
    return { html: h, bind: {
      tank: d => { selTank = +d.i; G.UI.renderPanel(); }, env: (d, el) => { if (!Q.setEnv(selTank, el.value)) G.UI.renderPanel(); }, temp: d => Q.setTemp(selTank, +d.d), clean: () => Q.clean(selTank), decor: () => Q.buyDecor(selTank),
      place: d => Q.place(d.uid, selTank), remove: d => Q.remove(d.uid), release: d => G.UI.confirm('Relâcher ce poisson ?', 'Il retournera à la mer.', 'Relâcher', () => Q.release(d.uid)), info: d => showSpecies('fish', d.sp),
    }, mount: body => {
      const cv = body.querySelector('#tankCv'); if (!cv) return;
      const tk = panelTanks[selTank] = panelTanks[selTank] || new G.Life.Tank();
      loopCanvas(cv, (c, W, H, dt, t) => {
        const tt = Q.tanks()[selTank]; if (!tt) return;
        const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, tt.env === 'mer' ? '#5fb8e6' : '#7fcfb8'); g.addColorStop(1, tt.env === 'mer' ? '#1f5f95' : '#2f7f6a'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.fillStyle = 'rgba(120,100,60,' + (1 - tt.quality / 100) * 0.5 + ')'; c.fillRect(0, 0, W, H);
        c.fillStyle = '#d8c48a'; c.beginPath(); c.moveTo(0, H); c.lineTo(0, H - 18); for (let x = 0; x <= W; x += 20) c.lineTo(x, H - 18 - Math.sin(x * 0.05) * 5); c.lineTo(W, H); c.fill();
        for (let k = 0; k < 2 + tt.decor * 3; k++) { const px = 20 + (k * 71) % (W - 40); c.strokeStyle = k % 3 ? '#3f9a5a' : '#e07a8a'; c.lineWidth = 3; c.beginPath(); c.moveTo(px, H - 14); c.quadraticCurveTo(px + Math.sin(t * 1.5 + k) * 8, H - 40, px, H - 50 - (k % 4) * 10); c.stroke(); }
        if (tt.decor >= 2) Art().rock(c, W * 0.7, H - 10, 1.5, '#8a7f74');
        const fs = Q.fishIn(selTank); const rect = { x0: 10, y0: 12, x1: W - 10, y1: H - 22 };
        tk.update(dt, fs, rect, 1.4); tk.draw(c, fs, rect, 1.4);
        c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.moveTo(W * 0.1, 0); c.lineTo(W * 0.2, 0); c.lineTo(W * 0.05, H); c.lineTo(0, H); c.fill();
      });
    } };
  }
  function fishRow(f, placed) {
    const Q = G.Sys.Aquarium, sp = G.D.fish[f.sp], hp = Q.happiness(f);
    return '<div class="list-item">' + img('fish', f.sp, 48) + '<div class="grow small"><b>' + E(sp.name) + '</b> <span class="tag">' + G.D.waterEnvs[sp.env].name + '</span> <span class="tag">' + sp.temp[0] + '–' + sp.temp[1] + ' °C</span> <span class="tag">Décor ' + sp.decor + '</span>' + (sp.predator ? ' <span class="tag bad">Prédateur</span>' : '')
      + (placed ? '<div class="row">Bonheur ' + Math.round(hp.value * 100) + ' %<div class="grow">' + bar(hp.value) + '</div></div><div class="muted">' + hp.reasons.map(E).join(' · ') + '</div>' : '') + '</div><div class="row" style="flex-direction:column;gap:4px">'
      + (placed ? '<button class="btn small alt" data-act="remove" data-uid="' + f.uid + '">Réserve</button>' : '<button class="btn small" data-act="place" data-uid="' + f.uid + '">Placer ici</button><button class="btn small alt" data-act="release" data-uid="' + f.uid + '">Relâcher</button>') + '<button class="btn small alt" data-act="info" data-sp="' + f.sp + '">Fiche</button></div></div>';
  }
  function showSpecies(kind, id) {
    if (kind === 'animal') { const a = G.D.animals[id]; G.UI.modal({ title: E(a.name), html: '<div class="dialog"><img src="' + Art().icon('animal', id, 96) + '" style="border-radius:12px;background:#eef6e6"><div class="grow small">' + E(a.desc) + '<br><b>Origine :</b> ' + E(G.D.islands[a.origin].name) + ' · <b>Habitat :</b> ' + G.D.biomes[a.biome].name + ' · <b>Régime :</b> ' + a.diet + ' · <b>Taille :</b> ' + a.size + '<br><b>Rareté :</b> ' + G.D.rarities[a.rarity].name + (a.social ? ' · vit en groupe' : ' · solitaire') + '<br><b>Comportements :</b> ' + a.behaviors.map(E).join(', ') + '<br><b>Besoins :</b> ' + Object.keys(a.needs).map(k => G.D.habitatParams[k].icon + ' ' + G.D.habitatParams[k].name + ' ' + a.needs[k]).join(' · ') + '</div></div>' }); }
    else { const f = G.D.fish[id]; G.UI.modal({ title: E(f.name), html: '<div class="dialog"><img src="' + Art().icon('fish', id, 96) + '" style="border-radius:12px;background:#e6f2fa"><div class="grow small">' + E(f.desc) + '<br><b>Origine :</b> ' + E(G.D.islands[f.origin].name) + '<br><b>Eau :</b> ' + G.D.waterEnvs[f.env].name + ' · <b>Température :</b> ' + f.temp[0] + '–' + f.temp[1] + ' °C · <b>Décor souhaité :</b> ' + f.decor + '<br><b>Rareté :</b> ' + G.D.rarities[f.rarity].name + (f.predator ? ' · <b>prédateur</b>' : '') + '</div></div>' }); }
  }

  /* ---- Bar ---- */
  const RECIPE_SRC = { the_fougere: 'Mission « Les herbes de Brindille » (Île Préhistorique)', smoothie: 'Mission « Les confitures de Mamie Silex » (Île Préhistorique)' };
  function barPanel() {
    const B = G.Sys.Bar, s = S().bar; const q = B.queue;
    let h = '<div class="card"><div class="row between"><h3>☕ ' + E(G.Game.bLevelData('bar').label) + '</h3>' + lv(G.Game.bLevel('bar')) + '</div><div class="stats">' + stat(s.served, 'Commandes servies') + stat(s.bestScore + ' %', 'Meilleure note') + bstats('bar') + '</div></div>';
    h += '<div class="card"><h3>🧾 Clients en attente (' + q.length + ' / ' + B.tables() + ' tables)</h3>';
    h += q.length ? q.map(o => '<div class="list-item">' + (o.charId ? '<img class="avatar" src="' + Art().icon('char', o.charId, 64) + '">' : '<span style="font-size:30px">🧳</span>') + '<div class="grow small"><b>' + E(o.name) + '</b>' + (o.usual ? ' <span class="tag gold">Comme d\'habitude</span>' : '') + (o.walkIn ? ' <span class="tag">De passage</span>' : '') + '<div class="muted">' + (o.usual ? '« Comme d\'habitude ! »' : E(B.orderText(o))) + '</div><div data-live="order" data-id="' + o.id + '">' + bar(1 - (Date.now() - o.created) / 1000 / o.patience) + '</div></div><button class="btn small ' + (o.inService ? 'disabled' : '') + '" data-act="serve" data-id="' + o.id + '">Servir</button></div>').join('')
      : '<p class="muted">Personne n\'attend. Les visiteurs qui choisissent le bar s\'installent en terrasse et commandent ici.</p><button class="btn alt" data-act="walkin">🧳 Accueillir un client de passage</button>';
    h += (B.hasStaff() ? '<p class="small tag good">👔 ' + E(G.D.characters[G.Sys.Chars.employeeOf('bar')].name) + ' sert automatiquement (qualité moyenne) les clients qui attendent.</p>' : '<p class="muted small">Astuce : recrutez un serveur (Personnel) pour servir automatiquement quand vous êtes occupé·e.</p>') + '</div>';
    h += '<div class="card"><h3>📜 Carte des recettes</h3>' + Object.keys(G.D.recipes).map(id => { const r = G.D.recipes[id]; const un = s.recipes.includes(id); const st = B.stocked(id); const type = { hot: '☕ chaud', cold: '🧊 frais', snack: '🍪 collation' }[r.type]; return '<div class="list-item" style="' + (un ? '' : 'opacity:.6') + '"><span style="font-size:26px">' + (un ? '📗' : '🔒') + '</span><div class="grow small"><b>' + E(r.name) + '</b> <span class="tag">' + type + '</span> <span class="tag gold">' + Math.round(r.price * B.priceMult()) + ' 🪙</span>' + (un && !st ? ' <span class="tag bad">Stock épuisé : ' + Object.keys(r.stock).map(k => G.D.resources[k].name).join(', ') + '</span>' : '') + (r.stock && un ? ' <span class="tag blue">Utilise ' + Object.keys(r.stock).map(k => r.stock[k] + ' ' + G.D.resources[k].name.toLowerCase() + ' (' + (S().res[k] || 0) + ')').join(', ') + '</span>' : '') + '<br><span class="muted">' + (un ? E(r.desc) + ' Demande actuelle ×' + B.demand(id).toFixed(1) : 'À débloquer : ' + E(RECIPE_SRC[id] || '?')) + '</span></div></div>'; }).join('') + '</div>';
    const prefs = Object.keys(s.prefs);
    h += '<div class="card"><h3>📒 Carnet des habitués</h3>' + (prefs.length ? prefs.map(id => '<div class="list-item"><img class="avatar" src="' + Art().icon('char', id, 64) + '"><div class="grow small"><b>' + E(G.D.characters[id].name) + '</b><br>' + E(B.orderText(s.prefs[id])) + '</div></div>').join('') : '<p class="muted small">Les habitués mémorisent leur commande. Quand ils diront « comme d\'habitude », consultez ce carnet !</p>') + '</div>';
    h += '<div class="card"><h3>🛠️ Améliorations du bar</h3><p class="muted small">Niveau du bâtiment : ' + G.Game.bLevel('bar') + ' → améliorations jusqu\'au niveau ' + B.maxUpg() + '.</p>' + Object.keys(G.D.barUpgrades).map(k => { const u = G.D.barUpgrades[k]; const l = s.upg[k]; return '<div class="list-item"><div class="grow small"><b>' + u.name + '</b> ' + lv(l) + '<br><span class="muted">' + u.desc + '</span></div>' + (l < 3 ? '<button class="btn small ' + (l >= B.maxUpg() ? 'disabled' : '') + '" data-act="upg" data-k="' + k + '">' + B.upgCost(k) + ' 🪙</button>' : '<span class="tag good">Max</span>') + '</div>'; }).join('') + '</div>';
    return { html: h, bind: { serve: d => { const o = B.queue.find(x => x.id === d.id); if (o) G.Mini.bar(o); }, walkin: () => { const o = B.walkIn(); if (o) G.Mini.bar(o); else G.UI.toast('Aucun client de passage pour le moment, revenez dans quelques secondes.', '⏳'); }, upg: d => B.upgrade(d.k) } };
  }

  /* ---- Publicité ---- */
  function ads() {
    const A = G.Sys.Ads; const act = A.active();
    const targets = A.targetsFor(adForm.type); if (!targets.find(x => x.id === adForm.target)) adForm.target = targets[0] ? targets[0].id : '';
    let h = '<div class="card"><h3>📣 Campagnes en cours (' + act.length + ' / ' + A.slots() + ')</h3><div id="adLive">' + adsLive() + '</div></div>';
    h += '<div class="card"><h3>Nouvelle campagne</h3><div class="row small" style="margin:6px 0"><span style="width:90px">Format</span><select class="inp grow" data-act="kind">' + Object.keys(G.D.adCampaigns).map(k => '<option value="' + k + '"' + (k === adForm.kind ? ' selected' : '') + '>' + G.D.adCampaigns[k].name + ' — ' + G.D.adCampaigns[k].cost + ' 🪙</option>').join('') + '</select></div>';
    h += '<div class="row small" style="margin:6px 0"><span style="width:90px">Promouvoir</span><select class="inp grow" data-act="type">' + Object.keys(G.D.adTargets).map(k => '<option value="' + k + '"' + (k === adForm.type ? ' selected' : '') + '>' + G.D.adTargets[k].name + '</option>').join('') + '</select></div>';
    h += '<div class="row small" style="margin:6px 0"><span style="width:90px">Cible</span>' + (targets.length ? '<select class="inp grow" data-act="target">' + targets.map(x => '<option value="' + x.id + '"' + (x.id === adForm.target ? ' selected' : '') + '>' + E(x.name) + '</option>').join('') + '</select>' : '<span class="muted">Rien à promouvoir dans cette catégorie pour l\'instant.</span>') + '</div>';
    h += '<p class="small muted">' + E(G.D.adCampaigns[adForm.kind].desc) + ' Les visiteurs supplémentaires vont vers l\'établissement ciblé ; une recette promue est commandée plus souvent.</p><button class="btn block ' + (targets.length ? '' : 'disabled') + '" data-act="launch">Lancer la campagne</button></div>';
    const past = S().ads.filter(a => a.reported);
    if (past.length) h += '<div class="card"><h3>Bilan des campagnes terminées</h3>' + past.slice().reverse().map(a => '<div class="list-item small"><span style="font-size:22px">📈</span><div class="grow"><b>' + E(a.targetName) + '</b> · ' + G.D.adCampaigns[a.kind].name + '<br><span class="muted">' + a.result + ' visites pendant la campagne</span></div></div>').join('') + '</div>';
    return { html: h, bind: { kind: (d, el) => { adForm.kind = el.value; G.UI.renderPanel(); }, type: (d, el) => { adForm.type = el.value; adForm.target = ''; G.UI.renderPanel(); }, target: (d, el) => { adForm.target = el.value; }, launch: () => { const c = G.D.adCampaigns[adForm.kind]; G.UI.confirm('Lancer « ' + c.name + ' » ?', 'Cible : ' + E((targets.find(x => x.id === adForm.target) || {}).name || '') + '. Durée : ' + c.minutes + ' minutes de jeu.', 'Lancer', () => A.start(adForm.kind, adForm.type, adForm.target), c.cost); } } };
  }
  function adsLive() {
    const act = G.Sys.Ads.active();
    return act.length ? act.map(a => { const left = Math.max(0, a.end - Date.now()); const tot = a.end - a.start; return '<div class="list-item small"><span style="font-size:22px">📣</span><div class="grow"><b>' + E(a.targetName) + '</b> · ' + G.D.adCampaigns[a.kind].name + ' <span class="tag good">+' + Math.round(a.boost * 100) + ' %</span><br>Reste ' + Math.floor(left / 60000) + ' min ' + String(Math.floor(left / 1000) % 60).padStart(2, '0') + ' s · ' + G.Sys.Ads.gain(a) + ' visites depuis le lancement' + bar(left / tot, 'good') + '</div></div>'; }).join('') : '<p class="muted small">Aucune campagne active.</p>';
  }

  /* ---- Finances ---- */
  function finances() {
    const s = S(); const hist = s.history; const rate = G.Sys.Sim.rate();
    const rev = hist.reduce((t, h) => t + Object.values(h.rev).reduce((a, b) => a + b, 0), 0), exp = hist.reduce((t, h) => t + h.exp, 0);
    let h = '<div class="card"><h3>📊 Tableau de bord</h3><div class="stats">' + stat(U.fmt(s.coins) + ' 🪙', 'Trésorerie') + stat(G.Game.rep(), 'Réputation') + stat(rate.toFixed(1), 'Visiteurs / min') + stat('+' + U.fmt(rev), 'Recettes (30 min)') + stat('−' + U.fmt(exp), 'Dépenses (30 min)') + stat(G.Game.employeesCount(), 'Employés') + '</div></div>';
    const max = Math.max(10, ...hist.map(x => Math.max(Object.values(x.rev).reduce((a, b) => a + b, 0), x.exp)));
    h += '<div class="card"><h3>Évolution (une barre = 1 minute)</h3><div class="chartbars">' + (hist.length ? hist.map(x => { const r = Object.values(x.rev).reduce((a, b) => a + b, 0); return '<div title="+' + r + ' / −' + x.exp + '"><i style="height:' + (r / max * 100) + '%;background:var(--teal)"></i><i style="height:' + (x.exp / max * 100) + '%;background:var(--coral)"></i></div>'; }).join('') : '<span class="muted small">Les données apparaissent après une minute de jeu.</span>') + '</div><div class="small"><span class="tag" style="background:var(--teal);color:#fff">Recettes</span> <span class="tag" style="background:var(--coral);color:#fff">Dépenses</span></div></div>';
    h += '<div class="card"><h3>Par établissement</h3><table class="tbl"><tr><th>Lieu</th><th>Visites</th><th>Satisf.</th><th>Répu.</th><th>Recettes</th><th>Dépenses</th></tr>' + ['museum', 'zoo', 'aquarium', 'bar', 'office'].map(k => { const b = s.bstats[k]; return '<tr><td>' + G.D.buildings[k].icon + ' ' + G.D.buildings[k].name + '</td><td>' + U.fmt(b.visits) + '</td><td>' + (k === 'office' ? '—' : Math.round(b.sat * 100) + ' %') + '</td><td>' + Math.floor(b.rep) + '</td><td>' + U.fmt(b.rev) + '</td><td>' + U.fmt(b.exp) + '</td></tr>'; }).join('') + '</table><p class="muted small">Dépenses du bureau : salaires (3 🪙/min par employé), entretien, campagnes et décorations.</p></div>';
    const sd = G.Game.seasonData(), tr = G.Sys.Gazette.trend(), att = G.Sys.Sim.attractions();
    h += '<div class="card"><h3>Facteurs actuels</h3><p class="small">' + sd.icon + ' <b>' + sd.name + '</b> — ' + E(sd.desc) + '</p><p class="small">📰 <b>Tendance de la semaine :</b> ' + E(tr.title) + ' — ' + E(tr.text) + '</p><h4>Attractivité (où vont les visiteurs)</h4>' + Object.keys(att).map(k => '<div class="row small"><span style="width:110px">' + ({ museum: '🏛️ Musée', zoo: '🦕 Zoo', aquarium: '🐠 Aquarium', bar: '☕ Bar', rest: '🌳 Promenade' })[k] + '</span><div class="grow">' + bar(att[k] / Math.max(...Object.values(att)), 'good') + '</div><b>' + att[k].toFixed(2) + '</b></div>').join('') + '</div>';
    return { html: h, bind: {} };
  }

  /* ---- Personnel ---- */
  function staff() {
    const C = G.Sys.Chars; const s = S();
    const free = Object.keys(s.chars).filter(id => s.chars[id].met && !s.chars[id].job && id !== 'merou');
    let h = '<div class="card"><h3>👔 Postes (' + G.Game.employeesCount() + ' / ' + C.staffMax() + ' employés)</h3><p class="muted small">Chaque employé coûte 3 🪙 par minute. Recrutement : ' + C.hireCost() + ' 🪙. Le Bureau de direction augmente l\'effectif maximum.</p>';
    h += Object.keys(C.JOBS).map(job => { const who = C.employeeOf(job); return '<div class="list-item">' + (who ? '<img class="avatar" src="' + Art().icon('char', who, 64) + '">' : '<span style="font-size:30px">🪑</span>') + '<div class="grow small"><b>' + C.JOBS[job] + '</b><br><span class="muted">' + C.JOB_EFFECT[job] + '</span><br>' + (who ? 'Occupé par <b>' + E(G.D.characters[who].name) + '</b>' : (free.length ? '<select class="inp" id="sel_' + job + '">' + free.map(id => '<option value="' + id + '">' + E(G.D.characters[id].name) + '</option>').join('') + '</select>' : '<span class="muted">Rencontrez des habitants en exploration pour les recruter.</span>')) + '</div>' + (who ? '<button class="btn small alt" data-act="fire" data-id="' + who + '">Libérer</button>' : (free.length ? '<button class="btn small" data-act="hire" data-job="' + job + '">Recruter</button>' : '')) + '</div>'; }).join('') + '</div>';
    const met = Object.keys(s.chars).filter(id => s.chars[id].met);
    h += '<div class="card"><h3>🧑 Personnages rencontrés (' + met.length + ')</h3>' + met.map(id => '<div class="list-item"><img class="avatar" src="' + Art().icon('char', id, 64) + '"><div class="grow small"><b>' + E(G.D.characters[id].name) + '</b> <span class="tag gold">' + E(C.roleLabel(id)) + '</span><br>Humeur ' + C.moodIcon(s.chars[id].mood) + ' · ' + s.chars[id].visits + ' visite(s)</div><button class="btn small alt" data-act="fiche" data-id="' + id + '">Fiche</button></div>').join('') + '<p class="muted small">Après 2 visites, un personnage peut être invité comme résident permanent (depuis sa fiche).</p></div>';
    return { html: h, bind: { hire: d => { const sel = document.getElementById('sel_' + d.job); if (!sel) return; G.UI.confirm('Recruter ' + G.D.characters[sel.value].name + ' ?', C.JOBS[d.job] + ' — ' + C.JOB_EFFECT[d.job] + '. Salaire : 3 🪙/min.', 'Recruter', () => C.hire(sel.value, d.job), C.hireCost()); }, fire: d => C.fire(d.id), fiche: d => G.UI.openChar(d.id) } };
  }

  /* ---- Bâtiments & décorations ---- */
  const DECO_ICON = { arbre: '🌳', fleurs: '🌷', banc: '🪑', lampadaire: '💡', fontaine: '⛲', statue_dino: '🗿' };
  function build() {
    let h = '<p class="muted small">Chaque établissement possède 3 niveaux. Les niveaux supérieurs demandent de la réputation et des points de découverte, gagnés en explorant.</p>';
    for (const k of ['museum', 'zoo', 'aquarium', 'bar', 'port', 'office']) {
      const b = G.D.buildings[k], l = G.Game.bLevel(k), next = b.levels[l];
      h += '<div class="card"><div class="row between"><h3>' + b.icon + ' ' + b.name + ' — ' + E(b.levels[l - 1].label) + '</h3>' + lv(l) + '</div><p class="muted small">' + E(b.desc) + '</p>';
      if (next) {
        const req = []; req.push((G.state.coins >= next.cost ? '✅' : '❌') + ' ' + U.fmt(next.cost) + ' 🪙'); if (next.rep) req.push((G.Game.rep() >= next.rep ? '✅' : '❌') + ' Réputation ' + next.rep); if (next.disc) req.push((G.state.discovery >= next.disc ? '✅' : '❌') + ' Découverte ' + next.disc);
        h += '<div class="row small"><span class="grow">Niveau suivant : <b>' + E(next.label) + '</b><br>' + req.join(' · ') + '</span><button class="btn small ' + (G.Game.canUpgrade(k).ok ? '' : 'disabled') + '" data-act="upgrade" data-k="' + k + '">Améliorer</button></div>';
      } else h += '<span class="tag good">Niveau maximum</span>';
      h += '</div>';
    }
    h += '<div class="card"><h3>🌳 Décorations</h3><p class="muted small">Les décorations embellissent l\'île, attirent les promeneurs (bancs et fontaines servent de lieux de repos). Touchez une décoration sur l\'île pour la retirer.</p><div class="grid">' + Object.keys(G.D.decorations).map(k => { const d = G.D.decorations[k]; const locked = d.needDisc && G.state.discovery < d.needDisc; return '<button class="tile ' + (locked ? 'empty' : '') + '" data-act="deco" data-k="' + k + '"><span style="font-size:34px">' + DECO_ICON[k] + '</span>' + E(d.name) + '<b>' + d.cost + ' 🪙</b>' + (locked ? '<span class="muted">🔒 ' + d.needDisc + ' découverte</span>' : '') + '</button>'; }).join('') + '</div></div>';
    return { html: h, bind: { upgrade: d => { const c = G.Game.canUpgrade(d.k); if (!c.ok) return G.UI.toast(c.reason, '🔒', 'bad'); G.UI.confirm('Améliorer : ' + G.D.buildings[d.k].name, 'Passer au niveau « ' + E(c.next.label) + ' » ?', 'Améliorer', () => G.Game.upgradeBuilding(d.k), c.next.cost); },
      deco: d => { const dd = G.D.decorations[d.k]; if (dd.needDisc && G.state.discovery < dd.needDisc) return G.UI.toast('Il faut ' + dd.needDisc + ' points de découverte.', '🔒', 'bad'); if (G.state.coins < dd.cost) return G.UI.toast('Pas assez de pièces.', '🪙', 'bad'); G.UI.closePanel(); G.Home.startPlacing(d.k); } } };
  }

  /* ================= COLLECTIONS ================= */
  function collections(sub) {
    unmount(); const s = S(), cx = s.codex;
    const pctOf = (seen, all) => Math.round(seen / all * 100);
    const nI = Object.keys(G.D.items).length, nA = Object.keys(G.D.animals).length, nF = Object.keys(G.D.fish).length, nC = Object.keys(G.D.characters).length;
    let h = '<div class="stats">' + stat(Object.keys(cx.items).length + '/' + nI, 'Objets') + stat(Object.keys(cx.animals).length + '/' + nA, 'Animaux') + stat(Object.keys(cx.fish).length + '/' + nF, 'Poissons') + stat(Object.values(s.chars).filter(c => c.met).length + '/' + nC, 'Personnages') + '</div>';
    if (sub === 'items') {
      for (const cat in G.D.categories) {
        const ids = Object.keys(G.D.items).filter(id => G.D.items[id].cat === cat);
        h += '<div class="card"><h3>' + G.D.categories[cat].icon + ' ' + G.D.categories[cat].name + ' <span class="muted small">' + ids.filter(id => cx.items[id]).length + '/' + ids.length + '</span></h3><div class="grid">' + ids.map(id => cx.items[id] ? '<button class="tile" data-act="item" data-id="' + id + '">' + rarDot(G.D.items[id].rarity) + (G.Game.itemCount(id) ? '<span class="qty">×' + G.Game.itemCount(id) + '</span>' : '') + img('item', id) + E(G.D.items[id].name) + '</button>' : '<div class="tile unknown">' + img('silhouette', 'item|' + id) + '<span class="muted">???</span></div>').join('') + '</div></div>';
      }
    } else if (sub === 'animals') {
      h += '<div class="card"><div class="grid">' + Object.keys(G.D.animals).map(id => { const n = s.animals.filter(a => a.sp === id).length; return cx.animals[id] ? '<button class="tile" data-act="animal" data-id="' + id + '">' + rarDot(G.D.animals[id].rarity) + (n ? '<span class="qty">×' + n + '</span>' : '') + img('animal', id) + E(G.D.animals[id].name) + '</button>' : '<div class="tile unknown">' + img('silhouette', 'animal|' + id) + '<span class="muted">???<br>' + E(G.D.islands[G.D.animals[id].origin].short) + '</span></div>'; }).join('') + '</div><p class="muted small">Identifiez les espèces en les approchant sans les effrayer pendant vos explorations.</p></div>';
    } else if (sub === 'fish') {
      h += '<div class="card"><div class="grid">' + Object.keys(G.D.fish).map(id => { const n = s.fish.filter(f => f.sp === id).length; return cx.fish[id] ? '<button class="tile" data-act="fish" data-id="' + id + '">' + rarDot(G.D.fish[id].rarity) + (n ? '<span class="qty">×' + n + '</span>' : '') + img('fish', id) + E(G.D.fish[id].name) + '</button>' : '<div class="tile unknown">' + img('silhouette', 'fish|' + id) + '<span class="muted">???<br>' + (G.D.fish[id].env === 'mer' ? 'en mer' : 'eau douce') + '</span></div>'; }).join('') + '</div></div>';
    } else if (sub === 'chars') {
      h += '<div class="card"><div class="grid">' + Object.keys(G.D.characters).map(id => s.chars[id].met ? '<button class="tile" data-act="char" data-id="' + id + '"><img class="avatar" style="width:56px;height:56px" src="' + Art().icon('char', id, 64) + '">' + E(G.D.characters[id].name) + '<span class="muted">' + E(G.Sys.Chars.roleLabel(id)) + '</span></button>' : '<div class="tile unknown"><span style="font-size:40px;opacity:.4">👤</span><span class="muted">???<br>' + E(G.D.islands[G.D.characters[id].origin] ? G.D.islands[G.D.characters[id].origin].short : '') + '</span></div>').join('') + '</div></div>';
    } else if (sub === 'inv') {
      h += inventoryHtml();
    } else if (sub === 'disc') {
      const isl = s.islands.prehistorique;
      h += '<div class="card"><h3>🗺️ Zones de l\'Île Préhistorique</h3>' + G.D.islands.prehistorique.map.zones.map(z => '<span class="tag ' + (isl.zones[z.id] ? 'good' : '') + '">' + (isl.zones[z.id] ? '✓ ' + E(z.name) : '???') + '</span>').join(' ') + '</div>';
      const lore = G.D.islands.prehistorique.map.spots.filter(x => x.type === 'lore');
      h += '<div class="card"><h3>📖 Carnet de curiosités</h3>' + lore.map(l => isl.done[l.id] ? '<div class="list-item small"><span style="font-size:22px">📖</span><div class="grow"><b>' + E(l.title) + '</b><br><span class="muted">' + E(l.text) + '</span></div></div>' : '<div class="list-item small" style="opacity:.5"><span style="font-size:22px">❔</span><div class="grow">Curiosité non découverte</div></div>').join('') + '</div>';
      h += '<div class="card"><h3>💞 Rencontres mémorables</h3>' + G.D.pairEvents.map(ev => s.flags['pair:' + ev.a + '|' + ev.b] ? '<div class="list-item small"><span style="font-size:22px">💞</span><div class="grow"><b>' + E(ev.title) + '</b><br><span class="muted">' + E(ev.text) + '</span></div></div>' : '<div class="list-item small" style="opacity:.5"><span style="font-size:22px">❔</span><div class="grow">Deux personnages doivent mieux se connaître sur votre île…</div></div>').join('') + '</div>';
      h += '<div class="card"><h3>🏅 Récompenses</h3><div class="small">Missions accomplies : <b>' + Object.values(isl.missions).filter(m => m.state === 'done').length + '</b> · Numéros de Gazette lus : <b>' + Object.keys(s.gazette.read).length + '</b> · Cadeaux réclamés : <b>' + Object.keys(s.gazette.claimed).length + '</b> · Missions hebdo : <b>' + Object.keys(s.gazette.missionClaimed).length + '</b> · Fossiles restaurés : <b>' + s.counters.restored + '</b></div></div>';
    }
    return { html: h, bind: { item: d => G.UI.showItem(d.id), animal: d => showSpecies('animal', d.id), fish: d => showSpecies('fish', d.id), char: d => G.UI.openChar(d.id) } };
  }
  function inventoryHtml() {
    const s = S();
    let h = '<div class="card"><h3>🧺 Ressources et ingrédients</h3><div class="grid">' + Object.keys(G.D.resources).map(k => '<div class="tile"><span class="qty">×' + (s.res[k] || 0) + '</span>' + img('res', k) + E(G.D.resources[k].name) + '</div>').join('') + '</div></div>';
    const items = Object.keys(s.items).filter(id => s.items[id] > 0);
    h += '<div class="card"><h3>🏺 Objets</h3>' + (items.length ? '<div class="grid">' + items.map(id => '<button class="tile" data-act="item" data-id="' + id + '">' + rarDot(G.D.items[id].rarity) + '<span class="qty">×' + s.items[id] + '</span>' + img('item', id) + E(G.D.items[id].name) + '</button>').join('') + '</div>' : '<p class="muted">Aucun objet pour l\'instant.</p>') + '</div>';
    h += '<div class="card small">🦕 Animaux : ' + s.animals.length + ' (dont ' + G.Sys.Zoo.reserve().length + ' en réserve) · 🐟 Poissons : ' + s.fish.length + ' (dont ' + G.Sys.Aquarium.reserve().length + ' en réserve)</div>';
    return h;
  }

  /* ================= GAZETTE ================= */
  function issueHtml(iss, isCurrent) {
    const g = S().gazette, Gz = G.Sys.Gazette; const mp = isCurrent ? Gz.missionProgress(iss) : null;
    const sp = iss.spot; const known = S().codex[sp.kind] && S().codex[sp.kind][sp.id];
    const kindIcon = { animals: 'animal', fish: 'fish', items: 'item' }[sp.kind];
    let h = '<div class="gazette"><div class="mast"><h1>La Gazette des Îles</h1><div>N° ' + iss.number + ' · Semaine du lundi ' + U.dateFr(iss.date) + ' · 1 coquillage</div></div>';
    h += '<section class="lead"><h3>À la une</h3><h4>' + E(iss.news.title) + '</h4><p>' + E(iss.news.text) + '</p></section><div class="cols">';
    h += '<section><h3>Tendance commerciale</h3><h4>' + E(iss.trend.title) + '</h4><p>' + E(iss.trend.text) + '</p>' + (isCurrent ? '<p class="small"><i>Effet actif toute la semaine.</i></p>' : '') + '</section>';
    h += '<section><h3>À l\'honneur</h3><div class="row"><img src="' + Art().icon(known ? kindIcon : 'silhouette', known ? sp.id : kindIcon + '|' + sp.id, 64) + '" width="56" height="56"><div class="grow"><h4>' + E(sp.name) + '</h4></div></div><p>' + E(sp.desc) + '</p>' + (known ? '' : '<p class="small"><i>Vous ne l\'avez pas encore découvert !</i></p>') + '</section>';
    h += '<section><h3>Mission de la semaine</h3><h4>' + E(iss.mission.title) + '</h4><p class="small">Récompense : ' + G.UI.rewardText(iss.mission.reward) + '</p>';
    if (isCurrent) h += '<div class="small">' + mp.cur + ' / ' + mp.n + '</div>' + bar(mp.cur / mp.n, mp.done ? 'good' : '') + (g.missionClaimed[iss.week] ? '<p class="tag good">Récompense obtenue</p>' : '<button class="btn small ' + (mp.done ? 'gold' : 'disabled') + '" data-act="mission" style="margin-top:6px">Réclamer</button>');
    h += '</section><section><h3>Le cadeau de la rédaction</h3><h4>' + E(iss.gift.text) + '</h4><p class="small">' + G.UI.rewardText(iss.gift.reward) + '</p>' + (isCurrent ? (g.claimed[iss.week] ? '<p class="tag good">Cadeau récupéré</p>' : '<button class="btn small gold" data-act="gift">Récupérer</button>') : (g.claimed[iss.week] ? '<p class="tag good">Récupéré</p>' : '<p class="tag">Non récupéré</p>')) + '</section></div></div>';
    return h;
  }
  function gazette(sub) {
    unmount(); const Gz = G.Sys.Gazette;
    if (sub === 'archives') {
      const arch = Gz.archive();
      return { html: '<p class="muted small">Les anciens numéros restent consultables. Les cadeaux ne peuvent être récupérés que la semaine de parution.</p>' + arch.map(iss => '<details class="card"><summary><b>N° ' + iss.number + '</b> — semaine du ' + U.dateFr(iss.date) + ' · ' + E(iss.news.title) + (S().gazette.read[iss.week] ? '' : ' <span class="tag">non lu</span>') + '</summary>' + issueHtml(iss, false) + '</details>').join(''), bind: {} };
    }
    return { html: issueHtml(Gz.current(), true) + '<p class="muted small" style="margin-top:8px">Un nouveau numéro paraît chaque lundi (date locale de votre appareil).</p>', bind: { gift: () => Gz.claimGift(), mission: () => Gz.claimMission() } };
  }

  /* ================= PARAMÈTRES ================= */
  function settings() {
    const s = S().settings;
    const html = '<h4>Sauvegarde</h4><p class="small muted">La partie est enregistrée automatiquement dans ce navigateur. Exportez-la pour la conserver ou la transférer sur un autre appareil.</p><div class="row"><button class="btn" data-act="export">⬇️ Exporter (fichier)</button><button class="btn alt" data-act="copy">📋 Copier le code</button><label class="btn alt">⬆️ Importer un fichier<input type="file" accept=".json,application/json" id="impFile" hidden></label><button class="btn alt" data-act="paste">📥 Coller un code</button></div>'
      + '<h4>Affichage</h4><div class="row small"><label><input type="checkbox" data-act="names" ' + (s.names ? 'checked' : '') + '> Afficher les noms et étiquettes</label></div><div class="row small"><label><input type="checkbox" data-act="low" ' + (s.lowPower ? 'checked' : '') + '> Mode économie (téléphone : 30 i/s, résolution réduite)</label></div>'
      + '<h4>Saison</h4><select class="inp" data-act="season"><option value="auto">Automatique (date de l\'appareil)</option>' + Object.keys(G.D.seasons).map(k => '<option value="' + k + '"' + (s.season === k ? ' selected' : '') + '>' + G.D.seasons[k].icon + ' ' + G.D.seasons[k].name + '</option>').join('') + '</select>'
      + '<h4>Aide</h4><button class="btn alt small" data-act="help">Revoir le guide de démarrage</button>'
      + '<h4>Zone sensible</h4><button class="btn warn small" data-act="reset">Recommencer une nouvelle partie</button><p class="muted small">Archipel — version ' + G.VERSION + ' · sauvegarde v' + G.SAVE_VERSION + '</p>';
    G.UI.modal({ title: '⚙️ Paramètres', html, wide: true, onMount: (el, m) => {
      G.UI.bind(el, {
        export: () => { const blob = new Blob([G.State.exportString()], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'archipel-sauvegarde-' + new Date().toISOString().slice(0, 10) + '.json'; document.body.appendChild(a); a.click(); a.remove(); G.UI.toast('Sauvegarde exportée.', '💾', 'good'); },
        copy: () => { const str = G.State.exportString(); (navigator.clipboard ? navigator.clipboard.writeText(str) : Promise.reject()).then(() => G.UI.toast('Code copié dans le presse-papiers.', '📋', 'good'), () => G.UI.modal({ title: 'Code de sauvegarde', html: '<textarea class="inp" style="width:100%;height:160px">' + E(str) + '</textarea>' })); },
        paste: () => G.UI.modal({ title: 'Importer un code', html: '<textarea class="inp" id="impTxt" style="width:100%;height:160px" placeholder="Collez ici le code de sauvegarde"></textarea><p class="small muted">Attention : la partie actuelle sera remplacée.</p>', buttons: [{ label: 'Annuler' }, { label: 'Importer', primary: true, onClick: () => doImport(document.getElementById('impTxt').value) }] }),
        names: (d, e) => { s.names = e.checked; G.State.save(true); }, low: (d, e) => { s.lowPower = e.checked; G.State.save(true); window.dispatchEvent(new Event('resize')); },
        season: (d, e) => { s.season = e.value; G.State.save(true); G.UI.hud(); G.UI.toast('Saison : ' + G.Game.seasonData().name, G.Game.seasonData().icon); },
        help: () => { m.close(); G.Main.welcome(true); },
        reset: () => G.UI.confirm('Recommencer ?', 'Toute la progression sera effacée (pensez à exporter votre sauvegarde avant).', 'Tout effacer', () => G.UI.confirm('Vraiment sûr·e ?', 'Cette action est définitive.', 'Oui, recommencer', () => { G.State.reset(); location.reload(); })),
      });
      el.querySelector('#impFile').addEventListener('change', e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => doImport(r.result); r.readAsText(f); });
    } });
  }
  function doImport(str) {
    try { G.State.importString(str); G.UI.toast('Sauvegarde importée ! Rechargement…', '✅', 'good'); setTimeout(() => location.reload(), 700); }
    catch (e) { G.UI.toast('Import impossible : ' + e.message, '⚠️', 'bad'); }
  }

  /* Rafraîchissement léger des éléments « live » (sans reconstruire le panneau) */
  function tick() {
    const cur = G.UI.currentView(); if (!cur || cur.tab !== 'gestion') return;
    if (cur.sub === 'ads') { const el = document.getElementById('adLive'); if (el) el.innerHTML = adsLive(); }
    if (cur.sub === 'bar') document.querySelectorAll('[data-live="order"]').forEach(el => { const o = G.Sys.Bar.queue.find(x => x.id === el.dataset.id); if (o) el.innerHTML = bar(1 - (Date.now() - o.created) / 1000 / o.patience); });
  }

  return { explorer, gestion, collections, gazette, settings, inventoryHtml, passportHtml, missionsHtml, unmount, tick, showSpecies };
})();
