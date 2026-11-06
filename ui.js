/* ARCHIPEL — cadre d'interface : HUD, onglets, panneaux, modales, notifications, dialogues */

G.UI = (() => {
  const U = G.U, $ = s => document.querySelector(s);
  const E = U.esc;
  let current = null; // { tab, sub }
  const modals = [];

  /* ---------- Notifications ---------- */
  function toast(text, icon = 'ℹ️', kind) {
    const box = $('#toasts'); if (!box) return;
    const el = document.createElement('div'); el.className = 'toast ' + (kind || ''); el.textContent = (icon ? icon + ' ' : '') + text;
    box.appendChild(el); while (box.children.length > 4) box.firstChild.remove();
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 350); }, 3200);
  }

  /* ---------- Modales ---------- */
  function modal({ title = '', html = '', buttons = [{ label: 'Fermer' }], wide = false, onMount, onClose, dismiss = true }) {
    const back = document.createElement('div'); back.className = 'modal-back';
    back.innerHTML = '<div class="modal ' + (wide ? 'wide' : '') + '" role="dialog" aria-modal="true">' + (title ? '<h2>' + title + '</h2>' : '') + '<div class="m-body">' + html + '</div><div class="actions"></div></div>';
    const m = { el: back, close };
    const act = back.querySelector('.actions');
    buttons.forEach(b => { const btn = document.createElement('button'); btn.className = 'btn ' + (b.cls || (b.primary ? '' : 'alt')); btn.textContent = b.label; btn.onclick = () => { const r = b.onClick ? b.onClick(m) : undefined; if (b.close !== false && r !== false) close(); }; act.appendChild(btn); });
    if (!buttons.length) act.remove();
    if (dismiss) back.addEventListener('pointerdown', e => { if (e.target === back) close(); });
    let closed = false;
    function close() { if (closed) return; closed = true; back.remove(); const i = modals.indexOf(m); if (i >= 0) modals.splice(i, 1); onClose && onClose(); }
    $('#modals').appendChild(back); modals.push(m);
    onMount && onMount(back.querySelector('.modal'), m);
    return m;
  }
  function modalOpen() { return modals.length > 0; }
  function confirm(title, text, okLabel, onOk, cost) {
    return modal({ title, html: '<p>' + text + '</p>' + (cost ? '<p><b>Coût : 🪙 ' + U.fmt(cost) + '</b> (vous avez ' + U.fmt(G.state.coins) + ')</p>' : ''), buttons: [{ label: 'Annuler' }, { label: okLabel || 'Confirmer', primary: true, onClick: () => { onOk(); } }] });
  }
  function bind(root, handlers) {
    root.querySelectorAll('[data-act]').forEach(el => {
      const ev = el.tagName === 'SELECT' || el.tagName === 'INPUT' ? 'change' : 'click';
      el.addEventListener(ev, e => { e.stopPropagation(); const h = handlers[el.dataset.act]; if (h) h(el.dataset, el); else console.warn('action inconnue', el.dataset.act); });
    });
  }

  /* ---------- HUD ---------- */
  function hud() {
    const s = G.state; if (!s) return;
    $('#hCoins').textContent = U.fmt(s.coins); $('#hRep').textContent = U.fmt(G.Game.rep()); $('#hDisc').textContent = U.fmt(s.discovery);
    const sd = G.Game.seasonData(); $('#hSeason').textContent = sd.icon + ' ' + sd.name;
    const gz = G.Sys.Gazette.unread() ? 1 : 0; setBadge('#tabGazette', gz ? '!' : '');
    const q = G.Sys.Bar.queue.filter(o => !o.inService).length; setBadge('#tabGestion', q || '');
    hint();
  }
  function setBadge(sel, v) { const el = $(sel); if (!el) return; let b = el.querySelector('.badge'); if (!v) { b && b.remove(); return; } if (!b) { b = document.createElement('span'); b.className = 'badge'; el.appendChild(b); } b.textContent = v; }

  /* Prochain objectif conseillé */
  function nextHint() {
    const s = G.state, M = G.Sys.Missions;
    if (G.Sys.Bar.queue.some(o => !o.inService)) return { text: '<b>Des clients attendent au bar !</b> Préparez leurs commandes.', go: () => openBuilding('bar') };
    if (!Object.keys(s.islands.prehistorique.missions).length) return { text: '<b>Première expédition :</b> embarquez pour l\'Île Préhistorique (onglet Explorer).', go: () => openTab('explorer') };
    const freeSlots = s.museum.rooms.reduce((n, r) => n + r.slots.filter(x => !x).length, 0);
    if (freeSlots && G.Sys.Museum.availableList().length) return { text: '<b>Musée :</b> vous avez des objets à exposer.', go: () => openBuilding('museum') };
    if (G.Sys.Zoo.reserve().length) return { text: '<b>Zoo :</b> un animal attend dans la réserve.', go: () => openBuilding('zoo') };
    if (G.Sys.Aquarium.reserve().length) return { text: '<b>Aquarium :</b> des poissons attendent un bassin.', go: () => openBuilding('aquarium') };
    for (const id in G.D.restorations) if (G.Sys.Museum.canRestore(id)) return { text: '<b>Atelier :</b> vous pouvez restaurer « ' + G.D.items[id].name + ' ».', go: () => openTab('gestion', 'museum') };
    const act = M.activeList()[0]; if (act) return { text: '<b>Mission :</b> ' + E(M.M(act).title), go: () => openTab('explorer') };
    if (!s.islands.prehistorique.completed) return { text: '<b>Exploration :</b> parlez aux habitants de l\'île préhistorique pour de nouvelles missions.', go: () => openTab('explorer') };
    return { text: '<b>Bravo !</b> Développez vos établissements et lisez la Gazette.', go: () => openTab('gazette') };
  }
  function hint() {
    const el = $('#hint'); if (!el) return;
    if (!G.Home.isRunning() || current) { el.classList.add('hidden'); return; }
    const h = nextHint(); el.innerHTML = '💡 ' + h.text; el.onclick = h.go; el.classList.remove('hidden');
  }

  /* ---------- Onglets & panneaux ---------- */
  const TABS = {
    explorer: { title: 'Explorer', render: () => G.Screens.explorer() },
    gestion: { title: 'Gestion', subs: [['museum', '🏛️ Musée'], ['zoo', '🦕 Zoo'], ['aquarium', '🐠 Aquarium'], ['bar', '☕ Bar'], ['ads', '📣 Publicité'], ['finances', '📊 Finances'], ['staff', '👥 Personnel'], ['build', '🏗️ Bâtiments']], render: sub => G.Screens.gestion(sub) },
    collections: { title: 'Collections', subs: [['items', '🏺 Objets'], ['animals', '🦖 Animaux'], ['fish', '🐟 Poissons'], ['chars', '🧑 Personnages'], ['inv', '🎒 Inventaire'], ['disc', '🗺️ Découvertes']], render: sub => G.Screens.collections(sub) },
    gazette: { title: 'La Gazette des Îles', subs: [['current', '📰 Ce numéro'], ['archives', '🗂️ Archives']], render: sub => G.Screens.gazette(sub) },
  };
  function openTab(tab, sub) {
    if (tab === 'ile' || !TABS[tab]) { closePanel(); return; }
    const T = TABS[tab]; sub = sub || (current && current.tab === tab ? current.sub : null) || (T.subs ? T.subs[0][0] : null);
    current = { tab, sub };
    document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    $('#panel').classList.remove('hidden');
    $('#pTitle').textContent = T.title;
    const st = $('#pSub'); st.innerHTML = '';
    if (T.subs) { T.subs.forEach(([k, l]) => { const b = document.createElement('button'); b.textContent = l; b.className = k === sub ? 'on' : ''; b.onclick = () => openTab(tab, k); st.appendChild(b); }); st.classList.remove('hidden'); const on = st.querySelector('.on'); on && on.scrollIntoView({ inline: 'nearest', block: 'nearest' }); }
    else st.classList.add('hidden');
    renderPanel(true);
    hint();
  }
  function renderPanel(resetScroll) {
    if (!current) return;
    const body = $('#pBody'); const sc = body.scrollTop;
    const out = TABS[current.tab].render(current.sub);
    body.innerHTML = out.html; if (out.bind) bind(body, out.bind); out.mount && out.mount(body);
    body.scrollTop = resetScroll ? 0 : sc;
    if (current.tab === 'gazette') G.Sys.Gazette.markRead();
  }
  const refresh = U.throttle(() => { if (current) renderPanel(false); hud(); }, 350);
  function closePanel() {
    current = null; $('#panel').classList.add('hidden');
    document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === 'ile'));
    G.Screens.unmount && G.Screens.unmount(); hint();
  }
  function openBuilding(k) { if (k === 'port') return openTab('explorer'); if (k === 'office') return openTab('gestion', 'finances'); openTab('gestion', k); }
  function currentView() { return current; }

  /* ---------- Fiches ---------- */
  function openChar(id) {
    const d = G.D.characters[id], st = G.state.chars[id], C = G.Sys.Chars, P = G.D.personalities[d.personality];
    const affs = Object.keys(st.affinity).filter(o => st.affinity[o]).sort((a, b) => st.affinity[b] - st.affinity[a]).map(o => '<span class="tag ' + (st.affinity[o] >= 5 ? 'good' : st.affinity[o] < 0 ? 'bad' : '') + '">' + E(G.D.characters[o].name) + ' ' + (st.affinity[o] > 0 ? '+' : '') + st.affinity[o] + '</span>').join(' ') || '<span class="muted">Aucune pour l\'instant — ils se rencontrent sur votre île.</span>';
    const mem = st.memory.map(m => '<li>' + E(m.text) + '</li>').join('') || '<li class="muted">Rien de marquant.</li>';
    const pref = G.state.bar.prefs[id];
    const html = '<div class="dialog"><img src="' + G.Art.icon('char', id, 96) + '" alt=""><div class="grow"><b>' + E(d.job) + '</b> · ' + E(G.D.islands[d.origin] ? G.D.islands[d.origin].name : 'Archipel') + '<br><span class="muted">' + E(d.bio) + '</span><div style="margin-top:6px"><span class="tag blue">' + P.name + '</span> <span class="tag gold">' + E(C.roleLabel(id)) + '</span> <span class="tag">Humeur ' + C.moodIcon(st.mood) + ' ' + Math.round(st.mood) + '</span> <span class="tag">Visites : ' + st.visits + '</span></div></div></div>'
      + '<h4>Préférences</h4><div class="small">Boisson favorite : <b>' + E(G.D.recipes[d.prefs.drink].name) + '</b> · Lieu préféré : <b>' + E(G.D.buildings[d.prefs.building].name) + '</b> · Objets : <b>' + E(G.D.categories[d.prefs.category].name) + '</b>' + (pref ? '<br>Commande habituelle notée : <b>' + E(G.Sys.Bar.orderText(pref)) + '</b>' : '') + '</div>'
      + '<h4>Affinités</h4><div>' + affs + '</div><h4>Souvenirs</h4><ul class="small" style="margin:4px 0;padding-left:18px">' + mem + '</ul>';
    const buttons = [{ label: 'Fermer' }];
    if (st.met && st.role !== 'resident' && !d.home) buttons.unshift({ label: '🏠 Inviter comme résident', cls: 'gold', onClick: () => { confirm('Inviter ' + d.name + ' ?', d.name + ' s\'installera sur votre île et y vivra en permanence (il faut au moins 2 visites).', 'Inviter', () => C.makeResident(id), C.residentCost()); } });
    if (st.met && id !== 'merou') buttons.unshift({ label: st.job ? '👔 Gérer le poste' : '👔 Recruter', onClick: () => openTab('gestion', 'staff') });
    modal({ title: E(d.name), html, buttons, wide: false });
  }
  function itemCard(id, extra = '') {
    const it = G.D.items[id], r = G.D.rarities[it.rarity];
    const q = G.state.quality[id];
    return '<div class="dialog"><img src="' + G.Art.icon('item', id, 96) + '" style="border-radius:12px;background:#fff" alt=""><div class="grow"><b>' + E(it.name) + '</b><br><span class="tag" style="background:' + r.color + ';color:#fff">' + r.name + '</span> <span class="tag">' + G.D.categories[it.cat].name + '</span> <span class="tag gold">Valeur ' + Math.round(G.Sys.Museum.itemValue(id)) + '</span>' + (q ? ' <span class="tag good">' + '★'.repeat(q) + '</span>' : '') + '<p class="small">' + E(it.desc) + '</p><div class="muted small">Provenance : ' + E(G.D.islands[it.origin] ? G.D.islands[it.origin].name : 'Archipel') + ' · Identifiant : ' + id + '</div>' + extra + '</div></div>';
  }
  function showItem(id) { modal({ title: 'Fiche objet', html: itemCard(id) }); }
  function itemFound(id, title, sub) { modal({ title: title || 'Trouvaille !', html: itemCard(id, sub ? '<p><b>' + E(sub) + '</b></p>' : '') + '<p class="muted small">L\'objet rejoint votre inventaire. Exposez-le au musée (Gestion › Musée).</p>', buttons: [{ label: 'Super !', primary: true }] }); }
  function loreDialog(title, text, reward) { modal({ title: '📖 ' + E(title), html: '<p>' + E(text) + '</p>' + (reward ? '<p class="small"><b>' + E(reward) + '</b></p>' : ''), buttons: [{ label: 'Noter dans le carnet', primary: true }] }); }
  function eventPopup(title, text, reward, ids) {
    const imgs = (ids || []).map(id => '<img class="avatar" src="' + G.Art.icon('char', id, 72) + '" alt="">').join('');
    modal({ title: '✨ ' + E(title), html: (imgs ? '<div class="row" style="justify-content:center">' + imgs + '</div>' : '') + '<p>' + E(text) + '</p>' + (reward ? '<p><b>' + E(reward) + '</b></p>' : ''), buttons: [{ label: 'Merveilleux', primary: true }] });
  }
  function decorMenu(d) {
    const def = G.D.decorations[d.type]; const refund = Math.round(def.cost * 0.5);
    modal({ title: def.name, html: '<p class="muted">' + E(def.desc) + '</p>', buttons: [{ label: 'Fermer' }, { label: 'Retirer (+' + refund + ' 🪙)', cls: 'warn', onClick: () => { const i = G.state.decor.indexOf(d); if (i >= 0) { G.state.decor.splice(i, 1); G.Game.addCoins(refund); G.State.save(true); toast('Décoration retirée.', '🧹'); } } }] });
  }
  function placingBanner(type) {
    const b = $('#placing');
    if (!type) { b.classList.add('hidden'); return; }
    b.innerHTML = '<span>Touchez l\'île pour placer : <b>' + E(G.D.decorations[type].name) + '</b> (' + G.D.decorations[type].cost + ' 🪙)</span><button id="stopPlace">Terminer</button>';
    b.classList.remove('hidden'); $('#stopPlace').onclick = () => G.Home.stopPlacing();
  }
  function journal() {
    const items = G.state.log.map(l => { const d = new Date(l.t); return '<div class="list-item"><span style="font-size:20px">' + l.icon + '</span><div class="grow small">' + E(l.text) + '<div class="muted">' + d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) + '</div></div></div>'; }).join('') || '<p class="muted">Rien pour le moment.</p>';
    modal({ title: '📜 Journal des événements', html: items, wide: true });
  }

  /* ---------- Exploration : dialogues ---------- */
  function npcDialog(id) {
    const d = G.D.characters[id], M = G.Sys.Missions;
    const first = G.Sys.Chars.meet(id);
    const dlg = M.dialogue(id);
    let extra = '';
    const buttons = [];
    if (dlg.mode === 'offer' || dlg.mode === 'waiting' || dlg.mode === 'turnin') {
      const m = M.M(dlg.id);
      extra = '<div class="card"><h3>📜 ' + E(m.title) + (m.main ? ' <span class="tag gold">Principale</span>' : ' <span class="tag">Secondaire</span>') + '</h3>' + objectivesHtml(dlg.id) + '<div class="small muted">Récompense : ' + rewardText(m.reward) + '</div></div>';
    }
    if (dlg.mode === 'offer') buttons.push({ label: 'Plus tard' }, { label: 'Accepter la mission', primary: true, onClick: () => { M.accept(dlg.id); toast('Mission acceptée : ' + M.M(dlg.id).title, '📜', 'good'); } });
    else if (dlg.mode === 'turnin') buttons.push({ label: 'Remettre', primary: true, onClick: () => { const r = M.turnIn(dlg.id); if (r !== null) eventPopup('Mission accomplie', M.M(dlg.id).title, r, [id]); } });
    else buttons.push({ label: 'Au revoir', primary: true });
    if (id === 'merou') buttons.unshift({ label: '⛵ Rentrer sur mon île', cls: 'gold', onClick: () => goHome() });
    buttons.unshift({ label: 'Fiche', onClick: () => { setTimeout(() => openChar(id), 0); } });
    modal({ title: E(d.name), html: '<div class="dialog"><img src="' + G.Art.icon('char', id, 96) + '" alt=""><div class="speech">' + E(dlg.text) + (first ? '<div class="small muted" style="margin-top:6px">🤝 ' + E(d.name) + ' pourra désormais visiter votre île.</div>' : '') + '</div></div>' + extra, buttons });
  }
  function objectivesHtml(mid) {
    const M = G.Sys.Missions; const m = M.M(mid);
    return m.objectives.map(o => { const p = M.isActive(mid) ? M.objProgress(mid, o) : { cur: 0, n: o.n || 1, ok: false }; return '<div class="row small" style="margin:3px 0"><span>' + (p.ok ? '✅' : '⬜') + ' ' + E(o.label) + '</span><span class="grow"></span><b>' + p.cur + '/' + p.n + '</b></div>'; }).join('');
  }
  function rewardText(r) {
    const p = []; if (r.coins) p.push('🪙 ' + r.coins); if (r.rep) p.push('⭐ ' + r.rep); if (r.disc) p.push('🔍 ' + r.disc); if (r.item) p.push('🏺 ' + G.D.items[r.item].name); if (r.recipe) p.push('📜 ' + G.D.recipes[r.recipe].name);
    if (r.res) for (const k in r.res) p.push(r.res[k] + '× ' + G.D.resources[k].name); if (r.flag === 'cave_open') p.push('🔓 Accès à la grotte'); if (r.flag === 'carte_araignees') p.push('🗺️ Carte maritime');
    return p.join(' · ');
  }
  function adoptDialog(sp, cb) {
    const a = G.D.animals[sp];
    const needs = Object.keys(a.needs).map(k => '<span class="tag">' + G.D.habitatParams[k].icon + ' ' + G.D.habitatParams[k].name + ' ' + a.needs[k] + '</span>').join(' ');
    modal({ title: '🔍 ' + E(a.name), html: '<div class="dialog"><img src="' + G.Art.icon('animal', sp, 96) + '" style="border-radius:12px;background:#eef6e6" alt=""><div class="grow small">' + E(a.desc) + '<br><b>Habitat :</b> ' + G.D.biomes[a.biome].name + ' · <b>Régime :</b> ' + a.diet + (a.social ? ' · <b>Sociable</b>' : '') + '<div style="margin-top:4px">' + needs + '</div></div></div><p class="small muted">L\'animal s\'est habitué à vous. Voulez-vous l\'accueillir dans votre zoo ? Il patientera dans la réserve jusqu\'à ce que vous lui attribuiez un habitat.</p>',
      buttons: [{ label: 'Le laisser en liberté', onClick: () => cb(false) }, { label: 'Accueillir au zoo', primary: true, onClick: () => { G.Sys.Zoo.adopt(sp); G.Game.addRep(0.5, 'zoo'); G.Game.notify(a.name + ' rejoint la réserve du zoo !', '🦕', 'good'); G.State.save(true); cb(true); } }], dismiss: false });
  }
  function exploreZone(isl, zone) { $('#exZone').innerHTML = '<b>' + E(zone) + '</b>' + E(isl); }
  let lastAct = undefined;
  function exploreAction(label) { if (label === lastAct) return; lastAct = label; const b = $('#exAction'); if (!label) b.classList.add('hidden'); else { b.textContent = label; b.classList.remove('hidden'); } }

  function embark(id) {
    closePanel(); G.Home.stopPlacing(); G.Home.stop();
    $('#tabs').classList.add('hidden'); $('#hint').classList.add('hidden'); $('#simInfo').classList.add('hidden'); $('#exHud').classList.remove('hidden');
    document.documentElement.style.setProperty('--tabs-h', '0px');
    G.Explore.start(id); G.Game.log('Expédition vers l\'' + G.D.islands[id].name, '⛵');
    toast('Bienvenue sur l\'' + G.D.islands[id].name + ' !', '⛵', 'good');
  }
  function goHome() {
    modals.slice().forEach(m => m.close());
    G.Explore.stop(); $('#exHud').classList.add('hidden'); $('#tabs').classList.remove('hidden'); $('#simInfo').classList.remove('hidden');
    document.documentElement.style.setProperty('--tabs-h', '64px');
    G.Home.start(); G.State.save(true); hud(); toast('De retour au port de votre île.', '⚓');
  }

  /* Petit inventaire / passeport / missions pendant l'exploration */
  function bag() { modal({ title: '🎒 Sac d\'explorateur', html: G.Screens.inventoryHtml(), wide: true, onMount: el => bind(el, { item: d => showItem(d.id) }) }); }
  function passport(island = 'prehistorique') { modal({ title: '📘 Passeport — ' + G.D.islands[island].name, html: G.Screens.passportHtml(island), wide: true }); }
  function missions() { modal({ title: '📜 Missions', html: G.Screens.missionsHtml('prehistorique'), wide: true }); }

  function init() {
    document.querySelectorAll('#tabs button').forEach(b => b.onclick = () => openTab(b.dataset.tab));
    $('#pClose').onclick = closePanel;
    $('#bJournal').onclick = journal; $('#bSettings').onclick = () => G.Screens.settings();
    $('#exBag').onclick = bag; $('#exPass').onclick = () => passport(); $('#exMis').onclick = missions; $('#exBoat').onclick = () => G.Explore.goToBoat();
    $('#exAction').onclick = () => G.Explore.act();
    ['hud', 'inventory', 'codex', 'chars'].forEach(e => U.on(e, U.throttle(hud, 300)));
    ['museum', 'zoo', 'aquarium', 'bar', 'bar:queue', 'bar:served', 'ads', 'chars', 'gazette', 'buildings', 'inventory', 'missions', 'cycle', 'islands', 'codex'].forEach(e => U.on(e, () => { if (current) refresh(); }));
    U.on('missions', hint); U.on('bar:queue', hud);
    window.addEventListener('keydown', e => { if (e.key === 'Escape') { if (modals.length) modals[modals.length - 1].close(); else if (current) closePanel(); } });
    setInterval(() => { if (G.Home.isRunning()) { const st = G.Sys.Sim.stats(); $('#simInfo').textContent = '👥 ' + st.visitors + '/' + st.cap + ' visiteurs · ~' + st.rate.toFixed(1) + '/min'; } G.Screens.tick && G.Screens.tick(); }, 1000);
  }

  return { toast, modal, modalOpen, confirm, bind, hud, openTab, closePanel, renderPanel, refresh, openBuilding, openChar, showItem, itemCard, itemFound, loreDialog, eventPopup, decorMenu, placingBanner, journal, npcDialog, objectivesHtml, rewardText, adoptDialog, exploreZone, exploreAction, embark, goHome, init, currentView, nextHint };
})();
