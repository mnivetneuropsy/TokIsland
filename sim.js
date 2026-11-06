/* ARCHIPEL — simulation des visiteurs autonomes de l'île principale
   Machine à états par agent : walk → act (ou wait au bar) → walk … → leave.
   Priorités : discussion (interrompt une marche) < activité < départ.
   La simulation ne tourne que lorsque l'île est affichée ; sinon l'économie est estimée (game.js). */

G.Sys.Sim = (() => {
  const U = G.U, S = () => G.state, Game = () => G.Game, L = () => G.D.home;
  const agents = [];
  let lastUpdate = 0, chatCheck = 0, nextId = 1;
  const boat = { state: 'away', t: 3, x: 0, y: 0, carrying: 0 };
  const reservedSeats = new Set();

  /* ---------- Graphe ---------- */
  let adj = null;
  function graph() {
    if (adj) return adj; adj = {};
    for (const k in L().nodes) adj[k] = [];
    L().edges.forEach(([a, b]) => { adj[a].push(b); adj[b].push(a); });
    return adj;
  }
  function nearestNode(p) { let best = null, bd = 1e9; for (const k in L().nodes) { const d = U.dist(p, L().nodes[k]); if (d < bd) { bd = d; best = k; } } return best; }
  function route(from, to) {
    const g = graph(); const prev = { [from]: null }; const q = [from];
    while (q.length) { const c = q.shift(); if (c === to) break; for (const n of g[c]) if (!(n in prev)) { prev[n] = c; q.push(n); } }
    const out = []; let c = to; while (c) { out.unshift(L().nodes[c]); c = prev[c]; }
    return out;
  }
  function pathTo(agent, node, final) {
    const start = nearestNode(agent);
    const pts = route(start, node).map(p => ({ x: p.x, y: p.y }));
    if (final) pts.push({ x: final.x, y: final.y });
    return pts;
  }

  /* ---------- Attraction & débit ---------- */
  function attractions() {
    const sd = Game().seasonData().attract; const ads = G.Sys.Ads; const gz = G.Sys.Gazette;
    const zooN = G.Sys.Zoo.placed().length, aqN = G.Sys.Aquarium.placed().length;
    const decorA = S().decor.reduce((s, d) => s + (G.D.decorations[d.type].attract || 0), 0);
    const a = {
      museum: (0.5 + Math.min(2, G.Sys.Museum.score() / 60)),
      zoo: (0.25 + Math.min(2, zooN * 0.3 * (G.Sys.Zoo.avgWelfare() ?? 0))),
      aquarium: (0.25 + Math.min(2, aqN * 0.25 * (G.Sys.Aquarium.avgHappiness() ?? 0))),
      bar: 0.9 + 0.08 * G.Sys.Bar.tables(),
      rest: 0.45 + decorA * 8,
    };
    for (const k of ['museum', 'zoo', 'aquarium', 'bar']) a[k] *= (sd[k] || 1) * gz.attract(k) * ads.mult(k);
    return a;
  }
  function rate() {
    const r = (1.6 + Game().rep() / 30) * G.Sys.Ads.rateMult() * G.Sys.Gazette.attract('__all__');
    return Math.min(14, r);
  }
  function satisfactionFor(k) {
    if (k === 'museum') return G.Sys.Museum.satisfaction();
    if (k === 'zoo') return G.Sys.Zoo.satisfaction();
    if (k === 'aquarium') return G.Sys.Aquarium.satisfaction();
    return S().bstats.bar.sat;
  }
  function cap() { return Game().bLevelData('port').cap; }
  function isRunning() { return Date.now() - lastUpdate < 2500; }

  /* ---------- Création des agents ---------- */
  function touristLook() { const p = G.D.touristPalette; return { skin: U.pick(p.skin), hair: U.pick(p.hair), top: U.pick(p.top), bottom: U.pick(p.bottom), style: U.pick(p.style) }; }
  function present(charId) { return agents.some(a => a.charId === charId); }

  function choosePlan(agent) {
    const att = attractions(); const keys = ['museum', 'zoo', 'aquarium', 'bar', 'rest'];
    let likes = {}, prefB = null;
    if (agent.charId) { const d = G.D.characters[agent.charId]; likes = G.D.personalities[d.personality].likes; prefB = d.prefs.building; }
    const w = k => att[k] * (likes[k] || 1) * (prefB === k ? 1.5 : 1);
    const n = 1 + (Math.random() < 0.6 ? 1 : 0) + (Math.random() < 0.3 ? 1 : 0);
    const plan = []; let pool = keys.slice();
    for (let i = 0; i < n && pool.length; i++) { const k = U.weighted(pool, w); plan.push(k); pool = pool.filter(x => x !== k); }
    return plan;
  }

  function makeAgent(opts) {
    const a = Object.assign({
      id: nextId++, charId: null, name: U.pick(G.D.touristNames), look: touristLook(),
      x: L().spawn.x + U.rand(-8, 8), y: L().spawn.y, state: 'walk', path: [], plan: [], act: null, timer: 0,
      speed: U.rand(32, 46), bubble: null, chatCd: U.rand(3, 8), t: Math.random() * 10, hidden: false, facing: 1, resident: false, staff: null, seat: null, moving: false,
    }, opts);
    agents.push(a); return a;
  }
  function spawnVisitor() {
    const s = S();
    const cands = Object.keys(s.chars).filter(id => { const c = s.chars[id]; return c.met && c.role !== 'resident' && !c.job && !present(id) && Date.now() - c.lastVisit > 90000; });
    let a;
    if (cands.length && Math.random() < 0.45) {
      const id = U.weighted(cands, id => (s.chars[id].role === 'regular' ? 2 : 1) * (0.5 + s.chars[id].mood / 100));
      a = makeAgent({ charId: id, name: G.D.characters[id].name, look: G.D.characters[id].look });
    } else a = makeAgent({});
    a.plan = choosePlan(a);
    Game().counter('visitors');
    next(a);
  }
  function syncResidentsAndStaff() {
    const s = S();
    for (const id in s.chars) {
      const c = s.chars[id]; if (!c.met) continue;
      if (c.job) {
        let a = agents.find(x => x.charId === id);
        if (a && a.staff !== c.job) { removeAgent(a); a = null; }
        if (!a) { const sp = L().staffSpots[c.job]; makeAgent({ charId: id, name: G.D.characters[id].name, look: G.D.characters[id].look, x: sp.x, y: sp.y, state: 'work', staff: c.job, resident: true }); }
      } else if (c.role === 'resident') {
        let a = agents.find(x => x.charId === id);
        if (a && a.staff) { removeAgent(a); a = null; }
        if (!a) { const hs = L().homeSpots[id] || L().nodes.office; const ag = makeAgent({ charId: id, name: G.D.characters[id].name, look: G.D.characters[id].look, x: hs.x + U.rand(-20, 20), y: hs.y + U.rand(-10, 10), resident: true }); ag.state = 'act'; ag.act = 'home'; ag.timer = U.rand(2, 8); }
      }
    }
    // retire les agents qui ne devraient plus être là
    for (const a of agents.slice()) if (a.staff && (!a.charId || s.chars[a.charId].job !== a.staff)) removeAgent(a);
  }
  function removeAgent(a) { const i = agents.indexOf(a); if (i >= 0) agents.splice(i, 1); if (a.seat !== null) reservedSeats.delete(a.seat); }

  /* ---------- Planification ---------- */
  function targetFor(act, a) {
    const n = L().nodes;
    if (act === 'museum' || act === 'aquarium') return { node: act, pt: { x: n[act].x + U.rand(-6, 6), y: n[act].y - 4 }, inside: true };
    if (act === 'zoo') { const sp = U.pick(L().zooSpots); return { node: 'zoo', pt: { x: sp.x + U.rand(-8, 8), y: sp.y + U.rand(-3, 3) } }; }
    if (act === 'bar') {
      if (G.Sys.Bar.queue.length >= G.Sys.Bar.tables()) return null;
      const seats = L().barSeats.slice(0, G.Sys.Bar.tables()).map((p, i) => i).filter(i => !reservedSeats.has(i));
      if (!seats.length) return null;
      const i = U.pick(seats); reservedSeats.add(i); a.seat = i;
      return { node: 'bar', pt: L().barSeats[i] };
    }
    if (act === 'home') { const hs = L().homeSpots[a.charId] || L().nodes.office; return { node: nearestNode(hs), pt: { x: hs.x + U.rand(-20, 20), y: hs.y + U.rand(-8, 8) } }; }
    // repos : un banc / une fontaine, sinon la place
    const seats = S().decor.filter(d => G.D.decorations[d.type].seat);
    if (seats.length && Math.random() < 0.75) { const d = U.pick(seats); return { node: nearestNode(d), pt: { x: d.x + U.rand(-10, 10), y: d.y + 6 } }; }
    const p = L().plaza; const ang = Math.random() * 6.28;
    return { node: 'plaza', pt: { x: p.x + Math.cos(ang) * p.r * 0.8, y: p.y + Math.sin(ang) * p.r * 0.5 } };
  }
  function next(a) {
    a.hidden = false;
    if (!a.plan.length) {
      if (a.resident) { a.plan = choosePlan(a); a.plan.push('home'); }
      else { a.state = 'leave'; a.path = pathTo(a, 'port', L().spawn); a.act = null; return; }
    }
    const act = a.plan.shift(); const tgt = targetFor(act, a);
    if (!tgt) return next(a);
    a.act = act; a.target = tgt; a.state = 'walk';
    a.path = pathTo(a, tgt.node, tgt.pt);
  }
  function startAct(a) {
    const act = a.act;
    if (a.target && a.target.inside) a.hidden = true;
    a.state = 'act';
    if (act === 'museum') a.timer = U.rand(8, 14);
    else if (act === 'aquarium') a.timer = U.rand(7, 12);
    else if (act === 'zoo') a.timer = U.rand(6, 10);
    else if (act === 'rest') a.timer = U.rand(5, 10);
    else if (act === 'home') a.timer = U.rand(10, 22);
    else if (act === 'bar') {
      const o = G.Sys.Bar.enqueue(a);
      if (!o) { releaseSeat(a); next(a); return; }
      a.state = 'wait'; a.order = o.id; a.bubble = { text: '☕ ?', t: 999 };
    }
  }
  function releaseSeat(a) { if (a.seat !== null) { reservedSeats.delete(a.seat); a.seat = null; } }

  const REACT = {
    museum: [['Quelle collection !', 'Superbe exposition !', 'Fascinant !'], ['Joli musée.', 'Intéressant.'], ['Un peu vide…', 'Hmm, déjà fini ?']],
    zoo: [['Trop mignon !', 'Ils ont l\'air heureux !'], ['Sympa, ce zoo.', 'Regarde là-bas !'], ['Ils ont l\'air tristes…', 'Il n\'y a presque personne.']],
    aquarium: [['Magique !', 'Quelles couleurs !'], ['C\'est apaisant.', 'Joli bassin.'], ['L\'eau est trouble…', 'Bien vide…']],
    rest: [['Qu\'on est bien…', 'Belle journée !'], ['Petite pause.'], ['Bof.']],
  };
  function finishAct(a) {
    const act = a.act; let sat = 0.7;
    if (act === 'museum' || act === 'zoo' || act === 'aquarium') {
      sat = satisfactionFor(act);
      if (a.charId) { const d = G.D.characters[a.charId]; sat *= (G.D.personalities[d.personality].likes[act] || 1) > 1.3 ? 1.1 : 1; }
      sat = U.clamp(sat, 0, 1.2);
      const price = G.D.buildings[act].ticket * (0.5 + 0.6 * Math.min(1, sat));
      Game().addCoins(price, act);
      Game().recordVisit(act, Math.min(1, sat));
    } else if (act === 'rest') sat = 0.6 + Math.min(0.4, S().decor.length * 0.03);
    if (REACT[act] && Math.random() < 0.6) { const tier = sat > 0.75 ? 0 : sat > 0.45 ? 1 : 2; a.bubble = { text: U.pick(REACT[act][tier]), t: 2.6 }; }
    if (a.charId) {
      G.Sys.Chars.mood(a.charId, (sat - 0.6) * 12);
      if (sat > 0.95 && act !== 'rest' && act !== 'home') G.Sys.Chars.remember(a.charId, 'A adoré sa visite : ' + (G.D.buildings[act] ? G.D.buildings[act].name.toLowerCase() : act));
    }
    releaseSeat(a);
    next(a);
  }
  function onServed(order, score) {
    const a = agents.find(x => x.id === order.agentId); if (!a || a.state !== 'wait') return;
    if (score === null) { a.bubble = { text: '😕 Trop long…', t: 2.5 }; if (a.charId) G.Sys.Chars.mood(a.charId, -6); releaseSeat(a); next(a); return; }
    a.state = 'act'; a.act = 'drink'; a.timer = U.rand(5, 8);
    a.bubble = { text: score >= 0.85 ? '😍 Délicieux !' : score >= 0.6 ? '🙂 Merci !' : '😐 Bof…', t: 2.8 };
  }

  /* ---------- Mise à jour ---------- */
  function update(dt) {
    lastUpdate = Date.now();
    dt = Math.min(dt, 0.1);
    syncTimer -= dt; if (syncTimer <= 0) { syncTimer = 3; syncResidentsAndStaff(); }
    updateBoat(dt);
    G.Sys.Bar.tick(dt);
    for (let i = agents.length - 1; i >= 0; i--) updateAgent(agents[i], dt);
    chatCheck -= dt; if (chatCheck <= 0) { chatCheck = 0.6; checkChats(); }
  }
  let syncTimer = 0;

  function updateBoat(dt) {
    const B = L().boat; boat.t -= dt;
    if (boat.state === 'away' && boat.t <= 0) { boat.state = 'arriving'; boat.t = 5; }
    else if (boat.state === 'arriving' && boat.t <= 0) {
      boat.state = 'docked'; boat.t = 4;
      const visitors = agents.filter(a => !a.resident).length;
      const room = cap() - visitors;
      const k = Math.max(0, Math.min(room, Math.round(rate() * 0.33 + Math.random() * 1.2)));
      for (let i = 0; i < k; i++) setTimeout(() => { if (isRunning()) spawnVisitor(); }, i * 700);
    } else if (boat.state === 'docked' && boat.t <= 0) { boat.state = 'leaving'; boat.t = 5; }
    else if (boat.state === 'leaving' && boat.t <= 0) { boat.state = 'away'; boat.t = U.clamp(14 - rate(), 3, 14); }
    const p = boat.state === 'arriving' ? 1 - boat.t / 5 : boat.state === 'leaving' ? boat.t / 5 : boat.state === 'docked' ? 1 : 0;
    const e = p * p * (3 - 2 * p);
    boat.x = B.dockX + (1 - e) * 260; boat.y = B.dockY + (1 - e) * 120; boat.vis = boat.state !== 'away';
  }

  function updateAgent(a, dt) {
    a.t += dt; a.chatCd -= dt;
    if (a.bubble) { a.bubble.t -= dt; if (a.bubble.t <= 0) a.bubble = null; }
    a.moving = false;
    switch (a.state) {
      case 'walk': case 'leave': {
        if (!a.path.length) { if (a.state === 'leave') return depart(a); startAct(a); return; }
        const p = a.path[0]; const dx = p.x - a.x, dy = p.y - a.y; const d = Math.hypot(dx, dy);
        const step = a.speed * dt;
        if (d <= step) { a.x = p.x; a.y = p.y; a.path.shift(); }
        else { a.x += dx / d * step; a.y += dy / d * step; if (Math.abs(dx) > 1) a.facing = dx > 0 ? 1 : -1; }
        a.moving = true; break;
      }
      case 'act': case 'chat':
        a.timer -= dt;
        if (a.timer <= 0) {
          if (a.state === 'chat') { a.state = a.prevState; a.chatWith = null; }
          else finishAct(a);
        }
        break;
      case 'wait': break;
      case 'work':
        if (Math.random() < dt * 0.02) a.bubble = { text: U.pick(['Bienvenue !', 'Par ici !', 'Belle journée !', 'Je m\'en occupe !']), t: 2.4 };
        break;
    }
  }
  function depart(a) {
    if (a.charId) {
      const c = S().chars[a.charId]; c.visits++; c.lastVisit = Date.now();
      if (c.role === 'tourist' && c.visits >= 3) { c.role = 'regular'; Game().log(G.D.characters[a.charId].name + ' est devenu·e un·e visiteur·se régulier·ère.', '⭐'); U.emit('chars'); }
    }
    removeAgent(a);
  }

  function checkChats() {
    const walkers = agents.filter(a => (a.state === 'walk' || (a.state === 'act' && a.act === 'rest')) && !a.hidden && a.chatCd <= 0);
    for (let i = 0; i < walkers.length; i++) for (let j = i + 1; j < walkers.length; j++) {
      const a = walkers[i], b = walkers[j];
      if (a.state === 'chat' || b.state === 'chat') continue;
      if (Math.abs(a.x - b.x) > 34 || Math.abs(a.y - b.y) > 22) continue;
      const named = a.charId && b.charId;
      if (Math.random() > (named ? 0.7 : 0.35)) { a.chatCd = 3; b.chatCd = 3; continue; }
      startChat(a, b, named);
    }
  }
  function startChat(a, b, named) {
    for (const x of [a, b]) { x.prevState = x.state; x.state = 'chat'; x.timer = U.rand(3, 4.5); x.chatCd = U.rand(18, 30); }
    a.facing = b.x > a.x ? 1 : -1; b.facing = -a.facing;
    const line = x => x.charId ? U.pick(G.D.personalities[G.D.characters[x.charId].personality].lines.concat(G.D.characters[x.charId].talk)) : U.pick(['Bonjour !', 'Belle île, hein ?', 'Vous avez vu le musée ?', 'On va au bar ?', 'Quel beau temps !']);
    a.bubble = { text: line(a), t: 2.2 };
    setTimeout(() => { if (b.state === 'chat') b.bubble = { text: line(b), t: 2 }; }, 1300);
    if (named) {
      const n = G.Sys.Chars.chat(a.charId, b.charId);
      setTimeout(() => { if (a.state === 'chat') a.bubble = { text: n >= 2 ? '💞' : n < 0 ? '💢' : '💬', t: 1.2 }; }, 2600);
    }
  }

  function reset() { agents.length = 0; reservedSeats.clear(); syncTimer = 0; }
  function stats() { return { total: agents.length, visitors: agents.filter(a => !a.resident).length, cap: cap(), rate: rate() }; }

  return { agents, boat, attractions, rate, satisfactionFor, isRunning, update, onServed, reset, stats, spawnVisitor, nearestNode };
})();
