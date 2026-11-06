/* ARCHIPEL — personnages, personnalités, affinités, événements de rencontre */

G.D.personalities = {
  curieux:     { name: 'Curieux·se', likes: { museum: 1.6, aquarium: 1.3, zoo: 1.1 }, lines: ['Tu savais que les ammonites avaient des cousins vivants ?', 'J\'ai une théorie… écoute bien.', 'Fascinant. Absolument fascinant.'] },
  bienveillant:{ name: 'Bienveillant·e', likes: { bar: 1.5, rest: 1.4 }, lines: ['Tu as bonne mine aujourd\'hui !', 'Viens, je t\'offre quelque chose de chaud.', 'Prends le temps, mon petit.'] },
  bricoleur:   { name: 'Bricoleur·se', likes: { museum: 1.4, bar: 1.1 }, lines: ['Il manque une cheville ici, non ?', 'Je pourrais réparer ça en deux minutes.', 'Regarde ce manche, quel travail !'] },
  reveur:      { name: 'Rêveur·se', likes: { aquarium: 1.6, rest: 1.3 }, lines: ['Les nuages ont la forme d\'un ptéranodon…', 'On dirait que les poissons dansent.', 'Je pourrais rester ici des heures.'] },
  timide:      { name: 'Timide', likes: { aquarium: 1.4, rest: 1.5 }, lines: ['…bonjour.', 'Il y a beaucoup de monde, hein ?', 'J\'aime bien cet endroit calme.'] },
  artiste:     { name: 'Artiste', likes: { museum: 1.7, zoo: 1.2 }, lines: ['Cette lumière ! Il me faut de l\'ocre.', 'Tout est une question de couleur.', 'Je vais dessiner ce tricératops.'] },
  energique:   { name: 'Énergique', likes: { zoo: 1.6, bar: 1.2 }, lines: ['On fait la course jusqu\'au port ?', 'J\'ai vu un poisson GRAND COMME ÇA !', 'Allez, on bouge !'] },
  grincheux:   { name: 'Grincheux·se', likes: { museum: 1.2, rest: 1.1 }, lines: ['Hmpf. Pas mal. Pour une fois.', 'Trop de bruit par ici.', 'De mon temps, les volcans étaient plus chauds.'] },
  bavard:      { name: 'Bavard·e', likes: { bar: 1.6, rest: 1.1 }, lines: ['Et là, tu ne devineras jamais…', 'Je t\'ai déjà raconté ma tempête de 98 ?', 'Ah, l\'archipel… quelle aventure !'] },
  organise:    { name: 'Organisé·e', likes: { museum: 1.3, bar: 1.1 }, lines: ['J\'ai noté ça dans mon carnet.', 'Tout est sous contrôle.', 'Réunion dans cinq minutes ? Non ? Dommage.'] },
};

/* Compatibilité entre personnalités (symétrique). Valeur ajoutée à l'affinité par discussion. */
G.D.compat = {
  'curieux|artiste': 3, 'curieux|bricoleur': 2, 'curieux|grincheux': 1, 'bienveillant|timide': 3, 'bienveillant|energique': 2,
  'bricoleur|artiste': 3, 'reveur|artiste': 2, 'reveur|timide': 2, 'energique|bavard': 2, 'grincheux|bavard': -1,
  'grincheux|energique': -1, 'organise|bavard': 1, 'organise|curieux': 2, 'timide|energique': 0, 'bavard|bienveillant': 2,
};

