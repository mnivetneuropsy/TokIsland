/* ARCHIPEL — état du jeu, sauvegarde versionnée, export / import */

G.SAVE_KEY = 'archipel_save';
G.SAVE_VERSION = 1;

G.State = (() => {
  const BKEYS = ['museum', 'zoo', 'aquarium', 'bar', 'port', 'office'];

  function newHabitat(biome, name) {
    return { id: G.U.uid('h'), name: name || ('Enclos ' + G.D.biomes[biome].name.toLowerCase()), biome, espace: 1, vegetation: 1, eau: 1, abris: 1, enrichissement: 0, food: 100 };
  }
  function newTank(env, name) {
    return { id: G.U.uid('t'), name: name || ('Bassin ' + (env === 'mer' ? 'marin' : 'd\'eau douce')), env, temp: 20, quality: 100, decor: 0, lastClean: 0 };
  }

  function defaults() {
    const chars = {};
    for (const id in G.D.characters) {
      const c = G.D.characters[id];
      chars[id] = { met: !!c.home, role: c.home ? 'resident' : 'none', mood: 70, visits: 0, affinity: {}, memory: [], job: null, lastVisit: 0, pairDone: {} };
    }
    const bstats = {};
    BKEYS.forEach(k => bstats[k] = { visits: 0, rev: 0, exp: 0, sat: 0.7, rep: 0 });
    const islands = {};
    G.D.islandOrder.forEach((id, i) => islands[id] = { unlocked: i === 0, zones: {}, missions: {}, nodes: {}, done: {}, visits: 0 });
    return {
      version: G.SAVE_VERSION, created: Date.now(), lastSeen: Date.now(), playMs: 0,
      coins: 250, repBonus: 0, discovery: 0,
      res: { bois: 0, pierre: 0, baies: 2, herbes: 0, ocre: 0, resine: 0, frag_crane: 0, petits_os: 0 },
      items: {}, quality: {}, animals: [], fish: [],
      codex: { items: {}, animals: {}, fish: {}, chars: {}, zones: {}, lore: {} },
      buildings: { museum: { level: 1 }, zoo: { level: 1 }, aquarium: { level: 1 }, bar: { level: 1 }, port: { level: 1 }, office: { level: 1 } },
      museum: { rooms: [{ theme: 'fossiles', slots: [null, null, null, null, null, null] }] },
      zoo: { habitats: [newHabitat('jungle', 'Enclos de la jungle')] },
      aquarium: { tanks: [newTank('mer', 'Bassin marin')] },
      bar: { recipes: Object.keys(G.D.recipes).filter(r => G.D.recipes[r].start), upg: { comptoir: 0, machines: 0, tables: 0, decor: 0, recettes: 0, personnel: 0 }, xp: 0, served: 0, prefs: {}, bestScore: 0 },
      bstats, history: [],
      islands, flags: {}, chars,
      counters: { dig: 0, fish: 0, served: 0, perfect: 0, visitors: 0, feed: 0, harvest: 0, ads: 0, identified: 0, restored: 0 },
      ads: [], gazette: { read: {}, claimed: {}, missionClaimed: {}, progress: {}, firstWeek: G.U.weekIndex() },
      decor: JSON.parse(JSON.stringify(G.D.home.startDecor)), log: [], tutorial: { welcome: false },
      settings: { season: 'auto', lowPower: false, names: true },
      explore: { island: 'prehistorique', x: null, y: null },
    };
  }

  /* Migrations : chaque version future ajoute une fonction ici. */
  const migrations = {
    // 1: s => { ...; s.version = 2; return s; },
  };
  function migrate(s) {
    if (!s || typeof s !== 'object') throw new Error('Sauvegarde invalide');
    if (!s.version) s.version = 1;
    while (s.version < G.SAVE_VERSION) {
      const m = migrations[s.version];
      if (!m) break;
      s = m(s);
    }
    G.U.deepFill(s, defaults()); // complète les nouveautés de contenu (nouveaux personnages, îles…)
    s.version = G.SAVE_VERSION;
    return s;
  }

  function load() {
    let raw = null;
    try { raw = localStorage.getItem(G.SAVE_KEY); } catch (e) { console.warn('Stockage indisponible', e); }
    if (raw) {
      try { G.state = migrate(JSON.parse(raw)); return 'loaded'; }
      catch (e) { console.error('Sauvegarde illisible', e); try { localStorage.setItem(G.SAVE_KEY + '_corrompue', raw); } catch (_) {} }
    }
    G.state = defaults();
    return 'new';
  }

  let lastSave = 0;
  function save(force) {
    if (!G.state) return false;
    const now = Date.now();
    if (!force && now - lastSave < 1500) return false;
    lastSave = now;
    G.state.lastSeen = now;
    try { localStorage.setItem(G.SAVE_KEY, JSON.stringify(G.state)); return true; }
    catch (e) { console.warn('Échec de sauvegarde', e); return false; }
  }

  function exportString() {
    save(true);
    return JSON.stringify({ game: 'archipel', exported: new Date().toISOString(), save: G.state });
  }
  function importString(str) {
    const obj = JSON.parse(str);
    const s = obj && obj.game === 'archipel' ? obj.save : obj;
    if (!s || !s.buildings || !s.islands) throw new Error('Ce fichier n\'est pas une sauvegarde Archipel.');
    G.state = migrate(s);
    save(true);
  }
  function reset() {
    try { localStorage.removeItem(G.SAVE_KEY); } catch (e) {}
    G.state = defaults();
    save(true);
  }

  return { BKEYS, defaults, migrate, load, save, exportString, importString, reset, newHabitat, newTank };
})();
