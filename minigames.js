/* ARCHIPEL — mini-jeux : fouilles, pêche, approche d'animal, restauration, préparation au bar */

G.Mini = (() => {
  const U = G.U, E = U.esc, Art = () => G.Art;

  /* ================= FOUILLES ================= */
  function dig(table, onDone) {
    const W = 7, H = 5; const loot = G.D.lootTables[table];
    const cells = Array.from({ length: W * H }, (_, i) => ({ i, layer: Math.random() < 0.45 ? 2 : 1, find: -1 }));
    const finds = []; const nFinds = U.randi(2, 3);
    for (let k = 0; k < nFinds; k++) {
      const e = U.weighted(loot, x => x.w);
      for (let tries = 0; tries < 40; tries++) {
        const horiz = Math.random() < 0.6; const sx = U.randi(0, horiz ? W - e.size : W - 1), sy = U.randi(0, horiz ? H - 1 : H - e.size);
        const idxs = Array.from({ length: e.size }, (_, j) => (sy + (horiz ? 0 : j)) * W + sx + (horiz ? j : 0));
        if (idxs.every(i => cells[i].find < 0)) { idxs.forEach(i => cells[i].find = finds.length); finds.push({ e, idxs, got: false }); break; }
      }
    }
    let hits = 16; const got = [];
    const iconOf = f => f.e.kind === 'item' ? Art().icon('item', f.e.id, 64) : Art().icon('res', f.e.id, 64);
    const nameOf = f => f.e.kind === 'item' ? G.D.items[f.e.id].name : (f.e.n || 1) + '× ' + G.D.resources[f.e.id].name;
    let m;
    function render(el) {
      el.querySelector('#digHits').textContent = hits;
      el.querySelector('#digFound').textContent = got.length + ' / ' + finds.length;
      const grid = el.querySelector('.mg-grid'); grid.innerHTML = '';
      cells.forEach(c => {
        const b = document.createElement('button'); b.className = 'mg-cell l' + c.layer + (c.find >= 0 && finds[c.find].got ? ' got' : '');
        if (c.layer === 0 && c.find >= 0) b.innerHTML = '<img src="' + iconOf(finds[c.find]) + '" alt="">';
        else if (c.layer === 0) b.innerHTML = '<span style="opacity:.4">·</span>';
        b.onclick = () => hit(c, el); grid.appendChild(b);
      });
    }
    function hit(c, el) {
      if (hits <= 0 || c.layer === 0) return;
      c.layer--; hits--;
      if (c.find >= 0) { const f = finds[c.find]; if (!f.got && f.idxs.every(i => cells[i].layer === 0)) { f.got = true; got.push(f); G.UI.toast('Trouvé : ' + nameOf(f), '⛏️', 'good'); } }
      render(el);
      if (got.length === finds.length || hits <= 0) setTimeout(finish, 450);
    }
    let finished = false;
    function finish() {
      if (finished) return; finished = true; m && m.close();
      got.forEach(f => { if (f.e.kind === 'item') G.Game.addItem(f.e.id); else G.Game.addRes(f.e.id, f.e.n || 1); });
      const d = G.Game.addDisc(3 + got.length * 3, true);
      onDone && onDone(got);
      G.UI.modal({ title: got.length ? '⛏️ Fouille réussie !' : '⛏️ Rien cette fois…', html: got.length ? '<div class="grid">' + got.map(f => '<div class="tile"><img src="' + iconOf(f) + '">' + E(nameOf(f)) + '</div>').join('') + '</div><p class="small">🔍 +' + d + ' points de découverte. Les objets rejoignent votre inventaire.</p>' : '<p>La terre n\'a rien révélé. Les autres carrés vous attendent !</p>', buttons: [{ label: 'Continuer', primary: true }] });
      G.State.save(true);
    }
    m = G.UI.modal({ title: '⛏️ Fouille archéologique', dismiss: false, html: '<p class="small muted">Touchez les cases pour creuser (les cases sombres demandent 2 coups). Dégagez entièrement un objet pour le récupérer.</p><div class="row between small"><span>Coups de truelle : <b id="digHits"></b></span><span>Trouvailles : <b id="digFound"></b></span></div><div class="mg-grid" style="grid-template-columns:repeat(' + W + ',1fr)"></div>',
      buttons: [{ label: 'Terminer la fouille', onClick: () => { finish(); return false; } }], onMount: el => render(el) });
  }

  /* ================= PÊCHE ================= */
  function fish(table, onDone) {
    const spId = U.weighted(G.D.fishTables[table], x => x.w).id; const sp = G.D.fish[spId];
    const diff = { commun: [0.26, 0.9], peu: [0.2, 1.2], rare: [0.15, 1.5], legendaire: [0.11, 1.8] }[sp.rarity];
    let phase = 'idle', timer = null, raf = 0, pos = 0, dir = 1, ok = 0, ko = 0, zone = 0.5, last = 0;
    let m;
    const html = '<p class="small muted" id="fiTxt">Lancez votre ligne et attendez que le bouchon plonge.</p><div style="height:120px;border-radius:14px;background:linear-gradient(#7fd0ef,' + (table === 'mer' ? '#2b7fb5' : '#3a9a8a') + ');position:relative;overflow:hidden" id="fiWater"><div id="fiBob" style="position:absolute;left:48%;top:46px;font-size:26px;transition:top .15s">🎈</div><div id="fiMark" style="position:absolute;left:52%;top:6px;font-size:28px;display:none">❗</div></div><div class="hbar hidden" id="fiBar"><div class="zone" id="fiZone"></div><div class="needle" id="fiNeedle"></div></div><div class="small" id="fiScore"></div><button class="btn big-btn warn" id="fiBtn" style="margin-top:10px">Lancer la ligne</button>';
    function setTxt(t) { m.el.querySelector('#fiTxt').textContent = t; }
    function end(caught) {
      cancelAnimationFrame(raf); clearTimeout(timer); phase = 'end';
      m.close();
      if (caught) {
        const f = G.Sys.Aquarium.addFish(spId); const isNew = G.Game.discover('fish', spId);
        const d = G.Game.addDisc(isNew ? 15 : 3, true); G.Game.counter('fish');
        G.UI.modal({ title: '🎣 ' + E(sp.name) + ' !', html: '<div class="dialog"><img src="' + Art().icon('fish', spId, 96) + '" style="border-radius:12px;background:#e6f2fa"><div class="grow small">' + (isNew ? '<span class="tag gold">Nouvelle espèce !</span><br>' : '') + E(sp.desc) + '<br><b>Eau :</b> ' + G.D.waterEnvs[sp.env].name + ' · <b>' + sp.temp[0] + '–' + sp.temp[1] + ' °C</b><br>🔍 +' + d + ' découverte</div></div><p class="small muted">Le poisson rejoint les viviers de réserve de l\'aquarium.</p>', buttons: [{ label: 'Super !', primary: true }] });
        G.Sys.Missions.checkIsland('prehistorique');
      } else G.UI.toast('Il s\'est échappé…', '🎣');
      onDone && onDone(caught); G.State.save(true);
    }
    function press() {
      if (phase === 'idle') {
        phase = 'wait'; setTxt('Patience… le bouchon flotte.'); m.el.querySelector('#fiBtn').textContent = 'Ferrer !';
        timer = setTimeout(() => { phase = 'bite'; m.el.querySelector('#fiMark').style.display = 'block'; m.el.querySelector('#fiBob').style.top = '64px'; setTxt('Ça mord ! Ferrez vite !'); timer = setTimeout(() => { if (phase === 'bite') { setTxt('Trop tard…'); end(false); } }, 950); }, U.rand(1500, 4000));
      } else if (phase === 'wait') { setTxt('Trop tôt ! Le poisson a eu peur.'); clearTimeout(timer); setTimeout(() => end(false), 500); phase = 'end'; }
      else if (phase === 'bite') {
        clearTimeout(timer); phase = 'reel'; m.el.querySelector('#fiMark').style.display = 'none';
        m.el.querySelector('#fiBar').classList.remove('hidden'); m.el.querySelector('#fiBtn').textContent = 'Tirer !';
        setTxt('Tirez quand l\'aiguille est dans la zone verte (3 réussites avant 3 ratés).');
        newZone(); last = 0; raf = requestAnimationFrame(anim);
      } else if (phase === 'reel') {
        const inZone = Math.abs(pos - zone) <= diff[0] / 2;
        if (inZone) ok++; else ko++;
        m.el.querySelector('#fiScore').innerHTML = '✅ '.repeat(ok) + '❌ '.repeat(ko);
        if (ok >= 3) end(true); else if (ko >= 3) end(false); else newZone();
      }
    }
    function newZone() { zone = U.rand(0.15, 0.85); const z = m.el.querySelector('#fiZone'); z.style.left = ((zone - diff[0] / 2) * 100) + '%'; z.style.width = (diff[0] * 100) + '%'; }
    function anim(ts) {
      if (phase !== 'reel') return; const dt = Math.min(0.05, (ts - (last || ts)) / 1000); last = ts;
      pos += dir * diff[1] * dt * (0.8 + Math.random() * 0.4); if (pos > 1) { pos = 1; dir = -1; } if (pos < 0) { pos = 0; dir = 1; }
      m.el.querySelector('#fiNeedle').style.left = (pos * 100) + '%'; raf = requestAnimationFrame(anim);
    }
    m = G.UI.modal({ title: table === 'mer' ? '🎣 Pêche en mer' : '🎣 Pêche dans la lagune', html, dismiss: false, buttons: [{ label: 'Abandonner', onClick: () => { cancelAnimationFrame(raf); clearTimeout(timer); phase = 'end'; } }], onMount: el => { el.querySelector('#fiBtn').addEventListener('pointerdown', e => { e.preventDefault(); press(); }); } });
  }

  /* ================= APPROCHE D'ANIMAL ================= */
  function approach(spId, cb) {
    const sp = G.D.animals[spId]; const known = !!G.state.codex.animals[spId];
    const speed = { commun: 0.3, peu: 0.25, rare: 0.2, legendaire: 0.16 }[sp.rarity];
    let prog = 0, state = 'calm', stTimer = U.rand(1.5, 3), holding = false, raf = 0, last = 0, t = 0, done = false, m;
    const html = '<p class="small muted">Maintenez « Approcher » quand l\'animal est calme. Relâchez dès qu\'il dresse la tête (⚠️), sinon il s\'enfuit !</p><canvas id="apCv" style="width:100%;height:170px;border-radius:14px;display:block"></canvas><div class="row small" style="margin:6px 0"><b id="apState">Calme</b><span class="grow"></span><span>Distance</span></div><div class="bar good"><i id="apBar" style="width:0%"></i></div><button class="btn big-btn" id="apBtn" style="margin-top:10px">🤫 Approcher</button>';
    function finish(ok) {
      if (done) return; done = true; cancelAnimationFrame(raf); m.close();
      if (!ok) G.UI.toast((known ? sp.name : 'L\'animal') + ' s\'est enfui ! Réessayez dans une minute.', '💨', 'bad');
      cb(ok);
    }
    function frame(ts) {
      if (done) return; const dt = Math.min(0.05, (ts - (last || ts)) / 1000); last = ts; t += dt;
      stTimer -= dt;
      if (stTimer <= 0) { if (state === 'calm') { state = 'warn'; stTimer = 0.75; } else if (state === 'warn') { state = 'watch'; stTimer = U.rand(1, 2); } else { state = 'calm'; stTimer = U.rand(1.4, 3.2); } }
      if (holding) { if (state === 'watch') return finish(false); prog += speed * dt * (state === 'warn' ? 0.5 : 1); }
      if (prog >= 1) return finish(true);
      const el = m.el; el.querySelector('#apBar').style.width = (prog * 100) + '%';
      el.querySelector('#apState').textContent = state === 'calm' ? '😌 Calme' : state === 'warn' ? '⚠️ Il dresse la tête…' : '👀 Aux aguets !';
      el.querySelector('#apState').style.color = state === 'calm' ? '#2f6b26' : state === 'warn' ? '#a07010' : '#b03a2e';
      const cv = el.querySelector('#apCv'); const r = cv.getBoundingClientRect(); const d = Math.min(2, devicePixelRatio || 1);
      if (cv.width !== Math.round(r.width * d)) { cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); }
      const c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0);
      const bi = G.D.biomes[sp.biome]; c.fillStyle = bi.ground; c.fillRect(0, 0, r.width, r.height);
      c.fillStyle = '#9ed0ef'; c.fillRect(0, 0, r.width, 50);
      for (let i = 0; i < 6; i++) Art().fern(c, 20 + i * (r.width / 6), 70 + (i % 2) * 8, 1.2, bi.deco, t);
      const s = 2 + prog * 1.8; const facing = state === 'calm' ? -1 : 1;
      Art().drawAnimal(c, spId, r.width * 0.62, r.height - 18, s, t, facing, state === 'calm' && Math.sin(t) > 0 ? 'eat' : 'idle');
      if (state !== 'calm') { c.font = '22px sans-serif'; c.fillText(state === 'warn' ? '❔' : '❗', r.width * 0.62, r.height - 40 - 40 * s); }
      Art().fern(c, r.width * 0.12, r.height, 2.2, '#3f7f3a', t);
      raf = requestAnimationFrame(frame);
    }
    m = G.UI.modal({ title: '🔍 Observer ' + (known ? E(sp.name) : 'un animal inconnu'), html, dismiss: false, buttons: [{ label: 'Renoncer', onClick: () => { done = true; cancelAnimationFrame(raf); } }], onMount: el => {
      const b = el.querySelector('#apBtn');
      b.addEventListener('pointerdown', e => { e.preventDefault(); holding = true; try { b.setPointerCapture(e.pointerId); } catch (_) {} });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => b.addEventListener(ev, () => holding = false));
      const kd = e => { if (e.key === ' ') { e.preventDefault(); holding = true; } }, ku = e => { if (e.key === ' ') holding = false; };
      window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
      const obs = setInterval(() => { if (done || !document.body.contains(el)) { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); clearInterval(obs); done = true; } }, 500);
      raf = requestAnimationFrame(frame);
    } });
  }

  /* ================= RESTAURATION (puzzle) ================= */
  function restore(id) {
    if (!G.Sys.Museum.canRestore(id)) { G.UI.toast('Fragments insuffisants.', '🦴', 'bad'); return; }
    let order = U.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]); while (order.every((v, i) => v === i)) order = U.shuffle(order);
    let sel = -1, moves = 0, m;
    const src = document.createElement('canvas'); src.width = src.height = 300; const sc = src.getContext('2d');
    sc.fillStyle = '#f2e6cc'; sc.fillRect(0, 0, 300, 300); sc.save(); sc.scale(300 / 64, 300 / 64); Art().drawItem(sc, id); sc.restore();
    sc.strokeStyle = 'rgba(120,90,50,.25)'; for (let i = 0; i < 300; i += 25) { sc.beginPath(); sc.moveTo(i, 0); sc.lineTo(i, 300); sc.stroke(); }
    function draw(el) {
      const box = el.querySelector('.puzzle'); box.innerHTML = '';
      order.forEach((piece, pos) => { const cv = document.createElement('canvas'); cv.width = cv.height = 100; cv.getContext('2d').drawImage(src, (piece % 3) * 100, Math.floor(piece / 3) * 100, 100, 100, 0, 0, 100, 100); if (pos === sel) cv.className = 'sel'; cv.onclick = () => click(pos, el); box.appendChild(cv); });
      el.querySelector('#rsMoves').textContent = moves;
    }
    function click(pos, el) {
      if (sel < 0) { sel = pos; draw(el); return; }
      if (sel !== pos) { [order[sel], order[pos]] = [order[pos], order[sel]]; moves++; }
      sel = -1; draw(el);
      if (order.every((v, i) => v === i)) {
        const stars = moves <= 6 ? 3 : moves <= 11 ? 2 : 1;
        setTimeout(() => { m.close(); G.Sys.Museum.restore(id, stars); G.UI.itemFound(id, 'Restauration terminée !', 'Qualité ' + '★'.repeat(stars) + ' (' + moves + ' échanges)'); }, 350);
      }
    }
    m = G.UI.modal({ title: '🦴 Restaurer : ' + E(G.D.items[id].name), dismiss: false, html: '<p class="small muted">Touchez deux fragments pour les échanger et reconstituer la pièce. Moins d\'échanges = meilleure qualité (6 ou moins : ★★★).</p><div class="puzzle"></div><p class="small" style="text-align:center">Échanges : <b id="rsMoves">0</b></p>', buttons: [{ label: 'Abandonner (fragments conservés)' }], onMount: el => draw(el) });
  }

  /* ================= BAR (style « Papa's ») ================= */
  function bar(order) {
    const B = G.Sys.Bar, S = G.state;
    order.inService = true; U.emit('bar:queue');
    const sel = { recipe: null, ingredients: [], prepValue: null, garnishes: [], time: 0 };
    let step = 0, t0 = 0, raf = 0, m, served = false, showNotebook = false;
    const STEPS = ['Commande', 'Recette', 'Ingrédients', 'Préparation', 'Garnitures', 'Service', 'Évaluation'];
    const who = order.charId ? '<img class="avatar" src="' + Art().icon('char', order.charId, 64) + '">' : '<span style="font-size:40px">🧳</span>';
    const ticket = () => '<div class="ticket">🧾 <b>' + E(order.name) + '</b> : ' + (order.usual ? '« Comme d\'habitude ! »' + (showNotebook ? '<br><span class="small">📒 Carnet : ' + E(B.orderText(S.bar.prefs[order.charId])) + '</span>' : '') : E(B.orderText(order))) + '</div>';
    const elapsed = () => t0 ? Math.round((Date.now() - t0) / 1000) : 0;
    function body() {
      let h = '<div class="steps">' + STEPS.map((s, i) => '<i class="' + (i < step ? 'done' : i === step ? 'on' : '') + '" title="' + s + '"></i>').join('') + '</div><div class="row between small"><b>' + (step + 1) + '. ' + STEPS[step] + '</b>' + (t0 && step < 6 ? '<span>⏱️ <span id="brTime">' + elapsed() + '</span> s / ' + (32 + S.bar.upg.comptoir * 6) + ' s</span>' : '') + '</div>';
      if (step > 0 && step < 6) h += ticket() + (order.usual && S.bar.prefs[order.charId] && !showNotebook ? '<button class="btn small alt" data-act="nb" style="margin-top:6px">📒 Consulter le carnet des habitués</button>' : '');
      if (step === 0) h += '<div class="dialog" style="margin-top:8px">' + who + '<div class="speech">' + (order.usual ? 'Bonjour ! Je prendrai… <b>comme d\'habitude</b> !' : 'Bonjour ! Je voudrais : <b>' + E(B.orderText(order)) + '</b>') + '</div></div><button class="btn block" data-act="take" style="margin-top:12px">📝 Prendre la commande</button>';
      if (step === 1) h += '<div class="grid" style="margin-top:8px">' + B.availableRecipes().map(id => '<button class="tile" data-act="recipe" data-id="' + id + '"><span style="font-size:34px">' + ({ hot: '☕', cold: '🥤', snack: '🍪' })[G.D.recipes[id].type] + '</span><b>' + E(G.D.recipes[id].name) + '</b></button>').join('') + '</div>';
      if (step === 2) { const r = G.D.recipes[sel.recipe]; const all = U.shuffle([...new Set(r.ingredients.concat(r.extras, r.decoys))], U.mulberry32(U.hashStr(order.id))); h += '<p class="small muted">Sélectionnez les ingrédients de la recette et les extras demandés.</p><div class="chips">' + all.map(i => '<button class="chip ' + (sel.ingredients.includes(i) ? 'on' : '') + '" data-act="ing" data-id="' + i + '">' + G.D.ingredients[i].icon + ' ' + E(G.D.ingredients[i].name) + '</button>').join('') + '</div><button class="btn block" data-act="next" style="margin-top:12px">Préparer →</button>'; }
      if (step === 3) h += prepHtml();
      if (step === 4) { const r = G.D.recipes[sel.recipe]; h += '<p class="small muted">Ajoutez les garnitures demandées (ou aucune).</p><div class="chips">' + r.garnishes.map(g => '<button class="chip ' + (sel.garnishes.includes(g) ? 'on' : '') + '" data-act="garn" data-id="' + g + '">' + E(G.D.garnishes[g]) + '</button>').join('') + '</div><button class="btn block" data-act="next" style="margin-top:12px">Dresser →</button>'; }
      if (step === 5) { const r = G.D.recipes[sel.recipe]; h += '<div class="card small"><b>' + E(r.name) + '</b> · ' + G.D.prepTypes[r.prep].name + ' : ' + Math.round(sel.prepValue * 100) + ' %<br>Ingrédients : ' + (sel.ingredients.map(i => G.D.ingredients[i].name).join(', ') || '—') + '<br>Garnitures : ' + (sel.garnishes.map(g => G.D.garnishes[g]).join(', ') || 'aucune') + '</div><button class="btn block warn big-btn" data-act="serve">🛎️ Servir</button>'; }
      if (step === 6) h += resultHtml;
      return h;
    }
    let resultHtml = '';
    function prepHtml() {
      const r = G.D.recipes[sel.recipe], P = G.D.prepTypes[r.prep]; const tgt = P.targets[order.usual ? (S.bar.prefs[order.charId] || order).level : order.level];
      const hintLv = order.usual && !showNotebook ? '(niveau habituel du client)' : P.levels[order.level];
      if (r.prep === 'pour') return '<p class="small muted">' + P.hint + ' Cible : <b>' + hintLv + '</b>.</p><div class="gauge-wrap"><div class="glass" style="border-color:' + (r.cup || '#9ab') + '"><div class="fill" id="gFill" style="height:0%;background:' + r.liquid + '"></div><div class="target" style="bottom:' + (showTarget() ? tgt * 100 : -10) + '%"></div></div></div><button class="btn big-btn" id="holdBtn">🫗 Verser (maintenir)</button><button class="btn block alt" data-act="next" id="prepOk" style="margin-top:8px" disabled>Valider →</button>';
      if (r.prep === 'bake') return '<p class="small muted">' + P.hint + ' Cuisson : <b>' + hintLv + '</b>.</p><div class="hbar"><div class="zone" style="left:' + ((tgt - 0.07) * 100) + '%;width:14%;' + (showTarget() ? '' : 'opacity:0') + '"></div><div class="needle" id="gNeedle"></div></div><div class="row small between"><span>Crue</span><span>Moelleuse</span><span>Dorée</span><span>Croustillante</span></div><button class="btn big-btn warn" id="holdBtn">🔥 Sortir du four</button><button class="btn block alt" data-act="next" id="prepOk" style="margin-top:8px" disabled>Valider →</button>';
      return '<p class="small muted">' + P.hint + ' Texture : <b>' + hintLv + '</b>.</p><div class="hbar"><div class="zone" style="left:' + ((tgt - 0.07) * 100) + '%;width:14%;' + (showTarget() ? '' : 'opacity:0') + '"></div><div class="needle" id="gNeedle" style="left:0%"></div></div><div class="row"><button class="btn big-btn grow" id="holdBtn">🌀 Mixer (tapoter)</button><button class="btn big-btn alt" id="stopBtn" style="width:auto">⏹ Stop</button></div><button class="btn block alt" data-act="next" id="prepOk" style="margin-top:8px" disabled>Valider →</button>';
    }
    function showTarget() { return !order.usual || showNotebook; }
    function mountPrep(el) {
      const r = G.D.recipes[sel.recipe]; const slow = 1 - 0.12 * S.bar.upg.machines; let v = 0, last = 0, holding = false, fixed = false, dir = 1;
      const ok = el.querySelector('#prepOk'); const btn = el.querySelector('#holdBtn');
      const fix = () => { if (fixed) return; fixed = true; sel.prepValue = U.clamp(v, 0, 1); ok.disabled = false; ok.classList.remove('alt'); btn.disabled = true; };
      if (r.prep === 'pour') {
        btn.addEventListener('pointerdown', e => { e.preventDefault(); if (!fixed) holding = true; });
        ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => btn.addEventListener(ev, () => { if (holding) { holding = false; fix(); } }));
      } else if (r.prep === 'bake') { btn.addEventListener('pointerdown', e => { e.preventDefault(); fix(); }); }
      else { btn.addEventListener('pointerdown', e => { e.preventDefault(); if (!fixed) v = Math.min(1.05, v + 0.065); }); el.querySelector('#stopBtn').addEventListener('pointerdown', e => { e.preventDefault(); fix(); }); }
      const f = ts => {
        if (!document.body.contains(el) || step !== 3) return; const dt = Math.min(0.05, (ts - (last || ts)) / 1000); last = ts;
        if (!fixed) {
          if (r.prep === 'pour' && holding) v = Math.min(1, v + 0.42 * slow * dt);
          if (r.prep === 'bake') { v += dir * 0.38 * slow * dt; if (v >= 1) { v = 1; dir = -1; } if (v <= 0) { v = 0; dir = 1; } }
          if (r.prep === 'blend') v = Math.max(0, v - 0.07 * slow * dt);
        }
        const fill = el.querySelector('#gFill'); if (fill) fill.style.height = (v * 100) + '%';
        const nd = el.querySelector('#gNeedle'); if (nd) nd.style.left = (U.clamp(v, 0, 1) * 100) + '%';
        const tm = el.querySelector('#brTime'); if (tm) tm.textContent = elapsed();
        raf = requestAnimationFrame(f);
      };
      raf = requestAnimationFrame(f);
    }
    function render() {
      const el = m.el.querySelector('.m-body'); el.innerHTML = body();
      G.UI.bind(el, {
        nb: () => { showNotebook = true; render(); },
        take: () => { t0 = Date.now(); step = 1; render(); },
        recipe: d => { sel.recipe = d.id; sel.ingredients = []; sel.garnishes = []; step = 2; render(); },
        ing: d => { const i = sel.ingredients.indexOf(d.id); i >= 0 ? sel.ingredients.splice(i, 1) : sel.ingredients.push(d.id); render(); },
        garn: d => { const i = sel.garnishes.indexOf(d.id); i >= 0 ? sel.garnishes.splice(i, 1) : sel.garnishes.push(d.id); render(); },
        next: () => { if (step === 3 && sel.prepValue == null) return; step++; render(); },
        serve: () => doServe(),
        again: () => { m.close(); const o = B.queue.find(x => !x.inService); if (o) bar(o); },
      });
      if (step === 3) mountPrep(el);
      if (!clock) clock = setInterval(() => { const tm = m.el.querySelector('#brTime'); if (tm) tm.textContent = elapsed(); if (!document.body.contains(m.el)) clearInterval(clock); }, 500);
    }
    let clock = null;
    function doServe() {
      sel.time = elapsed(); B.take(order.id); served = true;
      if (order.usual && S.bar.prefs[order.charId]) { const p = S.bar.prefs[order.charId]; Object.assign(order, { recipe: p.recipe, level: p.level, extras: p.extras, garnishes: p.garnishes }); }
      const res = B.serve(order, sel);
      const ev = res.ev; const stars = Math.round(ev.total * 5);
      const row = (l, v) => '<div class="row small"><span style="width:110px">' + l + '</span><div class="grow">' + '<div class="bar ' + (v > 0.7 ? 'good' : v > 0.4 ? 'warn' : 'bad') + '"><i style="width:' + Math.round(v * 100) + '%"></i></div></div><b style="width:44px;text-align:right">' + Math.round(v * 100) + '%</b></div>';
      const react = ev.total >= 0.9 ? 'Parfait, exactement ce que je voulais !' : ev.total >= 0.7 ? 'Très bon, merci !' : ev.total >= 0.45 ? 'Mmh… ça ira.' : 'Ce n\'est pas vraiment ce que j\'avais commandé…';
      resultHtml = '<div style="text-align:center"><div class="stars">' + '★'.repeat(stars) + '☆'.repeat(5 - stars) + '</div><b style="font-size:22px">' + Math.round(ev.total * 100) + ' %</b></div><div class="dialog" style="margin:10px 0">' + who + '<div class="speech">' + react + '</div></div>' + row('Recette', ev.recipeOK) + row('Ingrédients', ev.ing) + row('Préparation', ev.prep) + row('Garnitures', ev.garn) + row('Rapidité', ev.speed)
        + '<p class="small" style="margin-top:8px">💰 Gain net : <b>' + res.pay + ' 🪙</b>' + (res.tip ? ' (dont pourboire ' + res.tip + ')' : '') + ' · ingrédients −' + res.cost + ' · ⏱️ ' + sel.time + ' s</p>'
        + (B.queue.some(x => !x.inService) ? '<button class="btn block" data-act="again">Client suivant →</button>' : '');
      step = 6; render();
    }
    m = G.UI.modal({ title: '☕ Bar-café', wide: true, dismiss: false, html: '', buttons: [{ label: 'Fermer' }], onClose: () => { cancelAnimationFrame(raf); clearInterval(clock); if (!served) { order.inService = false; U.emit('bar:queue'); } } });
    render();
  }

  return { dig, fish, approach, restore, bar };
})();