G.D.characters = {
  ambre: {
    name: 'Pr. Ambre Lacroix', origin: 'prehistorique', job: 'Paléontologue', personality: 'curieux', important: true,
    prefs: { drink: 'cafe', category: 'fossiles', building: 'museum' },
    look: { skin: '#f0c7a0', hair: '#7a4325', style: 'bun', top: '#d9a441', bottom: '#6d5a43', acc: 'glasses' },
    bio: 'Venue étudier les fossiles de l\'île, elle note tout dans un carnet couvert de poussière.',
    talk: ['Chaque caillou peut cacher un trésor. Il suffit de gratter un peu.', 'Votre musée a du potentiel. Beaucoup de potentiel.'],
  },
  silex: {
    name: 'Mamie Silex', origin: 'prehistorique', job: 'Doyenne du village', personality: 'bienveillant', important: true,
    prefs: { drink: 'the_fougere', category: 'art', building: 'bar' },
    look: { skin: '#c99068', hair: '#eeeeee', style: 'bun', top: '#b5533c', bottom: '#7a5b3a', acc: 'necklace' },
    bio: 'Elle connaît toutes les histoires de Pierre-Haute et toutes les recettes aux baies.',
    talk: ['Le village était bien calme avant ton arrivée. C\'est mieux maintenant.', 'Une bonne confiture, ça répare tout.'],
  },
  ugo: {
    name: 'Ugo le Tailleur', origin: 'prehistorique', job: 'Tailleur de pierre', personality: 'bricoleur', important: false,
    prefs: { drink: 'cafe', category: 'historique', building: 'museum' },
    look: { skin: '#a8714c', hair: '#3b2a1e', style: 'wild', top: '#8a6a3f', bottom: '#5a4630', acc: 'beard' },
    bio: 'Ses mains calleuses taillent le silex mieux que n\'importe quelle machine.',
    talk: ['Un bon outil, c\'est un outil qu\'on a envie de garder.', 'Tu as des pierres ? J\'ai toujours besoin de pierres.'],
  },
  brindille: {
    name: 'Brindille', origin: 'prehistorique', job: 'Cueilleuse', personality: 'reveur', important: false,
    prefs: { drink: 'smoothie', category: 'art', building: 'aquarium' },
    look: { skin: '#e2b48c', hair: '#2f6b3a', style: 'long', top: '#7fb36a', bottom: '#5d7a4a', acc: 'flower' },
    bio: 'Elle parle aux plantes et prétend qu\'elles répondent.',
    talk: ['Les herbes anciennes poussent près de l\'eau. Elles aiment l\'humidité, comme moi.', 'Tu entends ? La lagune chante.'],
  },
  grom: {
    name: 'Grom', origin: 'prehistorique', job: 'Gardien de la grotte', personality: 'timide', important: true,
    prefs: { drink: 'the_fougere', category: 'technologie', building: 'aquarium' },
    look: { skin: '#b07a55', hair: '#2a2a2a', style: 'short', top: '#5e6b7a', bottom: '#3e4652', acc: 'scarf' },
    bio: 'Grand, costaud et très timide. Il veille sur la Grotte aux Échos depuis l\'enfance.',
    talk: ['La grotte est sombre. Très sombre.', '…merci d\'être venu me parler.'],
  },
  lila: {
    name: 'Lila', origin: 'prehistorique', job: 'Peintre des parois', personality: 'artiste', important: true,
    prefs: { drink: 'limonade', category: 'art', building: 'museum' },
    look: { skin: '#d9a77f', hair: '#c4462c', style: 'long', top: '#e8d7b0', bottom: '#9c5a3c', acc: 'paint' },
    bio: 'Elle peint les animaux de l\'île sur les parois de la grotte, à la lueur des lampes.',
    talk: ['L\'ocre, c\'est la couleur de la terre qui se souvient.', 'Un jour, mes peintures voyageront.'],
  },
  tiko: {
    name: 'Tiko', origin: 'prehistorique', job: 'Jeune pêcheur', personality: 'energique', important: true,
    prefs: { drink: 'limonade', category: 'technologie', building: 'zoo' },
    look: { skin: '#9c6a46', hair: '#1f1a17', style: 'spiky', top: '#3e9ad6', bottom: '#2f5d7a', acc: 'headband' },
    bio: 'Il pêche depuis qu\'il sait marcher et raconte des histoires de poissons de plus en plus grands.',
    talk: ['La lagune, c\'est de l\'eau douce. La mer, c\'est salé. Facile !', 'Un jour j\'attraperai l\'Anomalocaris !'],
  },
  basalte: {
    name: 'Basalte', origin: 'prehistorique', job: 'Gardien du volcan', personality: 'grincheux', important: true,
    prefs: { drink: 'cafe', category: 'fossiles', building: 'museum' },
    look: { skin: '#8d5f45', hair: '#555555', style: 'bald', top: '#4a3b35', bottom: '#2f2724', acc: 'beard_grey' },
    bio: 'Il surveille le volcan depuis cinquante ans et se plaint de la chaleur depuis cinquante ans.',
    talk: ['Le volcan dort. Ne le réveille pas.', 'Hmpf. Encore un explorateur.'],
  },
  merou: {
    name: 'Capitaine Mérou', origin: 'archipel', job: 'Capitaine du Bigorneau', personality: 'bavard', important: false, home: true,
    prefs: { drink: 'cafe', category: 'speciales', building: 'bar' },
    look: { skin: '#e0a882', hair: '#f2f2f2', style: 'cap', top: '#2f4f7a', bottom: '#2a3550', acc: 'beard_white' },
    bio: 'Il fait la navette entre les îles et connaît chaque vague de l\'archipel.',
    talk: ['Embarquement immédiat, moussaillon !', 'Avec une carte maritime, je t\'emmène n\'importe où.'],
  },
  odile: {
    name: 'Odile', origin: 'archipel', job: 'Secrétaire de direction', personality: 'organise', important: false, home: true,
    prefs: { drink: 'the_fougere', category: 'historique', building: 'museum' },
    look: { skin: '#f3d2b5', hair: '#2b2b44', style: 'short', top: '#8c4f9e', bottom: '#3a3350', acc: 'glasses' },
    bio: 'Elle tient les comptes du bureau de direction et adore les tableaux bien rangés.',
    talk: ['J\'ai préparé les chiffres de la semaine.', 'Une campagne de pub ? Excellente idée.'],
  },
};

