/* ARCHIPEL — Musée : exposition, cohérence, restauration, satisfaction */

G.Sys.Museum = (() => {
  const S = () => G.state, U = G.U, Game = () => G.Game;
  const ROOM_NAMES = ['Salle des Origines', 'Galerie des Peuples Anciens', 'Rotonde des Merveilles'];

  function rooms() { return S().museum.rooms; }
  function displayedCount(id) { let n = 0; rooms().forEach(r => r.slots.forEach(s => { if (s === id) n++; })); return n; }
  function available(id) { return Game().itemCount(id) - displayedCount(id); }
  function ownedIds() { return Object.keys(S().items).filter(id => S().items[id] > 0); }
  function availableList() { return ownedIds().filter(id => available(id) > 0); }

  function qualityMult(id) { const q = S().quality[id]; return q === 3 ? 1.25 : q === 1 ? 0.85 : 1; }
  function itemValue(id) { const it = G.D.items[id]; return it.value * qualityMult(id); }

  function roomScore(ri) {
    const r = rooms()[ri]; const ids = r.slots.filter(Boolean);
    if (!ids.length) return { score: 0, coherence: 0, count: 0, full: false };
    let base = 0; ids.forEach(id => base += itemValue(id));
    const match = ids.filter(id => G.D.items[id].cat === r.theme).length;
    const coherence = match / ids.length; // part des objets fidèles au thème
    const uniq = new Set(ids).size / ids.length; // les doublons lassent
    const full = ids.length === r.slots.length;
    const score = base * (0.7 + 0.6 * coherence) * (0.6 + 0.4 * uniq) * (full ? 1.15 : 1);
    return { score: Math.round(score), coherence, count: ids.length, full, uniq };
  }
  function score() { let s = 0; rooms().forEach((_, i) => s += roomScore(i).score); return s; }
  function hasGuide() { for (const id in S().chars) if (S().chars[id].job === 'museum') return true; return false; }
  function satisfaction() {
    const target = 45 * rooms().length;
    let sat = 0.25 + 0.75 * Math.min(1.3, score() / target);
    if (hasGuide()) sat += 0.1;
    return U.clamp(sat, 0.15, 1.2);
  }

  function place(ri, si, id) {
    if (available(id) <= 0) { G.UI.toast('Cet objet est déjà exposé.', '🏺', 'bad'); return false; }
    rooms()[ri].slots[si] = id;
    if (G.D.items[id].cat === rooms()[ri].theme) Game().addRep(0.3, 'museum');
    U.emit('museum'); G.State.save();
    return true;
  }
  function remove(ri, si) { rooms()[ri].slots[si] = null; U.emit('museum'); G.State.save(); }
  function setTheme(ri, theme) { rooms()[ri].theme = theme; U.emit('museum'); G.State.save(); }
  function autoArrange(ri) {
    const r = rooms()[ri];
    r.slots = r.slots.map(() => null);
    const pool = availableList().sort((a, b) => (G.D.items[b].cat === r.theme) - (G.D.items[a].cat === r.theme) || itemValue(b) - itemValue(a));
    let i = 0; for (const id of pool) { if (i >= r.slots.length) break; r.slots[i++] = id; }
    U.emit('museum'); G.State.save();
  }

  function sellValue(id) { return Math.round(G.D.items[id].value * 2.5); }
  function sell(id) {
    if (available(id) <= 0) return false;
    if (Game().itemCount(id) <= 1) { G.UI.toast('Gardez au moins un exemplaire pour votre collection.', '🏺', 'bad'); return false; }
    Game().takeItem(id); Game().addCoins(sellValue(id), 'museum');
    Game().log('Vendu : ' + G.D.items[id].name + ' (+' + sellValue(id) + ' 🪙)', '💰');
    U.emit('museum'); return true;
  }

  function canRestore(id) { const r = G.D.restorations[id]; return r && Game().hasRes(r.needs); }
  function restore(id, stars) {
    const r = G.D.restorations[id]; if (!r || !Game().takeRes(r.needs)) return false;
    Game().addItem(id);
    S().quality[id] = Math.max(S().quality[id] || 0, stars);
    Game().addDisc(15 + stars * 5);
    Game().counter('restored');
    Game().notify('Restauration réussie : ' + G.D.items[id].name + ' ' + '★'.repeat(stars), '🦴', 'good');
    U.emit('museum'); G.State.save(true);
    return true;
  }

  return { ROOM_NAMES, rooms, displayedCount, available, availableList, ownedIds, qualityMult, itemValue, roomScore, score, satisfaction, place, remove, setTheme, autoArrange, sellValue, sell, canRestore, restore, hasGuide };
})();
