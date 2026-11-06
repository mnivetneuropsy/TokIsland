/* ARCHIPEL — objets de musée, ressources, restaurations, butins
   Pour ajouter un objet : une entrée dans G.D.items + une icône dans art.js (ou icon générique). */

G.D.categories = {
  fossiles:   { name: 'Fossiles', icon: '🦴' },
  historique: { name: 'Objets historiques', icon: '🏺' },
  art:        { name: "Œuvres d'art", icon: '🎨' },
  technologie:{ name: 'Technologies', icon: '⚙️' },
  curiosites: { name: 'Curiosités', icon: '🔮' },
  speciales:  { name: 'Collections spéciales', icon: '🏅' },
};

G.D.rarities = {
  commun:     { name: 'Commun', color: '#6f8f5f', mult: 1, stars: 1 },
  peu:        { name: 'Peu commun', color: '#3a86c8', mult: 1.4, stars: 2 },
  rare:       { name: 'Rare', color: '#a052c9', mult: 2, stars: 3 },
  legendaire: { name: 'Légendaire', color: '#d9921a', mult: 3, stars: 4 },
};

G.D.items = {
  ammonite:            { name: "Fossile d'ammonite", cat: 'fossiles', rarity: 'commun', value: 8, origin: 'prehistorique', desc: "Une coquille enroulée en spirale, pétrifiée depuis des millions d'années. Les visiteurs adorent compter les tours." },
  fougere_fossile:     { name: 'Fougère fossilisée', cat: 'fossiles', rarity: 'commun', value: 8, origin: 'prehistorique', desc: "L'empreinte délicate d'une fougère géante, imprimée dans une plaque de schiste." },
  empreinte_theropode: { name: 'Empreinte de théropode', cat: 'fossiles', rarity: 'peu', value: 14, origin: 'prehistorique', desc: 'Trois doigts griffus marqués dans la boue durcie. Quelqu\'un courait vite, ce jour-là.' },
  dent_smilodon:       { name: 'Dent de smilodon', cat: 'fossiles', rarity: 'peu', value: 14, origin: 'prehistorique', desc: "Une canine en forme de sabre, longue comme une main. Impressionnante, mais elle ne mord plus." },
  squelette_compso:    { name: 'Squelette de compsognathe', cat: 'fossiles', rarity: 'rare', value: 30, origin: 'prehistorique', restore: true, desc: 'Un petit squelette complet, reconstitué os par os. Il tiendrait dans une boîte à chaussures.' },
  crane_triceratops:   { name: 'Crâne de tricératops', cat: 'fossiles', rarity: 'legendaire', value: 60, origin: 'prehistorique', restore: true, desc: "La pièce maîtresse de l'île préhistorique : une collerette osseuse et trois cornes majestueuses." },
  biface:              { name: 'Biface en silex', cat: 'historique', rarity: 'commun', value: 10, origin: 'prehistorique', desc: "Un outil taillé des deux côtés, tranchant et symétrique. Ugo dit qu'il en faut cent pour en réussir un parfait." },
  propulseur:          { name: 'Propulseur sculpté', cat: 'historique', rarity: 'peu', value: 16, origin: 'prehistorique', desc: 'Un bâton gravé d\'un bouquetin, qui servait à lancer plus loin. Un objet utile et beau à la fois.' },
  aiguille_os:         { name: 'Aiguille en os', cat: 'technologie', rarity: 'commun', value: 9, origin: 'prehistorique', desc: "Fine, polie, percée d'un chas minuscule. Une révolution pour coudre des vêtements chauds." },
  lampe_graisse:       { name: 'Lampe à graisse en pierre', cat: 'technologie', rarity: 'peu', value: 15, origin: 'prehistorique', desc: 'Une coupelle de pierre où brûlait une mèche. La première lampe de poche… sans poche.' },
  hamecon_os:          { name: 'Hameçon en os', cat: 'technologie', rarity: 'peu', value: 12, origin: 'prehistorique', desc: 'Offert par Tiko. Il jure qu\'il a attrapé un cœlacanthe avec.' },
  peinture_rupestre:   { name: 'Peinture rupestre', cat: 'art', rarity: 'rare', value: 35, origin: 'prehistorique', desc: "Une plaque de roche ornée de mammouths à l'ocre rouge, peinte par Lila à la manière de ses ancêtres." },
  statuette_mammouth:  { name: 'Statuette de mammouth', cat: 'art', rarity: 'rare', value: 28, origin: 'prehistorique', desc: "Une figurine sculptée dans de l'ivoire, lisse d'avoir été tenue par tant de mains." },
  collier_coquillages: { name: 'Collier de coquillages', cat: 'art', rarity: 'commun', value: 10, origin: 'prehistorique', desc: 'Des coquillages percés et enfilés sur un lien de cuir. Cadeau de Mamie Silex.' },
  ambre_moustique:     { name: 'Ambre au moustique', cat: 'curiosites', rarity: 'rare', value: 30, origin: 'prehistorique', desc: "Une goutte de résine dorée qui a figé un moustique pour l'éternité. Non, on ne va pas le cloner." },
  oeuf_petrifie:       { name: 'Œuf de dinosaure pétrifié', cat: 'curiosites', rarity: 'peu', value: 18, origin: 'prehistorique', desc: 'Lourd comme une pierre, parce que c\'en est une. Il ne va pas éclore, promis.' },
  medaille_gazette:    { name: 'Médaille de la Gazette', cat: 'speciales', rarity: 'rare', value: 25, origin: 'archipel', desc: 'Décernée par La Gazette des Îles aux directeurs et directrices les plus actifs.' },
  maquette_bateau:     { name: 'Maquette du Bigorneau', cat: 'speciales', rarity: 'peu', value: 15, origin: 'archipel', desc: 'Une maquette du bateau du Capitaine Mérou, avec ses voiles rapiécées.' },
};

