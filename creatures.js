/* ARCHIPEL — animaux terrestres et créatures aquatiques
   art : paramètres de dessin utilisés par art.js (aucune image externe). */

G.D.biomes = {
  jungle:  { name: 'Jungle', ground: '#6fae4f', deco: '#3f7f3a' },
  plaine:  { name: 'Plaine herbeuse', ground: '#b7cf72', deco: '#8ea94e' },
  rocheux: { name: 'Rocheux volcanique', ground: '#a98f78', deco: '#6f5a4b' },
  falaise: { name: 'Falaise côtière', ground: '#9fc3c9', deco: '#6c8f97' },
};

G.D.habitatParams = {
  espace:         { name: 'Espace', icon: '📐', res: null },
  vegetation:     { name: 'Végétation', icon: '🌿', res: null },
  eau:            { name: 'Point d\'eau', icon: '💧', res: 'pierre' },
  abris:          { name: 'Abris', icon: '🛖', res: 'bois' },
  enrichissement: { name: 'Enrichissement', icon: '🧩', res: 'bois' },
};

G.D.animals = {
  compsognathe: {
    name: 'Compsognathe', origin: 'prehistorique', biome: 'jungle', diet: 'carnivore', size: 1, social: true, rarity: 'commun',
    needs: { espace: 1, vegetation: 2, eau: 1, abris: 1, enrichissement: 2 },
    behaviors: ['court en zigzag', 'chasse les insectes', 'dort serré contre ses congénères'],
    desc: 'Un minuscule dinosaure vif comme l\'éclair. Il adore la compagnie et les cachettes dans les fougères.',
    art: { shape: 'biped', body: '#7fb04a', belly: '#d9e8a6', accent: '#4c7a2a', s: 0.7 },
  },
  triceratops: {
    name: 'Tricératops nain', origin: 'prehistorique', biome: 'plaine', diet: 'herbivore', size: 2, social: true, rarity: 'peu',
    needs: { espace: 3, vegetation: 3, eau: 2, abris: 1, enrichissement: 1 },
    behaviors: ['broute paisiblement', 'frotte ses cornes contre les rochers', 'se roule dans la poussière'],
    desc: 'Une version de poche du célèbre dinosaure à trois cornes. Placide… tant qu\'on ne touche pas à sa salade.',
    art: { shape: 'quad', body: '#c98a4b', belly: '#ecc995', accent: '#8d5a2b', horns: true, frill: true, s: 1 },
  },
  pteranodon: {
    name: 'Ptéranodon', origin: 'prehistorique', biome: 'falaise', diet: 'carnivore', size: 2, social: false, rarity: 'peu',
    needs: { espace: 3, vegetation: 1, eau: 3, abris: 2, enrichissement: 2 },
    behaviors: ['plane au-dessus de l\'enclos', 'pêche dans le bassin', 'lisse ses ailes au soleil'],
    desc: 'Un reptile volant à la crête élégante. Il lui faut de la hauteur et beaucoup d\'eau.',
    art: { shape: 'flyer', body: '#9c7fb8', belly: '#e3d3ef', accent: '#e06f4f', s: 1 },
  },
  glyptodon: {
    name: 'Glyptodon', origin: 'prehistorique', biome: 'plaine', diet: 'herbivore', size: 2, social: false, rarity: 'commun',
    needs: { espace: 2, vegetation: 2, eau: 1, abris: 2, enrichissement: 1 },
    behaviors: ['se cache sous sa carapace', 'creuse le sol', 'fait la sieste au soleil'],
    desc: 'Un tatou géant à carapace bombée. Il a la sérénité d\'une table basse.',
    art: { shape: 'quad', body: '#8a6d4f', belly: '#c9ad85', accent: '#5f4733', shell: true, s: 0.95 },
  },
  dimetrodon: {
    name: 'Dimétrodon', origin: 'prehistorique', biome: 'rocheux', diet: 'carnivore', size: 2, social: false, rarity: 'peu',
    needs: { espace: 2, vegetation: 1, eau: 1, abris: 3, enrichissement: 2 },
    behaviors: ['chauffe sa voile au soleil', 'reste immobile des heures', 'bâille longuement'],
    desc: 'Plus ancien que les dinosaures ! Sa voile dorsale lui sert de radiateur.',
    art: { shape: 'quad', body: '#b4614a', belly: '#e2a48c', accent: '#f0c05a', sail: true, low: true, s: 0.95 },
  },
  mammouth: {
    name: 'Mammouth laineux juvénile', origin: 'prehistorique', biome: 'plaine', diet: 'herbivore', size: 3, social: true, rarity: 'rare',
    needs: { espace: 4, vegetation: 3, eau: 3, abris: 2, enrichissement: 3 },
    behaviors: ['joue avec une branche', 'barrit joyeusement', 'se secoue la toison'],
    desc: 'Un jeune mammouth tout en poils, curieux et câlin. Il grandit vite, prévoyez de l\'espace !',
    art: { shape: 'quad', body: '#7a4e2f', belly: '#a8774f', accent: '#f3ead6', tusks: true, fur: true, big: true, s: 1.2 },
  },
  smilodon: {
    name: 'Smilodon', origin: 'prehistorique', biome: 'jungle', diet: 'carnivore', size: 3, social: false, rarity: 'rare',
    needs: { espace: 4, vegetation: 3, eau: 2, abris: 3, enrichissement: 4 },
    behaviors: ['fait ses griffes sur un tronc', 'observe les visiteurs', 'ronronne (très fort)'],
    desc: 'Le tigre aux dents de sabre. Majestueux, solitaire et exigeant : il ne partage son enclos avec aucun herbivore.',
    art: { shape: 'quad', body: '#d79b4a', belly: '#f2d7a2', accent: '#7c4a1d', fangs: true, cat: true, s: 1.05 },
  },
};

