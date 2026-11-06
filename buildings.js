/* ARCHIPEL — bâtiments, niveaux, améliorations, décorations, publicité, saisons */

G.D.buildings = {
  museum: {
    name: 'Musée', icon: '🏛️', ticket: 6, desc: 'Exposez vos découvertes. Des salles cohérentes ravissent les visiteurs.',
    levels: [
      { label: 'Petit musée', rooms: 1 },
      { label: 'Musée des Deux Galeries', rooms: 2, cost: 600, rep: 20, disc: 40 },
      { label: 'Grand Musée des Mondes', rooms: 3, cost: 1500, rep: 80, disc: 120 },
    ],
  },
  zoo: {
    name: 'Zoo', icon: '🦕', ticket: 7, desc: 'Accueillez les animaux dans des habitats adaptés à leurs besoins.',
    levels: [
      { label: 'Enclos modeste', habitats: 1 },
      { label: 'Parc animalier', habitats: 2, cost: 700, rep: 25, disc: 40 },
      { label: 'Grand zoo de l\'Archipel', habitats: 3, cost: 1600, rep: 90, disc: 120 },
    ],
  },
  aquarium: {
    name: 'Aquarium', icon: '🐠', ticket: 7, desc: 'Aménagez des bassins à la bonne température pour vos poissons.',
    levels: [
      { label: 'Petit bassin', tanks: 1, capacity: 4 },
      { label: 'Aquarium des Lagons', tanks: 2, capacity: 5, cost: 650, rep: 20, disc: 40 },
      { label: 'Grand Aquarium Abyssal', tanks: 3, capacity: 6, cost: 1500, rep: 80, disc: 120 },
    ],
  },
  bar: {
    name: 'Bar-café', icon: '☕', desc: 'Préparez boissons et collations pour vos visiteurs.',
    levels: [
      { label: 'Comptoir de plage', maxUpg: 1, tables: 3 },
      { label: 'Café-terrasse', maxUpg: 2, tables: 4, cost: 500, rep: 15 },
      { label: 'Grand Café de l\'Archipel', maxUpg: 3, tables: 5, cost: 1300, rep: 70 },
    ],
  },
  port: {
    name: 'Port', icon: '⚓', desc: 'Les visiteurs arrivent par le bateau. Plus de quais = plus de visiteurs simultanés.',
    levels: [
      { label: 'Ponton', cap: 7 },
      { label: 'Port de plaisance', cap: 10, cost: 400, rep: 10 },
      { label: 'Port de l\'Archipel', cap: 13, cost: 1000, rep: 50 },
    ],
  },
  office: {
    name: 'Bureau de direction', icon: '🏢', desc: 'Publicité, finances, personnel et résidents.',
    levels: [
      { label: 'Cabane du directeur', adSlots: 1, staff: 2 },
      { label: 'Bureau de direction', adSlots: 2, staff: 3, cost: 450, rep: 15 },
      { label: 'Hôtel de l\'Archipel', adSlots: 3, staff: 4, cost: 1100, rep: 60 },
    ],
  },
};

G.D.barUpgrades = {
  comptoir: { name: 'Comptoir', desc: 'Plus de temps avant la pénalité de rapidité (+6 s par niveau).', costs: [120, 320, 700] },
  machines: { name: 'Machines', desc: 'Le versement et la cuisson ralentissent : plus facile d\'être précis.', costs: [150, 380, 800] },
  tables:   { name: 'Tables', desc: '+1 place assise en terrasse par niveau (plus de clients).', costs: [100, 280, 650] },
  decor:    { name: 'Décoration', desc: '+5 % de satisfaction au bar par niveau.', costs: [90, 250, 600] },
  recettes: { name: 'Carte des recettes', desc: '+8 % sur le prix des boissons par niveau.', costs: [140, 360, 750] },
  personnel:{ name: 'Personnel', desc: 'Un employé au bar sert plus vite les clients en attente (nécessite un employé).', costs: [160, 400, 850] },
};

G.D.decorations = {
  arbre:      { name: 'Arbre fruitier', cost: 40, attract: 0.01, desc: 'De l\'ombre et des fruits.' },
  fleurs:     { name: 'Parterre de fleurs', cost: 25, attract: 0.008, desc: 'Coloré et parfumé.' },
  banc:       { name: 'Banc', cost: 30, attract: 0.006, seat: true, desc: 'Les visiteurs viennent s\'y reposer.' },
  lampadaire: { name: 'Lampadaire', cost: 35, attract: 0.006, desc: 'Éclaire l\'île la nuit.' },
  fontaine:   { name: 'Fontaine', cost: 160, attract: 0.03, seat: true, desc: 'Un point de rendez-vous apprécié.' },
  statue_dino:{ name: 'Statue de tricératops', cost: 220, attract: 0.04, needDisc: 60, desc: 'Le symbole de votre première expédition.' },
};

G.D.adCampaigns = {
  affiches: { name: 'Affiches au port', cost: 80, minutes: 15, boost: 0.3, desc: '+30 % de visiteurs vers la cible pendant 15 min.' },
  radio:    { name: 'Annonce radio des îles', cost: 220, minutes: 45, boost: 0.5, desc: '+50 % pendant 45 min.' },
  grande:   { name: 'Grande campagne', cost: 500, minutes: 120, boost: 0.7, rep: 5, desc: '+70 % pendant 2 h et +5 réputation.' },
};
G.D.adTargets = {
  recette:    { name: 'Une recette', building: 'bar' },
  exposition: { name: 'Une exposition', building: 'museum' },
  espece:     { name: 'Une espèce animale', building: 'zoo' },
  aquarium:   { name: 'Une nouveauté de l\'aquarium', building: 'aquarium' },
  evenement:  { name: 'Un événement spécial', building: 'all' },
};

G.D.seasons = {
  printemps: { name: 'Printemps', icon: '🌸', desc: 'Les animaux du zoo s\'éveillent : +20 % de visiteurs au zoo.', attract: { zoo: 1.2 }, drinks: { hot: 1, cold: 1.1, snack: 1.1 } },
  ete:       { name: 'Été', icon: '☀️', desc: 'Boissons fraîches très demandées, l\'aquarium rafraîchit (+15 %).', attract: { aquarium: 1.15, bar: 1.1 }, drinks: { hot: 0.5, cold: 2, snack: 1 } },
  automne:   { name: 'Automne', icon: '🍂', desc: 'Saison des musées (+15 %). Les boissons chaudes reviennent.', attract: { museum: 1.15 }, drinks: { hot: 1.4, cold: 0.8, snack: 1.2 } },
  hiver:     { name: 'Hiver', icon: '❄️', desc: 'Boissons chaudes très demandées. Les expositions polaires seront à l\'honneur (île à venir).', attract: { museum: 1.1 }, drinks: { hot: 2, cold: 0.5, snack: 1.1 } },
};
