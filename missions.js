/* ARCHIPEL — missions, dialogues des PNJ, passeport d'île */

G.Sys.Missions = (() => {
  const S = () => G.state, U = G.U, Game = () => G.Game;

  function M(id) { return G.D.missions[id]; }
  function ist(island) { return S().islands[island]; }
  function st(id) { return ist(M(id).island).missions[id]; }
  function isDone(id) { const s = st(id); return !!(s && s.state === 'done'); }
  function isActive(id) { const s = st(id); return !!(s && s.state === 'active'); }
  function isAvailable(id) { return !st(id) && M(id).requires.every(isDone); }

  function identified(island) { return Object.keys(S().codex.animals).filter(sp => G.D.animals[sp] && G.D.animals[sp].origin === island).length; }

  function objProgress(id, o) {
    const s = st(id) || {};
    switch (o.type) {
      case 'dig': case 'catch': {
        const key = o.type === 'dig' ? 'dig' : 'fish';
        const cur = s.base ? S().counters[key] - (s.base[key] || 0) : 0; return { cur: Math.min(cur, o.n), n: o.n, ok: cur >= o.n };
      }
      case 'identify': { const cur = identified(M(id).island); return { cur: Math.min(cur, o.n), n: o.n, ok: cur >= o.n }; }
      case 'deliver': { const cur = S().res[o.res] || 0; return { cur: Math.min(cur, o.n), n: o.n, ok: cur >= o.n }; }
      case 'have': { const cur = Game().itemCount(o.item) > 0 ? 1 : 0; return { cur, n: 1, ok: !!cur }; }
      case 'zone': { const cur = ist(M(id).island).zones[o.zone] ? 1 : 0; return { cur, n: 1, ok: !!cur }; }
      case 'flag': { const cur = S().flags[o.flag] ? 1 : 0; return { cur, n: 1, ok: !!cur }; }
    }
    return { cur: 0, n: 1, ok: false };
  }
  function ready(id) { return isActive(id) && M(id).objectives.every(o => objProgress(id, o).ok); }

  function accept(id) {
    if (!isAvailable(id)) return false;
    ist(M(id).island).missions[id] = { state: 'active', t: Date.now(), base: { dig: S().counters.dig, fish: S().counters.fish } };
    Game().log('Nouvelle mission : ' + M(id).title, '📜');
    U.emit('missions'); G.State.save(); return true;
  }
  function turnIn(id) {
    if (!ready(id)) return null;
    const m = M(id);
    const deliver = {}; m.objectives.filter(o => o.type === 'deliver').forEach(o => deliver[o.res] = (deliver[o.res] || 0) + o.n);
    if (Object.keys(deliver).length && !Game().takeRes(deliver)) return null;
    ist(m.island).missions[id] = { state: 'done', t: Date.now() };
    const txt = Game().grant(m.reward);
    G.Sys.Chars.remember(m.giver, 'Mission accomplie avec vous : « ' + m.title + ' »');
    G.Sys.Chars.addAffinityPlayer && G.Sys.Chars.addAffinityPlayer(m.giver, 3);
    G.Sys.Chars.mood(m.giver, 15);
    Game().notify('Mission accomplie : ' + m.title, '🏆', 'good');
    U.emit('missions'); checkIsland(m.island); G.State.save(true);
    return txt;
  }

  function forNpc(npc) { return Object.keys(G.D.missions).filter(id => M(id).giver === npc); }

  /* Construit le dialogue d'un PNJ selon l'état de ses missions */
  function dialogue(npc) {
    const d = G.D.characters[npc]; const list = forNpc(npc);
    for (const id of list) if (ready(id)) return { mode: 'turnin', id, text: M(id).done };
    for (const id of list) if (isActive(id)) return { mode: 'waiting', id, text: M(id).waiting };
    for (const id of list) if (isAvailable(id)) return { mode: 'offer', id, text: M(id).offer };
    const locked = list.find(id => !st(id));
    if (locked) {
      const req = M(locked).requires.filter(r => !isDone(r)).map(r => '« ' + M(r).title + ' »');
      return { mode: 'locked', id: locked, text: U.pick(d.talk) + (req.length ? ' (Revenez après : ' + req.join(', ') + '.)' : '') };
    }
    return { mode: 'chat', text: U.pick(d.talk) };
  }

  function passport(island) {
    const def = G.D.islands[island]; const p = def.passport; const s = ist(island);
    const zones = Object.keys(s.zones).length;
    const mains = Object.keys(G.D.missions).filter(id => M(id).island === island && M(id).main);
    const mainDone = mains.filter(isDone).length;
    const species = identified(island);
    const items = p.items.filter(i => Game().itemCount(i) > 0).length;
    const chars = p.chars.filter(c => S().chars[c].met).length;
    const rows = [
      { label: 'Zones découvertes', cur: Math.min(zones, p.zones), n: p.zones },
      { label: 'Missions principales', cur: mainDone, n: mains.length },
      { label: 'Espèces identifiées', cur: Math.min(species, p.species), n: p.species },
      { label: 'Objets principaux', cur: items, n: p.items.length, detail: p.items.map(i => G.D.items[i].name) },
      { label: 'Personnages importants', cur: chars, n: p.chars.length, detail: p.chars.map(c => G.D.characters[c].name) },
    ];
    return { rows, complete: rows.every(r => r.cur >= r.n) };
  }
  function checkIsland(island) {
    const s = ist(island); const pp = passport(island);
    if (pp.complete && !s.completed) {
      s.completed = Date.now();
      const map = G.D.islands[island].unlocksMap;
      if (map) {
        S().flags[map] = true;
        const next = G.D.islandOrder[G.D.islandOrder.indexOf(island) + 1];
        if (next) S().islands[next].unlocked = true;
        Game().addRep(10); Game().addDisc(50);
        G.UI.eventPopup('Passeport complété !', 'Vous avez accompli les objectifs principaux de l\'' + G.D.islands[island].name + '. Vous recevez une carte maritime vers l\'' + G.D.islands[next].name + '.', '⭐ +10 réputation · 🔍 +50 découverte', []);
      }
      U.emit('islands');
    }
  }
  function activeList() { return Object.keys(G.D.missions).filter(isActive); }

  return { M, st, isDone, isActive, isAvailable, objProgress, ready, accept, turnIn, forNpc, dialogue, passport, checkIsland, activeList, identified };
})();