G.D.waterEnvs = { douce: { name: 'Eau douce', color: '#5fb3a1' }, mer: { name: 'Eau de mer', color: '#3f8fc4' } };

G.D.fish = {
  poisson_poumon: { name: 'Poisson-poumon', origin: 'prehistorique', env: 'douce', temp: [18, 28], decor: 0, rarity: 'commun', size: 2,
    desc: 'Il respire l\'air quand l\'eau manque. Un survivant de génie.', art: { shape: 'eel', body: '#8a7a4f', fin: '#5d5233', s: 1 } },
  lepisoste: { name: 'Lépisosté', origin: 'prehistorique', env: 'douce', temp: [16, 26], decor: 1, rarity: 'peu', size: 2,
    desc: 'Le poisson-alligator : long museau, écailles en armure.', art: { shape: 'gar', body: '#6f8f6a', fin: '#3f5a3d', s: 1.1 } },
  ammonite_vivante: { name: 'Ammonite vivante', origin: 'prehistorique', env: 'mer', temp: [16, 24], decor: 0, rarity: 'commun', size: 1,
    desc: 'Elle se déplace en propulsion, coquille en avant. Elégante et un peu maladroite.', art: { shape: 'ammonite', body: '#e3b27a', fin: '#c46d4a', s: 0.9 } },
  trilobite: { name: 'Trilobite géant', origin: 'prehistorique', env: 'mer', temp: [10, 22], decor: 0, rarity: 'commun', size: 1,
    desc: 'Il arpente le fond du bassin comme un aspirateur à pattes.', art: { shape: 'trilobite', body: '#7d8aa3', fin: '#4f5a70', s: 0.9 } },
  coelacanthe: { name: 'Cœlacanthe', origin: 'prehistorique', env: 'mer', temp: [14, 20], decor: 1, rarity: 'rare', size: 3,
    desc: 'Un « fossile vivant » aux nageoires charnues. Il préfère l\'eau fraîche et les recoins sombres.', art: { shape: 'fish', body: '#3a5fa0', fin: '#2b4478', spots: '#d8e6f5', s: 1.3 } },
  dunkleosteus: { name: 'Dunkleosteus juvénile', origin: 'prehistorique', env: 'mer', temp: [18, 26], decor: 2, rarity: 'rare', size: 3, predator: true,
    desc: 'Tête cuirassée, mâchoires tranchantes. Ne le mettez pas avec les petites espèces !', art: { shape: 'armored', body: '#6d7276', fin: '#4a4e52', s: 1.35 } },
  anomalocaris: { name: 'Anomalocaris', origin: 'prehistorique', env: 'mer', temp: [20, 28], decor: 2, rarity: 'legendaire', size: 2,
    desc: 'Une créature ondulante venue du fond des âges, avec deux appendices recourbés. Hypnotique.', art: { shape: 'anomalo', body: '#d26b7c', fin: '#9c3f52', s: 1.1 } },
};

/* Tables de pêche par type de point d'eau */
G.D.fishTables = {
  lagune: [{ id: 'poisson_poumon', w: 60 }, { id: 'lepisoste', w: 40 }],
  mer: [{ id: 'ammonite_vivante', w: 34 }, { id: 'trilobite', w: 34 }, { id: 'coelacanthe', w: 15 }, { id: 'dunkleosteus', w: 11 }, { id: 'anomalocaris', w: 6 }],
};
