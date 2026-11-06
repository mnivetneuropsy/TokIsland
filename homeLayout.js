/* ARCHIPEL — plan de l'île principale (coordonnées monde, en pixels)
   Graphe de chemins utilisé par la simulation et par le rendu. */

G.D.home = {
  W: 1400, H: 1060,
  island: { cx: 700, cy: 520, rx: 610, ry: 405, seed: 42 },
  nodes: {
    port: { x: 700, y: 840 }, south: { x: 700, y: 720 }, plaza: { x: 700, y: 560 }, office: { x: 700, y: 420 },
    west: { x: 500, y: 560 }, museum: { x: 410, y: 440 }, aquarium: { x: 370, y: 700 },
    east: { x: 900, y: 560 }, zoo: { x: 950, y: 440 }, bar: { x: 1010, y: 690 },
  },
  edges: [['port', 'south'], ['south', 'plaza'], ['plaza', 'office'], ['plaza', 'west'], ['west', 'museum'], ['west', 'aquarium'],
    ['plaza', 'east'], ['east', 'zoo'], ['east', 'bar'], ['south', 'aquarium'], ['south', 'bar']],
  buildings: {
    museum:   { x: 410, y: 430, w: 220, h: 150, door: 'museum', label: 'Musée' },
    zoo:      { x: 1030, y: 430, w: 300, h: 230, door: 'zoo', label: 'Zoo', pen: { x0: 900, y0: 215, x1: 1170, y1: 410 } },
    aquarium: { x: 360, y: 690, w: 200, h: 140, door: 'aquarium', label: 'Aquarium' },
    bar:      { x: 1080, y: 680, w: 190, h: 130, door: 'bar', label: 'Bar-café' },
    office:   { x: 700, y: 410, w: 150, h: 130, door: 'office', label: 'Bureau' },
    port:     { x: 700, y: 880, w: 150, h: 120, door: 'port', label: 'Port' },
  },
  zooSpots: [{ x: 915, y: 432 }, { x: 1000, y: 438 }, { x: 1090, y: 438 }, { x: 1150, y: 432 }, { x: 890, y: 330 }],
  barSeats: [{ x: 940, y: 755 }, { x: 990, y: 778 }, { x: 1045, y: 768 }, { x: 1100, y: 782 }, { x: 1150, y: 760 }, { x: 1195, y: 740 }, { x: 905, y: 730 }, { x: 1210, y: 700 }],
  staffSpots: { museum: { x: 455, y: 452 }, zoo: { x: 985, y: 452 }, aquarium: { x: 415, y: 712 }, bar: { x: 1055, y: 702 } },
  homeSpots: { merou: { x: 640, y: 870 }, odile: { x: 740, y: 440 } },
  plaza: { x: 700, y: 560, r: 60 },
  spawn: { x: 700, y: 935 },
  boat: { dockX: 770, dockY: 945 },
  startDecor: [{ type: 'banc', x: 625, y: 615 }, { type: 'banc', x: 775, y: 615 }, { type: 'fleurs', x: 590, y: 505 }, { type: 'arbre', x: 545, y: 470 }, { type: 'arbre', x: 860, y: 470 }, { type: 'lampadaire', x: 650, y: 505 }],
};
