/* ARCHIPEL — missions
   Types d'objectifs :
   dig n | catch n (depuis l'acceptation) · identify n (espèces animales identifiées, total)
   deliver {res: n} (remis à la validation) · have item (posséder l'objet) · zone id · flag id */

G.D.missions = {
  m_carnet: {
    island: 'prehistorique', main: true, giver: 'ambre', title: 'Le carnet de la professeure', requires: [],
    offer: 'Ah, de la visite ! Professeure Ambre Lacroix, paléontologue. Ce site regorge de fossiles. Tenez, une truelle : fouillez l\'un des carrés marqués d\'une croix.',
    objectives: [{ type: 'dig', n: 1, label: 'Réaliser 1 fouille sur le site' }],
    waiting: 'Les carrés marqués d\'une croix, juste ici. Grattez doucement !',
    done: 'Magnifique ! Vous avez le coup de main. Ces trouvailles iront à merveille dans votre musée.',
    reward: { coins: 60, disc: 10 },
  },
  m_confiture: {
    island: 'prehistorique', main: true, giver: 'silex', title: 'Les confitures de Mamie Silex', requires: [],
    offer: 'Bienvenue à Pierre-Haute, mon petit ! Mes vieilles jambes ne vont plus cueillir. Tu me rapporterais 3 poignées de baies sauvages ?',
    objectives: [{ type: 'deliver', res: 'baies', n: 3, label: 'Apporter 3 baies sauvages' }],
    waiting: 'Les buissons de baies poussent un peu partout autour du village.',
    done: 'Merci ! Tiens, mon collier porte-bonheur… et ma recette secrète de smoothie pour ton bar.',
    reward: { coins: 40, item: 'collier_coquillages', recipe: 'smoothie' },
  },
  m_ugo: {
    island: 'prehistorique', main: true, giver: 'ugo', title: 'L\'atelier d\'Ugo', requires: [],
    offer: 'Je taille des outils depuis l\'aube, mais je n\'ai plus de pierres. Rapporte-m\'en 4 et je te donnerai mon plus beau biface.',
    objectives: [{ type: 'deliver', res: 'pierre', n: 4, label: 'Apporter 4 pierres' }],
    waiting: 'Des pierres, il y en a près du volcan, au nord du site de fouilles… et sur la plage.',
    done: 'Parfait. Voilà mon biface. Regarde la symétrie : cent essais pour en réussir un comme ça.',
    reward: { coins: 40, item: 'biface' },
  },
  m_torche: {
    island: 'prehistorique', main: true, giver: 'grom', title: 'Une torche pour Grom', requires: ['m_carnet'],
    offer: '…La Grotte aux Échos est trop sombre. Ma torche s\'est éteinte. Il me faudrait 3 morceaux de bois et 1 résine d\'ambre de la jungle.',
    objectives: [{ type: 'deliver', res: 'bois', n: 3, label: 'Apporter 3 bois' }, { type: 'deliver', res: 'resine', n: 1, label: 'Apporter 1 résine d\'ambre' }],
    waiting: 'La résine coule des grands arbres de la jungle, à l\'est.',
    done: 'Elle brûle bien ! La grotte est ouverte. Prends aussi cette vieille lampe, elle sera mieux dans ton musée.',
    reward: { coins: 30, item: 'lampe_graisse', flag: 'cave_open', disc: 10 },
  },
  m_fresques: {
    island: 'prehistorique', main: true, giver: 'lila', title: 'Les couleurs de la grotte', requires: ['m_torche'],
    offer: 'Une torche ! Enfin de la lumière. Je dois finir ma fresque mais il me manque de l\'ocre. Il y en a 3 filons dans cette grotte.',
    objectives: [{ type: 'deliver', res: 'ocre', n: 3, label: 'Apporter 3 ocres rouges' }],
    waiting: 'Cherche les roches rouges, dans les recoins de la grotte.',
    done: 'Regarde ! J\'ai peint une plaque rien que pour ton musée. Que mes mammouths voyagent !',
    reward: { item: 'peinture_rupestre', disc: 20, coins: 30 },
  },
  m_recensement: {
    island: 'prehistorique', main: true, giver: 'ambre', title: 'Recensement de la faune', requires: ['m_carnet'],
    offer: 'Pour mon rapport, j\'ai besoin d\'identifier au moins 3 espèces animales de l\'île. Approchez-les doucement, sans les effrayer.',
    objectives: [{ type: 'identify', n: 3, label: 'Identifier 3 espèces animales' }],
    waiting: 'La jungle à l\'est grouille de vie. Et j\'ai vu un glyptodon près du village.',
    done: 'Excellent travail de terrain ! Ce rapport va faire du bruit dans l\'archipel.',
    reward: { coins: 100, disc: 30, rep: 5 },
  },
  m_tiko: {
    island: 'prehistorique', main: true, giver: 'tiko', title: 'Le pari de Tiko', requires: [],
    offer: 'Hé ! Je parie que tu ne peux pas attraper 2 poissons avant moi ! La lagune, c\'est de l\'eau douce, et en mer, ça mord depuis le ponton.',
    objectives: [{ type: 'catch', n: 2, label: 'Pêcher 2 poissons' }],
    waiting: 'Attends que le bouchon plonge… et tape au bon moment !',
    done: 'Pas mal du tout ! Tiens, mon hameçon fétiche. Il porte chance… normalement.',
    reward: { coins: 50, item: 'hamecon_os' },
  },
  m_herbes: {
    island: 'prehistorique', main: false, giver: 'brindille', title: 'Les herbes de Brindille', requires: [],
    offer: 'Les herbes anciennes poussent près de l\'eau. Si tu m\'en rapportes 4, je t\'apprends à en faire un thé délicieux.',
    objectives: [{ type: 'deliver', res: 'herbes', n: 4, label: 'Apporter 4 herbes anciennes' }],
    waiting: 'Autour de la Lagune Bleue, et vers la grotte.',
    done: 'Merci ! Voici la recette du Thé des fougères. Tes clients vont adorer.',
    reward: { coins: 30, recipe: 'the_fougere', res: { herbes: 2 } },
  },
  m_volcan: {
    island: 'prehistorique', main: true, giver: 'basalte', title: 'Le géant du volcan', requires: ['m_recensement', 'm_torche'],
    offer: 'Hmpf. Un crâne géant affleure près du cratère. Fouille les deux sites du volcan, rassemble 3 fragments, restaure-le dans ton musée… et reviens me le montrer.',
    objectives: [{ type: 'have', item: 'crane_triceratops', label: 'Restaurer le crâne de tricératops (Gestion › Musée)' }],
    waiting: 'Les fragments sont au pied du volcan. La restauration se fait au musée, dans l\'atelier.',
    done: 'Hmpf… Il est magnifique. Tiens, cette vieille carte maritime. Elle mène à l\'Île des Araignées. Bon vent.',
    reward: { coins: 200, rep: 15, disc: 40, flag: 'carte_araignees' },
  },
};
