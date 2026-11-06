/* ARCHIPEL — Bar-café : file de commandes, génération, notation, préférences, personnel */

G.Sys.Bar = (() => {
  const S = () => G.state, U = G.U, Game = () => G.Game;
  const queue = []; // commandes en attente (transitoire)
  let lastWalkIn = 0;

  function tables() { return Game().bLevelData('bar').tables + S().bar.upg.tables; }
  function hasStaff() { for (const id in S().chars) if (S().chars[id].job === 'bar') return true; return false; }
  function maxUpg() { return Game().bLevelData('bar').maxUpg; }
  function priceMult() { return 1 + 0.08 * S().bar.upg.recettes; }
  function stocked(rid) { const r = G.D.recipes[rid]; return !r.stock || Game().hasRes(r.stock); }
  function availableRecipes() { return S().bar.recipes.filter(stocked); }

  function demand(rid) {
    const r = G.D.recipes[rid]; let w = Game().seasonData().drinks[r.type] || 1;
    const tr = G.Sys.Gazette.trend(); if (tr && tr.effect.recipe === rid) w *= tr.effect.demand;
    w *= G.Sys.Ads.recipeMult(rid);
    return w;
  }

  function randomOrder(rid) {
    const r = G.D.recipes[rid];
    const extras = r.extras.filter(() => Math.random() < 0.3).slice(0, 1);
    const ng = U.randi(0, Math.min(2, r.garnishes.length));
    const garnishes = U.shuffle(r.garnishes).slice(0, ng);
    return { recipe: rid, level: U.randi(0, 2), extras, garnishes };
  }

  function makeOrder(charId, name) {
    const avail = availableRecipes(); if (!avail.length) return null;
    const pref = charId && S().bar.prefs[charId];
    let o, usual = false;
    if (pref && avail.includes(pref.recipe) && Math.random() < 0.55) { o = JSON.parse(JSON.stringify(pref)); usual = true; }
    else {
      let rid;
      const fav = charId && G.D.characters[charId].prefs.drink;
      if (fav && avail.includes(fav) && Math.random() < 0.5) rid = fav;
      else rid = U.weighted(avail, demand);
      o = randomOrder(rid);
    }
    return { id: U.uid('o'), charId: charId || null, name: name || 'Client', usual, created: Date.now(), patience: 70 + S().bar.upg.tables * 5, ...o };
  }

  function enqueue(agent) {
    if (queue.length >= tables()) return null;
    const o = makeOrder(agent.charId, agent.name); if (!o) return null;
    o.agentId = agent.id; queue.push(o); U.emit('bar:queue'); return o;
  }
  function walkIn() {
    if (queue.length) return queue[0];
    if (Date.now() - lastWalkIn < 25000) return null;
    lastWalkIn = Date.now();
    const o = makeOrder(null, U.pick(G.D.touristNames)); if (!o) return null;
    o.walkIn = true; queue.push(o); U.emit('bar:queue'); return o;
  }
  function take(id) { const i = queue.findIndex(o => o.id === id); if (i >= 0) return queue.splice(i, 1)[0]; return null; }

  /* Notation détaillée (0..1 par critère) */
  function evaluate(order, sel) {
    const r = G.D.recipes[order.recipe];
    const recipeOK = sel.recipe === order.recipe ? 1 : 0;
    const req = new Set(r.ingredients.concat(order.extras));
    const chosen = new Set(sel.ingredients || []);
    let good = 0, bad = 0; chosen.forEach(i => req.has(i) ? good++ : bad++);
    const ing = U.clamp((good - bad) / req.size, 0, 1);
    const target = G.D.prepTypes[r.prep].targets[order.level];
    const prep = sel.prepValue == null ? 0 : U.clamp(1 - Math.abs(sel.prepValue - target) / 0.22, 0, 1);
    const reqG = new Set(order.garnishes); const selG = new Set(sel.garnishes || []);
    let diff = 0; reqG.forEach(g => { if (!selG.has(g)) diff++; }); selG.forEach(g => { if (!reqG.has(g)) diff++; });
    const garn = U.clamp(1 - diff / Math.max(2, reqG.size), 0, 1);
    const limit = 32 + S().bar.upg.comptoir * 6;
    const speed = sel.time <= limit ? 1 : U.clamp(1 - (sel.time - limit) / 30, 0, 1);
    let total = 0.15 * recipeOK + 0.25 * ing + 0.3 * prep + 0.2 * garn + 0.1 * speed;
    if (!recipeOK) total *= 0.3;
    total *= 1 + 0.05 * S().bar.upg.decor;
    total = U.clamp(total, 0, 1);
    return { recipeOK, ing, prep, garn, speed, total, limit };
  }

  function serve(order, sel, auto) {
    const r = G.D.recipes[order.recipe];
    const ev = auto ? { total: 0.6 + 0.04 * S().bar.upg.personnel, auto: true } : evaluate(order, sel);
    const recipeUsed = auto ? order.recipe : sel.recipe;
    const ru = G.D.recipes[recipeUsed];
    if (ru.stock) Game().takeRes(ru.stock);
    const cost = ru.baseCost;
    const charState = order.charId ? S().chars[order.charId] : null;
    const moodF = charState ? 0.6 + charState.mood / 250 : 0.8;
    const base = r.price * priceMult() * (0.4 + 0.8 * ev.total);
    const tip = ev.total >= 0.85 ? Math.round(r.price * 0.3 * moodF) : 0;
    const pay = Math.max(0, Math.round(base + tip - cost));
    Game().addCoins(pay, 'bar'); S().bstats.bar.exp += cost;
    Game().recordVisit('bar', ev.total);
    if (ev.total >= 0.8) Game().addRep(0.4, 'bar'); else if (ev.total < 0.4) Game().addRep(-0.2, 'bar');
    S().bar.xp += Math.round(ev.total * 10); S().bar.served++;
    S().bar.bestScore = Math.max(S().bar.bestScore, Math.round(ev.total * 100));
    Game().counter('served'); if (ev.total >= 0.9 && !auto) Game().counter('perfect');
    if (order.charId) {
      // les clients mémorisent leur commande « habituelle »
      if (!order.usual || !S().bar.prefs[order.charId]) S().bar.prefs[order.charId] = { recipe: order.recipe, level: order.level, extras: order.extras, garnishes: order.garnishes };
      G.Sys.Chars.mood(order.charId, (ev.total - 0.6) * 30);
      if (ev.total >= 0.9) G.Sys.Chars.remember(order.charId, 'A adoré son ' + r.name.toLowerCase() + ' au bar');
      if (ev.total < 0.4) G.Sys.Chars.remember(order.charId, 'A été déçu·e par sa commande au bar');
    }
    U.emit('bar:served', { order, ev, pay, tip });
    G.Sys.Sim && G.Sys.Sim.onServed(order, ev.total);
    G.State.save();
    return { ev, pay, tip, cost };
  }

  /* Personnel et patience — appelé par la simulation */
  let staffTimer = 0;
  function tick(dt) {
    const now = Date.now();
    for (let i = queue.length - 1; i >= 0; i--) {
      const o = queue[i];
      if ((now - o.created) / 1000 > o.patience && !o.inService) {
        queue.splice(i, 1);
        G.Sys.Sim && G.Sys.Sim.onServed(o, null);
        Game().recordVisit('bar', 0.3);
        U.emit('bar:queue');
      }
    }
    if (hasStaff() && queue.length) {
      staffTimer += dt;
      const delay = 16 - S().bar.upg.personnel * 3;
      if (staffTimer > delay) {
        staffTimer = 0;
        const o = queue.find(x => !x.inService && !x.walkIn && (now - x.created) / 1000 > 6);
        if (o && stocked(o.recipe)) { take(o.id); serve(o, null, true); U.emit('bar:queue'); }
      }
    }
  }

  function upgCost(k) { const lv = S().bar.upg[k]; return G.D.barUpgrades[k].costs[lv]; }
  function upgrade(k) {
    const lv = S().bar.upg[k];
    if (lv >= 3) return false;
    if (lv >= maxUpg()) { G.UI.toast('Améliorez le bar (bâtiment) pour débloquer ce niveau.', '🔒', 'bad'); return false; }
    if (k === 'personnel' && !hasStaff()) { G.UI.toast('Recrutez d\'abord un employé au bar (Gestion › Personnel).', '👤', 'bad'); return false; }
    if (!Game().spend(upgCost(k), 'bar')) return false;
    S().bar.upg[k]++; Game().addRep(1, 'bar'); U.emit('bar'); G.State.save(); return true;
  }

  function orderText(o, hideUsual) {
    const r = G.D.recipes[o.recipe]; const p = G.D.prepTypes[r.prep];
    if (o.usual && hideUsual) return 'Comme d\'habitude !';
    let t = r.name + ' · ' + p.levels[o.level];
    if (o.extras.length) t += ' · avec ' + o.extras.map(e => G.D.ingredients[e].name.toLowerCase()).join(', ');
    t += ' · ' + (o.garnishes.length ? o.garnishes.map(g => G.D.garnishes[g]).join(', ') : 'sans garniture');
    return t;
  }

  return { queue, tables, hasStaff, maxUpg, priceMult, stocked, availableRecipes, demand, makeOrder, enqueue, walkIn, take, evaluate, serve, tick, upgCost, upgrade, orderText };
})();
