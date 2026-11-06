/* ARCHIPEL — bar-café : ingrédients, garnitures, recettes
   prep : pour (verser, maintenir appuyé) | bake (cuisson, timing) | blend (mixer, tapoter) */

G.D.ingredients = {
  cafe: { name: 'Café moulu', icon: '☕' }, eau: { name: 'Eau chaude', icon: '💧' }, lait: { name: 'Lait', icon: '🥛' },
  sucre: { name: 'Sirop de canne', icon: '🍯' }, citron: { name: 'Citron', icon: '🍋' }, glacons: { name: 'Glaçons', icon: '🧊' },
  farine: { name: 'Farine', icon: '🌾' }, oeuf: { name: 'Œuf', icon: '🥚' }, baies: { name: 'Baies sauvages', icon: '🫐', stock: 'baies' },
  herbes: { name: 'Herbes anciennes', icon: '🌿', stock: 'herbes' }, banane: { name: 'Banane', icon: '🍌' }, miel: { name: 'Miel', icon: '🐝' },
  chocolat: { name: 'Chocolat', icon: '🍫' }, eau_froide: { name: 'Eau fraîche', icon: '🚰' },
};

G.D.garnishes = {
  cannelle: 'Cannelle', chantilly: 'Chantilly', cacao: 'Cacao', menthe: 'Feuille de menthe', zeste: 'Zeste de citron',
  paille: 'Paille en bambou', sucre_glace: 'Sucre glace', filet_miel: 'Filet de miel', baies_top: 'Baies fraîches', graines: 'Graines grillées',
};

G.D.prepTypes = {
  pour:  { name: 'Verser', levels: ['Petit', 'Moyen', 'Grand'], targets: [0.42, 0.64, 0.86], hint: 'Maintenez « Verser » et relâchez sur la ligne.' },
  bake:  { name: 'Cuisson', levels: ['Moelleuse', 'Dorée', 'Croustillante'], targets: [0.38, 0.6, 0.82], hint: 'Sortez la galette quand l\'aiguille est dans la zone.' },
  blend: { name: 'Mixer', levels: ['Épais', 'Onctueux', 'Fluide'], targets: [0.4, 0.62, 0.84], hint: 'Tapotez « Mixer » pour atteindre la texture, puis « Stop ».' },
};

G.D.recipes = {
  cafe: {
    name: 'Café des Îles', type: 'hot', prep: 'pour', price: 12, baseCost: 3, cup: '#6b3e26', liquid: '#8a5532', start: true,
    ingredients: ['cafe', 'eau'], extras: ['lait', 'sucre', 'chocolat'], decoys: ['citron', 'glacons', 'farine', 'herbes'],
    garnishes: ['cannelle', 'chantilly', 'cacao'], desc: 'Un café corsé, servi bien chaud.',
  },
  limonade: {
    name: 'Limonade volcanique', type: 'cold', prep: 'pour', price: 11, baseCost: 3, cup: '#d9f0f7', liquid: '#f3dd6b', start: true,
    ingredients: ['citron', 'sucre', 'eau_froide'], extras: ['glacons', 'baies'], decoys: ['cafe', 'lait', 'farine', 'oeuf'],
    garnishes: ['menthe', 'zeste', 'paille'], desc: 'Pétillante et acidulée, avec une pointe de sirop.',
  },
  galette: {
    name: 'Galette aux baies', type: 'snack', prep: 'bake', price: 14, baseCost: 2, liquid: '#c98a46', start: true,
    ingredients: ['farine', 'oeuf', 'baies'], extras: ['miel', 'chocolat'], decoys: ['citron', 'cafe', 'glacons', 'eau'],
    garnishes: ['sucre_glace', 'filet_miel', 'baies_top'], stock: { baies: 1 }, desc: 'Une galette rustique garnie des baies de l\'île préhistorique.',
  },
  the_fougere: {
    name: 'Thé des fougères', type: 'hot', prep: 'pour', price: 13, baseCost: 2, cup: '#a5c08a', liquid: '#9cb35a',
    ingredients: ['herbes', 'eau'], extras: ['miel', 'citron'], decoys: ['cafe', 'lait', 'glacons', 'banane'],
    garnishes: ['zeste', 'filet_miel'], stock: { herbes: 1 }, desc: 'Infusion d\'herbes anciennes, recette de Brindille.',
  },
  smoothie: {
    name: 'Smoothie préhistorique', type: 'cold', prep: 'blend', price: 16, baseCost: 4, cup: '#f0d6e6', liquid: '#b5487a',
    ingredients: ['baies', 'banane', 'lait'], extras: ['miel', 'glacons'], decoys: ['cafe', 'eau', 'farine', 'herbes'],
    garnishes: ['graines', 'baies_top', 'paille'], stock: { baies: 1 }, desc: 'Baies, banane et lait mixés. Recette de Mamie Silex.',
  },
};