G.D.resources = {
  bois:       { name: 'Bois', desc: 'Branches et bûches ramassées sur les îles.' },
  pierre:     { name: 'Pierre', desc: 'Utile pour bâtir et aménager les enclos.' },
  baies:      { name: 'Baies sauvages', desc: 'Ingrédient du bar (galettes, smoothies).', ingredient: true },
  herbes:     { name: 'Herbes anciennes', desc: 'Ingrédient du bar (thé des fougères).', ingredient: true },
  ocre:       { name: 'Ocre rouge', desc: 'Pigment naturel trouvé dans la grotte.' },
  resine:     { name: "Résine d'ambre", desc: 'Résine collante, parfaite pour fabriquer une torche.' },
  frag_crane: { name: 'Fragment de crâne', desc: 'Morceau du grand crâne. Il en faut 3 pour une restauration.', fragment: true },
  petits_os:  { name: 'Petits os', desc: 'Os minuscules. Il en faut 3 pour reconstituer un squelette.', fragment: true },
};

/* Restauration : fragments -> objet de musée (mini-jeu puzzle) */
G.D.restorations = {
  crane_triceratops: { needs: { frag_crane: 3 } },
  squelette_compso:  { needs: { petits_os: 3 } },
};

/* Tables de butin des fouilles. kind: item | res ; size = nombre de cases occupées */
G.D.lootTables = {
  fouilles: [
    { kind: 'item', id: 'ammonite', w: 28, size: 2 },
    { kind: 'item', id: 'fougere_fossile', w: 22, size: 3 },
    { kind: 'res', id: 'petits_os', w: 26, size: 1 },
    { kind: 'res', id: 'pierre', w: 18, size: 1, n: 2 },
    { kind: 'item', id: 'biface', w: 8, size: 2 },
    { kind: 'item', id: 'propulseur', w: 5, size: 3 },
    { kind: 'item', id: 'ambre_moustique', w: 3, size: 1 },
  ],
  volcan: [
    { kind: 'res', id: 'frag_crane', w: 40, size: 2 },
    { kind: 'item', id: 'oeuf_petrifie', w: 10, size: 2 },
    { kind: 'item', id: 'dent_smilodon', w: 10, size: 2 },
    { kind: 'item', id: 'ammonite', w: 10, size: 2 },
    { kind: 'res', id: 'pierre', w: 18, size: 1, n: 2 },
    { kind: 'item', id: 'ambre_moustique', w: 5, size: 1 },
  ],
};
