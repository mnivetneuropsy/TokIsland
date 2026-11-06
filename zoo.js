/* ARCHIPEL — Zoo : habitats, besoins, compatibilité, bien-être, nourrissage */

G.Sys.Zoo = (() => {
  const S = () => G.state, U = G.U, Game = () => G.Game;
  const PARAMS = ['espace', 'vegetation', 'eau', 'abris', 'enrichissement'];

  function habitats() { return S().zoo.habitats; }
  function animal(uid) { return S().animals.find(a => a.uid === uid); }
  function inHabitat(hi) { return S().animals.filter(a => a.hab === hi); }
  function reserve() { return S().animals.filter(a => a.hab === null || a.hab === undefined); }
  function capacity(h) { return 2 + h.espace * 2; }
  function used(hi) { return inHabitat(hi).reduce((s, a) => s + G.D.animals[a.sp].size, 0); }
  function hasKeeper() { for (const id in S().chars) if (S().chars[id].job === 'zoo') return true; return false; }

  function conflicts(a, others) {
    const sa = G.D.animals[a.sp]; const out = [];
    for (const o of others) {
      if (o.uid === a.uid) continue;
      const so = G.D.animals[o.sp];
      if (sa.diet === 'herbivore' && so.diet === 'carnivore' && so.size >= sa.size) out.push(so.name + ' l\'effraie');
      if (sa.diet === 'carnivore' && so.diet === 'herbivore' && sa.size >= so.size) out.push('veut chasser le ' + so.name.toLowerCase());
      if (sa.diet === 'carnivore' && so.diet === 'carnivore' && o.sp !== a.sp) out.push('rivalité avec ' + so.name.toLowerCase());
    }
    return [...new Set(out)];
  }

  function welfare(a) {
    if (a.hab === null || a.hab === undefined) return { value: null, reasons: ['En réserve'] };
    const h = habitats()[a.hab]; const sp = G.D.animals[a.sp]; const reasons = [];
    let w = 1;
    for (const p of PARAMS) { const d = sp.needs[p] - h[p]; if (d > 0) { w -= 0.09 * d; reasons.push(G.D.habitatParams[p].name + ' insuffisant(e) (' + h[p] + '/' + sp.needs[p] + ')'); } }
    if (h.biome !== sp.biome) { w -= 0.2; reasons.push('Biome inadapté (préfère : ' + G.D.biomes[sp.biome].name + ')'); }
    if (h.food < 50) { w -= (50 - h.food) / 50 * 0.3; reasons.push('A faim'); }
    if (used(a.hab) > capacity(h)) { w -= 0.25; reasons.push('Enclos surpeuplé'); }
    const others = inHabitat(a.hab);
    if (sp.social && others.filter(o => o.sp === a.sp).length < 2) { w -= 0.1; reasons.push('Se sent seul (espèce sociale)'); }
    const c = conflicts(a, others); if (c.length) { w -= 0.3; reasons.push(...c); }
    if (hasKeeper()) w += 0.05;
    if (!reasons.length) reasons.push('Parfaitement heureux');
    return { value: U.clamp(w, 0, 1), reasons };
  }
  function habWelfare(hi) { const as = inHabitat(hi); if (!as.length) return null; return as.reduce((s, a) => s + welfare(a).value, 0) / as.length; }
  function placed() { return S().animals.filter(a => a.hab !== null && a.hab !== undefined); }
  function avgWelfare() { const p = placed(); if (!p.length) return null; return p.reduce((s, a) => s + welfare(a).value, 0) / p.length; }
  function satisfaction() {
    const p = placed(); if (!p.length) return 0.2;
    const species = new Set(p.map(a => a.sp)).size;
    return U.clamp(0.2 + 0.55 * avgWelfare() + 0.08 * Math.min(species, 5), 0.15, 1.2);
  }

  function upgradeCost(h, p) { const lv = h[p]; const res = G.D.habitatParams[p].res; return { coins: 35 * (lv + 1), res: res ? { [res]: lv + 1 } : null }; }
  function upgradeParam(hi, p) {
    const h = habitats()[hi]; if (h[p] >= 5) return false;
    const c = upgradeCost(h, p);
    if (c.res && !Game().hasRes(c.res)) { G.UI.toast('Ressources manquantes : ' + Object.keys(c.res).map(k => c.res[k] + '× ' + G.D.resources[k].name).join(', '), '🪵', 'bad'); return false; }
    if (!Game().spend(c.coins, 'zoo')) return false;
    if (c.res) Game().takeRes(c.res);
    h[p]++; U.emit('zoo'); G.State.save(); return true;
  }
  function setBiome(hi, biome) {
    const h = habitats()[hi]; if (h.biome === biome) return;
    if (!Game().spend(60, 'zoo')) return false;
    h.biome = biome; U.emit('zoo'); G.State.save(); return true;
  }
  function place(uid, hi) {
    const a = animal(uid); if (!a) return false;
    const h = habitats()[hi]; const sz = G.D.animals[a.sp].size;
    if (used(hi) + sz > capacity(h)) { G.UI.toast('Pas assez d\'espace dans cet habitat (améliorez l\'Espace).', '📐', 'bad'); return false; }
    a.hab = hi; U.emit('zoo'); G.State.save(); return true;
  }
  function remove(uid) { const a = animal(uid); if (a) { a.hab = null; U.emit('zoo'); G.State.save(); } }
  function feedCost(hi) { return Math.max(2, inHabitat(hi).length * 3); }
  function feed(hi) {
    const h = habitats()[hi]; if (!inHabitat(hi).length) { G.UI.toast('Aucun animal à nourrir ici.', '🥕'); return false; }
    if (h.food >= 95) { G.UI.toast('Ils n\'ont pas faim pour le moment.', '🥕'); return false; }
    if (!Game().spend(feedCost(hi), 'zoo')) return false;
    h.food = 100; Game().counter('feed'); U.emit('zoo'); U.emit('zoo:feed', hi); G.State.save(); return true;
  }
  function tick(minutes, floor) {
    const rate = hasKeeper() ? 1.5 : 3;
    habitats().forEach((h, i) => { if (inHabitat(i).length) h.food = Math.max(Math.min(h.food, floor || 0), h.food - rate * minutes); });
  }
  function adopt(sp) {
    const a = { uid: G.U.uid('a'), sp, name: null, hab: null, since: Date.now() };
    S().animals.push(a); U.emit('zoo'); return a;
  }
  function rename(uid, name) { const a = animal(uid); if (a) { a.name = name.slice(0, 20) || null; U.emit('zoo'); G.State.save(); } }
  function release(uid) { const i = S().animals.findIndex(a => a.uid === uid); if (i >= 0) { S().animals.splice(i, 1); U.emit('zoo'); G.State.save(); } }

  return { PARAMS, habitats, animal, inHabitat, reserve, capacity, used, welfare, habWelfare, avgWelfare, placed, satisfaction, upgradeCost, upgradeParam, setBiome, place, remove, feed, feedCost, tick, adopt, rename, release, conflicts, hasKeeper };
})();
