/* ARCHIPEL — démarrage, boucle économique, sauvegarde automatique */

G.VERSION = '0.1.0';

G.Main = (() => {
  function welcome(force) {
    if (G.state.tutorial.welcome && !force) return;
    G.state.tutorial.welcome = true; G.State.save(true);
    G.UI.modal({
      title: '🏝️ Bienvenue dans l\'Archipel !', wide: true,
      html: '<div class="dialog"><img src="' + G.Art.icon('char', 'odile', 96) + '" alt=""><div class="speech">Bonjour, nouvelle direction ! Je suis <b>Odile</b>, votre secrétaire. Notre petite île possède un musée, un zoo, un aquarium et un bar-café… mais ils sont presque vides. À vous de les faire vivre !</div></div>'
        + '<div class="dialog" style="margin-top:10px"><img src="' + G.Art.icon('char', 'merou', 96) + '" alt=""><div class="speech">Et moi, c\'est le <b>Capitaine Mérou</b>. Mon Bigorneau vous emmène explorer les îles voisines. Commençons par l\'<b>Île Préhistorique</b> !</div></div>'
        + '<div class="card small"><b>Pour bien démarrer :</b><ol style="margin:6px 0;padding-left:20px"><li><b>Explorer</b> › Île Préhistorique › Embarquer. Déplacez-vous au clavier (ZQSD / flèches) ou en touchant l\'écran.</li><li>Parlez aux habitants (<b>!</b> = mission), fouillez, pêchez, observez les animaux, récoltez.</li><li>De retour : <b>Gestion</b> pour exposer les objets, installer animaux et poissons, servir au bar.</li><li>Les visiteurs arrivent par bateau et se promènent seuls. Touchez-les pour voir leur fiche.</li><li>Chaque lundi, une nouvelle <b>Gazette</b> paraît avec une mission et un cadeau.</li></ol>La partie est sauvegardée automatiquement (export possible dans ⚙️).</div>',
      buttons: [{ label: 'C\'est parti !', primary: true }],
    });
  }

  function offlineSummary(r) {
    if (!r || (!r.coins && !r.visitors)) return;
    G.UI.modal({ title: '🌅 Pendant votre absence…', html: '<p>Votre île a continué de vivre pendant <b>' + (r.minutes >= 60 ? Math.floor(r.minutes / 60) + ' h ' + (r.minutes % 60) + ' min' : r.minutes + ' min') + '</b>' + (r.capped ? ' (gains plafonnés à 6 h)' : '') + '.</p><div class="stats"><div class="stat"><b>' + G.U.fmt(r.visitors) + '</b><span>visiteurs</span></div><div class="stat"><b>+' + G.U.fmt(r.coins) + ' 🪙</b><span>recettes</span></div></div><p class="muted small">Les animaux ont été nourris par les bénévoles et l\'eau des bassins n\'est pas descendue sous 50 %.</p>', buttons: [{ label: 'Merci !', primary: true }] });
    G.Game.log('Absence : ' + r.visitors + ' visiteurs, +' + r.coins + ' pièces.', '🌅');
  }

  function boot() {
    const status = G.State.load();
    G.Sys.Gazette.ensureBase();
    const off = status === 'loaded' ? G.Game.offlineCatchUp() : null;
    G.UI.init();
    G.Home.init(document.getElementById('home'));
    G.Explore.init(document.getElementById('explore'));
    G.Home.start();
    G.UI.hud();
    G.Sys.Gazette.checkNewWeek();
    // cycle économique (1 min) + sauvegarde régulière
    setInterval(() => { G.state.playMs += 60000; G.Game.cycle(); }, 60000);
    setInterval(() => G.State.save(true), 20000);
    let hiddenAt = 0;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { hiddenAt = Date.now(); G.State.save(true); }
      else if (hiddenAt && Date.now() - hiddenAt > 2 * 60000) { G.state.lastSeen = hiddenAt; offlineSummary(G.Game.offlineCatchUp()); G.State.save(true); G.UI.hud(); }
    });
    window.addEventListener('pagehide', () => G.State.save(true));
    window.addEventListener('beforeunload', () => G.State.save(true));
    if (status === 'new') welcome(); else offlineSummary(off);
    G.State.save(true);
  }

  return { boot, welcome };
})();

window.addEventListener('DOMContentLoaded', () => {
  try { G.Main.boot(); }
  catch (e) {
    console.error(e);
    document.body.innerHTML = '<div style="padding:20px;font-family:sans-serif;background:#fff8ec;min-height:100vh"><h2>Oups, le jeu n\'a pas pu démarrer.</h2><pre style="white-space:pre-wrap">' + G.U.esc(e.stack || e) + '</pre><p>Vous pouvez essayer de recharger la page. Si le problème persiste, une sauvegarde corrompue peut en être la cause.</p><button onclick="localStorage.removeItem(\'archipel_save\');location.reload()">Effacer la sauvegarde et recommencer</button></div>';
  }
});
