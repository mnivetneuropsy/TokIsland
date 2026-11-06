/* ARCHIPEL — îles à explorer
   Chaque île décrit sa carte de manière procédurale (forme + « tampons » de zones),
   ses entités (PNJ, points de fouille, pêche, animaux, ressources, objets cachés, curiosités)
   et son passeport. Les îles verrouillées décrivent déjà leur configuration prévue. */

G.D.islandOrder = ['prehistorique', 'araignees', 'guerriers', 'polaire', 'openspace'];

G.D.islands = {
  prehistorique: {
    name: 'Île Préhistorique', short: 'Préhistorique', icon: '🦖', playable: true, chart: { x: 230, y: 190 },
    desc: 'Jungle de fougères géantes, volcan endormi, grottes peintes et un village accueillant.',
    palette: { deep: '#2f7fb8', shallow: '#56b4d3', sand: '#ecd9a0', grass: '#86c25e', jungle: '#5f9e45', path: '#d9bf8a', dirt: '#b98d5e',
      lavarock: '#7d6a5f', lava: '#ee6b2f', cavefloor: '#5a4c44', cavewall: '#2e2522', village: '#c9b07a', lagoon: '#4fb8b0' },
    map: {
      w: 60, h: 44, seed: 7311, center: [30, 22], radii: [27.5, 19.5],
      zones: [
        { id: 'plage', name: 'Plage du Débarcadère', rect: [22, 34, 40, 44] },
        { id: 'grotte', name: 'Grotte aux Échos', rect: [13, 4, 27, 13] },
        { id: 'lagune', name: 'Lagune Bleue', rect: [6, 13, 18, 23] },
        { id: 'village', name: 'Village de Pierre-Haute', rect: [7, 24, 23, 35] },
        { id: 'fouilles', name: 'Site de fouilles', rect: [24, 13, 37, 24] },
        { id: 'volcan', name: 'Pied du Volcan', rect: [36, 2, 53, 18] },
        { id: 'jungle', name: 'Jungle des Fougères', rect: [37, 18, 57, 37] },
      ],
      stamps: [
        { type: 'circle', cx: 44, cy: 10, r: 7.2, tile: 'lavarock' },
        { type: 'circle', cx: 44, cy: 10, r: 2.6, tile: 'lava' },
        { type: 'rect', x0: 9, y0: 25, x1: 21, y1: 33, tile: 'village' },
        { type: 'rect', x0: 38, y0: 18, x1: 54, y1: 34, tile: 'jungle' },
        { type: 'rect', x0: 25, y0: 14, x1: 36, y1: 23, tile: 'dirt' },
        { type: 'circle', cx: 12, cy: 18, r: 3.6, tile: 'lagoon' },
        { type: 'cave', x0: 13, y0: 4, x1: 26, y1: 13, gate: [19, 13, 20, 13], flag: 'cave_open' },
      ],
      paths: [[30, 37, 30, 24], [11, 24, 30, 24], [16, 24, 16, 31], [19, 14, 19, 24], [30, 26, 47, 26], [30, 20, 41, 20], [41, 20, 41, 14], [30, 14, 30, 20], [27, 10, 30, 10], [30, 10, 30, 14]],
      huts: [[10, 26], [17, 27], [12, 31], [19, 31]],
      dock: { x: 30, y0: 37, y1: 42 }, boat: { x: 32.5, y: 42.3 }, start: { x: 30, y: 36 },
      npcs: [
        { id: 'ambre', x: 29, y: 17 }, { id: 'silex', x: 14, y: 28 }, { id: 'ugo', x: 18, y: 30 }, { id: 'brindille', x: 11, y: 29 },
        { id: 'tiko', x: 14, y: 23 }, { id: 'grom', x: 21, y: 15 }, { id: 'lila', x: 19, y: 8, cave: true }, { id: 'basalte', x: 40, y: 15 }, { id: 'merou', x: 32, y: 37 },
      ],
      spots: [
        { id: 'dig1', type: 'dig', table: 'fouilles', x: 27, y: 16 }, { id: 'dig2', type: 'dig', table: 'fouilles', x: 33, y: 16 },
        { id: 'dig3', type: 'dig', table: 'fouilles', x: 27, y: 21 }, { id: 'dig4', type: 'dig', table: 'fouilles', x: 34, y: 21 },
        { id: 'digv1', type: 'dig', table: 'volcan', x: 39, y: 9 }, { id: 'digv2', type: 'dig', table: 'volcan', x: 48, y: 14 },
        { id: 'fishl1', type: 'fish', table: 'lagune', water: 'lagoon', x: 12, y: 22 }, { id: 'fishl2', type: 'fish', table: 'lagune', water: 'lagoon', x: 16, y: 17 },
        { id: 'fishm1', type: 'fish', table: 'mer', water: 'sea', x: 30, y: 42 }, { id: 'fishm2', type: 'fish', table: 'mer', water: 'sea', x: 52, y: 32 },
        { id: 'an_compso', type: 'animal', species: 'compsognathe', x: 43, y: 22 }, { id: 'an_smilo', type: 'animal', species: 'smilodon', x: 51, y: 29 },
        { id: 'an_trice', type: 'animal', species: 'triceratops', x: 36, y: 31 }, { id: 'an_glypto', type: 'animal', species: 'glyptodon', x: 23, y: 30 },
        { id: 'an_dimetro', type: 'animal', species: 'dimetrodon', x: 48, y: 6 }, { id: 'an_mammouth', type: 'animal', species: 'mammouth', x: 28, y: 9 },
        { id: 'an_ptera', type: 'animal', species: 'pteranodon', x: 53, y: 15 },
        { id: 'rb1', type: 'res', res: 'bois', x: 22, y: 27 }, { id: 'rb2', type: 'res', res: 'bois', x: 36, y: 28 }, { id: 'rb3', type: 'res', res: 'bois', x: 45, y: 24 },
        { id: 'rb4', type: 'res', res: 'bois', x: 26, y: 33 }, { id: 'rb5', type: 'res', res: 'bois', x: 17, y: 21 },
        { id: 'rp1', type: 'res', res: 'pierre', x: 37, y: 12 }, { id: 'rp2', type: 'res', res: 'pierre', x: 27, y: 12 }, { id: 'rp3', type: 'res', res: 'pierre', x: 21, y: 35 },
        { id: 'rba1', type: 'res', res: 'baies', x: 10, y: 33 }, { id: 'rba2', type: 'res', res: 'baies', x: 21, y: 26 }, { id: 'rba3', type: 'res', res: 'baies', x: 40, y: 31 }, { id: 'rba4', type: 'res', res: 'baies', x: 33, y: 33 },
        { id: 'rh1', type: 'res', res: 'herbes', x: 9, y: 22 }, { id: 'rh2', type: 'res', res: 'herbes', x: 16, y: 21 }, { id: 'rh3', type: 'res', res: 'herbes', x: 8, y: 16 }, { id: 'rh4', type: 'res', res: 'herbes', x: 17, y: 15 },
        { id: 'rr1', type: 'res', res: 'resine', x: 48, y: 21 }, { id: 'rr2', type: 'res', res: 'resine', x: 44, y: 30 },
        { id: 'ro1', type: 'res', res: 'ocre', x: 15, y: 6, cave: true }, { id: 'ro2', type: 'res', res: 'ocre', x: 23, y: 6, cave: true }, { id: 'ro3', type: 'res', res: 'ocre', x: 16, y: 11, cave: true },
        { id: 'h_aiguille', type: 'hidden', item: 'aiguille_os', x: 9, y: 31 }, { id: 'h_statuette', type: 'hidden', item: 'statuette_mammouth', x: 24, y: 9, cave: true },
        { id: 'h_oeuf', type: 'hidden', item: 'oeuf_petrifie', x: 49, y: 9 }, { id: 'h_dent', type: 'hidden', item: 'dent_smilodon', x: 53, y: 24 },
        { id: 'l_empreintes', type: 'lore', x: 35, y: 24, title: 'Empreintes dans la boue', text: 'Trois doigts griffus, profondément marqués. Vous moulez l\'empreinte la plus nette avec de l\'argile.', reward: { item: 'empreinte_theropode', disc: 8 } },
        { id: 'l_pierre', type: 'lore', x: 13, y: 25, title: 'La Pierre dressée', text: 'Un menhir couvert de petits traits gravés. Mamie Silex dit que chaque trait compte une saison de pêche réussie.', reward: { disc: 6 } },
        { id: 'l_source', type: 'lore', x: 37, y: 16, title: 'Source chaude', text: 'Une eau fumante jaillit entre les roches noires. Le volcan respire doucement.', reward: { disc: 6, res: { pierre: 2 } } },
        { id: 'l_fresque', type: 'lore', x: 16, y: 5, cave: true, title: 'La fresque des Échos', text: 'Des dizaines d\'animaux courent sur la paroi : mammouths, chevaux, un smilodon… Les couleurs semblent vibrer à la lueur de la torche.', reward: { disc: 12 } },
      ],
    },
    passport: { zones: 7, mainMissions: true, species: 4, items: ['biface', 'peinture_rupestre', 'crane_triceratops'], chars: ['ambre', 'silex', 'grom', 'lila', 'tiko', 'basalte'] },
    unlocksMap: 'carte_araignees',
  },

  /* ---- Îles verrouillées : configuration prévue (contenu à développer) ---- */
  araignees: {
    name: 'Île des Araignées', short: 'Araignées', icon: '🕷️', playable: false, requires: 'carte_araignees', chart: { x: 150, y: 430 },
    desc: 'Forêt sombre, toiles géantes, arbres creux et grottes humides.',
    palette: { grass: '#3f5a3a', jungle: '#2b3f2c', path: '#7a6a55', sand: '#b8a77a', deep: '#22506e', shallow: '#3b7a8f' },
    planned: {
      zones: ['Lisière des Toiles', 'Bois Creux', 'Grotte des Cocons', 'Canopée suspendue', 'Laboratoire de terrain'],
      content: ['Mygale dorée', 'Épeire des brumes', 'Araignée-paon', 'Cocons de soie', 'Soie d\'argent rare', 'Terrarium ancien'],
      activities: ['Observation et photographie', 'Identification des espèces', 'Énigmes de toiles', 'Missions scientifiques'],
      characters: ['Dr Arachné (arachnologue)', 'Fil (tisserande)', 'Pip (photographe)'],
    },
    unlocksMap: 'carte_guerriers',
  },
  guerriers: {
    name: 'Île des Guerriers', short: 'Guerriers', icon: '🛡️', playable: false, requires: 'carte_guerriers', chart: { x: 820, y: 440 },
    desc: 'Camps, fortifications, champs de tournoi et villages de factions rivales (combats stylisés).',
    palette: { grass: '#9bb46a', path: '#c8a77a', sand: '#e0c890', deep: '#2f6f9a', shallow: '#4f9ac0' },
    planned: {
      zones: ['Camp des Bannières', 'Forteresse du Roc', 'Lice des tournois', 'Atelier des machines', 'Village des forgerons'],
      content: ['Épée de parade', 'Bouclier peint', 'Armure lamellaire', 'Bannière de faction', 'Maquette de trébuchet', 'Chevaux de campement'],
      activities: ['Tournois stylisés', 'Entraînement', 'Énigmes stratégiques', 'Quêtes d\'équipement'],
      characters: ['Dame Ortie (capitaine)', 'Bram (forgeron)', 'Sire Pâquerette (héraut)'],
    },
    unlocksMap: 'carte_polaire',
  },
  polaire: {
    name: 'Île Polaire', short: 'Polaire', icon: '🐻‍❄️', playable: false, requires: 'carte_polaire', chart: { x: 720, y: 110 },
    desc: 'Neige, banquise, aurores et villages accueillants. Références culturelles à documenter avec soin.',
    palette: { grass: '#eef5fa', path: '#c9d8e6', sand: '#dfe9f1', deep: '#2a5f8a', shallow: '#7fb6d9' },
    planned: {
      zones: ['Baie de la Banquise', 'Village du Vent', 'Glacier bleu', 'Plateau des aurores', 'Trous de pêche'],
      content: ['Ours polaire', 'Renard arctique', 'Morse', 'Omble chevalier', 'Morue polaire', 'Cristaux de glace', 'Artisanat (à documenter)'],
      activities: ['Pêche sur glace', 'Observation animale', 'Phénomènes naturels (aurores)', 'Missions avec les habitants'],
      characters: ['Personnages à créer avec une documentation respectueuse des cultures inuit (sources à vérifier)'],
      note: 'Toute référence aux cultures inuit sera documentée (sources ethnographiques, musées, ressources inuit) avant intégration.',
    },
    unlocksMap: 'carte_openspace',
  },
  openspace: {
    name: 'Île Open Space', short: 'Open Space', icon: '🖨️', playable: false, requires: 'carte_openspace', chart: { x: 900, y: 240 },
    desc: 'Un immense plateau de bureaux à ciel ouvert. Machines à café, archives et réunions interminables.',
    palette: { grass: '#c7d3d9', path: '#9aa6ad', sand: '#e6e1d3', deep: '#2f6f9a', shallow: '#4f9ac0' },
    planned: {
      zones: ['Accueil', 'Salle de réunion « Brainstorm »', 'Archives poussiéreuses', 'Espace détente', 'Local imprimante'],
      content: ['Ordinateur à disquettes', 'Agrafeuse légendaire', 'Machine à café capricieuse', 'Dossier introuvable', 'Recette : café du lundi'],
      activities: ['Réparer l\'imprimante', 'Retrouver des documents', 'Énigmes logiques', 'Mini-jeux humoristiques'],
      characters: ['Gérard (stagiaire depuis 1997)', 'Mme Tableur', 'Le Chef (jamais vu)'],
    },
  },
};
