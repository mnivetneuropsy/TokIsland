/* ARCHIPEL — La Gazette des Îles
   Un numéro par semaine (lundi, heure locale). Tirage déterministe : chaque banque est
   mélangée avec une graine liée au « cycle » de semaines, puis indexée par la semaine,
   ce qui évite les répétitions immédiates et garantit un contenu stable à chaque ouverture. */

G.Sys.Gazette = (() => {
  const S = () => G.state, U = G.U, Game = () => G.Game;
  const BANKS = ['news', 'trends', 'missions', 'gifts'];

  function unlockedIslands() { return G.D.islandOrder.filter(id => S().islands[id].unlocked); }
  function pickFrom(bankName, week) {
    const unl = unlockedIslands();
    const bank = G.D.gazette[bankName].filter(e => !e.requires || unl.includes(e.requires));
    const len = bank.length; const cycle = Math.floor(week / len);
    const perm = U.shuffle(bank, U.mulberry32(U.hashStr(bankName + ':' + cycle)));
    return perm[((week % len) + len) % len];
  }
  function spotlight(week) {
    const unl = unlockedIslands(); const cands = [];
    for (const id in G.D.animals) if (unl.includes(G.D.animals[id].origin)) cands.push({ kind: 'animals', id, name: G.D.animals[id].name, desc: G.D.animals[id].desc });
    for (const id in G.D.fish) if (unl.includes(G.D.fish[id].origin)) cands.push({ kind: 'fish', id, name: G.D.fish[id].name, desc: G.D.fish[id].desc });
    for (const id in G.D.items) if (unl.includes(G.D.items[id].origin)) cands.push({ kind: 'items', id, name: G.D.items[id].name, desc: G.D.items[id].desc });
    const perm = U.shuffle(cands, U.mulberry32(U.hashStr('spot:' + Math.floor(week / cands.length))));
    return perm[week % cands.length];
  }
  function issue(week) {
    return { week, date: U.weekDate(week), number: week - 100, news: pickFrom('news', week), trend: pickFrom('trends', week), mission: pickFrom('missions', week), gift: pickFrom('gifts', week), spot: spotlight(week) };
  }
  function current() { return issue(U.weekIndex()); }
  function trend() { return current().trend; }
  function effect(kind, def) {
    const e = trend().effect;
    if (kind === 'discovery') return e.discovery || def;
    return def;
  }
  function attract(bkey) { const e = trend().effect; if (!e.attract) return 1; return (e.attract[bkey] || 1) * (e.attract.all || 1); }

  function ensureBase() {
    const w = U.weekIndex(); const g = S().gazette;
    if (!g.progress[w]) { g.progress[w] = Object.assign({}, S().counters); return true; }
    return false;
  }
  function missionProgress(iss = current()) {
    const g = S().gazette; const base = g.progress[iss.week];
    if (!base) return { cur: 0, n: iss.mission.n, done: false };
    const c = iss.mission.counter; const cur = Math.max(0, (S().counters[c] || 0) - (base[c] || 0));
    return { cur: Math.min(cur, iss.mission.n), n: iss.mission.n, done: cur >= iss.mission.n };
  }
  function checkNewWeek() {
    if (ensureBase()) {
      Game().notify('Nouveau numéro de La Gazette des Îles disponible !', '📰', 'good');
      // nettoyage des vieux compteurs
      const keys = Object.keys(S().gazette.progress).map(Number).sort((a, b) => a - b);
      while (keys.length > 12) delete S().gazette.progress[keys.shift()];
      U.emit('gazette');
    }
  }
  function markRead() { const w = U.weekIndex(); if (!S().gazette.read[w]) { S().gazette.read[w] = Date.now(); U.emit('gazette'); G.State.save(); } }
  function unread() { return !S().gazette.read[U.weekIndex()]; }
  function claimGift() {
    const iss = current(); const g = S().gazette;
    if (g.claimed[iss.week]) return false;
    g.claimed[iss.week] = Date.now();
    const t = Game().grant(iss.gift.reward);
    Game().notify('Cadeau de la Gazette : ' + t, '🎁', 'good'); U.emit('gazette'); G.State.save(true); return true;
  }
  function claimMission() {
    const iss = current(); const g = S().gazette;
    if (g.missionClaimed[iss.week] || !missionProgress(iss).done) return false;
    g.missionClaimed[iss.week] = Date.now();
    const t = Game().grant(iss.mission.reward);
    Game().notify('Mission de la semaine accomplie : ' + t, '🏅', 'good'); U.emit('gazette'); G.State.save(true); return true;
  }
  function archive() {
    const cur = U.weekIndex(); const first = Math.max(Math.min(S().gazette.firstWeek, cur - 8), cur - 20); const out = [];
    for (let w = cur - 1; w >= first; w--) out.push(issue(w));
    return out;
  }
  return { issue, current, trend, effect, attract, missionProgress, checkNewWeek, ensureBase, markRead, unread, claimGift, claimMission, archive };
})();
