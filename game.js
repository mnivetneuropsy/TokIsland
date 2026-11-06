/* ARCHIPEL — actions de jeu, économie, cycle de simulation, rattrapage hors ligne */

G.Game = (() => {
  const U = G.U;
  const S = () => G.state;
  // accumulateurs du cycle en cours (non sauvegardés)
  const acc = { visits: {}, rev: {}, exp: 0 };

  function rep() { const s = S(); let r = s.repBonus; for (const k in s.bstats) r += s.bstats[k].rep; return Math.max(0, Math.floor(r)); }

  function addCoins(n, bkey) {
    n = Math.round(n); if (!n) return;
    S().coins += n;
    if (bkey && S().bstats[bkey]) { S().bstats[bkey].rev += n; acc.rev[bkey] = (acc.rev[bkey] || 0) + n; }
    U.emit('hud');
  }
  function spend(n, bkey) {
    n = Math.round(n);
    if (S().coins < n) { G.UI && G.UI.toast('Pas assez de pièces (' + U.fmt(n) + ' nécessaires).', '🪙', 'bad'); return false; }
    S().coins -= n;
    if (bkey && S().bstats[bkey]) S().bstats[bkey].exp += n;
    acc.exp += n;
    U.emit('hud');
    return true;
  }
  function addRep(n, bkey) {
    const s = S();
    if (bkey && s.bstats[bkey]) s.bstats[bkey].rep = Math.max(0, s.bstats[bkey].rep + n);
    else s.repBonus = Math.max(0, s.repBonus + n);
    U.emit('hud');
  }
  function addDisc(n, fromExplore) {
    if (fromExplore && G.Sys.Gazette) n *= G.Sys.Gazette.effect('discovery', 1);
    n = Math.round(n); S().discovery += n; U.emit('hud'); return n;
  }
  function addRes(id, n = 1) { S().res[id] = (S().res[id] || 0) + n; U.emit('inventory'); }
  function hasRes(obj) { for (const k in obj) if ((S().res[k] || 0) < obj[k]) return false; return true; }
  function takeRes(obj) { if (!hasRes(obj)) return false; for (const k in obj) S().res[k] -= obj[k]; U.emit('inventory'); return true; }
  function itemCount(id) { return S().items[id] || 0; }
  function addItem(id, n = 1) {
    if (!G.D.items[id]) { console.warn('objet inconnu', id); return; }
    S().items[id] = (S().items[id] || 0) + n;
    const isNew = discover('items', id);
    U.emit('inventory');
    return isNew;
  }
  function takeItem(id, n = 1) { if (itemCount(id) < n) return false; S().items[id] -= n; U.emit('inventory'); return true; }

  function discover(kind, id) {
    const c = S().codex[kind];
    if (!c || c[id]) return false;
    c[id] = Date.now();
    U.emit('codex', { kind, id });
    return true;
  }

  function log(text, icon = '•') {
    const s = S();
    s.log.unshift({ t: Date.now(), text, icon });
    if (s.log.length > 80) s.log.length = 80;
    U.emit('log');
  }
  function notify(text, icon = '✨', kind) { log(text, icon); G.UI && G.UI.toast(text, icon, kind); }

  function counter(name, n = 1) {
    const s = S(); s.counters[name] = (s.counters[name] || 0) + n;
    U.emit('counter', { name, n });
  }

  /* Applique une récompense et renvoie une description lisible */
  function grant(r, quiet) {
    if (!r) return '';
    const parts = [];
    if (r.coins) { addCoins(r.coins); parts.push('🪙 ' + r.coins); }
    if (r.rep) { addRep(r.rep); parts.push('⭐ +' + r.rep + ' réputation'); }
    if (r.disc) { const d = addDisc(r.disc); parts.push('🔍 +' + d + ' découverte'); }
    if (r.item) { addItem(r.item); parts.push('🏺 ' + G.D.items[r.item].name); }
    if (r.res) for (const k in r.res) { addRes(k, r.res[k]); parts.push(r.res[k] + '× ' + G.D.resources[k].name); }
    if (r.recipe && !S().bar.recipes.includes(r.recipe)) { S().bar.recipes.push(r.recipe); parts.push('📜 Recette : ' + G.D.recipes[r.recipe].name); }
    if (r.flag) { S().flags[r.flag] = true; U.emit('flag', r.flag); }
    const txt = parts.join(' · ');
    if (!quiet && txt) log('Récompense : ' + txt, '🎁');
    return txt;
  }

  function season() { const s = S().settings.season; return s && s !== 'auto' ? s : U.seasonOf(new Date()); }
  function seasonData() { return G.D.seasons[season()]; }

  function bLevel(k) { return S().buildings[k].level; }
  function bLevelData(k) { return G.D.buildings[k].levels[bLevel(k) - 1]; }

  function canUpgrade(k) {
    const lv = bLevel(k); const next = G.D.buildings[k].levels[lv];
    if (!next) return { ok: false, reason: 'Niveau maximum atteint.' };
    if (next.rep && rep() < next.rep) return { ok: false, next, reason: 'Réputation ' + next.rep + ' requise.' };
    if (next.disc && S().discovery < next.disc) return { ok: false, next, reason: next.disc + ' points de découverte requis.' };
    if (S().coins < next.cost) return { ok: false, next, reason: U.fmt(next.cost) + ' pièces requises.' };
    return { ok: true, next };
  }
  function upgradeBuilding(k) {
    const c = canUpgrade(k); if (!c.ok) { G.UI.toast(c.reason, '🔒', 'bad'); return false; }
    if (!spend(c.next.cost, k)) return false;
    S().buildings[k].level++;
    // contenu débloqué par le niveau
    if (k === 'museum') { while (S().museum.rooms.length < c.next.rooms) S().museum.rooms.push({ theme: 'art', slots: Array(S().museum.rooms.length === 1 ? 6 : 8).fill(null) }); }
    if (k === 'zoo') while (S().zoo.habitats.length < c.next.habitats) S().zoo.habitats.push(G.State.newHabitat(S().zoo.habitats.length === 1 ? 'plaine' : 'rocheux'));
    if (k === 'aquarium') while (S().aquarium.tanks.length < c.next.tanks) S().aquarium.tanks.push(G.State.newTank(S().aquarium.tanks.length === 1 ? 'douce' : 'mer', S().aquarium.tanks.length === 1 ? 'Bassin d\'eau douce' : 'Grand bassin abyssal'));
    addRep(3, k);
    notify(G.D.buildings[k].name + ' amélioré : ' + c.next.label + ' !', '🏗️', 'good');
    U.emit('buildings');
    G.State.save(true);
    return true;
  }

  /* ---------- Cycle économique (toutes les 60 s de jeu actif) ---------- */
  function employeesCount() { let n = 0; for (const id in S().chars) if (S().chars[id].job) n++; return n; }

  function cycle() {
    const s = S();
    // dépenses : salaires et entretien
    const salaries = employeesCount() * 3;
    const upkeep = Math.round((bLevel('museum') + bLevel('zoo') + bLevel('aquarium') + bLevel('bar')) * 0.5);
    const exp = salaries + upkeep;
    if (exp > 0) { s.coins = Math.max(0, s.coins - exp); acc.exp += exp; s.bstats.office.exp += exp; }
    // dégradation douce
    G.Sys.Zoo && G.Sys.Zoo.tick(1, 0);
    G.Sys.Aquarium && G.Sys.Aquarium.tick(1, 0);
    // réputation qui suit le bien-être
    if (G.Sys.Zoo) { const w = G.Sys.Zoo.avgWelfare(); if (w !== null) addRep(w > 0.75 ? 0.15 : w < 0.4 ? -0.15 : 0, 'zoo'); }
    if (G.Sys.Aquarium) { const w = G.Sys.Aquarium.avgHappiness(); if (w !== null) addRep(w > 0.75 ? 0.12 : w < 0.4 ? -0.12 : 0, 'aquarium'); }
    // si l'île n'est pas affichée, la fréquentation est estimée statistiquement
    if (!G.Sys.Sim || !G.Sys.Sim.isRunning()) statSim(1, 0.7);
    G.Sys.Ads && G.Sys.Ads.prune();
    // historique pour les finances
    s.history.push({ t: Date.now(), visits: Object.assign({}, acc.visits), rev: Object.assign({}, acc.rev), exp: acc.exp });
    if (s.history.length > 30) s.history.shift();
    acc.visits = {}; acc.rev = {}; acc.exp = 0;
    G.Sys.Gazette && G.Sys.Gazette.checkNewWeek();
    U.emit('hud'); U.emit('cycle');
    G.State.save(true);
  }

  function recordVisit(bkey, sat) {
    const b = S().bstats[bkey]; if (!b) return;
    b.visits++; b.sat = b.sat * 0.92 + sat * 0.08;
    acc.visits[bkey] = (acc.visits[bkey] || 0) + 1;
    if (sat > 0.85) b.rep += 0.08; else if (sat < 0.35) b.rep = Math.max(0, b.rep - 0.04);
  }

  /* Simulation statistique (île non affichée, ou absence) */
  function statSim(minutes, factor, offline) {
    if (!G.Sys.Sim) return { visitors: 0, coins: 0 };
    const rate = G.Sys.Sim.rate();
    const visitors = Math.floor(rate * minutes);
    const att = G.Sys.Sim.attractions();
    let tot = 0; for (const k in att) tot += att[k];
    let coins = 0;
    for (const k of ['museum', 'zoo', 'aquarium', 'bar']) {
      const share = att[k] / tot; const n = visitors * share * 1.6;
      const sat = k === 'bar' ? S().bstats.bar.sat : G.Sys.Sim.satisfactionFor(k);
      let price = k === 'bar' ? avgDrinkPrice() * (G.Sys.Bar.hasStaff() ? 0.75 : 0.45) : G.D.buildings[k].ticket;
      const c = Math.round(n * price * (0.5 + 0.6 * sat) * factor);
      if (c > 0) { addCoins(c, k); coins += c; }
      const nv = Math.round(n); S().bstats[k].visits += nv; acc.visits[k] = (acc.visits[k] || 0) + nv;
    }
    if (visitors && !offline) counter('visitors', visitors);
    return { visitors, coins };
  }
  function avgDrinkPrice() { const r = S().bar.recipes; let p = 0; r.forEach(id => p += G.D.recipes[id].price); return r.length ? p / r.length : 10; }

  /* Rattrapage hors ligne : plafonné (6 h, rendement 20 %), jamais punitif */
  function offlineCatchUp() {
    const s = S();
    const elapsed = Date.now() - (s.lastSeen || Date.now());
    if (elapsed < 2 * 60000) return null;
    const minutes = Math.min(elapsed / 60000, 360);
    const r = statSim(minutes, 0.2, true);
    // dégradation plafonnée : la nourriture et l'eau ne descendent pas sous 50 %
    G.Sys.Zoo.tick(minutes, 50); G.Sys.Aquarium.tick(minutes, 50);
    G.Sys.Ads.prune();
    return { minutes: Math.round(minutes), capped: elapsed / 60000 > 360, ...r };
  }

  return { rep, addCoins, spend, addRep, addDisc, addRes, hasRes, takeRes, itemCount, addItem, takeItem, discover, log, notify, counter, grant, season, seasonData, bLevel, bLevelData, canUpgrade, upgradeBuilding, cycle, recordVisit, statSim, offlineCatchUp, employeesCount, avgDrinkPrice, acc };
})();
