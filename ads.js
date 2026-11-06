/* ARCHIPEL — campagnes publicitaires (effet temporaire et mesuré sur la fréquentation) */

G.Sys.Ads = (() => {
  const S = () => G.state, U = G.U, Game = () => G.Game;

  function slots() { return Game().bLevelData('office').adSlots; }
  function active() { const now = Date.now(); return S().ads.filter(a => a.end > now); }
  function buildingOf(a) { return G.D.adTargets[a.type].building; }

  function targetsFor(type) {
    const s = S();
    if (type === 'recette') return s.bar.recipes.map(id => ({ id, name: G.D.recipes[id].name }));
    if (type === 'exposition') return s.museum.rooms.map((r, i) => ({ id: String(i), name: G.Sys.Museum.ROOM_NAMES[i] + ' (' + G.D.categories[r.theme].name + ')' }));
    if (type === 'espece') return [...new Set(G.Sys.Zoo.placed().map(a => a.sp))].map(id => ({ id, name: G.D.animals[id].name }));
    if (type === 'aquarium') return [...new Set(G.Sys.Aquarium.placed().map(f => f.sp))].map(id => ({ id, name: G.D.fish[id].name }));
    if (type === 'evenement') return [{ id: 'fete', name: 'Fête de l\'Archipel' }, { id: 'nocturne', name: 'Nocturne aux lampions' }, { id: 'portes', name: 'Journée portes ouvertes' }];
    return [];
  }

  function start(kind, type, targetId) {
    const c = G.D.adCampaigns[kind];
    if (active().length >= slots()) { G.UI.toast('Tous les créneaux publicitaires sont occupés (améliorez le Bureau).', '📣', 'bad'); return false; }
    const targets = targetsFor(type); const t = targets.find(x => x.id === targetId);
    if (!t) { G.UI.toast('Choisissez une cible valide.', '📣', 'bad'); return false; }
    if (!Game().spend(c.cost, 'office')) return false;
    const b = G.D.adTargets[type].building;
    const v0 = b === 'all' ? ['museum', 'zoo', 'aquarium', 'bar'].reduce((s, k) => s + S().bstats[k].visits, 0) : S().bstats[b].visits;
    const ad = { id: U.uid('ad'), kind, type, target: targetId, targetName: t.name, start: Date.now(), end: Date.now() + c.minutes * 60000, boost: c.boost, v0, b };
    S().ads.push(ad);
    if (c.rep) Game().addRep(c.rep);
    Game().counter('ads');
    Game().notify('Campagne lancée : « ' + t.name + ' » (' + c.name + ')', '📣', 'good');
    U.emit('ads'); G.State.save(true);
    return ad;
  }
  function gain(ad) {
    const v = ad.b === 'all' ? ['museum', 'zoo', 'aquarium', 'bar'].reduce((s, k) => s + S().bstats[k].visits, 0) : S().bstats[ad.b].visits;
    return v - ad.v0;
  }
  /* Multiplicateur d'attraction d'un établissement */
  function mult(bkey) {
    let m = 1;
    for (const a of active()) { const b = buildingOf(a); if (b === bkey) m += a.boost; else if (b === 'all') m += a.boost * 0.6; }
    return m;
  }
  function rateMult() { let m = 1; for (const a of active()) m += a.boost * (buildingOf(a) === 'all' ? 0.5 : 0.3); return m; }
  function recipeMult(rid) { let m = 1; for (const a of active()) if (a.type === 'recette' && a.target === rid) m += a.boost * 3; return m; }
  function prune() {
    const now = Date.now();
    S().ads.forEach(a => { if (a.end <= now && !a.reported) { a.reported = true; a.result = gain(a); Game().log('Fin de campagne « ' + a.targetName + ' » : ' + a.result + ' visites pendant la campagne.', '📣'); } });
    S().ads = S().ads.filter(a => a.end > now - 3 * 3600e3).slice(-12);
  }
  return { slots, active, targetsFor, start, gain, mult, rateMult, recipeMult, prune };
})();