/* Événements de rencontre : se déclenchent une seule fois quand deux personnages
   discutent sur l'île principale avec une affinité suffisante. */
G.D.pairEvents = [
  { a: 'ugo', b: 'lila', minAff: 5, title: 'Un pinceau de silex', text: 'Ugo a taillé un manche de pinceau pour Lila. Émue, elle offre au musée un propulseur gravé.', reward: { item: 'propulseur' } },
  { a: 'ambre', b: 'basalte', minAff: 4, title: 'Conférence improvisée', text: 'Ambre et Basalte débattent du volcan devant une foule. Les visiteurs adorent !', reward: { rep: 6, disc: 15 } },
  { a: 'silex', b: 'brindille', minAff: 5, title: 'La recette de grand-mère', text: 'Mamie Silex transmet à Brindille son secret pour les baies. Elle vous en laisse un panier.', reward: { res: { baies: 6 } } },
  { a: 'tiko', b: 'merou', minAff: 4, title: 'Leçon de navigation', text: 'Le Capitaine Mérou apprend à Tiko à lire les étoiles. Tiko est aux anges.', reward: { coins: 120 } },
  { a: 'grom', b: 'silex', minAff: 5, title: 'Grom se confie', text: 'Grom raconte à Mamie Silex qu\'il aimerait voir l\'aquarium. Il se sent moins timide.', reward: { rep: 4 } },
  { a: 'odile', b: 'ambre', minAff: 4, title: 'Inventaire parfait', text: 'Odile aide Ambre à cataloguer les fossiles. Les fiches du musée sont impeccables.', reward: { disc: 20 } },
];

/* Visiteurs anonymes (touristes) : apparences aléatoires */
G.D.touristNames = ['Paulin', 'Rosa', 'Nina', 'Théo', 'Maëlle', 'Ilian', 'Jade', 'Sacha', 'Lou', 'Malo', 'Inès', 'Éloi', 'Zoé', 'Noah', 'Capucine', 'Yanis'];
G.D.touristPalette = {
  skin: ['#f3d2b5', '#e8b98f', '#c99068', '#a8714c', '#7d4f33', '#f0c7a0'],
  hair: ['#2b2118', '#6b3b1f', '#c9a15a', '#1a1a1a', '#a33b2a', '#8a8a8a'],
  top: ['#e76f51', '#2a9d8f', '#e9c46a', '#8ab17d', '#6d597a', '#3d7dd8', '#f4a261', '#d16ba5'],
  bottom: ['#264653', '#3d405b', '#5a4a3a', '#2f4858', '#6b705c'],
  style: ['short', 'long', 'bun', 'cap', 'spiky'],
};
