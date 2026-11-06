/* ARCHIPEL — Aquarium : bassins, température, qualité de l'eau, décor, compatibilité */

G.Sys.Aquarium = (() => {
  const S = () => G.state, U = G.U, Game = () => G.Game;

  function tanks() { return S().aquarium.tanks; }
  function fishIn(ti) { return S().fish.filter(f => f.tank === ti); }
  function reserve() { return S().fish.filter(f => f.tank === null || f.tank === undefined); }
  function capacity() { return Game().bLevelData('aquarium').capacity; }
  function hasTech() { for (const id in S().chars) if (S().chars[id].job === 'aquarium') return true; return false; }

  function happiness(f) {
    if (f.tank === null || f.tank === undefined) return { value: null, reasons: ['En réserve'] };
    const t = tanks()[f.tank]; const sp = G.D.fish[f.sp]; const reasons = []; let h = 1;
    if (t.env !== sp.env) { h -= 0.5; reasons.push('Mauvaise eau (besoin : ' + G.D.waterEnvs[sp.env].name + ')'); }
    if (t.temp < sp.temp[0]) { h -= 0.08 * (sp.temp[0] - t.temp); reasons.push('Trop froid (' + sp.temp[0] + '–' + sp.temp[1] + ' °C)'); }
    if (t.temp > sp.temp[1]) { h -= 0.08 * (t.temp - sp.temp[1]); reasons.push('Trop chaud (' + sp.temp[0] + '–' + sp.temp[1] + ' °C)'); }
    if (t.decor < sp.decor) { h -= 0.12 * (sp.decor - t.decor); reasons.push('Manque de décor (niveau ' + sp.decor + ' souhaité)'); }
    if (t.quality < 100) { const p = (1 - t.quality / 100) * 0.5; h -= p; if (t.quality < 70) reasons.push('Eau peu propre (' + Math.round(t.quality) + ' %)'); }
    const others = fishIn(f.tank);
    if (others.length > capacity()) { h -= 0.2; reasons.push('Bassin surpeuplé'); }
    if (others.some(o => o.uid !== f.uid && G.D.fish[o.sp].predator && G.D.fish[o.sp].size > sp.size)) { h -= 0.35; reasons.push('Un prédateur le menace'); }
    if (hasTech()) h += 0.05;
    if (!reasons.length) reasons.push('Nage avec bonheur');
    return { value: U.clamp(h, 0, 1), reasons };
  }
  function placed() { return S().fish.filter(f => f.tank !== null && f.tank !== undefined); }
  function avgHappiness() { const p = placed(); if (!p.length) return null; return p.reduce((s, f) => s + happiness(f).value, 0) / p.length; }
  function satisfaction() {
    const p = placed(); if (!p.length) return 0.2;
    const species = new Set(p.map(f => f.sp)).size;
    return U.clamp(0.2 + 0.55 * avgHappiness() + 0.08 * Math.min(species, 5), 0.15, 1.2);
  }
  function setTemp(ti, delta) { const t = tanks()[ti]; t.temp = U.clamp(t.temp + delta, 4, 30); U.emit('aquarium'); G.State.save(); }
  function setEnv(ti, env) {
    const t = tanks()[ti]; if (t.env === env) return;
    if (fishIn(ti).length) { G.UI.toast('Videz le bassin avant de changer le type d\'eau.', '💧', 'bad'); return false; }
    if (!Game().spend(50, 'aquarium')) return false;
    t.env = env; t.name = 'Bassin ' + (env === 'mer' ? 'marin' : 'd\'eau douce'); U.emit('aquarium'); G.State.save(); return true;
  }
  function clean(ti) {
    const t = tanks()[ti]; if (t.quality >= 98) { G.UI.toast('L\'eau est déjà limpide.', '✨'); return false; }
    if (!Game().spend(6, 'aquarium')) return false;
    t.quality = 100; t.lastClean = Date.now(); U.emit('aquarium'); G.State.save(); return true;
  }
  function decorCost(t) { return 70 * (t.decor + 1); }
  function buyDecor(ti) {
    const t = tanks()[ti]; if (t.decor >= 3) return false;
    const stone = t.decor + 1;
    if (!Game().hasRes({ pierre: stone })) { G.UI.toast('Il faut ' + stone + ' pierre(s) pour ce décor.', '🪨', 'bad'); return false; }
    if (!Game().spend(decorCost(t), 'aquarium')) return false;
    Game().takeRes({ pierre: stone }); t.decor++; U.emit('aquarium'); G.State.save(); return true;
  }
  function place(uid, ti) {
    const f = S().fish.find(x => x.uid === uid); if (!f) return false;
    if (fishIn(ti).length >= capacity()) { G.UI.toast('Bassin plein (capacité ' + capacity() + ').', '🐟', 'bad'); return false; }
    f.tank = ti; U.emit('aquarium'); G.State.save(); return true;
  }
  function remove(uid) { const f = S().fish.find(x => x.uid === uid); if (f) { f.tank = null; U.emit('aquarium'); G.State.save(); } }
  function release(uid) { const i = S().fish.findIndex(x => x.uid === uid); if (i >= 0) { S().fish.splice(i, 1); U.emit('aquarium'); G.State.save(); } }
  function addFish(sp) { const f = { uid: G.U.uid('f'), sp, tank: null }; S().fish.push(f); U.emit('aquarium'); return f; }
  function tick(minutes, floor) {
    const rate = hasTech() ? 0.75 : 1.5;
    tanks().forEach((t, i) => { if (fishIn(i).length) t.quality = Math.max(Math.min(t.quality, floor || 0), t.quality - rate * minutes); });
  }

  return { tanks, fishIn, reserve, capacity, happiness, placed, avgHappiness, satisfaction, setTemp, setEnv, clean, decorCost, buyDecor, place, remove, release, addFish, tick, hasTech };
})();
