/* ARCHIPEL — personnages : rencontre, humeur, mémoire, affinités, rôles, événements de paire */

G.Sys.Chars = (() => {
  const S = () => G.state, U = G.U, Game = () => G.Game;
  const ROLES = { none: 'Pas encore rencontré', tourist: 'Touriste', regular: 'Visiteur régulier', resident: 'Résident permanent' };
  const JOBS = { museum: 'Guide du musée', zoo: 'Soigneur du zoo', aquarium: 'Technicien de l\'aquarium', bar: 'Serveur du bar' };
  const JOB_EFFECT = { museum: '+10 % de satisfaction au musée', zoo: 'Les animaux ont faim deux fois moins vite, +5 % de bien-être', aquarium: 'L\'eau se salit deux fois moins vite, +5 % de bonheur', bar: 'Sert automatiquement les clients en attente' };

  function st(id) { return S().chars[id]; }
  function def(id) { return G.D.characters[id]; }
  function meet(id) {
    const c = st(id); if (!c) return false;
    G.Game.discover('chars', id);
    if (c.met) return false;
    c.met = true; if (c.role === 'none') c.role = 'tourist';
    remember(id, 'A rencontré la direction de l\'Archipel');
    Game().notify(def(id).name + ' viendra désormais visiter votre île !', '🤝', 'good');
    U.emit('chars'); return true;
  }
  function compat(a, b) {
    const pa = def(a).personality, pb = def(b).personality;
    if (pa === pb) return 2;
    return G.D.compat[pa + '|' + pb] ?? G.D.compat[pb + '|' + pa] ?? 1;
  }
  function affinity(a, b) { return st(a).affinity[b] || 0; }
  function addAffinity(a, b, n) {
    st(a).affinity[b] = U.clamp((st(a).affinity[b] || 0) + n, -10, 20);
    st(b).affinity[a] = U.clamp((st(b).affinity[a] || 0) + n, -10, 20);
  }
  function remember(id, text) {
    const c = st(id); if (!c) return;
    if (c.memory[0] && c.memory[0].text === text) return;
    c.memory.unshift({ t: Date.now(), text }); if (c.memory.length > 8) c.memory.length = 8;
  }
  function mood(id, d) { const c = st(id); if (c) c.mood = U.clamp(c.mood + d, 0, 100); }
  function moodIcon(m) { return m > 80 ? '😄' : m > 60 ? '🙂' : m > 40 ? '😐' : m > 20 ? '😕' : '😞'; }

  /* Discussion entre deux personnages nommés (appelée par la simulation) */
  function chat(a, b) {
    const n = compat(a, b);
    addAffinity(a, b, n);
    mood(a, n > 0 ? 3 : -2); mood(b, n > 0 ? 3 : -2);
    if (n >= 2) { remember(a, 'A sympathisé avec ' + def(b).name); remember(b, 'A sympathisé avec ' + def(a).name); }
    if (n < 0) { remember(a, 'S\'est chamaillé·e avec ' + def(b).name); }
    checkPair(a, b);
    return n;
  }
  function checkPair(a, b) {
    for (const ev of G.D.pairEvents) {
      const match = (ev.a === a && ev.b === b) || (ev.a === b && ev.b === a);
      if (!match) continue;
      const key = ev.a + '|' + ev.b;
      if (S().flags['pair:' + key]) continue;
      if (affinity(a, b) < ev.minAff) continue;
      S().flags['pair:' + key] = Date.now();
      const t = Game().grant(ev.reward, true);
      remember(ev.a, ev.title); remember(ev.b, ev.title);
      Game().log('Rencontre : ' + ev.title + ' — ' + ev.text + ' (' + t + ')', '💞');
      G.UI.eventPopup(ev.title, ev.text, t, [ev.a, ev.b]);
      U.emit('chars');
    }
  }

  function roleLabel(id) { const c = st(id); if (c.job) return JOBS[c.job]; return ROLES[c.role] || c.role; }
  function residentCost() { return 250; }
  function canResident(id) { const c = st(id); return c.met && c.role !== 'resident' && c.visits >= 2; }
  function makeResident(id) {
    if (!canResident(id)) { G.UI.toast('Il faut que ce personnage soit venu au moins 2 fois.', '🏠', 'bad'); return false; }
    if (!Game().spend(residentCost(), 'office')) return false;
    st(id).role = 'resident'; remember(id, 'A emménagé sur l\'île principale');
    Game().addRep(3); Game().notify(def(id).name + ' s\'installe sur votre île !', '🏠', 'good');
    U.emit('chars'); G.State.save(true); return true;
  }
  function staffMax() { return Game().bLevelData('office').staff; }
  function hireCost() { return 120; }
  function hire(id, job) {
    const c = st(id);
    if (!c.met) return false;
    if (def(id).home && id === 'merou') { G.UI.toast('Le Capitaine Mérou a déjà un bateau à piloter !', '⚓', 'bad'); return false; }
    if (Object.values(JOBS) && Object.keys(S().chars).some(o => S().chars[o].job === job)) { G.UI.toast('Ce poste est déjà occupé.', '👤', 'bad'); return false; }
    if (Game().employeesCount() >= staffMax()) { G.UI.toast('Effectif maximum atteint (améliorez le Bureau).', '👤', 'bad'); return false; }
    if (!Game().spend(hireCost(), 'office')) return false;
    c.job = job; remember(id, 'A été recruté·e : ' + JOBS[job]);
    Game().notify(def(id).name + ' devient ' + JOBS[job].toLowerCase() + ' !', '👔', 'good');
    U.emit('chars'); G.State.save(true); return true;
  }
  function fire(id) { const c = st(id); if (!c.job) return; c.job = null; remember(id, 'A quitté son poste'); U.emit('chars'); G.State.save(true); }
  function employeeOf(job) { return Object.keys(S().chars).find(id => S().chars[id].job === job) || null; }

  return { ROLES, JOBS, JOB_EFFECT, st, def, meet, compat, affinity, addAffinity, remember, mood, moodIcon, chat, roleLabel, residentCost, canResident, makeResident, staffMax, hireCost, hire, fire, employeeOf };
})();
