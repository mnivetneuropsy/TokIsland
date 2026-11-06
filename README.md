# Archipel — Le Grand Musée des Mondes (v0.1)

Jeu HTML5 / CSS / JavaScript de collection, d'exploration et de gestion. Aucun serveur, aucun compte, aucune dépendance externe (hors police Google Fonts facultative). Tous les graphismes sont dessinés en Canvas 2D.

## Lancer le jeu
- **Le plus simple** : double-cliquez sur `index.html` (Chrome, Edge, Firefox, Safari).
- **Recommandé pour développer** : un petit serveur local, par ex. `python -m http.server` dans le dossier, puis http://localhost:8000.

## Publier sur GitHub Pages
1. Créez un dépôt (ex. `archipel`) sur GitHub.
2. Envoyez tout le contenu du dossier à la racine du dépôt (bouton *Add file › Upload files*, en gardant les sous-dossiers `css/` et `js/`).
3. *Settings › Pages* → *Source : Deploy from a branch* → branche `main`, dossier `/ (root)` → *Save*.
4. Après une minute : `https://<votre-pseudo>.github.io/archipel/`.

La sauvegarde est propre à chaque navigateur/appareil : utilisez ⚙️ › Exporter / Importer pour la transférer.

## Structure
```
index.html              point d'entrée (ordre de chargement des scripts)
manifest.webmanifest    préparation PWA (icône : icon.svg)
css/style.css           interface
js/core/                util.js (outils, bus d'événements, A*), state.js (sauvegarde versionnée), game.js (économie, cycle, hors ligne)
js/data/                TOUT LE CONTENU : objets, créatures, personnages, recettes, bâtiments, plan de l'île, îles, missions, Gazette
js/systems/             musée, zoo, aquarium, bar, publicité, Gazette, personnages, missions, simulation des visiteurs
js/render/              art.js (dessins), life.js (animaux/poissons autonomes), homeView.js (île principale), exploreView.js (exploration)
js/ui/                  ui.js (HUD, panneaux, modales), screens.js (menus), minigames.js (fouille, pêche, approche, restauration, bar)
js/main.js              démarrage
```

## Ajouter du contenu
- **Objet de musée** : une entrée dans `js/data/items.js` (+ un dessin dans `G.Art.drawItem`, sinon icône « ? »), puis l'ajouter à une table de butin, une mission ou un objet caché.
- **Animal / poisson** : `js/data/creatures.js` (le paramètre `art` décrit son apparence), puis un point `animal` ou une table de pêche dans l'île.
- **Personnage** : `js/data/characters.js` (apparence `look`, personnalité, préférences), puis le placer dans `npcs` d'une île.
- **Mission** : `js/data/missions.js` (types : dig, catch, identify, deliver, have, zone, flag).
- **Île** : `js/data/islands.js` — passer `playable: true` et décrire `map` (forme, tampons, chemins, entités) comme l'île préhistorique.
- **Gazette** : ajouter des entrées dans les banques de `js/data/gazette.js` (champ `requires` pour lier à une île).
- **Sauvegarde** : en cas de changement de structure, incrémenter `G.SAVE_VERSION` et ajouter une fonction dans `migrations` (`state.js`). Les nouveaux champs simples sont complétés automatiquement.

## Ce qui est jouable dans cette version
Île principale vivante (visiteurs autonomes, bateau, discussions, affinités, événements de rencontre, jour/nuit), 6 bâtiments à 3 niveaux, décorations à placer, musée (3 salles, thèmes, cohérence, restauration puzzle, vente de doublons), zoo (habitats à 5 paramètres, biomes, compatibilité, nourrissage, bien-être), aquarium (type d'eau, température, qualité, décor, prédateurs), bar en 7 étapes (3 préparations interactives, carnet des habitués, personnel automatique, 6 améliorations), publicité mesurée, saisons, finances, personnel et résidents, Gazette hebdomadaire déterministe avec archives, île préhistorique explorable (7 zones, 9 missions, 10 personnages au total, 7 animaux, 7 espèces aquatiques, 18 objets, fouilles, pêche, approche, récolte, objets cachés, curiosités, passeport), carte maritime avec 4 îles verrouillées décrites.

## À développer ensuite
- Contenu jouable des îles 2 à 5 (seules leurs fiches et leur déverrouillage existent).
- Service worker pour l'installation PWA hors ligne (le manifeste est prêt).
- Sons et musique, personnalisation de l'avatar, déplacement des décorations, plus de recettes et d'événements.
- Île polaire : documenter les références aux cultures inuit avant intégration.
