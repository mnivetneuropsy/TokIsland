/* ARCHIPEL — La Gazette des Îles : banques d'événements (tirage déterministe par semaine)
   requires : île qui doit être débloquée pour que l'entrée soit proposée. */

G.D.gazette = {
  news: [
    { title: 'Le volcan de l\'Île Préhistorique pousse un soupir', text: 'Basalte, gardien du volcan, rassure la population : « Il ronfle, c\'est tout. » Les vendeurs de chapeaux anti-cendres sont déçus.' },
    { title: 'Record de pêche à la Lagune Bleue', text: 'Tiko affirme avoir sorti un poisson-poumon « plus long que la pirogue ». Aucun témoin ne confirme, mais tout le monde l\'applaudit.' },
    { title: 'Le Bigorneau repeint en bleu', text: 'Le Capitaine Mérou a offert un coup de peinture à son bateau. Il assure qu\'il va « au moins deux nœuds plus vite ».' },
    { title: 'Mystère au village de Pierre-Haute', text: 'Une galette aux baies a disparu de la fenêtre de Mamie Silex. Les soupçons se portent sur un compsognathe gourmand.' },
    { title: 'Les fresques de la Grotte aux Échos fascinent', text: 'Des visiteurs viennent de loin pour admirer les peintures. Lila prévoit déjà une nouvelle paroi.' },
    { title: 'Conférence sur les ammonites', text: 'La professeure Ambre Lacroix a tenu son auditoire en haleine pendant trois heures. Puis quatre. Puis cinq.' },
    { title: 'Brindille parle aux fougères', text: 'Interrogée, la cueilleuse affirme que les fougères géantes « ont beaucoup d\'humour ». Notre journaliste n\'a rien entendu.' },
    { title: 'Concours de sieste chez les glyptodons', text: 'Le jury a dû départager les candidats en mesurant la durée des ronflements. Résultat : égalité parfaite.' },
    { title: 'Brume étrange au sud-ouest', text: 'Des marins signalent des fils argentés flottant au-dessus de l\'eau près d\'une île sombre. Toiles géantes ?', requires: 'araignees' },
    { title: 'Bruits de tambours à l\'horizon', text: 'Des bannières colorées ont été aperçues au large. Une île de guerriers préparerait un grand tournoi.' },
    { title: 'Panne de machine à café… sur une île ?', text: 'Des messages en bouteille signés « Gérard, stagiaire » demandent de l\'aide pour une imprimante. Personne ne comprend.' },
    { title: 'Aurores au nord de l\'archipel', text: 'Des lumières vertes ont dansé dans le ciel toute la nuit. Les habitants de l\'archipel ont fait des vœux.' },
  ],
  trends: [
    { title: 'Folie des limonades', text: 'La Limonade volcanique est la boisson de la semaine.', effect: { recipe: 'limonade', demand: 1.8 } },
    { title: 'Le café a la cote', text: 'Les visiteurs réclament du Café des Îles à chaque table.', effect: { recipe: 'cafe', demand: 1.8 } },
    { title: 'Semaine des galettes', text: 'Les galettes aux baies s\'arrachent. Prévoyez des baies !', effect: { recipe: 'galette', demand: 1.8 } },
    { title: 'Ruée vers les fossiles', text: 'Les musées attirent 20 % de visiteurs en plus cette semaine.', effect: { attract: { museum: 1.2 } } },
    { title: 'Vive les animaux !', text: 'Les zoos de l\'archipel font le plein : +20 % de visiteurs.', effect: { attract: { zoo: 1.2 } } },
    { title: 'Plongée dans le bleu', text: 'L\'aquarium est à la mode : +20 % de visiteurs.', effect: { attract: { aquarium: 1.2 } } },
    { title: 'Tourisme en hausse', text: 'Le Bigorneau affiche complet : +15 % de visiteurs sur toute l\'île.', effect: { attract: { all: 1.15 } } },
    { title: 'Esprit d\'aventure', text: 'Les explorations rapportent 25 % de points de découverte en plus.', effect: { discovery: 1.25 } },
  ],
  missions: [
    { id: 'serve', title: 'Servir 8 commandes au bar', counter: 'served', n: 8, reward: { coins: 120 } },
    { id: 'perfect', title: 'Réussir 3 commandes parfaites (90 % et plus)', counter: 'perfect', n: 3, reward: { coins: 150, rep: 3 } },
    { id: 'visitors', title: 'Accueillir 40 visiteurs', counter: 'visitors', n: 40, reward: { coins: 140 } },
    { id: 'fish', title: 'Pêcher 4 poissons', counter: 'fish', n: 4, reward: { coins: 110, disc: 10 } },
    { id: 'dig', title: 'Réaliser 4 fouilles', counter: 'dig', n: 4, reward: { coins: 110, disc: 10 } },
    { id: 'feed', title: 'Nourrir les animaux 5 fois', counter: 'feed', n: 5, reward: { coins: 100, rep: 2 } },
    { id: 'harvest', title: 'Récolter 12 ressources en exploration', counter: 'harvest', n: 12, reward: { coins: 100, res: { baies: 3, herbes: 3 } } },
    { id: 'ads', title: 'Lancer 1 campagne publicitaire', counter: 'ads', n: 1, reward: { coins: 90, rep: 2 } },
  ],
  gifts: [
    { text: 'Un panier de baies offert par le village', reward: { res: { baies: 5 } } },
    { text: 'Une bourse de pièces de l\'Office du tourisme', reward: { coins: 80 } },
    { text: 'Un fagot de bois flotté', reward: { res: { bois: 4 } } },
    { text: 'Une poignée d\'herbes anciennes', reward: { res: { herbes: 4 } } },
    { text: 'La Médaille de la Gazette', reward: { item: 'medaille_gazette' } },
    { text: 'Un fragment mystérieux', reward: { res: { petits_os: 1 } } },
    { text: 'Une maquette du Bigorneau', reward: { item: 'maquette_bateau' } },
    { text: 'Un sac de pierres taillées', reward: { res: { pierre: 4 } } },
  ],
};
